'use strict';

// ─── BLENDER FLOOR KIT PACK 48 ──────────────────────────────────────────────
// Presentation-only modular floor. arenaFloor remains the exact flat ground,
// projectile endpoint and gameplay collision owner.

const FLOOR_KIT_48=Object.freeze({
  panel:'FLOOR_Panel_8m',
  far:'FLOOR_Far_8m',
  trench:'FLOOR_Trench_8m',
  grate:'FLOOR_Grate_8m',
  hatch:'FLOOR_Hatch_8m',
  guide:'FLOOR_Guide_8m',
  capture:'FLOOR_Capture_12m'
});
const FLOOR48_DETAIL_COMPONENTS=Object.freeze([
  FLOOR_KIT_48.panel,FLOOR_KIT_48.trench,FLOOR_KIT_48.grate,FLOOR_KIT_48.hatch,FLOOR_KIT_48.guide
]);
const FLOOR48_LOD_MOVE_THRESHOLD=2;
function floorKit48LodConfig(){
  return MOBILE_LOW
    ?{detailEnter:28,detailExit:36,captureRadius:40}
    :{detailEnter:36,detailExit:44,captureRadius:52};
}
const _FLOOR48_GEOS=new Map();
const _FLOOR48_LOD_MESHES=new Map();
const _FLOOR48_TILES=[];
const _FLOOR48_DUMMY=new THREE.Object3D();
let _FLOOR48_MATS=null;
let _floorKit48Root=null;
let _floorKit48CaptureMesh=null;
let _floorKit48CapturePlacements=[];
let _floorKit48LastLodX=Infinity,_floorKit48LastLodZ=Infinity;

function floorKit48Available(){
  const p=window.ZAP_FLOOR_KIT_48;
  return !!(p&&p.version===48&&p.components&&Object.values(FLOOR_KIT_48).every(name=>p.components[name]));
}
function decodeFloor48Q16(encoded,scale=1){
  const raw=atob(encoded||'');if(!raw)return new Float32Array(0);
  const bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  const src=new Int16Array(bytes.buffer),out=new Float32Array(src.length);
  for(let i=0;i<src.length;i++)out[i]=src[i]/32767*scale;
  return out;
}
function floorKit48Materials(){
  if(_FLOOR48_MATS)return _FLOOR48_MATS;
  _FLOOR48_MATS=Object.freeze({
    MAT_DARK:new THREE.MeshStandardMaterial({color:0x111a24,roughness:.68,metalness:.34}),
    MAT_SHELL:new THREE.MeshStandardMaterial({color:0x354957,roughness:.46,metalness:.40}),
    MAT_EDGE:new THREE.MeshStandardMaterial({color:0x788b98,roughness:.34,metalness:.52}),
    MAT_ACCENT:new THREE.MeshStandardMaterial({color:0x198eb4,roughness:.38,metalness:.16,emissive:0x063445,emissiveIntensity:.24}),
    MAT_GLOW:new THREE.MeshStandardMaterial({color:0x64dcf5,roughness:.24,metalness:.06,emissive:0x1d7691,emissiveIntensity:.62}),
    MAT_WARNING:new THREE.MeshStandardMaterial({color:0xe56721,roughness:.40,metalness:.18,emissive:0x4d1604,emissiveIntensity:.22}),
    MAT_RUBBER:new THREE.MeshStandardMaterial({color:0x080c11,roughness:.90,metalness:.02})
  });
  return _FLOOR48_MATS;
}
function floorKit48Geometry(name){
  if(_FLOOR48_GEOS.has(name))return _FLOOR48_GEOS.get(name);
  const data=window.ZAP_FLOOR_KIT_48?.components?.[name];if(!data)return null;
  const p=decodeFloor48Q16(data.p16,data.qScale||1);
  const n=decodeFloor48Q16(data.n16,1);
  if(!p.length||p.length!==n.length)return null;
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));
  const names=[];
  for(const group of data.groups||[]){
    let idx=names.indexOf(group.material);
    if(idx<0){idx=names.length;names.push(group.material);}
    g.addGroup(group.start,group.count,idx);
  }
  g.computeBoundingBox();g.computeBoundingSphere();
  g.userData.floorKit48MaterialNames=names;
  _FLOOR48_GEOS.set(name,g);
  return g;
}
function floorKit48MaterialArray(g,{overlay=false,far=false}={}){
  const set=floorKit48Materials();
  const mats=(g.userData.floorKit48MaterialNames||[]).map(name=>set[name]||set.MAT_DARK);
  if(!overlay&&!far)return mats;
  return mats.map(source=>{
    const material=source.clone();
    if(far){
      material.roughness=Math.max(.92,Number(material.roughness)||0);
      material.metalness=Math.min(.06,Number(material.metalness)||0);
      if('emissiveIntensity'in material)material.emissiveIntensity=0;
    }
    if(overlay){
      material.depthWrite=false;
      material.polygonOffset=true;
      material.polygonOffsetFactor=-1;
      material.polygonOffsetUnits=-2;
    }
    return material;
  });
}
function writeFloorKit48Batch(mesh,placements){
  if(!mesh)return;
  const list=placements||[];
  for(let i=0;i<list.length;i++){
    const p=list[i]||{};
    _FLOOR48_DUMMY.position.set(Number(p.x)||0,Number(p.y)||0,Number(p.z)||0);
    _FLOOR48_DUMMY.rotation.set(0,Number(p.ry)||0,0);
    const s=Number(p.scale)||1;_FLOOR48_DUMMY.scale.set(s,s,s);
    _FLOOR48_DUMMY.updateMatrix();mesh.setMatrixAt(i,_FLOOR48_DUMMY.matrix);
  }
  mesh.count=list.length;
  mesh.instanceMatrix.needsUpdate=true;
}
function createFloorKit48Instances(name,placements,label=name,{overlay=false,far=false,capacity=0,dynamic=false}={}){
  const list=Array.isArray(placements)?placements:[];
  const maxCount=Math.max(list.length,Math.max(0,Math.floor(Number(capacity)||0)));
  if(!floorKit48Available()||maxCount<1)return null;
  const g=floorKit48Geometry(name);if(!g)return null;
  const mesh=new THREE.InstancedMesh(g,floorKit48MaterialArray(g,{overlay,far}),maxCount);
  if(dynamic&&THREE.DynamicDrawUsage!==undefined)mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  writeFloorKit48Batch(mesh,list);
  mesh.name='floor48-'+label;
  mesh.castShadow=false;
  // Near-horizontal hard-surface microdetails shimmer under the arena's large
  // directional shadow map at grazing view angles. Keep Pack48 PBR-lit but
  // out of the shadow receiver path; gameplay shadows remain on map geometry.
  mesh.receiveShadow=false;
  mesh.frustumCulled=false;
  mesh.renderOrder=-8;
  mesh.userData.presentationOnly=true;
  mesh.userData.floorPresentation48=true;
  mesh.userData.floorComponent=name;
  mesh.userData.floorOverlay48=overlay;
  mesh.userData.floorFarLod48=far;
  mesh.userData.floorDynamicLod48=dynamic;
  mesh.userData.floorCapacity48=maxCount;
  (_floorKit48Root||scene).add(mesh);
  if(_floorKit48Root)_floorKit48Root.userData.instanceCount=(_floorKit48Root.userData.instanceCount||0)+list.length;
  return mesh;
}
function floorKit48TileChoice(ix,iz){
  const h=Math.abs(Math.imul(ix+37,73856093)^Math.imul(iz-19,19349663));
  if((ix===0||iz===0)&&h%4===0)return FLOOR_KIT_48.guide;
  if(h%19===0)return FLOOR_KIT_48.trench;
  if(h%13===0)return FLOOR_KIT_48.grate;
  if(h%11===0)return FLOOR_KIT_48.hatch;
  if(h%7===0)return FLOOR_KIT_48.guide;
  return FLOOR_KIT_48.panel;
}
function updateFloorKit48Lod(cameraPos,force=false){
  if(!_floorKit48Root||!cameraPos||!_FLOOR48_TILES.length)return false;
  const px=Number(cameraPos.x)||0,pz=Number(cameraPos.z)||0;
  const movedSq=(px-_floorKit48LastLodX)**2+(pz-_floorKit48LastLodZ)**2;
  if(!force&&Number.isFinite(movedSq)&&movedSq<FLOOR48_LOD_MOVE_THRESHOLD*FLOOR48_LOD_MOVE_THRESHOLD)return false;
  _floorKit48LastLodX=px;_floorKit48LastLodZ=pz;

  const cfg=floorKit48LodConfig();
  const enterSq=cfg.detailEnter*cfg.detailEnter,exitSq=cfg.detailExit*cfg.detailExit;
  const buckets=new Map(FLOOR48_DETAIL_COMPONENTS.map(name=>[name,[]]));
  buckets.set(FLOOR_KIT_48.far,[]);
  let nearCount=0,farCount=0;

  for(const tile of _FLOOR48_TILES){
    const dx=tile.x-px,dz=tile.z-pz,d2=dx*dx+dz*dz;
    if(tile.detailLod48===undefined)tile.detailLod48=d2<=exitSq;
    else if(tile.detailLod48&&d2>exitSq)tile.detailLod48=false;
    else if(!tile.detailLod48&&d2<enterSq)tile.detailLod48=true;
    const target=tile.detailLod48?tile.detailName:FLOOR_KIT_48.far;
    buckets.get(target).push(tile);
    if(tile.detailLod48)nearCount++;else farCount++;
  }
  for(const [name,mesh] of _FLOOR48_LOD_MESHES)writeFloorKit48Batch(mesh,buckets.get(name)||[]);

  if(_floorKit48CaptureMesh&&_floorKit48CapturePlacements.length){
    const captureSq=cfg.captureRadius*cfg.captureRadius;
    const visible=_floorKit48CapturePlacements.filter(p=>{
      const dx=p.x-px,dz=p.z-pz;return dx*dx+dz*dz<=captureSq;
    });
    writeFloorKit48Batch(_floorKit48CaptureMesh,visible);
    _floorKit48Root.userData.visibleCapturePads=visible.length;
  }
  _floorKit48Root.userData.lodEnabled=true;
  _floorKit48Root.userData.lodDetailEnter=cfg.detailEnter;
  _floorKit48Root.userData.lodDetailExit=cfg.detailExit;
  _floorKit48Root.userData.lodNearCount=nearCount;
  _floorKit48Root.userData.lodFarCount=farCount;
  _floorKit48Root.userData.lodUpdates=(_floorKit48Root.userData.lodUpdates||0)+1;
  return true;
}
function installFloorKit48Presentation(arenaFloor){
  if(_floorKit48Root||!arenaFloor||!floorKit48Available())return _floorKit48Root;
  const root=new THREE.Group();
  root.name='floor48-root';
  root.userData.presentationOnly=true;
  root.userData.floorPresentation48=true;
  root.userData.instanceCount=0;
  scene.add(root);
  _floorKit48Root=root;
  arenaFloor.userData.floorKit48CollisionOwner=true;
  arenaFloor.userData.floorKit48FlatGroundY=arenaFloor.position.y;
  const ownerMaterials=Array.isArray(arenaFloor.material)?arenaFloor.material:[arenaFloor.material];
  for(const material of ownerMaterials){
    if(!material)continue;
    material.colorWrite=false;
    material.depthWrite=false;
  }
  arenaFloor.receiveShadow=false;
  arenaFloor.userData.floorKit48RasterSuppressed=true;

  const fallback=new THREE.Mesh(
    new THREE.PlaneGeometry(220,220),
    new THREE.MeshStandardMaterial({color:0x121a24,roughness:.98,metalness:.02,side:THREE.DoubleSide})
  );
  fallback.name='floor48-fallback-plane';
  fallback.rotation.x=-Math.PI/2;
  fallback.position.set(arenaFloor.position.x,arenaFloor.position.y-.18,arenaFloor.position.z);
  fallback.receiveShadow=false;
  fallback.frustumCulled=false;
  fallback.renderOrder=-10;
  fallback.userData.presentationOnly=true;
  fallback.userData.floorPresentation48=true;
  fallback.userData.floorFallback48=true;
  root.add(fallback);
  root.userData.fallbackPlaneY=fallback.position.y;

  _FLOOR48_TILES.length=0;
  _FLOOR48_LOD_MESHES.clear();
  const capacities=new Map(FLOOR48_DETAIL_COMPONENTS.map(name=>[name,0]));
  const half=MOBILE_LOW?8:10;
  for(let ix=-half;ix<=half;ix++){
    for(let iz=-half;iz<=half;iz++){
      const detailName=floorKit48TileChoice(ix,iz);
      const h=Math.abs(Math.imul(ix+11,83492791)^Math.imul(iz-7,2654435761));
      const turns=(h>>>2)&3;
      _FLOOR48_TILES.push({detailName,x:ix*8,y:.018,z:iz*8,ry:turns*Math.PI/2,scale:1,detailLod48:undefined});
      capacities.set(detailName,(capacities.get(detailName)||0)+1);
    }
  }
  for(const name of FLOOR48_DETAIL_COMPONENTS){
    const mesh=createFloorKit48Instances(name,[],name+'-lod',{capacity:capacities.get(name)||1,dynamic:true});
    if(mesh)_FLOOR48_LOD_MESHES.set(name,mesh);
  }
  const farMesh=createFloorKit48Instances(FLOOR_KIT_48.far,[],'far-lod',{capacity:_FLOOR48_TILES.length,dynamic:true,far:true});
  if(farMesh)_FLOOR48_LOD_MESHES.set(FLOOR_KIT_48.far,farMesh);

  root.userData.instanceCount=_FLOOR48_TILES.length;
  root.userData.lodTileCount=_FLOOR48_TILES.length;
  arenaFloor.userData.floorKit48PresentationPieces=_FLOOR48_TILES.length;
  updateFloorKit48Lod(camera.position,true);
  return root;
}
function installFloorKit48CapturePads(zones){
  if(_floorKit48CaptureMesh||!floorKit48Available()||!Array.isArray(zones)||!zones.length)return _floorKit48CaptureMesh;
  _floorKit48CapturePlacements=zones.map(zone=>({
    x:Number(zone.x)||0,y:.018,z:Number(zone.z)||0,ry:0,
    scale:Math.max(.92,Math.min(1.18,(Number(zone.r)||18)/18)),zoneId:zone.id
  }));
  _floorKit48CaptureMesh=createFloorKit48Instances(
    FLOOR_KIT_48.capture,[],'capture-zones',
    {overlay:true,capacity:_floorKit48CapturePlacements.length,dynamic:true}
  );
  if(_floorKit48CaptureMesh){
    _floorKit48CaptureMesh.userData.captureZonePresentation=true;
    _floorKit48CaptureMesh.userData.zoneIds=zones.map(zone=>zone.id);
    if(_floorKit48Root)_floorKit48Root.userData.capturePads=_floorKit48CapturePlacements.length;
    updateFloorKit48Lod(camera.position,true);
  }
  return _floorKit48CaptureMesh;
}
