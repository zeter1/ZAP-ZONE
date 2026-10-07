import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const combat=readFileSync(resolve(root,'src/combat/combat.js'),'utf8');
const engine=readFileSync(resolve(root,'src/core/engine.js'),'utf8');
const sweepOwner=engine.slice(engine.indexOf('function sweepWallSphere('),engine.indexOf('// ─── WALL RAYCASTER'));
const movementOwner=combat.slice(combat.indexOf('function moveFragGrenade('),combat.indexOf('function tickBotGrenades('));
const catalog=readFileSync(resolve(root,'src/assets/catalog.js'),'utf8');
const owner=combat.slice(combat.indexOf('// Pack34: persistent grenade body projection'),combat.indexOf('// End Pack34 grenade body projection.'));
assert.ok(owner.length>1000,'actual owner must be extracted');
const mapping=catalog.slice(catalog.indexOf('function grenadeFlightPresentationFrame('),catalog.indexOf('function plasmaFlightPresentationFrame('));
class Vec{
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  copy(v){Object.assign(this,{x:v.x,y:v.y,z:v.z});return this;}
  clone(){return new Vec(this.x,this.y,this.z);}
  project(){this.x/=20;this.y/=20;this.z=.5;return this;}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
  distanceToSquared(v){return this.distanceTo(v)**2;}
}
function fixture(){
  const elements=[],probes=[],hidden=[];
  const layer={appendChild(el){elements.push(el);el.isConnected=true;}};
  const ctx={THREE:{Vector3:Vec},botGrenades:[],GAME_PRESENTATION_ASSETS_ENABLED:true,
    GAME_ASSETS:{presentationVfx:{pack34GrenadeWorld:'atlas.webp'}},
    gameAssetUrl:src=>src+'?v=test',innerWidth:1000,innerHeight:800,
    camera:{position:new Vec()},wallMeshes:[],blocked:false,
    G:id=>id==='projectile-trail-layer'?layer:null,
    suppressLegacyGrenadeMotionVfx:m=>hidden.push(m),
    Image:class{constructor(){probes.push(this);this.naturalWidth=0;this.naturalHeight=0;}},
    presentationAtlasFrame:(asset,col,row,cols,rows)=>({asset,col,row,cols,rows}),
    applyPresentationAtlasFrame:(el,frame)=>{el.frame=frame;},
    document:{createElement(){return{style:{},dataset:{},classList:{toggle(){}},setAttribute(){},remove(){this.isConnected=false;}};}}
  };
  ctx.wallBetween=()=>ctx.blocked;
  ctx.Math=Object.create(Math);ctx.Math.random=()=>{throw Error('presentation must not consume gameplay RNG');};
  vm.createContext(ctx);vm.runInContext(mapping+'\n'+owner,ctx);
  function grenade(){return{fuse:1.8,team:'ally',grounded:false,m:{parent:{},children:[{visible:true},{visible:false}],position:new Vec(0,1,-10),rotation:{x:0,z:.2}}};}
  function ready(){ctx.grenadeFlightPresentationAvailable();probes[0].naturalWidth=1024;probes[0].naturalHeight=512;probes[0].onload();}
  return{ctx,elements,probes,hidden,grenade,ready};
}
test('lazy one-shot decode probe retains procedural body during loading/failure',()=>{
  const f=fixture(),g=f.grenade();f.ctx.syncGrenadeFlightArt();assert.equal(f.probes.length,0);
  f.ctx.botGrenades.push(g);f.ctx.syncGrenadeFlightArt();f.ctx.syncGrenadeFlightArt();
  assert.equal(f.probes.length,1);assert.equal(f.probes[0].src,'atlas.webp?v=test');
  assert.equal(f.elements.length,0);assert.equal(g.m.children[0].visible,true);
  f.probes[0].onerror();f.ctx.syncGrenadeFlightArt();assert.equal(f.probes.length,1);
  assert.equal(g.m.children[0].visible,true);
});
test('decoded art follows real position, tumbles, uses bounded readable size',()=>{
  const f=fixture(),g=f.grenade();f.ready();f.ctx.botGrenades.push(g);f.ctx.syncGrenadeFlightArt();
  const el=f.elements[0];assert.equal(el.dataset.state,'flight');assert.equal(el.frame.col,3);
  assert.equal(el.style.visibility,'visible');assert.equal(el.style.left,'500.0px');
  assert.equal(g.m.children[0].visible,false);assert.equal(f.hidden[0],g.m);
  assert.ok(parseFloat(el.style.width)>=32&&parseFloat(el.style.width)<=108);
  g.m.position.x=4;g.m.rotation.x=1;f.ctx.syncGrenadeFlightArt();
  assert.equal(el.style.left,'600.0px');assert.equal(el.frame.col,0);assert.equal(el.frame.row,1);
});
test('actual resting state selects lying frame and retains body until fuse ends',()=>{
  const f=fixture(),g=f.grenade();f.ready();f.ctx.botGrenades.push(g);f.ctx.syncGrenadeFlightArt();
  g.grounded=true;g.fuse=.4;f.ctx.syncGrenadeFlightArt();
  const el=f.elements[0];assert.equal(el.dataset.state,'resting');assert.equal(el.frame.col,1);
  assert.equal(el.frame.row,0);assert.equal(el.style.transform,'translate(-50%,-50%) rotate(0.0deg)');
  g.fuse=0;f.ctx.syncGrenadeFlightArt();assert.equal(el.isConnected,false);assert.equal(g._grenadeFlightArt,null);
  assert.equal(g.m.children[0].visible,true);assert.equal(g.m.children[1].visible,false);
});
test('opaque walls hide projection and clearing obstruction reveals same body',()=>{
  const f=fixture(),g=f.grenade();f.ready();f.ctx.botGrenades.push(g);f.ctx.syncGrenadeFlightArt();
  f.ctx.blocked=true;f.ctx.syncGrenadeFlightArt();assert.equal(f.elements[0].style.visibility,'hidden');
  f.ctx.blocked=false;f.ctx.syncGrenadeFlightArt();assert.equal(f.elements[0].style.visibility,'visible');
  g.m.position.x=100;f.ctx.syncGrenadeFlightArt();assert.equal(f.elements[0].style.visibility,'hidden');
});
test('remove/restart restores visibility and recreates same-frame art without stale frame cache',()=>{
  const f=fixture(),g=f.grenade();f.ready();f.ctx.botGrenades.push(g);f.ctx.syncGrenadeFlightArt();
  f.ctx.clearGrenadeFlightArt();assert.equal(f.elements[0].isConnected,false);
  assert.equal(g.m.children[0].visible,true);f.ctx.syncGrenadeFlightArt();
  assert.equal(f.elements[1].frame.col,3);assert.equal(f.elements[1].style.visibility,'visible');
  f.ctx.botGrenades.length=0;f.ctx.syncGrenadeFlightArt();assert.equal(f.elements[1].isConnected,false);
});
test('unexpected atlas dimensions never hide the procedural fallback',()=>{
  const f=fixture(),g=f.grenade();f.ctx.botGrenades.push(g);f.ctx.syncGrenadeFlightArt();
  f.probes[0].naturalWidth=512;f.probes[0].naturalHeight=512;f.probes[0].onload();f.ctx.syncGrenadeFlightArt();
  assert.equal(f.elements.length,0);assert.equal(g.m.children[0].visible,true);
});
test('resting flag derives from actual physics; an upward bounce remains flight',()=>{
  const f=fixture();const physics=combat.slice(combat.indexOf('function tickBotGrenades(dt){'),combat.indexOf('function tickProjectiles(dt){'));
  Object.assign(f.ctx,{wallAABBs:[],showGeneratedGrenadeFuseVfx(){}});
  vm.runInContext(sweepOwner+movementOwner+physics,f.ctx);
  const g=f.grenade();Object.assign(g,{vx:1,vy:0,vz:0,rx:9.5,rz:8.2,bounces:0,fuse:10});g.m.position.y=.14;
  f.ctx.botGrenades.push(g);f.ctx.tickBotGrenades(1/120);assert.equal(g.grounded,true);assert.equal(g.vy,0);
  g.vy=-4;f.ctx.tickBotGrenades(1/120);assert.equal(g.grounded,false);assert.ok(g.vy>0);
  assert.ok(Math.abs(g.fuse-(10-2/120))<1e-10);
});


Vec.prototype.set=function(x,y,z){this.x=x;this.y=y;this.z=z;return this;};
Vec.prototype.normalize=function(){const len=Math.hypot(this.x,this.y,this.z)||1;this.x/=len;this.y/=len;this.z/=len;return this;};
Vec.prototype.multiplyScalar=function(s){this.x*=s;this.y*=s;this.z*=s;return this;};
Vec.prototype.addScaledVector=function(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;};
Vec.prototype.applyQuaternion=function(){return this;};
const settings=readFileSync(resolve(root,'src/settings/settings.js'),'utf8');
const balanceOwner=combat.slice(combat.indexOf('const FRAG_GRENADE_BLAST='),combat.indexOf('function activeBotFragGrenades('));
const throwOwner=combat.slice(combat.indexOf('function throwFragGrenade('),combat.indexOf('function throwSmokeGrenade('));
const damageOwner=combat.slice(combat.indexOf('function applyBlastDamage('),combat.indexOf('function detonateRocket('));
function throwFixture(){
  const ctx={THREE:{Vector3:Vec},curW:9,GRENADE_WEAPON_INDEX:9,MAX_PLAYER_FRAG_GRENADES:3,WEAPONS:Array.from({length:10},()=>({dmg:110,rate:.72,recoilY:.02})),sCD:0,reloading:false,dying:false,running:true,paused:false,lvlAnnOpen:false,perkPickOpen:false,botGrenades:[],camera:{position:new Vec(0,1.75,0),quaternion:{}},plr:{explosiveDamageM:1,explosiveRadiusM:1,recoilM:1},PLAYER_DAMAGE_BOOST:1,recoil:0,recoilPitch:0,ammoCount:2,ammoSpent:0,animationCalls:0,stops:0,fpGeneratedWeaponAction:null,
    G:()=>null,ownsWeapon:()=>true,weaponActionBlocked:()=>false,activePlayerFragGrenades:()=>0,
    weaponReserveValue:()=>2,testingInfiniteAmmoEnabled:()=>false,playerDamageMultiplier:()=>1,
    mkFragGrenade:()=>({position:new Vec()}),scene:{add(){}},wHUD(){},showMsg(){},updateWeaponBar(){},doReload(){}};
  ctx.weaponAmmoValue=()=>ctx.ammoCount;ctx.setWeaponAmmo=(_,n)=>{ctx.ammoSpent+=ctx.ammoCount-n;ctx.ammoCount=n;};
  ctx.showGeneratedGrenadeThrowVfx=()=>{ctx.animationCalls++;ctx.fpGeneratedWeaponAction={kind:'grenadeThrow34'};return true;};
  ctx.stopGeneratedFirstPersonAction=()=>{ctx.stops++;ctx.fpGeneratedWeaponAction=null;};
  vm.createContext(ctx);vm.runInContext(balanceOwner+'\n'+throwOwner,ctx);return ctx;
}
test('charge waits for release, caps at 1.1s, spends ammo exactly once at animation release',()=>{
  const c=throwFixture();c.beginFragGrenadeCharge();c.tickFragGrenadeCharge(8);
  assert.equal(c.botGrenades.length,0);assert.equal(c.ammoSpent,0);
  assert.equal(vm.runInContext('fragGrenadeCharge.age',c),1.1);
  c.releaseFragGrenadeCharge();assert.equal(c.animationCalls,1);assert.equal(c.botGrenades.length,0);
  c.tickPendingFragGrenadeThrow(.35);assert.equal(c.botGrenades.length,0);
  c.tickPendingFragGrenadeThrow(.02);c.tickPendingFragGrenadeThrow(1);
  assert.equal(c.botGrenades.length,1);assert.equal(c.ammoSpent,1);
  assert.equal(c.botGrenades[0].vz,-18);assert.equal(c.botGrenades[0].vy,8.2);assert.equal(c.botGrenades[0].fuse,1.82);
});
test('quick release preserves short throw; over-range strength is clamped',()=>{
  const c=throwFixture();c.beginFragGrenadeCharge();c.releaseFragGrenadeCharge();c.tickPendingFragGrenadeThrow(.4);
  assert.equal(c.botGrenades[0].vz,-11.6);assert.equal(c.botGrenades[0].vy,5.8);
  c.throwFragGrenade(true,999);assert.equal(c.botGrenades[1].vz,-18);assert.equal(c.botGrenades[1].vy,8.2);
});
test('switch, reload, death and pause cancel charged/pending throw without spending ammo',()=>{
  for(const [key,value] of [['curW',0],['reloading',true],['dying',true],['paused',true]]){
    const c=throwFixture();c.beginFragGrenadeCharge();c.tickFragGrenadeCharge(.4);c[key]=value;c.tickFragGrenadeCharge(.033);
    assert.equal(vm.runInContext('fragGrenadeCharge',c),null);assert.equal(c.ammoSpent,0);
    const d=throwFixture();d.beginFragGrenadeCharge();d.releaseFragGrenadeCharge();d[key]=value;d.tickPendingFragGrenadeThrow(.4);
    assert.equal(vm.runInContext('pendingFragGrenadeThrow',d),null);assert.equal(d.ammoSpent,0);assert.equal(d.botGrenades.length,0);assert.equal(d.stops,1);
  }
});
test('8m blast has 2m plateau, continuous falloff, cover and ally filtering; rockets retain old cover attenuation',()=>{
  const hits=[],c={plr:{maxHp:100},THREE:{Vector3:Vec},enemies:[],wallMeshes:['opaque'],losMeshes:['legacy'],camera:{position:new Vec(0,0,40)},dying:false,blocked:false,awardExplosionKill(){},applyDamageToPlayer(n){hits.push(['player',n]);}};
  c.wallBetween=(_,__,meshes)=>c.blocked&&meshes.length>0;
  const scale=combat.slice(combat.indexOf('const FRAG_GRENADE_BLAST='),combat.indexOf('let pendingFragGrenadeThrow='));
  vm.createContext(c);vm.runInContext(scale+'\n'+damageOwner,c);
  for(const [d,expected] of [[0,1],[2,1],[5,.5],[8,0],[9,0]])assert.equal(c.fragGrenadeDamageScale(d),expected);
  for(const [x,team] of [[1,'enemy'],[5,'enemy'],[8,'enemy'],[1,'ally']])c.enemies.push({alive:true,maxHp:100,team,group:{position:new Vec(x,-.9,0)},hurt(n){hits.push([x,team,n]);}});
  c.applyBlastDamage(new Vec(),8,100,'player',null,'grenade',.28);assert.deepEqual(hits,[[1,'enemy',80],[5,'enemy',40]]);
  hits.length=0;c.blocked=true;c.applyBlastDamage(new Vec(),8,100,'player',null,'grenade',.28);assert.deepEqual(hits,[]);
  c.applyBlastDamage(new Vec(),8,100,'player',null,'rocket',.28);assert.equal(hits[0][2],42);
});
test('ground crater matrix maps all four actual floor corners, changes perspective with distance',()=>{
  class GroundVec extends Vec{project(camera){this.x/=Math.max(.1,-this.z);this.y=(this.y-camera.position.y)/Math.max(.1,-this.z);this.z=.5;return this;}}
  const ctx={THREE:{Vector3:GroundVec},camera:{position:new Vec(0,1.75,0)},innerWidth:1000,innerHeight:800,wallMeshes:[],blocked:false};ctx.wallBetween=()=>ctx.blocked;
  vm.createContext(ctx);vm.runInContext(settings.slice(settings.indexOf('// Ground decals project'),settings.indexOf('function positionGeneratedCombatVfx(')),ctx);
  const item={el:{style:{}},worldPos:new Vec(0,.14,-8),spec:{worldSizeM:2.8,size:180},scale:1,rotation:0};
  ctx.positionGroundGrenadeDecal(item);assert.equal(item.el.style.visibility,'visible');assert.ok(item.el.style.transform.startsWith('matrix3d('));
  const matrix=item.el.style.transform.slice(9,-1).split(',').map(Number);
  for(const [u,v] of [[0,0],[1,0],[1,1],[0,1]]){
    const point=new GroundVec((u*2-1)*1.4,-.025,-8+(v*2-1)*1.4).project(ctx.camera);
    const x=u*180,y=v*180,w=matrix[3]*x+matrix[7]*y+matrix[15];
    assert.ok(Math.abs((matrix[0]*x+matrix[4]*y+matrix[12])/w-(point.x*.5+.5)*1000)<.01);
    assert.ok(Math.abs((matrix[1]*x+matrix[5]*y+matrix[13])/w-(-point.y*.5+.5)*800)<.01);
  }
  const original=item.el.style.transform;item.worldPos.z=-16;ctx.positionGroundGrenadeDecal(item);assert.notEqual(item.el.style.transform,original);
  ctx.blocked=true;ctx.positionGroundGrenadeDecal(item);assert.equal(item.el.style.visibility,'hidden');
});

test('ordinary impact pressure cannot evict the 15-second ground crater',()=>{
  const ctx={THREE:{Vector3:Vec},generatedCombatVfx:[],GENERATED_COMBAT_VFX_LIMIT:18,
    generatedCombatVfxSpec:kind=>kind==='grenadeScorch34'?{groundPlane:true,size:180,duration:15,coolAfter:.65,frames:2,fadeSeconds:2}:{size:100,frames:4,duration:.5},
    generatedCombatVfxFrame:()=>({}),applyPresentationAtlasFrame(){},positionGeneratedCombatVfx(){},ensureGeneratedCombatVfxLayer:()=>({appendChild(){}}),
    document:{createElement:()=>({style:{},dataset:{},removed:false,remove(){this.removed=true;}})}};
  vm.createContext(ctx);
  const remove=settings.slice(settings.indexOf('function removeGeneratedCombatVfx('),settings.indexOf('function playGeneratedCombatVfx('));
  const play=settings.slice(settings.indexOf('function playGeneratedCombatVfx('),settings.indexOf('// Ground decals project'));
  const tick=settings.slice(settings.indexOf('function tickGeneratedCombatVfx('),settings.indexOf('// A new atlas must actually load'));
  vm.runInContext(remove+play+tick,ctx);ctx.playGeneratedCombatVfx('grenadeScorch34',{worldPos:new Vec()});const crater=ctx.generatedCombatVfx[0];
  for(let i=0;i<150;i++)ctx.playGeneratedCombatVfx('techImpact29');
  assert.equal(crater.el.removed,false);assert.equal(ctx.generatedCombatVfx.filter(v=>!v.spec.groundPlane).length,18);
  for(let i=0;i<260;i++)ctx.tickGeneratedCombatVfx(.05);
  assert.equal(crater.frame,1);assert.equal(crater.el.removed,false);assert.ok(Number(crater.el.style.opacity)>.99);
  for(let i=0;i<41;i++)ctx.tickGeneratedCombatVfx(.05);
  assert.equal(crater.el.removed,true);assert.equal(ctx.generatedCombatVfx.length,0);
});

test('grenade damage is 80% of each target max HP, independent of damage buffs and self multiplier',()=>{
  const hits=[],c={THREE:{Vector3:Vec},plr:{maxHp:150},enemies:[],wallMeshes:[],losMeshes:[],camera:{position:new Vec(0,0,0)},dying:false,wallBetween:()=>false,awardExplosionKill(){},applyDamageToPlayer(n){hits.push(n);}};
  vm.createContext(c);vm.runInContext(combat.slice(combat.indexOf('const FRAG_GRENADE_BLAST='),combat.indexOf('let pendingFragGrenadeThrow='))+damageOwner,c);
  c.enemies.push({alive:true,maxHp:250,team:'enemy',group:{position:new Vec(0,-.9,0)},hurt(n){hits.push(n);}});
  c.applyBlastDamage(new Vec(),8,9999,'player',null,'grenade',.28);
  assert.deepEqual(hits,[200,120]);
});
test('actual player damage owner caps grenade armor reduction at 10%, including low armor and damage/resistance perks',()=>{
  const source=readFileSync(resolve(root,'src/progression/progression.js'),'utf8');
  const owner=source.slice(source.indexOf('function damageLabel('),source.indexOf('// ─── HUD'));
  for(const [initialArmor,expectedHp,expectedArmor] of [[0,20,0],[100,28,92],[3,23,0]]){
    const c={hp:100,armor:initialArmor,dying:false,respawnShieldT:0,gameSettings:{invincible:false},plr:{maxHp:100,blastResist:.9,bulletResist:.9,thorns:false},FRAG_GRENADE_BLAST:{armorReduction:.1},PLAYER_BULLET_DAMAGE_SCALE:.1,hitSlowDur:0,hitSlowT:0,hitSlowMul:0,deathReason:'',showArmorHitFx(){},showArmorBreakFx(){},showDamageDirection(){},playSfx(){},triggerScreenShake(){},markHUD(){},trigFlash(){},checkDeath(){}};
    vm.createContext(c);vm.runInContext(owner,c);assert.equal(c.applyDamageToPlayer(80,'grenade'),100-expectedHp);
    assert.equal(c.hp,expectedHp);assert.equal(c.armor,expectedArmor);
  }
});
test('swept 3D grenade contact clears wall tops, bounces off a thin wall, settles on roof and handles starting overlap',()=>{
  const c={wallAABBs:[{min:{x:1,y:0,z:-1},max:{x:1.08,y:2,z:1}}]};
  vm.createContext(c);vm.runInContext(sweepOwner+movementOwner,c);
  assert.equal(c.sweepWallSphere(new Vec(0,2.5,0),new Vec(4,2.5,0),.14),null);
  const hit=c.sweepWallSphere(new Vec(0,1,0),new Vec(4,1,0),.14);assert.equal(hit.axis,'x');assert.equal(hit.sign,-1);assert.ok(Math.abs(hit.t-.215)<1e-9);
  const g={m:{position:new Vec(0,1,0)},vx:18,vy:0,vz:0,bounces:0};c.moveFragGrenade(g,.1);assert.ok(g.vx<0);assert.ok(g.m.position.x<.86);assert.equal(g.bounces,1);
  const roof={m:{position:new Vec(1.04,3,0)},vx:0,vy:-8,vz:0,bounces:0};c.moveFragGrenade(roof,.2);assert.ok(roof.vy>0);assert.ok(roof.m.position.y>=2.14);
  roof.m.position.y=2.1401;roof.vy=-.15;c.moveFragGrenade(roof,1/120);assert.equal(roof.grounded,true);assert.equal(roof.vy,0);assert.ok(roof.m.position.y>=2.14);
  const overlap={m:{position:new Vec(1.04,1,0)},vx:1,vy:0,vz:0,bounces:0};c.moveFragGrenade(overlap,.02);assert.ok(overlap.m.position.x<.86||overlap.m.position.x>1.22);
});

test('surface-aware detonation creates a roof crater at its real height and no crater for an air burst',()=>{
  const calls=[],c={grenadePresentationAssetReady34:()=>true,playGeneratedCombatVfx:(kind,options)=>{calls.push({kind,options});return true;}};
  vm.createContext(c);vm.runInContext(settings.slice(settings.indexOf('function showGeneratedFragGrenadeVfx('),settings.indexOf('function suppressLegacyGrenadeMotionVfx(')),c);
  c.showGeneratedFragGrenadeVfx(new Vec(1,3.14,2),3);assert.equal(calls.length,4);assert.equal(calls.at(-1).options.groundY,3);
  calls.length=0;c.showGeneratedFragGrenadeVfx(new Vec(1,5,2),null);assert.equal(calls.length,3);assert.ok(calls.every(v=>!v.kind.includes('Scorch')));
});

test('slow roof contact then same-tick edge exit detonates as air burst, never a floating crater',()=>{
  const calls=[],c={THREE:{Vector3:Vec},wallAABBs:[{min:{x:0,y:0,z:-1},max:{x:1,y:2,z:1}}],botGrenades:[],camera:{position:new Vec(0,5,10)},playExplosionSound(){},triggerScreenShake(){},explode(){},spawnCombatImpact(){},applyBlastDamage(){},destroySceneObject(){},showGeneratedFragGrenadeVfx:(_,groundY)=>calls.push(groundY)};
  vm.createContext(c);vm.runInContext(sweepOwner+movementOwner+combat.slice(combat.indexOf('function tickBotGrenades('),combat.indexOf('function tickProjectiles(')),c);
  const g={m:{position:new Vec(.99,2.1401,0),rotation:{x:0,z:0}},vx:18,vy:0,vz:0,rx:0,rz:0,fuse:.02,bounces:0,radius:8,dmg:0,ownerType:'player',team:'ally'};c.botGrenades.push(g);c.tickBotGrenades(.033);
  assert.ok(g.m.position.x>1.14);assert.equal(g.grounded,false);assert.deepEqual(calls,[null]);assert.equal(c.botGrenades.length,0);
});
