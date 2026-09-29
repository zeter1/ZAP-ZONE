'use strict';

// Canonical owner for executing an already-requested bot dodge.
// Producers decide when/why to dodge; this owner preserves the legacy
// direction, duration, speed, cooldown and optional-jump policy including RNG order.
function applyBotDodgeResponse(bot,preferredDir=0,urgency=1){
  if(bot.dodgeCD>0||bot.dodgeT>0)return;
  bot.dodgeDir=preferredDir||(Math.random()<.5?-1:1);
  bot.dodgeT=(0.34+Math.random()*.24)*Math.max(.86,Math.min(1.14,urgency));
  bot.dodgeSpd=bot.speed*(1.30+bot.aimSkill*.16)*Math.max(.96,Math.min(1.08,urgency));
  bot.dodgeCD=.88+Math.random()*.62;
  if(Math.random()<0.16*urgency&&bot.jV===0)bot.jV=4.6+Math.random()*1.6;
}
