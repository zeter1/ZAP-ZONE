import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const combat=read('src/combat/combat.js'),system=read('src/weapons/system.js'),settings=read('src/settings/settings.js'),engine=read('src/core/engine.js');
function smokeCssNestingOracle(css){
  // Ignore comments/strings: braces in URLs and quoted values are not CSS blocks.
  const source=css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,s=>' '.repeat(s.length));
  assert.ok(source.includes('#fp-weapon-action.smoke-action-viewport'),'smoke desktop selector exists');
  let depth=0;
  for(let i=0;i<source.length;i++){
    if(source[i]==='{')depth++;
    else if(source[i]==='}')assert.ok(--depth>=0,'CSS has no unmatched closing block');
  }
  assert.equal(depth,0,'every CSS block closes');
}
test('retired landing VFX stays absent and CSS nesting remains balanced',()=>{
  const css=read('src/styles/game.css');smokeCssNestingOracle(css);
  assert.doesNotMatch(css,/data-kind="landing(?:Dust|Metal)"/,'retired landing VFX CSS must not return');
  const marker='max-width:104px;max-height:104px}}';
  const broken=css.replace(marker,'max-width:104px;max-height:104px}');
  assert.notEqual(broken,css,'controlled mutation removes a real mobile-media closing brace');
  assert.throws(()=>smokeCssNestingOracle(broken),/every CSS block closes/);
});
function smokeFramingOracle(css){
  const rule=css.match(/#fp-weapon-art-wrap\[data-smoke-pack="42"\] #fp-weapon-art-stage,\s*#fp-weapon-action\.smoke-action-viewport\{([^}]*)\}/);
  assert.ok(rule,'ready and action share one framing rule');
  const size=property=>{
    const match=rule[1].match(new RegExp('(?:^|;)'+property+':min\\(([0-9.]+)vw,([0-9.]+)vh\\)'));
    assert.ok(match,property+' uses proportional contain, preventing tall-window cover enlargement');return match.slice(1).map(Number);
  };
  const [widthVw,widthVh]=size('width'),[heightVw,heightVh]=size('height');
  assert.match(rule[1],/right:-1vw;bottom:-2vh/,'one bottom/right anchor keeps source forearms beyond the viewport');
  for(const [w,h,expectedW,expectedH]of [[1600,900,1120,630],[1280,1024,896,504],[1920,1080,1344,756]]){
    const width=Math.min(widthVw*w/100,widthVh*h/100),height=Math.min(heightVw*w/100,heightVh*h/100);
    assert.ok(Math.abs(width-expectedW)<.01&&Math.abs(height-expectedH)<.01,'bounded independent viewport sizes');
    assert.ok(Math.abs(width/height-16/9)<.00001,'complete source retains16:9 without stretching');
    assert.ok(width<=w*.700001&&height<=h*.700001,'hand layer stays within70% viewport bounds');
    const bottom=h+h*.02,top=bottom-height;assert.ok(bottom>h&&top>h*.30,'lower source exit stays offscreen and the upper view remains open');
  }
}
test('ready/action use common70% contain framing at16:9 and5:4; cover-enlargement negative control fails',()=>{
  const css=read('src/styles/game.css');smokeFramingOracle(css);
  const broken=css.replace('width:min(70vw,124.444444vh);height:min(39.375vw,70vh)','width:max(102vw,181.333333vh);height:max(57.375vw,102vh)');
  assert.notEqual(broken,css);assert.throws(()=>smokeFramingOracle(broken),/proportional contain/);
});
function fn(source,name){
  const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);
  let i=source.indexOf('{',start)+1,depth=1;
  for(;depth;i++){if(source[i]==='{')depth++;if(source[i]==='}')depth--;}
  return source.slice(start,i);
}
class Vec{
  constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}
  clone(){return new Vec(this.x,this.y,this.z);}
  copy(v){Object.assign(this,{x:v.x,y:v.y,z:v.z});return this;}
  set(x,y,z){Object.assign(this,{x,y,z});return this;}
  add(v){return this.addScaledVector(v,1);}
  sub(v){return this.addScaledVector(v,-1);}
  addScaledVector(v,k){this.x+=v.x*k;this.y+=v.y*k;this.z+=v.z*k;return this;}
  multiplyScalar(k){this.x*=k;this.y*=k;this.z*=k;return this;}
  normalize(){return this.multiplyScalar(1/(Math.hypot(this.x,this.y,this.z)||1));}
  length(){return Math.hypot(this.x,this.y,this.z);}
  applyQuaternion(){return this;}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
  project(){this.x/=50;this.y/=50;this.z=.5;return this;}
}
function fixture(){
  const c={THREE:{Vector3:Vec},curW:7,SMOKE_WEAPON_INDEX:7,WEAPONS:Array.from({length:10},()=>({rate:.55,recoilY:.025})),
    running:true,paused:false,dying:false,lvlAnnOpen:false,perkPickOpen:false,reloading:false,sCD:0,stock:1,owned:true,
    playerSmokeCD:0,SMOKE_COOLDOWN_SECONDS:30,recoilPitch:0,zooming:false,wallAABBs:[],pendingMineThrow:null,pendingBombPlant:null,
    smokeGrenades:[],smokeClouds:[],plr:{recoilM:1,smokeCooldownM:1},camera:{position:new Vec(0,1.75,-19.35),quaternion:{}},
    ownsWeapon:()=>c.owned,weaponAmmoValue:()=>c.stock,weaponReserveValue:()=>0,setWeaponAmmo:(i,v)=>{c.stock=v;},
    testingInfiniteAmmoEnabled:()=>false,showMsg(){},wHUD(){},updateWeaponBar(){},trigMuzzle(){},playSmokeSound42(){},smokePresentationAssetReady42:()=>false,
    mkSmokeGrenade:()=>({position:new Vec(),children:[],rotation:{x:0,z:0}}),scene:{add(){}},animated:false,
    showGeneratedSmokeThrowVfx(){if(c.animated)c.fpGeneratedWeaponAction={kind:'smokeThrow42'};return c.animated;},
    fpGeneratedWeaponAction:null,stopGeneratedFirstPersonAction(){c.fpGeneratedWeaponAction=null;},Math};
  vm.createContext(c);
  vm.runInContext(fn(engine,'sweepWallSphere')+'\n'+combat.slice(combat.indexOf('let pendingSmokeThrow=null;'),combat.indexOf('// ─── UPDATE PROJECTILES')),c);
  const run=s=>vm.runInContext(s,c),tick=n=>{for(let i=0;i<n;i++)c.tickPendingSmokeThrow(.05);};
  return {c,run,tick};
}
test('release frame3 emits once, ammo/CD unchanged before .29; missing art has identical mechanics',()=>{
  for(const animated of [false,true]){
    const f=fixture();f.c.animated=animated;f.c.throwSmokeGrenade();f.c.throwSmokeGrenade();f.tick(5);
    assert.equal(f.c.smokeGrenades.length,0);assert.equal(f.c.stock,1);assert.equal(f.c.playerSmokeCD,0);
    f.c.tickPendingSmokeThrow(.04);assert.equal(f.c.smokeGrenades.length,1);assert.equal(f.c.stock,0);assert.equal(f.c.playerSmokeCD,30);
    f.tick(20);assert.equal(f.c.smokeGrenades.length,1);assert.equal(f.c.sCD,.55);
  }
});
test('cancel then retry; switch/pause/death/hidden/reload reject pending, already emitted grenade survives cancellation',()=>{
  for(const mutation of ['curW=0','paused=true','dying=true','running=false','reloading=true','lvlAnnOpen=true','perkPickOpen=true','cancelPendingSmokeThrow(true)']){
    const f=fixture();f.c.animated=true;f.c.throwSmokeGrenade();f.tick(1);f.run(mutation);f.tick(8);
    assert.equal(f.c.stock,1,mutation);assert.equal(f.c.smokeGrenades.length,0);assert.equal(f.c.playerSmokeCD,0);assert.equal(f.c.fpGeneratedWeaponAction,null);
  }
  const f=fixture();f.c.throwSmokeGrenade();f.c.cancelPendingSmokeThrow();f.c.throwSmokeGrenade();f.tick(6);
  f.c.cancelPendingSmokeThrow(true);assert.equal(f.c.smokeGrenades.length,1);assert.equal(f.c.stock,0);
});
test('release revalidates current cap, ownership, ammo and cooldown',()=>{
  for(const mutation of [c=>{c.stock=0;},c=>{c.owned=false;},c=>{c.playerSmokeCD=1;},c=>{c.smokeGrenades.push({},{});},c=>{c.sCD=.1;}]){
    const f=fixture();f.c.throwSmokeGrenade();mutation(f.c);const count=f.c.smokeGrenades.length,stock=f.c.stock;f.tick(6);
    assert.equal(f.c.smokeGrenades.length,count);assert.equal(f.c.stock,stock);
  }
});
function smokeReloadRngFixture(source,ready,bufferAvailable){
  const elements=new Map(),draws=[],audio=[];
  const c={reloading:false,ammo:0,uAmmo:5,zooming:false,getW:()=>({key:'smoke',isSmoke:true,clip:1,reload:.8}),
    weaponActionBlocked:()=>false,cancelPendingBombPlant(){},cancelPendingMineThrow(){},cancelPendingSmokeThrow(){},
    G:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);},
    smokePresentationAssetReady42:()=>ready,playGeneratedFirstPersonAction:()=>true,
    playBufferSfx(key){audio.push(key);return bufferAvailable;},spatialAudioMix:()=>({gain:1}),synthTone(){},playSfx(){},
    Math:Object.assign(Object.create(Math),{random(){const value=[.15,.85,.35][draws.length%3];draws.push(value);return value;}})};
  vm.createContext(c);
  vm.runInContext(['playWeaponMechanicSound','showGeneratedMagazineDropFx','playSmokeSound42','showGeneratedSmokeReloadVfx'].map(n=>fn(settings,n)).join('\n')+'\n'+source,c);
  c.doReload();
  return {c,draws,audio,state:['reloading','reloadMode','reloadT','reloadTot','reloadShellLoaded'].map(k=>c[k])};
}
function smokeReloadRngOracle(source){
  // Restore the actual former mechanic-sound call as a before/after reference. Both
  // paths execute the real settings owner, including its unconditional pitch draw.
  const before=source.replace("if(w.isSmoke)Math.random();else playWeaponMechanicSound('reload',1,w.key);","playWeaponMechanicSound('reload',1,w.key);");
  assert.notEqual(before,source,'known previous reload owner is reconstructed at the changed call only');
  for(const ready of [false,true])for(const available of [false,true]){
    const current=smokeReloadRngFixture(source,ready,available),legacy=smokeReloadRngFixture(before,ready,available);
    assert.deepEqual(current.draws,legacy.draws,'smoke reload preserves former pitch RNG draw and order');assert.equal(current.draws.length,1);
    assert.deepEqual(current.state,legacy.state,'reload mechanics unchanged');assert.equal(current.c.playerReloadUsesFullPresentation,ready);
    assert.ok(current.audio.includes('smokeReload42'));assert.ok(!current.audio.includes('reloadMag'),'replacement audio avoids duplicate old sound');
    assert.equal(current.c.Math.random(),legacy.c.Math.random(),'next shared random value is preserved');
  }
}
test('real smoke reload owners preserve historic RNG with ready/missing art and available/fallback audio; missing-draw control fails',()=>{
  const source=fn(combat,'doReload');smokeReloadRngOracle(source);
  const broken=source.replace("if(w.isSmoke)Math.random();else playWeaponMechanicSound('reload',1,w.key);","if(!w.isSmoke)playWeaponMechanicSound('reload',1,w.key);");
  assert.notEqual(broken,source);
  // A missing compensation fails directly against the actual legacy audio owner.
  for(const ready of [false,true]){
    const current=smokeReloadRngFixture(broken,ready,true);assert.equal(current.draws.length,0);
    assert.throws(()=>assert.equal(current.draws.length,1),/0 !== 1/);
  }
});
function smokeReleasePublicationFixture(ready,roll,suppressOverride=null){
  const f=fixture(),particles=[],draws=[],lights=[];
  Object.assign(f.c,{VISUAL_LIGHTS:true,smokePresentationAssetReady42:key=>ready&&key==='pack42SmokeWorld',
    Math:Object.assign(Object.create(Math),{random(){draws.push(roll);return roll;}}),
    _spawnP(...args){particles.push(args);},getMzLight(){const light={position:new Vec(),color:{setHex(){}},_act:false};lights.push(light);return light;}});
  vm.runInContext(['spawnP','spawnSmoke','spawnSpark','trigMuzzle'].map(n=>fn(engine,n)).join('\n'),f.c);
  if(suppressOverride!==null){const original=f.c.trigMuzzle;f.c.trigMuzzle=(pos,col,power)=>original(pos,col,power,suppressOverride);}
  f.c.throwSmokeGrenade(true);
  return {...f,particles,draws,lights};
}
function smokeReleasePublicationOracle(sourceReady=true){
  for(const roll of [.2,.9]){
    const fallback=smokeReleasePublicationFixture(false,roll),decoded=smokeReleasePublicationFixture(sourceReady,roll);
    assert.deepEqual(decoded.draws,fallback.draws,'real trigMuzzle visual=false retains spawnP/smoke/spark draw sequence');
    assert.equal(decoded.draws.length,roll<.78?26:23,'two launch spins plus exact historical muzzle draws');
    assert.equal(decoded.particles.length,0,'decoded world art suppresses all legacy muzzle particles');assert.equal(decoded.lights.length,0);
    assert.equal(fallback.particles.length,roll<.78?4:3,'missing art retains original two gold puffs, optional smoke and spark');
    assert.ok(fallback.particles.some(p=>p[3]===0xffd27a||p[3]===0xff8a32),'the actual engine yellow publication is reached');
    assert.equal(fallback.lights.length,1);
    assert.equal(decoded.c.smokeGrenades.length,1);assert.equal(decoded.c.stock,0);assert.equal(decoded.c.playerSmokeCD,30);
  }
}
test('actual release suppresses legacy yellow muzzle only with exact-ready world art; real engine RNG stays equivalent',()=>{
  smokeReleasePublicationOracle();
  const bad=smokeReleasePublicationFixture(true,.2,true);assert.ok(bad.particles.length>0,'negative control forces former visual=true behavior');
  assert.throws(()=>assert.equal(bad.particles.length,0,'decoded world art suppresses all legacy muzzle particles'),/decoded world art suppresses/);
});
const wall=(min,max)=>({min:new Vec(...min),max:new Vec(...max)});
test('real sweep clamps camera→spawn before close .6m wall; next step bounces rather than tunnelling',()=>{
  const f=fixture();f.c.wallAABBs=[wall([-20,0,-20.3],[20,3,-19.7])];f.c.throwSmokeGrenade();f.tick(6);
  const g=f.c.smokeGrenades[0];assert.ok(g.m.position.z>=-19.58);assert.ok(g.m.position.z<-19.57);
  f.c.moveSmokeGrenade42(g,.033);assert.ok(g.m.position.z>-19.58);assert.ok(g.vz>0);
});
test('sweep catches corner/thin wall crossing, ignores wall below flight, settles on floor and roof support',()=>{
  const f=fixture();f.c.wallAABBs=[wall([0,0,0],[.15,3,.15])];
  const g={m:{position:new Vec(-1,1,-1)},vx:50,vy:0,vz:50};f.c.moveSmokeGrenade42(g,.04);
  assert.ok(g.vx<0||g.vz<0,'crossing corner must bounce');assert.ok(g.m.position.x<=-.12||g.m.position.z<=-.12);
  g.m.position.set(-1,6,-1);g.vx=50;g.vy=0;g.vz=50;f.c.moveSmokeGrenade42(g,.04);assert.equal(g.vx,50);assert.equal(g.m.position.x,1);
  g.m.position.set(2,.131,2);g.vx=0;g.vz=0;g.vy=-.5;f.c.moveSmokeGrenade42(g,.02);assert.equal(g.grounded,true);assert.equal(g.vy,0);
  g.m.position.set(.05,3.121,.05);g.vy=-.5;f.c.moveSmokeGrenade42(g,.02);assert.equal(g.grounded,true);assert.ok(g.m.position.y>3.12);
  g.m.position.set(1,3.121,1);g.vy=-.5;f.c.moveSmokeGrenade42(g,.02);assert.equal(g.grounded,false);
});
test('bot smoke shares safe close-wall launch while retaining team/radius/duration/speed and two RNG draws',()=>{
  const f=fixture();f.c.wallAABBs=[wall([-20,0,-20.3],[20,3,-19.7])];let draws=0;
  f.c.Math=Object.assign(Object.create(Math),{random(){draws++;return .5;}});
  vm.runInContext(fn(combat,'spawnBotSmokeGrenade'),f.c);
  assert.equal(f.c.spawnBotSmokeGrenade(new Vec(0,1,-19.35),new Vec(0,1,-40),'ally',{}),true);
  const g=f.c.smokeGrenades[0];assert.ok(g.m.position.z>=-19.58);assert.equal(g.team,'ally');assert.equal(g.radiusM,.90);assert.equal(g.durationM,.78);assert.equal(draws,2);
  assert.equal(g.vz,-(8.8+20.65*.12));
});
function element(){
  const el={style:{setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}},dataset:{},children:[],isConnected:false,
    classList:{add(){},remove(){},toggle(){}},setAttribute(){},removeAttribute(k){delete this[k];},appendChild(child){child.parentElement=this;child.isConnected=true;this.children.push(child);},
    remove(){this.isConnected=false;},replaceChildren(){for(const child of this.children)child.remove();this.children=[];}};
  return el;
}
function artFixture(){
  const f=fixture(),elements=new Map(),root=element();root.isConnected=true;
  const doc={body:root,createElement(){const el=element();elements.set(Symbol(),el);return el;}};
  Object.assign(f.c,{document:doc,G:id=>[...elements.values()].find(el=>el.id===id)||null,innerWidth:1600,innerHeight:900,
    wallMeshes:[],wallBetween:()=>f.c.occluded,occluded:false,gameAssetUrl:x=>x,GAME_ASSETS:{presentationVfx:{pack42SmokeWorld:'world.webp',pack42SmokeCloud:'cloud.webp',pack42SmokeNear:'near.webp',pack42SmokeFar:'far.webp',pack42SmokeWisps:'wisps.webp'}},
    smokeVolumeSupported42:()=>false,smokePresentationAssetReady42:()=>f.c.ready,ready:true,destroySceneObject(m){m.destroyed=true;},camera:{position:new Vec(0,1.75,0),fov:75,updateWorldMatrix(){}}});
  vm.runInContext(['smokeArtLayer42','removeSmokeArt42','clearSmokePresentation42','makeSmokeArt42','positionSmokeArt42','syncSmokeBodyArt42','syncSmokeCloudArt42','removeSmokeCloud'].map(n=>fn(combat,n)).join('\n'),f.c);
  const cloud=()=>({m:{position:new Vec(0,.12,-30),visible:true},center:new Vec(0,1.6,-30),radius:15.5,life:60,maxLife:60,age:0,density:1,
    puffs:Array.from({length:22},(_,i)=>({position:new Vec(i%3,.8,-i%4),userData:{phase:.4}}))});
  return {...f,cloud,elements};
}
test('world cloud remains native without depth textures and never publishes flat cloud layers',()=>{
  const f=artFixture(),c=f.cloud();
  const nodes=[element(),element()];nodes.forEach(n=>n.isConnected=true);c.art42=nodes;
  for(const ready of [true,false]){f.c.ready=ready;f.c.syncSmokeCloudArt42(c);assert.equal(c.m.visible,true);assert.equal(c.art42,null);}
  assert.ok(nodes.every(el=>!el.isConnected));assert.equal(f.elements.size,0);
});
test('projectile body is decoded-only at actual simulation position; expiry/cap/freshgame remove owned nodes',()=>{
  const f=artFixture(),g={m:{position:new Vec(1,2,-20),children:[{visible:true}]},age:.7,vx:0,vy:2,vz:-12};
  f.c.syncSmokeBodyArt42(g);assert.equal(g.m.children[0].visible,false);assert.equal(g.art42.length,1);
  const node=g.art42[0],oldX=node.style.left;g.m.position.x+=5;f.c.syncSmokeBodyArt42(g);assert.notEqual(node.style.left,oldX);
  f.c.ready=false;f.c.syncSmokeBodyArt42(g);assert.equal(g.m.children[0].visible,true);assert.equal(node.isConnected,false);
  f.c.ready=true;const c=f.cloud();f.c.syncSmokeCloudArt42(c);assert.equal(c.art42,null);f.c.removeSmokeCloud(c);assert.equal(c.m.destroyed,true);
  const d=f.cloud();f.c.smokeClouds.push(d);f.c.syncSmokeCloudArt42(d);f.c.clearSmokePresentation42();assert.equal(d.art42,null);
  const fresh=read('src/progression/progression.js').slice(read('src/progression/progression.js').indexOf('function clearWorldForFreshGame'));
  assert.ok(fresh.indexOf('clearSmokePresentation42()')<fresh.indexOf('smokeGrenades.length=0'));
});
function smokeCameraMatrixOracle(tickSource){
  const f=artFixture(),events=[];
  // A camera retains its last-rendered inverse until the public Three camera update seam.
  // This double projects from that cached inverse, never directly from current position/yaw.
  class CachedViewVec extends Vec{
    clone(){return new CachedViewVec(this.x,this.y,this.z);}
    project(camera){
      events.push('project');assert.deepEqual(camera.inverse,{x:5,y:2,z:0,yaw:.25},'first projection must use current transform');
      const view=camera.inverse,dx=this.x-view.x,dy=this.y-view.y,dz=this.z-view.z;
      const vx=Math.cos(view.yaw)*dx-Math.sin(view.yaw)*dz,vz=Math.sin(view.yaw)*dx+Math.cos(view.yaw)*dz;
      this.x=vx/(-vz*Math.tan(75*Math.PI/360)*(1600/900));this.y=dy/(-vz*Math.tan(75*Math.PI/360));this.z=.5;return this;
    }
  }
  Object.assign(f.c.camera,{position:new Vec(5,2,0),yaw:.25,inverse:{x:0,y:1.75,z:0,yaw:0},
    updateWorldMatrix(parents,children){assert.equal(parents,true);assert.equal(children,false,'do not update FPS children per smoke batch');events.push('update');this.inverse={...this.position,yaw:this.yaw};}});
  const cloud=f.cloud();cloud.center=new CachedViewVec(0,2,-30);cloud.m.position=new CachedViewVec(0,.12,-30);cloud.m.rotation={y:0};
  for(const puff of cloud.puffs){puff.scale=new Vec(1,1,1);puff.material={};puff.userData.baseScale=new Vec(1,1,1);puff.userData.baseOpacity=.9;}
  const g={m:{position:new CachedViewVec(1,2,-20),rotation:{x:0,z:0},children:[{visible:true}]},vx:0,vy:0,vz:0,rx:0,rz:0,age:0,life:3,trailT:1};
  Object.assign(f.c,{THREE:{Vector3:CachedViewVec},spawnSmoke(){}});
  vm.runInContext(fn(combat,'smokeStrengthAt')+'\n'+tickSource,f.c);
  for(const mode of ['projectile','cloud','both']){
    events.length=0;f.c.camera.inverse={x:0,y:1.75,z:0,yaw:0};
    f.c.smokeClouds.length=0;f.c.smokeGrenades.length=0;
    if(mode!=='projectile')f.c.smokeClouds.push(cloud);if(mode!=='cloud')f.c.smokeGrenades.push(g);
    f.c.tickSmoke(0);assert.equal(events[0],'update');assert.equal(events.filter(e=>e==='update').length,1,'one refresh for every nonempty tick');
    assert.equal(events.filter(e=>e==='project').length,mode==='cloud'?0:1,'only the device uses DOM projection');
    if(mode==='both')assert.equal(events.filter(e=>e==='project').length,1,'world cloud adds no billboard projections');
  }
  const node=g.art42[0];assert.ok(parseFloat(node.style.left)>800,'new yaw places center right of reticle instead of stale center800px');
  events.length=0;f.c.smokeClouds.length=0;f.c.smokeGrenades.length=0;f.c.tickSmoke(0);assert.deepEqual(events,[],'empty world does not refresh camera');
}
test('current camera transform refreshes once before first smoke projection; stale-inverse negative control fails',()=>{
  const source=fn(combat,'tickSmoke');smokeCameraMatrixOracle(source);
  const stale=source.replace('if(smokeGrenades.length||smokeClouds.length)camera.updateWorldMatrix(true,false);','');
  assert.notEqual(stale,source,'remove exact public camera refresh seam');
  assert.throws(()=>smokeCameraMatrixOracle(stale),/first projection must use current transform/);
});
test('real deployment→cap eviction→density fade→expiry cleans bounded art and retains historical RNG draws',()=>{
  const f=artFixture();let draws=0;
  class Group{constructor(){this.position=new Vec();this.rotation={y:0};this.children=[];}add(m){this.children.push(m);}}
  class Mesh{constructor(geometry,material){Object.assign(this,{geometry,material,position:new Vec(),scale:new Vec(1,1,1),userData:{},visible:true});}}
  Object.assign(f.c,{PERF_MODE:true,SMOKE_RADIUS:15.5,SMOKE_DURATION_SECONDS:60,MAX_ACTIVE_SMOKE_CLOUDS:3,
    THREE:{...f.c.THREE,Group,Mesh,SphereGeometry:class{},MeshBasicMaterial:class{constructor(v){Object.assign(this,v);}}},
    showGeneratedSmokeDeployVfx(){f.c.Math.random();},Math:Object.assign(Object.create(Math),{random(){draws++;return .4;}})});
  vm.runInContext(['deploySmokeCloud','smokeStrengthAt','tickSmoke'].map(n=>fn(combat,n)).join('\n'),f.c);
  f.c.deploySmokeCloud(new Vec(0,.12,-30),1,1,'enemy');assert.equal(draws,121,'historical14-puff draw count plus deployment decorator');
  assert.equal(f.c.smokeClouds[0].life,60);assert.equal(f.c.smokeClouds[0].radius,15.5);
  f.c.tickSmoke(.5);const first=f.c.smokeClouds[0];assert.equal(first.art42,null);assert.ok(first.density>0&&first.density<1);
  const before=draws;for(let i=0;i<100;i++)f.c.syncSmokeCloudArt42(first);assert.equal(draws,before,'DOM variants add no RNG');
  for(let i=0;i<3;i++)f.c.deploySmokeCloud(new Vec(i,.12,-30),1,1,'enemy');assert.equal(f.c.smokeClouds.length,3);
  assert.equal(first.m.destroyed,true);assert.equal(first.art42,null,'oldest cap eviction owns no DOM cloud nodes');
  f.c.tickSmoke(57);assert.equal(f.c.smokeClouds.length,3);assert.ok(f.c.smokeClouds.every(c=>c.density===.75));
  const survivors=f.c.smokeClouds.map(c=>c.m);f.c.tickSmoke(3);assert.equal(f.c.smokeClouds.length,0);assert.ok(survivors.every(m=>m.destroyed));
  f.c.deploySmokeCloud(new Vec(0,.12,-30),1,1,'enemy');f.c.tickSmoke(.1);assert.equal(f.c.smokeClouds.length,1,'new deployment after expiry');
  f.c.clearSmokePresentation42();assert.equal(f.c.smokeClouds[0].art42,null);
});
test('exact image dimensions plus decode are required; missing/wrong image never retries or marks ready',async()=>{
  const probes=[];const c={GAME_ASSETS:{presentationVfx:{pack42SmokeThrow:'throw.webp'}},gameAssetUrl:p=>p,Image:class{
    constructor(){probes.push(this);this.naturalWidth=3840;this.naturalHeight=1440;}
    decode(){return this.failed?Promise.reject(Error('bad decode')):Promise.resolve();}
  }};
  vm.createContext(c);vm.runInContext(settings.slice(settings.indexOf('const SMOKE_PRESENTATION_DIMENSIONS42'),settings.indexOf('function playSmokeSound42')),c);
  assert.equal(c.smokePresentationAssetReady42('pack42SmokeThrow'),false);const probe=probes[0];await probe.onload();assert.equal(c.smokePresentationAssetReady42('pack42SmokeThrow'),true);
  assert.equal(probes.length,1);probe.onerror();assert.equal(c.smokePresentationAssetReady42('pack42SmokeThrow'),false);probe.naturalWidth=128;await probe.onload();assert.equal(c.smokePresentationAssetReady42('pack42SmokeThrow'),false);
  probe.naturalWidth=3840;probe.failed=true;await probe.onload();assert.equal(c.smokePresentationAssetReady42('pack42SmokeThrow'),false);assert.equal(probes.length,1);
});
function smokeSelectionSwapOracle(source){
  const wrap=element(),hideCalls=[];
  const c={
    G:id=>id==='fp-weapon-art-wrap'?wrap:null,
    GAME_ASSETS:{generatedFirstPersonWeapons:{smoke:'ready.webp'},presentationCombat:{}},
    FP_GENERATED_ART_TUNING:{smoke:{width:'34vw',right:'-1vw',bottom:'-1vh',muzzleX:'50%',muzzleY:'50%',flashScale:0}},
    SMOKE_PRESENTATION_DIMENSIONS42:{pack42SmokeReady:[1600,900]},
    hideGeneratedFirstPersonWeaponArt(showProcedural){hideCalls.push(showProcedural);},
    smokePresentationAssetReady42(){return false;},
    fpGeneratedWeaponPending:null
  };
  vm.createContext(c);vm.runInContext(source,c);
  c.setGeneratedFirstPersonWeaponArt({key:'smoke'},{id:'native-smoke'});
  assert.deepEqual(hideCalls,[false],'Pack42 selection must hide the native smoke rig before ready decode starts');
  assert.equal(c.fpGeneratedWeaponPending?.key,'smoke');
  assert.equal(c.fpGeneratedWeaponPending?.asset,'ready.webp');
}
test('selecting smoke hides the old native rig immediately; former decode-wait flash control fails',()=>{
  const source=fn(system,'setGeneratedFirstPersonWeaponArt');smokeSelectionSwapOracle(source);
  const broken=source.replace('hideGeneratedFirstPersonWeaponArt(!hasGeneratedArt);',"hideGeneratedFirstPersonWeaponArt(!hasGeneratedArt||w.key==='smoke');");
  assert.notEqual(broken,source,'negative control restores the former smoke-only visibility exception');
  assert.throws(()=>smokeSelectionSwapOracle(broken),/Pack42 selection must hide the native smoke rig/);
});

test('FPS loading/failure/stale callbacks preserve single action/native fallback; exact ready decode required',async()=>{
  const img=element(),wrap=element(),action=element(),stage=element(),els={'fp-weapon-art':img,'fp-weapon-art-wrap':wrap,'fp-weapon-action':action,'fp-weapon-art-stage':stage};
  const c={G:id=>els[id],running:true,fpGeneratedWeaponActive:false,fpGeneratedWeaponLoading:false,fpGeneratedWeaponLoadId:0,
    fpGeneratedWeaponPending:{key:'smoke',asset:'ready.webp',model:{}},fpGeneratedWeaponAction:null,
    GAME_ASSETS:{generatedFirstPersonWeaponFallbacks:{}},console:{warn(){}},setProceduralFirstPersonRigVisible(v){c.rigVisible=v;},
    generatedCombatVfxSpec:()=>({duration:.58,frames:6}),generatedCombatVfxFrame:(k,i)=>({i}),applyPresentationAtlasFrame(el,frame){el.frame=frame.i;}};
  vm.createContext(c);vm.runInContext(['ensureGeneratedFirstPersonWeaponArtLoaded','playGeneratedFirstPersonAction','stopGeneratedFirstPersonAction','tickGeneratedFirstPersonAction','hideGeneratedFirstPersonWeaponArt'].map(n=>fn(system,n)).join('\n'),c);
  c.rigVisible=true;c.ensureGeneratedFirstPersonWeaponArtLoaded();assert.equal(c.rigVisible,true);
  img.naturalWidth=1600;img.naturalHeight=900;let resolve;img.decode=()=>new Promise(r=>{resolve=r;});const stale=img.onload();
  img.dataset.loadId='new';resolve();await stale;assert.equal(c.fpGeneratedWeaponActive,false);assert.equal(c.rigVisible,true);
  c.fpGeneratedWeaponLoading=false;c.ensureGeneratedFirstPersonWeaponArtLoaded();img.naturalWidth=128;await img.onload();assert.equal(c.rigVisible,true);assert.equal(c.fpGeneratedWeaponActive,false);
  c.fpGeneratedWeaponPending={key:'smoke',asset:'ready.webp',model:{}};c.fpGeneratedWeaponLoading=false;c.ensureGeneratedFirstPersonWeaponArtLoaded();
  img.naturalWidth=1600;img.decode=()=>Promise.resolve();await img.onload();assert.equal(c.fpGeneratedWeaponActive,true);assert.equal(c.rigVisible,false);
  c.playGeneratedFirstPersonAction('smokeThrow42');assert.equal(img.style.opacity,'0');assert.equal(action.style.opacity,'1');
  for(let i=0;i<6;i++)c.tickGeneratedFirstPersonAction(.05);assert.equal(action.frame,3);
  c.fpGeneratedWeaponActive=false;img.onerror();assert.equal(c.rigVisible,false,'decoded action still owns visible hand');
  c.stopGeneratedFirstPersonAction();assert.equal(c.rigVisible,true);assert.equal(c.fpGeneratedWeaponAction,null);assert.equal(action.style.opacity,'0');
  c.hideGeneratedFirstPersonWeaponArt(true);assert.equal(img.dataset.smokePack,undefined);assert.equal(wrap.dataset.smokePack,undefined,'switch must remove smoke-only framing from the next weapon');
});
