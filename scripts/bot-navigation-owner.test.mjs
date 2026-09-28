import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vec3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return this;}
  clone(){return new Vec3(this.x,this.y,this.z);}
}
function near(actual,expected,label,epsilon=1e-9){
  assert.ok(Math.abs(actual-expected)<=epsilon,label+' expected '+expected+', got '+actual);
}
const source=readFileSync(new URL('../src/ai/bot-navigation.js',import.meta.url),'utf8');
let collision=(x,z)=>({x,z});
const context={THREE:{Vector3:Vec3},BOT_R:.4,wallMeshes:[],smokeClouds:[],wallBetween:()=>false,collideWalls:(x,z,r)=>collision(x,z,r)};
vm.createContext(context);
vm.runInContext(source+'\n;globalThis.__BOT_NAV_TEST__={WPTS,BOT_MOVE_CFG,clampBotVelocity,smokeRoutePenalty,moveBotWithSubsteps};',context,{filename:'src/ai/bot-navigation.js'});
const {WPTS,BOT_MOVE_CFG,clampBotVelocity,smokeRoutePenalty,moveBotWithSubsteps}=context.__BOT_NAV_TEST__;

test('navigation owner preserves patrol data and movement constants',()=>{
  assert.equal(WPTS.length,33);
  assert.deepEqual(Array.from(WPTS[0]),[0,0]);
  near(BOT_MOVE_CFG.substep,.16,'substep');
  near(BOT_MOVE_CFG.normalMaxM,1.18,'normalMaxM');
  near(BOT_MOVE_CFG.urgentAccelM,6.2,'urgentAccelM');
});
test('velocity clamp preserves direction while enforcing max speed',()=>{
  const capped=clampBotVelocity(3,4,2.5);
  near(Math.hypot(capped.x,capped.z),2.5,'capped speed');
  near(capped.x/capped.z,3/4,'direction ratio');
  const unchanged=clampBotVelocity(.2,.1,1);
  near(unchanged.x,.2,'unchanged x');near(unchanged.z,.1,'unchanged z');
});
test('smoke route penalty preserves hostile, friendly and density semantics',()=>{
  const from={x:0,z:0},to={x:10,z:0};
  context.smokeClouds.length=0;
  context.smokeClouds.push({life:1,density:.8,team:'enemy',center:{x:5,z:0},radius:3});
  assert.ok(smokeRoutePenalty(from,to,'ally')>3.2,'hostile smoke should penalize the route');
  near(smokeRoutePenalty(from,to,'enemy'),0,'friendly smoke');
  context.smokeClouds.length=0;
  context.smokeClouds.push({life:1,density:.1,team:'enemy',center:{x:5,z:0},radius:3});
  near(smokeRoutePenalty(from,to,'ally'),0,'low-density smoke');
});
test('substep movement preserves exact free motion and step size',()=>{
  let calls=0;collision=(x,z)=>{calls+=1;return{x,z};};
  const moved=moveBotWithSubsteps(0,0,.48,0,1);
  near(moved.x,.48,'free x');near(moved.z,0,'free z');
  assert.equal(calls,3,'0.48m travel must split into three <=0.16m collision steps');
});
test('collision correction cannot teleport beyond final displacement cap',()=>{
  collision=(x,z)=>({x:x+50,z:z+50});
  const moved=moveBotWithSubsteps(0,0,1,0,1);
  assert.ok(Math.hypot(moved.x,moved.z)<=1.135+1e-9,'final displacement hard cap must contain collision correction');
});
