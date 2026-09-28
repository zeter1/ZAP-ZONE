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

1. Generated raster/WebP UI art is DOM/CSS presentation-only; do not route it into persistent WebGL texture planes/sprites. Generated player-held weapons follow the same rule: DOM overlay for the local player, while procedural Three.js remains the fallback and still drives bots/world pickups.
2. Critical information keeps SVG/text/DOM fallback; decorative art may degrade to absence only when meaning remains intact.
3. Runtime generated filenames are semantic ASCII kebab-case, not generator filenames.
4. Add every runtime asset to `GAME_ASSETS` and `scripts/validate-structure.mjs`.
5. After runtime asset change, restamp web build and commit `CHANGELOG.md` in the same logical change.
6. Upload a pack atomically when possible; do not create one push/CI run per image.
7. For manual static/uCoz publication upload `version.json` last.
