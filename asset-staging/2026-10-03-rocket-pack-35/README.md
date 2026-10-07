# Rocket launcher — Pack 35

The user explicitly requested generated assets AND game integration, then specified
the ZAP ZONE silver/black, electric-blue and amber-orange style. The military olive
prototype was rejected and is not integrated. Sources and exact built-in image_gen
prompts are retained here. `manifest.json` owns source identities, dimensions,
alpha range, SHA-256 and exact staging-to-runtime paths.

## Consumers

- Ready and six reload poses: player-only first-person DOM layer, existing elapsed
  reload timer. Same source body and transform; ready uses final cell 5.
- Four muzzle frames: emitted player rocket shot, follows the transformed muzzle.
- Four missile/exhaust frames: actual player/bot rockets, projected real position,
  velocity, camera distance and opaque-cover checks.
- Four blast frames and four smoke/debris frames: actual detonation point.
- World launcher render: weapon pickup, pickup feedback and rocket slot icon.
- Top-down scorched impact: existing floor-projection owner; fifteen active seconds
  with fade during seconds 13–15. Air/wall hits do not create a floating floor scar.

Legacy ready/reload/flight/blast and procedural geometry remain load-error fallbacks.
Physics, ammo, speed, damage, radius, sound and gameplay RNG remain with existing owners.
All runtime derivatives preserve source alpha. No background removal/repainting.

## Derivation

Integer grid boundaries are `floor(column*width/columns)` and equivalent for rows.
Every reload cell uses the same fit: 806×605 at (154,115) in a 960×720 transparent
frame; action frames are 768×576 in a 2304×1152 3×2 atlas. This carries the arms to
the bottom/right viewport boundaries. Ready is final cell 5. Effects are a 1024×1024
4×4 atlas, 256×256 cells; pickup is 512×384; floor scar is 512×512.

Browser acceptance must inspect every reload frame at actual stage framing in 16:9
and another window shape, plus alpha, HUD/crosshair clearance, muzzle, flight,
occlusion, failure fallback and scar expiry. Atlas inspection alone is insufficient.

Wall scar follows the actual swept face contact, including rotated box surfaces; see docs/ASSETS.md. Final action source was regenerated for complete forearms and empty gutters. Slicing isolates top12px/left48px neighbor spill; no gameplay-frame fragment remains. Wall source and cleanup prompt are in wall-clean-prompts.json. Browser alpha oracle found0 nontransparent pixels in the former stray gutter.
