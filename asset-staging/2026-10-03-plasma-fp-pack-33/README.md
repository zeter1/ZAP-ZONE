# Plasma player pack 33

Generation: cf89dc54-cd13-4257-8a38-6e61c683f179, built-in image_gen, screenshot reference.
User explicitly requested player-held plasma assets and integration, excluded HUD icon.
Duplicate gate: this is an explicitly requested player presentation replacement; existing Pack31 retained as fallback. Supplied checkout has no Git metadata, recent commits cannot be inspected.

Source is 3Г—2. Integer cell bounds floor(col*width/3), floor(row*height/2). Each cell gets the identical 806Г—605 fit at (125,115) in a 960Г—720 canvas; action cells are 768Г—576. No background removal/repainting. Full alpha preserved. Ready comes from final cell 5.

Consumer/fallback/timing: docs/ASSETS.md; dimensions/budget/SHA-256: manifest.json.

## Prompt

Use case: stylized-concept. Asset type: production first-person plasma rifle reload sprite sheet for browser FPS, TRUE transparent RGBA. Reference screenshot is visual design/framing guidance only. Generate ONE 3-column by 2-row sprite atlas, 3072x1536 pixels if possible, exactly SIX equal 1024x768 cells, no grid lines or borders. Every cell is a complete transparent 4:3 first-person frame of the SAME plasma rifle with SAME dark armored gloved hands, camera, stock, rail, sights, blue-violet electricity-filled cylindrical reactor chambers, brushed silver/gunmetal armor and small amber-orange accent lights as the reference. Rifle points diagonally from lower right toward upper left, muzzle center at normalized x=.26,y=.35 within EVERY cell. Gun and forearms confined to lower/right portions; upper 25 percent and left 12 percent remain transparent; hands extend to bottom/right boundary naturally, no body or face. Right hand always holds rear pistol grip. Six sequential reload poses left-to-right top-to-bottom: 1 ready pose with both hands gripping weapon and locked glowing reactor; 2 support left hand disengages small cylindrical blue energy cell below receiver; 3 left hand draws depleted cell downward, weapon remains aligned same way; 4 left hand brings fresh compact glowing plasma cell to receiver port; 5 seats the cell and turns its orange lock ring; 6 returns to original ready pose with BOTH hands back gripping weapon, must closely match frame 1. Maintain identical weapon size/camera/perspective and silhouette across all frames, only left hand and energy cell change. Pure weapon+hands cutout: no room, scenery, ground, background, HUD, lettering, numbers, floating effects, muzzle flash, trails, backdrop glow, contact shadows, checkerboard, overlapping cells or cropped muzzle. Crisp realistic AAA sci-fi item render, readable silver highlights and controlled violet-blue emission, restrained orange details. This sheet will supply both idle and reload to guarantee a single design, so frame 6 must be detailed and polished.


QA refinement: removed proven neighboring-cell strips from the transparent top 12 source pixels and left 8 pixels in cells 1,2,4,5; frame 3 forearm retained. No repainting or whole-subject crop.
