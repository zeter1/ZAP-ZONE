# AI / Codex workflow — ZAP ZONE

Цель документа — дать нейросети карту, а не энциклопедию. Подробности живут у доменных owner-ов и в узких specs.

## Старт проходки

Для queued refactor/debug проходки:

1. Fresh `main`: подтвердить branch/head и прочитать один текущий task.
2. Actions preflight: `.github/workflows/validate.yml`, triggers, permissions, последний run.
3. Определить semantic owner и его соседние границы.
4. Прочитать owner + прямые callers + validation/oracles + релевантный узкий spec.
5. Сформулировать behavior invariants и только затем менять код.

Для узкой правки с уже известным owner-ом не открывайте весь стек документации «на всякий случай»: fresh provider state + owner/spec + callers/oracles + применимые gates достаточно. Явная задача пользователя имеет приоритет над очередью `task/`.

## Карта owner-ов

| Домен | Canonical owner | Что не тянуть сюда |
|---|---|---|
| Asset identity / fallback | `src/assets/catalog.js` | gameplay logic |
| Arena / renderer / collision | `src/core/engine.js` | UI/session policy |
| Weapon data / 3D factory | `src/weapons/system.js` | browser lifecycle |
| Projectile ricochet policy / reflection math | `src/combat/projectile-ricochet.js` | swept collision, wall penetration, weapon balance |
| Player/save/weapon state | `src/player/state.js` | Pointer Lock listeners |
| Audio / presentation settings | `src/settings/settings.js` | combat authority |
| Input / combat / projectiles | `src/combat/combat.js` | map-level AI planning |
| Bot progression scaling / HP rescale | `src/ai/bot-progression-scaling.js` | damage/death lifecycle; locomotion; fire execution; weapon data |
| Bot perception / threat sensing | `src/ai/bot-perception.js` | FSM transitions; shooting; navigation physics; squad doctrine |
| Bot damage-event retaliation / memory / reaction timers | `src/ai/bot-damage-reaction.js` | HP mutation; hit presentation; dodge/death lifecycle; perception scans; suppression |
| Bot near-miss suppression response | `src/ai/bot-suppression-response.js` | bullet sweep/near-miss detection; suppression decay; cover scoring; FSM transition selection; damage reaction |
| Bot dodge-response execution / RNG order / optional jump | `src/ai/bot-dodge-response.js` | survived-damage/rocket trigger policy; dodge timer decay; movement consumption; perception/navigation/FSM authority |
| Bot navigation / collision-limited locomotion | `src/ai/bot-navigation.js` | grenade/mine/noise perception; tactical destination scoring; squad doctrine / target policy |
| Bot tactical cover/flank destination scoring | `src/ai/bot-positioning.js` | FSM transitions; cover/peek execution; locomotion mechanics; squad doctrine |
| Bot cover reevaluation / peek / chain / exit execution | `src/ai/bot-cover-execution.js` | cover/flank destination scoring; timer lifecycle; collision-limited locomotion; squad doctrine |
| Bot engage-state movement intent / strafe + range matchups + objective pull | `src/ai/bot-engagement-movement.js` | FSM selection; weapon selection/fire; squad/frontline fact production; cover execution; final navigation/collision |
| Bot weapon selection / hold hysteresis / reselection | `src/ai/bot-weapon-policy.js` | weapon data/scoring; FSM/fire gate; shot execution; visual implementation |
| Bot fire-control execution + closed shot outcome | `src/ai/bot-fire-control.js` | broad fire gate/cadence scheduling; weapon selection; squad doctrine; projectile primitive ownership; movement/recoil state must stay separate |
| Bot outcome-aware burst/cadence + safety retry + RNG ordering | `src/ai/bot-fire-cadence.js` | broad fire gate; constructor/timer lifecycle; shot execution; weapon data |
| Bot individual mine/bomb deployables | `src/ai/bot-deployables.js` | FSM/fire gate; squad smoke/frag doctrine; shared mine/bomb data, limits and player deployables |
| Bot high-level state selection / priority ladder | `src/ai/bot-state-policy.js` | state fact production; stateCD decrement/gate; state movement/combat execution; squad doctrine |
| Squad coordination / Map Tactics / Adaptive Commander | `src/ai/tactics.js` | individual bot FSM/combat execution; perception ownership; Frontline capture/state |
| Frontline objective / capture / save / HUD / marker | `src/game/frontline.js` | map doctrine; individual bot FSM |
| Bot model / hit meshes / weapon arm rig | `src/entities/bot-presentation.js` | AI decisions; locomotion policy; weapon data |
| Individual bot state execution / combat policy | `src/entities/bots.js` | progression-scaling/perception/damage-reaction/suppression-response/dodge-response/navigation/positioning/cover-execution/engagement-movement/weapon-policy/fire-control/fire-cadence/deployables/state-policy implementation; browser/session lifecycle; map-level doctrine, Frontline and presentation ownership |
| Pickups | `src/entities/pickups.js` | player save schema ownership |
| XP/HUD/death/respawn | `src/progression/progression.js` | frame-loop ownership |
| Browser game session | `src/game/session.js` | per-frame simulation |
| Tactical minimap | `src/ui/minimap.js` | collision authority |
| Frame simulation / boot | `src/game/runtime.js` | browser lifecycle listeners |
| Browser/CDP smoke transport/session + per-command timeout/cleanup | `scripts/browser-cdp-session.mjs` | diagnostic severity; HTTP/`file://` product assertions |
| Browser diagnostic severity/format | `scripts/browser-diagnostic-policy.mjs` | target discovery; WebSocket lifecycle; product assertions |

## Ключевые invariants

- Classic-script load order — часть runtime API: dependency должен быть загружен раньше consumer. Текущий участок graph: `combat/projectile-ricochet.js → combat.js → ai/bot-progression-scaling.js → ai/bot-perception.js → ai/bot-damage-reaction.js → ai/bot-suppression-response.js → ai/bot-dodge-response.js → ai/bot-navigation.js → ai/bot-positioning.js → ai/bot-cover-execution.js → ai/bot-engagement-movement.js → ai/bot-weapon-policy.js → ai/bot-fire-control.js → ai/bot-fire-cadence.js → ai/bot-deployables.js → ai/bot-state-policy.js → ai/tactics.js → game/frontline.js → entities/bot-presentation.js → entities/bots.js`. Progression-scaling, perception, damage-reaction, suppression-response, dodge-response, navigation, positioning, weapon-policy, fire-control, fire-cadence, deployables, state-policy, Frontline и bot-presentation — отдельные prerequisites для `bots.js`; каждый имеет собственный owner contract.
- Для одного поведения должен существовать один canonical owner; composition root только оркестрирует.
- Refactor не меняет gameplay balance, если это не отдельная явно поставленная задача.
- `file://` и HTTP(S)/uCoz — два обязательных runtime режима.
- Generated raster/WebP presentation assets остаются DOM/CSS-only; persistent Three.js surfaces не должны снова получать hosting-sensitive image texture-quads.
- Любое изменение `src/**`, `assets/**` или script graph требует актуального `version.json`/cache build через canonical `scripts/stamp-web-build.mjs`.
- Source-regex/structural oracle после extraction должен переехать к новому owner-у; не возвращайте старую реализацию ради regex.

## Маршрутизация документации

- assets / generated art / uCoz / fallback → `docs/ASSETS.md`;
- firearm projectile ricochet / angle chance / retention / bounce cap → `docs/specs/PROJECTILE_RICOCHET.md` → `src/combat/projectile-ricochet.js` → `src/combat/combat.js`;
- architecture ownership / session / weapon lifecycle / AI invariants → нужный раздел `docs/ARCHITECTURE.md`;
- Frontline objective/capture/save/HUD/marker → `docs/specs/FRONTLINE.md` → `src/game/frontline.js` → конкретный consumer;
- bot level/kills/role stat scaling / HP rescale / caps+floors → `docs/specs/BOT_PROGRESSION_SCALING.md` → `src/ai/bot-progression-scaling.js` → `Enemy.syncScale()` consumer;
- bot perception / combat-noise hearing / target acquisition / LOS memory / grenade+mine+rocket sensing → `docs/specs/BOT_PERCEPTION.md` → `src/ai/bot-perception.js` → `src/entities/bots.js` consumer;
- bot damage-event retaliation / source semantics / target memory+lock / reaction timers → `docs/specs/BOT_DAMAGE_REACTION.md` → `src/ai/bot-damage-reaction.js` → `Enemy.hurt()` consumer;
- bot near-miss suppression / pressure clamp / cover+FSM timer response → `docs/specs/BOT_SUPPRESSION_RESPONSE.md` → `src/ai/bot-suppression-response.js` → `Enemy.registerSuppression()` consumer → `src/combat/combat.js` producer;
- bot dodge execution / RNG order / urgency clamps / optional jump → `docs/specs/BOT_DODGE_RESPONSE.md` → `src/ai/bot-dodge-response.js` → `Enemy.triggerDodge()` seam → damage/rocket producers;
- bot navigation / collision micro-steps / smoke route / speed caps → `docs/specs/BOT_NAVIGATION.md` → `src/ai/bot-navigation.js` → `src/entities/bots.js` consumer;
- bot cover reevaluation / peek-side probing / LOS+smoke acceptance / peek envelope / cover chain+exit → `docs/specs/BOT_COVER_EXECUTION.md` → `src/ai/bot-cover-execution.js` → `src/entities/bots.js` consumer;
- bot engage strafe / role+opponent range matchup / Frontline pull / close-far pressure → `docs/specs/BOT_ENGAGEMENT_MOVEMENT.md` → `src/ai/bot-engagement-movement.js` → `src/entities/bots.js` consumer;
- bot weapon selection / switch timer / hold hysteresis / unsafe-range reselection → `docs/specs/BOT_WEAPON_POLICY.md` → `src/ai/bot-weapon-policy.js` → `src/entities/bots.js` consumer;
- bot fire-control / aim / muzzle / reload / measured movement stability / emitted-shot recoil / concrete outcome / blocked-shot trace endpoint → `docs/specs/BOT_FIRE_CONTROL.md` → `docs/patterns/OCCLUSION_CONSISTENT_PRESENTATION.md` for wall/smoke presentation seams or `docs/patterns/COMPOSED_FIRE_STABILITY.md` for stability channels → `src/ai/bot-fire-control.js`;
- nearest opaque-wall hit distance / boolean wall visibility fact → `docs/patterns/OCCLUSION_CONSISTENT_PRESENTATION.md` → `src/core/engine.js`; consumers must reuse the geometry fact rather than introduce a second raycast owner;
- bot attempt-vs-emitted / safety-block retry / burst/cadence / exact RNG order / next-attempt timer → `docs/specs/BOT_FIRE_CADENCE.md` → `docs/patterns/OUTCOME_DRIVEN_CADENCE.md` → `src/ai/bot-fire-cadence.js` → `src/entities/bots.js` consumer;
- bot mine/bomb eligibility / role+doctrine probability / deployment side effects → `docs/specs/BOT_DEPLOYABLES.md` → `src/ai/bot-deployables.js` → `src/entities/bots.js` consumer;
- bot high-level state selection / transition priority / threshold edges / stateCD RNG → `docs/specs/BOT_STATE_POLICY.md` → `src/ai/bot-state-policy.js` → gated caller seam in `src/entities/bots.js`;
- bot geometry / hit meshes / weapon grips / two-hand arm rig → `docs/specs/BOT_PRESENTATION.md` → `src/entities/bot-presentation.js` → `src/entities/bots.js` consumer;
- browser/CDP target discovery / WebSocket / request multiplexing / bounded command waits + pending cleanup / shared diagnostic plumbing → `docs/patterns/CDP_SMOKE_SESSION_OWNER.md` → `scripts/browser-cdp-session.mjs` → concrete smoke;
- browser diagnostic severity / fatal-vs-warning policy → `docs/patterns/BROWSER_RUNTIME_ERROR_ORACLE.md` → `scripts/browser-diagnostic-policy.mjs`; session owner only transports and records this policy;
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

## GitHub Actions dependency identity

- В `.github/workflows/*` внешние `uses:` refs закрепляйте на проверенные полные 40-символьные commit SHA; рядом сохраняйте читаемый release tag-комментарий (например, `# v7.0.1`) для аудита.
- При upgrade сначала сверяйте официальный upstream release/tag → full SHA и metadata `action.yml`; для JavaScript Action после удаления Node 20 подтверждайте `runs.using: node24` у выбранного релиза.
- Не смешивайте **Action runtime** и **project runtime**: upgrade checkout/setup-* ради Node 24 не означает, что `node-version` проекта надо менять. Project runtime повышается только отдельным evidence-based change.
- Для `setup-node` отдельно проверяйте breaking changes кеширования/registry auth. Не добавляйте package-manager cache, lockfile или auth-настройки в проект, который их не использует; если auto-cache реально может включиться и не нужен, задайте явный безопасный opt-out.
- Workflow change считается high-risk: сохраняйте least privilege и после первой записи проверяйте exact PR run на exact head, затем читайте job-log. Regression oracle для runtime migration — прежний warning должен исчезнуть, а существующие gates должны остаться зелёными без suppression.

## Verification matrix

| Изменение | Минимум проверки |
|---|---|
| docs/task only | ссылки/пути/актуальность owner map |
| `src/**` | Node syntax + build stamp + structure validation + browser smoke |
| Projectile ricochet / ballistic bounce | `node --test scripts/projectile-ricochet.test.mjs` + penetration-before-ricochet guard + build stamp + dual-runtime smoke |
| session/menu | structure owner guard + HTTP boot + реальный `file://` Chrome/CDP smoke |
| browser/CDP session transport | `node --test scripts/browser-cdp-session.test.mjs` + diagnostic-policy regression + both real HTTP/`file://` smokes; consumers must not recreate WebSocket/request/diagnostic plumbing |
| browser/CDP diagnostic policy | `node --test scripts/browser-diagnostic-policy.test.mjs` + affected real HTTP/`file://` smoke; severity remains single-owner, fatal diagnostics must be empty before success, warnings stay observable |
| assets | `docs/ASSETS.md` contract + binary/signature/wiring validation + dual-runtime smoke |
| AI behavior | focused invariants + owner/consumer structure guards + runtime smoke; не маскировать balance change как refactor |
| Frontline objective | `node --test scripts/frontline-owner.test.mjs` + structure owner guards + build stamp + dual-runtime smoke |
| Bot presentation / arm rig | `node --test scripts/bot-presentation-owner.test.mjs` + owner/consumer guards + build stamp + dual-runtime smoke |
| Bot progression scaling | `node --test scripts/bot-progression-scaling-owner.test.mjs` + formula/cap/role/HP-rescale + owner/consumer/reverse/load-order guards + build stamp + dual-runtime smoke |
| Bot perception / threat sensing | `node --test scripts/bot-perception-owner.test.mjs` + owner/consumer/reverse guards + build stamp + dual-runtime smoke |
| Bot damage-reaction policy | `node --test scripts/bot-damage-reaction-owner.test.mjs` + exact-threshold/source/event-order guards + build stamp + dual-runtime smoke |
| Bot suppression-response policy | `node --test scripts/bot-suppression-response-owner.test.mjs` + source/clamp/strict-threshold + producer/consumer/reverse guards + build stamp + dual-runtime smoke |
| Bot dodge-response execution | `node --test scripts/bot-dodge-response-owner.test.mjs` + controlled-RNG/producer/consumer/reverse/load-order guards + build stamp + dual-runtime smoke |
| Bot navigation / locomotion | `node --test scripts/bot-navigation-owner.test.mjs` + reverse-owner guards + build stamp + dual-runtime smoke |
| Bot weapon-selection policy | `node --test scripts/bot-weapon-policy-owner.test.mjs` + owner/consumer/reverse guards + build stamp + dual-runtime smoke |
| Bot fire-control execution | `node --test scripts/bot-fire-control-owner.test.mjs` + owner/consumer/reverse guards + build stamp + dual-runtime smoke |
| Bot post-shot fire cadence | `node --test scripts/bot-fire-cadence-owner.test.mjs` + controlled-RNG/owner/consumer/reverse/order/load guards + build stamp + dual-runtime smoke |
| Bot individual deployables | `node --test scripts/bot-deployables-owner.test.mjs` + owner/consumer/reverse guards + random/side-effect order + build stamp + dual-runtime smoke |
| workflow | YAML intent + least privilege + один новый run и его logs при failure |

## Task discipline

`task/README.md` — инструкция очереди. Каждый pending task — отдельный `.md`; выполненный task удаляется в той же проходке. В конце создаётся только evidence-based следующий bounded task, а не длинный wishlist.


## Pattern routing — browser runtime diagnostics

Если задача касается target discovery, WebSocket lifecycle, CDP request/response plumbing или общей diagnostic collection, сначала читать `docs/patterns/CDP_SMOKE_SESSION_OWNER.md`: transport owner — `scripts/browser-cdp-session.mjs`, а HTTP и `file://` consumers держат только свои product assertions. Если меняется severity/fatal-vs-warning semantics, затем читать `docs/patterns/BROWSER_RUNTIME_ERROR_ORACLE.md`; policy owner — `scripts/browser-diagnostic-policy.mjs`, и transport helper не должен дублировать классификатор.

Короткий read-set: `task/*.md → CDP_SMOKE_SESSION_OWNER.md → browser-cdp-session.mjs → BROWSER_RUNTIME_ERROR_ORACLE.md (только для severity/diagnostics) → конкретный smoke → Validate block`.

## Pattern routing — measured runtime facts

Если новое поведение зависит от движения, collision result, velocity, resolved target state или другого runtime-факта, не создавайте второй source of truth по AI-state/intent. Сначала найдите canonical producer измеренного состояния, затем передайте его одному semantic owner-у policy. Для frame-rate-independent attack/recovery и RNG-safe composition используйте `docs/patterns/MEASURED_RUNTIME_STATE.md`.

Короткий read-set для таких задач: `task/*.md → AGENTS.md route → owner spec → measured-state producer → owner code → direct consumer/test oracle`. Repo-wide чтение «на всякий случай» не требуется.
