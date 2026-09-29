# Task 011 — Isolate bot damage-reaction policy owner

## WHY

`src/entities/bots.js` остаётся крупным per-bot orchestrator (~975 lines). Fresh-main inspection показывает, что `Enemy.hurt()` одновременно:
- применяет HP/hit feedback и вызывает death lifecycle;
- выбирает retaliatory target после входящего урона;
- обновляет target memory/lock, reaction/burst timers и `patrol/search → hunt`.

Это отдельная AI policy seam. Callers уже распределены между `src/combat/combat.js`, `src/ai/bot-fire-control.js` и player thorns в `src/progression/progression.js`, поэтому будущему AI сейчас приходится читать лишний lifecycle/presentation код, чтобы понять только damage reaction.

## SCOPE

1. Начать с fresh `main`, этого task, `AGENTS.md`, `docs/AI_WORKFLOW.md` и exact latest Validate run.
2. Прочитать `Enemy.hurt()`, прямые `.hurt(...)` producers и существующие perception/fire-control boundaries.
3. Вынести только retaliatory target/FSM/timer policy в canonical owner `src/ai/bot-damage-reaction.js` (или более точное имя, если inspect докажет лучшую границу).
4. Оставить в `bots.js` в этой проходке:
   - HP mutation;
   - hit flash/emissive presentation;
   - concrete dodge execution;
   - `die()` / gibs / cleanup;
   - public `Enemy.hurt(...)` compatibility seam, если callers выигрывают от сохранения API.
5. Сохранить буквально current retaliation predicates, target-memory fields, lock/reaction/burst/state timers и source/team semantics.
6. Добавить focused deterministic `node:test` regression + owner/consumer/reverse structural guards.
7. Добавить узкий spec и обновить AI routing/architecture/load order так, чтобы future AI открывала owner, а не весь `bots.js`.
8. Обновить `CHANGELOG.md`; удалить этот task только после exact merged-main evidence и создать один следующий evidence-based task.

## NON-GOALS

- Не менять damage formulas, weapon balance, health scaling, dodge probabilities или RNG order.
- Не переносить `die()`, gib physics, bot presentation, score/XP/kill-feed ownership.
- Не менять combat callers ради нового API без необходимости.
- Не рефакторить одновременно suppression, movement, squad tactics или spawn system.

## INVARIANTS

- Один semantic owner на damage-reaction policy.
- `Enemy.hurt()` остаётся поведенчески совместимым для player bullets/splash, bot bullets/explosions и thorns.
- Не-lethal hit сохраняет current retaliation/lock/state behavior; lethal hit всё так же проходит через current death path.
- Pure extraction не меняет gameplay balance и не добавляет новые random calls.

## FILES TO INSPECT

- `src/entities/bots.js`
- `src/combat/combat.js`
- `src/ai/bot-fire-control.js`
- `src/ai/bot-perception.js`
- `src/progression/progression.js`
- `scripts/validate-structure.mjs`
- `index.html`
- `docs/AI_WORKFLOW.md`
- `docs/ARCHITECTURE.md`
- relevant `docs/specs/*`

## VERIFICATION

Syntax/compile → focused damage-reaction regression → reverse owner guards → `stamp-web-build --check` → structure validation → HTTP browser boot smoke → `file://` menu smoke → exact GitHub Actions run on exact merged head.

## DONE

- damage-reaction policy has one canonical owner and no duplicate implementation;
- callers and runtime semantics are preserved;
- focused regression can fail on contract drift;
- docs/spec/AI routing match current source;
- exact main head and Validate result are verified.
