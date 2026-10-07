'use strict';

// ─── BLENDER WORLD WEAPONS PACK 49 ─────────────────────────────────────────
// Original Blender geometry for bot hands and 3D world pickups.
// First-person rendering deliberately stays in src/weapons/system.js.

const WORLD_WEAPON_49_KEYS=Object.freeze(['pistol','shotgun','rifle','plasma','sniper','rocket']);
const _WORLD_WEAPON_49_GEOMETRIES=new Map();
const _WORLD_WEAPON_49_MATERIALS=new Map();

function worldWeapon49Available(key=''){
  const pack=window.ZAP_WORLD_WEAPONS_49;
  if(!pack||pack.version!==49||!pack.components||!pack.weapons)return false;
  if(key){
    const spec=pack.weapons[key];
    return !!(spec&&pack.components[spec.component]);
  }
  return WORLD_WEAPON_49_KEYS.every(k=>worldWeapon49Available(k));
}
function decodeWorldWeapon49Q16(encoded,scale=1){
  const raw=atob(encoded||'');
  if(!raw)return new Float32Array(0);
  const bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  const src=new Int16Array(bytes.buffer);
  const out=new Float32Array(src.length);
  for(let i=0;i<src.length;i++)out[i]=src[i]/32767*scale;
  return out;
}
function worldWeapon49Geometry(componentName){
  if(_WORLD_WEAPON_49_GEOMETRIES.has(componentName))return _WORLD_WEAPON_49_GEOMETRIES.get(componentName);
  const data=window.ZAP_WORLD_WEAPONS_49?.components?.[componentName];
  if(!data)return null;
  const positions=decodeWorldWeapon49Q16(data.p16,data.qScale||1);
  const normals=decodeWorldWeapon49Q16(data.n16,1);
  if(!positions.length||positions.length!==normals.length)return null;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.clearGroups();
  const materialNames=[];
  for(const group of data.groups||[]){
    let idx=materialNames.indexOf(group.material);
    if(idx<0){idx=materialNames.length;materialNames.push(group.material);}
    geometry.addGroup(group.start,group.count,idx);
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData.worldWeapon49MaterialNames=materialNames;
  _WORLD_WEAPON_49_GEOMETRIES.set(componentName,geometry);
  return geometry;
}
function worldWeapon49Materials(accentColor=0x43c7ff){
  const accent=Number.isFinite(accentColor)?accentColor:0x43c7ff;
  const key=accent>>>0;
  if(_WORLD_WEAPON_49_MATERIALS.has(key))return _WORLD_WEAPON_49_MATERIALS.get(key);
  const GlassMaterial=THREE.MeshPhysicalMaterial||THREE.MeshStandardMaterial;
  const set=Object.freeze({
    MAT_DARK:new THREE.MeshStandardMaterial({color:0x0b1118,roughness:.62,metalness:.18}),
    MAT_SHELL:new THREE.MeshStandardMaterial({color:0x35414a,roughness:.38,metalness:.34}),
    MAT_EDGE:new THREE.MeshStandardMaterial({color:0x8796a2,roughness:.28,metalness:.50}),
    MAT_ACCENT:new THREE.MeshStandardMaterial({color:accent,roughness:.34,metalness:.10,emissive:accent,emissiveIntensity:.20}),
    MAT_GLOW:new THREE.MeshStandardMaterial({color:accent,roughness:.18,metalness:.06,emissive:accent,emissiveIntensity:1.18}),
    MAT_GLASS:new GlassMaterial({color:0x174e5d,roughness:.12,metalness:.08,clearcoat:1,clearcoatRoughness:.10,emissive:accent,emissiveIntensity:.48}),
    MAT_RUBBER:new THREE.MeshStandardMaterial({color:0x05070a,roughness:.84,metalness:.03}),
    MAT_WARNING:new THREE.MeshStandardMaterial({color:0xe66b22,roughness:.42,metalness:.12,emissive:0xff531f,emissiveIntensity:.16})
  });
  _WORLD_WEAPON_49_MATERIALS.set(key,set);
  return set;
}
function createWorldWeaponModel49(key,options={}){
  if(!worldWeapon49Available(key))return null;
  const pack=window.ZAP_WORLD_WEAPONS_49;
  const spec=pack.weapons[key];
  const canonicalGeometry=worldWeapon49Geometry(spec.component);
  if(!canonicalGeometry)return null;
  const accentColor=options.accentColor??0x43c7ff;
  const set=worldWeapon49Materials(accentColor);
  // clearGroupChildren()/destroySceneObject() dispose instance resources. Clone
  // the decoded canonical geometry/materials so a bot weapon switch or pickup
  // cleanup can never poison the shared Pack49 decode cache.
  const geometry=canonicalGeometry.clone();
  const materials=(canonicalGeometry.userData.worldWeapon49MaterialNames||[]).map(name=>(set[name]||set.MAT_DARK).clone());
  const mesh=new THREE.Mesh(geometry,materials);
  mesh.name='weapon49-'+key+'-mesh';
  mesh.castShadow=options.mode!=='firstPerson'&&!MOBILE_LOW;
  mesh.receiveShadow=false;
  const group=new THREE.Group();
  group.name='weapon-'+key;
  group.add(mesh);
  group.userData.weaponKey=key;
  group.userData.muzzleZ=spec.muzzleZ;
  group.userData.blenderWorldWeapon49=true;
  group.userData.packVersion=49;
  return group;
}
