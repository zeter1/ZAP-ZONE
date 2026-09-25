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
// Store wall AABBs for collision
const wallAABBs=[];
function box(w,h,d,col,x,y,z,ry=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(col));
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
[[-50,4,-50],[50,4,-50],[-50,4,50],[50,4,50]].forEach(([x,y,z])=>{box(14,8,12,0x607088,x,y,z);box(8,5,8,0x708098,x+12,2.5,z+8);});
box(.6,3,30,0x778088,-20,1.5,0);box(.6,3,30,0x778088,20,1.5,0);
box(30,3,.6,0x778088,0,1.5,-20);box(30,3,.6,0x778088,0,1.5,20);
[[0,2,0],[0,2,-8],[0,2,8],[-8,2,0],[8,2,0]].forEach(([x,y,z])=>box(2.5,4,2.5,0x8a8898,x,y,z));
function crates(cx,cz){[[0,0,1.5],[2.5,0,1.2],[0,2.5,1.8],[2.5,2.5,1.4],[1.2,1.2,1.6]].forEach(([dx,dz,h])=>box(2,h,2,0x9a8060,cx+dx,h/2,cz+dz));}
[[-15,-15],[15,-15],[-15,15],[15,15],[-35,5],[35,-5],[-5,-35],[5,35],[-40,-20],[40,20],[-20,40],[20,-40]].forEach(([x,z])=>crates(x,z));
[[-35,2,10,Math.PI/2],[35,2,-10,Math.PI/2],[-10,2,-35,0],[10,2,35,0],[-60,2,0,Math.PI/2],[60,2,0,Math.PI/2],[0,2,-60,0],[0,2,60,0]].forEach(([x,y,z,r])=>box(.8,4,25,0x808898,x,y,z,r));
[[-45,20],[45,-20],[-20,45],[20,-45],[0,-30],[0,30],[-30,0],[30,0]].forEach(([x,z])=>box(.5,2.5,10,0x6a7860,x,1.25,z));
[[-30,-45],[30,45],[-45,30],[45,-30],[-55,-20],[55,20],[-20,-55],[20,55]].forEach(([x,z])=>box(3,5,3,0x607078,x,2.5,z));
[[-8,-6],[8,6],[-6,8],[6,-8],[-25,12],[25,-12],[12,25],[-12,-25]].forEach(([x,z])=>{
  const r=Math.random()*Math.PI;for(let i=-1;i<=1;i++){box(1.4,.9,1.4,0x9a9068,x+Math.cos(r+Math.PI/2)*i*1.6,.45,z+Math.sin(r+Math.PI/2)*i*1.6);}
});
const TREE_POS=[[-80,0],[80,0],[0,-80],[0,80],[-60,-60],[60,60],[-60,60],[60,-60],[-80,40],[80,-40],[-40,80],[40,-80],[-80,-40],[80,40],[-40,-80],[40,80],[-70,70],[-70,-70],[70,-70],[70,70]];
(TREE_POS.slice(0,MOBILE_LOW?6:TREE_POS.length)).forEach(([x,z])=>{
  box(.35,3.5,.35,0x6b4226,x,1.75,z);
  const l=new THREE.Mesh(new THREE.SphereGeometry(1.8,MOBILE_LOW?5:6,MOBILE_LOW?3:4),mat(0x3cb25a));l.position.set(x,5,z);l.castShadow=!MOBILE_LOW;scene.add(l);
});
const pool=new THREE.Mesh(new THREE.PlaneGeometry(16,10),new THREE.MeshLambertMaterial({color:0x0b3652,transparent:!MOBILE_LOW,opacity:MOBILE_LOW?1:.76}));
pool.rotation.x=-Math.PI/2;pool.position.set(-60,.05,15);scene.add(pool);

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
function explode(pos,col,r=3){
  const n=Math.min(6+Math.floor(r*1.2),MOBILE_LOW?6:11);
  for(let i=0;i<n;i++)spawnP(pos,col,1.18);
  for(let i=0;i<(MOBILE_LOW?1:2);i++)spawnSmoke(pos,0x664433);
  for(let i=0;i<(MOBILE_LOW?2:5);i++)spawnSpark(pos,col);
  if(!VISUAL_LIGHTS)return;
  let fl=_eLights.find(l=>!l._act);
  if(!fl){fl=new THREE.PointLight(0xff4400,0,10);fl._act=false;scene.add(fl);_eLights.push(fl);}
  fl.color.setHex(col);fl.intensity=5.5;fl.distance=r*2.4;fl.position.copy(pos);fl._act=true;fl.visible=true;fl._t=0.12;
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
const impactMarks=[];
function wallImpact(pos,col){
  for(let i=0;i<3;i++)spawnSpark(pos,col);
  for(let i=0;i<2;i++)spawnSmoke(pos,0x6b6259);
  if(impactMarks.length>42){
    const old=impactMarks.shift();scene.remove(old.m);old.m.geometry.dispose();old.m.material.dispose();
  }
  const mark=new THREE.Mesh(
    new THREE.SphereGeometry(.045,6,4),
    new THREE.MeshBasicMaterial({color:0x151719,transparent:true,opacity:.78,depthWrite:false})
  );
  const towardCamera=camera.position.clone().sub(pos).normalize().multiplyScalar(.025);
  mark.position.copy(pos).add(towardCamera);
  scene.add(mark);
  impactMarks.push({m:mark,life:9});
}
function tickImpactMarks(dt){
  for(let i=impactMarks.length-1;i>=0;i--){
    const d=impactMarks[i];d.life-=dt;
    if(d.life<1)d.m.material.opacity=Math.max(0,d.life)*.78;
    if(d.life<=0){scene.remove(d.m);d.m.geometry.dispose();d.m.material.dispose();impactMarks.splice(i,1);}
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
