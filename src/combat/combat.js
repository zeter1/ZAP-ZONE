'use strict';

// ─── INPUT ──────────────────────────────
window.addEventListener('keydown',e=>{
  K[e.code]=true;
  if(!running||paused||lvlAnnOpen||perkPickOpen||dying)return;
  if(e.code==='KeyR')doReload();
  if(e.code==='KeyF')throwMine();
  if(e.code==='KeyG')placeBomb();
  const n=parseInt(e.key);if(n>=1&&n<=9)switchW(n-1);
});
window.addEventListener('keyup',e=>{K[e.code]=false;});
document.addEventListener('mousemove',e=>{
  if(IS_TOUCH||!running||paused||lvlAnnOpen||perkPickOpen||dying)return;
  const sens=.002*lookSensitivityMultiplier(zooming);
  yaw-=e.movementX*sens;pitch=Math.max(-1.2,Math.min(1.2,pitch-e.movementY*sens));
  gunSwayX=Math.max(-.045,Math.min(.045,gunSwayX+e.movementX*.00010));
  gunSwayY=Math.max(-.035,Math.min(.035,gunSwayY+e.movementY*.00009));
});
let mouseDown=false,zooming=false;
document.addEventListener('mousedown',e=>{
  if(IS_TOUCH)return;
  if(e.button===2){e.preventDefault();if(running&&!paused&&!lvlAnnOpen&&!perkPickOpen&&!dying)zooming=true;return;}
  if(running&&!paused&&!lvlAnnOpen&&!perkPickOpen&&!dying&&e.button===0){mouseDown=true;shoot();}
});
document.addEventListener('mouseup',e=>{
  if(e.button===0)mouseDown=false;
  if(e.button===2)zooming=false;
});
document.addEventListener('contextmenu',e=>{if(!IS_TOUCH)e.preventDefault();});

function bindMobileControls(){ if(!IS_TOUCH) return; }


// ─── RAY-SPHERE ─────────────────────────
const _rsV=new THREE.Vector3();
function rSphere(o,d,c,r){
  _rsV.subVectors(o,c);const b=_rsV.dot(d),q=_rsV.dot(_rsV)-r*r,dd=b*b-q;
  if(dd<0)return Infinity;const sq=Math.sqrt(dd),t0=-b-sq;if(t0>.001)return t0;const t1=-b+sq;return t1>.001?t1:Infinity;
}
const _ht=new THREE.Vector3();
function hitEnemy(o,d,team,exclude=null){
  let best=Infinity,en=null,hd=false;
  for(const e of enemies){
    if(!e.alive||e===exclude)continue;
    const p=e.group.position;
    const dx=p.x-o.x,dz=p.z-o.z;if(dx*dx+dz*dz>3600)continue;
    _ht.set(p.x,p.y+1.0,p.z);if(rSphere(o,d,_ht,.85)===Infinity)continue;
    _ht.set(p.x,p.y+.55,p.z);let t=rSphere(o,d,_ht,.36);if(t<best){best=t;en=e;hd=false;}
    _ht.set(p.x,p.y+1.25,p.z);t=rSphere(o,d,_ht,.46);if(t<best){best=t;en=e;hd=false;}
    _ht.set(p.x,p.y+1.82,p.z);t=rSphere(o,d,_ht,.28);if(t<best){best=t;en=e;hd=true;}
  }
  return{en,dist:best,hd};
}

// ─── ROCKET MESH ────────────────────────
const _UP=new THREE.Vector3(0,1,0);
function mkRkt(col){
  const g=new THREE.Group();
  const body=new THREE.Mesh(
    new THREE.CylinderGeometry(.07,.07,.58,7),
    new THREE.MeshLambertMaterial({color:col})
  );
  g.add(body);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.072,.26,7),new THREE.MeshLambertMaterial({color:0xffe45a}));tip.position.y=.42;g.add(tip);
  for(let i=0;i<4;i++){
    const f=new THREE.Mesh(new THREE.BoxGeometry(.022,.23,.15),new THREE.MeshLambertMaterial({color:0x8f99a4}));
    f.position.y=-.23;f.rotation.y=i*Math.PI/2;g.add(f);
  }
  // Красивое пламя без отдельных источников света: additive blending заметен на тёмной карте и почти не нагружает GPU.
  const flameOuter=new THREE.Mesh(
    new THREE.ConeGeometry(.16,.62,7,1,true),
    new THREE.MeshBasicMaterial({color:0xff5a16,transparent:true,opacity:.42,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})
  );
  flameOuter.position.y=-.58;flameOuter.rotation.x=Math.PI;flameOuter._fire=true;g.add(flameOuter);
  const flameCore=new THREE.Mesh(
    new THREE.ConeGeometry(.09,.46,7,1,true),
    new THREE.MeshBasicMaterial({color:0xfff0a0,transparent:true,opacity:.88,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})
  );
  flameCore.position.y=-.52;flameCore.rotation.x=Math.PI;flameCore._fire=true;g.add(flameCore);
  const glow=new THREE.Mesh(
    new THREE.SphereGeometry(.16,6,4),
    new THREE.MeshBasicMaterial({color:0xff8a24,transparent:true,opacity:.30,depthWrite:false,blending:THREE.AdditiveBlending})
  );
  glow.position.y=-.36;glow._fire=true;g.add(glow);
  g.userData.flames=[flameOuter,flameCore,glow];
  return g;
}
function mkMine(){
  const g=new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.28,.32,.14,8),new THREE.MeshLambertMaterial({color:0x222222})));
  const top=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,.10,7),new THREE.MeshLambertMaterial({color:0x1a1a1a}));top.position.y=.12;g.add(top);
  const lens=new THREE.Mesh(new THREE.SphereGeometry(.07,6,4),new THREE.MeshBasicMaterial({color:0xff2200}));lens.position.y=.20;g.add(lens);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.30,.035,6,10),new THREE.MeshBasicMaterial({color:0xffaa00}));ring.rotation.x=Math.PI/2;ring.position.y=.02;g.add(ring);
  return g;
}

function mkBomb(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.SphereGeometry(.38,14,10),new THREE.MeshLambertMaterial({color:0x151515}));
  body.scale.y=.84;g.add(body);
  const band=new THREE.Mesh(new THREE.TorusGeometry(.31,.052,8,18),new THREE.MeshBasicMaterial({color:0xffaa00}));
  band.rotation.x=Math.PI/2;band.position.y=.02;g.add(band);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.115,.15,.18,9),new THREE.MeshLambertMaterial({color:0x666666}));
  cap.position.y=.34;g.add(cap);

  const fuseGroup=new THREE.Group();
  const points=[];
  const segmentCount=MOBILE_LOW?14:24;
  for(let i=0;i<=segmentCount;i++){
    const t=i/segmentCount;
    const ang=t*Math.PI*2.15;
    const rad=.04+t*.70;
    points.push(new THREE.Vector3(
      .05+Math.sin(ang)*rad*.72,
      .45+t*.56+Math.sin(t*Math.PI)*.11,
      Math.cos(ang)*rad*.48
    ));
  }
  const segments=[];
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],dir=b.clone().sub(a),len=dir.length();
    const seg=new THREE.Mesh(
      new THREE.CylinderGeometry(.020,.024,len,6),
      new THREE.MeshBasicMaterial({color:i%2?0xc4833d:0x9a5b2b})
    );
    seg.position.copy(a).add(b).multiplyScalar(.5);
    seg.quaternion.setFromUnitVectors(_UP,dir.normalize());
    seg.userData.bombFuseIndex=i;
    fuseGroup.add(seg);segments.push(seg);
  }
  const spark=new THREE.Mesh(
    new THREE.SphereGeometry(.075,8,6),
    new THREE.MeshBasicMaterial({color:0xffff66,transparent:true,opacity:1})
  );
  spark.position.copy(points[points.length-1]);spark._bombSpark=true;spark.visible=false;fuseGroup.add(spark);
  g.add(fuseGroup);
  g.userData.fuseGroup=fuseGroup;
  g.userData.fuseSegments=segments;
  g.userData.fusePoints=points;
  g.userData.bombSpark=spark;
  return g;
}

function mkSmokeGrenade(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.10,.10,.34,10),new THREE.MeshLambertMaterial({color:0x879398}));
  body.rotation.z=Math.PI/2;g.add(body);
  const capA=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.055,10),new THREE.MeshLambertMaterial({color:0x263238}));
  capA.rotation.z=Math.PI/2;capA.position.x=.19;g.add(capA);
  const capB=capA.clone();capB.material=capA.material.clone();capB.position.x=-.19;g.add(capB);
  const band=new THREE.Mesh(new THREE.TorusGeometry(.105,.018,6,12),new THREE.MeshBasicMaterial({color:0xbad2cf}));
  band.rotation.y=Math.PI/2;g.add(band);
  return g;
}
function removeSmokeCloud(cloud){
  if(!cloud)return;
  destroySceneObject(cloud.m);
}
function deploySmokeCloud(pos){
  while(smokeClouds.length>=MAX_ACTIVE_SMOKE_CLOUDS)removeSmokeCloud(smokeClouds.shift());
  const group=new THREE.Group();
  group.position.set(pos.x,Math.max(.10,pos.y),pos.z);
  const radius=SMOKE_RADIUS*plr.smokeRadiusM;
  const duration=SMOKE_DURATION_SECONDS*plr.smokeDurationM;
  // Несколько почти непрозрачных центральных слоёв полностью перекрывают обзор,
  // а внешние клубы смягчают край облака без большого числа тяжёлых частиц.
  const puffCount=PERF_MODE?14:22;
  const coreCount=PERF_MODE?3:5;
  const puffs=[];
  for(let i=0;i<puffCount;i++){
    const center=i===0;
    const core=i<coreCount;
    const ang=Math.random()*Math.PI*2;
    const rr=center?0:Math.sqrt(Math.random())*radius*(core?.22:.68);
    const geo=new THREE.SphereGeometry(1,PERF_MODE?5:6,PERF_MODE?4:5);
    const matObj=new THREE.MeshBasicMaterial({
      color:i%3===0?0x667077:(i%3===1?0x515a60:0x798187),
      transparent:true,opacity:0,depthWrite:true,depthTest:true
    });
    const puff=new THREE.Mesh(geo,matObj);
    puff.position.set(Math.cos(ang)*rr,center?1.65:(core?1.0+Math.random()*2.1:.65+Math.random()*3.2),Math.sin(ang)*rr);
    const base=center?radius*.70:(core?radius*(.44+Math.random()*.13):radius*(.30+Math.random()*.22));
    puff.scale.set(base*(.92+Math.random()*.18),base*(.68+Math.random()*.20),base*(.92+Math.random()*.18));
    puff.userData.baseScale=puff.scale.clone();
    puff.userData.phase=Math.random()*Math.PI*2;
    puff.userData.baseOpacity=core?1:.90+Math.random()*.08;
    puff.renderOrder=11;
    group.add(puff);puffs.push(puff);
  }
  scene.add(group);
  smokeClouds.push({m:group,center:new THREE.Vector3(pos.x,1.6,pos.z),radius,life:duration,maxLife:duration,age:0,puffs,density:0});
  showMsg('🌫️ Дымовое облако развёрнуто на '+Math.round(duration)+' сек.');
}
const _smokeAB=new THREE.Vector3(),_smokeAC=new THREE.Vector3(),_smokeClosest=new THREE.Vector3();
function smokeBlocksSight(from,to){
  _smokeAB.subVectors(to,from);
  const lenSq=_smokeAB.lengthSq();
  if(lenSq<.0001)return false;
  for(const cloud of smokeClouds){
    if(cloud.life<=0||cloud.density<.06)continue;
    _smokeAC.subVectors(cloud.center,from);
    const t=Math.max(0,Math.min(1,_smokeAC.dot(_smokeAB)/lenSq));
    _smokeClosest.copy(from).addScaledVector(_smokeAB,t);
    const effective=cloud.radius*(.86+.14*cloud.density);
    if(_smokeClosest.distanceToSquared(cloud.center)<effective*effective)return true;
  }
  return false;
}
function smokeStrengthAt(pos){
  let strength=0;
  for(const cloud of smokeClouds){
    if(cloud.life<=0||cloud.density<=0)continue;
    const dx=pos.x-cloud.center.x,dy=(pos.y||1.6)-cloud.center.y,dz=pos.z-cloud.center.z;
    const d=Math.sqrt(dx*dx+dy*dy*.35+dz*dz);
    if(d<cloud.radius)strength=Math.max(strength,(1-d/cloud.radius)*cloud.density);
  }
  return strength;
}
function tickSmoke(dt){
  for(let i=smokeGrenades.length-1;i>=0;i--){
    const g=smokeGrenades[i];g.age+=dt;g.life-=dt;g.vy-=18*dt;
    const ox=g.m.position.x,oz=g.m.position.z;
    g.m.position.x+=g.vx*dt;g.m.position.y+=g.vy*dt;g.m.position.z+=g.vz*dt;
    g.m.rotation.x+=g.rx*dt;g.m.rotation.z+=g.rz*dt;
    const coll=collideWalls(g.m.position.x,g.m.position.z,.12);
    if(Math.abs(coll.x-g.m.position.x)>.001){g.vx*=-.28;g.m.position.x=coll.x;}else g.m.position.x=coll.x;
    if(Math.abs(coll.z-g.m.position.z)>.001){g.vz*=-.28;g.m.position.z=coll.z;}else g.m.position.z=coll.z;
    if(g.m.position.y<=.13){
      g.m.position.y=.13;g.vy=Math.abs(g.vy)*.24;g.vx*=.72;g.vz*=.72;g.grounded=true;
    }
    g.trailT-=dt;
    if(g.trailT<=0){g.trailT=.12;spawnSmoke(g.m.position,0x899095);}
    if((g.grounded&&g.age>=1.05)||g.age>=1.85||g.life<=0){
      const p=g.m.position.clone();p.y=.12;
      destroySceneObject(g.m);smokeGrenades.splice(i,1);deploySmokeCloud(p);
    }
  }
  for(let i=smokeClouds.length-1;i>=0;i--){
    const c=smokeClouds[i];c.age+=dt;c.life-=dt;
    const fadeIn=Math.min(1,c.age/1.35);
    const fadeOut=Math.min(1,Math.max(0,c.life)/4);
    c.density=fadeIn*fadeOut;
    c.m.rotation.y+=dt*.018;
    for(const puff of c.puffs){
      const pulse=1+Math.sin(c.age*.45+puff.userData.phase)*.025;
      const b=puff.userData.baseScale;
      puff.scale.set(b.x*pulse,b.y*(1+Math.cos(c.age*.36+puff.userData.phase)*.025),b.z*pulse);
      puff.material.opacity=puff.userData.baseOpacity*c.density;
    }
    if(c.life<=0){removeSmokeCloud(c);smokeClouds.splice(i,1);}
  }
  const overlay=G('smoke-overlay');
  if(overlay)overlay.style.opacity=String(Math.min(1,smokeStrengthAt(camera.position)*2.25));
}

function ensureBombTimer(mn){
  if(mn.timerSprite)return;
  const c=document.createElement('canvas');c.width=192;c.height=48;
  const tex=new THREE.CanvasTexture(c);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));
  sp.scale.set(1.9,.47,1);sp.position.set(0,1.55,0);mn.m.add(sp);
  mn.timerCanvas=c;mn.timerTexture=tex;mn.timerSprite=sp;mn.timerSecond=-1;
}
function updateBombFuseVisual(mn,dt){
  const total=Math.max(.1,mn.fuseTotal||BOMB_FUSE_SECONDS);
  const left=Math.max(0,mn.fuseT);
  const ratio=Math.max(0,Math.min(1,left/total));
  const segs=mn.m.userData.fuseSegments||[];
  const pts=mn.m.userData.fusePoints||[];
  const remaining=Math.max(0,Math.min(segs.length,Math.ceil(ratio*segs.length)));
  for(let i=0;i<segs.length;i++)segs[i].visible=i<remaining;
  const spark=mn.m.userData.bombSpark;
  if(spark&&pts.length){
    spark.position.copy(pts[Math.min(pts.length-1,remaining)]);
    const fast=left<=10;
    spark.visible=Math.sin((mn.ph||0)*(fast?34:18))>-.35;
    spark.scale.setScalar((fast?1.35:1)*(1+Math.sin((mn.ph||0)*22)*.18));
    spark.material.color.setHex(left<=5?0xffffff:left<=15?0xff7a22:0xffff55);
  }
  mn.sparkEmitT=(mn.sparkEmitT||0)-dt;
  if(mn.sparkEmitT<=0&&spark){
    mn.sparkEmitT=left<=10?.045:.10;
    const wp=new THREE.Vector3();spark.getWorldPosition(wp);spawnSpark(wp,left<=8?0xffffff:0xffb22e);
    if(Math.random()<.45)spawnSmoke(wp,0x5d5148);
  }
  ensureBombTimer(mn);
  const sec=Math.ceil(left);
  if(sec!==mn.timerSecond){
    mn.timerSecond=sec;
    const ctx=mn.timerCanvas.getContext('2d');ctx.clearRect(0,0,mn.timerCanvas.width,mn.timerCanvas.height);
    ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(8,4,176,40);
    ctx.strokeStyle=sec<=10?'#ff3b24':'#ffbf23';ctx.lineWidth=3;ctx.strokeRect(8,4,176,40);
    ctx.fillStyle=sec<=10?'#ff6650':'#ffe27a';ctx.font='900 24px Segoe UI, sans-serif';ctx.textAlign='center';ctx.fillText('🧨 '+sec+'с',96,32);
    mn.timerTexture.needsUpdate=true;
  }
}
function mkTracer(col,key='default'){
  const g=new THREE.Group();
  const plasma=key==='plasma';
  const sniper=key==='sniper';
  const rifle=key==='rifle';
  const shotgun=key==='shotgun';
  const len=sniper?2.85:(plasma?1.48:(rifle?1.18:(shotgun?.86:1.02)));
  const additive=(color,opacity)=>new THREE.MeshBasicMaterial({
    color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending
  });
  const core=new THREE.Mesh(
    new THREE.CylinderGeometry(sniper?.016:(plasma?.028:.012),sniper?.026:(plasma?.040:.018),len,6),
    additive(sniper?0xeaffff:(plasma?0xffffff:0xfff0bf),sniper?.99:(plasma?.96:.92))
  );
  core.rotation.x=Math.PI/2;core.renderOrder=18;g.add(core);
  const tip=new THREE.Mesh(
    new THREE.SphereGeometry(sniper?.050:(plasma?.082:.034),7,5),
    additive(0xffffff,.98)
  );
  tip.position.z=len*.46;tip.renderOrder=20;g.add(tip);
  const halo=new THREE.Mesh(
    new THREE.CylinderGeometry(sniper?.050:(plasma?.085:.034),sniper?.075:(plasma?.12:.052),len*.94,7),
    additive(col,sniper?.46:(plasma?.38:.24))
  );
  halo.rotation.x=Math.PI/2;halo.renderOrder=17;g.add(halo);
  const tail=new THREE.Mesh(
    new THREE.CylinderGeometry(sniper?.020:(plasma?.042:.014),sniper?.050:(plasma?.072:.030),len*.86,6),
    additive(col,sniper?.30:(plasma?.24:.14))
  );
  tail.rotation.x=Math.PI/2;tail.position.z=-len*.28;tail.renderOrder=16;g.add(tail);
  g.userData.halo=halo;g.userData.tail=tail;g.userData.phase=Math.random()*Math.PI*2;
  return g;
}

// ─── PROJECTILE ARRAYS ──────────────────
const pRkts=[],eRkts=[],pTrs=[],mines=[],smokeGrenades=[],smokeClouds=[];
const MAX_PLAYER_MINES=100;
const MAX_MINES=140;
function playerMineCount(){let c=0;for(const mn of mines)if(mn.owner==='player'&&mn.kind!=='bomb')c++;return c;}
function activeBombCount(){let c=0;for(const mn of mines)if(mn.kind==='bomb'&&!mn.removed)c++;return c;}
function bombNearPoint(pos,minDist=22){
  const d2=minDist*minDist;
  return mines.some(mn=>mn.kind==='bomb'&&!mn.removed&&mn.m.position.distanceToSquared(pos)<d2);
}
function updateMineHUD(){
  const mineCd=Math.max(0,Math.ceil(playerMineCD));
  const bombCd=Math.max(0,Math.ceil(playerBombCD));
  const mineReady=mineCd>0?mineCd+'с':'ГОТОВА';
  const bombReady=bombCd>0?bombCd+'с':'ГОТОВА';
  const bombAmmo=weaponAmmoValue(6);
  G('mine-cnt').textContent='💣 '+playerMineCount()+' · '+mineReady+' | 🧨 '+bombAmmo+'/'+WEAPONS[6].clip+' · '+bombReady;
}

// ─── SHOOT (player) ─────────────────────

function playerDamageMultiplier(){
  let mult=plr.dmgM*((hp<plr.maxHp*.35)?(1+plr.lowHpDamage):1);
  if(hp>=plr.maxHp*.90)mult*=1+plr.fullHpDamage;
  if(Math.hypot(plrVx,plrVz)>4.5)mult*=1+plr.movingDamage;
  return mult;
}
function grantPlayerKillRewards(){
  if(plr.killHeal>0)hp=Math.min(plr.maxHp,hp+plr.killHeal);
  if(plr.killArmor>0)armor=Math.min(plr.maxArmor,armor+plr.killArmor);
  markHUD();
}
function effectiveWeaponSpread(w,pelletIndex=0,extraShot=false){
  const base=zooming?(w.adsSpread??(w.spread||0)*.55):(w.spread||0);
  const moving=Math.min(1,Math.hypot(plrVx,plrVz)/8);
  const movePenalty=(w.moveSpread||0)*moving;
  const airPenalty=onGnd?0:(w.airSpread||0);
  const pelletFactor=(w.pellets||1)>1?(pelletIndex===0?.35:1):1;
  const extraPenalty=extraShot?.035:0;
  return Math.max(0,(base*pelletFactor+movePenalty+airPenalty+extraPenalty)*plr.spreadM);
}
function kickSniperScope(){
  const scope=G('sniper-scope');if(!scope||!zooming)return;
  scope.classList.remove('kick');void scope.offsetWidth;scope.classList.add('kick');
  clearTimeout(kickSniperScope._t);kickSniperScope._t=setTimeout(()=>scope.classList.remove('kick'),260);
}

function shoot(){
  if(reloading||sCD>0)return;
  const w=getW();if(w.isMine){throwMine();return;}if(w.isBomb){placeBomb();return;}if(w.isSmoke){throwSmokeGrenade();return;}
  if(ammo<=0){doReload();noAmmoT=1.5;G('no-ammo').style.opacity='1';return;}
  if(Math.random()>=plr.ammoSaveChance)ammo--;
  syncCurrentAmmo();sCD=w.rate;recoil=1;wHUD();
  playSfx('shoot',1,w.key);pulseCrosshair('fire');
  const shakePower=w.isRocket?1.15:w.isSniper?.98:w.key==='shotgun'?.78:w.key==='rifle'?.36:.22;
  const shakeDuration=w.isRocket?.22:w.isSniper?.20:.11;
  triggerScreenShake(shakePower,shakeDuration);
  if(w.isSniper)kickSniperScope();

  // Camera recoil
  recoilPitch+=(w.recoilY||.02)*(0.8+Math.random()*.4)*plr.recoilM;
  recoilYaw+=(Math.random()-.5)*(w.recoilX||.01)*plr.recoilM;
  recoilRecovery=w.recoilDelay??.3;

  if(flashM)flashM.material.opacity=1;
  if(beamM){beamM.material.opacity=.9;beamT=.065;}
  const bDir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  const shots=1+(Math.random()<plr.extraShotChance?1:0);

  // Muzzle flash
  const mfp=camera.position.clone().addScaledVector(bDir,.7);mfp.y-=.1;
  trigMuzzle(mfp,w.bCol,w.key==='rocket'?1.55:w.isSniper?1.45:w.key==='shotgun'?1.25:1);
  if(w.key!=='rocket'&&w.key!=='plasma'){
    const casingPos=camera.position.clone().addScaledVector(new THREE.Vector3(.22,-.08,-.22).applyQuaternion(camera.quaternion),1);
    ejectCasing(casingPos,camera.quaternion,w.key==='shotgun');
  }

  if(w.isRocket){
    for(let s=0;s<shots;s++){
      const d=bDir.clone();if(s>0){d.x+=(Math.random()-.5)*.12;d.z+=(Math.random()-.5)*.12;d.normalize();}
      const rk=mkRkt(0xff6600);const sp=camera.position.clone().addScaledVector(d,.9);sp.y-=.05;
      rk.position.copy(sp);rk.quaternion.setFromUnitVectors(_UP,d);scene.add(rk);
      pRkts.push({m:rk,vx:d.x*PLAYER_ROCKET_SPEED*plr.rocketSpeedM,vy:d.y*PLAYER_ROCKET_SPEED*plr.rocketSpeedM,vz:d.z*PLAYER_ROCKET_SPEED*plr.rocketSpeedM,life:13,maxSpeed:PLAYER_ROCKET_SPEED*plr.rocketSpeedM,dmg:w.dmg*PLAYER_DAMAGE_BOOST*EXPLOSION_DAMAGE_BOOST*playerDamageMultiplier()*plr.rocketDamageM*plr.explosiveDamageM,sT:0,fT:0,team:'player',ownerType:'player',_src:null,blastRadius:6.5*plr.explosiveRadiusM*plr.rocketRadiusM});
    }
    return;
  }
  const tc=PLR_TCOL[w.key]||0xffffaa;
  for(let s=0;s<shots;s++){
    for(let p=0;p<w.pellets;p++){
      const d=bDir.clone();
      const sp2=effectiveWeaponSpread(w,p,s>0);
      if(sp2>0){d.x+=(Math.random()-.5)*sp2*2;d.y+=(Math.random()-.5)*sp2*2;d.z+=(Math.random()-.5)*sp2*2;d.normalize();}
      const maxRange=w.range||100;
      _rc.ray.origin.copy(camera.position);_rc.ray.direction.copy(d);_rc.near=0;_rc.far=maxRange;
      _rcWallHits.length=0;
      _rc.intersectObjects(wallMeshes,false,_rcWallHits);
      let wDist=maxRange,wPos=null;if(_rcWallHits.length>0){wDist=_rcWallHits[0].distance;wPos=_rcWallHits[0].point.clone();}
      const {en,dist,hd}=hitEnemy(camera.position,d,'ally');
      // Check wall between player and enemy (can't shoot through walls)
      if(en&&dist<wDist){
        const isCrit=Math.random()<plr.critChance;
        const lowTarget=en.hp/en.maxHp<.35;
        const rangeBonus=dist<12?1+plr.closeDamage:(dist>28?1+plr.longRangeDamage:1);
        const distanceScale=weaponDamageScaleAtDistance(w,dist);
        const headshotMult=w.headshotMult||2.10;
        const dmg=w.dmg*distanceScale*PLAYER_DAMAGE_BOOST*playerDamageMultiplier()*rangeBonus*(hd?headshotMult*plr.headshotM:1)*(isCrit?plr.critMult:1)*(lowTarget?1+plr.executeBonus:1);
        const hitFx=camera.position.clone().addScaledVector(d,dist);
        en.hurt(dmg,d.clone(),'ally');
        const lethalHeadshot=hd&&!en.alive;
        if(p===0){
          const hitKind=!en.alive?'kill':isCrit?'crit':hd?'head':'hit';
          showHitMarker(hitKind);
          playSfx(hitKind==='kill'?'kill':hitKind==='crit'?'crit':'hit',1,w.key);
        }
        if(isCrit&&plr.critHeal>0){hp=Math.min(plr.maxHp,hp+plr.critHeal);markHUD();}
        if(hd&&plr.headshotArmor>0){armor=Math.min(plr.maxArmor,armor+plr.headshotArmor);markHUD();}
        if(p===0||w.key==='plasma'){spawnSpark(hitFx,tc);if(w.key==='plasma')spawnP(hitFx,0xc47cff,.55);}
        if(p===0)spawnCombatImpact(hitFx,w.isSniper?'sniper':(w.key==='plasma'?'plasma':(isCrit?'critical':'bullet')));
        if(hd){
          spawnHeadshotFx(hitFx,lethalHeadshot);
          const hs=G('hs-pop'),hsIcon=G('hs-pop-icon'),hsText=G('hs-pop-text');
          hs.classList.remove('on','kill');void hs.offsetWidth;
          if(lethalHeadshot){
            hs.classList.add('kill');
            hsIcon.src=GAME_ASSETS.fx.headshotKill;hsText.textContent='HEADSHOT KILL';
            const flash=G('hs-kill-flash');flash.classList.remove('on');void flash.offsetWidth;flash.classList.add('on');
            clearTimeout(shoot._kft);shoot._kft=setTimeout(()=>flash.classList.remove('on'),520);
          }else{
            hsIcon.src=GAME_ASSETS.fx.headshot;hsText.textContent='HEADSHOT';
          }
          hs.classList.add('on');
          clearTimeout(shoot._ht);shoot._ht=setTimeout(()=>hs.classList.remove('on','kill'),lethalHeadshot?940:620);
        }
        if(plr.lifeSteal>0)hp=Math.min(hp+dmg*plr.lifeSteal,plr.maxHp);
        if(!en.alive){
          addXP((en.type+1)*25+level*3);score+=(en.type+1)*100;kills++;grantPlayerKillRewards();
          combo++;comboT=3;if(combo>2)showCombo();
          showKillMedal({distance:dist,isCrit,headshot:lethalHeadshot,explosive:false});
          markHUD();
          scorePop(lethalHeadshot?'HEADSHOT KILL · +'+(en.type+1)*100:'+'+(en.type+1)*100+(hd?' 🎯':'')+(isCrit?' КРИТ!':''));
          allyKills++;updateTeamScore();
        }
        if(plr.explode){
          const center=en.group.position.clone();center.y+=1.0;explode(center,0xff8800,2.6*plr.explodeRadiusM);
          for(const e2 of enemies){
            if(!e2.alive||e2.team==='ally'||e2===en)continue;
            const dd=center.distanceTo(e2.group.position.clone().setY(e2.group.position.y+1));
            const exRadius=3.6*plr.explodeRadiusM;
            if(dd>=exRadius)continue;
            const splash=dmg*.32*plr.explodeDamageM*(1-dd/exRadius);
            e2.hurt(splash,d.clone(),'ally');
            if(plr.lifeSteal>0)hp=Math.min(hp+splash*plr.lifeSteal,plr.maxHp);
            if(!e2.alive){addXP((e2.type+1)*22);score+=(e2.type+1)*90;kills++;grantPlayerKillRewards();allyKills++;markHUD();updateTeamScore();showKillMedal({explosive:true});scorePop('💥+'+(e2.type+1)*90);}
          }
        }
        if(plr.piercing){
          const pierced=hitEnemy(camera.position,d,'ally',en);
          if(pierced.en&&pierced.dist<wDist){
            const pdmg=dmg*.72*(pierced.hd?1.20:1);
            pierced.en.hurt(pdmg,d.clone(),'ally');
            if(plr.lifeSteal>0)hp=Math.min(hp+pdmg*plr.lifeSteal,plr.maxHp);
            if(!pierced.en.alive){addXP((pierced.en.type+1)*22);score+=(pierced.en.type+1)*90;kills++;grantPlayerKillRewards();allyKills++;markHUD();updateTeamScore();scorePop('🔱+'+(pierced.en.type+1)*90);}
          }
        }
        if(s===0&&p===0)spawnTracer(camera.position,d,dist,tc,w.key);
      } else {
        if(wPos){wallImpact(wPos,tc);spawnCombatImpact(wPos,w.isSniper?'sniper':(w.key==='plasma'?'plasma':'wall'));}
        if(s===0&&p===0)spawnTracer(camera.position,d,wDist,tc,w.key);
      }
      if(w.key==='shotgun'&&p===1)spawnTracer(camera.position,d,Math.min(en&&dist<wDist?dist:wDist,28),tc,w.key);
    }
  }
}
function spawnTracer(from,dir,dist,col,key='default'){
  if(pTrs.length>=MAX_TRACERS){const old=pTrs.shift();destroySceneObject(old.m);}
  const m=mkTracer(col,key);
  const sp=from.clone().addScaledVector(dir,.50);sp.y-=.05;
  m.position.copy(sp);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),dir);scene.add(m);
  const speed=TRACER_SPEED[key]||TRACER_SPEED.default;
  const travel=Math.max(.05,Math.min(dist,90)/speed);
  const maxLife=travel+.07;
  pTrs.push({m,vx:dir.x*speed,vy:dir.y*speed,vz:dir.z*speed,life:maxLife,maxLife});
}
function doReload(){
  const w=getW();if(w.isBomb||w.isSmoke)return;
  if(reloading||ammo===w.clip||uAmmo===0)return;
  if(w.isSniper&&zooming)zooming=false;
  reloading=true;reloadT=w.reload;reloadTot=w.reload;
  playSfx('reload');
  G('rmsg').style.opacity='1';G('reload-wrap').style.display='block';G('reload-fill').style.width='0%';
}
function throwMine(){
  const mineIdx=5,mineW=WEAPONS[mineIdx];
  if(reloading||sCD>0)return;
  if(playerMineCD>0){showMsg('💣 Новую мину можно поставить через '+Math.ceil(playerMineCD)+' сек.');return;}
  if(playerMineCount()>=MAX_PLAYER_MINES||mines.length>=MAX_MINES){showMsg('Лимит активных мин достигнут!');return;}
  const mineAmmo=weaponAmmoValue(mineIdx);
  if(mineAmmo<=0){
    if(curW===mineIdx)doReload();
    else showMsg('💣 Мины закончились — выберите оружие 6 и перезарядите');
    return;
  }
  setWeaponAmmo(mineIdx,mineAmmo-1);
  sCD=mineW.rate;
  if(curW===mineIdx)wHUD();
  const dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  const m=mkMine();m.position.copy(camera.position.clone().addScaledVector(dir,.6));scene.add(m);
  const vv=dir.clone().multiplyScalar(9);vv.y+=5;
  mines.push({m,vx:vv.x,vy:vv.y,vz:vv.z,fall:true,life:Infinity,armed:false,aT:1.5,checkT:.08,ph:0,team:'player',owner:'player',dmg:mineW.dmg*PLAYER_DAMAGE_BOOST*EXPLOSION_DAMAGE_BOOST*playerDamageMultiplier()*plr.mineDamageM*plr.explosiveDamageM,radius:9*plr.explosiveRadiusM*plr.mineRadiusM});
  playerMineCD=MINE_COOLDOWN_SECONDS*plr.mineCooldownM;
  mineHudSecond=-1;
  updateMineHUD();
}

function placeBomb(){
  const bombIdx=6,bombW=WEAPONS[bombIdx];
  if(reloading||sCD>0)return;
  if(playerBombCD>0){showMsg('🧨 Новую бомбу можно поставить через '+Math.ceil(playerBombCD)+' сек.');return;}
  const bombAmmo=weaponAmmoValue(bombIdx);
  if(bombAmmo<=0){showMsg('🧨 Сначала подберите бомбу на карте');return;}
  if(mines.length>=MAX_MINES){showMsg('Лимит активной взрывчатки достигнут');return;}
  setWeaponAmmo(bombIdx,bombAmmo-1);
  sCD=bombW.rate;
  if(curW===bombIdx)wHUD();
  const dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  dir.y=0;if(dir.lengthSq()<.01)dir.set(0,0,-1);dir.normalize();
  const m=mkBomb();
  const pos=camera.position.clone().addScaledVector(dir,1.15);
  pos.y=.34;
  const coll=collideWalls(pos.x,pos.z,.42);
  m.position.set(coll.x,.34,coll.z);
  scene.add(m);
  mines.push({
    m,vx:0,vy:0,vz:0,fall:false,life:Infinity,armed:true,aT:0,checkT:0,ph:0,
    team:'player',owner:'player',src:null,kind:'bomb',fuseT:BOMB_FUSE_SECONDS*plr.bombFuseM,fuseTotal:BOMB_FUSE_SECONDS*plr.bombFuseM,
    dmg:BOMB_BASE_DAMAGE*PLAYER_DAMAGE_BOOST*playerDamageMultiplier()*plr.bombDamageM*plr.explosiveDamageM,
    radius:BOMB_BLAST_RADIUS*plr.bombRadiusM*plr.explosiveRadiusM
  });
  playerBombCD=BOMB_COOLDOWN_SECONDS;
  bombHudSecond=-1;updateMineHUD();
  showMsg('🧨 Фитиль зажжён: мощный взрыв через 45 секунд!');
}


function throwSmokeGrenade(){
  const smokeW=WEAPONS[SMOKE_WEAPON_INDEX];
  if(reloading||sCD>0)return;
  if(playerSmokeCD>0){showMsg('🌫️ Дымовуха будет готова через '+Math.ceil(playerSmokeCD)+' сек.');return;}
  if(smokeGrenades.length>=2){showMsg('🌫️ Дождитесь раскрытия предыдущей дымовухи');return;}
  const dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).normalize();
  const m=mkSmokeGrenade();
  m.position.copy(camera.position).addScaledVector(dir,.72);m.position.y-=.12;scene.add(m);
  const v=dir.clone().multiplyScalar(12.5);v.y+=5.2;
  smokeGrenades.push({m,vx:v.x,vy:v.y,vz:v.z,rx:7+Math.random()*5,rz:6+Math.random()*5,age:0,life:3,grounded:false,trailT:.02});
  setWeaponAmmo(SMOKE_WEAPON_INDEX,0);
  sCD=smokeW.rate;recoil=.45;
  recoilPitch+=(smokeW.recoilY||.02)*plr.recoilM;
  trigMuzzle(camera.position.clone().addScaledVector(dir,.62),0xcbd4d8,.72);
  playerSmokeCD=SMOKE_COOLDOWN_SECONDS*plr.smokeCooldownM;
  smokeHudSecond=-1;wHUD();
  showMsg('🌫️ Дымовуха запущена · перезарядка '+Math.ceil(playerSmokeCD)+' сек.');
}

// ─── UPDATE PROJECTILES ─────────────────

function awardExplosionKill(victim,ownerType,ownerBot,kind){
  if(ownerType==='player'){
    const pts=kind==='bomb'?160:kind==='mine'?120:110;
    addXP((victim.type+1)*(kind==='bomb'?42:kind==='mine'?35:28));
    score+=(victim.type+1)*pts;
    kills++;grantPlayerKillRewards();allyKills++;
    markHUD();updateTeamScore();
    showHitMarker('kill');playSfx('kill');
    showKillMedal({explosive:true});
    scorePop((kind==='bomb'?'🧨':kind==='mine'?'💣':'🚀')+'+'+(victim.type+1)*pts);
  }else{
    enemyKills++;
    if(ownerBot)ownerBot.kills=(ownerBot.kills||0)+1;
    updateTeamScore();
  }
}
function applyBlastDamage(pos,radius,maxDamage,ownerType='world',ownerBot=null,kind='rocket',playerSelfScale=.35){
  const r2=radius*radius;
  const dir=new THREE.Vector3();
  for(const en of enemies){
    if(!en.alive||en===ownerBot)continue;
    const center=en.group.position.clone();center.y+=.9;
    const dx=center.x-pos.x,dy=center.y-pos.y,dz=center.z-pos.z;
    const d2=dx*dx+dy*dy+dz*dz;
    if(d2>=r2)continue;
    const d=Math.sqrt(d2);
    let falloff=Math.max(.08,1-d/radius);
    if(wallBetween(pos,center,losMeshes))falloff*=.48;
    const before=en.alive;
    dir.set(dx,Math.max(.12,dy),dz).normalize();
    en.hurt(maxDamage*falloff,dir,ownerType==='player'?'player':'bot');
    if(before&&!en.alive)awardExplosionKill(en,ownerType,ownerBot,kind);
  }
  const pdx=camera.position.x-pos.x,pdy=camera.position.y-pos.y,pdz=camera.position.z-pos.z;
  const pd2=pdx*pdx+pdy*pdy+pdz*pdz;
  if(pd2<r2&&!dying){
    const pd=Math.sqrt(pd2);
    let falloff=Math.max(.06,1-pd/radius);
    if(wallBetween(pos,camera.position.clone(),losMeshes))falloff*=.48;
    if(ownerType==='player')falloff*=playerSelfScale;
    let playerBlast=maxDamage*falloff;
    if(kind==='bomb')playerBlast=Math.min(playerBlast,850);
    applyDamageToPlayer(playerBlast,kind,ownerBot);
  }
}
function detonateRocket(arr,index,r,pos){
  const ownerType=r.ownerType||'bot';
  const radius=r.blastRadius||6.5;
  const blastDistance=camera.position.distanceTo(pos);
  if(blastDistance<55){const proximity=Math.max(.18,1-blastDistance/70);playSfx('explosion',proximity);triggerScreenShake(proximity*.95,.20);}
  spawnCombatImpact(pos,'rocket');
  explode(pos.clone(),ownerType==='player'?0xff8800:0xff3300,radius);
  applyBlastDamage(pos,radius,r.dmg,ownerType,r._src||null,'rocket',.28);
  destroySceneObject(r.m);
  arr.splice(index,1);
}

function tickProjectiles(dt){
  let warn=false;
  const playerTargetPos=(dying&&deathCamActive)?deathCamPlayerPos:camera.position;
  const _prev=new THREE.Vector3();
  const processRockets=(arr)=>{
    for(let i=arr.length-1;i>=0;i--){
      const r=arr[i];r.life-=dt;
      _prev.copy(r.m.position);
      r.m.position.x+=r.vx*dt;r.m.position.y+=r.vy*dt;r.m.position.z+=r.vz*dt;
      const rs=Math.hypot(r.vx,r.vy,r.vz);
      if(r.maxSpeed&&rs<r.maxSpeed){const mul=1+dt*.55;r.vx*=mul;r.vy*=mul;r.vz*=mul;}
      r.fT=(r.fT||0)+dt;
      const flamePulse=.88+Math.sin(r.fT*32)*.12;
      const flames=r.m.userData.flames||[];
      for(let fi=0;fi<flames.length;fi++){
        const flame=flames[fi];
        flame.material.opacity=(fi===1?.82:fi===0?.38:.26)*(.88+flamePulse*.14);
        const s=flamePulse*(fi===0?1.08:1);
        flame.scale.set(s,1+(flamePulse-.88)*1.8,s);
      }
      r.sT=(r.sT||0)+dt;
      if(r.sT>.058){
        r.sT=0;
        spawnSmoke(r.m.position,0x4b4f55);
        if(!PERF_MODE||Math.random()<.55)spawnP(r.m.position,0xffa02a,.45);
      }
      if((r.ownerType||'bot')==='bot'&&r.m.position.distanceToSquared(playerTargetPos)<225)warn=true;

      let impact=false;
      if(r.m.position.y<=.10)impact=true;
      else if(wallBetween(_prev,r.m.position,wallMeshes))impact=true;
      else{
        for(const en of enemies){
          if(!en.alive||en===r._src)continue;
          if(r.m.position.distanceToSquared(en.group.position)<2.65){impact=true;break;}
        }
        if(!impact&&(r.ownerType||'bot')==='bot'&&r.m.position.distanceToSquared(playerTargetPos)<2.5)impact=true;
      }
      if(impact||r.life<=0){
        const pos=r.m.position.clone();
        if(pos.y<.10)pos.y=.10;
        detonateRocket(arr,i,r,pos);
      }
    }
  };
  processRockets(eRkts);
  processRockets(pRkts);

  for(let i=pTrs.length-1;i>=0;i--){
    const tr=pTrs[i];tr.life-=dt;
    tr.m.position.x+=tr.vx*dt;tr.m.position.y+=tr.vy*dt;tr.m.position.z+=tr.vz*dt;
    const f=tr.life/tr.maxLife;
    const age=tr.maxLife-tr.life;
    const pulse=.90+Math.sin(age*42+(tr.m.userData.phase||0))*.10;
    tr.m.children[0].material.opacity=Math.max(0,Math.min(1,f*1.20));
    tr.m.children[1].material.opacity=Math.max(0,f*.98);
    if(tr.m.children[2]){tr.m.children[2].material.opacity=Math.max(0,f*.46);tr.m.children[2].scale.set(pulse,pulse,1);}
    if(tr.m.children[3]){tr.m.children[3].material.opacity=Math.max(0,f*.27);tr.m.children[3].scale.set(.95+pulse*.10,.95+pulse*.10,1);}
    if(tr.life<=0){destroySceneObject(tr.m);pTrs.splice(i,1);}
  }
  G('rwarn').style.opacity=warn?'1':'0';
}

function spawnERkt(from,dir,dmg,team,src){
  const m=mkRkt(0xff2200);m.position.copy(from).addScaledVector(dir,1.4);m.quaternion.setFromUnitVectors(_UP,dir);scene.add(m);
  eRkts.push({m,vx:dir.x*BOT_ROCKET_SPEED,vy:dir.y*BOT_ROCKET_SPEED,vz:dir.z*BOT_ROCKET_SPEED,life:12,maxSpeed:BOT_ROCKET_SPEED,dmg,sT:0,fT:0,team:'bot',ownerType:'bot',_src:src,blastRadius:6.2});
}

// ─── MINES ──────────────────────────────
function tickMines(dt){
  for(let i=mines.length-1;i>=0;i--){
    const mn=mines[i];
    mn.ph=(mn.ph||0)+dt*3;
    if(mn.fall){
      mn.vy-=20*dt;
      mn.m.position.x+=mn.vx*dt;mn.m.position.y+=mn.vy*dt;mn.m.position.z+=mn.vz*dt;
      if(mn.m.position.y<=.08){
        mn.m.position.y=.08;mn.fall=false;mn.vx=mn.vy=mn.vz=0;
        mn.checkT=.04+Math.random()*.08;
      }
      continue;
    }

    if(mn.kind==='bomb'){
      mn.fuseT-=dt;
      updateBombFuseVisual(mn,dt);
      if(mn.fuseT>0)continue;
      const pos=mn.m.position.clone();pos.y=Math.max(.12,pos.y);
      const ownerType=mn.owner==='player'?'player':'bot';
      const radius=mn.radius||BOMB_BLAST_RADIUS;
      explode(pos,ownerType==='player'?0xffb000:0xff3b18,18);
      spawnBombBlastWave(pos,radius,ownerType);
      applyBlastDamage(pos,radius,mn.dmg||BOMB_BASE_DAMAGE,ownerType,mn.src||null,'bomb',.18);
      mn.removed=true;destroySceneObject(mn.m);mines.splice(i,1);updateMineHUD();
      continue;
    }

    mn.aT-=dt;
    if(!mn.armed&&mn.aT<=0)mn.armed=true;
    mn.checkT=(mn.checkT||0)-dt;
    if(mn.checkT>0)continue;
    mn.checkT=.12+Math.random()*.10;
    const lens=mn.m.children[2];
    if(lens&&lens.material)lens.material.color.setHex(mn.armed?(Math.sin(mn.ph*8)>0?0xff0000:0x880000):0xff8800);
    if(!mn.armed)continue;

    const mp=mn.m.position;
    let trig=false;
    for(const en of enemies){
      if(!en.alive||en===mn.src)continue;
      const dx=mp.x-en.group.position.x,dz=mp.z-en.group.position.z;
      if(dx*dx+dz*dz<10){trig=true;break;}
    }
    if(!trig&&mn.owner==='bot'){
      const pdx=mp.x-camera.position.x,pdz=mp.z-camera.position.z;
      if(pdx*pdx+pdz*pdz<10)trig=true;
    }
    if(!trig)continue;

    const ownerType=mn.owner==='player'?'player':'bot';
    const radius=mn.radius||9;
    const pos=mp.clone();
    explode(pos,0xff4400,6);
    applyBlastDamage(pos,radius,mn.dmg||WEAPONS[5].dmg,ownerType,mn.src||null,'mine',.25);
    mn.removed=true;destroySceneObject(mn.m);mines.splice(i,1);updateMineHUD();
  }
}

// ═══════════════════════════════════════════

const TEAM_INTEL={
  ally:{pos:new THREE.Vector3(),time:-999,target:null},
  enemy:{pos:new THREE.Vector3(),time:-999,target:null}
};
function angleDelta(a,b){return Math.atan2(Math.sin(b-a),Math.cos(b-a));}
function lerpAngle(a,b,t){return a+angleDelta(a,b)*Math.max(0,Math.min(1,t));}
function countTargeters(target,team){
  let n=0;
  for(const b of enemies)if(b.alive&&b.team===team&&b.targetEn===target)n++;
  return n;
}
function countPlayerTargeters(team,exclude=null){
  let n=0;
  for(const b of enemies){
    if(b===exclude||!b.alive||b.team!==team)continue;
    if(b.targetIsPlayer)n++;
  }
  return n;
}
let playerPressureCacheT=-999;
const playerPressureSet=new Set();
function canPressurePlayer(bot){
  const now=performance.now();
  if(now-playerPressureCacheT>120){
    playerPressureCacheT=now;
    playerPressureSet.clear();
    const maxPressure=level<4?2:level<10?3:level<18?4:5;
    const candidates=enemies
      .filter(b=>b.alive&&b.targetIsPlayer&&b.canSeeTarget)
      .sort((a,b)=>a.group.position.distanceToSquared(camera.position)-b.group.position.distanceToSquared(camera.position));
    for(let i=0;i<Math.min(maxPressure,candidates.length);i++)playerPressureSet.add(candidates[i]);
  }
  return playerPressureSet.has(bot);
}
function friendlyInLine(from,dir,team,maxDist){return false;}
function friendlyNearPoint(pos,team,radius){return false;}
function nearestVisiblePickup(type,pos,maxDist=28){
  let best=null,bestD=maxDist;
  for(const pk of pickups){
    if(pk.type!==type||!pk.m.visible)continue;
    const d=pk.m.position.distanceTo(pos);
    if(d<bestD){best=pk;bestD=d;}
  }
  return best;
}
function claimHealthPickup(bot,pk){
  if(!pk||!pk.m.visible)return false;
  bot.hp=Math.min(bot.maxHp,bot.hp+Math.max(35,bot.maxHp*.46));
  pk.m.visible=false;pk.respawn=14;pk.cd=.8;
  bot.pickupTarget=null;
  return true;
}
