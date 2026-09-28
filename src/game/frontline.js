'use strict';

// ─── FRONTLINE OBJECTIVE / GAME MODE ────────────────
// Canonical owner for objective state, capture/rotation, save contract and objective HUD/marker.
// Map doctrine/zones stay in ai/tactics.js; individual bot execution stays in entities/bots.js.

let allyControlScore=0,enemyControlScore=0;

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
function showFrontlineCaptureBurst(team){
  const el=G('frontline-capture-burst');if(!el)return;
  el.classList.remove('on','ally','enemy');void el.offsetWidth;
  el.classList.add(team==='ally'?'ally':'enemy','on');
  el.onanimationend=()=>el.classList.remove('on','ally','enemy');
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
  showFrontlineCaptureBurst(team);
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
