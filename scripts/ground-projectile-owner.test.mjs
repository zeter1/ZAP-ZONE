import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const combat=readFileSync(new URL('../src/combat/combat.js',import.meta.url),'utf8');
const engine=readFileSync(new URL('../src/core/engine.js',import.meta.url),'utf8');
function fn(source,name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);return source.slice(start).match(/^function [\s\S]*?\n\}/)[0];}
class Vec{
  constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}
  copy(v){Object.assign(this,{x:v.x,y:v.y,z:v.z});return this;}
  clone(){return new Vec().copy(this);}
  addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}
  subVectors(a,b){return this.copy(a).addScaledVector(b,-1);}
  length(){return Math.hypot(this.x,this.y,this.z);}
  multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
}
function fixture({wallDistance=Infinity,actorDistance=Infinity}={}){
  const events=[],floor={position:new Vec(0,-.04,0),geometry:{parameters:{width:220,height:220}}};
  const actor={team:'enemy'},c={THREE:{Vector3:Vec},arenaFloor:floor,wallMeshes:[],_rcWallHits:[],_UP:new Vec(0,1,0),
    _prev:new Vec(),_rc:{ray:{origin:new Vec(),direction:new Vec()},intersectObjects(_,__,hits){if(wallDistance<=this.far)hits.push({distance:wallDistance,point:this.ray.origin.clone().addScaledVector(this.ray.direction,wallDistance),object:{}});}},
    WEAPON_BY_KEY:Object.fromEntries(['pistol','shotgun','rifle','plasma','sniper'].map(key=>[key,{key,range:110,isSniper:key==='sniper'}])),WEAPONS:[{key:'pistol'}],PLR_TCOL:{sniper:1},plr:{piercing:false},pBullets:[],eBullets:[],enemies:[],dying:true,
    hitEnemy:()=>({en:Number.isFinite(actorDistance)?actor:null,dist:actorDistance}),hitPlayerByEnemyBullet:()=>Infinity,
    mapImpactMaterial:()=> 'concrete',weaponImpactType:w=>w.key,wallImpact:(p,col,mat,n)=>events.push({kind:'surface',pos:p.clone(),normal:n}),spawnCombatImpact(){},playSurfaceImpactSound(){},showGeneratedPlasmaImpactVfx:()=>events.push({kind:'plasma'}),
    tryProjectileWallPenetration:()=>{events.push({kind:'penetration'});return null;},rollProjectileRicochet:()=>{assert.fail('ground cannot ricochet');},
    resolvePlayerBulletHit:()=>events.push({kind:'actor'}),applyEnemyBulletToBot:()=>events.push({kind:'actor'}),playHitImpactSound(){},weaponDamageScaleAtDistance:()=>1,
    spawnInstantSniperTrace:(from,dir,distance)=>events.push({kind:'trace',distance}),
    destroyPlayerBullet:i=>c.pBullets.splice(i,1),destroyEnemyBullet:i=>c.eBullets.splice(i,1)};
  vm.createContext(c);
  if(engine.includes('function firstGroundHitDistance('))vm.runInContext(fn(engine,'firstGroundHitDistance'),c);
  if(combat.includes('function firstFirearmSurfaceHit('))vm.runInContext(fn(combat,'firstFirearmSurfaceHit'),c);
  vm.runInContext(fn(combat,'fireInstantSniper'),c);
  const start=combat.indexOf('  // Player firearm projectiles use swept'),end=combat.indexOf('  syncPlasmaFlightArt();',start);
  assert.ok(start>0&&end>start);
  vm.runInContext('function tick(dt){\n'+combat.slice(start,end)+'\n}',c);
  const bullet=key=>({wKey:key,pos:new Vec(0,.2,0),vel:new Vec(10,-10,0),life:2,maxLife:2,range:110,travel:0,wallPenetrations:0,ricochets:0,penetrationLeft:0,team:'ally',suppressedBot:true});
  return {c,events,bullet};
}
for(const key of ['pistol','shotgun','rifle','plasma'])for(const owner of ['player','bot'])test(`${owner} ${key} stops at first ground contact even across a long step`,()=>{
  const f=fixture(),arr=f.c[owner==='player'?'pBullets':'eBullets'];arr.push(f.bullet(key));f.c.tick(.1);
  assert.equal(arr.length,0);assert.equal(f.events.filter(e=>e.kind==='surface').length,1);
  const hit=f.events.find(e=>e.kind==='surface');assert.ok(Math.abs(hit.pos.y+.04)<1e-10);assert.ok(Math.abs(hit.pos.x-.24)<1e-10);assert.equal(hit.normal.y,1);
  assert.equal(f.events.some(e=>e.kind==='penetration'),false);assert.equal(f.events.some(e=>e.kind==='plasma'),key==='plasma');
  f.c.tick(.1);assert.equal(f.events.filter(e=>e.kind==='surface').length,1);
});
test('ground plane respects exact frame endpoint, direction, finite arena and short segments',()=>{
  const {c}=fixture();const down=new Vec(0,-1,0);
  assert.equal(c.firstGroundHitDistance(new Vec(0,.2,0),down,.24),.24);
  assert.equal(c.firstGroundHitDistance(new Vec(0,.2,0),down,.239),Infinity);
  assert.equal(c.firstGroundHitDistance(new Vec(0,.2,0),new Vec(0,1,0),2),Infinity);
  assert.equal(c.firstGroundHitDistance(new Vec(0,.2,0),new Vec(1,0,0),2),Infinity);
  assert.equal(c.firstGroundHitDistance(new Vec(111,.2,0),down,2),Infinity);
  assert.ok(Math.abs(c.firstGroundHitDistance(new Vec(110,.2,0),down,2)-.24)<1e-10);
  assert.equal(c.firstGroundHitDistance(new Vec(0,-.05,0),down,2),0);
});
test('nearest wall/ground order is independent of endpoint overshoot',()=>{
  for(const distance of [.1,2]){const {c}=fixture({wallDistance:distance});const hit=c.firstFirearmSurfaceHit(new Vec(0,.2,0),new Vec(0,-1,0),3);assert.equal(Boolean(hit.ground),distance>.24);assert.ok(Math.abs(hit.distance-Math.min(distance,.24))<1e-10);}
});
test('actors before ground take damage; actors below it cannot be hit',()=>{
  for(const actorDistance of [.1,2])for(const owner of ['player','bot']){
    const f=fixture({actorDistance}),arr=f.c[owner==='player'?'pBullets':'eBullets'];arr.push(f.bullet('plasma'));f.c.tick(.3);
    assert.equal(f.events.some(e=>e.kind==='actor'),actorDistance<.24);assert.equal(f.events.some(e=>e.kind==='surface'),actorDistance>.24);
  }
});
test('sniper hitscan stops exactly at floor including a contact closer than .6m',()=>{
  const {c,events}=fixture();c.fireInstantSniper(new Vec(0,.2,0),new Vec(0,-1,0),c.WEAPON_BY_KEY.sniper);
  assert.equal(events.find(e=>e.kind==='surface').pos.y,-.04);assert.ok(Math.abs(events.find(e=>e.kind==='trace').distance-.24)<1e-10);
});
test('piercing actor offset cannot teleport through floor; next step resolves one impact',()=>{
  const f=fixture({actorDistance:.30}),b=f.bullet('plasma');b.penetrationLeft=1;f.c.pBullets.push(b);f.c.tick(.1);
  assert.equal(f.c.pBullets.length,1);assert.ok(b.pos.y>-.04);
  f.c.hitEnemy=()=>({en:null,dist:Infinity});f.c.tick(.1);
  assert.equal(f.c.pBullets.length,0);assert.equal(f.events.filter(e=>e.kind==='surface').length,1);
});
test('shared real sniper trace producer used by bots clamps its line and emits floor impact',()=>{
  const f=fixture();let points;
  Object.assign(f.c.THREE,{BufferGeometry:class{setFromPoints(p){points=p;return this;}dispose(){}},LineBasicMaterial:class{dispose(){}},Line:class{}});
  Object.assign(f.c,{scene:{add(){},remove(){}},setTimeout(){}});
  vm.runInContext(fn(combat,'spawnInstantSniperTrace'),f.c);
  f.c.spawnInstantSniperTrace(new Vec(0,.2,0),new Vec(0,-1,0),10,1);
  assert.ok(Math.abs(points[1].y+.04)<1e-10);assert.ok(points[0].y>=points[1].y);
  assert.equal(f.events.filter(e=>e.kind==='surface').length,1);
});
