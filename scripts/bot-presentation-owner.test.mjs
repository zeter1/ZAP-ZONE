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
    rotation:{x:0,y:0,z:0},
    quaternion:new Quat(),
    scale:{x:1,y:1,z:1,set(x,y,z){this.x=x;this.y=y;this.z=z;}}
  };
}
function legRig(){
  const node=()=>({position:new Vec3(),rotation:{x:0,y:0,z:0}});
  return{
    root:node(),
    left:{hip:node(),knee:node(),ankle:node()},
    right:{hip:node(),knee:node(),ankle:node()}
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
const modelSource=readFileSync(new URL('../src/entities/bot-model3d.js',import.meta.url),'utf8');
const weaponsSource=readFileSync(new URL('../src/weapons/system.js',import.meta.url),'utf8');
const botsSource=readFileSync(new URL('../src/entities/bots.js',import.meta.url),'utf8');
const fireControlSource=readFileSync(new URL('../src/ai/bot-fire-control.js',import.meta.url),'utf8');
const context={THREE:{Vector3:Vec3}};
vm.createContext(context);
vm.runInContext(
  source+'\n;globalThis.__BOT_PRESENTATION_TEST__={applyBotLegVisualPose,updateBotMechanicalPresentation,solveBotTwoBoneArm,updateBotWeaponHands};',
  context,
  {filename:'src/entities/bot-presentation.js'}
);
const {applyBotLegVisualPose,updateBotMechanicalPresentation,solveBotTwoBoneArm,updateBotWeaponHands}=context.__BOT_PRESENTATION_TEST__;

test('visual leg rig articulates hip knee and ankle without mutating gameplay hit meshes',()=>{
  const rig=legRig();
  assert.equal(applyBotLegVisualPose(rig,.40,-.40,.80,.10,.02,.03,.05,.40,1),true);

  near(rig.root.position.x,.03*.34,'root sway');
  near(rig.root.position.y,.02*.38,'root bob');
  near(rig.left.hip.rotation.x,.40*.92,'left hip stride');
  near(rig.right.hip.rotation.x,-.40*.92,'right hip opposite stride');
  near(rig.left.knee.rotation.x,-.40*.72+.80*.42,'left knee lift bend');
  near(rig.right.knee.rotation.x,-(-.40)*.72+.10*.42,'right knee bend');
  near(rig.left.ankle.rotation.x,-rig.left.hip.rotation.x*.24-rig.left.knee.rotation.x*.72-.80*.06,'left ankle compensation');
  assert.notEqual(rig.left.hip.rotation.y,rig.right.hip.rotation.y,'strafe yaw mirrors between legs');
});

test('visual leg rig fails closed when hierarchy is incomplete',()=>{
  const rig=legRig();
  delete rig.right.ankle;
  assert.equal(applyBotLegVisualPose(rig,.2,-.2,.4,.1,0,0,0,0,1),false);
  near(rig.root.position.x,0,'incomplete rig root remains untouched');
});

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


test('bot presentation faces the same +Z direction used by gameplay muzzle and yaw',()=>{
  const start=weaponsSource.indexOf('const BOT_WEAPON_POSES=');
  const end=weaponsSource.indexOf('\nfunction makeBotWeaponMesh',start);
  assert.ok(start>=0&&end>start,'BOT_WEAPON_POSES block must be readable');
  const poseContext={Math};
  vm.createContext(poseContext);
  vm.runInContext(
    weaponsSource.slice(start,end).replace('const BOT_WEAPON_POSES=','globalThis.BOT_WEAPON_POSES='),
    poseContext
  );
  const poses=poseContext.BOT_WEAPON_POSES;
  for(const key of ['pistol','shotgun','rifle','rocket','plasma','mine','bomb','smoke','sniper','grenade']){
    const pose=poses[key];
    assert.ok(pose,'missing '+key+' bot pose');
    assert.ok(pose.p[2]>0,key+' must be held on gameplay-forward +Z side');
    assert.ok(Math.abs(pose.r[1]-Math.PI)<.08,key+' visual yaw must correct authored -Z to gameplay +Z');
  }
  assert.match(modelSource,/if\(!inheritParentFacing\)mesh\.rotation\.y=Math\.PI;/,'Pack46 body components must receive the +Z facing correction');
  assert.match(source,/visualRoot\.rotation\.y=Math\.PI;/,'procedural fallback body must share the +Z facing correction');
  assert.match(source,/weaponPivot\.rotation\.set\(\.05,Math\.PI\+\.07,-\.35\)/,'default weapon pivot must already face gameplay +Z');
  assert.match(botsSource,/weaponPivot\.position\.z=pose\.p\[2\]-visualRecoil;/,'visual recoil must move backward after the facing correction');
  assert.match(fireControlSource,/new THREE\.Vector3\(Math\.sin\(bot\.group\.rotation\.y\),0,Math\.cos\(bot\.group\.rotation\.y\)\)/,'gameplay muzzle forward must remain +Z and unchanged');
});


test('mechanical presentation layers head/torso aim, recoil, reload, crouch and landing without touching gameplay hit meshes',()=>{
  const rig=legRig();
  const visualNode=()=>({position:new Vec3(),rotation:{x:0,y:Math.PI,z:0}});
  const model46={
    head:visualNode(),torso:visualNode(),pelvis:visualNode(),
    leftShoulder:visualNode(),rightShoulder:visualNode()
  };
  model46.head.position.y=-.125;
  const bot={
    model46,legRig:rig,group:{position:new Vec3(0,0,0),rotation:{y:0}},
    weaponPivot:{position:new Vec3(.39,1.23,.07),rotation:{x:.05,y:Math.PI,z:-.35}},
    role:'assault',sideBias:1,aiState:'engage',reloadT:0,suppressedT:0,peekPoint:null,
    fireBurstRecoil:.8,landingCompression:0
  };
  assert.equal(updateBotMechanicalPresentation(bot,{targetPos:new Vec3(8,0,8),combatPose:true,strafeRoll:.04,bodyLean:.03,dt:.1}),true);
  assert.ok(model46.head.rotation.y-Math.PI>model46.torso.rotation.y-Math.PI,'head should lead the smaller torso target twist');
  assert.ok(bot.visualAimBlend>0,'aim raise must blend in');
  assert.ok(model46.rightShoulder.rotation.x<model46.leftShoulder.rotation.x,'weapon-side shoulder must carry stronger recoil');

  bot.aiState='cover';bot.reloadT=1;bot.suppressedT=.4;bot.landingCompression=1;
  const beforeY=bot.weaponPivot.position.y;
  updateBotMechanicalPresentation(bot,{targetPos:new Vec3(6,0,3),combatPose:true,dt:.1});
  assert.ok(bot.visualReloadBlend>0,'reload pose must blend in');
  assert.ok(bot.visualCrouchBlend>0,'cover/reload must drive presentation crouch');
  assert.ok(bot.landingCompression<1&&bot.landingCompression>0,'landing compression must decay smoothly');
  assert.ok(rig.root.position.y<0,'crouch/landing compresses the visual leg hierarchy');
  assert.ok(bot.weaponPivot.position.y<beforeY,'reload lowers the weapon before the grip solver runs');
});
