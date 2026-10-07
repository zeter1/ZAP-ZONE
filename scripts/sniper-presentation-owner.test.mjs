import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';

const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const weapons=read('src/weapons/system.js'),settings=read('src/settings/settings.js');
function fn(source,name){
  const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);
  const match=source.slice(start).match(/^function [\s\S]*?\n\}/);assert.ok(match,name+' boundary');return match[0];
}
function catalog(protocol='http:'){
  const c=vm.createContext({location:{protocol},window:{},URL,document:{baseURI:protocol==='file:'?'file:///fixture/index.html':'http://127.0.0.1:8000/',querySelectorAll:()=>[],documentElement:{classList:{add(){}},style:{setProperty(){}}}},THREE:{TextureLoader:class{}}});
  vm.runInContext(read('src/assets/catalog.js'),c);return c;
}
test('Pack32 alpha WebP geometry, budget and source identity',()=>{
  const fixtures=[['assets/ui/fx/sniper-action-vfx-atlas-32.webp',2048,1536,512],['assets/ui/fx/sniper-effects-vfx-atlas-32.webp',512,512,96],['assets/ui/weapons/fp/player-sniper-fps-32.webp',960,720,120]];
  for(const [p,w,h,kib] of fixtures){const b=readFileSync(resolve(root,p));assert.equal(b.toString('ascii',12,16),'VP8X');assert.ok(b[20]&16);assert.equal(1+b.readUIntLE(24,3),w);assert.equal(1+b.readUIntLE(27,3),h);assert.ok(b.length<=kib*1024);}
  const m=JSON.parse(read('asset-staging/2026-10-03-sniper-pack-32/manifest.json'));assert.equal(m.readyFrame,11);
});
test('reload and bolt end in the exact ready cell; extraction is frame13 at .38',()=>{
  const c=catalog();
  for(const kind of ['sniperReloadTactical32','sniperReloadEmpty32','sniperBoltCycle32']){
    const spec=vm.runInContext(`generatedCombatVfxSpec('${kind}')`,c);
    const seq=spec.sequence||Array.from({length:spec.frames},(_,i)=>i);
    assert.equal(seq.length,spec.frames);assert.equal(seq.at(-1),11);assert.ok(seq.every(i=>i>=0&&i<16));
  }
  assert.equal(vm.runInContext('generatedCombatVfxSpec("sniperBoltCycle32").sequence[Math.floor(.38*6)]',c),13);
  const lastCasing=vm.runInContext('generatedCombatVfxFrame("sniperCasing32",3)',c);
  assert.equal(lastCasing.asset,'http://127.0.0.1:8000/assets/ui/fx/sniper-effects-vfx-atlas-32.webp');
  assert.equal(lastCasing.col,3);assert.equal(lastCasing.row,3);
  for(const kind of ['sniperMuzzle32','sniperSmoke32','sniperBullet32','sniperCasing32'])assert.equal(vm.runInContext(`generatedCombatVfxSpec('${kind}').frames`,c),4);
});
test('asset probe cannot suppress fallback while missing/loading and never retries a failure',()=>{
  const made=[];
  const c=vm.createContext({GAME_ASSETS:{presentationVfx:{pack32SniperAction:'action.webp'}},gameAssetUrl:p=>p,Image:class{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;made.push(this);}}});
  vm.runInContext('const sniperPresentationProbes32=new Map();\n'+fn(settings,'sniperPresentationAssetReady32'),c);
  assert.equal(vm.runInContext('sniperPresentationAssetReady32("pack32SniperAction")',c),false);
  made[0].complete=true;assert.equal(vm.runInContext('sniperPresentationAssetReady32("pack32SniperAction")',c),false);assert.equal(made.length,1);
  made[0].naturalWidth=1024;made[0].naturalHeight=768;assert.equal(vm.runInContext('sniperPresentationAssetReady32("pack32SniperAction")',c),true);
});
test('partial and empty reload use authoritative duration; missing atlas retains magazine fallback',()=>{
  for(const empty of [false,true])for(const ready of [false,true]){
    const calls=[],nodes=new Map(),fixtureMath=Object.create(Math);let draws=0;
    fixtureMath.random=()=>{draws++;return .375;};
    const c=vm.createContext({Math:fixtureMath,getW:()=>({key:'sniper',clip:5,reload:3.4,tacticalReloadM:.94,emptyReloadM:1.10,aimMode:'scope'}),reloading:false,ammo:empty?0:2,uAmmo:20,weaponActionBlocked:()=>false,zooming:true,reloadShellLoaded:0,playerReloadUsesFullPresentation:false,reloadMode:'mag',reloadT:0,reloadTot:0,sniperPresentationAssetReady32:()=>ready,playGeneratedFirstPersonAction:(kind,duration)=>{calls.push({kind,duration});return true;},playGeneratedCombatVfx:kind=>{calls.push({effect:kind});return true;},playWeaponMechanicSound(){},G:id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',style:{}});return id==='reload-state-art'?null:nodes.get(id);}});
    vm.runInContext(fn(settings,'showGeneratedMagazineDropFx')+'\n'+fn(weapons,'showGeneratedSniperReloadVfx')+'\n'+fn(read('src/combat/combat.js'),'doReload')+'\ndoReload();',c);
    assert.equal(c.zooming,false);assert.equal(c.playerReloadUsesFullPresentation,ready);
    assert.equal(draws,1,'original sniper reload consumed exactly one magazine rotation draw, regardless of asset readiness');
    if(ready){assert.equal(calls[0].kind,empty?'sniperReloadEmpty32':'sniperReloadTactical32');assert.ok(Math.abs(calls[0].duration-(empty?3.74:3.196))<1e-8);assert.ok(!calls.some(v=>v.effect==='magazineDrop'));}
    else assert.equal(calls[0].effect,'magazineDrop');
  }
});
test('bolt action blocks scope only while the action is active',()=>{
  let active='sniperBoltCycle32';const c=vm.createContext({isGeneratedFirstPersonActionActive:k=>k===active});
  vm.runInContext(fn(weapons,'generatedFirstPersonActionBlocksScope'),c);
  assert.equal(vm.runInContext('generatedFirstPersonActionBlocksScope()',c),true);active='';assert.equal(vm.runInContext('generatedFirstPersonActionBlocksScope()',c),false);
});
