# Asset staging — review before runtime

Этот каталог предназначен для временных generated source-candidates. Он намеренно находится **вне** `assets/**`, чтобы новые изображения/VFX не могли случайно стать runtime-зависимостью до визуального review.

Правила:
- сначала duplicate gate в `docs/ASSETS.md`;
- один датированный batch = один понятный набор кандидатов;
- у каждого кандидата должен быть consumer/event/fallback и план runtime derivative;
- staging-файлы нельзя импортировать из `src/**`, `index.html`, `src/assets/catalog.js` или runtime CSS;
- после одобрения VFX обычно переводится в alpha-WebP/static SVG sprite sheet/atlas и проигрывается по elapsed time;
- после интеграции обязательно сохранить procedural/SVG fallback, если он уже существует.

Текущий batch: `2026-09-30-vfx-pack-26/` — **INTEGRATED**, 2 generated source sheets reviewed in-dialog; compact discharge/heavy-explosion WebP derivatives are runtime-wired while heavy source rasters are omitted under the explicit same-dialog approval exception.

Предыдущий batch: `2026-09-30-vfx-pack-25/` — **INTEGRATED**, pistol reload + shotgun pump action atlases.

Более ранний batch: `2026-09-30-vfx-pack-24/` — **INTEGRATED**, rocket reload + mine throw action atlases.

Более ранний batch: `2026-09-30-vfx-pack-18/` — **INTEGRATED**, 3 source previews reviewed in-dialog; heavy raster originals intentionally omitted after explicit same-dialog approval, provenance/consumer mapping retained in the batch README.

Предыдущий batch: `2026-09-30-vfx-pack-17/` — **INTEGRATED**, 3 VFX source-candidates retained as archive/provenance.

Более ранний batch: `2026-09-30-vfx-pack-16/` — **INTEGRATED**, 3 VFX source-candidates retained as archive/provenance.

Более ранний batch: `2026-09-30-vfx-pack-15/` — **INTEGRATED**, 2 VFX source-candidates retained as archive/provenance.
