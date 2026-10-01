import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vec3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return this;}
  clone(){return new Vec3(this.x,this.y,this.z);}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
  sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
  addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
  dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}
  lerp(v,t){this.x+=(v.x-this.x)*t;this.y+=(v.y-this.y)*t;this.z+=(v.z-this.z)*t;return this;}
  normalize(){const n=Math.hypot(this.x,this.y,this.z)||1;this.x/=n;this.y/=n;this.z/=n;return this;}
}
class Quaternion { setFromAxisAngle(){return this;} }

const source=readFileSync(new URL('../src/ai/bot-fire-control.js',import.meta.url),'utf8');

function createHarness(overrides={}){
  const events=[];
  const context={
    THREE:{Vector3:Vec3,Quaternion},
    camera:{position:new Vec3(0,1.7,20)},
    BOT_ROCKET_SPEED:24,TRACER_SPEED:{plasma:68},plrVx:0,plrVz:0,
    wallBetween:()=>false,wallMeshes:[],smokeBlocksSight:()=>false,losMeshes:[],
    playWeaponMechanicSound:(...args)=>events.push(['mechanic',...args]),
    spawnInstantSniperTrace:(...args)=>events.push(['trace',...args]),
    spawnTracer:(...args)=>events.push(['tracer',...args]),
    friendlyInLine:()=>false,friendlyNearPoint:()=>false,
    emitBotCombatNoise:(...args)=>events.push(['noise',...args]),
    playWeaponShotSound:(...args)=>events.push(['shot-sound',...args]),
    trigMuzzle:(...args)=>events.push(['muzzle',...args]),
    showGeneratedBotMuzzleVfx:(...args)=>events.push(['generated-muzzle',...args]),
    _UP:new Vec3(0,1,0),ejectCasing:(...args)=>events.push(['casing',...args]),
    spawnERkt:(...args)=>events.push(['rocket',...args]),
    BOT_DAMAGE_BOOST:1,EXPLOSION_DAMAGE_BOOST:1,
    weaponDamageScaleAtDistance:()=>1,ENEMY_VS_PLAYER_DAMAGE_SCALE:.88,
    registerPlayerSuppression:()=>0,
    spawnEnemyBullet:(...args)=>events.push(['bullet',...args]),
    applyDamageToPlayer:(...args)=>events.push(['player-damage',...args]),
    updateTeamScore:()=>events.push(['score']),
    pushKillFeed:(...args)=>events.push(['kill-feed',...args]),
    allyKills:0,enemyKills:0,
    ...overrides
  };
  vm.createContext(context);
  vm.runInContext('Math.random=()=>0.5;',context);
  vm.runInContext(
    source+'\n;globalThis.__BOT_FIRE_TEST__={BOT_SHOT_OUTCOME,botShotClosestApproachToPlayer,getBotAimPoint,getBotMuzzlePos,startBotReload,finishBotReload,dealBotDamageToCurrentTarget,getBotMovementFireInstabilityTarget,updateBotFireMovementStability,getBotFireRecoilProfile,syncBotFireRecoilWeapon,updateBotFireRecoilRecovery,registerBotEmittedShotRecoil,getBotShotStabilityModifiers,executeBotShot};',
    context,
    {filename:'src/ai/bot-fire-control.js'}
  );
  context.events=events;
  return context;
}
function makeWeapon(overrides={}){
  return {
    key:'sniper',clip:5,reload:2,range:100,opt:60,spread:0,hitBias:1,dmg:40,bCol:0xff3344,
    isRocket:false,isSniper:true,hitscan:true,pellets:1,
    ...overrides
  };
}
function makeBot(overrides={}){
  return {
    team:'ally',group:{position:new Vec3(),rotation:{y:0}},weapon:makeWeapon(),
    aimSkill:.8,aimPoint:new Vec3(),curAcc:0,baseDmgMul:1,mag:5,reloadT:0,
    velX:0,velZ:0,speed:4,baseSpeed:4,fireMoveInstability:0,
    fireBurstRecoil:0,fireRecoilWeaponKey:'',
    targetEn:null,targetIsPlayer:false,tacticalMode:'normal',suppressedT:0,
    weaponSwitchT:2,sT:.1,nearMissCd:0,kills:0,aiState:'engage',burstLeft:3,burstPauseT:.2,
    ...overrides
  };
}
function near(actual,expected,label,epsilon=1e-9){
  assert.ok(Math.abs(actual-expected)<=epsilon,label+' expected '+expected+', got '+actual);
}

test('muzzle helper preserves bot-local forward offset',()=>{
  const context=createHarness();
  const bot=makeBot({group:{position:new Vec3(3,0,-2),rotation:{y:0}}});
  const muzzle=context.__BOT_FIRE_TEST__.getBotMuzzlePos(bot);
  near(muzzle.x,3,'muzzle x');near(muzzle.y,1.22,'muzzle y');near(muzzle.z,-1.04,'muzzle z');
});

test('reload lifecycle preserves randomized duration and magazine refill',()=>{
  const context=createHarness();
  const bot=makeBot({weapon:makeWeapon({clip:30,reload:2}),mag:0,reloadT:0});
  context.__BOT_FIRE_TEST__.startBotReload(bot);
  near(bot.reloadT,1.9,'reload duration');
  assert.equal(context.events[0][0],'mechanic');
  assert.equal(context.events[0][1],'reload');
  context.__BOT_FIRE_TEST__.finishBotReload(bot);
  assert.equal(bot.mag,30);
  assert.equal(bot.reloadT,0);
  assert.equal(context.events.at(-1)[1],'reloadDone');
});

test('blocked shot fails closed without consuming ammo, noise or recoil',()=>{
  const context=createHarness({wallBetween:()=>true});
  const bot=makeBot({mag:4});
  const outcome=context.__BOT_FIRE_TEST__.executeBotShot(bot,new Vec3(0,0,16),16,false);
  assert.equal(outcome,context.__BOT_FIRE_TEST__.BOT_SHOT_OUTCOME.OCCLUDED);
  assert.equal(bot.mag,4);
  assert.equal(bot.fireBurstRecoil,0);
  assert.equal(context.events.some(e=>e[0]==='noise'),false);
});

test('smoke block reports occlusion unless suppress-memory fire is explicitly allowed',()=>{
  const context=createHarness({smokeBlocksSight:()=>true});
  const rifle=makeWeapon({key:'rifle',isSniper:false,hitscan:false,spread:.012,range:70});
  const blocked=makeBot({weapon:rifle,mag:4});
  const blockedOutcome=context.__BOT_FIRE_TEST__.executeBotShot(blocked,new Vec3(0,0,18),18,false);
  assert.equal(blockedOutcome,context.__BOT_FIRE_TEST__.BOT_SHOT_OUTCOME.OCCLUDED);
  assert.equal(blocked.mag,4);

  const suppressing=makeBot({weapon:rifle,mag:4});
  const emittedOutcome=context.__BOT_FIRE_TEST__.executeBotShot(suppressing,new Vec3(0,0,18),18,true);
  assert.equal(emittedOutcome,context.__BOT_FIRE_TEST__.BOT_SHOT_OUTCOME.EMITTED);
  assert.equal(suppressing.mag,3);
});

test('friendly-fire and rocket-safety gates do not fake emitted-shot recoil',()=>{
  const rifle=makeWeapon({key:'rifle',isSniper:false,hitscan:false,spread:.012,range:70});
  const friendlyContext=createHarness({friendlyInLine:()=>true});
  const friendlyBot=makeBot({weapon:rifle,mag:4,sT:.031});
  const friendlyOutcome=friendlyContext.__BOT_FIRE_TEST__.executeBotShot(friendlyBot,new Vec3(0,0,18),18,false);
  assert.equal(friendlyOutcome,friendlyContext.__BOT_FIRE_TEST__.BOT_SHOT_OUTCOME.FRIENDLY_FIRE);
  assert.equal(friendlyBot.mag,4);
  near(friendlyBot.sT,.031,'fire-control must not schedule friendly-fire retry');
  assert.equal(friendlyBot.fireBurstRecoil,0);

  const rocket=makeWeapon({key:'rocket',isSniper:false,isRocket:true,hitscan:false,spread:.006,range:55});
  const rocketContext=createHarness();
  const rocketBot=makeBot({weapon:rocket,mag:1,sT:.047});
  const rocketOutcome=rocketContext.__BOT_FIRE_TEST__.executeBotShot(rocketBot,new Vec3(0,0,8),8,false);
  assert.equal(rocketOutcome,rocketContext.__BOT_FIRE_TEST__.BOT_SHOT_OUTCOME.ROCKET_SAFETY);
  assert.equal(rocketBot.mag,1);
  near(rocketBot.sT,.047,'fire-control must not schedule rocket-safety retry');
  assert.equal(rocketBot.fireBurstRecoil,0);
  assert.equal(rocketContext.events.some(e=>e[0]==='rocket'),false);
});

test('an emitted firearm shot accumulates recoil after using first-shot stability',()=>{
  const context=createHarness();
  const rifle=makeWeapon({key:'rifle',isSniper:false,hitscan:false,spread:.012,range:70});
  const bot=makeBot({weapon:rifle,mag:4});
  const first=context.__BOT_FIRE_TEST__.getBotShotStabilityModifiers(bot,rifle,false);
  const outcome=context.__BOT_FIRE_TEST__.executeBotShot(bot,new Vec3(0,0,18),18,false);
  assert.equal(outcome,context.__BOT_FIRE_TEST__.BOT_SHOT_OUTCOME.EMITTED);
  const later=context.__BOT_FIRE_TEST__.getBotShotStabilityModifiers(bot,rifle,false);
  assert.equal(first.recoil,0);
  assert.ok(bot.fireBurstRecoil>0);
  assert.ok(later.recoil>first.recoil);
  assert.ok(later.spreadMultiplier>first.spreadMultiplier);
  assert.equal(bot.mag,3);
  assert.equal(context.events.some(e=>e[0]==='bullet'),true);
});

test('hitscan execution preserves damage, kill accounting and ammo consumption',()=>{
  const context=createHarness();
  vm.runInContext('Math.random=()=>0;',context);
  const target={
    alive:true,team:'enemy',velX:0,velZ:0,group:{position:new Vec3(0,0,18)},
    hurt(amount){this.lastDamage=amount;this.alive=false;}
  };
  const bot=makeBot({targetEn:target,mag:2});
  const outcome=context.__BOT_FIRE_TEST__.executeBotShot(bot,target.group.position,18,false);
  assert.equal(outcome,context.__BOT_FIRE_TEST__.BOT_SHOT_OUTCOME.EMITTED);
  assert.equal(target.lastDamage,40);
  assert.equal(bot.mag,1);
  assert.equal(bot.kills,1);
  assert.equal(context.allyKills,1);
  assert.equal(context.events.some(e=>e[0]==='trace'),true);
  assert.equal(context.events.some(e=>e[0]==='generated-muzzle'),true);
  assert.equal(context.events.some(e=>e[0]==='kill-feed'),true);
});

test('fire-control execution does not take FSM or burst-policy authority',()=>{
  const context=createHarness({wallBetween:()=>true});
  const bot=makeBot();
  const before={aiState:bot.aiState,burstLeft:bot.burstLeft,burstPauseT:bot.burstPauseT,tacticalMode:bot.tacticalMode};
  context.__BOT_FIRE_TEST__.executeBotShot(bot,new Vec3(0,0,12),12,false);
  assert.deepEqual(
    {aiState:bot.aiState,burstLeft:bot.burstLeft,burstPauseT:bot.burstPauseT,tacticalMode:bot.tacticalMode},
    before
  );
});


test('measured shooter motion produces bounded strafe-sensitive instability',()=>{
  const context=createHarness();
  const standing=makeBot();
  assert.equal(context.__BOT_FIRE_TEST__.getBotMovementFireInstabilityTarget(standing),0);
  const forward=makeBot({velX:0,velZ:3.2});
  const strafe=makeBot({velX:3.2,velZ:0});
  const forwardTarget=context.__BOT_FIRE_TEST__.getBotMovementFireInstabilityTarget(forward);
  const strafeTarget=context.__BOT_FIRE_TEST__.getBotMovementFireInstabilityTarget(strafe);
  assert.ok(forwardTarget>0&&forwardTarget<1);
  assert.ok(strafeTarget>forwardTarget&&strafeTarget<=1);
});

test('movement stability attack and recovery are frame-partition independent',()=>{
  const context=createHarness();
  const oneStep=makeBot({velX:3.2});
  const splitStep=makeBot({velX:3.2});
  context.__BOT_FIRE_TEST__.updateBotFireMovementStability(oneStep,.2);
  context.__BOT_FIRE_TEST__.updateBotFireMovementStability(splitStep,.1);
  context.__BOT_FIRE_TEST__.updateBotFireMovementStability(splitStep,.1);
  near(oneStep.fireMoveInstability,splitStep.fireMoveInstability,'partition-independent attack',1e-12);
  const before=oneStep.fireMoveInstability;
  oneStep.velX=0;
  context.__BOT_FIRE_TEST__.updateBotFireMovementStability(oneStep,.1);
  assert.ok(oneStep.fireMoveInstability>0&&oneStep.fireMoveInstability<before);
  context.__BOT_FIRE_TEST__.updateBotFireMovementStability(oneStep,2);
  assert.ok(oneStep.fireMoveInstability<.01);
});

test('burst recoil recovery is frame-partition independent and resets on weapon switch',()=>{
  const context=createHarness();
  const rifle=makeWeapon({key:'rifle',isSniper:false,hitscan:false});
  const oneStep=makeBot({weapon:rifle,fireBurstRecoil:.62,fireRecoilWeaponKey:'rifle'});
  const splitStep=makeBot({weapon:rifle,fireBurstRecoil:.62,fireRecoilWeaponKey:'rifle'});
  context.__BOT_FIRE_TEST__.updateBotFireRecoilRecovery(oneStep,.24);
  context.__BOT_FIRE_TEST__.updateBotFireRecoilRecovery(splitStep,.08);
  context.__BOT_FIRE_TEST__.updateBotFireRecoilRecovery(splitStep,.08);
  context.__BOT_FIRE_TEST__.updateBotFireRecoilRecovery(splitStep,.08);
  near(oneStep.fireBurstRecoil,splitStep.fireBurstRecoil,'partition-independent recoil recovery',1e-12);
  assert.ok(oneStep.fireBurstRecoil>0&&oneStep.fireBurstRecoil<.62);

  oneStep.weapon=makeWeapon({key:'pistol',isSniper:false,hitscan:false});
  context.__BOT_FIRE_TEST__.updateBotFireRecoilRecovery(oneStep,.016);
  assert.equal(oneStep.fireBurstRecoil,0);
  assert.equal(oneStep.fireRecoilWeaponKey,'pistol');
});

test('automatic weapon recoil accumulation is stronger than pistol accumulation',()=>{
  const context=createHarness();
  const rifle=makeWeapon({key:'rifle',isSniper:false,hitscan:false});
  const plasma=makeWeapon({key:'plasma',isSniper:false,hitscan:false});
  const pistol=makeWeapon({key:'pistol',isSniper:false,hitscan:false});
  const rifleBot=makeBot({weapon:rifle});
  const plasmaBot=makeBot({weapon:plasma});
  const pistolBot=makeBot({weapon:pistol});
  for(let i=0;i<3;i++){
    context.__BOT_FIRE_TEST__.registerBotEmittedShotRecoil(rifleBot,rifle);
    context.__BOT_FIRE_TEST__.registerBotEmittedShotRecoil(plasmaBot,plasma);
    context.__BOT_FIRE_TEST__.registerBotEmittedShotRecoil(pistolBot,pistol);
  }
  assert.ok(rifleBot.fireBurstRecoil>pistolBot.fireBurstRecoil);
  assert.ok(plasmaBot.fireBurstRecoil>pistolBot.fireBurstRecoil);
  assert.ok(rifleBot.fireBurstRecoil<=context.__BOT_FIRE_TEST__.getBotFireRecoilProfile(rifle).max);
  assert.ok(plasmaBot.fireBurstRecoil<=context.__BOT_FIRE_TEST__.getBotFireRecoilProfile(plasma).max);
});

test('movement, suppression and weapon class modifiers compose without hidden RNG',()=>{
  const context=createHarness();
  const bot=makeBot({fireMoveInstability:.8});
  const rifle=makeWeapon({key:'rifle',isSniper:false,hitscan:true});
  const sniper=makeWeapon({key:'sniper',isSniper:true,hitscan:true});
  const rocket=makeWeapon({key:'rocket',isSniper:false,isRocket:true,hitscan:false});
  const rifleMove=context.__BOT_FIRE_TEST__.getBotShotStabilityModifiers(bot,rifle,false);
  const sniperMove=context.__BOT_FIRE_TEST__.getBotShotStabilityModifiers(bot,sniper,false);
  const rocketMove=context.__BOT_FIRE_TEST__.getBotShotStabilityModifiers(bot,rocket,false);
  assert.ok(sniperMove.spreadMultiplier>rifleMove.spreadMultiplier);
  assert.ok(sniperMove.hitscanPenalty>rifleMove.hitscanPenalty&&rifleMove.hitscanPenalty>0);
  assert.equal(rocketMove.hitscanPenalty,0);
  bot.suppressedT=1.5;
  const suppressed=context.__BOT_FIRE_TEST__.getBotShotStabilityModifiers(bot,rifle,true);
  assert.ok(suppressed.spreadMultiplier>rifleMove.spreadMultiplier);
  vm.runInContext('globalThis.__draws=0;Math.random=()=>{globalThis.__draws++;return .5;};',context);
  const standing=makeBot({weapon:rifle,fireMoveInstability:0});
  context.__BOT_FIRE_TEST__.executeBotShot(standing,new Vec3(0,0,18),18,false);
  const standingDraws=context.__draws;
  vm.runInContext('globalThis.__draws=0;',context);
  const moving=makeBot({weapon:rifle,fireMoveInstability:.8});
  context.__BOT_FIRE_TEST__.executeBotShot(moving,new Vec3(0,0,18),18,false);
  assert.equal(context.__draws,standingDraws);
  vm.runInContext('globalThis.__draws=0;',context);
  const recoilLoaded=makeBot({weapon:rifle,fireBurstRecoil:.54,fireRecoilWeaponKey:'rifle'});
  context.__BOT_FIRE_TEST__.executeBotShot(recoilLoaded,new Vec3(0,0,18),18,false);
  assert.equal(context.__draws,standingDraws);
});
