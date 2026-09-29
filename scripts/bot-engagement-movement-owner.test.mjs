import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../src/ai/bot-engagement-movement.js',import.meta.url),'utf8');
const near=(actual,expected,label='value')=>assert.ok(Math.abs(actual-expected)<1e-9,`${label}: expected ${expected}, got ${actual}`);

function harness(rng=[]){
  const calls=[];
  const math=Object.create(Math);
  math.random=()=>{
    if(!rng.length)throw new Error('unexpected Math.random call');
    const value=rng.shift();
    calls.push(value);
    return value;
  };
  const context={Math:math};
  vm.createContext(context);
  vm.runInContext(source+'\n;globalThis.__T={runBotEngagementMovement};',context,{filename:'src/ai/bot-engagement-movement.js'});
  return{run:context.__T.runBotEngagementMovement,calls};
}

function bot(overrides={}){
  return{
    desiredYaw:0,
    strafeSwitchT:.4,
    strafeDir:1,
    weapon:{key:'rifle',opt:16,range:60},
    role:'support',
    tacticalMode:'normal',
    bravery:1,
    coverPoint:null,
    ...overrides
  };
}

function args(overrides={}){
  return{
    dt:.016,
    targetPos:{x:10,y:0,z:0},
    dx:10,
    dz:0,
    dist:10,
    opponentWeapon:null,
    spd:10,
    myX:0,
    myZ:0,
    frontlineContested:false,
    frontlineBehind:false,
    squadPlan:{doctrine:'push',zoneRadius:10},
    mapObjective:null,
    objectiveDist:999,
    ...overrides
  };
}

test('null target is a no-op and consumes no RNG',()=>{
  const {run,calls}=harness(),b=bot();
  const before={timer:b.strafeSwitchT,dir:b.strafeDir,yaw:b.desiredYaw};
  const movement=run(b,args({targetPos:null}));
  assert.deepEqual({x:movement.x,z:movement.z},{x:0,z:0});
  assert.deepEqual({timer:b.strafeSwitchT,dir:b.strafeDir,yaw:b.desiredYaw},before);
  assert.deepEqual(calls,[]);
});

test('expired normal strafe flips once and preserves reset RNG order',()=>{
  const {run,calls}=harness([.4]),b=bot({strafeSwitchT:.01});
  const movement=run(b,args({dt:.02}));
  assert.equal(b.strafeDir,-1);
  near(b.strafeSwitchT,.55+.4*.75,'strafeSwitchT');
  near(b.desiredYaw,Math.PI/2,'desiredYaw');
  near(movement.x,0,'x');
  near(movement.z,-8.2,'z');
  assert.deepEqual(calls,[.4]);
});

test('sniper matchup draws after reset and clamps the freshly scheduled timer',()=>{
  const {run,calls}=harness([.2,.75]),b=bot({strafeSwitchT:.01,role:'assault'});
  const movement=run(b,args({dt:.02,opponentWeapon:{isSniper:true}}));
  assert.equal(b.strafeDir,-1);
  near(b.strafeSwitchT,.48+.75*.22,'sniper-clamped timer');
  near(movement.x,0,'x');
  near(movement.z,-10.8,'z');
  assert.deepEqual(calls,[.2,.75]);
});

test('sniper matchup consumes its RNG draw even when the existing timer wins the clamp',()=>{
  const {run,calls}=harness([.9]),b=bot({strafeSwitchT:.2,role:'anchor'});
  run(b,args({dt:.01,opponentWeapon:{isSniper:true}}));
  near(b.strafeSwitchT,.19,'existing timer');
  assert.deepEqual(calls,[.9]);
});

test('close and far pressure keep strict boundaries',()=>{
  const closeBoundary=20*.54;
  {
    const {run}=harness(),b=bot({weapon:{key:'rifle',opt:20,range:60}});
    const at=run(b,args({dx:closeBoundary,dist:closeBoundary}));
    near(at.x,0,'close boundary x');
    const inside=run(bot({weapon:{key:'rifle',opt:20,range:60}}),args({dx:closeBoundary-.001,dist:closeBoundary-.001}));
    near(inside.x,-5.2,'inside close x');
  }
  const farBoundary=60*.82;
  {
    const {run}=harness(),b=bot();
    const at=run(b,args({dx:farBoundary,dist:farBoundary}));
    near(at.x,0,'far boundary x');
    const outside=run(bot(),args({dx:farBoundary+.001,dist:farBoundary+.001}));
    near(outside.x,7,'outside far x');
  }
});

test('role, suppress and opponent-range modifiers remain ordered',()=>{
  const dist=10.6;
  const {run}=harness();
  const engineerSuppress=run(bot({role:'engineer',tacticalMode:'suppress',weapon:{key:'rifle',opt:20,range:60}}),args({dx:dist,dist}));
  // 20 * .92 * 1.08 => close threshold 10.73088, so retreat still applies.
  near(engineerSuppress.x,-5.2,'engineer suppress close pressure');
  near(engineerSuppress.z,4.8,'suppress strafe');

  const shotgunOpponent=run(bot({weapon:{key:'rifle',opt:10,range:60}}),args({dx:10,dist:10,opponentWeapon:{key:'shotgun'}}));
  // Opponent shotgun raises optRange to 18, making 10m outside the strict close threshold 9.72.
  near(shotgunOpponent.x,0,'shotgun matchup range floor');
});

test('objective, flank and anchor terms preserve additive movement order',()=>{
  const {run}=harness();
  const objective=run(bot(),args({
    frontlineContested:true,
    mapObjective:{x:10,z:0},
    objectiveDist:20,
    squadPlan:{doctrine:'push',zoneRadius:10}
  }));
  near(objective.x,4,'objective pull x');
  near(objective.z,8.2,'objective base strafe z');

  const flank=run(bot({role:'flankL'}),args());
  near(flank.x,0,'flank x');
  near(flank.z,5.8,'flank additive z');

  const anchor=run(bot({role:'anchor',coverPoint:{x:4,z:6}}),args({dx:15,dist:15}));
  near(anchor.x,.2,'anchor tether x');
  near(anchor.z,8.5,'anchor tether z');
});
