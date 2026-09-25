# ZAP ZONE

**ZAP ZONE** — браузерный 3D FPS на **Three.js/WebGL**: один игрок против 9 адаптивных ботов в режиме free-for-all.

В v21.6 проект получил второй большой визуальный проход: после оружия отдельные SVG-ассеты и более детальные 3D-представления появились у pickups, объектов арены и HUD.

## Возможности

- 3D-арена на Three.js/WebGL.
- 1 игрок + 9 адаптивных ботов.
- 8 типов оружия и снаряжения.
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
- Новый SVG-логотип, crosshair, HP/armor/XP HUD icons.
- XP, levels, perks, autosave, WebGL recovery и адаптивная графика.

## Управление

| Действие | Клавиша |
|---|---|
| Движение | `W A S D` |
| Бег | `Shift` |
| Прыжок | `Space` |
| Обзор | мышь |
| Огонь | ЛКМ |
| Zoom | ПКМ |
| Перезарядка | `R` |
| Оружие | `1–8` |
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
└── .github/workflows/validate.yml
```

## Визуальные assets

Все новые SVG имеют прозрачность там, где она нужна, и используются непосредственно игрой:

- `assets/pickups/ammo.svg` и `medkit.svg` — world sprites над 3D pickups;
- `assets/environment/crate.svg` — декаль supply crates;
- `hazard.svg` — маркировка барьеров;
- `terminal.svg` — экран игровых терминалов;
- `assets/ui/logo.svg` — главное меню;
- `crosshair.svg`, `health.svg`, `armor.svg`, `xp.svg` — HUD.

## Проверка

GitHub Actions **Validate** имеет только `contents: read` и выполняет:

- `node --check` всех JS;
- проверку структуры и всех SVG;
- проверку фактического подключения новых assets;
- browser boot smoke test в headless Chrome.

## Ограничения

- Three.js r128 пока загружается с CDN.
- Полный интерактивный E2E бой пока не автоматизирован.
