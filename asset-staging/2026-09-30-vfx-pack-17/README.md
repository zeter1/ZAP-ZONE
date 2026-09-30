# Generated VFX Pack 17 — review before runtime integration

**Status:** `AWAITING USER REVIEW` / NOT INTEGRATED  
**Date:** 2026-09-30  
**Asset count:** 3

Этот batch создан после duplicate gate по интегрированным Packs 4–16, runtime-файлам `assets/ui/**` и текущим consumer/callsite в `main`. Все три файла — прозрачные scriptless animated SVG source-candidates. Они лежат только в `asset-staging/` и **не подключены к игре** до отдельного одобрения пользователя.

## 1. `bot-reload-mag-lock-vfx-01.svg`

Короткий world-space сигнал перезарядки бота: вращающиеся lock-arcs, inward mechanical brackets, magazine drop silhouette, white-hot confirmation core и небольшие электрические/металлические искры.

**Почему нужен сейчас:** `src/ai/bot-fire-control.js::startBotReload()` сейчас меняет authoritative `reloadT` и проигрывает mechanic sound, но не имеет generated visual hook. В бою бот перестаёт стрелять без читаемого визуального признака, особенно на средней дистанции.

**Intended consumer after approval:** ровно переход `reloadT <= 0 → reloadT > 0` внутри `startBotReload(bot)`. Эффект запускается один раз на старт reload, а не каждый update tick.

**Fallback that must remain:** существующий `reloadT`, запрет стрельбы во время reload, `playWeaponMechanicSound('reload', ...)`, procedural bot/weapon model.

**Planned runtime derivative:** row 0 shared Pack 17 static-frame atlas, 8 deterministic frames, one-shot примерно 0.55–0.75 s, world-projected рядом с оружием/верхней частью корпуса, hidden off-screen/behind camera. Никаких изменений reload duration, ammo, fire cadence или RNG.

## 2. `bot-hit-kinetic-spark-vfx-01.svg`

Небольшой directional kinetic impact: бело-жёлто-оранжевый contact core, expanding ring, fan sparks, micro-shards и пара холодных armor flecks.

**Почему нужен сейчас:** обычное нелетальное попадание по боту в `Bot.damage(...)` в основном читается через короткий красный emissive flash. Отдельные generated VFX уже есть для armor rupture/death, critical feedback и wall/material impacts, но нет компактного VFX для частого обычного hit по живому боту.

**Intended consumer after approval:** после authoritative damage application только когда бот остаётся жив (`hp > 0`), с world anchor около torso и направлением от уже доступного incoming `dir`. Для lethal hit Pack 13 death effect остаётся основным и не должен получать лишний stacking.

**Fallback that must remain:** текущий emissive red flash, existing hitmarker/audio/player feedback, damage/reaction/dodge logic и death VFX.

**Planned runtime derivative:** row 1 shared Pack 17 atlas, 8 deterministic frames, one-shot примерно 0.30–0.45 s, небольшой scale, per-bot throttling/budget reuse. Никаких изменений damage, armor, dodge probability или AI.

## 3. `pickup-collection-collapse-vfx-01.svg`

Короткий «collection collapse»: hex/ring shell стягивается в центр, world beacon energy собирается в white-hot core, затем остаётся лёгкий upward data-spark. Палитра намеренно универсальная cyan/white с небольшими gold/green accents, чтобы один asset подходил оружию, боеприпасам и аптечке.

**Почему нужен сейчас:** pickups уже имеют procedural/generated world art, beacon и HUD notification, но успешный collection в `src/entities/pickups.js::tickPickups()` визуально заканчивается мгновенным `pk.m.visible=false`. Отдельного world-space VFX на сам факт успешного подбора нет.

**Intended consumer after approval:** только после успешного `grantWeapon(...)` или фактического HP/armor gain, непосредственно перед/рядом с скрытием pickup. Anchor берётся из реальной `pk.m.position`; failed/full pickup не запускает эффект.

**Fallback that must remain:** мгновенное исчезновение pickup, `showPickupNotification(...)`, procedural/generated pickup model/beacon и текущая respawn/economy logic.

**Planned runtime derivative:** row 2 shared Pack 17 atlas, 8 deterministic frames, one-shot примерно 0.60–0.80 s, world projection at pickup position, bounded by the existing generated VFX budget. Никаких изменений grant amount, respawn timer или pickup eligibility.

## Browser/VFX implementation notes

- Staging SVGs — visual review/source loops, а не gameplay-time authority.
- После одобрения предпочтительный derivative для этой геометрической графики: один scriptless static SVG atlas `assets/ui/fx/interaction-vfx-atlas-17.svg`, 8 columns × 3 semantic rows. Если screenshot/perf gate покажет преимущество raster, допустим alpha-WebP derivative.
- Runtime frame index должен считаться по elapsed time/authoritative event state, а не по числу callbacks.
- Generated VFX остаётся presentation-only: не создавать persistent Three.js generated texture planes/sprites; использовать существующий bounded DOM world-projection path и procedural fallbacks.
- В SVG нет scripts, remote resources, embedded fonts, text labels или opaque background.
- Интеграция после одобрения должна быть отдельным atomic change с catalog metadata, consumer wiring, regression/structure checks, build stamp и exact-SHA CI verification.

## Review checklist

- [ ] Reload VFX читается как weapon/mechanical reload signal, а не как shield/spawn effect.
- [ ] Hit VFX достаточно компактный и не выглядит как explosion/critical/death.
- [ ] Pickup collapse читается как успешное collection/disappearance, а не respawn.
- [ ] Все три эффекта читаемы на тёмном и светлом фоне.
- [ ] Нет baked text/UI/opaque background.
- [ ] Пользователь одобрил runtime integration.

Как посмотреть анимацию: откройте SVG на GitHub и нажмите **Raw** — браузер проиграет scriptless loop на прозрачном фоне.
