'use strict';

// ─── BOT TACTICAL POSITIONING OWNER ────────────────────────────────────────
// Chooses per-bot cover and flank destinations. Squad doctrine stays in
// ai/tactics.js, FSM/commit timers stay in entities/bots.js, and locomotion
// mechanics stay in ai/bot-navigation.js. Engine/game globals are
// invocation-time dependencies after the sequential classic-script bootstrap.

function findBotTacticalCover(bot,target){
  let best=null,bestScore=1e9;
  const from=bot.group.position,tx=target.x,tz=target.z;
  const routeFrom=from.clone();routeFrom.y=.55;
  for(const cp of COVER_POINTS){
    const p=new THREE.Vector3(cp[0],0,cp[1]);
    const dFrom=p.distanceTo(from),targetDist=p.distanceTo(target);
    if(dFrom<4||dFrom>32||targetDist<7)continue;
    const eye=p.clone();eye.y=1.35;
    const tgt=target.clone();tgt.y=1.45;
    if(!wallBetween(eye,tgt,losMeshes))continue;
    const routeTo=p.clone();routeTo.y=.55;
    const routePenalty=botRoutePenalty(routeFrom,routeTo,bot.team);
    let crowdPenalty=0;
    for(const other of enemies){
      if(!other.alive||other===bot||other.team!==bot.team)continue;
      const od=other.group.position.distanceTo(p);
      if(od<4.5)crowdPenalty+=(4.5-od)*1.6;
    }
    const objective=frontlineZone();
    const objectiveDist=Math.hypot(p.x-objective.x,p.z-objective.z);
    const objectiveCoverPenalty=(bot.commandDoctrine==='hold'||bot.commandDoctrine==='retake')
      ?Math.max(0,objectiveDist-objective.r*.78)*.42
      :Math.max(0,objectiveDist-objective.r*1.10)*.12;
    let score=dFrom+Math.abs(targetDist-15)*.17+crowdPenalty+routePenalty+objectiveCoverPenalty;
    const fromObjectiveDist=Math.hypot(from.x-objective.x,from.z-objective.z);
    const objectiveAdvance=fromObjectiveDist-objectiveDist;
    if(bot.commandDoctrine==='breach'||bot.commandDoctrine==='retake')score-=Math.max(-3,Math.min(10,objectiveAdvance))*.46;
    if(objectiveDist<objective.r*.78&&(bot.commandDoctrine==='hold'||bot.commandDoctrine==='retake'))score-=3.4;
    const side=((p.x-from.x)*(tz-from.z)-(p.z-from.z)*(tx-from.x));
    if(Math.sign(side)===Math.sign(bot.sideBias))score-=2.4;
    if(score<bestScore){bestScore=score;best=p;}
  }
  return best?best.clone():null;
}

function findBotFlankPoint(bot,target,sideSign){
  const from=bot.group.position;
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
    const routePenalty=botRoutePenalty(routeFrom,routeTo,bot.team);
    let crowd=0;
    for(const mate of enemies){
      if(!mate.alive||mate===bot||mate.team!==bot.team)continue;
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
