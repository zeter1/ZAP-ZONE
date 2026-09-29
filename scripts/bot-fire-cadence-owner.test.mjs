import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../src/ai/bot-fire-cadence.js',import.meta.url),'utf8');

function createHarness(randomValues=[]){
  const events=[];
  const context={
    __randomValues:[...randomValues],
    __randomIndex:0,
    startBotReload(bot){
      events.push({type:'reload',burstLeft:bot.burstLeft,burstPauseT:bot.burstPauseT,sT:bot.sT,mag:bot.mag});
      bot.reloadT=1;
    }
  };
  vm.createContext(context);
  vm.runInContext(
    "Math.random=()=>{if(__randomIndex>=__randomValues.length)throw new Error('unexpected Math.random call #'+(__randomIndex+1));return __randomValues[__randomIndex++];};",
    context
  );
  vm.runInContext(
    source+'\n;globalThis.__BOT_FIRE_CADENCE_TEST__={applyBotPostShotCadence};',
    context,
    {filename:'src/ai/bot-fire-cadence.js'}
  );
  return {apply:context.__BOT_FIRE_CADENCE_TEST__.applyBotPostShotCadence,events,calls:()=>context.__randomIndex};
}
function makeWeapon(overrides={}){return {key:'rifle',rate:.2,isRocket:false,isSniper:false,...overrides};}
function makeBot(overrides={}){
  return {
    team:'ally',targetIsPlayer:false,tacticalMode:'normal',weapon:makeWeapon(),
    aimSkill:.8,fireRateMul:1,burstLeft:3,burstPauseT:.2,sT:.1,mag:5,reloadT:0,...overrides
  };
}
function near(actual,expected,label,epsilon=1e-12){
  assert.ok(Math.abs(actual-expected)<=epsilon,label+' expected '+expected+', got '+actual);
}

test('continuing burst consumes only next-shot RNG and preserves pause',()=>{
  const harness=createHarness([.5]);
  const bot=makeBot();
  harness.apply(bot);
  assert.equal(bot.burstLeft,2);
  near(bot.burstPauseT,.2,'existing burst pause');
  near(bot.sT,.2*(.96+.5*.24),'next-shot timer');
  assert.equal(harness.calls(),1);
});

test('ally rifle burst reset preserves exact base, extra and normal-pause formulas',()=>{
  const harness=createHarness([.4,.25,.75]);
  const bot=makeBot({burstLeft:1});
  harness.apply(bot);
  assert.equal(bot.burstLeft,6);
  near(bot.burstPauseT,.16+.25*(.18+(1-.8)*.22),'rifle pause');
  near(bot.sT,.2*(.96+.75*.24),'rifle next-shot timer');
  assert.equal(harness.calls(),3);
});

test('enemy-player shotgun preserves discarded normalPause draw, player pause and cadence floor',()=>{
  const harness=createHarness([.5,.125,.8,.25]);
  const bot=makeBot({team:'enemy',targetIsPlayer:true,burstLeft:1,weapon:makeWeapon({key:'shotgun',rate:.01})});
  harness.apply(bot);
  assert.equal(bot.burstLeft,2);
  near(bot.burstPauseT,.42+.8*.42,'enemy-player pause');
  near(bot.sT,.095,'enemy-player cadence floor');
  assert.equal(harness.calls(),4,'burst reset + legacy normalPause + player pause + cadence');
});

test('suppressing enemy-player rifle preserves burst extension and shorter player pause',()=>{
  const harness=createHarness([.5,.25,.5,0]);
  const bot=makeBot({team:'enemy',targetIsPlayer:true,tacticalMode:'suppress',burstLeft:1});
  harness.apply(bot);
  assert.equal(bot.burstLeft,6);
  near(bot.burstPauseT,.24+.5*.22,'suppressing player pause');
  near(bot.sT,.2*.96,'suppressing next-shot timer');
  assert.equal(harness.calls(),4);
});

test('sniper, rocket and shotgun keep their non-player single-shot burst and pause bases',()=>{
  for(const [label,weapon,pause] of [
    ['sniper',makeWeapon({key:'sniper',isSniper:true,rate:.4}),.72],
    ['rocket',makeWeapon({key:'rocket',isRocket:true,rate:.6}),.58],
    ['shotgun',makeWeapon({key:'shotgun',rate:.55}),.34]
  ]){
    const harness=createHarness([0,0,0]);
    const bot=makeBot({burstLeft:1,weapon});
    harness.apply(bot);
    assert.equal(bot.burstLeft,1,label+' burst');
    near(bot.burstPauseT,pause,label+' pause');
    near(bot.sT,weapon.rate*.96,label+' next-shot timer');
    assert.equal(harness.calls(),3,label+' RNG count');
  }
});

test('ally cadence floor remains 55ms',()=>{
  const harness=createHarness([0]);
  const bot=makeBot({weapon:makeWeapon({rate:.001})});
  harness.apply(bot);
  near(bot.sT,.055,'ally cadence floor');
  assert.equal(harness.calls(),1);
});

test('empty magazine reload handoff happens after cadence mutation',()=>{
  const harness=createHarness([0]);
  const bot=makeBot({burstLeft:2,mag:0});
  harness.apply(bot);
  assert.equal(bot.burstLeft,1);
  near(bot.sT,.2*.96,'pre-reload cadence');
  assert.equal(bot.reloadT,1);
  assert.deepEqual(harness.events,[{type:'reload',burstLeft:1,burstPauseT:.2,sT:.2*.96,mag:0}]);
  assert.equal(harness.calls(),1);
});
