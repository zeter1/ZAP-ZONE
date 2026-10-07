import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT=path.resolve(import.meta.dirname,'..');
const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');
const bytes=rel=>fs.readFileSync(path.join(ROOT,rel));
const sha256=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');

const RUNTIME='assets/weapons/models/zap-world-weapons-49.runtime.js';
const MANIFEST='asset-staging/2026-10-07-world-weapons-pack-49/manifest.json';
const GLB='assets/weapons/models/zap-world-weapons-49.glb';
const BLEND='asset-staging/2026-10-07-world-weapons-pack-49/zap-world-weapons-49.blend';
const PREVIEW='asset-staging/2026-10-07-world-weapons-pack-49/zap-world-weapons-preview-49.png';
const BUILDER='asset-staging/2026-10-07-world-weapons-pack-49/build_world_weapons_49.py';

function runtimePack(){
  const source=read(RUNTIME);
  const prefix='window.ZAP_WORLD_WEAPONS_49=';
  assert.ok(source.startsWith('/* GENERATED'), 'runtime derivative must identify itself as generated');
  const start=source.indexOf(prefix);
  assert.ok(start>=0, 'runtime derivative must publish window.ZAP_WORLD_WEAPONS_49');
  const json=source.slice(start+prefix.length).trim().replace(/;\s*$/,'');
  return JSON.parse(json);
}

test('Pack49 publishes exactly the six requested world firearm components',()=>{
  const pack=runtimePack();
  assert.equal(pack.version,49);
  assert.equal(pack.schema,1);
  const expected=['pistol','shotgun','rifle','plasma','sniper','rocket'];
  assert.deepEqual(Object.keys(pack.weapons),expected);
  for(const key of expected){
    const spec=pack.weapons[key];
    assert.ok(spec.component.startsWith('ZAP_WPN_'));
    const component=pack.components[spec.component];
    assert.ok(component,key+' component must exist');
    assert.ok(component.p16.length>100,key+' positions must be populated');
    assert.ok(component.n16.length>100,key+' normals must be populated');
    assert.ok(component.qScale>=1,key+' qScale must preserve long weapon geometry');
    assert.ok(component.groups.length>=4,key+' must retain multiple readable material groups');
    assert.ok(Number.isFinite(spec.muzzleZ)&&spec.muzzleZ<0,key+' keeps the existing local -Z muzzle convention');
    const raw=Buffer.from(component.p16,'base64');
    const q=new Int16Array(raw.buffer,raw.byteOffset,raw.byteLength/2);
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(let i=0;i<q.length;i+=3)for(let axis=0;axis<3;axis++){
      const v=q[i+axis]/32767*component.qScale;
      min[axis]=Math.min(min[axis],v);max[axis]=Math.max(max[axis],v);
    }
    const height=max[1]-min[1],depth=max[2]-min[2];
    assert.ok(depth>height*1.10,key+' long axis must remain runtime local -Z, depth='+depth+', height='+height);
  }
});

test('Pack49 stays outside first-person ownership and is a fallback-safe bot/world override',()=>{
  const system=read('src/weapons/system.js');
  assert.match(system,/mode!=='firstPerson'&&typeof createWorldWeaponModel49==='function'/);
  assert.match(system,/createWeaponModel\(w\.key,\{mode:'firstPerson',detail:2\}\)/,
    'existing first-person factory path must remain present');
  assert.match(system,/const blenderModel=createWorldWeaponModel49\(w\.key,\{mode,team,accentColor\}\);\s*if\(blenderModel\)return blenderModel;/,
    'Pack49 must fall through to the existing procedural factory when unavailable');

  const module=read('src/weapons/world-weapon-model3d.js');
  assert.match(module,/canonicalGeometry\.clone\(\)/,
    'instances must clone cached decoded geometry because engine disposal is per instance');
  assert.match(module,/\(set\[name\]\|\|set\.MAT_DARK\)\.clone\(\)/,
    'instances must clone shared materials before clearGroupChildren/destroySceneObject disposal');
});

test('Pack49 pickups remain real scene-depth 3D and do not get hidden by old DOM weapon cards',()=>{
  const pickups=read('src/entities/pickups.js');
  assert.match(pickups,/usesBlender49=!!model\.userData\.blenderWorldWeapon49/);
  assert.match(pickups,/if\(!usesBlender49\)attachDetailedPickupArt\(g,model,w\.key\)/);
  assert.match(pickups,/groundPickupModel\(g,model\)/,'Pack49 still consumes canonical pickup grounding/batching');
});

test('Pack49 scripts load before weapon system on HTTP and direct file bootstrap',()=>{
  const html=read('index.html');
  const derivative=html.indexOf('assets/weapons/models/zap-world-weapons-49.runtime.js');
  const module=html.indexOf('src/weapons/world-weapon-model3d.js');
  const system=html.indexOf('src/weapons/system.js');
  assert.ok(derivative>=0&&module>derivative&&system>module,'Pack49 derivative/module must load before system.js');
});

test('manifest hashes and compact artifact budgets match current generated outputs',()=>{
  const manifest=JSON.parse(read(MANIFEST));
  assert.equal(manifest.packVersion,49);
  assert.equal(manifest.blenderVersion,'5.2.2 LTS');
  assert.equal(manifest.firstPersonTouched,false);
  assert.deepEqual(manifest.weaponKeys,['pistol','shotgun','rifle','plasma','sniper','rocket']);

  const artifacts={glb:GLB,runtimeJs:RUNTIME,blend:BLEND,preview:PREVIEW,builder:BUILDER};
  for(const [name,rel] of Object.entries(artifacts)){
    const data=bytes(rel);
    assert.equal(manifest.artifacts[name].bytes,data.length,name+' byte count');
    assert.equal(manifest.artifacts[name].sha256,sha256(data),name+' sha256');
  }
  assert.ok(manifest.artifacts.glb.bytes<1_500_000,'six-weapon GLB should stay below 1.5 MiB');
  assert.ok(manifest.artifacts.runtimeJs.bytes<1_500_000,'file:// derivative should stay below 1.5 MiB');
  const triangles=Object.values(manifest.components).reduce((sum,c)=>sum+c.triangles,0);
  assert.ok(triangles>10_000&&triangles<30_000,'mid-poly Pack49 triangle budget unexpected: '+triangles);
});
