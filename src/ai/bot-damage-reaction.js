'use strict';

// Canonical owner for damage-event retaliation policy.
// HP mutation, hit feedback, dodge execution and death lifecycle stay in src/entities/bots.js.

function applyBotDamageReaction(bot,dmg,fromTeam,source=null){
  const botSource=source&&source!=='player'&&source!==bot&&source.alive&&source.team!==bot.team?source:null;
  const playerSource=bot.team==='enemy'&&(source==='player'||fromTeam==='player'||fromTeam==='ally');
  const shouldRetaliate=!bot.canSeeTarget||bot.targetLockT<=.15||dmg>=bot.maxHp*.10;
  if(botSource&&shouldRetaliate){
    bot.targetEn=botSource;bot.targetIsPlayer=false;
    bot.lastKnown.copy(botSource.group.position);bot.lastKnownVel.set(botSource.velX||0,0,botSource.velZ||0);
    bot.lastSeenT=0;bot.lastTargetSeenAt=performance.now();bot.losT=0;
    bot.targetLockT=.92+bot.aimSkill*.45;bot.searchPoint=null;bot.searchStep=0;
  }else if(playerSource&&!dying&&shouldRetaliate){
    bot.targetEn=null;bot.targetIsPlayer=true;
    bot.lastKnown.copy(camera.position);bot.lastKnownVel.set(plrVx,0,plrVz);
    bot.lastSeenT=0;bot.lastTargetSeenAt=performance.now();bot.losT=0;
    bot.targetLockT=.92+bot.aimSkill*.45;bot.searchPoint=null;bot.searchStep=0;
  }else{
    bot.lastSeenT=Math.min(bot.lastSeenT,1.15);
  }
  bot.reactionT=Math.min(bot.reactionT,.07);
  bot.burstPauseT=Math.min(bot.burstPauseT,.06);
  if(bot.aiState==='patrol'||bot.aiState==='search')bot.aiState='hunt';
  bot.stateCD=Math.min(bot.stateCD,.14);
}
