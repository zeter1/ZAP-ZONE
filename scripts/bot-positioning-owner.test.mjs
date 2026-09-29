import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vec3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return this;}
  clone(){return new Vec3(this.x,this.y,this.z);}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
  distanceToSquared(v){const dx=this.x-v.x,dy=this.y-v.y,dz=this.z-v.z;return dx*dx+dy*dy+dz*dz;}
}
const source=readFileSync(new URL('../src/ai/bot-positioning.js',import.meta.url),'utf8');

function createHarness(overrides={}){
  const context={
    THREE:{Vector3:Vec3},COVER_POINTS:[],losMeshes:[],enemies:[],
    wallBetween:()=>true,smokeBlocksSight:()=>false,botRoutePenalty:()=>0,
    frontlineZone:()=>({x:0,z:0,r:20}),collideWalls:(x,z)=>({x,z}),BOT_R:.4,
    ...overrides
  };
  vm.createContext(context);
  vm.runInContext(source+'\n;globalThis.__BOT_POSITIONING_TEST__={findBotTacticalCover,findBotFlankPoint};',context,{filename:'src/ai/bot-positioning.js'});
  return context;
}
function makeBot(overrides={}){
  return {team:'ally',commandDoctrine:'hold',sideBias:1,group:{position:new Vec3()},aiState:'patrol',stateCD:1,coverPoint:null,flankPoint:null,coverEvalT:.4,flankCommitT:2.5,...overrides};
}
function xyz(v){return [v?.x,v?.y,v?.z];}

test('cover ranking preserves the bot side-bias score',()=>{
  const context=createHarness({COVER_POINTS:[[0,10],[0,-10]]});
  const bot=makeBot({sideBias:1}),target=new Vec3(20,0,0);
  assert.deepEqual(xyz(context.__BOT_POSITIONING_TEST__.findBotTacticalCover(bot,target)),[0,0,-10]);
  bot.sideBias=-1;
  assert.deepEqual(xyz(context.__BOT_POSITIONING_TEST__.findBotTacticalCover(bot,target)),[0,0,10]);
});

test('cover ranking preserves teammate crowding penalty',()=>{
  const context=createHarness({COVER_POINTS:[[0,10],[0,-10]]}),bot=makeBot({sideBias:1});
  context.enemies.push(bot,{alive:true,team:'ally',group:{position:new Vec3(0,0,-10)}});
  assert.deepEqual(xyz(context.__BOT_POSITIONING_TEST__.findBotTacticalCover(bot,new Vec3(20,0,0))),[0,0,10]);
});

test('flank selection preserves lane visibility and side filtering',()=>{
  const context=createHarness({COVER_POINTS:[[18,12],[18,13],[-8,-14]],wallBetween:(from)=>from.z===12,smokeBlocksSight:()=>false});
  assert.deepEqual(xyz(context.__BOT_POSITIONING_TEST__.findBotFlankPoint(makeBot(),new Vec3(20,0,0),1)),[18,0,13]);
});

test('flank fallback preserves procedural offset and collision fail-closed behavior',()=>{
  const context=createHarness({COVER_POINTS:[]}),bot=makeBot(),target=new Vec3(20,0,0);
  assert.deepEqual(xyz(context.__BOT_POSITIONING_TEST__.findBotFlankPoint(bot,target,1)),[16.5,0,12]);
  context.collideWalls=(x,z)=>({x:x+3,z});
  assert.equal(context.__BOT_POSITIONING_TEST__.findBotFlankPoint(bot,target,1),null);
});

test('positioning owner returns destinations without taking FSM or commit-timer authority',()=>{
  const context=createHarness({COVER_POINTS:[[0,-10],[18,13]]}),bot=makeBot();
  const before={aiState:bot.aiState,stateCD:bot.stateCD,coverPoint:bot.coverPoint,flankPoint:bot.flankPoint,coverEvalT:bot.coverEvalT,flankCommitT:bot.flankCommitT};
  context.__BOT_POSITIONING_TEST__.findBotTacticalCover(bot,new Vec3(20,0,0));
  context.__BOT_POSITIONING_TEST__.findBotFlankPoint(bot,new Vec3(20,0,0),1);
  assert.deepEqual({aiState:bot.aiState,stateCD:bot.stateCD,coverPoint:bot.coverPoint,flankPoint:bot.flankPoint,coverEvalT:bot.coverEvalT,flankCommitT:bot.flankCommitT},before);
});
