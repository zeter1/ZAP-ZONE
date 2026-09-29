# Task 013 — Isolate bot dodge-response execution owner

## WHY

После выделения suppression-response policy в отдельный owner в `src/entities/bots.js` остаётся ещё одна компактная incoming-threat seam — `Enemy.triggerDodge(preferredDir=0,urgency=1)`.

Fresh-main evidence показывает два producer-а: survived damage в `Enemy.hurt()` и rocket-threat response в `Enemy.update()`. Метод владеет fallback dodge direction, dodge duration/speed/cooldown и optional jump, причём содержит несколько `Math.random()` calls с observable order. Это самостоятельная reaction/execution policy, а не perception, projectile physics или locomotion collision.

## SCOPE

1. Начать с fresh `main`, этого task, `AGENTS.md`, `docs/AI_WORKFLOW.md` и exact latest Validate run.
2. Прочитать `Enemy.triggerDodge()`, оба producer-а (`hurt` и rocket-threat branch), consumers `dodgeDir/dodgeT/dodgeSpd/dodgeCD/jV` и navigation boundary.
3. Выделить canonical owner `src/ai/bot-dodge-response.js` (или более точное имя, если fresh inspect докажет лучшую границу).
4. Сохранить public `Enemy.triggerDodge(...)` compatibility seam и существующие producer calls.
5. Сохранить буквально:
   - cooldown/active-dodge early return;
   - preferred-direction precedence;
   - exact random-call count и order;
   - urgency clamps для duration/speed;
   - dodge cooldown formula;
   - optional jump predicate и jump impulse formula.
6. Добавить deterministic `node:test` regressions с controlled RNG queue, включая early-return/no-RNG case и preferred-dir/fallback boundaries.
7. Добавить owner/consumer/reverse/load-order guards, узкий spec и AI routing.
8. Обновить `CHANGELOG.md`; после verified merge удалить этот task и создать один следующий evidence-based task.

## NON-GOALS

- Не менять dodge chance в `Enemy.hurt()`.
- Не менять rocket-threat sensing или urgency thresholds.
- Не менять movement collision/substeps в `bot-navigation.js`.
- Не менять dodge balance, jump chance/impulse или RNG abstraction.
- Не объединять dodge, damage reaction и suppression в generic combat-reaction framework.

## INVARIANTS

- Один canonical owner на concrete dodge-response execution policy.
- Producers решают **когда** вызвать dodge; owner решает только **как** применить уже запрошенный dodge.
- Pure extraction сохраняет RNG consumption/order.
- `Enemy.triggerDodge(...)` остаётся стабильной public seam.
- Navigation owner не получает threat/perception authority.

## FILES TO INSPECT

- `src/entities/bots.js`
- `src/ai/bot-navigation.js`
- `src/ai/bot-damage-reaction.js`
- `src/ai/bot-suppression-response.js`
- `src/ai/bot-perception.js`
- `scripts/validate-structure.mjs`
- `index.html`
- `docs/AI_WORKFLOW.md`
- `docs/ARCHITECTURE.md`
- relevant `docs/specs/*`

## VERIFICATION

Syntax/compile → focused controlled-RNG dodge regressions → owner/consumer/reverse/load-order guards → `stamp-web-build --check` → structure validation → HTTP browser boot smoke → `file://` menu smoke → exact GitHub Actions run on exact merged head.

## DONE

- dodge execution policy has one canonical owner and no duplicate implementation;
- both producers and exact RNG semantics are preserved;
- focused regression proves early-return, direction, timer/speed/cooldown и optional-jump behavior;
- docs/spec/AI routing match current source;
- exact main head and Validate result are verified.
