import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const settings=read('src/settings/settings.js'),system=read('src/weapons/system.js');

test('production bomb cooldown is exactly180s for player and every bot',()=>{
 assert.ok(system.includes('const BOMB_COOLDOWN_SECONDS=180;'));
 assert.match(system,/BOT_BOMB_CFG=\{[^\n]*cooldown:BOMB_COOLDOWN_SECONDS/);
 const bots=read('src/ai/bot-deployables.js');assert.ok(bots.includes('bot.bombCD=BOT_BOMB_CFG.cooldown;'));
 assert.ok(!bots.includes('BOT_BOMB_CFG.cooldown+'));
});
function fn(source,name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);let i=source.indexOf('{',start)+1,depth=1;for(;depth;i++){if(source[i]==='{')depth++;if(source[i]==='}')depth--;}return source.slice(start,i);}

test('old fuse badge never attaches to bombs and stale badges are removed without affecting mine fallback',()=>{
 const combat=read('src/combat/combat.js');let creates=0,frames=0,removes=0;
 const badge=()=>({isConnected:true,dataset:{},style:{setProperty(){}},remove(){this.isConnected=false;removes++;}});
 const bomb={kind:'bomb',m:{position:{}},fuseT:45},stale=badge();stale._mineRef=bomb;bomb._fuseArt=stale;
 const mine={kind:'mine',armed:true,m:{position:{}}};
 const point={x:0,y:0,z:0,copy(){this.x=0;this.y=0;this.z=0;return this;},project(){this.y=.1;this.z=.5;return this;}};
 const c={mines:[bomb,mine],explosiveFuseArtNodes:new Set([stale]),explosiveFuseScreenPos:point,G:()=>({appendChild(){}}),document:{createElement(){creates++;return badge();}},camera:{position:{distanceTo:()=>5}},wallMeshes:[],wallBetween:()=>false,W:1280,H:720,applyPresentationAtlasFrame(){frames++;},explosiveFusePresentationFrame:s=>s};
 vm.createContext(c);vm.runInContext(fn(combat,'ensureExplosiveFuseArt')+'\n'+fn(combat,'explosiveFusePresentationState')+'\n'+fn(combat,'syncExplosiveFuseArt'),c);
 assert.equal(c.ensureExplosiveFuseArt(bomb),null);assert.equal(creates,0);
 for(const fuse of [45,43,8,1]){bomb.fuseT=fuse;c.syncExplosiveFuseArt();}
 assert.equal(removes,1);assert.equal(bomb._fuseArt,null);assert.equal(stale.isConnected,false);assert.equal(creates,1);assert.equal(c.explosiveFuseArtNodes.size,1);assert.equal(mine._fuseArt.style.visibility,'visible');assert.equal(frames,1);
 c.mines=[];c.syncExplosiveFuseArt();assert.equal(c.explosiveFuseArtNodes.size,0);assert.equal(removes,2);
});

test('bomb countdown emits no old fuse spark/smoke and preserves actual particle-owner RNG consumption',()=>{
 const combat=read('src/combat/combat.js'),engine=read('src/core/engine.js');
 for(const roll of [.3,.8]){
  const refMath=Object.create(Math),newMath=Object.create(Math);let oldDraws=0,newDraws=0,particles=0;
  refMath.random=()=>{oldDraws++;return roll;};newMath.random=()=>{newDraws++;return roll;};
  const reference={Math:refMath,_spawnP(){particles++;}};vm.createContext(reference);vm.runInContext(fn(engine,'spawnSpark')+'\n'+fn(engine,'spawnSmoke'),reference);
  reference.spawnSpark({x:0,y:0,z:0},0xffb22e);if(refMath.random()<.45)reference.spawnSmoke({x:0,y:0,z:0},0x5d5148);
  const timerCalls=[],ctx={clearRect(){},fillRect(){},fillText(text){timerCalls.push(text);}};
  const spark={visible:true},mn={fuseT:45,fuseTotal:45,m:{userData:{bombSpark:spark,fuseSegments:[]}},timerSecond:-1,timerCanvas:{width:192,height:48,getContext:()=>ctx},timerTexture:{}};
  const c={Math:newMath,BOMB_FUSE_SECONDS:45,ensureBombTimer(){},spawnSpark(){throw Error('obsolete sparks');},spawnSmoke(){throw Error('obsolete smoke');}};
  vm.createContext(c);vm.runInContext(fn(combat,'updateBombFuseVisual'),c);c.updateBombFuseVisual(mn,.01);
  assert.equal(newDraws,oldDraws);assert.equal(spark.visible,false);assert.equal(mn.sparkEmitT,.10);assert.deepEqual(timerCalls,['00:45']);assert.equal(mn.timerTexture.needsUpdate,true);
  const draws=newDraws;c.updateBombFuseVisual(mn,.01);assert.equal(newDraws,draws);
  mn.fuseT=8;mn.sparkEmitT=0;c.updateBombFuseVisual(mn,.01);assert.equal(newDraws,2*oldDraws);assert.equal(mn.sparkEmitT,.045);assert.equal(timerCalls.at(-1),'00:08');assert.equal(particles,roll<.45?2:1);
 }
});
test('all nine runtime derivatives match exact approved candidates, envelope, dimensions and alpha',()=>{
 const manifest=JSON.parse(read('asset-staging/2026-10-04-bomb-pack-41/manifest.json'));assert.equal(manifest.files.length,9);
 for(const file of manifest.files){
  const bytes=readFileSync(new URL('../'+file.path,import.meta.url)),candidate=readFileSync(new URL('../asset-staging/2026-10-04-bomb-pack-41/candidates/'+file.path.split('/').at(-1),import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path);assert.deepEqual(bytes,candidate);
  assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.equal(bytes.toString('ascii',12,16),'VP8X');assert.ok(bytes[20]&16);
  assert.deepEqual([1+bytes.readUIntLE(24,3),1+bytes.readUIntLE(27,3)],file.size);assert.ok(file.bytes<(file.event==='single chronological blast'?5:3)*1024*1024);assert.equal(file.alpha_extrema[0],0);assert.ok(file.alpha_extrema[1]>240);
 }
});
test('strict one-shot probes reject loading, missing and wrong-size bomb art without retry',()=>{
 const probes=[],assets={pack41BombPlant:'plant',pack41BombExplosionA:'a'},c={GAME_PRESENTATION_ASSETS_ENABLED:true,GAME_ASSETS:{presentationVfx:assets},gameAssetUrl:x=>x,Image:class{constructor(){probes.push(this);this.complete=false;}}};
 vm.createContext(c);vm.runInContext(settings.slice(settings.indexOf('const BOMB_PRESENTATION_DIMENSIONS41='),settings.indexOf('function clearBombPresentation41(')),c);
 assert.equal(c.bombPresentationAssetReady41('pack41BombPlant'),false);assert.equal(probes.length,1);
 Object.assign(probes[0],{complete:true,naturalWidth:1,naturalHeight:1});assert.equal(c.bombPresentationAssetReady41('pack41BombPlant'),false);
 Object.assign(probes[0],{naturalWidth:3200,naturalHeight:1800});assert.equal(c.bombPresentationAssetReady41('pack41BombPlant'),true);
 Object.assign(probes[0],{naturalWidth:0,naturalHeight:0});for(let i=0;i<20;i++)assert.equal(c.bombPresentationAssetReady41('pack41BombPlant'),false);assert.equal(probes.length,1);
 assert.equal(c.bombPresentationAssetReady41('unknown'),false);
});
test('one chronological detonation has17 distinct frames without extra RNG; smoke/scorch are independent; missing variant preserves old fallback',()=>{
 const events=[];let rng=0;const c={Math:Object.create(Math),bombPresentationAssetReady41:()=>true,rocketPresentationAssetReady35:()=>true,playGeneratedCombatVfx:(kind,opts)=>{events.push({kind,opts});return true;}};
 c.Math.random=()=>{rng++;return .5;};vm.createContext(c);vm.runInContext(fn(settings,'showGeneratedBombDetonationVfx'),c);
 const pos={y:.34,clone(){return {y:this.y};}};
 for(let i=0;i<4;i++)c.showGeneratedBombDetonationVfx(pos);
 assert.deepEqual(events.filter(e=>e.kind.startsWith('bombExplosion')).map(e=>e.kind),['bombExplosion41','bombExplosion41','bombExplosion41','bombExplosion41']);assert.equal(rng,4);
 assert.equal(events.filter(e=>e.kind==='bombSmoke41').length,4);assert.equal(events.filter(e=>e.kind==='bombScorch41').length,4);
 assert.equal(events.filter(e=>e.kind==='bombShockwave41').length,4);assert.ok(events.filter(e=>e.kind==='bombShockwave41').every(e=>e.opts.groundY===0&&e.opts.delay===.04));
 c.bombPresentationAssetReady41=key=>key!=='pack41BombShockwave';events.length=0;c.showGeneratedBombDetonationVfx(pos);assert.equal(events.filter(e=>e.kind==='bombShockwave41').length,0);assert.equal(events.filter(e=>e.kind==='bombExplosion41').length,1);
 c.bombPresentationAssetReady41=()=>false;events.length=0;assert.equal(c.showGeneratedBombDetonationVfx(pos),false);assert.deepEqual(events,[]);assert.equal(rng,6);
});
test('action decode failure retains current visible layer; clear only detonation nodes through canonical removal',()=>{
 const c={bombPresentationAssetReady41:()=>false,playGeneratedFirstPersonAction(){throw new Error('unloaded action must not hide ready');}};
 vm.createContext(c);vm.runInContext(fn(settings,'showGeneratedBombArmVfx'),c);assert.equal(c.showGeneratedBombArmVfx(.96),false);
 const removed=[],items=[{kind:'bombExplosion41'},{kind:'bombSmoke41'},{kind:'bombScorch41'},{kind:'rifleSmoke36'}];
 const f={generatedCombatVfx:items,removeGeneratedCombatVfx:i=>removed.push(i.kind)};vm.createContext(f);vm.runInContext(fn(settings,'clearBombPresentation41'),f);f.clearBombPresentation41();assert.deepEqual(removed,items.slice(0,3).map(i=>i.kind));
 assert.ok(system.includes("action.classList.add('bomb-action-viewport')"));assert.ok(system.includes("if(typeof cancelPendingBombPlant==='function')cancelPendingBombPlant();"));
});

test('single blast uses all17 source cells in order, never selection between animations',()=>{
 const source=read('src/assets/catalog.js');const m=source.match(/bombExplosion41:Object.freeze\(([^\n]+)/);assert.ok(m);assert.ok(m[1].includes('frames:17'));assert.ok(m[1].includes('cols:5,rows:4'));assert.ok(!m[1].includes('sequence:'));assert.ok(!settings.includes('selected[0]'));
 const manifest=JSON.parse(read('asset-staging/2026-10-04-bomb-pack-41/manifest.json'));const blast=manifest.files.find(f=>f.event==='single chronological blast');assert.equal(blast.source_windows.length,17);
});

test('wider bomb fire and wave are cosmetic; canonical player/bot damage radii remain unchanged',()=>{
 const source=read('src/assets/catalog.js');
 const fire=source.match(/bombExplosion41:Object.freeze\(([^\n]+)/)[1],wave=source.match(/bombShockwave41:Object.freeze\(([^\n]+)/)[1];
 assert.ok(fire.includes('width:1075,height:768'));assert.ok(fire.includes('worldSizeM:18'));assert.ok(wave.includes('worldSizeM:28'));assert.ok(wave.includes('groundPlane:true'));
 assert.ok(system.includes('const BOMB_BLAST_RADIUS=34;'));assert.match(system,/BOT_BOMB_CFG=\{dmg:10500,radius:32,/);
 assert.match(read('src/styles/game.css'),/\.generated-combat-vfx\[data-kind\^="bomb"\]\{[^}]*max-width:none;max-height:none;/);
});

test('decoded bomb blast suppresses old geometric layers and preserves their RNG stream',()=>{
 const engine=read('src/core/engine.js'),combat=read('src/combat/combat.js');
 for(const low of [false,true]){
  let draws=0;const math=Object.create(Math);math.random=()=>{draws++;return .5;};
  const c={Math:math,MOBILE_LOW:low};vm.createContext(c);vm.runInContext(fn(engine,'spawnBombBlastWave'),c);
  c.spawnBombBlastWave({},34,'player',false);assert.equal(draws,low?69:164);
 }
 assert.ok(combat.includes('18,false,false)'));
 assert.ok(combat.includes('spawnBombBlastWave(pos,radius,ownerType,false)'));
});
