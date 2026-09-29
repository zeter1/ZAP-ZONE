import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../src/ai/bot-dodge-response.js',import.meta.url),'utf8');

function createHarness(sequence){
  const draws=[...sequence];
  const calls=[];
  const math=Object.create(Math);
  math.random=()=>{
    assert.ok(draws.length>0,'unexpected Math.random() call');
    const value=draws.shift();
    calls.push(value);
    return value;
  };
  const context={Math:math};
  vm.createContext(context);
  vm.runInContext(
    source+'\n;globalThis.__BOT_DODGE_RESPONSE_TEST__={applyBotDodgeResponse};',
    context,
    {filename:'src/ai/bot-dodge-response.js'}
  );
  return {
    apply:context.__BOT_DODGE_RESPONSE_TEST__.applyBotDodgeResponse,
    calls,
    remaining:()=>draws.length
  };
}
function makeBot(overrides={}){
  return {
    dodgeCD:0,dodgeT:0,dodgeDir:0,dodgeSpd:0,
    speed:4,aimSkill:.75,jV:0,
    ...overrides
  };
}
function near(actual,expected,label,epsilon=1e-12){
  assert.ok(Math.abs(actual-expected)<=epsilon,label+' expected '+expected+', got '+actual);
}

test('active dodge or cooldown returns before consuming RNG',()=>{
  for(const overrides of [{dodgeCD:.1},{dodgeT:.1}]){
    const harness=createHarness([]);
    const bot=makeBot(overrides);
    const before={...bot};
    harness.apply(bot);
    assert.deepEqual(bot,before);
    assert.equal(harness.calls.length,0);
  }
});

test('fallback direction preserves exact RNG order and jump impulse',()=>{
  const harness=createHarness([.25,.5,.75,.1,.625]);
  const bot=makeBot();
  harness.apply(bot,0,1);
  assert.equal(bot.dodgeDir,-1);
  near(bot.dodgeT,.34+.5*.24,'dodge duration');
  near(bot.dodgeSpd,4*(1.30+.75*.16),'dodge speed');
  near(bot.dodgeCD,.88+.75*.62,'dodge cooldown');
  near(bot.jV,4.6+.625*1.6,'jump impulse');
  assert.deepEqual(harness.calls,[.25,.5,.75,.1,.625]);
  assert.equal(harness.remaining(),0);
});

test('preferred direction skips direction RNG and urgency clamps duration/speed only',()=>{
  const low=createHarness([.4,.2,.99]);
  const lowBot=makeBot({jV:2});
  low.apply(lowBot,-1,.1);
  assert.equal(lowBot.dodgeDir,-1);
  near(lowBot.dodgeT,(.34+.4*.24)*.86,'low-urgency duration');
  near(lowBot.dodgeSpd,4*(1.30+.75*.16)*.96,'low-urgency speed');
  near(lowBot.dodgeCD,.88+.2*.62,'low-urgency cooldown');
  assert.equal(lowBot.jV,2);
  assert.deepEqual(low.calls,[.4,.2,.99]);

  const high=createHarness([.6,.3,.99]);
  const highBot=makeBot({jV:2});
  high.apply(highBot,1,3);
  assert.equal(highBot.dodgeDir,1);
  near(highBot.dodgeT,(.34+.6*.24)*1.14,'high-urgency duration');
  near(highBot.dodgeSpd,4*(1.30+.75*.16)*1.08,'high-urgency speed');
  near(highBot.dodgeCD,.88+.3*.62,'high-urgency cooldown');
  assert.equal(highBot.jV,2);
  assert.deepEqual(high.calls,[.6,.3,.99]);
});

test('jump check always consumes RNG but impulse RNG requires a passing check and zero vertical velocity',()=>{
  const blocked=createHarness([.5,.25,.01]);
  const blockedBot=makeBot({jV:1});
  blocked.apply(blockedBot,1,1);
  assert.equal(blockedBot.jV,1);
  assert.deepEqual(blocked.calls,[.5,.25,.01]);

  const miss=createHarness([.5,.25,.9]);
  const missBot=makeBot();
  miss.apply(missBot,1,1);
  assert.equal(missBot.jV,0);
  assert.deepEqual(miss.calls,[.5,.25,.9]);
});
