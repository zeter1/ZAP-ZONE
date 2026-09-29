'use strict';

// Canonical owner for bot near-miss suppression-response policy.
// Projectile/near-miss detection stays in src/combat/combat.js; suppression decay and FSM consumption stay in src/entities/bots.js.

function applyBotSuppressionResponse(bot,source,intensity=.6){
  if(!bot.alive||!source||source===bot||source.team===bot.team)return;
  const pressure=Math.max(.3,Math.min(1.4,intensity));
  bot.suppressedT=Math.max(bot.suppressedT,.62+pressure*.78);
  bot.suppressionSource=source;
  bot.coverCooldownT=Math.min(bot.coverCooldownT,.12);
  if(bot.hp/bot.maxHp<.72||pressure>.9){
    bot.coverEvalT=Math.min(bot.coverEvalT,.05);
    bot.stateCD=Math.min(bot.stateCD,.08);
  }
}
