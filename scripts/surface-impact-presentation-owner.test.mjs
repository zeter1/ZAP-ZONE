import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const settings=readFileSync(new URL('../src/settings/settings.js',import.meta.url),'utf8');
const catalog=readFileSync(new URL('../src/assets/catalog.js',import.meta.url),'utf8');
function fn(name){const start=settings.indexOf('function '+name+'(');assert.ok(start>=0);const end=settings.indexOf('\nfunction ',start+1);return settings.slice(start,end<0?undefined:end);}
function selector({ready=true,primaryReady=ready,mobile=false,dist=60}={}){
  const calls=[];let draws=0,now=1000;
  const c=vm.createContext({performance:{now:()=>now},MOBILE_LOW:mobile,camera:{position:{distanceTo:()=>dist}},surfaceImpactAssetReady45:()=>ready,surfaceImpactAssetReady29:()=>primaryReady,
    Math:Object.assign(Object.create(Math),{random:()=>{draws++;return .6;}}),playGeneratedCombatVfx:(...args)=>{calls.push(args);return true;}});
  vm.runInContext(fn('showGeneratedSurfaceImpactVfx'),c);
  return {c,calls,get draws(){return draws;},emit:(material,variant='normal')=>{now+=100;return c.showGeneratedSurfaceImpactVfx(material,{},variant);}};
}
test('near, distant and low-mode bullet hits select material; tech never restores electricity',()=>{
  for(const mobile of [false,true])for(const dist of [3,26,48,60,120]){
    const s=selector({mobile,dist});
    for(const [mat,v,kind]of [['concrete','normal','concreteImpact29'],['metal','heavy','metalImpact29'],['wood','heavy','woodImpact45'],['concrete','heavy','heavyImpact29'],['concrete','tech','concreteImpact29'],['metal','tech','metalImpact29']]){
      assert.equal(s.emit(mat,v),true);const [actual,options]=s.calls.at(-1);assert.equal(actual,kind);assert.equal(options.scale,1);
    }
    assert.equal(s.draws,6);
  }
});
test('loading or failed art emits no legacy DOM effect and retains historical RNG/throttle',()=>{
  const s=selector({ready:false});assert.equal(s.emit('concrete'),false);assert.equal(s.calls.length,0);assert.equal(s.draws,1);
  assert.equal(s.c.showGeneratedSurfaceImpactVfx('metal',{}),false);assert.equal(s.draws,1);
});
test('strict dimensions; one probe per asset, no repeated requests on failure',()=>{
  let count=0;class Image{constructor(){count++;this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}}
  const c=vm.createContext({Image,GAME_ASSETS:{presentationVfx:{pack45SurfaceImpact:'art.webp'}},gameAssetUrl:x=>x});
  vm.runInContext('const surfaceImpactProbes45=new Map();'+fn('surfaceImpactAssetReady45'),c);
  assert.equal(c.surfaceImpactAssetReady45(),false);assert.equal(c.surfaceImpactAssetReady45(),false);assert.equal(count,1);
  vm.runInContext("Object.assign(surfaceImpactProbes45.get('art.webp'),{complete:true,naturalWidth:320,naturalHeight:320})",c);assert.equal(c.surfaceImpactAssetReady45(),false);
  vm.runInContext("Object.assign(surfaceImpactProbes45.get('art.webp'),{naturalWidth:768,naturalHeight:512})",c);assert.equal(c.surfaceImpactAssetReady45(),true);
});
function projected(dist,{fov=70,occluded=false,smoke=false}={}){
  const style={setProperty(k,v){this[k]=v;}};
  const spec={size:128,worldSizeM:.82,minScreenSize:0,maxScreenSize:90,originY:.64,occlude:true};
  const screen={copy(){return this;},project(){this.x=0;this.y=0;this.z=.5;return this;}};
  const c=vm.createContext({Math,innerWidth:1920,innerHeight:1080,camera:{fov,position:{distanceTo:()=>dist}},wallMeshes:[],wallBetween:()=>occluded,smokeVisibilityBetween42:()=>smoke?0:1});
  vm.runInContext(fn('positionGeneratedCombatVfx'),c);c.positionGeneratedCombatVfx({el:{style},kind:'concreteImpact45',spec,scale:1,rotation:0,worldPos:{},screen});return style;
}
test('distance/FOV perspective has no oversized far-distance pixel floor',()=>{
  const a=Number(projected(30)['--vfx-scale']),b=Number(projected(60)['--vfx-scale']),far=Number(projected(240)['--vfx-scale']);
  assert.ok(Math.abs(a/b-2)<.03);assert.ok(Math.abs(b/far-4)<.12);assert.ok(far*128<4);assert.ok(Number(projected(60,{fov:35})['--vfx-scale'])>b*2);
  assert.ok(Number(projected(.7)['--vfx-scale'])*128<=90.1);
});
test('ordinary dust never appears through opaque walls or dense smoke',()=>{
  assert.equal(projected(60,{occluded:true}).visibility,'hidden');assert.equal(projected(60,{smoke:true}).visibility,'hidden');assert.equal(projected(60).visibility,'visible');
});
test('six frame rows remain isolated and metadata/CSS retain physical neutral dust',()=>{
  const start=catalog.indexOf('const GENERATED_COMBAT_VFX_SPECS='),end=catalog.indexOf('function generatedCombatVfxSpec(',start);
  const c=vm.createContext({});vm.runInContext(catalog.slice(start,end)+';globalThis.specs=GENERATED_COMBAT_VFX_SPECS;',c);
  for(const [i,kind]of ['concrete','metal','wood','heavy'].entries()){
    const spec=c.specs[kind+'Impact45'];assert.equal(spec.row,i);assert.equal(spec.cols,6);assert.equal(spec.rows,4);assert.equal(spec.frames,3);assert.equal(spec.minScreenSize,0);assert.ok(spec.duration<=.38);assert.ok(spec.worldSizeM<=1.16);assert.equal(spec.occlude,true);
  }
  const css=readFileSync(new URL('../src/styles/game.css',import.meta.url),'utf8');assert.match(css,/heavyImpact45"\]\{mix-blend-mode:normal;filter:none;/);
});

test('missing detailed atlas uses material-safe early debris fallback, never old distant atlas',()=>{
  const s=selector({primaryReady:false});for(const m of ['concrete','metal','wood']){assert.equal(s.emit(m),true);assert.equal(s.calls.at(-1)[0],m+'Impact45');}assert.equal(s.draws,3);
});
test('penetration exit ring retires without losing its RNG draw or physical exit surface feedback',()=>{
  let draws=0;const c=vm.createContext({Math:Object.assign(Object.create(Math),{random:()=>{draws++;return .5;}}),playGeneratedCombatVfx:()=>{throw new Error('Retired ring emitted');}});
  vm.runInContext(fn('showGeneratedPenetrationExitVfx'),c);for(const surface of ['concrete','metal','wood'])assert.equal(c.showGeneratedPenetrationExitVfx({},surface),false);assert.equal(draws,3);
  const combat=readFileSync(new URL('../src/combat/combat.js',import.meta.url),'utf8');assert.equal((combat.match(/wallImpact\(pen.exitPoint/g)||[]).length,2);
});
test('detailed near/far metadata is physical and heavy animation skips the circular source cell',()=>{
  const start=catalog.indexOf('const GENERATED_COMBAT_VFX_SPECS='),end=catalog.indexOf('function generatedCombatVfxSpec(',start);const c=vm.createContext({});vm.runInContext(catalog.slice(start,end)+';globalThis.specs=GENERATED_COMBAT_VFX_SPECS;',c);
  for(const kind of ['concreteImpact29','metalImpact29','heavyImpact29']){const spec=c.specs[kind];assert.ok(spec.worldSizeM>0);assert.equal(spec.minScreenSize,0);assert.equal(spec.occlude,true);}
  assert.ok(!c.specs.heavyImpact29.sequence.includes(0));
  const state=readFileSync(new URL('../src/player/state.js',import.meta.url),'utf8');assert.match(state,/typeof warmSurfaceImpactVfx==='function'\)warmSurfaceImpactVfx\(\)/);
});
