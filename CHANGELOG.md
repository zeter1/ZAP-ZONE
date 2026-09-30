# Changelog — ZAP ZONE

## Unreleased — 2026-09-30

### Generated Asset Pack 12 — ricochet, penetration, smoke and explosive VFX
- approved all five candidates from `asset-staging/2026-09-30-vfx-pack-12/` and integrated them into real gameplay events;
- added one deterministic scriptless 8×5 static-frame SVG mega-atlas for ricochet sparks, penetration exit debris, smoke deployment bloom, mine shrapnel detonation and bomb pressure-core detonation;
- player and bot projectile paths both emit the new ricochet/penetration presentation, while smoke/mine/bomb VFX attach to the existing authoritative deploy/detonation events;
- projectile physics, damage, blast radius, fuse timers, smoke LOS/density and audio are unchanged; existing procedural effects remain fallback and generated art stays DOM-only;
- structural validation now checks atlas dimensions/frame count/byte budget, static SVG safety, catalog/player/consumer wiring and dual-runtime build stamping.

### Generated Asset Pack 11 — explosion, plasma impact and reload VFX
- approved the three candidates from `asset-staging/2026-09-30-vfx-pack-11/` and integrated them into real gameplay events instead of leaving staging art unused;
- added deterministic static-frame SVG sprite atlases for rocket detonation, plasma impact and plasma reload energy-lock, played through the existing bounded elapsed-time VFX player;
- rocket VFX is projected at detonation world position, plasma impact is throttled and shown on actor/wall hits, and the reload lock appears only after a successful player plasma reload completion;
- existing procedural explosion/impact/reload feedback remains fallback; runtime does not load `asset-staging/**`, generated effects remain DOM-only, and gameplay/balance are unchanged;
- structural validation now checks Pack 11 presence, viewBoxes, byte budgets, absence of self-running SVG animation, catalog/runtime/consumer/CSS wiring and dual-runtime build stamping.

### Generated Asset Pack 10 — animated combat VFX atlas
- добавлены 10 новых логических one-shot анимаций: backblast ракетницы, pressure blast SR-9, дымовой blast дробовика, латунная гильза, shotgun shell, падающий магазин, concrete/metal/wood impacts и directional near-miss streak;
- все десять последовательностей упакованы в один 8×10 alpha-WebP mega-atlas 448×560 (56×56 на кадр), чтобы браузер делал один запрос/декод вместо десяти отдельных runtime-файлов;
- эффекты подключены к реальным player-shot, reload, casing-cycle, wall-impact и suppression events; кадры выбираются по elapsed time, DOM-узлы ограничены бюджетом и удаляются после one-shot;
- существующие procedural Three.js/CSS эффекты остаются authoritative fallback, gameplay/balance не менялись, generated raster не возвращается в persistent WebGL texture planes;
- structural validation проверяет VP8X alpha, размер/вес atlas, catalog/runtime/CSS wiring; dual-runtime HTTP(S)/uCoz + прямой file:// сохранён.

### Generated Asset Pack 9 — vector tactical feedback
- aligned stale structural regression oracles with the current bot overhead-fill and respawn-countdown DOM contracts so validation checks the intended behavior rather than the old implementation shape;
- added ten new generated-direction SVG runtime assets for match deployment, Frontline retarget/capture, Second Wind, dodge feedback, perk paths, equipment readiness, ally tactical callouts, pause presentation and mobile controls;
- wired every asset into a real UI/gameplay consumer while keeping text/procedural state authoritative;
- introduced an SVG derivative workflow for geometric generated HUD art to improve DPI clarity, payload size and HTTP(S)/file:// reliability;
- extended structural validation and asset documentation for Pack 9.

### Generated Asset Pack 8 — tactical readability and motion
- added ten compact alpha WebP atlases for weapon reticles, tactical minimap markers, spawn shielding, the 15-second respawn countdown, explosive fuse states, projectile trails, weapon-switch swipes, bot overhead combat frames, combo feedback and world-pickup beacons;
- wired every asset into an existing runtime consumer instead of leaving art unused; procedural/text state remains authoritative and acts as a graceful fallback;
- kept generated raster out of persistent Three.js geometry and preserved direct `file://` compatibility;
- minimap art is information-safe: it renders the player, allies, objectives, visible pickups, player-owned deployables and player smoke, but does not reveal enemy-only state;
- structural validation now checks Pack 8 presence, catalog/runtime wiring, VP8X alpha, exact dimensions and a 64 KiB per-asset budget.

### Generated Asset Pack 7 — combat textures and screen-space feedback
- added ten optimized alpha WebP combat textures: low-health vignette, directional damage, tactical smoke, ballistic/plasma muzzle sheets, explosion shockwave, suppression, armor hit, sprint speed-lines and respawn materialization;
- new textures are actually consumed at runtime through the centralized asset catalog: screen overlays stay DOM/CSS presentation-only, the two 4×2 sheets decorate the existing first-person muzzle-flash layer, and the engine only emits a presentation hook for nearby explosions;
- existing procedural arrow/gradient/glow feedback remains as graceful fallback, including direct `file://` play; no generated raster is introduced into persistent WebGL scene geometry;
- structural validation now checks Pack 7 presence/catalog/wiring, VP8X alpha, 512px dimensions and a 128 KiB per-file budget.

### Generated Asset Pack 6 — high-impact perk art
- добавлены 10 оптимизированных 256×256 alpha WebP для `bulletstorm`, `immortal`, `doubletap`, `piercing`, `laststand`, `thorns`, `explosive_rounds`, `evasive_matrix`, `headshot_armor` и `bombtech`;
- карточки выбора уровня и панель уже взятых perks используют новые арты через существующий `perkAsset(id,path)`, а точные per-id `assets/perks/*.svg` остаются fallback при load/decode error;
- generated perk art остаётся DOM-only и protocol-neutral: один и тот же presentation path работает на HTTP(S)/uCoz и при прямом `file://` запуске, без возврата raster textures в persistent WebGL scene;
- structural validation проверяет Pack 6 catalog/wiring, RIFF/WEBP + VP8X alpha, точный размер 256×256 и лимит 32 KiB; характеристики, редкости и баланс perks не менялись.

### Generated Asset Pack 5 — status HUD + legendary perks
- добавлены 8 проверенных generated WebP 256×256 с alpha: шесть статусных HUD-иконок (`secondWind`, `lifesteal`, `armorRegen`, `lowHealth`, `smokeGuard`, `critReady`) и отдельные legendary-perk арты для `predator` / `warmachine`;
- статусный HUD теперь выбирает generated art через централизованный catalog и автоматически возвращается на существующие `assets/status/*.svg` при ошибке загрузки/декодирования; обе runtime-модели HTTP(S) и `file://` сохраняются;
- `Режим хищника` и `Машина разрушения` получают собственные generated изображения в карточках выбора и perk-panel, при этом уникальные SVG остаются fallback; игровые характеристики и баланс не менялись;
- structural validation проверяет наличие/каталогизацию Pack 5, RIFF/WEBP + VP8X alpha, точный размер 256×256, лимит 32 KiB, fallback wiring и запрет использования generated raster assets в persistent WebGL scene.

### Death/respawn UX and in-game testing controls
- death result frame and message are now bottom-anchored as one responsive unit; the death reason wraps/scales inside the frame instead of escaping it;
- player first-person weapon presentation is removed immediately for the death camera, and weapon swaps keep both stale generated art and procedural fallback hidden until the new generated asset is ready;
- player respawn delay is now exactly 15 seconds while the death camera motion remains independently timed;
- Settings now include testing toggles for freezing bot AI, infinite player ammunition (including deployables), and immediate access to every weapon type without permanently changing weapon ownership in autosave;
- structural regression guards cover the new settings wiring, respawn timing, bot freeze, infinite-ammo consumption gates, death-frame containment and first-person weapon transition seam.

### Projectile ricochet parity and shared shooting-physics policy
- successful player ricochet теперь реально отражает projectile по world-space normal, уменьшает speed/damage и продолжает swept flight вместо ложного sound/FX перед удалением;
- player и bot projectile paths используют canonical `src/combat/projectile-ricochet.js`; прежние material probabilities сохранены без hidden rebalance;
- wall penetration остаётся раньше ricochet, cap = 1, post-bounce offset предотвращает повторный hit, ineligible/capped impacts не расходуют RNG;
- добавлены Node 22 regressions, spec, AI routing, structural guards и Validate step.


### Bot engage-state movement ownership
- strafe timer/direction, role/tactical optimal-range policy, opponent-weapon matchup, Frontline objective pull, flank bias, close/far correction и anchor cover tether вынесены из `Enemy.update()` в canonical owner `src/ai/bot-engagement-movement.js`;
- extraction сохраняет snapshot `myX/myZ`, exact strict thresholds, movement-addition order и branch-specific RNG: normal strafe reset draw выполняется раньше optional sniper clamp draw;
- broad fire gate/shot execution, weapon selection, cover execution, squad/frontline fact production и collision-limited navigation остаются у прежних owners; gameplay balance не менялся;
- добавлены 7 focused Node 22 regressions, `BOT_ENGAGEMENT_MOVEMENT` spec, AI routing, reverse/authority/load-order guards и отдельный Validate step.

### Bot cover / peek execution ownership
- cover reevaluation, peek-side probing, LOS/smoke validation, peek timing/envelope, hold/chaining и cover exit вынесены из большого `Enemy.update()` в canonical owner `src/ai/bot-cover-execution.js`;
- `src/ai/bot-positioning.js` сохраняет единоличное владение cover/flank destination scoring, `src/ai/bot-navigation.js` — collision-limited locomotion, а constructor/timer lifecycle и final movement остаются в `src/entities/bots.js`;
- pure extraction сохраняет probe order `[sideBias,-sideBias]`, collision rejection `> 0.55`, LOS→smoke short-circuit, peek/chain/exit thresholds и точный branch-specific RNG order; duplicate peek-envelope math заменён одним canonical helper;
- добавлены focused Node 22 regressions, `docs/specs/BOT_COVER_EXECUTION.md`, AI routing, reverse/authority/load-order guards и отдельный Validate step без ослабления HTTP/`file://` browser gates.

### Bot AI state-selection policy ownership
- strict high-level state-selection ladder вынесен из большого `Enemy.update()` в canonical owner `src/ai/bot-state-policy.js`; `stateCD` decrement/gate, derived tactical facts и state execution остаются в `src/entities/bots.js`;
- pure extraction сохраняет точный precedence `resupply → retreat → support → cover → flank → objective → engage → hunt → search → fallback`, strict/inclusive threshold semantics, ally/enemy engage-range multipliers и финальный objective/patrol fallback без gameplay rebalance;
- каждое реальное policy execution по-прежнему потребляет ровно один RNG draw для `stateCD=.22+Math.random()*.30`, а gated updates при `stateCD>0` не вызывают owner; это закреплено controlled-RNG и exact-boundary regressions;
- добавлены `docs/specs/BOT_STATE_POLICY.md`, AI routing, owner/consumer/reverse/authority/load-order structural guards и отдельный Validate step без ослабления HTTP/`file://` browser gates.

### Bot post-shot fire-cadence ownership
- post-shot burst reset, pause, next-shot `sT` и empty-mag reload handoff вынесены из большого `Enemy.update()` в canonical owner `src/ai/bot-fire-cadence.js`; broad fire gate и concrete shot execution остаются у прежних owners;
- pure extraction сохраняет все weapon/player/suppressing formulas, cadence floors `0.095/0.055`, `fireRateMul` semantics и точный branch-specific RNG order, включая legacy `normalPause` draw, который вычисляется перед enemy-player override;
- добавлены controlled-RNG Node 22 regressions, reverse/authority/order/load structural guards, отдельный `BOT_FIRE_CADENCE` spec и AI routing; constructor cadence RNG намеренно не переносится, чтобы не менять global spawn RNG order;
- Validate получает отдельный fire-cadence regression step без ослабления существующих fire-control/deployables/browser gates.

### Bot progression-scaling ownership
- deterministic level/kills/role scaling вынесен из `Enemy.syncScale()` в canonical owner `src/ai/bot-progression-scaling.js`, а constructor/update сохраняют прежнюю seam;
- pure extraction сохраняет same-level early return, `force=true`, все формулы/caps/role multipliers, 24% HP-ratio floor + legacy growth heal и clamp-before-assault semantics для fire-rate без balance changes;
- добавлены 7 Node 22 regressions, `docs/specs/BOT_PROGRESSION_SCALING.md`, AI routing, owner/consumer/reverse/load-order guards и отдельный Validate step;
- `stamp-web-build --check` теперь при stale build печатает вычисленный expected build ID, ускоряя безопасное исправление manifest/cache keys без ослабления gate.

### Bot dodge-response execution ownership
- concrete dodge execution вынесено из `Enemy.triggerDodge()` в canonical owner `src/ai/bot-dodge-response.js`, при этом public seam и оба producer-а (survived damage / rocket threat) сохранены;
- pure extraction сохраняет active/cooldown early return, preferred-direction precedence, duration/speed urgency clamps, cooldown, optional jump и точный `Math.random()` consumption order без balance changes;
- dodge timer decay, movement consumption/collision и rocket sensing остаются у прежних owners; producer-ы не обходят `Enemy.triggerDodge()`;
- добавлены 4 controlled-RNG Node 22 regressions, `docs/specs/BOT_DODGE_RESPONSE.md`, AI routing, owner/consumer/reverse/producer guards и classic-script load-order validation.

### Bot suppression-response policy ownership
- near-miss suppression response вынесен из `Enemy.registerSuppression()` в canonical owner `src/ai/bot-suppression-response.js`, при этом `Enemy.registerSuppression(...)` сохранён как стабильная public seam для `combat.js`;
- pure extraction сохраняет source guard, player-token semantics, pressure clamp `0.3..1.4`, duration `0.62 + pressure*0.78`, strict thresholds `hp/maxHp < 0.72` / `pressure > 0.9` и все timer clamps без новых RNG calls или balance changes;
- suppression decay/source expiry и cover/FSM consumers остаются в `bots.js`; swept-bullet near-miss detection остаётся в `combat.js`, поэтому detection/response/lifecycle boundaries не смешаны;
- добавлены 5 focused Node 22 regressions, `docs/specs/BOT_SUPPRESSION_RESPONSE.md`, AI routing, owner/consumer/reverse/producer guards и classic-script load-order validation.

### Bot damage-reaction policy ownership
- retaliatory target selection, source semantics, target memory/lock и reaction/burst/FSM timer clamps вынесены из `Enemy.hurt()` в canonical owner `src/ai/bot-damage-reaction.js`;
- `Enemy.hurt(...)` остаётся стабильной public seam и по-прежнему владеет HP mutation, hit presentation, dodge RNG/concrete execution и death lifecycle; порядок side effects сохранён как `dodge → damage reaction → death`;
- pure extraction сохраняет включительный threshold `dmg >= 10% maxHp`, bot/player source precedence и не добавляет новых random calls или balance changes;
- добавлены 4 focused Node 22 regressions, `docs/specs/BOT_DAMAGE_REACTION.md`, AI routing, classic-script load-order и owner/consumer/reverse/event-order guards.

### GitHub Actions Node 24 runtime migration
- `actions/checkout` обновлён до стабильного `v7.0.1` и закреплён на полном SHA `3d3c42e5aac5ba805825da76410c181273ba90b1`; `actions/setup-node` обновлён до стабильного `v7.0.0` и закреплён на полном SHA `820762786026740c76f36085b0efc47a31fe5020`;
- оба выбранных upstream-релиза объявляют `runs.using: node24`, поэтому устранён warning GitHub о Node 20 actions, принудительно запускаемых на Node 24;
- project runtime намеренно остаётся `node-version: "22"`: runtime JavaScript Action и Node-версия тестируемого проекта разделены как разные concerns;
- exact PR-head `8f4f201617cdeb955dcd81f651d8701c003a4baf` прошёл полный Validate run `36558620151` без `##[warning]`; triggers, path filters, `contents: read`, concurrency, regression suites, HTTP boot и реальный `file://` smoke сохранены.

### Bot individual mine/bomb deployable ownership
- individual mine/bomb eligibility, role/doctrine probability и deployment side effects вынесены из `src/entities/bots.js` в canonical owner `src/ai/bot-deployables.js`;
- `bots.js` сохраняет FSM/fire gate, cooldown lifecycle и порядок `bomb → mine → firearm shot`; coordinated smoke/frag остаётся в `src/ai/tactics.js`, shared constructors/state — в combat/weapon owners;
- pure extraction сохраняет thresholds, multipliers, limits, placement physics, damage/fuse/cooldown formulas и RNG consumption order без gameplay balance change;
- добавлены focused Node 22 regressions, `docs/specs/BOT_DEPLOYABLES.md`, AI routing, load-order oracle и owner/consumer/reverse structural guards.

### Bot weapon-selection policy ownership
- post-spawn weapon reconsideration, current-weapon hold/hysteresis и switch timers вынесены из `src/entities/bots.js` в canonical owner `src/ai/bot-weapon-policy.js`;
- weapon data/role-range scoring и visual implementation остаются в `src/weapons/system.js`, fire execution — в `src/ai/bot-fire-control.js`, а `bots.js` сохраняет FSM/fire-gate authority и отдельную spawn initialization;
- pure extraction сохраняет thresholds, probabilities, random-call order, magazine semantics и visual refresh order без gameplay balance change;
- добавлены focused Node 22 regressions, `docs/specs/BOT_WEAPON_POLICY.md`, AI routing и owner/consumer/reverse structural guards.

### Bot fire-control execution ownership
- aim/muzzle helpers, reload lifecycle, concrete shot execution, hit/near-miss resolution и bot kill accounting вынесены из `src/entities/bots.js` в canonical owner `src/ai/bot-fire-control.js`;
- FSM/fire gate, burst cadence, utility planting и squad doctrine остаются вне fire-control; post-spawn weapon selection теперь принадлежит `src/ai/bot-weapon-policy.js`, а projectile/collision primitives не дублируются из `src/combat/combat.js`;
- coordinated smoke/frag теперь получает muzzle origin через canonical `getBotMuzzlePos(bot)`, поэтому один muzzle contract используется и firearms, и utility;
- добавлены focused `node:test` regressions, `docs/specs/BOT_FIRE_CONTROL.md`, AI-routing и owner/consumer/reverse structural guards без gameplay balance change.

### Bot tactical positioning ownership
- cover/flank candidate filtering и scoring вынесены из `src/entities/bots.js` в canonical owner `src/ai/bot-positioning.js`;
- pure extraction сохраняет distance/LOS/smoke/route/crowding/Frontline/doctrine weights и procedural flank fallback без balance change;
- `bots.js` остаётся owner-ом FSM, reevaluation/commit timers и peek/cover/flank execution; `bot-navigation.js` — movement mechanics, `tactics.js` — squad policy, `frontline.js` — objective state;
- добавлены direct `node:test` regressions, `docs/specs/BOT_POSITIONING.md`, source-oracle migration и owner/consumer/reverse structural guards.


### Bot navigation / locomotion ownership
- patrol points, wall/smoke steering, route penalty, speed caps и collision substeps вынесены из `src/entities/bots.js` в canonical owner `src/ai/bot-navigation.js`;
- pure extraction сохраняет `BOT_MOVE_CFG`, `substep=.16`, correction/final displacement caps, smoke thresholds/weights и `WPTS` без balance change;
- `nearestHostileGrenade()`, mine/noise/hearing и individual FSM остаются в `bots.js`, squad doctrine — в `src/ai/tactics.js`; structural guards закрепляют границу;
- добавлены direct `node:test` regressions, `docs/specs/BOT_NAVIGATION.md` и AI routing для быстрого поиска owner-а.

### Bot presentation / arm-rig ownership
- procedural bot body, stable gameplay hit-mesh construction, visual armor/readability, weapon pivot и two-hand arm-rig solver вынесены из `src/entities/bots.js` в отдельный canonical owner `src/entities/bot-presentation.js`;
- `bots.js` остаётся consumer-ом presentation seam; FSM/perception/combat execution остаются там, а locomotion mechanics позднее вынесены в `src/ai/bot-navigation.js` (см. текущую запись выше); geometry, grip positions, arm constants, hit-mesh order и gameplay balance в presentation extraction не менялись;
- добавлены direct `node:test` regressions для grip coordinate conversion/hand pinning и structural owner/consumer guards, запрещающие возврат presentation implementation в AI owner;
- AI routing, architecture/spec и classic-script graph обновлены так, чтобы задачи по модели/arm rig открывали узкий owner вместо повторного чтения всего bot runtime.


### Frontline objective ownership + regression contract
- Frontline objective/game-mode orchestration вынесена из большого `src/entities/bots.js` в отдельный canonical owner `src/game/frontline.js`: state, capture/rotation, control scores, save/restore, marker и HUD теперь имеют одну границу ответственности;
- gameplay semantics сохранены без balance change: rotation/capture constants, rewards, thresholds, announcements/audio/save ordering не менялись; bots остаётся consumer-ом active objective для tactical execution;
- classic-script graph закреплён как `combat → tactics → frontline → bots`; structural validation запрещает drift извлечённого owner обратно в `bots.js` и проверяет consumer contracts;
- добавлен прямой `node:test` regression suite для restore/reset/capture semantics и новый `docs/specs/FRONTLINE.md`, чтобы fresh AI открывала точный contract вместо поиска по 90k+ `bots.js`.

### AI ownership extraction — Map Tactics / Adaptive Commander
- командный tactical layer вынесен из 2200+ строкового `src/entities/bots.js` в новый canonical owner `src/ai/tactics.js`: map zones, squad plan, doctrine selection, Adaptive Commander profile, assault-wave planning и coordinated smoke/frag policy;
- индивидуальный bot FSM/perception, cover/flank execution, suppression effects и стрельба остаются в `src/entities/bots.js`; locomotion mechanics позднее вынесены в `src/ai/bot-navigation.js`, а Frontline state — в `src/game/frontline.js`; gameplay constants, probabilities, timers и balance в tactical extraction не менялись;
- classic load graph теперь явно `combat → tactics → bots`; structural validation проверяет новый owner, запрещает drift командной policy обратно в `bots.js` и сохраняет HTTP + `file://` runtime gates;
- `docs/AI_WORKFLOW.md` и `docs/ARCHITECTURE.md` обновлены так, чтобы следующая AI-сессия сразу открывала нужный owner вместо повторного чтения всего bot runtime.

### Session lifecycle ownership + AI navigation
- браузерный lifecycle матча вынесен из `player/state.js` и `game/runtime.js` в новый canonical owner `src/game/session.js`: Pointer Lock, start/resume/pause, Escape sequencing, blur/focus/visibility/pagehide и frame-clock reset теперь собраны в одном месте;
- `runtime.js` снова отвечает за frame simulation/render + boot, а `player/state.js` — за player/save/weapon/mobile state; gameplay balance и combat semantics не менялись;
- structural validation закрепляет owner boundary и порядок загрузки `progression → session → runtime`, а существующие HTTP boot + реальный `file://` Chrome/CDP smoke остаются runtime proof;
- добавлены `AGENTS.md`, `docs/AI_WORKFLOW.md` и управляемая очередь `task/`, чтобы ChatGPT/Codex начинали с карты owner-ов и читали только релевантные спецификации;
- README исправлен под фактический dual-runtime generated-art contract: HTTP(S) и `file://` используют один presentation pack с fallback только при реальной ошибке загрузки.
### Generated Asset Pack 4 — bomb, pickups, scopes and combat feedback
- загружены 8 новых WebP: player-held bomb, world bomb pickup, medkit pickup, ammo crate, sniper scope, rifle scope, Frontline capture burst и battle/death result frame;
- bomb теперь закрывает прежний generated-art gap и в first-person, и среди world weapon pickups, сохраняя procedural fallback;
- health pickups получили DOM-projected medkit art поверх реальной 3D-позиции; procedural medkit body остаётся fallback при load/decode error;
- rifle/sniper scope используют новые WebP overlays с явным SVG fallback, поэтому ошибка raster asset не ломает прицеливание;
- Frontline capture запускает краткий presentation-only burst, а killcam/death feedback получает result frame; gameplay state и scoring не меняются;
- ammo crate используется в ammo HUD; все новые raster assets остаются DOM/CSS-only и не возвращают постоянные Three.js texture-quads;
- runtime теперь явно синхронизирует DOM-projected world pickup art каждый кадр; validation закрепляет новые consumers и binary WebP envelope.


### Asset runtime parity — uCoz + local file
- исправлена причина пропажи generated background/логотипа и части UI assets при локальном запуске: `catalog.js` больше не включает generated presentation art только для HTTP(S);
- menu/loading backgrounds, generated logo, perk icons, combat medals, headshot art и другие DOM/CSS presentation assets теперь активируются и на uCoz/static HTTP(S), и при прямом `file://` запуске; HTTP cache-busting остаётся только для hosted mode;
- local-file browser smoke усилен: проверяет `generated-art-enabled`, реальную загрузку generated logo, menu/loading backgrounds и всех стартовых `data-generated-src` images;
- asset documentation закрепляет обязательный dual-runtime invariant: любой runtime asset/consumer должен работать в обоих режимах, а fallback применяется только при реальной ошибке загрузки/декодирования.


### Generated World Weapon Pickup Pack — arena pickup presentation
- добавлены 8 компактных 512×384 alpha WebP для оружия/снаряжения, лежащего на карте: pistol, shotgun, rifle, rocket, plasma, mine, smoke и sniper; bomb пока остаётся procedural;
- world pickup art рендерится через отдельный DOM layer, привязанный к настоящей 3D-позиции pickup; generated raster не передаётся в TextureLoader/plane/sprite и сохраняет uCoz anti-black-quad invariant;
- размер изображения меняется по дистанции, off-screen/far pickups скрываются, а wall Raycaster occlusion не даёт generated art просвечивать сквозь стены;
- после успешной загрузки скрывается только procedural weapon body; pedestal/ring/beacon, respawn, pickup radius, reserve grant и minimap semantics остаются прежними; при 404/decode error 3D-модель автоматически остаётся fallback;
- catalog, asset contract, README и structural validation обновлены под отдельный world-pickup DOM pipeline.
- исправлен binary upload world-pickup WebP: предыдущий bridge записал текстовые UTF-8 payloads вместо RIFF/WebP bytes; 8 файлов перезалиты через binary-safe base64 blobs с предварительной SHA-проверкой, а правила upload/validation усилены.

### Generated First-Person Weapon Pack — player-held firearms
- approved V3 framing зафиксирован в asset contract как проверенный success baseline: 960×720 alpha, transparent headroom/left-space, baked angle, HUD-safe composition и screenshot-driven tuning;
- добавлены baked-hands first-person assets для mine и smoke; они используют тот же DOM/fallback pipeline, bomb пока остаётся procedural;
- muzzle flash огнестрела переработан из короткого овального «обрубка» в отдельный layered hot-core/starburst/glow effect с per-weapon цветом и масштабом; procedural fallback flash переведён на additive tapered flare;
- visual recoil усилен отдельными per-weapon push/pitch/roll профилями и стал frame-rate independent; generated overlay получает безопасный recoil kick без выхода из HUD safe zones;
- V3 pack перегенерирован с дополнительным transparent headroom/left-space и более компактной FPS-композицией: оружие занимает меньшую долю viewport и сохраняет нормальный baked first-person угол;
- per-weapon runtime tuning уменьшен и сдвинут в lower-right safe sector; muzzle anchors пересчитаны под новую композицию;
- sway/recoil/rotation raster overlay ограничены clamp-ами, чтобы оружие не уезжало в центр, HP, Score/Kills и reticle;
- critical HUD слои (reticle, HP, Score/Kills, weapon HUD) получили явный stacking priority выше decorative weapon art; weapon stage ограничен max 980 px;
- V2 pack перегенерирован по утверждённому reference montage: first-person угол теперь задаёт оружие из нижнего правого сектора влево/вверх, с корректно встроенными руками/предплечьями вместо showroom/profile-композиции;
- 6 runtime WebP заменены на 960×720 alpha derivatives (pistol, shotgun, rifle, rocket, plasma, sniper), каждый ограничен 250 KiB;
- добавлены 6 оптимизированных прозрачных WebP для оружия, которое видит и держит локальный игрок: pistol, shotgun, rifle, rocket, plasma и sniper;
- generated FPS-art подключён как DOM presentation поверх canvas и работает как на HTTP/HTTPS, так и при прямом `file://` запуске; procedural first-person weapon остаётся fallback для 404/decode error и оружия без нового art;
- текущий V2 pack использует baked-hands: при успешной загрузке скрывается весь procedural first-person rig (корпус + blocky procedural hands), а при 404/decode error он полностью восстанавливается; gameplay/ballistics, bots и world pickups остаются на прежней Three.js логике;
- overlay получает позу из текущего gunGrp: equip/reload/sprint/recoil/cycle визуально двигают новый art; для выстрела добавлен отдельный DOM muzzle flash;
- generated weapon WebP не передаются в TextureLoader/gameTexture/makeAssetPlane/makeAssetSprite, сохраняя uCoz anti-black-quad invariant;
- catalog, structural validation, README и asset contract обновлены под новый player-held pipeline;
- browser/preload safety: generated player weapon остаётся `visibility:hidden` до фактического старта матча; сам WebP также lazy-loadится только после `running`, поэтому menu/preload и browser boot не декодируют player weapon заранее.
- исправлен локальный `file://` path: прежний `GAME_HOSTED_HTTP_MODE` guard полностью блокировал generated weapon loader, поэтому локальная копия всегда показывала старую procedural модель; protocol gate удалён только из player-held loader, а lazy-load/fallback сохранены.


### Generated Gameplay Feedback Pack 3 — six semantic UI assets
- добавлены 6 оптимизированных 256×256 WebP с прозрачностью: MULTI KILL, level-up energy core, death skull, armor-break crest, Frontline capture beacon и defender crest;
- `multikill-tech-02.webp` закрывает прежний SVG-only gap в combat medals; `multikill.svg` остаётся fallback;
- level-up, death и armor-break DOM images используют новые WebP только на HTTP/HTTPS через общий `data-generated-src` activation path и автоматически возвращаются к прежним SVG при ошибке;
- Frontline получает новый CSS-only decorative WebP, а смысл цели остаётся в bearing/state text; defensive perks `armor`, `armorregen`, `blastshield`, `ballistic_lining`, `surplus_armor`, `smoke_guard` используют defender crest с per-id SVG fallback;
- добавлены `docs/ASSETS.md` и `assets/README.md`: правила генерации, оптимизации, naming/ownership, fallback, WebGL-safety, GitHub atomic upload, CI evidence и порядок ручной публикации на uCoz;
- validation теперь проверяет WebP envelope, catalog/DOM/CSS wiring и по-прежнему запрещает generated raster/WebP внутри 3D engine scene.
- corrective CI follow-up: web build stamp пересчитан с учётом нового `assets/README.md`, потому что текущий stamp contract хеширует всё дерево `assets/**`.

### Generated Combat Medals Pack — kill/precision feedback
- добавлен согласованный набор из 8 оптимизированных прозрачных PNG: First Blood, Double Kill, Triple Kill, Killing Spree, Longshot, Critical Kill, Explosive Kill и Headshot;
- combat medal HUD на HTTP/HTTPS использует новые raster icons, а при ошибке загрузки автоматически возвращается к прежним `assets/medals/*.svg`; существующий `multikill.svg` остаётся SVG-only;
- headshot popup использует `headshot-tech-01.png` с отдельным fallback на `assets/fx/headshot.svg` / `headshot-kill.svg`;
- новые изображения остаются presentation-only DOM assets и не передаются в Three.js/WebGL texture planes/sprites, сохраняя uCoz anti-black-quad invariant;
- validation расширен на наличие/PNG signature/минимальный размер, asset catalog mapping, реальное medal/headshot UI wiring, SVG fallback и запрет raster medals в `src/core/engine.js`; build stamp/cache key пересчитан.

### Generated Gameplay UI Pack — team/perk/objective integration
- добавлен второй набор из 8 оптимизированных PNG-ассетов: эмблемы синей/красной команд, ammo, damage/speed/reload, Frontline beacon и weapon crate;
- scoreboard, ammo HUD, reload HUD, Frontline objective и стартовые подсказки используют новые изображения через `.generated-art-enabled` только на HTTP/HTTPS;
- perk-карточки `damage`, `reload`, `mobility` и `sprint_drive` получают новые PNG-иконки, но при ошибке загрузки автоматически откатываются на прежние SVG;
- новые изображения остаются DOM/CSS presentation-only и не используются как Three.js/WebGL texture planes, чтобы не возвращать uCoz-проблему с чёрными прямоугольниками;
- validation проверяет PNG-сигнатуры, catalog/CSS/perk wiring, fallback и запрет попадания raster presentation assets в 3D engine.


### Static deploy cache-busting — обновление без Ctrl+F5
- перенесён проверенный pattern из ZeTer Photo Editor: `version.json` + build identity + guarded bootstrap;
- HTTP/HTTPS startup запрашивает manifest через `cache: 'no-store'` и timestamp query, сравнивает remote build с build текущего HTML и при необходимости один раз открывает URL с `?zap_build=<id>`;
- локальные JS загружаются последовательно с `?v=<build-id>`, stylesheet и CSS assets получают тот же cache key, catalog/DOM images versioned на HTTP(S);
- прямой `file://` запуск не зависит от manifest/fetch и сохраняет отдельный local path;
- добавлен `scripts/stamp-web-build.mjs`: build ID вычисляется по runtime bytes (`src` + `assets` + normalized index/CSS), обновляет `index.html`, CSS и `version.json`;
- CI запускает stamp в `--check` режиме и не пропускает runtime change со stale cache metadata;
- для ручного uCoz deploy `version.json` документирован как последний публикуемый файл, чтобы manifest не объявил сборку до завершения загрузки assets/code.


### Generated Visual Pack — hosting-safe UI integration
- добавлен оптимизированный набор из 8 сгенерированных ассетов: отдельные фоны меню и загрузки, логотип ZAP ZONE, HUD-эмблемы HP/armor/XP, hazard-панель и terminal-screen;
- исходные крупные изображения подготовлены для браузера: фоны/панели сохранены как оптимизированные JPEG, прозрачные эмблемы — как уменьшенные PNG; общий вес набора около 1.84 MiB;
- все новые raster assets подключены только в HTML/CSS presentation layer: постоянная Three.js/WebGL-сцена по-прежнему не использует image texture-quads, поэтому сохраняется защита от прежних чёрных прямоугольников на uCoz;
- на HTTP/HTTPS (включая uCoz) generated-art включается отдельным CSS gate; при file:// новые raster-файлы вообще не декодируются до первого клика, поэтому локальный smoke остаётся быстрым;
- меню и loading screen имеют CSS gradient fallback, новый логотип загружается поверх прежнего SVG только на HTTP/HTTPS и автоматически откатывается на SVG при ошибке, а HUD сохраняет текстовые значения и полосы даже без картинок;
- validation проверяет наличие и сигнатуры PNG/JPEG, catalog + CSS/HTML wiring и отдельно запрещает попадание нового raster pack в 3D engine scene.

### Hosting Compatibility 3.0 — без texture-quads в 3D-сцене
- устранён оставшийся эпизодический источник чёрных квадратов на uCoz: временные explosion/headshot/impact эффекты больше не создают SVG Sprite billboards;
- explosion, headshot/headshot-kill и bullet/wall/plasma/sniper/rocket/critical impacts переведены на procedural Three.js burst geometry: additive ring + core + radial rays;
- procedural bursts по-прежнему billboard-ориентируются к камере для читаемости, но состоят только из WebGL geometry/materials и не имеют image texture;
- water.svg удалён из 3D water material: поверхность воды теперь процедурная по цвету/emissive/opacity и анимируется без TextureLoader;
- после этого src/core/engine.js не содержит makeAssetPlane, makeAssetSprite или gameTexture и не зависит от внешних SVG/image textures для 3D-сцены;
- обычные SVG в HTML/CSS UI остаются допустимыми, потому что они не создают WebGL texture-quads.

### Regression protection
- validation запрещает любые внешние texture plane/sprite вызовы внутри 3D engine scene;
- отдельно проверяются makeProceduralBurst / setProceduralFxOpacity и отсутствие waterTex / GAME_ASSETS.fx / GAME_ASSETS.impact usage в engine;
- версия повышена до v23.9.

### Bot HUD cleanup — только здоровье над ботами
- удалены текстовые overhead-бейджи над ботами: больше нет подписей «СВОЙ», «ВРАГ», роли и иконки оружия над головой;
- над каждым видимым ботом остаётся только компактная полоска здоровья;
- цвет полосы сохраняет быстрое распознавание команды: голубая для союзников, красная для противников;
- DOM-элемент старого бейджа удалён полностью вместе с update/position/cleanup логикой, а не просто скрыт CSS;
- версия повышена до v23.8; validation запрещает возврат overhead text badges и требует health-bar HUD.

### Visual Polish 2.0 — HUD, pickups, weapons и укрытия
- tactical minimap стала примерно на 12% компактнее: меньше рамка/легенда и нижний tactical stack, при этом canvas остаётся высоким по внутреннему разрешению для чёткой картинки;
- контраст реальной геометрии карты повышен, союзники и игрок получили более читаемые маркеры с тёмной обводкой, активная capture-zone мягко пульсирует, world-weapon dots стали круглыми и аккуратнее;
- pickup beacons стали ниже и тоньше: уменьшены stem/diamond/halo, pedestal/ring больше не доминируют над предметом; добавлены мягкий pulse, локальный bob и медленное вращение;
- общая амплитуда bob/rotation самих pickup-моделей уменьшена, чтобы предметы выглядели как физические объекты, а не как крупные аркадные маркеры.

### First-person weapon materials
- procedural weapon accents получили металлические fasteners, более тонкие emissive strips и отдельные micro-details без возврата SVG overlays;
- rifle/sniper получили боковые rails и status module, plasma — парные emissive coils/caps, shotgun/rocket — дополнительный structural brace;
- материалы сохранены hosting-safe и одинаково работают на uCoz / localhost / file://.

### Cover material variation
- Aegis / industrial barrier / cargo cover теперь получают детерминированные вариации палитры по позиции на карте;
- добавлены разные metal/wood trims, fasteners, small braces и менее агрессивное свечение;
- collision, LOS, penetration semantics и minimap geometry не менялись.

### Проверка
- версия повышена до v23.7;
- validation закрепляет compact minimap sizing, marker contrast/pulse, pickup beacon animation, weapon micro-details и cover palettes.

### Hosting Compatibility 2.0 — одинаковая 3D-сцена на uCoz / localhost / file://
- устранён источник чёрных прямоугольников и тёмных накладок на uCoz: постоянные 3D-объекты больше не используют полноразмерные SVG как PlaneGeometry/Sprite texture overlays;
- причина была архитектурной: локальный file:// режим скрывал эти texture overlays прозрачным fallback, а HTTP-хостинг реально загружал SVG с собственными тёмными подложками, поэтому сайт выглядел иначе локального запуска;
- оружие от первого лица теперь получает нативные emissive tech-panels/полосы из Three.js geometry вместо SVG skin/tech planes;
- боты получили процедурные цветные insignia/chevrons вместо SVG emblem planes;
- аптечки, боеприпасы и лежащее оружие используют объёмные beacon-маркеры (stem + diamond + halo) вместо billboard SVG sprites;
- hazard-разметка на стенах заменена объёмными жёлто-чёрными панелями, crate labels — металлическими plates/bolts, terminal screens — emissive geometry/glyphs;
- low-poly foliage остаётся полностью геометрическим: дополнительные SVG foliage cards удалены;
- временные FX и обычный 2D UI могут по-прежнему использовать SVG, потому что они не являются постоянными surface overlays на 3D-моделях.

### Regression protection
- validation запрещает возвращать SVG PlaneGeometry на first-person weapons, bots и persistent environment, а также SVG Sprite для pickup markers;
- проверяются procedural hazard panels, terminal glyph screen, bot insignia и pickup beacon;
- версия повышена до v23.6.

### Tactical Radar 2.0 — настоящая миникарта арены
- абстрактная схема пяти зон удалена: в нижнем левом tactical stack теперь круглая real-time миникарта, построенная из той же collision geometry, что используется игроком и ботами;
- радар показывает стены, строения, ящики, деревья, терминалы и новые cover-prefabs в их фактических координатах и поворотах;
- игрок отображается яркой направленной стрелкой, союзники — синими стрелками, активная зона и владельцы всех пяти capture zones — цветными кругами; видимые world weapon pickups дополнительно отмечены маленькими золотыми точками;
- north-up карта обновляется 10 раз/с независимо от 3D FPS, поэтому HUD остаётся дешёвым даже при 144 FPS;
- Frontline progress/status встроен прямо под картой; прежний верхний схематичный блок больше не занимает центр экрана.

### Battlefield Dressing — procedural cover assets
- добавлены три новые полностью процедурные разновидности укрытий: Aegis armor shield, industrial barrier и cargo cover;
- укрытия имеют отдельные low-poly детали, металлические/деревянные материалы, светящиеся полосы, collision/LOS и material penetration semantics;
- десять новых укрытий размещены по боковым и внешним маршрутам арены; они автоматически попадают на реальную миникарту;
- новые prefab-объекты не требуют SVG/texture fetch и поэтому одинаково работают через HTTP и file://.

### Loot & bot utility tuning
- количество world weapon pickups увеличено с 9 до 16: пистолет/дробовик/ракетница/плазма/SR-9 имеют по две точки, rifle — три, utility остаются по одной;
- точки продолжают релоцироваться после подбора и избегают скучивания;
- командный smoke теперь решается один раз на assault wave, используется только в 30% подходящих волн и после броска получает общий cooldown 14–22 секунды.

### Local file resilience
- общий DOM helper G перенесён в самый ранний catalog.js, поэтому state/bots больше не зависят от поздней загрузки progression.js;
- Three.js TextureLoader при file:// больше не создаёт CORS-шторм для SVG: используется прозрачная procedural fallback texture; по HTTP/HTTPS настоящие SVG остаются активными.

### Проверка
- версия интерфейса повышена до v23.5;
- validation закрепляет real minimap geometry, ally/player/zone markers, 10 Hz budget, новые covers, расширенный weapon distribution, reduced bot smoke и file:// texture fallback.

### Browser Local-File Hotfix — клики меню и WAV fetch storm
- исправлен root cause зависающих кнопок в Chrome/Firefox при запуске через file://: browser fetch локальных WAV возвращал Failed to fetch, а battlefield ambience после null-result немедленно вызывал себя снова через resolved Promise и мог создать бесконечную microtask-цепочку;
- в file:// режиме файловые WAV полностью отключены, а звук использует существующий Web Audio synth fallback; при HTTP/HTTPS качественные WAV продолжают загружаться;
- playBufferSfx/preload больше не создают локальные WAV fetch, поэтому консоль не должна заполняться повторяющимися Failed to fetch;
- battlefield ambience повторно запускается только после реально успешно загруженного buffer и больше не рекурсирует на null.

### Regression test
- добавлен headless Chrome smoke через настоящий file:// + DevTools Protocol: тест ждёт boot-ready, генерирует первый pointerdown, проверяет hit-test кнопки «Настройки», открытие/закрытие modal, отсутствие file-WAV loads и отсутствие критической event-loop задержки;
- обычный HTTP browser boot smoke сохранён отдельным gate.

### Проверка
- версия интерфейса повышена до v23.4.

### HUD Navigation 1.0 — карта фронта и нижняя тактическая панель
- подробная Frontline-панель перенесена из верхнего центра в общий нижний левый tactical stack над списком союзников, поэтому она больше не конфликтует с оружейным баром;
- сверху добавлена компактная карта пяти зон (Север / Запад / Центр / Восток / Юг) в реальном расположении карты; активная цель подсвечивается жёлтым, спорная зона пульсирует, захват и владелец читаются по цвету;
- карта запоминает последнего владельца каждой зоны отдельно, сохраняет это состояние в прогрессе и показывает, какие точки уже брали синие/красные, даже когда активная цель ротируется дальше;
- верхний HUD отдельно показывает текущую цель и дистанцию до неё.

### Firefox / local-file responsiveness
- тяжёлая 3D-сцена больше не рендерится на полной частоте, пока открыто главное меню, пауза или экран выбора улучшения: idle/pause rendering ограничен, а активная игра остаётся на полном requestAnimationFrame;
- первый pointerdown больше не запускает массовый WAV-preload прямо внутри пользовательского события: прогрев аудио переносится в requestIdleCallback / deferred timeout;
- неудачные WAV-загрузки получают backoff (для file:// — 60 секунд), поэтому Firefox не повторяет десятки неуспешных fetch на каждом выстреле/звуке;
- меню и настройки получили явные button hit-targets, touch-action и type=button для стабильного клика в Firefox.

### Проверка
- версия интерфейса повышена до v23.3;
- validation закрепляет tactical map/zone ownership, нижний tactical stack, menu render throttling и deferred/backoff audio-loading.

### Combat Presence 1.4 — Advanced Ballistics & Tactical Awareness
- travelling bullets получили penetration energy: дерево, металл и бетон имеют разные resistance/max-thickness/speed/damage retention; толщина реально оценивается в локальном BoxGeometry пространства объекта, поэтому тонкий ящик и толстая стена больше не эквивалентны;
- player/enemy projectile может пройти максимум через два подходящих препятствия; после каждого penetration уменьшаются скорость и урон, а на входе/выходе создаются отдельные material impacts;
- enemy tracer visuals переведены на LOD + bounded pool: дальние трассеры прореживаются, одновременно активное число ограничено, а Three.js meshes повторно используются вместо постоянного create/dispose;
- bullet decals стали ориентированными по нормали поверхности и тоже работают через pool до 56 marks — больше читаемости попаданий с меньшим allocation pressure.

### Tactical awareness
- боты отслеживают физические frag grenades противоположной команды, оценивают дистанцию/fuse и уходят от гранаты диагональным escape-vector без teleport-like dodge;
- path scoring и финальное steering учитывают hostile smoke: AI предпочитает обходить плотное чужое облако, но не боится собственного smoke screen во время штурма;
- suppressor теперь имеет handoff/hysteresis: живой и боеспособный suppressor удерживает роль короткое время, а reload/death/empty magazine вызывают быструю замену без постоянного role thrashing;
- suppressor может вести controlled fire по last-known position до 2.6 секунды после потери LOS, включая огонь сквозь дым, но не сквозь реальную стену;
- peek-from-cover получил полный cadence out → hold → return и визуальный body lean; бот больше не телепортируется между center/peek point и естественно возвращается за укрытие.

### Проверка
- версия интерфейса повышена до v23.2;
- validation закрепляет penetration profiles/thickness, projectile energy loss, tracer LOD/pool, pooled oriented decals, grenade awareness, smoke avoidance, suppressor handoff/last-known fire и lean/peek cadence.

### Combat Presence 1.3 — Ballistic Simulation & Squad Combat
- обычные пистолеты, автоматы, дробовики и плазма ботов больше не наносят урон мгновенным hit-roll: каждый pellet/round становится bounded travelling projectile с muzzle velocity, gravity, range, swept-segment wall/entity collision и distance damage falloff;
- SR-9 сохранена как мгновенный hitscan, ракеты остаются отдельными rocket entities — предыдущая игровая семантика этих классов оружия не сломана;
- входящий suppression теперь собирается с фактических сегментов нескольких пуль: closest point считается на каждом реально пройденном участке, поэтому стена действительно прекращает suppression;
- физические пули могут подавлять и других ботов рядом с траекторией, а попадание может прийтись не только в исходную выбранную AI-цель.

### Material impacts + reactive battlefield
- объектам карты добавлена impact-material metadata: hazard walls = metal, supply crates = wood, остальные стены по умолчанию concrete;
- sparks, smoke, decals, impact pitch и вероятность ricochet различаются по metal / concrete / wood;
- вражеская пуля может один раз физически отрикошетить от metal/concrete при малом угле, теряя скорость и 44% урона;
- дальний acoustic tail теперь дополнительно рождается из реальных пространственных выстрелов ботов, поэтому distant combat реагирует на фактическую перестрелку, а не только на фоновый loop.

### Squad utility + peek combat
- breach/retake wave получила цепочку suppressor → flankers → breach assault; состояние breachReady появляется только при активном suppressor и живом flank pressure;
- инженер/anchor один раз за assault wave может поставить smoke screen на направлении движения, а assault/engineer — бросить физическую осколочную гранату, если в точке нет союзников;
- bot smoke использует общий smoke simulation и реально блокирует LOS;
- frag grenade имеет полёт, gravity, bounce, fuse и team-safe blast damage через общий explosion pipeline;
- бот в cover теперь ищет безопасную левую/правую peek-position с проверкой collision, LOS и smoke, ненадолго выходит из укрытия и возвращается вместо вечной стрельбы из центра cover point.

### Проверка
- версия интерфейса повышена до v23.1;
- validation закрепляет travelling enemy bullets, bounded pool, swept collision, physical suppression, material metadata/ricochet, squad utility, breachReady role chain и peek-from-cover.

### Combat Presence 1.2 — Suppression & Battlefield Life
- случайный near-miss feedback заменён геометрией реального выстрела бота: для фактического tracer direction вычисляется closest approach к торсу игрока, дальность вдоль луча и проверка препятствий; whiz/suppression возникает только если пуля действительно проходит рядом;
- добавлено накопительное состояние suppression: плотный близкий огонь мягко увеличивает реальный weapon spread, раскачивает оружие, расширяет/подсвечивает reticle и даёт короткую presentation-only camera reaction без фиктивного урона;
- SR-9 использует усиленный supersonic crack только при реально близком пролёте.

### Battlefield audio
- добавлены ещё 10 оригинальных procedural WAV: distant battlefield loop, magazine reload, reload completion, shell insert, bolt, pump, equip и отдельные шаги по metal / gravel / water;
- после первого пользовательского ввода запускается тихий low-pass battlefield ambience; он проходит через общий SFX master и не создаёт отдельной настройки громкости;
- синтетические reload/equip/bolt/pump cues заменены WAV-механикой с сохранением synth fallback;
- удалённые боты также слышимо перезаряжаются через spatial attenuation;
- поверхность шага выбирается по геометрически осмысленным зонам карты: индустриальный центр — metal, внешний периметр — gravel, бассейн на западе — water, остальная арена — concrete.

### Coordinated breach / retake + cover-to-cover
- для доктрин breach и retake введены командные assault waves с короткой staging-фазой и общей active-фазой: роли сначала собираются в разнесённой формации, затем синхронно ускоряют заход на objective;
- objective orders учитывают wave state, поэтому assault/flank/anchor/engineer меньше растягиваются по карте перед прорывом;
- выбор укрытия во время breach/retake награждает реальное продвижение к objective;
- бот, достигнув промежуточного укрытия в активной assault wave, может выбрать следующее более переднее укрытие вместо немедленного выхода в обычный engage — появился настоящий cover-to-cover chain.

### Проверка
- версия интерфейса повышена до v23.0;
- validation проверяет 28 WAV-файлов, physical closest-approach near miss, suppression spread, sampled weapon mechanics, surface footsteps, battlefield ambience, assault wave state и cover-chain; legacy random near-miss запрещён.

### Combat Presence 1.1 — акустика пространства, шаги и impact layer
- добавлены ещё 8 оригинальных procedural WAV: открытый и тесный acoustic tail, supersonic crack SR-9, шаг/бег, попадание в тело, бронепластину и голову;
- выстрелы теперь получают геометрически выбранный хвост: четыре коротких raycast-пробы вокруг источника отличают открытое пространство от участков с близкими отражающими стенами; tail имеет cooldown, чтобы автоматический огонь не превращался в аудио-кашу;
- SR-9 получил отдельный мощный crack поверх muzzle report; опасный промах вражеской SR-9 дополнительно воспроизводит listener-side crack вместе с directional threat cue;
- шаги игрока и ботов привязаны к реально пройденной дистанции: бег имеет более короткий stride и тяжёлый звук, удалённые боты отсекаются spatial attenuation;
- ballistic hit-feedback разделён по зонам: нижняя часть тела, бронированный торс и голова/шлем звучат по-разному; при входящем уроне броня игрока также имеет отдельный metallic impact.

### Cover Navigation + Frontline density
- binary «прямая линия заблокирована» заменена на route penalty: AI пробует безопасный двухсегментный обход слева/справа и не отвергает хорошее укрытие только потому, что к нему нет прямой линии;
- при спорной или потерянной Frontline-точке растёт objective urgency: удалённые бойцы раньше возвращаются к зоне, objective movement немного ускоряется, а engagement получает мягкое притяжение к точке;
- бот внутри горячей зоны меньше склонен уходить в retreat при умеренном уроне: так сохраняется плотность боя, но критически раненые и окружённые боты по-прежнему отступают.

### Проверка
- версия интерфейса повышена до v22.9;
- validation проверяет все 18 WAV-файлов, acoustic profiling/tails, sniper crack, distance-driven footsteps, hit-zone audio, route penalty и Frontline urgency.

### Combat Presence 1.0 — пространственный звук и читаемость угроз
- добавлен собственный набор оригинальных PCM WAV-эффектов без сторонних семплов: пистолет, автомат, дробовик, SR-9, ракетница, плазма, взрыв, рикошет, пролёт пули и музыкальный сигнал захвата Frontline;
- выстрелы ботов теперь реально слышны: громкость затухает с расстоянием, а StereoPanner даёт направление слева/справа относительно взгляда игрока; снайперские выстрелы слышны дальше обычных;
- выстрел игрока, взрывы, рикошеты и near-miss используют файловые эффекты, а прежний Web Audio synth остаётся безопасным fallback, если asset ещё грузится или декодирование недоступно;
- опасный промах противника получил отдельный янтарный directional telegraph: игрок получает направление угрозы ещё до получения урона, не смешивая его с красным индикатором фактического попадания.

### Frontline readability + cover AI
- заголовок Frontline получил вращаемый bearing-arrow к активной зоне и явный статус «В ЗОНЕ», поэтому цель легче читать даже во время интенсивной перестрелки;
- удерживающие и возвращающие точку боты теперь предпочитают тактические укрытия внутри/рядом с активной Frontline-зоной; фланкеры получают мягкий штраф за маршруты, слишком далеко уводящие их от цели;
- захват точки получил отдельный аудио-stinger с различимым тоном для синей/красной команды.

### Проверка
- версия интерфейса повышена до v22.8;
- validation проверяет наличие и RIFF/WAVE-заголовки всех 10 аудиофайлов, интеграцию spatial audio, threat telegraph, Frontline bearing и objective-aware cover scoring.

### Frontline 1.0 — ротационные зоны контроля
- внутренние тактические районы AI превращены в реальную игровую цель: активная Frontline-зона меняется примерно раз в 44 секунды и отмечается 3D-кольцом/маяком на арене;
- захват зависит от реального присутствия обеих команд внутри радиуса: превосходство ускоряет прогресс, одновременное присутствие делает точку спорной, а полный захват приносит команде отдельное очко контроля;
- каждый захват считается как 3 командных очка поверх убийств; HUD показывает активный район, расстояние, время до ротации, направление захвата и счёт по зонам;
- Tactical AI 2.2 получил высокий приоритет активной Frontline-точки при выборе push/hold/retake, поэтому отделения теперь естественно сходятся к общей цели, не теряя существующие anti-camp и recovery-механики;
- игрок, который реально находится в зоне при синем захвате, получает +150 score и +35 XP — участие в объекте выгоднее пассивного наблюдения со стороны.

### Сохранение и проверка
- формат автосохранения повышен до v27: сохраняются активная зона, прогресс захвата, владелец, оставшееся время ротации и число захваченных зон обеих команд;
- старые v20–v26 сохранения продолжают загружаться и начинают Frontline с нейтрального ЦЕНТРА;
- validation закрепляет Frontline runtime tick, 3D marker, HUD, AI-bias, v27 persistence и версию интерфейса v22.7.

### Combat AI 2.2 — Adaptive Commander
- добавлен лёгкий профиль поведения игрока: AI различает длительное удержание небольшой позиции, мобильный стиль и глубокий раш в сторону красной половины карты;
- если игрок долго держит одну небольшую зону и продолжает стрелять, красная команда может перейти в приказ `breach` / «ПРОРЫВ»: suppressor сохраняет давление, flankL/flankR получают более длинный commit на pincer, assault продвигается глубже;
- при глубоком раше игрока красная команда быстрее выбирает retake района рядом с его текущей позицией вместо бесконтрольного преследования;
- серия потерь во время `push/breach` включает короткую recovery-фазу: commander временно выбирает hold и только затем снова наращивает давление;
- engineer/anchor чаще используют мины при hold/retake, а бомбы получают повышенный шанс именно при breach; это меняет utility по тактическому приказу, а не просто увеличивает общий урон.

### Плавность движения ботов
- устранён главный источник «телепортирующих» рывков: прежний dodge разгонял AI примерно до 2.35–3× обычной скорости;
- dodge теперь остаётся коротким уклонением около 1.3–1.5× базовой скорости, а mine-evasion также ограничен;
- stuck recovery больше не вызывает высокоскоростной dodge: бот делает отдельный плавный боковой выход из препятствия;
- движение проходит через acceleration cap и общий speed cap, поэтому резкая смена AI-state не может мгновенно разогнать модель;
- collision movement разбит на небольшие micro-steps, а фактическое смещение за кадр имеет hard cap — даже push-out из AABB не должен выглядеть как телепорт;
- рост скорости ботов от высокого уровня/числа убийств ограничен, чтобы late-game AI становился сильнее без неестественного ускорения.

### Regression checks
- validation закрепляет adaptive player profile, `breach`, recovery after failed pushes, doctrine-aware explosives и anti-teleport locomotion safeguards;
- версия интерфейса повышена до v22.6.

### Combat AI 2.1 — Map Tactics
- арена разделена на пять логических тактических районов: ЦЕНТР, СЕВЕР, ЮГ, ЗАПАД и ВОСТОК;
- каждая команда периодически оценивает присутствие обеих сторон в районах, живую численность и глубину продвижения относительно собственного направления атаки;
- введены командные приказы `push / hold / retake`: численное преимущество переводит отделение в продвижение, глубокое вторжение противника на свою половину — в retake, а заметное численное отставание — в удержание;
- map-order имеет commit window, поэтому команда не меняет приказ каждый кадр из-за кратковременного колебания контроля;
- новый `objective` state ведёт ботов к общей зоне с разными role offsets: assault продвигается глубже, anchor держится позади, flankL/flankR разводятся по сторонам, engineer занимает поддерживающую позицию;
- при `hold` даже находящиеся в бою боты получают мягкий leash к назначенному району и меньше увлекаются погоней через всю арену;
- панель союзников теперь показывает текущий приказ, район и численную дельту команды.

### Regression checks
- validation закрепляет карту тактических зон, расчёт map-order, objective-state, hold leash и HUD-индикацию приказа;
- версия интерфейса повышена до v22.5.

### Tactical AI 2.0 — координация отделения
- поверх существующих индивидуальных ролей добавлен общий squad-plan для каждой команды: AI голосует за приоритетную цель на основе текущей видимости, памяти и уже существующего `TEAM_INTEL`;
- один подходящий assault/anchor/engineer назначается suppressor, пока flankL/flankR выполняют обход;
- suppressor использует более длинные очереди с намеренно сниженной точностью: это даёт прикрывающий огонь без простого роста lethality;
- flankL и flankR ищут разные боковые позиции среди cover points, учитывая маршрут, занятость союзниками и наличие будущей линии огня;
- промахи по AI-боту теперь могут создавать suppression pressure: подавленный бот чаще ищет укрытие и временно стреляет менее точно, но не получает фиктивный урон;
- anchor и engineer способны перейти в support-state и держаться рядом с наиболее раненым союзником, сохраняя направление на противника;
- существующий лимит одновременного огня по игроку сохранён, но внутри лимита приоритет получает назначенный suppressor, а фланкеры реже превращаются в обычную фронтальную firing line;
- роли теперь видны над ботами и в панели синих союзников.

### Regression checks
- validation закрепляет squad-plan, flank/support states, suppression semantics, suppressor-aware player pressure и отображение ролей;
- после первого CI-run обновлены устаревший locomotion-token и порядок чтения runtime в validation script; gameplay-код при этом не ослаблялся;
- версия интерфейса повышена до v22.4.

### Непрерывный бой и тактическое возрождение
- смерть игрока больше не уничтожает всех живых ботов, pickups, мины и летящие снаряды: командный бой 5×5 продолжается без искусственного «перезапуска карты»;
- игрок возрождается на безопасной точке синей стороны, выбранной с учётом расстояния до живых врагов и союзников, вместо жёсткого возврата в центр арены;
- после respawn камера ориентируется в сторону ближайшего живого противника, а существующий spawn shield защищает от случайного мгновенного повторного убийства;
- недостающие боты по-прежнему пополняются штатным runtime-spawn циклом, поэтому состав 5×5 восстанавливается без стирания живой сцены.

### Kill feed
- добавлен компактный kill feed с цветовой идентификацией игрока, союзников и врагов;
- feed показывает прямые убийства, headshot, ракеты, мины, бомбы и bot-vs-bot события;
- новая игра очищает feed, а обычное возрождение сохраняет контекст текущего боя.

### Regression checks
- validation закрепляет наличие safe-respawn selector, непрерывного player respawn и kill-feed wiring;
- исправлена дублирующая декларация в validation script, найденная первым CI-run после v22.3;
- версия интерфейса повышена до v22.3.

### Premium-pass всех first-person моделей оружия
- визуально переработаны все 9 типов оружия/снаряжения в руках игрока, а не только штурмовая винтовка;
- для pistol, shotgun, rifle, rocket, plasma и sniper добавлены отдельные muzzle/optic/rail/vent/stock/coil детали и более выразительные силуэты;
- mine, bomb и smoke получили более детализированные корпуса, индикаторы, кольца, сегменты брони и utility-элементы;
- добавлены ещё 9 новых SVG skin-assets `assets/weapons/fp/*-skin.svg` поверх уже существующих tech-панелей;
- введены индивидуальные `FP_MODEL_TUNING` и `FP_DECAL_TUNING`, чтобы каждый ствол занимал более аккуратную часть экрана и не выглядел одинаково масштабированным;
- muzzle flash и beam теперь являются дочерними элементами самой модели оружия, поэтому корректно следуют её масштабу/позиции.

### Проверка
- structure validation теперь требует все новые skin-assets, их регистрацию в asset catalog и наличие premium first-person model/tuning path.

### First-person оружие и прицел штурмовой винтовки
- полностью переделан `rifle-scope.svg`: центр оптики теперь прозрачный и не закрывает игровой мир;
- добавлены 9 новых SVG tech-assets в `assets/weapons/fp/` — отдельный визуальный модуль для каждого типа оружия;
- first-person оружие получило улучшенные руки/перчатки, разные hand poses по типам оружия и более выразительные sci-fi hard-surface детали;
- штурмовая винтовка дополнительно получила усиленные боковые панели, rail/optic элементы и emissive-акценты.

### Походка и хват оружия ботов — дополнительная проходка
- для каждого оружия добавлены индивидуальные elbow hints, чтобы локти сгибались естественнее и руки меньше пересекали корпус;
- оружие сдвинуто ближе к центру груди и выше к линии плеч, а не висит сбоку;
- gait дополнен вертикальным step-bob, hip sway, переносом корпуса и движением стоп по фазе шага;
- IK-хват продолжает пересчитываться после weapon sway, поэтому кисти остаются на рукояти/цевье во время движения.

### Пустое оружие
- если магазин и резерв найденного оружия одновременно равны нулю, его слот исчезает из weapon-bar;
- колесо мыши, Q и прямое переключение больше не выбирают полностью пустой ствол;
- если текущий ствол полностью закончился, игра автоматически переключается на следующее доступное оружие с боезапасом;
- повторный pickup этого типа возвращает слот обратно, ownership в сохранении при этом не теряется.

### Regression checks
- validation закрепляет прозрачный rifle scope, новые first-person assets, улучшенный gait/IK и скрытие полностью пустых оружейных слотов.

### Реалистичный хват оружия ботами
- убраны декоративные «фальшивые кисти», которые были прикреплены к самой модели оружия;
- для каждого типа оружия заданы реальные точки хвата правой и левой руки;
- у ботов добавлен двухсегментный IK-подобный решатель плечо → локоть → кисть;
- правая рука теперь тянется к рукояти/спуску, левая — к цевью или корпусу оружия;
- хват пересчитывается после weapon sway/gait, поэтому руки остаются на оружии при ходьбе, стрейфе и боевой позе.

### HUD и переключение оружия
- LEVEL/XP перенесён из центральной зоны weapon bar в левый верхний угол;
- колесо мыши вниз переключает на следующее найденное оружие, вверх — на предыдущее;
- закрытые/ещё не найденные слоты при прокрутке автоматически пропускаются;
- подсказки управления и README синхронизированы с новым поведением.

### Regression checks
- validation закрепляет отсутствие fake-hands на weapon mesh, наличие bot arm IK, wheel cycling только по owned weapon slots и новый безопасный layout LEVEL/XP.

### Арсенал и боезапас
- новая игра начинается только с пистолетом; остальные слоты открываются world pickups;
- каждый слот хранит отдельные магазин и резерв;
- повторный pickup того же типа даёт случайно 50–400 единиц его боезапаса;
- отдельные универсальные ammo-box pickups больше не спавнятся;
- после сбора weapon pickup респавнится через время в другой части карты;
- autosave v26 сохраняет ownership, магазины и резервы; legacy saves не возвращают весь арсенал бесплатно.

### Оптика штурмовой винтовки
- штурмовая винтовка получила ПКМ optical scope с отдельным rifle-scope.svg и умеренным увеличением;
- SR-9 сохраняет свой 8× scope; дробовик scope не получил.

### Визуальная проходка ботов
- добавлены новые SVG-маркировки командной брони, светящийся визор и дополнительные элементы силуэта;
- weapon pose теперь зависит от типа ствола; добавлен более естественный двуручный хват.

### Regression checks
- validation закрепляет pistol-only старт, диапазон 50–400, отсутствие standalone ammo pickups, динамический weapon respawn, rifle scope и новые bot assets.

### Реалистичное передвижение ботов
- убрано мгновенное переключение между скоростями: ускорение, торможение и смена направления теперь сглаживаются, а экстренные уклонения остаются отзывчивыми;
- цикл шага привязан к реально пройденной дистанции и фактической скорости, поэтому ноги больше не «едут» по земле с фиксированной частотой;
- в походку включены бёдра, колени, ступни и руки; добавлены отдельные реакции для движения назад и бокового стрейфа;
- корпус и оружие получают небольшой перенос веса, шаговый sway и idle-breathing без изменения логики боя;
- проверка структуры закрепляет наличие нового locomotion state, velocity response и процедурной gait-анимации.

### Командный режим 5×5
- режим free-for-all заменён на командный бой: игрок + 4 союзных AI-бота против 5 вражеских ботов;
- спавн и respawn поддерживают состав 5×5;
- командный счёт разделён на «СИНИЕ» и «КРАСНЫЕ»;
- панель союзников теперь показывает именно живых ботов своей команды.

### Различие своих и врагов
- союзники получили выраженную синюю/голубую палитру, враги — красную;
- усилены цветные кольца, HP-индикаторы и подписи «СВОЙ» / «ВРАГ»;
- оружие и ракеты союзников визуально отличаются от вражеских.

### Team-aware combat
- боты больше не выбирают союзников целью;
- союзные боты не атакуют игрока;
- отключён friendly fire для прямых попаданий, ракет, мин, бомб и blast damage;
- мины и ракеты хранят команду владельца и не срабатывают на своих;
- AI учитывает союзников на линии огня и рядом с точкой ракетного взрыва;
- убийства союзных AI корректно увеличивают счёт синей команды.

### Интеллект ботов
- добавлено восприятие по уровням «вижу / слышу / помню» вместо одинакового знания всех целей;
- выстрелы создают шум с дальностью, зависящей от оружия; стены приглушают звук, а услышанная позиция имеет погрешность;
- выбор цели учитывает видимость, слух, память, здоровье, опасность цели и число уже атакующих её союзников;
- добавлена реакция на локальное численное превосходство;
- боты меняют дистанцию и стрейф с учётом оружия противника;
- добавлено прогнозирование траектории входящей ракеты и направленное уклонение;
- сохранены улучшения поиска цели, укрытий, локального обхода препятствий и памяти движения.

### Сохранения
- формат автосохранения повышен до v25;
- старые v20–v24 сейвы продолжают загружать прогресс игрока, но старый FFA-счёт не переносится в новый командный счёт.

### Проверка
- GitHub Actions Validate #20 успешно прошёл syntax, project structure и browser boot smoke test после основного 5×5/AI-коммита;
- Validate #21 успешно подтвердил финальную миграцию автосохранений.

## v22.2 — 2026-09-25

### Weapon handling
- добавлено реальное время вскидывания после смены оружия;
- добавлен sprint-to-fire: во время спринта оружие опускается, а после остановки требуется короткое время возврата к боевой готовности;
- sprint больше не даёт ускорение, когда оружие занято reload/cycle/scope;
- добавлен live HUD состояния оружия: вскидывание, спринт, bolt/pump cycle, tactical/empty/shell reload;
- добавлен quick-switch на предыдущее оружие по `Q`, но он не обходит equip time;
- first-shot accuracy теперь отдельно улучшает первый выстрел из устойчивого положения;
- recoil/reticle учитывают реальное состояние handling.

### Перезарядка и механика
- дробовик получил shell-by-shell reload вместо мгновенного заполнения всего магазина;
- после вставленного патрона shell reload можно прервать выстрелом;
- магазинные стволы различают tactical reload и empty reload;
- pump-action и bolt-action получили отдельные механические cycle states и анимацию;
- гильза дробовика и SR-9 выбрасывается во время движения помпы/затвора, а не в момент выстрела;
- perk скорострельности теперь ускоряет и fire cadence, и pump/bolt cycle;
- добавлены equip, shell insert, reload cancel, ricochet и near-miss audio cues.

### SR-9
- SR-9 гарантированно убивает **первую живую цель одним прямым попаданием**;
- гарантированный one-shot не переносится на вторую цель после penetration: она получает ослабленный урон;
- SR-9 остаётся мгновенным hitscan без bullet travel и bullet drop.

### Прицел
- найдена и устранена причина двойного прицела: старый SVG-crosshair одновременно рисовался под новым динамическим reticle;
- legacy `assets/ui/crosshair.svg` удалён из игры и репозитория;
- обычное оружие использует ровно один динамический CSS-reticle;
- SR-9 использует только отдельный sniper scope и не показывает обычный crosshair.

### Дополнительный feedback
- добавлен ricochet feedback для неглубоких попаданий ballistic-пуль в стены;
- добавлен near-miss bullet whiz для промахов вражеских ботов рядом с игроком.

### Проверка
- validation закрепляет one-shot SR-9, отсутствие legacy crosshair SVG и новый weapon lifecycle;
- browser boot smoke остаётся обязательным перед merge.

## v22.1 — 2026-09-25

### Стрельба и баллистика
- исправлена реальная дальность hit detection: цель больше не отбрасывается жёстким лимитом около 60 игровых единиц;
- пистолет, дробовик, штурмовая винтовка и плазма теперь создают реальные движущиеся projectiles;
- для быстрых пуль используется swept segment collision, чтобы они не пролетали через ботов и стены между кадрами;
- ballistic-профили получили muzzle velocity и bullet gravity;
- damage falloff считается по фактически пройденной пулей дистанции;
- penetration продолжает полёт пули после первого попадания со снижением урона;
- добавлен накапливаемый weapon bloom и восстановление точности;
- recoil использует повторяемые горизонтальные patterns с небольшим случайным jitter;
- динамический crosshair показывает текущую spread/bloom обычного оружия;
- HUD показывает fire mode и фактическую скорость снаряда;
- добавлены dry-fire, bolt и pump механические SFX.

### SR-9 и ПКМ-прицел
- SR-9 переведена на **мгновенный hitscan**: попадание регистрируется в момент клика, без travel time и bullet drop;
- добавлен явный `aimMode:'scope'`, который есть только у SR-9;
- ПКМ больше не меняет FOV, позицию оружия или чувствительность у остальных стволов;
- снайперская винтовка не показывает обычный hip-fire crosshair — прицел появляется только как 8× scope по ПКМ;
- scope входит плавно, а точность интерполируется вместе с фактическим временем входа в оптику;
- HUD SR-9 показывает режим `BOLT · МГНОВЕННО`.

### Надёжность
- validation закрепляет sniper-only RMB scope, instant hitscan SR-9 и ballistic projectile path обычных стволов;
- browser boot smoke остаётся обязательным перед merge.

## v22.0 — 2026-09-25

### Оружие и физика стрельбы
- все основные стволы получили отдельные handling-профили вместо почти одинаковой логики;
- пистолет работает как semi-auto: умеренный темп, быстрый reload и средний урон;
- дробовик работает как pump-action: 6 патронов, медленный повторный выстрел, сильная отдача и резкий close-range falloff;
- прежняя винтовка стала штурмовой: 30 патронов, автоматический огонь, средний урон и контролируемая дальность;
- ракетница стала однозарядной тяжёлой системой с более медленной перезарядкой и ускоренным физическим снарядом;
- плазма стала high-RPM / low-damage автоматом с большим магазином;
- для ballistic-оружия добавлены отдельные hip/ADS spread, штраф точности в движении и воздухе, damage falloff и индивидуальная скорость трассера;
- восстановление camera recoil теперь зависит от конкретного оружия;
- удержание ЛКМ повторяет огонь только у реальных automatic-профилей.

### Новая снайперская винтовка SR-9
- добавлена девятым оружием на клавишу `9`;
- bolt-action cadence: 5 патронов, 3.4 секунды reload и 1.30 секунды между выстрелами;
- высокий базовый урон и отдельный headshot multiplier;
- очень высокая скорость трассера и сильная отдача;
- высокая hip-fire неточность и почти точный выстрел через scope;
- 8× scope с отдельным SVG-reticle и замедлением чувствительности мыши;
- отдельная 3D procedural-модель для first-person, ботов и world pickup;
- отдельные `assets/weapons/sniper.svg`, `assets/fx/sniper-shot.svg` и `assets/ui/sniper-scope.svg`;
- отдельный sniper shot SFX и scope recoil animation;
- боты умеют выбирать SR-9 на дальней дистанции, особенно в роли anchor.

### Проверка
- Validate теперь требует 9 weapon definitions;
- CI проверяет sniper weapon / impact / scope assets и wiring;
- browser boot smoke остаётся обязательным перед merge.

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
