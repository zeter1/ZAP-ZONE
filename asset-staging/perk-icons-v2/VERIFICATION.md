# Perk icons V2 verification

Built-in ImageGen: one 8×7 transparent source atlas, followed by one padding-only edit.
52 row-major cells extracted deterministically with Sharp; WebP 256×256, quality92, alpha100.
manifest.json owns ID mapping, source rectangles, alpha ranges, byte sizes and SHA-256.
Original/final prompts: prompts.json. Final source: source.png.

VERIFIED: final build af6508fb847fdfc0; syntax/structure/stamp, independent ID/file/manifest SHA checks,
canonical HTTP boot smoke (only preview port matcher adapted) and unmodified file menu smoke.
All 52 descriptions tested without overflow at 1440×900, 1234×646, 1920×1080, 768×1024, 390×844, 900×500.
All icons loaded; selected five checked in both HTTP and file mode. Final screenshots visually inspected.
Reroll exhausted exactly once; native Space, numeric key and click routed to the offered perk callback;
initial focus and forward/backward Tab wrap passed; forced missing primary loaded SVG once.
Interaction routing was intercepted before perk gameplay effects; no claim of a played match follows from it.

NOT_VERIFIED: hosted HTTPS publication, remote CI, full played match. Gameplay balance/effect owners unchanged.
