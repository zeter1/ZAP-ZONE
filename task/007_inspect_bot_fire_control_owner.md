# Task 007 — Inspect per-bot fire-control owner

## Goal

После выделения perception/navigation/positioning исследовать следующий cohesive seam в `src/entities/bots.js`: индивидуальную fire-control execution вокруг aim/muzzle/reload/shoot/damage helpers. Выносить отдельный owner только если dependency closure отделяет **как бот исполняет выстрел** от FSM policy, squad doctrine и canonical projectile/combat authority.

## Why now / evidence

- Position candidate scoring больше не заставляет читать большой `Enemy` class ради cover/flank ranking.
- В `bots.js` остаётся соседний combat cluster: `getAimPoint()`, `getMuzzlePos()`, reload helpers, `dealDamageToCurrentTarget()`, `doShoot()` и weapon-switch integration.
- `src/combat/combat.js` уже владеет projectile primitives, а `src/weapons/system.js` — weapon data/factories; новый owner не должен дублировать их.

## Scope

1. Fresh `main`, current task, workflow и Actions preflight.
2. Repo-wide closure для aim/muzzle/reload/shoot helpers, callers и source-oracles.
3. Разделить fire-control execution, weapon-selection policy, FSM transitions и projectile authority.
4. Проверить, нужен ли `src/ai/bot-fire-control.js` (или seam должен остаться в `bots.js`).
5. Если seam чистый — pure extraction + focused behavior tests + owner/consumer/reverse guards + narrow spec.
6. Если нет — оставить ownership на месте и выбрать меньший evidence-based seam.
7. Canonical build stamp; exact PR Actions; post-merge `main` Actions.

## Non-goals

- Не менять weapon damage, accuracy, spread, burst lengths, reload/equip cadence или ammo economy.
- Не менять target acquisition, suppression policy или squad doctrine.
- Не переносить canonical projectile collision/penetration из `src/combat/combat.js`.
- Не менять player combat.
- Не ослаблять validation/browser smokes.

## Invariants

- `src/weapons/system.js` остаётся source of truth weapon definitions.
- `src/combat/combat.js` остаётся owner projectile primitives/collision.
- `src/entities/bots.js` сохраняет FSM transition authority, пока fresh closure не докажет обратное.
- Pure refactor сохраняет observable/failure semantics и порядок side effects.
- HTTP(S) и реальный `file://` boot/menu остаются зелёными.

## Files to inspect first

- `src/entities/bots.js`
- `src/combat/combat.js`
- `src/weapons/system.js`
- `src/ai/bot-perception.js`
- `src/ai/bot-positioning.js`
- `scripts/validate-structure.mjs`
- `docs/ARCHITECTURE.md`
- `.github/workflows/validate.yml`

## Verification

Syntax → focused behavior tests → structure/source-oracle guards → build stamp → HTTP smoke → real `file://` smoke → exact PR Validate → exact merged-main Validate.

## Done

Закрыть только если новый owner уменьшает context cost и не создаёт второй combat source of truth. Выполненный task удалить; следующий формировать только из fresh review/CI/runtime evidence.
