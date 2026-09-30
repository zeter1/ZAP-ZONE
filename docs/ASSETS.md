# Asset pipeline — ZAP ZONE

## 0.0. Asset staging before runtime integration

Новые generated assets сначала должны попадать в корневой каталог `asset-staging/`, а не напрямую в runtime-`assets/`. Это обязательный review gate для ChatGPT/Codex и других AI-агентов.

Порядок:
1. пройти duplicate gate из раздела ниже и назначить конкретный consumer/event/fallback;
2. создать датированный batch в `asset-staging/YYYY-MM-DD-<pack>/`;
3. положить туда source-candidates + короткий manifest/README; **не** добавлять их в `GAME_ASSETS`, `index.html`, runtime CSS/JS или `assets/**`;
4. пользователь визуально проверяет кандидаты и явно разрешает интеграцию;
5. только после одобрения сделать runtime derivative (для коротких VFX обычно alpha-WebP sprite sheet/atlas), подключить consumer и fallback, затем выполнить validation/smoke/screenshot gate;
6. после успешной интеграции staging-source можно оставить как provenance/reference или удалить отдельным осознанным cleanup-коммитом.

Почему staging находится вне `assets/**`: каталог `assets/` является runtime surface и проверяется CI как часть игры. `asset-staging/` — не runtime и не должен случайно подхватываться catalog/loader-ами до одобрения.

Для анимированных SVG в staging считать их **preview/source**, а не gameplay-time authority. При интеграции снимать детерминированные кадры и проигрывать их по elapsed time существующего game loop / `requestAnimationFrame`.

## Generated Asset Pack 16 (2026-09-30)
Approved staging sources from `asset-staging/2026-09-30-vfx-pack-16/` are integrated as one deterministic scriptless 8×3 SVG runtime atlas:
- `assets/ui/fx/bot-action-vfx-atlas-16.svg` — row 0 bot plasma muzzle ion burst, row 1 bot kinetic dodge skid, row 2 replacement-bot spawn materialization.

The existing bounded elapsed-time DOM VFX player in `src/settings/settings.js` owns playback/projection/cleanup. `showGeneratedBotMuzzleVfx(...)` now selects the plasma row for plasma weapons while preserving the existing Pack 13 ballistic row. `Enemy.triggerDodge(...)` emits the dodge decoration only after `applyBotDodgeResponse(...)` actually starts a dodge, without adding visual RNG draws. `spawnBot(team, showSpawnVfx=true)` decorates replacement spawns after the new bot is added; `spawnInitial()` explicitly passes `false` so match startup cannot create a mass VFX burst.

Fire cadence, projectile spawning, hit/damage logic, dodge duration/speed/cooldown/RNG order, spawn position/timing/team counts and procedural bot models remain authoritative and unchanged. Staging SVG loops remain provenance/review sources only; runtime uses static frames.

## Generated Asset Pack 15 (2026-09-30)
Approved staging sources from `asset-staging/2026-09-30-vfx-pack-15/` are integrated as two deterministic scriptless runtime atlases:
- `assets/ui/fx/frag-grenade-shrapnel-bloom-atlas-15.svg` — 8×1 static frames for bot frag-grenade detonation;
- `assets/ui/fx/player-death-signal-collapse-atlas-15.svg` — 8×1 16:9 static frames for the short player death → kill-camera transition.

`src/combat/combat.js::tickBotGrenades()` emits the frag decoration after the existing procedural explosion/impact event, while `src/progression/progression.js::checkDeath()` starts the death overlay only after `startDeathCamera(killer)` has transferred view ownership. The death atlas advances from the dedicated dying loop in `src/game/runtime.js`, so the effect remains elapsed-time driven even while ordinary gameplay presentation ticking is paused. `cleanupDeathCamera()` owns cleanup. A reduced-motion preference keeps a brief static pulse instead of fracture/glitch frame motion.

Damage, fuse timing, blast radius, team filtering, respawn delay, kill-camera ownership, death text and existing procedural/CSS/audio fallbacks remain authoritative and unchanged. The animated staging SVGs remain provenance/review sources only.

## Generated Asset Pack 14 (2026-09-30)
Approved staging sources from `asset-staging/2026-09-30-vfx-pack-14/` are integrated into one deterministic scriptless atlas:
- `assets/ui/fx/player-feedback-vfx-atlas-14.svg` — 8×2 / 16 static frames;
- row 0: world-projected critical-hit overcharge burst;
- row 1: screen-local player armor-break shatter.

`src/combat/combat.js` emits the critical decoration only after the existing procedural critical impact path, while `src/progression/progression.js::showArmorBreakFx()` triggers the armor shatter from the single authoritative `armorBefore > 0 && armor <= 0` transition. `src/settings/settings.js` reuses the bounded elapsed-time DOM VFX player, including world projection/off-screen hiding for critical hits and cleanup for both effects. Critical damage, armor absorption, HP, hitmarkers, sound and current procedural/UI fallbacks remain unchanged.

## Generated Asset Pack 13 (2026-09-30)
Approved staging sources from `asset-staging/2026-09-30-vfx-pack-13/` are integrated into one deterministic scriptless atlas:
- `assets/ui/fx/bot-combat-vfx-atlas-13.svg` — 8×2 / 16 static frames;
- row 0: world-space bot muzzle blast for non-plasma firearm/rocket shots;
- row 1: bot armor-rupture/death burst.

`src/settings/settings.js` reuses the bounded elapsed-time combat VFX player. Muzzle playback is throttled per bot, projected at the authoritative muzzle position and screen-oriented from the bot yaw; plasma keeps its existing cyan procedural presentation instead of receiving the orange ballistic atlas. `src/ai/bot-fire-control.js` emits the muzzle decoration only after the existing procedural muzzle/audio/noise event, while `src/entities/bots.js::Bot.die()` emits the death burst before group disposal. Fire cadence, accuracy, projectiles, damage, rewards, gibs and respawn logic are unchanged; procedural presentation remains fallback.

## Generated Asset Pack 12 (2026-09-30)
Approved staging sources from `asset-staging/2026-09-30-vfx-pack-12/` are integrated into one static-frame runtime atlas:
- `assets/ui/fx/combat-vfx-atlas-12.svg` — 8×5 / 40-frame mega-atlas;
- row 0: ricochet spark fan;
- row 1: wall-penetration exit debris;
- row 2: smoke deployment bloom;
- row 3: mine shrapnel detonation;
- row 4: bomb pressure-core detonation.

The atlas is scriptless and has no internal SVG animation. `generatedCombatVfxFrame(...)` now supports a row offset for shared static atlases, while playback remains elapsed-time driven and bounded by the existing Pack 10/11 DOM VFX budget. Player and bot ricochets/penetrations share the same presentation hooks; smoke bloom decorates only cloud deployment; mine/bomb effects decorate existing detonation events. Physics, damage, fuse, smoke density/LOS and audio stay authoritative in current gameplay code, with all procedural presentation retained as fallback.

## Generated Asset Pack 11 (2026-09-30)
Approved staging sources from `asset-staging/2026-09-30-vfx-pack-11/` are now integrated.

Runtime paths:
- `assets/ui/fx/rocket-explosion-fireball-atlas-11.svg` — 4×3 / 12-frame world rocket detonation fireball;
- `assets/ui/fx/plasma-impact-ion-bloom-atlas-11.svg` — 4×3 / 12-frame plasma impact bloom for actor and wall hits;
- `assets/ui/fx/plasma-reload-energy-lock-atlas-11.svg` — 4×2 / 8-frame local first-person plasma reload completion lock.

These runtime files are **static-frame SVG sprite atlases**, not self-animating SVGs. The staging art is geometric vector VFX, so preserving it as compact SVG avoids unnecessary raster resampling/binary-upload risk while keeping deterministic elapsed-time playback through the existing Pack 10 VFX player. The game remains authoritative: rocket/plasma/reload events trigger the presentation layer, procedural impact/explosion/reload feedback remains fallback, simultaneous DOM effects stay bounded and off-screen world effects are hidden by projection.

The staging source candidates remain in `asset-staging/` as provenance/reference. They are not imported by runtime code.

## Generated Asset Pack 10 (2026-09-30)
Runtime file:
- `assets/ui/fx/combat-vfx-atlas-10.webp` — единый 8×10 alpha-WebP mega-atlas 448×560, cell 56×56, <=128 KiB.

Логические rows/consumers:
- row 0 · `rocket-backblast-sheet-01` · 6 frames → player rocket shot / muzzle anchor;
- row 1 · `sniper-pressure-blast-sheet-01` · 6 frames → player SR-9 shot / muzzle anchor;
- row 2 · `shotgun-muzzle-smoke-sheet-01` · 8 frames → player shotgun shot / muzzle anchor;
- row 3 · `brass-casing-spin-sheet-01` · 8 frames → player pistol/rifle + SR-9 bolt ejection;
- row 4 · `shotgun-shell-spin-sheet-01` · 6 frames → player pump-cycle ejection;
- row 5 · `magazine-drop-sheet-01` · 8 frames → non-shell pistol/rifle/plasma/SR-9 reload;
- row 6 · `concrete-impact-burst-sheet-01` · 8 frames → concrete `wallImpact`;
- row 7 · `metal-impact-sparks-sheet-01` · 8 frames → metal `wallImpact`;
- row 8 · `wood-impact-splinter-sheet-01` · 5 frames → wood `wallImpact`;
- row 9 · `near-miss-air-streak-sheet-01` · 5 frames → player suppression/near-miss event.

Pack 10 intentionally stores ten semantic animations in one physical atlas. The catalog owns row/frame/duration metadata; `src/settings/settings.js` owns bounded DOM playback and cleanup; combat/runtime/engine only emit presentation hooks from existing authoritative events. Playback is elapsed-time based, not callback-count based. Procedural muzzle, casing, wall-impact and suppression feedback remains fallback, and the atlas is never passed to `TextureLoader`, `makeAssetPlane` or `makeAssetSprite`.

## Generated Asset Pack 9 (2026-09-30)
Runtime paths:
- `assets/ui/feedback/match-deploy-splash-tech-01.svg` — first match deployment splash.
- `assets/ui/objective/frontline-retarget-sweep-tech-01.svg` — Frontline retarget sweep.
- `assets/ui/feedback/second-wind-rescue-tech-01.svg` — «Второе дыхание» rescue pulse.
- `assets/ui/feedback/dodge-phase-tech-01.svg` — successful bullet-dodge phase flash.
- `assets/ui/perks/perk-path-crest-atlas-01.svg` — assault/survival/demolition/precision/mobility crests.
- `assets/ui/equipment/equipment-readiness-atlas-01.svg` — mine/bomb/smoke ready/cooldown states.
- `assets/ui/objective/frontline-capture-progress-frame-01.svg` — decorative capture-progress frame.
- `assets/ui/bots/ally-tactical-callout-atlas-01.svg` — ally-only tactical callouts.
- `assets/ui/panels/pause-panel-tech-01.svg` — pause tactical shell.
- `assets/ui/mobile/mobile-control-icons-atlas-01.svg` — six touch-control icons.

Pack 9 uses a better workflow for geometric HUD art: the image-generator contact sheet is the visual source, but the committed runtime derivative is rebuilt as compact SVG when the asset is mostly lines, crests, panels or icons. That removes binary-upload corruption risk, stays crisp across DPI and preserves HTTP(S) + direct `file://` parity. Painterly effects, backgrounds and first-person renders remain raster/WebP candidates.

## Generated Asset Pack 8 (2026-09-29)
Runtime paths:
- `assets/ui/combat/reticle-identity-atlas-01.webp` — weapon-class reticle identities layered over the existing dynamic crosshair.
- `assets/ui/minimap/minimap-marker-atlas-01.webp` — player/ally/pickup/objective/player-deployable tactical markers.
- `assets/ui/feedback/spawn-protection-atlas-01.webp` — spawn-shield loop plus shield glyph.
- `assets/ui/feedback/respawn-countdown-atlas-01.webp` — 15-state respawn ring; numeric seconds remain a text fallback.
- `assets/ui/explosives/explosive-fuse-atlas-01.webp` — safe/arming/armed/danger fuse states projected over mines and bombs.
- `assets/ui/fx/projectile-trail-atlas-01.webp` — ballistic/sniper/plasma/rocket transient shot trails.
- `assets/ui/weapons/weapon-switch-swipe-atlas-01.webp` — seven-frame equip/switch swipe.
- `assets/ui/bots/bot-overhead-frame-atlas-01.webp` — ally/enemy overhead combat frames around the authoritative health bar.
- `assets/ui/feedback/combo-meter-atlas-01.webp` — escalating combo presentation frame.
- `assets/ui/pickups/pickup-beacon-atlas-01.webp` — normal/heavy/utility/medkit world-pickup beacon pulses.

Pack 8 follows the same reliability contract as recent generated-art packs: raster art is presentation-only, never a persistent Three.js texture plane; gameplay state stays in existing systems; and procedural/text UI remains the fallback. The minimap intentionally renders only information already available to the player (player, allies, visible pickups, objectives, player-owned deployables and player smoke), so the art does not create a hidden-information advantage.

## Generated Asset Pack 7 (2026-09-29)
Runtime paths:
- `assets/ui/overlays/low-health-vignette-01.webp` — low-HP peripheral damage texture.
- `assets/ui/overlays/damage-direction-01.webp` — rotatable directional hit texture.
- `assets/ui/overlays/smoke-clouds-01.webp` — smoke-screen presentation layer.
- `assets/ui/fx/ballistic-muzzle-flash-sheet-01.webp` — 4×2 ballistic muzzle sheet.
- `assets/ui/fx/plasma-discharge-sheet-01.webp` — 4×2 plasma discharge sheet.
- `assets/ui/overlays/explosion-shockwave-01.webp` — nearby explosion screen shockwave.
- `assets/ui/overlays/suppression-vignette-01.webp` — player near-miss/suppression overlay.
- `assets/ui/overlays/armor-hit-field-01.webp` — non-breaking armor-hit field.
- `assets/ui/overlays/sprint-speed-lines-01.webp` — sprint peripheral speed texture.
- `assets/ui/overlays/respawn-materialize-01.webp` — respawn materialization overlay.

Pack 7 is presentation-only. Screen overlays are DOM/CSS layers, muzzle sheets decorate the existing DOM first-person flash, and no generated raster is routed into persistent Three.js texture planes/sprites. Every overlay keeps an existing procedural/UI fallback. Runtime derivatives are VP8X alpha WebP, 512×288 for screen overlays and 512×256 for the two 4×2 sheets, with a 128 KiB CI budget.

## Generated Asset Pack 6 (2026-09-29)
Runtime paths:
- `assets/ui/perks/bulletstorm-tech-01.webp` — «Шторм свинца».
- `assets/ui/perks/immortal-tech-01.webp` — «Несокрушимый».
- `assets/ui/perks/doubletap-tech-01.webp` — «Двойной импульс».
- `assets/ui/perks/piercing-tech-01.webp` — «Бронебойный сердечник».
- `assets/ui/perks/laststand-tech-01.webp` — «Последний рубеж».
- `assets/ui/perks/thorns-tech-01.webp` — «Ответный разряд».
- `assets/ui/perks/explosive-rounds-tech-01.webp` — «Разрывные боеприпасы».
- `assets/ui/perks/evasive-matrix-tech-01.webp` — «Матрица уклонения».
- `assets/ui/perks/headshot-armor-tech-01.webp` — «Трофейная броня».
- `assets/ui/perks/bombtech-tech-01.webp` — «Тяжёлая бомба».

Pack 6 is wired through the existing protocol-neutral `perkAsset(id,path)` resolver, so generated art is used by level-up cards and the active perk panel while `assets/perks/<id>.svg` remains the authoritative load/decode fallback. All files are DOM-only 256×256 VP8X alpha WebP derivatives <=32 KiB and do not change perk mechanics or balance.

## Generated Asset Pack 4 (2026-09-28)
Runtime paths:
- `assets/ui/weapons/fp/player-bomb-fps-01.webp` — baked-hands FPS bomb, DOM overlay.
- `assets/ui/pickups/weapons/world-bomb-pickup-01.webp` — projected world bomb pickup.
- `assets/ui/pickups/world-medkit-pickup-01.webp` — projected health pickup with procedural fallback.
- `assets/ui/pickups/ammo-crate-tech-02.webp` — ammo HUD presentation.
- `assets/ui/scopes/{sniper,rifle}-scope-tech-01.webp` — scope overlays; original SVG files are mandatory fallbacks.
- `assets/ui/objective/frontline-capture-burst-tech-01.webp` — transient capture feedback.
- `assets/ui/feedback/battle-result-frame-tech-01.webp` — death/killcam result shell.

All eight files are presentation-only raster art. They must never be passed to `TextureLoader`, `makeAssetPlane` or `makeAssetSprite`. World pickup art is screen-projected from the authoritative 3D pickup position, while procedural geometry remains the failure fallback.

Этот документ — обязательный operational contract для человека, ChatGPT/Codex и других AI-агентов при создании, изменении и публикации игровых ассетов.

## 0. Pre-generation duplicate gate

Перед каждой новой генерацией сначала доказать, что asset действительно новый и нужен текущей игре. Это отдельный gate до image generation, а не проверка после неё.

Минимальный порядок:
1. прочитать начало этого файла и `assets/README.md`, чтобы увидеть уже интегрированные generated packs;
2. проверить последние generated-asset commits и реальные runtime filenames в `assets/ui/**`;
3. найти конкретный consumer/callsite, который сейчас остаётся procedural/text-only или визуально слабее соседних систем;
4. зарезервировать semantic ASCII filename и назначение до генерации;
5. не генерировать новый вариант существующего asset без явной задачи на replacement;
6. после генерации считать изображение **source candidate**, пока оно не прошло runtime derivative → consumer wiring → fallback → validation → screenshot gate.

Для pack из нескольких изображений сначала фиксировать короткий manifest: `filename → owner/consumer → event/state → fallback → target runtime envelope`. Это уменьшает дубли между разными ChatGPT-сессиями и не даёт складывать «красивые, но неиспользуемые» файлы в репозиторий.

## 1. Сначала определить владельца ассета

Перед генерацией или заменой изображения определить реальный consumer:

- DOM/HUD/menu/feedback → `assets/ui/**` и `GAME_ASSETS.presentation*`;
- gameplay SVG fallback → существующий доменный каталог (`assets/medals`, `assets/status`, `assets/fx`, `assets/perks`);
- weapon identity / bot procedural model art → `assets/weapons/**` и `WEAPONS[].asset`;
- generated player-held first-person presentation → `assets/ui/weapons/fp/**`, только DOM overlay локального игрока;
- generated world pickup presentation → `assets/ui/pickups/weapons/**`, DOM projection реальной 3D pickup-позиции с procedural fallback;
- audio → `assets/audio/**`;
- постоянная Three.js сцена → по умолчанию procedural geometry/materials, а не generated raster texture.

Не добавлять картинку «на будущее» без конкретного callsite. Asset считается интегрированным только когда есть consumer, fallback/degradation contract и validation.

## 2. Generated source и runtime derivative — разные вещи

Генератор может вернуть 1024–2048 px PNG. Такой файл является source/reference, но не обязан попадать в runtime.

Для HUD/icon assets:
1. визуально проверить источник;
2. обрезать лишний transparent padding при необходимости;
3. уменьшить до фактического UI-resolution;
4. сохранить прозрачность;
5. подготовить runtime derivative.

Текущий ориентир для компактных эмблем — 256×256 WebP с alpha. PNG допустим, когда lossless edge fidelity действительно нужна. Большой raster >512 px или >250 KiB в обычном HUD требует отдельного обоснования.

Для player-held FPS weapon art действует отдельный envelope: текущий целевой runtime derivative — **960×720 WebP с alpha, до 250 KiB на файл**. Такой размер нужен потому, что оружие занимает значительную часть 16:9 viewport; уменьшать его до icon-resolution нельзя.

Для generated world weapon pickups целевой runtime derivative — **512×384 WebP с alpha, до 120 KiB на файл**. Здесь tight crop допустим: asset показывается как небольшой объект на карте, а не занимает FPS viewport.

Background/photo-like art: WebP/JPEG. Простые векторные fallback: SVG. Не конвертировать SVG в тяжёлый raster без пользы.


## 2.1. Animated generated assets — canonical browser workflow

Для transient VFX и других коротких анимаций основной generated source по умолчанию — **sprite sheet / texture atlas с alpha**, а не GIF и не набор отдельных PNG-файлов.

Если несколько related one-shot VFX используют одинаковую сетку и общий lifecycle, предпочтителен **один uniform mega-atlas**: одна строка/регион на semantic effect + metadata `row/frameCount/duration`. Это уменьшает request/decode churn и сохраняет отдельные gameplay consumers. Pack 10 — текущий reference: 10 logical effects → один 8×10 WebP atlas.

Почему:
- один atlas уменьшает количество HTTP/file requests и декодирований;
- кадр можно детерминированно выбирать по gameplay-time, а не надеяться на внутренний таймер animated image;
- эффект можно запускать, останавливать, ускорять, обрывать и синхронизировать с выстрелом/попаданием/reload;
- один и тот же runtime derivative можно использовать через CSS background-position, DOM/canvas projection или отдельный bounded consumer;
- generated animation не становится gameplay-state authority: событие игры остаётся источником истины, atlas только визуализирует его.

### Preferred source contract

До генерации зафиксировать:
- semantic filename;
- consumer/owner;
- trigger/event;
- rows × columns;
- frame count;
- intended frame duration/FPS;
- loop mode: one-shot / hold-last / loop;
- screen/world anchor;
- fallback;
- runtime target size/budget.

Для коротких one-shot VFX начинать с равномерной сетки 4×2 или 4×4. Все кадры должны иметь одинаковый viewpoint/scale/anchor, прозрачный фон и последовательное движение без случайного перескока объекта между ячейками.

### Runtime playback

1. **Gameplay-synchronised effect:** переключать frame index от реального elapsed time через существующий game loop / `requestAnimationFrame` timestamp. Не считать «1 callback = 1 frame»: high-refresh дисплеи иначе ускорят анимацию.
2. **Чисто декоративный постоянный loop:** допустим CSS `background-position` + `steps(...)`, если loop не несёт gameplay-смысла.
3. Не держать невидимый loop постоянно активным; hidden/inactive effect должен быть paused/removed.
4. Предзагружать только assets, которые реально нужны раннему экрану; остальные — lazy-load перед первым consumer. Перед reveal желательно дождаться decode/load success и сохранить procedural/text fallback.
5. Не раскладывать 8–16 кадров одного эффекта в отдельные runtime files без доказанной причины.

### Format policy

- runtime atlas с alpha: WebP по умолчанию;
- PNG/APNG — только когда lossless edge fidelity или конкретная lossless animation действительно оправданы;
- animated WebP/APNG могут использоваться как автономные декоративные loops, но **не являются default для gameplay-synchronised VFX**, потому что код теряет удобный direct control над конкретным кадром;
- GIF не использовать как основной игровой VFX-format: для этого проекта atlas + controlled playback даёт лучшее управление и обычно меньший runtime overhead;
- geometric HUD art по-прежнему сначала рассматривать как SVG, а не raster animation.

### Current ZAP-ZONE safety boundary

Generated animated raster остаётся presentation-only и не отменяет текущий запрет на persistent Three.js generated texture planes/sprites. Если позже понадобится настоящий world-space textured VFX pipeline, это отдельная задача с browser/uCoz evidence, memory/performance profiling и новым regression contract. Для будущих тяжёлых GPU texture pipelines отдельно оценивать KTX2/Basis, но не тащить его в текущий DOM/CSS asset path без измеримой пользы.

### Verification gate

Animated asset считается готовым к интеграции только после:
- проверенного frame grid/alpha;
- стабильного anchor между кадрами;
- frame-time independent playback;
- trigger/stop cleanup без orphan DOM elements/timers;
- fallback при load/decode failure;
- dual-runtime HTTP(S) + direct `file://`;
- browser screenshot/runtime proof на desktop и хотя бы mobile-low path;
- size/signature/wiring checks в `scripts/validate-structure.mjs` после фактического runtime подключения.


## 3. Имена и каталоги

Runtime-файлы используют ASCII kebab-case и смысловое имя:

`<semantic-name>-tech-<nn>.<ext>`

Примеры:
- `assets/ui/feedback/armor-break-tech-01.webp`;
- `assets/ui/medals/multikill-tech-02.webp`;
- `assets/ui/perks/defender-tech-01.webp`.

Не коммитить имена генератора, кириллицу, `imagegen.png`, `final-final.png`, случайные UUID и временные contact sheets как runtime assets.

Каталог определяется владельцем UI, а не сессией генерации.

## 4. Fallback, graceful degradation и обязательный dual-runtime

**Жёсткое правило проекта:** каждый runtime asset и каждый его consumer должны работать в двух режимах:
1. после загрузки файлов в файловый менеджер uCoz / другой обычный HTTP(S) static hosting;
2. при прямом запуске локального `index.html` с компьютера через `file://`.

Нельзя считать asset интегрированным, если он виден только на uCoz или только локально. Нельзя специально отключать generated visual art только потому, что `location.protocol==='file:'`.

Generated presentation art не должно быть единственной формой критической информации.

- DOM image: `src` = стабильный fallback, `data-generated-src` = generated art, `data-fallback-src` = явный fallback.
- `catalog.js` активирует generated DOM/CSS art и на HTTP/HTTPS, и на `file://`; build query `?v=<build>` добавляется только на HTTP(S), а local file использует обычный относительный путь.
- CSS generated backgrounds/icons обязаны использовать относительные пути, которые разрешаются и на uCoz, и из локального `src/styles/game.css`.
- Perk/medal/headshot generated art выбирается protocol-neutral и всегда имеет SVG fallback на реальную ошибку загрузки/декодирования.
- Если браузерное ограничение не позволяет какой-то категории файлов использовать один и тот же loader в `file://`, должен существовать отдельный local consumer или функциональный fallback; молча выключать asset/feature нельзя.
- Perk generated art всегда имеет per-id SVG fallback.
- Чисто декоративный CSS asset может исчезнуть при 404, только если текст/shape рядом полностью сохраняет смысл.

Нельзя скрывать HP, ammo, objective state или control hint внутри изображения без текстового/DOM эквивалента.

## 5. WebGL/uCoz safety invariant

Generated PNG/WebP/JPEG presentation assets **не использовать** как постоянные texture planes/sprites в `src/core/engine.js` и bot scene.

Причина: проект уже устранял hosting-specific black texture-quads. Поэтому generated art остаётся DOM/CSS-only, а 3D scene использует procedural geometry/materials.

Запрещённый drift для generated UI art:
- `gameTexture(generatedPath)`;
- `makeAssetPlane(generatedPath,...)`;
- `makeAssetSprite(generatedPath,...)`;
- прямой `TextureLoader` в engine только ради HUD/decal art.

Исключение возможно только отдельной задачей с runtime/browser/uCoz evidence и новым regression contract.

### Player-held generated weapons

Сгенерированные FPS-рендеры оружия не являются 3D-моделями и не должны подменять bot geometry. World pickup presentation использует отдельный DOM-projection contract ниже.

**Reference lock перед генерацией.** Если пользователь дал пример посадки оружия, он является обязательным composition contract, а не просто style reference. До генерации зафиксировать:
- камера — first-person, оружие выходит из нижнего правого сектора и направлено влево/вверх в глубину сцены;
- видна правильная ведущая рука на рукояти; для двуручного оружия видна supporting hand/forearm;
- ствол не должен смотреть фронтально в камеру и не должен быть боковым showroom/profile render;
- оружие не центрируется как постер и не перекрывает центральный reticle;
- muzzle должен оставаться читаемым и иметь стабильную экранную anchor-точку;
- фон обязательно прозрачный, без baked black rectangle/scene/background.

**Hand ownership mode — нельзя смешивать.** Для каждого pack заранее выбрать ровно один режим:
1. `baked-hands` — изображение уже содержит финальные руки/предплечья; при успешной загрузке скрывается **весь procedural first-person rig** (weapon body + procedural hands), иначе появятся двойные/блочные руки;
2. `weapon-only` — изображение не содержит рук; procedural hands могут остаться только после отдельной проверки совпадения grip/scale/perspective.

Текущий approved V3 pack pistol/shotgun/rifle/plasma/rocket/sniper — **baked-hands**. Mine и smoke теперь используют тот же baked-hands DOM pipeline; bomb пока остаётся procedural. V3 использует intentional transparent headroom/left-space, уменьшенный runtime silhouette и HUD-safe positioning.

**Подтверждённый success baseline (28.09.2026).** Этот вариант был визуально принят в реальной игре и теперь является эталоном для следующих first-person assets:
- runtime canvas — 960×720 с реальной alpha-прозрачностью;
- объект не tight-crop: сохраняется большой transparent headroom/left-space, чтобы runtime не раздувал картинку;
- baked FPS angle создаётся в самом asset; runtime только слегка двигает его, а не пытается исправить перспективу большим rotate;
- основной силуэт остаётся в нижнем правом секторе и не закрывает reticle, HP, Score/Kills и critical HUD;
- HUD имеет stacking priority над декоративным оружием, но правильная композиция обязательна сама по себе;
- per-weapon `width/right/bottom/muzzleX/muzzleY` настраиваются после реального screenshot, не по standalone preview;
- raster sway/recoil ограничивается clamp-ами; approved baked angle нельзя разрушать большой динамической ротацией;
- visual recoil должен быть отдельным runtime transform и быть frame-rate independent;
- muzzle flash не запекается в статический weapon asset: это отдельный effect layer с собственным anchor, цветом/масштабом по weapon key и без прямоугольной/обрубленной подложки;
- финальный gate: generate → runtime derivative → integrate → screenshot in game → tune → только после визуального принятия считать framing подтверждённым.

Runtime contract:
- runtime derivative: прозрачный WebP в `assets/ui/weapons/fp/**`, сейчас 960×720 и <=250 KiB;
- consumer: `#fp-weapon-art` / `#fp-weapon-art-stage` поверх canvas только для локального игрока;
- при `baked-hands` успешная загрузка скрывает все children текущего procedural `gunGrp`; fallback/error возвращает весь rig;
- gameplay state, ballistics, hitboxes, recoil logic и bots не меняются; world pickups имеют отдельный DOM presentation, но сохраняют прежнюю pickup economy/3D fallback;
- recoil/equip/reload/sprint/cycle поза DOM-art синхронизируется с существующим `gunGrp`, а muzzle flash имеет отдельный DOM feedback;
- для player-only pack `file://` поддерживается: WebP лениво загружается только после `running` по локальному `assets/...` пути; 404/decode error обязаны автоматически вернуть procedural first-person rig;
- mine и smoke используют отдельные approved baked-hands utility assets; bomb остаётся procedural, пока для него не создан отдельный утверждённый FPS asset;
- запрещено загружать generated weapon WebP через `TextureLoader`, `gameTexture`, `makeAssetPlane` или `makeAssetSprite`.

**Framing/acceptance gate перед upload.** Для каждого FPS weapon:
- сравнить с утверждённым reference montage, а не только с соседними generated картинками;
- проверить 16:9 desktop screenshot: оружие визуально сидит в нижнем правом секторе, а muzzle уходит к левому/верхнему направлению;
- руки анатомически держат grip/fore-end, нет второго procedural комплекта рук;
- generated canvas должен сохранять осмысленное прозрачное пространство слева/сверху: tight crop вокруг оружия запрещён, потому что он заставляет раздувать poster-scale в runtime;
- weapon silhouette не занимает чрезмерно весь экран и не закрывает HUD/reticle;
- в idle-состоянии видимая часть оружия должна оставаться в правом секторе экрана: ориентир — левый край основного силуэта не левее ~58% viewport на desktop 16:9;
- центральная safe-zone reticle и нижняя центральная safe-zone HP/Score/Kills не должны пересекаться основным силуэтом оружия;
- `#hp-wrap`, `#hud`, `#whud` и reticle всегда имеют stacking priority выше decorative weapon art; это страховка, а не замена правильной композиции;
- right-bottom weapon HUD может находиться поверх силуэта только как читаемый HUD-слой; generated art не должен визуально уничтожать его контраст;
- отдельные `width/right/bottom/muzzleX/muzzleY` tuning значения задаются по weapon key, а не одной глобальной трансформацией;
- dynamic sway/recoil для raster weapon art должен быть ограничен clamp-ами: baked first-person angle не вращать на большие углы и не таскать через HUD;
- visual recoil должен быть заметным, но не менять gameplay aim: использовать отдельный per-weapon push/pitch/roll profile; decay считать от `dt`, а не «на кадр», чтобы 60/120/144 FPS выглядели одинаково;
- muzzle feedback строить слоями (hot core + directional flame/starburst + glow), привязывать к muzzle anchor и не использовать короткий непрозрачный oval/cone, который выглядит как «обрубок» и закрывает пламя;
- desktop runtime stage ограничивать по абсолютному размеру (сейчас max 980 px), чтобы ultra-wide/high-DPI viewport не превращал оружие в огромный постер;
- если визуальная посадка не проверена screenshot-ом, итог маркировать `NOT VERIFIED: visual framing`, даже если CI зелёный.

### Generated world weapon pickups

Этот pack предназначен **только для оружия/снаряжения, лежащего на арене и доступного для подбора**. Он не используется ботами и не заменяет first-person art.

Контракт:
- runtime derivative: 512×384 transparent WebP в `assets/ui/pickups/weapons/**`, <=120 KiB;
- source art — чистый weapon-only/isometric object без рук, HUD, текста и baked background;
- consumer — `#world-pickup-art-layer`; `src/entities/pickups.js` проецирует реальную позицию pickup из 3D мира в screen space;
- procedural `createWorldWeaponModel()`, pedestal/ring/beacon и pickup radius остаются authoritative fallback/gameplay geometry;
- generated image скрывает только procedural weapon body после успешной загрузки; 404/decode error оставляет старую 3D-модель;
- world art масштабируется по distance, имеет ограниченный max-size и скрывается вне viewport/дальше установленной дистанции;
- wall occlusion обязательна: перед показом DOM image выполняется Raycaster check по `wallMeshes`, чтобы оружие не просвечивало сквозь стены;
- слой world pickup art находится ниже smoke/HUD/first-person UI; smoke и интерфейс должны корректно перекрывать pickup presentation;
- generated world pickup art запрещено передавать в `gameTexture`, `TextureLoader`, `makeAssetPlane` или `makeAssetSprite`: это сохраняет uCoz anti-black-quad invariant;
- bomb остаётся procedural, пока для него нет отдельного approved generated pickup asset;
- реальная pickup economy, respawn, reserve grant, minimap и collision semantics не меняются.

Acceptance gate:
- asset имеет реальную alpha-прозрачность;
- силуэт читается при размере ~40–160 px;
- на реальном screenshot оружие находится над своей pedestal/beacon точкой, не «плывёт» отдельно от pickup;
- wall occlusion и off-screen hiding работают;
- при ошибке загрузки видна procedural 3D-модель;
- CI green недостаточен для визуального acceptance: финальный in-game screenshot остаётся обязательным.

## 6. Catalog и cache identity

Новый runtime asset должен:
1. лежать в каноническом каталоге;
2. быть внесён в `GAME_ASSETS`;
3. использовать `gameAssetUrl()`/общий build key на HTTP(S);
4. попасть в `scripts/validate-structure.mjs`;
5. изменить web build identity через `node scripts/stamp-web-build.mjs`.

Не хардкодить случайные query-version. Единственный cache key — текущий build ID.

## 7. Validation перед commit

Для каждого нового generated image проверить:
- он реально загружается и на uCoz/HTTP(S), и при прямом `file://` запуске;
- локальный режим использует generated visual asset, а fallback включается только при фактической ошибке load/decode;
- файл существует и не пуст;
- magic/envelope соответствует PNG/JPEG/WebP;
- для binary upload через API/base64 до commit сверить Git blob SHA с локальным исходным файлом; после commit повторно проверить, что GitHub blob начинается с ожидаемого binary envelope (для WebP — RIFF....WEBP), а не с UTF-8/base64-текста;
- размер разумный для callsite;
- catalog содержит путь;
- реальный HTML/CSS/JS consumer содержит wiring;
- fallback/degradation path существует;
- generated presentation path отсутствует в WebGL engine;
- для player-held weapon art проверены DOM consumer, procedural fallback, pose sync и отсутствие влияния на bots;
- для baked-hands pack проверено, что procedural weapon **и procedural hands** скрываются одновременно, а на fallback возвращаются вместе;
- для world pickup art проверены DOM projection, distance scaling, wall occlusion, procedural world-model fallback и отсутствие WebGL raster texture quads;
- FPS framing сопоставлен с утверждённым reference screenshot/montage; CI не заменяет визуальную проверку композиции;
- `node --check` проходит;
- `node scripts/stamp-web-build.mjs --check` проходит после stamp;
- `node scripts/validate-structure.mjs` проходит;
- browser boot + local file smoke проходят в CI.

Нельзя считать «файл лежит в assets» достаточной интеграцией.

## 8. GitHub upload — один логический change

Перед записью:
1. re-fetch exact `main` SHA;
2. прочитать `.github/workflows/**` и оценить push-runs;
3. re-fetch изменяемые файлы/blob SHA;
4. подготовить все binary blobs + code/docs/changelog; для WebP/PNG/JPEG использовать binary-safe base64 upload и записывать в tree только SHA проверенного Git blob;
5. перед сборкой tree сравнить каждый созданный binary blob SHA с SHA, рассчитанным из локальных bytes; mismatch = STOP, не коммитить;
6. собрать один Git tree/commit;
7. fast-forward `main` с `force=false`.

Не загружать шесть картинок шестью отдельными commits через Contents API: это создаёт лишние Actions runs и временно неконсистентный catalog.

Любое изменение runtime/code/assets сопровождается записью в `CHANGELOG.md`.

## 9. После GitHub write

Проверить exact new SHA:
- найти Actions run с `event=push&head_sha=<SHA>`;
- проверить run conclusion;
- при failure: jobs → первый failed step → logs → root cause → один минимальный follow-up;
- не продолжать серию несвязанных commits пока current HEAD красный.

Green run другого SHA не является доказательством для текущего HEAD.

## 10. Ручная публикация на uCoz/static hosting

Порядок публикации:
1. новые/изменённые `assets/**`;
2. изменённые `src/**`;
3. CSS/другие runtime files;
4. `index.html`;
5. **`version.json` последним**.

`version.json` объявляет сборку доступной, поэтому его нельзя выкладывать раньше asset/code payload.

После публикации:
- открыть сайт обычным reload без Ctrl+F5;
- проверить новый build;
- проверить menu + один generated HUD asset + fallback-sensitive flow;
- проверить DevTools Network/Console на 404/decoding ошибки;
- отдельно открыть локальный `index.html` через `file://` и подтвердить тот же menu background/logo/generated HUD art;
- отсутствие asset только в одном из двух режимов (uCoz HTTP(S) или local file) = regression и блокирует завершение задачи.

## 11. AI handoff checklist

Следующий AI перед asset-задачей читает только:
1. этот файл;
2. `assets/README.md`;
3. конкретный consumer/module;
4. `scripts/validate-structure.mjs`;
5. workflow Validate, если будет write.

Текущее состояние кода/GitHub/CI всегда важнее этого документа, если они разошлись.


### Vector derivative rule (Pack 9+)
For generated geometric HUD art, prefer a small SVG runtime derivative when it preserves the visual intent. Keep the generated raster/contact sheet as source/reference rather than forcing it into runtime. The SVG still requires a concrete consumer, catalog entry, text/procedural fallback and structural validation. Use WebP/PNG for painterly, smoky, photographic or first-person art where raster detail is materially useful.
