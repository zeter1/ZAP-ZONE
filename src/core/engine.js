'use strict';

// ─── RENDERER ───────────────────────────
const canvas=document.getElementById('canvas');
const IS_TOUCH=false;
const HW_THREADS=navigator.hardwareConcurrency||4;
const HW_MEMORY=navigator.deviceMemory||4;
const PERF_MODE=HW_THREADS<=4||HW_MEMORY<=4;
const MOBILE_LOW=PERF_MODE;
const VISUAL_LIGHTS=!PERF_MODE;
const SKY_COLOR=new THREE.Color(0x111925);
const FOG_COLOR=new THREE.Color(0x121a25);
let W=innerWidth,H=innerHeight;
const renderer=new THREE.WebGLRenderer({
  canvas,
  antialias:!PERF_MODE,
  powerPreference:'high-performance',
  alpha:false,
  precision:PERF_MODE?'mediump':'highp',
  stencil:false
});
renderer.setSize(W,H,false);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,PERF_MODE?1:1.25));
renderer.shadowMap.enabled=!PERF_MODE;
renderer.shadowMap.type=PERF_MODE?THREE.BasicShadowMap:THREE.PCFSoftShadowMap;
renderer.sortObjects=true;
renderer.autoClear=true;
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.78;
renderer.setClearColor(SKY_COLOR,1);
let webglLost=false;
let wasRunningBeforeContextLoss=false;
canvas.addEventListener('webglcontextlost',e=>{
  e.preventDefault();
  wasRunningBeforeContextLoss=running&&!paused;
  saveProgress(true);
  webglLost=true;
  running=false;
  showMsg('⚠️ Графика временно сброшена');
});
canvas.addEventListener('webglcontextrestored',()=>{
  webglLost=false;
  if(wasRunningBeforeContextLoss&&!dying&&!lvlAnnOpen&&!perkPickOpen){paused=false;running=true;}
  lastT=performance.now();
  saveProgress(true);
  showAnn('ГРАФИКА ВОССТАНОВЛЕНА');
});
const scene=new THREE.Scene();
function disposeMaterial(material){
  if(!material)return;
  const mats=Array.isArray(material)?material:[material];
  for(const m of mats){
    if(!m)continue;
    for(const key of ['map','alphaMap','aoMap','bumpMap','emissiveMap','envMap','lightMap','metalnessMap','normalMap','roughnessMap']){
      if(m[key]&&m[key].dispose)m[key].dispose();
    }
    if(m.dispose)m.dispose();
  }
}
function disposeObject3D(obj){
  if(!obj)return;
  obj.traverse?.(node=>{
    if(node.geometry&&node.geometry.dispose)node.geometry.dispose();
    disposeMaterial(node.material);
  });
}
function destroySceneObject(obj){
  if(!obj)return;
  scene.remove(obj);
  disposeObject3D(obj);
}
function clearGroupChildren(group){
  if(!group)return;
  for(const child of [...group.children]){
    group.remove(child);
    disposeObject3D(child);
  }
}

scene.background=SKY_COLOR.clone();
scene.fog=new THREE.Fog(FOG_COLOR.clone(),22,112);
const camera=new THREE.PerspectiveCamera(75,W/H,.05,220);camera.position.set(0,1.75,0);scene.add(camera);
function restoreVisualState(){
  if(!scene.background||!scene.background.isColor)scene.background=SKY_COLOR.clone();
  else scene.background.copy(SKY_COLOR);
  if(scene.fog&&scene.fog.color)scene.fog.color.copy(FOG_COLOR);
  renderer.setClearColor(SKY_COLOR,1);
  renderer.toneMappingExposure=.78;
}
function renderFrame(){restoreVisualState();renderer.render(scene,camera);}
window.addEventListener('resize',()=>{
  W=innerWidth;H=innerHeight;
  renderer.setSize(W,H,false);
  camera.aspect=W/H;
  camera.updateProjectionMatrix();
  updateOrientationState();
  refreshMobileHUD();
});

// ─── LIGHTS ─────────────────────────────
const sun=new THREE.DirectionalLight(0xd7e4ff,1.18);
sun.position.set(38,72,26);
sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-82;sun.shadow.camera.right=82;
sun.shadow.camera.top=82;sun.shadow.camera.bottom=-82;
sun.shadow.camera.near=2;sun.shadow.camera.far=170;
sun.shadow.bias=-0.00035;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0x7389a5,0x11151b,0.46));
scene.add(new THREE.AmbientLight(0x9fb3ca,0.08));

// ─── MATERIALS CACHE ────────────────────
const _matCache={};
function mat(c){
  if(!_matCache[c]){
    const darker=new THREE.Color(c).multiplyScalar(.58);
    _matCache[c]=new THREE.MeshStandardMaterial({color:darker,roughness:.82,metalness:.035,flatShading:true});
  }
  // Map objects receive independent materials so a hit flash cannot recolor the whole map.
  return _matCache[c].clone();
}
const BALLISTIC_MATERIAL_PROFILES=Object.freeze({
  wood:{resistance:.48,maxThickness:2.65,speedRetention:.82,damageRetention:.78},
  metal:{resistance:2.65,maxThickness:.72,speedRetention:.58,damageRetention:.55},
  concrete:{resistance:3.35,maxThickness:.46,speedRetention:.52,damageRetention:.48}
});
function mapImpactMaterial(obj){
  if(!obj)return'concrete';
  if(obj.userData?.impactMaterial)return obj.userData.impactMaterial;
  if((obj.material?.metalness||0)>=.38)return'metal';
  return'concrete';
}
function mapBallisticProfile(obj){
  const material=mapImpactMaterial(obj);
  return{material,...(BALLISTIC_MATERIAL_PROFILES[material]||BALLISTIC_MATERIAL_PROFILES.concrete)};
}
const _penInv=new THREE.Matrix4(),_penLocalPoint=new THREE.Vector3(),_penLocalAhead=new THREE.Vector3(),_penLocalDir=new THREE.Vector3(),_penExitLocal=new THREE.Vector3(),_penExitWorld=new THREE.Vector3();
function mapPenetrationInfo(obj,hitPoint,worldDir){
  if(!obj?.geometry||!hitPoint||!worldDir)return null;
  if(!obj.geometry.boundingBox)obj.geometry.computeBoundingBox();
  const box=obj.geometry.boundingBox;if(!box)return null;
  obj.updateMatrixWorld(true);
  _penInv.copy(obj.matrixWorld).invert();
  _penLocalPoint.copy(hitPoint).applyMatrix4(_penInv);
  _penLocalAhead.copy(hitPoint).add(worldDir).applyMatrix4(_penInv);
  _penLocalDir.subVectors(_penLocalAhead,_penLocalPoint);
  if(_penLocalDir.lengthSq()<1e-8)return null;
  _penLocalDir.normalize();
  let exitT=Infinity;
  for(const axis of ['x','y','z']){
    const d=_penLocalDir[axis];if(Math.abs(d)<1e-7)continue;
    const bound=d>0?box.max[axis]:box.min[axis];
    const t=(bound-_penLocalPoint[axis])/d;
    if(t>.0005&&t<exitT)exitT=t;
  }
  if(!Number.isFinite(exitT))return null;
  _penExitLocal.copy(_penLocalPoint).addScaledVector(_penLocalDir,exitT+.002);
  _penExitWorld.copy(_penExitLocal).applyMatrix4(obj.matrixWorld);
  const thickness=hitPoint.distanceTo(_penExitWorld);
  if(!Number.isFinite(thickness)||thickness<=.001||thickness>12)return null;
  return{...mapBallisticProfile(obj),thickness,exitPoint:_penExitWorld.clone()};
}

// ─── FLOOR ──────────────────────────────
(()=>{
  const floorMat=new THREE.MeshStandardMaterial({color:0x202833,roughness:.96,metalness:0,side:THREE.DoubleSide});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(220,220),floorMat);
  floor.rotation.x=-Math.PI/2;
  floor.position.y=-0.04;
  floor.receiveShadow=true;
  floor.frustumCulled=false;
  floor.renderOrder=-10;
  scene.add(floor);
})();

// ─── MAP ────────────────────────────────
const wallMeshes=[],losMeshes=[];
const minimapStaticGeometry=[];
// Store wall AABBs for collision
const wallAABBs=[];
function box(w,h,d,col,x,y,z,ry=0,impactMaterial='concrete'){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(col));
  m.userData.impactMaterial=impactMaterial;
  const minimapDescriptor={x,z,w,d,h,ry,impactMaterial,kind:'structure'};
  m.userData.minimap=minimapDescriptor;
  if(h>.45)minimapStaticGeometry.push(minimapDescriptor);
  m.position.set(x,y,z);m.rotation.y=ry;m.castShadow=!MOBILE_LOW;m.receiveShadow=!MOBILE_LOW;scene.add(m);
  if(h>0.5){
    wallMeshes.push(m);
    // Compute AABB for collision
    const bb=new THREE.Box3().setFromObject(m);
    wallAABBs.push(bb);
  }
  if(h>1.5&&w*d>2)losMeshes.push(m);
  return m;
}

function createProceduralHazardPanel(width,height){
  const g=new THREE.Group();
  const frameMat=new THREE.MeshStandardMaterial({color:0x151b20,roughness:.44,metalness:.72});
  const yellowMat=new THREE.MeshStandardMaterial({color:0xf0b526,roughness:.34,metalness:.38,emissive:0x5a3200,emissiveIntensity:.20});
  const darkMat=new THREE.MeshStandardMaterial({color:0x22282d,roughness:.50,metalness:.58});
  const back=new THREE.Mesh(new THREE.BoxGeometry(width,height,.045),frameMat);g.add(back);
  const stripeCount=7,stripeW=width/(stripeCount+1.3);
  for(let i=0;i<stripeCount;i++){
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(stripeW,height*.72,.025),i%2?darkMat:yellowMat);
    stripe.position.set((i-(stripeCount-1)/2)*stripeW*1.06,0,.036);
    stripe.rotation.z=-.34;g.add(stripe);
  }
  const center=new THREE.Mesh(new THREE.BoxGeometry(width*.27,height*.42,.030),yellowMat);
  center.position.z=.055;g.add(center);
  const cut=new THREE.Mesh(new THREE.BoxGeometry(width*.06,height*.22,.034),darkMat);
  cut.position.z=.074;g.add(cut);
  return g;
}
function decorateHazardWall(mesh,w,h,d){
  const count=Math.max(1,Math.min(4,Math.floor(Math.max(w,d)/7)));
  const span=Math.max(w,d);
  for(let i=0;i<count;i++){
    const offset=(i-(count-1)/2)*(span/(count+0.25));
    const panel=createProceduralHazardPanel(Math.min(4.8,span/(count+.2)),Math.min(1.05,h*.45));
    if(w>=d)panel.position.set(offset,0,d/2+.035);
    else{panel.rotation.y=Math.PI/2;panel.position.set(w/2+.035,0,offset);}
    mesh.add(panel);
  }
  return mesh;
}
function hazardWall(w,h,d,col,x,y,z,ry=0){
  const wall=decorateHazardWall(box(w,h,d,col,x,y,z,ry,'metal'),w,h,d);
  wall.userData.impactMaterial='metal';
  return wall;
}
function createSupplyCrate(x,z,h,variant=0){
  const body=box(2,h,2,variant%2?0x786448:0x6d5b43,x,h/2,z,0,'wood');
  body.userData.impactMaterial='wood';
  if(body.userData.minimap)body.userData.minimap.kind='crate';
  body.material=new THREE.MeshStandardMaterial({color:variant%2?0x6f5b42:0x61523f,roughness:.62,metalness:.20});
  const frameMat=new THREE.MeshStandardMaterial({color:0x202a31,roughness:.38,metalness:.72});
  const accentMat=new THREE.MeshStandardMaterial({color:0xd59a23,roughness:.35,metalness:.42,emissive:0x6c3b00,emissiveIntensity:.16});
  const add=(geo,mat,x1,y1,z1)=>{
    const m=new THREE.Mesh(geo,mat);m.position.set(x1,y1,z1);m.castShadow=!MOBILE_LOW;body.add(m);return m;
  };
  add(new THREE.BoxGeometry(1.92,.10,.10),frameMat,0,h/2-.08,1.01);
  add(new THREE.BoxGeometry(1.92,.10,.10),frameMat,0,-h/2+.08,1.01);
  add(new THREE.BoxGeometry(.10,Math.max(.35,h-.18),.10),frameMat,-.91,0,1.01);
  add(new THREE.BoxGeometry(.10,Math.max(.35,h-.18),.10),frameMat,.91,0,1.01);
  add(new THREE.BoxGeometry(1.30,.055,.08),accentMat,0,.18,1.055);
  const labelMat=new THREE.MeshStandardMaterial({color:0x182127,roughness:.36,metalness:.66,emissive:0x332100,emissiveIntensity:.12});
  const boltMat=new THREE.MeshStandardMaterial({color:0xd9b34e,roughness:.28,metalness:.72,emissive:0x5a3900,emissiveIntensity:.18});
  const label=add(new THREE.BoxGeometry(1.16,.50,.055),labelMat,0,-.10,1.055);
  for(const sx of [-.44,.44]){
    const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.03,8),boltMat);
    bolt.rotation.x=Math.PI/2;bolt.position.set(sx,.05,.045);label.add(bolt);
  }
  const stripe=add(new THREE.BoxGeometry(.72,.055,.065),accentMat,0,-.10,1.09);
  stripe.rotation.z=-.08;
  return body;
}
function createArenaTerminal(x,z,ry=0){
  const body=box(1.05,1.75,.68,0x34414b,x,.875,z,ry);
  if(body.userData.minimap)body.userData.minimap.kind='terminal';
  body.material=new THREE.MeshStandardMaterial({color:0x1c2730,roughness:.42,metalness:.64});
  const bezel=new THREE.Mesh(
    new THREE.BoxGeometry(.84,.78,.07),
    new THREE.MeshStandardMaterial({color:0x0b1117,roughness:.30,metalness:.78})
  );
  bezel.position.set(0,.23,.37);body.add(bezel);
  const screenMat=new THREE.MeshStandardMaterial({color:0x07131a,roughness:.18,metalness:.42,emissive:0x0a9fc4,emissiveIntensity:.68});
  const screen=new THREE.Mesh(new THREE.BoxGeometry(.70,.60,.035),screenMat);
  screen.position.set(0,.23,.411);body.add(screen);
  const glyphMat=new THREE.MeshBasicMaterial({color:0x7eeaff});
  for(const [gx,gy,gw] of [[-.12,.12,.27],[-.17,.01,.18],[-.04,-.10,.42],[.19,.12,.09]]){
    const glyph=new THREE.Mesh(new THREE.BoxGeometry(gw,.035,.012),glyphMat);
    glyph.position.set(gx,gy,.027);screen.add(glyph);
  }
  const railMat=new THREE.MeshStandardMaterial({color:0x23d5ff,roughness:.25,metalness:.42,emissive:0x0b8bb2,emissiveIntensity:.65});
  for(const sx of [-.47,.47]){
    const rail=new THREE.Mesh(new THREE.BoxGeometry(.035,1.40,.035),railMat);
    rail.position.set(sx,0,.36);body.add(rail);
  }
  if(VISUAL_LIGHTS){
    const glow=new THREE.PointLight(0x39d8ff,.65,4.5);
    glow.position.set(0,.28,.65);body.add(glow);
  }
  return body;
}
function createArenaCover(x,z,ry=0,variant=0){
  const type=((variant%3)+3)%3;
  const dims=type===0?[4.8,1.55,.72]:type===1?[4.2,1.25,1.05]:[3.6,1.65,1.35];
  const impact=type===2?'wood':'metal';
  const paletteIndex=Math.abs(Math.round(x*3+z*5))%3;
  const palettes=[
    [0x40505e,0x4a5d6a,0x374650],
    [0x535d64,0x665e4b,0x465b60],
    [0x66523d,0x735a40,0x5b4937]
  ];
  const baseColor=palettes[type][paletteIndex];
  const body=box(dims[0],dims[1],dims[2],baseColor,x,dims[1]/2,z,ry,impact);
  if(body.userData.minimap){body.userData.minimap.kind='cover';body.userData.minimap.variant=type;}
  body.userData.coverType=type===0?'aegis':type===1?'barrier':'cargo';
  body.userData.coverPalette=paletteIndex;
  body.material=new THREE.MeshStandardMaterial({color:baseColor,roughness:type===2?.68:.34,metalness:type===2?.18:.72,emissive:type===0?0x062c3b:type===1?0x241a04:0x120b04,emissiveIntensity:.10});
  const dark=new THREE.MeshStandardMaterial({color:0x111922,roughness:.40,metalness:.78});
  const metal=new THREE.MeshStandardMaterial({color:paletteIndex===1?0xa38f72:0x8b9aa8,roughness:.30,metalness:.82});
  const accentColor=type===1?(paletteIndex===1?0xffd15b:0xffb329):(paletteIndex===2?0x66f0b8:0x36d9ff);
  const glow=new THREE.MeshStandardMaterial({color:accentColor,roughness:.22,metalness:.36,emissive:accentColor,emissiveIntensity:.58});
  const wood=new THREE.MeshStandardMaterial({color:paletteIndex===1?0xa67a4b:0x9a7449,roughness:.72,metalness:.08});
  const bolt=new THREE.MeshStandardMaterial({color:0xb9c5cf,roughness:.24,metalness:.90});
  const add=(geo,mat,x1,y1,z1,rx=0,ry1=0,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x1,y1,z1);m.rotation.set(rx,ry1,rz);m.castShadow=!MOBILE_LOW;m.receiveShadow=!MOBILE_LOW;body.add(m);return m;};
  if(type===0){
    add(new THREE.BoxGeometry(3.55,.15,.86),metal,0,.72,0);
    add(new THREE.BoxGeometry(.92,1.34,.20),dark,-2.15,.02,.25,0,-.28,.06);
    add(new THREE.BoxGeometry(.92,1.34,.20),dark,2.15,.02,.25,0,.28,-.06);
    add(new THREE.BoxGeometry(2.35,.065,.10),glow,0,.24,.42);
    add(new THREE.BoxGeometry(.10,1.02,.11),glow,-1.68,.02,.42);
    add(new THREE.BoxGeometry(.10,1.02,.11),glow,1.68,.02,.42);
    for(const sx of [-1.95,1.95])for(const sy of [-.42,.42]){
      const fastener=add(new THREE.CylinderGeometry(.035,.035,.025,8),bolt,sx,sy,.39,Math.PI/2);
      fastener.rotation.z=Math.PI/2;
    }
  }else if(type===1){
    add(new THREE.BoxGeometry(4.35,.12,1.10),metal,0,.56,0);
    for(const sx of [-1.55,0,1.55])add(new THREE.BoxGeometry(.11,1.08,1.13),dark,sx,0,0);
    add(new THREE.BoxGeometry(3.20,.055,.09),glow,0,.18,.57);
    add(new THREE.BoxGeometry(1.15,.18,1.20),dark,-1.47,-.48,0,0,0,.05);
    add(new THREE.BoxGeometry(1.15,.18,1.20),dark,1.47,-.48,0,0,0,-.05);
    for(const sx of [-1.05,1.05]){
      add(new THREE.BoxGeometry(.52,.06,.10),metal,sx,-.22,.575,0,0,sx<0?-.18:.18);
    }
  }else{
    add(new THREE.BoxGeometry(3.35,.15,1.28),dark,0,.72,0);
    for(const sy of [-.38,.08,.52])add(new THREE.BoxGeometry(3.00,.08,1.40),wood,0,sy,0);
    for(const sx of [-1.48,1.48])add(new THREE.BoxGeometry(.12,1.35,1.42),metal,sx,0,0);
    add(new THREE.BoxGeometry(2.10,.05,.08),glow,0,.23,.715);
    for(const sx of [-1.05,1.05])for(const sy of [-.42,.42]){
      add(new THREE.BoxGeometry(.11,.11,.055),bolt,sx,sy,.72);
    }
  }
  return body;
}
const ARENA_COVER_LAYOUT=[
  [-27,-18,.22,0],[27,18,-2.92,0],[-18,27,-1.22,1],[18,-27,1.92,1],
  [-48,34,.62,2],[48,-34,-2.52,2],[-34,-48,.18,0],[34,48,-2.96,0],
  [-58,44,1.02,1],[58,-44,-2.14,1]
];
ARENA_COVER_LAYOUT.forEach(([x,z,ry,variant])=>createArenaCover(x,z,ry,variant));
[[-50,4,-50],[50,4,-50],[-50,4,50],[50,4,50]].forEach(([x,y,z])=>{box(14,8,12,0x607088,x,y,z);box(8,5,8,0x708098,x+12,2.5,z+8);});
hazardWall(.6,3,30,0x778088,-20,1.5,0);hazardWall(.6,3,30,0x778088,20,1.5,0);
hazardWall(30,3,.6,0x778088,0,1.5,-20);hazardWall(30,3,.6,0x778088,0,1.5,20);
[[0,2,0],[0,2,-8],[0,2,8],[-8,2,0],[8,2,0]].forEach(([x,y,z])=>box(2.5,4,2.5,0x8a8898,x,y,z));
function crates(cx,cz){[[0,0,1.5],[2.5,0,1.2],[0,2.5,1.8],[2.5,2.5,1.4],[1.2,1.2,1.6]].forEach(([dx,dz,h],i)=>createSupplyCrate(cx+dx,cz+dz,h,i));}
[[-15,-15],[15,-15],[-15,15],[15,15],[-35,5],[35,-5],[-5,-35],[5,35],[-40,-20],[40,20],[-20,40],[20,-40]].forEach(([x,z])=>crates(x,z));
[[-35,2,10,Math.PI/2],[35,2,-10,Math.PI/2],[-10,2,-35,0],[10,2,35,0],[-60,2,0,Math.PI/2],[60,2,0,Math.PI/2],[0,2,-60,0],[0,2,60,0]].forEach(([x,y,z,r])=>hazardWall(.8,4,25,0x808898,x,y,z,r));
[[-45,20],[45,-20],[-20,45],[20,-45],[0,-30],[0,30],[-30,0],[30,0]].forEach(([x,z])=>box(.5,2.5,10,0x6a7860,x,1.25,z));
[[-30,-45],[30,45],[-45,30],[45,-30],[-55,-20],[55,20],[-20,-55],[20,55]].forEach(([x,z])=>box(3,5,3,0x607078,x,2.5,z));
[[-8,-6],[8,6],[-6,8],[6,-8],[-25,12],[25,-12],[12,25],[-12,-25]].forEach(([x,z])=>{
  const r=Math.random()*Math.PI;for(let i=-1;i<=1;i++){box(1.4,.9,1.4,0x9a9068,x+Math.cos(r+Math.PI/2)*i*1.6,.45,z+Math.sin(r+Math.PI/2)*i*1.6);}
});
const TREE_POS=[[-80,0],[80,0],[0,-80],[0,80],[-60,-60],[60,60],[-60,60],[60,-60],[-80,40],[80,-40],[-40,80],[40,-80],[-80,-40],[80,40],[-40,-80],[40,80],[-70,70],[-70,-70],[70,-70],[70,70]];
const arenaFoliage=[];
function createArenaTree(x,z,variant=0){
  // Preserve the old trunk collision/LOS volume; the cylinder below is visual only.
  const trunkCollision=box(.35,3.5,.35,0x3a281c,x,1.75,z);
  if(trunkCollision.userData.minimap)trunkCollision.userData.minimap.kind='tree';
  const g=new THREE.Group();
  g.position.set(x,0,z);

  const trunkMat=new THREE.MeshStandardMaterial({color:variant%2?0x50331f:0x69442a,roughness:.92,metalness:.02});
  const barkDark=new THREE.MeshStandardMaterial({color:0x2d2119,roughness:.96,metalness:.01});
  const leafMat=new THREE.MeshStandardMaterial({
    color:variant%3===0?0x2c9b52:(variant%3===1?0x3caf63:0x267d48),
    roughness:.84,metalness:.02
  });
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.34,3.8,8),trunkMat);
  trunk.position.y=1.9;trunk.castShadow=!MOBILE_LOW;g.add(trunk);

  for(let i=0;i<3;i++){
    const a=variant*.9+i*Math.PI*2/3;
    const branch=new THREE.Mesh(new THREE.CylinderGeometry(.055,.105,1.65,6),barkDark);
    branch.position.set(Math.cos(a)*.32,3.25+i*.14,Math.sin(a)*.32);
    branch.rotation.z=Math.cos(a)*.72;
    branch.rotation.x=Math.sin(a)*.52;
    branch.castShadow=!MOBILE_LOW;g.add(branch);
  }

  const crownCount=MOBILE_LOW?2:4;
  for(let i=0;i<crownCount;i++){
    const a=i*Math.PI*2/crownCount+variant*.55;
    const leaf=new THREE.Mesh(
      new THREE.IcosahedronGeometry(i===0?1.55:1.20,MOBILE_LOW?0:1),
      leafMat
    );
    leaf.position.set(i===0?0:Math.cos(a)*.84,4.65+(i===0?.18:(i%2)*.40),i===0?0:Math.sin(a)*.84);
    leaf.scale.set(1,1.18,1);
    leaf.castShadow=!MOBILE_LOW;g.add(leaf);
  }

  scene.add(g);arenaFoliage.push(g);
}
(TREE_POS.slice(0,MOBILE_LOW?6:TREE_POS.length)).forEach(([x,z],i)=>createArenaTree(x,z,i));
[[-27,-12,.28],[27,12,-2.86],[-12,27,1.85],[12,-27,-1.30]].forEach(([x,z,r])=>createArenaTerminal(x,z,r));

const poolMat=new THREE.MeshStandardMaterial({
  color:0x0b6682,transparent:true,opacity:MOBILE_LOW?.86:.70,
  roughness:.22,metalness:.10,emissive:0x073b50,emissiveIntensity:.34,side:THREE.DoubleSide
});
const pool=new THREE.Mesh(new THREE.PlaneGeometry(16,10),poolMat);
pool.rotation.x=-Math.PI/2;pool.position.set(-60,.055,15);scene.add(pool);
const poolGlow=new THREE.Mesh(
  new THREE.RingGeometry(5.2,5.42,48),
  new THREE.MeshBasicMaterial({color:0x36dcff,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide})
);
poolGlow.scale.x=1.55;poolGlow.rotation.x=-Math.PI/2;poolGlow.position.set(-60,.07,15);scene.add(poolGlow);
let environmentTime=0;
function tickEnvironment(dt){
  environmentTime+=dt;
  poolMat.opacity=(MOBILE_LOW?.86:.70)+Math.sin(environmentTime*1.15)*.025;
  poolMat.emissiveIntensity=.30+Math.sin(environmentTime*.85)*.045;
  poolGlow.material.opacity=.17+Math.sin(environmentTime*1.8)*.055;
  poolGlow.rotation.z=environmentTime*.035;
  if(!MOBILE_LOW){
    for(let i=0;i<arenaFoliage.length;i++){
      const g=arenaFoliage[i];
      g.rotation.z=Math.sin(environmentTime*.65+i*.77)*.006;
      g.rotation.x=Math.cos(environmentTime*.50+i*.49)*.004;
    }
  }
}

// ─── WALL COLLISION ─────────────────────
const PLR_R=0.35; // player collision radius
const BOT_R=0.4;  // bot collision radius

function collideWalls(x,z,r){
  let cx=x,cz=z;
  for(const bb of wallAABBs){
    // Expand AABB by radius
    const minX=bb.min.x-r, maxX=bb.max.x+r;
    const minZ=bb.min.z-r, maxZ=bb.max.z+r;
    if(cx>minX&&cx<maxX&&cz>minZ&&cz<maxZ){
      // Find shortest push-out
      const dLeft=cx-minX, dRight=maxX-cx, dBack=cz-minZ, dFront=maxZ-cz;
      const m=Math.min(dLeft,dRight,dBack,dFront);
      if(m===dLeft) cx=minX;
      else if(m===dRight) cx=maxX;
      else if(m===dBack) cz=minZ;
      else cz=maxZ;
    }
  }
  return{x:cx,z:cz};
}

// ─── WALL RAYCASTER ────
const _rc=new THREE.Raycaster();
const _rcDir=new THREE.Vector3();
const _rcHits=[];
const _rcWallHits=[];
function wallBetween(from,to,list){
  _rcDir.subVectors(to,from);
  const dist=_rcDir.length();if(dist<0.15)return false;
  _rcDir.multiplyScalar(1/dist);
  _rc.ray.origin.copy(from);_rc.ray.direction.copy(_rcDir);_rc.near=0;_rc.far=dist-0.15;
  _rcHits.length=0;
  _rc.intersectObjects(list,false,_rcHits);
  const blocked=_rcHits.length>0;
  _rcHits.length=0;
  return blocked;
}

// ─── PARTICLE POOL ──────────────────────
const P_MAX=64;
const _pm=[],_pp=[];
let _pHead=0,_pCount=0;
const _pGeo=new THREE.SphereGeometry(.09,4,3);
const _basePMat=new THREE.MeshBasicMaterial({color:0xff4400,transparent:true,opacity:1});
for(let i=0;i<P_MAX;i++){
  const m=new THREE.Mesh(_pGeo,_basePMat.clone());m.visible=false;scene.add(m);_pm.push(m);
  _pp.push({vx:0,vy:0,vz:0,life:0,maxLife:1,col:0xff4400});
}
function _spawnP(x,y,z,col,vx,vy,vz,life){
  const idx=(_pHead+_pCount)%P_MAX;
  if(_pCount<P_MAX)_pCount++;else _pHead=(_pHead+1)%P_MAX;
  const d=_pp[idx];d.vx=vx;d.vy=vy;d.vz=vz;d.life=life;d.maxLife=life;d.col=col;
  const m=_pm[idx];m.position.set(x,y,z);m.material.color.setHex(col);m.material.opacity=1;m.visible=true;
}
function spawnP(pos,col,vs=1){
  const l=.45+Math.random()*.3;
  _spawnP(pos.x,pos.y,pos.z,col,(Math.random()-.5)*7*vs,Math.random()*5*vs+.5,(Math.random()-.5)*7*vs,l);
}
function spawnSmoke(pos,col){
  _spawnP(pos.x,pos.y,pos.z,col,(Math.random()-.5)*.5,1.2+Math.random()*.6,(Math.random()-.5)*.5,.35);
}
function spawnSpark(pos,col){
  const spd=4+Math.random()*5,ang=Math.random()*Math.PI*2;
  _spawnP(pos.x,pos.y,pos.z,col,Math.cos(ang)*spd,1.5+Math.random()*2,Math.sin(ang)*spd,.16+Math.random()*.1);
}
function tickParticles(dt){
  let hi=_pHead;
  for(let n=0;n<_pCount;n++){
    const idx=(hi+n)%P_MAX,d=_pp[idx],m=_pm[idx];
    d.life-=dt;
    if(d.life<=0){m.visible=false;}
    else{d.vy-=12*dt;m.position.x+=d.vx*dt;m.position.y+=d.vy*dt;m.position.z+=d.vz*dt;
      m.material.opacity=d.life/d.maxLife;}
  }
  while(_pCount>0&&_pp[_pHead].life<=0){_pHead=(_pHead+1)%P_MAX;_pCount--;}
}

const _eLights=[];
function makeProceduralBurst(color,size=1,spokes=8,coreColor=0xffffff){
  const g=new THREE.Group();
  const rayMat=new THREE.MeshBasicMaterial({
    color,transparent:true,opacity:.88,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending
  });
  const coreMat=new THREE.MeshBasicMaterial({
    color:coreColor,transparent:true,opacity:.96,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending
  });
  const haloMat=new THREE.MeshBasicMaterial({
    color,transparent:true,opacity:.62,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending
  });
  const core=new THREE.Mesh(new THREE.SphereGeometry(.11*size,8,6),coreMat);
  g.add(core);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.20*size,.018*size,5,24),haloMat);
  g.add(halo);
  const len=.34*size;
  for(let i=0;i<spokes;i++){
    const a=i*Math.PI*2/spokes;
    const ray=new THREE.Mesh(new THREE.BoxGeometry(.030*size,len,.018*size),rayMat);
    ray.position.set(Math.sin(a)*len*.78,Math.cos(a)*len*.78,0);
    ray.rotation.z=-a;
    g.add(ray);
  }
  g.userData.fxMaterials=[rayMat,coreMat,haloMat];
  g.userData.baseSize=size;
  return g;
}
function setProceduralFxOpacity(group,opacity){
  if(!group)return;
  const mats=group.userData?.fxMaterials||[];
  for(let i=0;i<mats.length;i++)mats[i].opacity=Math.max(0,opacity*(i===1?1:i===2?.72:.90));
}
const explosionFx=[];
function spawnExplosionFx(pos,col,r=3){
  const burst=makeProceduralBurst(col,Math.min(1.65,.72+r*.10),10,0xfff4b5);
  burst.position.copy(pos);burst.position.y+=.30;burst.lookAt(camera.position);burst.renderOrder=25;scene.add(burst);
  const ring=new THREE.Mesh(
    new THREE.RingGeometry(.18,.30,36),
    new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.86,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending})
  );
  ring.position.copy(pos);ring.position.y+=.08;ring.rotation.x=Math.PI/2;scene.add(ring);
  explosionFx.push({burst,ring,t:0,dur:.42+Math.min(.30,r*.025),radius:Math.min(5.5,1.3+r*.28)});
}
function tickExplosionFx(dt){
  for(let i=explosionFx.length-1;i>=0;i--){
    const fx=explosionFx[i];fx.t+=dt;
    const p=Math.min(1,fx.t/fx.dur),ease=1-Math.pow(1-p,3);
    fx.ring.scale.setScalar(.5+ease*fx.radius);
    fx.ring.material.opacity=(1-p)*.86;
    fx.burst.lookAt(camera.position);
    setProceduralFxOpacity(fx.burst,1-p);
    const pulse=.70+Math.sin(Math.min(1,p)*Math.PI)*.82;
    fx.burst.scale.setScalar(pulse);
    fx.burst.rotation.z+=dt*2.8;
    if(p>=1){
      destroySceneObject(fx.ring);destroySceneObject(fx.burst);explosionFx.splice(i,1);
    }
  }
}
function explode(pos,col,r=3){
  const n=Math.min(6+Math.floor(r*1.2),MOBILE_LOW?6:11);
  for(let i=0;i<n;i++)spawnP(pos,col,1.18);
  for(let i=0;i<(MOBILE_LOW?1:2);i++)spawnSmoke(pos,0x664433);
  for(let i=0;i<(MOBILE_LOW?2:5);i++)spawnSpark(pos,col);
  spawnExplosionFx(pos,col,r);
  if(!VISUAL_LIGHTS)return;
  let fl=_eLights.find(l=>!l._act);
  if(!fl){fl=new THREE.PointLight(0xff4400,0,10);fl._act=false;scene.add(fl);_eLights.push(fl);}
  fl.color.setHex(col);fl.intensity=5.5;fl.distance=r*2.4;fl.position.copy(pos);fl._act=true;fl.visible=true;fl._t=0.12;
}

const headshotFx=[];
function spawnHeadshotFx(pos,lethal=false){
  const center=pos.clone();
  const gold=lethal?0xffc52f:0xff6840;
  const ring=new THREE.Mesh(
    new THREE.RingGeometry(.16,lethal?.42:.29,36),
    new THREE.MeshBasicMaterial({
      color:gold,transparent:true,opacity:1,depthWrite:false,
      side:THREE.DoubleSide,blending:THREE.AdditiveBlending
    })
  );
  ring.position.copy(center);ring.lookAt(camera.position);ring.renderOrder=26;scene.add(ring);

  const marker=makeProceduralBurst(gold,lethal?1.34:.82,lethal?10:8,lethal?0xfff3b2:0xffffff);
  marker.position.copy(center);marker.position.y+=lethal?.78:.48;marker.lookAt(camera.position);marker.renderOrder=28;scene.add(marker);

  let shell=null,beam=null,light=null;
  if(lethal){
    shell=new THREE.Mesh(
      new THREE.SphereGeometry(.38,16,10),
      new THREE.MeshBasicMaterial({
        color:0xff5b24,transparent:true,opacity:.34,wireframe:true,
        depthWrite:false,blending:THREE.AdditiveBlending
      })
    );
    shell.position.copy(center);scene.add(shell);

    beam=new THREE.Mesh(
      new THREE.CylinderGeometry(.035,.13,3.4,10,1,true),
      new THREE.MeshBasicMaterial({
        color:0xffd34a,transparent:true,opacity:.68,depthWrite:false,
        side:THREE.DoubleSide,blending:THREE.AdditiveBlending
      })
    );
    beam.position.copy(center);beam.position.y+=1.55;scene.add(beam);

    for(let i=0;i<(MOBILE_LOW?10:22);i++){
      const c=i%4===0?0xffffff:(i%3===0?0xff3c24:0xffcf38);
      spawnP(center,c,1.5+Math.random()*.65);
    }
    for(let i=0;i<(MOBILE_LOW?5:12);i++)spawnSpark(center,i%3===0?0xffffff:0xffb128);

    if(VISUAL_LIGHTS){
      light=new THREE.PointLight(0xff7b28,7.2,10);
      light.position.copy(center);scene.add(light);
    }
  }else{
    for(let i=0;i<(MOBILE_LOW?3:7);i++)spawnSpark(center,i%2?0xffb52e:0xff5331);
  }

  headshotFx.push({ring,marker,shell,beam,light,t:0,dur:lethal?.92:.46,lethal});
}
function tickHeadshotFx(dt){
  for(let i=headshotFx.length-1;i>=0;i--){
    const fx=headshotFx[i];fx.t+=dt;
    const p=Math.min(1,fx.t/fx.dur);
    const ease=1-Math.pow(1-p,3);
    fx.ring.lookAt(camera.position);
    fx.ring.scale.setScalar(.55+ease*(fx.lethal?4.2:2.0));
    fx.ring.material.opacity=(1-p)*(fx.lethal?.95:.76);
    fx.marker.lookAt(camera.position);
    setProceduralFxOpacity(fx.marker,Math.max(0,1-p*.88));
    const ss=fx.lethal?(1+Math.sin(Math.min(1,p)*Math.PI)*.34):(1+Math.sin(p*Math.PI)*.16);
    fx.marker.scale.setScalar(ss);
    fx.marker.rotation.z+=dt*(fx.lethal?3.1:2.2);
    fx.marker.position.y+=dt*(fx.lethal?.62:.28);
    if(fx.shell){
      fx.shell.scale.setScalar(1+ease*3.2);
      fx.shell.material.opacity=(1-p)*.34;
    }
    if(fx.beam){
      fx.beam.scale.x=fx.beam.scale.z=1+ease*.45;
      fx.beam.material.opacity=(1-p)*.68;
    }
    if(fx.light)fx.light.intensity=Math.max(0,7.2*(1-p));
    if(p>=1){
      destroySceneObject(fx.ring);destroySceneObject(fx.marker);
      if(fx.shell)destroySceneObject(fx.shell);
      if(fx.beam)destroySceneObject(fx.beam);
      if(fx.light){scene.remove(fx.light);fx.light.dispose?.();}
      headshotFx.splice(i,1);
    }
  }
}


const combatImpactFx=[];
function spawnCombatImpact(pos,type='bullet'){
  const size=type==='rocket'?1.18:type==='sniper'?1.02:type==='plasma'?.84:type==='critical'?.90:type==='wall'?.56:.62;
  const col=type==='sniper'?0xa7efff:type==='plasma'?0xc76cff:type==='critical'?0xffe34f:type==='rocket'?0xff6930:type==='wall'?0xdce6eb:0xffb650;
  const burst=makeProceduralBurst(col,size,type==='rocket'?10:type==='sniper'?8:6,type==='wall'?0xf5fbff:0xffffff);
  burst.position.copy(pos);burst.lookAt(camera.position);burst.renderOrder=24;scene.add(burst);
  const ring=new THREE.Mesh(
    new THREE.RingGeometry(.08,.14,28),
    new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.74,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending})
  );
  ring.position.copy(pos);ring.lookAt(camera.position);scene.add(ring);
  combatImpactFx.push({burst,ring,t:0,dur:type==='rocket'?.52:type==='sniper'?.34:.28,max:type==='rocket'?2.8:type==='sniper'?2.15:type==='plasma'?1.8:1.35});
}
function tickCombatImpactFx(dt){
  for(let i=combatImpactFx.length-1;i>=0;i--){
    const fx=combatImpactFx[i];fx.t+=dt;
    const p=Math.min(1,fx.t/fx.dur),ease=1-Math.pow(1-p,3);
    fx.ring.lookAt(camera.position);fx.ring.scale.setScalar(.7+ease*fx.max);
    fx.ring.material.opacity=(1-p)*.74;
    fx.burst.lookAt(camera.position);
    setProceduralFxOpacity(fx.burst,Math.max(0,1-p*1.12));
    fx.burst.scale.setScalar(1+Math.sin(p*Math.PI)*.42);
    fx.burst.rotation.z+=dt*2.4;
    if(p>=1){destroySceneObject(fx.ring);destroySceneObject(fx.burst);combatImpactFx.splice(i,1);}
  }
}

const bombBlastWaves=[];
function spawnBombBlastWave(pos,radius,ownerType='player'){
  const col=ownerType==='player'?0xffc128:0xff3b18;
  const ring=new THREE.Mesh(
    new THREE.TorusGeometry(1,.065,8,64),
    new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.95,depthWrite:false,side:THREE.DoubleSide})
  );
  ring.rotation.x=Math.PI/2;ring.position.copy(pos);ring.position.y=.16;ring.scale.setScalar(.45);scene.add(ring);
  const shell=new THREE.Mesh(
    new THREE.SphereGeometry(1,18,12),
    new THREE.MeshBasicMaterial({color:0xffe070,transparent:true,opacity:.30,wireframe:true,depthWrite:false})
  );
  shell.position.copy(pos);shell.position.y+=.45;shell.scale.setScalar(.35);scene.add(shell);
  const core=new THREE.Mesh(
    new THREE.SphereGeometry(1,14,10),
    new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.82,depthWrite:false})
  );
  core.position.copy(pos);core.position.y+=.40;core.scale.setScalar(.25);scene.add(core);
  bombBlastWaves.push({ring,shell,core,t:0,dur:1.35,radius});
  for(let i=0;i<(MOBILE_LOW?12:28);i++)spawnP(pos,i%3===0?0xffffff:(i%2?0xffb000:0xff4b1f),2.4+Math.random()*1.5);
  for(let i=0;i<(MOBILE_LOW?3:8);i++)spawnSmoke(pos,0x51443b);
}
function tickBombBlastWaves(dt){
  for(let i=bombBlastWaves.length-1;i>=0;i--){
    const w=bombBlastWaves[i];w.t+=dt;
    const p=Math.min(1,w.t/w.dur);
    const eased=1-Math.pow(1-p,3);
    const radius=Math.max(.4,w.radius*eased);
    w.ring.scale.setScalar(radius);
    w.shell.scale.setScalar(radius*.72);
    w.core.scale.setScalar(Math.max(.2,w.radius*(.12+p*.18)));
    w.ring.material.opacity=(1-p)*.95;
    w.shell.material.opacity=(1-p)*.30;
    w.core.material.opacity=Math.max(0,(1-p*1.35))*.82;
    if(p>=1){destroySceneObject(w.ring);destroySceneObject(w.shell);destroySceneObject(w.core);bombBlastWaves.splice(i,1);}
  }
}
const IMPACT_MARK_MAX=56;
const impactMarks=[],impactMarkPool=[];
const _impactMarkGeo=new THREE.CircleGeometry(.058,10);
const _impactForward=new THREE.Vector3(0,0,1),_impactNormal=new THREE.Vector3();
function acquireImpactMark(){
  const m=impactMarkPool.pop()||new THREE.Mesh(
    _impactMarkGeo,
    new THREE.MeshBasicMaterial({color:0x151719,transparent:true,opacity:.82,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})
  );
  if(!m.parent)scene.add(m);
  m.visible=true;m.material.opacity=.82;return m;
}
function releaseImpactMark(m){
  if(!m)return;m.visible=false;
  if(impactMarkPool.length<IMPACT_MARK_MAX)impactMarkPool.push(m);
  else{scene.remove(m);m.material.dispose();}
}
function wallImpact(pos,col,material='concrete',normal=null){
  const metal=material==='metal',wood=material==='wood';
  const sparkCount=metal?7:wood?1:3;
  const sparkCol=metal?0xfff1b8:wood?0xd8a064:col;
  for(let i=0;i<sparkCount;i++)spawnSpark(pos,sparkCol);
  for(let i=0;i<(metal?1:wood?2:3);i++)spawnSmoke(pos,wood?0x6e513b:metal?0x555c62:0x6b6259);
  if(wood&&!PERF_MODE)for(let i=0;i<2;i++)spawnP(pos,0xb27b45,.34);
  if(impactMarks.length>=IMPACT_MARK_MAX){
    const old=impactMarks.shift();releaseImpactMark(old.m);
  }
  const mark=acquireImpactMark();
  mark.scale.setScalar(metal?.72:wood?1.15:1);
  mark.material.color.setHex(wood?0x3f2819:metal?0x293039:0x151719);
  if(normal&&normal.lengthSq()>.001)_impactNormal.copy(normal).normalize();
  else _impactNormal.copy(camera.position).sub(pos).normalize();
  mark.quaternion.setFromUnitVectors(_impactForward,_impactNormal);
  mark.position.copy(pos).addScaledVector(_impactNormal,.012);
  impactMarks.push({m:mark,life:material==='metal'?7:9});
}
function tickImpactMarks(dt){
  for(let i=impactMarks.length-1;i>=0;i--){
    const d=impactMarks[i];d.life-=dt;
    if(d.life<1)d.m.material.opacity=Math.max(0,d.life)*.82;
    if(d.life<=0){releaseImpactMark(d.m);impactMarks.splice(i,1);}
  }
}
function tickExpLights(dt){for(const l of _eLights){if(!l._act)continue;l._t-=dt;l.intensity=Math.max(0,l.intensity-dt*50);if(l._t<=0){l._act=false;l.visible=false;}}}

const _gibs=[];
function tickGibs(dt){
  for(let i=_gibs.length-1;i>=0;i--){
    const g=_gibs[i];g.life-=dt;g.vy-=14*dt;
    g.m.position.x+=g.vx*dt;g.m.position.y+=g.vy*dt;g.m.position.z+=g.vz*dt;
    if(g.m.position.y<.08){g.m.position.y=.08;g.vy*=-.3;g.vx*=.7;g.vz*=.7;}
    g.m.rotation.x+=g.rx*dt;g.m.rotation.y+=g.ry*dt;
    g.m.material.opacity=Math.max(0,g.life/2.5);
    if(g.life<=0){destroySceneObject(g.m);_gibs.splice(i,1);}
  }
}

const _mzLights=[];
const casings=[];
const _casingGeo=new THREE.CylinderGeometry(.022,.022,.10,7);
const _casingBrassMat=new THREE.MeshStandardMaterial({color:0xc99a42,roughness:.34,metalness:.72});
const _casingShellMat=new THREE.MeshStandardMaterial({color:0xb12a21,roughness:.38,metalness:.42});
function getMzLight(){let l=_mzLights.find(x=>!x._act);if(!l){l=new THREE.PointLight(0xffb347,0,7);l._act=false;scene.add(l);_mzLights.push(l);}return l;}
function trigMuzzle(pos,col,power=1){
  if(VISUAL_LIGHTS){
    const l=getMzLight();
    l.position.copy(pos);
    l.color.setHex(0xffb25a);
    l.intensity=4.2*power;
    l.distance=5.5+power*1.5;
    l._act=true;l.visible=true;l._t=.055;
  }
  for(let i=0;i<Math.max(2,Math.round(3*power));i++){
    const off=pos.clone().addScaledVector(new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5),.12);
    spawnP(off,Math.random()<.72?0xffd27a:0xff8a32,.58+power*.15);
  }
  if(Math.random()<.78)spawnSmoke(pos,0x81766b);
  spawnSpark(pos,col||0xffb347);
}
function ejectCasing(pos,orientation,isShotgun=false){
  if(casings.length>18){
    const old=casings.shift();scene.remove(old.m);
  }
  const m=new THREE.Mesh(_casingGeo,isShotgun?_casingShellMat:_casingBrassMat);
  m.scale.set(isShotgun?1.35:1,isShotgun?1.45:1,isShotgun?1.35:1);
  m.position.copy(pos);
  m.quaternion.copy(orientation);
  m.rotation.z+=Math.PI/2;
  scene.add(m);
  const right=new THREE.Vector3(1,0,0).applyQuaternion(orientation);
  const up=new THREE.Vector3(0,1,0).applyQuaternion(orientation);
  const back=new THREE.Vector3(0,0,1).applyQuaternion(orientation);
  const v=right.multiplyScalar(1.8+Math.random()*1.5)
    .addScaledVector(up,1.6+Math.random()*1.6)
    .addScaledVector(back,(Math.random()-.5)*.8);
  casings.push({m,vx:v.x,vy:v.y,vz:v.z,rx:7+Math.random()*8,ry:5+Math.random()*9,life:2.1});
}
function tickCasings(dt){
  for(let i=casings.length-1;i>=0;i--){
    const c=casings[i];c.life-=dt;c.vy-=9.8*dt;
    c.m.position.x+=c.vx*dt;c.m.position.y+=c.vy*dt;c.m.position.z+=c.vz*dt;
    c.m.rotation.x+=c.rx*dt;c.m.rotation.y+=c.ry*dt;
    if(c.m.position.y<.05){c.m.position.y=.05;c.vy=Math.abs(c.vy)*.22;c.vx*=.68;c.vz*=.68;}
    if(c.life<=0){scene.remove(c.m);casings.splice(i,1);}
  }
}
function tickMzLights(dt){for(const l of _mzLights){if(!l._act)continue;l._t-=dt;l.intensity=Math.max(0,l.intensity-dt*90);if(l._t<=0){l._act=false;l.visible=false;}}}
