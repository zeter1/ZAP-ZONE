# OCCLUSION_CONSISTENT_PRESENTATION — collision fact first, visual endpoint second

## Назначение

Используйте этот pattern, когда gameplay уже знает, что действие заблокировано геометрией, а визуальная обратная связь (tracer, beam, decal, marker, line preview) тоже должна уважать ту же преграду.

Главное правило: **presentation не вычисляет вторую версию collision truth**. Геометрический owner возвращает достаточный факт (distance/point/normal), gameplay принимает outcome, а presentation только ограничивает визуальный эффект этим фактом.

## 1. Один owner геометрии

В ZAP ZONE nearest opaque-wall fact принадлежит `src/core/engine.js`:

`firstWallHitDistance(from,to,list) → finite distance | Infinity`

`wallBetween(...)` является boolean-представлением того же факта и делегирует этому helper. AI/UI не должны копировать `Raycaster`, AABB или epsilon policy ради визуального эффекта.

Так сохраняется одна трактовка ray origin/direction, near/far, endpoint tolerance, collision meshes и ближайшего пересечения.

## 2. Opaque geometry ≠ visibility volume

- **opaque wall/cover** имеет физический endpoint. Tracer/beam должен остановиться на первом blocker distance или раньше;
- **smoke/fog/visibility volume** может блокировать perception, не являясь твёрдой поверхностью. Его presentation policy задаётся отдельно и не обязана притворяться collision endpoint.

Один gameplay outcome может объединять обе причины, но визуальная семантика endpoint должна сохранять их различие.

## 3. RNG отделён от геометрии

Если визуальный feedback вероятностный:
1. outcome/gate определяет blocked attempt;
2. один документированный RNG draw решает, показывать ли feedback;
3. distance/point clamp вычисляется детерминированно;
4. clamp не добавляет RNG и не меняет order существующих gameplay draws.

## 4. Blocked feedback не получает gameplay authority

Presentation-only feedback после blocked outcome не имеет права расходовать ammo, добавлять recoil/noise, наносить damage, spawn-ить authoritative projectile или перепланировать cadence/timer. Такое изменение — отдельный gameplay contract.

## 5. Минимальная test matrix

1. opaque blocker ближе visual cap → endpoint равен nearest blocker distance;
2. smoke-only block → документированная smoke policy сохраняется;
3. visual feedback decision сохраняет точный RNG call count/order;
4. blocked path не получает gameplay side effects;
5. boolean visibility helper и nearest-hit helper не расходятся по geometry owner;
6. runtime smoke подтверждает classic-script load order и отсутствие ReferenceError.
7. geometry-owner regression отдельно фиксирует `Infinity`, nearest-hit ordering и `dist - 0.15`; HTTP smoke повторяет ключевые случаи на реальном Three.js Mesh/Raycaster, а не только на test double.

## 6. Маршрут чтения в ZAP ZONE

`src/core/engine.js:firstWallHitDistance`
→ `scripts/engine-wall-geometry-owner.test.mjs` (точный owner contract)
→ `scripts/browser-boot-smoke.mjs` (real Three.js geometry sanity)
→ `docs/specs/BOT_FIRE_CONTROL.md`
→ `src/ai/bot-fire-control.js:executeBotShot`
→ `scripts/bot-fire-control-owner.test.mjs`
→ `scripts/validate-structure.mjs`.

Если задача про cadence после blocked outcome, дополнительно читать `docs/patterns/OUTCOME_DRIVEN_CADENCE.md`; иначе cadence-код не открывать и не менять.
