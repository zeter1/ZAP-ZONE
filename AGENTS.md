# AGENTS.md — ZAP ZONE

Короткая карта для ChatGPT/Codex. Не читайте весь репозиторий механически.

1. Откройте `task/README.md` и один текущий `task/*.md`.
2. Прочитайте `docs/AI_WORKFLOW.md`.
3. По задаче откройте нужный owner/spec в `docs/ARCHITECTURE.md` или `docs/ASSETS.md`.
4. Затем читайте только актуальные owner-файлы, callers, validation и `.github/workflows/validate.yml`.

Главные owner-ы:
- browser session / pause / Pointer Lock → `src/game/session.js`;
- frame loop / boot → `src/game/runtime.js`;
- player/save/weapon ownership → `src/player/state.js`;
- combat/input/projectiles → `src/combat/combat.js`;
- bots/AI → `src/entities/bots.js`;
- pickups → `src/entities/pickups.js`;
- rendering/arena/collision → `src/core/engine.js`;
- asset identity/fallback → `src/assets/catalog.js` + `docs/ASSETS.md`;
- validation/cache build → `scripts/validate-structure.mjs` + `scripts/stamp-web-build.mjs`.

Invariant: один semantic owner на поведение. При extraction переносите behavior + invariants + test/source oracle; не оставляйте дублирующую реализацию.

После runtime/source change: syntax → `stamp-web-build --check` → structure validation → HTTP boot smoke → `file://` browser smoke → exact GitHub Actions result.

Не ослабляйте tests/smoke, не добавляйте catch/suppression ради зелёного CI и не меняйте gameplay balance в чистом refactor без отдельной задачи.
