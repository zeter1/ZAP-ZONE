'use strict';

// Canonical owner for post-shot bot burst/cadence policy.
// The caller has already attempted the firearm shot; this owner preserves the
// legacy burst reset, pause, next-shot schedule, RNG order and reload handoff.
function applyBotPostShotCadence(bot){
  bot.burstLeft--;
  if(bot.burstLeft<=0){
    const attackingPlayer=bot.team==='enemy'&&bot.targetIsPlayer;
    let base=attackingPlayer
      ? (bot.weapon.isRocket||bot.weapon.key==='shotgun'||bot.weapon.isSniper?1:2)
      : (bot.weapon.isSniper?1:(bot.weapon.key==='rifle'||bot.weapon.key==='plasma'?4:bot.weapon.key==='pistol'?3:1));
    let extra=bot.weapon.isSniper?1:(attackingPlayer?2:(bot.weapon.key==='rifle'||bot.weapon.key==='plasma'?5:3));
    const suppressing=bot.tacticalMode==='suppress'&&!bot.weapon.isRocket&&!bot.weapon.isSniper;
    if(suppressing){base+=2;extra+=2;}
    bot.burstLeft=base+Math.floor(Math.random()*extra);
    const normalPause=((bot.weapon.isSniper?.72:bot.weapon.isRocket?.58:bot.weapon.key==='shotgun'?.34:.16)+Math.random()*(.18+(1-bot.aimSkill)*.22))*(suppressing?.48:1);
    bot.burstPauseT=attackingPlayer?(suppressing?.24+Math.random()*.22:.42+Math.random()*.42):normalPause;
  }
  bot.sT=Math.max((bot.team==='enemy'&&bot.targetIsPlayer)?0.095:0.055,bot.weapon.rate*bot.fireRateMul*(.96+Math.random()*.24));
  if(bot.mag<=0)startBotReload(bot);
}
