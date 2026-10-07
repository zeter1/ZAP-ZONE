import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const combat=read('src/combat/combat.js'),settings=read('src/settings/settings.js'),engine=read('src/core/engine.js'),catalog=read('src/assets/catalog.js');
function fn(source,name){
  const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);
  const open=source.indexOf('{',start);let depth=1,i=open+1;
  for(;depth;i++){if(source[i]==='{')depth++;if(source[i]==='}')depth--;}
  const extracted=source.slice(start,i);
  // Mine-only worlds still call the new canonical bomb sync; exercise its empty-world path.
  if(name==='tickMines')return 'const bombWorldArtNodes41=new Set();\n'+fn(source,'syncBombWorldArt41')+'\n'+extracted;
  return extracted;
}
class Vec{
  constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}
  clone(){return new Vec(this.x,this.y,this.z);}
  set(x,y,z){Object.assign(this,{x,y,z});return this;}
  normalize(){return this.multiplyScalar(1/(Math.hypot(this.x,this.y,this.z)||1));}
  copy(v){Object.assign(this,{x:v.x,y:v.y,z:v.z});return this;}
  applyQuaternion(){return this;}
  multiplyScalar(n){this.x*=n;this.y*=n;this.z*=n;return this;}
  addScaledVector(v,n){this.x+=v.x*n;this.y+=v.y*n;this.z+=v.z*n;return this;}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
  project(){this.x/=20;this.y/=20;this.z=.5;return this;}
}
function throwFixture(slot=5){
 const c={curW:slot,running:true,paused:false,dying:false,lvlAnnOpen:false,perkPickOpen:false,reloading:false,sCD:0,
  WEAPONS:Array.from({length:6},()=>({rate:.9,dmg:130})),playerMineCD:0,MAX_PLAYER_MINES:4,MAX_MINES:10,
  mines:[],stock:4,weaponReserveValue:()=>0,weaponAmmoValue:()=>c.stock,setWeaponAmmo:(i,n)=>{c.stock=n;},ownsWeapon:()=>true,
  playerMineCount:()=>c.mines.length,testingInfiniteAmmoEnabled:()=>false,updateWeaponBar(){},wHUD(){},showMsg(){},updateMineHUD(){},
  camera:{position:new Vec(0,1.7,0),quaternion:{}},THREE:{Vector3:Vec},scene:{add(m){m.parent={};}},mkMine:()=>({position:new Vec()}),
  PLAYER_DAMAGE_BOOST:1,EXPLOSION_DAMAGE_BOOST:1,playerDamageMultiplier:()=>1,
  plr:{mineDamageM:1,explosiveDamageM:1,explosiveRadiusM:1,mineRadiusM:1,mineCooldownM:1},MINE_COOLDOWN_SECONDS:10,
  fpGeneratedWeaponAction:null,stopGeneratedFirstPersonAction(){c.fpGeneratedWeaponAction=null;},
  showGeneratedMineThrowVfx(){c.fpGeneratedWeaponAction={kind:'mineThrow39'};return c.animated;},animated:true,playMineSound39(){}};
 vm.createContext(c);vm.runInContext(combat.slice(combat.indexOf('let pendingMineThrow=null;'),combat.indexOf('function placeBomb(){')),c);
 const run=s=>vm.runInContext(s,c),tick=dt=>run(`tickPendingMineThrow(${dt})`);
 return {c,run,tick};
}
test('native and F quick throw emit once at frame3, consume ammo only on real release',()=>{
 for(const slot of [5,2]){const f=throwFixture(slot);f.run('throwMine();throwMine()');
  assert.equal(f.c.stock,4);assert.equal(f.c.mines.length,0);assert.equal(f.c.playerMineCD,0);
  for(let i=0;i<5;i++)f.tick(.05);assert.equal(f.c.mines.length,0);
  f.tick(.04);assert.equal(f.c.mines.length,1);assert.equal(f.c.stock,3);assert.equal(f.c.sCD,.9);
  assert.equal(f.c.mines[0].aT,1.5);assert.equal(f.c.mines[0].radius,9);assert.equal(f.c.mines[0].dmg,130);
  for(let i=0;i<12;i++)f.tick(.05);assert.equal(f.c.mines.length,1);assert.equal(f.c.stock,3);
 }
});
test('cancel before release then retry; cancellation after release preserves emitted mine',()=>{
 const f=throwFixture();f.run('throwMine()');f.tick(.05);f.run('cancelPendingMineThrow()');
 assert.equal(f.c.stock,4);assert.equal(f.c.playerMineCD,0);assert.equal(f.c.fpGeneratedWeaponAction,null);
 f.run('throwMine()');for(let i=0;i<6;i++)f.tick(.05);f.run('cancelPendingMineThrow()');
 assert.equal(f.c.mines.length,1);assert.equal(f.c.stock,3);
});
test('switch, pause, death, menu and reload reject pending release without ammo loss',()=>{
 for(const mutation of ['curW=2','paused=true','dying=true','running=false','reloading=true','perkPickOpen=true']){
  const f=throwFixture();f.run('throwMine()');f.tick(.05);f.run(mutation);for(let i=0;i<8;i++)f.tick(.05);
  assert.equal(f.c.stock,4,mutation);assert.equal(f.c.mines.length,0,mutation);assert.equal(f.c.playerMineCD,0,mutation);
 }
});
test('release revalidates object cap and missing action uses working immediate fallback',()=>{
 const f=throwFixture();f.run('throwMine()');f.c.MAX_MINES=0;for(let i=0;i<6;i++)f.tick(.05);
 assert.equal(f.c.stock,4);assert.equal(f.c.fpGeneratedWeaponAction,null);
 const g=throwFixture();g.c.animated=false;g.run('throwMine()');assert.equal(g.c.mines.length,1);assert.equal(g.c.stock,3);
});
class PerspectiveVec extends Vec{
 clone(){return new PerspectiveVec(this.x,this.y,this.z);}
 project(camera){
  const dx=this.x-camera.position.x,dy=this.y-camera.position.y,dz=this.z-camera.position.z;
  const yaw=camera.yaw||0,pitch=camera.pitch||0,c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  const horizontal=dx*c-dz*s,depth=-dx*s-dz*c,vertical=dy*cp-depth*sp,z=depth*cp+dy*sp;
  const tan=Math.tan(camera.fov*Math.PI/360);
  this.x=horizontal/(z*tan*1.25);this.y=vertical/(z*tan);this.z=z>.05?.5:2;return this;
 }
}
class Object3D {
 constructor(){this.position=new PerspectiveVec();this.rotation={x:0,y:0,z:0};this.children=[];this.visible=true;this.userData={};}
 add(obj){obj.parent=this;this.children.push(obj);}
 remove(obj){const i=this.children.indexOf(obj);if(i>=0)this.children.splice(i,1);obj.parent=null;}
 traverse(cb){cb(this);for(const obj of this.children)obj.traverse(cb);}
}
class Geometry {constructor(...args){this.args=args;this.disposals=0;}dispose(){this.disposals++;}}
class Material {constructor(opts){Object.assign(this,opts);this.disposals=0;this.color={setHex:n=>{this.hex=n;}};}dispose(){this.disposals++;}}
class Mesh extends Object3D {constructor(geometry,material){super();Object.assign(this,{geometry,material});}}
class Matrix4 {makeRotationY(angle){this.angle=angle;return this;}setPosition(x,y,z){this.position={x,y,z};return this;}}
class InstancedMesh extends Mesh {constructor(geometry,material,count){super(geometry,material);this.count=count;this.matrices=[];this.instanceMatrix={};this.disposals=0;}dispose(){this.disposals++;}setMatrixAt(i,matrix){this.matrices[i]={angle:matrix.angle,position:{...matrix.position}};}}
class Texture {constructor(image){this.image=image;this.disposals=0;this.repeat={set:(x,y)=>{this.repeat.x=x;this.repeat.y=y;}};this.offset={set:(x,y)=>{this.offset.x=x;this.offset.y=y;}};}dispose(){this.disposals++;}}
function worldFixture(){
 const elements=[],probes=[],layer={appendChild(el){el.isConnected=true;elements.push(el);}};
 const c={THREE:{Vector3:PerspectiveVec,Group:Object3D,Mesh,InstancedMesh,Matrix4,CylinderGeometry:Geometry,BoxGeometry:Geometry,PlaneGeometry:Geometry,TorusGeometry:Geometry,MeshLambertMaterial:Material,MeshBasicMaterial:Material,Texture,sRGBEncoding:3001,LinearFilter:1006},mines:[],MAX_MINES:2,innerWidth:1000,innerHeight:800,
  camera:{position:new Vec(0,1.75,0),fov:75},wallMeshes:[],blocked:false,G:()=>layer,
  GAME_LOCAL_FILE_MODE:false,GAME_PRESENTATION_ASSETS_ENABLED:true,GAME_ASSETS:{presentationVfx:{pack39MineWorld:'world.webp'}},gameAssetUrl:x=>x,
  Image:class{constructor(){probes.push(this);this.complete=false;}},
  document:{createElement(){return {style:{},dataset:{},setAttribute(){},remove(){this.isConnected=false;}};}},
  presentationAtlasFrame:(asset,col,row)=>({asset,col,row}),applyPresentationAtlasFrame:(el,f)=>{el.frame=f;}};
 c.scene={remove(obj){if(obj.parent===this)obj.parent=null;}};c.wallBetween=()=>c.blocked;c.Math=Object.create(Math);c.Math.random=()=>{throw Error('no cosmetic RNG');};
 vm.createContext(c);vm.runInContext(settings.slice(settings.indexOf('const MINE_PRESENTATION_DIMENSIONS39'),settings.indexOf('function mineDetonationPresentationReady39'))+'\n'+combat.slice(combat.indexOf('// Pack39 mine body:'),combat.indexOf('// End Pack39 mine body.'))+'\n'+['disposeMaterial','disposeObject3D','destroySceneObject'].map(n=>fn(engine,n)).join('\n')+'\n'+fn(settings,'positionGroundGrenadeDecal'),c);
 const mine=()=>{const m=new Object3D();m.parent={};m.position.set(0,.08,-10);for(let i=0;i<4;i++)m.add(new Object3D());return{fall:true,ph:0,aT:1.5,armed:false,m};};
 const ready=()=>{c.minePresentationAssetReady39('pack39MineWorld');Object.assign(probes[0],{complete:true,naturalWidth:1536,naturalHeight:1536});};
 return {c,elements,probes,mine,ready};
}
test('strict decode preserves fallback; flight cells then horizontal actual3D top with original coarse body hidden',()=>{
 const f=worldFixture(),m=f.mine();f.c.mines.push(m);f.c.syncMineWorldArt39();assert.equal(m.m.visible,true);
 Object.assign(f.probes[0],{complete:true,naturalWidth:512,naturalHeight:512});f.c.syncMineWorldArt39();assert.equal(f.elements.length,0);
 f.ready();f.c.syncMineWorldArt39();assert.equal(m.m.visible,false);assert.equal(f.elements[0].frame.col,2);assert.equal(f.elements[0].frame.row,1);
 m.fall=false;f.c.syncMineWorldArt39();const body=m._mineBody39,top=body.userData.top;
 assert.equal(f.elements[0].style.visibility,'hidden');assert.equal(f.elements[0].dataset.plane,'mesh');
 assert.equal(m.m.visible,true);assert.ok(m.m.children.slice(0,4).every(mesh=>!mesh.visible));assert.equal(body.parent,m.m);
 assert.equal(top.rotation.x,-Math.PI/2);assert.equal(top.position.y,-.021);
 assert.equal(top.material.depthTest,true);assert.equal(top.material.depthWrite,true);assert.equal(top.material.alphaTest,.025);
 assert.equal(top.material.map.image,f.probes[0]);assert.equal(top.material.map.repeat.x,.25);assert.equal(top.material.map.repeat.y,.25);assert.equal(top.material.map.offset.x,1088/1536);assert.equal(top.material.map.offset.y,64/1536);
 m.armed=true;m.ph=.2;f.c.syncMineWorldArt39();assert.equal(body.userData.indicator.material.hex,0xff7626);
 m.fall=true;f.c.syncMineWorldArt39();assert.equal(m.m.visible,false);assert.equal(body.visible,false);assert.equal(f.elements[0].dataset.plane,'flight');
 f.c.blocked=true;f.c.syncMineWorldArt39();assert.equal(f.elements[0].style.visibility,'hidden');
});
test('bounded nodes, bombs untouched, removal/failure/restart restore original mesh visibility',()=>{
 const f=worldFixture();f.ready();const a=f.mine(),b=f.mine(),d=f.mine(),bomb=f.mine();bomb.kind='bomb';b.m.visible=false;
 f.c.mines.push(a,b,d,bomb);f.c.syncMineWorldArt39();assert.equal(f.elements.length,2);assert.equal(bomb.m.visible,true);
 f.c.clearMineWorldArt39();assert.equal(a.m.visible,true);assert.equal(b.m.visible,false);
 f.c.syncMineWorldArt39();assert.equal(f.elements.length,4);f.c.mines.length=0;f.c.syncMineWorldArt39();assert.ok(f.elements.every(e=>!e.isConnected));
});
test('Pack39 detonation replaces procedural publication while retaining historical RNG exactly',()=>{
 for(const mobile of [false,true]){let draws=0;const events=[];
  const c={MOBILE_LOW:mobile,VISUAL_LIGHTS:false,Math:Object.create(Math),_spawnP(){events.push('particle');},spawnExplosionFx(){events.push('ring');},triggerExplosionShockwave(){events.push('shockwave');}};
  c.Math.random=()=>{draws++;return .5;};vm.createContext(c);vm.runInContext(['spawnP','spawnSmoke','spawnSpark','explode'].map(n=>fn(engine,n)).join('\n'),c);
  c.explode(new Vec(),0,6,true);const expected=draws;assert.ok(events.includes('ring'));assert.ok(events.includes('shockwave'));
  draws=0;events.length=0;c.explode(new Vec(),0,6,false,false);assert.equal(draws,expected);assert.deepEqual(events,[]);
 }
});
test('distinct utilities, ground-only 15s hot/cold scar and one detonation audio fallback',()=>{
 const calls=[];let draws=0;const c={Math:Object.create(Math),mineDetonationPresentationReady39:()=>true,playGeneratedCombatVfx:(...x)=>{calls.push(x);return true;}};
 c.Math.random=()=>{draws++;return .5;};vm.createContext(c);vm.runInContext(fn(settings,'showGeneratedMineDetonationVfx'),c);
 c.showGeneratedMineDetonationVfx(new Vec(),null);assert.equal(draws,1);assert.equal(calls.length,4);assert.ok(!calls.some(([kind])=>kind==='mineScorch39'));
 calls.length=0;c.showGeneratedMineDetonationVfx(new Vec(),-.04);assert.equal(calls.length,5);assert.equal(calls.find(([k])=>k==='mineScorch39')[1].groundY,-.04);
 assert.match(catalog,/mineScorch39:Object.freeze\(\{[^\n]*sequence:Object.freeze\(\[3,4\]\)[^\n]*duration:15/);
 const audio=[];Object.assign(c,{playBufferSfx:(key)=>{audio.push(key);return c.loaded;},spatialAudioMix:()=>({gain:1}),playSfx:key=>audio.push(key),loaded:true});
 vm.runInContext(fn(settings,'playMineSound39'),c);c.playMineSound39('Detonate');assert.deepEqual(audio,['mineDetonate39']);audio.length=0;c.loaded=false;c.playMineSound39('Detonate');assert.deepEqual(audio,['mineDetonate39','explosion']);
});
test('runtime Pack39 assets are byte-identical approved candidates, PCM mono22050 WAV',()=>{
 const map={'player-mine-ready-39.webp':'assets/ui/weapons/fp','player-mine-throw-atlas-39.webp':'assets/ui/fx','player-mine-reload-atlas-39.webp':'assets/ui/fx','mine-world-states-atlas-39.webp':'assets/ui/fx','mine-explosion-atlas-39.webp':'assets/ui/fx','mine-smoke-atlas-39.webp':'assets/ui/fx','mine-utility-atlas-39.webp':'assets/ui/fx','world-mine-pickup-39.webp':'assets/ui/pickups/weapons','mine-weapon-icon-39.webp':'assets/ui/weapons'};
 const hash=b=>createHash('sha256').update(b).digest('hex');
 for(const [name,dir] of Object.entries(map))assert.equal(hash(readFileSync(resolve(root,dir,name))),hash(readFileSync(resolve(root,'asset-staging/2026-10-04-mine-pack-39/candidates',name))),name);
 for(const event of ['throw','land','arm','trigger','detonate']){const name=`mine-${event}-39.wav`,b=readFileSync(resolve(root,'assets/audio',name));assert.equal(b.readUInt16LE(20),1);assert.equal(b.readUInt16LE(22),1);assert.equal(b.readUInt32LE(24),22050);assert.equal(hash(b),hash(readFileSync(resolve(root,'asset-staging/2026-10-04-mine-pack-39/audio',name))));}
});

test('FPS missing action keeps working ready; matching legacy action and Pack39 reload are gated',()=>{
 const weapons=read('src/weapons/system.js'),calls=[];
 const c={ready:false,G:()=>({dataset:{minePack:'39'},style:{opacity:'1'}}),getW:()=>({isMine:true}),minePresentationAssetReady39:()=>c.ready,playGeneratedFirstPersonAction:(...a)=>{calls.push(a);return true;}};
 vm.createContext(c);vm.runInContext(fn(weapons,'showGeneratedMineThrowVfx')+'\n'+fn(weapons,'showGeneratedMineReloadVfx'),c);
 assert.equal(c.showGeneratedMineThrowVfx(),false);assert.equal(c.showGeneratedMineReloadVfx(3.2),false);assert.equal(calls.length,0);
 c.ready=true;assert.equal(c.showGeneratedMineThrowVfx(),true);assert.equal(calls[0][0],'mineThrow39');c.showGeneratedMineReloadVfx(2.7);assert.deepEqual(calls[1],['mineReload39',2.7]);
 c.ready=false;c.G=()=>({dataset:{minePack:'01'}});c.showGeneratedMineThrowVfx();assert.equal(calls[2][0],'mineThrow24');
});
test('real mine physics produces land then arm then one trigger/detonation; fallback never creates ring',()=>{
 const f=throwFixture(),events=[];f.c.animated=false;
 Object.assign(f.c,{enemies:[],playMineSound39:(event)=>events.push(event),showGeneratedMineEvent39:(kind)=>events.push(kind),
  syncMineWorldArt39(){},mineDetonationPresentationReady39:()=>false,triggerScreenShake(){},BOT_R:.4,PLR_R:.35,onGnd:true,wallMeshes:[],wallBetween:()=>false,hp:100,awardExplosionKill(){},
  explode:(...a)=>events.push(['explode',a[3],a[4]]),showGeneratedMineDetonationVfx:(_,ground)=>events.push(['scar',ground]),
  applyBlastDamage:()=>events.push('damage'),destroySceneObject(){}});
 vm.runInContext(['mineContactActors','applyMineContactKills','tickMines'].map(n=>fn(combat,n)).join('\n'),f.c);f.run('throwMine()');const mine=f.c.mines[0];mine.m.children=[];
 for(let i=0;i<100&&mine.fall;i++)f.c.tickMines(.033);
 assert.equal(mine.fall,false);assert.equal(events.filter(x=>x==='Land').length,1);assert.equal(mine.armed,false);
 for(let i=0;i<46;i++)f.c.tickMines(.033);
 assert.equal(mine.armed,true);assert.equal(events.filter(x=>x==='Arm').length,1);
 f.c.enemies.push({alive:true,hp:100,team:'enemy',group:{position:mine.m.position.clone()},hurt(damage){this.hp-=damage;if(this.hp<=0)this.alive=false;}});
 for(let i=0;i<12;i++)f.c.tickMines(.033);
 assert.equal(f.c.mines.length,0);assert.equal(events.filter(x=>x==='Trigger').length,1);assert.equal(events.filter(x=>x==='Detonate').length,1);assert.equal(events.filter(x=>x==='damage').length,1);
 assert.deepEqual(events.find(x=>Array.isArray(x)&&x[0]==='explode'),['explode',false,false]);
 assert.deepEqual(events.find(x=>Array.isArray(x)&&x[0]==='scar'),['scar',-.04]);
});
test('complete mine rests on floor, low profile geometry, six lugs/vents; camera cannot mutate horizontal mesh',()=>{
 const f=worldFixture(),mn=f.mine();mn.fall=false;f.ready();f.c.mines.push(mn);f.c.syncMineWorldArt39();
 const body=mn._mineBody39,resources=body.children.map(mesh=>[mesh.geometry,mesh.material,mesh.material.map]);
 assert.equal(body.children.length,7);const cylinder=body.children[0];
 assert.deepEqual(cylinder.geometry.args,[.305,.305,.052,48]);assert.equal(cylinder.position.y,-.054);
 assert.ok(Math.abs(.08+cylinder.position.y-.052/2)<1e-12,'body bottom touches actual floor');
 const lugs=body.userData.lugs,vents=body.userData.vents;
 assert.equal(lugs.count,6);assert.equal(vents.count,6);assert.deepEqual(lugs.geometry.args,[.09,.058,.045]);
 for(const matrix of lugs.matrices){assert.ok(Math.abs(.08+matrix.position.y-.058/2)<1e-12);assert.ok(matrix.position.y+.058/2<=-.017);}
 assert.equal(body.userData.indicator.position.y+.004/2,-.017,'whole body height .063m');
 const top=body.userData.top;for(const pose of [{position:new Vec(0,1.75,0)},{position:new Vec(8,.10,-10),yaw:Math.PI/2},{position:new Vec(0,8,-10),pitch:-Math.PI/2}]){
  Object.assign(f.c.camera,pose);f.c.syncMineWorldArt39();assert.equal(mn._mineBody39,body);assert.equal(top.rotation.x,-Math.PI/2);assert.equal(mn.m.rotation.y,0);assert.equal(f.elements[0].style.visibility,'hidden');
 }
 // Lose decoded presentation while body is live -> real fallback + exactly-once owned disposal.
 f.probes[0].naturalWidth=512;f.c.syncMineWorldArt39();assert.equal(mn._mineBody39,null);assert.equal(body.parent,null);assert.equal(body.userData.lugs.disposals,1);assert.equal(body.userData.vents.disposals,1);assert.ok(mn.m.children.every(mesh=>mesh.visible));
 for(const [geometry,material,texture] of resources){assert.equal(geometry.disposals,1);assert.equal(material.disposals,1);if(texture)assert.equal(texture.disposals,1);}
 f.c.clearMineWorldArt39();for(const [geometry] of resources)assert.equal(geometry.disposals,1);
 f.ready();f.c.syncMineWorldArt39();assert.notEqual(mn._mineBody39,body);assert.equal(mn._mineBody39.userData.top.material.map.image,f.probes[0],'decoded source reused without fetch');
 f.c.clearMineWorldArt39();assert.equal(mn.m.children.length,4);
});
test('ready loader failure/success cannot steal visibility from decoded throw; terminal action restores proper fallback',()=>{
 const source=read('src/weapons/system.js');
 for(const success of [false,true]){
  const style=()=>({removeProperty(){},setProperty(){}}),classes=()=>{const set=new Set();return{add(...xs){xs.forEach(x=>set.add(x));},remove(...xs){xs.forEach(x=>set.delete(x));},contains:x=>set.has(x)};};
  const wrap={style:style(),dataset:{},classList:classes(),appendChild(el){el.parentElement=this;}},stage={appendChild(el){el.parentElement=this;}},img={style:style(),dataset:{},naturalWidth:0,naturalHeight:0},action={style:style(),classList:classes(),parentElement:stage};
  const nodes={'fp-weapon-art-wrap':wrap,'fp-weapon-art-stage':stage,'fp-weapon-art':img,'fp-weapon-action':action};
  const c={running:true,G:id=>nodes[id],rigVisible:true,setProceduralFirstPersonRigVisible:v=>{c.rigVisible=v;},GAME_ASSETS:{generatedFirstPersonWeaponFallbacks:{mine:'legacy.webp'}},console:{warn(){}},generatedCombatVfxSpec:()=>({frames:6,duration:.58}),generatedCombatVfxFrame:()=>({asset:'throw.webp'}),applyPresentationAtlasFrame(){}};
  vm.createContext(c);vm.runInContext(source.slice(source.indexOf('let fpGeneratedWeaponModel='),source.indexOf('function showGeneratedPistolReloadVfx('))+'\n'+fn(source,'ensureGeneratedFirstPersonWeaponArtLoaded'),c);
  vm.runInContext("fpGeneratedWeaponPending={key:'mine',model:{},asset:'ready.webp'};ensureGeneratedFirstPersonWeaponArtLoaded();playGeneratedFirstPersonAction('mineThrow39',.58)",c);
  assert.equal(c.rigVisible,false);assert.ok(wrap.classList.contains('on'));assert.equal(img.style.opacity,'0');
  img.onerror();assert.equal(img.src,'legacy.webp');assert.ok(wrap.classList.contains('on'));
  if(success){img.naturalWidth=960;img.naturalHeight=720;img.onload();}else img.onerror();
  assert.equal(c.rigVisible,false);assert.ok(wrap.classList.contains('on'));assert.ok(action.classList.contains('on'));assert.equal(img.style.opacity,'0');
  c.stopGeneratedFirstPersonAction();assert.equal(c.rigVisible,!success);assert.equal(wrap.classList.contains('on'),success);assert.equal(img.style.opacity,'');
 }
});
test('actual nonempty rifle/shotgun flight owners remain independent of mine state',()=>{
 const f=worldFixture();Object.assign(f.c,{pBullets:[],eBullets:[],pistolPresentationAssetReady40:()=>false,riflePresentationAssetReady36:()=>true,shotgunPresentationAssetReady37:()=>true});
 f.c.GAME_ASSETS.presentationVfx.pack36RifleEffects='rifle.webp';f.c.GAME_ASSETS.presentationVfx.pack37ShotgunEffects='shotgun.webp';
 vm.runInContext(combat.slice(combat.indexOf('const rifleFlightArtNodes36'),combat.indexOf('const MAX_PLAYER_BULLETS')),f.c);
 const rifle={wKey:'rifle',pos:new Vec(0,1,-10),vel:new Vec(10,0,0),maxLife:1,life:.9,m:{visible:true}},shotgun={wKey:'shotgun',pos:new Vec(1,1,-10),vel:new Vec(10,0,0),maxLife:1,life:.9,m:{visible:false}};
 f.c.pBullets.push(rifle,shotgun);f.c.syncRifleFlightArt36();assert.equal(f.elements.length,2);assert.ok(f.elements.every(el=>el.style.visibility==='visible'));assert.equal(f.elements[0].frame.asset,'rifle.webp');assert.equal(f.elements[1].frame.asset,'shotgun.webp');
 assert.equal(rifle.m.visible,false);f.c.riflePresentationAssetReady36=()=>false;f.c.shotgunPresentationAssetReady37=()=>false;f.c.syncRifleFlightArt36();assert.ok(f.elements.every(el=>!el.isConnected));assert.equal(rifle.m.visible,true);assert.equal(shotgun.m.visible,false);f.c.pBullets.length=0;f.c.syncRifleFlightArt36();assert.equal(rifle.m.visible,true);
});
const progression=read('src/progression/progression.js');
function contactFixture(owner='player'){
 const events=[],awards=[],splash=[];
 const c={THREE:{Vector3:Vec},BOT_R:.4,PLR_R:.35,onGnd:true,dying:false,running:true,enemies:[],mines:[],
  camera:{position:new Vec(5,1.75,0)},wallMeshes:[],blocked:false,wallBetween:()=>c.blocked,
  hp:10000,armor:10000,respawnShieldT:2,gameSettings:{invincible:false},lastPlayerAttacker:{alive:true,team:'enemy'},
  plr:{maxHp:10000,blastResist:.99,secondWind:true,secondWindReady:true,thorns:false},PLAYER_MINE_DAMAGE_SCALE:.1,
  PLAYER_BULLET_DAMAGE_SCALE:.1,PLAYER_ROCKET_DAMAGE_SCALE:.1,PLAYER_BOMB_DAMAGE_SCALE:.1,PLAYER_MELEE_DAMAGE_SCALE:.1,
  showArmorHitFx(){},showArmorBreakFx(){},showDamageDirection(){},playSfx(){},triggerScreenShake(){},markHUD(){},trigFlash(){},showMsg(){},
  checkDeath(){if(c.hp<=0&&!c.dying){c.dying=true;events.push('playerDeath');}},
  playMineSound39:x=>events.push(x),showGeneratedMineEvent39(){},mineDetonationPresentationReady39:()=>false,
  explode(){},showGeneratedMineDetonationVfx(){},applyBlastDamage:(...a)=>splash.push(a),
  destroySceneObject(){events.push('remove');},updateMineHUD(){},syncMineWorldArt39(){},
  WEAPONS:Array.from({length:6},()=>({dmg:130})),awardExplosionKill:(...a)=>awards.push(a)};
 function bot(team,x=0){return{team,alive:true,hp:10000,maxHp:10000,jV:0,group:{position:new Vec(x,0,0)},hurt(damage,dir,from,source){events.push(['hurt',this,damage,from,source]);this.hp-=damage;if(this.hp<=0){this.alive=false;events.push(['botDeath',this]);for(const mn of c.mines)if(mn.src===this)mn.src=null;}}};}
 const placer=owner==='player'?null:bot(owner,5);
 const mine={owner:owner==='player'?'player':'bot',src:placer,team:owner==='player'?'player':owner,fall:false,armed:true,aT:0,checkT:1,ph:0,dmg:130,radius:9,m:{position:new Vec(0,.08,0),children:[]}};
 c.mines.push(mine);vm.createContext(c);
 vm.runInContext(['mineContactActors','applyMineContactKills','tickMines'].map(n=>fn(combat,n)).join('\n')+'\n'+fn(progression,'damageLabel')+'\n'+fn(progression,'applyDamageToPlayer'),c);
 return{c,events,awards,splash,mine,placer,bot};
}
test('every owner player/ally/enemy lethally triggers direct player/ally/enemy contact once, without friendly awards',()=>{
 for(const owner of ['player','ally','enemy'])for(const targetTeam of ['player','ally','enemy']){
  const f=contactFixture(owner),target=targetTeam==='player'?'player':f.bot(targetTeam);
  if(target==='player')f.c.camera.position.set(0,1.75,0);else f.c.enemies.push(target);
  f.c.tickMines(.016);assert.equal(f.c.mines.length,0,`${owner}->${targetTeam}`);
  if(target==='player'){
   assert.equal(f.c.hp,0);assert.equal(f.c.dying,true);assert.equal(f.c.plr.secondWindReady,true);
   assert.equal(f.c.lastPlayerAttacker,owner==='enemy'?f.placer:null);assert.equal(f.events.filter(x=>x==='playerDeath').length,1);
  }else{
   assert.equal(target.alive,false);assert.equal(target.hp,0);
   assert.equal(f.events.filter(x=>Array.isArray(x)&&x[0]==='botDeath').length,1);
   const legitimate=targetTeam!==(owner==='player'?'ally':owner);assert.equal(f.awards.length,legitimate?1:0);
  }
  f.c.tickMines(.016);assert.equal(f.events.filter(x=>x==='Detonate').length,1);assert.equal(f.events.filter(x=>x==='remove').length,1);assert.equal(f.splash.length,1);
 }
});
test('bot placer stepping on own mine dies; owner snapshot survives canonical die clearing mine.src',()=>{
 for(const owner of ['ally','enemy']){
  const f=contactFixture(owner);f.placer.group.position.set(0,0,0);f.c.enemies.push(f.placer);
  f.c.tickMines(.016);assert.equal(f.placer.alive,false);assert.equal(f.mine.src,null);assert.equal(f.awards.length,0);
  assert.equal(f.splash[0][4],f.placer);assert.equal(f.splash[0][7],owner);
 }
});
test('physical contact replaces hostile proximity, checks every frame, excludes airborne/unarmed/wall-separated actors',()=>{
 for(const mode of ['nearby','botJump','playerJump','fall','unarmed','wall']){
  const f=contactFixture('enemy');
  if(mode==='nearby')f.c.enemies.push(f.bot('ally',1));
  else if(mode==='botJump'){const bot=f.bot('ally');bot.jV=1;f.c.enemies.push(bot);}
  else{f.c.camera.position.set(0,1.75,0);if(mode==='playerJump')f.c.onGnd=false;if(mode==='fall'){f.mine.fall=true;f.mine.vx=f.mine.vy=f.mine.vz=0;f.mine.m.position.y=2;}if(mode==='unarmed'){f.mine.armed=false;f.mine.aT=1.5;}if(mode==='wall')f.c.blocked=true;}
  f.c.tickMines(.016);assert.equal(f.c.mines.length,1,mode);assert.equal(f.c.hp,10000,mode);assert.equal(f.splash.length,0,mode);
 }
 const f=contactFixture('player'),bot=f.bot('ally',.71);f.c.enemies.push(bot);f.c.tickMines(.001);
 assert.equal(bot.alive,false,'actual contact triggers despite checkT=1');assert.equal(f.c.mines.length,0);
 const g=contactFixture('enemy');g.c.camera.position.set(.68,1.75,0);g.c.tickMines(.016);assert.equal(g.c.mines.length,1,'outside player radius .67 does not trigger');
});
test('direct mine bypass is explicit; nearby mine shield/armor/second-wind policies remain intact',()=>{
 const f=contactFixture();f.c.applyDamageToPlayer(10000,'mine',null,false,false);assert.equal(f.c.hp,10000,'nearby shield preserved');
 f.c.respawnShieldT=0;f.c.armor=10000;f.c.applyDamageToPlayer(10000,'mine',null,false,false);assert.ok(f.c.hp>0);assert.equal(f.c.plr.secondWindReady,true);
 f.c.hp=1;f.c.armor=0;Object.assign(f.c,{showSecondWindFx(){},showAnn(){},updateStats(){}});f.c.applyDamageToPlayer(10000,'mine',null,false,false);assert.equal(f.c.hp,3500);assert.equal(f.c.plr.secondWindReady,false);
 f.c.plr.secondWindReady=true;f.c.applyDamageToPlayer(f.c.hp,'mine',null,false,true);assert.equal(f.c.hp,0);assert.equal(f.c.plr.secondWindReady,true);
});


test('actual mine detonation detaches and disposes generated body exactly once before canonical parent destruction',()=>{
 const f=worldFixture(),mn=f.mine();mn.fall=false;mn.armed=true;mn.aT=0;mn.checkT=1;mn.dmg=130;mn.radius=9;mn.owner='player';f.ready();f.c.mines.push(mn);f.c.syncMineWorldArt39();
 const body=mn._mineBody39,resources=body.children.map(mesh=>[mesh.geometry,mesh.material,mesh.material.map]);
 Object.assign(f.c,{BOT_R:.4,PLR_R:.35,onGnd:true,dying:false,hp:100,enemies:[{alive:true,hp:100,team:'enemy',group:{position:new Vec(0,0,-10)},hurt(n){this.hp-=n;this.alive=false;}}],WEAPONS:Array.from({length:6},()=>({dmg:130})),
 playMineSound39(){},showGeneratedMineEvent39(){},mineDetonationPresentationReady39:()=>false,triggerScreenShake(){},explode(){},showGeneratedMineDetonationVfx(){},awardExplosionKill(){},applyBlastDamage(){},updateMineHUD(){}});
 vm.runInContext(['mineContactActors','applyMineContactKills','tickMines'].map(n=>fn(combat,n)).join('\n'),f.c);
 f.c.tickMines(.016);assert.equal(f.c.mines.length,0);assert.equal(body.parent,null);assert.equal(mn.m.children.length,4);
 for(const [geometry,material,texture] of resources){assert.equal(geometry.disposals,1);assert.equal(material.disposals,1);if(texture)assert.equal(texture.disposals,1);}
 f.c.tickMines(.016);f.c.clearMineWorldArt39();for(const [geometry] of resources)assert.equal(geometry.disposals,1);
 assert.ok(progression.indexOf('clearMineWorldArt39();',progression.indexOf('function clearWorldForFreshGame'))<progression.indexOf('for(const mn of mines)destroySceneObject',progression.indexOf('function clearWorldForFreshGame')),'fresh game releases nested resources before canonical mine destruction');
});


test('many live bodies share one GPU atlas; first release preserves remaining mine, last disposes once and recreation reuses decoded Image',()=>{
 const f=worldFixture(),a=f.mine(),b=f.mine();a.fall=b.fall=false;f.ready();f.c.mines.push(a,b);f.c.syncMineWorldArt39();
 const texture=a._mineBody39.userData.top.material.map;assert.equal(b._mineBody39.userData.top.material.map,texture);
 f.c.removeMineWorldArt39(a._mineArt39);assert.equal(texture.disposals,0);assert.equal(b._mineBody39.userData.top.material.map,texture);assert.equal(b._mineBody39.visible,true);
 f.c.clearMineWorldArt39();assert.equal(texture.disposals,1);assert.equal(b._mineBody39,null);f.c.clearMineWorldArt39();assert.equal(texture.disposals,1);
 f.c.syncMineWorldArt39();const replacement=a._mineBody39.userData.top.material.map;assert.notEqual(replacement,texture);assert.equal(replacement.image,texture.image);assert.equal(b._mineBody39.userData.top.material.map,replacement);
 f.probes[0].naturalWidth=512;f.c.syncMineWorldArt39();assert.equal(replacement.disposals,1);assert.equal(a.m.children.length,4);assert.equal(b.m.children.length,4);
});


test('file mode never uploads tainted local images; complete native horizontal top keeps body visible without GPU texture',()=>{
 const f=worldFixture();f.c.GAME_LOCAL_FILE_MODE=true;f.c.THREE.Texture=class{constructor(){throw Error('tainted image upload forbidden');}};
 const mn=f.mine();mn.fall=false;f.ready();f.c.mines.push(mn);f.c.syncMineWorldArt39();
 const body=mn._mineBody39;assert.equal(body.userData.texture39,null);assert.deepEqual(body.userData.top.geometry.args,[.30,.30,.002,48]);assert.equal(body.userData.top.rotation.x,0);assert.equal(body.userData.top.material.map,undefined);
 assert.equal(body.children.length,7);assert.equal(mn.m.visible,true);assert.equal(body.visible,true);assert.equal(body.userData.lugs.count,6);assert.equal(body.userData.vents.count,6);
 assert.equal(f.elements[0].style.visibility,'visible');assert.equal(f.elements[0].dataset.plane,'ground');assert.equal(vm.runInContext('mineWorldTextureUsers39',f.c),0);f.c.clearMineWorldArt39();assert.equal(body.parent,null);assert.equal(vm.runInContext('mineWorldTextureUsers39',f.c),0);
});


test('file approved croppedtop maps fixed .64m world corners at actual .059m top, hides behind walls/nearclip and cleans with body',()=>{
 const f=worldFixture();f.c.GAME_LOCAL_FILE_MODE=true;f.c.gameAssetUrl=path=>'file:///game/'+path;
 vm.runInContext(['presentationAtlasFrame','presentationAtlasPercent','applyPresentationAtlasFrame'].map(n=>fn(catalog,n)).join('\n'),f.c);
 const mn=f.mine();mn.fall=false;f.ready();f.c.mines.push(mn);
 const cameras=[{position:new Vec(0,1.75,0),yaw:0,pitch:0},{position:new Vec(8,1.75,-10),yaw:Math.PI/2,pitch:0},{position:new Vec(0,8,-10),yaw:0,pitch:-Math.PI/2}];
 // Independent square bounds and real floor-top height, not production surface recognition.
 const corners=[[-.32,.059,-10.32],[.32,.059,-10.32],[.32,.059,-9.68],[-.32,.059,-9.68]],transforms=[];
 for(const camera of cameras){
  Object.assign(f.c.camera,camera);f.c.syncMineWorldArt39();const el=f.elements[0];
  assert.equal(el.style.visibility,'visible');assert.equal(el.style.backgroundImage,'url("file:///game/world.webp")');assert.equal(el.style.backgroundSize,'400% 400%');assert.equal(el.style.backgroundPosition,'94.444444% 94.444444%');
  assert.equal(el.dataset.plane,'ground');assert.ok(el.style.transform.startsWith('matrix3d('));transforms.push(el.style.transform);
  const matrix=el.style.transform.slice(9,-1).split(',').map(Number);
  for(const [i,[x,y]] of [[0,[0,0]],[1,[512,0]],[2,[512,512]],[3,[0,512]]]){
   const p=new PerspectiveVec(...corners[i]).project(f.c.camera),w=matrix[3]*x+matrix[7]*y+matrix[15];
   assert.ok(Math.abs((matrix[0]*x+matrix[4]*y+matrix[12])/w-(p.x*.5+.5)*1000)<.05);
   assert.ok(Math.abs((matrix[1]*x+matrix[5]*y+matrix[13])/w-(-p.y*.5+.5)*800)<.05);
  }
  assert.equal(mn.m.rotation.y,0);assert.equal(mn._mineBody39.visible,true);
 }
 assert.equal(new Set(transforms).size,3);f.c.blocked=true;f.c.syncMineWorldArt39();assert.equal(f.elements[0].style.visibility,'hidden');
 f.c.blocked=false;f.c.syncMineWorldArt39();assert.equal(f.elements[0].style.visibility,'visible');
 Object.assign(f.c.camera,{position:new Vec(0,1.75,-11),yaw:0,pitch:0});f.c.syncMineWorldArt39();assert.equal(f.elements[0].style.visibility,'hidden','nearclip/behindcamera prevents invalid surface');
 const body=mn._mineBody39;f.c.clearMineWorldArt39();assert.equal(f.elements[0].isConnected,false);assert.equal(body.parent,null);assert.equal(mn.m.children.length,4);assert.ok(mn.m.children.every(mesh=>mesh.visible));
});
