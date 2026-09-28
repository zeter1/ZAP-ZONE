import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vec3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return this;}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
  clone(){return new Vec3(this.x,this.y,this.z);}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
  sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
  subVectors(a,b){this.x=a.x-b.x;this.y=a.y-b.y;this.z=a.z-b.z;return this;}
  addVectors(a,b){this.x=a.x+b.x;this.y=a.y+b.y;this.z=a.z+b.z;return this;}
  addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}
  multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
  dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}
  lengthSq(){return this.dot(this);}
  length(){return Math.sqrt(this.lengthSq());}
  normalize(){const len=this.length();return len>0?this.multiplyScalar(1/len):this;}
}

class Quat {
  constructor(label=''){this.label=label;this.from=null;this.to=null;}
  setFromUnitVectors(from,to){this.from=from.clone();this.to=to.clone();return this;}
  copy(q){this.label=q.label;this.from=q.from;this.to=q.to;return this;}
}

function limb(){
  return {
    position:new Vec3(),
    quaternion:new Quat(),
    scale:{x:1,y:1,z:1,set(x,y,z){this.x=x;this.y=y;this.z=z;}}
  };
}
function near(actual,expected,message){
  assert.ok(Math.abs(actual-expected)<1e-9, message+' expected '+expected+', got '+actual);
}
function assertVec(actual,expected,label){
  near(actual.x,expected[0],label+'.x');
  near(actual.y,expected[1],label+'.y');
  near(actual.z,expected[2],label+'.z');
}

const source=readFileSync(new URL('../src/entities/bot-presentation.js',import.meta.url),'utf8');
const context={THREE:{Vector3:Vec3}};
vm.createContext(context);
vm.runInContext(
  source+'\n;globalThis.__BOT_PRESENTATION_TEST__={solveBotTwoBoneArm,updateBotWeaponHands};',
  context,
  {filename:'src/entities/bot-presentation.js'}
);
const {solveBotTwoBoneArm,updateBotWeaponHands}=context.__BOT_PRESENTATION_TEST__;

test('two-bone solver pins the real hand to the weapon grip',()=>{
  const upper=limb(),fore=limb(),hand=limb();
  const shoulder=new Vec3(.35,1.49,-.015);
  const target=new Vec3(.58,1.14,-.31);
  const weaponQuat=new Quat('weapon');
  solveBotTwoBoneArm(upper,fore,hand,shoulder,target,1,weaponQuat,[.72,-.54,.22]);

  assertVec(hand.position,[target.x,target.y,target.z],'hand');
  assert.equal(hand.quaternion.label,'weapon');
  assert.ok(upper.scale.y>=.70&&upper.scale.y<=1.32,'upper arm scale stays inside rig clamp');
  assert.ok(fore.scale.y>=.70&&fore.scale.y<=1.32,'forearm scale stays inside rig clamp');
});

test('weapon-hand update converts both grip points through world and bot-local space',()=>{
  let groupUpdates=0,meshUpdates=0;
  const rig={
    rightUpper:limb(),rightFore:limb(),rightHand:limb(),
    leftUpper:limb(),leftFore:limb(),leftHand:limb()
  };
  const pose={
    gripR:[.2,0,-.1],
    gripL:[-.2,0,-.1],
    elbowR:[.72,-.54,.22],
    elbowL:[-.72,-.54,.22]
  };
  const worldOffset=new Vec3(5.4,1.2,6.8);
  const groupOrigin=new Vec3(5,0,7);
  const mesh={
    updateMatrixWorld(force){assert.equal(force,true);meshUpdates++;},
    localToWorld(v){return v.add(worldOffset);}
  };
  const bot={
    armRig:rig,
    weaponPivot:{userData:{pose},quaternion:new Quat('weapon')},
    weaponMesh:mesh,
    group:{
      updateMatrixWorld(force){assert.equal(force,true);groupUpdates++;},
      worldToLocal(v){return v.sub(groupOrigin);}
    }
  };

  assert.equal(updateBotWeaponHands(bot),true);
  assert.equal(groupUpdates,1);
  assert.equal(meshUpdates,1);
  assertVec(rig.rightHand.position,[.6,1.2,-.3],'right hand');
  assertVec(rig.leftHand.position,[.2,1.2,-.3],'left hand');
  assert.equal(rig.rightHand.quaternion.label,'weapon');
  assert.equal(rig.leftHand.quaternion.label,'weapon');
});

test('weapon-hand update is a no-op when grip metadata is incomplete',()=>{
  let touched=false;
  const bot={
    armRig:{},
    weaponPivot:{userData:{pose:{gripR:[0,0,0]}}},
    weaponMesh:{},
    group:{updateMatrixWorld(){touched=true;}}
  };
  assert.equal(updateBotWeaponHands(bot),false);
  assert.equal(touched,false);
});
