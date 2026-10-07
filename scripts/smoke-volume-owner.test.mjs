import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const combat=read('src/combat/combat.js'),engine=read('src/core/engine.js'),settings=read('src/settings/settings.js');
function fn(source,name){
  const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);
  let end=source.indexOf('{',start)+1,depth=1;
  for(;depth;end++){if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
  return source.slice(start,end);
}
test('depth volume requires fragment highp; weak precision/depth capability keeps safe fallback',()=>{
  const c={THREE:{ShaderMaterial:class{}},renderer:{capabilities:{isWebGL2:true,getMaxPrecision:()=> 'mediump'},extensions:{has:()=>false}}};
  vm.createContext(c);vm.runInContext(fn(combat,'smokeVolumeSupported42'),c);
  assert.equal(c.smokeVolumeSupported42(),false);
  c.renderer.capabilities.getMaxPrecision=()=> 'highp';assert.equal(c.smokeVolumeSupported42(),true);
  c.renderer.capabilities.isWebGL2=false;assert.equal(c.smokeVolumeSupported42(),false);
  c.renderer.extensions.has=()=>true;assert.equal(c.smokeVolumeSupported42(),true);
});
test('decoded and missing cloud images cannot replace world volume with DOM art',()=>{
  for(const ready of [true,false]){
    let removed=0,created=0;
    const c={smokePresentationAssetReady42:()=>ready,removeSmokeArt42(){removed++;},createSmokeVolume42(cloud){created++;cloud.volume42={};},updateSmokeVolume42(){},
      THREE:{ShaderMaterial:class{}},renderer:{capabilities:{isWebGL2:true}},smokeVolumeSupported42:()=>true};
    vm.createContext(c);vm.runInContext(fn(combat,'syncSmokeCloudArt42'),c);
    const cloud={m:{visible:false},puffs:[{visible:true}],volume42:null};c.syncSmokeCloudArt42(cloud);c.syncSmokeCloudArt42(cloud);
    assert.equal(cloud.m.visible,true);assert.equal(cloud.puffs[0].visible,false);assert.equal(created,1);assert.equal(removed,2);
  }
});
test('old deployment flash and ring are suppressed with the same gameplay RNG draw',()=>{
  let draws=0,publications=0;
  const c={Math:Object.assign(Object.create(Math),{random(){draws++;return .4;}}),playGeneratedCombatVfx(){publications++;}};
  vm.createContext(c);vm.runInContext(fn(settings,'showGeneratedSmokeDeployVfx'),c);
  assert.equal(c.showGeneratedSmokeDeployVfx({}),false);assert.equal(publications,0);assert.equal(draws,1);
});
test('volume bounds stay above the support plane; age and density are passed to the shader',()=>{
  class V{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}set(x,y,z){Object.assign(this,{x,y,z});return this;}}
  const u={uMin:{value:new V()},uMax:{value:new V()},uAge:{value:0},uDensity:{value:0},uSeed:{value:0}};
  const cloud={m:{position:new V(4,.12,-9)},radius:15.5,age:0,density:0,volume42:{position:new V(),scale:new V(),material:{uniforms:u}},puffs:[{userData:{phase:.4}}]};
  const c={};vm.createContext(c);vm.runInContext(fn(combat,'updateSmokeVolume42'),c);
  for(const age of [.1,1,4,57,60]){cloud.age=age;cloud.density=age===60?0:.8;c.updateSmokeVolume42(cloud);assert.equal(u.uMin.value.y,0);assert.ok(u.uMax.value.y>0);assert.equal(u.uAge.value,age);assert.equal(u.uDensity.value,cloud.density);}
  cloud.m.position.y=3.12;c.updateSmokeVolume42(cloud);assert.equal(u.uMin.value.y,3,'roof-supported smoke starts at roof, not arena floor');
});
test('single world pass, quarter-pixel smoke and composite restore state, resize and release resources',()=>{
  const events=[];let disposed=0,quadsDisposed=0;
  class Target{constructor(w,h){this.width=w;this.height=h;this.texture={};}dispose(){disposed++;}setSize(w,h){this.width=w;this.height=h;}}
  class V{constructor(x=0,y=0){this.x=x;this.y=y;}set(x,y){this.x=x;this.y=y;return this;}copy(v){Object.assign(this,v);return this;}}
  class Scene{constructor(){this.children=[];}add(m){this.children.push(m);}}
  class Color{clone(){return new Color();}convertSRGBToLinear(){return this;}}
  class Mesh{constructor(geometry,material){Object.assign(this,{geometry,material});}}
  const mesh={material:{uniforms:{uDepth:{},uResolution:{value:new V()},uNear:{},uFar:{},uMin:{value:new V()},uMax:{value:new V()},uAge:{value:8},uDensity:{value:1},uSeed:{value:.4}}}};
  const camera={near:.05,far:220,layers:{mask:1},position:new V(),matrixWorld:{},projectionMatrixInverse:{}},scene={background:new Color()},size=new V(1600,900),clear=new Color();scene.background.isColor=true;
  const originalBackground=scene.background;
  const renderer={shadowMap:{autoUpdate:true},getDrawingBufferSize(v){return v.copy(size);},getRenderTarget:()=>null,
    getClearColor:()=>clear,getClearAlpha:()=>1,setClearColor(){},setRenderTarget(t){events.push(t?'target':'screen');},
    render(s){events.push(s===scene?(camera.layers.mask===1?'world':'smoke'):'compose');}};
  const c={renderer,scene,camera,PERF_MODE:false,smokeClouds:[{volume42:mesh}],smokeVolumeGlsl42:()=>'',disposeObject3D(){quadsDisposed++;},THREE:{Vector2:V,Vector3:V,Matrix4:V,Color,Scene,Camera:class{},Mesh,
    ShaderMaterial:class{constructor(o){Object.assign(this,o);}},PlaneGeometry:class{},WebGLRenderTarget:Target,DepthTexture:class{},UnsignedShortType:1,NearestFilter:2}};
  vm.createContext(c);vm.runInContext('let smokeDepthTarget42=null,smokeVolumeTarget42=null,smokeComposeScene42=null,smokeComposeCamera42=null;const smokeBufferSize42=new THREE.Vector2();\n'+fn(engine,'disposeSmokeRender42')+'\n'+fn(engine,'renderSmokeDepth42'),c);
  assert.equal(c.renderSmokeDepth42(),true);assert.deepEqual(events,['target','world','target','smoke','screen','compose','screen']);
  assert.equal(camera.layers.mask,1);assert.equal(scene.background,originalBackground);assert.equal(renderer.shadowMap.autoUpdate,true);
  assert.deepEqual([mesh.material.uniforms.uResolution.value.x,mesh.material.uniforms.uResolution.value.y],[800,450]);
  size.set(2560,1440);c.renderSmokeDepth42();assert.deepEqual([mesh.material.uniforms.uResolution.value.x,mesh.material.uniforms.uResolution.value.y],[960,540]);
  c.smokeClouds=[];assert.equal(c.renderSmokeDepth42(),false);assert.equal(disposed,2);assert.equal(quadsDisposed,1);
  c.smokeClouds=[{volume42:mesh}];renderer.render=()=>{throw Error('injected render failure');};assert.throws(()=>c.renderSmokeDepth42(),/injected/);
  assert.equal(camera.layers.mask,1);assert.equal(scene.background,originalBackground);assert.equal(renderer.shadowMap.autoUpdate,true);assert.equal(events.at(-1),'screen');
});
