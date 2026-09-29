'use strict';

// Canonical owner for deterministic per-bot progression scaling.
// Enemy remains the lifecycle/combat orchestrator; this owner preserves the
// existing level/kills/role formulas, caps/floors and HP-rescale semantics.
function applyBotProgressionScaling(bot,force=false){
  if(!force&&bot.levelSync===level)return;
  const oldMax=bot.maxHp||1;
  const oldHp=bot.hp||oldMax;
  const hpRatio=force?1:Math.max(.24,Math.min(1,oldHp/oldMax));
  const roleHp=bot.role==='anchor'?1.18:bot.role==='assault'?1.02:bot.role==='engineer'?1.10:1.05;
  const roleSpd=(bot.role==='flankL'||bot.role==='flankR')?1.12:(bot.role==='anchor'?.96:1.03);
  const roleDmg=bot.role==='anchor'?1.10:(bot.role==='engineer'?1.02:1.06);
  const lvl=Math.max(1,level);
  const dominance=Math.min(.55,kills*.009);
  const combatGrowth=Math.min(.28,kills*.0045);
  bot.aimSkill=Math.min(.97,.58+bot.skillSeed+lvl*.013+Math.min(.13,kills*.0018));
  bot.maxHp=bot.baseHp*(1.08+lvl*.082+dominance)*roleHp;
  bot.hp=force?bot.maxHp:Math.min(bot.maxHp,bot.maxHp*hpRatio+Math.max(10,bot.maxHp*.05));
  bot.speed=bot.baseSpeed*(1.02+Math.min(.28,lvl*.012)+Math.min(.12,kills*.0020))*roleSpd;
  bot.baseDmgMul=(.86+bot.type*.06)*(1+lvl*.038+combatGrowth)*roleDmg;
  bot.curAcc=Math.max(.0075,bot.baseAcc*(1.03-Math.min(lvl*.019,.58)-Math.min(.18,kills*.0022))*(bot.role==='anchor'?.82:1));
  bot.fireRateMul=Math.max(.62,1.08-lvl*.013-Math.min(.20,kills*.0025))*(bot.role==='assault'?.92:1);
  bot.levelSync=level;
}
