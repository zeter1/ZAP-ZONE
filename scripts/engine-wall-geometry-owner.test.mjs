import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vec3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  subVectors(a,b){this.x=a.x-b.x;this.y=a.y-b.y;this.z=a.z-b.z;return this;}
  length(){return Math.hypot(this.x,this.y,this.z);}
  multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
}

class ContractRaycaster {
  static calls=[];
  constructor(){this.ray={origin:new Vec3(),direction:new Vec3()};this.near=0;this.far=Infinity;}
  intersectObjects(list,recursive,target){
    ContractRaycaster.calls.push({near:this.near,far:this.far,recursive,count:list.length});
    const hits=list
      .map(item=>Number(item.distance))
      .filter(distance=>Number.isFinite(distance)&&distance>this.near&&distance<this.far)
      .sort((a,b)=>a-b);
    for(const distance of hits)target.push({distance});
    return target;
  }
}

function loadOwner(){
  const source=readFileSync(new URL('../src/core/engine.js',import.meta.url),'utf8');
  const start=source.indexOf('// ─── WALL RAYCASTER');
  const end=source.indexOf('// ─── PARTICLE POOL',start);
  assert.ok(start>=0&&end>start,'wall raycaster owner block must stay discoverable');
  const context={THREE:{Raycaster:ContractRaycaster,Vector3:Vec3}};
  vm.createContext(context);
  vm.runInContext(source.slice(start,end)+'\n;globalThis.__WALL_GEOMETRY_TEST__={firstWallHitDistance,wallBetween};',context,{filename:'src/core/engine.js#wall-raycaster'});
  return context.__WALL_GEOMETRY_TEST__;
}

const {firstWallHitDistance,wallBetween}=loadOwner();
const from=new Vec3(0,0,0),to=new Vec3(10,0,0);

test('no blocker returns Infinity and wallBetween stays false',()=>{
  assert.equal(firstWallHitDistance(from,to,[]),Infinity);
  assert.equal(wallBetween(from,to,[]),false);
});

test('nearest hit wins independently of blocker list order',()=>{
  const blockers=[{distance:6.5},{distance:2.75},{distance:4.0}];
  assert.equal(firstWallHitDistance(from,to,blockers),2.75);
  assert.equal(wallBetween(from,to,blockers),true);
});

test('the existing 0.15m target-end tolerance stays strict',()=>{
  assert.equal(firstWallHitDistance(from,to,[{distance:9.849}]),9.849,'hit just before the tolerance must block');
  assert.equal(firstWallHitDistance(from,to,[{distance:9.851}]),Infinity,'hit inside the target-end tolerance must not block');
  const last=ContractRaycaster.calls.at(-1);
  assert.equal(last.near,0);
  assert.ok(Math.abs(last.far-9.85)<1e-12,'ray far must remain target distance - 0.15m');
});

test('segments shorter than the tolerance fail clear without raycasting',()=>{
  const callsBefore=ContractRaycaster.calls.length;
  const shortTo=new Vec3(.149,0,0);
  assert.equal(firstWallHitDistance(from,shortTo,[{distance:.01}]),Infinity);
  assert.equal(wallBetween(from,shortTo,[{distance:.01}]),false);
  assert.equal(ContractRaycaster.calls.length,callsBefore,'short segment must not invoke Raycaster');
});
