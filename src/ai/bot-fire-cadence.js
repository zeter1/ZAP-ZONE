'use strict';

// Canonical owner for outcome-aware bot burst/cadence and blocked-attempt retry policy.
// Fire-control reports what happened; this owner decides when the next firearm
// attempt is allowed and which outcomes consume a real burst slot.
function applyBotFireCadence(bot,shotOutcome){
  if(shotOutcome===BOT_SHOT_OUTCOME.ROCKET_COOLDOWN){
    bot.sT=Math.max(.05,bot.rocketShotCD||0);
    return;
  }
  if(shotOutcome===BOT_SHOT_OUTCOME.FRIENDLY_FIRE){
    bot.sT=.10+Math.random()*.12;
    return;
  }
  if(shotOutcome===BOT_SHOT_OUTCOME.ROCKET_SAFETY){
    bot.sT=.18;
    return;
  }
  if(shotOutcome!==BOT_SHOT_OUTCOME.EMITTED&&shotOutcome!==BOT_SHOT_OUTCOME.OCCLUDED){
    throw new Error('Unknown bot shot outcome: '+shotOutcome);
  }

  // Occluded attempts intentionally keep the legacy cadence/burst semantics.
  // This avoids silently increasing wall/smoke pressure while safety blocks
  // preserve the burst that was never actually fired.
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
  if(bot.weapon.isRocket&&shotOutcome===BOT_SHOT_OUTCOME.EMITTED)bot.sT=Math.max(bot.sT,ROCKET_FIRE_INTERVAL);
  if(bot.mag<=0)startBotReload(bot);
}
