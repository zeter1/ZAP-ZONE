# SR-9 presentation pack 32

Created with built-in image_gen from the existing SR-9 reference. Both source sheets were shown in the current chat and the user explicitly approved integration on 2026-10-03. Original sources are retained here; exact derivative hashes are in manifest.json.

Action source is a 4x4 sheet: frames 0-11 magazine reload, 12-15 bolt cycle. Ready uses frame 11. Every runtime cell has the same transparent top/left padding; normal/reload/bolt retain one weapon identity and camera. Effects rows: muzzle, smoke, short bullet/wake, empty brass casing.

Consumers: catalog.js owns frames; system.js owns first-person ready and actions; combat.js uses authoritative reloadTot/cycleTot; settings.js plays bounded effects. runtime.js emits the separate casing once when cycleP > .38. Pack32 action does not bake casing. Image probes gate actions/effects; missing action retains generic magazine/recoil, missing effects retain Pack23. Ready failure tries legacy SR-9 art once, then procedural model. Original sound/scope/hitscan/balance/world pickup/bot geometry remain authoritative. Silent magazine/muzzle/trail owners preserve historical gameplay RNG. Equal-cell margin cleanup removes adjacent-frame bleed before WebP encoding.

Runtime derivatives: assets/ui/fx/sniper-action-vfx-atlas-32.webp, assets/ui/fx/sniper-effects-vfx-atlas-32.webp, assets/ui/weapons/fp/player-sniper-fps-32.webp.
