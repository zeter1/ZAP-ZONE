# Task 012 — Isolate bot suppression-response policy owner

## WHY

После выноса damage-event retaliation в отдельный owner `src/entities/bots.js` всё ещё содержит ещё одну самостоятельную incoming-combat seam — `Enemy.registerSuppression(source,intensity)`.

Fresh-main inspection показывает один producer: swept enemy bullet near-miss в `src/combat/combat.js`. Метод нормализует pressure, обновляет suppression duration/source, ускоряет cover reevaluation и при достаточном pressure/низком HP ускоряет FSM cooldown. Это policy реакции на **near miss**, а не damage application, perception scan или locomotion.

Смешивать её с новым damage-reaction owner не стоит: damage и suppression имеют разные triggers, source validity и lifecycle, а отдельный маленький owner даст AI точную точку входа без чтения всего `bots.js`.

## SCOPE

1. Начать с fresh `main`, этого task, `AGENTS.md`, `docs/AI_WORKFLOW.md` и exact latest Validate run.
2. Прочитать `Enemy.registerSuppression()`, единственный near-miss producer в `src/combat/combat.js` и consumers `suppressedT/suppressionSource/coverEvalT/stateCD`.
3. Выделить canonical owner `src/ai/bot-suppression-response.js` (или более точное имя, если fresh inspect докажет лучшую границу).
4. Сохранить public `Enemy.registerSuppression(...)` compatibility seam, если это удерживает combat producer простым; orchestration может делегировать policy owner-у.
5. Сохранить буквально:
   - source validity guard;
   - pressure clamp `0.3..1.4`;
   - suppression duration formula;
   - cover/state timer thresholds;
   - отсутствие новых RNG calls.
6. Добавить focused deterministic `node:test` regressions с boundary cases + owner/consumer/reverse structural guards.
7. Добавить узкий spec и AI routing/load-order/verification docs.
8. Обновить `CHANGELOG.md`; после verified merge удалить этот task и создать один следующий evidence-based task.

## NON-GOALS

- Не менять suppression balance, bullet near-miss geometry или player suppression.
- Не объединять damage reaction и suppression в generic “combat reaction framework”.
- Не переносить movement/cover scoring, perception, dodge или squad tactics.
- Не менять projectile physics/collision или weapon balance.

## INVARIANTS

- Один canonical owner на bot near-miss suppression-response policy.
- Friendly/self/invalid source semantics остаются без изменений.
- Exact pressure/duration/threshold behavior сохраняется.
- Pure extraction не меняет gameplay balance и RNG order.
- `combat.js` остаётся owner-ом projectile/near-miss detection; response owner только применяет policy к уже обнаруженному event.

## FILES TO INSPECT

- `src/entities/bots.js`
- `src/combat/combat.js`
- `src/ai/bot-damage-reaction.js`
- `src/ai/bot-perception.js`
- `scripts/validate-structure.mjs`
- `index.html`
- `docs/AI_WORKFLOW.md`
- `docs/ARCHITECTURE.md`
- relevant `docs/specs/*`

## VERIFICATION

Syntax/compile → focused suppression-response regressions → reverse/event-boundary guards → `stamp-web-build --check` → structure validation → HTTP browser boot smoke → `file://` menu smoke → exact GitHub Actions run on exact merged head.

## DONE

- suppression-response policy has one canonical owner and no duplicate implementation;
- near-miss producer and runtime semantics are preserved;
- focused regression proves boundary/threshold behavior;
- docs/spec/AI routing match current source;
- exact main head and Validate result are verified.
