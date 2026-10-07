# Asset staging — review before runtime

Этот каталог предназначен для временных generated source-candidates. Он намеренно находится **вне** `assets/**`, чтобы новые изображения/VFX не могли случайно стать runtime-зависимостью до визуального review.

Правила:
- сначала duplicate gate в `docs/ASSETS.md`;
- один датированный batch = один понятный набор кандидатов;
- у каждого кандидата должен быть consumer/event/fallback и план runtime derivative;
- staging-файлы нельзя импортировать из `src/**`, `index.html`, `src/assets/catalog.js` или runtime CSS;
- после одобрения VFX обычно переводится в alpha-WebP/static SVG sprite sheet/atlas и проигрывается по elapsed time;
- после интеграции обязательно сохранить procedural/SVG fallback, если он уже существует.

Для weapon/action packs следовать [практическим правилам](../docs/ASSETS.md#практические-правила-для-weaponactionvfx-ассетов): одинаковый ready/action дизайн, чистые границы кадров, достаточное разрешение, реальная decode-проверка, сохранение исторических RNG draws и сценарии error/switch/ADS. Точные source→derivative mappings, hashes, approval, consumers и fallback хранить в batch manifest/README, а общие правила — только в canonical docs.

Для **Blender/GLB/3D packs** canonical workflow — [`docs/BLENDER_ASSET_PIPELINE.md`](../docs/BLENDER_ASSET_PIPELINE.md). 3D batch должен хранить editable `.blend`, deterministic builder или явно документированный manual-source path, preview/evidence, runtime mapping, artifact hashes и rebuild command. Staging `.blend`/preview не подключаются напрямую как runtime dependency; runtime artifact публикуется в `assets/**` только после review и verification. Generated runtime derivative не редактируется вручную.

Текущий 3D batch: `2026-10-06-bot-3d-pack-46/` — **INTEGRATED**, editable Blender source + deterministic builder + GLB/runtime derivative + Blender/Three.js evidence. Общий 3D workflow вынесен в `docs/BLENDER_ASSET_PIPELINE.md`.

Более ранний weapon/action batch: `2026-10-03-sniper-pack-32/` — **INTEGRATED**, coherent SR-9 ready/reload/bolt + compact shot/bullet/casing effects. Reviewed source PNGs, prompts and derivative hashes are retained.

Предыдущий batch: `2026-09-30-vfx-pack-31/` — **INTEGRATED**, plasma-core first-person reload + matching ordinary player plasma weapon identity; the reviewed heavy source raster is omitted under the explicit same-dialog approval exception.

Предыдущий batch: `2026-09-30-vfx-pack-30/` — **INTEGRATED**, tracked plasma-flight ion-sheath VFX with compact alpha-WebP runtime derivative.

Более ранний batch: `2026-09-30-vfx-pack-27/` — **INTEGRATED**, respawn-gate + terminal-arc VFX.

Более ранний batch: `2026-09-30-vfx-pack-26/` — **INTEGRATED**, discharge/heavy-explosion VFX.

Предыдущий batch: `2026-09-30-vfx-pack-25/` — **INTEGRATED**, pistol reload + shotgun pump action atlases.

Более ранний batch: `2026-09-30-vfx-pack-24/` — **INTEGRATED**, rocket reload + mine throw action atlases.

Более ранний batch: `2026-09-30-vfx-pack-18/` — **INTEGRATED**, 3 source previews reviewed in-dialog; heavy raster originals intentionally omitted after explicit same-dialog approval, provenance/consumer mapping retained in the batch README.

Предыдущий batch: `2026-09-30-vfx-pack-17/` — **INTEGRATED**, 3 VFX source-candidates retained as archive/provenance.

Более ранний batch: `2026-09-30-vfx-pack-16/` — **INTEGRATED**, 3 VFX source-candidates retained as archive/provenance.

Более ранний batch: `2026-09-30-vfx-pack-15/` — **INTEGRATED**, 2 VFX source-candidates retained as archive/provenance.
