# Архитектура ZAP ZONE

После рефакторинга v21.5 проект больше не хранит всю игру в одном HTML-файле. `index.html` отвечает за DOM-разметку и порядок загрузки.

## Порядок загрузки

1. Three.js r128.
2. `src/core/engine.js` — renderer, scene, map, collision, particles и Three.js helpers.
3. `src/weapons/system.js` — единый каталог оружия, first-person/world/bot модели и weapon bar.
4. `src/player/state.js` — игрок, perks, saves и переключение оружия.
5. `src/combat/combat.js` — input, shooting, projectiles, rockets, mines, bombs, smoke.
6. `src/entities/bots.js` — персонажи, bot AI, teams и spawn.
7. `src/entities/pickups.js` — ammo, health, bomb и лежащее оружие.
8. `src/progression/progression.js` — XP, HUD, damage, death/respawn.
9. `src/game/runtime.js` — main loop, pointer lock, pause и boot.

Файлы остаются обычными browser scripts и загружаются последовательно. Это сохраняет существующие runtime bindings без рискованной одномоментной миграции на bundler.

## Оружие

`src/weapons/system.js` содержит единый `WEAPONS` catalog. Он определяет баланс игрока и AI, ammo defaults, UI assets и визуальные параметры.

`createWeaponModel()` — единый 3D factory. Один дизайн переиспользуется:
- в руках игрока;
- у ботов;
- как world/pickup модель на карте.

World pickups добавлены для пистолета, дробовика, винтовки, ракетницы, плазмы, мины и дымовухи. Бомба использует тот же factory в существующем bomb pickup.

## Assets

`assets/weapons/*.svg` — восемь weapon HUD assets. Все имеют прозрачный фон и не требуют внешних шрифтов.

## Проверка

`.github/workflows/validate.yml` выполняет `node --check` и структурную проверку через `scripts/validate-structure.mjs`. Workflow read-only.
