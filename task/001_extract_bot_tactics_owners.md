# Task 001 — выделить bounded owner командной/картовой тактики ботов

## WHY

`src/entities/bots.js` сейчас самый крупный source-файл проекта (более 2k строк). Это увеличивает context cost и риск случайно смешивать team planning, individual bot FSM, rendering/animation и combat decisions.

## SCOPE

После fresh inspection найти **один** связный слой командной/картовой тактики (например team plan / doctrine / zone planning и его небольшие pure helpers) и вынести его в отдельный owner, ориентировочно `src/ai/tactics.js`. Имя/граница не предопределены: текущие symbols/reference closure имеют приоритет.

## NON-GOALS

- не дробить весь `bots.js` за одну проходку;
- не менять difficulty, урон, fire rate, aggression, squad size или баланс;
- не переписывать individual bot state machine, IK/visuals и shooting без необходимости для выбранной границы;
- не отключать existing validation/browser smoke.

## INVARIANTS

- Tactical AI 2.x и Frontline/map doctrine должны вести себя как до extraction;
- один canonical owner: старые implementation literals/helpers не остаются продублированными в `bots.js`;
- classic-script dependency order должен быть явным и проверяемым;
- `file://` и HTTP(S) boot остаются зелёными;
- source-oracle/validation переезжает к новому owner-у, а `bots.js` проверяется на delegation/absence of duplicates.

## FILES TO INSPECT

- `src/entities/bots.js` — найти team/map tactics symbols и reference closure;
- `src/game/runtime.js`, `src/ui/minimap.js`, `src/progression/progression.js` — только реальные callers/consumers найденных symbols;
- `scripts/validate-structure.mjs` — существующие AI source assertions;
- `docs/ARCHITECTURE.md` — Tactical AI / Map Tactics sections;
- `index.html`, `scripts/stamp-web-build.mjs`, `.github/workflows/validate.yml`.

## VERIFICATION

1. `node --check` для изменённых/all `src/*.js` через repo-native CI contract.
2. `node scripts/stamp-web-build.mjs --check`.
3. `node scripts/validate-structure.mjs`.
4. HTTP browser boot smoke.
5. Реальный `file://` Chrome/CDP menu smoke.
6. Review: repository-wide reference closure по перенесённым symbols; no duplicate owner.
7. Проверить exact new GitHub Actions run; при failure открыть jobs → failed step → logs → root cause.

## DONE

Один coherent tactical owner выделен с минимальным diff, behavior invariants сохранены, docs/oracles/load graph актуальны, Actions на новом `main` зелёный. После этого удалить этот task и создать один следующий evidence-based task.
