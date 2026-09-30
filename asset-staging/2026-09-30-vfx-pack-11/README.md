# VFX Pack 11 — staging review (2026-09-30)

Статус: **SOURCE CANDIDATES ONLY — NOT WIRED INTO THE GAME**.

Все три файла — прозрачные анимированные SVG-preview. Их задача сейчас — визуальный review. После одобрения они будут sampled/rasterized в компактные alpha-WebP sprite sheets с детерминированным playback по elapsed time.

| Candidate | Почему нужен сейчас | Intended consumer/event | Existing fallback | Planned runtime derivative |
|---|---|---|---|---|
| `rocket-explosion-fireball-vfx-01.svg` | Текущий rocket detonation всё ещё опирается на procedural `explode(...)` + небольшой impact marker; полноценного generated world fireball animation нет. | `src/combat/combat.js::detonateRocket()`, рядом с `spawnCombatImpact(pos,'rocket')` / `explode(...)` | текущий procedural explosion + `assets/fx/rocket-impact.svg` | 4×4 alpha-WebP, ~12–16 frames, one-shot ~0.9–1.1 s |
| `plasma-impact-ion-bloom-vfx-01.svg` | Plasma уже имеет muzzle discharge и trail, но impact остаётся SVG/procedural и визуально слабее самого projectile. | player bullet impact paths where `weaponImpactType(...)` / wall hit resolve to `plasma` | `assets/fx/plasma-impact.svg` + existing hit particles | 4×4 alpha-WebP, ~10–14 frames, one-shot ~0.7–0.9 s |
| `plasma-reload-energy-lock-vfx-01.svg` | Reload UI/mag-drop уже есть, но у plasma нет локального first-person energy/chamber completion effect. | `finishPlayerReload(playDone=true)` when current weapon is `plasma` | existing reload HUD art + magazine drop + reloadDone audio | 4×2 or 4×4 alpha-WebP, one-shot ~0.8–1.1 s, weapon-local DOM overlay |

Review notes:
- файлы не меняют gameplay/state/balance;
- staging не добавлен в catalog и не загружается игрой;
- SVG использует только scriptless declarative animation;
- при интеграции raster VFX будет presentation-only, bounded по количеству одновременных эффектов и с cleanup;
- world effects должны исчезать при off-screen/behind-camera projection и не становиться постоянными WebGL planes без load/error fallback.

Как посмотреть: откройте SVG через GitHub и при необходимости нажмите **Raw** — браузер проиграет встроенную VFX-анимацию на прозрачном фоне.
