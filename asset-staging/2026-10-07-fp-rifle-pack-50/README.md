# First-person Rifle Pack50

Pack50 is an archived Blender-authored first-person rifle experiment for ZAP ZONE. It is NOT loaded by production. The active player-held rifle has been restored to the previous procedural + Pack36 generated-art presentation at the user's request.

## Why this pack exists

Pack36 already provides a detailed generated rifle image/action set. Pack50 adds real scene-depth geometry and mechanical motion while preserving the same visual language: dark graphite/steel body, blue technical strips, small orange warning accents and a compact optic.

The first Blender pass was rejected during live comparison because it was too bright, too large in frame and used an oversized tube optic. The production pass keeps a smaller lower-right envelope, darker materials, Pack36-like blue/orange accents, a compact holo sight and denser readable side mechanics. browser-fp-rifle36-reference.png is retained beside browser-fp-rifle50-http.png as visual-regression evidence.

## Canonical artifacts

- Builder: build_fp_rifle_50.py
- Editable Blender source: zap-fp-rifle-50.blend
- Blender preview: zap-fp-rifle-preview-50.png
- Portable glTF artifact: ../../assets/weapons/models/zap-fp-rifle-50.glb
- Direct-file derivative: ../../assets/weapons/models/zap-fp-rifle-50.runtime.js
- Runtime constructor/animation owner: ../../src/weapons/first-person-rifle-model3d.js
- Manifest: manifest.json
- Khronos report: gltf-validator-report.json
- Browser oracle: ../../scripts/browser-fp-rifle50-smoke.mjs

Generated GLB/runtime files must be rebuilt from the builder; do not hand-edit them.

## Components and pivots

Pack50 exports five independently movable components:

- FP50_RifleBody — receiver, handguard, barrel, stock, rails, holo sight and side mechanics.
- FP50_Magazine — separate pivot at the magwell for reload removal/insertion.
- FP50_Bolt — separate charging/bolt assembly for shot-cycle kick.
- FP50_LeftArm — support arm/hand, follows the magazine during reload.
- FP50_RightArm — firing arm/hand, receives restrained recoil motion.

Blender +Y is weapon forward. Runtime bridge is (x,y,z) -> (x,z,-y), therefore the runtime muzzle remains on local -Z. Component-local pivots are serialized in the q16 derivative so browser animation does not reconstruct them by guesswork.

## Ownership and fallback

Pack50 is presentation-only. It does not own ammo, cadence, damage, projectile spawning, ADS policy, camera recoil, reload timing, collision or hit detection.

src/weapons/system.js::buildGun() tries Pack50 only for rifle. If Pack50 is absent or incomplete, it falls through to the previous procedural first-person rifle and then the established Pack36 generated-art path. Other weapons never query Pack50.

The runtime module clones decoded geometry/materials per live instance because clearGroupChildren() disposes instance resources on weapon switches.

## Runtime animation

src/game/runtime.js continues to own canonical gameplay state and passes bounded presentation values into updateFirstPersonRifleModel50():

- shot recoil / cycle -> bolt travel + slight firing-hand response;
- reload progress -> magazine extraction/insertion + support-hand reach;
- ADS blend -> removes the hip-only vertical/depth offset so the compact holo returns toward the sight line;
- existing gunGrp still owns bob, sway, sprint, equip and whole-weapon reload motion.

This separation keeps animation deterministic and prevents Blender presentation from mutating combat state.

## Rebuild

Run Python compile first, then Blender 5.2 headless:

python -m py_compile asset-staging/2026-10-07-fp-rifle-pack-50/build_fp_rifle_50.py

C:\Program Files\Blender Foundation\Blender 5.2\blender.exe --background --factory-startup --python G:\МОЯ Веб-разработка\ZAP_ZONE\asset-staging\2026-10-07-fp-rifle-pack-50\build_fp_rifle_50.py

The builder updates .blend, preview, GLB, q16/Base64 runtime derivative and manifest.json in one deterministic pass.

## Verification ladder

1. Python compile.
2. Blender 5.2.2 LTS headless rebuild.
3. Review both Blender preview and the actual Three.js 1600×900 browser capture.
4. Khronos glTF Validator 2.0.0-dev.3.10 — target 0 errors / 0 warnings / 0 infos / 0 hints.
5. node --check for runtime module, weapon system and game runtime.
6. node --test scripts/first-person-rifle-pack50-owner.test.mjs scripts/rifle-presentation-owner.test.mjs.
7. node scripts/stamp-web-build.mjs --check.
8. node scripts/validate-structure.mjs.
9. Full node --test scripts/*.test.mjs.
10. Fresh HTTP and direct-file browser-fp-rifle50-smoke.mjs, with no fatal browser diagnostics.

Current generated geometry is 10,836 triangles / 25 glTF draw calls. Textures are not required by the runtime derivative. Exact component vertex/group counts and SHA-256 identities are in manifest.json.

## Technical references

No third-party model or texture was imported. Technical guidance only:

- Blender 5.2 glTF exporter: https://docs.blender.org/manual/en/5.2/addons/import_export/scene_gltf2.html
- Blender Bevel modifier: https://docs.blender.org/manual/en/5.2/modeling/modifiers/generate/bevel.html
- glTF 2.0 specification: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
- Khronos glTF Validator: https://github.com/KhronosGroup/glTF-Validator
- Three.js BufferGeometry: https://threejs.org/docs/pages/BufferGeometry.html
- Three.js MeshStandardMaterial: https://threejs.org/docs/pages/MeshStandardMaterial.html

Current project code, manifest and browser evidence have priority over generic reference guidance.
