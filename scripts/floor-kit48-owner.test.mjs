import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const sha256=path=>createHash('sha256').update(readFileSync(new URL(path,root))).digest('hex');
const manifest=JSON.parse(read('asset-staging/2026-10-07-floor-3d-pack-48/manifest.json'));

test('Pack48 archive artifacts stay reproducible even though production no longer loads them',()=>{
  assert.equal(manifest.packVersion,48);
  const paths={
    glb:'assets/environment/models/zap-floor-modular-48.glb',
    runtimeJs:'assets/environment/models/zap-floor-modular-48.runtime.js',
    blend:'asset-staging/2026-10-07-floor-3d-pack-48/zap-floor-modular-48.blend',
    preview:'asset-staging/2026-10-07-floor-3d-pack-48/zap-floor-modular-preview-48.png',
    builder:'asset-staging/2026-10-07-floor-3d-pack-48/build_floor_kit_48.py'
  };
  for(const [key,path] of Object.entries(paths)){
    assert.equal(statSync(new URL(path,root)).size,manifest.artifacts[key].bytes,key+' byte size drift');
    assert.equal(sha256(path),manifest.artifacts[key].sha256,key+' sha256 drift');
  }
});

test('production bootstrap leaves Pack48 disabled and keeps Pack47/map runtime intact',()=>{
  const html=read('index.html');
  assert.doesNotMatch(html,/zap-floor-modular-48\.runtime\.js/);
  assert.doesNotMatch(html,/src\/environment\/floor-kit3d\.js/);
  assert.match(html,/zap-map-sci-fi-kit-47\.runtime\.js/);
  assert.match(html,/src\/environment\/map-kit3d\.js/);
});

test('engine renders the original flat arena floor without Pack48 hooks or moving LOD',()=>{
  const engine=read('src/core/engine.js');
  assert.match(engine,/new THREE\.MeshStandardMaterial\(\{color:0x202833,roughness:\.96,metalness:0,side:THREE\.DoubleSide\}\)/);
  assert.match(engine,/new THREE\.PlaneGeometry\(220,220\)/);
  assert.match(engine,/floor\.position\.y=-0\.04/);
  assert.match(engine,/floor\.receiveShadow=true/);
  assert.match(engine,/function firstGroundHitDistance\(/);
  assert.doesNotMatch(engine,/installFloorKit48Presentation/);
  assert.doesNotMatch(engine,/updateFloorKit48Lod/);
});

test('Frontline no longer installs Pack48 capture-floor presentation',()=>{
  const frontline=read('src/game/frontline.js');
  assert.match(frontline,/const frontlineZoneOwners=Object\.fromEntries\(BOT_MAP_ZONES\.map/);
  assert.doesNotMatch(frontline,/installFloorKit48CapturePads/);
});

test('structure gate does not require archived Pack48 runtime files',()=>{
  const validator=read('scripts/validate-structure.mjs');
  assert.doesNotMatch(validator,/zap-floor-modular-48\.runtime\.js/);
  assert.doesNotMatch(validator,/src\/environment\/floor-kit3d\.js/);
});
