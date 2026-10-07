'use strict';

// ─── BOT PRESENTATION / ARM RIG OWNER ────────────────────────────────────────
// Procedural bot body geometry, stable gameplay hit-mesh order, weapon pivot
// and the two-hand grip solver live here. AI decisions/locomotion stay in bots.js.

function mkHuman(et,team){
  const g=new THREE.Group();const pts=[];
  const ally=team==='ally';
  const clothCol=ally?0x172a38:0x302126;
  const armCol=ally?0x287bb0:0xa22f42;
  const shellCol=ally?0x788d99:0x8c8581;
  const suitDark=ally?0x081018:0x110d10;
  const glowCol=ally?0x48d8ff:0xff3858;

  // Gameplay hit meshes. Their order is intentionally unchanged.
  const A=(geo,col,x,y,z,rx=0,ry=0,rz=0)=>{
    const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:col,roughness:.62,metalness:.10}));
    m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;g.add(m);pts.push(m);return m;
  };
  A(new THREE.SphereGeometry(.22,8,6),suitDark,0,1.82,0);
  const helm=new THREE.Mesh(
    new THREE.SphereGeometry(.245,8,5,0,Math.PI*2,0,Math.PI/2),
    new THREE.MeshStandardMaterial({color:shellCol,roughness:.30,metalness:.62})
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
  const shellMat=new THREE.MeshStandardMaterial({color:shellCol,roughness:.34,metalness:.58});
  const darkMat=new THREE.MeshStandardMaterial({color:suitDark,roughness:.48,metalness:.42});
  const glowMat=new THREE.MeshStandardMaterial({color:glowCol,roughness:.18,metalness:.48,emissive:glowCol,emissiveIntensity:.88});
  const proceduralDecor=[];
  // Gameplay yaw and muzzle math define local +Z as forward. The legacy
  // procedural art was authored toward -Z, so keep the correction strictly in
  // presentation space instead of rotating g/pts[] and breaking combat math.
  const visualRoot=new THREE.Group();visualRoot.rotation.y=Math.PI;g.add(visualRoot);
  const V=(geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{
    const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=!MOBILE_LOW;visualRoot.add(m);proceduralDecor.push(m);return m;
  };
  const P=(parent,geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{
    const facing=new THREE.Group();facing.rotation.y=Math.PI;parent.add(facing);
    const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=!MOBILE_LOW;facing.add(m);proceduralDecor.push(facing);return m;
  };

  // The gameplay limb boxes stay intact for hit detection, but visually become
  // dark undersuit beneath articulated armor shells.
  for(const idx of [4,5,6,7,8,9,10,11]){
    const mat=pts[idx]?.material;
    if(mat){mat.color.set(suitDark);mat.roughness=.72;mat.metalness=.06;}
  }

  V(new THREE.BoxGeometry(.30,.085,.26),glowMat,0,1.875,-.18,.04);
  V(new THREE.BoxGeometry(.28,.085,.08),darkMat,0,1.73,-.205,-.16);
  V(new THREE.BoxGeometry(.08,.18,.10),armorMat,-.245,1.84,-.02,0,0,.18);
  V(new THREE.BoxGeometry(.08,.18,.10),armorMat,.245,1.84,-.02,0,0,-.18);
  V(new THREE.BoxGeometry(.46,.38,.075),shellMat,0,1.33,-.178,-.03);
  V(new THREE.BoxGeometry(.25,.09,.12),darkMat,0,1.57,-.11);
  V(new THREE.BoxGeometry(.21,.14,.32),armorMat,-.36,1.43,0,0,0,.20);
  V(new THREE.BoxGeometry(.21,.14,.32),armorMat,.36,1.43,0,0,0,-.20);
  V(new THREE.BoxGeometry(.34,.09,.08),glowMat,0,1.13,-.19);
  V(new THREE.BoxGeometry(.35,.42,.15),darkMat,0,1.27,.20);
  V(new THREE.BoxGeometry(.48,.10,.30),darkMat,0,.89,0);

  // Layered arm shells follow the existing two-bone hit meshes exactly. This
  // improves silhouette without changing arm lengths, solver math or hitboxes.
  const highDetail=!MOBILE_LOW;
  const jointMat=new THREE.MeshStandardMaterial({color:0x111820,roughness:.34,metalness:.64});
  const addArmShell=(mesh,side,upper)=>{
    const len=upper?.43:.34;
    P(mesh,new THREE.CylinderGeometry(upper?.095:.080,upper?.115:.095,len,6),shellMat,0,0,0);
    if(highDetail){
      P(mesh,new THREE.BoxGeometry(upper?.17:.145,upper?.24:.22,.14),armorMat,side*.012,upper?.055:-.018,-.075,0,0,side*(upper?.08:.045));
      P(mesh,new THREE.BoxGeometry(.035,upper?.20:.16,.025),glowMat,-side*.055,upper?.035:-.015,-.145);
      P(mesh,new THREE.SphereGeometry(upper?.105:.085,7,5),jointMat,0,upper?len*.48:-len*.49,0);
    }
  };
  addArmShell(pts[4],-1,true);addArmShell(pts[5],1,true);
  addArmShell(pts[6],-1,false);addArmShell(pts[7],1,false);

  // Independent visual leg hierarchy: gameplay pts[8..13] keep their historical
  // transforms/hit surface while these shells articulate from hip -> knee -> ankle.
  const legRoot=new THREE.Group();g.add(legRoot);
  const makeVisualLeg=side=>{
    const hip=new THREE.Group();hip.position.set(side*.17,.79,0);legRoot.add(hip);
    P(hip,new THREE.CylinderGeometry(.105,.135,.47,6),shellMat,0,-.235,0);
    if(highDetail){
      P(hip,new THREE.SphereGeometry(.135,8,6),jointMat,0,0,0);
      P(hip,new THREE.BoxGeometry(.17,.27,.15),armorMat,0,-.22,-.075,side*.025,0,side*.025);
      P(hip,new THREE.BoxGeometry(.034,.18,.025),glowMat,-side*.055,-.22,-.155);
    }

    const knee=new THREE.Group();knee.position.set(0,-.47,0);hip.add(knee);
    P(knee,new THREE.CylinderGeometry(.09,.075,.39,6),shellMat,0,-.195,0);
    if(highDetail){
      P(knee,new THREE.SphereGeometry(.125,8,6),jointMat,0,0,0);
      P(knee,new THREE.BoxGeometry(.19,.15,.13),armorMat,0,.015,-.105,-.08,0,0);
      P(knee,new THREE.BoxGeometry(.030,.16,.023),glowMat,side*.050,-.19,-.150);
    }

    const ankle=new THREE.Group();ankle.position.set(0,-.39,0);knee.add(ankle);
    P(ankle,new THREE.BoxGeometry(.205,.12,.33),darkMat,0,.035,.075,-.04,0,0);
    if(highDetail){
      P(ankle,new THREE.SphereGeometry(.082,7,5),jointMat,0,0,.015);
      P(ankle,new THREE.BoxGeometry(.17,.075,.22),shellMat,0,.085,-.035,-.08,0,0);
    }
    return{hip,knee,ankle};
  };
  const legRig={root:legRoot,left:makeVisualLeg(-1),right:makeVisualLeg(1)};

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
    cuff.position.set(0,.095,.025);hand.add(cuff);proceduralDecor.push(cuff);
    const knuckle=new THREE.Mesh(new THREE.BoxGeometry(.13,.045,.09),shellMat);
    knuckle.position.set(0,.005,-.105);knuckle.rotation.x=-.12;hand.add(knuckle);proceduralDecor.push(knuckle);
    const handGlow=new THREE.Mesh(new THREE.BoxGeometry(.075,.018,.018),glowMat);
    handGlow.position.set(0,.012,-.153);hand.add(handGlow);proceduralDecor.push(handGlow);
    g.add(hand);return hand;
  };
  const leftHand=makeRigHand(-.36,.66,-.02);
  const rightHand=makeRigHand(.36,.66,-.02);

  const ringCol=ally?0x35c8ff:0xff2748;
  const insigniaMat=new THREE.MeshBasicMaterial({color:ringCol,side:THREE.DoubleSide});
  const insigniaDark=new THREE.MeshStandardMaterial({color:0x101820,roughness:.42,metalness:.62,emissive:ringCol,emissiveIntensity:.10});
  const addInsignia=(z,flip=0)=>{
    const plate=new THREE.Mesh(new THREE.BoxGeometry(.25,.25,.025),insigniaDark);
    plate.position.set(0,1.34,z);plate.rotation.y=flip;visualRoot.add(plate);proceduralDecor.push(plate);
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
  weaponPivot.position.set(.39,1.23,.07);
  weaponPivot.rotation.set(.05,Math.PI+.07,-.35);
  g.add(weaponPivot);
  const armRig={
    leftUpper:pts[4],rightUpper:pts[5],
    leftFore:pts[6],rightFore:pts[7],
    leftHand,rightHand
  };
  const model46=typeof installBotModel46Rig==='function'
    ?installBotModel46Rig({team,pts,legRig,leftHand,rightHand,proceduralDecor})
    :null;
  return{g,pts,weaponPivot,armRig,legRig,model46};
}

function setBotVisualLegPose(leg,swing,lift,side,strafeRoll,sideRatio,gaitNorm){
  const hipX=swing*.92;
  const kneeX=-swing*.72+lift*.42;
  leg.hip.rotation.x=hipX;
  leg.hip.rotation.y=side*sideRatio*.035*gaitNorm;
  leg.hip.rotation.z=-strafeRoll*.72;
  leg.knee.rotation.x=kneeX;
  leg.knee.rotation.z=strafeRoll*.38;
  leg.ankle.rotation.x=-hipX*.24-kneeX*.72-lift*.06;
  leg.ankle.rotation.z=strafeRoll*.22;
}
function applyBotLegVisualPose(rig,leftSwing,rightSwing,leftLift,rightLift,strideBob,hipSway,strafeRoll,sideRatio,gaitNorm){
  if(!rig?.root||!rig.left?.hip||!rig.left?.knee||!rig.left?.ankle||!rig.right?.hip||!rig.right?.knee||!rig.right?.ankle)return false;
  rig.root.position.x=hipSway*.34;
  rig.root.position.y=strideBob*.38;
  rig.root.rotation.z=-strafeRoll*.18;
  setBotVisualLegPose(rig.left,leftSwing,leftLift,-1,strafeRoll,sideRatio,gaitNorm);
  setBotVisualLegPose(rig.right,rightSwing,rightLift,1,strafeRoll,sideRatio,gaitNorm);
  return true;
}

function botPresentationFollow(current,target,rate,dt){
  return current+(target-current)*(1-Math.exp(-rate*Math.max(0,dt)));
}
function botPresentationAngleDelta(target,current){
  return Math.atan2(Math.sin(target-current),Math.cos(target-current));
}
function updateBotMechanicalPresentation(bot,{targetPos=null,combatPose=false,gaitNorm=0,strafeRoll=0,bodyLean=0,dt=.016}={}){
  if(!bot)return false;
  const model=bot.model46;
  const targetAim=combatPose&&!!targetPos&&bot.reloadT<=0?1:0;
  const targetReload=bot.reloadT>0?1:0;
  const targetCrouch=bot.aiState==='cover'&&(bot.reloadT>0||!bot.peekPoint||bot.suppressedT>0)?.88:
    bot.suppressedT>0?.30:0;
  bot.visualAimBlend=botPresentationFollow(bot.visualAimBlend||0,targetAim,9.5,dt);
  bot.visualReloadBlend=botPresentationFollow(bot.visualReloadBlend||0,targetReload,11,dt);
  bot.visualCrouchBlend=botPresentationFollow(bot.visualCrouchBlend||0,targetCrouch,targetCrouch>0?8.5:10.5,dt);
  bot.landingCompression=Math.max(0,(bot.landingCompression||0)-dt*4.8);

  const aim=bot.visualAimBlend,reload=bot.visualReloadBlend,crouch=bot.visualCrouchBlend;
  const land=Math.min(1,bot.landingCompression||0);
  let headYaw=0,torsoYaw=0;
  if(targetPos&&bot.group){
    const dx=targetPos.x-bot.group.position.x,dz=targetPos.z-bot.group.position.z;
    const localDelta=botPresentationAngleDelta(Math.atan2(dx,dz),bot.group.rotation.y);
    headYaw=Math.max(-.44,Math.min(.44,localDelta*.62));
    torsoYaw=Math.max(-.22,Math.min(.22,localDelta*.31));
  }
  bot.visualHeadYaw=botPresentationFollow(bot.visualHeadYaw||0,headYaw,10.5,dt);
  bot.visualTorsoYaw=botPresentationFollow(bot.visualTorsoYaw||0,torsoYaw,8.2,dt);

  if(model){
    if(model.head){
      model.head.position.y=-.125-crouch*.055-land*.025;
      model.head.rotation.x=-bodyLean*.16+aim*.025+reload*.020;
      model.head.rotation.y=Math.PI+bot.visualHeadYaw;
      model.head.rotation.z=-strafeRoll*.18;
    }
    if(model.torso){
      model.torso.position.y=-crouch*.065-land*.055;
      model.torso.rotation.x=-bodyLean*.42+crouch*.105+aim*.028;
      model.torso.rotation.y=Math.PI+bot.visualTorsoYaw;
      model.torso.rotation.z=-strafeRoll*.22+reload*(bot.sideBias||1)*.025;
    }
    if(model.pelvis){
      model.pelvis.position.y=-crouch*.040-land*.035;
      model.pelvis.rotation.x=-bodyLean*.14+crouch*.065+land*.045;
      model.pelvis.rotation.y=Math.PI-bot.visualTorsoYaw*.20;
      model.pelvis.rotation.z=-strafeRoll*.16;
    }
    const shoulderKick=Math.min(.11,Math.max(0,bot.fireBurstRecoil||0)*.105);
    if(model.leftShoulder){
      model.leftShoulder.rotation.x=-shoulderKick*.52+aim*.025;
      model.leftShoulder.rotation.y=Math.PI;
      model.leftShoulder.rotation.z=-reload*.035;
    }
    if(model.rightShoulder){
      model.rightShoulder.rotation.x=-shoulderKick+aim*.040;
      model.rightShoulder.rotation.y=Math.PI;
      model.rightShoulder.rotation.z=reload*.055;
    }
  }

  const rig=bot.legRig;
  if(rig?.root&&rig.left?.hip&&rig.left?.knee&&rig.left?.ankle&&rig.right?.hip&&rig.right?.knee&&rig.right?.ankle){
    rig.root.position.y-=crouch*.095+land*.090;
    for(const leg of [rig.left,rig.right]){
      leg.hip.rotation.x+=crouch*.16+land*.10;
      leg.knee.rotation.x-=crouch*.30+land*.20;
      leg.ankle.rotation.x+=crouch*.12+land*.08;
    }
  }
  if(bot.weaponPivot){
    bot.weaponPivot.position.x+=reload*(bot.sideBias||1)*.065;
    bot.weaponPivot.position.y+=aim*.038-reload*.105-crouch*.055-land*.035;
    bot.weaponPivot.position.z+=reload*.035;
    bot.weaponPivot.rotation.x+=aim*.055+reload*.245+crouch*.025;
    bot.weaponPivot.rotation.z+=reload*(bot.sideBias||1)*.145;
  }
  return true;
}

const _BOT_ARM_UP=new THREE.Vector3(0,1,0);
const _BOT_ARM_DIR=new THREE.Vector3();
const _BOT_ARM_BEND=new THREE.Vector3();
const _BOT_ARM_ELBOW=new THREE.Vector3();
const _BOT_ARM_MID=new THREE.Vector3();
const _BOT_GRIP_R=new THREE.Vector3();
const _BOT_GRIP_L=new THREE.Vector3();
const _BOT_SHOULDER_R=new THREE.Vector3(.38,1.48,-.015);
const _BOT_SHOULDER_L=new THREE.Vector3(-.38,1.48,-.015);
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
