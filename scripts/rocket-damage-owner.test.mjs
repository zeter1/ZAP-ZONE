import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const combat=readFileSync(resolve(root,'src/combat/combat.js'),'utf8');
const progression=readFileSync(resolve(root,'src/progression/progression.js'),'utf8');
function fn(source,name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);const next=source.indexOf('\nfunction ',start+1);return source.slice(start,next<0?source.length:next);}
class Vec{
  constructor(x=0,y=0,z=0){this.set(x,y,z);}
  set(x,y,z){Object.assign(this,{x,y,z});return this;}
  clone(){return new Vec(this.x,this.y,this.z);}
  copy(v){return this.set(v.x,v.y,v.z);}
  sub(v){return this.set(this.x-v.x,this.y-v.y,this.z-v.z);}
  addScaledVector(v,s){return this.set(this.x+v.x*s,this.y+v.y*s,this.z+v.z*s);}
  normalize(){const n=Math.hypot(this.x,this.y,this.z)||1;return this.set(this.x/n,this.y/n,this.z/n);}
  distanceToSquared(v){return (this.x-v.x)**2+(this.y-v.y)**2+(this.z-v.z)**2;}
  distanceTo(v){return Math.sqrt(this.distanceToSquared(v));}
}
function bot(hp,x=0,team='enemy'){
  return{hp,maxHp:hp,team,alive:true,group:{position:new Vec(x,0,-10)},hits:[],hurt(dmg,dir,from,source){this.hits.push({dmg,from,source});this.hp-=dmg;if(this.hp<=0)this.alive=false;}};
}
function fixture(){
  const awards=[],playerDamage=[];
  const c={THREE:{Vector3:Vec},enemies:[],camera:{position:new Vec(50,1.6,0)},dying:false,
    wallMeshes:[],losMeshes:[],plr:{maxHp:100},FRAG_GRENADE_BLAST:{healthFraction:.8},
    wallBetween:()=>false,fragGrenadeDamageScale:(d,r)=>Math.max(0,1-d/r),
    awardExplosionKill:(...args)=>awards.push(args),applyDamageToPlayer:(...args)=>playerDamage.push(args)};
  vm.createContext(c);vm.runInContext(fn(combat,'applyBlastDamage'),c);
  return{c,awards,playerDamage};
}
test('accepted direct target with 10000HP dies once; nearby target retains splash falloff',()=>{
  const f=fixture(),target=bot(10000),nearby=bot(10000,4);f.c.enemies=[target,nearby];
  f.c.applyBlastDamage(new Vec(0,.5,-10),6.5,155,'player',null,'rocket',.28,'ally',target);
  assert.equal(target.alive,false);assert.equal(target.hp,0);assert.equal(target.hits.length,1);
  assert.equal(target.hits[0].source,'player');assert.equal(f.awards.length,1);assert.equal(f.awards[0][0],target);
  assert.equal(nearby.alive,true);assert.ok(nearby.hits[0].dmg>0&&nearby.hits[0].dmg<155);
});
test('expanded 9.1m rocket blast damages actors beyond old radius, but never beyond new boundary',()=>{
 for(const ownerType of ['player','bot']){
  const f=fixture(),inside=bot(10000,8.5),outside=bot(10000,9.2);f.c.enemies=[inside,outside];
  f.c.applyBlastDamage(new Vec(0,.9,-10),9.1,155,ownerType,null,'rocket',.28,'ally');
  assert.equal(inside.hits.length,1);assert.ok(inside.hp<10000&&inside.alive);assert.equal(outside.hits.length,0);
 }
});
test('direct bot rocket kills hostile bot; allies and shooter cannot receive direct damage',()=>{
  const f=fixture(),shooter=bot(900,0,'enemy'),ally=bot(900,1,'enemy'),target=bot(900,2,'ally');f.c.enemies=[shooter,ally,target];
  f.c.applyBlastDamage(new Vec(2,.5,-10),6.5,155,'bot',shooter,'rocket',.28,'enemy',target);
  assert.equal(target.alive,false);assert.equal(f.awards.length,1);assert.equal(shooter.hits.length,0);assert.equal(ally.hits.length,0);
  f.c.applyBlastDamage(new Vec(1,.5,-10),6.5,155,'bot',shooter,'rocket',.28,'enemy',ally);
  assert.equal(ally.hits.length,0);assert.equal(f.awards.length,1);
});
test('wall/ground/lifetime explosion without accepted target retains covered splash',()=>{
  const f=fixture(),target=bot(10000);f.c.enemies=[target];f.c.wallBetween=()=>true;
  f.c.applyBlastDamage(new Vec(0,.5,-10),6.5,155,'player',null,'rocket',.28,'ally');
  assert.equal(target.alive,true);assert.ok(target.hits[0].dmg<155*.48);assert.equal(f.awards.length,0);
});
test('direct flag affects rockets only and self-splash is never promoted to direct',()=>{
  const f=fixture(),target=bot(10000);f.c.enemies=[target];
  f.c.applyBlastDamage(new Vec(0,.5,-10),8,155,'player',null,'grenade',.28,'ally',target);
  assert.equal(target.alive,true);assert.ok(target.hits[0].dmg<8000);
  f.c.camera.position=new Vec(0,1.6,-10);
  f.c.applyBlastDamage(new Vec(0,.5,-10),6.5,155,'player',null,'rocket',.28,'ally',target);
  assert.equal(f.playerDamage.at(-1)[3],false);
  f.c.applyBlastDamage(new Vec(0,.5,-10),6.5,155,'bot',null,'rocket',.28,'enemy','player');
  assert.equal(f.playerDamage.at(-1)[3],true);
});
function collisionFixture(){
  const f=fixture(),c=f.c;
  Object.assign(c,{eRkts:[],pRkts:[],deathCamActive:false,PERF_MODE:false,spawnSmoke(){},spawnP(){},
    rocketPresentationAssetReady35:()=>true,rocketWallImpactSurface:()=>({}),playExplosionSound(){},triggerScreenShake(){},
    spawnCombatImpact(){},showGeneratedRocketExplosionVfx(){},explode(){},destroySceneObject(){}});
  vm.runInContext(fn(combat,'detonateRocket'),c);
  c._UP=new Vec(0,1,0);c.playerRocketShotCD=0;vm.runInContext(fn(combat,'tickRocketFireCooldowns'),c);c.rocketWallContact=()=>c.blockedWall?{t:0,pos:new Vec(0,.5,-9.9),directTarget:null}:null;
  vm.runInContext(fn(combat,'rocketActorContact'),c);vm.runInContext(fn(combat,'firstRocketContact'),c);
  const start=combat.indexOf('function tickProjectiles(dt){'),end=combat.indexOf('  syncRocketFlightArt();',start);
  vm.runInContext(combat.slice(start,end)+'}',c);
  f.rocket=(x=0,ownerType='player',team='ally')=>({life:3,dmg:155,blastRadius:6.5,ownerType,team,vx:0,vy:0,vz:-10,m:{position:new Vec(x,.5,-9.9),userData:{},quaternion:{setFromUnitVectors(){}}}});
  return f;
}
test('real projectile collision forwards direct target; wall precedence and expiry never do',()=>{
  for(const reason of ['body','wall','ground','expiry']){
    const f=collisionFixture(),target=bot(10000),rocket=f.rocket();f.c.enemies=[target];f.c.pRkts=[rocket];
    if(reason==='wall')f.c.blockedWall=true;
    if(reason==='ground')rocket.m.position.y=.1;
    if(reason==='expiry'){rocket.life=0;target.group.position.x=3;}
    f.c.tickProjectiles(.01);
    assert.equal(f.c.pRkts.length,0,reason);assert.equal(target.alive,reason!=='body',reason);
    assert.equal(f.awards.length,reason==='body'?1:0,reason);
  }
});
test('both bot teams collide with player; only hostile rocket forwards lethal damage',()=>{
  for(const team of ['enemy','ally']){
    const f=collisionFixture(),r=f.rocket(0,'bot',team);f.c.camera.position=new Vec(0,.5,-10);f.c.eRkts=[r];f.c.tickProjectiles(.01);
    assert.equal(f.c.eRkts.length,0);
    assert.equal(f.playerDamage.length,team==='enemy'?1:0);
    if(team==='enemy')assert.equal(f.playerDamage[0][3],true);
  }
});
function playerFixture(){
  const c={hp:10000,armor:10000,dying:false,respawnShieldT:0,gameSettings:{invincible:false},plr:{maxHp:10000,blastResist:.95,secondWind:false},
    PLAYER_ROCKET_DAMAGE_SCALE:.24,FRAG_GRENADE_BLAST:{armorReduction:.1},camera:{position:new Vec()},THREE:{Vector3:Vec},
    showArmorHitFx(){},showArmorBreakFx(){},showDamageDirection(){},playSfx(){},triggerScreenShake(){},damageLabel:()=> 'ракета',
    markHUD(){},trigFlash(){},checkDeath(){if(this.hp<=0)this.dying=true;},showSecondWindFx(){},showAnn(){},showMsg(){},updateStats(){}};
  // checkDeath is invoked as a global function, so bind its fixture state explicitly.
  c.checkDeath=()=>{if(c.hp<=0)c.dying=true;};vm.createContext(c);vm.runInContext(fn(progression,'applyDamageToPlayer'),c);return c;
}
test('direct player hit is lethal despite high HP, armor and blast resistance; splash stays scaled',()=>{
  const c=playerFixture();c.applyDamageToPlayer(155,'rocket',null);assert.ok(c.hp>9900);assert.equal(c.dying,false);
  c.applyDamageToPlayer(155,'rocket',null,true);assert.equal(c.hp,0);assert.equal(c.dying,true);
});
test('existing spawn shield and second wind retain their protection from lethal contact',()=>{
  const c=playerFixture();c.respawnShieldT=1;assert.equal(c.applyDamageToPlayer(155,'rocket',null,true),0);assert.equal(c.hp,10000);
  c.respawnShieldT=0;c.plr.secondWind=true;c.plr.secondWindReady=true;c.applyDamageToPlayer(155,'rocket',null,true);
  assert.equal(c.plr.secondWindReady,false);assert.equal(c.hp,3500);assert.equal(c.respawnShieldT,2);assert.equal(c.dying,false);
});
