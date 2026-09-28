# Assets — quick map

Главный контракт: **[../docs/ASSETS.md](../docs/ASSETS.md)**.

## Ownership

- `ui/backgrounds` — menu/loading presentation backgrounds;
- `ui/feedback` — level/death/armor-break и другой transient DOM feedback;
- `ui/medals` — generated combat medals;
- `ui/objective` — objective/Frontline presentation;
- `ui/perks` — generated perk presentation overlays;
- `ui/icons`, `ui/teams`, `ui/pickups` — HUD/team/pickup presentation;
- `ui/weapons/fp` — player-only generated first-person weapon presentation; never bot/world geometry;
- `medals`, `status`, `fx`, `perks` — lightweight SVG gameplay/UI fallbacks;
- `weapons` — weapon identity/model visuals;
- `audio` — local runtime audio;
- `environment`, `characters`, `pickups` — existing domain assets.

## Critical invariants

1. Generated raster/WebP UI art is DOM/CSS presentation-only; do not route it into persistent WebGL texture planes/sprites. Generated player-held weapons follow the same rule: DOM overlay for the local player, while procedural Three.js remains the fallback and still drives bots/world pickups. Current FPS weapon pack is **baked-hands**: when its image is active, hide the entire local procedural first-person rig so blocky fallback hands are never double-rendered.
2. Critical information keeps SVG/text/DOM fallback; decorative art may degrade to absence only when meaning remains intact.
3. Runtime generated filenames are semantic ASCII kebab-case, not generator filenames.
4. Add every runtime asset to `GAME_ASSETS` and `scripts/validate-structure.mjs`.
5. After runtime asset change, restamp web build and commit `CHANGELOG.md` in the same logical change.
6. Upload a pack atomically when possible; do not create one push/CI run per image.
7. For manual static/uCoz publication upload `version.json` last.
8. FPS weapon generation must match the approved first-person reference angle/framing; a side-profile/poster weapon is not an acceptable replacement even if the art itself is high quality.
9. Current FPS runtime derivative target: 960×720 transparent WebP, <=250 KiB, per-weapon framing/muzzle tuning, visual screenshot check before calling the integration complete.
10. FPS weapon canvas keeps transparent headroom/left-space; do not tight-crop. Desktop visible silhouette should stay in the lower-right safe sector and away from reticle + center-bottom HP/Score/Kills.
11. Decorative weapon art stays below critical HUD layers; clamp raster sway/rotation so recoil cannot drag the baked image across HUD safe zones.
12. Approved V3 baseline: 960×720 alpha, generous transparent headroom/left-space, baked first-person angle, screenshot-tuned per-weapon placement. Reuse this composition contract for new player-held assets.
13. Recoil is runtime-only and frame-rate independent; muzzle flash is a separate anchored layered effect, never baked into the weapon image and never a short opaque/stubby shape.
14. Mine and smoke may use baked-hands DOM assets like firearms; bomb remains procedural until it has its own approved asset.
