import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
const root=resolve(import.meta.dirname,'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const system=read('src/weapons/system.js'),combat=read('src/combat/combat.js'),settings=read('src/settings/settings.js'),runtime=read('src/game/runtime.js'),catalog=read('src/assets/catalog.js');
test('source calibration manifest agrees with live front-plane, bore and exact emitter cell normalization',()=>{
  const m=JSON.parse(read('asset-staging/2026-10-04-pistol-pack-40/manifest.json'));
  assert.deepEqual(m.muzzlePixels[0],[431,150]);assert.deepEqual(m.muzzlePixels[5],[431,150]);assert.equal(m.boreAngleDegrees,-158.5);
  assert.deepEqual(m.emitterMeasurementReference,[1254,1254]);
  const c=vm.createContext({});vm.runInContext(catalog.slice(catalog.indexOf('const PISTOL_EFFECT_EMITTERS40=')),c);
  const runtimeOrigins=JSON.parse(vm.runInContext('JSON.stringify(PISTOL_EFFECT_EMITTERS40)',c));
  for(const kind of ['flame','smoke'])for(let frame=0;frame<4;frame++){
    const [w,h]=m.emitterSourceCells[kind][frame],[x,y]=m[kind+'OriginsPixels'][frame];
    assert.deepEqual(runtimeOrigins[kind][frame],[x/w,y/h]);
  }
});
function fn(source,name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);const match=source.slice(start).match(/^function [\s\S]*?\n\}/);assert.ok(match,name);return match[0];}
test('strict one-shot probes reject loading/corrupt/wrong assets and accept exact decoded dimensions',()=>{
  const dimensions={pack40PistolReady:[1448,1086],pack40PistolReload:[3840,1920],pack40PistolEffects:[768,768],pack25PistolReload:[960,540]};
  for(const [key,size]of Object.entries(dimensions)){
    const made=[],c=vm.createContext({PISTOL_EFFECT_EMITTERS40:{flame:[[0,0]],smoke:[[0,0]]},GAME_ASSETS:{presentationVfx:{[key]:key}},gameAssetUrl:p=>p,Image:class{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;made.push(this);}}});
    vm.runInContext('const pistolPresentationProbes40=new Map();\n'+fn(settings,'pistolPresentationAssetReady40'),c);
    const call=()=>vm.runInContext(`pistolPresentationAssetReady40('${key}')`,c);
    assert.equal(call(),false);assert.equal(call(),false);assert.equal(made.length,1);
    made[0].complete=true;assert.equal(call(),false);made[0].naturalWidth=1;made[0].naturalHeight=1;assert.equal(call(),false);
    [made[0].naturalWidth,made[0].naturalHeight]=size;assert.equal(call(),true);assert.equal(made.length,1);
    assert.equal(vm.runInContext("pistolPresentationAssetReady40('unknown')",c),false);
  }
});
test('ready decode failure tries matched legacy once then restores procedural; stale callbacks cannot publish',()=>{
  const img={dataset:{},naturalWidth:0,naturalHeight:0},style={setProperty(k,v){this[k]=v;}},classes=new Set(),wrap={style,classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)}};
  const visibility=[],pending={key:'pistol',model:{},asset:'ready40'};
  const c=vm.createContext({running:true,fpGeneratedWeaponActive:false,fpGeneratedWeaponLoading:false,fpGeneratedWeaponLoadId:0,fpGeneratedWeaponPending:pending,fpGeneratedWeaponModel:null,fpGeneratedWeaponAction:null,G:id=>id==='fp-weapon-art'?img:wrap,GAME_ASSETS:{generatedFirstPersonWeaponFallbacks:{pistol:'ready01'}},setProceduralFirstPersonRigVisible:v=>visibility.push(v),console:{warn(){}}});
  vm.runInContext(fn(system,'ensureGeneratedFirstPersonWeaponArtLoaded'),c);vm.runInContext('ensureGeneratedFirstPersonWeaponArtLoaded()',c);
  const stale=img.onload;img.onload();assert.equal(img.src,'ready01');assert.equal(pending.fallbackTried,true);
  img.naturalWidth=960;img.naturalHeight=720;img.onload();assert.equal(c.fpGeneratedWeaponActive,true);assert.equal(img.dataset.pistolPack,'01');assert.equal(visibility.at(-1),false);
  img.dataset.loadId='different';c.fpGeneratedWeaponActive=false;stale();assert.equal(c.fpGeneratedWeaponActive,false);
  img.dataset.loadId='1';img.naturalWidth=3;img.naturalHeight=2;img.onload();assert.equal(pending.failed,true);assert.equal(visibility.at(-1),true);assert.equal(classes.has('on'),false);
});
test('new reload failure holds same ready; legacy reload starts only after strict decode',()=>{
  for(const pack of ['40','01',''])for(const decoded of [false,true])for(const mode of ['tactical','empty']){
    const calls=[],c=vm.createContext({fpGeneratedWeaponActive:true,G:()=>({dataset:{pistolPack:pack}}),pistolPresentationAssetReady40:()=>decoded,playGeneratedFirstPersonAction:(kind,duration)=>{calls.push([kind,duration]);return true;}});
    vm.runInContext(fn(system,'showGeneratedPistolReloadVfx'),c);const started=vm.runInContext(`showGeneratedPistolReloadVfx('${mode}',1.35)`,c);
    if(pack==='40'){assert.equal(started,true);assert.deepEqual(calls,[[decoded?(mode==='empty'?'pistolReloadEmpty40':'pistolReloadTactical40'):'pistolReloadHold40',1.35]]);}
    else if(pack==='01'&&decoded){assert.equal(started,true);assert.deepEqual(calls,[[mode==='empty'?'pistolReloadEmpty25':'pistolReloadTactical25',1.35]]);}
    else{assert.equal(started,false);assert.equal(calls.length,0);}
  }
  assert.ok(catalog.includes('sequence:Object.freeze([0,1,2,3,5])'));assert.ok(catalog.includes('sequence:Object.freeze([0,1,2,3,4,5])'));
});
test('cancel then retry transfers ammunition only on completion and stops stale action',()=>{
  for(const initial of [0,3]){
    const events=[],nodes=new Map(),c=vm.createContext({getW:()=>({key:'pistol',clip:15,reload:1.25,tacticalReloadM:.88,emptyReloadM:1.08}),ammo:initial,uAmmo:5,reloading:false,reloadShellLoaded:0,playerReloadUsesFullPresentation:false,weaponReadyT:0,reloadMode:'mag',reloadT:0,reloadTot:0,weaponActionBlocked:()=>false,G:id=>{if(id==='reload-state-art')return null;if(!nodes.has(id))nodes.set(id,{style:{},textContent:''});return nodes.get(id);},showGeneratedPistolReloadVfx:(mode,t)=>{events.push(['reload',mode,t]);return true;},showGeneratedMagazineDropFx:()=>{throw Error('duplicate magazine');},stopGeneratedFirstPersonAction:()=>events.push(['stop']),playWeaponMechanicSound(){},wHUD(){},syncCurrentAmmo(){}});
    vm.runInContext(['doReload','finishPlayerReload','cancelPlayerReload','completePlayerReloadStep'].map(n=>fn(combat,n)).join('\n'),c);
    vm.runInContext('doReload()',c);assert.ok(Math.abs(c.reloadTot-(initial?1.1:1.35))<1e-10);assert.equal(c.ammo,initial);assert.equal(c.uAmmo,5);
    vm.runInContext('cancelPlayerReload();completePlayerReloadStep()',c);assert.equal(c.ammo,initial);assert.equal(c.uAmmo,5);assert.equal(events.filter(e=>e[0]==='stop').length,1);
    vm.runInContext('doReload();completePlayerReloadStep();completePlayerReloadStep()',c);assert.equal(c.ammo,initial+5);assert.equal(c.uAmmo,0);assert.equal(c.reloading,false);assert.equal(events.filter(e=>e[0]==='stop').length,2);
  }
});
test('exactly one muzzle and casing owner for all ready/effects combinations; historical casing RNG draw remains',()=>{
  const start=combat.indexOf('  const suppressPlayerMuzzleVisual='),end=combat.indexOf('  const bDir=',start);assert.ok(start>=0&&end>start);
  for(const active of [false,true])for(const decoded of [false,true]){
    let draws=0;const calls=[],c=vm.createContext({w:{key:'pistol'},getW:()=>({key:'pistol'}),fpGeneratedWeaponActive:active,pistolPresentationAssetReady40:()=>decoded,riflePresentationAssetReady36:()=>false,shotgunPresentationAssetReady37:()=>false,flashM:{material:{opacity:0}},beamM:{material:{opacity:0}},beamT:0,FP_MUZZLE_FLASH_SECONDS:.075,Math:{random(){draws++;return .5;}},playGeneratedCombatVfx:(kind,options)=>{calls.push([kind,options]);return true;}});
    vm.runInContext(combat.slice(start,end),c);const generated=vm.runInContext(fn(settings,'showGeneratedPistolShotVfx')+'\nshowGeneratedPistolShotVfx()',c);
    assert.equal(generated,active&&decoded);assert.equal(c.flashM.material.opacity,generated?0:1);assert.equal(c.beamT,generated?0:.075);
    const casing=vm.runInContext(fn(settings,'showGeneratedCasingFx')+'\nshowGeneratedCasingFx(false)',c);assert.equal(casing,generated);assert.equal(draws,1);
    assert.equal(calls.filter(v=>v[0]==='pistolMuzzle40').length,generated?1:0);assert.equal(calls.filter(v=>v[0]==='pistolCasing40').length,generated?1:0);
  }
});
class Vec{
  constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}clone(){return new Vec(this.x,this.y,this.z);}copy(v){Object.assign(this,{x:v.x,y:v.y,z:v.z});return this;}addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}set(x,y,z){Object.assign(this,{x,y,z});return this;}
}
test('every measured flame/smoke emitter pins to the live transformed muzzle with correct sprite axis',()=>{
  const emitters={flame:[[278/313,251/313],[264/314,253/313],[252/313,251/313],[253/314,251/313]],smoke:[[274/313,261/314],[266/314,260/314],[256/313,263/314],[258/314,269/314]]};
  const constant=catalog.slice(catalog.indexOf('const PISTOL_EFFECT_EMITTERS40='));const compare=vm.createContext({});vm.runInContext(constant,compare);
  assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(PISTOL_EFFECT_EMITTERS40)',compare)),emitters);
  for(const kind of ['pistolMuzzle40','pistolSmoke40'])for(let frame=0;frame<4;frame++)for(const [x,y]of [[1200,630],[860,540]]){
    const style={setProperty(k,v){this[k]=v;}},c=vm.createContext({PISTOL_EFFECT_EMITTERS40:emitters,innerWidth:1920,innerHeight:1080,byId:id=>id==='fp-pistol-muzzle-anchor'?{getBoundingClientRect:()=>({left:x,top:y})}:null,G:()=>null});
    vm.runInContext(fn(settings,'positionGeneratedCombatVfx'),c);c.item={kind,anchor:'pistolMuzzle',frame,spec:{size:98},el:{style},scale:1.1,rotation:0};vm.runInContext('positionGeneratedCombatVfx(item)',c);
    assert.equal(parseFloat(style.left),x);assert.equal(parseFloat(style.top),y);const o=emitters[kind==='pistolSmoke40'?'smoke':'flame'][frame];assert.equal(style.transformOrigin,`${o[0]*100}% ${o[1]*100}%`);assert.ok(style.transform.includes(`translate(${-o[0]*100}%,${-o[1]*100}%)`));
    const targetAngle=Math.atan2(540-y,960-x)*180/Math.PI;assert.ok(Math.abs(parseFloat(style['--vfx-rot'])-(targetAngle+140))<.006);
  }
});
test('six pose landmarks follow actual tactical/empty action order and return to ready',()=>{
  const expectedMuzzle=[[431,150],[530,171],[530,171],[530,151],[628,176],[431,150]],expectedEject=[[640,182],[736,169],[736,169],[724,160],[856,245],[640,182]];
  const style={setProperty(k,v){this[k]=v;}},c=vm.createContext({G:id=>id==='fp-weapon-art-wrap'?{style}:id==='fp-weapon-art'?{dataset:{pistolPack:'40'}}:null,fpGeneratedWeaponAction:null});
  const start=system.indexOf('const PISTOL_PRESENTATION_ANCHORS40='),end=system.indexOf('function updateGeneratedPistolAnchors40',start);vm.runInContext(system.slice(start,end)+fn(system,'updateGeneratedPistolAnchors40'),c);
  for(const sequence of [[0,1,2,3,5],[0,1,2,3,4,5]])for(let frame=0;frame<sequence.length;frame++){
    c.fpGeneratedWeaponAction={age:(frame+.5)/sequence.length,duration:1,spec:{asset:'pack40PistolReload',frames:sequence.length,sequence}};vm.runInContext('updateGeneratedPistolAnchors40()',c);const p=sequence[frame];assert.ok(Math.abs(parseFloat(style['--fp-muzzle-x'])-expectedMuzzle[p][0]/1448*100)<1e-10);assert.ok(Math.abs(parseFloat(style['--fp-eject-y'])-expectedEject[p][1]/1086*100)<1e-10);
  }
  c.fpGeneratedWeaponAction=null;vm.runInContext('updateGeneratedPistolAnchors40()',c);assert.ok(Math.abs(parseFloat(style['--fp-muzzle-x'])-431/1448*100)<1e-10);
});
test('slide rack sound fires exactly once at real empty phase4; cancellation/tactical/hold cannot fire it',()=>{
  for(const kind of ['pistolReloadEmpty40','pistolReloadTactical40','pistolReloadHold40']){
    let events=0;const c=vm.createContext({fpGeneratedWeaponAction:{kind,age:0,duration:1.35,spec:{frames:kind==='pistolReloadEmpty40'?6:5},frame:-1},G:()=>({}),applyPresentationAtlasFrame(){},generatedCombatVfxFrame(){return{};},playPistolSlideSound40(){events++;},stopGeneratedFirstPersonAction(){c.fpGeneratedWeaponAction=null;}});
    vm.runInContext(fn(system,'tickGeneratedFirstPersonAction'),c);
    for(let i=0;i<17;i++)vm.runInContext('tickGeneratedFirstPersonAction(.05)',c);assert.equal(events,0);
    for(let i=0;i<8;i++)vm.runInContext('tickGeneratedFirstPersonAction(.05)',c);assert.equal(events,kind==='pistolReloadEmpty40'?1:0);
    c.fpGeneratedWeaponAction=null;vm.runInContext('tickGeneratedFirstPersonAction(.05)',c);assert.equal(events,kind==='pistolReloadEmpty40'?1:0);
  }
  let events=0;const c=vm.createContext({fpGeneratedWeaponAction:null,G:()=>({}),playPistolSlideSound40(){events++;}});vm.runInContext(fn(system,'tickGeneratedFirstPersonAction')+'\ntickGeneratedFirstPersonAction(.05)',c);assert.equal(events,0);
});
test('existing audio owner picks Pack40 samples and synthesizes fallback without extra mechanic RNG',()=>{
  for(const available of [false,true])for(const name of ['reload','reloadDone']){
    const calls=[];let draws=0;const c=vm.createContext({Math:{random(){draws++;return .5;},min:Math.min,max:Math.max},playBufferSfx:(...args)=>{calls.push(args);return available;},playSfx:(...args)=>calls.push(args)});vm.runInContext(fn(settings,'playWeaponMechanicSound')+`\nplayWeaponMechanicSound('${name}',1,'pistol')`,c);assert.equal(calls[0][0],name==='reload'?'pistolMag40':'pistolDone40');assert.equal(draws,1);assert.equal(calls.length,available?1:2);
  }
  for(const available of [false,true]){let tones=0;const c=vm.createContext({playBufferSfx:key=>{assert.equal(key,'pistolSlide40');return available;},synthTone(){tones++;},Math:{random(){throw Error('new slide RNG draw');}}});vm.runInContext(fn(settings,'playPistolSlideSound40')+'\nplayPistolSlideSound40()',c);assert.equal(tones,available?0:2);}
});
test('real pistol producer clamps start before near wall with procedural fallback and keeps tracer fallback',()=>{
  let wallCalls=0,tracers=0;const bullets=[],c=vm.createContext({fpGeneratedWeaponActive:false,wallMeshes:[],firstGroundHitDistance:()=>Infinity,firstWallHitDistance:()=>{wallCalls++;return .35;},THREE:{Vector3:Vec},scene:{add(){}},MAX_PLAYER_BULLETS:180,pBullets:bullets,TRACER_SPEED:{pistol:85},PLR_TCOL:{pistol:0xffd27a},mkTracer:()=>{tracers++;return {position:new Vec(),quaternion:{setFromUnitVectors(){}}};},playerDamageMultiplier:()=>1,projectileWallEnergy:()=>1,plr:{piercing:false},from:new Vec(-.60,1.8,0),dir:new Vec(1,0,0),w:{key:'pistol',muzzleVelocity:85,range:55,bulletGravity:4.8}});
  vm.runInContext(fn(combat,'playerVisualMuzzleShot')+'\n'+fn(combat,'spawnPlayerBullet')+'\nspawnPlayerBullet(from,dir,w)',c);
  assert.equal(bullets.length,1);assert.ok(Math.abs(bullets[0].pos.x-(-.28))<1e-10,'wall begins at -.25, bullet must start in front');assert.equal(wallCalls,1);assert.equal(tracers,1);assert.equal(bullets[0].vel.x,85);assert.equal(bullets[0].gravity,4.8);
});
test('pistol recoil survives first camera frame and has same time decay at 30/60/144 FPS',()=>{
  const start=runtime.indexOf("  if(activeW.key==='rifle'||activeW.key==='shotgun'||activeW.key==='pistol'){"),end=runtime.indexOf('  // Apply recoil',start);assert.ok(start>=0&&end>start);const remaining=[];
  for(const fps of [30,60,144]){const c=vm.createContext({activeW:{key:'pistol'},recoilReturn:14,recoilPitch:.032,recoilYaw:.002,recoilRecovery:.12,dt:1/fps});vm.runInContext(runtime.slice(start,end),c);assert.ok(c.recoilPitch>.02);for(let i=1;i<fps/2;i++)vm.runInContext(runtime.slice(start,end),c);remaining.push(c.recoilPitch);}
  assert.ok(Math.max(...remaining)-Math.min(...remaining)<1e-10);
});
test('flight shares actual position/velocity/occlusion owner and preserves fallback under bounded capacity',()=>{
  const body=fn(combat,'syncRifleFlightArt36');assert.ok(body.includes("b.wKey==='pistol'"));assert.ok(body.includes('pack40PistolEffects'));assert.ok(body.includes('addScaledVector(b.vel,.008)'));assert.ok(body.includes('wallBetween(camera.position,pos,wallMeshes)'));assert.ok(body.includes('b.m.visible=b._rifleMeshVisible??true'));assert.ok(body.includes("b.wKey==='pistol'&&rifleFlightArtNodes36.size>=32"));assert.ok(!body.includes('Math.random'));
});
test('real shared flight consumer points left-facing pistol bullet along velocity and restores fallback on decode loss',()=>{
  class ScreenVec extends Vec{project(){return this;}distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}}
  const nodes=new Set(),bullet={wKey:'pistol',pos:new ScreenVec(.1,.2,0),vel:new ScreenVec(.4,.2,0),maxLife:1,life:.95,m:{visible:true}},style={},layer={appendChild(el){el.isConnected=true;}};let decoded=true,covered=false;
  const c=vm.createContext({pBullets:[bullet],eBullets:[],rifleFlightArtNodes36:nodes,rifleFlightScreen36:new ScreenVec(),rifleFlightAhead36:new ScreenVec(),pistolPresentationAssetReady40:()=>decoded,riflePresentationAssetReady36:()=>false,shotgunPresentationAssetReady37:()=>false,G:()=>layer,document:{createElement(){return{style,setAttribute(){},remove(){this.isConnected=false;}};}},camera:{position:new ScreenVec(),fov:70},wallMeshes:[],wallBetween:()=>covered,innerWidth:1600,innerHeight:900,GAME_ASSETS:{presentationVfx:{pack40PistolEffects:'pistol-fx'}},presentationAtlasFrame:(asset,col,row,cols,rows)=>({asset,col,row,cols,rows}),applyPresentationAtlasFrame:(el,frame)=>{el.frame=frame;}});
  vm.runInContext(fn(combat,'syncRifleFlightArt36')+'\nsyncRifleFlightArt36()',c);assert.equal(nodes.size,1);assert.equal(bullet.m.visible,false);const el=bullet._rifleArt;assert.equal(el.frame.asset,'pistol-fx');assert.equal(el.frame.row,2);assert.equal(el.style.visibility,'visible');
  const angle=Number(el.style.transform.match(/rotate\(([-.\d]+)deg/)[1]);assert.ok(Math.abs(angle-(Math.atan2(-.2*900,.4*1600)*180/Math.PI+180))<.1);
  covered=true;vm.runInContext('syncRifleFlightArt36()',c);assert.equal(el.style.visibility,'hidden');
  decoded=false;vm.runInContext('syncRifleFlightArt36()',c);assert.equal(nodes.size,0);assert.equal(bullet.m.visible,true);assert.equal(bullet._rifleArt,null);
  decoded=true;covered=false;for(let i=0;i<32;i++){const b={...bullet,wKey:'rifle'};nodes.add({_rifleRef:b,remove(){}});c.pBullets.push(b);}c.riflePresentationAssetReady36=()=>true;
  vm.runInContext('syncRifleFlightArt36()',c);assert.equal(bullet._rifleArt,null);assert.equal(bullet.m.visible,true,'capacity rejection must keep usable tracer');
});
test('late muzzle alignment preserves delayed smoke lifecycle',()=>{
  const item={anchor:'pistolMuzzle',age:.02,delay:.04};let calls=0;const c=vm.createContext({generatedCombatVfx:[item],positionGeneratedCombatVfx(){calls++;}});
  vm.runInContext(fn(settings,'syncGeneratedPistolEffectAnchors40')+'\nsyncGeneratedPistolEffectAnchors40()',c);assert.equal(calls,0);item.age=.04;vm.runInContext('syncGeneratedPistolEffectAnchors40()',c);assert.equal(calls,1);assert.equal(item.age,.04);
});
test('32 pistol flights cannot erase a real rifle shot; admission hides then decode loss restores the same tracer',()=>{
  class ScreenVec extends Vec{clone(){return new ScreenVec(this.x,this.y,this.z);}project(){return this;}distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}}
  const nodes=new Set(),bullets=[];let rifleReady=true,draws=0;
  const c=vm.createContext({fpGeneratedWeaponActive:false,adsBlend:0,wallMeshes:[],firstGroundHitDistance:()=>Infinity,firstWallHitDistance:()=>Infinity,THREE:{Vector3:ScreenVec},scene:{add(){}},MAX_PLAYER_BULLETS:180,pBullets:bullets,eBullets:[],TRACER_SPEED:{rifle:95},PLR_TCOL:{rifle:0xffd27a},mkTracer:()=>{draws++;return{visible:true,position:new ScreenVec(),quaternion:{setFromUnitVectors(){}}};},playerDamageMultiplier:()=>1,projectileWallEnergy:()=>1,plr:{piercing:false},from:new ScreenVec(),dir:new ScreenVec(.1,0,0),w:{key:'rifle',muzzleVelocity:95,range:75},rifleFlightArtNodes36:nodes,rifleFlightScreen36:new ScreenVec(),rifleFlightAhead36:new ScreenVec(),pistolPresentationAssetReady40:()=>true,riflePresentationAssetReady36:()=>rifleReady,shotgunPresentationAssetReady37:()=>false,G:()=>({appendChild(el){el.isConnected=true;}}),document:{createElement(){return{style:{},setAttribute(){},remove(){this.isConnected=false;}};}},camera:{position:new ScreenVec(),fov:70},wallBetween:()=>false,innerWidth:1920,innerHeight:1080,GAME_ASSETS:{presentationVfx:{pack40PistolEffects:'pistol',pack36RifleEffects:'rifle'}},presentationAtlasFrame:()=>({}),applyPresentationAtlasFrame(){}});
  for(let i=0;i<32;i++){const p={wKey:'pistol',pos:new ScreenVec(.1,.2,0),vel:new ScreenVec(.1,0,0),maxLife:1,life:.9,m:{visible:false},_rifleMeshVisible:true};const el={_rifleRef:p,isConnected:true,style:{},remove(){this.isConnected=false;}};p._rifleArt=el;bullets.push(p);nodes.add(el);}
  vm.runInContext([fn(combat,'playerVisualMuzzleShot'),fn(combat,'spawnPlayerBullet'),fn(combat,'syncRifleFlightArt36')].join('\n')+'\nspawnPlayerBullet(from,dir,w);syncRifleFlightArt36()',c);
  const rifle=bullets.at(-1),tracer=rifle.m;assert.ok(tracer);assert.equal(draws,1);assert.equal(rifle._rifleArt,undefined);assert.equal(tracer.visible,true,'full shared pool retains real rifle feedback');assert.equal(bullets.length,33);
  bullets.splice(0,32);vm.runInContext('syncRifleFlightArt36()',c);assert.equal(nodes.size,1);assert.ok(rifle._rifleArt);assert.equal(tracer.visible,false);assert.equal(draws,1);
  rifleReady=false;vm.runInContext('syncRifleFlightArt36()',c);assert.equal(nodes.size,0);assert.equal(rifle._rifleArt,null);assert.equal(rifle.m,tracer);assert.equal(tracer.visible,true);assert.equal(draws,1);assert.equal(bullets.length,1);
});
function pistolLayoutFixture(width,height,pose,{drawX=0,drawY=0,drawRot=0,scale=1}={}){
  const start=system.indexOf("  if(key==='pistol'){",system.indexOf('function syncGeneratedFirstPersonWeaponArt')),end=system.indexOf("  }else if(key==='rifle'||key==='shotgun'){",start);
  const constants=system.slice(system.indexOf('const PISTOL_ARM_EXITS40='),system.indexOf('function pistolPresentationPose40'));
  const style={setProperty(k,v){this[k]=v;}},stage={style:{}},c=vm.createContext({key:'pistol',G:()=>({dataset:{pistolPack:'40'}}),wrap:{style},stage,innerWidth:width,innerHeight:height,drawX,drawY,drawRot,baseScale:scale,tune:{kickScale:0},kick:0,boreRotation:0,pistolPresentationPose40:()=>pose});
  vm.runInContext(constants+fn(system,'pistolPresentationLayout40')+system.slice(start,end)+'  }',c);
  const w=parseFloat(style['--fp-width']),h=w*.75,left=width-parseFloat(style['--fp-right'])-w,top=height-parseFloat(style['--fp-bottom'])-h,mx=431/1448*w,my=150/1086*h,r=(drawRot+c.boreRotation)*Math.PI/180;
  return {r,project(sx,sy){return [left+mx+drawX+scale*((sx/1448*w-mx)*Math.cos(r)-(sy/1086*h-my)*Math.sin(r)),top+my+drawY+scale*((sx/1448*w-mx)*Math.sin(r)+(sy/1086*h-my)*Math.cos(r))];}};
}
test('actual painted arm exits stay beyond viewport in every pose with bounded sway and recoil',()=>{
  // Independent alpha-edge measurements on source PNGs (alpha >64), not blank corners.
  const edges=[[540,975,900],[553,1068,906],[462,1074,899],[526,1074,895],[404,1141,865],[540,975,900]];
  for(const [width,height]of [[1920,1080],[1495,749],[1280,720],[1280,960],[1024,768]])for(let pose=0;pose<6;pose++)for(const scale of [.975,1.018])for(const drawX of [-18,34])for(const drawY of [-12,34])for(const drawRot of [-2.2,3.2]){
    const layout=pistolLayoutFixture(width,height,pose,{drawX,drawY,drawRot,scale}),[leftEnd,rightStart,sideStart]=edges[pose];
    for(const [sx,sy]of [[0,1086],[leftEnd,1086],[rightStart,1086],[1448,1086],[1448,sideStart]]){
      const [x,y]=layout.project(sx,sy);assert.ok(x>=width+23.8||y>=height+23.8,`pose${pose} arm exit ${sx},${sy} at ${width}x${height}: ${x},${y}`);
    }
  }
});
test('measured ready barrel line reaches center reticle across shapes and recoil scales',()=>{
  for(const [width,height]of [[1920,1080],[1495,749],[1280,720],[1280,960],[1024,768]])for(const scale of [.975,1,1.018]){
    const layout=pistolLayoutFixture(width,height,0,{scale}),[x,y]=layout.project(431,150),target=Math.atan2(height/2-y,width/2-x)*180/Math.PI;
    assert.ok(Math.abs(-158.5+layout.r*180/Math.PI-target)<.04,'bore heads toward actual reticle');
    assert.ok(x>width*.5&&x<width&&y>height*.5&&y<height*.8,'front barrel remains visible below/right of reticle');
  }
});
test('pose-specific framing preserves magazine grasp and slide-rack pistol rear',()=>{
  // Source landmarks independent of the emitter: pose1/2 active fingertips,
  // pose4 manipulating glove + rear sight. Forearm ends may leave viewport.
  const points=[{pose:1,xy:[[776,864],[580,800],[600,820]]},{pose:2,xy:[[656,970],[400,847],[540,850]]},{pose:4,xy:[[840,620],[1160,530],[728,291]]}];
  for(const [width,height]of [[1920,1080],[1495,749],[1280,720],[1280,960],[1024,768]])for(const {pose,xy}of points)for(const scale of [.975,1.018]){
    const layout=pistolLayoutFixture(width,height,pose,{scale});
    for(const [sx,sy]of xy){const [x,y]=layout.project(sx,sy);assert.ok(x>width*.4&&x<width-5&&y>height*.35&&y<height-8,`pose${pose} finger/gun ${sx},${sy} at ${width}x${height}: ${x},${y}`);}
  }
});
