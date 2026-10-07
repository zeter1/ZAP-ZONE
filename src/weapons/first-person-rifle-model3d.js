'use strict';

// ─── BLENDER FIRST-PERSON RIFLE PACK 50 ────────────────────────────────────
// Rifle-only presentation upgrade. Gameplay ballistics, camera recoil and
// weapon state remain owned by existing systems. Missing/corrupt Pack50 data
// returns null so src/weapons/system.js can keep Pack36/procedural fallbacks.

const FP_RIFLE_50_COMPONENTS=Object.freeze([
  'FP50_RifleBody','FP50_Magazine','FP50_Bolt','FP50_LeftArm','FP50_RightArm'
]);
const _FP_RIFLE_50_GEOMETRIES=new Map();

function firstPersonRifle50Available(){
  const pack=window.ZAP_FP_RIFLE_50;
  return !!(pack&&pack.version===50&&pack.weaponKey==='rifle'&&pack.components&&
    FP_RIFLE_50_COMPONENTS.every(name=>pack.components[name]));
}
function decodeFirstPersonRifle50Q16(encoded,scale=1){
  const raw=atob(encoded||'');
  if(!raw)return new Float32Array(0);
  const bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  const src=new Int16Array(bytes.buffer);
  const out=new Float32Array(src.length);
  for(let i=0;i<src.length;i++)out[i]=src[i]/32767*scale;
  return out;
}
function firstPersonRifle50Geometry(componentName){
  if(_FP_RIFLE_50_GEOMETRIES.has(componentName))return _FP_RIFLE_50_GEOMETRIES.get(componentName);
  const data=window.ZAP_FP_RIFLE_50?.components?.[componentName];
  if(!data)return null;
  const positions=decodeFirstPersonRifle50Q16(data.p16,data.qScale||1);
  const normals=decodeFirstPersonRifle50Q16(data.n16,1);
  if(!positions.length||positions.length!==normals.length)return null;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.clearGroups();
  const materialNames=[];
  for(const group of data.groups||[]){
    let index=materialNames.indexOf(group.material);
    if(index<0){index=materialNames.length;materialNames.push(group.material);}
    geometry.addGroup(group.start,group.count,index);
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData.fpRifle50MaterialNames=materialNames;
  _FP_RIFLE_50_GEOMETRIES.set(componentName,geometry);
  return geometry;
}
function firstPersonRifle50Materials(){
  const Standard=THREE.MeshStandardMaterial;
  const Glass=THREE.MeshPhysicalMaterial||Standard;
  return {
    MAT_DARK:new Standard({color:0x0b1118,roughness:.64,metalness:.20}),
    MAT_SHELL:new Standard({color:0x182536,roughness:.43,metalness:.30}),
    MAT_EDGE:new Standard({color:0x596672,roughness:.31,metalness:.46}),
    MAT_ACCENT:new Standard({color:0x1268eb,roughness:.32,metalness:.09,emissive:0x0d58d5,emissiveIntensity:.30}),
    MAT_GLOW:new Standard({color:0x3d9cff,roughness:.18,metalness:.04,emissive:0x1478ff,emissiveIntensity:1.15}),
    MAT_WARNING:new Standard({color:0xf04c0a,roughness:.34,metalness:.10,emissive:0xff3510,emissiveIntensity:.30}),
    MAT_GLASS:new Glass({color:0x512b0d,roughness:.15,metalness:.07,clearcoat:1,clearcoatRoughness:.10,emissive:0xff5a12,emissiveIntensity:.35}),
    MAT_RUBBER:new Standard({color:0x05080d,roughness:.88,metalness:.03}),
    MAT_SLEEVE:new Standard({color:0x0c1722,roughness:.78,metalness:.14}),
    MAT_GLOVE:new Standard({color:0x080d13,roughness:.84,metalness:.06})
  };
}
function createFirstPersonRifleModel50(){
  if(!firstPersonRifle50Available())return null;
  const pack=window.ZAP_FP_RIFLE_50;
  const set=firstPersonRifle50Materials();
  const root=new THREE.Group();
  root.name='weapon-rifle-pack50';
  const parts={};
  const rest={};

  for(const componentName of FP_RIFLE_50_COMPONENTS){
    const spec=pack.components[componentName];
    const canonical=firstPersonRifle50Geometry(componentName);
    if(!canonical)return null;
    const materialNames=canonical.userData.fpRifle50MaterialNames||[];
    const materials=materialNames.map(name=>(set[name]||set.MAT_DARK).clone());
    const mesh=new THREE.Mesh(canonical.clone(),materials);
    mesh.name=componentName+'-mesh';
    mesh.castShadow=false;
    mesh.receiveShadow=false;

    const pivot=new THREE.Group();
    pivot.name=componentName;
    const p=spec.rest?.p||[0,0,0];
    pivot.position.set(Number(p[0])||0,Number(p[1])||0,Number(p[2])||0);
    pivot.add(mesh);
    root.add(pivot);

    const kind=spec.rest?.kind||'body';
    parts[kind]=pivot;
    rest[kind]={
      position:pivot.position.clone(),
      rotation:pivot.rotation.clone()
    };
  }

  root.userData.weaponKey='rifle';
  root.userData.muzzleZ=Number.isFinite(pack.muzzleZ)?pack.muzzleZ:-1.78;
  root.userData.blenderFirstPersonRifle50=true;
  root.userData.packVersion=50;
  root.userData.rifle50Parts=parts;
  root.userData.rifle50Rest=rest;
  return root;
}
function _fpRifle50Smooth01(value){
  const x=Math.max(0,Math.min(1,Number(value)||0));
  return x*x*(3-2*x);
}
function updateFirstPersonRifleModel50(model,state={}){
  if(!model?.userData?.blenderFirstPersonRifle50)return false;
  const parts=model.userData.rifle50Parts||{};
  const rest=model.userData.rifle50Rest||{};
  const bolt=parts.bolt,mag=parts.magazine,left=parts.leftArm,right=parts.rightArm;
  const ads=Math.max(0,Math.min(1,Number(state.adsBlend)||0));
  const hip=model.userData.rifle50HipPosition;
  if(hip){
    model.position.copy(hip);
    model.position.y+=.100*ads;
    model.position.z+=.025*ads;
  }
  const recoil=Math.max(0,Math.min(1,Number(state.recoil)||0));
  const reloadProgress=Math.max(0,Math.min(1,Number(state.reloadProgress)||0));
  const reloadActive=!!state.reloading;
  const cycle=Math.max(0,Math.min(1,Number(state.cycle)||0));
  const shotKick=Math.max(recoil,Math.sin(cycle*Math.PI)*.58);

  if(bolt&&rest.bolt){
    bolt.position.copy(rest.bolt.position);
    bolt.rotation.copy(rest.bolt.rotation);
    bolt.position.z+=shotKick*.092;
    bolt.position.x+=Math.sin((Number(state.shotSequence)||0)*2.399)*shotKick*.006;
  }

  const out=_fpRifle50Smooth01(Math.min(1,reloadProgress/.34));
  const back=_fpRifle50Smooth01(Math.max(0,(reloadProgress-.58)/.34));
  const removed=reloadActive?Math.max(0,out-back):0;
  const handReach=reloadActive?Math.sin(Math.PI*Math.max(0,Math.min(1,reloadProgress))):0;

  if(mag&&rest.magazine){
    mag.position.copy(rest.magazine.position);
    mag.rotation.copy(rest.magazine.rotation);
    mag.position.y-=removed*.24;
    mag.position.z+=removed*.075;
    mag.position.x-=removed*.025;
    mag.rotation.x+=removed*.30;
    mag.rotation.z-=removed*.10;
  }
  if(left&&rest.leftArm){
    left.position.copy(rest.leftArm.position);
    left.rotation.copy(rest.leftArm.rotation);
    left.position.y-=handReach*.115;
    left.position.z+=handReach*.055;
    left.position.x+=handReach*.035;
    left.rotation.x-=handReach*.20;
    left.rotation.z+=handReach*.10;
  }
  if(right&&rest.rightArm){
    right.position.copy(rest.rightArm.position);
    right.rotation.copy(rest.rightArm.rotation);
    right.position.z+=recoil*.018;
    right.rotation.x-=recoil*.045;
    right.rotation.z-=recoil*.016;
  }
  return true;
}
