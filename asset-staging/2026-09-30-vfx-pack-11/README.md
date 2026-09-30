# VFX Pack 11 — staging review (2026-09-30)

Статус: **APPROVED AND INTEGRATED — staging copies retained as provenance**.

Все три файла остаются прозрачными анимированными SVG-preview для provenance. Runtime использует отдельные static-frame SVG sprite atlases в `assets/ui/fx/*-atlas-11.svg`, проигрываемые детерминированно по elapsed time через существующий VFX player.

| Candidate | Почему нужен сейчас | Intended consumer/event | Existing fallback | Planned runtime derivative |
|---|---|---|---|---|
| `rocket-explosion-fireball-vfx-01.svg` | Текущий rocket detonation всё ещё опирается на procedural `explode(...)` + небольшой impact marker; полноценного generated world fireball animation нет. | `src/combat/combat.js::detonateRocket()`, рядом с `spawnCombatImpact(pos,'rocket')` / `explode(...)` | текущий procedural explosion + `assets/fx/rocket-impact.svg` | 4×3 static-frame SVG atlas, 12 frames, one-shot 1.0 s |
| `plasma-impact-ion-bloom-vfx-01.svg` | Plasma уже имеет muzzle discharge и trail, но impact остаётся SVG/procedural и визуально слабее самого projectile. | player bullet impact paths where `weaponImpactType(...)` / wall hit resolve to `plasma` | `assets/fx/plasma-impact.svg` + existing hit particles | 4×3 static-frame SVG atlas, 12 frames, one-shot 0.82 s |
| `plasma-reload-energy-lock-vfx-01.svg` | Reload UI/mag-drop уже есть, но у plasma нет локального first-person energy/chamber completion effect. | `finishPlayerReload(playDone=true)` when current weapon is `plasma` | existing reload HUD art + magazine drop + reloadDone audio | 4×2 static-frame SVG atlas, 8 frames, one-shot 1.05 s, weapon-local DOM overlay |

Review notes:
- файлы не меняют gameplay/state/balance;
- staging не добавлен в catalog и не загружается игрой;
- SVG использует только scriptless declarative animation;
- при интеграции raster VFX будет presentation-only, bounded по количеству одновременных эффектов и с cleanup;
- world effects должны исчезать при off-screen/behind-camera projection и не становиться постоянными WebGL planes без load/error fallback.

Как посмотреть: откройте SVG через GitHub и при необходимости нажмите **Raw** — браузер проиграет встроенную VFX-анимацию на прозрачном фоне.
