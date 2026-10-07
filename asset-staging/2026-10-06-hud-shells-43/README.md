# HUD shells — Pack43

Интегрированные геометрические панели ZAP ZONE. Канонический контракт: [docs/ASSETS.md](../../docs/ASSETS.md#информирующий-hud--pack43).

- `hud-shells-source-43.png` — общий reference built-in image_gen; изображение не загружается игрой.
- `prompt.json` — точный исходный запрос генератора.
- `build-shells.cjs` — deterministic SVG derivative builder; запускается из любого cwd, вывод только в `assets/ui/hud/` этого проекта.
- `manifest.json` — явные source/consumer/state/fallback/size/SHA256 mappings.
- `VERIFICATION.md` — выполненные проверки, первые сбои и ограничения.

Runtime пути принадлежат `GAME_ASSETS.presentationHudShells`. Динамический текст, карта и игровые события остаются у существующих владельцев. Для изменения состава ассетов сначала обновить manifest/catalog/consumer, затем stamp и обе browser проверки.
