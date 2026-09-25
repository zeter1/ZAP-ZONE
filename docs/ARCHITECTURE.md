# Архитектура ZAP ZONE

## Порядок загрузки

1. Three.js r128.
2. `src/assets/catalog.js` — пути visual assets и helpers для Three.js textures/sprites/planes.
3. `src/core/engine.js` — renderer, arena, collision, environment decoration и particles.
4. `src/weapons/system.js` — каталог оружия и общий 3D weapon factory.
5. `src/player/state.js` — player state, perks, save/resume.
6. `src/combat/combat.js` — input и combat.
7. `src/entities/bots.js` — AI.
8. `src/entities/pickups.js` — ammo/health/bomb/weapon pickups.
9. `src/progression/progression.js` — HUD, XP, damage, death/respawn.
10. `src/game/runtime.js` — main loop и boot.

## Asset layer

`GAME_ASSETS` — единый каталог неоружейных визуальных ресурсов. `gameTexture()` кеширует Three.js textures. `makeAssetPlane()` используется для environment decals, `makeAssetSprite()` — для billboard icons над pickups.

Каталог разделён на:

- `pickups`;
- `environment`;
- `ui`.

Оружейные SVG остаются привязаны к `WEAPONS[].asset`, чтобы баланс и визуальная идентичность оружия оставались в одном источнике данных.

## Arena visuals

Коллизии не менялись: базовые box meshes остаются источником AABB. Декали, рамки, терминальные экраны и emissive-детали добавляются дочерними визуальными объектами и не создают лишние collision volumes.

Это позволяет улучшать графику без изменения физики карты.

## Проверка

`scripts/validate-structure.mjs` проверяет существование и wiring assets. GitHub Actions дополнительно запускает browser boot smoke test через локальный HTTP server и headless Chrome.
