'use strict';

// ─── ENEMY / ALLY BOT AI ────────────────
// ═══════════════════════════════════════════

const ETYPES=[
  {skin:0xdda87c,cloth:0x8a8070,arm:0x778866,spd:3.8, hp:120,  sRange:0,  sCD:3.5,dmg:0,   acc:.055},
  {skin:0xdda87c,cloth:0x882222,arm:0x553322,spd:3.15,hp:155, sRange:38, sCD:2.2,dmg:30,  acc:.045},
  {skin:0xaacc88,cloth:0x226622,arm:0x115520,spd:4.8, hp:135, sRange:30, sCD:1.8,dmg:22,  acc:.058},
  {skin:0xcc8844,cloth:0x881100,arm:0xaa2211,spd:2.15,hp:300, sRange:50, sCD:2.5,dmg:50,  acc:.035},
  {skin:0xcc88ee,cloth:0x6622aa,arm:0x4411cc,spd:3.45,hp:210, sRange:45, sCD:2.0,dmg:35,  acc:.040},
  {skin:0xddaa88,cloth:0x442211,arm:0x221100,spd:4.0, hp:175, sRange:35, sCD:1.6,dmg:28,  acc:.050},
];

const enemies=[];
let allyKills=0,enemyKills=0;
let allyControlScore=0,enemyControlScore=0;

function lvlHpMult(){ return 1 + level * 0.06; }
function lvlDmgMult(){ return 1 + level * 0.06; }
function lvlSpdMult(){ return 1 + level * 0.02; }


function mkHuman(et,team){
  const g=new THREE.Group();const pts=[];
  const ally=team==='ally';
  const clothCol=ally?0x185fba:0x7b1f2d;
  const armCol=ally?0x44a8ff:0xc4384d;
  const suitDark=ally?0x07192c:0x2d0a12;
  const glowCol=ally?0x44d8ff:0xff3659;

  // Gameplay hit meshes. Their order is intentionally unchanged.
  const A=(geo,col,x,y,z,rx=0,ry=0,rz=0)=>{
    const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:col,roughness:.62,metalness:.10}));
    m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;g.add(m);pts.push(m);return m;
  };
  A(new THREE.SphereGeometry(.22,8,6),et.skin,0,1.82,0);
  const helm=new THREE.Mesh(
    new THREE.SphereGeometry(.245,8,5,0,Math.PI*2,0,Math.PI/2),
    new THREE.MeshStandardMaterial({color:armCol,roughness:.30,metalness:.62})
  );
  helm.position.set(0,1.88,0);helm.castShadow=true;g.add(helm);pts.push(helm);
  A(new THREE.BoxGeometry(.52,.70,.28),clothCol,0,1.25,0);
  A(new THREE.BoxGeometry(.44,.22,.24),clothCol,0,.88,0);
  A(new THREE.BoxGeometry(.14,.52,.14),clothCol,-.35,1.22,0,0,0,.18);
  A(new THREE.BoxGeometry(.14,.52,.14),clothCol,.35,1.22,0,0,0,-.18);
  A(new THREE.BoxGeometry(.11,.42,.11),et.skin,-.36,.88,0);
  A(new THREE.BoxGeometry(.11,.42,.11),et.skin,.36,.88,0);
  A(new THREE.BoxGeometry(.18,.54,.20),clothCol,-.15,.52,0);
  A(new THREE.BoxGeometry(.18,.54,.20),clothCol,.15,.52,0);
  A(new THREE.BoxGeometry(.14,.50,.16),0x22262d,-.15,.14,0);
  A(new THREE.BoxGeometry(.14,.50,.16),0x22262d,.15,.14,0);
  A(new THREE.BoxGeometry(.15,.10,.26),0x0d1116,-.15,-.05,.05);
  A(new THREE.BoxGeometry(.15,.10,.26),0x0d1116,.15,-.05,.05);

  // Decorative armor is excluded from pts[] so gameplay hitboxes do not change.
  const armorMat=new THREE.MeshStandardMaterial({color:armCol,roughness:.26,metalness:.72});
  const darkMat=new THREE.MeshStandardMaterial({color:suitDark,roughness:.48,metalness:.42});
  const glowMat=new THREE.MeshStandardMaterial({color:glowCol,roughness:.18,metalness:.48,emissive:glowCol,emissiveIntensity:.88});
  const V=(geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{
    const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=!MOBILE_LOW;g.add(m);return m;
  };

  V(new THREE.BoxGeometry(.30,.085,.26),glowMat,0,1.875,-.18,.04);
  V(new THREE.BoxGeometry(.28,.085,.08),darkMat,0,1.73,-.205,-.16);
  V(new THREE.BoxGeometry(.08,.18,.10),armorMat,-.245,1.84,-.02,0,0,.18);
  V(new THREE.BoxGeometry(.08,.18,.10),armorMat,.245,1.84,-.02,0,0,-.18);
  V(new THREE.BoxGeometry(.46,.38,.075),armorMat,0,1.33,-.178,-.03);
  V(new THREE.BoxGeometry(.25,.09,.12),darkMat,0,1.57,-.11);
  V(new THREE.BoxGeometry(.21,.14,.32),armorMat,-.36,1.43,0,0,0,.20);
  V(new THREE.BoxGeometry(.21,.14,.32),armorMat,.36,1.43,0,0,0,-.20);
  V(new THREE.BoxGeometry(.34,.09,.08),glowMat,0,1.13,-.19);
  V(new THREE.BoxGeometry(.35,.42,.15),darkMat,0,1.27,.20);
  V(new THREE.BoxGeometry(.48,.10,.30),darkMat,0,.89,0);
  V(new THREE.BoxGeometry(.18,.16,.23),armorMat,-.15,.44,-.06,.05);
  V(new THREE.BoxGeometry(.18,.16,.23),armorMat,.15,.44,-.06,.05);
  V(new THREE.BoxGeometry(.15,.10,.27),armorMat,-.15,.10,-.02);
  V(new THREE.BoxGeometry(.15,.10,.27),armorMat,.15,.10,-.02);

  // Extra readability: visor, guards, antenna and a rear team armor mark.
  V(new THREE.BoxGeometry(.30,.065,.035),glowMat,0,1.84,-.235,.02);
  V(new THREE.BoxGeometry(.11,.20,.16),darkMat,-.365,1.03,-.02,0,0,.12);
  V(new THREE.BoxGeometry(.11,.20,.16),darkMat,.365,1.03,-.02,0,0,-.12);
  V(new THREE.BoxGeometry(.055,.24,.055),armorMat,.18,2.055,.02,0,0,-.10);
  V(new THREE.SphereGeometry(.04,7,5),glowMat,.19,2.175,.01);

  // Real body hands. These are moved by the two-bone weapon-hold solver,
  // so the weapon is held by the bot instead of carrying fake hands with it.
  const gloveMat=new THREE.MeshStandardMaterial({color:0x0b1118,roughness:.78,metalness:.14});
  const cuffMat=new THREE.MeshStandardMaterial({color:armCol,roughness:.32,metalness:.58,emissive:armCol,emissiveIntensity:.10});
  const makeRigHand=(x,y,z)=>{
    const hand=new THREE.Mesh(new THREE.BoxGeometry(.14,.15,.17),gloveMat);
    hand.position.set(x,y,z);hand.castShadow=!MOBILE_LOW;
    const cuff=new THREE.Mesh(new THREE.BoxGeometry(.16,.075,.15),cuffMat);
    cuff.position.set(0,.095,.025);hand.add(cuff);g.add(hand);return hand;
  };
  const leftHand=makeRigHand(-.36,.66,-.02);
  const rightHand=makeRigHand(.36,.66,-.02);

  const ringCol=ally?0x35c8ff:0xff2748;
  const insigniaMat=new THREE.MeshBasicMaterial({color:ringCol,side:THREE.DoubleSide});
  const insigniaDark=new THREE.MeshStandardMaterial({color:0x101820,roughness:.42,metalness:.62,emissive:ringCol,emissiveIntensity:.10});
  const addInsignia=(z,flip=0)=>{
    const plate=new THREE.Mesh(new THREE.BoxGeometry(.25,.25,.025),insigniaDark);
    plate.position.set(0,1.34,z);plate.rotation.y=flip;g.add(plate);
    const chevron=new THREE.Mesh(new THREE.RingGeometry(.065,.105,4,1,Math.PI/4,Math.PI*2),insigniaMat);
    chevron.position.set(0,0,.016);plate.add(chevron);
    const core=new THREE.Mesh(new THREE.BoxGeometry(.035,.13,.014),insigniaMat);
    core.position.set(0,-.018,.018);plate.add(core);
  };
  addInsignia(.281,Math.PI);addInsignia(-.219,0);

  const ringOpacity=.96;
  const ring=new THREE.Mesh(
    new THREE.TorusGeometry(.40,.045,5,16),
    new THREE.MeshBasicMaterial({color:ringCol,transparent:true,opacity:ringOpacity})
  );
  ring.rotation.x=Math.PI/2;ring.position.y=.02;g.add(ring);

  const weaponPivot=new THREE.Group();
  weaponPivot.position.set(.39,1.23,-.07);
  weaponPivot.rotation.set(.05,.07,-.35);
  g.add(weaponPivot);
  const armRig={
    leftUpper:pts[4],rightUpper:pts[5],
    leftFore:pts[6],rightFore:pts[7],
    leftHand,rightHand
  };
  return{g,pts,weaponPivot,armRig};
}

const _BOT_ARM_UP=new THREE.Vector3(0,1,0);
const _BOT_ARM_DIR=new THREE.Vector3();
const _BOT_ARM_BEND=new THREE.Vector3();
const _BOT_ARM_ELBOW=new THREE.Vector3();
const _BOT_ARM_MID=new THREE.Vector3();
const _BOT_GRIP_R=new THREE.Vector3();
const _BOT_GRIP_L=new THREE.Vector3();
const _BOT_SHOULDER_R=new THREE.Vector3(.35,1.49,-.015);
const _BOT_SHOULDER_L=new THREE.Vector3(-.35,1.49,-.015);
function setBotLimbBetween(mesh,a,b,baseLength){
  if(!mesh)return;
  _BOT_ARM_DIR.subVectors(b,a);
  const len=Math.max(.04,_BOT_ARM_DIR.length());
  _BOT_ARM_DIR.multiplyScalar(1/len);
  mesh.position.copy(_BOT_ARM_MID.addVectors(a,b).multiplyScalar(.5));
  mesh.quaternion.setFromUnitVectors(_BOT_ARM_UP,_BOT_ARM_DIR);
  mesh.scale.set(1,Math.max(.70,Math.min(1.32,len/baseLength)),1);
}
function solveBotTwoBoneArm(upper,fore,hand,shoulder,target,side,weaponQuat,bendHint){
  const upperLen=.50,foreLen=.43;
  _BOT_ARM_DIR.subVectors(target,shoulder);
  const rawDist=Math.max(.001,_BOT_ARM_DIR.length());
  _BOT_ARM_DIR.multiplyScalar(1/rawDist);
  const dist=Math.max(Math.abs(upperLen-foreLen)+.035,Math.min(rawDist,upperLen+foreLen-.025));
  const along=(upperLen*upperLen-foreLen*foreLen+dist*dist)/(2*dist);
  const bend=Math.sqrt(Math.max(0,upperLen*upperLen-along*along));
  if(bendHint)_BOT_ARM_BEND.set(...bendHint);else _BOT_ARM_BEND.set(side*.72,-.54,.22);
  _BOT_ARM_BEND.addScaledVector(_BOT_ARM_DIR,-_BOT_ARM_BEND.dot(_BOT_ARM_DIR));
  if(_BOT_ARM_BEND.lengthSq()<.001)_BOT_ARM_BEND.set(side,-.5,.2);
  _BOT_ARM_BEND.normalize();
  _BOT_ARM_ELBOW.copy(shoulder).addScaledVector(_BOT_ARM_DIR,along).addScaledVector(_BOT_ARM_BEND,bend);
  setBotLimbBetween(upper,shoulder,_BOT_ARM_ELBOW,.52);
  setBotLimbBetween(fore,_BOT_ARM_ELBOW,target,.42);
  if(hand){
    hand.position.copy(target);
    hand.quaternion.copy(weaponQuat);
  }
}
function updateBotWeaponHands(bot){
  const rig=bot.armRig,pose=bot.weaponPivot?.userData.pose,mesh=bot.weaponMesh;
  if(!rig||!pose||!mesh||!pose.gripR||!pose.gripL)return false;
  bot.group.updateMatrixWorld(true);
  mesh.updateMatrixWorld(true);
  _BOT_GRIP_R.set(...pose.gripR);
  mesh.localToWorld(_BOT_GRIP_R);bot.group.worldToLocal(_BOT_GRIP_R);
  _BOT_GRIP_L.set(...pose.gripL);
  mesh.localToWorld(_BOT_GRIP_L);bot.group.worldToLocal(_BOT_GRIP_L);
  solveBotTwoBoneArm(rig.rightUpper,rig.rightFore,rig.rightHand,_BOT_SHOULDER_R,_BOT_GRIP_R,1,bot.weaponPivot.quaternion,pose.elbowR);
  solveBotTwoBoneArm(rig.leftUpper,rig.leftFore,rig.leftHand,_BOT_SHOULDER_L,_BOT_GRIP_L,-1,bot.weaponPivot.quaternion,pose.elbowL);
  return true;
}
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
function nearestHostileGrenade(bot,maxDist=10){
  let best=null,bestScore=Infinity;
  for(const g of botGrenades){
    if(!g?.m||g.team===bot.team||g.fuse<=0)continue;
    const d=bot.group.position.distanceTo(g.m.position);
    if(d>maxDist)continue;
    const score=d+Math.max(0,g.fuse-.75)*3.2;
    if(score<bestScore){bestScore=score;best={grenade:g,distance:d};}
  }
  return best;
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

const BOT_NOISE_EVENTS=[];
let botLastPlayerShotSequence=0;
function botWeaponNoiseRadius(w){
  if(!w)return 30;
  if(w.isRocket)return 62;
  if(w.isSniper)return 72;
  if(w.key==='shotgun')return 48;
  if(w.key==='rifle')return 46;
  if(w.key==='plasma')return 39;
  return 32;
}
function botSourceTeam(source){return source==='player'?'ally':(source?.team||null);}
function emitBotCombatNoise(pos,source,w,kind='shot'){
  BOT_NOISE_EVENTS.push({pos:pos.clone(),source,kind,time:performance.now(),radius:botWeaponNoiseRadius(w),strength:w?.isRocket?1.28:w?.isSniper?1.18:w?.key==='shotgun'?1.08:1});
  if(BOT_NOISE_EVENTS.length>36)BOT_NOISE_EVENTS.splice(0,BOT_NOISE_EVENTS.length-36);
}
function syncPlayerCombatNoise(){
  if(shotSequence===0){botLastPlayerShotSequence=0;return;}
  if(shotResetT>0&&shotSequence!==botLastPlayerShotSequence){
    emitBotCombatNoise(camera.position,'player',getW(),'shot');
    botLastPlayerShotSequence=shotSequence;
  }
}
const _BOT_NEAR_MISS_TO_PLAYER=new THREE.Vector3(),_BOT_NEAR_MISS_POINT=new THREE.Vector3();
function botShotClosestApproachToPlayer(from,dir,maxRange=120){
  const torso=_BOT_NEAR_MISS_TO_PLAYER.set(camera.position.x,camera.position.y-.28,camera.position.z);
  const rel=torso.clone().sub(from);
  const along=Math.max(0,Math.min(maxRange,rel.dot(dir)));
  if(along<1.2)return null;
  _BOT_NEAR_MISS_POINT.copy(from).addScaledVector(dir,along);
  if(wallBetween(from,_BOT_NEAR_MISS_POINT,wallMeshes))return null;
  const distance=_BOT_NEAR_MISS_POINT.distanceTo(torso);
  return{distance,along,point:_BOT_NEAR_MISS_POINT.clone()};
}

const BOT_MAP_ZONES=[
  {id:'mid',label:'ЦЕНТР',x:0,z:0,r:21,weight:1.34},
  {id:'north',label:'СЕВЕР',x:0,z:34,r:20,weight:1.08},
  {id:'south',label:'ЮГ',x:0,z:-34,r:20,weight:1.08},
  {id:'west',label:'ЗАПАД',x:-34,z:0,r:19,weight:.94},
  {id:'east',label:'ВОСТОК',x:34,z:0,r:19,weight:.94}
];

const FRONTLINE_CFG=Object.freeze({rotateSeconds:44,captureSeconds:8.5,capturePoints:3});
const frontlineObjective={
  zoneId:'mid',progress:0,owner:null,rotateT:FRONTLINE_CFG.rotateSeconds,
  allyPresence:0,enemyPresence:0,hudT:0,marker:null
};
const frontlineZoneOwners=Object.fromEntries(BOT_MAP_ZONES.map(zone=>[zone.id,null]));
function frontlineZone(){
  return BOT_MAP_ZONES.find(zone=>zone.id===frontlineObjective.zoneId)||BOT_MAP_ZONES[0];
}
function frontlinePlayerInside(zone=frontlineZone()){
  if(dying)return false;
  return Math.hypot(camera.position.x-zone.x,camera.position.z-zone.z)<=zone.r;
}
function serializeFrontlineObjective(){
  return {
    zoneId:frontlineZone().id,
    progress:Math.max(-100,Math.min(100,frontlineObjective.progress)),
    owner:frontlineObjective.owner,
    rotateT:Math.max(1,Math.min(FRONTLINE_CFG.rotateSeconds,frontlineObjective.rotateT)),
    zoneOwners:{...frontlineZoneOwners},
    allyControlScore,enemyControlScore
  };
}
function resetFrontlineObjective(zoneId='mid',resetScores=false){
  const zone=BOT_MAP_ZONES.find(z=>z.id===zoneId)||BOT_MAP_ZONES[0];
  frontlineObjective.zoneId=zone.id;
  frontlineObjective.progress=0;
  frontlineObjective.owner=null;
  frontlineObjective.rotateT=FRONTLINE_CFG.rotateSeconds;
  frontlineObjective.allyPresence=0;
  frontlineObjective.enemyPresence=0;
  frontlineObjective.hudT=0;
  if(resetScores){
    allyControlScore=0;enemyControlScore=0;
    for(const id of Object.keys(frontlineZoneOwners))frontlineZoneOwners[id]=null;
  }
  updateFrontlineMarker(0);
  updateFrontlineHUD(true);
}
function restoreFrontlineObjective(data){
  if(!data||typeof data!=='object'){resetFrontlineObjective('mid',true);return;}
  const zone=BOT_MAP_ZONES.find(z=>z.id===data.zoneId)||BOT_MAP_ZONES[0];
  frontlineObjective.zoneId=zone.id;
  frontlineObjective.progress=Math.max(-100,Math.min(100,Number(data.progress)||0));
  frontlineObjective.owner=data.owner==='ally'||data.owner==='enemy'?data.owner:null;
  frontlineObjective.rotateT=Math.max(2,Math.min(FRONTLINE_CFG.rotateSeconds,Number(data.rotateT)||FRONTLINE_CFG.rotateSeconds));
  frontlineObjective.allyPresence=0;
  frontlineObjective.enemyPresence=0;
  frontlineObjective.hudT=0;
  for(const id of Object.keys(frontlineZoneOwners)){
    const owner=data.zoneOwners?.[id];
    frontlineZoneOwners[id]=owner==='ally'||owner==='enemy'?owner:null;
  }
  if(frontlineObjective.owner&&!frontlineZoneOwners[zone.id])frontlineZoneOwners[zone.id]=frontlineObjective.owner;
  allyControlScore=Math.max(0,Math.floor(Number(data.allyControlScore)||0));
  enemyControlScore=Math.max(0,Math.floor(Number(data.enemyControlScore)||0));
  updateFrontlineMarker(0);
  updateFrontlineHUD(true);
}
function chooseNextFrontlineZone(){
  const current=frontlineZone();
  const choices=BOT_MAP_ZONES.filter(zone=>zone.id!==current.id);
  let total=0;
  for(const zone of choices)total+=zone.weight;
  let roll=Math.random()*Math.max(.001,total);
  for(const zone of choices){roll-=zone.weight;if(roll<=0)return zone;}
  return choices[0]||BOT_MAP_ZONES[0];
}
function ensureFrontlineMarker(){
  if(frontlineObjective.marker)return frontlineObjective.marker;
  const group=new THREE.Group();
  const ring=new THREE.Mesh(
    new THREE.RingGeometry(.91,1,48),
    new THREE.MeshBasicMaterial({color:0xffd45a,transparent:true,opacity:.44,side:THREE.DoubleSide,depthWrite:false})
  );
  ring.rotation.x=-Math.PI/2;ring.position.y=.045;
  const disc=new THREE.Mesh(
    new THREE.CircleGeometry(.90,48),
    new THREE.MeshBasicMaterial({color:0xffd45a,transparent:true,opacity:.035,side:THREE.DoubleSide,depthWrite:false})
  );
  disc.rotation.x=-Math.PI/2;disc.position.y=.03;
  const beam=new THREE.Mesh(
    new THREE.CylinderGeometry(.055,.15,7,10),
    new THREE.MeshBasicMaterial({color:0xffd45a,transparent:true,opacity:.16,depthWrite:false})
  );
  beam.position.y=3.5;
  group.add(disc,ring,beam);scene.add(group);
  frontlineObjective.marker={group,ring,disc,beam};
  return frontlineObjective.marker;
}
function updateFrontlineMarker(ts=0){
  const marker=ensureFrontlineMarker(),zone=frontlineZone();
  marker.group.position.set(zone.x,0,zone.z);
  marker.ring.scale.set(zone.r,zone.r,1);
  marker.disc.scale.set(zone.r,zone.r,1);
  const team=frontlineObjective.owner||(frontlineObjective.progress>6?'ally':frontlineObjective.progress<-6?'enemy':null);
  const color=team==='ally'?0x44aaff:team==='enemy'?0xff4458:0xffd45a;
  marker.ring.material.color.setHex(color);marker.disc.material.color.setHex(color);marker.beam.material.color.setHex(color);
  const pulse=.5+.5*Math.sin((ts||performance.now())*.0042);
  marker.ring.material.opacity=.34+pulse*.18;
  marker.disc.material.opacity=.028+pulse*.020;
  marker.beam.material.opacity=.10+pulse*.10;
}
function updateFrontlineHUD(force=false){
  const root=G('frontline-objective');if(!root)return;
  if(!force&&frontlineObjective.hudT>0)return;
  frontlineObjective.hudT=.10;
  const zone=frontlineZone(),a=frontlineObjective.allyPresence,e=frontlineObjective.enemyPresence;
  const dist=Math.round(Math.hypot(camera.position.x-zone.x,camera.position.z-zone.z));
  const contested=a>.2&&e>.2&&Math.abs(a-e)<.45;
  let state='НЕЙТРАЛЬНАЯ ЗОНА';
  if(contested)state='ОСПАРИВАЕТСЯ';
  else if(frontlineObjective.owner==='ally')state='УДЕРЖИВАЮТ СИНИЕ';
  else if(frontlineObjective.owner==='enemy')state='УДЕРЖИВАЮТ КРАСНЫЕ';
  else if(frontlineObjective.progress>4)state='ЗАХВАТЫВАЮТ СИНИЕ';
  else if(frontlineObjective.progress<-4)state='ЗАХВАТЫВАЮТ КРАСНЫЕ';
  const bearing=G('frontline-bearing'),label=G('frontline-label');
  const dx=zone.x-camera.position.x,dz=zone.z-camera.position.z;
  const sourceHeading=Math.atan2(dx,dz),forwardHeading=Math.atan2(-Math.sin(yaw),-Math.cos(yaw));
  let bearingRad=sourceHeading-forwardHeading;while(bearingRad>Math.PI)bearingRad-=Math.PI*2;while(bearingRad<-Math.PI)bearingRad+=Math.PI*2;
  if(bearing)bearing.style.transform='rotate('+(bearingRad*180/Math.PI).toFixed(1)+'deg)';
  if(label)label.textContent='FRONTLINE · '+zone.label;
  const inside=dist<=zone.r;
  G('frontline-state').textContent=(inside?'В ЗОНЕ · ':'')+state+' · '+dist+' м · '+Math.ceil(frontlineObjective.rotateT)+'с';
  const ally=G('frontline-ally-progress'),enemy=G('frontline-enemy-progress');
  if(ally)ally.style.width=(Math.max(0,frontlineObjective.progress)*.5).toFixed(1)+'%';
  if(enemy)enemy.style.width=(Math.max(0,-frontlineObjective.progress)*.5).toFixed(1)+'%';
  const scoreEl=G('frontline-score');
  if(scoreEl)scoreEl.textContent='ЗОНЫ '+allyControlScore+' : '+enemyControlScore+' · ЗАХВАТ = '+FRONTLINE_CFG.capturePoints+' ОЧКА';
  const mapHint=G('frontline-map-hint');
  if(mapHint)mapHint.textContent='ЦЕЛЬ: '+zone.label+' · '+dist+' м';
  root.classList.toggle('ally',frontlineObjective.owner==='ally');
  root.classList.toggle('enemy',frontlineObjective.owner==='enemy');
  root.classList.toggle('contested',contested);
  root.classList.toggle('inside',inside);
}
function captureFrontline(team,zone){
  if(frontlineObjective.owner===team)return;
  frontlineObjective.owner=team;
  frontlineZoneOwners[zone.id]=team;
  if(team==='ally')allyControlScore++;else enemyControlScore++;
  updateTeamScore();
  const playerHelped=team==='ally'&&frontlinePlayerInside(zone);
  if(playerHelped){
    score+=150;
    addXP(35);
    markHUD();
    showMsg('⌖ Захват зоны: +150 очков · +35 XP');
  }
  playObjectiveCaptureSound(team);
  showAnn((team==='ally'?'🔵 СИНИЕ':'🔴 КРАСНЫЕ')+' ЗАХВАТИЛИ · '+zone.label);
  saveProgress(true);
}
function rotateFrontlineObjective(){
  const zone=chooseNextFrontlineZone();
  frontlineObjective.zoneId=zone.id;
  frontlineObjective.progress=0;
  frontlineObjective.owner=null;
  frontlineObjective.rotateT=FRONTLINE_CFG.rotateSeconds;
  frontlineObjective.allyPresence=0;
  frontlineObjective.enemyPresence=0;
  frontlineObjective.hudT=0;
  BOT_TEAM_TACTICS.ally.orderUntil=-999;BOT_TEAM_TACTICS.enemy.orderUntil=-999;
  updateFrontlineMarker(0);
  updateFrontlineHUD(true);
  showAnn('⌖ НОВАЯ ЦЕЛЬ · '+zone.label);
}
function tickFrontlineObjective(dt,ts){
  frontlineObjective.hudT=Math.max(0,frontlineObjective.hudT-dt);
  frontlineObjective.rotateT-=dt;
  if(frontlineObjective.rotateT<=0)rotateFrontlineObjective();
  const zone=frontlineZone();
  const ally=botZonePresence(zone,'ally'),enemy=botZonePresence(zone,'enemy');
  frontlineObjective.allyPresence=ally;frontlineObjective.enemyPresence=enemy;
  const delta=Math.max(-2.5,Math.min(2.5,ally-enemy));
  if(Math.abs(delta)>.10){
    frontlineObjective.progress+=delta*dt*(100/FRONTLINE_CFG.captureSeconds);
  }else if(!frontlineObjective.owner){
    frontlineObjective.progress*=Math.max(0,1-dt*.09);
  }
  frontlineObjective.progress=Math.max(-100,Math.min(100,frontlineObjective.progress));
  if(frontlineObjective.progress>=100)captureFrontline('ally',zone);
  else if(frontlineObjective.progress<=-100)captureFrontline('enemy',zone);
  updateFrontlineMarker(ts);
  updateFrontlineHUD(false);
}
const PLAYER_TACTICAL_PROFILE={
  time:-999,lastPos:new THREE.Vector3(),anchor:new THREE.Vector3(),stationaryMs:0,moveSpeed:0,lastShotAt:-999,
  style:'balanced',campScore:0
};
const BOT_TEAM_TACTICS={
  ally:{time:-999,focus:null,focusIsPlayer:false,focusPos:new THREE.Vector3(),suppressor:null,suppressorSince:-999,suppressorGeneration:0,flankerCount:0,wounded:null,doctrine:'hold',zone:null,zonePos:new THREE.Vector3(),zoneRadius:18,zoneControl:0,aliveDelta:0,orderUntil:-999,lastFor:0,lastAgainst:0,setbacks:0,recoveryUntil:-999,waveStart:-999,waveUntil:-999,waveId:0,breachReady:false,smokeWaveId:-1,smokeDecisionWaveId:-1,smokeDecisionUse:false,smokeReadyAt:-999,fragWaveId:-1},
  enemy:{time:-999,focus:null,focusIsPlayer:false,focusPos:new THREE.Vector3(),suppressor:null,suppressorSince:-999,suppressorGeneration:0,flankerCount:0,wounded:null,doctrine:'hold',zone:null,zonePos:new THREE.Vector3(),zoneRadius:18,zoneControl:0,aliveDelta:0,orderUntil:-999,lastFor:0,lastAgainst:0,setbacks:0,recoveryUntil:-999,waveStart:-999,waveUntil:-999,waveId:0,breachReady:false,smokeWaveId:-1,smokeDecisionWaveId:-1,smokeDecisionUse:false,smokeReadyAt:-999,fragWaveId:-1}
};
function botRoleLabel(role){
  return role==='assault'?'ШТУРМ':role==='flankL'?'ФЛАНГ Л':role==='flankR'?'ФЛАНГ П':role==='anchor'?'ОПОРА':role==='engineer'?'ИНЖЕНЕР':'БОЕЦ';
}
function botDoctrineLabel(doctrine){
  return doctrine==='breach'?'ПРОРЫВ':doctrine==='push'?'ШТУРМ':doctrine==='retake'?'ВОЗВРАТ':doctrine==='hold'?'УДЕРЖАНИЕ':'МАНЁВР';
}
function botAssaultWaveState(plan,now=performance.now()){
  if(!plan||(plan.doctrine!=='breach'&&plan.doctrine!=='retake'))return'none';
  if(now<plan.waveStart)return'staging';
  if(now<plan.waveUntil)return'active';
  return'expired';
}
function refreshPlayerTacticalProfile(now){
  const p=PLAYER_TACTICAL_PROFILE;
  if(p.time<0){
    p.time=now;p.lastPos.copy(camera.position);p.anchor.copy(camera.position);return p;
  }
  for(let i=BOT_NOISE_EVENTS.length-1;i>=0;i--){
    const e=BOT_NOISE_EVENTS[i];
    if(e.source==='player'){p.lastShotAt=Math.max(p.lastShotAt,e.time);break;}
  }
  const elapsed=now-p.time;
  if(elapsed<220)return p;
  const dist=Math.hypot(camera.position.x-p.lastPos.x,camera.position.z-p.lastPos.z);
  const sampleSpeed=dist/Math.max(.05,elapsed/1000);
  p.moveSpeed=p.moveSpeed*.72+sampleSpeed*.28;
  const anchorDist=Math.hypot(camera.position.x-p.anchor.x,camera.position.z-p.anchor.z);
  if(anchorDist>5.5){p.anchor.copy(camera.position);p.stationaryMs=Math.max(0,p.stationaryMs-1800);}
  else if(dist<.72)p.stationaryMs+=elapsed;
  else p.stationaryMs=Math.max(0,p.stationaryMs-elapsed*.75);
  p.lastPos.copy(camera.position);p.time=now;
  const recentFire=now-p.lastShotAt<2300;
  p.campScore=Math.max(0,Math.min(1,(p.stationaryMs-3200)/5200+(recentFire?.24:0)));
  p.style=p.campScore>.58?'camp':camera.position.x>18?'rushing':p.moveSpeed>4.4?'mobile':'balanced';
  return p;
}
function botTeamAliveCount(team){
  let n=enemies.reduce((sum,b)=>sum+(b.alive&&b.team===team?1:0),0);
  if(team==='ally'&&!dying)n++;
  return n;
}
function botZonePresence(zone,team){
  const r2=zone.r*zone.r;let score=0;
  for(const bot of enemies){
    if(!bot.alive||bot.team!==team)continue;
    const dx=bot.group.position.x-zone.x,dz=bot.group.position.z-zone.z;
    const d2=dx*dx+dz*dz;
    if(d2>r2)continue;
    const proximity=1-Math.sqrt(d2)/zone.r;
    const roleM=bot.role==='anchor'?1.12:bot.role==='engineer'?1.06:1;
    score+=(.72+proximity*.48)*roleM;
  }
  if(team==='ally'&&!dying){
    const dx=camera.position.x-zone.x,dz=camera.position.z-zone.z,d2=dx*dx+dz*dz;
    if(d2<=r2)score+=.88+(1-Math.sqrt(d2)/zone.r)*.52;
  }
  return score;
}
function refreshBotMapOrder(team,plan,now){
  const enemyTeam=team==='ally'?'enemy':'ally';
  const direction=team==='ally'?1:-1;
  const aliveDelta=botTeamAliveCount(team)-botTeamAliveCount(enemyTeam);
  const profile=refreshPlayerTacticalProfile(now);
  const scoreFor=team==='ally'?allyKills:enemyKills;
  const scoreAgainst=team==='ally'?enemyKills:allyKills;
  const forDelta=Math.max(0,scoreFor-plan.lastFor),againstDelta=Math.max(0,scoreAgainst-plan.lastAgainst);
  if(againstDelta>forDelta&&(plan.doctrine==='push'||plan.doctrine==='breach'))plan.setbacks=Math.min(3,plan.setbacks+againstDelta);
  if(forDelta>0)plan.setbacks=Math.max(0,plan.setbacks-forDelta);
  if(plan.setbacks>=2){plan.recoveryUntil=now+3800;plan.setbacks=0;plan.orderUntil=-999;}
  plan.lastFor=scoreFor;plan.lastAgainst=scoreAgainst;
  const samples=BOT_MAP_ZONES.map(zone=>{
    const friendly=botZonePresence(zone,team),hostile=botZonePresence(zone,enemyTeam);
    return{zone,friendly,hostile,control:friendly-hostile,depth:zone.x*direction};
  });
  const frontline=frontlineZone();
  const frontlineBias=s=>s.zone.id===frontline.id?7.4:0;
  const ownIncursion=samples
    .filter(s=>s.depth<=4&&s.control<-.45)
    .sort((a,b)=>a.control-b.control||a.depth-b.depth)[0]||null;
  const playerZone=samples.slice().sort((a,b)=>{
    const da=(a.zone.x-camera.position.x)**2+(a.zone.z-camera.position.z)**2;
    const db=(b.zone.x-camera.position.x)**2+(b.zone.z-camera.position.z)**2;
    return da-db;
  })[0];
  const enemyCounterRush=team==='enemy'&&!dying&&profile.style==='rushing'&&camera.position.x>14;
  const enemyBreakCamp=team==='enemy'&&!dying&&profile.style==='camp'&&profile.campScore>.58&&aliveDelta>=-1&&(plan.focusIsPlayer||performance.now()-profile.lastShotAt<2600);
  const allyFollowRush=team==='ally'&&!dying&&profile.style==='rushing'&&camera.position.x>8&&aliveDelta>=-1;
  let doctrine=now<plan.recoveryUntil?'hold':
    enemyBreakCamp?'breach':
    enemyCounterRush?'retake':
    aliveDelta>=2||allyFollowRush?'push':
    aliveDelta<=-2?'hold':
    ownIncursion?'retake':
    (plan.focus||plan.focusIsPlayer)?'push':'hold';
  let ranked;
  if(doctrine==='breach'){
    ranked=samples.map(s=>({s,score:s.zone.weight*1.7-s.zone.x*.018+
      (s.zone===playerZone?8:0)+s.hostile*1.8-s.friendly*.30+frontlineBias(s)}));
  }else if(doctrine==='retake'){
    ranked=samples.map(s=>({s,score:(-s.control)*4.4+s.zone.weight*2.2-Math.max(0,s.depth)*.08-Math.abs(s.depth)*.012+
      (enemyCounterRush&&s.zone===playerZone?5.5:0)+frontlineBias(s)}));
  }else if(doctrine==='push'){
    ranked=samples.map(s=>({s,score:s.zone.weight*2.2+s.depth*.055+s.hostile*1.45-s.friendly*.42+(Math.abs(s.zone.z)>1?.22:0)+frontlineBias(s)}));
  }else{
    ranked=samples.map(s=>({
      s,
      score:s.zone.weight*2.0+s.friendly*1.15-s.hostile*.72-Math.abs(s.depth)*.020+(s.depth<=5?.42:0)+frontlineBias(s)
    }));
  }
  ranked.sort((a,b)=>b.score-a.score);
  const chosen=ranked[0]?.s||samples[0];
  const current=plan.zone?samples.find(s=>s.zone.id===plan.zone.id):null;
  const emergency=aliveDelta<=-2||!!ownIncursion||enemyBreakCamp||enemyCounterRush;
  const canSwitch=now>=plan.orderUntil||!current||emergency&&plan.doctrine!==doctrine;
  if(canSwitch){
    plan.doctrine=doctrine;
    plan.zone=chosen.zone;
    plan.zonePos.set(chosen.zone.x,0,chosen.zone.z);
    plan.zoneRadius=chosen.zone.r;
    plan.zoneControl=chosen.control;
    plan.orderUntil=now+(doctrine==='breach'?3400:doctrine==='push'?2800:doctrine==='retake'?2400:3200);
  }else if(current){
    plan.zoneControl=current.control;
  }
  if(plan.doctrine==='breach'||plan.doctrine==='retake'){
    if(now>=plan.waveUntil){
      plan.waveStart=now+(plan.doctrine==='breach'?760:520);
      plan.waveUntil=plan.waveStart+(plan.doctrine==='breach'?3200:2500);
      plan.waveId=(plan.waveId||0)+1;
    }
  }else{
    plan.waveStart=-999;plan.waveUntil=-999;
  }
  plan.aliveDelta=aliveDelta;
}
function botObjectivePoint(bot,plan){
  if(!plan?.zone)return null;
  const dir=bot.team==='ally'?1:-1;
  const roleOffset={
    assault:[3.8*dir,0],
    flankL:[.8*dir,-6.0],
    flankR:[.8*dir,6.0],
    anchor:[-4.4*dir,0],
    engineer:[-2.6*dir,4.0*bot.sideBias]
  }[bot.role]||[0,0];
  let x=plan.zonePos.x+roleOffset[0],z=plan.zonePos.z+roleOffset[1];
  if(plan.doctrine==='hold'&&bot.role==='anchor')x-=2.0*dir;
  const waveState=botAssaultWaveState(plan);
  if(waveState==='staging'){
    x-=(bot.role==='anchor'?5.5:bot.role==='engineer'?4.6:bot.role==='assault'?3.8:4.2)*dir;
    if(bot.role==='flankL')z-=2.4;
    else if(bot.role==='flankR')z+=2.4;
  }else if(plan.doctrine==='breach'){
    if(bot.role==='flankL')z-=3.2;
    else if(bot.role==='flankR')z+=3.2;
    else if(bot.role==='assault')x+=2.0*dir;
  }else if(plan.doctrine==='retake'&&waveState==='active'){
    if(bot.role==='assault')x+=1.5*dir;
    else if(bot.role==='flankL')z-=1.8;
    else if(bot.role==='flankR')z+=1.8;
  }
  const coll=collideWalls(Math.max(-90,Math.min(90,x)),Math.max(-90,Math.min(90,z)),BOT_R);
  if(Math.hypot(coll.x-x,coll.z-z)>2.4){
    x=plan.zonePos.x;z=plan.zonePos.z;
    const fallback=collideWalls(x,z,BOT_R);
    return new THREE.Vector3(fallback.x,0,fallback.z);
  }
  return new THREE.Vector3(coll.x,0,coll.z);
}
function botMatchesSquadFocus(bot,plan){
  if(!plan)return false;
  if(plan.focusIsPlayer)return bot.targetIsPlayer&&bot.team==='enemy'&&!dying;
  return !!plan.focus&&bot.targetEn===plan.focus&&plan.focus.alive;
}
function refreshBotTeamTactics(team){
  const plan=BOT_TEAM_TACTICS[team];
  const now=performance.now();
  if(now-plan.time<180)return plan;
  plan.time=now;plan.focus=null;plan.focusIsPlayer=false;plan.flankerCount=0;plan.wounded=null;
  const mates=enemies.filter(b=>b.alive&&b.team===team);
  const votes=new Map();
  const addVote=(target,isPlayer,weight,pos)=>{
    if(!target&&!isPlayer)return;
    const key=isPlayer?'player':target;
    const prev=votes.get(key)||{target,isPlayer,weight:0,pos:new THREE.Vector3()};
    prev.weight+=weight;prev.pos.copy(pos);votes.set(key,prev);
  };
  for(const mate of mates){
    if(mate.targetIsPlayer&&team==='enemy'&&!dying){
      addVote(null,true,mate.canSeeTarget?3.4:mate.lastSeenT<2.4?2.0:.8,camera.position);
    }else if(mate.targetEn&&mate.targetEn.alive&&mate.targetEn.team!==team){
      addVote(mate.targetEn,false,mate.canSeeTarget?3.2:mate.lastSeenT<2.4?1.9:.8,mate.targetEn.group.position);
    }
  }
  const intel=TEAM_INTEL[team];
  if(intel&&now-intel.time<4200){
    if(intel.target==='player'&&team==='enemy'&&!dying)addVote(null,true,2.2,intel.pos);
    else if(intel.target&&intel.target.alive&&intel.target.team!==team)addVote(intel.target,false,2.2,intel.pos);
  }
  let best=null;
  for(const item of votes.values())if(!best||item.weight>best.weight)best=item;
  if(best){
    plan.focus=best.target;plan.focusIsPlayer=best.isPlayer;plan.focusPos.copy(best.pos);
    if(best.isPlayer&&!dying)plan.focusPos.copy(camera.position);
    else if(best.target?.alive)plan.focusPos.copy(best.target.group.position);
  }
  const focusMates=mates.filter(m=>botMatchesSquadFocus(m,plan));
  const flankers=focusMates.filter(m=>(m.role==='flankL'||m.role==='flankR')&&m.hp/m.maxHp>.38);
  plan.flankerCount=flankers.length;
  const suppressorEligible=m=>m?.alive&&botMatchesSquadFocus(m,plan)&&m.reloadT<=0&&m.mag>Math.max(1,Math.ceil(m.weapon.clip*.12))&&m.hp/m.maxHp>.30&&m.role!=='flankL'&&m.role!=='flankR'&&(m.canSeeTarget||m.lastSeenT<2.6);
  const priorSuppressor=suppressorEligible(plan.suppressor)?plan.suppressor:null;
  const suppressors=focusMates.filter(suppressorEligible);
  suppressors.sort((a,b)=>{
    const roleScore=x=>x.role==='anchor'?5:x.role==='assault'?4:x.role==='engineer'?3:1;
    const da=a.group.position.distanceToSquared(plan.focusPos),db=b.group.position.distanceToSquared(plan.focusPos);
    const visibilityA=a.canSeeTarget?2.2:0,visibilityB=b.canSeeTarget?2.2:0;
    return (roleScore(b)+visibilityB)-(roleScore(a)+visibilityA)+(da-db)*.0015;
  });
  const preferred=(priorSuppressor&&now-plan.suppressorSince<1800)?priorSuppressor:(suppressors[0]||null);
  if(preferred!==plan.suppressor){
    plan.suppressor=preferred;plan.suppressorSince=now;plan.suppressorGeneration=(plan.suppressorGeneration||0)+1;
  }else if(!preferred){
    plan.suppressor=null;plan.suppressorSince=now;
  }
  const wounded=mates.filter(m=>m.hp/m.maxHp<.58);
  wounded.sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp));
  plan.wounded=wounded[0]||null;
  refreshBotMapOrder(team,plan,now);
  plan.breachReady=(plan.doctrine==='breach'||plan.doctrine==='retake')&&botAssaultWaveState(plan,now)==='active'&&!!plan.suppressor&&plan.flankerCount>0;
  return plan;
}
function maybeCoordinateBotUtility(bot,plan,targetPos,dist,waveState){
  if(!bot||!plan||!targetPos||waveState!=='active'||(plan.doctrine!=='breach'&&plan.doctrine!=='retake'))return;
  const now=performance.now();
  if(plan.smokeDecisionWaveId!==plan.waveId){
    plan.smokeDecisionWaveId=plan.waveId;
    plan.smokeDecisionUse=now>=plan.smokeReadyAt&&Math.random()<.30;
  }
  if(plan.smokeDecisionUse&&plan.smokeWaveId!==plan.waveId&&(bot.role==='engineer'||bot.role==='anchor')&&dist>14&&dist<46){
    const objective=botObjectivePoint(bot,plan)||plan.zonePos;
    const smokeTarget=bot.group.position.clone().lerp(objective,.58);smokeTarget.y=.1;
    if(!friendlyNearPoint(smokeTarget,bot.team,3.5)&&spawnBotSmokeGrenade(bot.getMuzzlePos(),smokeTarget,bot.team,bot)){
      plan.smokeWaveId=plan.waveId;
      plan.smokeDecisionUse=false;
      plan.smokeReadyAt=now+14000+Math.random()*8000;
    }
  }
  if(plan.fragWaveId!==plan.waveId&&(bot.role==='assault'||bot.role==='engineer')&&dist>9&&dist<31&&bot.canSeeTarget){
    const fragTarget=targetPos.clone();fragTarget.y=.1;
    if(!friendlyNearPoint(fragTarget,bot.team,5.6)&&spawnBotFragGrenade(bot.getMuzzlePos(),fragTarget,bot.team,bot)){
      plan.fragWaveId=plan.waveId;
    }
  }
}


class Enemy{
  constructor(x,z,type,team){
    const et=ETYPES[type%ETYPES.length];
    this.alive=true;
    this.type=type;
    this.et=et;
    this.team=team;
    this.role=teamRoleForNextBot(team);
    this.baseHp=et.hp;
    this.baseSpeed=et.spd;
    this.baseAcc=et.acc;
    this.ph=Math.random()*Math.PI*2;

    this.aiState='patrol';this.aiT=0;this.stateCD=0;
    this.desiredYaw=0;
    this.velX=0;this.velZ=0;
    this.motionX=0;this.motionZ=0;
    this.gaitPhase=Math.random()*Math.PI*2;this.gaitSpeed=0;this.footstepDistance=Math.random()*1.1;
    this.targetScanT=0;this.targetIsPlayer=false;
    this.reactionT=.22+Math.random()*.22;
    this.skillSeed=Math.random()*.18;
    this.aimSkill=.58+this.skillSeed;
    this.kills=0;
    this.aimPoint=new THREE.Vector3(x,1.2,z);
    this.burstLeft=2+Math.floor(Math.random()*4);
    this.burstPauseT=0;
    this.pickupTarget=null;
    this.stuckT=0;this.lastMoveX=x;this.lastMoveZ=z;
    this.unstuckT=0;this.unstuckDir=Math.random()<.5?-1:1;
    this.commandDoctrine='hold';
    this.sT=.18+Math.random()*.22;
    this.reloadT=0;
    this.mineCD=8+Math.random()*12;
    this.bombCD=24+Math.random()*52;
    this.mineScanT=Math.random()*.18;
    this.cachedMineThreat=null;
    this.grenadeScanT=Math.random()*.12;this.cachedGrenadeThreat=null;
    this.weaponSwitchT=2.2+Math.random()*2.0;
    this.coverEvalT=.38+Math.random()*.22;
    this.coverPoint=null;this.coverChainT=0;
    this.peekPoint=null;this.peekT=0;this.peekDuration=0;this.peekCooldownT=.45+Math.random()*.45;this.peekLean=0;
    this.suppressedT=0;this.suppressionSource=null;
    this.flankPoint=null;this.flankEvalT=.25+Math.random()*.35;this.flankCommitT=0;
    this.tacticalMode='normal';
    this.levelSync=-1;
    this.lastDamageT=0;
    this.lastTargetSeenAt=0;
    this.sideBias=this.role==='flankL'?-1:this.role==='flankR'?1:(Math.random()<.5?-1:1);
    this.bravery=this.role==='assault'?1.18:this.role==='anchor'?0.88:1.0;

    this.patrolIdx=Math.floor(Math.random()*WPTS.length);
    this.ptgt=new THREE.Vector3(WPTS[this.patrolIdx][0]+(Math.random()-.5)*10,0,WPTS[this.patrolIdx][1]+(Math.random()-.5)*10);
    this.losT=.18+Math.random()*.14;this.canSeeTarget=false;
    this.targetEn=null;
    this.lastSeenT=999;
    this.lastKnown=new THREE.Vector3(x,0,z);
    this.lastKnownVel=new THREE.Vector3();
    this.targetLockT=0;
    this.searchPoint=null;this.searchStep=0;
    this.coverHoldT=0;this.coverCooldownT=0;
    this.hearingScanT=Math.random()*.12;
    this.heardT=0;this.heardSource=null;this.heardIsPlayer=false;
    this.heardPos=new THREE.Vector3(x,0,z);
    this.cachedRocketThreat=null;

    this.dodgeDir=0;this.dodgeT=0;this.dodgeCD=0;this.dodgeSpd=0;
    this.strafeDir=Math.random()<.5?-1:1;this.strafeSwitchT=1.1+Math.random()*1.4;
    this.flashT=0;this.jV=0;this.jT=999;this.jCD=4+Math.random()*3;
    this.uiT=0;this.uiVis=false;this.uiX=0;this.uiY=0;
    this.rocketCheckT=.18+Math.random()*.10;

    const built=mkHuman(et,team);
    this.group=built.g;this.pts=built.pts;this.weaponPivot=built.weaponPivot;this.armRig=built.armRig;
    this.group.position.set(x,0,z);
    scene.add(this.group);

    this.hEl=document.createElement('div');
    const barCol=team==='ally'?'rgba(0,70,150,.88)':'rgba(120,0,24,.88)';
    this.hEl.style.cssText='position:fixed;width:52px;height:5px;background:'+barCol+';border:1px solid '+(team==='ally'?'#4dd8ff':'#ff4966')+';border-radius:3px;pointer-events:none;z-index:5;display:none;box-shadow:0 0 8px '+(team==='ally'?'rgba(60,210,255,.7)':'rgba(255,50,80,.7)')+';';
    this.hFill=document.createElement('div');
    this.hFill.style.cssText='height:100%;border-radius:2px;width:100%;background:'+(team==='ally'?'#45d5ff':'#ff3655')+';';
    this.hEl.appendChild(this.hFill);document.getElementById('ui').appendChild(this.hEl);

    this.weapon=chooseBotWeaponByDistance(22,-1,true,this.role);
    this.mag=this.weapon.clip;
    this.syncScale(true);
    refreshBotWeaponVisual(this);
  }

  syncScale(force=false){
    if(!force&&this.levelSync===level)return;
    const oldMax=this.maxHp||1;
    const oldHp=this.hp||oldMax;
    const hpRatio=force?1:Math.max(.24,Math.min(1,oldHp/oldMax));
    const roleHp=this.role==='anchor'?1.18:this.role==='assault'?1.02:this.role==='engineer'?1.10:1.05;
    const roleSpd=(this.role==='flankL'||this.role==='flankR')?1.12:(this.role==='anchor'?.96:1.03);
    const roleDmg=this.role==='anchor'?1.10:(this.role==='engineer'?1.02:1.06);
    const lvl=Math.max(1,level);
    const dominance=Math.min(.55,kills*.009);
    const combatGrowth=Math.min(.28,kills*.0045);
    this.aimSkill=Math.min(.97,.58+this.skillSeed+lvl*.013+Math.min(.13,kills*.0018));
    this.maxHp=this.baseHp*(1.08+lvl*.082+dominance)*roleHp;
    this.hp=force?this.maxHp:Math.min(this.maxHp,this.maxHp*hpRatio+Math.max(10,this.maxHp*.05));
    this.speed=this.baseSpeed*(1.02+Math.min(.28,lvl*.012)+Math.min(.12,kills*.0020))*roleSpd;
    this.baseDmgMul=(.86+this.type*.06)*(1+lvl*.038+combatGrowth)*roleDmg;
    this.curAcc=Math.max(.0075,this.baseAcc*(1.03-Math.min(lvl*.019,.58)-Math.min(.18,kills*.0022))*(this.role==='anchor'?.82:1));
    this.fireRateMul=Math.max(.62,1.08-lvl*.013-Math.min(.20,kills*.0025))*(this.role==='assault'?.92:1);
    this.levelSync=level;
  }

  chooseWeapon(distHint=22,force=false){
    const prevWeapon=this.weapon;
    const prev=prevWeapon?prevWeapon.idx:-1;
    const currentUsable=!!(prevWeapon&&
      distHint<=prevWeapon.range*1.04&&
      !(distHint<9&&prevWeapon.isRocket)&&
      !(distHint>22&&prevWeapon.key==='shotgun')&&
      !(distHint<22&&prevWeapon.isSniper));
    if(!force&&currentUsable&&this.mag>0&&Math.random()<.78){
      this.weaponSwitchT=2.4+Math.random()*2.2;
      return;
    }
    const candidate=chooseBotWeaponByDistance(distHint,prev,force,this.role);
    if(!force&&prevWeapon&&currentUsable&&candidate.idx!==prev){
      const prevFit=Math.abs(distHint-prevWeapon.opt)/Math.max(8,prevWeapon.range);
      const nextFit=Math.abs(distHint-candidate.opt)/Math.max(8,candidate.range);
      if(nextFit>prevFit*.82&&Math.random()<.72){
        this.weaponSwitchT=2.2+Math.random()*2.0;
        return;
      }
    }
    this.weapon=candidate;
    if(force||this.mag<=0||this.mag>this.weapon.clip)this.mag=this.weapon.clip;
    this.weaponSwitchT=4.5+Math.random()*4.0;
    refreshBotWeaponVisual(this);
  }

  findReachableHealthPickup(maxDist=30){
    let best=null,bestScore=maxDist;
    const from=this.group.position.clone();from.y=.55;
    for(const pk of pickups){
      if(pk.type!=='hp'||!pk.m.visible)continue;
      const d=pk.m.position.distanceTo(this.group.position);
      if(d>=bestScore)continue;
      const to=pk.m.position.clone();to.y=.55;
      if(wallBetween(from,to,losMeshes))continue;
      best=pk;bestScore=d;
    }
    return best;
  }

  findTacticalCover(target){
    let best=null,bestScore=1e9;
    const from=this.group.position,tx=target.x,tz=target.z;
    const routeFrom=from.clone();routeFrom.y=.55;
    for(const cp of COVER_POINTS){
      const p=new THREE.Vector3(cp[0],0,cp[1]);
      const dFrom=p.distanceTo(from),targetDist=p.distanceTo(target);
      if(dFrom<4||dFrom>32||targetDist<7)continue;
      const eye=p.clone();eye.y=1.35;
      const tgt=target.clone();tgt.y=1.45;
      if(!wallBetween(eye,tgt,losMeshes))continue;
      const routeTo=p.clone();routeTo.y=.55;
      const routePenalty=botRoutePenalty(routeFrom,routeTo,this.team);
      let crowdPenalty=0;
      for(const other of enemies){
        if(!other.alive||other===this||other.team!==this.team)continue;
        const od=other.group.position.distanceTo(p);
        if(od<4.5)crowdPenalty+=(4.5-od)*1.6;
      }
      const objective=frontlineZone();
      const objectiveDist=Math.hypot(p.x-objective.x,p.z-objective.z);
      const objectiveCoverPenalty=(this.commandDoctrine==='hold'||this.commandDoctrine==='retake')
        ?Math.max(0,objectiveDist-objective.r*.78)*.42
        :Math.max(0,objectiveDist-objective.r*1.10)*.12;
      let score=dFrom+Math.abs(targetDist-15)*.17+crowdPenalty+routePenalty+objectiveCoverPenalty;
      const fromObjectiveDist=Math.hypot(from.x-objective.x,from.z-objective.z);
      const objectiveAdvance=fromObjectiveDist-objectiveDist;
      if(this.commandDoctrine==='breach'||this.commandDoctrine==='retake')score-=Math.max(-3,Math.min(10,objectiveAdvance))*.46;
      if(objectiveDist<objective.r*.78&&(this.commandDoctrine==='hold'||this.commandDoctrine==='retake'))score-=3.4;
      const side=((p.x-from.x)*(tz-from.z)-(p.z-from.z)*(tx-from.x));
      if(Math.sign(side)===Math.sign(this.sideBias))score-=2.4;
      if(score<bestScore){bestScore=score;best=p;}
    }
    return best?best.clone():null;
  }

  findFlankPoint(target,sideSign){
    const from=this.group.position;
    const dx=target.x-from.x,dz=target.z-from.z,dist=Math.max(1,Math.hypot(dx,dz));
    const dirX=dx/dist,dirZ=dz/dist,perpX=-dirZ,perpZ=dirX;
    let best=null,bestScore=Infinity;
    for(const cp of COVER_POINTS){
      const p=new THREE.Vector3(cp[0],0,cp[1]);
      const dFrom=p.distanceTo(from),dTarget=p.distanceTo(target);
      if(dFrom<6||dFrom>44||dTarget<10||dTarget>29)continue;
      const side=((p.x-target.x)*perpX+(p.z-target.z)*perpZ)*sideSign;
      if(side<4.5)continue;
      const eye=p.clone();eye.y=1.35;
      const tgt=target.clone();tgt.y=1.35;
      const firingLane=!wallBetween(eye,tgt,losMeshes)&&!smokeBlocksSight(eye,tgt);
      const routeFrom=from.clone();routeFrom.y=.55;
      const routeTo=p.clone();routeTo.y=.55;
      const routePenalty=botRoutePenalty(routeFrom,routeTo,this.team);
      let crowd=0;
      for(const mate of enemies){
        if(!mate.alive||mate===this||mate.team!==this.team)continue;
        const md=mate.group.position.distanceTo(p);
        if(md<5)crowd+=(5-md)*1.5;
      }
      const objective=frontlineZone();
      const objectiveDist=Math.hypot(p.x-objective.x,p.z-objective.z);
      const objectivePenalty=Math.max(0,objectiveDist-objective.r*1.25)*.10;
      const score=dFrom*.46+Math.abs(dTarget-17)*.70-side*.20+crowd+routePenalty+(firingLane?-5.0:3.8)+objectivePenalty;
      if(score<bestScore){bestScore=score;best=p;}
    }
    if(best)return best.clone();
    const radius=Math.max(12,Math.min(22,dist*.48));
    const cx=target.x+perpX*sideSign*radius-dirX*3.5;
    const cz=target.z+perpZ*sideSign*radius-dirZ*3.5;
    const coll=collideWalls(Math.max(-90,Math.min(90,cx)),Math.max(-90,Math.min(90,cz)),BOT_R);
    if(Math.hypot(coll.x-cx,coll.z-cz)<2.6)return new THREE.Vector3(coll.x,0,coll.z);
    return null;
  }

  canSeePoint(pos,yOffset=1.25){
    const eye=this.group.position.clone();eye.y+=1.48;
    const target=pos.clone();target.y+=yOffset;
    return !wallBetween(eye,target,losMeshes)&&!smokeBlocksSight(eye,target);
  }

  hearCombatNoise(dt){
    if(this.heardT>0)this.heardT=Math.max(0,this.heardT-dt);
    this.hearingScanT-=dt;
    if(this.hearingScanT>0)return;
    this.hearingScanT=.10+Math.random()*.07;
    const now=performance.now();
    while(BOT_NOISE_EVENTS.length&&now-BOT_NOISE_EVENTS[0].time>2200)BOT_NOISE_EVENTS.shift();
    let best=null,bestScore=-Infinity,bestDist=0,bestRadius=0;
    const ear=this.group.position.clone();ear.y+=1.35;
    for(let idx=BOT_NOISE_EVENTS.length-1;idx>=0;idx--){
      const ev=BOT_NOISE_EVENTS[idx];
      if(ev.source===this||botSourceTeam(ev.source)===this.team)continue;
      if(ev.source!=='player'&&(!ev.source||!ev.source.alive))continue;
      const age=(now-ev.time)/1000;if(age>1.75)continue;
      const d=this.group.position.distanceTo(ev.pos);
      let radius=ev.radius;
      const snd=ev.pos.clone();snd.y=Math.max(.8,snd.y);
      if(wallBetween(ear,snd,losMeshes))radius*=.52;
      if(d>radius)continue;
      const score=(1-d/radius)*ev.strength-age*.20;
      if(score>bestScore){best=ev;bestScore=score;bestDist=d;bestRadius=radius;}
    }
    if(!best)return;
    const uncertainty=Math.min(4.2,(bestDist/Math.max(1,bestRadius))*3.6)*(1-this.aimSkill*.38);
    const ang=Math.random()*Math.PI*2;
    this.heardPos.copy(best.pos);
    this.heardPos.x+=Math.cos(ang)*uncertainty;this.heardPos.z+=Math.sin(ang)*uncertainty;
    this.heardSource=best.source;this.heardIsPlayer=best.source==='player';this.heardT=1.65;
    const currentRecent=this.canSeeTarget&&this.lastSeenT<.45;
    const sameCurrent=this.heardIsPlayer?this.targetIsPlayer:this.targetEn===best.source;
    if(!currentRecent||sameCurrent){
      this.lastKnown.copy(this.heardPos);this.lastKnownVel.set(0,0,0);
      this.lastSeenT=Math.min(this.lastSeenT,1.10);this.searchPoint=null;this.searchStep=0;
      if(!sameCurrent&&this.targetLockT<=.18){
        if(this.heardIsPlayer&&this.team==='enemy'&&!dying){this.targetEn=null;this.targetIsPlayer=true;}
        else if(best.source&&best.source.alive&&best.source.team!==this.team){this.targetEn=best.source;this.targetIsPlayer=false;}
        this.canSeeTarget=false;this.losT=0;this.targetLockT=.36+this.aimSkill*.30;
      }
      if(this.aiState==='patrol'||this.aiState==='search')this.aiState='hunt';
      this.stateCD=Math.min(this.stateCD,.12);
    }
  }

  nearbyThreatCount(radius=18){
    const r2=radius*radius;let n=0;
    for(const other of enemies){
      if(!other.alive||other===this||other.team===this.team)continue;
      if(other.group.position.distanceToSquared(this.group.position)<r2)n++;
    }
    if(this.team==='enemy'&&!dying&&camera.position.distanceToSquared(this.group.position)<r2)n++;
    return n;
  }

  currentTargetWeapon(){
    if(this.targetEn&&this.targetEn.alive)return this.targetEn.weapon||null;
    if(this.targetIsPlayer&&this.team==='enemy'&&!dying)return getW();
    return null;
  }

  findIncomingRocketThreat(){
    let best=null,bestScore=Infinity;
    for(const arr of [pRkts,eRkts]){
      for(const rk of arr){
        if(!rk?.m||rk._src===this)continue;
        const rocketTeam=rk.ownerType==='player'?'ally':(rk._src?.team||rk.team||null);
        if(rocketTeam===this.team)continue;
        const rx=rk.m.position.x-this.group.position.x,rz=rk.m.position.z-this.group.position.z;
        const vx=rk.vx||0,vz=rk.vz||0,speed2=vx*vx+vz*vz;
        if(speed2<1)continue;
        const t=Math.max(0,Math.min(1.35,-(rx*vx+rz*vz)/speed2));
        const cx=rx+vx*t,cz=rz+vz*t,miss=Math.hypot(cx,cz);
        const danger=(rk.blastRadius||6.2)+2.0;
        if(t<=0||miss>danger)continue;
        const score=miss+t*3.4;
        if(score<bestScore){bestScore=score;best={rocket:rk,time:t,miss,side:(vx*rz-vz*rx)>=0?1:-1};}
      }
    }
    return best;
  }

  findTarget(){
    this.targetScanT-=this._lastDt||.016;
    const mx=this.group.position.x,mz=this.group.position.z;
    const currentValid=(this.targetEn&&this.targetEn.alive&&this.targetEn.team!==this.team)||(this.targetIsPlayer&&this.team==='enemy'&&!dying);
    if(currentValid&&(this.targetScanT>0||this.targetLockT>0)){
      const tp=this.targetEn&&this.targetEn.alive?this.targetEn.group.position:camera.position;
      return Math.hypot(tp.x-mx,tp.z-mz);
    }
    const prev=this.targetEn,prevPlayer=this.targetIsPlayer;
    let bestScore=Infinity,bestE=null,bestPlayer=false,currentScore=Infinity;
    for(const other of enemies){
      if(!other.alive||other===this||other.team===this.team)continue;
      const dx=other.group.position.x-mx,dz=other.group.position.z-mz,d=Math.hypot(dx,dz);
      const visible=d<72&&this.canSeePoint(other.group.position,1.24);
      const heard=this.heardT>0&&!this.heardIsPlayer&&this.heardSource===other;
      const memory=other===prev&&this.lastSeenT<8.5;
      if(!visible&&!heard&&!memory&&d>34)continue;
      const wounded=(1-other.hp/other.maxHp)*3.8;
      const crowdPenalty=Math.max(0,countTargeters(other,this.team)-1)*2.7;
      const roleBias=other.role==='anchor'?-1.2:other.role==='engineer'?-1.8:0;
      const threatBias=(other.kills||0)*-.16;
      const perceptionBias=visible?-7.0:heard?-3.1:memory?0:(6+d*.08);
      const score=d-wounded+crowdPenalty+roleBias+threatBias+perceptionBias;
      if(other===prev)currentScore=score;
      if(score<bestScore){bestScore=score;bestE=other;bestPlayer=false;}
    }
    if(this.team==='enemy'&&!dying){
      const d=Math.hypot(camera.position.x-mx,camera.position.z-mz);
      const visible=d<76&&this.canSeePoint(camera.position,0);
      const heard=this.heardT>0&&this.heardIsPlayer;
      const memory=prevPlayer&&this.lastSeenT<8.5;
      if(visible||heard||memory||d<=36){
        const playerThreat=Math.min(10,kills*.09+level*.22);
        const focused=countPlayerTargeters(this.team,this);
        const crowdPenalty=focused>=2?8+(focused-2)*5:focused*1.8;
        const perceptionBias=visible?-7.5:heard?-3.4:memory?0:(7+d*.09);
        const score=d-1.2-playerThreat+crowdPenalty+perceptionBias;
        if(prevPlayer)currentScore=score;
        if(score<bestScore){bestScore=score;bestE=null;bestPlayer=true;}
      }
    }
    if(currentValid&&currentScore<Infinity){
      const switchMargin=2.8+this.aimSkill*3.2;
      if(currentScore<=bestScore+switchMargin){bestE=prevPlayer?null:prev;bestPlayer=prevPlayer;}
    }
    this.targetEn=bestE;this.targetIsPlayer=bestPlayer;
    this.targetScanT=.15+(1-this.aimSkill)*.16+Math.random()*.10;
    if(prev!==bestE||prevPlayer!==bestPlayer){
      const heardSwitch=this.heardT>0&&(bestPlayer?this.heardIsPlayer:(!this.heardIsPlayer&&this.heardSource===bestE));
      this.targetLockT=(heardSwitch?.46:.72)+this.aimSkill*.48+Math.random()*.20;
      this.reactionT=.11+(1-this.aimSkill)*.48+Math.random()*.13;
      this.burstPauseT=Math.max(this.burstPauseT,.08);this.canSeeTarget=false;this.losT=0;
      if(heardSwitch){this.lastKnown.copy(this.heardPos);this.lastSeenT=Math.min(this.lastSeenT,1.05);}
      else{this.lastSeenT=999;this.lastKnownVel.set(0,0,0);}
      this.searchPoint=null;this.searchStep=0;
    }
    if(bestE)return Math.hypot(bestE.group.position.x-mx,bestE.group.position.z-mz);
    if(bestPlayer)return Math.hypot(camera.position.x-mx,camera.position.z-mz);
    return 999;
  }

  getTargetPos(){
    if(this.targetEn&&this.targetEn.alive)return this.targetEn.group.position;
    if(this.targetIsPlayer&&!dying)return camera.position;
    return null;
  }

  getAimPoint(tp){
    const aim=tp.clone();
    if(this.targetEn&&this.targetEn.alive)aim.y+=1.26;
    else aim.y=camera.position.y-.10;
    const dist=Math.max(1,this.group.position.distanceTo(tp));
    let lead=0;
    if(this.weapon.isRocket)lead=Math.min(1.05,dist/BOT_ROCKET_SPEED)*(.72+this.aimSkill*.20);
    else if(this.weapon.key==='plasma')lead=Math.min(.42,dist/TRACER_SPEED.plasma)*.45;
    const vx=this.targetEn&&this.targetEn.alive?(this.targetEn.velX||0):plrVx;
    const vz=this.targetEn&&this.targetEn.alive?(this.targetEn.velZ||0):plrVz;
    aim.x+=vx*lead;aim.z+=vz*lead;
    const smooth=.16+this.aimSkill*.18;
    if(!Number.isFinite(this.aimPoint.x))this.aimPoint.copy(aim);
    this.aimPoint.lerp(aim,smooth);
    return this.aimPoint.clone();
  }

  getMuzzlePos(){
    const fwd=new THREE.Vector3(Math.sin(this.group.rotation.y),0,Math.cos(this.group.rotation.y));
    const mp=this.group.position.clone();
    mp.y+=1.22;
    mp.addScaledVector(fwd,.96);
    return mp;
  }

  triggerDodge(preferredDir=0,urgency=1){
    if(this.dodgeCD>0||this.dodgeT>0)return;
    this.dodgeDir=preferredDir||(Math.random()<.5?-1:1);
    this.dodgeT=(0.34+Math.random()*.24)*Math.max(.86,Math.min(1.14,urgency));
    this.dodgeSpd=this.speed*(1.30+this.aimSkill*.16)*Math.max(.96,Math.min(1.08,urgency));
    this.dodgeCD=.88+Math.random()*.62;
    if(Math.random()<0.16*urgency&&this.jV===0)this.jV=4.6+Math.random()*1.6;
  }

  startReload(){
    if(this.reloadT<=0){
      this.reloadT=this.weapon.reload*(0.86+Math.random()*.18);
      playWeaponMechanicSound('reload',.32,this.weapon.key,this.group.position);
    }
  }
  finishReload(){
    this.mag=this.weapon.clip;this.reloadT=0;
    playWeaponMechanicSound('reloadDone',.24,this.weapon.key,this.group.position);
  }

  maybePlantMine(dist,tp){
    if(this.mineCD>0||!this.canSeeTarget||!tp||dist>BOT_MINE_CFG.triggerRange)return false;
    if(mines.length>=MAX_MINES||countTeamMines(this.team)>=BOT_MAX_TEAM_MINES)return false;
    let chance=dist<6?.42:dist<9?.30:.18;
    if(this.role==='engineer')chance*=1.55;
    if(this.role==='anchor')chance*=0.65;
    if(this.commandDoctrine==='hold'||this.commandDoctrine==='retake')chance*=1.22;
    if(this.commandDoctrine==='breach')chance*=.72;
    if(Math.random()>chance)return false;
    const dir=new THREE.Vector3(Math.sin(this.group.rotation.y),0,Math.cos(this.group.rotation.y));
    const m=mkMine();
    m.position.copy(this.group.position.clone().addScaledVector(dir,.65));
    scene.add(m);
    mines.push({m,vx:dir.x*2.2,vy:3.2,vz:dir.z*2.2,fall:true,life:Infinity,armed:false,aT:.95+Math.random()*.45,checkT:.08+Math.random()*.10,ph:0,team:this.team,owner:'bot',src:this,dmg:BOT_MINE_CFG.dmg*BOT_DAMAGE_BOOST*EXPLOSION_DAMAGE_BOOST*this.baseDmgMul});
    this.mineCD=BOT_MINE_CFG.cooldown;
    return true;
  }

  maybePlantBomb(dist,tp){
    if(this.bombCD>0||!this.canSeeTarget||!tp)return false;
    if(dist<BOT_BOMB_CFG.minRange||dist>BOT_BOMB_CFG.maxRange)return false;
    if(mines.length>=MAX_MINES||activeBombCount()>=BOT_MAX_ACTIVE_BOMBS)return false;
    const pos=this.group.position.clone();
    if(bombNearPoint(pos,24))return false;
    let chance=this.role==='engineer'?.19:this.role==='anchor'?.12:.075;
    chance*=1+Math.min(.65,level*.018+kills*.002);
    if(this.commandDoctrine==='breach')chance*=this.role==='engineer'?1.48:1.22;
    else if(this.commandDoctrine==='hold')chance*=.70;
    if(Math.random()>chance)return false;
    const dir=new THREE.Vector3(Math.sin(this.group.rotation.y),0,Math.cos(this.group.rotation.y));
    const m=mkBomb();
    const bp=this.group.position.clone().addScaledVector(dir,1.05);
    const coll=collideWalls(bp.x,bp.z,.42);m.position.set(coll.x,.34,coll.z);scene.add(m);
    mines.push({
      m,vx:0,vy:0,vz:0,fall:false,life:Infinity,armed:true,aT:0,checkT:0,ph:0,
      team:this.team,owner:'bot',src:this,kind:'bomb',fuseT:BOMB_FUSE_SECONDS,fuseTotal:BOMB_FUSE_SECONDS,
      dmg:BOT_BOMB_CFG.dmg*(1+level*.018),radius:BOT_BOMB_CFG.radius
    });
    this.bombCD=BOT_BOMB_CFG.cooldown+Math.random()*24;
    return true;
  }

  registerSuppression(source,intensity=.6){
    if(!this.alive||!source||source===this||source.team===this.team)return;
    const pressure=Math.max(.3,Math.min(1.4,intensity));
    this.suppressedT=Math.max(this.suppressedT,.62+pressure*.78);
    this.suppressionSource=source;
    this.coverCooldownT=Math.min(this.coverCooldownT,.12);
    if(this.hp/this.maxHp<.72||pressure>.9){
      this.coverEvalT=Math.min(this.coverEvalT,.05);
      this.stateCD=Math.min(this.stateCD,.08);
    }
  }

  dealDamageToCurrentTarget(amount,dir){
    if(amount<=0)return;
    if(this.targetEn&&this.targetEn.alive&&this.targetEn.team!==this.team){
      this.targetEn.hurt(amount,dir,this.team,this);
      if(!this.targetEn.alive){
        this.kills=(this.kills||0)+1;
        if(this.team==='ally')allyKills++;else enemyKills++;
        updateTeamScore();
        if(typeof pushKillFeed==='function'){
          pushKillFeed(
            this.team,
            this.team==='ally'?'СВОЙ БОТ':'ВРАЖЕСКИЙ БОТ',
            this.targetEn.team,
            this.targetEn.team==='ally'?'СВОЙ БОТ':'ВРАЖЕСКИЙ БОТ',
            'bullet'
          );
        }
      }
      return;
    }
    if(this.team==='enemy'&&this.targetIsPlayer)applyDamageToPlayer(amount*ENEMY_VS_PLAYER_DAMAGE_SCALE,'bullet',this);
  }

  doShoot(tp,dist,suppressMemory=false){
    const wp=this.weapon;
    const from=this.getMuzzlePos();
    const aim=this.getAimPoint(tp);
    const wallBlocked=wallBetween(from,aim,losMeshes),smokeBlocked=smokeBlocksSight(from,aim);
    if(wallBlocked||(smokeBlocked&&!suppressMemory)){
      if(Math.random()<.20){
        const missDir=aim.clone().sub(from).normalize();
        const missCol=this.team==='ally'?0x8cbcff:wp.bCol;
        if(wp.hitscan)spawnInstantSniperTrace(from,missDir,Math.min(dist,18),missCol);
        else spawnTracer(from,missDir,Math.min(dist,18),missCol,wp.key);
      }
      return;
    }

    let dir=aim.clone().sub(from).normalize();
    const suppressing=this.tacticalMode==='suppress'||suppressMemory;
    const incomingPressure=this.suppressedT>0?1+Math.min(.48,this.suppressedT*.20):1;
    const volumePenalty=suppressing?1.14:1;
    const acc=(wp.isRocket?(this.curAcc*.50+wp.spread*.45):(this.curAcc*.40+wp.spread*.78))*incomingPressure*volumePenalty;
    dir.x+=(Math.random()-.5)*acc;
    dir.y+=(Math.random()-.5)*acc*.28;
    dir.z+=(Math.random()-.5)*acc;
    dir.normalize();

    const shotCol=this.team==='ally'?0x8cbcff:wp.bCol;
    if(friendlyInLine(from,dir,this.team,Math.max(2,dist*.88))){
      this.sT=.10+Math.random()*.12;
      return;
    }
    if(wp.isRocket&&(dist<10||friendlyNearPoint(aim,this.team,5.2))){
      this.weaponSwitchT=0;
      this.sT=.18;
      return;
    }
    emitBotCombatNoise(from,this,wp,wp.isRocket?'rocket':'shot');
    playWeaponShotSound(wp.key,this.team==='enemy'?1:.72,from);
    trigMuzzle(from,shotCol,wp.isRocket?1.45:wp.isSniper?1.38:wp.key==='shotgun'?1.2:1);
    if(wp.key!=='rocket'&&wp.key!=='plasma'){
      const q=new THREE.Quaternion().setFromAxisAngle(_UP,this.group.rotation.y);
      ejectCasing(from.clone().add(new THREE.Vector3(0,.08,0)),q,wp.key==='shotgun');
    }

    if(wp.isRocket){
      spawnERkt(from,dir,wp.dmg*BOT_DAMAGE_BOOST*EXPLOSION_DAMAGE_BOOST*this.baseDmgMul,this.team,this);
      this.mag--;
      return;
    }

    const pellets=wp.pellets||1;
    let tracerDir=dir.clone();
    if(wp.hitscan){
      const distanceDamageScale=weaponDamageScaleAtDistance(wp,dist);
      const rangePenalty=dist/(wp.range*1.55);
      const targetVx=this.targetEn&&this.targetEn.alive?(this.targetEn.velX||0):plrVx;
      const targetVz=this.targetEn&&this.targetEn.alive?(this.targetEn.velZ||0):plrVz;
      const movingPenalty=(Math.abs(targetVx)+Math.abs(targetVz))*0.01;
      let hitChance=Math.max(.10,Math.min(.982,wp.hitBias-rangePenalty-Math.random()*this.curAcc-movingPenalty));
      if(suppressing)hitChance*=.80;
      if(this.suppressedT>0)hitChance*=Math.max(.72,1-Math.min(.24,this.suppressedT*.10));
      let totalDmg=0;
      if(this.targetEn&&this.targetEn.alive){
        if(Math.random()<hitChance)totalDmg=wp.dmg*distanceDamageScale*BOT_DAMAGE_BOOST*this.baseDmgMul;
      }else if(this.team==='enemy'){
        const toPlr=new THREE.Vector3(camera.position.x-from.x,camera.position.y-from.y,camera.position.z-from.z).normalize();
        const align=dir.dot(toPlr);
        hitChance*=.72;
        if(Math.random()<hitChance&&align>.958)totalDmg=wp.dmg*distanceDamageScale*BOT_DAMAGE_BOOST*this.baseDmgMul*.88;
      }
      if(this.team==='enemy'&&this.targetIsPlayer&&totalDmg<=0&&dist>5&&(this.nearMissCd||0)<=0){
        const approach=botShotClosestApproachToPlayer(from,tracerDir,Math.max(6,Math.min(wp.range+10,dist+18)));
        if(approach&&approach.distance<=1.78){
          const pressure=registerPlayerSuppression(this,wp,approach.point,approach.distance,1.78);
          if(pressure>0)this.nearMissCd=Math.max(.16,.38-pressure*.11);
        }
      }
      spawnInstantSniperTrace(from,tracerDir,Math.min(dist,wp.range+10),shotCol);
      if(totalDmg>0)this.dealDamageToCurrentTarget(totalDmg,tracerDir);
    }else{
      const baseDamage=wp.dmg*BOT_DAMAGE_BOOST*this.baseDmgMul;
      for(let i=0;i<pellets;i++){
        const pd=dir.clone();
        if(pellets>1){
          const pe=wp.spread*(0.65+dist/Math.max(10,wp.range)*0.75);
          pd.x+=(Math.random()-.5)*pe;
          pd.y+=(Math.random()-.5)*pe*.34;
          pd.z+=(Math.random()-.5)*pe;
          pd.normalize();
        }
        if(i===0)tracerDir.copy(pd);
        const pelletDamage=baseDamage*(pellets>1?.58:1);
        const playerDamage=pelletDamage*ENEMY_VS_PLAYER_DAMAGE_SCALE*(pellets>1?.79:.88);
        spawnEnemyBullet(from,pd,wp,this,{
          visual:i===0,damage:pelletDamage,playerDamage,
          suppressing
        });
      }
    }
    this.mag--;
  }

  update(dt){
    if(!this.alive)return false;
    this.syncScale();
    this.ph+=dt*3;
    if(this.lastDamageT>0)this.lastDamageT-=dt;
    if(this.suppressedT>0){this.suppressedT=Math.max(0,this.suppressedT-dt);if(this.suppressedT<=0)this.suppressionSource=null;}
    if(this.flankEvalT>0)this.flankEvalT-=dt;
    if(this.flankCommitT>0)this.flankCommitT-=dt;
    if(this.unstuckT>0)this.unstuckT=Math.max(0,this.unstuckT-dt);
    if(this.nearMissCd>0)this.nearMissCd-=dt;
    if(this.coverChainT>0)this.coverChainT=Math.max(0,this.coverChainT-dt);
    if(this.peekT>0)this.peekT=Math.max(0,this.peekT-dt);
    if(this.peekCooldownT>0)this.peekCooldownT=Math.max(0,this.peekCooldownT-dt);
    if(this.peekT<=0)this.peekPoint=null;

    if(this.flashT>0){this.flashT-=dt;if(this.flashT<=0)this.pts.forEach(p=>{if(p.material&&p.material.emissive)p.material.emissive.setRGB(0,0,0);});}

    if(this.jV!==0||this.group.position.y>0){
      this.jV-=22*dt;this.group.position.y+=this.jV*dt;
      if(this.group.position.y<=0){this.group.position.y=0;this.jV=0;}
    }

    if(this.dodgeCD>0)this.dodgeCD-=dt;
    if(this.mineCD>0)this.mineCD-=dt;
    if(this.bombCD>0)this.bombCD-=dt;
    if(this.reloadT>0){this.reloadT-=dt;if(this.reloadT<=0)this.finishReload();}

    this._lastDt=dt;
    if(this.reactionT>0)this.reactionT-=dt;
    if(this.burstPauseT>0)this.burstPauseT-=dt;
    if(this.targetLockT>0)this.targetLockT-=dt;
    if(this.coverCooldownT>0)this.coverCooldownT-=dt;
    syncPlayerCombatNoise();this.hearCombatNoise(dt);
    this.findTarget();
    const targetPos=this.getTargetPos();
    if(!targetPos)this.aiState='patrol';

    const myX=this.group.position.x,myZ=this.group.position.z;
    let dx=0,dz=0,dist=999;
    if(targetPos){dx=targetPos.x-myX;dz=targetPos.z-myZ;dist=Math.sqrt(dx*dx+dz*dz)+0.001;}

    this.mineScanT-=dt;
    if(this.mineScanT<=0){
      this.mineScanT=.16+Math.random()*.12;
      this.cachedMineThreat=nearestHostileMine(this.group.position,this.team,this.role==='engineer'?18:20,this);
    }
    const mineThreat=this.cachedMineThreat&&!this.cachedMineThreat.mine.removed?this.cachedMineThreat:null;
    this.grenadeScanT-=dt;
    if(this.grenadeScanT<=0){
      this.grenadeScanT=.10+Math.random()*.08;
      this.cachedGrenadeThreat=nearestHostileGrenade(this,this.role==='assault'?9:11);
    }
    const grenadeThreat=this.cachedGrenadeThreat&&this.cachedGrenadeThreat.grenade?.fuse>0?this.cachedGrenadeThreat:null;
    if((mineThreat||grenadeThreat)&&this.dodgeT<=0){
      this.aiState='retreat';
      this.stateCD=.45;
      this.coverPoint=null;this.peekPoint=null;this.peekT=0;
    }

    this.weaponSwitchT-=dt;
    if(targetPos&&(this.weaponSwitchT<=0||dist>this.weapon.range*1.18||(dist<8&&this.weapon.isRocket)||(this.weapon.key==='shotgun'&&dist>22))){
      this.chooseWeapon(dist,false);
    }

    this.losT-=dt;
    if(this.losT<=0&&targetPos){
      this.losT=this.team==='ally' ? (.16+Math.random()*.09) : (.22+Math.random()*.12);
      const eye=this.group.position.clone();eye.y+=1.48;
      const th=targetPos.clone();th.y+=(this.targetEn&&this.targetEn.alive)?1.24:0;
      const sawBefore=this.canSeeTarget;
      this.canSeeTarget=!wallBetween(eye,th,losMeshes)&&!smokeBlocksSight(eye,th);
      if(this.canSeeTarget){
        const targetVx=this.targetEn&&this.targetEn.alive?(this.targetEn.velX||0):plrVx;
        const targetVz=this.targetEn&&this.targetEn.alive?(this.targetEn.velZ||0):plrVz;
        this.lastKnownVel.x+=(targetVx-this.lastKnownVel.x)*.55;
        this.lastKnownVel.z+=(targetVz-this.lastKnownVel.z)*.55;
        this.lastKnown.copy(targetPos);this.lastSeenT=0;this.lastTargetSeenAt=performance.now();
        this.searchPoint=null;this.searchStep=0;
        TEAM_INTEL[this.team].pos.copy(targetPos);TEAM_INTEL[this.team].time=performance.now();TEAM_INTEL[this.team].target=this.targetEn||'player';
        if(!sawBefore)this.reactionT=Math.max(this.reactionT,.12+(1-this.aimSkill)*.32);
      }
    }
    this.lastSeenT+=dt;
    const hpPct=this.hp/this.maxHp;
    const localThreats=this.nearbyThreatCount(18);
    const opponentWeapon=this.currentTargetWeapon();
    const squadPlan=refreshBotTeamTactics(this.team);
    this.commandDoctrine=squadPlan.doctrine;
    const mapObjective=botObjectivePoint(this,squadPlan);
    const assaultWaveState=botAssaultWaveState(squadPlan);
    const objectiveDist=mapObjective?this.group.position.distanceTo(mapObjective):999;
    const activeFrontline=frontlineZone();
    const frontlineDist=Math.hypot(this.group.position.x-activeFrontline.x,this.group.position.z-activeFrontline.z);
    const frontlineContested=frontlineObjective.allyPresence>.20&&frontlineObjective.enemyPresence>.20;
    const frontlineBehind=frontlineObjective.owner&&frontlineObjective.owner!==this.team;
    const friendlyPresence=this.team==='ally'?frontlineObjective.allyPresence:frontlineObjective.enemyPresence;
    const hostilePresence=this.team==='ally'?frontlineObjective.enemyPresence:frontlineObjective.allyPresence;
    const objectiveUrgency=Math.max(0,Math.min(1.35,(frontlineContested?.72:.18)+(frontlineBehind?.34:0)+Math.max(0,hostilePresence-friendlyPresence)*.16));
    const frontlineCommitted=frontlineDist<squadPlan.zoneRadius*.95&&(frontlineContested||frontlineBehind);
    const strategicRetreat=hpPct<.18||!frontlineCommitted||localThreats>=4;
    const focusMatches=botMatchesSquadFocus(this,squadPlan);
    const roleFlanker=this.role==='flankL'||this.role==='flankR';
    const supportMate=squadPlan.wounded&&squadPlan.wounded!==this&&squadPlan.wounded.alive?squadPlan.wounded:null;
    const supportDist=supportMate?this.group.position.distanceTo(supportMate.group.position):999;
    const supportReady=!!supportMate&&(this.role==='engineer'||this.role==='anchor')&&supportDist<34&&hpPct>.42&&!(this.canSeeTarget&&dist<12);
    const coordinatedFlank=roleFlanker&&focusMatches&&!!squadPlan.suppressor&&hpPct>.38&&!this.reloadT&&targetPos&&dist>10;
    const mapOrderWanted=!!mapObjective&&(
      !targetPos||
      (assaultWaveState==='staging'&&objectiveDist>squadPlan.zoneRadius*.42)||
      (assaultWaveState==='active'&&(squadPlan.doctrine==='breach'||squadPlan.doctrine==='retake')&&objectiveDist>squadPlan.zoneRadius*.34&&(!this.canSeeTarget||dist>10))||
      (squadPlan.doctrine==='hold'&&objectiveDist>squadPlan.zoneRadius*.62&&(!this.canSeeTarget||dist>24))||
      (frontlineContested&&objectiveDist>squadPlan.zoneRadius*.48&&(!this.canSeeTarget||dist>18))||
      (frontlineBehind&&objectiveDist>squadPlan.zoneRadius*.55&&(!this.canSeeTarget||dist>16))||
      ((squadPlan.doctrine==='push'||squadPlan.doctrine==='retake'||squadPlan.doctrine==='breach')&&!this.canSeeTarget&&this.lastSeenT>2.2&&objectiveDist>4.2)
    );
    if(this.flankEvalT<=0&&coordinatedFlank){
      const sign=this.role==='flankL'?-1:1;
      const nextFlank=this.findFlankPoint(squadPlan.focusPos,sign);
      if(nextFlank){this.flankPoint=nextFlank;this.flankCommitT=(squadPlan.doctrine==='breach'?3.5:2.6)+Math.random()*1.2;}
      this.flankEvalT=(squadPlan.doctrine==='breach'?.58:.82)+Math.random()*.42;
    }
    if(!coordinatedFlank&&this.flankCommitT<=0)this.flankPoint=null;
    const breachRole=squadPlan.breachReady&&assaultWaveState==='active'&&this.role==='assault'&&focusMatches;
    this.tacticalMode=squadPlan.suppressor===this&&focusMatches&&squadPlan.flankerCount>0?'suppress':
      this.flankPoint&&this.flankCommitT>0?'flank':breachRole?'breach':supportReady?'support':'normal';
    maybeCoordinateBotUtility(this,squadPlan,targetPos,dist,assaultWaveState);
    if(this.mag<=Math.max(1,Math.ceil(this.weapon.clip*.22))&&!this.reloadT&&(!this.canSeeTarget||dist>this.weapon.opt*1.15))this.startReload();
    if((hpPct<.38||(hpPct<.56&&this.reloadT>0))&&(!this.pickupTarget||!this.pickupTarget.m.visible)){
      this.pickupTarget=this.findReachableHealthPickup(30);
    }

    this.coverEvalT-=dt;
    if(this.coverEvalT<=0&&targetPos&&this.coverCooldownT<=0){
      const needCover=(!this.canSeeTarget&&dist>10)||(hpPct<0.52)||(this.reloadT>0)||(this.role==='anchor'&&dist>12)||(this.lastDamageT>0&&dist>8)||(this.suppressedT>0);
      const nextCover=needCover?this.findTacticalCover(targetPos):null;
      if(nextCover&&(!this.coverPoint||this.coverPoint.distanceToSquared(nextCover)>.64))this.coverHoldT=.28+Math.random()*.42;
      this.coverPoint=nextCover;
      this.coverEvalT=.82+Math.random()*.48;
    }

    this.aiT+=dt;this.stateCD-=dt;
    if(this.stateCD<=0){
      if(this.pickupTarget&&this.pickupTarget.m.visible&&hpPct<.48)this.aiState='resupply';
      else if(targetPos&&strategicRetreat&&((hpPct<0.25&&dist<20)||(localThreats>=3&&hpPct<.58)))this.aiState='retreat';
      else if(targetPos&&supportReady&&this.tacticalMode==='support')this.aiState='support';
      else if(targetPos&&this.coverPoint&&(!this.canSeeTarget||this.role==='anchor'||this.reloadT>0||(localThreats>=3&&hpPct<.72)||this.suppressedT>0))this.aiState='cover';
      else if(targetPos&&this.flankPoint&&this.flankCommitT>0&&this.tacticalMode==='flank')this.aiState='flank';
      else if(mapOrderWanted)this.aiState='objective';
      else if(targetPos&&this.canSeeTarget&&dist<=this.weapon.range*(this.team==='ally'?1.14:1.08))this.aiState='engage';
      else if(targetPos&&this.lastSeenT<8.5)this.aiState='hunt';
      else if(targetPos&&this.lastSeenT<14.5)this.aiState='search';
      else this.aiState=mapObjective?'objective':'patrol';
      this.stateCD=.22+Math.random()*.30;
    }

    let mx=0,mz=0;
    const spd=this.speed;
    if(grenadeThreat){
      const gp=grenadeThreat.grenade.m.position;
      const awayX=this.group.position.x-gp.x,awayZ=this.group.position.z-gp.z;
      const gd=Math.max(.001,Math.hypot(awayX,awayZ));
      const sideX=-awayZ/gd*this.sideBias,sideZ=awayX/gd*this.sideBias;
      mx=(awayX/gd)*spd*1.30+sideX*spd*.30;
      mz=(awayZ/gd)*spd*1.30+sideZ*spd*.30;
      this.desiredYaw=Math.atan2(awayX,awayZ);
    }else if(mineThreat){
      const awayX=this.group.position.x-mineThreat.mine.m.position.x;
      const awayZ=this.group.position.z-mineThreat.mine.m.position.z;
      const md=Math.max(.001,Math.hypot(awayX,awayZ));
      mx=(awayX/md)*spd*1.34;
      mz=(awayZ/md)*spd*1.34;
      this.desiredYaw=Math.atan2(awayX,awayZ);
    }else if(this.unstuckT>0){
      const fwdX=Math.sin(this.group.rotation.y),fwdZ=Math.cos(this.group.rotation.y);
      const rightX=Math.cos(this.group.rotation.y),rightZ=-Math.sin(this.group.rotation.y);
      mx=rightX*this.unstuckDir*spd*.92-fwdX*spd*.22;
      mz=rightZ*this.unstuckDir*spd*.92-fwdZ*spd*.22;
      this.desiredYaw+=this.unstuckDir*dt*.85;
    }else if(this.dodgeT>0&&targetPos){
      this.dodgeT-=dt;
      const px=-dz/dist,pz=dx/dist;
      mx=px*this.dodgeDir*this.dodgeSpd;mz=pz*this.dodgeDir*this.dodgeSpd;
      this.desiredYaw=Math.atan2(dx,dz);
    }else switch(this.aiState){
      case 'objective':{
        if(mapObjective){
          const ox=mapObjective.x-myX,oz=mapObjective.z-myZ,od=Math.hypot(ox,oz)+.001;
          const stopR=squadPlan.doctrine==='hold'?(this.role==='anchor'?3.8:4.8):3.2;
          const baseSpeedM=squadPlan.doctrine==='breach'?(this.role==='assault'?1.14:1.06):squadPlan.doctrine==='push'?(this.role==='assault'?1.12:1.02):squadPlan.doctrine==='retake'?1.08:.82;
          const waveSpeedM=assaultWaveState==='staging'?.78:assaultWaveState==='active'?1.10:1;
          const speedM=(baseSpeedM+objectiveUrgency*.12)*waveSpeedM;
          if(targetPos&&this.canSeeTarget)this.desiredYaw=Math.atan2(dx,dz);
          else this.desiredYaw=Math.atan2(ox||((this.team==='ally'?1:-1)*.01),oz);
          if(od>stopR){
            mx=(ox/od)*spd*speedM;mz=(oz/od)*spd*speedM;
          }else if(targetPos){
            const px=-dz/dist,pz=dx/dist;
            const orbit=this.role==='anchor'?.16:.28;
            mx=px*this.sideBias*spd*orbit;mz=pz*this.sideBias*spd*orbit;
          }else{
            const enemyDir=this.team==='ally'?1:-1;
            this.desiredYaw=Math.atan2(enemyDir,0);
          }
        }else this.aiState='patrol';
        break;
      }
      case 'patrol':{
        const wx=this.ptgt.x-myX,wz=this.ptgt.z-myZ,wd=Math.sqrt(wx*wx+wz*wz);
        if(wd<3){
          this.patrolIdx=(this.patrolIdx+1+Math.floor(Math.random()*3))%WPTS.length;
          const wp=WPTS[this.patrolIdx];
          this.ptgt.set(wp[0]+(Math.random()-.5)*8,0,wp[1]+(Math.random()-.5)*8);
        }else{mx=(wx/wd)*spd*.64;mz=(wz/wd)*spd*.64;this.desiredYaw=Math.atan2(wx,wz);} 
        break;
      }
      case 'cover':{
        if(this.coverPoint){
          if(!this.peekPoint&&this.peekCooldownT<=0&&targetPos&&this.reloadT<=0){
            const tx=targetPos.x-this.coverPoint.x,tz=targetPos.z-this.coverPoint.z,td=Math.max(.001,Math.hypot(tx,tz));
            const px=-tz/td,pz=tx/td;
            for(const sign of [this.sideBias,-this.sideBias]){
              const rawX=this.coverPoint.x+px*sign*1.35,rawZ=this.coverPoint.z+pz*sign*1.35;
              const coll=collideWalls(rawX,rawZ,BOT_R);
              if(Math.hypot(coll.x-rawX,coll.z-rawZ)>.55)continue;
              const eye=new THREE.Vector3(coll.x,1.38,coll.z),tgt=targetPos.clone();tgt.y+=1.15;
              if(!wallBetween(eye,tgt,losMeshes)&&!smokeBlocksSight(eye,tgt)){
                this.peekPoint=new THREE.Vector3(coll.x,0,coll.z);this.peekDuration=.92+Math.random()*.34;this.peekT=this.peekDuration;
                this.peekCooldownT=1.25+Math.random()*.85;this.sideBias=sign;break;
              }
            }
          }
          let coverGoal=this.coverPoint,peekMoveM=.98;
          if(this.peekPoint&&this.peekT>0&&this.peekDuration>0){
            const p=Math.max(0,Math.min(1,1-this.peekT/this.peekDuration));
            const envelope=p<.24?p/.24:p>.72?(1-p)/.28:1;
            coverGoal=this.coverPoint.clone().lerp(this.peekPoint,Math.max(0,envelope));
            peekMoveM=.68;
          }
          const cx=coverGoal.x-myX,cz=coverGoal.z-myZ,cd=Math.sqrt(cx*cx+cz*cz)+0.001;
          if(cd>(this.peekPoint?.42:1.4)){mx=(cx/cd)*spd*peekMoveM;mz=(cz/cd)*spd*peekMoveM;}
          else{
            this.coverHoldT-=dt;
            if(this.reloadT<=0&&this.coverHoldT<=0){
              const canChain=(squadPlan.doctrine==='breach'||squadPlan.doctrine==='retake')&&assaultWaveState==='active'&&targetPos&&mapObjective&&this.coverChainT<=0;
              const nextCover=canChain?this.findTacticalCover(targetPos):null;
              const advances=nextCover&&nextCover.distanceToSquared(this.group.position)>6.25&&
                nextCover.distanceTo(mapObjective)+1.2<this.group.position.distanceTo(mapObjective);
              if(advances){
                this.coverPoint=nextCover;this.coverHoldT=.16+Math.random()*.22;this.coverChainT=.72+Math.random()*.35;
              }else{
                this.coverPoint=null;this.coverCooldownT=.95+Math.random()*.70;
                this.aiState=this.canSeeTarget?'engage':'hunt';this.stateCD=.32;
              }
            }
          }
          if(targetPos)this.desiredYaw=Math.atan2(dx,dz);
        }
        break;
      }
      case 'hunt':{
        let tx=this.canSeeTarget&&targetPos?targetPos.x:this.lastKnown.x;
        let tz=this.canSeeTarget&&targetPos?targetPos.z:this.lastKnown.z;
        const intel=TEAM_INTEL[this.team];
        if(!this.canSeeTarget){
          const memoryLead=Math.min(1.45,this.lastSeenT)*.72;
          tx+=this.lastKnownVel.x*memoryLead;tz+=this.lastKnownVel.z*memoryLead;
          const intelMatches=this.targetIsPlayer?intel.target==='player':intel.target===this.targetEn;
          if(intelMatches&&performance.now()-intel.time<4500&&intel.time>this.lastTargetSeenAt){
            tx=intel.pos.x;tz=intel.pos.z;
          }
        }
        if(this.role==='flankL'||this.role==='flankR'){
          const sign=this.role==='flankL'?-1:1;
          const fd=Math.max(1,dist);
          tx+=(-dz/fd)*(10+Math.min(8,dist*.12))*sign;
          tz+=(dx/fd)*(10+Math.min(8,dist*.12))*sign;
        }
        const hx=tx-myX,hz=tz-myZ,hd=Math.sqrt(hx*hx+hz*hz)+0.001;
        if(hd>2){mx=(hx/hd)*spd*1.06;mz=(hz/hd)*spd*1.06;this.desiredYaw=Math.atan2(hx,hz);} 
        break;
      }
      case 'flank':{
        if(this.flankPoint&&targetPos){
          const fx=this.flankPoint.x-myX,fz=this.flankPoint.z-myZ,fd=Math.hypot(fx,fz)+.001;
          this.desiredYaw=this.canSeeTarget?Math.atan2(dx,dz):Math.atan2(fx,fz);
          if(fd>2.2){mx=(fx/fd)*spd*1.12;mz=(fz/fd)*spd*1.12;}
          if(fd<=2.2||(this.canSeeTarget&&this.flankCommitT<.72)){
            this.flankPoint=null;this.flankCommitT=0;this.aiState='engage';this.stateCD=.36;
          }
        }else{this.flankPoint=null;this.aiState=targetPos?'hunt':'patrol';}
        break;
      }
      case 'support':{
        const mate=supportMate;
        if(mate&&mate.alive){
          const sx=mate.group.position.x-myX,sz=mate.group.position.z-myZ,sd=Math.hypot(sx,sz)+.001;
          if(targetPos)this.desiredYaw=Math.atan2(dx,dz);else this.desiredYaw=Math.atan2(sx,sz);
          if(sd>7.2){mx=(sx/sd)*spd*.94;mz=(sz/sd)*spd*.94;}
          else if(sd<3.6){mx=-(sx/sd)*spd*.36;mz=-(sz/sd)*spd*.36;}
          else if(targetPos){
            const px=-dz/dist,pz=dx/dist;
            mx=px*this.sideBias*spd*.34;mz=pz*this.sideBias*spd*.34;
          }
        }else{this.aiState=targetPos?'hunt':'patrol';this.stateCD=.32;}
        break;
      }
      case 'search':{
        if(!this.searchPoint||this.searchPoint.distanceToSquared(this.group.position)<3.2){
          this.searchStep++;
          let found=null;
          const baseR=4.0+Math.min(8.5,this.lastSeenT*.55);
          for(let attempt=0;attempt<7;attempt++){
            const ang=this.searchStep*2.399963+this.sideBias*.36+attempt*.58;
            const rad=baseR*(.62+attempt*.075);
            const sx=Math.max(-91,Math.min(91,this.lastKnown.x+Math.cos(ang)*rad));
            const sz=Math.max(-91,Math.min(91,this.lastKnown.z+Math.sin(ang)*rad));
            const sc=collideWalls(sx,sz,BOT_R);
            if(Math.hypot(sc.x-sx,sc.z-sz)<.22){found=new THREE.Vector3(sc.x,0,sc.z);break;}
          }
          this.searchPoint=found||this.lastKnown.clone().setY(0);
        }
        if(this.searchPoint){
          const sx=this.searchPoint.x-myX,sz=this.searchPoint.z-myZ,sd=Math.hypot(sx,sz)+.001;
          this.desiredYaw=Math.atan2(sx,sz);
          if(sd>1.55){mx=(sx/sd)*spd*.92;mz=(sz/sd)*spd*.92;}
          else{this.searchPoint=null;this.sideBias*=-1;}
        }
        break;
      }
      case 'engage':{
        if(!targetPos)break;
        this.desiredYaw=Math.atan2(dx,dz);
        this.strafeSwitchT-=dt;
        if(this.strafeSwitchT<=0){this.strafeDir*=-1;this.strafeSwitchT=.55+Math.random()*.75;}
        const px=-dz/dist,pz=dx/dist;
        let optRange=this.weapon.opt*(this.role==='anchor'?1.24:this.role==='assault'?0.78:1.0);
        if(this.role==='engineer')optRange*=0.92;
        let strafeM=this.tacticalMode==='suppress'?.48:.82;
        if(this.tacticalMode==='suppress')optRange*=1.08;
        if(opponentWeapon){
          if(opponentWeapon.key==='shotgun')optRange=Math.max(optRange,18);
          else if(opponentWeapon.isRocket){optRange=Math.max(optRange,17);strafeM=1.02;}
          else if(opponentWeapon.isSniper){
            strafeM=1.08;
            if(this.weapon.key==='shotgun'||this.role==='assault')optRange=Math.min(optRange,21);
            else optRange=Math.max(optRange,30);
            this.strafeSwitchT=Math.min(this.strafeSwitchT,.48+Math.random()*.22);
          }
        }
        mx=px*this.strafeDir*spd*strafeM;mz=pz*this.strafeDir*spd*strafeM;
        const objectivePull=frontlineContested?.40:frontlineBehind?.31:(squadPlan.doctrine==='hold'?.46:0);
        if(objectivePull>0&&mapObjective&&objectiveDist>squadPlan.zoneRadius*.58){
          const ox=mapObjective.x-myX,oz=mapObjective.z-myZ,od=Math.max(.001,Math.hypot(ox,oz));
          mx+=(ox/od)*spd*objectivePull;mz+=(oz/od)*spd*objectivePull;
        }
        if(this.role==='flankL'||this.role==='flankR'){
          const sign=this.role==='flankL'?-1:1;
          mx+=px*sign*spd*.24;mz+=pz*sign*spd*.24;
        }
        if(dist<optRange*.54){mx-=(dx/dist)*spd*.52*this.bravery;mz-=(dz/dist)*spd*.52*this.bravery;}
        else if(dist>this.weapon.range*.82){mx+=(dx/dist)*spd*.70;mz+=(dz/dist)*spd*.70;}
        if(this.role==='anchor'&&this.coverPoint){
          const cdx=this.coverPoint.x-myX,cdz=this.coverPoint.z-myZ;
          mx+=cdx*.05;mz+=cdz*.05;
        }
        break;
      }
      case 'resupply':{
        const pk=this.pickupTarget;
        if(pk&&pk.m.visible){
          const hx=pk.m.position.x-myX,hz=pk.m.position.z-myZ,hd=Math.hypot(hx,hz)+.001;
          this.desiredYaw=Math.atan2(hx,hz);
          if(hd>1.05){mx=(hx/hd)*spd*1.08;mz=(hz/hd)*spd*1.08;}
          else{claimHealthPickup(this,pk);this.aiState=targetPos?'hunt':'patrol';this.stateCD=.45;}
        }else{this.pickupTarget=null;this.aiState=targetPos?'hunt':'patrol';}
        break;
      }
      case 'retreat':{
        if(targetPos){
          this.desiredYaw=Math.atan2(dx,dz);
          mx=-(dx/dist)*spd*1.24;mz=-(dz/dist)*spd*1.24;
          const px=-dz/dist,pz=dx/dist;
          mx+=px*this.sideBias*spd*.22;mz+=pz*this.sideBias*spd*.22;
          if(dist>26&&hpPct>.28){this.aiState='hunt';this.stateCD=.6;}
        }
        break;
      }
    }

    const sep=separationVector(this,3.5);
    mx+=sep.x*spd*.75; mz+=sep.z*spd*.75;
    const wallSteered=steerBotAroundWalls(this,mx,mz);
    const steered=steerBotAroundSmoke(this,wallSteered.x,wallSteered.z);
    const urgentMove=!!grenadeThreat||!!mineThreat||this.dodgeT>0||this.unstuckT>0;
    const maxMoveM=grenadeThreat?BOT_MOVE_CFG.mineMaxM:mineThreat?BOT_MOVE_CFG.mineMaxM:this.dodgeT>0?BOT_MOVE_CFG.dodgeMaxM:
      this.aiState==='retreat'?BOT_MOVE_CFG.retreatMaxM:BOT_MOVE_CFG.normalMaxM;
    const cappedDesired=clampBotVelocity(steered.x,steered.z,spd*maxMoveM);
    const desiredMoveX=cappedDesired.x,desiredMoveZ=cappedDesired.z;
    const desiredMoveSpeed=Math.hypot(desiredMoveX,desiredMoveZ);
    const currentMoveSpeed=Math.hypot(this.motionX,this.motionZ);
    const response=urgentMove?11.5:(desiredMoveSpeed>currentMoveSpeed+.08?5.6:8.2);
    const responseT=1-Math.exp(-response*dt);
    let nextMotionX=this.motionX+(desiredMoveX-this.motionX)*responseT;
    let nextMotionZ=this.motionZ+(desiredMoveZ-this.motionZ)*responseT;
    const dvx=nextMotionX-this.motionX,dvz=nextMotionZ-this.motionZ,dv=Math.hypot(dvx,dvz);
    const maxDv=spd*(urgentMove?BOT_MOVE_CFG.urgentAccelM:BOT_MOVE_CFG.maxAccelM)*dt;
    if(dv>maxDv&&dv>.0001){
      const dm=maxDv/dv;nextMotionX=this.motionX+dvx*dm;nextMotionZ=this.motionZ+dvz*dm;
    }
    const cappedMotion=clampBotVelocity(nextMotionX,nextMotionZ,spd*maxMoveM);
    this.motionX=cappedMotion.x;this.motionZ=cappedMotion.z;
    if(desiredMoveSpeed<.05&&Math.hypot(this.motionX,this.motionZ)<.08){
      this.motionX=0;this.motionZ=0;
    }
    mx=this.motionX;mz=this.motionZ;

    const movedPos=moveBotWithSubsteps(myX,myZ,mx,mz,dt);
    this.group.position.x=movedPos.x;this.group.position.z=movedPos.z;
    this.velX=(this.group.position.x-myX)/Math.max(dt,.001);
    this.velZ=(this.group.position.z-myZ)/Math.max(dt,.001);
    const actualCap=clampBotVelocity(this.velX,this.velZ,spd*maxMoveM*1.04);
    this.velX=actualCap.x;this.velZ=actualCap.z;
    this.motionX=this.velX;this.motionZ=this.velZ;
    this.group.rotation.y=lerpAngle(this.group.rotation.y,this.desiredYaw,Math.min(1,dt*(5.2+this.aimSkill*3.2)));
    const peekProgress=this.peekPoint&&this.peekDuration>0?Math.max(0,Math.min(1,1-this.peekT/this.peekDuration)):0;
    const peekEnvelope=peekProgress<.24?peekProgress/.24:peekProgress>.72?(1-peekProgress)/.28:1;
    const targetPeekLean=this.peekPoint?(-this.sideBias*.105*Math.max(0,peekEnvelope)):0;
    this.peekLean+=(targetPeekLean-this.peekLean)*(1-Math.exp(-dt*11));
    this.group.rotation.z+=(this.peekLean-this.group.rotation.z)*(1-Math.exp(-dt*12));
    const intended=Math.hypot(mx,mz);
    const moved=Math.hypot(this.group.position.x-myX,this.group.position.z-myZ);
    if(intended>.6&&moved<.015)this.stuckT+=dt;else this.stuckT=Math.max(0,this.stuckT-dt*2);
    if(this.stuckT>.55){
      this.stuckT=0;this.strafeDir*=-1;this.sideBias*=-1;
      this.unstuckDir=this.sideBias;this.unstuckT=.48+Math.random()*.18;
      this.motionX*=.35;this.motionZ*=.35;
      this.coverPoint=null;this.flankPoint=null;this.flankCommitT=0;
      const wp=WPTS[(Math.random()*WPTS.length)|0];this.ptgt.set(wp[0]+(Math.random()-.5)*6,0,wp[1]+(Math.random()-.5)*6);
    }

    const actualSpeed=Math.hypot(this.velX,this.velZ);
    if(actualSpeed>.65&&moved>.0005){
      this.footstepDistance+=Math.min(.55,moved);
      const runningStep=actualSpeed>this.speed*.90;
      const stride=runningStep?1.54:2.02;
      if(this.footstepDistance>=stride){
        this.footstepDistance%=stride;
        if(this.group.position.distanceToSquared(camera.position)<1764)playFootstepSound(this.group.position,runningStep,true);
      }
    }
    const gaitFollow=1-Math.exp(-dt*(actualSpeed>this.gaitSpeed?10.5:14));
    this.gaitSpeed+=(actualSpeed-this.gaitSpeed)*gaitFollow;
    if(this.gaitSpeed<.025)this.gaitSpeed=0;
    const gaitNorm=Math.min(1.18,this.gaitSpeed/Math.max(1,this.speed));
    if(moved>.0005)this.gaitPhase+=moved*(2.05+Math.min(.55,gaitNorm*.32));

    const yaw=this.group.rotation.y;
    const fwdX=Math.sin(yaw),fwdZ=Math.cos(yaw);
    const rightX=Math.cos(yaw),rightZ=-Math.sin(yaw);
    const localForward=this.velX*fwdX+this.velZ*fwdZ;
    const localSide=this.velX*rightX+this.velZ*rightZ;
    const reverseStride=(Math.abs(localForward)>Math.abs(localSide)*.72&&localForward<-.12)?-1:1;
    const sideRatio=this.gaitSpeed>.15?Math.max(-1,Math.min(1,localSide/this.gaitSpeed)):0;
    const strideAmp=Math.min(.52,gaitNorm*.47);
    const strideWave=Math.sin(this.gaitPhase)*reverseStride;
    const leftSwing=strideWave*strideAmp,rightSwing=-leftSwing;
    const leftLift=Math.max(0,Math.sin(this.gaitPhase+.42))*gaitNorm;
    const rightLift=Math.max(0,Math.sin(this.gaitPhase+Math.PI+.42))*gaitNorm;
    const strideBob=Math.cos(this.gaitPhase*2)*.018*gaitNorm;
    const hipSway=Math.sin(this.gaitPhase)*.018*gaitNorm;
    const strafeRoll=sideRatio*.060*gaitNorm;
    const forwardRatio=this.gaitSpeed>.15?Math.max(-1,Math.min(1,localForward/this.gaitSpeed)):0;
    const bodyLean=forwardRatio*.036*gaitNorm;
    const combatPose=(this.aiState==='engage'||this.aiState==='flank'||this.aiState==='support'||this.aiState==='objective')&&this.canSeeTarget;
    const armScale=combatPose?.18:.56;

    if(this.pts[8]){
      this.pts[8].rotation.x=leftSwing;
      this.pts[8].rotation.z=-strafeRoll;
    }
    if(this.pts[9]){
      this.pts[9].rotation.x=rightSwing;
      this.pts[9].rotation.z=-strafeRoll;
    }
    if(this.pts[10]){
      this.pts[10].rotation.x=-leftSwing*.22+leftLift*.34;
      this.pts[10].rotation.z=strafeRoll*.45;
    }
    if(this.pts[11]){
      this.pts[11].rotation.x=-rightSwing*.22+rightLift*.34;
      this.pts[11].rotation.z=strafeRoll*.45;
    }
    if(this.pts[12]){
      this.pts[12].rotation.x=-leftSwing*.18-leftLift*.16;
      this.pts[12].rotation.z=strafeRoll*.30;
    }
    if(this.pts[13]){
      this.pts[13].rotation.x=-rightSwing*.18-rightLift*.16;
      this.pts[13].rotation.z=strafeRoll*.30;
    }
    if(this.pts[0])this.pts[0].position.y=1.82+strideBob*.55;
    if(this.pts[1])this.pts[1].position.y=1.88+strideBob*.55;
    if(this.pts[2]){
      this.pts[2].position.y=1.25+strideBob;
      this.pts[2].position.x=hipSway*.28;
      this.pts[2].rotation.x=-bodyLean;
      this.pts[2].rotation.y=-Math.sin(this.gaitPhase)*.040*gaitNorm;
      this.pts[2].rotation.z=-strafeRoll*.55;
    }
    if(this.pts[3]){
      this.pts[3].position.y=.88+strideBob*.78;
      this.pts[3].position.x=hipSway*.20;
      this.pts[3].rotation.x=-bodyLean*.65;
      this.pts[3].rotation.y=Math.sin(this.gaitPhase)*.030*gaitNorm;
      this.pts[3].rotation.z=-strafeRoll*.72;
    }
    if(this.pts[8]){this.pts[8].position.y=.52+leftLift*.018;this.pts[8].position.z=-leftSwing*.035;}
    if(this.pts[9]){this.pts[9].position.y=.52+rightLift*.018;this.pts[9].position.z=-rightSwing*.035;}
    if(this.pts[12])this.pts[12].position.z=.05-leftSwing*.060;
    if(this.pts[13])this.pts[13].position.z=.05-rightSwing*.060;
    if(this.weaponPivot){
      const idleBreath=Math.sin(this.ph*.55)*(1-Math.min(1,gaitNorm))*.008;
      const stepBob=Math.sin(this.gaitPhase*2)*.012*gaitNorm;
      const pose=this.weaponPivot.userData.pose||{p:[.39,1.23,-.07],r:[.05,.07,-.35]};
      this.weaponPivot.position.x=pose.p[0]+Math.sin(this.gaitPhase)*.008*gaitNorm;
      this.weaponPivot.position.y=pose.p[1]+stepBob;
      this.weaponPivot.position.z=pose.p[2];
      this.weaponPivot.rotation.x=pose.r[0]+idleBreath+stepBob*1.8+(combatPose?.05:0);
      this.weaponPivot.rotation.y=pose.r[1]+(combatPose?.14*this.strafeDir:0)+sideRatio*.025*gaitNorm;
      this.weaponPivot.rotation.z=pose.r[2]+(combatPose?-.05*this.strafeDir:0)-strafeRoll*.35;
    }
    // The arm solver runs after weapon sway/pose so both hands stay physically
    // attached to the real grip points while walking, strafing and fighting.
    updateBotWeaponHands(this);

    const suppressMemory=this.tacticalMode==='suppress'&&!this.canSeeTarget&&targetPos&&this.lastSeenT<2.6&&!this.weapon.isRocket;
    if((this.canSeeTarget||suppressMemory)&&targetPos&&dist<=this.weapon.range*1.08){
      this.sT-=dt;
      const playerFireAllowed=!(this.team==='enemy'&&this.targetIsPlayer)||canPressurePlayer(this);
      if(!playerFireAllowed&&this.sT<=0)this.sT=.20+Math.random()*.25;
      if(playerFireAllowed&&this.sT<=0&&this.reactionT<=0&&this.burstPauseT<=0){
        if(this.mag<=0&&!this.reloadT)this.startReload();
        else if(!this.reloadT){
          const fireTarget=suppressMemory?this.lastKnown.clone().addScaledVector(this.lastKnownVel,Math.min(.45,this.lastSeenT*.16)):targetPos;
          const fireDist=Math.max(1,this.group.position.distanceTo(fireTarget));
          if(!this.weapon.isRocket&&!suppressMemory&&this.maybePlantBomb(dist,targetPos)){
            this.sT=.85;
          }else if(!this.weapon.isRocket&&!suppressMemory&&this.maybePlantMine(dist,targetPos)){
            this.sT=.48;
          }else{
            this.doShoot(fireTarget,fireDist,suppressMemory);
            this.burstLeft--;
            if(this.burstLeft<=0){
              const attackingPlayer=this.team==='enemy'&&this.targetIsPlayer;
              let base=attackingPlayer
                ? (this.weapon.isRocket||this.weapon.key==='shotgun'||this.weapon.isSniper?1:2)
                : (this.weapon.isSniper?1:(this.weapon.key==='rifle'||this.weapon.key==='plasma'?4:this.weapon.key==='pistol'?3:1));
              let extra=this.weapon.isSniper?1:(attackingPlayer?2:(this.weapon.key==='rifle'||this.weapon.key==='plasma'?5:3));
              const suppressing=this.tacticalMode==='suppress'&&!this.weapon.isRocket&&!this.weapon.isSniper;
              if(suppressing){base+=2;extra+=2;}
              this.burstLeft=base+Math.floor(Math.random()*extra);
              const normalPause=((this.weapon.isSniper?.72:this.weapon.isRocket?.58:this.weapon.key==='shotgun'?.34:.16)+Math.random()*(.18+(1-this.aimSkill)*.22))*(suppressing?.48:1);
              this.burstPauseT=attackingPlayer?(suppressing?.24+Math.random()*.22:.42+Math.random()*.42):normalPause;
            }
            this.sT=Math.max((this.team==='enemy'&&this.targetIsPlayer)?0.095:0.055,this.weapon.rate*this.fireRateMul*(.96+Math.random()*.24));
            if(this.mag<=0)this.startReload();
          }
        }
      }
    }

    this.rocketCheckT-=dt;
    if(this.rocketCheckT<=0){
      this.rocketCheckT=.12+Math.random()*.06;
      this.cachedRocketThreat=this.findIncomingRocketThreat();
      if(this.cachedRocketThreat&&this.dodgeCD<=0&&this.dodgeT<=0){
        const urgency=this.cachedRocketThreat.time<.55?1.22:this.cachedRocketThreat.time<.9?1.10:1;
        this.triggerDodge(this.cachedRocketThreat.side,urgency);
        this.coverPoint=null;this.coverCooldownT=0;
      }
    }

    this.uiT=(this.uiT||0)-dt;
    if(this.uiT<=0){
      this.uiT=0.12;
      const sv=this.group.position.clone();sv.y+=2.4;
      const proj=sv.project(camera);
      const sx=(proj.x*.5+.5)*W,sy=(-proj.y*.5+.5)*H;
      let vis=proj.z>0&&proj.z<1&&sx>-10&&sx<W+10&&sy>-10&&sy<H+10;
      if(vis){
        const eye=camera.position.clone();
        const botHead=this.group.position.clone();botHead.y+=1.5;
        if(wallBetween(eye,botHead,losMeshes)||smokeBlocksSight(eye,botHead))vis=false;
      }
      this.uiVis=vis;this.uiX=sx;this.uiY=sy;
    }

    this.hEl.style.display=this.uiVis?'block':'none';
    if(this.uiVis){
      const sx=this.uiX,sy=this.uiY;
      this.hEl.style.left=(sx-24)+'px';this.hEl.style.top=(sy-10)+'px';
      this.hFill.style.width=(this.hp/this.maxHp*100)+'%';
      const pct=this.hp/this.maxHp;
      if(this.team==='ally')this.hFill.style.background=pct>.6?'#45d5ff':pct>.3?'#2f9dff':'#5d72ff';
      else this.hFill.style.background=pct>.6?'#ff3655':pct>.3?'#ff6a3d':'#ff1744';
    }

    if(this.team==='enemy'&&dist<1.02&&!this.targetEn&&!wallBetween(this.group.position.clone().setY(1.1),camera.position.clone(),losMeshes))return true;
    return false;
  }

  hurt(dmg,dir,fromTeam,source=null){
    if(!this.alive)return;
    this.hp-=dmg;
    this.flashT=.09;
    this.lastDamageT=.9;
    this.coverPoint=null;this.coverCooldownT=0;
    this.pts.forEach(p=>{if(p.material&&p.material.emissive)p.material.emissive.setRGB(1,0,0);});
    if(this.hp>0&&Math.random()<Math.min(.90,.48+level*.018+kills*.0025))this.triggerDodge();
    const botSource=source&&source!=='player'&&source!==this&&source.alive&&source.team!==this.team?source:null;
    const playerSource=this.team==='enemy'&&(source==='player'||fromTeam==='player'||fromTeam==='ally');
    const shouldRetaliate=!this.canSeeTarget||this.targetLockT<=.15||dmg>=this.maxHp*.10;
    if(botSource&&shouldRetaliate){
      this.targetEn=botSource;this.targetIsPlayer=false;
      this.lastKnown.copy(botSource.group.position);this.lastKnownVel.set(botSource.velX||0,0,botSource.velZ||0);
      this.lastSeenT=0;this.lastTargetSeenAt=performance.now();this.losT=0;
      this.targetLockT=.92+this.aimSkill*.45;this.searchPoint=null;this.searchStep=0;
    }else if(playerSource&&!dying&&shouldRetaliate){
      this.targetEn=null;this.targetIsPlayer=true;
      this.lastKnown.copy(camera.position);this.lastKnownVel.set(plrVx,0,plrVz);
      this.lastSeenT=0;this.lastTargetSeenAt=performance.now();this.losT=0;
      this.targetLockT=.92+this.aimSkill*.45;this.searchPoint=null;this.searchStep=0;
    }else{
      this.lastSeenT=Math.min(this.lastSeenT,1.15);
    }
    this.reactionT=Math.min(this.reactionT,.07);
    this.burstPauseT=Math.min(this.burstPauseT,.06);
    if(this.aiState==='patrol'||this.aiState==='search')this.aiState='hunt';
    this.stateCD=Math.min(this.stateCD,.14);
    if(this.hp<=0)this.die(dmg,dir);
  }

  die(dmg,dir){
    this.alive=false;
    for(const mn of mines)if(mn.src===this)mn.src=null;
    const force=Math.min(3+dmg*.05,10);
    const gc=Math.min(Math.floor(3+dmg*.07),this.pts.length);
    const selected=[...this.pts].sort(()=>Math.random()-.5).slice(0,gc);
    selected.forEach(p=>{
      const wp=new THREE.Vector3();p.getWorldPosition(wp);
      this.group.remove(p);p.position.copy(wp);
      if(p.material){const oldMat=p.material;p.material=oldMat.clone();p.material.transparent=true;disposeMaterial(oldMat);}
      scene.add(p);
      _gibs.push({m:p,vx:(Math.random()-.5)*force,vy:Math.random()*force*.7+2,vz:(Math.random()-.5)*force,rx:(Math.random()-.5)*10,ry:(Math.random()-.5)*10,life:2.5});
    });
    scene.remove(this.group);
    disposeObject3D(this.group);
    const gp=this.group.position;
    for(let i=0;i<5;i++)spawnP({x:gp.x,y:gp.y+1,z:gp.z},0xff5533);
    try{this.hEl.remove();}catch(e){}
  }

  destroy(){
    try{
      if(this.alive){scene.remove(this.group);disposeObject3D(this.group);}
      this.hEl.remove();
    }catch(e){}
  }
}


// ─── TEAM SPAWNING / SAFE SPAWN SYSTEM ────────────────
const ALLY_SPTS=[
  [-72,-18],[-68,16],[-58,-34],[-54,34],[-46,0],[-38,-48],[-34,48],[-24,-22],[-22,24],[-14,-58],[-12,56],[-4,-36],[-4,36],[-62,56],[-62,-56]
];
const ENEMY_SPTS=[
  [72,18],[68,-16],[58,34],[54,-34],[46,0],[38,48],[34,-48],[24,22],[22,-24],[14,58],[12,-56],[4,36],[4,-36],[62,-56],[62,56]
];
const EXTRA_SPAWN_POINTS=[
  [-78,0],[-74,28],[-74,-28],[-56,54],[-56,-54],[-44,18],[-44,-18],[-28,62],[-28,-62],[-8,66],[-8,-66],
  [78,0],[74,-28],[74,28],[56,-54],[56,54],[44,-18],[44,18],[28,-62],[28,62],[8,-66],[8,66],
  [-18,-18],[-18,18],[18,-18],[18,18],[-35,10],[35,-10],[-10,35],[10,-35],[-45,20],[45,-20],[-20,45],[20,-45],
  [-32,-30],[32,30],[-32,30],[32,-30],[-58,0],[58,0],[0,-58],[0,58],[-60,22],[60,-22],[-22,60],[22,-60],[-8,-26],[8,26],[-26,8],[26,-8]
];
const SPAWN_POINT_SET=[...ALLY_SPTS,...ENEMY_SPTS,...EXTRA_SPAWN_POINTS,...WPTS,...COVER_POINTS]
  .filter((p,i,arr)=>arr.findIndex(q=>q[0]===p[0]&&q[1]===p[1])===i);
const VALID_SPAWN_POINTS=SPAWN_POINT_SET.filter(([x,z])=>isSpawnWalkable(x,z,0.55));
const ALLY_SPAWN_POOL=VALID_SPAWN_POINTS.filter(([x,z])=>x<=12);
const ENEMY_SPAWN_POOL=VALID_SPAWN_POINTS.filter(([x,z])=>x>=-12);
const TEAM_SIZE=5;       // красная команда: пять вражеских ботов
const ALLY_BOT_TARGET=4; // синяя команда: игрок + четыре союзных бота
let spawnT=0;

function isSpawnWalkable(x,z,r=0.45){
  if(x<-89||x>89||z<-89||z>89)return false;
  const c=collideWalls(x,z,r);
  return Math.abs(c.x-x)<0.01&&Math.abs(c.z-z)<0.01;
}
function dist2D(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1]);}
function shuffle(arr){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[out[i],out[j]]=[out[j],out[i]];}return out;}
function tryJitterSpawn(base,used,minDist=9,r=0.45){
  for(let attempt=0;attempt<18;attempt++){
    const ang=Math.random()*Math.PI*2;
    const rad=attempt===0?0:1.4+Math.random()*4.6;
    const x=base[0]+Math.cos(ang)*rad;
    const z=base[1]+Math.sin(ang)*rad;
    if(!isSpawnWalkable(x,z,r))continue;
    if(used.every(p=>dist2D([x,z],p)>=minDist))return [x,z];
  }
  if(isSpawnWalkable(base[0],base[1],r)&&used.every(p=>dist2D(base,p)>=Math.max(6,minDist*.7)))return base.slice();
  return null;
}
function pickSpawnSet(pool,count,used,minDist,opts={}){
  const out=[];
  const farFrom=opts.farFrom||null;
  const minFar=opts.minFar||0;
  const maxNear=opts.maxNear||Infinity;
  const candidates=shuffle(pool.length?pool:VALID_SPAWN_POINTS);
  for(const base of candidates){
    if(out.length>=count)break;
    if(farFrom){const d=dist2D(base,farFrom);if(d<minFar||d>maxNear)continue;}
    const pt=tryJitterSpawn(base,[...used,...out],minDist,opts.radius||0.48);
    if(pt)out.push(pt);
  }
  if(out.length<count&&minDist>5)return out.concat(pickSpawnSet(pool,count-out.length,[...used,...out],minDist-1.6,opts));
  return out;
}
function applyPlayerSpawn(pos){
  camera.position.set(pos[0],1.75,pos[1]);
  prevPX=camera.position.x;prevPZ=camera.position.z;
}
function pickPlayerRespawnPoint(){
  const living=enemies.filter(e=>e.alive);
  const hostiles=living.filter(e=>e.team==='enemy').map(e=>[e.group.position.x,e.group.position.z]);
  const friendlies=living.filter(e=>e.team==='ally').map(e=>[e.group.position.x,e.group.position.z]);
  const occupied=living.map(e=>[e.group.position.x,e.group.position.z]);
  const candidates=shuffle(ALLY_SPAWN_POOL.length?ALLY_SPAWN_POOL:VALID_SPAWN_POINTS);
  let best=null,bestScore=-Infinity;
  for(const base of candidates){
    const pt=tryJitterSpawn(base,occupied,5.5,.52);
    if(!pt)continue;
    const enemyMin=hostiles.length?Math.min(...hostiles.map(p=>dist2D(pt,p))):99;
    const allyMin=friendlies.length?Math.min(...friendlies.map(p=>dist2D(pt,p))):14;
    let score=Math.min(enemyMin,70)*2.8-Math.min(allyMin,28)*.22+Math.random()*3;
    if(enemyMin<18)score-=(18-enemyMin)*18;
    if(enemyMin<10)score-=160;
    if(score>bestScore){bestScore=score;best=pt;}
  }
  if(best)return best;
  let fallback=null,fallbackEnemy=-1;
  for(const base of ALLY_SPAWN_POOL){
    if(!isSpawnWalkable(base[0],base[1],.52))continue;
    const enemyMin=hostiles.length?Math.min(...hostiles.map(p=>dist2D(base,p))):99;
    if(enemyMin>fallbackEnemy){fallbackEnemy=enemyMin;fallback=base.slice();}
  }
  return fallback||[-46,0];
}
function generateSpawnPlan(){
  const used=[];
  const playerSet=pickSpawnSet(ALLY_SPAWN_POOL,1,used,12,{maxNear:75});
  const player=playerSet[0]||[-46,0];
  used.push(player);
  let allies=pickSpawnSet(ALLY_SPAWN_POOL,ALLY_BOT_TARGET,used,10,{maxNear:82});
  used.push(...allies);
  let enemies=pickSpawnSet(ENEMY_SPAWN_POOL,TEAM_SIZE,used,11,{farFrom:player,minFar:34});
  while(allies.length<ALLY_BOT_TARGET){
    const extra=pickSpawnSet(ALLY_SPAWN_POOL,1,[player,...used,...allies,...enemies],6,{maxNear:86})[0];
    if(!extra)break;
    allies.push(extra); used.push(extra);
  }
  while(enemies.length<TEAM_SIZE){
    const extra=pickSpawnSet(ENEMY_SPAWN_POOL,1,[player,...used,...allies,...enemies],6,{farFrom:player,minFar:26,maxNear:92})[0];
    if(!extra)break;
    enemies.push(extra); used.push(extra);
  }
  return {player,allies,enemies};
}
function updateTeamScore(){
  const allyTotal=allyKills+allyControlScore*FRONTLINE_CFG.capturePoints;
  const enemyTotal=enemyKills+enemyControlScore*FRONTLINE_CFG.capturePoints;
  G('tb-ally').textContent='СИНИЕ '+allyTotal;
  G('tb-enemy').textContent='КРАСНЫЕ '+enemyTotal;
  G('tb-ally').title='Убийства: '+allyKills+' · Захваты: '+allyControlScore;
  G('tb-enemy').title='Убийства: '+enemyKills+' · Захваты: '+enemyControlScore;
}
function countTeam(t){let c=0;for(const e of enemies)if(e.alive&&e.team===t)c++;return c;}
function getAliveTeamPositions(team){return enemies.filter(e=>e.alive&&e.team===team).map(e=>[e.group.position.x,e.group.position.z]);}
function spawnBot(team){
  const pool=team==='ally'?ALLY_SPAWN_POOL:ENEMY_SPAWN_POOL;
  const used=[[camera.position.x,camera.position.z],...enemies.filter(e=>e.alive).map(e=>[e.group.position.x,e.group.position.z])];
  const farFrom=team==='enemy'?[camera.position.x,camera.position.z]:null;
  const pts=pickSpawnSet(pool,1,used,10,{farFrom,minFar:team==='enemy'?26:0,maxNear:90});
  const pt=pts[0]||(team==='ally'?[-46,0]:[46,0]);
  const mt=Math.min(5,Math.floor(level*.5+1));
  let typ=1+Math.floor(Math.random()*mt);
  if(Math.random()<.16)typ=0;
  const en=new Enemy(pt[0],pt[1],typ,team);
  enemies.push(en);
}
function spawnInitial(){
  const plan=generateSpawnPlan();
  applyPlayerSpawn(plan.player);
  plan.allies.forEach((pt)=>{enemies.push(new Enemy(pt[0],pt[1],1+Math.floor(Math.random()*3),'ally'));});
  plan.enemies.forEach((pt)=>{enemies.push(new Enemy(pt[0],pt[1],1+Math.floor(Math.random()*3),'enemy'));});
  while(countTeam('ally')<ALLY_BOT_TARGET)spawnBot('ally');
  while(countTeam('enemy')<TEAM_SIZE)spawnBot('enemy');
  updateTeamScore();
}
