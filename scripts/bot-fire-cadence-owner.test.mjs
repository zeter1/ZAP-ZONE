import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const OUTCOME=Object.freeze({
  EMITTED:'emitted',
  OCCLUDED:'blocked-occluded',
  FRIENDLY_FIRE:'blocked-friendly-fire',
  ROCKET_SAFETY:'blocked-rocket-safety',
  ROCKET_COOLDOWN:'blocked-rocket-cooldown'
});
const source=readFileSync(new URL('../src/ai/bot-fire-cadence.js',import.meta.url),'utf8');

function createHarness(randomValues=[]){
  const events=[];
  const context={
    __OUTCOME:OUTCOME,ROCKET_FIRE_INTERVAL:10,
    __randomValues:[...randomValues],
    __randomIndex:0,
    startBotReload(bot){
      events.push({type:'reload',burstLeft:bot.burstLeft,burstPauseT:bot.burstPauseT,sT:bot.sT,mag:bot.mag});
      bot.reloadT=1;
    }
  };
  vm.createContext(context);
  vm.runInContext(
    "const BOT_SHOT_OUTCOME=globalThis.__OUTCOME;Math.random=()=>{if(__randomIndex>=__randomValues.length)throw new Error('unexpected Math.random call #'+(__randomIndex+1));return __randomValues[__randomIndex++];};",
    context
  );
  vm.runInContext(
    source+'\n;globalThis.__BOT_FIRE_CADENCE_TEST__={applyBotFireCadence};',
    context,
    {filename:'src/ai/bot-fire-cadence.js'}
  );
  const applyRaw=context.__BOT_FIRE_CADENCE_TEST__.applyBotFireCadence;
  return {apply:(bot,outcome=OUTCOME.EMITTED)=>applyRaw(bot,outcome),events,calls:()=>context.__randomIndex};
}
function makeWeapon(overrides={}){return {key:'rifle',rate:.2,isRocket:false,isSniper:false,...overrides};}
function makeBot(overrides={}){return {team:'ally',targetIsPlayer:false,tacticalMode:'normal',weapon:makeWeapon(),aimSkill:.8,fireRateMul:1,burstLeft:3,burstPauseT:.2,sT:.1,mag:5,reloadT:0,...overrides};}
function near(actual,expected,label,epsilon=1e-12){assert.ok(Math.abs(actual-expected)<=epsilon,label+' expected '+expected+', got '+actual);}

test('continuing emitted burst consumes only next-shot RNG and preserves pause',()=>{
  const h=createHarness([.5]),bot=makeBot();h.apply(bot);
  assert.equal(bot.burstLeft,2);near(bot.burstPauseT,.2,'existing burst pause');near(bot.sT,.2*(.96+.5*.24),'next-shot timer');assert.equal(h.calls(),1);
});
test('ally rifle emitted burst reset preserves exact base, extra and normal-pause formulas',()=>{
  const h=createHarness([.4,.25,.75]),bot=makeBot({burstLeft:1});h.apply(bot);
  assert.equal(bot.burstLeft,6);near(bot.burstPauseT,.16+.25*(.18+(1-.8)*.22),'rifle pause');near(bot.sT,.2*(.96+.75*.24),'rifle next-shot timer');assert.equal(h.calls(),3);
});
test('enemy-player shotgun preserves discarded normalPause draw, player pause and cadence floor',()=>{
  const h=createHarness([.5,.125,.8,.25]),bot=makeBot({team:'enemy',targetIsPlayer:true,burstLeft:1,weapon:makeWeapon({key:'shotgun',rate:.01})});h.apply(bot);
  assert.equal(bot.burstLeft,2);near(bot.burstPauseT,.42+.8*.42,'enemy-player pause');near(bot.sT,.095,'enemy-player cadence floor');assert.equal(h.calls(),4);
});
test('suppressing enemy-player rifle preserves burst extension and shorter player pause',()=>{
  const h=createHarness([.5,.25,.5,0]),bot=makeBot({team:'enemy',targetIsPlayer:true,tacticalMode:'suppress',burstLeft:1});h.apply(bot);
  assert.equal(bot.burstLeft,6);near(bot.burstPauseT,.24+.5*.22,'suppressing player pause');near(bot.sT,.2*.96,'suppressing next-shot timer');assert.equal(h.calls(),4);
});
test('sniper, rocket and shotgun keep their non-player single-shot burst and pause bases',()=>{
  for(const [label,weapon,pause] of [['sniper',makeWeapon({key:'sniper',isSniper:true,rate:.4}),.72],['rocket',makeWeapon({key:'rocket',isRocket:true,rate:.6}),.58],['shotgun',makeWeapon({key:'shotgun',rate:.55}),.34]]){
    const h=createHarness([0,0,0]),bot=makeBot({burstLeft:1,weapon});h.apply(bot);
    assert.equal(bot.burstLeft,1,label+' burst');near(bot.burstPauseT,pause,label+' pause');near(bot.sT,weapon.isRocket?10:weapon.rate*.96,label+' next-shot timer');assert.equal(h.calls(),3,label+' RNG count');
  }
});
test('ally emitted cadence floor remains 55ms',()=>{
  const h=createHarness([0]),bot=makeBot({weapon:makeWeapon({rate:.001})});h.apply(bot);near(bot.sT,.055,'ally cadence floor');assert.equal(h.calls(),1);
});
test('empty magazine reload handoff happens after emitted cadence mutation',()=>{
  const h=createHarness([0]),bot=makeBot({burstLeft:2,mag:0});h.apply(bot);
  assert.equal(bot.burstLeft,1);near(bot.sT,.2*.96,'pre-reload cadence');assert.equal(bot.reloadT,1);assert.deepEqual(h.events,[{type:'reload',burstLeft:1,burstPauseT:.2,sT:.2*.96,mag:0}]);assert.equal(h.calls(),1);
});
test('occluded attempt intentionally keeps legacy burst consumption and cadence RNG',()=>{
  const h=createHarness([.25]),bot=makeBot({burstLeft:3,sT:.01});h.apply(bot,OUTCOME.OCCLUDED);
  assert.equal(bot.burstLeft,2);near(bot.burstPauseT,.2,'occluded attempt preserves existing pause');near(bot.sT,.2*(.96+.25*.24),'occluded next-attempt timer');assert.equal(h.calls(),1);
});
test('friendly-fire safety block preserves burst and owns one bounded retry RNG draw',()=>{
  const h=createHarness([.5]),bot=makeBot({burstLeft:3,burstPauseT:.2,sT:.01});h.apply(bot,OUTCOME.FRIENDLY_FIRE);
  assert.equal(bot.burstLeft,3);near(bot.burstPauseT,.2,'friendly-fire pause');near(bot.sT,.16,'friendly-fire bounded retry');assert.equal(h.calls(),1);assert.deepEqual(h.events,[]);
});
test('rocket-safety block preserves burst and uses fixed retry without cadence RNG',()=>{
  const h=createHarness([]),bot=makeBot({burstLeft:2,burstPauseT:.3,sT:.01,weapon:makeWeapon({key:'rocket',isRocket:true,rate:.6})});h.apply(bot,OUTCOME.ROCKET_SAFETY);
  assert.equal(bot.burstLeft,2);near(bot.burstPauseT,.3,'rocket-safety pause');near(bot.sT,.18,'rocket-safety bounded retry');assert.equal(h.calls(),0);assert.deepEqual(h.events,[]);
});
test('unknown shot outcome fails fast before cadence mutation or RNG',()=>{
  const h=createHarness([]),bot=makeBot({burstLeft:3,burstPauseT:.2,sT:.1});
  assert.throws(()=>h.apply(bot,'blocked-mystery'),/Unknown bot shot outcome/);assert.deepEqual({burstLeft:bot.burstLeft,burstPauseT:bot.burstPauseT,sT:bot.sT},{burstLeft:3,burstPauseT:.2,sT:.1});assert.equal(h.calls(),0);
});
