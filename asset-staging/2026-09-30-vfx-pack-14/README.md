# VFX Pack 14 — staging archive (2026-09-30)

Статус: **APPROVED AND INTEGRATED — staging copies retained as provenance**.

Оба source-candidate одобрены и подключены в игру. Staging SVG остаются архивными preview/source-файлами и **не загружаются runtime**.

| Candidate | Runtime consumer/event | Existing fallback retained | Integrated runtime derivative |
|---|---|---|---|
| `critical-hit-overcharge-burst-vfx-01.svg` | `src/combat/combat.js::resolvePlayerBulletHit()` при реальном `isCrit` после procedural critical impact | procedural `spawnCombatImpact(...,'critical')` + crit SFX/hitmarker/medal | row 0 в `assets/ui/fx/player-feedback-vfx-atlas-14.svg`, 8 deterministic frames, ~0.70 s, world-projected DOM VFX |
| `player-armor-break-shatter-vfx-01.svg` | централизованный переход `armorBefore > 0 && armor <= 0` через `src/progression/progression.js::showArmorBreakFx()` | `showArmorHitFx(amount)` + existing armor-break HUD art | row 1 того же 8×2 atlas, 8 deterministic frames, ~0.90 s, screen-local DOM VFX |

## Integrated runtime result

Runtime derivative: `assets/ui/fx/player-feedback-vfx-atlas-14.svg` — scriptless 8×2 static-frame SVG atlas, 16 frames total.

Playback:
- elapsed-time based through the existing bounded `playGeneratedCombatVfx(...)` pipeline;
- critical hit uses world projection, off-screen hiding, short throttle and small rotation/scale variation;
- armor break uses a screen-local shield-shatter while keeping HUD/reticle authoritative;
- mobile shares the existing VFX budget and receives a reduced presentation size.

Gameplay invariants:
- critical chance/multiplier are unchanged;
- armor absorption and HP damage are unchanged;
- no new hitbox, projectile, physics or timing state was added;
- procedural/UI fallbacks remain active;
- runtime never imports `asset-staging/**`.

Как посмотреть исходники: откройте SVG через GitHub и нажмите **Raw** — staging preview анимируется на прозрачном фоне.
