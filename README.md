# ZAP ZONE

**ZAP ZONE** — браузерный 3D FPS на **Three.js/WebGL** с командным боем **5×5**: игрок и 4 союзных AI-бота против команды из 5 вражеских ботов.

## История изменений

Все обновления и изменения по версиям вынесены в отдельный журнал:

[**CHANGELOG — история изменений ZAP ZONE**](https://github.com/zeter1/ZAP-ZONE/blob/main/CHANGELOG.md)

## Возможности

- 3D-арена на Three.js/WebGL.
- Командный режим 5×5: игрок + 4 союзных адаптивных бота против 5 вражеских ботов.
- 9 типов оружия и снаряжения, включая отдельную bolt-action снайперскую винтовку.
- Единый factory 3D-моделей оружия для игрока, AI и world pickups.
- Реальные SVG assets оружия в `assets/weapons/`.
- Новый asset catalog: `src/assets/catalog.js`.
- Красивые world pickups:
  - sci-fi ящик боеприпасов;
  - медицинский контейнер;
  - weapon pickups с реальными SVG-иконками.
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
- SR-9 использует мгновенный hitscan и отдельный 8× scope: обычного crosshair у неё нет, а ПКМ-прицел доступен только этой винтовке.
- Динамический crosshair обычного оружия показывает текущую неточность от движения, прыжка и очереди.
- Время вскидывания, sprint-to-fire, pump/bolt cycle и разные tactical/empty reload делают handling оружия физически различимым.
- Дробовик заряжается по одному патрону и может прервать перезарядку выстрелом после вставленного патрона.
- SR-9 гарантированно убивает первую цель одним прямым попаданием; пробитая вторая цель получает ослабленный penetration-урон.

## Управление

| Действие | Клавиша |
|---|---|
| Движение | `W A S D` |
| Бег | `Shift` |
| Прыжок | `Space` |
| Обзор | мышь |
| Огонь | ЛКМ |
| 8× scope SR-9 | ПКМ |
| Перезарядка | `R` |
| Оружие | `1–9` |
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
│   ├── entities/{bots,pickups}.js
│   ├── progression/progression.js
│   └── game/runtime.js
├── assets/
│   ├── weapons/*.svg
│   ├── pickups/*.svg
│   ├── environment/*.svg
│   └── ui/*.svg
├── scripts/validate-structure.mjs
├── docs/ARCHITECTURE.md
├── CHANGELOG.md
└── .github/workflows/validate.yml
```

## Визуальные assets

Все новые SVG имеют прозрачность там, где она нужна, и используются непосредственно игрой:

- `assets/pickups/ammo.svg` и `medkit.svg` — world sprites над 3D pickups;
- `assets/environment/crate.svg` — декаль supply crates;
- `hazard.svg` — маркировка барьеров;
- `terminal.svg` — экран игровых терминалов;
- `assets/ui/logo.svg` — главное меню;
- `health.svg`, `armor.svg`, `xp.svg` — HUD; динамический gameplay-reticle не зависит от отдельного SVG.

## Проверка

GitHub Actions **Validate** имеет только `contents: read` и выполняет:

- `node --check` всех JS;
- проверку структуры и всех SVG;
- проверку фактического подключения новых assets;
- browser boot smoke test в headless Chrome.

## Ограничения

- Three.js r128 пока загружается с CDN.
- Полный интерактивный E2E бой пока не автоматизирован.
