'use strict';

// ─── BOT NAVIGATION / LOCOMOTION OWNER ─────────────────────────────────────
// Patrol points, collision-aware steering, smoke route cost and anti-teleport
// movement caps live here. Threat perception (grenades/mines/noise) stays in
// entities/bots.js. Engine/combat globals are invocation-time dependencies.

const WPTS=[
  [0,0],[-20,20],[20,-20],[-20,-20],[20,20],
  [-40,5],[40,-5],[-5,-40],[5,40],[-30,-30],[30,30],[-30,30],[30,-30],
  [50,10],[-50,-10],[10,50],[-10,-50],
  [0,-55],[0,55],[-55,0],[55,0],
  [40,40],[-40,-40],[40,-40],[-40,40],
  [-65,25],[65,-25],[-25,65],[25,-65],
  [-75,0],[75,0],[0,-75],[0,75],
];

function steerBotAroundWalls(bot,mx,mz){
  const speed=Math.hypot(mx,mz);
  if(speed<.15)return{x:mx,z:mz};
  const pos=bot.group.position,nx=mx/speed,nz=mz/speed;
  const look=1.35+Math.min(2.45,speed*.24);
  const probe=(ang)=>{
    const ca=Math.cos(ang),sa=Math.sin(ang);
    const rx=nx*ca-nz*sa,rz=nx*sa+nz*ca;
    const wantX=pos.x+rx*look,wantZ=pos.z+rz*look;
    const coll=collideWalls(wantX,wantZ,BOT_R);
    const progress=Math.min(1,Math.hypot(coll.x-pos.x,coll.z-pos.z)/look);
    return{rx,rz,progress,ang,score:progress-Math.abs(ang)*.055};
  };
  const straight=probe(0);
  if(straight.progress>.94)return{x:mx,z:mz};
  const sign=bot.sideBias||bot.strafeDir||1;
  let best=straight;
  for(const ang of [sign*.42,-sign*.42,sign*.78,-sign*.78,sign*1.12,-sign*1.12]){
    const p=probe(ang);
    p.score+=(Math.sign(ang)===Math.sign(sign))?.025:0;
    if(p.score>best.score)best=p;
  }
  if(best.ang!==0&&best.progress>straight.progress+.04)bot.sideBias=Math.sign(best.ang)||bot.sideBias;
  return{x:best.rx*speed,z:best.rz*speed};
}
const BOT_MOVE_CFG={normalMaxM:1.18,retreatMaxM:1.30,mineMaxM:1.38,dodgeMaxM:1.48,maxAccelM:4.4,urgentAccelM:6.2,substep:.16};
function clampBotVelocity(vx,vz,maxSpeed){
  const s=Math.hypot(vx,vz);
  if(s<=maxSpeed||s<.0001)return{x:vx,z:vz};
  const m=maxSpeed/s;return{x:vx*m,z:vz*m};
}
function smokeRoutePenalty(from,to,team){
  let penalty=0;
  const ax=from.x,az=from.z,bx=to.x,bz=to.z,dx=bx-ax,dz=bz-az,len2=dx*dx+dz*dz;
  for(const cloud of smokeClouds){
    if(cloud.life<=0||cloud.density<.16)continue;
    if(cloud.team===team)continue;
    const t=len2>.001?Math.max(0,Math.min(1,((cloud.center.x-ax)*dx+(cloud.center.z-az)*dz)/len2)):0;
    const cx=ax+dx*t,cz=az+dz*t,dist=Math.hypot(cx-cloud.center.x,cz-cloud.center.z);
    const effective=cloud.radius*(.82+.18*cloud.density);
    if(dist<effective)penalty+=3.2+(1-dist/effective)*5.8;
  }
  return penalty;
}
function botRoutePenalty(from,to,team=null){
  const a=from.clone();a.y=.55;
  const b=to.clone();b.y=.55;
  let smokePenalty=team?smokeRoutePenalty(a,b,team):0;
  if(!wallBetween(a,b,wallMeshes))return smokePenalty;
  const dx=b.x-a.x,dz=b.z-a.z,dist=Math.max(.001,Math.hypot(dx,dz));
  const px=-dz/dist,pz=dx/dist,offset=Math.max(3.8,Math.min(7.2,dist*.24));
  let best=10.5+smokePenalty;
  for(const sign of [1,-1]){
    const mx=(a.x+b.x)*.5+px*offset*sign,mz=(a.z+b.z)*.5+pz*offset*sign;
    const coll=collideWalls(mx,mz,BOT_R);
    if(Math.hypot(coll.x-mx,coll.z-mz)>.75)continue;
    const relay=new THREE.Vector3(coll.x,.55,coll.z);
    if(!wallBetween(a,relay,wallMeshes)&&!wallBetween(relay,b,wallMeshes)){
      best=Math.min(best,2.5+offset*.06+(team?smokeRoutePenalty(a,relay,team)+smokeRoutePenalty(relay,b,team):0));
    }
  }
  return best;
}
function steerBotAroundSmoke(bot,mx,mz){
  const speed=Math.hypot(mx,mz);if(speed<.05)return{x:mx,z:mz};
  const nx=mx/speed,nz=mz/speed;
  let addX=0,addZ=0;
  for(const cloud of smokeClouds){
    if(cloud.life<=0||cloud.density<.20||cloud.team===bot.team)continue;
    const aheadX=bot.group.position.x+nx*5.2,aheadZ=bot.group.position.z+nz*5.2;
    const sx=aheadX-cloud.center.x,sz=aheadZ-cloud.center.z,sd=Math.hypot(sx,sz);
    const effective=cloud.radius*(.78+.16*cloud.density);
    if(sd>=effective)continue;
    const side=(nx*(cloud.center.z-bot.group.position.z)-nz*(cloud.center.x-bot.group.position.x))>=0?-1:1;
    addX+=-nz*side*speed*.48;addZ+=nx*side*speed*.48;
    bot.sideBias=side;
  }
  return{x:mx+addX,z:mz+addZ};
}

function moveBotWithSubsteps(startX,startZ,vx,vz,dt){
  const dx=vx*dt,dz=vz*dt,total=Math.hypot(dx,dz);
  const steps=Math.max(1,Math.ceil(total/BOT_MOVE_CFG.substep));
  const sx=dx/steps,sz=dz/steps;
  let x=startX,z=startZ;
  for(let i=0;i<steps;i++){
    const wantX=Math.max(-93,Math.min(93,x+sx));
    const wantZ=Math.max(-93,Math.min(93,z+sz));
    const coll=collideWalls(wantX,wantZ,BOT_R);
    const jump=Math.hypot(coll.x-x,coll.z-z);
    const intended=Math.max(.001,Math.hypot(sx,sz));
    const correctionCap=intended*1.35+.035;
    if(jump>correctionCap){
      const m=correctionCap/jump;
      x+=(coll.x-x)*m;z+=(coll.z-z)*m;
    }else{x=coll.x;z=coll.z;}
  }
  const actual=Math.hypot(x-startX,z-startZ);
  const hardCap=total*1.10+.035;
  if(actual>hardCap&&actual>.0001){
    const m=hardCap/actual;
    x=startX+(x-startX)*m;z=startZ+(z-startZ)*m;
  }
  return{x,z};
}
