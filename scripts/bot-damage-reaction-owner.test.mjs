import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vec3{
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return this;}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
}
const source=readFileSync(new URL('../src/ai/bot-damage-reaction.js',import.meta.url),'utf8');

function createHarness(overrides={}){
  const context={
    performance:{now:()=>4321},
    camera:{position:new Vec3(50,1.7,-20)},
    plrVx:1.25,
    plrVz:-.75,
    dying:false,
    ...overrides
  };
  vm.createContext(context);
  vm.runInContext(
    source+'\n;globalThis.__BOT_DAMAGE_REACTION_TEST__={applyBotDamageReaction};',
    context,
    {filename:'src/ai/bot-damage-reaction.js'}
  );
  return context;
}
function makeBot(overrides={}){
  return {
    team:'ally',maxHp:200,aimSkill:.7,canSeeTarget:true,targetLockT:.5,
    targetEn:null,targetIsPlayer:false,lastKnown:new Vec3(),lastKnownVel:new Vec3(),
    lastSeenT:4,lastTargetSeenAt:0,losT:.4,searchPoint:{x:1},searchStep:2,
    reactionT:.4,burstPauseT:.3,aiState:'patrol',stateCD:1,
    ...overrides
  };
}
function near(actual,expected,label,epsilon=1e-9){
  assert.ok(Math.abs(actual-expected)<=epsilon,label+' expected '+expected+', got '+actual);
}

test('hostile bot damage retargets and preserves memory/lock/timer semantics',()=>{
  const context=createHarness();
  const sourceBot={alive:true,team:'enemy',group:{position:new Vec3(9,0,7)},velX:2.5,velZ:-1.5};
  const bot=makeBot({canSeeTarget:false});
  context.__BOT_DAMAGE_REACTION_TEST__.applyBotDamageReaction(bot,5,'enemy',sourceBot);
  assert.equal(bot.targetEn,sourceBot);assert.equal(bot.targetIsPlayer,false);
  assert.deepEqual([bot.lastKnown.x,bot.lastKnown.y,bot.lastKnown.z],[9,0,7]);
  assert.deepEqual([bot.lastKnownVel.x,bot.lastKnownVel.y,bot.lastKnownVel.z],[2.5,0,-1.5]);
  assert.equal(bot.lastSeenT,0);assert.equal(bot.lastTargetSeenAt,4321);assert.equal(bot.losT,0);
  near(bot.targetLockT,.92+.7*.45,'target lock');assert.equal(bot.searchPoint,null);assert.equal(bot.searchStep,0);
  assert.equal(bot.reactionT,.07);assert.equal(bot.burstPauseT,.06);assert.equal(bot.aiState,'hunt');assert.equal(bot.stateCD,.14);
});

test('enemy bot recognizes player/ally damage source and copies player motion memory',()=>{
  const context=createHarness();
  const bot=makeBot({team:'enemy',canSeeTarget:false,aiState:'search'});
  context.__BOT_DAMAGE_REACTION_TEST__.applyBotDamageReaction(bot,3,'ally','player');
  assert.equal(bot.targetEn,null);assert.equal(bot.targetIsPlayer,true);
  assert.deepEqual([bot.lastKnown.x,bot.lastKnown.y,bot.lastKnown.z],[50,1.7,-20]);
  assert.deepEqual([bot.lastKnownVel.x,bot.lastKnownVel.y,bot.lastKnownVel.z],[1.25,0,-.75]);
  assert.equal(bot.lastSeenT,0);assert.equal(bot.lastTargetSeenAt,4321);assert.equal(bot.aiState,'hunt');
});

test('strong current lock keeps target below exact ten-percent retaliation threshold',()=>{
  const context=createHarness();
  const current={alive:true,team:'enemy'};
  const sourceBot={alive:true,team:'enemy',group:{position:new Vec3(4,0,0)},velX:0,velZ:0};
  const bot=makeBot({
    targetEn:current,canSeeTarget:true,targetLockT:.5,lastSeenT:3,
    aiState:'engage',stateCD:.3,reactionT:.02,burstPauseT:.04
  });
  context.__BOT_DAMAGE_REACTION_TEST__.applyBotDamageReaction(bot,19.99,'enemy',sourceBot);
  assert.equal(bot.targetEn,current);assert.equal(bot.lastSeenT,1.15);
  assert.equal(bot.reactionT,.02);assert.equal(bot.burstPauseT,.04);
  assert.equal(bot.aiState,'engage');assert.equal(bot.stateCD,.14);
});

test('exact ten-percent hit overrides strong lock while friendly/self sources never become bot targets',()=>{
  const context=createHarness();
  const hostile={alive:true,team:'enemy',group:{position:new Vec3(3,0,2)},velX:0,velZ:0};
  const bot=makeBot({canSeeTarget:true,targetLockT:.5});
  context.__BOT_DAMAGE_REACTION_TEST__.applyBotDamageReaction(bot,20,'enemy',hostile);
  assert.equal(bot.targetEn,hostile);

  const friendly={alive:true,team:'ally',group:{position:new Vec3(8,0,8)}};
  const bot2=makeBot({lastSeenT:8});
  context.__BOT_DAMAGE_REACTION_TEST__.applyBotDamageReaction(bot2,40,'ally',friendly);
  assert.equal(bot2.targetEn,null);assert.equal(bot2.targetIsPlayer,false);assert.equal(bot2.lastSeenT,1.15);
});
