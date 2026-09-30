# VFX Pack 13 — staging review (2026-09-30)

Статус: **APPROVED AND INTEGRATED — staging copies retained as provenance**.

Этот batch содержит ровно два новых world-combat VFX, выбранных после duplicate gate по текущим Pack 7–12 и фактическим consumer-ам игры. Оба файла — прозрачные scriptless animated SVG source-candidates. Они намеренно лежат только в `asset-staging/` и не загружаются игрой до отдельного одобрения.

| Candidate | Почему нужен сейчас | Intended consumer/event | Existing fallback | Planned runtime derivative |
|---|---|---|---|---|
| `bot-world-muzzle-blast-vfx-01.svg` | У игрока уже есть generated muzzle sheets/backblast, а выстрелы ботов в мире визуально всё ещё завершаются общим procedural `trigMuzzle(...)`. На дистанции это слабее читается, особенно при перестрелке нескольких ботов. | `src/ai/bot-fire-control.js::executeBotShot()` сразу после authoritative shot/noise/audio и рядом с `trigMuzzle(from,...)`; world position = bot muzzle `from`. | текущий Three.js/procedural muzzle + tracer/casing/audio | row 0 в 8×2 static-frame SVG atlas, 8 frames, one-shot ~0.38 s; world-projected DOM VFX с throttle/budget |
| `bot-armor-rupture-death-vfx-01.svg` | `Bot.die()` сейчас использует геометрические gibs + пять простых частиц. Короткий armor-rupture burst даст смерти читаемый удар, горячие искры, пластины и дым без изменения damage/physics. | `src/entities/bots.js::Bot.die()` до удаления/утилизации bot group, world position = bot center/chest. | текущие gibs + `spawnP(...)` particles | row 1 в 8×2 static-frame SVG atlas, 8 frames, one-shot ~0.95 s; world-projected DOM VFX, bounded cleanup |

## Integrated runtime result

Runtime derivative: `assets/ui/fx/bot-combat-vfx-atlas-13.svg` — один scriptless static-frame atlas: 2 semantic rows × 8 frames. Playback переиспользует существующий `playGeneratedCombatVfx(...)`/elapsed-time pipeline; source-preview SVG остаются только в staging.

Важно:
- muzzle VFX не меняет fire cadence, hit chance, projectile spawning, sound или tracer policy;
- death VFX не меняет HP, kill rewards, gibs, physics или respawn;
- current procedural effects остаются fallback;
- staging SVG — preview/provenance, не gameplay-time authority;
- при интеграции world effects должны скрываться off-screen/behind-camera и делить существующий bounded VFX budget;
- для частых bot shots используется per-bot throttle, чтобы автоматическое оружие не создавало лишний DOM churn.

## Browser/VFX rationale

Для runtime лучше не проигрывать self-animated SVG напрямую. Как и Pack 10–12, после одобрения нужно снять deterministic static frames в atlas и переключать их по elapsed time в game loop. Это сохраняет одинаковую скорость на 60/120/144 Hz и позволяет ограничивать число одновременно активных world VFX.

Как посмотреть: откройте SVG через GitHub и нажмите **Raw** — браузер проиграет встроенную preview-анимацию на прозрачном фоне.
