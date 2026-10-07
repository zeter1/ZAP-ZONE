'use strict';

// ─── BLENDER MAP KIT PACK 47 ────────────────────────────────────────────────
// Canonical geometry comes from Blender. The generated runtime derivative keeps
// direct file:// startup working while collision stays owned by engine boxes/AABBs.

const MAP_KIT_47={
  wall4:'KIT_Wall_4m',wall8:'KIT_Wall_8m',wall12:'KIT_Wall_12m',
  corner:'KIT_Corner_90',column:'KIT_Column',door:'KIT_Door_Frame',
  barrier:'KIT_Barrier',container:'KIT_Container',armorCover:'KIT_Armor_Cover',
  sciFiSandbag:'KIT_SciFi_Sandbag',antiTank:'KIT_AntiTank_Block',cargoCrate:'KIT_Cargo_Crate',
  reactorHousing:'KIT_Reactor_Housing',ramp:'KIT_Ramp',ladder:'KIT_Ladder',grate:'KIT_Grate',techPanel:'KIT_Tech_Panel',
  vent:'KIT_Vent',pipe:'KIT_Pipe_Straight',pipeElbow:'KIT_Pipe_Elbow',
  cableTray:'KIT_Cable_Tray',fortification:'KIT_Fortification',base:'KIT_Base_Module'
};
const _MAP47_GEOS=new Map();
let _MAP47_MATS=null;

function mapKit47Available(){
  const p=window.ZAP_MAP_KIT_47;
  return !!(p&&p.version===47&&p.components&&p.components[MAP_KIT_47.wall4]);
}
function decodeMap47Q16(encoded,scale=1){
  const raw=atob(encoded||'');if(!raw)return new Float32Array(0);
  const bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  const src=new Int16Array(bytes.buffer),out=new Float32Array(src.length);
  for(let i=0;i<src.length;i++)out[i]=src[i]/32767*scale;
  return out;
}
function mapKit47Materials(){
  if(_MAP47_MATS)return _MAP47_MATS;
  // Pack47 uses large, repeated hard-surface meshes without an HDR environment.
  // Keep broad materials deliberately rough/low-metal so distant bevels and ribs
  // do not produce subpixel specular crawling while the player moves.
  _MAP47_MATS=Object.freeze({
    MAT_DARK:new THREE.MeshStandardMaterial({color:0x172433,roughness:.76,metalness:.18}),
    MAT_SHELL:new THREE.MeshStandardMaterial({color:0x536a78,roughness:.62,metalness:.24}),
    MAT_EDGE:new THREE.MeshStandardMaterial({color:0xa0b0ba,roughness:.52,metalness:.34}),
    MAT_ACCENT:new THREE.MeshStandardMaterial({color:0x1aa8cf,roughness:.44,metalness:.12,emissive:0x063848,emissiveIntensity:.18}),
    MAT_GLOW:new THREE.MeshStandardMaterial({color:0x63eaff,roughness:.28,metalness:.04,emissive:0x20b8df,emissiveIntensity:.62}),
    MAT_WARNING:new THREE.MeshStandardMaterial({color:0xf05a18,roughness:.48,metalness:.12,emissive:0x631500,emissiveIntensity:.22}),
    MAT_RUBBER:new THREE.MeshStandardMaterial({color:0x090d11,roughness:.90,metalness:.02})
  });
  return _MAP47_MATS;
}
function mapKit47Geometry(name){
  if(_MAP47_GEOS.has(name))return _MAP47_GEOS.get(name);
  const data=window.ZAP_MAP_KIT_47?.components?.[name];if(!data)return null;
  const p=decodeMap47Q16(data.p16,data.qScale||1);
  const n=decodeMap47Q16(data.n16,1);
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
  g.userData.mapKit47MaterialNames=names;
  _MAP47_GEOS.set(name,g);return g;
}
function createMapKit47Piece(name){
  if(!mapKit47Available())return null;
  const g=mapKit47Geometry(name);if(!g)return null;
  const set=mapKit47Materials();
  const mats=(g.userData.mapKit47MaterialNames||[]).map(n=>set[n]||set.MAT_DARK);
  const m=new THREE.Mesh(g,mats);
  m.name='map47-'+name;
  m.castShadow=!MOBILE_LOW;
  // Pack47 facades contain many shallow bevels/ribs. Receiving the arena's
  // 1024² directional shadow map across a ~164 m frustum caused moving bands
  // (shadow acne) on those surfaces. They still cast world shadows, but their
  // own PBR lighting is direct/hemisphere/ambient only.
  m.receiveShadow=false;
  m.userData.presentationOnly=true;
  m.userData.mapKit47AntiShimmer=true;
  return m;
}
function attachMapKit47(owner,name,{position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]}={}){
  if(!owner)return null;
  const m=createMapKit47Piece(name);if(!m)return null;
  m.position.set(...position);m.rotation.set(...rotation);m.scale.set(...scale);
  owner.add(m);return m;
}
function _map47WallSource(length){
  if(length>=10)return [MAP_KIT_47.wall12,12];
  if(length>=6)return [MAP_KIT_47.wall8,8];
  return [MAP_KIT_47.wall4,4];
}
function decorateMapKit47Wall(owner,w,h,d){
  if(!owner||!mapKit47Available())return null;
  const alongX=w>=d,len=Math.max(w,d),thick=Math.min(w,d);
  const [name,baseLen]=_map47WallSource(len);
  return attachMapKit47(owner,name,{rotation:[0,alongX?0:Math.PI/2,0],scale:[len/baseLen,h/3,Math.max(.70,thick/.34)]});
}
function decorateMapKit47Column(owner,w,h,d){
  return attachMapKit47(owner,MAP_KIT_47.column,{scale:[w/.90,h/4,d/.90]});
}
function decorateMapKit47Container(owner,w,h,d){
  return attachMapKit47(owner,MAP_KIT_47.container,{scale:[w/3.6,h/1.8,d/1.8]});
}
function decorateMapKit47Barrier(owner,w,h,d){
  const alongX=w>=d,len=Math.max(w,d),thick=Math.min(w,d);
  return attachMapKit47(owner,MAP_KIT_47.barrier,{rotation:[0,alongX?0:Math.PI/2,0],scale:[len/4,h/1.15,Math.max(.75,thick/.78)]});
}
function decorateMapKit47Fortification(owner,w,h,d){
  const alongX=w>=d,len=Math.max(w,d),thick=Math.min(w,d);
  return attachMapKit47(owner,MAP_KIT_47.fortification,{rotation:[0,alongX?0:Math.PI/2,0],scale:[len/5.6,h/1.5,Math.max(.75,thick/1.4)]});
}
function decorateMapKit47ArmorCover(owner,w,h,d){
  const alongX=w>=d,len=Math.max(w,d),thick=Math.min(w,d);
  return attachMapKit47(owner,MAP_KIT_47.armorCover,{rotation:[0,alongX?0:Math.PI/2,0],scale:[len/4.8,h/1.55,Math.max(.72,thick/.90)]});
}
function decorateMapKit47SciFiSandbag(owner,w,h,d){
  const alongX=w>=d,len=Math.max(w,d),thick=Math.min(w,d);
  return attachMapKit47(owner,MAP_KIT_47.sciFiSandbag,{rotation:[0,alongX?0:Math.PI/2,0],scale:[len/4.2,h/1.25,Math.max(.72,thick/1.05)]});
}
function decorateMapKit47AntiTank(owner,w,h,d){
  const visualYaw=Number(owner?.userData?.mapKit47PresentationYaw)||0;
  return attachMapKit47(owner,MAP_KIT_47.antiTank,{rotation:[0,visualYaw,0],scale:[w/1.4,h/.9,d/1.4]});
}
function decorateMapKit47CargoCrate(owner,w,h,d){
  return attachMapKit47(owner,MAP_KIT_47.cargoCrate,{scale:[w/2,h/1.6,d/2]});
}
function decorateMapKit47ReactorHousing(owner,w,h,d){
  return attachMapKit47(owner,MAP_KIT_47.reactorHousing,{scale:[w/3,h/5,d/3]});
}
function addMapKit47SurfaceDetail(owner,name,{offset=0,height=.2,scale=1}={}){
  if(!owner)return null;
  const bounds=owner.geometry?.parameters||{};
  const w=Number(bounds.width)||1,d=Number(bounds.depth)||1;
  const alongX=w>=d;
  let pos=[offset,height,0],rot=[0,0,0];
  if(alongX){pos[2]=-(d/2+.055);rot[1]=Math.PI;}
  else{pos[0]=w/2+.055;pos[2]=offset;rot[1]=Math.PI/2;}
  return attachMapKit47(owner,name,{position:pos,rotation:rot,scale:[scale,scale,scale]});
}
function placeMapKit47Prop(name,x,y,z,ry=0,scale=1){
  const m=createMapKit47Piece(name);if(!m)return null;
  m.position.set(x,y,z);m.rotation.y=ry;
  if(Array.isArray(scale))m.scale.set(...scale);else m.scale.setScalar(scale);
  scene.add(m);return m;
}
function placeMapKit47DoorFrame(x,y,z,ry=0,width=3.8,height=3.0,depth=.6){
  const m=placeMapKit47Prop(MAP_KIT_47.door,x,y,z,ry,[width/3.58,height/3.2,Math.max(.72,depth/.54)]);
  if(m){m.userData.mapKit47Doorway=true;m.userData.doorwayWidth=width;}
  return m;
}
function placeMapKit47ServiceRamp(x,z,ry=0,width=3.4){
  const m=placeMapKit47Prop(MAP_KIT_47.ramp,x,.12,z,ry,[width/3.0,.18,.86]);
  if(m){m.userData.mapKit47ServiceRamp=true;m.userData.traversablePresentation=true;}
  return m;
}
function suppressMapKit47CollisionOwnerSurface(owner){
  if(!owner)return false;
  const mats=Array.isArray(owner.material)?owner.material:[owner.material];
  for(const material of mats){
    if(!material)continue;
    material.colorWrite=false;
    material.depthWrite=false;
  }
  owner.castShadow=false;
  owner.receiveShadow=false;
  owner.userData.presentationCollisionOwner=true;
  return true;
}
function decorateMapKit47Base(owner,w,h,d){
  const root=attachMapKit47(owner,MAP_KIT_47.base,{scale:[w/6,h/3.6,d/5]});
  if(!root)return null;
  // Final stable base presentation: do not attach any secondary geometry.
  // The single Blender shell is intentionally the only visible base surface.
  return root;
}
