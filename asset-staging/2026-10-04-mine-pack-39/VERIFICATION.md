# Проверки мины Pack39

Исторические проверки подготовки кандидатов ниже выполнены до интеграции. Старый manifest SHA256 относится к staged manifest; актуальный файл дополнен runtime_mapping.


## VERIFIED

- Независимый test_verifier: **PASS**, один read-only проход. Все93 manifest-записи совпали по наличию/размеру/SHA256; проверены36 alpha-пар и38 atlas-ячеек. Минимальный прозрачный отступ world/FX —40px. WAV peaks5664–17853, clipping отсутствует. Identity manifest SHA256: `0bb07914a804662e2fb131d9029831fa6853ecf9475f727feef2aa1b4ff8d6c0`.
- Все10 активных оригиналов созданы встроенным image_gen на основе существующего ассета мины ZAP ZONE. Их RGBA-формат и наличие прозрачных пикселей проверены.
- Сборщик подготовил36 PNG/WebP-пар,6 атласов и5 PCM WAV. Все подготовленные изображения повторно декодированы; alpha PNG и соответствующего WebP сравнена побайтно. Сетки атласов и размеры записаны в manifest.
- World/FX нарезаются по измеренным прозрачным промежуткам. После укладки кадры имеют прозрачные поля; точные окна, общий масштаб листа и позиции сохранены в manifest. Explosion/smoke используют единый нижний anchor, не индивидуальный fit, растягивающий каждую вспышку до одинакового размера.
- Общий лист просмотрен: видны пять FPS-поз, девять мировых состояний, последовательность взрыва/дыма и шесть разных utility-эффектов. Запястья и предплечья соединены в выбранных источниках, руки продолжаются к границам FPS-кадра. Это просмотр кандидатов, не actual-game acceptance.
- `node --check` проверил извлечённый inline JavaScript страницы preview.html; синтаксических ошибок нет. Код страницы при этой проверке не выполнялся.
- SHA256 пяти контрольных runtime-файлов (`src/assets/catalog.js`, `src/weapons/system.js`, `src/combat/combat.js`, `src/styles/game.css`, `index.html`) совпадают до/после подготовки комплекта.

## NOT_VERIFIED

- Страница preview.html не проверена работающей в браузере: попытка открыть локальный HTTP URL завершилась `net::ERR_CONNECTION_TIMED_OUT`; shell HTTP probe также получил timeout. Причина UNKNOWN. Успешная синтаксическая проверка этого не опровергает. Созданный сервер остановлен.
- Pack39 подключён к catalog/JS/CSS/runtime. Live game rendering, actual DOM crop16:9/4:3, каждый игровой action-кадр и audio на устройстве остаются NOT_VERIFIED writer-ом; parent выполняет отдельное browser QA. Source/VM release/cancel/occlusion/fallback проверены ниже.
- Звуки имеют проверяемые PCM-данные; субъективное качество и воспроизведение на устройстве пользователя не оценивались.
- Публикация, hosting и remote CI не выполнялись.

## Следующая ручная проверка

Открыть preview.html рядом с его папками candidates/audio, просмотреть позы на светлом/тёмном фоне и в16:9/4:3, проиграть звуки. Пользователь явно одобрил интеграцию текущего комплекта. Проверять каждый action-кадр в самой игре и сопоставлять выпуск/детонацию с реальным объектом и таймерами.

При визуальном FAIL сохранить скриншот, имя pose/frame, размер игрового viewport и состояние (ready/throw/reload/flight/arming/explosion); при decode failure — URL ассета и сообщение консоли.

## Проверки интеграции writer

- Source/VM regression: mine11 focused tests PASS. Native slot6 LMB и F original-slot release=.29s, one object/ammo once, cancel→retry, cancel after emission, cap rejection, fallback/strict dimensions, world cell/FOV/wall/cap/cleanup, distinct FX/floor gate, historical RNG and single sound fallback.
- Первая полная соседняя suite PASS68 (до добавления FPS action-gating test): grenade/rifle/shotgun/rocket/bot-deployables.
- Pillow полностью декодировал9 runtime WebP; размеры и alpha-extrema совпадают с approved manifest. Все14 runtime files совпадают с source bytes/size/SHA256; WAV PCM mono22050.
- Syntax changed JS/test PASS. stamp generator выполнен; stamp --check до scale repair PASS: `59d96662ba46bf4d`.
- Первый structure validator FAIL:4 exact-string checks устарели после изменения mine consumers и explode signature. Причина подтверждена строками validator; это не runtime PASS. Четыре canonical source-token guards обновлены с сохранением legacy fallback/shockwave checks и добавлением Pack39 release/ground owners. Финальный structure validation PASS.

Browser/CDP smoke и live screenshot/audio writer не запускал. No save/profile imported; VM fixtures синтетические. Installation/hosting/publication/CI parent-owned и NOT_VERIFIED здесь.

- Final all-tests run: `node --test` по всем scripts/*.test.mjs — **190 PASS,0 FAIL,0 skipped**. Финальные syntax checks10 changed JS/test/validator PASS. Проверки выполняют read-only source/VM fixtures и fake CDP; live browser не выводится из этих результатов.

- First actual-game parent screenshots confirmed a visual FAIL at initial100% viewport scale: ready/extend obscured center. Writer corrected the shared ready/throw/reload scene to44% viewport scale with unchanged16:9 and bottom/right anchor. Browser recheck is parent-owned; earlier synthetic PASS never proved visual size.

- After visual scale repair: focused mine11 PASS, structure validation PASS, stamp --check PASS current `6a403010946266a4`. Earlier190-test suite remains evidence for unchanged JS/assets; corrected CSS actual-game QA remains parent-owned.

## Rev4 horizontal planted body and loader ownership

Previous rev3 actual browser evidence supplied by parent:44% scene all6 throw/3 reload poses on1920×1080 and1280×960 passed anatomy/edge/crosshair; native LMB frame3 release4→3, landing/arming/hostile detonation, no ring/cleanup, scorch cool/expiry, Escape cancel and F return to rifle passed. Missing39/wrong-size throw/file:// fault-injection passed ammo/detonation/no pageerrors. Reload input fixture was corrected because it had refilled the clip; final native reload remains parent recheck.

User observed planted billboard still faces camera. Rev4 now maps cell8 onto real chassis top XZ plane using the existing world-corner homography owner; only chassis child0 remains for thickness. Camera orbit does not change mine yaw; edge-on top collapses while chassis stays3D. Existing flat-floor physics remains unchanged.

Reviewer confirmed ready terminal-error could hide an active decoded throw and reveal procedural rig. Rev4 loader terminal failure preserves the action owner; actionstop restores rig only if ready finally failed. Focused real-loader callback sequence covers both failed and successful fallback during active throw.

Focused source/VM13 tests PASS, including side/orbit/top corner oracle, edge-on collapse/chassis and real loader callbacks. This is synthetic projection evidence; current rev4 actual browser QA is parent-owned and pending. Previous190-test result belongs to rev3; it does not prove changed rev4 owners.


## Rev8 final source batch — ccdda7ac45142802

- Final writer checks: focused mine21 PASS; all scripts/*.test.mjs200 PASS,0FAIL,0skipped; syntax11 owners/test/validator PASS; structure validation PASS; stamp --check PASS `ccdda7ac45142802`.
- New whole lying body replaces the rejected coarse chassis/projected plate: low profile dark metallic cylinder,6 lugs/vents batched into2 InstancedMesh, cyan band, amber indicator. HTTP top8 crop64..448 is a true horizontal depth-tested plane. Total height HTTP.063m/file.065m, base at actual floor0, existing radius.32 and physics center.08 preserved.
- Resource review identified per-mine1536 textures would waste GPU memory at actual cap140. Final code shares1 immutable GPUatlas with refcount, detaches material map before canonical disposal, disposes owned instance buffers/geometry/materials and releases atlas at last livebody. Independent multi-body test proves first removal keeps other top valid, final disposal once, failure/recreation/fresh cleanup.
- Parent prototype file:// reported WebGL tainted-image SecurityError (not JS exception). Final file mode never creates/uploads ImageTexture; complete native horizontal metal top/cap/cyanring is used. HTTP prototype showed broad pale annulus from atlas padding; final UV crop and darker side/rim/lug colors repair this. Final actual current-hash browser recheck remains parent-owned; prototype failures do not become PASS from synthetic tests.
- Native parent contact matrix supplied before final stamp:11/11 actual input/real damage/death cases PASS, including player own/friendly/hostile and bot all owners/self with highHP/armor/shield/secondWind. Contact code unchanged since that run; result was on stale stamped identity, so final exact-hash/target binding remains parent verification.
- Contact fixture first18-test run had16PASS/2FAIL due missing canonical damageLabel helper in extracted fixture. Including real helper fixed fixture; no product damage change was needed for this harness failure.
- Any grounded actor touching an armed mine is lethal in that physics frame; no old hostile proximity trigger. Canonical1.5s arming and nearby AoE remain. Tests distinguish physical vsnearby, player/bot jump, airborne/unarmed/wall, all9 owner/contact combinations, selfbot, stale/friendly attacker clearing, legitimate rewards once and unchanged nearby shield/secondWind.

NOT_VERIFIED writer: final current-hash live visual screenshots at normal/low/top/orbit, HTTP/file:// console and textured appearance, cap140 live performance, audio on device, final target deployment/publication/CI. Parent owns fresh-context browser QA and exact target. Prior rev3 FPS pose/cancel/release QA remains scoped evidence for unchanged FPS owners.


## Rev9 file:// approved horizontal top — 410e3bb0d1418b79

Parent current rev8 HTTP actualbody visual/depth/cleanup passed; file:// had no errors/resource leaks but native top lost approved-art detail, so appearance acceptance required revision. Final file branch retains same detailed low-profile3D casing with flush backing and approved top8 cropped onto a fixed horizontal .64m DOM worldquad at actualy=.059. Crop background400%, position94.444444%; realyaw, camera/FOV/wall/nearclip owned by existing positionGroundGrenadeDecal. No camera-facing planted billboard and no tainted WebGL image upload. Native raisedcap/ring removed; totalheight.063m. HTTP actual textured mesh and gameplay/contact/FX remain unchanged.

Final focused22 PASS; all scripts/*.test.mjs201 PASS,0FAIL/skipped; changed JS/test/validator syntax PASS; structure and stamp --check PASS410e3bb0d1418b79. New independent filecorner oracle exercises side/orbit/top, physicalsquare±.32/y.059, proper assetURL/crop, wall hide/restore, nearclip and body/DOM cleanup. Final current-hash actualfile appearance/native input/target deployment remain parent-owned NOT_VERIFIED writer.


## Parent actual-game acceptance

{
  "build": "410e3bb0d1418b79",
  "tests": 201,
  "independent_review": "22/22 PASS no actionable defects",
  "independent_verification": "22/22 final PASS; prior 42/42 targeted mine/rocket/rifle PASS",
  "browser_native": {
    "checks": [
      "ready",
      "pose-DOM",
      "native-before-release",
      "native-release",
      "landed",
      "armed",
      "real-detonation",
      "scar-cooled",
      "scar-expired",
      "cancel-pause",
      "quick-F-pending",
      "quick-F-restores-rifle",
      "native-reload-start",
      "native-reload-finish",
      "audio-decoded",
      "page-errors"
    ],
    "page_errors": 0,
    "pose_viewports": [
      "1920x1080",
      "1280x960"
    ],
    "throw_frames_each": 6,
    "reload_frames_each": 3
  },
  "world": {
    "modes": [
      "http",
      "file"
    ],
    "views_each": [
      "above",
      "low-side",
      "front",
      "right",
      "back"
    ],
    "bottom_world_y": 0,
    "height_http": 0.06300000063143671,
    "depth_occlusion_pixels_identical": true,
    "two_body_shared_texture": {
      "same": true,
      "first": 0,
      "last": 1,
      "remaining": true,
      "instanceDispose": "function"
    },
    "no_webgl_security_errors": true
  },
  "contact_matrix": "11/11 PASS player/ally/enemy/self-placer against all owners, high HP armor shield second-wind",
  "fault_injection": [
    "all Pack39 and both ready images unavailable -> procedural fallback",
    "wrong throw atlas size -> ready retained",
    "file mode -> no forbidden texture upload"
  ],
  "preserved_limits": [
    "arming 1.5 seconds",
    "nearby AoE existing damage/team/shield/perk rules"
  ],
  "not_verified": [
    "subjective device audio",
    "performance at maximum 140 mines",
    "hosting and remote CI"
  ],
  "previous_failures": [
    "oversized FPS corrected to44% viewport",
    "billboard and coarse cone rejected; replaced low-profile detailed body",
    "ready-loader ownership race fixed",
    "accidental projectile owner insertion removed, real paths tested",
    "per-body GPU atlas changed to shared last-owner release",
    "file WebGL SecurityError fixed via native backing + horizontal DOM art",
    "harness virtual-ammo/refilled-reload/central-wall/missing-occluder-matrix/pause cleanup/InstancedMesh Box3 and helper/oracle corrected",
    "one body browser boot wait timeout had no diagnostic output; cause UNKNOWN; later instrumented loads and final native/context matrix passed"
  ]
}

Earlier harness and product FAIL are retained above/in work evidence; acceptance refers only to final corrected content. Subjective device audio, hosting and remote CI remain NOT_VERIFIED.
