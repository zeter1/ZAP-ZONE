# Frontline objective — owner/spec

Открывать этот документ **только** когда задача касается зоны Frontline, capture/rotation, objective save/restore, objective HUD/marker, minimap objective state или их интеграции с AI.

## 1. Canonical ownership

| Responsibility | Owner |
|---|---|
| zone geometry / weights / map doctrine | `src/ai/tactics.js` (`BOT_MAP_ZONES`) |
| objective state, capture, rotation, control scores | `src/game/frontline.js` |
| Frontline serialize/reset/restore | `src/game/frontline.js` |
| world objective marker + objective HUD | `src/game/frontline.js` |
| individual bot perception/FSM/locomotion/combat | `src/entities/bots.js` |
| tactical minimap rendering | `src/ui/minimap.js` |
| frame scheduling | `src/game/runtime.js` |
| player save envelope | `src/player/state.js` |

**Rule:** упоминание `frontlineObjective` в consumer не делает consumer owner-ом. Новый mutable Frontline state нельзя добавлять в bots/runtime/minimap/state без явной смены архитектуры.

## 2. Classic-script load contract

`combat.js → ai/tactics.js → game/frontline.js → entities/bots.js`

Evaluation-time Frontline создаёт `frontlineZoneOwners` из `BOT_MAP_ZONES`, поэтому tactics обязан загрузиться раньше. Bot execution читает objective state, поэтому bots загружается после Frontline. Вызовы Frontline происходят после последовательного bootstrap, поэтому effectful bot/player/runtime функции могут оставаться invocation-time dependencies без дублирования ownership.

## 3. Public state and operations

Canonical public classic-script seam:
- `FRONTLINE_CFG`;
- `frontlineObjective`;
- `frontlineZoneOwners`;
- `frontlineZone()`;
- `serializeFrontlineObjective()`;
- `resetFrontlineObjective()`;
- `restoreFrontlineObjective()`;
- `ensureFrontlineMarker()` / `updateFrontlineMarker()`;
- `updateFrontlineHUD()`;
- `tickFrontlineObjective()`.

Consumers должны использовать этот seam, а не заводить собственную копию zone/progress/owner/control-score.

## 4. Persisted schema

`serializeFrontlineObjective()` возвращает:
- `zoneId`;
- `progress` в диапазоне -100…100;
- `owner`: `ally | enemy | null`;
- `rotateT`;
- `zoneOwners`;
- `allyControlScore`;
- `enemyControlScore`.

`player/state.js` хранит этот объект внутри save v27. Restore обязан санитизировать повреждённые/старые данные и сохранять текущие clamp semantics.

## 5. Balance invariants for refactors

Pure ownership/refactor **не меняет**:
- rotation: 44 s;
- capture: 8.5 s;
- capture score multiplier: 3 points;
- player assist reward: +150 score / +35 XP;
- presence delta clamp ±2.5;
- neutral decay, owner rules, announcements/audio/save order;
- HUD text and capture-state thresholds.

Изменение этих значений — отдельный gameplay/balance change с отдельной задачей, тестом и changelog rationale.

## 6. Consumer map

- `src/ai/tactics.js`: читает `frontlineZone()` для map-order bias.
- `src/entities/bots.js`: читает active zone/presence/owner для cover, flank и objective urgency; `updateTeamScore()` комбинирует kill score с Frontline control score.
- `src/player/state.js`: вызывает serialize/restore.
- `src/game/runtime.js`: вызывает `tickFrontlineObjective()`, boot marker/HUD.
- `src/ui/minimap.js`: read-only визуализация `frontlineObjective` и `frontlineZoneOwners`.

## 7. Safe change pattern

Перед изменением: owner → direct consumers → `scripts/frontline-owner.test.mjs` → Frontline guards в `scripts/validate-structure.mjs` → load graph в `index.html`.

При extraction/rewrite отдельно проверить semantic drift: guards, clamp/default semantics, side-effect order, rewards, save timing, shared mutable identity и invocation-time dependencies. Не добавлять optional fallback/broad catch только ради «безопасности», если старый контракт был strict.

## 8. Verification

Для любого source change:
1. `node --check` для `src/**/*.js` и validation/test scripts;
2. `node --test scripts/frontline-owner.test.mjs`;
3. `node scripts/stamp-web-build.mjs --check`;
4. `node scripts/validate-structure.mjs`;
5. HTTP Chrome boot smoke;
6. реальный `file://` Chrome/CDP menu smoke;
7. exact GitHub Actions run на изменённом SHA.

Если direct behavior test зелёный, а source-regex oracle падает после чистого move, сначала классифицировать stale structural oracle; не возвращать дублирующую implementation в старый owner ради regex.
