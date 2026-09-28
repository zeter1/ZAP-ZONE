import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vec3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return this;}
  clone(){return new Vec3(this.x,this.y,this.z);}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
  distanceToSquared(v){const x=this.x-v.x,y=this.y-v.y,z=this.z-v.z;return x*x+y*y+z*z;}
}
const source=readFileSync(new URL('../src/ai/bot-perception.js',import.meta.url),'utf8');

function createHarness(overrides={}){
  const context={
    THREE:{Vector3:Vec3},
    performance:{now:()=>1000},
    botGrenades:[],
    pRkts:[],
    eRkts:[],
    shotSequence:0,
    shotResetT:0,
    camera:{position:new Vec3(100,1.7,100)},
    getW:()=>null,
    wallBetween:()=>false,
    smokeBlocksSight:()=>false,
    losMeshes:[],
    dying:false,
    enemies:[],
    kills:0,
    level:1,
    countTargeters:()=>0,
    countPlayerTargeters:()=>0,
    nearestHostileMine:()=>null,
    plrVx:0,
    plrVz:0,
    TEAM_INTEL:{
      ally:{pos:new Vec3(),time:0,target:null},
      enemy:{pos:new Vec3(),time:0,target:null}
    },
    ...overrides
  };
  vm.createContext(context);
  vm.runInContext(
    source+'\n;globalThis.__BOT_PERCEPTION_TEST__={nearestHostileGrenade,BOT_NOISE_EVENTS,emitBotCombatNoise,updateBotHearingPerception,updateBotTargetPerception,findBotIncomingRocketThreat,updateBotMineThreat,updateBotGrenadeThreat,updateBotLineOfSight,updateBotRocketThreat};',
    context,
    {filename:'src/ai/bot-perception.js'}
  );
  return context;
}
function makeBot(team='ally'){
  return {
    team,
    role:'assault',
    group:{position:new Vec3()},
    aimSkill:.7,
    heardT:0,
    hearingScanT:0,
    heardPos:new Vec3(),
    heardSource:null,
    heardIsPlayer:false,
    canSeeTarget:false,
    lastSeenT:999,
    targetIsPlayer:false,
    targetEn:null,
    lastKnown:new Vec3(),
    lastKnownVel:new Vec3(),
    searchPoint:null,
    searchStep:0,
    targetLockT:0,
    targetScanT:0,
    reactionT:0,
    burstPauseT:0,
    losT:0,
    mineScanT:0,
    cachedMineThreat:null,
    grenadeScanT:0,
    cachedGrenadeThreat:null,
    rocketCheckT:0,
    cachedRocketThreat:null,
    aiState:'patrol',
    stateCD:1,
    _lastDt:.016
  };
}

test('grenade perception ignores friendly and expired grenades and ranks hostile danger',()=>{
  const context=createHarness();
  const bot=makeBot('ally');
  const friendly={team:'ally',fuse:.2,m:{position:new Vec3(1,0,0)}};
  const expired={team:'enemy',fuse:0,m:{position:new Vec3(1,0,0)}};
  const urgent={team:'enemy',fuse:.35,m:{position:new Vec3(6,0,0)}};
  const fartherSlow={team:'enemy',fuse:2,m:{position:new Vec3(4,0,0)}};
  context.botGrenades.push(friendly,expired,fartherSlow,urgent);
  const result=context.__BOT_PERCEPTION_TEST__.nearestHostileGrenade(bot,10);
  assert.equal(result.grenade,urgent);
  assert.equal(result.distance,6);
});

test('combat-noise bus remains bounded and preserves rifle radius',()=>{
  const context=createHarness();
  const {BOT_NOISE_EVENTS,emitBotCombatNoise}=context.__BOT_PERCEPTION_TEST__;
  for(let i=0;i<40;i++)emitBotCombatNoise(new Vec3(i,0,0),'player',{key:'rifle'},'shot');
  assert.equal(BOT_NOISE_EVENTS.length,36);
  assert.equal(BOT_NOISE_EVENTS.at(-1).radius,46);
  assert.equal(BOT_NOISE_EVENTS.at(-1).source,'player');
  assert.equal(BOT_NOISE_EVENTS.at(-1).kind,'shot');
});

test('hearing updates perception memory but leaves FSM transition to the consumer',()=>{
  const context=createHarness();
  const bot=makeBot('ally');
  const hostile={team:'enemy',alive:true,group:{position:new Vec3(8,0,0)},hp:100,maxHp:100,kills:0,role:'assault'};
  context.__BOT_PERCEPTION_TEST__.emitBotCombatNoise(hostile.group.position,hostile,{key:'rifle'},'shot');
  const heard=context.__BOT_PERCEPTION_TEST__.updateBotHearingPerception(bot,.2);
  assert.equal(heard,true);
  assert.equal(bot.heardSource,hostile);
  assert.equal(bot.targetEn,hostile);
  assert.equal(bot.targetIsPlayer,false);
  assert.equal(bot.heardT,1.65);
  assert.equal(bot.aiState,'patrol','perception owner must not own the FSM transition');
  assert.equal(bot.stateCD,1,'perception owner must not own FSM cooldown');
});

test('target perception selects the nearest visible hostile without mutating FSM state',()=>{
  const context=createHarness();
  const bot=makeBot('ally');
  const near={team:'enemy',alive:true,group:{position:new Vec3(8,0,0)},hp:100,maxHp:100,kills:0,role:'assault'};
  const far={team:'enemy',alive:true,group:{position:new Vec3(20,0,0)},hp:100,maxHp:100,kills:0,role:'assault'};
  context.enemies.push(bot,far,near);
  const distance=context.__BOT_PERCEPTION_TEST__.updateBotTargetPerception(bot);
  assert.equal(bot.targetEn,near);
  assert.equal(bot.targetIsPlayer,false);
  assert.equal(distance,8);
  assert.equal(bot.aiState,'patrol');
});

test('rocket perception ignores friendly rockets and detects an incoming hostile path',()=>{
  const context=createHarness();
  const bot=makeBot('ally');
  const friendly={ownerType:'bot',team:'ally',m:{position:new Vec3(8,0,0)},vx:-10,vz:0,blastRadius:6};
  const hostile={ownerType:'bot',team:'enemy',m:{position:new Vec3(8,0,0)},vx:-10,vz:0,blastRadius:6};
  context.pRkts.push(friendly);
  context.eRkts.push(hostile);
  const result=context.__BOT_PERCEPTION_TEST__.findBotIncomingRocketThreat(bot);
  assert.equal(result.rocket,hostile);
  assert.ok(result.time>0&&result.time<=1.35);
  assert.ok(result.miss<=8);
});
