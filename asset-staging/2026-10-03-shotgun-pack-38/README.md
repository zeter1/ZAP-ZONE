# Дробовик Pack38 — детализация и правильные точки эффектов

Шесть FPS-поз отдельно сгенерированы built-in image_gen по соответствующим позам Pack37; готовый кадр использован как material reference. Native1448×1086 вместо512×512 на позу общего старого source atlas. Runtime ready1448×1086, action3840×1920, ячейка1280×960; WebP quality96. Руки цельны и продолжаются через низ viewport.

Новые flame/smoke2×2 источники и один clean-alpha red/brass spent shell. Runtime effects768×768: огонь row0, дым row1, прежняя физическая дробь Pack37 row2, гильза row3col0. Гильза не переключает силуэт; вращение/падение задаёт код. Новые прозрачные имена38 сохраняют Pack37 consumers, sounds/icon/pickup и исправления gameplay.

Точные prompts: prompts.json/effect-prompts.json. Выбранные PNG sources, размеры/SHA256/WebP бюджеты и измеренные emitter origins — manifest.json. Rejected glow variants не используются. build-assets.py (Python+Pillow) читает только соседние PNG и прежний Pack37 effects atlas; пишет только три38WebP и manifest/prompts внутри этого проекта. Повторная сборка не меняет runtime policy или пользовательское состояние.

Pixels→DOM: landmarks всех6 поз измерены на половинном reference724×543. Canonical owner: src/weapons/system.js SHOTGUN_PRESENTATION_ANCHORS38/updateGeneratedShotgunAnchors38; преобразованные zero-size markers наследуют stage transform. Flame/smoke tips измерены отдельно по каждому source tile и закреплены через transformOrigin+translate в src/settings/settings.js; значения SHOTGUN_EFFECT_EMITTERS38 в catalog.js.

Порядок: tick action → sync weapon DOM → emit casing from current port → align active muzzle FX. Position-only alignment не двигает время и не раскрывает delayed smoke. Shell snapshot фиксируется единожды; дальше180t по X и−95t+900t² поY с нормализацией viewport,540°/s. Старый firearm radial burst/ring отключён в engine.spawnCombatImpact; rocket/plasma сохранили owner. Gun opacity transition отключён только для дробовика, чтобы ready не накладывался на pump.

Nearest checks: node --test scripts/shotgun-presentation-owner.test.mjs; node scripts/stamp-web-build.mjs --check; node scripts/validate-structure.mjs (cwd root). Browser evidence и пределы — VERIFICATION.md.
