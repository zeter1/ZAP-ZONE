# Generated VFX Pack 16 — review before runtime integration

**Status:** `PENDING REVIEW` / not imported by runtime  
**Date:** 2026-09-30  
**Asset count:** 3

Этот batch выбран после duplicate gate по интегрированным Packs 4–15 и по текущим consumer/callsite в `main`. Все три файла — прозрачные scriptless animated SVG source-candidates. Они лежат только в `asset-staging/` и не должны импортироваться из `src/**`, `index.html`, runtime CSS или `assets/**` до отдельного одобрения пользователя.

## 1. `bot-plasma-muzzle-ion-burst-vfx-01.svg`

Короткий направленный ion/plasma discharge: white-hot core, cyan energy plume, expanding ring, lightning tendrils and fast sparks.

**Почему нужен сейчас:** Pack 13 уже добавил generated muzzle blast для ботов, но `showGeneratedBotMuzzleVfx(...)` намеренно возвращает `false` для `plasma`. Поэтому bot-plasma shot визуально слабее player plasma и всё ещё опирается только на procedural `trigMuzzle(...)`.

**Intended consumer after approval:** `src/ai/bot-fire-control.js::executeBotShot()` на уже существующем authoritative shot event, рядом с `trigMuzzle(from, ...)` / `showGeneratedBotMuzzleVfx(from, bot)`, только когда `bot.weapon.key === 'plasma'`.

**Fallback that must remain:** procedural `trigMuzzle(...)`, plasma shot audio, projectile/tracer logic and the existing plasma projectile trail.

**Planned runtime derivative:** 8 deterministic static frames in a shared Pack 16 atlas, one-shot ~0.50–0.60 s, world-projected at the real bot muzzle position, yaw-oriented, bounded/throttled like Pack 13. No cadence, accuracy, projectile, damage or hit logic changes.

## 2. `bot-dodge-kinetic-skid-vfx-01.svg`

Ground-level kinetic skid: asymmetric dust fan, small debris, cyan speed slashes and decaying grit. It is deliberately not a jetpack/thruster so the effect does not invent equipment the bot model does not have.

**Почему нужен сейчас:** bot dodge already has authoritative lateral motion/jump in `src/ai/bot-dodge-response.js::applyBotDodgeResponse()`, but there is no generated visual confirmation when a dodge successfully starts. During multi-bot firefights the movement can read as an abrupt strafe rather than an intentional evasive action.

**Intended consumer after approval:** successful transition from idle dodge state to `bot.dodgeT > 0`, exposed from `Bot.triggerDodge(...)` / `applyBotDodgeResponse(...)`. Emit once at dodge start, never every update tick.

**Fallback that must remain:** actual bot lateral movement/jump and existing animation/presentation; the VFX is decoration only.

**Planned runtime derivative:** 8 static frames, one-shot ~0.75–0.90 s, projected near bot feet, mirrored/rotated from `dodgeDir` and heading, with small seeded scale variation. No dodge duration/speed/cooldown/RNG policy changes.

## 3. `bot-spawn-materialization-vfx-01.svg`

Short respawn materialization: ground ring, vertical scan columns, holographic rings, pixels/particles and a quick collapse into residual haze.

**Почему нужен сейчас:** runtime periodically replaces dead bots every ~1.7–2.7 seconds and `spawnBot(team)` currently constructs/pushes a new `Enemy` immediately. There is no generated entry VFX, so a nearby replacement bot can visually pop into existence. Player respawn already has dedicated presentation, making this gap more noticeable.

**Intended consumer after approval:** `src/entities/bots.js::spawnBot(team)` immediately after the new `Enemy` is created and added. Prefer respawn/replacement spawns only; initial match population can skip the effect to avoid a large simultaneous burst.

**Fallback that must remain:** immediate procedural bot model spawn and all current spawn-point/team-count logic.

**Planned runtime derivative:** 8 deterministic static frames, one-shot ~1.10–1.25 s, world-projected at the real spawn position, hidden off-screen/behind camera and sharing the bounded generated VFX budget. No invulnerability, spawn timing, position or team logic changes.

## Browser/VFX implementation notes

- The staging SVGs are review/source animation, not gameplay-time authority.
- After approval, extract/author deterministic static frames and advance them by elapsed time, matching Packs 10–15 so animation speed is stable at 60/120/144 Hz.
- Keep runtime generated presentation out of persistent Three.js texture planes/sprites; reuse the existing DOM-projected bounded VFX layer and procedural fallbacks.
- No scripts, remote resources, fonts or external URLs are embedded in these SVGs.
- Runtime integration should remain a separate atomic change with catalog metadata, consumer wiring, regression coverage where appropriate, build stamp and exact-SHA CI verification.

## Review checklist

- [ ] Plasma muzzle reads as plasma and is visually distinct from orange ballistic muzzle VFX.
- [ ] Dodge effect reads as a fast ground skid, not an explosion or jetpack.
- [ ] Spawn materialization hides bot pop-in without obscuring a whole firefight.
- [ ] All three remain readable over bright and dark arena backgrounds.
- [ ] No effect contains baked text, UI, character anatomy or opaque background.
- [ ] User approved runtime integration.

Как посмотреть анимацию: откройте SVG на GitHub и нажмите **Raw** — браузер проиграет scriptless loop на прозрачном фоне.
