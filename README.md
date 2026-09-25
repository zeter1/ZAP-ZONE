# ZAP ZONE

**ZAP ZONE** — браузерный 3D FPS на **Three.js/WebGL**: один игрок против 9 адаптивных ботов в режиме free-for-all.

В v21.5 игра прошла архитектурный рефакторинг: `index.html` теперь является оболочкой, а игровые подсистемы разделены по `src/`.

## Возможности

- 3D-арена на Three.js/WebGL.
- 1 игрок + 9 адаптивных ботов.
- 8 типов оружия и снаряжения: пистолет, дробовик, винтовка, ракетница, плазма, мины, бомбы и дымовуха.
- Единый factory красивых 3D-моделей оружия:
  - детальная first-person модель в руках игрока;
  - облегчённая модель в руках AI;
  - world-модель оружия на земле.
- SVG weapon assets в `assets/weapons/`.
- Лежащее оружие можно подобрать; оно переключает активный слот и восстанавливает магазин/заряд.
- Стрельба, reload, recoil, tracers, casings и hit effects.
- Rockets, mines, bombs и smoke.
- XP, levels, perks и пять путей развития.
- Armor, regeneration, critical hits, lifesteal и другие modifiers.
- Autosave в `localStorage` / `sessionStorage`.
- WebGL context recovery и адаптация графики под слабые устройства.

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

## Требования

- современный браузер с WebGL;
- JavaScript;
- интернет для загрузки Three.js r128 с cdnjs.

## Архитектура

```text
index.html
├── src/
│   ├── styles/game.css
│   ├── core/engine.js
│   ├── weapons/system.js
│   ├── player/state.js
│   ├── combat/combat.js
│   ├── entities/
│   │   ├── bots.js
│   │   └── pickups.js
│   ├── progression/progression.js
│   └── game/runtime.js
├── assets/weapons/*.svg
├── scripts/validate-structure.mjs
├── docs/ARCHITECTURE.md
└── .github/workflows/validate.yml
```

Подробности: `docs/ARCHITECTURE.md`.

### Оружие

`src/weapons/system.js` — единый источник данных и визуальной логики оружия. `createWeaponModel()` создаёт согласованный дизайн для игрока, ботов и world pickups. На слабых устройствах bot/world детализация уменьшается через существующий `MOBILE_LOW`.

## Сохранения

Сохраняются level/XP, score/kills, HP/armor, weapon/ammo, perks, позиция игрока и cooldown специального снаряжения.

## Диагностика

1. Откройте DevTools (`F12`) и Console.
2. Проверьте загрузку Three.js.
3. Проверьте WebGL.
4. Запускайте через HTTP server.
5. Проверьте GitHub Actions → **Validate**.

## Ограничения

- Управление в первую очередь ориентировано на ПК.
- Three.js пока загружается с внешнего CDN.
- Полного browser E2E набора пока нет.

## Проверка

Workflow **Validate** read-only и выполняет:
- `node --check` для всех JS;
- проверку структуры;
- проверку weapon assets;
- проверку подключений из `index.html`.

README-only commit workflow не запускает.

## Ручной smoke test

1. загрузка игры;
2. start + pointer lock;
3. движение / прыжок / стрельба;
4. переключение `1–8`;
5. осмотр first-person оружия;
6. подбор лежащего оружия;
7. оружие у ботов;
8. reload;
9. mine/bomb/smoke;
10. XP/perk;
11. pause/resume;
12. reload page + autosave restore.
