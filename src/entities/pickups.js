'use strict';

// ─── PICKUPS ────────────────────────────
const pickups=[];
const AMO_PTS=[[-6,-10],[10,-6],[-10,10],[6,10],[0,-15],[0,15],[-15,0],[15,0],[-20,5],[5,-20],[20,-5],[-5,20],[-20,-15],[15,-20],[20,15],[-15,20],[-25,0],[0,-25],[25,0],[0,25],[-18,-18],[18,18],[-18,18],[18,-18],[-35,10],[10,-35],[35,-10],[-10,35],[-30,30],[-30,-30],[30,-30],[30,30],[-50,0],[50,0],[0,-50],[0,50],[-40,40],[40,-40],[-40,-40],[40,40],[-55,20],[20,-55],[-20,55],[55,-20],[-45,0],[0,-45],[45,0],[0,45],[-60,30],[30,-60],[60,-30],[-30,60]];
const HP_PTS=[[-8,6],[8,-8],[-16,-12],[16,14],[2,-22],[-22,2],[22,2],[-2,22],[12,12],[-12,-8],[-25,-20],[20,25],[-20,-25],[25,20],[-32,12],[12,-32],[32,-12],[-12,32],[-40,5],[5,-40],[40,-5],[-5,40],[-48,25],[25,-48],[48,-25],[-25,48],[-55,10],[10,-55],[55,-10],[-10,55]];
const _ringGeo=new THREE.TorusGeometry(.5,.04,6,12);
function mkAmmoMesh(){
  const g=new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(.55,.4,.28),new THREE.MeshBasicMaterial({color:0x44ffaa})));
  const ring=new THREE.Mesh(_ringGeo,new THREE.MeshBasicMaterial({color:0x44ffaa}));ring.rotation.x=Math.PI/2;ring.position.y=-.25;g.add(ring);
  const c2=document.createElement('canvas');c2.width=180;c2.height=28;
  const ctx2=c2.getContext('2d');ctx2.fillStyle='rgba(0,0,0,.6)';ctx2.fillRect(0,0,180,28);
  ctx2.fillStyle='#aaffcc';ctx2.font='bold 13px sans-serif';ctx2.textAlign='center';ctx2.fillText('📦 ПАТРОНЫ +30',90,18);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c2),transparent:true,depthTest:false}));
  sp.scale.set(1.3,.24,1);sp.position.y=.62;g.add(sp);return g;
}
function mkHpMesh(){
  const g=new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(.55,.55,.18),new THREE.MeshBasicMaterial({color:0xdd1111})));
  [new THREE.BoxGeometry(.44,.14,.2),new THREE.BoxGeometry(.14,.44,.2)].forEach(geo=>g.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xffffff}))));
  const ring=new THREE.Mesh(_ringGeo,new THREE.MeshBasicMaterial({color:0xff4444}));ring.rotation.x=Math.PI/2;ring.position.y=-.30;g.add(ring);
  const c2=document.createElement('canvas');c2.width=180;c2.height=28;
  const ctx2=c2.getContext('2d');ctx2.fillStyle='rgba(0,0,0,.6)';ctx2.fillRect(0,0,180,28);
  ctx2.fillStyle='#ffaaaa';ctx2.font='bold 13px sans-serif';ctx2.textAlign='center';ctx2.fillText('❤️ АПТЕЧКА +50',90,18);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c2),transparent:true,depthTest:false}));
  sp.scale.set(1.3,.24,1);sp.position.y=.64;g.add(sp);return g;
}

const BOMB_PTS=[[-28,0],[28,0],[0,-28],[0,28],[-42,-24],[42,24],[-42,24],[42,-24]];
function mkBombPickupMesh(){
  const g=new THREE.Group();
  const model=createWorldWeaponModel('bomb');model.position.y=.08;g.add(model);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.66,.06,7,18),new THREE.MeshBasicMaterial({color:0xffcc22}));
  ring.rotation.x=Math.PI/2;ring.position.y=-.30;g.add(ring);
  const c2=document.createElement('canvas');c2.width=210;c2.height=30;
  const ctx2=c2.getContext('2d');ctx2.fillStyle='rgba(0,0,0,.68)';ctx2.fillRect(0,0,210,30);
  ctx2.fillStyle='#ffe48a';ctx2.font='bold 13px sans-serif';ctx2.textAlign='center';ctx2.fillText('🧨 БОМБА +1',105,20);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c2),transparent:true,depthTest:false}));
  sp.scale.set(1.45,.26,1);sp.position.y=1.05;g.add(sp);return g;
}
const WORLD_WEAPON_PICKUPS=[
  ['pistol',-18,24],['shotgun',18,-24],['rifle',-33,7],['rocket',33,-7],
  ['plasma',7,33],['mine',-7,-33],['smoke',28,28]
];
function mkWeaponPickupMesh(key){
  const w=WEAPON_BY_KEY[key]||WEAPONS[0],g=new THREE.Group();
  const model=createWorldWeaponModel(w.key);model.position.y=.16;g.add(model);
  const haloColor=w.bCol||w.gCol||0xffcc33;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.72,.045,7,20),new THREE.MeshBasicMaterial({color:haloColor,transparent:true,opacity:.92}));
  ring.rotation.x=Math.PI/2;ring.position.y=-.30;g.add(ring);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.52,.62,.07,18),new THREE.MeshStandardMaterial({color:0x111820,roughness:.62,metalness:.52,emissive:haloColor,emissiveIntensity:.10}));
  base.position.y=-.31;g.add(base);
  const c=document.createElement('canvas');c.width=260;c.height=34;const ctx=c.getContext('2d');
  ctx.fillStyle='rgba(2,7,12,.82)';ctx.fillRect(0,0,260,34);
  ctx.strokeStyle='#'+new THREE.Color(haloColor).getHexString();ctx.lineWidth=2;ctx.strokeRect(1,1,258,32);
  ctx.fillStyle='#ffffff';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText(w.icon+' '+w.label,130,22);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));
  sp.scale.set(1.70,.28,1);sp.position.y=1.02;g.add(sp);g.userData.weaponKey=w.key;return g;
}

function spawnPickups(){
  const ammoPts=MOBILE_LOW?AMO_PTS.filter((_,i)=>i%2===0):AMO_PTS;
  const hpPts=MOBILE_LOW?HP_PTS.filter((_,i)=>i%2===0):HP_PTS;
  ammoPts.forEach(([x,z])=>{const m=mkAmmoMesh();m.position.set(x,.6,z);scene.add(m);pickups.push({m,type:'ammo',bob:Math.random()*Math.PI*2,respawn:0,cd:0});});
  hpPts.forEach(([x,z])=>{const m=mkHpMesh();m.position.set(x,.6,z);scene.add(m);pickups.push({m,type:'hp',bob:Math.random()*Math.PI*2,respawn:0,cd:0});});
  BOMB_PTS.forEach(([x,z])=>{const m=mkBombPickupMesh();m.position.set(x,.6,z);scene.add(m);pickups.push({m,type:'bomb',bob:Math.random()*Math.PI*2,respawn:0,cd:0});});
  const weaponPts=MOBILE_LOW?WORLD_WEAPON_PICKUPS.filter((_,i)=>i%2===0):WORLD_WEAPON_PICKUPS;
  weaponPts.forEach(([weaponKey,x,z])=>{
    const m=mkWeaponPickupMesh(weaponKey);m.position.set(x,.62,z);scene.add(m);
    pickups.push({m,type:'weapon',weaponKey,bob:Math.random()*Math.PI*2,respawn:0,cd:0});
  });
}
let pickupTickAcc=0;
function tickPickups(dt){
  pickupTickAcc+=dt;
  if(pickupTickAcc<1/30)return;
  const step=Math.min(.08,pickupTickAcc);pickupTickAcc=0;
  const px=camera.position.x,pz=camera.position.z;
  for(const pk of pickups){
    if(!pk.m.visible){pk.respawn-=step;if(pk.respawn<=0)pk.m.visible=true;continue;}
    pk.bob+=step*1.8;pk.m.position.y=.55+Math.sin(pk.bob)*.18;pk.m.rotation.y+=step*1.2;
    if(pk.cd>0){pk.cd-=step;continue;}
    const dx=px-pk.m.position.x,dz=pz-pk.m.position.z;if(dx*dx+dz*dz>5)continue;
    pk.cd=.8;pk.m.visible=false;
    if(pk.type==='weapon'){
      const idx=WEAPONS.findIndex(w=>w.key===pk.weaponKey),w=WEAPONS[idx];
      if(idx<0||!w){pk.m.visible=true;pk.cd=0;continue;}
      const current=weaponAmmoValue(idx);
      if(idx===curW&&current>=w.clip&&!w.isSmoke&&!w.isMine){pk.m.visible=true;pk.cd=.45;continue;}
      if(w.isSmoke){playerSmokeCD=0;setWeaponAmmo(idx,1);smokeHudSecond=-1;}
      else if(w.isMine){
        if(current>=w.clip){pk.m.visible=true;pk.cd=.45;continue;}
        setWeaponAmmo(idx,Math.min(w.clip,current+2));
      }else setWeaponAmmo(idx,w.clip);
      switchW(idx);wHUD();updateMineHUD();showMsg(w.icon+' '+w.label+' подобрано!');pk.respawn=w.isRocket?24:18;
    }
    else if(pk.type==='ammo'){uAmmo=Math.min(uAmmo+30,9999);wHUD();showMsg('📦 +30 патронов!');pk.respawn=7;}
    else if(pk.type==='bomb'){
      const cur=weaponAmmoValue(6);
      if(cur>=WEAPONS[6].clip){pk.m.visible=true;pk.cd=0;continue;}
      setWeaponAmmo(6,cur+1);wHUD();updateMineHUD();showMsg('🧨 Бомба подобрана!');pk.respawn=24;
    }else{
      const heal=Math.round(50*plr.medkitM);
      if(hp>=plr.maxHp){
        if(plr.overhealArmor<=0||armor>=plr.maxArmor){pk.m.visible=true;pk.cd=0;continue;}
        const gain=Math.min(plr.overhealArmor,plr.maxArmor-armor);armor+=gain;markHUD();showMsg('🛡️ Аптечка преобразована: +'+Math.round(gain)+' брони');pk.respawn=14;
      }else{
        const before=hp;hp=Math.min(hp+heal,plr.maxHp);markHUD();showMsg('❤️ +'+Math.round(hp-before)+' HP!');pk.respawn=14;
      }
    }
  }
}
