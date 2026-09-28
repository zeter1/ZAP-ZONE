# AGENTS.md — ZAP ZONE

Короткая карта для ChatGPT/Codex. Не читайте весь репозиторий механически.

1. Откройте `task/README.md` и один текущий `task/*.md`.
2. Прочитайте `docs/AI_WORKFLOW.md`.
3. По задаче откройте нужный owner/spec в `docs/ARCHITECTURE.md`, `docs/ASSETS.md` или узком `docs/specs/*.md`.
4. Затем читайте только актуальные owner-файлы, callers, validation и `.github/workflows/validate.yml`.

Главные owner-ы:
- browser session / pause / Pointer Lock → `src/game/session.js`;
- frame loop / boot → `src/game/runtime.js`;
- player/save/weapon ownership → `src/player/state.js`;
- combat/input/projectiles → `src/combat/combat.js`;
- bot perception / combat noise / hearing / target acquisition / grenade+mine+rocket sensing → `src/ai/bot-perception.js` + `docs/specs/BOT_PERCEPTION.md`;
- bot navigation / wall+smoke steering / speed caps / collision substeps → `src/ai/bot-navigation.js` + `docs/specs/BOT_NAVIGATION.md`;
- squad coordination / Map Tactics / Adaptive Commander → `src/ai/tactics.js`;
- Frontline objective state/capture/rotation/save/HUD/marker → `src/game/frontline.js` + `docs/specs/FRONTLINE.md`;
- bot model / hit meshes / weapon pivot / two-hand arm rig → `src/entities/bot-presentation.js` + `docs/specs/BOT_PRESENTATION.md`;
- individual bot FSM / tactical execution / shooting / damage reaction → `src/entities/bots.js`; it consumes perception and navigation owners rather than reimplementing them;
- pickups → `src/entities/pickups.js`;
- rendering/arena/collision → `src/core/engine.js`;
- asset identity/fallback → `src/assets/catalog.js` + `docs/ASSETS.md`;
- validation/cache build → `scripts/validate-structure.mjs` + `scripts/stamp-web-build.mjs`.

Invariant: один semantic owner на поведение. При extraction переносите behavior + invariants + test/source oracle; не оставляйте дублирующую реализацию.

После runtime/source change: syntax → `stamp-web-build --check` → structure validation → HTTP boot smoke → `file://` browser smoke → exact GitHub Actions result.

Не ослабляйте tests/smoke, не добавляйте catch/suppression ради зелёного CI и не меняйте gameplay balance в чистом refactor без отдельной задачи.
