import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../src/ai/bot-progression-scaling.js',import.meta.url),'utf8');

function createHarness({level=1,kills=0}={}){
  const context={level,kills};
  vm.createContext(context);
  vm.runInContext(
    source+'\n;globalThis.__BOT_PROGRESSION_SCALING_TEST__={applyBotProgressionScaling};',
    context,
    {filename:'src/ai/bot-progression-scaling.js'}
  );
  return {
    apply:context.__BOT_PROGRESSION_SCALING_TEST__.applyBotProgressionScaling,
    setProgress(nextLevel,nextKills){context.level=nextLevel;context.kills=nextKills;}
  };
}
function makeBot(overrides={}){
  return {
    role:'support',type:2,skillSeed:.04,
    baseHp:100,baseSpeed:4,baseAcc:.10,
    levelSync:-1,
    ...overrides
  };
}
function near(actual,expected,label,epsilon=1e-12){
  assert.ok(Math.abs(actual-expected)<=epsilon,label+' expected '+expected+', got '+actual);
}

test('force initialization applies exact level/kills formulas and fills HP',()=>{
  const harness=createHarness({level:5,kills:20});
  const bot=makeBot({role:'assault',type:1});
  harness.apply(bot,true);

  const lvl=5,dominance=.18,combatGrowth=.09;
  const expectedMax=100*(1.08+lvl*.082+dominance)*1.02;
  near(bot.aimSkill,.58+.04+lvl*.013+.036,'aim skill');
  near(bot.maxHp,expectedMax,'max HP');
  near(bot.hp,expectedMax,'force HP');
  near(bot.speed,4*(1.02+lvl*.012+.04)*1.03,'speed');
  near(bot.baseDmgMul,(.86+.06)*(1+lvl*.038+combatGrowth)*1.06,'damage multiplier');
  near(bot.curAcc,.10*(1.03-lvl*.019-.044),'accuracy');
  near(bot.fireRateMul,(1.08-lvl*.013-.05)*.92,'fire-rate multiplier');
  assert.equal(bot.levelSync,5);
});

test('same-level non-force call is an exact early return',()=>{
  const harness=createHarness({level:7,kills:999});
  const bot=makeBot({
    levelSync:7,maxHp:321,hp:123,speed:9,
    aimSkill:.11,baseDmgMul:2.2,curAcc:.22,fireRateMul:.33
  });
  const before={...bot};
  harness.apply(bot,false);
  assert.deepEqual(bot,before);
});

test('level and kills growth preserve exact caps',()=>{
  const harness=createHarness({level:40,kills:200});
  const bot=makeBot({type:4});
  harness.apply(bot,true);

  near(bot.aimSkill,.97,'aim cap');
  near(bot.maxHp,100*(1.08+40*.082+.55)*1.05,'dominance cap');
  near(bot.speed,4*(1.02+.28+.12)*1.03,'speed growth caps');
  near(bot.baseDmgMul,(.86+4*.06)*(1+40*.038+.28)*1.06,'combat-growth cap');
  assert.equal(bot.levelSync,40);
});

test('role modifiers remain asymmetric across HP speed damage accuracy and fire rate',()=>{
  const harness=createHarness({level:3,kills:0});
  const anchor=makeBot({role:'anchor'});
  const flank=makeBot({role:'flankL'});
  const engineer=makeBot({role:'engineer'});
  const assault=makeBot({role:'assault'});
  for(const bot of [anchor,flank,engineer,assault])harness.apply(bot,true);

  const hpBase=100*(1.08+3*.082);
  const speedBase=4*(1.02+3*.012);
  const dmgBase=(.86+2*.06)*(1+3*.038);
  near(anchor.maxHp,hpBase*1.18,'anchor HP');
  near(engineer.maxHp,hpBase*1.10,'engineer HP');
  near(flank.maxHp,hpBase*1.05,'flank HP');
  near(flank.speed,speedBase*1.12,'flank speed');
  near(anchor.speed,speedBase*.96,'anchor speed');
  near(anchor.baseDmgMul,dmgBase*1.10,'anchor damage');
  near(engineer.baseDmgMul,dmgBase*1.02,'engineer damage');
  near(anchor.curAcc,.10*(1.03-3*.019)*.82,'anchor accuracy role modifier');
  near(assault.fireRateMul,(1.08-3*.013)*.92,'assault fire-rate role modifier');
});

test('accuracy and fire-rate clamps preserve their exact role ordering',()=>{
  const harness=createHarness({level:100,kills:1000});
  const anchor=makeBot({role:'anchor',baseAcc:.02});
  const assault=makeBot({role:'assault',baseAcc:.02});
  harness.apply(anchor,true);
  harness.apply(assault,true);

  near(anchor.curAcc,.0075,'accuracy floor');
  near(assault.curAcc,.0075,'assault accuracy floor');
  near(anchor.fireRateMul,.62,'non-assault fire-rate floor');
  near(assault.fireRateMul,.62*.92,'assault multiplier after floor');
});

test('non-force rescale preserves clamped HP ratio plus legacy growth heal',()=>{
  const harness=createHarness({level:10,kills:0});
  const half=makeBot({levelSync:9,maxHp:100,hp:50});
  harness.apply(half,false);
  const halfMax=100*(1.08+10*.082)*1.05;
  near(half.maxHp,halfMax,'half-health max HP');
  near(half.hp,Math.min(halfMax,halfMax*.5+Math.max(10,halfMax*.05)),'half-health preserved+heal');

  const low=makeBot({levelSync:9,maxHp:100,hp:5});
  harness.apply(low,false);
  const lowMax=100*(1.08+10*.082)*1.05;
  near(low.hp,Math.min(lowMax,lowMax*.24+Math.max(10,lowMax*.05)),'24% HP-ratio floor');
});

test('progression scaling is deterministic and consumes no RNG',()=>{
  assert.doesNotMatch(source,/Math\.random\s*\(/);
});
