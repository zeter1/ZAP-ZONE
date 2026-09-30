# Generated VFX Asset Pack 20 — 2026-09-30

Status: approved in the current ChatGPT dialog and integrated under the same-dialog source exception from docs/ASSETS.md.

- Grenade-throw source preview: image generation id `0e965b99-f94a-4d36-8b9b-8477d0f0157f`. ZAP ZONE has no separate player frag-grenade slot, so its choreography is adapted to the existing throwable mine rather than inventing a new mechanic.
- Bomb placement/arming source preview: image generation id `d0c3380c-e3b1-480e-9eb6-8f79af86453f`. This maps directly to the existing player bomb placement event.

Runtime derivatives:
- `assets/ui/fx/player-mine-throw-vfx-atlas-20.svg`
- `assets/ui/fx/player-bomb-arm-vfx-atlas-20.svg`

Both are deterministic, scriptless 4×2 / 8-frame SVG atlases. Gameplay objects, physics, ammo, cooldown, fuse and damage remain authoritative; the atlases are presentation-only.
