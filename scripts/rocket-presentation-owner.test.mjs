import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const catalog=read('src/assets/catalog.js'),combat=read('src/combat/combat.js');
const settings=read('src/settings/settings.js'),system=read('src/weapons/system.js');
const engine=read('src/core/engine.js');
function fn(source,name){
  const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);
  const next=source.indexOf('\nfunction ',start+1);
  return source.slice(start,next<0?source.length:next);
}
class Vec{
  constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}
  set(x,y,z){Object.assign(this,{x,y,z});return this;}
  copy(v){return this.set(v.x,v.y,v.z);}
  clone(){return new Vec(this.x,this.y,this.z);}
  project(){this.x/=20;this.y/=20;this.z=.5;return this;}
  length(){return Math.hypot(this.x,this.y,this.z);}
  multiplyScalar(n){this.x*=n;this.y*=n;this.z*=n;return this;}
  sub(v){return this.set(this.x-v.x,this.y-v.y,this.z-v.z);}
  dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}
  normalize(){return this.multiplyScalar(1/(this.length()||1));}
  addScaledVector(v,n){this.x+=v.x*n;this.y+=v.y*n;this.z+=v.z*n;return this;}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
}
function fixture(){
  const probes=[],elements=[],calls=[];
  const layer={appendChild(el){el.isConnected=true;elements.push(el);}};
  const doc={documentElement:{classList:{add(){}},style:{setProperty(){}}},querySelectorAll:()=>[],baseURI:'https://game.test/',getElementById:id=>id==='projectile-trail-layer'?layer:null,
    createElement(){return{style:{setProperty(k,v){this[k]=v;}},classList:{toggle(){}},remove(){this.isConnected=false;}};}};
  const c={location:{protocol:'https:'},window:{},document:doc,URL,Image:class{constructor(){probes.push(this);this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}},
    THREE:{Vector3:Vec,TextureLoader:class{}},innerWidth:1000,innerHeight:800,camera:{position:new Vec(),fov:60},wallMeshes:[],
    pRkts:[],eRkts:[],blocked:false,applyPresentationAtlasFrame:(el,frame)=>{el.frame=frame;},
    playGeneratedCombatVfx:(kind,options)=>{calls.push({kind,options});return true;}};
  c.wallBetween=(_from,_to,list)=>{assert.equal(list,c.wallMeshes);return c.blocked;};
  let rng=0;c.Math=Object.create(Math);c.Math.random=()=>{rng++;return .5;};
  vm.createContext(c);vm.runInContext(catalog,c);c.applyPresentationAtlasFrame=(el,frame)=>{el.frame=frame;};
  const ready=(key,w,h)=>{c.rocketPresentationAssetReady35(key);const p=probes.at(-1);p.complete=true;p.naturalWidth=w;p.naturalHeight=h;return p;};
  return{c,probes,elements,calls,ready,rng:()=>rng};
}
test('strict lazy one-shot dimensions retain failed/loading fallback',()=>{
  const f=fixture();assert.equal(f.probes.length,0);
  assert.equal(f.c.rocketPresentationAssetReady35('pack35RocketEffects'),false);
  f.c.rocketPresentationAssetReady35('pack35RocketEffects');assert.equal(f.probes.length,1);
  Object.assign(f.probes[0],{complete:true,naturalWidth:1024,naturalHeight:512});
  assert.equal(f.c.rocketPresentationAssetReady35('pack35RocketEffects'),false);
  f.c.rocketPresentationAssetReady35('pack35RocketEffects');assert.equal(f.probes.length,1);
  f.probes[0].naturalHeight=1024;assert.equal(f.c.rocketPresentationAssetReady35('pack35RocketEffects'),true);
});
test('rocket has exactly one player muzzle owner for decoded/failed ready and effects',()=>{
 const start=combat.indexOf('  const suppressPlayerMuzzleVisual='),end=combat.indexOf('  const bDir=',start);
 for(const active of [false,true])for(const ready of [false,true]){
  const c={w:{key:'rocket'},fpGeneratedWeaponActive:active,rocketPresentationAssetReady35:()=>ready,flashM:{material:{opacity:0}},beamM:{material:{opacity:0}},beamT:0,FP_MUZZLE_FLASH_SECONDS:.12};
  vm.createContext(c);vm.runInContext(combat.slice(start,end),c);assert.equal(c.flashM.material.opacity,active&&ready?0:1);
 }
});
test('reload sequence and effects rows match independently enumerated source cells',()=>{
  const f=fixture(),c=f.c;
  assert.match(vm.runInContext('GAME_ASSETS.generatedFirstPersonWeapons.rocket',c),/player-rocket-fps-35\.webp$/);
  assert.match(vm.runInContext('GAME_ASSETS.generatedFirstPersonWeaponFallbacks.rocket',c),/player-rocket-fps-01\.webp$/);
  assert.match(vm.runInContext('GAME_ASSETS.generatedWorldWeaponPickups.rocket',c),/world-rocket-pickup-35\.webp$/);
  assert.deepEqual(Array.from(c.generatedCombatVfxSpec('rocketReload35').sequence),[5,1,2,3,4,5]);
  for(const [i,col,row] of [[0,2,1],[1,1,0],[2,2,0],[3,0,1],[4,1,1],[5,2,1]]){
    const frame=c.generatedCombatVfxFrame('rocketReload35',i);assert.equal(frame.col,col);assert.equal(frame.row,row);
  }
  for(const [kind,row] of [['rocketMuzzle35',0],['rocketExplosion35',2],['rocketResidual35',3]]){
    const frame=c.generatedCombatVfxFrame(kind,0);assert.equal(frame.row,row);
  }
  assert.equal(c.generatedCombatVfxSpec('rocketScorch35').duration,15);
});
test('new ready reload holds its own image until action decode and retains authoritative duration',()=>{
  const f=fixture(),c=f.c;let selected;
  c.fpGeneratedWeaponActive=true;c.document.getElementById=()=>({dataset:{rocketPack:'35'}});
  c.playGeneratedFirstPersonAction=(kind,duration)=>{selected={kind,duration};return true;};
  vm.runInContext(fn(system,'showGeneratedRocketReloadVfx'),c);
  c.showGeneratedRocketReloadVfx(3.07);assert.deepEqual(selected,{kind:'rocketReloadHold35',duration:3.07});
  Object.assign(f.probes[0],{complete:true,naturalWidth:2304,naturalHeight:1152});
  c.showGeneratedRocketReloadVfx(3.07);assert.equal(selected.kind,'rocketReload35');
  c.document.getElementById=()=>({dataset:{rocketPack:'01'}});
  c.showGeneratedRocketReloadVfx(2.85);assert.equal(selected.kind,'rocketReload24');
  c.fpGeneratedWeaponActive=false;assert.equal(c.showGeneratedRocketReloadVfx(),false);
});
const flight=combat.slice(combat.indexOf('const ROCKET_FLIGHT_VFX_LOOP'),combat.indexOf('const PLASMA_FLIGHT_VFX_LOOP'));
function flightFixture(){const f=fixture();vm.runInContext(flight,f.c);f.rocket=()=>({fT:0,vx:10,vy:0,vz:0,ownerType:'player',m:{position:new Vec(0,1,-10),children:[{visible:true},{visible:false}]}});return f;}
test('3D body stays visible before/after decode; atlas adds only exhaust without RNG',()=>{
  const f=flightFixture(),r=f.rocket();f.c.pRkts.push(r);f.c.syncRocketFlightArt();
  assert.equal(r.m.children[0].visible,true);assert.equal(f.probes.length,1);
  Object.assign(f.probes[0],{complete:true,naturalWidth:1024,naturalHeight:1024});
  f.c.syncRocketFlightArt();assert.equal(r.m.children[0].visible,true);
  assert.equal(f.elements[0].style.left,'500.0px');assert.equal(f.elements[0].style.visibility,'visible');
  r.m.position.x=4;r.fT=.125;f.c.syncRocketFlightArt();assert.equal(f.elements[0].style.left,'600.0px');
  assert.equal(f.elements[0].frame.row,1);assert.equal(f.elements[0].frame.col,2);
  assert.ok(parseFloat(f.elements[0].style['--rocket-flight-size'])<=160);assert.equal(f.rng(),0);
});
test('flight wall/offscreen hide, removal restores original meshes, same frame recreation is fresh',()=>{
  const f=flightFixture(),r=f.rocket();f.ready('pack35RocketEffects',1024,1024);f.c.pRkts.push(r);f.c.syncRocketFlightArt();
  f.c.blocked=true;f.c.syncRocketFlightArt();assert.equal(f.elements[0].style.visibility,'hidden');
  f.c.blocked=false;r.m.position.x=100;f.c.syncRocketFlightArt();assert.equal(f.elements[0].style.visibility,'hidden');
  f.c.pRkts.length=0;f.c.syncRocketFlightArt();assert.equal(f.elements[0].isConnected,false);
  assert.equal(r._flightArt,null);assert.deepEqual(r.m.children.map(m=>m.visible),[true,false]);
  r.m.position.x=0;f.c.pRkts.push(r);f.c.syncRocketFlightArt();assert.ok(f.elements[1].frame);
  f.probes[0].naturalWidth=0;f.c.syncRocketFlightArt();assert.equal(r.m.children[0].visible,true);
});
test('new repeated four flight cells consume authoritative elapsed fT; legacy12 helper remains',()=>{
  const f=flightFixture();for(const [t,i] of [[0,0],[.0625,1],[.125,2],[.1875,3],[.25,0],[2.125,2]])assert.equal(f.c.rocketFlightFrameIndex35({fT:t}),i);
  assert.equal(f.c.rocketFlightFrameIndex({fT:0}),0);assert.equal(f.c.rocketFlightFrameIndex({fT:.135}),3);
});
test('axial missile retains 3D body and hides side-on exhaust instead of drawing a sideways rocket',()=>{
  const f=flightFixture(),r=f.rocket();f.ready('pack35RocketEffects',1024,1024);r.vx=0;r.vy=1;r.vz=-10;
  f.c.pRkts.push(r);f.c.syncRocketFlightArt();assert.equal(f.elements[0].style.visibility,'hidden');assert.equal(r.m.children[0].visible,true);
});
test('ready bore points at the reticle and both arm exits stay outside wide and tall viewports',()=>{
  const c={};vm.createContext(c);vm.runInContext(fn(system,'rocketPresentationLayout'),c);
  for(const legacy of [false,true])for(const [w,h]of [[1920,1080],[1600,900],[1200,1000],[1280,720],[768,1024]])for(const [scale,dx,dy]of [[1,0,0],[1.032,34,34],[.975,-18,-12]]){
    const l=c.rocketPresentationLayout(w,h,scale,dx,dy,legacy),angle=l.rotation*Math.PI/180,mx=legacy?.34:.315,my=legacy?.35:.36;
    const x=l.left+l.width*mx+dx,y=l.top+l.height*my+dy;
    const bore=angle-(legacy?149:152)*Math.PI/180,target=Math.atan2(h*.5-y,w*.5-x);
    assert.ok(Math.abs(bore-target)<1e-9);assert.ok(x<w&&y<h,'muzzle must remain inside '+w+'x'+h);
    const point=(u,v)=>({x:x+scale*((u-mx)*l.width*Math.cos(angle)-(v-my)*l.height*Math.sin(angle)),y:y+scale*((u-mx)*l.width*Math.sin(angle)+(v-my)*l.height*Math.cos(angle))});
    for(const u of [.23,.55])assert.ok(point(u,1).y>=h+23.9,'bottom cuff '+w+'x'+h);
    for(const v of [.88,1])assert.ok(point(1,v).x>=w+23.9,'right cuff '+w+'x'+h);
  }
});
test('impact always keeps one historical random draw and floor scorch requires physics fact',()=>{
  const f=fixture();vm.runInContext(fn(settings,'showGeneratedRocketExplosionVfx'),f.c);
  assert.equal(f.c.showGeneratedRocketExplosionVfx(new Vec(1,.1,2)),false);assert.equal(f.calls.length,0);assert.equal(f.rng(),1);
  Object.assign(f.probes[0],{complete:true,naturalWidth:1024,naturalHeight:1024});
  f.ready('pack35RocketScorch',512,512);f.calls.length=0;
  f.c.showGeneratedRocketExplosionVfx(new Vec(1,.1,2),false);assert.deepEqual(f.calls.map(v=>v.kind),['rocketExplosion35','rocketResidual35']);
  f.calls.length=0;f.c.showGeneratedRocketExplosionVfx(new Vec(1,.1,2),true);
  assert.deepEqual(f.calls.map(v=>v.kind),['rocketExplosion35','rocketResidual35','rocketScorch35']);assert.equal(f.rng(),3);
  for(const call of f.calls){assert.equal(call.options.worldPos.x,1);assert.equal(call.options.worldPos.z,2);}
  assert.equal(f.c.generatedCombatVfxSpec('rocketExplosion35').occlude,true);assert.equal(f.c.generatedCombatVfxSpec('rocketResidual35').occlude,true);
});
test('rocket detonation never publishes retired impact burst, ring or full-screen shockwave',()=>{
 for(const ownerType of ['player','bot'])for(const decoded of [true,false]){
  const calls=[],r={ownerType,blastRadius:9.1,dmg:155,m:{}},arr=[r];
  const c={THREE:{Vector3:Vec},camera:{position:new Vec()},playExplosionSound(){},triggerScreenShake(){},
   spawnCombatImpact(){assert.fail('retired impact burst')},showGeneratedRocketExplosionVfx:()=>decoded,
   explode:(...args)=>calls.push(args),applyBlastDamage(){},destroySceneObject(){}};
  vm.createContext(c);vm.runInContext(fn(combat,'detonateRocket'),c);c.detonateRocket(arr,0,r,new Vec(1,0,0));
  assert.equal(arr.length,0);assert.equal(calls.length,1);assert.equal(calls[0][2],9.1);
  assert.equal(calls[0][3],false);assert.equal(calls[0][4],decoded?false:'particles');
 }
});
test('particles-only explosion fallback never emits the old ring but keeps existing boolean modes and RNG',()=>{
 for(const low of [false,true])for(const mode of [true,false,'particles']){
  let particles=0,smoke=0,sparks=0,rings=0,rng=0;
  const c={MOBILE_LOW:low,VISUAL_LIGHTS:false,spawnP(){particles++;},spawnSmoke(){smoke++;},spawnSpark(){sparks++;},spawnExplosionFx(){rings++;},Math:Object.assign(Object.create(Math),{random(){rng++;return .5;}})};
  vm.createContext(c);vm.runInContext(fn(engine,'explode'),c);c.explode(new Vec(),0xff8800,9.1,false,mode);
  assert.equal(rings,mode===true?1:0);assert.equal(particles,mode?low?6:11:0);assert.equal(smoke,mode?low?1:2:0);assert.equal(sparks,mode?low?2:5:0);
  assert.equal(rng,mode?0:(low?6:11)*4+(low?1:2)*3+(low?2:5)*4);
 }
});
test('scorch is fully visible13s, fades at14.99 and expires at15 active seconds',()=>{
  const f=fixture(),c=f.c;const spec=c.generatedCombatVfxSpec('rocketScorch35');
  c.generatedCombatVfx=[];c.positionGeneratedCombatVfx=()=>{};c.removeGeneratedCombatVfx=item=>c.generatedCombatVfx.splice(c.generatedCombatVfx.indexOf(item),1);
  vm.runInContext(fn(settings,'tickGeneratedCombatVfx'),c);
  const item={kind:'rocketScorch35',spec,el:{style:{}},age:13,delay:0,frame:-1};c.generatedCombatVfx.push(item);
  c.tickGeneratedCombatVfx(0);assert.equal(item.el.style.opacity,'1');assert.equal(c.generatedCombatVfx.length,1);
  item.age=14.99;c.tickGeneratedCombatVfx(0);assert.ok(Math.abs(Number(item.el.style.opacity)-.005)<1e-10);assert.equal(c.generatedCombatVfx.length,1);
  item.age=15;c.tickGeneratedCombatVfx(0);assert.equal(c.generatedCombatVfx.length,0);
});
test('source guards preserve sound/physics and real muzzle anchor, separate decals and normal alpha',()=>{
  assert.ok(combat.includes("'fp-rocket-muzzle-anchor'"));assert.ok(!combat.includes("w.key==='plasma'?'fp-plasma-muzzle-anchor':'fp-weapon-flash'"));
  assert.ok(combat.includes('detonateRocket(arr,i,r,pos,Boolean(contact?.ground),wallSurface,contact?.directTarget||null)'));
  assert.ok(combat.includes('!suppressPlayerMuzzleVisual);'));assert.ok(combat.includes('playExplosionSound(pos,proximity)'));
  assert.ok(settings.includes('spec.groundPlane?128:GENERATED_COMBAT_VFX_LIMIT'));
  assert.ok(settings.includes('if(item.spec.groundPlane){positionGroundGrenadeDecal(item);return;}'));
  assert.match(read('src/styles/game.css'),/\.rocket-flight-vfx\.pack35\{mix-blend-mode:screen;[^}]*clip-path:inset\(0 0 0 53%\)/);
});

test('wall decal fits the actual box face and preserves the swept collision policy',()=>{
  const c={THREE:{Vector3:class extends Vec{subVectors(a,b){return this.set(a.x-b.x,a.y-b.y,a.z-b.z);}}},wallMeshes:[]};
  const mesh={geometry:{parameters:{width:8,height:6,depth:1}},worldToLocal:v=>v,localToWorld:v=>v};
  let hit={point:new Vec(0,0,.5),face:{normal:new Vec(0,0,1)},object:mesh},rayArgs;
  c.THREE.Raycaster=class{constructor(...args){rayArgs=args;}intersectObjects(list){assert.equal(list,c.wallMeshes);return hit?[hit]:[];}};
  vm.createContext(c);vm.runInContext(fn(combat,'rocketWallImpactSurface'),c);
  const from=new Vec(0,0,4),to=new Vec(0,0,-1),surface=c.rocketWallImpactSurface(from,to);
  assert.equal(rayArgs[3],5);assert.equal(surface.center.z,.525);assert.equal(surface.corners.length,4);
  for(const p of surface.corners){assert.equal(p.z,.525);assert.ok(Math.abs(p.x)<=1.4&&Math.abs(p.y)<=1.4);}
  assert.deepEqual(from,new Vec(0,0,4));assert.deepEqual(to,new Vec(0,0,-1));
  hit.point.x=3.8;const nearEdge=c.rocketWallImpactSurface(from,to);assert.ok(nearEdge.corners.every(p=>p.x<4&&p.x>3.6));
  hit.point.x=3.99;assert.equal(c.rocketWallImpactSurface(from,to),null);
  hit=null;assert.equal(c.rocketWallImpactSurface(from,to),null);assert.equal(c.rocketWallImpactSurface(new Vec(),new Vec(.01,0,0)),null);
});
test('wall scar shares protected decal budget, renders only real surfaces and expires15s',()=>{
  const f=fixture(),c=f.c;vm.runInContext(fn(settings,'showGeneratedRocketExplosionVfx'),c);
  f.ready('pack35RocketEffects',1024,1024);f.ready('pack35RocketWall',512,512);
  const surface={center:new Vec(0,2,-4),corners:[new Vec(-1,3,-4),new Vec(1,3,-4),new Vec(1,1,-4),new Vec(-1,1,-4)]};
  c.showGeneratedRocketExplosionVfx(new Vec(0,2,-4),false,surface);
  assert.deepEqual(f.calls.map(x=>x.kind),['rocketExplosion35','rocketResidual35','rocketWall35']);
  assert.equal(f.calls[2].options.surfaceCorners,surface.corners);assert.equal(f.rng(),1);
  const spec=c.generatedCombatVfxSpec('rocketWall35');assert.equal(spec.groundPlane,true);assert.equal(spec.surfacePlane,true);assert.equal(spec.duration,15);assert.equal(spec.fadeSeconds,2);
  const item={spec,worldPos:surface.center,surfaceCorners:surface.corners,scale:1,rotation:0,el:{style:{}}};
  vm.runInContext(fn(settings,'positionGroundGrenadeDecal'),c);c.positionGroundGrenadeDecal(item);
  assert.equal(item.el.style.visibility,'visible');assert.ok(item.el.style.transform.startsWith('matrix3d('));
  c.blocked=true;c.positionGroundGrenadeDecal(item);assert.equal(item.el.style.visibility,'hidden');
  c.blocked=false;item.surfaceCorners=null;c.positionGroundGrenadeDecal(item);assert.equal(item.el.style.visibility,'hidden');
});

test('rocket muzzle flame follows barrel toward crosshair without gameplay randomness',()=>{
  const f=fixture(),c=f.c;c.byId=id=>id==='fp-rocket-muzzle-anchor'?{getBoundingClientRect:()=>({left:800,top:600})}:null;
  vm.runInContext(fn(settings,'positionGeneratedCombatVfx'),c);
  const item={spec:{size:132},el:{style:{setProperty(k,v){this[k]=v;}}},anchor:'rocketMuzzle',rotation:0,scale:1};
  c.positionGeneratedCombatVfx(item);assert.equal(item.el.style.left,'800.0px');assert.equal(item.el.style.top,'600.0px');
  assert.ok(Math.abs(item.rotation-Math.atan2(-200,-300)*180/Math.PI)<1e-10);assert.equal(f.rng(),0);
});
