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
const _pickupRingGeo=new THREE.TorusGeometry(.60,.045,7,18);
function addPickupPedestal(group,color){
  const base=new THREE.Mesh(
    new THREE.CylinderGeometry(.52,.62,.07,18),
    new THREE.MeshStandardMaterial({color:0x0d141b,roughness:.56,metalness:.62,emissive:color,emissiveIntensity:.12})
  );
  base.position.y=-.31;group.add(base);
}
function addPickupBeacon(group,color,y=1.0,scale=1){
  const glow=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.88,depthTest:false,depthWrite:false});
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.34,6),glow);
  stem.position.y=y-.22;group.add(stem);
  const diamond=new THREE.Mesh(new THREE.OctahedronGeometry(.11*scale,0),glow);
  diamond.position.y=y;diamond.rotation.y=Math.PI/4;group.add(diamond);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.16*scale,.018,5,14),glow);
  halo.position.y=y;halo.rotation.x=Math.PI/2;group.add(halo);
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
  addPickupBeacon(g,0x48ffd0,1.00,.92);
  return g;
}
function mkHpMesh(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(.70,.50,.28),PICKUP_MATS.med);g.add(body);
  const rim=new THREE.Mesh(new THREE.BoxGeometry(.75,.10,.32),PICKUP_MATS.dark);rim.position.y=.25;g.add(rim);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.15,.035,6,14,Math.PI),PICKUP_MATS.steel);
  handle.rotation.x=Math.PI/2;handle.position.set(0,.39,0);g.add(handle);
  const crossH=new THREE.Mesh(new THREE.BoxGeometry(.39,.105,.31),PICKUP_MATS.medWhite);crossH.position.z=.025;g.add(crossH);
  const crossV=new THREE.Mesh(new THREE.BoxGeometry(.105,.39,.31),PICKUP_MATS.medWhite);crossV.position.z=.025;g.add(crossV);
  const ring=new THREE.Mesh(_pickupRingGeo,PICKUP_MATS.medGlow);ring.rotation.x=Math.PI/2;ring.position.y=-.33;g.add(ring);
  addPickupPedestal(g,0xff4058);
  addPickupBeacon(g,0xff4058,1.02,1.02);
  return g;
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
  addPickupBeacon(g,haloColor,1.08,1.10);
  g.userData.weaponKey=w.key;return g;
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

    pk.bob+=step*(pk.type==='weapon'?1.45:1.8);
    pk.m.position.y=(pk.type==='weapon'?.62:.55)+Math.sin(pk.bob)*(pk.type==='weapon'?.14:.18);
    pk.m.rotation.y+=step*(pk.type==='weapon'?.82:1.2);
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
      if(result.first)showMsg(w.icon+' НОВОЕ ОРУЖИЕ: '+w.label+' · +'+result.added+' патронов');
      else showMsg(w.icon+' +'+result.added+' патронов для '+w.label+' · запас '+result.total);
      saveProgress(true);
      continue;
    }

    const heal=Math.round(50*plr.medkitM);
    if(hp>=plr.maxHp){
      if(plr.overhealArmor<=0||armor>=plr.maxArmor){pk.cd=.35;continue;}
      const gain=Math.min(plr.overhealArmor,plr.maxArmor-armor);
      armor+=gain;markHUD();showMsg('🛡️ Аптечка преобразована: +'+Math.round(gain)+' брони');
    }else{
      const before=hp;hp=Math.min(hp+heal,plr.maxHp);markHUD();showMsg('❤️ +'+Math.round(hp-before)+' HP!');
    }
    pk.cd=.8;pk.m.visible=false;pk.respawn=14;
  }
}
