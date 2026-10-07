import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const combat=read('src/combat/combat.js'),bots=read('src/ai/bot-deployables.js');
function fn(source,name){
  const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);
  const open=source.indexOf('{',start);let depth=1,i=open+1;
  for(;depth;i++){if(source[i]==='{')depth++;if(source[i]==='}')depth--;}
  return source.slice(start,i);
}
class Vec{
  constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}
  clone(){return new Vec(this.x,this.y,this.z);}
  copy(v){Object.assign(this,{x:v.x,y:v.y,z:v.z});return this;}
  set(x,y,z){Object.assign(this,{x,y,z});return this;}
  lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z;}
  normalize(){const d=Math.sqrt(this.lengthSq())||1;this.x/=d;this.y/=d;this.z/=d;return this;}
  applyQuaternion(){return this;}
  addScaledVector(v,n){this.x+=v.x*n;this.y+=v.y*n;this.z+=v.z*n;return this;}
}
function fixture(slot=6,decoded=true){
  const events=[],listeners={};
  const c={THREE:{Vector3:Vec},wallAABBs:[],curW:slot,running:true,paused:false,dying:false,lvlAnnOpen:false,perkPickOpen:false,reloading:false,onGnd:true,
    weaponEquipT:0,weaponReadyT:0,sprintExitT:0,sprintBlend:0,wasWeaponSprinting:false,cycleT:0,sCD:0,zooming:false,mouseDown:false,
    pendingMineThrow:null,fragGrenadeCharge:null,pendingFragGrenadeThrow:null,WEAPONS:Array.from({length:10},()=>({rate:1.2,clip:2})),
    playerBombCD:0,MAX_MINES:3,mines:[],stock:2,owned:true,infinite:false,ammo:2,uAmmo:0,
    weaponAmmoValue:()=>c.stock,weaponReserveValue:()=>0,setWeaponAmmo:(i,n)=>{assert.equal(i,6);c.stock=n;events.push('ammo');},
    ownsWeapon:()=>c.owned,testingInfiniteAmmoEnabled:()=>c.infinite,showMsg:s=>events.push(s),updateWeaponBar(){},wHUD(){},updateMineHUD(){},
    camera:{position:new Vec(0,1.75,0),quaternion:{}},scene:{add:m=>{m.parent=c.scene;events.push('scene');}},
    createBombDevice41:()=>({position:new Vec(),userData:{}}),BOMB_FUSE_SECONDS:45,BOMB_COOLDOWN_SECONDS:180,BOMB_BASE_DAMAGE:100,BOMB_BLAST_RADIUS:32,
    PLAYER_DAMAGE_BOOST:1,playerDamageMultiplier:()=>1,plr:{bombFuseM:1,bombDamageM:1,explosiveDamageM:1,bombRadiusM:1,explosiveRadiusM:1},
    fpGeneratedWeaponAction:null,stopGeneratedFirstPersonAction(){events.push('stop');c.fpGeneratedWeaponAction=null;},
    showGeneratedBombArmVfx(duration){events.push(['art',duration]);if(decoded)c.fpGeneratedWeaponAction={kind:'bombPlant41'};return decoded;},
    getW:()=>c.WEAPONS[c.curW],G:()=>({style:{}}),K:{},cancelFragGrenadeThrow(){},cancelPendingMineThrow(){},quickSwitchWeapon(){},switchW(){},GRENADE_WEAPON_INDEX:9,
    window:{addEventListener:(type,cb)=>{listeners[type]=cb;}},document:{addEventListener:(type,cb)=>{listeners[type]=cb;},hidden:false}};
  vm.createContext(c);
  vm.runInContext(combat.slice(combat.indexOf('let pendingBombPlant=null;'),combat.indexOf('function spawnBotSmokeGrenade('))+'\n'+
    ['mkBomb','weaponActionBlocked','shoot','throwMine','throwFragGrenade','throwSmokeGrenade','doReload'].map(n=>fn(combat,n)).join('\n'),c);
  vm.runInContext(combat.slice(combat.indexOf("window.addEventListener('keydown'"),combat.indexOf("window.addEventListener('keyup'")),c);
  vm.runInContext(combat.slice(combat.indexOf("window.addEventListener('blur'"),combat.indexOf("document.addEventListener('contextmenu'")),c);
  return {c,events,listeners,run:s=>vm.runInContext(s,c),tick:(steps=10)=>{for(let i=0;i<steps;i++)c.tickPendingBombPlant(.05);}};
}
test('native and quick placement reserve, release once at .48 and recover at .96 independent of decode',()=>{
  for(const slot of [6,2])for(const decoded of [true,false]){
    const f=fixture(slot,decoded);assert.equal(f.c.placeBomb(),true);assert.equal(f.c.placeBomb(),false);
    assert.equal(f.c.stock,2);assert.equal(f.c.playerBombCD,0);assert.equal(f.c.mines.length,0);
    f.tick(9);assert.equal(f.c.mines.length,0);f.tick(1);
    assert.equal(f.c.mines.length,1);assert.equal(f.c.stock,1);assert.equal(f.c.playerBombCD,180);
    assert.equal(f.c.mines[0].m.position.y,.34);assert.equal(f.c.mines[0].m.position.z,-1.15);
    assert.equal(f.c.weaponActionBlocked(),true);f.tick(10);
    assert.equal(f.c.weaponActionBlocked(),false);assert.equal(f.c.mines.length,1);assert.equal(f.c.stock,1);
    assert.deepEqual(f.events.filter(e=>Array.isArray(e)),[['art',.96]]);
  }
});
test('cancel → retry and stale references cannot emit a duplicate; cancellation after commit preserves world',()=>{
  const f=fixture();f.c.placeBomb();const stale=f.run('pendingBombPlant');f.tick(3);f.c.cancelPendingBombPlant();
  assert.equal(f.c.stock,2);assert.equal(f.c.playerBombCD,0);assert.equal(f.c.fpGeneratedWeaponAction,null);
  assert.equal(f.c.placeBomb(),true);assert.equal(f.c.commitPendingBombPlant(stale),false);f.tick();
  const committed=f.run('pendingBombPlant');assert.equal(f.c.commitPendingBombPlant(committed),false);
  f.c.cancelPendingBombPlant();f.tick(30);assert.equal(f.c.stock,1);assert.equal(f.c.mines.length,1);
});
test('all reachable state transitions reject before commit, without spending ammo or cooldown',()=>{
  for(const change of ['curW=2','paused=true','running=false','dying=true','reloading=true','lvlAnnOpen=true','perkPickOpen=true','onGnd=false','weaponEquipT=.2','weaponReadyT=.2','sprintExitT=.2','sprintBlend=.3','wasWeaponSprinting=true','cycleT=.2']){
    const f=fixture();f.c.placeBomb();f.tick(3);f.run(change);f.tick();
    assert.equal(f.c.mines.length,0,change);assert.equal(f.c.stock,2,change);assert.equal(f.c.playerBombCD,0,change);assert.equal(f.run('pendingBombPlant'),null,change);
    if(change!=='curW=2'){const initial=fixture();initial.run(change);assert.equal(initial.c.placeBomb(),false,change);}
  }
});
test('release revalidates cap, ownership, ammo, cooldown and current safe placement',()=>{
  for(const change of ['MAX_MINES=0','owned=false','stock=0','playerBombCD=3','wallAABBs.push({min:{x:-1,z:-1},max:{x:1,z:1}})']){
    const f=fixture();f.c.placeBomb();f.run(change);f.tick();assert.equal(f.c.mines.length,0,change);assert.equal(f.events.includes('ammo'),false,change);
    assert.equal(f.run('pendingBombPlant'),null,change);
  }
  const f=fixture();f.c.infinite=true;f.c.placeBomb();f.tick();assert.equal(f.c.stock,2);assert.equal(f.c.mines.length,1);
});
test('G key is one-shot; pending blocks firearm/mine/grenade/smoke; reload/blur/visibility cancel',()=>{
  const f=fixture(2);f.listeners.keydown({code:'KeyG',key:'g',repeat:true});assert.equal(f.run('pendingBombPlant'),null);
  f.listeners.keydown({code:'KeyG',key:'g',repeat:false});assert.ok(f.run('pendingBombPlant'));
  for(const n of ['shoot','throwMine','throwFragGrenade','throwSmokeGrenade'])f.c[n]();
  assert.equal(f.c.mines.length,0);assert.equal(f.c.stock,2);f.listeners.blur();assert.equal(f.run('pendingBombPlant'),null);
  f.c.placeBomb();f.c.document.hidden=true;f.listeners.visibilitychange();assert.equal(f.run('pendingBombPlant'),null);
  f.c.document.hidden=false;f.c.placeBomb();f.c.doReload();assert.equal(f.run('pendingBombPlant'),null);
});
test('real arena .6/.5 walls keep player and bot footprint on the starting side; overlap is rejected',()=>{
  const f=fixture();
  for(const wall of [{min:{x:-20.3,z:-15},max:{x:-19.7,z:15}},{min:{x:-45.25,z:15},max:{x:-44.75,z:25}}]){
    f.c.wallAABBs=[wall];const edge=wall.min.x-.42,origin=new Vec(edge-.10,1.75,(wall.min.z+wall.max.z)/2);
    for(const distance of [1.15,1.05]){
      const placed=f.c.safeBombPlacement(origin,new Vec(1,0,0),distance);assert.ok(placed);assert.ok(placed.x<edge);assert.ok(placed.x>=origin.x);
      assert.equal(f.c.safeBombPlacement(new Vec(edge+.01,1.75,origin.z),new Vec(1,0,0),distance),null);
    }
  }
  f.c.wallAABBs=[];const free=f.c.safeBombPlacement(new Vec(2,0,3),new Vec(0,0,1),1.05);assert.equal(free.z,4.05);
  assert.equal(f.c.safeBombPlacement(new Vec(NaN,0,0),new Vec(1,0,0),1.15),null);
});
test('bot calls real safe helper with unchanged success RNG, fuse, damage and near-side placement',()=>{
  const f=fixture();let draws=0;Object.assign(f.c,{BOT_BOMB_CFG:{minRange:10,maxRange:30,cooldown:180,dmg:10500,radius:32},BOT_MAX_ACTIVE_BOMBS:3,activeBombCount:()=>0,bombNearPoint:()=>false,level:10,kills:20});
  f.c.Math=Object.create(Math);f.c.Math.random=()=>{draws++;return draws===1?.01:.25;};
  vm.runInContext(fn(bots,'tryPlantBotBomb'),f.c);
  f.c.wallAABBs=[{min:{x:-20.3,z:-15},max:{x:-19.7,z:15}}];
  const bot={team:'ally',role:'engineer',commandDoctrine:'breach',bombCD:0,canSeeTarget:true,group:{position:new Vec(-20.82,0,0),rotation:{y:Math.PI/2}}};
  assert.equal(f.c.tryPlantBotBomb(bot,18,new Vec()),true);assert.equal(draws,2);assert.equal(bot.bombCD,180);
  const bomb=f.c.mines[0];assert.ok(bomb.m.position.x<-20.72);assert.equal(bomb.fuseT,45);assert.equal(bomb.dmg,10500*1.18);assert.equal(bomb.radius,32);
});
test('fuse perk message and published fuse agree; lifecycle callers explicitly cancel stale planting',()=>{
  const f=fixture();f.c.plr.bombFuseM=.82;f.c.placeBomb();f.tick();assert.ok(Math.abs(f.c.mines[0].fuseT-36.9)<1e-9);
  assert.ok(f.events.some(s=>typeof s==='string'&&s.includes('36.9 сек.')));
  const runtime=read('src/game/runtime.js'),session=read('src/game/session.js'),progression=read('src/progression/progression.js');
  assert.match(runtime,/tickPendingBombPlant\(dt\)/);assert.match(fn(session,'showPauseUI'),/cancelPendingBombPlant\(\)/);
  for(const name of ['checkDeath','doRespawn','clearWorldForFreshGame','openLvlAnn','openPerkPick'])assert.match(fn(progression,name),/cancelPendingBombPlant\(\)/,name);
});
