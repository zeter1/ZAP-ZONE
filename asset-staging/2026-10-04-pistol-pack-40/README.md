# Пистолет ZAP ZONE — Pack40

Текущая задача пользователя разрешает генерацию и интеграцию полного комплекта.
Использован встроенный `image_gen`; точные запросы находятся в `prompts.json`,
исправление четвёртой позы — в `pose-4-fix-prompt.json`. Начальный общий sheet
не принят: финальные позы генерировались отдельно1448×1086.

Один дизайн: серебристый металлический компактный пистолет, тёмно-синие
перчатки/предплечья, синие вставки и янтарные прицельные детали.
`build-assets.py` сохраняет полный canvas и alpha, собирает3840×1920 atlas
3×2 с cells1280×960, ready из pose0, recovery из того же pose0.
Tactical:0,1,2,3,5; empty:0,1,2,3,4,5. Timer/ammo остаются gameplay authority.

`pose-4-rejected-left-edge.png` сохранён только для объяснения реального FAIL:
его предплечье пересекало левую границу source, показав срез внутри игрового
окна4:3. Исправленный source продолжает оба предплечья через нижнюю границу.
Runtime сохраняет постоянную композицию ready/reload и выносит нижние
и правый срезы transform stage за viewport. Source некоторых поз выходит
правым предплечьем также через правую границу: это явно защищено framing
oracle и проверено в игре. Масштаб не зависит от текущей позы.

`manifest.json` владеет source/runtime SHA256, размерами, alpha, сетками,
бюджетами и измеренными muzzle/ejection/nozzle точками. Effects source1254²
разрезается по `floor(col*width/4)`; runtime768² содержит muzzle/smoke/bullet/
casing. Origins измерены на1280² reference и нормализованы к cell320.

Consumers:

- `system.js`: decoded ready40→legacy01→procedural; согласованные reload/hold;
- `settings.js`: огонь/дым на transformed muzzle, отдельная гильза на ejection;
- `combat.js`: реальная пуля с pos/vel/occlusion через общий firearm owner;
- каталог: ready/reload/effects, world pickup512×384, icon256×192;
- WebAudio: четыре оригинальных PCM16 mono22050Hz WAV, локально синтезированы
  детерминированным builder; HTTP buffers и synthesis fallback по file/error.

Shared impact Pack29, ricochet physics, bot geometry и damage/balance сохранены.
Летящая пуля не является независимым декоративным выстрелом; bounded DOM
budget и отсутствие/отказ картинки сохраняют процедурный tracer.

Правила и owners: [docs/ASSETS.md](../../docs/ASSETS.md).
Проверки и их границы: `VERIFICATION.md` после финальной проверки.

2026-10-04 recalibration: manifest и metadata builder обновлены по фактическим source pixels: front-plane431,150; bore−158.5°; FX dense roots с индивидуальными floor-cell размерами313/314. Исходники и все9 runtime bytes/SHA256 сохранены. Полный текущий контракт — docs/ASSETS.md (раздел Pack40).
