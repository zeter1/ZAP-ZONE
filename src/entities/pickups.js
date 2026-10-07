'use strict';

// ─── PICKUPS ────────────────────────────
const pickups=[];
const PICKUP_MATS={
  dark:new THREE.MeshStandardMaterial({color:0x111820,roughness:.42,metalness:.70}),
  steel:new THREE.MeshStandardMaterial({color:0x8796a4,roughness:.28,metalness:.82}),
  brass:new THREE.MeshStandardMaterial({color:0xd9a441,roughness:.28,metalness:.82}),
  med:new THREE.MeshStandardMaterial({color:0x8e1827,roughness:.38,metalness:.38}),
  medWhite:new THREE.MeshStandardMaterial({color:0xf4f8fa,roughness:.46,metalness:.18}),
  medGlow:new THREE.MeshBasicMaterial({color:0xff4058})
};
const PICKUP_GROUND_Y=-.04;
const PICKUP_ROOT_Y=.20;
const PICKUP_FLOAT_HEIGHT=.48;
const PICKUP_FLOAT_AMPLITUDE=.08;
function roundedPickupBox(width,height,depth,radius,material){
  const x=-width/2,y=-height/2,r=radius,s=new THREE.Shape();
  s.moveTo(x+r,y);s.lineTo(x+width-r,y);s.quadraticCurveTo(x+width,y,x+width,y+r);
  s.lineTo(x+width,y+height-r);s.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
  s.lineTo(x+r,y+height);s.quadraticCurveTo(x,y+height,x,y+height-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  const geometry=new THREE.ExtrudeGeometry(s,{depth:depth-radius,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:radius/2,bevelThickness:radius/2,curveSegments:4});
  geometry.translate(0,0,-(depth-radius)/2);
  return new THREE.Mesh(geometry,material);
}
function groundPickupModel(group,model){
  model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3());
  model.position.x-=center.x;model.position.z-=center.z;
  model.position.y+=PICKUP_GROUND_Y-PICKUP_ROOT_Y+.008-bounds.min.y;
  batchPickupGeometry(model);
  model.traverse(mesh=>{if(mesh.isMesh){mesh.castShadow=false;mesh.receiveShadow=true;}});
  group.userData.pickupPresentation={model,baseY:model.position.y};
  model.position.y+=PICKUP_FLOAT_HEIGHT;
}
// Static pickups need no individual animated parts. Merge by material to keep
// detailed silhouettes without one draw call per screw or case corner.
function batchPickupGeometry(model){
  model.updateMatrixWorld(true);
  const inverse=new THREE.Matrix4().copy(model.matrixWorld).invert(),batches=new Map(),owned=new Set();
  model.traverse(mesh=>{
    if(!mesh.isMesh)return;
    owned.add(mesh.geometry);
    for(let node=mesh;node;node=node.parent){if(!node.visible)return;if(node===model)break;}
    const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld));
    let batch=batches.get(mesh.material);
    if(!batch){batch={positions:[],normals:[],count:0};batches.set(mesh.material,batch);}
    batch.positions.push(geometry.attributes.position.array);batch.normals.push(geometry.attributes.normal.array);
    batch.count+=geometry.attributes.position.array.length;geometry.dispose();
  });
  model.clear();
  model.userData={};
  for(const [material,batch] of batches){
    const positions=new Float32Array(batch.count),normals=new Float32Array(batch.count);let offset=0;
    for(let i=0;i<batch.positions.length;i++){positions.set(batch.positions[i],offset);normals.set(batch.normals[i],offset);offset+=batch.positions[i].length;}
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));
    const mesh=new THREE.Mesh(geometry,material);mesh.name='pickup-static-detail';model.add(mesh);
  }
  for(const geometry of owned)geometry.dispose();
}
function mkHpMesh(){
  const g=new THREE.Group(),model=new THREE.Group();g.add(model);
  const box=(sx,sy,sz,mat,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);mesh.position.set(x,y,z);model.add(mesh);return mesh;};
  model.add(roundedPickupBox(.96,.66,.34,.07,PICKUP_MATS.med));
  const lid=roundedPickupBox(.91,.61,.06,.055,PICKUP_MATS.dark);lid.position.z=.19;model.add(lid);
  const panel=roundedPickupBox(.65,.43,.045,.04,PICKUP_MATS.med);panel.position.z=.228;model.add(panel);
  box(.36,.10,.032,PICKUP_MATS.medWhite,0,0,.266);
  box(.10,.36,.032,PICKUP_MATS.medWhite,0,0,.266);
  for(const x of [-.38,.38]){
    box(.062,.53,.39,PICKUP_MATS.steel,x);
    box(.10,.09,.05,PICKUP_MATS.brass,x,-.18,.226);
    for(const y of [-.24,.24]){const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,.027,8),PICKUP_MATS.dark);bolt.rotation.x=Math.PI/2;bolt.position.set(x,y,.222);model.add(bolt);}
  }
  box(.29,.045,.09,PICKUP_MATS.steel,0,.41,0);
  for(const x of [-.13,.13])box(.04,.12,.09,PICKUP_MATS.steel,x,.355,0);
  for(const x of [-.44,.44])for(const y of [-.26,.26])box(.09,.09,.40,PICKUP_MATS.dark,x,y);
  for(const x of [-.26,.26])box(.105,.018,.022,PICKUP_MATS.medGlow,x,-.23,.258);
  model.rotation.x=-Math.PI/2;
  g.userData.proceduralPickupModel=model;groundPickupModel(g,model);
  attachDetailedPickupArt(g,model,'medkit');
  return g;
}
function clearWorldPickupPresentation(){
  const layer=G('world-pickup-art-layer');if(!layer)return;
  for(const img of layer.querySelectorAll('img')){img.onload=null;img.onerror=null;}
  layer.replaceChildren();layer.style.visibility='hidden';
}
// Retained runtime hook: world pickups now render through scene depth and smoke.
const WORLD_PICKUP_ART_TUNING=Object.freeze({
  pistol:.95,shotgun:1.85,rifle:2.10,rocket:1.95,plasma:2.05,mine:.85,
  bomb:.95,smoke:.72,sniper:2.50,grenade:.68,medkit:1.12
});
const _worldPickupArtPos=new THREE.Vector3(),_worldPickupArtDir=new THREE.Vector3(),_worldPickupArtScreen=new THREE.Vector3();
const _worldPickupArtRaycaster=new THREE.Raycaster();

function hideWorldPickupArt(entry){if(entry?.img)entry.img.style.visibility='hidden';}
function attachDetailedPickupArt(group,model,key){
  const layer=G('world-pickup-art-layer');
  const fallback=key==='medkit'?GAME_ASSETS.presentation.medkitPickup:GAME_ASSETS.generatedWorldWeaponPickups[key];
  const asset=key==='medkit'?(GAME_ASSETS.detailedMedkitPickup||fallback):(GAME_ASSETS.detailedWorldWeaponPickups?.[key]||fallback);
  if(!layer||!asset)return null;
  model.updateMatrixWorld(true);
  const localCenter=model.worldToLocal(new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()));
  const img=document.createElement('img');img.alt='';img.draggable=false;img.decoding='async';
  img.className=key==='medkit'?'world-health-pickup-art':'world-weapon-pickup-art';
  img.dataset.pickupKind=key;img.style.visibility='hidden';
  const entry={img,model,key,localCenter,ready:false,lastOcclusion:-Infinity,eye:new THREE.Vector3(Infinity,Infinity,Infinity),root:new THREE.Vector3(Infinity,Infinity,Infinity),blocked:false};group.userData.worldPickupArt=entry;
  img.onload=()=>{entry.ready=true;model.visible=false;};
  let triedFallback=false;
  img.onerror=()=>{
    if(!triedFallback&&fallback&&fallback!==asset){triedFallback=true;img.src=fallback;return;}
    entry.ready=false;model.visible=true;img.remove();group.userData.worldPickupArt=null;
  };
  layer.append(img);img.src=asset;return entry;
}
function syncWorldWeaponPickupArt(){
  const layer=G('world-pickup-art-layer');if(!layer)return;
  if(webglLost){layer.style.visibility='hidden';return;}layer.style.visibility='visible';
  const now=performance.now();
  camera.updateMatrixWorld(true);
  for(const pk of pickups){
    const entry=pk.m.userData.worldPickupArt;
    if(!entry?.ready||!pk.m.visible){hideWorldPickupArt(entry);continue;}
    pk.m.updateMatrixWorld(true);
    _worldPickupArtPos.copy(entry.localCenter).applyMatrix4(entry.model.matrixWorld);
    _worldPickupArtDir.subVectors(_worldPickupArtPos,camera.position);const distance=_worldPickupArtDir.length();
    if(distance<.35||distance>60){hideWorldPickupArt(entry);continue;}
    _worldPickupArtScreen.copy(_worldPickupArtPos).project(camera);
    if(_worldPickupArtScreen.z<-1||_worldPickupArtScreen.z>1||Math.abs(_worldPickupArtScreen.x)>1.16||Math.abs(_worldPickupArtScreen.y)>1.16){hideWorldPickupArt(entry);continue;}
    // Camera orientation changes screen projection each frame, but not wall LOS.
    // Moving camera/root invalidates the LOS cache immediately; bob is refreshed
    // within100ms. This avoids raycasting every off-screen object on every turn.
    if(now-entry.lastOcclusion>=100||!entry.eye.equals(camera.position)||!entry.root.equals(pk.m.position)){
      _worldPickupArtRaycaster.set(camera.position,_worldPickupArtDir.normalize());
      _worldPickupArtRaycaster.near=.05;_worldPickupArtRaycaster.far=Math.max(.05,distance-.12);
      entry.blocked=!!_worldPickupArtRaycaster.intersectObjects(wallMeshes,false).length;
      entry.eye.copy(camera.position);entry.root.copy(pk.m.position);entry.lastOcclusion=now;
    }
    if(entry.blocked){hideWorldPickupArt(entry);continue;}
    const smokeVisibility=typeof smokeVisibilityBetween42==='function'?smokeVisibilityBetween42(camera.position,_worldPickupArtPos):1;
    if(smokeVisibility<.015){hideWorldPickupArt(entry);continue;}
    // Perspective size comes from physical item width and actual camera depth.
    const depth=-_worldPickupArtScreen.copy(_worldPickupArtPos).applyMatrix4(camera.matrixWorldInverse).z;
    _worldPickupArtScreen.copy(_worldPickupArtPos).project(camera);
    const width=Math.min(W*.42,WORLD_PICKUP_ART_TUNING[entry.key]*H/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))*Math.max(.35,depth)));
    entry.img.style.width=width.toFixed(3)+'px';entry.img.style.left=((_worldPickupArtScreen.x*.5+.5)*W).toFixed(3)+'px';
    entry.img.style.top=((-_worldPickupArtScreen.y*.5+.5)*H).toFixed(3)+'px';entry.img.style.opacity=String(smokeVisibility);
    entry.img.style.transform='translate3d(-50%,-50%,0) rotate('+((pk.artTilt||0)+Math.sin(pk.bob)*1.5).toFixed(2)+'deg)';
    entry.img.style.visibility='visible';
  }
}

// Broad ground coverage; each game gets new jittered, obstacle-free locations.
const PICKUP_SPAWN_LIMIT=76;
const PICKUP_SPAWN_CLEARANCE=1.6;
const WEAPON_SPAWN_PTS=[];
const WORLD_WEAPON_COPIES=Object.freeze({pistol:5,shotgun:4,rifle:6,rocket:3,plasma:4,mine:3,bomb:2,smoke:4,sniper:3,grenade:4});
const WORLD_WEAPON_KEYS=WEAPONS.flatMap(w=>Array(WORLD_WEAPON_COPIES[w.key]||1).fill(w.key));
function pickupSpawnPointClear(x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>PICKUP_SPAWN_LIMIT||Math.abs(z)>PICKUP_SPAWN_LIMIT)return false;
  for(const bounds of wallAABBs){
    if(x>=bounds.min.x-PICKUP_SPAWN_CLEARANCE&&x<=bounds.max.x+PICKUP_SPAWN_CLEARANCE&&z>=bounds.min.z-PICKUP_SPAWN_CLEARANCE&&z<=bounds.max.z+PICKUP_SPAWN_CLEARANCE)return false;
  }
  return true;
}
function buildPickupSpawnPoints(){
  const points=[];
  for(let x=-72;x<=72;x+=6)for(let z=-72;z<=72;z+=6){
    const px=x+(Math.random()-.5)*2.6,pz=z+(Math.random()-.5)*2.6;
    if(pickupSpawnPointClear(px,pz))points.push([px,pz]);
  }
  return points;
}
function chooseWeaponSpawnPoint(pk=null){
  const start=Math.floor(Math.random()*WEAPON_SPAWN_PTS.length);
  let fallback=null,best=-Infinity;
  for(let i=0;i<WEAPON_SPAWN_PTS.length;i++){
    const point=WEAPON_SPAWN_PTS[(start+i)%WEAPON_SPAWN_PTS.length];
    const dx=point[0]-camera.position.x,dz=point[1]-camera.position.z;
    const playerDistance=dx*dx+dz*dz;
    if(pk){const ox=point[0]-pk.m.position.x,oz=point[1]-pk.m.position.z;if(ox*ox+oz*oz<36)continue;}
    let spacing=Infinity;
    for(const other of pickups){
      if(other===pk||!other.m.visible)continue;
      const ox=other.m.position.x-point[0],oz=other.m.position.z-point[1];spacing=Math.min(spacing,ox*ox+oz*oz);
    }
    if(playerDistance>=36&&spacing>=10.24)return point;
    const score=Math.min(playerDistance,spacing);
    if(score>best){best=score;fallback=point;}
  }
  return fallback;
}
function relocateWeaponPickup(pk){
  const point=chooseWeaponSpawnPoint(pk);if(!point)return false;
  pk.m.position.set(point[0],PICKUP_ROOT_Y,point[1]);
  pk.bob=Math.random()*Math.PI*2;pk.m.rotation.y=pk.bob;
  return true;
}
function mkWeaponPickupMesh(key){
  const w=WEAPON_BY_KEY[key]||WEAPONS[0],g=new THREE.Group();
  const model=createWorldWeaponModel(w.key),usesBlender49=!!model.userData.blenderWorldWeapon49;
  g.add(model);groundPickupModel(g,model);
  g.userData.weaponKey=w.key;g.userData.proceduralWeaponModel=model;g.userData.blenderWorldWeapon49=usesBlender49;
  // Pack49 is already a real scene-depth 3D pickup. Do not hide it behind the
  // older DOM/raster pickup card; non-Pack49 equipment keeps the old fallback.
  if(!usesBlender49)attachDetailedPickupArt(g,model,w.key);
  return g;
}
function randomWeaponReserve(w){
  return 3+Math.floor(Math.random()*98);
}
function spawnPickups(){
  if(pickups.length===0)clearWorldPickupPresentation();
  WEAPON_SPAWN_PTS.splice(0,WEAPON_SPAWN_PTS.length,...buildPickupSpawnPoints());
  const spawn=(type,key)=>{
    const m=type==='hp'?mkHpMesh():mkWeaponPickupMesh(key);
    const pk={m,type,weaponKey:key,bob:Math.random()*Math.PI*2,respawn:0,cd:0,artTilt:0};
    if(!relocateWeaponPickup(pk)){destroySceneObject(m);return;}
    pickups.push(pk);scene.add(m);
  };
  for(const key of WORLD_WEAPON_KEYS)spawn('weapon',key);
  const healthCount=MOBILE_LOW?24:40;
  for(let i=0;i<healthCount;i++)spawn('hp',null);
}
function tickPickupPresentation(dt){
  const step=Math.min(.08,Math.max(0,dt));
  for(const pk of pickups){
    if(!pk.m.visible)continue;
    pk.bob+=step*1.65;
    const presentation=pk.m.userData.pickupPresentation;
    if(presentation){
      presentation.model.position.y=presentation.baseY+PICKUP_FLOAT_HEIGHT+Math.sin(pk.bob)*PICKUP_FLOAT_AMPLITUDE;
      pk.m.rotation.y+=step*.24;
    }
  }
}

let pickupTickAcc=0;
let pickupToastTimer=0;
function showPickupNotification(icon,fallback,title,detail,tone='cyan'){
  const root=G('pickup-toast'),iconEl=G('pickup-toast-icon'),titleEl=G('pickup-toast-title'),detailEl=G('pickup-toast-detail');
  if(!root||!iconEl||!titleEl||!detailEl){showMsg((title?title+' · ':'')+(detail||''));return;}
  if(typeof applyPresentationAtlasVariables==='function')applyPresentationAtlasVariables(root,'pickup-frame',pickupNotificationPresentationFrame());
  root.dataset.tone=tone;
  titleEl.textContent=title||'';detailEl.textContent=detail||'';
  if(icon||fallback){
    iconEl.style.display='block';
    iconEl.dataset.fallbackSrc=fallback||'';
    iconEl.onerror=()=>{
      const fb=iconEl.dataset.fallbackSrc||'';
      if(fb&&iconEl.getAttribute('src')!==fb){iconEl.onerror=null;iconEl.src=fb;}
      else iconEl.style.display='none';
    };
    iconEl.src=icon||fallback;
  }else{
    iconEl.onerror=null;iconEl.removeAttribute('src');iconEl.style.display='none';
  }
  root.classList.remove('on');void root.offsetWidth;root.classList.add('on');
  clearTimeout(pickupToastTimer);pickupToastTimer=setTimeout(()=>root.classList.remove('on'),2600);
}
function tickPickups(dt){
  tickPickupPresentation(dt);
  pickupTickAcc+=dt;
  if(pickupTickAcc<1/30)return;
  const step=Math.min(.08,pickupTickAcc);pickupTickAcc=0;
  const px=camera.position.x,pz=camera.position.z;
  for(const pk of pickups){
    if(!pk.m.visible){
      pk.respawn-=step;
      if(pk.respawn<=0){
        if(!relocateWeaponPickup(pk)){pk.respawn=.5;continue;}
        pk.m.visible=true;pk.cd=.30;
      }
      continue;
    }

    if(pk.cd>0){pk.cd-=step;continue;}

    const dx=px-pk.m.position.x,dz=pz-pk.m.position.z;
    if(dx*dx+dz*dz>5)continue;

    if(pk.type==='weapon'){
      const idx=WEAPONS.findIndex(w=>w.key===pk.weaponKey),w=WEAPONS[idx];
      if(idx<0||!w)continue;
      const reserveGrant=randomWeaponReserve(w);
      const result=grantWeapon(idx,reserveGrant);
      if(!result)continue;
      pk.cd=.8;pk.m.visible=false;
      pk.respawn=(w.isRocket||w.isBomb||w.isSniper||w.isGrenade?20:14)+Math.random()*14;
      updateMineHUD();updateWeaponBar();wHUD();
      const pickupIcon=GAME_ASSETS.generatedWorldWeaponPickups[w.key]||w.asset;
      if(result.first)showPickupNotification(pickupIcon,w.asset,'НОВОЕ ОРУЖИЕ',w.label+' · +'+result.added+' патронов','gold');
      else showPickupNotification(pickupIcon,w.asset,'БОЕПРИПАСЫ',w.label+' · +'+result.added+' · запас '+result.total,'cyan');
      saveProgress(true);
      continue;
    }

    const heal=Math.round(50*plr.medkitM);
    if(hp>=plr.maxHp){
      if(plr.overhealArmor<=0||armor>=plr.maxArmor){pk.cd=.35;continue;}
      const gain=Math.min(plr.overhealArmor,plr.maxArmor-armor);
      armor+=gain;markHUD();showPickupNotification(GAME_ASSETS.presentation.medkitPickup,GAME_ASSETS.pickups.medkit,'АПТЕЧКА → БРОНЯ','+'+Math.round(gain)+' брони','blue');
    }else{
      const before=hp;hp=Math.min(hp+heal,plr.maxHp);markHUD();showPickupNotification(GAME_ASSETS.presentation.medkitPickup,GAME_ASSETS.pickups.medkit,'АПТЕЧКА','+'+Math.round(hp-before)+' HP','green');
    }
    pk.cd=.8;pk.m.visible=false;
    pk.respawn=14;
  }
}
