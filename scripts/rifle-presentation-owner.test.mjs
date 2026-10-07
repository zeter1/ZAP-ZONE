import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import vm from 'node:vm';
const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const weapons=read('src/weapons/system.js'),settings=read('src/settings/settings.js'),runtime=read('src/game/runtime.js'),combat=read('src/combat/combat.js');
function fn(source,name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);const m=source.slice(start).match(/^function [\s\S]*?\n\}/);assert.ok(m,name);return m[0];}
test('Pack36 manifest verifies bytes, SHA256, alpha and actual WebP dimensions',()=>{
  const m=JSON.parse(read('asset-staging/2026-10-03-rifle-pack-36/manifest.json'));assert.equal(m.readyFrame,5);
  for(const f of m.files){const b=readFileSync(resolve(root,f.path));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);assert.equal(b.toString('ascii',12,16),'VP8X');assert.ok(b[20]&16);assert.deepEqual([1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)],f.dimensions);assert.ok(b.length<=f.budgetKiB*1024);}
});
test('rifle recoil is visible and has the same elapsed-time decay at 30/60/144 FPS',()=>{
  const start=runtime.indexOf("  if(activeW.key==='rifle'||activeW.key==='shotgun'||activeW.key==='pistol'){");const end=runtime.indexOf('  // Apply recoil',start);assert.ok(start>=0&&end>start);
  const source=runtime.slice(start,end);
  const remaining=[];
  for(const fps of [30,60,144]){
    const c=vm.createContext({activeW:{key:'rifle'},recoilReturn:11,recoilPitch:.026,recoilYaw:-.002,recoilRecovery:.16,dt:1/fps});
    vm.runInContext(source,c);assert.ok(c.recoilPitch>0,'first frame cannot erase kick');
    for(let i=1;i<fps/2;i++)vm.runInContext(source,c);
    remaining.push(c.recoilPitch);assert.ok(c.recoilPitch<.003,'settles in half second');
  }
  assert.ok(Math.max(...remaining)-Math.min(...remaining)<1e-10);
  for(const key of ['sniper','plasma']){
    const c=vm.createContext({activeW:{key},recoilReturn:11,recoilPitch:.2,recoilYaw:-.1,recoilRecovery:.16,dt:1/60});vm.runInContext(source,c);
    assert.ok(Math.abs(c.recoilPitch-(.2-11*.62/60))<1e-12,'other weapons retain existing behavior');
  }
});
test('rifle cadence emits 20 rounds in 2 seconds at 30/60/144 FPS without debt while idle',()=>{
  const start=runtime.indexOf("  if(fireW.key==='rifle'){");const end=runtime.indexOf('  // Gun',start);const source=runtime.slice(start,end);
  for(const fps of [30,60,144]){
    let shots=0;const c=vm.createContext({fireW:{key:'rifle',rate:.1,automatic:true},mouseDown:true,mobileInput:{fire:false},reloading:false,sCD:0,dt:1/fps,autoFireT:0,weaponActionBlocked:()=>false});
    c.shoot=()=>{shots++;c.sCD=.1+Math.min(0,c.sCD);};
    for(let i=0;i<fps*2;i++)vm.runInContext('{'+source+'}',c);
    assert.equal(shots,20,fps+' FPS');
    c.mouseDown=false;for(let i=0;i<fps;i++)vm.runInContext('{'+source+'}',c);assert.equal(c.sCD,0);
    c.mouseDown=true;vm.runInContext('{'+source+'}',c);assert.equal(shots,21);
  }
});
test('hip/ADS share one reticle; sniper hip policy remains hidden',()=>{
  const line=runtime.split('\n').find(s=>s.includes("crosshair.classList.toggle('scope-hidden'"));
  for(const [key,scopedWeapon,scopeActive,expected] of [['rifle',true,false,false],['rifle',true,true,false],['sniper',true,false,true],['pistol',false,false,false]]){
    let hidden;vm.runInNewContext(line,{activeW:{key},scopedWeapon,scopeActive,crosshair:{classList:{toggle:(k,v)=>{hidden=v;}}}});assert.equal(hidden,expected);
  }
  assert.ok(read('src/styles/game.css').includes('#xhair.rifle-reticle::after'));
  assert.ok(!read('assets/ui/scopes/rifle-optic-frame-36.svg').includes('<circle'),'scope frame must not add a second aiming dot');
});
test('decode guard is strict and creates one probe on loading/failure/wrong dimensions',()=>{
  const made=[];const c=vm.createContext({GAME_ASSETS:{presentationVfx:{pack36RifleReload:'reload.webp',pack36RifleEffects:'fx.webp'}},gameAssetUrl:p=>p,Image:class{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;made.push(this);}}});
  vm.runInContext('const riflePresentationProbes36=new Map();\n'+fn(settings,'riflePresentationAssetReady36'),c);
  const invoke=()=>vm.runInContext('riflePresentationAssetReady36("pack36RifleReload")',c);
  assert.equal(invoke(),false);assert.equal(invoke(),false);assert.equal(made.length,1);
  made[0].complete=true;assert.equal(invoke(),false);made[0].naturalWidth=512;made[0].naturalHeight=512;assert.equal(invoke(),false);assert.equal(made.length,1);
  made[0].naturalWidth=2304;made[0].naturalHeight=1152;assert.equal(invoke(),true);
});
test('partial/empty reload holds its matching ready while atlas fails and keeps gameplay duration/ammo',()=>{
  for(const ready of [false,true])for(const empty of [false,true]){
    const nodes=new Map(),calls=[];
    const c=vm.createContext({getW:()=>({key:'rifle',clip:30,reload:2.15,tacticalReloadM:.9,emptyReloadM:1.12,aimMode:'scope'}),fpGeneratedWeaponActive:true,riflePresentationAssetReady36:()=>ready,playGeneratedFirstPersonAction:(kind,duration)=>{calls.push({kind,duration});return true;},weaponActionBlocked:()=>false,reloading:false,ammo:empty?0:12,uAmmo:100,zooming:true,reloadShellLoaded:0,playerReloadUsesFullPresentation:false,reloadMode:'mag',reloadT:0,reloadTot:0,G:id=>{if(!nodes.has(id))nodes.set(id,{dataset:{riflePack:'36'},style:{},textContent:''});return id==='reload-state-art'?null:nodes.get(id);},showGeneratedMagazineDropFx:()=>{throw Error('unexpected loose magazine');},playWeaponMechanicSound(){}});
    vm.runInContext(fn(weapons,'showGeneratedRifleReloadVfx')+'\n'+fn(combat,'doReload')+'\ndoReload();',c);
    assert.equal(c.zooming,false);assert.equal(c.ammo,empty?0:12);assert.equal(c.uAmmo,100);
    assert.ok(Math.abs(c.reloadTot-(empty?2.408:1.935))<1e-10);
    assert.equal(calls[0].kind,ready?(empty?'rifleReloadEmpty36':'rifleReloadTactical36'):'rifleReloadHold36');assert.equal(calls[0].duration,c.reloadTot);
  }
});
test('new projectile is anchored to drawn muzzle with actual velocity and wall occlusion',()=>{
  assert.ok(combat.includes("['plasma','rocket','rifle','shotgun','pistol'].includes(w?.key)"));
  assert.ok(combat.includes("w.key==='rifle'?'fp-rifle-muzzle-anchor'"));
  const flight=fn(combat,'syncRifleFlightArt36');assert.ok(flight.includes('wallBetween(camera.position,pos,wallMeshes)'));
  assert.ok(flight.includes('addScaledVector(b.vel,.008)'));assert.ok(flight.includes('rifleFlightArtNodes36.size>=32'));assert.ok(!flight.includes('Math.random'));
  assert.ok(settings.includes("if(weaponKey==='rifle')return showGeneratedRifleShotVfx();"));
});

test('all four flame nozzle pixels follow the actual barrel through movement and scale',()=>{
  const expected=[[.900,.755],[.865,.755],[.785,.755],[.780,.755]];
  for(const [x,y] of [[1012,558],[1220,560],[768,620]])for(const scale of [.7,1,1.1])for(let frame=0;frame<4;frame++){
    const style={setProperty(k,v){this[k]=v;}};
    const marker={getBoundingClientRect:()=>({left:x,top:y})};
    const c=vm.createContext({innerWidth:1920,innerHeight:900,byId:id=>id==='fp-rifle-muzzle-anchor'?marker:null,G:()=>null});
    vm.runInContext(fn(settings,'positionGeneratedCombatVfx'),c);
    const item={kind:'rifleMuzzle36',anchor:'rifleMuzzle',frame,spec:{size:104},el:{style},scale,rotation:0};
    c.item=item;vm.runInContext('positionGeneratedCombatVfx(item)',c);
    assert.equal(Number.parseFloat(style.left),x);assert.equal(Number.parseFloat(style.top),y);
    const origin=style.transformOrigin.split(' ').map(Number.parseFloat);
    const shift=style.transform.match(/translate\(([-.\d]+)%,([-.\d]+)%\)/).slice(1).map(Number);
    assert.ok(Math.abs(origin[0]-expected[frame][0]*100)<1e-9);assert.ok(Math.abs(origin[1]-expected[frame][1]*100)<1e-9);
    assert.ok(Math.abs(origin[0]+shift[0])<1e-9&&Math.abs(origin[1]+shift[1])<1e-9,'CSS origin stays on the marker under rotation/scale');
    const direction=Math.atan2(450-y,960-x)*180/Math.PI;
    assert.ok(Math.abs(Number.parseFloat(style['--vfx-rot'])-(direction-180))<.006,'flame extends from nozzle toward reticle');
  }
});

test('exactly one muzzle owner survives every ready/effects fallback combination',()=>{
  const start=combat.indexOf('  const suppressPlayerMuzzleVisual=');
  const end=combat.indexOf('  const bDir=',start);assert.ok(start>=0&&end>start);
  for(const active of [false,true])for(const decoded of [false,true]){
    const c=vm.createContext({G:()=>null,w:{key:'rifle'},fpGeneratedWeaponActive:active,riflePresentationAssetReady36:()=>decoded,flashM:{material:{opacity:0}},beamM:{material:{opacity:0}},beamT:0,FP_MUZZLE_FLASH_SECONDS:.08});
    vm.runInContext(combat.slice(start,end),c);
    c.playGeneratedCombatVfx=()=>true;
    const generated=vm.runInContext(fn(settings,'showGeneratedRifleShotVfx')+'\nshowGeneratedRifleShotVfx()',c);
    assert.equal(generated,active&&decoded);
    assert.equal(c.flashM.material.opacity,generated?0:1);
    assert.equal(c.beamM.material.opacity,generated?0:.72);
    assert.equal(c.beamT,generated?0:.08);
  }
});

test('rifle smoke tail follows muzzle in all four frames through movement and scale',()=>{
  const origins=[[.60,.96],[.47,.98],[.68,.98],[.35,.98]];
  for(const [x,y] of [[1012,558],[768,620]])for(const scale of [.7,1,1.1])for(let frame=0;frame<4;frame++){
    const style={setProperty(k,v){this[k]=v;}};
    const c=vm.createContext({innerWidth:1920,innerHeight:900,G:()=>null,byId:id=>id==='fp-rifle-muzzle-anchor'?{getBoundingClientRect:()=>({left:x,top:y})}:null});
    const item={kind:'rifleSmoke36',anchor:'rifleMuzzle',frame,spec:{size:96},el:{style},scale,rotation:35};
    c.item=item;vm.runInContext(fn(settings,'positionGeneratedCombatVfx')+'\npositionGeneratedCombatVfx(item)',c);
    assert.equal(Number.parseFloat(style.left),x);assert.equal(Number.parseFloat(style.top),y);
    const origin=style.transformOrigin.split(' ').map(Number.parseFloat);
    const shift=style.transform.match(/translate\(([-.\d]+)%,([-.\d]+)%\)/).slice(1).map(Number);
    assert.ok(Math.abs(origin[0]-origins[frame][0]*100)<1e-9);assert.ok(Math.abs(origin[1]-origins[frame][1]*100)<1e-9);
    assert.ok(Math.abs(origin[0]+shift[0])<1e-9&&Math.abs(origin[1]+shift[1])<1e-9);
    assert.equal(style['--vfx-rot'],'0.00deg');
  }
});
test('entering optics hides already emitted rifle flame and smoke immediately',()=>{
  let scoped=false;
  for(const kind of ['rifleMuzzle36','rifleSmoke36']){
    const style={setProperty(k,v){this[k]=v;}};
    const c=vm.createContext({innerWidth:1920,innerHeight:900,G:()=>({classList:{contains:()=>scoped}}),byId:id=>id==='fp-rifle-muzzle-anchor'?{getBoundingClientRect:()=>({left:1012,top:558})}:null});
    c.item={kind,anchor:'rifleMuzzle',frame:0,spec:{size:96},el:{style},scale:1,rotation:0};
    vm.runInContext(fn(settings,'positionGeneratedCombatVfx'),c);
    scoped=false;vm.runInContext('positionGeneratedCombatVfx(item)',c);assert.equal(style.visibility,'visible');
    scoped=true;vm.runInContext('positionGeneratedCombatVfx(item)',c);assert.equal(style.visibility,'hidden');
    scoped=false;vm.runInContext('positionGeneratedCombatVfx(item)',c);assert.equal(style.visibility,'visible');
  }
});
test('rifle optics suppress generated and procedural muzzle even if ready/effects fail',()=>{
  const start=combat.indexOf('  const suppressPlayerMuzzleVisual='),end=combat.indexOf('  const bDir=',start);
  for(const active of [false,true])for(const decoded of [false,true]){
    let spawned=0;
    const c=vm.createContext({G:()=>({classList:{contains:()=>true}}),w:{key:'rifle'},fpGeneratedWeaponActive:active,riflePresentationAssetReady36:()=>decoded,flashM:{material:{opacity:0}},beamM:{material:{opacity:0}},beamT:0,FP_MUZZLE_FLASH_SECONDS:.08,playGeneratedCombatVfx:()=>{spawned++;return true;}});
    vm.runInContext(combat.slice(start,end),c);
    assert.equal(c.flashM.material.opacity,0);assert.equal(c.beamM.material.opacity,0);assert.equal(c.beamT,0);
    assert.equal(vm.runInContext(fn(settings,'showGeneratedRifleShotVfx')+'\nshowGeneratedRifleShotVfx()',c),true);
    assert.equal(spawned,0);
  }
});

test('rifle effects align after current weapon transform without advancing delayed smoke',()=>{
  const sync=runtime.indexOf('syncGeneratedFirstPersonWeaponArt(gunGrp.visible)'),align=runtime.indexOf('syncGeneratedRifleEffectAnchors36();');
  assert.ok(sync>=0&&align>sync);
  const smoke={anchor:'rifleMuzzle',age:.016,delay:.04,el:{style:{visibility:'hidden'}}},flame={anchor:'rifleMuzzle',age:.016,delay:0},other={anchor:'pistolMuzzle',age:.016,delay:0};
  const calls=[],c=vm.createContext({generatedCombatVfx:[smoke,flame,other],positionGeneratedCombatVfx:i=>calls.push(i)});
  vm.runInContext(fn(settings,'syncGeneratedRifleEffectAnchors36')+'\nsyncGeneratedRifleEffectAnchors36()',c);
  assert.deepEqual(calls,[flame]);assert.equal(smoke.age,.016);assert.equal(smoke.el.style.visibility,'hidden');
  calls.length=0;smoke.age=.04;vm.runInContext('syncGeneratedRifleEffectAnchors36()',c);assert.deepEqual(calls,[smoke,flame]);assert.equal(smoke.age,.04);
});
