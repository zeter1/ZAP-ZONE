'use strict';

// ─── WEAPONS ────────────────────────────
// One catalog drives player balance, bot variants, ammo defaults and UI assets.
const WEAPON_ASSET_DIR='assets/weapons';
function weaponDef(key,label,icon,config){
  return {key,label,icon,name:`${icon} ${label}`,asset:`${WEAPON_ASSET_DIR}/${key}.svg`,...config};
}
const WEAPONS=[
  weaponDef('pistol','ПИСТОЛЕТ','🔫',{clip:15,reload:1.25,rate:.22,dmg:26,spread:.012,adsSpread:.006,moveSpread:.010,airSpread:.035,falloffStart:20,falloffEnd:55,minDamageM:.62,bCol:0xffffaa,gCol:0xf5c800,brlCol:0xcccccc,pellets:1,recoilX:.016,recoilY:.032,recoilReturn:14,recoilDelay:.12,recoilPattern:[-.35,.18,-.12,.28],bloomPerShot:.0048,bloomMax:.024,bloomDecay:.060,firstShotM:.62,equipTime:.26,sprintRecover:.12,tacticalReloadM:.88,emptyReloadM:1.08,adsIn:.16,adsOut:.12,automatic:false,fireMode:'semi',zoomFov:52,startingAmmo:15,pickupAmmoMin:50,pickupAmmoMax:400,reserveCap:9999,tracerColor:0xffd27a,muzzleVelocity:85,bulletGravity:4.8,range:55,viewPos:[.28,-.25,-.48],bot:{range:44,opt:20,hitBias:.90}}),
  weaponDef('shotgun','ДРОБОВИК','💥',{clip:6,reload:2.35,rate:.82,dmg:19,spread:.10,adsSpread:.075,moveSpread:.025,airSpread:.055,falloffStart:8,falloffEnd:24,minDamageM:.28,bCol:0xff8844,gCol:0x884422,brlCol:0x665533,pellets:8,recoilX:.045,recoilY:.085,recoilReturn:8.5,recoilDelay:.22,recoilPattern:[-.20,.18],bloomPerShot:.010,bloomMax:.030,bloomDecay:.050,firstShotM:.82,equipTime:.50,sprintRecover:.27,reloadStyle:'shell',shellStartM:.22,shellInsertM:.26,cycleTime:.62,adsIn:.22,adsOut:.16,automatic:false,fireMode:'pump',zoomFov:58,startingAmmo:6,pickupAmmoMin:50,pickupAmmoMax:400,reserveCap:9999,tracerColor:0xffb06a,muzzleVelocity:68,bulletGravity:5.5,range:24,viewPos:[.30,-.27,-.54],bot:{range:20,opt:10,hitBias:.85}}),
  weaponDef('rifle','ШТУРМОВАЯ ВИНТОВКА','🎯',{clip:30,reload:2.15,rate:.10,dmg:31,spread:.008,adsSpread:.0035,moveSpread:.014,airSpread:.035,falloffStart:30,falloffEnd:75,minDamageM:.72,bCol:0x44ffaa,gCol:0x336644,brlCol:0x224433,pellets:1,recoilX:.011,recoilY:.026,recoilReturn:11,recoilDelay:.16,recoilPattern:[-.35,-.10,.16,.31,.08,-.22,.18,.35],bloomPerShot:.0032,bloomMax:.034,bloomDecay:.040,firstShotM:.54,equipTime:.40,sprintRecover:.20,tacticalReloadM:.90,emptyReloadM:1.12,adsIn:.19,adsOut:.13,automatic:true,fireMode:'auto',aimMode:'scope',scopeAsset:'assets/ui/rifle-scope.svg',zoomFov:30,startingAmmo:30,pickupAmmoMin:50,pickupAmmoMax:400,reserveCap:9999,tracerColor:0xffe0a0,muzzleVelocity:125,bulletGravity:3.2,range:75,viewPos:[.30,-.27,-.55],bot:{range:68,opt:36,hitBias:.94}}),
  weaponDef('rocket','РАКЕТНИЦА','🚀',{clip:1,reload:2.85,rate:1.10,dmg:155,spread:.006,adsSpread:.002,moveSpread:.012,airSpread:.025,bCol:0xff4400,gCol:0x553300,brlCol:0x442200,pellets:1,isRocket:true,recoilX:.05,recoilY:.105,recoilReturn:7.5,recoilDelay:.30,equipTime:.58,sprintRecover:.32,emptyReloadM:1.05,automatic:false,fireMode:'launcher',zoomFov:50,startingAmmo:1,pickupAmmoMin:50,pickupAmmoMax:400,reserveCap:9999,viewPos:[.31,-.28,-.58],bot:{range:55,opt:30,hitBias:.88,dmg:140}}),
  weaponDef('plasma','ПЛАЗМА','⚡',{clip:40,reload:1.65,rate:.07,dmg:20,spread:.019,adsSpread:.010,moveSpread:.017,airSpread:.035,falloffStart:20,falloffEnd:58,minDamageM:.58,bCol:0xcc44ff,gCol:0x6622cc,brlCol:0x9944ff,pellets:1,recoilX:.009,recoilY:.015,recoilReturn:15,recoilDelay:.08,recoilPattern:[-.12,.08,-.06,.10],bloomPerShot:.0022,bloomMax:.025,bloomDecay:.060,firstShotM:.70,equipTime:.36,sprintRecover:.17,tacticalReloadM:.90,emptyReloadM:1.06,adsIn:.15,adsOut:.11,automatic:true,fireMode:'auto',zoomFov:46,startingAmmo:40,pickupAmmoMin:50,pickupAmmoMax:400,reserveCap:9999,tracerColor:0xc47cff,muzzleVelocity:48,bulletGravity:0,range:58,viewPos:[.30,-.26,-.54],bot:{range:44,opt:23,hitBias:.89}}),
  weaponDef('mine','МИНА','💣',{clip:4,reload:3.2,rate:.90,dmg:130,spread:0,bCol:0xff8800,gCol:0x222222,brlCol:0x444444,pellets:1,isMine:true,recoilX:0,recoilY:0,equipTime:.30,sprintRecover:.10,automatic:false,fireMode:'deploy',startingAmmo:4,pickupAmmoMin:50,pickupAmmoMax:400,reserveCap:9999,tracerColor:0xff8800,viewPos:[.29,-.27,-.52]}),
  weaponDef('bomb','БОМБА','🧨',{clip:2,reload:.90,rate:1.2,dmg:240,spread:0,bCol:0xffcc22,gCol:0x551100,brlCol:0x111111,pellets:1,isBomb:true,recoilX:0,recoilY:0,equipTime:.34,sprintRecover:.14,automatic:false,fireMode:'deploy',startingAmmo:0,pickupAmmoMin:50,pickupAmmoMax:400,reserveCap:9999,viewPos:[.29,-.27,-.52]}),
  weaponDef('smoke','ДЫМОВУХА','🌫️',{clip:1,reload:.80,rate:.55,dmg:0,spread:0,bCol:0xc8d0d4,gCol:0x3f515a,brlCol:0x7d8b91,pellets:1,isSmoke:true,recoilX:.012,recoilY:.025,equipTime:.28,sprintRecover:.10,automatic:false,fireMode:'throw',startingAmmo:1,pickupAmmoMin:50,pickupAmmoMax:400,reserveCap:9999,tracerColor:0xcbd4d8,viewPos:[.30,-.27,-.56]}),
  weaponDef('sniper','СНАЙПЕРСКАЯ ВИНТОВКА','🔭',{clip:5,reload:3.4,rate:1.30,dmg:118,spread:.040,adsSpread:.00045,moveSpread:.060,airSpread:.12,falloffStart:55,falloffEnd:110,minDamageM:.82,bCol:0x8fe8ff,gCol:0x17365b,brlCol:0xb8d5e8,pellets:1,isSniper:true,aimMode:'scope',scopeAsset:'assets/ui/sniper-scope.svg',hitscan:true,oneShot:true,headshotMult:2.55,recoilX:.028,recoilY:.115,recoilReturn:6.8,recoilDelay:.34,recoilPattern:[-.12,.10],bloomPerShot:.016,bloomMax:.020,bloomDecay:.028,firstShotM:.34,equipTime:.66,sprintRecover:.34,tacticalReloadM:.94,emptyReloadM:1.10,cycleTime:.92,adsIn:.34,adsOut:.20,automatic:false,fireMode:'bolt',zoomFov:12,startingAmmo:5,pickupAmmoMin:50,pickupAmmoMax:400,reserveCap:9999,tracerColor:0xcff8ff,basePenetration:1,range:110,viewPos:[.31,-.29,-.62],bot:{range:108,opt:74,hitBias:.982}})
];
const WEAPON_BY_KEY=Object.fromEntries(WEAPONS.map(w=>[w.key,w]));
const SMOKE_WEAPON_INDEX=WEAPONS.findIndex(w=>w.key==='smoke');
const W_DEFAULTS={
  clips:WEAPONS.map(w=>w.clip),
  rates:WEAPONS.map(w=>w.rate),
  reloads:WEAPONS.map(w=>w.reload),
  cycleTimes:WEAPONS.map(w=>w.cycleTime??0)
};
// New runs start with the pistol only; every other weapon must be found in the arena.
const STARTING_AMMO=WEAPONS.map((w,i)=>i===0?(w.startingAmmo??w.clip):0);
const STARTING_RESERVE=WEAPONS.map((_,i)=>i===0?75:0);
const STARTING_OWNED=WEAPONS.map((_,i)=>i===0);
const PLR_TCOL=Object.fromEntries(WEAPONS.filter(w=>w.tracerColor!==undefined).map(w=>[w.key,w.tracerColor]));
const TRACER_SPEED={...Object.fromEntries(WEAPONS.filter(w=>w.muzzleVelocity!==undefined).map(w=>[w.key,w.muzzleVelocity])),default:18};
const BOT_PRIMARY_POOL=WEAPONS.flatMap((w,idx)=>w.bot?[{...w,...w.bot,idx,dmg:w.bot.dmg??w.dmg}]:[]);

const PLAYER_ROCKET_SPEED=31.0;
const BOT_ROCKET_SPEED=20.0;
const BASE_FOV=75,ZOOM_FOV=42;
function weaponDamageScaleAtDistance(w,dist){
  const start=Number.isFinite(w.falloffStart)?w.falloffStart:Infinity;
  const end=Number.isFinite(w.falloffEnd)?Math.max(start+.001,w.falloffEnd):Infinity;
  if(dist<=start||!Number.isFinite(end))return 1;
  const t=Math.max(0,Math.min(1,(dist-start)/(end-start)));
  return 1-(1-(w.minDamageM??1))*t;
}
const PLAYER_BULLET_DAMAGE_SCALE=0.30;
const PLAYER_ROCKET_DAMAGE_SCALE=0.24;
const PLAYER_MINE_DAMAGE_SCALE=0.27;
const PLAYER_BOMB_DAMAGE_SCALE=0.30;
const PLAYER_MELEE_DAMAGE_SCALE=0.18;
const PLAYER_SPAWN_SHIELD_TIME=3.2;
const PLAYER_DAMAGE_BOOST=1.22;
const BOT_DAMAGE_BOOST=1.08;
const ENEMY_VS_PLAYER_DAMAGE_SCALE=0.88;
const EXPLOSION_DAMAGE_BOOST=1.10;
let respawnShieldT=0;
let hitSlowT=0,hitSlowDur=0,hitSlowMul=1;
let damageFlashAlpha=0, damageFlashDecay=0;
let deathReason='';
let lastPlayerAttacker=null;
const MINE_COOLDOWN_SECONDS=30;
const BOMB_FUSE_SECONDS=45;
const BOMB_COOLDOWN_SECONDS=60;
const BOMB_BLAST_RADIUS=34;
const BOMB_BASE_DAMAGE=12000;
const SMOKE_COOLDOWN_SECONDS=30;
const SMOKE_DURATION_SECONDS=60;
const SMOKE_RADIUS=15.5;
const MAX_ACTIVE_SMOKE_CLOUDS=3;
const MAX_TRACERS=72;
const BOT_MINE_CFG={dmg:105,triggerRange:12,cooldown:MINE_COOLDOWN_SECONDS};
const BOT_BOMB_CFG={dmg:10500,radius:32,minRange:10,maxRange:30,cooldown:BOMB_COOLDOWN_SECONDS};
const BOT_MAX_TEAM_MINES=12;
const BOT_MAX_ACTIVE_BOMBS=3;
const BOT_ROLE_ORDER=['assault','flankL','flankR','anchor','engineer'];
const COVER_POINTS=[
  [-18,-18],[-18,18],[18,-18],[18,18],[-35,10],[35,-10],[-10,35],[10,-35],[-45,20],[45,-20],[-20,45],[20,-45],
  [-32,-30],[32,30],[-32,30],[32,-30],[-58,0],[58,0],[0,-58],[0,58],[-60,22],[60,-22],[-22,60],[22,-60],[-8,-26],[8,26],[-26,8],[26,-8]
];
function chooseBotWeaponByDistance(dist,prevIdx=-1,force=false,role='assault'){
  const scored=BOT_PRIMARY_POOL.map(w=>{
    let score=Math.max(0.16,1.18-Math.abs(dist-w.opt)/Math.max(8,w.range*.52));
    if(dist<8&&w.isRocket)score*=0.18;
    if(dist>24&&w.key==='shotgun')score*=0.24;
    if(dist<10&&w.key==='rifle')score*=0.62;
    if(w.key==='sniper'){
      if(dist<24)score*=0.06;
      else if(dist<42)score*=0.42;
      if(dist>60)score*=1.42;
    }
    if(role==='anchor'){
      if(w.key==='sniper')score*=1.72;
      if(w.key==='rifle')score*=1.34;
      if(w.key==='plasma')score*=1.12;
      if(w.key==='shotgun')score*=0.34;
    }else if(role==='assault'){
      if(w.key==='sniper')score*=0.34;
      if(w.key==='shotgun')score*=1.45;
      if(w.key==='plasma')score*=1.15;
      if(w.key==='rocket'&&dist<14)score*=0.32;
    }else if(role==='engineer'){
      if(w.key==='plasma')score*=1.20;
      if(w.key==='rifle')score*=1.08;
      if(w.key==='shotgun')score*=0.82;
    }else if(role==='flankL'||role==='flankR'){
      if(w.key==='plasma')score*=1.18;
      if(w.key==='pistol')score*=1.08;
      if(w.key==='rocket')score*=0.84;
    }
    if(!force&&prevIdx===w.idx)score*=0.62;
    return {w,score};
  });
  const total=scored.reduce((s,x)=>s+x.score,0);
  let r=Math.random()*total;
  for(const item of scored){r-=item.score;if(r<=0)return {...item.w};}
  return {...BOT_PRIMARY_POOL[0]};
}
function countTeamMines(team){
  let c=0;
  for(const mn of mines){
    if(mn.owner!=='bot'||mn.kind==='bomb')continue;
    const ownerTeam=mn.src?.team||mn.team||null;
    if(ownerTeam===team)c++;
  }
  return c;
}
function teamRoleForNextBot(team){return BOT_ROLE_ORDER[countTeam(team)%BOT_ROLE_ORDER.length];}
function nearestHostileMine(pos,team,maxDist=8,bot=null){
  let best=null,bestD=maxDist;
  for(const mn of mines){
    if(!mn.armed||mn.removed)continue;
    const ownerTeam=mn.owner==='player'?'ally':(mn.src?.team||mn.team||null);
    if(ownerTeam===team)continue;
    const d=pos.distanceTo(mn.m.position);
    if(mn.kind==='bomb'){
      if((mn.fuseT??BOMB_FUSE_SECONDS)>12)continue;
      const danger=Math.max(maxDist,Math.min((mn.radius||BOMB_BLAST_RADIUS)*.78,28));
      if(d<danger&&(!best||d<bestD)){best=mn;bestD=d;}
      continue;
    }
    if(mn.src===bot)continue;
    if(d<bestD){best=mn;bestD=d;}
  }
  return best?{mine:best,dist:bestD}:null;
}
function separationVector(bot,radius=3.4){
  const out=new THREE.Vector3();
  for(const other of enemies){
    if(other===bot||!other.alive||other.team!==bot.team)continue;
    const dx=bot.group.position.x-other.group.position.x;
    const dz=bot.group.position.z-other.group.position.z;
    const d2=dx*dx+dz*dz;
    if(d2>0.0001&&d2<radius*radius){
      const d=Math.sqrt(d2);
      out.x+=(dx/d)*(1-d/radius);
      out.z+=(dz/d)*(1-d/radius);
    }
  }
  return out;
}
function findCoverPoint(from,target,sideBias=0){
  let best=null,bestScore=1e9;
  const tx=target.x,tz=target.z;
  for(const cp of COVER_POINTS){
    const p=new THREE.Vector3(cp[0],0,cp[1]);
    const dFrom=p.distanceTo(from);
    if(dFrom<4||dFrom>32)continue;
    if(p.distanceTo(target)<7)continue;
    const eye=p.clone();eye.y=1.35;
    const tgt=target.clone();tgt.y=1.45;
    if(!wallBetween(eye,tgt,losMeshes))continue;
    let score=dFrom*1.0 + Math.abs(p.distanceTo(target)-14)*0.18;
    if(sideBias!==0){
      const side=((p.x-from.x)*(tz-from.z) - (p.z-from.z)*(tx-from.x));
      if(Math.sign(side)===Math.sign(sideBias))score-=2.2;
    }
    if(score<bestScore){bestScore=score;best=p;}
  }
  return best?best.clone():null;
}


// Gun / world weapon models
// One procedural model factory is reused for first-person, bots and pickups.
// Visual language: dark metal, silver structure and emissive weapon accents.
function weaponMaterial(color,rough=.42,metal=.58,emissive=0x000000,emissiveIntensity=0){
  return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,emissive,emissiveIntensity});
}
function createWeaponModel(key,options={}){
  const w=WEAPON_BY_KEY[key]||WEAPONS[0];
  const mode=options.mode||'world';
  const detail=options.detail??(mode==='firstPerson'?2:(MOBILE_LOW?0:1));
  const team=options.team||'neutral';
  const accentColor=team==='ally'?0x5ab2ff:(w.bCol||w.gCol||0xffb31a);
  const group=new THREE.Group();
  group.name='weapon-'+w.key;

  const dark=weaponMaterial(0x151b22,.26,.86);
  const dark2=weaponMaterial(0x252d36,.32,.74);
  const steel=weaponMaterial(0x8f9aa4,.24,.82);
  const silver=weaponMaterial(0xc2cbd2,.22,.84);
  const polymer=weaponMaterial(0x0d1218,.68,.18);
  const grip=weaponMaterial(0x181d23,.82,.12);
  const wood=weaponMaterial(0x70462a,.72,.08);
  const accent=weaponMaterial(accentColor,.24,.48,accentColor,.72);
  const accentSoft=weaponMaterial(w.gCol||accentColor,.34,.38,accentColor,.32);
  const glass=weaponMaterial(0x98e9ff,.12,.28,accentColor,.88);

  const add=(geometry,material,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{
    const mesh=new THREE.Mesh(geometry,material);
    mesh.position.set(x,y,z);mesh.rotation.set(rx,ry,rz);
    mesh.castShadow=mode!=='firstPerson'&&!MOBILE_LOW;
    mesh.receiveShadow=false;group.add(mesh);return mesh;
  };
  const box=(x,y,z,sx,sy,sz,mat=dark,rx=0,ry=0,rz=0)=>add(new THREE.BoxGeometry(sx,sy,sz),mat,x,y,z,rx,ry,rz);
  const cyl=(x,y,z,r1,r2,len,mat=steel,rx=Math.PI/2,ry=0,rz=0,segments=12)=>add(new THREE.CylinderGeometry(r1,r2,len,segments),mat,x,y,z,rx,ry,rz);
  const sphere=(x,y,z,r,mat=accent,segments=12)=>add(new THREE.SphereGeometry(r,segments,Math.max(6,segments-2)),mat,x,y,z);
  const torus=(x,y,z,r,tube,mat=accent,rx=0,ry=0,rz=0)=>add(new THREE.TorusGeometry(r,tube,6,18),mat,x,y,z,rx,ry,rz);
  const rail=(x,y,z,sx,sy,sz)=>box(x,y,z,sx,sy,sz,accent);
  let muzzleZ=-.90;

  if(w.key==='pistol'){
    box(0,.015,-.18,.235,.17,.58,dark);
    box(0,.09,-.19,.215,.045,.54,silver);
    box(0,.055,-.46,.19,.055,.12,dark2);
    cyl(0,.018,-.53,.036,.036,.34,steel);
    box(.006,-.19,.055,.15,.34,.19,grip,.10,0,-.035);
    box(0,-.03,.07,.18,.095,.18,dark2);
    rail(-.108,.052,-.18,.018,.026,.38);rail(.108,.052,-.18,.018,.026,.38);rail(0,.112,-.08,.09,.018,.09);
    if(detail>0){
      box(0,.12,-.31,.028,.055,.10,polymer);box(0,.115,.045,.026,.052,.09,polymer);
      box(.085,-.19,.055,.014,.22,.13,accentSoft,0,0,-.035);box(-.06,-.19,.055,.018,.22,.13,dark2,0,0,-.035);
    }
    if(detail>1){
      box(0,.085,-.16,.16,.012,.21,dark2);box(-.075,.086,-.16,.012,.014,.16,accent);box(.075,.086,-.16,.012,.014,.16,accent);
    }
    muzzleZ=-.72;
  }else if(w.key==='shotgun'){
    box(0,.01,-.08,.25,.18,.66,dark2);
    cyl(-.055,.045,-.62,.038,.038,1.00,steel);cyl(.055,.045,-.62,.038,.038,1.00,steel);
    box(0,-.035,-.34,.27,.18,.28,wood);box(0,-.075,.31,.20,.20,.44,wood,.035);box(0,-.19,.09,.13,.30,.18,grip,.10);
    rail(0,.12,-.18,.14,.025,.28);
    if(detail>0){box(-.105,.03,-.18,.018,.12,.42,accentSoft);box(.105,.03,-.18,.018,.12,.42,accentSoft);cyl(0,.13,-.10,.035,.035,.19,polymer,Math.PI/2);}
    if(detail>1){for(let i=0;i<4;i++)box(-.128+i*.085,.075,-.37,.04,.035,.12,dark);}
    muzzleZ=-1.13;
  }else if(w.key==='rifle'){
    box(0,.015,-.15,.27,.18,.80,dark2);box(0,.065,-.20,.245,.07,.58,accentSoft);
    cyl(0,.035,-.78,.032,.032,1.10,steel);cyl(0,.035,-1.29,.045,.045,.12,dark);
    box(0,-.18,.00,.13,.31,.20,grip,.12);box(0,-.17,-.31,.13,.31,.19,dark,.08);box(0,-.02,.40,.22,.17,.36,polymer);
    box(0,.145,-.14,.11,.065,.34,polymer);cyl(0,.205,-.15,.038,.038,.27,dark,Math.PI/2);
    rail(-.116,.085,-.20,.018,.022,.48);rail(.116,.085,-.20,.018,.022,.48);
    if(detail>0){box(0,.213,-.15,.12,.042,.12,glass);box(0,.055,-.58,.20,.10,.22,dark);for(let i=0;i<4;i++)box(-.09+i*.06,.11,-.53,.035,.03,.16,steel);}
    if(detail>1){box(0,-.03,.28,.19,.07,.08,silver);rail(0,.105,.18,.09,.018,.12);}
    muzzleZ=-1.38;
  }else if(w.key==='sniper'){
    box(0,.015,-.12,.24,.17,.92,dark2);box(0,.055,-.24,.20,.065,.62,accentSoft);
    cyl(0,.035,-.92,.026,.026,1.52,steel);cyl(0,.035,-1.63,.045,.038,.20,dark);
    box(0,-.02,.48,.20,.16,.54,polymer);box(0,-.18,.08,.12,.31,.20,grip,.12);box(0,-.11,-.34,.11,.22,.20,dark,.05);
    rail(0,.135,-.18,.10,.022,.62);cyl(0,.235,-.22,.055,.055,.46,dark,Math.PI/2);
    cyl(0,.235,-.22,.043,.043,.48,glass,Math.PI/2);
    torus(0,.235,-.44,.060,.014,accent,Math.PI/2);torus(0,.235,.00,.060,.014,accent,Math.PI/2);
    if(detail>0){
      box(-.12,-.10,-.72,.025,.42,.025,steel,0,0,-.32);box(.12,-.10,-.72,.025,.42,.025,steel,0,0,.32);
      box(0,.035,-.70,.19,.09,.30,dark);box(.115,.02,-.50,.018,.12,.42,accentSoft);box(-.115,.02,-.50,.018,.12,.42,accentSoft);
    }
    if(detail>1){box(0,.18,-.22,.14,.035,.30,silver);sphere(0,.235,-.45,.042,glass,10);}
    muzzleZ=-1.76;
  }else if(w.key==='rocket'){
    cyl(0,.015,-.28,.13,.145,1.24,dark2);cyl(0,.015,-.84,.145,.145,.16,steel);
    torus(0,.015,-.85,.147,.022,accent);torus(0,.015,.22,.135,.018,steel);
    box(-.21,-.035,.03,.17,.19,.24,polymer);box(0,-.19,.12,.13,.29,.19,grip,.10);box(0,.17,-.15,.09,.09,.31,dark);
    rail(0,.145,-.44,.055,.025,.45);
    if(detail>0){box(0,.205,-.10,.16,.06,.16,glass);box(.14,.015,-.15,.045,.16,.46,accentSoft);box(-.14,.015,-.15,.045,.16,.46,accentSoft);}
    if(detail>1){for(let i=0;i<3;i++)rail(-.07+i*.07,-.105,-.30,.025,.02,.42);}
    muzzleZ=-1.02;
  }else if(w.key==='plasma'){
    box(0,.00,-.22,.28,.18,.80,dark2);box(0,.055,-.24,.245,.08,.60,accentSoft);
    cyl(0,.02,-.73,.060,.044,.78,weaponMaterial(0x7252a8,.24,.55,accentColor,.70));
    sphere(0,.025,-1.04,.105,glass,14);box(0,-.18,.04,.14,.31,.21,grip,.10);box(0,.14,-.17,.14,.06,.36,dark);
    rail(-.125,.07,-.26,.018,.03,.47);rail(.125,.07,-.26,.018,.03,.47);
    if(detail>0){for(const z of [-.48,-.64,-.80])torus(0,.02,z,.082,.018,accent);box(0,.175,-.18,.11,.035,.15,glass);}
    if(detail>1){sphere(-.105,.02,-.44,.032,accent,10);sphere(.105,.02,-.44,.032,accent,10);}
    muzzleZ=-1.15;
  }else if(w.key==='mine'){
    cyl(0,.00,-.22,.28,.30,.16,dark2,0,0,0,16);cyl(0,.09,-.22,.18,.20,.09,steel,0,0,0,16);
    sphere(0,.16,-.22,.075,glass,12);torus(0,.09,-.22,.215,.025,accent,Math.PI/2);
    if(detail>0){for(let i=0;i<8;i++){const a=i*Math.PI/4;box(Math.cos(a)*.27,.01,-.22+Math.sin(a)*.27,.07,.06,.16,dark,0,-a,0);}}
    muzzleZ=-.56;
  }else if(w.key==='bomb'){
    sphere(0,-.005,-.33,.255,dark2,16);torus(0,-.005,-.33,.205,.035,steel,Math.PI/2);
    cyl(0,.25,-.33,.068,.085,.17,steel,0,0,0,10);cyl(.052,.38,-.33,.018,.018,.25,wood,0,0,-.35,8);
    sphere(.105,.49,-.33,.048,weaponMaterial(0xffd55a,.18,.10,0xffaa00,1.6),8);
    if(detail>0){rail(-.17,-.01,-.18,.055,.055,.12);rail(.17,-.01,-.18,.055,.055,.12);}
    muzzleZ=-.62;
  }else if(w.key==='smoke'){
    cyl(0,.00,-.31,.15,.15,.46,dark2,0,0,Math.PI/2,16);cyl(0,.25,-.31,.105,.12,.08,steel,0,0,0,12);
    box(.13,.31,-.31,.22,.035,.07,steel,0,0,-.12);torus(0,.02,-.31,.116,.018,accent,Math.PI/2);rail(0,.00,-.165,.18,.035,.025);
    if(detail>0){box(0,-.17,-.31,.16,.06,.24,grip);sphere(.20,.31,-.31,.035,accent,8);}
    muzzleZ=-.62;
  }

  group.userData.weaponKey=w.key;group.userData.muzzleZ=muzzleZ;
  return group;
}
function addFirstPersonHands(target){
  const sleeve=weaponMaterial(0x263746,.76,.08),glove=weaponMaterial(0x111820,.92,.04),skin=weaponMaterial(0xc49370,.88,.01);
  const add=(geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);target.add(m);return m;};
  add(new THREE.BoxGeometry(.15,.18,.30),sleeve,-.17,-.29,.14,.12,0,-.18);
  add(new THREE.BoxGeometry(.12,.15,.18),glove,-.13,-.20,-.055,.15,0,-.20);
  add(new THREE.BoxGeometry(.16,.18,.32),sleeve,.18,-.28,.19,.09,0,.18);
  add(new THREE.BoxGeometry(.12,.15,.18),glove,.14,-.19,-.02,.12,0,.16);
  add(new THREE.BoxGeometry(.10,.045,.12),skin,-.13,-.14,-.105,.12,0,-.20);
  add(new THREE.BoxGeometry(.10,.045,.12),skin,.14,-.13,-.07,.10,0,.16);
}
function createWorldWeaponModel(key){
  const w=WEAPON_BY_KEY[key]||WEAPONS[0];
  const model=createWeaponModel(w.key,{mode:'world',detail:MOBILE_LOW?0:1});
  const scale=w.key==='rocket' ? .72 : w.key==='sniper' ? .74 : w.key==='mine' ? .82 : w.key==='bomb' ? .86 : w.key==='smoke' ? .92 : .82;
  model.scale.setScalar(scale);
  model.rotation.x=w.key==='mine'||w.key==='bomb'?0:-.12;
  model.rotation.z=w.key==='mine'||w.key==='bomb'?0:-.08;
  return model;
}

const gunGrp=new THREE.Group();camera.add(gunGrp);
const gunBasePos=new THREE.Vector3(.28,-.25,-.48);
let gunSwayX=0,gunSwayY=0;
let flashM=null,beamM=null,beamT=0;
function buildGun(w){
  clearGroupChildren(gunGrp);flashM=null;beamM=null;
  const model=createWeaponModel(w.key,{mode:'firstPerson',detail:2});model.scale.setScalar(1.04);gunGrp.add(model);
  addFirstPersonHands(gunGrp);
  const muzzleZ=model.userData.muzzleZ??-.90;
  flashM=new THREE.Mesh(new THREE.SphereGeometry(w.isRocket?.11:.065,8,6),new THREE.MeshBasicMaterial({color:0xfff1b0,transparent:true,opacity:0,depthWrite:false}));
  flashM.position.set(0,.02,muzzleZ);gunGrp.add(flashM);
  beamM=new THREE.Mesh(new THREE.ConeGeometry(w.isRocket?.10:.065,w.isRocket?.34:.24,8,1,true),new THREE.MeshBasicMaterial({color:0xffa43a,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
  beamM.rotation.x=-Math.PI/2;beamM.position.set(0,.02,muzzleZ-.12);gunGrp.add(beamM);
  gunGrp.userData.muzzleZ=muzzleZ;
  const p=w.viewPos||WEAPONS[0].viewPos;gunBasePos.set(p[0],p[1],p[2]);gunGrp.position.copy(gunBasePos);
}
const BOT_WEAPON_POSES={
  pistol:{p:[.34,1.23,-.08],r:[.07,.05,-.30],s:.72},
  shotgun:{p:[.39,1.22,-.06],r:[.06,.08,-.36],s:.68},
  rifle:{p:[.39,1.24,-.08],r:[.045,.06,-.35],s:.68},
  rocket:{p:[.35,1.30,-.02],r:[.02,.10,-.31],s:.62},
  plasma:{p:[.39,1.23,-.07],r:[.05,.07,-.35],s:.67},
  mine:{p:[.34,1.18,-.03],r:[.16,.03,-.28],s:.68},
  bomb:{p:[.34,1.18,-.03],r:[.16,.03,-.28],s:.68},
  smoke:{p:[.34,1.18,-.03],r:[.16,.03,-.28],s:.68},
  sniper:{p:[.38,1.27,-.09],r:[.035,.055,-.34],s:.65}
};
function addBotWeaponGrip(model,key,team){
  const teamCol=team==='ally'?0x2eaeea:0xc62f4d;
  const gloveMat=new THREE.MeshStandardMaterial({color:0x0c1117,roughness:.76,metalness:.16});
  const cuffMat=new THREE.MeshStandardMaterial({color:teamCol,roughness:.34,metalness:.56,emissive:teamCol,emissiveIntensity:.16});
  const addHand=(x,y,z,rz=0)=>{
    const glove=new THREE.Mesh(new THREE.BoxGeometry(.115,.135,.17),gloveMat);
    glove.position.set(x,y,z);glove.rotation.z=rz;model.add(glove);
    const cuff=new THREE.Mesh(new THREE.BoxGeometry(.13,.075,.12),cuffMat);
    cuff.position.set(x,y+.075,z+.055);cuff.rotation.z=rz;model.add(cuff);
  };
  const frontZ=key==='pistol'?-0.18:key==='rocket'?-0.36:key==='sniper'?-0.46:key==='shotgun'?-0.40:-0.34;
  const rearZ=key==='pistol'?.075:key==='rocket'?.08:.055;
  addHand(.105,-.105,rearZ,-.08);
  if(key!=='pistol')addHand(-.10,-.07,frontZ,.10);
}
function makeBotWeaponMesh(key,team){
  const model=createWeaponModel(key,{mode:'bot',team,detail:MOBILE_LOW?0:2});
  addBotWeaponGrip(model,key,team);
  return model;
}
function refreshBotWeaponVisual(bot){
  if(!bot.weaponPivot)return;
  clearGroupChildren(bot.weaponPivot);
  const key=bot.weapon.key,pose=BOT_WEAPON_POSES[key]||BOT_WEAPON_POSES.rifle;
  bot.weaponPivot.position.set(...pose.p);
  bot.weaponPivot.rotation.set(...pose.r);
  const mesh=makeBotWeaponMesh(key,bot.team);mesh.scale.setScalar(pose.s);
  bot.weaponPivot.add(mesh);bot.weaponMesh=mesh;bot.weaponPivot.userData.weaponKey=key;bot.weaponPivot.userData.pose=pose;
}

// ─── WEAPON BAR UI ──────────────────────
function buildWeaponBar(){
  const bar=G('weapon-bar');bar.replaceChildren();
  WEAPONS.forEach((w,i)=>{
    const owned=typeof ownsWeapon==='function'?ownsWeapon(i):i===0;
    const slot=document.createElement('div');
    slot.className='wb-slot'+(owned?(i===curW?' active':''):' locked');
    slot.id='wb-'+i;
    slot.title=owned?w.name:'Найдите '+w.label+' на карте';

    const asset=document.createElement('img');
    asset.className='wb-asset';asset.src=w.asset;asset.alt='';asset.decoding='async';asset.draggable=false;
    asset.addEventListener('error',()=>asset.remove(),{once:true});

    const key=document.createElement('div');key.className='wb-key';key.textContent=owned?String(i+1):'🔒';
    const name=document.createElement('div');name.className='wb-name';name.textContent=owned?w.label:'НЕ НАЙДЕНО';
    const reserve=document.createElement('div');reserve.className='wb-reserve';
    reserve.textContent=owned&&typeof weaponReserveValue==='function'?'+'+weaponReserveValue(i):'';

    slot.append(asset,key,name,reserve);
    slot.addEventListener('click',()=>switchW(i));bar.appendChild(slot);
  });
}
function updateWeaponBar(){
  WEAPONS.forEach((_,i)=>{
    const el=G('wb-'+i);if(!el)return;
    const owned=ownsWeapon(i);
    el.className='wb-slot'+(owned?(i===curW?' active':''):' locked');
    const key=el.querySelector('.wb-key'),name=el.querySelector('.wb-name'),reserve=el.querySelector('.wb-reserve');
    if(key)key.textContent=owned?String(i+1):'🔒';
    if(name)name.textContent=owned?WEAPONS[i].label:'НЕ НАЙДЕНО';
    if(reserve)reserve.textContent=owned?'+'+weaponReserveValue(i):'';
    el.title=owned?WEAPONS[i].name:'Найдите '+WEAPONS[i].label+' на карте';
  });
}
