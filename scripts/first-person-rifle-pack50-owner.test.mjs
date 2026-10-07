import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT=path.resolve(import.meta.dirname,'..');
const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');
const bytes=rel=>fs.readFileSync(path.join(ROOT,rel));
const sha256=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');

const RUNTIME='assets/weapons/models/zap-fp-rifle-50.runtime.js';
const MANIFEST='asset-staging/2026-10-07-fp-rifle-pack-50/manifest.json';
const GLB='assets/weapons/models/zap-fp-rifle-50.glb';
const BLEND='asset-staging/2026-10-07-fp-rifle-pack-50/zap-fp-rifle-50.blend';

test('Pack50 remains archived and is not loaded by production bootstrap',()=>{
  const html=read('index.html');
  assert.doesNotMatch(html,/zap-fp-rifle-50\.runtime\.js/);
  assert.doesNotMatch(html,/first-person-rifle-model3d\.js/);
  const system=read('src/weapons/system.js');
  assert.doesNotMatch(system,/createFirstPersonRifleModel50/);
  assert.match(system,/const model=createWeaponModel\(w\.key,\{mode:'firstPerson',detail:2\}\)/);
  assert.match(system,/setGeneratedFirstPersonWeaponArt\(w,model\)/,
    'Pack36 generated rifle art remains the active first-person path');
  const runtime=read('src/game/runtime.js');
  assert.doesNotMatch(runtime,/updateFirstPersonRifleModel50/);
});

test('archived Pack50 Blender artifacts remain reproducible for future experiments',()=>{
  const manifest=JSON.parse(read(MANIFEST));
  assert.equal(manifest.packVersion,50);
  assert.equal(manifest.weaponKey,'rifle');
  const artifacts={glb:GLB,runtimeJs:RUNTIME,blend:BLEND};
  for(const [name,rel] of Object.entries(artifacts)){
    const data=bytes(rel);
    assert.equal(manifest.artifacts[name].bytes,data.length,name+' byte count');
    assert.equal(manifest.artifacts[name].sha256,sha256(data),name+' sha256');
  }
});
