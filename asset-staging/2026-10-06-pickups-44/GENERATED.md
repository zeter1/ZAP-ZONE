# Pack44: world pickup images

Generated with built-in imagegen. These are world-only cutouts; FPS/held weapon images remain authoritative and unchanged. Runtime derivatives and source SHA256 are recorded in manifest.json. Creative images were not painted or segmented by Python: Pillow only crops transparent padding, resizes with LANCZOS and composites into an empty1024x768 alpha canvas.

## Sniper

References: `assets/ui/weapons/fp/player-sniper-fps-32.webp` and `assets/ui/pickups/weapons/world-sniper-pickup-01.webp`.

Prompt: Production high-detail pickup image for the existing ZAP ZONE sniper rifle. STRICT identity to both reference images, not a redesign. Show ONLY the complete weapon with no hands, arms, HUD or background. Match the long slim forward barrel with blue-lit muzzle attachment, worn silver and charcoal armored receiver, electric blue side channels, huge cylindrical scope with blue lens and orange/amber adjustment details, dark rear stock, lower grip and box magazine, orange mechanical seams. A crisp premium realistic3D game render with convincing solid thickness, fine machined edges, bolts, metal wear, smooth cylinders, detailed scope lens, clear dark recesses and subtle cool/warm lighting. Three-quarter isometric side view, whole rifle floating horizontally, muzzle LEFT and stock RIGHT. Full uncropped silhouette and generous transparent padding all around; horizontal composition. Transparent alpha background. NO GROUND SHADOW, no drop shadow, no shadow blob, no floor plane, no glow cloud outside the object. Weapon surface lighting is allowed, detached cast shadows are forbidden. Aim for an original image with at least1536px width so the1024x768 transparent WebP game derivative remains crisp when seen close. The existing weapon in the reference is authoritative; preserve design and colors, improve rendering fidelity only.

## Medical kit

Reference: `assets/ui/pickups/world-medkit-pickup-01.webp`.

Prompt: Create a high-resolution premium realistic3D game pickup render of exactly this ZAP ZONE medical kit. Same compact chunky red rectangular sci-fi case, silver reinforced corners, dark charcoal fastening bands, white medical cross on the red top lid, cyan illuminated inset channels and small amber status lamps. Preserve this established design and three-quarter isometric top/front view, improve sharpness, machined edge bevels, screws, material depth and subtle metal wear. The complete case alone floats in air, horizontally aligned, centered with transparent padding around all edges. No hands, no scene, no text, no additional objects. TRANSPARENT ALPHA BACKGROUND. Absolutely NO floor, NO ground shadow, NO detached cast shadow, NO drop shadow and no blurred glow cloud outside the case. Fine surface shading and recessed details are allowed. Wide image at least1536px with crisp high-quality detail for a1024x768 game derivative.

Alpha edit prompt: Keep this exact sharp detailed medical case unchanged, with its red/silver/dark case, white medical cross, cyan illuminated strips and orange small lights. FIX THE TRANSPARENCY: remove ALL blurred colors, shadows, haze, red reflections and grey background OUTSIDE the physical case. Give a clean tightly masked alpha silhouette of only the solid case, transparent empty pixels beyond the case edge. Do NOT paint any shadow on the background. No floor. No external glow. Center the entire uncut case with transparent padding around every edge, at least8% padding. Crisp game pickup cutout, high resolution. Do not alter the metal surface shading.

Alpha was checked by compositing the runtime WebP over the actual arena floor color. Hidden RGB in transparent pixels is not visible game content.
