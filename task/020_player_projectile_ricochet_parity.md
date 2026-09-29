# Task 020 — Player projectile ricochet parity and shooting-physics regression

## WHY

Кодревью стрельбы после Task 019 показало конкретную асимметрию: enemy projectile при допустимом shallow-angle ricochet реально отражает velocity, уменьшает speed/damage и продолжает полёт, а player projectile при том же ricochet condition только проигрывает ricochet sound/FX и сразу удаляется. Это визуально обещает физический рикошет, которого у игрока фактически нет.

Это хороший следующий bounded shooting-task: он улучшает физику и реалистичность без случайной перенастройки recoil/spread/damage catalog.

## SCOPE

1. Начать с fresh `main`, `AGENTS.md`, shooting/ballistics architecture/specs и текущего CI.
2. Уточнить canonical ricochet policy и устранить player/enemy semantic drift минимальным diff.
3. Для player projectile при успешном ricochet отражать направление по surface normal, ограничить число рикошетов и детерминированно уменьшать speed/damage energy.
4. Сохранить порядок wall penetration → ricochet → terminal impact и текущие material-specific thresholds/chances, если review не выявит отдельный доказанный bug.
5. Добавить focused deterministic tests для metal/concrete/wood, shallow/steep incidence, one-ricochet cap и damage/speed retention.
6. Обновить shooting spec/architecture/changelog и structural oracles.
7. Выполнить build stamp, full Validate, HTTP + `file://` smoke и ротировать `task/`.

## NON-GOALS

- Без общего rebalance damage/spread/recoil.
- Без изменения weapon catalog только ради «реализма на глаз».
- Без hitscan sniper rewrite.
- Без rocket/grenade physics rewrite.
- Без penetration-system redesign, кроме минимальной общей seam если она нужна для устранения дублирования.

## INVARIANTS

- Wall penetration проверяется раньше ricochet.
- Ricochet возможен только при подтверждённом surface normal и material/angle policy.
- Projectile не может бесконечно рикошетить; cap должен быть явным и regression-covered.
- После ricochet projectile стартует чуть за точкой контакта по отражённому направлению, чтобы не ударить ту же поверхность в следующем frame.
- Speed/damage retention никогда не увеличивают энергию projectile.
- Swept-segment collision остаётся включённым: быстрые пули не должны tunneling через geometry.
- FX/sound не должны заявлять ricochet, если projectile фактически не отразился.

## FILES TO INSPECT

- `src/combat/combat.js`
- `src/weapons/system.js`
- `src/core/engine.js`
- existing shooting/ballistics specs in `docs/specs/`
- `scripts/validate-structure.mjs`
- related shooting tests
- `.github/workflows/validate.yml`

## VERIFICATION

1. Node 22 syntax.
2. Deterministic ricochet-policy unit tests.
3. Swept-collision + penetration/ricochet ordering regression.
4. Structure/owner validation.
5. Build stamp.
6. HTTP browser boot smoke.
7. Real `file://` browser smoke.
8. Exact GitHub Actions head review; merged-main evidence if exposed, otherwise `NOT VERIFIED`.

## DONE

- player ricochet sound/FX matches actual projectile behavior;
- player/enemy ricochet drift is reduced or intentionally documented;
- no penetration/recoil/spread balance drift slipped into the fix;
- regressions pin material/angle/cap/retention semantics;
- docs and structural guards match runtime reality;
- current task is removed and exactly one next evidence-based task is queued.
