# VFX Pack 14 — staging review (2026-09-30)

Статус: **AWAITING USER APPROVAL — NOT INTEGRATED**.

Пакет содержит ровно два новых source-candidate VFX после duplicate gate по Pack 7–13 и текущим runtime consumers. Оба файла — прозрачные scriptless animated SVG-preview. Они лежат только в `asset-staging/` и не загружаются игрой до отдельной команды на интеграцию.

| Candidate | Почему нужен сейчас | Intended consumer/event | Existing fallback | Planned runtime derivative |
|---|---|---|---|---|
| `critical-hit-overcharge-burst-vfx-01.svg` | Критическое попадание уже имеет особый damage multiplier, звук, hitmarker и procedural `spawnCombatImpact(...,'critical')`, но не имеет generated one-shot world VFX уровня plasma/rocket/ricochet. Это заметный пробел в визуальной награде за precision build. | `src/combat/combat.js::resolvePlayerBulletHit()`, только при `isCrit`, рядом с текущим `spawnCombatImpact(hitFx, weaponImpactType(w,isCrit))`. | текущий procedural critical impact + crit SFX/hitmarker/medal | 8 deterministic static frames, one-shot ~0.70 s, world-projected DOM VFX; небольшая случайная rotation/scale variation, bounded общим VFX budget |
| `player-armor-break-shatter-vfx-01.svg` | Pack 7 дал обычному попаданию в броню screen overlay, но отдельного generated VFX для момента полного разрушения брони нет. Событие важно для читаемости состояния игрока и визуально отличается от обычного armor hit. | player damage/armor pipeline только на переходе `armor > 0 → armor == 0`; не запускать на каждом armor hit. | текущий `showArmorHitFx(amount)` + HUD armor state | 8 deterministic static frames, one-shot ~0.90 s, screen-local DOM VFX; shard/electric burst with slight rotation variation |

## Визуальное направление

### Critical overcharge burst
- hot white/gold core;
- expanding double shock ring;
- asymmetrical dark fragments;
- cyan micro-streak accents, чтобы critical не сливался с обычной orange muzzle/explosion палитрой;
- короткая активная фаза и чистый fade, без постоянного loop в runtime.

### Armor break shatter
- cyan/blue hex-shield silhouette;
- visible crack propagation;
- outward glass/energy shards;
- electric arcs + expanding broken ring;
- экранный эффект должен оставлять центральный reticle читаемым и не маскировать HP/ammo.

## Integration intent after approval

Предпочтительный путь для браузера: снять deterministic static frames из preview и собрать их в compact shared alpha atlas, затем проигрывать кадры по elapsed gameplay time через существующий bounded VFX player. Это соответствует текущему Pack 10–13 contract и не зависит от частоты 60/120/144 Hz.

Важно:
- staging-файлы не импортировать из `src/**`, `index.html`, runtime CSS или `GAME_ASSETS` до одобрения;
- gameplay damage/crit/armor state остаётся authoritative; VFX только presentation;
- procedural/current UI остаётся fallback;
- generated raster/derivative не превращать в persistent Three.js texture plane;
- после одобрения проверить HTTP(S) + direct `file://`, cleanup, off-screen policy для world effect и mobile-low budget.

Как посмотреть: откройте SVG через GitHub и нажмите **Raw** — браузер проиграет preview-анимацию на прозрачном фоне.
