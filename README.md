# ZAP ZONE

Пистолет: Pack40 с цельными руками, извлечением/вставкой магазина и затвором, огнём/дымом у переднего края ствола и гильзой из окна выброса, реальным полётом пули, pickup/иконкой и звуками. Оба вида перезарядки и fallback описаны в [docs/ASSETS.md](docs/ASSETS.md#пистолет--pack40).

Мина: одобренный Pack39 с согласованными ready/throw/reload, мировыми состояниями, взрывом/дымом/следом и звуками. Реальный выпуск согласован с кадром броска; отмена до выпуска сохраняет боезапас. На полу мина имеет низкий 3D-корпус; любой наступивший на активированную мину погибает, включая владельца. Контракт и fallback: [docs/ASSETS.md](docs/ASSETS.md).

Дробовик: Pack38 с подробными FPS-позами, огнём/дымом из дула и падающей гильзой из окна выброса. Источники и проверки описаны в docs/ASSETS.md.

[![Validate](https://github.com/zeter1/ZAP-ZONE/actions/workflows/validate.yml/badge.svg)](https://github.com/zeter1/ZAP-ZONE/actions/workflows/validate.yml)

**ZAP ZONE** — динамичный браузерный 3D FPS на **Three.js/WebGL** с командным боем **5×5**: игрок и 4 союзных AI-бота против пятёрки противников. Команды давят сектора, заходят во фланг, подавляют огнём, реагируют на ракетные угрозы уклонениями и перестраивают план под стиль игрока. По мере прогрессии боты становятся опаснее, но сохраняют различимые ролевые профили — anchor, assault, flank и engineer не превращаются в одинаковые «мешки HP».

Перестрелка строится не только вокруг DPS: у оружия различаются spread/bloom, отдача и восстановление, falloff, магазины, reload/cycle handling и баллистика; обычные пули имеют время полёта и drop, а AI теперь теряет устойчивость не только в движении, но и внутри длинной очереди. Поэтому смена позиции, короткие контролируемые серии и выбор оружия под дистанцию реально меняют ход боя.

## История изменений

Все обновления и изменения по версиям вынесены в отдельный журнал:

[**CHANGELOG — история изменений ZAP ZONE**](https://github.com/zeter1/ZAP-ZONE/blob/main/CHANGELOG.md)

Дымовуха Pack42: подробные руки и последовательность броска, корпус в полёте и объёмный 3D-дым с расширением, движущимися клубами, внутренними тенями и рассеиванием. Дым распространяется по земле в радиусе19,5м, плотная середина закрывает обзор внутри и за облаком. Пол и препятствия отсекают дым по глубине сцены; облегчённый расчёт сохраняет чёткие края объектов перед облаком. Прежние плоские облака и светящееся кольцо отключены. [Контракт ассетов и проверки](docs/ASSETS.md#дымовуха--pack42).

## Возможности

- 3D-арена на Three.js/WebGL.
- Командный режим 5×5: игрок + 4 союзных адаптивных бота против 5 вражеских ботов.
- Боты используют двухсегментную IK-подгонку рук к реальным точкам хвата оружия: правая кисть держит рукоять/спуск, левая поддерживает цевьё или корпус снаряжения.
- Tactical AI 2.0 координирует роли внутри команды: общий focus target, suppressor, левый/правый flank, anchor и engineer.
- Фланкеры ищут боковые огневые позиции, suppressor удерживает цель более длинными, но менее точными очередями, а anchor/engineer могут прикрывать сильно раненого союзника.
- Подавление влияет на AI-ботов без искусственного урона: промахи под плотным огнём повышают вероятность ухода в укрытие и временно ухудшают точность ответного огня.
- Combat AI 2.1 делит арену на тактические районы и оценивает локальный контроль, численность команд и глубину продвижения.
- Команда динамически выбирает приказ **ШТУРМ / УДЕРЖАНИЕ / ВОЗВРАТ**; боты собираются в нужной зоне вместо бесцельного patrol по всей карте.
- При преимуществе команда продавливает следующий сектор, при потере своей половины карты делает retake, а в меньшинстве сокращает преследование и удерживает выгодный район.
- Combat AI 2.2 отслеживает стиль движения игрока: длительная стрельба из одной небольшой зоны вызывает **ПРОРЫВ** с suppressor + pincer flank, а глубокий раш в красную половину — защитный retake.
- После нескольких неудачных push/breach команда временно снижает темп и перестраивается вместо повторения одной и той же атаки.
- Движение ботов ограничено acceleration/speed caps и collision micro-steps: уклонения остаются быстрыми, но больше не дают визуальных «телепортов» и сверхскоростных рывков при застревании.
- Огневая устойчивость AI зависит от реального движения после collision: стрельба с места точнее, быстрый strafe сильнее раскачивает прицел, а после остановки точность восстанавливается плавно — с отдельной чувствительностью для снайперского, автоматического и тяжёлого оружия.
- Очереди AI получили weapon-class-aware burst recoil: первый выстрел наиболее settled, rifle/plasma заметно накапливают разброс в длинной серии, pistol — слабее, а паузы дают `dt`-независимое восстановление. Fire-control явно сообщает исход попытки: wall/smoke сохраняет прежнюю cadence, friendly-fire и небезопасная ракета получают bounded retry без списания реального burst, а визуальный след wall-blocked попытки теперь заканчивается на первом укрытии вместо прохода сквозь геометрию.
- Индикатор LEVEL/XP вынесен в левый верхний угол и больше не пересекается с центральной панелью оружия.
- 10 типов оружия и снаряжения, включая снайперскую винтовку и отдельную осколочную гранату (слот `0`).
- Новая игра начинается только с пистолетом: остальные типы оружия нужно находить на арене.
- У каждого оружия собственный магазин и собственный резерв боеприпасов.
- Подбор оружия пополняет только его резерв случайным количеством **3–100** патронов.
- Когда у найденного оружия одновременно заканчиваются магазин и резерв, оно временно исчезает из weapon-bar и из колесика/Q; следующий pickup этого же типа возвращает слот.
- Отдельных ящиков с универсальными патронами больше нет; оружие и аптечки после подбора появляются заново в случайных свободных местах карты. Одновременно доступны38 экземпляров оружия и40 аптечек (24 аптечки в mobile/PERF).
- Единый factory 3D-моделей оружия для игрока, AI и world pickups.
- Все 9 first-person моделей получили отдельный premium-pass: более сложные силуэты, rails/optic/muzzle/vent детали, улучшенные руки и индивидуальные SVG tech + skin панели в `assets/weapons/fp/`.
- Для 8 first-person слотов игрока используется approved V3 generated pack: pistol/shotgun/rifle/rocket/plasma/sniper плюс mine и smoke. Все assets используют baked-hands, прозрачный headroom и HUD-safe placement; DOM presentation работает на HTTP/HTTPS и `file://`, лениво загружается после старта матча, имеет ограниченный frame-rate-independent visual recoil и отдельный layered muzzle flash для огнестрела. Бомба Pack41 имеет согласованные руки и установку, объёмный корпус на земле, 17 кадров одного большого взрыва и сохранённый дым; подробности в docs/ASSETS.md.
- Дробовик использует Pack37: согласованные руки/помпа/зарядка патрона, вспышка, дым, летящая дробь, гильза, pickup, иконка и четыре звука. Исправлены старт дроби внутри близкой стены, отсутствующее подтверждение боковых попаданий и слишком быстрое исчезновение камерной отдачи; правила и fallback — в `docs/ASSETS.md`.
- Ракетница использует Pack35 в сине-оранжевом стиле ZAP ZONE: ствол направлен к прицелу, объёмная ракета плавно разгоняется и взрывается при первом контакте со стеной, крышей, полом или персонажем. Игрок и боты могут выпускать ракету раз в10 активных секунд; смена оружия и перезарядка не обходят интервал, оставшееся время видно в HUD. Базовый радиус урона9,1м, взрыв и дым увеличены на40%. Прямое попадание убивает враждебную цель с одного выстрела; урон взрыва рядом зависит от расстояния, бонусы радиуса игрока сохранены. Следы сохраняются15 активных секунд, затухая в последние две; правила и fallback — в `docs/ASSETS.md`.
- Плазма в руках игрока использует Pack 33: прозрачный ready-ассет и tactical/empty reload происходят из одного набора кадров. Вылет привязан к точке дула с учётом движения оружия; летящие плазменные сгустки уменьшены на 22%. Pack 31 остаётся согласованным резервным комплектом; правила и fallback описаны в `docs/ASSETS.md`.
- Реальные SVG assets оружия в `assets/weapons/`.
- Новый asset catalog: `src/assets/catalog.js`.
- Подбираемые предметы парят без напольной тени. Подробные alpha-рендеры проецируются в DOM каждый кадр; стены и дым скрывают предметы. Pack44 улучшает чёткость восьми видов оружия и аптечки до1024×768; mine/grenade сохраняют текущий дизайн. Контракт и decode fallback — docs/ASSETS.md.
- Generated visual assets имеют обязательный dual-runtime contract: одинаково используются после загрузки проекта в uCoz/HTTP(S) и при прямом локальном запуске `index.html` через `file://`; локальный запуск больше не отключает menu/loading background, generated logo, perk/medal/headshot/HUD presentation art.
- Улучшенная арена:
  - supply crates с декалями;
  - hazard-панели на барьерах;
  - светящиеся терминалы Zone Net.
- SVG-логотип и HP/armor/XP HUD icons; игровой прицел рисуется единым динамическим CSS-reticle.
- XP, levels, perks, autosave, WebGL recovery и адаптивная графика.
- Встроенные Web Audio SFX без внешних аудиофайлов.
- Настройки чувствительности, громкости эффектов, screen shake, динамического прицела и FPS.
- Hitmarker с отдельной индикацией критов/убийств и направление входящего урона.
- Разные fire modes и handling-профили: semi-auto, automatic, pump, launcher и bolt-action.
- Индивидуальные spread/bloom, damage falloff, отдача и восстановление recoil.
- Для обычных огнестрельных стволов — реальное время полёта пули, swept collision и bullet drop; ракеты остаются физическими снарядами.
- Физические ракеты дополнительно получают отслеживаемый generated VFX-выхлоп: 12-кадровый огонь/искры/дым проецируются из реальной позиции снаряда, ориентируются по его полёту и скрываются за геометрией, сохраняя процедурный Three.js-факел как fallback.
- SR-9 использует мгновенный hitscan и отдельный 8× scope; штурмовая винтовка получила собственный прозрачный optical overlay по ПКМ — центр линзы показывает игровой мир, а затемнение остаётся только вокруг оптики.
- Динамический crosshair обычного оружия показывает текущую неточность от движения, прыжка и очереди.
- Время вскидывания, sprint-to-fire, pump/bolt cycle и разные tactical/empty reload делают handling оружия физически различимым.
- Дробовик заряжается по одному патрону и может прервать перезарядку выстрелом после вставленного патрона.
- SR-9 гарантированно убивает первую цель одним прямым попаданием; пробитая вторая цель получает ослабленный penetration-урон.
- SR-9 получила согласованный графический комплект Pack 32: оружие с руками, обычная и пустая перезарядка, работа затвора, компактная вспышка, дым, след пули и выброс гильзы. Отображение использует существующие таймеры и запасные ассеты; характеристики оружия сохранены.

## Управление

| Действие | Клавиша |
|---|---|
| Движение | `W A S D` |
| Бег | `Shift` |
| Приседание | `X` (удерживать) |
| Прыжок | `Space` |
| Обзор | мышь |
| Огонь | ЛКМ |
| Оптический прицел штурмовой винтовки / 8× scope SR-9 | ПКМ |
| Перезарядка | `R` |
| Оружие | `1–9`, граната — `0` |
| Сила броска гранаты | удерживать ЛКМ до 1,1 с, затем отпустить |
| Следующее / предыдущее найденное оружие | колесо мыши вниз / вверх |
| Предыдущее оружие | `Q` |
| Мина | `F` |
| Бомба | `G` |
| Пауза | `Esc` |

## Запуск

```bash
git clone https://github.com/zeter1/ZAP-ZONE.git
cd ZAP-ZONE
python -m http.server 8000
```

Откройте `http://localhost:8000`.

## Структура

```text
index.html
├── src/
│   ├── assets/catalog.js
│   ├── styles/game.css
│   ├── core/engine.js
│   ├── weapons/system.js
│   ├── player/state.js
│   ├── settings/settings.js
│   ├── combat/combat.js
│   ├── ai/{bot-progression-scaling,bot-perception,bot-damage-reaction,bot-suppression-response,bot-dodge-response,bot-navigation,bot-positioning,bot-cover-execution,bot-engagement-movement,bot-weapon-policy,bot-fire-control,bot-fire-cadence,bot-deployables,bot-state-policy,tactics}.js
│   ├── game/frontline.js
│   ├── entities/{bot-model3d,bot-presentation,bots,pickups}.js
│   ├── progression/progression.js
│   ├── game/session.js
│   ├── ui/minimap.js
│   └── game/runtime.js
├── assets/
│   ├── weapons/*.svg
│   ├── pickups/*.svg
│   ├── environment/*.svg
│   ├── characters/models/*.{glb,js}
│   └── ui/*.svg
├── asset-staging/<dated-pack>/
├── scripts/validate-structure.mjs
├── docs/{README,AI_WORKFLOW,ARCHITECTURE,ASSETS,BLENDER_ASSET_PIPELINE}.md
├── AGENTS.md
├── task/README.md
├── CHANGELOG.md
└── .github/workflows/validate.yml
```

## Для ChatGPT / Codex / AI-разработки

Начинайте с короткой карты **[AGENTS.md](AGENTS.md)** и индекса **[docs/README.md](docs/README.md)**; для рабочего цикла используйте **[docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md)**, затем открывайте только документацию нужного домена. Архитектурные владельцы и инварианты находятся в **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**; для bot progression scaling — **[docs/specs/BOT_PROGRESSION_SCALING.md](docs/specs/BOT_PROGRESSION_SCALING.md)**, для damage-event retaliation — **[docs/specs/BOT_DAMAGE_REACTION.md](docs/specs/BOT_DAMAGE_REACTION.md)**, для dodge RNG/execution — **[docs/specs/BOT_DODGE_RESPONSE.md](docs/specs/BOT_DODGE_RESPONSE.md)**, для locomotion — **[docs/specs/BOT_NAVIGATION.md](docs/specs/BOT_NAVIGATION.md)**, для cover/peek execution — **[docs/specs/BOT_COVER_EXECUTION.md](docs/specs/BOT_COVER_EXECUTION.md)**, для engage movement/RNG/range matchups — **[docs/specs/BOT_ENGAGEMENT_MOVEMENT.md](docs/specs/BOT_ENGAGEMENT_MOVEMENT.md)**, для исполнения bot-shot, closed outcome и blocked-shot endpoint — **[docs/specs/BOT_FIRE_CONTROL.md](docs/specs/BOT_FIRE_CONTROL.md)** и **[docs/patterns/OCCLUSION_CONSISTENT_PRESENTATION.md](docs/patterns/OCCLUSION_CONSISTENT_PRESENTATION.md)**, для outcome-aware cadence/safety retry/RNG order — **[docs/specs/BOT_FIRE_CADENCE.md](docs/specs/BOT_FIRE_CADENCE.md)** и **[docs/patterns/OUTCOME_DRIVEN_CADENCE.md](docs/patterns/OUTCOME_DRIVEN_CADENCE.md)**, для individual mine/bomb policy — **[docs/specs/BOT_DEPLOYABLES.md](docs/specs/BOT_DEPLOYABLES.md)**, для high-level bot state selection и priority thresholds — **[docs/specs/BOT_STATE_POLICY.md](docs/specs/BOT_STATE_POLICY.md)**, для bot geometry/arm rig — **[docs/specs/BOT_PRESENTATION.md](docs/specs/BOT_PRESENTATION.md)**. Asset/runtime contract — в **[docs/ASSETS.md](docs/ASSETS.md)**. Для Blender/GLB/3D-моделей, deterministic rebuild, shading/normals, переноса в Three.js и dual-runtime verification — **[docs/BLENDER_ASSET_PIPELINE.md](docs/BLENDER_ASSET_PIPELINE.md)**. Очередь небольших следующих проходок — в `task/`.

Правило проекта: refactor переносит **ownership + invariants + verification oracle**, а не просто строки кода. После source/runtime-изменения обязательны build-stamp check, structural validation и browser smoke; полезные проверки не отключаются ради зелёного CI.


## Визуальные assets

Подробный контракт интегрированных ассетов: **[docs/ASSETS.md](docs/ASSETS.md)**. Отдельный production-процесс для **Blender → GLB → Three.js / `file://`**: **[docs/BLENDER_ASSET_PIPELINE.md](docs/BLENDER_ASSET_PIPELINE.md)**. Короткая карта runtime-каталогов для AI/разработчика: **[assets/README.md](assets/README.md)**; source/provenance batches живут в `asset-staging/`.

Сгенерированный presentation-pack подключён только через DOM/CSS, а не через постоянные WebGL texture-quads. Это сохраняет hosting-safe поведение на uCoz: если raster-файл недоступен, UI использует fallback и 3D-сцена не превращает отсутствующую текстуру в чёрную плоскость. Generated presentation art активируется и на HTTP/HTTPS, и при прямом `file://` запуске. Classic scripts получают build-key `?v=<application-build>` в обоих режимах, чтобы локальный Chrome не удерживал stale JS после обновления; SVG/gradient/procedural fallback используется при реальной ошибке загрузки/декодирования или недоступном optional pack.

- `assets/ui/backgrounds/menu-bg-arena-01.jpg` — фон главного меню;
- `assets/ui/backgrounds/loading-bg-arena-01.jpg` — фон загрузочного экрана;
- `assets/ui/zap-zone-logo-01.png` — новый логотип с fallback на `assets/ui/logo.svg`;
- `assets/ui/{health-icon-tech-01,armor-icon-01,xp-star-01}.png` — новые HUD-эмблемы;
- `assets/environment/{hazard-panel-01,terminal-screen-01}.jpg` — декоративные UI-панели, не используемые как WebGL surfaces.
- `assets/ui/teams/{blue-team-emblem-01,red-team-emblem-01}.png` — командные эмблемы в верхнем scoreboard;
- `assets/ui/icons/ammo-tech-01.png` — боезапас в weapon HUD;
- `assets/ui/perks/{damage-tech-01,speed-tech-01,reload-tech-01}.png` — сгенерированные иконки ключевых perk-карточек с fallback на старые SVG;
- `assets/ui/objective/frontline-beacon-01.png` — значок текущей Frontline-цели;
- `assets/ui/pickups/weapon-crate-tech-01.png` — визуальный маркер weapon-pickup/crate в стартовых подсказках.
- `assets/ui/medals/{first-blood,double-kill,triple-kill,killing-spree,longshot,critical-kill,explosive-kill,headshot}-tech-01.png` — generated combat-medal pack для kill/precision feedback.
- `assets/ui/medals/multikill-tech-02.webp` — отдельная generated-эмблема MULTI KILL, закрывающая прежний SVG-only gap;
- `assets/ui/feedback/{levelup-core-tech-01,death-skull-tech-01,armor-break-tech-01}.webp` — level-up, death и armor-break feedback;
- `assets/ui/objective/frontline-capture-tech-01.webp` — новый компактный знак активной Frontline-цели;
- `assets/ui/perks/defender-tech-01.webp` — общий generated crest для defensive perk-карточек с индивидуальными SVG fallback.

Combat medal PNG используются только в DOM HUD: `showCombatMedal(...)` подставляет raster на HTTP/HTTPS и автоматически откатывается на соответствующий `assets/medals/*.svg`, а headshot popup использует `headshot-tech-01.png` с fallback на `assets/fx/headshot.svg` / `headshot-kill.svg`. `multikill.svg` сохраняется как fallback, а HTTP/HTTPS использует отдельный `multikill-tech-02.webp`.

Pack 3 хранится в оптимизированных 256×256 WebP с alpha. На HTTP/HTTPS MULTI KILL, level-up, death, armor-break, Frontline и defensive perks получают новые изображения; file:// сохраняет SVG/текстовые fallback, а Frontline decorative icon не является обязательным для понимания цели.

Все generated raster-packs остаются presentation-only: они включаются только через DOM/CSS на HTTP/HTTPS, не попадают в Three.js texture planes/sprites и при отсутствии файла не могут превратить 3D-поверхность в чёрный прямоугольник.

Существующие SVG сохраняются как fallback и для тех UI/asset-contracts, где они уже используются:

- `assets/pickups/medkit.svg` — sprite аптечки; боезапас теперь выдаётся только подбором оружия соответствующего типа;
- `assets/environment/crate.svg` — декаль supply crates;
- `hazard.svg` — маркировка барьеров;
- `terminal.svg` — экран игровых терминалов;
- `assets/ui/logo.svg` — главное меню;
- `health.svg`, `armor.svg`, `xp.svg` — HUD;
- `assets/ui/rifle-scope.svg` — прозрачная оптика штурмовой винтовки, не закрывающая сцену внутри линзы;
- `assets/weapons/fp/*-tech.svg` — sci-fi tech decals для first-person моделей;
- `assets/weapons/fp/*-skin.svg` — дополнительные weapon-specific skin/armor панели для всех 9 типов оружия;
- `assets/characters/*-armor-mark.svg` — новые командные маркировки брони ботов; динамический gameplay-reticle обычного оружия не зависит от отдельного SVG.

## Обновление на uCoz / static hosting без Ctrl+F5

Для HTTP/HTTPS-хостинга игра использует build manifest и cache-busting:

- `version.json` хранит независимый build ID;
- `index.html` при старте запрашивает manifest с `cache: 'no-store'` и уникальным query;
- при обнаружении нового build выполняется один guarded reload с `?zap_build=<id>`;
- CSS и локальные JS получают `?v=<build-id>`, catalog/DOM assets получают тот же build key;
- `file://` не делает network version check и запускает local scripts без cache key;
- `node scripts/stamp-web-build.mjs` автоматически пересчитывает build ID по runtime-файлам, а CI запрещает commit со stale `index.html` / CSS / `version.json`.

Для ручной публикации через файловый менеджер сначала загрузите новые runtime-файлы и `index.html`, а `version.json` — **последним**. Manifest означает, что новая сборка уже полностью доступна. После первого внедрения bootstrap следующие релизы не должны требовать Ctrl+F5; у пользователя со старым `index.html`, закэшированным ещё до появления bootstrap, один последний hard refresh теоретически возможен.

## Проверка

GitHub Actions **Validate** имеет только `contents: read` и выполняет:

- `node --check` всех JS;
- проверку структуры и всех SVG;
- проверку фактического подключения новых assets;
- browser boot smoke test в headless Chrome.

## Диагностика

Для воспроизводимой проблемы укажите браузер и версию, GPU/WebGL-среду, режим качества/FPS, оружие или тип AI-сценария, точные шаги и небольшой фрагмент DevTools Console без секретов.

Структурированная форма: **[Bug report](https://github.com/zeter1/ZAP-ZONE/issues/new?template=bug_report.yml)**.

## Безопасность

Политика ответственного сообщения об уязвимостях: **[SECURITY.md](SECURITY.md)**.

## Ограничения

- Three.js r128 пока загружается с CDN.
- Полный интерактивный E2E бой пока не автоматизирован; CI доказывает boot/static contracts, но не полный gameplay runtime.

Осколочная граната использует Pack34: полноценные руки при броске, видимый полёт и лежащий снаряд, взрыв в игровом мире и перспективная воронка на земле на 15 секунд. Радиус урона 8 м, 80% максимального здоровья до 2 м с плавным спадом; броня поглощает максимум 10% этого урона (80 → 72 HP при maxHP100); сплошная стена защищает от гранаты. Правила ассетов и fallback — `docs/ASSETS.md`.
