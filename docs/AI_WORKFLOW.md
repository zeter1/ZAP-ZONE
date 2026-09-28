# AI / Codex workflow — ZAP ZONE

Цель документа — дать нейросети карту, а не энциклопедию. Подробности живут у доменных owner-ов и в узких specs.

## Старт проходки

1. Fresh `main`: подтвердить branch/head и прочитать текущий task.
2. Actions preflight: `.github/workflows/validate.yml`, triggers, permissions, последний run.
3. Определить semantic owner и его соседние границы.
4. Прочитать owner + прямые callers + validation/oracles + релевантный раздел документации.
5. Сформулировать behavior invariants и только затем менять код.

## Карта owner-ов

| Домен | Canonical owner | Что не тянуть сюда |
|---|---|---|
| Asset identity / fallback | `src/assets/catalog.js` | gameplay logic |
| Arena / renderer / collision | `src/core/engine.js` | UI/session policy |
| Weapon data / 3D factory | `src/weapons/system.js` | browser lifecycle |
| Player/save/weapon state | `src/player/state.js` | Pointer Lock listeners |
| Audio / presentation settings | `src/settings/settings.js` | combat authority |
| Input / combat / projectiles | `src/combat/combat.js` | map-level AI planning |
| Bot navigation / collision-limited locomotion | `src/ai/bot-navigation.js` | grenade/mine/noise perception; squad doctrine / target policy |
| Squad coordination / Map Tactics / Adaptive Commander | `src/ai/tactics.js` | individual bot FSM/perception/combat execution; Frontline capture/state |
| Frontline objective / capture / save / HUD / marker | `src/game/frontline.js` | map doctrine; individual bot FSM |
| Bot model / hit meshes / weapon arm rig | `src/entities/bot-presentation.js` | AI decisions; locomotion policy; weapon data |
| Individual bot perception / FSM / combat execution | `src/entities/bots.js` | browser/session lifecycle; navigation implementation, map-level doctrine, Frontline and presentation ownership |
| Pickups | `src/entities/pickups.js` | player save schema ownership |
| XP/HUD/death/respawn | `src/progression/progression.js` | frame-loop ownership |
| Browser game session | `src/game/session.js` | per-frame simulation |
| Tactical minimap | `src/ui/minimap.js` | collision authority |
| Frame simulation / boot | `src/game/runtime.js` | browser lifecycle listeners |

## Ключевые invariants

- Classic-script load order — часть runtime API: dependency должен быть загружен раньше consumer. Текущий участок graph: `combat.js → ai/bot-navigation.js → ai/tactics.js → game/frontline.js → entities/bot-presentation.js → entities/bots.js`. Navigation, Frontline и bot-presentation — отдельные prerequisites для `bots.js`; каждый имеет собственный owner contract.
- Для одного поведения должен существовать один canonical owner; composition root только оркестрирует.
- Refactor не меняет gameplay balance, если это не отдельная явно поставленная задача.
- `file://` и HTTP(S)/uCoz — два обязательных runtime режима.
- Generated raster/WebP presentation assets остаются DOM/CSS-only; persistent Three.js surfaces не должны снова получать hosting-sensitive image texture-quads.
- Любое изменение `src/**`, `assets/**` или script graph требует актуального `version.json`/cache build через canonical `scripts/stamp-web-build.mjs`.
- Source-regex/structural oracle после extraction должен переехать к новому owner-у; не возвращайте старую реализацию ради regex.

## Маршрутизация документации

- assets / generated art / uCoz / fallback → `docs/ASSETS.md`;
- architecture ownership / session / weapon lifecycle / AI invariants → нужный раздел `docs/ARCHITECTURE.md`;
- Frontline objective/capture/save/HUD/marker → `docs/specs/FRONTLINE.md` → `src/game/frontline.js` → конкретный consumer;
- bot navigation / collision micro-steps / smoke route / speed caps → `docs/specs/BOT_NAVIGATION.md` → `src/ai/bot-navigation.js` → `src/entities/bots.js` consumer;
- bot geometry / hit meshes / weapon grips / two-hand arm rig → `docs/specs/BOT_PRESENTATION.md` → `src/entities/bot-presentation.js` → `src/entities/bots.js` consumer;
- cache-busting / ручная публикация → README + `scripts/stamp-web-build.mjs`;
- CI failure → `.github/workflows/validate.yml`, затем failed job/step/log;
- следующий небольшой кусок работы → `task/`.

## Рабочий цикл

`INSPECT → DIAGNOSE → PLAN → CHANGE → VERIFY → REVIEW → DELIVER`

- **INSPECT:** fresh provider state, owner, callers, workflow, task.
- **DIAGNOSE:** root cause / architectural seam / behavioral invariants.
- **PLAN:** один bounded diff и явные non-goals.
- **CHANGE:** минимальный перенос/исправление + oracle migration + docs.
- **VERIFY:** syntax/structural/build-stamp → browser runtime → GitHub Actions.
- **REVIEW:** duplicate owners, stale docs/tests, accidental behavior/balance changes, cache/build parity.
- **DELIVER:** только после evidence; если слой не проверен — отметить `NOT VERIFIED`.

## Verification matrix

| Изменение | Минимум проверки |
|---|---|
| docs/task only | ссылки/пути/актуальность owner map |
| `src/**` | Node syntax + build stamp + structure validation + browser smoke |
| session/menu | structure owner guard + HTTP boot + реальный `file://` Chrome/CDP smoke |
| assets | `docs/ASSETS.md` contract + binary/signature/wiring validation + dual-runtime smoke |
| AI behavior | focused invariants + owner/consumer structure guards + runtime smoke; не маскировать balance change как refactor |
| Frontline objective | `node --test scripts/frontline-owner.test.mjs` + structure owner guards + build stamp + dual-runtime smoke |
| Bot presentation / arm rig | `node --test scripts/bot-presentation-owner.test.mjs` + owner/consumer guards + build stamp + dual-runtime smoke |
| Bot navigation / locomotion | `node --test scripts/bot-navigation-owner.test.mjs` + reverse-owner guards + build stamp + dual-runtime smoke |
| workflow | YAML intent + least privilege + один новый run и его logs при failure |

## Task discipline

`task/README.md` — инструкция очереди. Каждый pending task — отдельный `.md`; выполненный task удаляется в той же проходке. В конце создаётся только evidence-based следующий bounded task, а не длинный wishlist.
