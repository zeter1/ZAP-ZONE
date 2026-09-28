// Canonical owner for squad coordination, map doctrine and Adaptive Commander policy.
// Per-bot perception, FSM, locomotion, cover/flank execution and Frontline objective state stay in src/entities/bots.js.

const BOT_MAP_ZONES=[
  {id:'mid',label:'ЦЕНТР',x:0,z:0,r:21,weight:1.34},
  {id:'north',label:'СЕВЕР',x:0,z:34,r:20,weight:1.08},
  {id:'south',label:'ЮГ',x:0,z:-34,r:20,weight:1.08},
  {id:'west',label:'ЗАПАД',x:-34,z:0,r:19,weight:.94},
  {id:'east',label:'ВОСТОК',x:34,z:0,r:19,weight:.94}
];

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
