import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import vm from 'node:vm';
const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const combat=read('src/combat/combat.js'),system=read('src/weapons/system.js'),settings=read('src/settings/settings.js'),runtime=read('src/game/runtime.js');
function fn(source,name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);const m=source.slice(start).match(/^function [\s\S]*?\n\}/);assert.ok(m,name);return m[0];}
test('Pack37 exact asset identity, alpha, dimensions, budget and PCM audio',()=>{
 const m=JSON.parse(read('asset-staging/2026-10-03-shotgun-pack-37/manifest.json'));assert.equal(m.readyFrame,0);
 for(const f of m.files){const b=readFileSync(resolve(root,f.path));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);
  if(f.path.endsWith('.webp')){assert.equal(b.toString('ascii',12,16),'VP8X');assert.ok(b[20]&16);assert.deepEqual([1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)],f.dimensions);assert.ok(b.length<=f.budgetKiB*1024);}
  else{assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');assert.equal(b.readUInt16LE(22),1);assert.equal(b.readUInt32LE(24),22050);assert.equal(b.readUInt16LE(34),16);let nonzero=0;for(let i=44;i<b.length;i+=2){const v=b.readInt16LE(i);assert.ok(Math.abs(v)<32767,'unclipped sample');if(v!==0)nonzero++;}assert.ok(nonzero>500);}
 }
});
test('strict terminal probes accept decoded dimensions and never retry failed images',()=>{
 const made=[];const c=vm.createContext({GAME_ASSETS:{presentationVfx:{pack37ShotgunAction:'action',pack37ShotgunEffects:'fx'}},gameAssetUrl:p=>p,Image:class{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;made.push(this);}}});
 vm.runInContext('const shotgunPresentationProbes37=new Map();\n'+fn(settings,'shotgunPresentationAssetReady37'),c);
 const call=()=>vm.runInContext('shotgunPresentationAssetReady37("pack37ShotgunAction")',c);
 assert.equal(call(),false);assert.equal(call(),false);assert.equal(made.length,1);made[0].complete=true;assert.equal(call(),false);made[0].naturalWidth=1;made[0].naturalHeight=1;assert.equal(call(),false);made[0].naturalWidth=3840;made[0].naturalHeight=1920;assert.equal(call(),true);assert.equal(made.length,1);
});
test('ready/pump/load identity survives action loading and failure',()=>{
 for(const decoded of [false,true]){
  const calls=[];const c=vm.createContext({G:()=>({dataset:{shotgunPack:'37'}}),fpGeneratedWeaponActive:true,shotgunPresentationAssetReady37:()=>decoded,playGeneratedFirstPersonAction:(kind,duration)=>{calls.push([kind,duration]);return true;}});
  vm.runInContext(fn(system,'showGeneratedShotgunPumpVfx')+'\n'+fn(system,'showGeneratedShotgunLoadVfx')+'\nshowGeneratedShotgunPumpVfx(.62);showGeneratedShotgunLoadVfx(.517);',c);
  assert.deepEqual(calls,[[decoded?'shotgunPump37':'shotgunHold37',.62],[decoded?'shotgunLoad37':'shotgunHold37',.517]]);
 }
});
function reloadContext(ammo=0,reserve=2){
 const nodes=new Map(),events=[];const c=vm.createContext({ammo,uAmmo:reserve,getW:()=>({key:'shotgun',clip:6,reload:2.35,reloadStyle:'shell',shellStartM:.22,shellInsertM:.26}),weaponActionBlocked:()=>false,reloading:false,reloadT:0,reloadTot:0,reloadMode:'mag',reloadShellLoaded:0,playerReloadUsesFullPresentation:false,weaponReadyT:0,zooming:false,G:id=>{if(!nodes.has(id))nodes.set(id,{style:{},textContent:''});return id==='reload-state-art'?null:nodes.get(id);},showGeneratedShotgunLoadVfx:t=>{events.push(['load',t]);return true;},showGeneratedShotgunShellInsertVfx:()=>{throw Error('duplicate shell animation');},stopGeneratedFirstPersonAction:()=>events.push(['stop']),playWeaponMechanicSound(){},playSfx(){},syncCurrentAmmo(){},wHUD(){}});
 vm.runInContext(['doReload','completePlayerReloadStep','finishPlayerReload','cancelPlayerReload'].map(n=>fn(combat,n)).join('\n'),c);return{c,events};
}
test('shell transfer, reserve exhaustion and interruption stop stale action exactly once',()=>{
 const {c,events}=reloadContext();vm.runInContext('doReload()',c);assert.ok(Math.abs(c.reloadTot-.517)<1e-10);assert.equal(c.ammo,0);assert.equal(c.uAmmo,2);
 vm.runInContext('completePlayerReloadStep()',c);assert.equal(c.ammo,1);assert.equal(c.uAmmo,1);assert.ok(Math.abs(c.reloadTot-.611)<1e-10);
 vm.runInContext('cancelPlayerReload()',c);assert.equal(c.ammo,1);assert.equal(c.uAmmo,1);assert.equal(c.reloading,false);assert.equal(events.filter(e=>e[0]==='stop').length,1);
 vm.runInContext('doReload();completePlayerReloadStep()',c);assert.equal(c.ammo,2);assert.equal(c.uAmmo,0);assert.equal(c.reloading,false);assert.equal(events.filter(e=>e[0]==='stop').length,2);
 vm.runInContext('completePlayerReloadStep()',c);assert.equal(c.ammo,2);
});
test('side pellets give one hit confirmation per shell, with one later kill upgrade',()=>{
 const markers=[],sounds=[];const noop=()=>{};const w={key:'shotgun',dmg:19};
 const target={hp:150,maxHp:150,alive:true,type:0,hurt(d){this.hp-=d;if(this.hp<=0)this.alive=false;}};
 const c=vm.createContext({WEAPON_BY_KEY:{shotgun:w},WEAPONS:[w],plr:{critChance:0,closeDamage:0,longRangeDamage:0,headshotM:1,critMult:1,executeBonus:0,critHeal:0,headshotArmor:0,lifeSteal:0},PLAYER_DAMAGE_BOOST:1,weaponDamageScaleAtDistance:()=>1,showHitMarker:k=>markers.push(k),playSfx:k=>sounds.push(k),playHitImpactSound:noop,spawnSpark:noop,spawnCombatImpact:noop,showGeneratedCriticalHitVfx:noop,weaponImpactType:()=>'',grantPlayerKillRewards:noop,addXP:noop,showCombo:noop,showKillMedal:noop,markHUD:noop,scorePop:noop,updateTeamScore:noop,pushKillFeed:noop,level:1,score:0,kills:0,combo:0,comboT:0,allyKills:0,target,dir:{clone(){return this;}},group:{seen:false,kill:false}});
 class Vec{clone(){return new Vec();}multiplyScalar(){return this;}}
 Object.assign(c,{MAX_PLAYER_BULLETS:180,pBullets:[],TRACER_SPEED:{shotgun:68},PLR_TCOL:{shotgun:0xffb06a},mkTracer:()=>null,playerDamageMultiplier:()=>1,projectileWallEnergy:()=>1,playerVisualMuzzleShot:(from,dir)=>({pos:from.clone(),dir:dir.clone()}),from:new Vec(),shotDir:new Vec()});
 vm.runInContext(fn(combat,'spawnPlayerBullet')+'\n'+fn(combat,'resolvePlayerBulletHit'),c);
 // Reach the hit resolver through the real producer: manual fake bullets missed a lost metadata field.
 vm.runInContext('for(let i=1;i<=8;i++)spawnPlayerBullet(from,shotDir,WEAPONS[0],{pelletIndex:i,shotFeedback:group})',c);
 assert.equal(c.pBullets.length,8);for(const b of c.pBullets){assert.equal(b.shotFeedback,c.group);assert.equal(b.markerEligible,false);}
 vm.runInContext('resolvePlayerBulletHit(pBullets[0],target,false,{},dir,5)',c);assert.equal(target.hp,131);assert.deepEqual(markers,['hit']);
 for(let i=1;i<8;i++)vm.runInContext(`resolvePlayerBulletHit(pBullets[${i}],target,false,{},dir,5)`,c);
 assert.deepEqual(markers,['hit','kill']);assert.deepEqual(sounds,['hit','kill']);assert.equal(c.kills,1);
});
test('shotgun launch includes camera-to-muzzle wall guard even with procedural fallback',()=>{
 const body=fn(combat,'playerVisualMuzzleShot');assert.ok(body.includes("w?.key==='rifle'||w?.key==='shotgun'"));assert.ok(body.includes('Math.min(.48,wall-.03)'));assert.ok(body.includes("w.key==='shotgun'?.20:.15"));
 assert.ok(fn(combat,'spawnPlayerBullet').includes("w.key==='rifle'||w.key==='shotgun'||w.key==='pistol'?playerVisualMuzzleShot"));assert.ok(fn(combat,'shoot').includes('extraShot:s>0,shotFeedback'));
});
test('camera kick remains visible and decay is independent of 30/60/144 FPS',()=>{
 const start=runtime.indexOf("  if(activeW.key==='rifle'||activeW.key==='shotgun'||activeW.key==='pistol'){");const end=runtime.indexOf('  // Apply recoil',start);assert.ok(start>=0&&end>start);const results=[];
 for(const fps of [30,60,144]){const c=vm.createContext({activeW:{key:'shotgun'},recoilReturn:8.5,recoilPitch:.085,recoilYaw:.002,recoilRecovery:.22,dt:1/fps});vm.runInContext(runtime.slice(start,end),c);assert.ok(c.recoilPitch>.06);for(let i=1;i<fps/2;i++)vm.runInContext(runtime.slice(start,end),c);results.push(c.recoilPitch);}
 assert.ok(Math.max(...results)-Math.min(...results)<1e-10);
});
test('every flame/smoke tile pins its measured emitter to the transformed muzzle',()=>{
 const emitters=JSON.parse(read('asset-staging/2026-10-03-shotgun-pack-38/manifest.json')).emitters;
 for(const kind of ['shotgunMuzzle37','shotgunSmoke37'])for(let frame=0;frame<4;frame++){
  const style={setProperty(k,v){this[k]=v;}};const c=vm.createContext({SHOTGUN_EFFECT_EMITTERS38:emitters,innerWidth:1920,innerHeight:1080,byId:id=>id==='fp-shotgun-muzzle-anchor'?{getBoundingClientRect:()=>({left:1290,top:620})}:null,G:()=>null});
  vm.runInContext(fn(settings,'positionGeneratedCombatVfx'),c);c.item={kind,anchor:'shotgunMuzzle',frame,spec:{size:126},el:{style},scale:1.1,rotation:0};vm.runInContext('positionGeneratedCombatVfx(item)',c);
  assert.equal(parseFloat(style.left),1290);assert.equal(parseFloat(style.top),620);
  const o=emitters[kind==='shotgunSmoke37'?'smoke':'flame'][frame];assert.equal(style.transformOrigin,`${o[0]*100}% ${o[1]*100}%`);
  assert.ok(style.transform.includes(`translate(${-o[0]*100}%,${-o[1]*100}%)`));
 }
});
test('flight follows real pellet velocity, occlusion and bounded capacity with fallback restoration',()=>{
 const body=fn(combat,'syncRifleFlightArt36');assert.ok(body.includes("b.wKey==='shotgun'"));assert.ok(body.includes('wallBetween(camera.position,pos,wallMeshes)'));assert.ok(body.includes('addScaledVector(b.vel,.008)'));assert.ok(body.includes('rifleFlightArtNodes36.size>=96'));assert.ok(body.includes('b.m.visible=b._rifleMeshVisible??true'));assert.ok(!body.includes('Math.random'));
});

test('HD ready and action use real six-frame resolution, dimensions and versioned paths',()=>{
 const m=JSON.parse(read('asset-staging/2026-10-03-shotgun-pack-38/manifest.json'));
 assert.deepEqual(m.cell,[1280,960]);assert.equal(m.sources.length,6);
 for(const f of m.files){const b=readFileSync(resolve(root,f.path));assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);assert.equal(b.length,f.bytes);assert.ok(b[20]&16);assert.deepEqual([1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)],f.dimensions);assert.ok(b.length<=f.budgetKiB*1024);}
 const catalog=read('src/assets/catalog.js');assert.ok(catalog.includes("pack37ShotgunReady:'assets/ui/weapons/fp/player-shotgun-fps-38.webp'"));assert.ok(catalog.includes("pack37ShotgunAction:'assets/ui/fx/shotgun-action-atlas-38.webp'"));
 assert.ok(system.includes('img.naturalWidth!==1448||img.naturalHeight!==1086'));
});
test('firearm impact rays and expanding ring allocate no effect; energy/explosion effects remain',()=>{
 const c=vm.createContext({makeProceduralBurst(){throw Error('energy/explosion owner reached');}});
 vm.runInContext(fn(read('src/core/engine.js'),'spawnCombatImpact'),c);
 for(const type of ['bullet','wall','sniper','critical'])assert.doesNotThrow(()=>vm.runInContext(`spawnCombatImpact({},"${type}")`,c));
 assert.doesNotThrow(()=>vm.runInContext('spawnCombatImpact({})',c));
 for(const type of ['rocket','plasma'])assert.throws(()=>vm.runInContext(`spawnCombatImpact({},"${type}")`,c),/energy\/explosion owner reached/);
});

test('detached casing starts at transformed port then rotates and accelerates down',()=>{
 let port={left:1200,top:650};const style={setProperty(k,v){this[k]=v;}};
 const c=vm.createContext({innerWidth:1600,innerHeight:900,byId:id=>id==='fp-shotgun-ejection-anchor'?{getBoundingClientRect:()=>port}:null,G:()=>null});
 vm.runInContext(fn(settings,'positionGeneratedCombatVfx'),c);c.item={kind:'shotgunCasing37',anchor:'shotgunEjection',frame:0,age:0,delay:0,spec:{size:44},el:{style},scale:1,rotation:3};
 vm.runInContext('positionGeneratedCombatVfx(item)',c);assert.equal(parseFloat(style.left),1200);assert.equal(parseFloat(style.top),650);
 port={left:800,top:400};c.item.age=.3;vm.runInContext('positionGeneratedCombatVfx(item)',c);
 assert.equal(parseFloat(style.left),1254);assert.equal(parseFloat(style.top),702.5);assert.equal(c.item.rotation,165);
 assert.equal(c.item.spawnScreen.x,1200);assert.equal(c.item.spawnScreen.y,650);
});
test('pose-aware landmarks follow actual sequence/age and frame order avoids stale emitters',()=>{
 const style={setProperty(k,v){this[k]=v;}};
 const c=vm.createContext({G:id=>id==='fp-weapon-art-wrap'?{style}:id==='fp-weapon-art'?{dataset:{shotgunPack:'37'}}:null,fpGeneratedWeaponAction:null});
 const a=system.indexOf('const SHOTGUN_PRESENTATION_ANCHORS38=');const b=system.indexOf('function updateGeneratedShotgunAnchors38',a);vm.runInContext(system.slice(a,b)+fn(system,'updateGeneratedShotgunAnchors38'),c);
 for(const [kind,seq]of [['pump',[0,1,1,2,0]],['load',[0,3,4,5,0]]])for(let frame=0;frame<5;frame++){
  c.fpGeneratedWeaponAction={age:(frame+.5)/5,duration:1,spec:{asset:'pack37ShotgunAction',frames:5,sequence:seq}};vm.runInContext('updateGeneratedShotgunAnchors38()',c);
  const expected=vm.runInContext(`SHOTGUN_PRESENTATION_ANCHORS38[${seq[frame]}]`,c);assert.equal(parseFloat(style['--fp-muzzle-x']),expected.muzzle[0]*100);assert.equal(parseFloat(style['--fp-eject-y']),expected.ejection[1]*100);
 }
 const sync=runtime.indexOf('syncGeneratedFirstPersonWeaponArt(gunGrp.visible)');const emit=runtime.indexOf('showGeneratedCasingFx(pendingGeneratedCycleCasing===1)');const align=runtime.indexOf('syncGeneratedShotgunEffectAnchors38();');assert.ok(sync>=0&&emit>sync&&align>emit);
 assert.ok(!fn(settings,'syncGeneratedShotgunEffectAnchors38').includes('tickGeneratedCombatVfx'));
});
test('late anchor alignment preserves delayed smoke lifecycle without advancing age',()=>{
 const item={anchor:'shotgunMuzzle',age:.016,delay:.05,el:{style:{visibility:'hidden'}}};let calls=0;
 const c=vm.createContext({generatedCombatVfx:[item],positionGeneratedCombatVfx(v){calls++;v.el.style.visibility='visible';}});
 vm.runInContext(fn(settings,'syncGeneratedShotgunEffectAnchors38'),c);vm.runInContext('syncGeneratedShotgunEffectAnchors38()',c);
 assert.equal(calls,0);assert.equal(item.el.style.visibility,'hidden');assert.equal(item.age,.016);
 item.age=.05;vm.runInContext('syncGeneratedShotgunEffectAnchors38()',c);assert.equal(calls,1);assert.equal(item.el.style.visibility,'visible');assert.equal(item.age,.05);
});

test('ricochet overlay allocates no fan/ring and preserves throttled RNG draws',()=>{
 for(const low of [false,true])for(const surface of ['concrete','metal','wood']){
  let now=100,draws=0,allocations=0;
  const c=vm.createContext({performance:{now:()=>now},MOBILE_LOW:low,Math:{random(){draws++;return .5;}},playGeneratedCombatVfx(){allocations++;return true;}});
  vm.runInContext(fn(settings,'showGeneratedRicochetVfx'),c);
  const invoke=()=>vm.runInContext(`showGeneratedRicochetVfx({},'${surface}')`,c);
  assert.equal(invoke(),false);assert.equal(draws,1);
  now=110;assert.equal(invoke(),false);assert.equal(draws,1);
  now=130;assert.equal(invoke(),false);assert.equal(draws,low?1:2);
  now=200;assert.equal(invoke(),false);assert.equal(draws,low?2:3);
  assert.equal(allocations,0);
 }
});

test('cabinet hit hook creates no terminal cable or electrical arc overlay',()=>{
 for(const low of [false,true]){
  let now=1000;
  const c=vm.createContext({performance:{now:()=>now},MOBILE_LOW:low,playGeneratedCombatVfx(){throw Error('removed terminal overlay allocated');}});
  vm.runInContext(fn(settings,'showGeneratedTerminalArcVfx'),c);
  for(let i=0;i<5;i++){assert.equal(vm.runInContext('showGeneratedTerminalArcVfx({x:1,y:1,z:2})',c),false);now+=500;}
 }
});
