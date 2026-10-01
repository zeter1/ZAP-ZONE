# Composed fire stability — continuous + event-driven channels

Читайте этот pattern, когда точность/устойчивость оружия зависит одновременно от **измеряемого runtime state** (движение, stance, heat) и **событий** (выстрел, impact, overheat), особенно если рядом есть safety gates и randomized cadence.

Это reusable engineering pattern. Конкретные ZAP ZONE constants и balance принадлежат доменному spec/code.

## 1. Не превращать всё в один accuracyPenalty

Разные причины нестабильности должны иметь разные state channels и owner semantics:

- continuous measured channel — обновляется каждый frame из уже авторитетного runtime fact;
- event-driven channel — увеличивается только когда авторитетное событие реально произошло;
- contextual multiplier — вычисляется без отдельного mutable state, если history не нужна.

Для ZAP ZONE:
- `fireMoveInstability` — measured post-collision movement;
- `fireBurstRecoil` — emitted-shot recoil history;
- suppression — отдельный contextual pressure source.

Один generic state скрывает root cause, усложняет tests и повышает риск, что AI при следующей правке будет лечить не тот источник accuracy.

## 2. Сначала authoritative gates, потом event mutation

Если event state означает «это произошло», регистрировать его только после всех guards, которые могут отменить событие.

Правильный порядок для firearm execution:

`derive pre-shot state → deterministic aim/spread → LOS/safety guards → register emitted-shot recoil → emit gameplay/presentation side effects`.

Blocked LOS, friendly-fire guard или unsafe explosive attempt не должны создавать recoil/heat/ammo state, будто снаряд реально покинул оружие.

Не переносите post-event mutation выше guard только ради удобства caller-а.

## 3. Первый shot читает pre-event state

Для накопительной отдачи конкретный shot должен вычисляться из state, существовавшего **до него**, а затем увеличивать state для следующего shot.

Это даёт понятный invariant:

`settled first shot <= later shot instability`

при одинаковом movement/suppression/target state.

Если recoil добавлен до расчёта текущего shot, вы теряете clean first-shot semantics и усложняете tuning.

## 4. Recovery должен зависеть от времени, не от FPS

Для плавного восстановления используйте `dt`-based decay/smoothing. Экспоненциальная форма удобна тем, что одинаковый elapsed time даёт одинаковый результат независимо от frame partition:

`next = current * exp(-dt / tau)`.

MDN отдельно предупреждает, что frame-driven progression без timestamp/delta time ускоряется на high-refresh displays. В browser game это correctness contract, а не cosmetic detail.

## 5. RNG ownership не смешивать со stability

Deterministic stability functions не должны добавлять `Math.random()`, если randomized spread/cadence уже имеет собственный legacy order.

При изменении такого seam проверяйте:
- draw count/order до и после;
- short-circuit branches;
- blocked-event branches;
- owner границу между deterministic state и stochastic policy.

Если изменение требует нового RNG — это отдельный gameplay contract, а не hidden implementation detail.

## 6. Test matrix

Минимальный behavior oracle:

1. settled first shot;
2. later shot менее stable;
3. saturation/max bound;
4. recovery при одном большом `dt` = recovery при нескольких меньших `dt`;
5. weapon/state switch reset или migration rule;
6. каждый safety gate не регистрирует event;
7. emitted event регистрирует state ровно один раз;
8. movement/context + event channel корректно compose;
9. RNG draw count/order не меняется.

Architecture oracle должен проверять ownership/order, но не дублировать весь implementation regex-ами.

## 7. Где читать в ZAP ZONE

- behavior/spec: `docs/specs/BOT_FIRE_CONTROL.md`;
- cadence/RNG boundary: `docs/specs/BOT_FIRE_CADENCE.md`;
- owner: `src/ai/bot-fire-control.js`;
- consumer timing: `src/entities/bots.js`;
- direct oracle: `scripts/bot-fire-control-owner.test.mjs`;
- structure/order oracle: `scripts/validate-structure.mjs`.

Ключевое правило: **continuous facts, event facts и stochastic policy могут взаимодействовать, но не должны терять собственных владельцев и наблюдаемые контракты.**
