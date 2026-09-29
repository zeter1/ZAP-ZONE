import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../src/ai/bot-suppression-response.js',import.meta.url),'utf8');

function createHarness(){
  const context={};
  vm.createContext(context);
  vm.runInContext(
    source+'\n;globalThis.__BOT_SUPPRESSION_RESPONSE_TEST__={applyBotSuppressionResponse};',
    context,
    {filename:'src/ai/bot-suppression-response.js'}
  );
  return context.__BOT_SUPPRESSION_RESPONSE_TEST__.applyBotSuppressionResponse;
}
function makeBot(overrides={}){
  return {
    alive:true,team:'ally',hp:80,maxHp:100,
    suppressedT:0,suppressionSource:null,
    coverCooldownT:.8,coverEvalT:.7,stateCD:.6,
    ...overrides
  };
}
function near(actual,expected,label,epsilon=1e-12){
  assert.ok(Math.abs(actual-expected)<=epsilon,label+' expected '+expected+', got '+actual);
}

test('valid suppression source applies default pressure without crossing response thresholds',()=>{
  const apply=createHarness();
  const hostile={team:'enemy'};
  const bot=makeBot();
  apply(bot,hostile);
  near(bot.suppressedT,.62+.6*.78,'default suppression duration');
  assert.equal(bot.suppressionSource,hostile);
  assert.equal(bot.coverCooldownT,.12);
  assert.equal(bot.coverEvalT,.7);
  assert.equal(bot.stateCD,.6);
});

test('pressure clamps to 0.3..1.4 and suppression duration is monotonic',()=>{
  const apply=createHarness();
  const hostile={team:'enemy'};
  const low=makeBot({suppressedT:1.2});
  apply(low,hostile,.1);
  assert.equal(low.suppressedT,1.2);
  assert.equal(low.coverEvalT,.7);
  assert.equal(low.stateCD,.6);

  const high=makeBot();
  apply(high,hostile,2);
  near(high.suppressedT,.62+1.4*.78,'upper-clamped suppression duration');
  assert.equal(high.coverEvalT,.05);
  assert.equal(high.stateCD,.08);
});

test('hp and pressure response thresholds preserve strict comparisons',()=>{
  const apply=createHarness();
  const hostile={team:'enemy'};

  const exact=makeBot({hp:72});
  apply(exact,hostile,.9);
  assert.equal(exact.coverEvalT,.7);
  assert.equal(exact.stateCD,.6);

  const pressureAbove=makeBot({hp:72});
  apply(pressureAbove,hostile,.900001);
  assert.equal(pressureAbove.coverEvalT,.05);
  assert.equal(pressureAbove.stateCD,.08);

  const hpBelow=makeBot({hp:71.999});
  apply(hpBelow,hostile,.9);
  assert.equal(hpBelow.coverEvalT,.05);
  assert.equal(hpBelow.stateCD,.08);
});

test('dead/null/self/friendly sources are rejected while the player token remains valid',()=>{
  const apply=createHarness();
  const sameTeam={team:'ally'};
  for(const [label,bot,sourceValue] of [
    ['dead',makeBot({alive:false}),{team:'enemy'}],
    ['null',makeBot(),null],
    ['self',makeBot(),null],
    ['friendly',makeBot(),sameTeam]
  ]){
    const source=label==='self'?bot:sourceValue;
    const before={...bot};
    apply(bot,source,1.1);
    assert.equal(bot.suppressedT,before.suppressedT,label+' source mutated suppression');
    assert.equal(bot.suppressionSource,before.suppressionSource,label+' source mutated owner');
    assert.equal(bot.coverCooldownT,before.coverCooldownT,label+' source mutated cooldown');
    assert.equal(bot.coverEvalT,before.coverEvalT,label+' source mutated cover timer');
    assert.equal(bot.stateCD,before.stateCD,label+' source mutated state timer');
  }

  const playerBot=makeBot({team:'enemy'});
  apply(playerBot,'player',.6);
  assert.equal(playerBot.suppressionSource,'player');
  assert.ok(playerBot.suppressedT>0);
});

test('suppression-response owner is deterministic and does not consume RNG',()=>{
  assert.doesNotMatch(source,/Math\.random\s*\(/);
});
