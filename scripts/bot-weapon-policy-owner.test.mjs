import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../src/ai/bot-weapon-policy.js',import.meta.url),'utf8');

function makeWeapon(overrides={}){
  return {idx:2,key:'rifle',clip:30,range:55,opt:32,isRocket:false,isSniper:false,...overrides};
}
function makeBot(overrides={}){
  return {role:'assault',weapon:makeWeapon(),mag:18,weaponSwitchT:2,aiState:'engage',burstLeft:3,burstPauseT:.25,reloadT:0,tacticalMode:'normal',...overrides};
}
function createHarness({candidate=makeWeapon({idx:4,key:'plasma',clip:28,range:62,opt:38}),randoms=[.5]}={}){
  let randomIndex=0;
  const chooseBotWeaponByDistance=mock.fn(()=>({...candidate}));
  const refreshEvents=[];
  const refreshBotWeaponVisual=mock.fn(bot=>refreshEvents.push(bot.weapon.idx));
  const nextRandom=()=>randoms[Math.min(randomIndex++,randoms.length-1)];
  const context={chooseBotWeaponByDistance,refreshBotWeaponVisual,nextRandom};
  vm.createContext(context);
  vm.runInContext('Math.random=nextRandom;',context);
  vm.runInContext(source+'\n;globalThis.__BOT_WEAPON_POLICY_TEST__={shouldBotReconsiderWeapon,selectBotWeapon};',context,{filename:'src/ai/bot-weapon-policy.js'});
  return {context,chooseBotWeaponByDistance,refreshBotWeaponVisual,refreshEvents};
}
function near(actual,expected,label,epsilon=1e-9){assert.ok(Math.abs(actual-expected)<=epsilon,label+' expected '+expected+', got '+actual);}

test('reconsider trigger preserves timer and unsafe-range thresholds',()=>{
  const {context}=createHarness();const bot=makeBot();
  assert.equal(context.__BOT_WEAPON_POLICY_TEST__.shouldBotReconsiderWeapon(bot,20),false);
  bot.weaponSwitchT=0;assert.equal(context.__BOT_WEAPON_POLICY_TEST__.shouldBotReconsiderWeapon(bot,20),true);
  bot.weaponSwitchT=2;bot.weapon=makeWeapon({range:20});assert.equal(context.__BOT_WEAPON_POLICY_TEST__.shouldBotReconsiderWeapon(bot,24),true);
  bot.weapon=makeWeapon({key:'rocket',isRocket:true,range:70});assert.equal(context.__BOT_WEAPON_POLICY_TEST__.shouldBotReconsiderWeapon(bot,7),true);
  bot.weapon=makeWeapon({key:'shotgun',range:32});assert.equal(context.__BOT_WEAPON_POLICY_TEST__.shouldBotReconsiderWeapon(bot,23),true);
});
test('usable loaded weapon keeps ownership and delays reevaluation',()=>{
  const {context,chooseBotWeaponByDistance,refreshBotWeaponVisual}=createHarness({randoms:[.5,.25]});
  const bot=makeBot({weapon:makeWeapon({idx:2,range:55,opt:32}),mag:12,weaponSwitchT:0});
  const before={weapon:bot.weapon,mag:bot.mag,aiState:bot.aiState,burstLeft:bot.burstLeft,reloadT:bot.reloadT};
  context.__BOT_WEAPON_POLICY_TEST__.selectBotWeapon(bot,30,false);
  assert.equal(bot.weapon,before.weapon);assert.equal(bot.mag,before.mag);near(bot.weaponSwitchT,2.95,'hold timer');
  assert.equal(chooseBotWeaponByDistance.mock.callCount(),0);assert.equal(refreshBotWeaponVisual.mock.callCount(),0);
  assert.deepEqual({aiState:bot.aiState,burstLeft:bot.burstLeft,reloadT:bot.reloadT},{aiState:before.aiState,burstLeft:before.burstLeft,reloadT:before.reloadT});
});
test('fit hysteresis rejects a marginal candidate without visual churn',()=>{
  const candidate=makeWeapon({idx:5,key:'plasma',clip:25,range:55,opt:34});
  const {context,chooseBotWeaponByDistance,refreshBotWeaponVisual}=createHarness({candidate,randoms:[.9,.5,.25]});
  const bot=makeBot({role:'anchor',weapon:makeWeapon({idx:2,range:55,opt:30}),mag:10,weaponSwitchT:0});const previous=bot.weapon;
  context.__BOT_WEAPON_POLICY_TEST__.selectBotWeapon(bot,30,false);
  assert.equal(bot.weapon,previous);assert.equal(chooseBotWeaponByDistance.mock.callCount(),1);
  assert.deepEqual(Array.from(chooseBotWeaponByDistance.mock.calls[0].arguments),[30,2,false,'anchor']);
  near(bot.weaponSwitchT,2.7,'hysteresis timer');assert.equal(refreshBotWeaponVisual.mock.callCount(),0);
});
test('accepted switch preserves valid ammo and refreshes presentation after assignment',()=>{
  const candidate=makeWeapon({idx:8,key:'sniper',clip:8,range:100,opt:62,isSniper:true});
  const {context,chooseBotWeaponByDistance,refreshBotWeaponVisual,refreshEvents}=createHarness({candidate,randoms:[.25]});
  const bot=makeBot({weapon:makeWeapon({idx:2,range:35,opt:24}),mag:6,weaponSwitchT:0});
  context.__BOT_WEAPON_POLICY_TEST__.selectBotWeapon(bot,60,false);
  assert.equal(bot.weapon.idx,8);assert.equal(bot.mag,6);near(bot.weaponSwitchT,5.5,'switch timer');
  assert.equal(chooseBotWeaponByDistance.mock.callCount(),1);assert.equal(refreshBotWeaponVisual.mock.callCount(),1);assert.deepEqual(refreshEvents,[8]);
});
test('forced selection bypasses hold policy and refills the selected clip',()=>{
  const candidate=makeWeapon({idx:1,key:'shotgun',clip:7,range:32,opt:14});
  const {context,chooseBotWeaponByDistance,refreshBotWeaponVisual}=createHarness({candidate,randoms:[.5]});
  const bot=makeBot({role:'flankL',mag:3});context.__BOT_WEAPON_POLICY_TEST__.selectBotWeapon(bot,14,true);
  assert.equal(bot.weapon.idx,1);assert.equal(bot.mag,7);near(bot.weaponSwitchT,6.5,'forced switch timer');
  assert.deepEqual(Array.from(chooseBotWeaponByDistance.mock.calls[0].arguments),[14,2,true,'flankL']);assert.equal(refreshBotWeaponVisual.mock.callCount(),1);
});
