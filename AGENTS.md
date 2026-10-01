# AGENTS.md — ZAP ZONE

Короткая карта для ChatGPT/Codex. Не читайте весь репозиторий механически.

Выбирайте маршрут чтения по задаче, а не открывайте один и тот же стек «на всякий случай»:

- продолжение очереди refactor/debug → один текущий `task/*.md` → `docs/AI_WORKFLOW.md` → нужный owner/spec → прямые callers/oracles;
- узкая правка с уже известным owner-ом → owner/spec + прямые callers/oracles; `task/README.md` нужен только при изменении очереди;
- CI failure → workflow → exact run/job/failed step/log → затронутый owner;
- явная задача пользователя имеет приоритет над backlog; unrelated docs не читать только ради полноты контекста.

Главные owner-ы:
- firearm projectile ricochet policy / reflection → `docs/specs/PROJECTILE_RICOCHET.md` → `src/combat/projectile-ricochet.js`; swept collision/penetration остаются в `src/combat/combat.js`;
- browser session / pause / Pointer Lock → `src/game/session.js`;
- frame loop / boot → `src/game/runtime.js`;
- player/save/weapon ownership → `src/player/state.js`;
- combat/input/projectiles → `src/combat/combat.js`;
- bot level/kills/role stat scaling + HP rescale → `src/ai/bot-progression-scaling.js` + `docs/specs/BOT_PROGRESSION_SCALING.md`;
- bot perception / combat noise / hearing / target acquisition / grenade+mine+rocket sensing → `src/ai/bot-perception.js` + `docs/specs/BOT_PERCEPTION.md`;
- bot damage-event retaliation / target memory+lock / reaction timers → `src/ai/bot-damage-reaction.js` + `docs/specs/BOT_DAMAGE_REACTION.md`;
- bot near-miss suppression response / pressure+cover/FSM timer clamps → `src/ai/bot-suppression-response.js` + `docs/specs/BOT_SUPPRESSION_RESPONSE.md`;
- bot dodge-response execution / RNG order / urgency clamps / optional jump → `src/ai/bot-dodge-response.js` + `docs/specs/BOT_DODGE_RESPONSE.md`;
- bot navigation / wall+smoke steering / speed caps / collision substeps → `src/ai/bot-navigation.js` + `docs/specs/BOT_NAVIGATION.md`;
- bot tactical cover/flank destination scoring → `src/ai/bot-positioning.js` + `docs/specs/BOT_POSITIONING.md`;
- bot cover reevaluation / peek probing+timing / hold+chain+exit execution → `src/ai/bot-cover-execution.js` + `docs/specs/BOT_COVER_EXECUTION.md`;
- bot engage-state strafe/range-matchup/objective-pull movement intent → `src/ai/bot-engagement-movement.js` + `docs/specs/BOT_ENGAGEMENT_MOVEMENT.md`;
- bot weapon reselection / hold hysteresis / switch timing → `src/ai/bot-weapon-policy.js` + `docs/specs/BOT_WEAPON_POLICY.md`;
- bot aim / muzzle / reload / measured movement stability / emitted-shot burst recoil+settle / concrete shot + hit resolution + closed shot outcome → `src/ai/bot-fire-control.js` + `docs/specs/BOT_FIRE_CONTROL.md`;
- bot outcome-aware burst/cadence / safety retry / RNG order / next-attempt schedule → `src/ai/bot-fire-cadence.js` + `docs/specs/BOT_FIRE_CADENCE.md`;
- individual bot mine/bomb eligibility + deployment execution → `src/ai/bot-deployables.js` + `docs/specs/BOT_DEPLOYABLES.md`;
- bot high-level state selection / priority ladder / stateCD reschedule → `src/ai/bot-state-policy.js` + `docs/specs/BOT_STATE_POLICY.md`;
- squad coordination / Map Tactics / Adaptive Commander → `src/ai/tactics.js`;
- Frontline objective state/capture/rotation/save/HUD/marker → `src/game/frontline.js` + `docs/specs/FRONTLINE.md`;
- bot model / hit meshes / weapon pivot / two-hand arm rig → `src/entities/bot-presentation.js` + `docs/specs/BOT_PRESENTATION.md`;
- individual bot state orchestration / broad fire gate / flank+objective+support+search execution / HP+death lifecycle + stateCD/cadence timer lifecycle + dodge producers/timer consumption → `src/entities/bots.js`; it consumes progression-scaling, perception, damage-reaction, suppression-response, dodge-response, navigation, positioning, cover-execution, engagement-movement, weapon-policy, fire-control, fire-cadence, deployables and state-policy owners rather than reimplementing them;
- pickups → `src/entities/pickups.js`;
- rendering/arena/collision / nearest opaque-wall hit distance → `docs/patterns/OCCLUSION_CONSISTENT_PRESENTATION.md` → `src/core/engine.js`; focused geometry oracle → `scripts/engine-wall-geometry-owner.test.mjs`;
- asset identity/fallback → `src/assets/catalog.js` + `docs/ASSETS.md`;
- validation/cache build → `scripts/validate-structure.mjs` + `scripts/stamp-web-build.mjs`.

Invariant: один semantic owner на поведение. При extraction переносите behavior + invariants + test/source oracle; не оставляйте дублирующую реализацию.

После runtime/source change: syntax → `stamp-web-build --check` → structure validation → HTTP boot smoke → `file://` browser smoke → exact GitHub Actions result.

Не ослабляйте tests/smoke, не добавляйте catch/suppression ради зелёного CI и не меняйте gameplay balance в чистом refactor без отдельной задачи.

Cross-owner behavior derived from post-physics/collision facts → `docs/patterns/MEASURED_RUNTIME_STATE.md`. Independent continuous + event-driven weapon-instability channels → `docs/patterns/COMPOSED_FIRE_STABILITY.md`. Attempt-vs-emitted/safety-block scheduling → `docs/patterns/OUTCOME_DRIVEN_CADENCE.md`. Opaque-collision fact + presentation endpoint consistency → `docs/patterns/OCCLUSION_CONSISTENT_PRESENTATION.md`.
