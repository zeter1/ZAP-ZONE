# Outcome-driven cadence — attempt vs committed event

Читайте этот pattern, когда execution-функция может закончиться **успехом, tactical block или safety veto**, а следующий retry/burst/cooldown зависит от причины завершения.

Цель — не смешивать факт «что произошло» и policy «когда пробовать снова», особенно если рядом есть RNG, ammo, recoil или safety gates.

## 1. Execution возвращает факт, scheduler владеет временем

Плохой seam: execution иногда пишет retry timer, caller затем безусловно запускает generic cadence, второй owner перезаписывает первый timer, а blocked attempt неявно начинает выглядеть как emitted event.

Лучший seam: `execution → closed outcome → cadence/scheduler`.

Execution владеет physics/safety/result facts. Scheduler владеет next-attempt timer, burst/cooldown mutation и соответствующим RNG.

## 2. Используйте маленький закрытый набор outcomes

Outcome должен кодировать только различия, которые реально меняют downstream policy. Не возвращайте огромный diagnostic object, если достаточно 3–5 стабильных значений.

Для ZAP ZONE: `EMITTED`, `OCCLUDED`, `FRIENDLY_FIRE`, `ROCKET_SAFETY`.

Не используйте boolean `true/false`, если разные причины block требуют разного retry, и не сводите всё к строке `blocked`.

## 3. Не все blocked outcomes обязаны иметь одинаковую cadence

Разделяйте:
- **tactical/visibility block** — иногда безопаснее сохранить прежний full cadence, чтобы не усилить pressure;
- **safety veto** — часто не должен расходовать committed burst/event, но обязан иметь bounded retry;
- **emitted/committed event** — изменяет ammo/recoil/burst только после authoritative gates.

Так можно исправить safety bug без скрытого глобального rebalance.

## 4. Один owner для scheduling

Если cadence owner существует, execution не должен писать его timer. Structural oracle полезно делать отрицательным: запретить `bot.sT=` в fire-control, а caller заставить явно сохранить и передать outcome.

Такой guard защищает от regression, где будущая правка снова добавит локальный backoff, который немедленно затрёт caller.

## 5. RNG — часть observable contract

При переносе retry RNG между owner-ами различайте:
- **порядок существующего draw** — может сохраниться, если caller сразу передаёт outcome;
- **количество draws** — может намеренно уменьшиться, если generic cadence больше не вызывается на safety veto;
- **short-circuit** — blocked branch не должен потреблять RNG, предназначенный для emitted path.

Controlled-RNG tests должны фиксировать count/order по каждому outcome. Не добавляйте random draw «для естественности» без отдельного gameplay rationale.

## 6. Bounded retry обязателен

Safety veto без burst decrement не должен превращаться в tight loop. Каждый такой outcome обязан иметь положительный minimum delay, понятного owner-а delay, regression test на timer и отсутствие ammo/recoil/event side effects.

Для explosive safety полезен отдельный signal на reselection/reposition, но не смешивайте его с scheduler ownership.

## 7. Fail fast на неизвестный outcome

Закрытый contract должен падать на неизвестном outcome до mutation/RNG. Silent fallback к `EMITTED` или generic cadence скрывает несовместимость между owner-ами и превращает typo в gameplay drift.

## 8. Test matrix

1. Каждый execution outcome возвращается детерминированно.
2. Blocked outcome не расходует ammo/recoil/noise/projectile.
3. Execution не мутирует scheduler timer.
4. Emitted path сохраняет legacy cadence/RNG.
5. Conservative blocked path, если есть, сохраняет documented attempt cadence.
6. Каждый safety veto сохраняет burst и имеет bounded retry.
7. Точный RNG count/order каждого outcome.
8. Unknown outcome fail-fast до mutation.
9. Structural guard требует caller `outcome → cadence`.
10. Runtime smoke подтверждает classic-script load order.

## 9. Где читать в ZAP ZONE

- execution contract: `docs/specs/BOT_FIRE_CONTROL.md`;
- cadence contract: `docs/specs/BOT_FIRE_CADENCE.md`;
- execution owner: `src/ai/bot-fire-control.js`;
- scheduler owner: `src/ai/bot-fire-cadence.js`;
- composition root: `src/entities/bots.js`;
- behavior oracles: `scripts/bot-fire-control-owner.test.mjs`, `scripts/bot-fire-cadence-owner.test.mjs`;
- architecture oracle: `scripts/validate-structure.mjs`.

Ключевое правило: **execution сообщает факт; scheduler принимает policy-решение. Один timer — один semantic owner.**
