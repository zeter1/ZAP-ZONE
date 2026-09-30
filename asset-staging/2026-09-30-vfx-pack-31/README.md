# Generated Weapon Action Pack 31 — plasma core reload + player weapon identity

Date: 2026-09-30
Status: source preview reviewed in the current ChatGPT dialog and explicitly approved for integration.

## Source provenance

- ChatGPT generation id: `fe049d05-5989-4242-901d-bd963dcd611d`
- reviewed source: 1448×1086 transparent 4×3 / 12-frame first-person plasma-core reload contact sheet
- visual direction: dark sci-fi plasma rifle, cyan/blue-white reactor core, violet accents, consistent armored baked hands
- the heavy generator raster is intentionally not duplicated in Git under the same-dialog approval exception.

## Runtime derivatives

- `assets/ui/fx/plasma-core-reload-vfx-atlas-31.webp`
  - 720×405 VP8X alpha-WebP
  - 4 columns × 3 rows, 180×135 4:3 padded cells
  - 58,732 bytes
  - SHA-256: `91e679c282f69f7d9e515faa35b6a55e72dcc7c03fcb6ff258f730a64fd1d364`
- `assets/ui/weapons/fp/player-plasma-fps-31.webp`
  - 960×720 VP8X alpha-WebP
  - ready-state derived from source frame 12 with HUD-safe lower-right placement
  - 58,016 bytes
  - SHA-256: `78fd89b34f946c54a03727931a31d48ac9d226e9cad2bd8a10e1f077b041f296`

## Consumer / event / fallback

- normal player plasma ready/idle DOM art → Pack 31 ready-state image;
- player tactical reload → source sequence `0,1,2,3,4,6,7,8,9,11`;
- player empty reload → all twelve source frames;
- the existing reload timer remains authoritative; Pack 31 owns presentation only;
- if the full reload action cannot start, the generic magazine-drop overlay and Pack 11 plasma reload completion VFX remain fallback;
- if the ready-state image fails to load, the procedural first-person plasma rig remains fallback;
- Pack 30 tracked projectile flight, Pack 26 discharge and Pack 11 impact stay separate presentation layers.

## Identity invariant

A first-person reload/action asset that visibly shows a redesigned weapon must not exist only during the action. The normal player-visible idle/ready weapon asset must be updated in the same integration pass to the same weapon identity. World-pickup and bot presentation remain separate consumers and require their own appropriate source angle.
