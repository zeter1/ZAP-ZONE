# Asset pipeline — ZAP ZONE

Этот документ — обязательный operational contract для человека, ChatGPT/Codex и других AI-агентов при создании, изменении и публикации игровых ассетов.

## 1. Сначала определить владельца ассета

Перед генерацией или заменой изображения определить реальный consumer:

- DOM/HUD/menu/feedback → `assets/ui/**` и `GAME_ASSETS.presentation*`;
- gameplay SVG fallback → существующий доменный каталог (`assets/medals`, `assets/status`, `assets/fx`, `assets/perks`);
- weapon identity / bot/world pickup art → `assets/weapons/**` и `WEAPONS[].asset`;
- generated player-held first-person presentation → `assets/ui/weapons/fp/**`, только DOM overlay локального игрока;
- audio → `assets/audio/**`;
- постоянная Three.js сцена → по умолчанию procedural geometry/materials, а не generated raster texture.

Не добавлять картинку «на будущее» без конкретного callsite. Asset считается интегрированным только когда есть consumer, fallback/degradation contract и validation.

## 2. Generated source и runtime derivative — разные вещи

Генератор может вернуть 1024–2048 px PNG. Такой файл является source/reference, но не обязан попадать в runtime.

Для HUD/icon assets:
1. визуально проверить источник;
2. обрезать лишний transparent padding при необходимости;
3. уменьшить до фактического UI-resolution;
4. сохранить прозрачность;
5. подготовить runtime derivative.

Текущий ориентир для компактных эмблем — 256×256 WebP с alpha. PNG допустим, когда lossless edge fidelity действительно нужна. Большой raster >512 px или >250 KiB в обычном HUD требует отдельного обоснования.

Для player-held FPS weapon art действует отдельный envelope: текущий целевой runtime derivative — **960×720 WebP с alpha, до 250 KiB на файл**. Такой размер нужен потому, что оружие занимает значительную часть 16:9 viewport; уменьшать его до icon-resolution нельзя.

Background/photo-like art: WebP/JPEG. Простые векторные fallback: SVG. Не конвертировать SVG в тяжёлый raster без пользы.

## 3. Имена и каталоги

Runtime-файлы используют ASCII kebab-case и смысловое имя:

`<semantic-name>-tech-<nn>.<ext>`

Примеры:
- `assets/ui/feedback/armor-break-tech-01.webp`;
- `assets/ui/medals/multikill-tech-02.webp`;
- `assets/ui/perks/defender-tech-01.webp`.

Не коммитить имена генератора, кириллицу, `imagegen.png`, `final-final.png`, случайные UUID и временные contact sheets как runtime assets.

Каталог определяется владельцем UI, а не сессией генерации.

## 4. Fallback и graceful degradation

Generated presentation art не должно быть единственной формой критической информации.

- DOM image: `src` = стабильный fallback, `data-generated-src` = hosted art, `data-fallback-src` = явный fallback.
- `catalog.js` на HTTP/HTTPS versioning-ит оба URL и активирует generated image через `imageAssetWithFallback()`.
- file:// сохраняет лёгкий SVG/text/gradient path.
- Perk generated art всегда имеет per-id SVG fallback.
- Чисто декоративный CSS asset может исчезнуть при 404, только если текст/shape рядом полностью сохраняет смысл.

Нельзя скрывать HP, ammo, objective state или control hint внутри изображения без текстового/DOM эквивалента.

## 5. WebGL/uCoz safety invariant

Generated PNG/WebP/JPEG presentation assets **не использовать** как постоянные texture planes/sprites в `src/core/engine.js` и bot scene.

Причина: проект уже устранял hosting-specific black texture-quads. Поэтому generated art остаётся DOM/CSS-only, а 3D scene использует procedural geometry/materials.

Запрещённый drift для generated UI art:
- `gameTexture(generatedPath)`;
- `makeAssetPlane(generatedPath,...)`;
- `makeAssetSprite(generatedPath,...)`;
- прямой `TextureLoader` в engine только ради HUD/decal art.

Исключение возможно только отдельной задачей с runtime/browser/uCoz evidence и новым regression contract.

### Player-held generated weapons

Сгенерированные FPS-рендеры оружия не являются 3D-моделями и не должны подменять bot/world geometry.

**Reference lock перед генерацией.** Если пользователь дал пример посадки оружия, он является обязательным composition contract, а не просто style reference. До генерации зафиксировать:
- камера — first-person, оружие выходит из нижнего правого сектора и направлено влево/вверх в глубину сцены;
- видна правильная ведущая рука на рукояти; для двуручного оружия видна supporting hand/forearm;
- ствол не должен смотреть фронтально в камеру и не должен быть боковым showroom/profile render;
- оружие не центрируется как постер и не перекрывает центральный reticle;
- muzzle должен оставаться читаемым и иметь стабильную экранную anchor-точку;
- фон обязательно прозрачный, без baked black rectangle/scene/background.

**Hand ownership mode — нельзя смешивать.** Для каждого pack заранее выбрать ровно один режим:
1. `baked-hands` — изображение уже содержит финальные руки/предплечья; при успешной загрузке скрывается **весь procedural first-person rig** (weapon body + procedural hands), иначе появятся двойные/блочные руки;
2. `weapon-only` — изображение не содержит рук; procedural hands могут остаться только после отдельной проверки совпадения grip/scale/perspective.

Текущий approved V3 pack pistol/shotgun/rifle/plasma/rocket/sniper — **baked-hands**. Mine и smoke теперь используют тот же baked-hands DOM pipeline; bomb пока остаётся procedural. V3 использует intentional transparent headroom/left-space, уменьшенный runtime silhouette и HUD-safe positioning.

**Подтверждённый success baseline (28.09.2026).** Этот вариант был визуально принят в реальной игре и теперь является эталоном для следующих first-person assets:
- runtime canvas — 960×720 с реальной alpha-прозрачностью;
- объект не tight-crop: сохраняется большой transparent headroom/left-space, чтобы runtime не раздувал картинку;
- baked FPS angle создаётся в самом asset; runtime только слегка двигает его, а не пытается исправить перспективу большим rotate;
- основной силуэт остаётся в нижнем правом секторе и не закрывает reticle, HP, Score/Kills и critical HUD;
- HUD имеет stacking priority над декоративным оружием, но правильная композиция обязательна сама по себе;
- per-weapon `width/right/bottom/muzzleX/muzzleY` настраиваются после реального screenshot, не по standalone preview;
- raster sway/recoil ограничивается clamp-ами; approved baked angle нельзя разрушать большой динамической ротацией;
- visual recoil должен быть отдельным runtime transform и быть frame-rate independent;
- muzzle flash не запекается в статический weapon asset: это отдельный effect layer с собственным anchor, цветом/масштабом по weapon key и без прямоугольной/обрубленной подложки;
- финальный gate: generate → runtime derivative → integrate → screenshot in game → tune → только после визуального принятия считать framing подтверждённым.

Runtime contract:
- runtime derivative: прозрачный WebP в `assets/ui/weapons/fp/**`, сейчас 960×720 и <=250 KiB;
- consumer: `#fp-weapon-art` / `#fp-weapon-art-stage` поверх canvas только для локального игрока;
- при `baked-hands` успешная загрузка скрывает все children текущего procedural `gunGrp`; fallback/error возвращает весь rig;
- gameplay state, ballistics, hitboxes, recoil logic, bots и world pickups не меняются;
- recoil/equip/reload/sprint/cycle поза DOM-art синхронизируется с существующим `gunGrp`, а muzzle flash имеет отдельный DOM feedback;
- для player-only pack `file://` поддерживается: WebP лениво загружается только после `running` по локальному `assets/...` пути; 404/decode error обязаны автоматически вернуть procedural first-person rig;
- mine и smoke используют отдельные approved baked-hands utility assets; bomb остаётся procedural, пока для него не создан отдельный утверждённый FPS asset;
- запрещено загружать generated weapon WebP через `TextureLoader`, `gameTexture`, `makeAssetPlane` или `makeAssetSprite`.

**Framing/acceptance gate перед upload.** Для каждого FPS weapon:
- сравнить с утверждённым reference montage, а не только с соседними generated картинками;
- проверить 16:9 desktop screenshot: оружие визуально сидит в нижнем правом секторе, а muzzle уходит к левому/верхнему направлению;
- руки анатомически держат grip/fore-end, нет второго procedural комплекта рук;
- generated canvas должен сохранять осмысленное прозрачное пространство слева/сверху: tight crop вокруг оружия запрещён, потому что он заставляет раздувать poster-scale в runtime;
- weapon silhouette не занимает чрезмерно весь экран и не закрывает HUD/reticle;
- в idle-состоянии видимая часть оружия должна оставаться в правом секторе экрана: ориентир — левый край основного силуэта не левее ~58% viewport на desktop 16:9;
- центральная safe-zone reticle и нижняя центральная safe-zone HP/Score/Kills не должны пересекаться основным силуэтом оружия;
- `#hp-wrap`, `#hud`, `#whud` и reticle всегда имеют stacking priority выше decorative weapon art; это страховка, а не замена правильной композиции;
- right-bottom weapon HUD может находиться поверх силуэта только как читаемый HUD-слой; generated art не должен визуально уничтожать его контраст;
- отдельные `width/right/bottom/muzzleX/muzzleY` tuning значения задаются по weapon key, а не одной глобальной трансформацией;
- dynamic sway/recoil для raster weapon art должен быть ограничен clamp-ами: baked first-person angle не вращать на большие углы и не таскать через HUD;
- visual recoil должен быть заметным, но не менять gameplay aim: использовать отдельный per-weapon push/pitch/roll profile; decay считать от `dt`, а не «на кадр», чтобы 60/120/144 FPS выглядели одинаково;
- muzzle feedback строить слоями (hot core + directional flame/starburst + glow), привязывать к muzzle anchor и не использовать короткий непрозрачный oval/cone, который выглядит как «обрубок» и закрывает пламя;
- desktop runtime stage ограничивать по абсолютному размеру (сейчас max 980 px), чтобы ultra-wide/high-DPI viewport не превращал оружие в огромный постер;
- если визуальная посадка не проверена screenshot-ом, итог маркировать `NOT VERIFIED: visual framing`, даже если CI зелёный.

## 6. Catalog и cache identity

Новый runtime asset должен:
1. лежать в каноническом каталоге;
2. быть внесён в `GAME_ASSETS`;
3. использовать `gameAssetUrl()`/общий build key на HTTP(S);
4. попасть в `scripts/validate-structure.mjs`;
5. изменить web build identity через `node scripts/stamp-web-build.mjs`.

Не хардкодить случайные query-version. Единственный cache key — текущий build ID.

## 7. Validation перед commit

Для каждого нового generated image проверить:
- файл существует и не пуст;
- magic/envelope соответствует PNG/JPEG/WebP;
- размер разумный для callsite;
- catalog содержит путь;
- реальный HTML/CSS/JS consumer содержит wiring;
- fallback/degradation path существует;
- generated presentation path отсутствует в WebGL engine;
- для player-held weapon art проверены DOM consumer, procedural fallback, pose sync и отсутствие влияния на bots/world pickups;
- для baked-hands pack проверено, что procedural weapon **и procedural hands** скрываются одновременно, а на fallback возвращаются вместе;
- FPS framing сопоставлен с утверждённым reference screenshot/montage; CI не заменяет визуальную проверку композиции;
- `node --check` проходит;
- `node scripts/stamp-web-build.mjs --check` проходит после stamp;
- `node scripts/validate-structure.mjs` проходит;
- browser boot + local file smoke проходят в CI.

Нельзя считать «файл лежит в assets» достаточной интеграцией.

## 8. GitHub upload — один логический change

Перед записью:
1. re-fetch exact `main` SHA;
2. прочитать `.github/workflows/**` и оценить push-runs;
3. re-fetch изменяемые файлы/blob SHA;
4. подготовить все binary blobs + code/docs/changelog;
5. собрать один Git tree/commit;
6. fast-forward `main` с `force=false`.

Не загружать шесть картинок шестью отдельными commits через Contents API: это создаёт лишние Actions runs и временно неконсистентный catalog.

Любое изменение runtime/code/assets сопровождается записью в `CHANGELOG.md`.

## 9. После GitHub write

Проверить exact new SHA:
- найти Actions run с `event=push&head_sha=<SHA>`;
- проверить run conclusion;
- при failure: jobs → первый failed step → logs → root cause → один минимальный follow-up;
- не продолжать серию несвязанных commits пока current HEAD красный.

Green run другого SHA не является доказательством для текущего HEAD.

## 10. Ручная публикация на uCoz/static hosting

Порядок публикации:
1. новые/изменённые `assets/**`;
2. изменённые `src/**`;
3. CSS/другие runtime files;
4. `index.html`;
5. **`version.json` последним**.

`version.json` объявляет сборку доступной, поэтому его нельзя выкладывать раньше asset/code payload.

После публикации:
- открыть сайт обычным reload без Ctrl+F5;
- проверить новый build;
- проверить menu + один generated HUD asset + fallback-sensitive flow;
- проверить DevTools Network/Console на 404/decoding ошибки.

## 11. AI handoff checklist

Следующий AI перед asset-задачей читает только:
1. этот файл;
2. `assets/README.md`;
3. конкретный consumer/module;
4. `scripts/validate-structure.mjs`;
5. workflow Validate, если будет write.

Текущее состояние кода/GitHub/CI всегда важнее этого документа, если они разошлись.
