'use strict';

// ─── PICKUPS ────────────────────────────
const pickups=[];
const AMO_PTS=[[-6,-10],[10,-6],[-10,10],[6,10],[0,-15],[0,15],[-15,0],[15,0],[-20,5],[5,-20],[20,-5],[-5,20],[-20,-15],[15,-20],[20,15],[-15,20],[-25,0],[0,-25],[25,0],[0,25],[-18,-18],[18,18],[-18,18],[18,-18],[-35,10],[10,-35],[35,-10],[-10,35],[-30,30],[-30,-30],[30,-30],[30,30],[-50,0],[50,0],[0,-50],[0,50],[-40,40],[40,-40],[-40,-40],[40,40],[-55,20],[20,-55],[-20,55],[55,-20],[-45,0],[0,-45],[45,0],[0,45],[-60,30],[30,-60],[60,-30],[-30,60]];
const HP_PTS=[[-8,6],[8,-8],[-16,-12],[16,14],[2,-22],[-22,2],[22,2],[-2,22],[12,12],[-12,-8],[-25,-20],[20,25],[-20,-25],[25,20],[-32,12],[12,-32],[32,-12],[-12,32],[-40,5],[5,-40],[40,-5],[-5,40],[-48,25],[25,-48],[48,-25],[-25,48],[-55,10],[10,-55],[55,-10],[-10,55]];
const _ringGeo=new THREE.TorusGeometry(.5,.04,6,12);
const PICKUP_MATS={
  dark:new THREE.MeshStandardMaterial({color:0x111820,roughness:.42,metalness:.70}),
  steel:new THREE.MeshStandardMaterial({color:0x8796a4,roughness:.28,metalness:.82}),
  ammo:new THREE.MeshStandardMaterial({color:0x1d6b5b,roughness:.32,metalness:.52,emissive:0x0b3a32,emissiveIntensity:.30}),
  ammoGlow:new THREE.MeshBasicMaterial({color:0x48ffd0,transparent:true,opacity:.92}),
  brass:new THREE.MeshStandardMaterial({color:0xd9a441,roughness:.28,metalness:.82}),
  med:new THREE.MeshStandardMaterial({color:0x8e1827,roughness:.38,metalness:.38,emissive:0x31030a,emissiveIntensity:.24}),
  medWhite:new THREE.MeshStandardMaterial({color:0xf4f8fa,roughness:.46,metalness:.18}),
  medGlow:new THREE.MeshBasicMaterial({color:0xff4058,transparent:true,opacity:.94})
};
const _pickupRingGeo=new THREE.TorusGeometry(.52,.030,7,18);
function addPickupPedestal(group,color){
  const base=new THREE.Mesh(
    new THREE.CylinderGeometry(.46,.55,.055,18),
    new THREE.MeshStandardMaterial({color:0x0d141b,roughness:.58,metalness:.64,emissive:color,emissiveIntensity:.09})
  );
  base.position.y=-.31;group.add(base);
}
function addPickupBeacon(group,color,y=.84,scale=1){
  const glow=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.70,depthTest:false,depthWrite:false});
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.20,6),glow);
  stem.position.y=y-.13;group.add(stem);
  const diamond=new THREE.Mesh(new THREE.OctahedronGeometry(.075*scale,0),glow);
  diamond.position.y=y;diamond.rotation.y=Math.PI/4;group.add(diamond);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.115*scale,.012,5,14),glow);
  halo.position.y=y;halo.rotation.x=Math.PI/2;group.add(halo);
  group.userData.pickupBeacon={stem,diamond,halo,material:glow,baseY:y,phase:Math.random()*Math.PI*2};
}
function mkAmmoMesh(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(.74,.42,.50),PICKUP_MATS.ammo);g.add(body);
  const lid=new THREE.Mesh(new THREE.BoxGeometry(.78,.10,.54),PICKUP_MATS.dark);lid.position.y=.25;g.add(lid);
  for(const sx of [-.30,.30]){
    const rail=new THREE.Mesh(new THREE.BoxGeometry(.055,.39,.53),PICKUP_MATS.steel);rail.position.x=sx;g.add(rail);
  }
  for(let i=0;i<4;i++){
    const round=new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,.34,8),PICKUP_MATS.brass);
    round.rotation.x=Math.PI/2;round.position.set(-.18+i*.12,.05,.28);g.add(round);
  }
  const ring=new THREE.Mesh(_pickupRingGeo,PICKUP_MATS.ammoGlow);ring.rotation.x=Math.PI/2;ring.position.y=-.30;g.add(ring);
  addPickupPedestal(g,0x48ffd0);
  addPickupBeacon(g,0x48ffd0,.82,.88);
  return g;
}
function mkHpMesh(){
  const g=new THREE.Group(),model=new THREE.Group();g.add(model);
  const body=new THREE.Mesh(new THREE.BoxGeometry(.70,.50,.28),PICKUP_MATS.med);model.add(body);
  const rim=new THREE.Mesh(new THREE.BoxGeometry(.75,.10,.32),PICKUP_MATS.dark);rim.position.y=.25;model.add(rim);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.15,.035,6,14,Math.PI),PICKUP_MATS.steel);
  handle.rotation.x=Math.PI/2;handle.position.set(0,.39,0);model.add(handle);
  const crossH=new THREE.Mesh(new THREE.BoxGeometry(.39,.105,.31),PICKUP_MATS.medWhite);crossH.position.z=.025;model.add(crossH);
  const crossV=new THREE.Mesh(new THREE.BoxGeometry(.105,.39,.31),PICKUP_MATS.medWhite);crossV.position.z=.025;model.add(crossV);
  const ring=new THREE.Mesh(_pickupRingGeo,PICKUP_MATS.medGlow);ring.rotation.x=Math.PI/2;ring.position.y=-.33;g.add(ring);
  addPickupPedestal(g,0xff4058);
  addPickupBeacon(g,0xff4058,.86,.94);
  g.userData.proceduralPickupModel=model;
  attachWorldMedkitPickupArt(g,model);
  return g;
}

const WORLD_PICKUP_ART_TUNING=Object.freeze({
  pistol:{maxPx:118,minPx:30,y:.18},shotgun:{maxPx:148,minPx:34,y:.20},rifle:{maxPx:154,minPx:34,y:.20},
  rocket:{maxPx:158,minPx:36,y:.20},plasma:{maxPx:150,minPx:34,y:.20},mine:{maxPx:100,minPx:28,y:.15},
  bomb:{maxPx:112,minPx:30,y:.16},smoke:{maxPx:84,minPx:26,y:.18},sniper:{maxPx:166,minPx:36,y:.20}
});
const WORLD_MEDKIT_PICKUP_ART_TUNING=Object.freeze({maxPx:92,minPx:26,y:.16});
const _worldPickupArtPos=new THREE.Vector3(),_worldPickupArtDir=new THREE.Vector3(),_worldPickupArtScreen=new THREE.Vector3();
const _worldPickupArtRaycaster=new THREE.Raycaster();
let worldPickupArtLastSync=0;
function worldWeaponPickupAsset(key){return GAME_ASSETS.generatedWorldWeaponPickups?.[key]||'';}
function worldMedkitPickupAsset(){return GAME_ASSETS.presentation.medkitPickup||'';}
function hideWorldPickupArt(entry){
  if(entry?.img)entry.img.style.visibility='hidden';
}
function attachWorldWeaponPickupArt(group,key,model){
  const layer=G('world-pickup-art-layer'),asset=worldWeaponPickupAsset(key);
  if(!layer||!asset)return null;
  const img=document.createElement('img');
  img.className='world-weapon-pickup-art';img.alt='';img.decoding='async';img.draggable=false;
  img.dataset.weaponKey=key;img.style.visibility='hidden';img.src=asset;
  const entry={img,model,key,ready:false,failed:false};
  group.userData.worldPickupArt=entry;
  img.onload=()=>{entry.ready=true;entry.failed=false;model.visible=false;};
  img.onerror=()=>{entry.failed=true;entry.ready=false;model.visible=true;img.remove();group.userData.worldPickupArt=null;};
  layer.append(img);return entry;
}
function attachWorldMedkitPickupArt(group,model){
  const layer=G('world-pickup-art-layer'),asset=worldMedkitPickupAsset();
  if(!layer||!asset)return null;
  const img=document.createElement('img');
  img.className='world-health-pickup-art';img.alt='';img.decoding='async';img.draggable=false;
  img.dataset.pickupKind='medkit';img.style.visibility='hidden';img.src=asset;
  const entry={img,model,key:'medkit',ready:false,failed:false};
  group.userData.worldPickupArt=entry;
  img.onload=()=>{entry.ready=true;entry.failed=false;model.visible=false;};
  img.onerror=()=>{entry.failed=true;entry.ready=false;model.visible=true;img.remove();group.userData.worldPickupArt=null;};
  layer.append(img);return entry;
}
function syncWorldWeaponPickupArt(){
  const layer=G('world-pickup-art-layer');
  if(!layer)return;
  if(webglLost){layer.style.visibility='hidden';return;}
  layer.style.visibility='visible';
  const now=performance.now(),interval=MOBILE_LOW?66:33;
  if(now-worldPickupArtLastSync<interval)return;
  worldPickupArtLastSync=now;
  for(const pk of pickups){
    const entry=pk.m.userData.worldPickupArt;
    if(!entry?.ready||!pk.m.visible){hideWorldPickupArt(entry);continue;}
    const tune=pk.type==='weapon'?WORLD_PICKUP_ART_TUNING[pk.weaponKey]:pk.type==='hp'?WORLD_MEDKIT_PICKUP_ART_TUNING:null;
    if(!tune){hideWorldPickupArt(entry);continue;}
    _worldPickupArtPos.set(pk.m.position.x,pk.m.position.y+tune.y,pk.m.position.z);
    _worldPickupArtDir.subVectors(_worldPickupArtPos,camera.position);
    const dist=_worldPickupArtDir.length();
    if(dist<.7||dist>48){hideWorldPickupArt(entry);continue;}
    _worldPickupArtRaycaster.set(camera.position,_worldPickupArtDir.normalize());
    _worldPickupArtRaycaster.near=.05;_worldPickupArtRaycaster.far=Math.max(.05,dist-.42);
    if(_worldPickupArtRaycaster.intersectObjects(wallMeshes,false).length){hideWorldPickupArt(entry);continue;}
    _worldPickupArtScreen.copy(_worldPickupArtPos).project(camera);
    if(_worldPickupArtScreen.z<-1||_worldPickupArtScreen.z>1||Math.abs(_worldPickupArtScreen.x)>1.08||Math.abs(_worldPickupArtScreen.y)>1.08){
      hideWorldPickupArt(entry);continue;
    }
    const cap=tune.maxPx*(MOBILE_LOW?.78:1);
    const width=Math.max(tune.minPx,Math.min(cap,cap*8.5/Math.max(5.5,dist)));
    const x=(_worldPickupArtScreen.x*.5+.5)*W,y=(-_worldPickupArtScreen.y*.5+.5)*H;
    const tilt=Math.sin(pk.bob*.58)*1.2;
    entry.img.style.width=width.toFixed(1)+'px';
    entry.img.style.left=x.toFixed(1)+'px';entry.img.style.top=y.toFixed(1)+'px';
    entry.img.style.opacity=String(Math.max(.68,Math.min(.98,1-(dist-8)/72)));
    entry.img.style.transform='translate3d(-50%,-50%,0) rotate('+tilt.toFixed(2)+'deg)';
    entry.img.style.visibility='visible';
  }
}

const WEAPON_SPAWN_PTS=AMO_PTS.slice();
const WORLD_WEAPON_COPIES=Object.freeze({pistol:2,shotgun:2,rifle:3,rocket:2,plasma:2,mine:1,bomb:1,smoke:1,sniper:2});
const WORLD_WEAPON_KEYS=WEAPONS.flatMap(w=>Array(WORLD_WEAPON_COPIES[w.key]||1).fill(w.key));
function mkWeaponPickupMesh(key){
  const w=WEAPON_BY_KEY[key]||WEAPONS[0],g=new THREE.Group();
  const model=createWorldWeaponModel(w.key);model.position.y=.16;g.add(model);
  const haloColor=w.bCol||w.gCol||0xffcc33;
  const ring=new THREE.Mesh(
    new THREE.TorusGeometry(.72,.045,7,20),
    new THREE.MeshBasicMaterial({color:haloColor,transparent:true,opacity:.94})
  );
  ring.rotation.x=Math.PI/2;ring.position.y=-.30;g.add(ring);
  const base=new THREE.Mesh(
    new THREE.CylinderGeometry(.52,.62,.07,18),
    new THREE.MeshStandardMaterial({color:0x111820,roughness:.62,metalness:.52,emissive:haloColor,emissiveIntensity:.15})
  );
  base.position.y=-.31;g.add(base);
  addPickupBeacon(g,haloColor,.90,1.00);
  g.userData.weaponKey=w.key;g.userData.proceduralWeaponModel=model;
  attachWorldWeaponPickupArt(g,w.key,model);
  return g;
}
function randomWeaponReserve(w){
  const min=Math.max(50,Math.floor(w.pickupAmmoMin??50));
  const max=Math.max(min,Math.min(400,Math.floor(w.pickupAmmoMax??400)));
  return min+Math.floor(Math.random()*(max-min+1));
}
function chooseWeaponSpawnPoint(pk=null,seedIndex=-1){
  const candidates=WEAPON_SPAWN_PTS;
  if(seedIndex>=0&&candidates[seedIndex%candidates.length])return candidates[seedIndex%candidates.length];
  let fallback=candidates[Math.floor(Math.random()*candidates.length)];
  for(let attempt=0;attempt<18;attempt++){
    const pt=candidates[Math.floor(Math.random()*candidates.length)];
    const dx=pt[0]-camera.position.x,dz=pt[1]-camera.position.z;
    if(dx*dx+dz*dz<64)continue;
    let crowded=false;
    for(const other of pickups){
      if(other===pk||other.type!=='weapon'||!other.m.visible)continue;
      const ox=other.m.position.x-pt[0],oz=other.m.position.z-pt[1];
      if(ox*ox+oz*oz<49){crowded=true;break;}
    }
    if(!crowded)return pt;
    fallback=pt;
  }
  return fallback;
}
function relocateWeaponPickup(pk,seedIndex=-1){
  const pt=chooseWeaponSpawnPoint(pk,seedIndex);
  pk.m.position.set(pt[0],.62,pt[1]);
  pk.bob=Math.random()*Math.PI*2;
}

function spawnPickups(){
  const hpPts=MOBILE_LOW?HP_PTS.filter((_,i)=>i%2===0):HP_PTS;
  hpPts.forEach(([x,z])=>{
    const m=mkHpMesh();m.position.set(x,.6,z);scene.add(m);
    pickups.push({m,type:'hp',bob:Math.random()*Math.PI*2,respawn:0,cd:0});
  });

  const keys=WORLD_WEAPON_KEYS;
  keys.forEach((weaponKey,i)=>{
    const m=mkWeaponPickupMesh(weaponKey);scene.add(m);
    const pk={m,type:'weapon',weaponKey,bob:Math.random()*Math.PI*2,respawn:0,cd:0};
    pickups.push(pk);relocateWeaponPickup(pk,i*3+2);
  });
}let pickupTickAcc=0;
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
  pickupTickAcc+=dt;
  if(pickupTickAcc<1/30)return;
  const step=Math.min(.08,pickupTickAcc);pickupTickAcc=0;
  const px=camera.position.x,pz=camera.position.z;
  for(const pk of pickups){
    if(!pk.m.visible){
      pk.respawn-=step;
      if(pk.respawn<=0){
        if(pk.type==='weapon')relocateWeaponPickup(pk);
        pk.m.visible=true;pk.cd=.30;
      }
      continue;
    }

    pk.bob+=step*(pk.type==='weapon'?1.30:1.55);
    pk.m.position.y=(pk.type==='weapon'?.62:.55)+Math.sin(pk.bob)*(pk.type==='weapon'?.10:.13);
    pk.m.rotation.y+=step*(pk.type==='weapon'?.70:1.0);
    const beacon=pk.m.userData.pickupBeacon;
    if(beacon){
      const pulse=.5+.5*Math.sin(pk.bob*1.35+beacon.phase);
      beacon.material.opacity=.52+pulse*.22;
      const haloScale=.88+pulse*.18;
      beacon.halo.scale.setScalar(haloScale);
      beacon.halo.rotation.z+=step*.75;
      beacon.diamond.rotation.y+=step*1.1;
      beacon.diamond.position.y=beacon.baseY+Math.sin(pk.bob*1.6+beacon.phase)*.025;
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
      pk.respawn=(w.isRocket||w.isBomb||w.isSniper?20:14)+Math.random()*14;
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
    pk.cd=.8;pk.m.visible=false;pk.respawn=14;
  }
}
