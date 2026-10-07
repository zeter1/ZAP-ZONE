'use strict';

// Per-bot weapon-selection policy owner.
// Weapon scoring/data/visual construction stay in weapons/system.js; FSM and fire-control stay in their owners.
function shouldBotReconsiderWeapon(bot,dist){
  const weapon=bot.weapon;
  return !!weapon&&(
    bot.weaponSwitchT<=0||
    dist>weapon.range*1.18||
    (dist<8&&weapon.isRocket)||
    (weapon.key==='shotgun'&&dist>22)
  );
}

function selectBotWeapon(bot,distHint=22,force=false){
  const prevWeapon=bot.weapon;
  const prev=prevWeapon?prevWeapon.idx:-1;
  const currentUsable=!!(prevWeapon&&
    distHint<=prevWeapon.range*1.04&&
    !(distHint<9&&prevWeapon.isRocket)&&
    !(distHint>22&&prevWeapon.key==='shotgun')&&
    !(distHint<22&&prevWeapon.isSniper));
  if(!force&&currentUsable&&bot.mag>0&&Math.random()<.78){
    bot.weaponSwitchT=2.4+Math.random()*2.2;
    return;
  }
  const candidate=chooseBotWeaponByDistance(distHint,prev,force,bot.role);
  if(!force&&prevWeapon&&currentUsable&&candidate.idx!==prev){
    const prevFit=Math.abs(distHint-prevWeapon.opt)/Math.max(8,prevWeapon.range);
    const nextFit=Math.abs(distHint-candidate.opt)/Math.max(8,candidate.range);
    if(nextFit>prevFit*.82&&Math.random()<.72){
      bot.weaponSwitchT=2.2+Math.random()*2.0;
      return;
    }
  }
  bot.weapon=candidate;
  if(force||bot.mag<=0||bot.mag>bot.weapon.clip)bot.mag=bot.weapon.clip;
  bot.weaponSwitchT=4.5+Math.random()*4.0;
  refreshBotWeaponVisual(bot);
  if(typeof syncBotModel46RoleVariant==='function')syncBotModel46RoleVariant(bot);
}
