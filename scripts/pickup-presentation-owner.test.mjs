import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/entities/pickups.js',import.meta.url),'utf8');
function fixture(type='hp',overrides={}){
  const presentation={model:{position:{y:.38}},baseY:-.10};
  const pk={type,weaponKey:'rifle',bob:0,m:{visible:true,position:{x:0,y:.20,z:0},rotation:{y:.73},userData:{pickupPresentation:presentation}},cd:0,respawn:0};
  const events=[],context={pickups:[pk],pickupTickAcc:0,PICKUP_FLOAT_HEIGHT:.48,PICKUP_FLOAT_AMPLITUDE:.08,camera:{position:{x:0,z:0}},hp:25,armor:0,
    plr:{maxHp:100,maxArmor:80,medkitM:1,overhealArmor:0},WEAPONS:[{key:'rifle',label:'RIFLE'}],
    GAME_ASSETS:{generatedWorldWeaponPickups:{},presentation:{},pickups:{}},Math,
    randomWeaponReserve:()=>100,grantWeapon:()=>({first:true,added:100,total:100}),
    relocateWeaponPickup(p){events.push('relocate');p.m.position.x=12;p.m.rotation.y=1.8;return true;},
    showPickupNotification(){events.push('toast');},saveProgress(){events.push('save');},
    markHUD(){},updateMineHUD(){},updateWeaponBar(){},wHUD(){},...overrides};
  vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function tickPickupPresentation('),source.indexOf('let pickupTickAcc='))+source.slice(source.indexOf('function tickPickups(')),context);
  return {c:context,pk,events,tick:dt=>context.tickPickups(dt)};
}
test('body hovers and rotates every frame while gameplay root stays fixed',()=>{
  const f=fixture();f.c.camera.position.x=30;
  const heights=[];for(let i=0;i<90;i++){f.tick(1/30);heights.push(f.pk.m.userData.pickupPresentation.model.position.y);}
  assert.equal(f.pk.m.position.y,.20);assert.ok(f.pk.m.rotation.y>.73);assert.equal(f.pk.m.visible,true);
  assert.ok(Math.max(...heights)-Math.min(...heights)>.10);assert.ok(heights.every(y=>y>=.30&&y<=.46));
});
test('heal pickup hides once, returns at a different location, and can heal again',()=>{
  const f=fixture();f.tick(.04);
  assert.equal(f.c.hp,75);assert.equal(f.pk.m.visible,false);assert.equal(f.pk.respawn,14);
  f.c.camera.position.x=30;for(let i=0;i<420;i++)f.tick(.04);
  assert.equal(f.pk.m.visible,true);assert.equal(f.pk.m.position.y,.20);
  assert.equal(f.pk.m.position.x,12);f.c.camera.position.x=12;f.c.hp=10;f.pk.cd=0;f.tick(.04);
  assert.equal(f.c.hp,60);assert.equal(f.pk.m.visible,false);assert.equal(f.events.filter(x=>x==='toast').length,2);
});
test('full HP leaves medkit available; armor conversion still consumes it',()=>{
  const f=fixture('hp',{hp:100});f.tick(.04);assert.equal(f.pk.m.visible,true);
  f.c.plr.overhealArmor=20;f.pk.cd=0;f.tick(.04);assert.equal(f.c.armor,20);assert.equal(f.pk.m.visible,false);
});
test('weapon pickup grants once and respawns at a new location without vertical drift',()=>{
  const f=fixture('weapon');let grants=0;f.c.grantWeapon=()=>{grants++;return {first:true,added:100,total:100};};
  f.tick(.04);assert.equal(grants,1);assert.equal(f.pk.m.visible,false);assert.ok(f.pk.respawn>=14&&f.pk.respawn<=28);
  f.tick(.04);assert.equal(grants,1);f.pk.respawn=.01;f.c.camera.position.x=30;f.tick(.04);
  assert.equal(f.pk.m.visible,true);assert.equal(f.pk.m.position.x,12);assert.equal(f.pk.m.position.y,.20);
  assert.ok(f.events.includes('relocate'));assert.equal(f.pk.cd,.30);
});
test('failed grant preserves pickup and does not save progress',()=>{
  const f=fixture('weapon',{grantWeapon:()=>null});f.tick(.04);
  assert.equal(f.pk.m.visible,true);assert.equal(f.pk.respawn,0);assert.deepEqual(f.events,[]);
});

test('hover updates even before the30Hz collection tick',()=>{
 const f=fixture();f.c.camera.position.x=30;let before=f.pk.m.userData.pickupPresentation.model.position.y;
 for(let i=0;i<4;i++){f.tick(1/144);const after=f.pk.m.userData.pickupPresentation.model.position.y;assert.notEqual(after,before);before=after;}
 assert.equal(f.c.hp,25);assert.equal(f.pk.m.position.y,.2);
});
test('no feasible respawn keeps hidden pickup pending',()=>{
 const f=fixture('hp',{relocateWeaponPickup:()=>false});f.pk.m.visible=false;f.pk.respawn=.01;f.tick(.04);
 assert.equal(f.pk.m.visible,false);assert.equal(f.pk.respawn,.5);assert.equal(f.c.hp,25);
});
test('all98 equally sized random intervals yield precisely integers3 through100',()=>{
 const c={Math:Object.create(Math)};vm.createContext(c);
 vm.runInContext(source.slice(source.indexOf('function randomWeaponReserve('),source.indexOf('function spawnPickups(')),c);
 const actual=[];for(let i=0;i<98;i++){c.Math.random=()=>(i+.5)/98;actual.push(c.randomWeaponReserve({}));}
 assert.deepEqual(actual,Array.from({length:98},(_,i)=>i+3));
 c.Math.random=()=>0;assert.equal(c.randomWeaponReserve({}),3);
 c.Math.random=()=>1-Number.EPSILON;assert.equal(c.randomWeaponReserve({}),100);
});
test('fresh placement and relocation use clear ground across all quadrants',()=>{
 const walls=[{min:{x:-20,z:-16},max:{x:24,z:18}},{min:{x:-55,z:30},max:{x:-38,z:48}}];
 let seed=42;const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const c={Math:math,Number,wallAABBs:walls,pickups:[],camera:{position:{x:0,z:45}},PICKUP_ROOT_Y:.2,WEAPONS:['pistol','shotgun','rifle','rocket','plasma','mine','bomb','smoke','sniper','grenade'].map(key=>({key}))};vm.createContext(c);
 vm.runInContext(source.slice(source.indexOf('const PICKUP_SPAWN_LIMIT='),source.indexOf('function mkWeaponPickupMesh(')),c);
 const populate=()=>vm.runInContext('WEAPON_SPAWN_PTS.splice(0,WEAPON_SPAWN_PTS.length,...buildPickupSpawnPoints());WEAPON_SPAWN_PTS.length',c);
 assert.ok(populate()>500);const positions=new Set(),quadrants=new Set();
 for(let game=0;game<8;game++){
  c.pickups.length=0;populate();
  for(let i=0;i<78;i++){
   const pk={m:{visible:true,position:{x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;}},rotation:{y:0}}};
   assert.equal(c.relocateWeaponPickup(pk),true);const {x,y,z}=pk.m.position;assert.equal(y,.2);assert.equal(c.pickupSpawnPointClear(x,z),true);
   assert.ok(Math.hypot(x-c.camera.position.x,z-c.camera.position.z)>=6);
   assert.ok(c.pickups.every(other=>Math.hypot(x-other.m.position.x,z-other.m.position.z)>=3.2));
   positions.add(`${x.toFixed(4)},${z.toFixed(4)}`);quadrants.add(`${Math.sign(x)},${Math.sign(z)}`);c.pickups.push(pk);
  }
  for(const pk of c.pickups){const old={...pk.m.position};assert.equal(c.relocateWeaponPickup(pk),true);assert.ok(Math.hypot(old.x-pk.m.position.x,old.z-pk.m.position.z)>=6);}
 }
 assert.equal(quadrants.size,4);assert.ok(positions.size>600);
 assert.equal(c.pickupSpawnPointClear(0,0),false);assert.equal(c.pickupSpawnPointClear(77,0),false);
});
test('grants accumulate actual reserve when infinite ammo is enabled or disabled',()=>{
 const state=readFileSync(new URL('../src/player/state.js',import.meta.url),'utf8');
 const definitions=readFileSync(new URL('../src/weapons/system.js',import.meta.url),'utf8');
 const c={Math,Number,GAME_ASSETS:{generatedWorldWeaponPickups:{}},gameAssetUrl:x=>x,gameSettings:{infiniteAmmo:true,allWeapons:false},curW:0,ammo:15,uAmmo:10,updateWeaponBar(){},wHUD(){},G:()=>({style:{}}),hideGeneratedFirstPersonWeaponArt(){},playWeaponMechanicSound(){},buildGun(){},updateMineHUD(){}};vm.createContext(c);
 vm.runInContext(definitions.slice(0,definitions.indexOf('const W_DEFAULTS=')),c);
 vm.runInContext('globalThis.WEAPONS=WEAPONS;globalThis.weaponOwned=WEAPONS.map(()=>true);globalThis.weaponAmmo=WEAPONS.map(w=>w.clip);globalThis.weaponReserve=WEAPONS.map(()=>10);',c);
 vm.runInContext(state.slice(state.indexOf('function getW(){'),state.indexOf("const SAVE_KEY=")),c);
 vm.runInContext(state.slice(state.indexOf('function switchW('),state.indexOf('function quickSwitchWeapon(')),c);
 for(let i=0;i<c.WEAPONS.length;i++){
  c.curW=i;c.ammo=c.WEAPONS[i].clip;c.uAmmo=10;c.weaponReserve[i]=10;
  c.gameSettings.infiniteAmmo=true;let result=c.grantWeapon(i,3);assert.equal(result.added,3);assert.equal(result.total,13);
  result=c.grantWeapon(i,100);assert.equal(result.added,100);assert.equal(result.total,113);assert.equal(c.weaponReserve[i],113);
  c.gameSettings.infiniteAmmo=false;assert.equal(c.weaponReserveValue(i),113);
  result=c.grantWeapon(i,3);assert.equal(result.total,116);
 }
 for(let i=1;i<c.WEAPONS.length;i++){
  c.curW=0;c.ammo=15;c.uAmmo=10;c.weaponOwned[i]=false;c.weaponReserve[i]=0;c.gameSettings.infiniteAmmo=true;
  let result=c.grantWeapon(i,3);assert.equal(result.first,true);assert.equal(c.curW,i);assert.equal(c.uAmmo,3);
  result=c.grantWeapon(i,100);assert.equal(result.total,103);
  c.switchW(0);c.switchW(i);c.gameSettings.infiniteAmmo=false;assert.equal(c.weaponReserveValue(i),103);c.syncCurrentAmmo();assert.equal(c.weaponReserve[i],103);
 }
});
