import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const sha256=path=>createHash('sha256').update(readFileSync(new URL(path,root))).digest('hex');

const manifest=JSON.parse(read('asset-staging/2026-10-07-map-sci-fi-kit-47/manifest.json'));
const runtimeSource=read('assets/environment/models/zap-map-sci-fi-kit-47.runtime.js');
const context={window:{}};
vm.createContext(context);
vm.runInContext(runtimeSource,context,{filename:'zap-map-sci-fi-kit-47.runtime.js'});
const pack=context.window.ZAP_MAP_KIT_47;

const REQUIRED=[
  'KIT_Wall_4m','KIT_Wall_8m','KIT_Wall_12m','KIT_Corner_90','KIT_Column',
  'KIT_Door_Frame','KIT_Barrier','KIT_Container','KIT_Armor_Cover','KIT_SciFi_Sandbag',
  'KIT_AntiTank_Block','KIT_Cargo_Crate','KIT_Reactor_Housing','KIT_Ramp','KIT_Ladder',
  'KIT_Grate','KIT_Tech_Panel','KIT_Vent','KIT_Pipe_Straight','KIT_Pipe_Elbow',
  'KIT_Cable_Tray','KIT_Fortification','KIT_Base_Module'
];

test('Pack47 runtime publishes the complete modular sci-fi kit',()=>{
  assert.equal(pack.version,47);
  assert.deepEqual(Object.keys(pack.components).sort(),REQUIRED.slice().sort());
  for(const name of REQUIRED){
    const c=pack.components[name];
    assert.ok(Number.isFinite(c.qScale)&&c.qScale>0,name+' must publish qScale');
    const p=Buffer.from(c.p16,'base64'),n=Buffer.from(c.n16,'base64');
    assert.ok(p.length>0&&p.length===n.length,name+' position/normal streams must match');
    assert.equal(p.length%18,0,name+' stream must contain complete non-indexed triangles');
    const vertices=p.length/6;
    assert.equal((c.groups||[]).reduce((sum,g)=>sum+g.count,0),vertices,name+' groups must cover every vertex');
  }
});

test('Pack47 static wall/base facades avoid subpixel microdetail instead of distance pop-in',()=>{
  const builder=read('asset-staging/2026-10-07-map-sci-fi-kit-47/build_map_kit_47.py');
  assert.doesNotMatch(builder,/name\+"_(?:top|bot|inset|rail_l|rail_r|status|warn|panel_top|panel_bot|brace)"/);
  assert.doesNotMatch(builder,/face_bolts\(name,p/);
  assert.doesNotMatch(builder,/warning_chevron\(name,p/);
  assert.doesNotMatch(builder,/base_(?:roof|plinth|front|corner|rail|panel|glow|warn|service|upper|lower|rib)/);
  assert.match(builder,/name\+"_post",\(\.28,\.56,2\.72\)/);
  assert.match(builder,/p=\[box\("base_core",\(6\.0,5\.0,3\.6\),material="MAT_SHELL",bevel=\.18\)\]/);
});

test('Pack47 manifest identities match generated artifacts',()=>{
  assert.equal(manifest.packVersion,47);
  const paths={
    glb:'assets/environment/models/zap-map-sci-fi-kit-47.glb',
    runtimeJs:'assets/environment/models/zap-map-sci-fi-kit-47.runtime.js',
    blend:'asset-staging/2026-10-07-map-sci-fi-kit-47/zap-map-sci-fi-kit-47.blend',
    preview:'asset-staging/2026-10-07-map-sci-fi-kit-47/zap-map-sci-fi-kit-preview-47.png',
    builder:'asset-staging/2026-10-07-map-sci-fi-kit-47/build_map_kit_47.py'
  };
  for(const [key,path] of Object.entries(paths)){
    const expected=manifest.artifacts[key];
    assert.equal(statSync(new URL(path,root)).size,expected.bytes,key+' byte size drift');
    assert.equal(sha256(path),expected.sha256,key+' sha256 drift');
  }
});

test('runtime composition keeps collision owners authoritative and presentation-only meshes separate',()=>{
  const owner=read('src/environment/map-kit3d.js');
  const engine=read('src/core/engine.js');
  assert.match(owner,/presentationOnly=true/);
  assert.match(owner,/mapKit47AntiShimmer=true/);
  assert.match(owner,/m\.castShadow=!MOBILE_LOW/,'Pack47 buildings should still cast world shadows');
  assert.match(owner,/m\.receiveShadow=false/,'Pack47 facades must not receive the coarse arena shadow map');
  assert.match(owner,/MAT_SHELL:new THREE\.MeshStandardMaterial\(\{color:0x536a78,roughness:\.62,metalness:\.24\}\)/);
  assert.match(owner,/MAT_EDGE:new THREE\.MeshStandardMaterial\(\{color:0xa0b0ba,roughness:\.52,metalness:\.34\}\)/);
  assert.match(owner,/presentationCollisionOwner=true/);
  assert.match(owner,/material\.colorWrite=false/);
  assert.match(owner,/material\.depthWrite=false/);
  assert.doesNotMatch(owner,/owner\.visible\s*=\s*false/);
  assert.match(engine,/new THREE\.PerspectiveCamera\(75,W\/H,\.12,220\)/,'camera near plane must preserve depth precision for distant Pack47 facade layers');
  assert.match(engine,/wallAABBs\.push\(bb\)/,'canonical wall collision AABBs must remain owned by box()');
  assert.match(engine,/installMapKit47Presentation/);
  assert.match(engine,/suppressMapKit47CollisionOwnerSurface/);
});

test('Pack47 base facade stays monolithic without shimmering front attachments',()=>{
  const owner=read('src/environment/map-kit3d.js');
  const baseFn=owner.match(/function decorateMapKit47Base\([\s\S]*?\n\}/)?.[0]||'';
  assert.match(baseFn,/MAP_KIT_47\.base/);
  assert.doesNotMatch(baseFn,/MAP_KIT_47\.techPanel/);
  assert.doesNotMatch(baseFn,/MAP_KIT_47\.vent/);
  assert.doesNotMatch(baseFn,/MAP_KIT_47\.grate/);
  assert.doesNotMatch(baseFn,/MAP_KIT_47\.cableTray/);
  assert.doesNotMatch(baseFn,/MAP_KIT_47\.pipe\b/);
  assert.doesNotMatch(baseFn,/MAP_KIT_47\.pipeElbow/);
  assert.doesNotMatch(baseFn,/MAP_KIT_47\.ladder/);
  assert.doesNotMatch(baseFn,/MAP_KIT_47\.corner/);
});

test('Pack47 doorway topology uses split collision owners and passable presentation gates',()=>{
  const owner=read('src/environment/map-kit3d.js');
  const engine=read('src/core/engine.js');
  assert.match(engine,/function createMapKit47DoorwayWall\(/);
  assert.match(engine,/mapKit47DoorwaySide=true/,'doorway side segments must remain canonical collision owners');
  assert.match(engine,/placeMapKit47DoorFrame/,'door frame must stay presentation-only');
  assert.match(engine,/placeMapKit47ServiceRamp/,'shallow service ramps must stay presentation-only');
  assert.match(engine,/createMapKit47DoorwayWall\(\.6,3,30/,'central north-south walls must contain a real opening');
  assert.match(engine,/createMapKit47DoorwayWall\(30,3,\.6/,'central east-west walls must contain a real opening');
  assert.match(owner,/MAP_KIT_47\.door/);
  assert.match(owner,/MAP_KIT_47\.ramp/);
});

test('cover visuals stay presentation-only while legacy box owners keep gameplay collision',()=>{
  const owner=read('src/environment/map-kit3d.js');
  const engine=read('src/core/engine.js');
  for(const decorator of ['decorateMapKit47ArmorCover','decorateMapKit47SciFiSandbag','decorateMapKit47AntiTank','decorateMapKit47CargoCrate','decorateMapKit47ReactorHousing']){
    assert.match(owner,new RegExp('function '+decorator+'\\('),decorator+' must live in the presentation owner');
  }
  assert.match(engine,/type===0\?decorateMapKit47ArmorCover\(body,\.\.\.dims\):type===1\?decorateMapKit47SciFiSandbag\(body,\.\.\.dims\):decorateMapKit47CargoCrate\(body,\.\.\.dims\)/);
  assert.match(engine,/createSupplyCrate[\s\S]*decorateMapKit47CargoCrate\(body,2,h,2\)/);
  assert.match(engine,/box\(3,5,3[\s\S]*decorateMapKit47ReactorHousing/);
  assert.match(engine,/const owner=box\(1\.4,\.9,1\.4,[^;]+\);\s*owner\.userData\.mapKit47PresentationYaw=r;/,
    'anti-tank gameplay owner must remain the original unrotated box; random yaw belongs to presentation only');
  assert.match(owner,/const visualYaw=Number\(owner\?\.userData\?\.mapKit47PresentationYaw\)\|\|0;/);
  assert.doesNotMatch(owner,/wallMeshes\.push|wallAABBs\.push/,'presentation owner must never register Blender meshes as gameplay collision');
});

test('Pack47 scripts load before engine on HTTP and direct file startup',()=>{
  const html=read('index.html');
  const runtime=html.indexOf("'assets/environment/models/zap-map-sci-fi-kit-47.runtime.js'");
  const owner=html.indexOf("'src/environment/map-kit3d.js'");
  const engine=html.indexOf("'src/core/engine.js'");
  assert.ok(runtime>=0&&owner>runtime&&engine>owner,'runtime derivative -> owner -> engine load order is required');
});
