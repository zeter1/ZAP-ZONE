# AGENTS.md — ZAP ZONE

Короткая карта для ChatGPT/Codex. Не читайте весь репозиторий механически.

Выбирайте маршрут чтения по задаче, а не открывайте один и тот же стек «на всякий случай»:

- продолжение очереди refactor/debug → один текущий `task/*.md` → `docs/AI_WORKFLOW.md` → нужный owner/spec → прямые callers/oracles;
- узкая правка с уже известным owner-ом → owner/spec + прямые callers/oracles; `task/README.md` нужен только при изменении очереди;
- CI failure → workflow → exact run/job/failed step/log → затронутый owner;
- явная задача пользователя имеет приоритет над backlog; unrelated docs не читать только ради полноты контекста.

Главные owner-ы:
- browser session / pause / Pointer Lock → `src/game/session.js`;
- frame loop / boot → `src/game/runtime.js`;
- player/save/weapon ownership → `src/player/state.js`;
- combat/input/projectiles → `src/combat/combat.js`;
- bot perception / combat noise / hearing / target acquisition / grenade+mine+rocket sensing → `src/ai/bot-perception.js` + `docs/specs/BOT_PERCEPTION.md`;
- bot navigation / wall+smoke steering / speed caps / collision substeps → `src/ai/bot-navigation.js` + `docs/specs/BOT_NAVIGATION.md`;
- bot tactical cover/flank destination scoring → `src/ai/bot-positioning.js` + `docs/specs/BOT_POSITIONING.md`;
- bot weapon reselection / hold hysteresis / switch timing → `src/ai/bot-weapon-policy.js` + `docs/specs/BOT_WEAPON_POLICY.md`;
- bot aim / muzzle / reload / concrete shot + hit resolution → `src/ai/bot-fire-control.js` + `docs/specs/BOT_FIRE_CONTROL.md`;
- individual bot mine/bomb eligibility + deployment execution → `src/ai/bot-deployables.js` + `docs/specs/BOT_DEPLOYABLES.md`;
- squad coordination / Map Tactics / Adaptive Commander → `src/ai/tactics.js`;
- Frontline objective state/capture/rotation/save/HUD/marker → `src/game/frontline.js` + `docs/specs/FRONTLINE.md`;
- bot model / hit meshes / weapon pivot / two-hand arm rig → `src/entities/bot-presentation.js` + `docs/specs/BOT_PRESENTATION.md`;
- individual bot FSM / fire gate + burst cadence / tactical execution / damage reaction → `src/entities/bots.js`; it consumes perception, navigation, positioning, weapon-policy, fire-control and deployables owners rather than reimplementing them;
- pickups → `src/entities/pickups.js`;
- rendering/arena/collision → `src/core/engine.js`;
- asset identity/fallback → `src/assets/catalog.js` + `docs/ASSETS.md`;
- validation/cache build → `scripts/validate-structure.mjs` + `scripts/stamp-web-build.mjs`.

Invariant: один semantic owner на поведение. При extraction переносите behavior + invariants + test/source oracle; не оставляйте дублирующую реализацию.

После runtime/source change: syntax → `stamp-web-build --check` → structure validation → HTTP boot smoke → `file://` browser smoke → exact GitHub Actions result.

Не ослабляйте tests/smoke, не добавляйте catch/suppression ради зелёного CI и не меняйте gameplay balance в чистом refactor без отдельной задачи.
