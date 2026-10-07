# HUD43 verification

Runtime build: `279396b5402909c6`.

VERIFIED:

- `node --check src/assets/catalog.js`; структура; `stamp-web-build --check`.
-10 scriptless SVG,512×256,19 300 bytes total; document-relative catalog URLs, nine-slice geometry.
-12 HTTP rendered scenarios:1920×1080,1280×1024,1366×768,960×540,768×1024,640×480; normal/max-level,99 999 score,9 999 kills, armor, long rifle title and shell reload. All inspected glyph bounds stay inside panels; no painted-slot/panel overlap, all panels inside viewport, minimap inside shell, crosshair free.
-10/10 new images decode through HTTP and local `file://`.
- Existing HTTP boot smoke PASS. Existing file menu/generated asset parity smoke PASS with controlled dependency fixture. Real start button/Pointer Lock reports running=true, paused=false, menu hidden.
- All ten new shell URLs aborted in isolated HTTP game: HP/ammo/XP/team/objective text visible inside viewport; start succeeds, existing text/canvas and CSS shapes remain.

First failures and corrections:

- First design overflowed max-level XP; low windows placed map above viewport and weapon cards over crosshair. Exact fixes: short max-level label, explicit max-content width for absolutely positioned weapon bar, compact low-height stack. Rerendered12 cases PASS.
- Flex-container bounds included empty gaps between wrapped rows; screenshot and actual painted child rectangles distinguish this oracle error from genuine overlap. Final overlap oracle checks each card.
- Initial harness omitted `require('playwright')`, then referenced a nonexistent helper; fixed only in temporary tests. Default TEMP was outside writable sandbox; browser uses task TEMP and isolated profile with normal Chromium sandbox.
- One uninstrumented file boot timeout remains UNKNOWN. Instrumented later failure: external Three.js CDN request timed out, THREE was undefined; source HUD was unaffected. No product dependency changed.
- Test-only network route + synchronous child CDP call blocked route dispatch (Runtime.evaluate request5 image probe timeout). Same fixture + async execFile completed within budget; product files unchanged.

Dependency fixture boundary:

The exact successful HTTP response for `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js` was reused in the isolated browser only, SHA256 `9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2`. Thus file asset/DOM behavior is verified; final unmocked CDN availability is NOT_VERIFIED. Earlier unmocked file smoke passed on an earlier HUD candidate; it does not override later timeout evidence.

NOT_VERIFIED: hosted uCoz deployment, remote CI, weak physical GPU performance, prolonged full match, portrait phone gameplay. No Git commit/push/publication performed.

Manual check: open current index.html, start game, compare XP/teams/map/stats/HP/ammo and switch weapons. If anything overlaps, collect screenshot, viewport dimensions, build ID and console errors. If game never starts, check whether the existing Three.js CDN request loaded before attributing failure to HUD.
