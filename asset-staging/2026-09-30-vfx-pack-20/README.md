# Grenade + Bomb Asset Pack 20 — 2026-09-30

Status: approved in the current ChatGPT dialog and integrated under the same-dialog source exception from `docs/ASSETS.md`.

## Source provenance

Earlier approved source directions:
- grenade-throw animation preview — image generation id `0e965b99-f94a-4d36-8b9b-8477d0f0157f`;
- bomb placement/arming preview — image generation id `d0c3380c-e3b1-480e-9eb6-8f79af86453f`.

Additional grenade-specific generated sources from the same dialog:
- first-person grenade + armored hand — generation id `6769ed67-a743-4b33-a614-0e2b8bcc21cf`;
- world grenade pickup — generation id `257197a6-813e-4cbd-8a55-68f706d9fcc8`;
- 2×2 grenade UI icon sheet — generation id `5548f8f9-c8fb-4f70-9a7f-ab4f6d3f9ffd`.

The heavy raster previews are not duplicated in Git. Runtime uses compact scriptless SVG derivatives inspired by the reviewed sources.

## Runtime derivatives

- `assets/weapons/grenade.svg`
- `assets/ui/weapons/fp/player-grenade-fps-20.svg`
- `assets/ui/pickups/weapons/world-grenade-pickup-20.svg`
- `assets/ui/equipment/frag-grenade-ui-atlas-20.svg`
- `assets/ui/fx/frag-grenade-throw-vfx-atlas-20.svg`
- `assets/ui/fx/player-bomb-arm-vfx-atlas-20.svg`

The first source is no longer adapted to the mine: Pack 20 introduces a separate player fragmentation-grenade mechanic. Gameplay state, bounce/fuse physics, blast ownership and damage stay authoritative in Three.js; generated art is presentation-only.
