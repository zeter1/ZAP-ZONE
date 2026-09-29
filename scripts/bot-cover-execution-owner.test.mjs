import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
class Vec3{
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  clone(){return new Vec3(this.x,this.y,this.z);}
  lerp(v,t){this.x+=(v.x-this.x)*t;this.y+=(v.y-this.y)*t;this.z+=(v.z-this.z)*t;return this;}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
  distanceToSquared(v){const dx=this.x-v.x,dy=this.y-v.y,dz=this.z-v.z;return dx*dx+dy*dy+dz*dz;}
}
const source=readFileSync(new URL('../src/ai/bot-cover-execution.js',import.meta.url),'utf8');
function harness({rng=[],...overrides}={}){
  const calls=[],math=Object.create(Math);
  math.random=()=>{if(!rng.length)throw new Error('unexpected Math.random call');const v=rng.shift();calls.push(v);return v;};
  const context={THREE:{Vector3:Vec3},BOT_R:.4,losMeshes:[],findBotTacticalCover:()=>null,collideWalls:(x,z)=>({x,z}),wallBetween:()=>false,smokeBlocksSight:()=>false,Math:math,...overrides};
  vm.createContext(context);
  vm.runInContext(source+'\n;globalThis.__T={botCoverPeekEnvelope,updateBotCoverSelection,tryStartBotCoverPeek,runBotCoverExecution};',context,{filename:'src/ai/bot-cover-execution.js'});
  return{context,calls};
}
function bot(overrides={}){
  return{coverEvalT:.4,coverCooldownT:0,coverPoint:new Vec3(0,0,0),coverHoldT:1,coverChainT:0,peekPoint:null,peekT:0,peekDuration:0,peekCooldownT:1,sideBias:1,canSeeTarget:false,reloadT:0,role:'assault',lastDamageT:0,suppressedT:0,group:{position:new Vec3(0,0,0)},speed:10,aiState:'cover',stateCD:1,desiredYaw:0,...overrides};
}
const near=(a,e,l='value')=>assert.ok(Math.abs(a-e)<1e-9,l+': expected '+e+', got '+a);

test('peek envelope preserves legacy piecewise edges',()=>{
  const {context}=harness(),f=context.__T.botCoverPeekEnvelope;
  near(f(1,1),0);near(f(.76,1),1);near(f(.5,1),1);near(f(.28,1),1);near(f(0,1),0);assert.equal(f(.5,0),0);
});
test('cover reevaluation preserves gate and RNG order',()=>{
  const next=new Vec3(4,0,0);let finds=0;
  const {context,calls}=harness({rng:[.25,.75],findBotTacticalCover:()=>{finds++;return next;}});
  const b=bot({coverEvalT:.05,coverPoint:new Vec3()});
  context.__T.updateBotCoverSelection(b,.05,new Vec3(10,0,0),20,.4);
  assert.equal(finds,1);assert.equal(b.coverPoint,next);near(b.coverHoldT,.28+.25*.42);near(b.coverEvalT,.82+.75*.48);assert.deepEqual(calls,[.25,.75]);
  const gated=harness({findBotTacticalCover:()=>{throw new Error('must stay gated');}}),gb=bot({coverEvalT:.01,coverCooldownT:.2});
  gated.context.__T.updateBotCoverSelection(gb,.02,new Vec3(10,0,0),20,.4);near(gb.coverEvalT,-.01);assert.deepEqual(gated.calls,[]);
});
test('peek preserves side order, LOS/smoke short-circuit and RNG order',()=>{
  const probes=[],walls=[],smokes=[];
  const {context,calls}=harness({rng:[.2,.8],collideWalls:(x,z)=>{probes.push([x,z]);return{x,z};},wallBetween:e=>{walls.push(e.z);return e.z>0;},smokeBlocksSight:e=>{smokes.push(e.z);return false;}});
  const b=bot({peekCooldownT:0});
  assert.equal(context.__T.tryStartBotCoverPeek(b,new Vec3(10,0,0)),true);
  assert.deepEqual(probes,[[0,1.35],[0,-1.35]]);assert.deepEqual(walls,[1.35,-1.35]);assert.deepEqual(smokes,[-1.35]);
  near(b.peekPoint.z,-1.35);near(b.peekDuration,.92+.2*.34);near(b.peekCooldownT,1.25+.8*.85);assert.equal(b.sideBias,-1);assert.deepEqual(calls,[.2,.8]);
});
test('peek collision rejection remains strictly greater than 0.55',()=>{
  const probes=[];
  const {context,calls}=harness({rng:[.1,.2],collideWalls:(x,z)=>{probes.push([x,z]);return probes.length===1?{x:x+.551,z}:{x,z};}});
  const b=bot({peekCooldownT:0});
  assert.equal(context.__T.tryStartBotCoverPeek(b,new Vec3(10,0,0)),true);assert.equal(probes.length,2);assert.equal(b.sideBias,-1);assert.deepEqual(calls,[.1,.2]);
});
test('cover movement consumes canonical envelope',()=>{
  const {context}=harness(),b=bot({coverPoint:new Vec3(),peekPoint:new Vec3(2,0,0),peekT:.5,peekDuration:1,peekCooldownT:1,coverHoldT:1});
  const m=context.__T.runBotCoverExecution(b,{dt:.016,targetPos:null,dx:0,dz:0,squadPlan:{doctrine:'hold'},assaultWaveState:'idle',mapObjective:null});
  assert.ok(m.x>6.79&&m.x<6.80);near(m.z,0);
});
test('cover chaining preserves advancement gates and RNG order',()=>{
  const next=new Vec3(5,0,0),{context,calls}=harness({rng:[.1,.9],findBotTacticalCover:()=>next}),b=bot({coverHoldT:0,peekCooldownT:1});
  context.__T.runBotCoverExecution(b,{dt:.016,targetPos:new Vec3(12,0,0),dx:12,dz:0,squadPlan:{doctrine:'breach'},assaultWaveState:'active',mapObjective:new Vec3(10,0,0)});
  assert.equal(b.coverPoint,next);near(b.coverHoldT,.16+.1*.22);near(b.coverChainT,.72+.9*.35);assert.equal(b.aiState,'cover');assert.deepEqual(calls,[.1,.9]);
});
test('cover exit preserves cooldown, state and stateCD',()=>{
  const {context,calls}=harness({rng:[.6]}),b=bot({coverHoldT:0,peekCooldownT:1,canSeeTarget:true});
  context.__T.runBotCoverExecution(b,{dt:.016,targetPos:new Vec3(12,0,0),dx:12,dz:0,squadPlan:{doctrine:'hold'},assaultWaveState:'idle',mapObjective:new Vec3(10,0,0)});
  assert.equal(b.coverPoint,null);near(b.coverCooldownT,.95+.6*.70);assert.equal(b.aiState,'engage');near(b.stateCD,.32);assert.deepEqual(calls,[.6]);
});
