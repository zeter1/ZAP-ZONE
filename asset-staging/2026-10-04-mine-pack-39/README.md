# Мина ZAP ZONE — Pack39

Статус: **INTEGRATED_PENDING_BROWSER_QA**. После явного одобрения пользователя комплект подключён к runtime. FPS/FX — растровые спрайты; лежащая мина использует низкий code-native 3D-корпус с одобренной top8 текстурой.

Стиль взят из существующей мины игры: серебристый потёртый шестисегментный корпус, чёрные механические детали, синие энергетические кольца, янтарные индикаторы и бронеперчатки.

## Состав

- Пять отдельных FPS-поз 1600×900: удержание, замах, рука вперёд, выпуск/возврат и подготовка следующей мины. Руки продолжаются к нижнему/правому краю исходного кадра.
- Атлас броска 3840×1440: 3×2, ячейка1280×720. Порядок: ready, windup, extend, release, recovery-release, ready. Возврат использует кадр открытой руки; отдельного нового жеста нет.
- Атлас подготовки 3840×720: 3×1, ready, activation-check, ready. Это визуальная подготовка следующей мины, без выдуманного магазина/чеки.
- Девять мировых состояний 512×512 и атлас1536×1536: отключена, активация, готова, мигание, срабатывание, три ракурса полёта, вид сверху.
- Отдельные предмет подбора и иконка512×512.
- Взрыв: восемь кадров и атлас2048×1024. Дым: шесть кадров и атлас1536×1024.
- Дополнительные эффекты: два набора осколков, искры приземления, горячий и холодный следы взрыва, импульс активации; шесть кадров и атлас1536×1024.
- Пять детерминированно синтезированных PCM WAV22.05kHz mono: бросок, приземление, активация, срабатывание, взрыв. Это дополнительные кандидаты; звук на устройстве пользователя ещё не оценивался.

Итого:36 отдельных PNG/WebP-пар,6 атласов WebP,5 WAV и10 активных оригиналов генератора. Откройте `preview.html` для поз, иллюстративной анимации, светлого/тёмного фона и формы окна16:9/4:3. `overview.jpg` показывает общий лист. Этот просмотр не является доказательством корректного отображения в игровом DOM.

## Файлы и происхождение

- `sources/` — оригинальные PNG встроенного **image_gen**. Предыдущий тесно обрезанный вариант взрыва не выбран; активный источник — `explosion_v2.png`. Отключённая мина использует отдельный `inactive.png`, поскольку ячейка0 общего источника сохраняла свечение.
- `frames/` — прозрачные PNG отдельных кадров.
- `candidates/` — WebP отдельных кадров и атласов, качество94. Прозрачность WebP проверяется побайтно относительно подготовленного PNG.
- `audio/` — WAV, синтезированные средствами стандартной библиотеки Python; не записи внешних источников.
- `prompts.json` — точные запросы генератору, включая первоначальный вариант взрыва и его пересмотр. Ключи активных источников находятся в manifest.
- `manifest.json` — размеры, сетки, SHA256, alpha, исходные окна нарезки, общий масштаб каждого листа и положения кадров. Границы нарезки проходят по измеренным прозрачным промежуткам; сетка источника не предполагается равномерной.

FPS-картинки сохраняют полноэкранную композицию с прозрачным верхом/центром. При адаптации4:3 пример использует object-fit:cover с привязкой right bottom. При подключении необходимо проверить фактическое положение каждой руки и HUD. FX имеют не менее32px прозрачного поля; взрыв/дым закрепляются снизу по x=.5,y=472/512.

## Подключение и резервное отображение

| Ассеты | Существующий владелец / событие | Заменяемое оформление / fallback |
|---|---|---|
| Ready / бросок / подготовка | `src/weapons/system.js`: FPS presentation, `showGeneratedMineThrowVfx`; `src/combat/combat.js::throwMine` и существующий reload | `player-mine-fps-01.webp`, `mineThrow24`, procedural руки/оружие |
| Полёт / лежащая / активация | `src/combat/combat.js::mkMine`, `tickMines`; реальные `m.position`, `fall`, `armed`, `aT`, `ph` | procedural mine mesh остаётся физическим объектом и load-error fallback |
| Pickup | `src/entities/pickups.js` + `src/assets/catalog.js` | `world-mine-pickup-01.webp` и procedural pickup |
| Иконка | `src/assets/catalog.js`, существующий слот мины и equipment HUD | текущая иконка/atlas equipment |
| Взрыв / дым / осколки | `src/combat/combat.js::tickMines`, `showGeneratedMineDetonationVfx`; существующий elapsed-time VFX owner | `mineDetonation` Pack12 и `explode` |
| След взрыва | существующий ground-decal presentation owner | отдельный bounded ground decal; проекция на землю, а не экранная наклейка |
| WAV | `src/settings/settings.js`, существующие throw/land/arm/detonation presentation events | текущий WebAudio/sound synthesis |

Отдельные utility-ячейки:0 металлические осколки;1 электроника;2 приземление;3 горячий след;4 холодный след;5 активация. Это разные эффекты, не одна последовательная анимация.

Механическое событие выпуска должно иметь ровно одного producer; реальная мина не должна одновременно оставаться в руке и лететь. Таймеры, задержка активации, боезапас, урон, радиус, collision, AI, RNG и лимиты объектов принадлежат существующим owners. Pack39 использует существующие bounded VFX/decal queues, decal15s и mine world capMAX_MINES.

Для дальнейших пересмотров соблюдать канонический review gate в `docs/ASSETS.md` проекта: сначала визуальный просмотр и разрешение интеграции, затем catalog/consumer/fallback и проверки игры. После подключения проверить все позы в реальном игровом DOM16:9 и4:3, выпуск/возврат, reload, switch/cancel, pause/resume, полёт за стеной, приземление, активацию/детонацию, decode failure, HTTP и file://. Не допускать двойного отображения прежнего и нового слоя.

## Проверки

Проверяемые границы и результаты находятся в `VERIFICATION.md`. Source/VM checks описаны в VERIFICATION.md; live game, реальные сценарии боя и субъективное качество WAV остаются **NOT_VERIFIED** до отдельного запуска.

Точные source→runtime paths и SHA256 находятся в `manifest.json::runtime_mapping`. Старые runtime ассеты сохранены. Ready и actions имеют единую16:9 сцену со scale44% viewport и right/bottom anchor для другой формы окна; выпуск производится один раз через elapsed game loop на frame3 (.29s). Native LMB и F quick-throw используют один pending owner. До выпуска cancel не расходует ammo/CD; после выпуска сохраняется реальная мина. Ground scar публикуется только при реальном ground detonation, hot→cold после .65s и исчезает через15s. Отмена/пауза не создаёт отложенный callback.

Лежащая мина использует orthographic top cell8 в горизонтальной XZ-плоскости, shared world-corner homography owner, real yaw и chassis top height. Старый chassis остаётся для толщины, прежние cap/lens/ring скрыты до fallback. Полёт использует прежние billboard cells5/6/7. Physics landing остаётся на flat arena floor center y=.08; roof support не меняется. Ready decode callbacks сохраняют активный throw owner до actionstop.


Rev8: runtime lying body — цельный низкий 3D цилиндр .063m общей высоты, silver six-lug/vent chassis, cyan band, amber indicator и горизонтальный top8. Physics center .08 и contact radius .32 неизменны; lowerbody resting on floor. HTTP: strict decoded Image and one shared immutable GPU atlas cropped to top8 content; file://: approved croppedtop horizontal DOM surface above detailed low-profile3Dbody, shared world-corner projection with wall/nearclip gates, no tainted WebGL image upload; no planted DOM billboard/coarse pedestal. Fallback restores original body and disposal precedes parent destruction. Armed contact any actor, including owner/friendly, lethal immediately; arming1.5s and nearby AoE rules preserved. Detailed owner contract: `docs/ASSETS.md` in project root.
