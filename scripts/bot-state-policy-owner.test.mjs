import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../src/ai/bot-state-policy.js',import.meta.url),'utf8');

function createHarness(randomValues=[0]){
  const context={__randomValues:[...randomValues],__randomIndex:0};
  vm.createContext(context);
  vm.runInContext(
    "Math.random=()=>{if(__randomIndex>=__randomValues.length)throw new Error('unexpected Math.random call #'+(__randomIndex+1));return __randomValues[__randomIndex++];};",
    context
  );
  vm.runInContext(
    source+'\n;globalThis.__BOT_STATE_POLICY_TEST__={applyBotStateSelectionPolicy};',
    context,
    {filename:'src/ai/bot-state-policy.js'}
  );
  return {
    apply:context.__BOT_STATE_POLICY_TEST__.applyBotStateSelectionPolicy,
    calls:()=>context.__randomIndex
  };
}

function makeBot(overrides={}){
  return {
    aiState:'patrol',
    stateCD:0,
    pickupTarget:null,
    tacticalMode:'normal',
    coverPoint:null,
    canSeeTarget:false,
    role:'assault',
    reloadT:0,
    suppressedT:0,
    flankPoint:null,
    flankCommitT:0,
    team:'ally',
    weapon:{range:30},
    lastSeenT:999,
    ...overrides
  };
}

function makeFacts(overrides={}){
  return {
    targetPos:{x:0,z:0},
    hpPct:.9,
    strategicRetreat:false,
    localThreats:0,
    supportReady:false,
    mapOrderWanted:false,
    mapObjective:null,
    dist:999,
    ...overrides
  };
}

function runSelection({bot={},facts={},random=.5}={}){
  const harness=createHarness([random]);
  const value=makeBot(bot);
  harness.apply(value,makeFacts(facts));
  return {bot:value,calls:harness.calls()};
}

function near(actual,expected,label,epsilon=1e-12){
  assert.ok(Math.abs(actual-expected)<=epsilon,label+' expected '+expected+', got '+actual);
}

test('priority conflicts preserve resupply -> retreat -> support -> cover -> flank -> objective ordering',()=>{
  const lowerFacts={
    strategicRetreat:true,
    localThreats:4,
    supportReady:true,
    mapOrderWanted:true,
    dist:8,
    hpPct:.20
  };
  const lowerBot={
    pickupTarget:{m:{visible:true}},
    tacticalMode:'support',
    coverPoint:{},
    canSeeTarget:true,
    role:'anchor',
    flankPoint:{},
    flankCommitT:1,
    lastSeenT:1
  };
  assert.equal(runSelection({bot:lowerBot,facts:lowerFacts}).bot.aiState,'resupply');

  assert.equal(runSelection({
    bot:{...lowerBot,pickupTarget:null},
    facts:lowerFacts
  }).bot.aiState,'retreat');

  assert.equal(runSelection({
    bot:{...lowerBot,pickupTarget:null},
    facts:{...lowerFacts,strategicRetreat:false,hpPct:.9}
  }).bot.aiState,'support');

  assert.equal(runSelection({
    bot:{...lowerBot,pickupTarget:null,tacticalMode:'flank'},
    facts:{...lowerFacts,strategicRetreat:false,supportReady:false,hpPct:.9}
  }).bot.aiState,'cover');

  assert.equal(runSelection({
    bot:{...lowerBot,pickupTarget:null,tacticalMode:'flank',coverPoint:null,role:'assault'},
    facts:{...lowerFacts,strategicRetreat:false,supportReady:false,hpPct:.9,localThreats:0}
  }).bot.aiState,'flank');

  assert.equal(runSelection({
    bot:{...lowerBot,pickupTarget:null,tacticalMode:'normal',coverPoint:null,flankPoint:null,role:'assault'},
    facts:{...lowerFacts,strategicRetreat:false,supportReady:false,hpPct:.9,localThreats:0}
  }).bot.aiState,'objective');
});

test('engage keeps inclusive ally/enemy range multipliers and map objective priority',()=>{
  const ally=runSelection({bot:{team:'ally',canSeeTarget:true,weapon:{range:30}},facts:{dist:34.2}});
  assert.equal(ally.bot.aiState,'engage');

  const allyOutside=runSelection({
    bot:{team:'ally',canSeeTarget:true,weapon:{range:30},lastSeenT:4},
    facts:{dist:34.200001}
  });
  assert.equal(allyOutside.bot.aiState,'hunt');

  const enemy=runSelection({bot:{team:'enemy',canSeeTarget:true,weapon:{range:30}},facts:{dist:32.4}});
  assert.equal(enemy.bot.aiState,'engage');

  const objectiveFirst=runSelection({
    bot:{team:'ally',canSeeTarget:true,weapon:{range:30}},
    facts:{mapOrderWanted:true,mapObjective:{x:10,z:10},dist:5}
  });
  assert.equal(objectiveFirst.bot.aiState,'objective');
});

test('hunt/search strict boundaries and final objective/patrol fallback stay unchanged',()=>{
  assert.equal(runSelection({bot:{lastSeenT:8.499}}).bot.aiState,'hunt');
  assert.equal(runSelection({bot:{lastSeenT:8.5}}).bot.aiState,'search');
  assert.equal(runSelection({bot:{lastSeenT:14.499}}).bot.aiState,'search');
  assert.equal(runSelection({bot:{lastSeenT:14.5},facts:{mapObjective:{x:1,z:1}}}).bot.aiState,'objective');
  assert.equal(runSelection({bot:{lastSeenT:14.5},facts:{mapObjective:null}}).bot.aiState,'patrol');
});

test('strict health thresholds do not drift at resupply, retreat and cover boundaries',()=>{
  assert.notEqual(runSelection({
    bot:{pickupTarget:{m:{visible:true}},lastSeenT:999},
    facts:{hpPct:.48,targetPos:null}
  }).bot.aiState,'resupply');

  assert.notEqual(runSelection({
    bot:{lastSeenT:999},
    facts:{hpPct:.25,strategicRetreat:true,dist:10,localThreats:0,mapObjective:null}
  }).bot.aiState,'retreat');

  assert.equal(runSelection({
    facts:{hpPct:.579,strategicRetreat:true,dist:30,localThreats:3}
  }).bot.aiState,'retreat');

  assert.notEqual(runSelection({
    bot:{coverPoint:{},canSeeTarget:true,role:'assault',reloadT:0,suppressedT:0,lastSeenT:999},
    facts:{hpPct:.72,localThreats:3,dist:50}
  }).bot.aiState,'cover');
});

test('every policy execution consumes exactly one RNG draw for the legacy stateCD formula',()=>{
  for(const random of [0,.25,1]){
    const result=runSelection({facts:{targetPos:null,mapObjective:null},random});
    assert.equal(result.calls,1);
    near(result.bot.stateCD,.22+random*.30,'state cooldown');
  }
});
