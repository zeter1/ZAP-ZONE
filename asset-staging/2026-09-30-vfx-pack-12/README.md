# VFX Pack 12 — staging review (2026-09-30)

Статус: **PENDING VISUAL REVIEW — NOT INTEGRATED**.

Этот batch закрывает пять событий, которые в текущем runtime остаются procedural-only или визуально заметно слабее уже интегрированных Pack 10/11. Все пять файлов — прозрачные scriptless animated SVG source-candidates. Они намеренно лежат только в `asset-staging/` и не загружаются игрой до отдельного одобрения.

| Candidate | Почему нужен сейчас | Intended consumer/event | Existing fallback | Planned runtime derivative |
|---|---|---|---|---|
| `ricochet-spark-fan-vfx-01.svg` | Новый projectile ricochet уже имеет механику и звук, но визуально завершается одиночным procedural spark. | `src/combat/combat.js::tickProjectiles()` в успешной ветке `rollProjectileRicochet(...)` | `wallImpact(...)` + `spawnP(...)` + ricochet audio | row в 8-frame alpha combat atlas; world-projected one-shot ~0.62 s |
| `penetration-exit-debris-vfx-01.svg` | Пробитие стены имеет входной и выходной `wallImpact`, но выход не читается как отдельное penetration-событие. | обе ветки `tryProjectileWallPenetration(...)` сразу после `wallImpact(pen.exitPoint,...)` | текущий procedural exit wall impact | row в 8-frame alpha combat atlas; world-projected one-shot ~0.78 s |
| `smoke-deploy-bloom-vfx-01.svg` | Дымовуха хорошо работает геймплейно, но момент раскрытия облака начинается набором procedural puffs без выразительного короткого ignition/bloom. | `deploySmokeCloud(...)` при создании нового облака | текущие Three.js smoke puffs + screen smoke overlay | row в 8-frame alpha combat atlas; world-projected transient ~1.4 s, не заменяет gameplay smoke |
| `mine-detonation-shrapnel-vfx-01.svg` | Мина сейчас использует общий `explode(...)`; ей не хватает узнаваемого низкого blast + shrapnel signature. | `src/combat/combat.js::tickMines()` mine trigger перед/рядом с `explode(pos,...)` | procedural `explode(...)` + blast damage/audio/shake | row в 8-frame alpha combat atlas; world-projected one-shot ~0.82 s |
| `bomb-detonation-pressure-core-vfx-01.svg` | Бомба мощнее мины/ракеты, но визуально всё ещё опирается на общий explosion core и procedural blast wave. | `src/combat/combat.js::tickMines()` bomb fuse expiry рядом с `explode(...)` / `spawnBombBlastWave(...)` | procedural explosion + blast wave + audio/shake | row в 8-frame alpha combat atlas; world-projected one-shot ~1.08 s |

## Integration intent after approval

Предпочтительный runtime derivative — один uniform alpha mega-atlas Pack 12: 5 semantic rows × 8 frames. Playback должен использовать существующий bounded `playGeneratedCombatVfx(...)` / elapsed-time pipeline из Pack 10/11, с projection/off-screen hiding/cleanup и без persistent Three.js texture planes.

Важно:
- smoke candidate — только короткий deployment bloom; реальная плотность/LOS/длительность дыма остаются в существующей Three.js gameplay-системе;
- ricochet/penetration art не меняет physics, damage, material logic или audio;
- mine/bomb art не меняет blast radius/damage/fuse;
- все current procedural effects остаются fallback;
- staging SVG — preview/provenance, не gameplay-time authority.

Как посмотреть: откройте SVG через GitHub и нажмите **Raw** — браузер проиграет встроенную анимацию на прозрачном фоне.
