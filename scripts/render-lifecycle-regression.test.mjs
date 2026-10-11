import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const engine=read('src/core/engine.js'),runtime=read('src/game/runtime.js'),settings=read('src/settings/settings.js');
function fn(source,name){
  const start=source.indexOf('function '+name+'(');
  assert.ok(start>=0,name+' exists');
  let depth=0,begin=source.indexOf('{',start);
  for(let i=begin;i<source.length;i++){
    if(source[i]==='{')depth++;
    if(source[i]==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error('Unclosed function '+name);
}
function execute(source,context){vm.runInContext(source,context);}
function graphicsContext(){
  const c=vm.createContext({graphicsMode:'auto',graphicsTier:2,GRAPHICS_AUTO_MAX_TIER:2,graphicsSampleSeconds:0,graphicsSampleFrames:0,graphicsSlowFrames:0,graphicsGoodWindows:0,applied:[],applyGraphicsTier(t){this.graphicsTier=t;this.applied.push(t);}});
  execute(['resetGraphicsSamples','chooseNextGraphicsTier','sampleAdaptiveGraphics'].map(n=>fn(engine,n)).join('\n'),c);
  execute('applyGraphicsTier=t=>{graphicsTier=t;applied.push(t)}',c);
  return c;
}
test('real runtime presentation caller reports 15/10/4/2 FPS without clamping elapsed time',()=>{
  for(const rate of [15,10,4,2]){
    const fps={style:{},textContent:''};
    const c=vm.createContext({fps,gameSettings:{showFps:true,screenShake:false},byId:id=>id==='fps-counter'?fps:null,tickGeneratedCombatVfx(){},ensureCombatOverlay(){return null;},playerSuppression:0,playerSuppressionPulse:0,settingsOpen:false,shakeTime:0,shakeDuration:.1,shakePower:0,fpsAccum:0,fpsFrames:0,canvas:{style:{}},running:true,paused:true,dying:false,lvlAnnOpen:false,perkPickOpen:false,webglLost:false,portraitBlocked:false,lastT:0,idleRenderAt:0,cancelPendingMineThrow(){},cancelPendingSmokeThrow(){},cancelPendingBombPlant(){},requestAnimationFrame(){},renderFrame(){},IS_TOUCH:false});
    Object.assign(c,{graphicsSampleSeconds:3,graphicsSampleFrames:180,graphicsSlowFrames:1,graphicsGoodWindows:2});
    execute(fn(engine,'resetGraphicsSamples')+'\n'+fn(settings,'tickGamePresentation')+'\n'+fn(runtime,'loop'),c);
    for(let i=1;i<=rate*2;i++)c.loop(i*1000/rate);
    assert.equal(fps.textContent,'FPS '+rate,'real '+rate+' FPS');
    assert.equal(c.graphicsSampleSeconds,0,'pause clears adaptation, without discarding FPS time');
    assert.equal(c.graphicsGoodWindows,0);
  }
});
test('normal frames mixed with >200ms active stalls degrade instead of resetting samples',()=>{
  const c=graphicsContext();
  for(let i=0;i<14;i++){c.sampleAdaptiveGraphics(1/60);c.sampleAdaptiveGraphics(.30);}
  assert.equal(c.graphicsTier,1);
});
test('invalid samples and explicit inactive reset cannot complete an upgrade window',()=>{
  const c=graphicsContext();c.graphicsTier=0;
  for(let i=0;i<600;i++)c.sampleAdaptiveGraphics(1/60);
  for(const value of [NaN,Infinity,0,-1]){c.sampleAdaptiveGraphics(value);assert.equal(c.graphicsGoodWindows,0);}
  c.sampleAdaptiveGraphics(.30);c.resetGraphicsSamples();
  assert.equal(c.graphicsSampleSeconds,0);assert.equal(c.graphicsSlowFrames,0);
  assert.equal(c.graphicsTier,0);
});

// Three resources are small lifecycle doubles: disposal is observable, and scene
// traversal/parenting stay real in this fixture. No renderer, DOM or storage runs.
class Resource{constructor(options={}){this.userData={};this.disposed=0;Object.assign(this,options);}dispose(){this.disposed++;}clone(){return new Resource({...this,userData:{...this.userData},disposed:0});}}
class Vector{constructor(x=0,y=0,z=0){this.set(x,y,z);}set(x,y,z){Object.assign(this,{x,y,z});return this;}copy(v){return this.set(v.x,v.y,v.z);}clone(){return new Vector(this.x,this.y,this.z);}addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}}
class Node{constructor(geometry=null,material=null){this.children=[];this.geometry=geometry;this.material=material;this.userData={};this.position=new Vector();this.rotation=new Vector();this.scale={set(){},setScalar(){}};this.visible=true;}add(n){n.parent?.remove(n);this.children.push(n);n.parent=this;}remove(n){this.children=this.children.filter(x=>x!==n);n.parent=null;}traverse(cb){cb(this);for(const n of this.children)n.traverse(cb);}lookAt(){}getWorldPosition(v){v.copy(this.position);}}
class Geometry extends Resource{setAttribute(){}clearGroups(){}addGroup(){}computeBoundingBox(){}computeBoundingSphere(){}}
class Light extends Node{constructor(color,intensity,distance){super();this.isPointLight=true;this.color={value:color,setHex(v){this.value=v;}};this.intensity=intensity;this.distance=distance;}}
const THREE={Group:Node,Mesh:Node,Vector3:Vector,BufferGeometry:Geometry,Float32BufferAttribute:Resource,MeshStandardMaterial:Resource,MeshBasicMaterial:Resource,PointLight:Light,CylinderGeometry:Geometry,SphereGeometry:Geometry,RingGeometry:Geometry,TorusGeometry:Geometry,BoxGeometry:Geometry};
function lifecycleContext(){const c=vm.createContext({THREE,scene:new Node(),camera:{position:new Vector()},window:{},MOBILE_LOW:false,VISUAL_LIGHTS:true,atob:v=>Buffer.from(v,'base64').toString('binary'),spawnP(){},spawnSmoke(){},spawnSpark(){},mines:[],_gibs:[],Math});execute(fn(engine,'disposeMaterial')+'\n'+fn(engine,'disposeObject3D')+'\n'+fn(engine,'destroySceneObject'),c);return c;}
test('death and role switch preserve Pack46 survivor resources while disposing private surfaces',()=>{
  const c=lifecycleContext();
  c.window.ZAP_BOT_MODEL_46={version:46,components:Object.fromEntries(['ZAP_Torso','ZAP_Role_Anchor','ZAP_Role_Assault'].map(name=>[name,{p:[0,0,0],n:[0,1,0],groups:[{start:0,count:1,material:'MAT_SHELL'}]}]))};
  execute(read('src/entities/bot-model3d.js'),c);
  const a=c.createBotModel46Component('ZAP_Torso','enemy'),b=c.createBotModel46Component('ZAP_Torso','enemy');
  const anchor=c.createBotModel46Component('ZAP_Role_Anchor','enemy'),assault=c.createBotModel46Component('ZAP_Role_Assault','enemy');
  const privateGeo=new Resource(),privateMat=new Resource({map:new Resource()}),group=new Node();group.add(a);group.add(new Node(privateGeo,privateMat));
  const gibGeo=new Resource(),gibMat=new Resource(),gib=new Node(gibGeo,gibMat);
  gib.add(c.createBotModel46Component('ZAP_Torso','enemy'));group.add(gib);
  const survivor={role:'anchor',weapon:{key:'rifle'},model46:{roleModules:{anchor,assault}}};
  const bots=read('src/entities/bots.js'),start=bots.indexOf('  die(dmg,dir){'),end=bots.indexOf('\n  destroy(){',start);
  execute('globalThis.die=function'+bots.slice(start+5,end).trim(),c);
  c.die.call({group,pts:[gib],hEl:{remove(){}},alive:true},10,null);
  execute(fn(engine,'tickGibs'),c);c.tickGibs(3);
  c.syncBotModel46RoleVariant(survivor);survivor.role='assault';c.syncBotModel46RoleVariant(survivor);
  assert.equal(a.geometry,b.geometry);assert.equal(a.material[0],b.material[0]);
  assert.equal(b.geometry.disposed,0,'live survivor geometry');assert.equal(b.material[0].disposed,0,'live survivor material');
  assert.equal(assault.visible,true);assert.equal(anchor.visible,false);
  assert.equal(privateGeo.disposed,1);assert.equal(privateMat.disposed,1);assert.equal(privateMat.map.disposed,1);
  assert.equal(gibGeo.disposed,1);assert.equal(gibMat.disposed,1);assert.equal(gib.material.disposed,1);
});
test('removing one Pack47 piece preserves cached resources and private textures still dispose',()=>{
  const c=lifecycleContext(),q=Buffer.from(new Int16Array([0,0,0]).buffer).toString('base64');
  c.window.ZAP_MAP_KIT_47={version:47,components:{KIT_Wall_4m:{p16:q,n16:q,groups:[{start:0,count:1,material:'MAT_SHELL'}]}}};
  execute(read('src/environment/map-kit3d.js'),c);
  const a=c.createMapKit47Piece('KIT_Wall_4m'),b=c.createMapKit47Piece('KIT_Wall_4m');c.disposeObject3D(a);
  assert.equal(a.geometry,b.geometry);assert.equal(b.geometry.disposed,0);assert.equal(b.material[0].disposed,0);
});
function lightsContext(){
  const c=lifecycleContext();
  // Run owning declarations exactly as loaded before preload renderer.compile.
  execute(engine.slice(engine.indexOf('const _eLights='),engine.indexOf('const combatImpactFx=')),c);
  execute(engine.slice(engine.indexOf('const _mzLights='),engine.indexOf('function ejectCasing')),c);
  execute(fn(engine,'tickExpLights')+'\n'+fn(engine,'tickMzLights'),c);
  return c;
}
const lightCount=c=>{let n=0;c.scene.traverse(x=>{if(x.isPointLight&&x.visible)n++;});return n;};
test('combat starts with bounded visible pools; muzzle/explosion/headshot do not change shader light count',()=>{
  const c=lightsContext(),initial=lightCount(c),pos=new Vector();assert.ok(initial>0,'preload has its complete transient light topology');
  for(let i=0;i<80;i++){c.trigMuzzle(pos,0xffffff);c.explode(pos,0xff4400,3,false,false);c.spawnHeadshotFx(pos,true);}
  assert.equal(lightCount(c),initial,'saturation does not allocate another light');
  c.tickMzLights(1);c.tickExpLights(1);c.tickHeadshotFx(1);
  assert.equal(lightCount(c),initial,'expiry must retain lights in renderer traversal');
  let active=0;c.scene.traverse(x=>{if(x.isPointLight&&x.intensity>0)active++;});assert.equal(active,0);
  c.spawnHeadshotFx(pos,true);c.tickHeadshotFx(.10);let brightness=0;c.scene.traverse(x=>{if(x.isPointLight)brightness+=x.intensity;});assert.ok(brightness>0,'pool reusable after expiry');
  c.tickHeadshotFx(1);assert.equal(lightCount(c),initial);
});
test('saturated headshot has no ownership of another effect light on retirement and reuse',()=>{
  const c=lightsContext(),pos=new Vector();
  c.spawnHeadshotFx(pos,true);c.tickHeadshotFx(.5);c.spawnHeadshotFx(pos,true);
  c.tickHeadshotFx(.45); // first effect expires; second has no light lease
  c.spawnHeadshotFx(pos,true); // a new effect acquires the released light
  c.tickHeadshotFx(.5); // second effect retires while third is still alive
  let brightness=0;c.scene.traverse(x=>{if(x.isPointLight)brightness+=x.intensity;});
  assert.ok(brightness>0,'retiring saturated effect must not extinguish the reused light');
  c.tickHeadshotFx(.5);c.scene.traverse(x=>{if(x.isPointLight)assert.equal(x.intensity,0);});
});
function freshGameContext(){
  const c=lightsContext();
  Object.assign(c,{enemies:[],pickups:[],botGrenades:[],eRkts:[],pRkts:[],pTrs:[],smokeGrenades:[],smokeClouds:[],impactMarks:[],bombBlastWaves:[],P_MAX:0,_pHead:0,_pCount:0,cancelPendingBombPlant(){},clearMineWorldArt39(){},clearGrenadeFlightArt(){},cancelFragGrenadeThrow(){},clearSmokePresentation42(){},removeSmokeCloud(){},G(){return null;}});
  execute(fn(read('src/progression/progression.js'),'clearWorldForFreshGame'),c);
  return c;
}
test('fresh-game reset retains shader light topology and muzzle/explosion can illuminate again',()=>{
  const c=freshGameContext(),pos=new Vector(),count=lightCount(c);
  for(let i=0;i<2;i++){
    c.trigMuzzle(pos,0xffffff);c.explode(pos,0xff4400,3,false,false);
    c.clearWorldForFreshGame();
    assert.equal(lightCount(c),count,'fresh reset keeps pooled lights visible');
    c.scene.traverse(x=>{if(x.isPointLight)assert.equal(x.intensity,0,'reset extinguishes illumination');});
    c.trigMuzzle(pos,0xffffff);c.explode(pos,0xff4400,3,false,false);
    let active=0;c.scene.traverse(x=>{if(x.isPointLight&&x.visible&&x.intensity>0)active++;});
    assert.equal(active,2,'both effects illuminate after restart');
    c.tickMzLights(1);c.tickExpLights(1);assert.equal(lightCount(c),count);
  }
});
test('active headshot reset removes old effects, releases pool and cannot retire a newer lease',()=>{
  const c=freshGameContext(),pos=new Vector(),count=lightCount(c);
  c.spawnHeadshotFx(pos,true);c.tickHeadshotFx(.5);
  const oldFx=vm.runInContext('headshotFx[0]',c),oldLight=oldFx.light;
  c.clearWorldForFreshGame();
  assert.equal(vm.runInContext('headshotFx.length',c),0,'restart clears pending headshot retirement');
  for(const node of [oldFx.ring,oldFx.marker,oldFx.shell,oldFx.beam])assert.equal(node.parent,null,'old mesh removed');
  assert.equal(oldLight.intensity,0);assert.equal(lightCount(c),count);
  c.spawnHeadshotFx(pos,true);
  assert.equal(vm.runInContext('headshotFx[0].light',c),oldLight,'scene-lifetime light reused');
  c.tickHeadshotFx(.5);assert.ok(oldLight.intensity>0,'old retirement cannot extinguish new headshot');
  c.tickHeadshotFx(.5);assert.equal(oldLight.intensity,0);assert.equal(lightCount(c),count);
});
