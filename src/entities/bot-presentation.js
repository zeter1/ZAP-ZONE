'use strict';

// ─── BOT PRESENTATION / ARM RIG OWNER ────────────────────────────────────────
// Procedural bot body geometry, stable gameplay hit-mesh order, weapon pivot
// and the two-hand grip solver live here. AI decisions/locomotion stay in bots.js.

function mkHuman(et,team){
  const g=new THREE.Group();const pts=[];
  const ally=team==='ally';
  const clothCol=ally?0x185fba:0x7b1f2d;
  const armCol=ally?0x44a8ff:0xc4384d;
  const suitDark=ally?0x07192c:0x2d0a12;
  const glowCol=ally?0x44d8ff:0xff3659;

  // Gameplay hit meshes. Their order is intentionally unchanged.
  const A=(geo,col,x,y,z,rx=0,ry=0,rz=0)=>{
    const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:col,roughness:.62,metalness:.10}));
    m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;g.add(m);pts.push(m);return m;
  };
  A(new THREE.SphereGeometry(.22,8,6),et.skin,0,1.82,0);
  const helm=new THREE.Mesh(
    new THREE.SphereGeometry(.245,8,5,0,Math.PI*2,0,Math.PI/2),
    new THREE.MeshStandardMaterial({color:armCol,roughness:.30,metalness:.62})
  );
  helm.position.set(0,1.88,0);helm.castShadow=true;g.add(helm);pts.push(helm);
  A(new THREE.BoxGeometry(.52,.70,.28),clothCol,0,1.25,0);
  A(new THREE.BoxGeometry(.44,.22,.24),clothCol,0,.88,0);
  A(new THREE.BoxGeometry(.14,.52,.14),clothCol,-.35,1.22,0,0,0,.18);
  A(new THREE.BoxGeometry(.14,.52,.14),clothCol,.35,1.22,0,0,0,-.18);
  A(new THREE.BoxGeometry(.11,.42,.11),et.skin,-.36,.88,0);
  A(new THREE.BoxGeometry(.11,.42,.11),et.skin,.36,.88,0);
  A(new THREE.BoxGeometry(.18,.54,.20),clothCol,-.15,.52,0);
  A(new THREE.BoxGeometry(.18,.54,.20),clothCol,.15,.52,0);
  A(new THREE.BoxGeometry(.14,.50,.16),0x22262d,-.15,.14,0);
  A(new THREE.BoxGeometry(.14,.50,.16),0x22262d,.15,.14,0);
  A(new THREE.BoxGeometry(.15,.10,.26),0x0d1116,-.15,-.05,.05);
  A(new THREE.BoxGeometry(.15,.10,.26),0x0d1116,.15,-.05,.05);

  // Decorative armor is excluded from pts[] so gameplay hitboxes do not change.
  const armorMat=new THREE.MeshStandardMaterial({color:armCol,roughness:.26,metalness:.72});
  const darkMat=new THREE.MeshStandardMaterial({color:suitDark,roughness:.48,metalness:.42});
  const glowMat=new THREE.MeshStandardMaterial({color:glowCol,roughness:.18,metalness:.48,emissive:glowCol,emissiveIntensity:.88});
  const V=(geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{
    const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=!MOBILE_LOW;g.add(m);return m;
  };

  V(new THREE.BoxGeometry(.30,.085,.26),glowMat,0,1.875,-.18,.04);
  V(new THREE.BoxGeometry(.28,.085,.08),darkMat,0,1.73,-.205,-.16);
  V(new THREE.BoxGeometry(.08,.18,.10),armorMat,-.245,1.84,-.02,0,0,.18);
  V(new THREE.BoxGeometry(.08,.18,.10),armorMat,.245,1.84,-.02,0,0,-.18);
  V(new THREE.BoxGeometry(.46,.38,.075),armorMat,0,1.33,-.178,-.03);
  V(new THREE.BoxGeometry(.25,.09,.12),darkMat,0,1.57,-.11);
  V(new THREE.BoxGeometry(.21,.14,.32),armorMat,-.36,1.43,0,0,0,.20);
  V(new THREE.BoxGeometry(.21,.14,.32),armorMat,.36,1.43,0,0,0,-.20);
  V(new THREE.BoxGeometry(.34,.09,.08),glowMat,0,1.13,-.19);
  V(new THREE.BoxGeometry(.35,.42,.15),darkMat,0,1.27,.20);
  V(new THREE.BoxGeometry(.48,.10,.30),darkMat,0,.89,0);
  V(new THREE.BoxGeometry(.18,.16,.23),armorMat,-.15,.44,-.06,.05);
  V(new THREE.BoxGeometry(.18,.16,.23),armorMat,.15,.44,-.06,.05);
  V(new THREE.BoxGeometry(.15,.10,.27),armorMat,-.15,.10,-.02);
  V(new THREE.BoxGeometry(.15,.10,.27),armorMat,.15,.10,-.02);

  // Extra readability: visor, guards, antenna and a rear team armor mark.
  V(new THREE.BoxGeometry(.30,.065,.035),glowMat,0,1.84,-.235,.02);
  V(new THREE.BoxGeometry(.11,.20,.16),darkMat,-.365,1.03,-.02,0,0,.12);
  V(new THREE.BoxGeometry(.11,.20,.16),darkMat,.365,1.03,-.02,0,0,-.12);
  V(new THREE.BoxGeometry(.055,.24,.055),armorMat,.18,2.055,.02,0,0,-.10);
  V(new THREE.SphereGeometry(.04,7,5),glowMat,.19,2.175,.01);

  // Real body hands. These are moved by the two-bone weapon-hold solver,
  // so the weapon is held by the bot instead of carrying fake hands with it.
  const gloveMat=new THREE.MeshStandardMaterial({color:0x0b1118,roughness:.78,metalness:.14});
  const cuffMat=new THREE.MeshStandardMaterial({color:armCol,roughness:.32,metalness:.58,emissive:armCol,emissiveIntensity:.10});
  const makeRigHand=(x,y,z)=>{
    const hand=new THREE.Mesh(new THREE.BoxGeometry(.14,.15,.17),gloveMat);
    hand.position.set(x,y,z);hand.castShadow=!MOBILE_LOW;
    const cuff=new THREE.Mesh(new THREE.BoxGeometry(.16,.075,.15),cuffMat);
    cuff.position.set(0,.095,.025);hand.add(cuff);g.add(hand);return hand;
  };
  const leftHand=makeRigHand(-.36,.66,-.02);
  const rightHand=makeRigHand(.36,.66,-.02);

  const ringCol=ally?0x35c8ff:0xff2748;
  const insigniaMat=new THREE.MeshBasicMaterial({color:ringCol,side:THREE.DoubleSide});
  const insigniaDark=new THREE.MeshStandardMaterial({color:0x101820,roughness:.42,metalness:.62,emissive:ringCol,emissiveIntensity:.10});
  const addInsignia=(z,flip=0)=>{
    const plate=new THREE.Mesh(new THREE.BoxGeometry(.25,.25,.025),insigniaDark);
    plate.position.set(0,1.34,z);plate.rotation.y=flip;g.add(plate);
    const chevron=new THREE.Mesh(new THREE.RingGeometry(.065,.105,4,1,Math.PI/4,Math.PI*2),insigniaMat);
    chevron.position.set(0,0,.016);plate.add(chevron);
    const core=new THREE.Mesh(new THREE.BoxGeometry(.035,.13,.014),insigniaMat);
    core.position.set(0,-.018,.018);plate.add(core);
  };
  addInsignia(.281,Math.PI);addInsignia(-.219,0);

  const ringOpacity=.96;
  const ring=new THREE.Mesh(
    new THREE.TorusGeometry(.40,.045,5,16),
    new THREE.MeshBasicMaterial({color:ringCol,transparent:true,opacity:ringOpacity})
  );
  ring.rotation.x=Math.PI/2;ring.position.y=.02;g.add(ring);

  const weaponPivot=new THREE.Group();
  weaponPivot.position.set(.39,1.23,-.07);
  weaponPivot.rotation.set(.05,.07,-.35);
  g.add(weaponPivot);
  const armRig={
    leftUpper:pts[4],rightUpper:pts[5],
    leftFore:pts[6],rightFore:pts[7],
    leftHand,rightHand
  };
  return{g,pts,weaponPivot,armRig};
}

const _BOT_ARM_UP=new THREE.Vector3(0,1,0);
const _BOT_ARM_DIR=new THREE.Vector3();
const _BOT_ARM_BEND=new THREE.Vector3();
const _BOT_ARM_ELBOW=new THREE.Vector3();
const _BOT_ARM_MID=new THREE.Vector3();
const _BOT_GRIP_R=new THREE.Vector3();
const _BOT_GRIP_L=new THREE.Vector3();
const _BOT_SHOULDER_R=new THREE.Vector3(.35,1.49,-.015);
const _BOT_SHOULDER_L=new THREE.Vector3(-.35,1.49,-.015);
function setBotLimbBetween(mesh,a,b,baseLength){
  if(!mesh)return;
  _BOT_ARM_DIR.subVectors(b,a);
  const len=Math.max(.04,_BOT_ARM_DIR.length());
  _BOT_ARM_DIR.multiplyScalar(1/len);
  mesh.position.copy(_BOT_ARM_MID.addVectors(a,b).multiplyScalar(.5));
  mesh.quaternion.setFromUnitVectors(_BOT_ARM_UP,_BOT_ARM_DIR);
  mesh.scale.set(1,Math.max(.70,Math.min(1.32,len/baseLength)),1);
}
function solveBotTwoBoneArm(upper,fore,hand,shoulder,target,side,weaponQuat,bendHint){
  const upperLen=.50,foreLen=.43;
  _BOT_ARM_DIR.subVectors(target,shoulder);
  const rawDist=Math.max(.001,_BOT_ARM_DIR.length());
  _BOT_ARM_DIR.multiplyScalar(1/rawDist);
  const dist=Math.max(Math.abs(upperLen-foreLen)+.035,Math.min(rawDist,upperLen+foreLen-.025));
  const along=(upperLen*upperLen-foreLen*foreLen+dist*dist)/(2*dist);
  const bend=Math.sqrt(Math.max(0,upperLen*upperLen-along*along));
  if(bendHint)_BOT_ARM_BEND.set(...bendHint);else _BOT_ARM_BEND.set(side*.72,-.54,.22);
  _BOT_ARM_BEND.addScaledVector(_BOT_ARM_DIR,-_BOT_ARM_BEND.dot(_BOT_ARM_DIR));
  if(_BOT_ARM_BEND.lengthSq()<.001)_BOT_ARM_BEND.set(side,-.5,.2);
  _BOT_ARM_BEND.normalize();
  _BOT_ARM_ELBOW.copy(shoulder).addScaledVector(_BOT_ARM_DIR,along).addScaledVector(_BOT_ARM_BEND,bend);
  setBotLimbBetween(upper,shoulder,_BOT_ARM_ELBOW,.52);
  setBotLimbBetween(fore,_BOT_ARM_ELBOW,target,.42);
  if(hand){
    hand.position.copy(target);
    hand.quaternion.copy(weaponQuat);
  }
}
function updateBotWeaponHands(bot){
  const rig=bot.armRig,pose=bot.weaponPivot?.userData.pose,mesh=bot.weaponMesh;
  if(!rig||!pose||!mesh||!pose.gripR||!pose.gripL)return false;
  bot.group.updateMatrixWorld(true);
  mesh.updateMatrixWorld(true);
  _BOT_GRIP_R.set(...pose.gripR);
  mesh.localToWorld(_BOT_GRIP_R);bot.group.worldToLocal(_BOT_GRIP_R);
  _BOT_GRIP_L.set(...pose.gripL);
  mesh.localToWorld(_BOT_GRIP_L);bot.group.worldToLocal(_BOT_GRIP_L);
  solveBotTwoBoneArm(rig.rightUpper,rig.rightFore,rig.rightHand,_BOT_SHOULDER_R,_BOT_GRIP_R,1,bot.weaponPivot.quaternion,pose.elbowR);
  solveBotTwoBoneArm(rig.leftUpper,rig.leftFore,rig.leftHand,_BOT_SHOULDER_L,_BOT_GRIP_L,-1,bot.weaponPivot.quaternion,pose.elbowL);
  return true;
}
