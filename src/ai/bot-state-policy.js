'use strict';

// ─── BOT AI STATE-SELECTION POLICY OWNER ──────────────────────────────────
// Chooses the next high-level Enemy.aiState from facts already derived by the
// bot orchestrator. Cooldown decay, sensory/tactical fact production and every
// state's movement/combat execution remain in src/entities/bots.js.
//
// This function intentionally performs exactly one RNG draw after every
// selection to preserve the legacy stateCD scheduling contract.
function applyBotStateSelectionPolicy(bot,{
  targetPos,
  hpPct,
  strategicRetreat,
  localThreats,
  supportReady,
  mapOrderWanted,
  mapObjective,
  dist
}){
  if(bot.pickupTarget&&bot.pickupTarget.m.visible&&hpPct<.48)bot.aiState='resupply';
  else if(targetPos&&strategicRetreat&&((hpPct<0.25&&dist<20)||(localThreats>=3&&hpPct<.58)))bot.aiState='retreat';
  else if(targetPos&&supportReady&&bot.tacticalMode==='support')bot.aiState='support';
  else if(targetPos&&bot.coverPoint&&(!bot.canSeeTarget||bot.role==='anchor'||bot.reloadT>0||(localThreats>=3&&hpPct<.72)||bot.suppressedT>0))bot.aiState='cover';
  else if(targetPos&&bot.flankPoint&&bot.flankCommitT>0&&bot.tacticalMode==='flank')bot.aiState='flank';
  else if(mapOrderWanted)bot.aiState='objective';
  else if(targetPos&&bot.canSeeTarget&&dist<=bot.weapon.range*(bot.team==='ally'?1.14:1.08))bot.aiState='engage';
  else if(targetPos&&bot.lastSeenT<8.5)bot.aiState='hunt';
  else if(targetPos&&bot.lastSeenT<14.5)bot.aiState='search';
  else bot.aiState=mapObjective?'objective':'patrol';
  bot.stateCD=.22+Math.random()*.30;
}
