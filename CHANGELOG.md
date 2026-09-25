# Changelog — ZAP ZONE

Все заметные игровые и инженерные изменения фиксируются здесь отдельными версиями: что изменилось, зачем и как это проверяется.

## v21.9 — 2026-09-25

### Добавлено
- отдельный модуль `src/settings/settings.js`;
- меню настроек из стартового экрана и паузы;
- чувствительность мыши 0.50×–2.00×;
- регулируемая громкость звуковых эффектов;
- переключатели screen shake, динамического прицела и FPS-индикатора;
- Web Audio SFX для стрельбы, попаданий, критов, убийств, перезарядки, урона, level-up, смерти и взрывов;
- hitmarker с состояниями hit / headshot / critical / kill;
- указатель направления входящего урона;
- сохранение пользовательских настроек отдельно от игрового прогресса.

### Изменено
- mouse-look использует пользовательский multiplier вместо жёстко заданной чувствительности;
- screen shake реализован как presentation-only CSS transform canvas и не меняет физическую позицию камеры;
- rocket explosions получают дистанционно ослабляемый звук и экранную отдачу;
- validation проверяет wiring нового settings/presentation слоя;
- текущая версия интерфейса обновлена до **v21.9**.

### Проверка
- `node --check` для всех JS;
- `scripts/validate-structure.mjs`;
- browser boot smoke test в GitHub Actions.

## v21.8 — 2026-09-25

- 52 уникальных SVG-иконки perks;
- combat medals и status HUD;
- world-space impact FX;
- отдельный armor-break feedback;
- CI связывает фактические perk ids с обязательными SVG assets.

## v21.7 — 2026-09-25

- визуальный asset layer для арены, персонажей и pickups;
- улучшенные explosions и lethal headshot finisher;
- visual meshes отделены от collision/hit meshes.
