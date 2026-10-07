# Набор prompts — built-in image_gen

Общее: Use case stylized-concept; true alpha; ZAP ZONE silver/charcoal worn metal, cyan-blue inserts, amber lights; no text/scene/borders; source ready01 is identity/style reference.

- Ready: first-person right hand holds referenced canister, 16:9, lower-right, transparent top/left, continuous glove→wrist→long armored forearm through bottom-right canvas edge; anatomy and HUD-safe placement mandatory.
- Throw: six row-major full16:9 viewports in3×2: ready, left hand pulls ring, windup, release with open empty fingers, empty-hand recovery, next-ready. Same camera/device/gloves/scale. Every forearm exits own cell. Target3840×1440; actual2048×768. No mechanical authority in image.
- Throw correction: preserve6poses, remove exterior haze and flying painted grenade from release cell; actual projectile belongs to simulation. Selected source smoke-action-clean-42.png; initial source retained as rejected provenance.
- Reload: three16:9 poses in one row: lower empty glove, draw identical canister with supporting left hand, ready. Continuous forearms. Target3840×720; actual2172×724 (source cells are square, requires framing inspection before derivative).
- World:4×2, isolated body-only views, four rotations, landed/venting states, pickup, icon; same canister; transparent padding, no hands, fire, text, projectile trails.
- Cloud:3×2 six512px cells; same bottom-center anchor; pressurized emission, growing column, dense canopy, sustained gray cloud, thinning curls, final wisps. Cold slate/silver charcoal neutral volumetric smoke; no explosion or orange fire.
- Overlay:16:9 inside-smoke mist; semitransparent cool-gray full viewport fog, subtle eddies, uniform density, no objects/HUD.

Точные исходные вызовы сохранены в текущем диалоге. Размеры выше отражают фактический результат, а не обещание генератора.

Дополнительные отдельные full16:9 FPS источники1672×941: pin — левая рука тянет кольцо при сохранении правого хвата; windup — отведённая назад правая рука с тем же устройством; release — пустая раскрытая ладонь и цельное предплечье без нарисованного летящего корпуса; draw — обе цельные руки извлекают идентичное устройство. Прозрачный верх/лево, руки выходят за низ/право canvas, те же металл/перчатки/cyan/amber.

Near: четыре разных плотных холодных серых объёмных клуба/разветвления в2×2; исправленный padded source1254×1254 сохраняет прозрачные поля всех клеток. Far: шесть широких непохожих облаков с мягкими краями в3×2,1536×1024. Wisps: восемь разных ветвей/завихрений/шлейфов4×2,1774×887, без огня, текста, предметов. Inside edge: полупрозрачная лёгкая неоднородная дымка1672×941; inside dense — плотнее. World correction: четыре поворота корпуса, landed, venting, pickup и icon4×2,1774×887, с прозрачными полями и без рук. Runtime slicing и точные окна отражены manifest.json.

Финальная правка cloud/far: 3×2 листы с полностью видимыми free-floating клубами дыма и мягким неровным низом без пола/плоской базы. Первая near-soft sheet отклонена из-за bleed между ячейками. Четыре финальных отдельные квадратные near sources: compact rounded dense billow; asymmetric forked three-arm billow; curled sideways vortex; broad low ragged cluster. Каждый full square canvas сохраняется с дополнительным transparent padding при сборке2×2. Не применяется рисование/retouch средствами Pillow.

Финальная замена после проверки отдельных слоёв в игре: все near/far/timeline клетки используют самостоятельные square sources. Added phase0 pressurized early plume, phase1 growing branched cloud, phase4 thinning eddies, phase5 fading mist, far4 wide windswept bank, far5 forked dense cluster. Prompts require single complete floating smoke mass, real alpha, clear margins all four sides, no ground, no flat bottom, no grid, no neighboring fragments. Existing four near sources supply sustained/dense frames and four distant variants. Full canvas resize only, extra28px padding; rejected sheets remain provenance. Actual generated shapes/density are verified in game; runtime density fades independently of source appearance.
