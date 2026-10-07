# Pack48 — Blender modular floor kit — archived experiment

**Production status: disabled.** The game intentionally uses the original flat `arenaFloor` again. Pack48 remains reproducible source/artifact history only. Live walking tests showed persistent distant shimmer/moire; the later dynamic distance LOD reduced high-frequency detail but introduced visible floor pop-in as the player moved. Do not re-enable this pack in `index.html` without a new visual validation pass.

Pack48 was an experiment to replace the visually uniform arena floor with a reusable Blender-authored presentation layer while deliberately keeping gameplay ground flat.

## Components

- `FLOOR_Panel_8m` — metallic service panels with seams, bolts and status strips.
- `FLOOR_Far_8m` — distance LOD: one 8 m Blender plane, 2 triangles, no subpixel microdetail.
- `FLOOR_Trench_8m` — recessed technical channel, cable runs, rails and grate bridges.
- `FLOOR_Grate_8m` — dense industrial grate with dark backing.
- `FLOOR_Hatch_8m` — circular service hatch with ring, latches and status panel.
- `FLOOR_Guide_8m` — navigation/service lane with hazard rails and cyan guide lights.
- `FLOOR_Capture_12m` — objective platform used at canonical `BOT_MAP_ZONES`.

## Collision contract

`src/core/engine.js::arenaFloor` remains the exact gameplay ground at Y=-0.04 and continues to own `firstGroundHitDistance()`. Pack48 never enters `wallMeshes`, `wallAABBs` or `losMeshes`; trenches and grates are visual recesses only. Capture platforms consume `BOT_MAP_ZONES` from the Frontline/tactics owner instead of duplicating objective coordinates.

Repeated 8 m tiles are rendered with bounded `THREE.InstancedMesh` batches. Geometry and material arrays are cached once per canonical component. Desktop uses a 21×21 presentation grid; `MOBILE_LOW` uses 17×17. Full-detail tiles use distance LOD with hysteresis: desktop **36 m enter / 44 m exit**, low-power **28/36 m**. Outside that band the tile keeps its world footprint but switches to `FLOOR_Far_8m`; capture markings are culled after 52 m / 40 m. Runtime updates the batches only after at least 2 m of camera movement.

### Anti-shimmer / z-fighting invariant

The authoritative 220×220 `arenaFloor` remains in the scene for gameplay/raycast ownership, but while Pack48 is active its material must use `colorWrite=false` and `depthWrite=false`; it must not be hidden or moved. A separate presentation-only fallback plane is rendered 0.18 m lower. Regular 8 m tiles meet at full scale so there are no repeating gaps that expose the lower fallback.

`FLOOR_Capture_12m` is a decal-like marking layer and must not regain a broad 12×12 base plate. Runtime capture materials use `polygonOffset` and `depthWrite=false`. Pack48 tiles and its fallback also use `receiveShadow=false` so the large directional shadow map cannot create grazing-angle acne/bands across the near-horizontal hard-surface details. These rules are regression-owned by `scripts/floor-kit48-owner.test.mjs` and runtime-checked by `scripts/browser-floor-kit48-smoke.mjs`. The smoke explicitly probes centre and edge camera positions and asserts that near + far LOD counts always equal the full tile count, while `FLOOR_Far_8m` remains exactly two triangles.

## Rebuild

```powershell
python -m py_compile asset-staging/2026-10-07-floor-3d-pack-48/build_floor_kit_48.py
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python "G:\МОЯ Веб-разработка\ZAP_ZONE\asset-staging\2026-10-07-floor-3d-pack-48\build_floor_kit_48.py"
```

The builder deterministically regenerates the editable `.blend`, preview PNG, portable GLB, direct-`file://` q16/Base64 runtime derivative and SHA-256 manifest. Generated runtime JS must not be hand-edited.

## Verification

Focused source/artifact oracle: `scripts/floor-kit48-owner.test.mjs`.

Live HTTP/direct-file oracle: `scripts/browser-floor-kit48-smoke.mjs`.

Current verified artifact: Khronos glTF Validator 2.0.0-dev.3.10 = **0 errors / 0 warnings / 0 infos / 0 hints**, **8,786 triangles / 17,924 vertices / 33 draw calls**, 7 materials, 0 textures. Full Node suite at this checkpoint: **354/354 PASS**. HTTP and direct-`file://` Pack48 browser smokes PASS with zero diagnostics; both prove dynamic near/far LOD while gameplay ground remains Y=-0.04.

Visual check: inspect `zap-floor-modular-preview-48.png`, then confirm in the live arena that nearby panel seams are readable, distant terrain becomes low-frequency instead of shimmering, technical trenches remain walkable, grates/hatches do not cause height changes, guide lanes do not overpower gameplay markers, and capture pads align with current Frontline zones when inside their presentation radius.

External technical references used for this pack are summarized in `docs/BLENDER_ASSET_PIPELINE.md`; no third-party meshes or texture packs are included.
