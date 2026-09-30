# Grenade VFX Asset Pack 21 — selected sheet #2

Status: explicitly selected by the user in the current ChatGPT dialog and integrated under the same-dialog reviewed-source exception documented in `docs/ASSETS.md`.

## Source provenance

Selected generated concept sheet:
- image generation id: `a5e994da-098b-48e5-9644-6f27583d31e4`;
- generated sheet size: 1774×887 RGBA;
- chat file name: `a_large_game_asset_sprite_sheet_ui_fx_compilatio.png`.

The reviewed sheet contains grenade model/FP/throw/flight/explosion/shrapnel/smoke/decals/UI/fuse concepts. Pack 20 already owns the grenade model, first-person presentation, pickup, HUD identity and throw animation, so Pack 21 intentionally integrates only missing/high-value runtime states instead of duplicating those consumers.

## Runtime derivatives

| Runtime asset | Source-sheet concept | Consumer |
| --- | --- | --- |
| `assets/ui/fx/frag-grenade-flight-fuse-atlas-21.svg` | flight trajectory + live fuse | tracked grenade during flight; final 0.78 s danger warning |
| `assets/ui/fx/frag-grenade-explosion-smoke-atlas-21.svg` | explosion + smoke after blast | authoritative frag detonation event |
| `assets/ui/fx/frag-grenade-debris-scorch-atlas-21.svg` | shrapnel/debris + blast marks | authoritative frag detonation event |

The 2.5 MB concept raster is not committed. Runtime derivatives are deterministic static SVG atlases with no `<animate>`, scripts, embedded raster images or gameplay authority.

## Fallback / authority

- Three.js grenade object, bounce physics and fuse remain authoritative.
- Pack 15 remains a valid shrapnel/detonation layer if Pack 21 cannot be presented.
- Pack 21 is DOM-only presentation and changes no damage/radius/ammo/reward values.
