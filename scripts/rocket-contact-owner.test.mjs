import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const combat=readFileSync(new URL('../src/combat/combat.js',import.meta.url),'utf8');
const engine=readFileSync(new URL('../src/core/engine.js',import.meta.url),'utf8');
function fn(s,n){const start=s.indexOf('function '+n+'('),open=s.indexOf('{',start);let depth=1,i=open+1;for(;depth&&i<s.length;i++){if(s[i]==='{')depth++;if(s[i]==='}')depth--;}return s.slice(start,i);}
class Vec{
 constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});} set(x,y,z){Object.assign(this,{x,y,z});return this;}
 clone(){return new Vec(this.x,this.y,this.z);} copy(v){return this.set(v.x,v.y,v.z);} subVectors(a,b){return this.set(a.x-b.x,a.y-b.y,a.z-b.z);}
 length(){return Math.hypot(this.x,this.y,this.z);} dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;} multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
 normalize(){return this.multiplyScalar(1/(this.length()||1));} sub(v){return this.set(this.x-v.x,this.y-v.y,this.z-v.z);} addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}
 distanceToSquared(v){return (this.x-v.x)**2+(this.y-v.y)**2+(this.z-v.z)**2;} distanceTo(v){return Math.sqrt(this.distanceToSquared(v));}
}
function fixture(){
 const hits=[],c={THREE:{Vector3:Vec},camera:{position:new Vec(50,1.6,50)},dying:false,deathCamActive:false,playerRocketShotCD:0,
  enemies:[],eRkts:[],pRkts:[],wallMeshes:[],wallAABBs:[],PERF_MODE:true,_UP:new Vec(0,1,0),
  spawnSmoke(){},spawnP(){},rocketWallImpactSurface(){return null;},wallBetween(){return false;},
  detonateRocket(arr,i,r,pos,ground,surface,target){hits.push({pos:pos.clone(),ground,target});arr.splice(i,1);}};
 Object.defineProperty(c,'wallAABBs',{set(boxes){c.wallMeshes=boxes.map(bb=>{const center=bb.min.clone().addScaledVector(bb.max.clone().sub(bb.min),.5);return{geometry:{parameters:{width:bb.max.x-bb.min.x,height:bb.max.y-bb.min.y,depth:bb.max.z-bb.min.z}},worldToLocal:v=>v.sub(center),localToWorld:v=>v.addScaledVector(center,1),getWorldScale:v=>v.set(1,1,1)};});}});
 vm.createContext(c);
 for(const name of ['rocketWallContact','rocketActorContact','firstRocketContact','guardRocketLaunch','tickRocketFireCooldowns'])if(combat.includes('function '+name+'('))vm.runInContext(fn(combat,name),c);
 const start=combat.indexOf('function tickProjectiles('),end=combat.indexOf('  syncRocketFlightArt();',start);
 vm.runInContext(combat.slice(start,end)+'\n}',c);
 const rocket=(pos,velocity,ownerType='player',team='ally')=>({m:{position:pos,userData:{},quaternion:{setFromUnitVectors(){}}},vx:velocity.x,vy:velocity.y,vz:velocity.z,life:12,sT:0,fT:0,ownerType,team});
 return {c,hits,rocket};
}
test('rocket hits a thin wall on a short frame segment, at the first surface',()=>{
 const f=fixture();f.c.wallAABBs=[{min:new Vec(.1,0,-1),max:new Vec(.12,3,1)}];
 f.c.pRkts.push(f.rocket(new Vec(0,1,0),new Vec(10,0,0)));f.c.tickProjectiles(.02);
 assert.equal(f.hits.length,1);assert.ok(f.hits[0].pos.x<=.1);assert.equal(f.c.pRkts.length,0);
});
test('swept actor contact catches crossing even when both frame endpoints miss',()=>{
 const f=fixture(),target={alive:true,team:'enemy',group:{position:new Vec(0,0,-10)}};f.c.enemies=[target];
 f.c.pRkts.push(f.rocket(new Vec(0,1.6,-10.5115),new Vec(0,0,31)));f.c.tickProjectiles(.033);
 assert.equal(f.hits.length,1);assert.equal(f.hits[0].target,target);assert.ok(f.hits[0].pos.z<-10);
});
test('bot rocket grazing player hits along the segment',()=>{
 const f=fixture();f.c.camera.position.set(0,1.6,0);f.c.eRkts.push(f.rocket(new Vec(.55,1.6,-2),new Vec(0,0,80),'bot','enemy'));
 f.c.tickProjectiles(.05);assert.equal(f.hits.length,1);assert.equal(f.hits[0].target,'player');
});
test('friendly body stops missile without becoming a lethal hostile direct target',()=>{
 const f=fixture();f.c.enemies=[{alive:true,team:'ally',group:{position:new Vec(0,0,0)}}];
 f.c.pRkts.push(f.rocket(new Vec(0,1,-2),new Vec(0,0,80)));f.c.tickProjectiles(.05);
 assert.equal(f.hits.length,1);assert.equal(f.hits[0].target,null);
});
test('actor before wall owns impact; wall before actor blocks direct target',()=>{
 for(const [wallX,expectedTarget] of [[4,true],[.2,false]]){
  const f=fixture(),target={alive:true,team:'enemy',group:{position:new Vec(2,0,0)}};f.c.enemies=[target];
  f.c.wallAABBs=[{min:new Vec(wallX,0,-1),max:new Vec(wallX+.1,3,1)}];
  f.c.pRkts.push(f.rocket(new Vec(0,1,0),new Vec(100,0,0)));f.c.tickProjectiles(.05);
  assert.equal(f.hits.length,1);assert.equal(f.hits[0].target,expectedTarget?target:null);
 }
});
test('ground explosion stays at first ground contact rather than overshooting',()=>{
 const f=fixture();f.c.pRkts.push(f.rocket(new Vec(0,.2,0),new Vec(31,-10,0)));f.c.tickProjectiles(.033);
 assert.equal(f.hits.length,1);assert.equal(f.hits[0].ground,true);assert.ok(f.hits[0].pos.x<.32);assert.equal(f.hits[0].pos.y,.10);
});
test('roof and lifetime each detonate exactly once',()=>{
 const f=fixture();f.c.wallAABBs=[{min:new Vec(-1,0,-1),max:new Vec(1,2,1)}];
 f.c.pRkts.push(f.rocket(new Vec(0,3,0),new Vec(0,-100,0)));f.c.tickProjectiles(.05);
 assert.equal(f.hits.length,1);assert.ok(f.hits[0].pos.y>=2);assert.equal(f.hits[0].ground,false);f.c.tickProjectiles(.05);assert.equal(f.hits.length,1);
 const r=f.rocket(new Vec(5,5,5),new Vec(0,0,10));r.life=.01;f.c.pRkts.push(r);f.c.tickProjectiles(.02);assert.equal(f.hits.length,2);
});
test('launch offsets cannot start beyond a nearby wall for player or bot',()=>{
 const f=fixture();assert.equal(typeof f.c.guardRocketLaunch,'function');f.c.wallAABBs=[{min:new Vec(.3,0,-1),max:new Vec(.4,3,1)}];
 for(const distance of [.86,1.4]){const launch=f.c.guardRocketLaunch(new Vec(0,1,0),new Vec(distance,1,0));assert.ok(launch.x<.3);}
});
test('powered flight has the same distance/speed for one step and many smaller steps',()=>{
 const run=(count)=>{const f=fixture(),r=f.rocket(new Vec(0,5,0),new Vec(0,0,31*.82));r.maxSpeed=31;f.c.pRkts.push(r);for(let i=0;i<count;i++)f.c.tickProjectiles(.12/count);return r;};
 const a=run(1),b=run(60);assert.ok(Math.abs(a.m.position.z-b.m.position.z)<1e-10);assert.ok(Math.abs(a.vz-b.vz)<1e-10);assert.ok(a.vz>31*.82&&a.vz<31);
});
test('expired missile cannot travel beyond its remaining active flight time',()=>{
 const f=fixture(),r=f.rocket(new Vec(0,5,0),new Vec(0,0,10));r.life=.001;f.c.pRkts.push(r);f.c.tickProjectiles(.033);
 assert.equal(f.hits.length,1);assert.ok(Math.abs(f.hits[0].pos.z-.01)<1e-10);f.c.tickProjectiles(.033);assert.equal(f.hits.length,1);
});
