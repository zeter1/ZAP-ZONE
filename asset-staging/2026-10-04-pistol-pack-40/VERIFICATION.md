# Pack40 — evidence

Candidate build `12b08ff5f220c47a`. Локальный Chrome, disposable contexts и saves; fixture отключает AI threats/pickup collection только в тесте. Проектные файлы и профиль пользователя тест не изменяет.

## VERIFIED

- Writer full owner suite219/219; independent rev7 full219/219, final rev8 affected pistol18/18, syntax, stamp check и structure PASS. Independent review закрыл shared tracer capacity regression:32 pistol nodes→rifle spawn→admission→decode loss сохраняет один и тот же fallback tracer/RNG draw.
- Independent9 runtime SHA/bytes/dimensions/budget checks, WebP alpha, PCM16 mono22050 durations.34/.22/.28/.18s PASS. Все6 action cells точно сохраняют resized source alpha; recovery=ready. Effects16 cells совпадают с floor-based source slices. Manifest SHA256 `a79e90eae38c7a809defbbe99d1fba72992023972611ee417ad86d4618693478`.
- Независимый UI просмотр14 actual-game screenshots: ready+all6 poses в1920×1080 и1280×960 ACCEPT. Магазин/рабочие кисти видны, нижние/правые срезы уходят за viewport, прицел и HUD свободны. JSON каждого pose проверяет pistol/pack40/opacity1. Wide stage right1944,bottom1104 при1920×1080.
- Native semi-auto hold расходует один патрон. Native R tactical1.10s:14+75→15+74; empty1.35s:0+5→5+0. Switch cancel:3+5 сохраняется, action очищается. Семь modes:normal/missing reload/missing effects/missing ready/both ready missing/wrong-size/file://; runtime exceptions0. Legacy fallback не смешивается с Pack40 action.
- Actual Three.js wall: frontz999.85, guarded launchz999.89034 перед стеной, camera→launch не перекрыт. Native pistol projectile получает видимый DOM, исходный tracer скрыт. Pause замораживает age/ammo; death скрывает action без переноса ammo; fresh game даёт15+75 без старого action.
- Четыре фактических FX frame: только pistolMuzzle40/pistolSmoke40/pistolCasing40; одна гильза, ammo14. CSS-matrix nozzle pin error0.036px относительно live muzzle marker. Source/frame positioning проверены в реально загруженном игровом DOM; elapsed вручную фиксирован для screenshots.
- Штатные `browser-boot-smoke.mjs` HTTP и `browser-menu-smoke.mjs` file:// прошли. Финальная папка проверяется отдельно exact source→target SHA map и теми же consumers; результат установки записывается в outputs delivery evidence.

## История FAIL

- Первое214/215: mine VM fixture не предоставлял новую decode dependency; тот же writer исправил fixture, общий suite PASS. Alpha255 ожидание на нижней строке заменено фактической проверкой253/alpha equality; исходники не менялись.
- Первый pose4 source пересекал левый край внутри4:3 viewport; rejected сохранён, новый source имеет нижний выход руки.
- Bottom-only framing oracle не учитывал правый source cut. UI review выявил внутренний срез в1920; final guard защищает правый и нижние края. При ранних layouts левая кисть была слишком низко; final placement показывает её целиком в settled poses.
- Первые screenshots были сняты до decode/fade. Harness теперь ждёт точных atlas dimensions и opacity1. Один поздний harness получил другой current weapon; причина UNKNOWN (pickup/перекрывающийся headed browser test). Those results discarded; final fixture отключает pickup collection, запускается последовательно и assert weapon/asset для каждого кадра. Первый FX attempt casing count0 также сохранён как harness failure; final exact-weapon fixture проверил все4 frames.
- Первое ожидание cancel на pause было ошибочным oracle: canonical runtime замораживает pistol reload. Проверено, что age и ammo остаются неизменны, без изменения штатного поведения.

## NOT VERIFIED

Субъективный звук на устройстве пользователя, бесшовность художественных переходов между шестью отдельными позами, все браузеры/крайние размеры окон, hosting/remote GitHub CI. Git commit/push не выполняются этой задачей. Скриншоты не доказывают каждую промежуточную миллисекунду; геометрические bounded tests дополняют named-pose snapshots.

Ручная проверка: выстрел→R→пустой магазин→R→смена оружия→возврат в16:9/4:3. При FAIL нужны screenshot/короткая запись, viewport, protocol, build и Console error. Exact prompts: `prompts.json`, правка pose4:`pose-4-fix-prompt.json`.

## 2026-10-04T16:18:51+03:00 — follow-up muzzle/aim calibration

Current runtime build ed7072a66124590e. Source hole occluded: [431,150] is estimated front-plane center±6px, longitudinal slide axis−158.5°±4°. No source/runtime artwork was regenerated;9 runtime SHA and7 source SHA match manifest. Dense flame/smoke roots alpha239..251 source,234..251 runtime; normalized by exact source floor cell sizes313/314. Builder metadata and manifest agree; builder was parsed, not executed.

Checks:221/221 total,20 pistol PASS; syntax/stamp/structure PASS. Independent PNG edge oracle confirms all six opaque forearm exits.28 actual-game ready/reload frames ACCEPT across1920×1080/1280×960/1495×749/760×570.12 live-native shot FX frames across first3sizes: source-front/projected-root error≤0.072px and calibrated bore error≤0.015deg; these figures test transforms and do not prove optical accuracy beyond estimated source landmarks. Native semiauto/tactical/empty/cancel HTTP+file smoke PASS; exact final target launches recorded separately in task outputs.

Preserved first failures: pose4 rear gun x1281.58>1280 in4:3 fixed by reload-only rotation clearance; HUD covered working fingers at1280/1495 fixed by moving Pack40 ammo under stats;760 HUD overlapped slide fixed by compact style; hide→sync left pistol HUD tag on procedural bomb fixed by common helper before early returns and hide cleanup, independent failing sequence nowPASS.20th regression covers this reachable switch/loading/return flow.

Harness errors: structure was first invoked from wrong projectless cwd (ENOENT), corrected exact rootPASS. FX probe omitted production late-sync (12.98px false failure), then froze scheduler before queued loop drained (FXexpired). Replaced with observable loop-drained barrier and real order. Independent DOM source projection initially used integer offsetWidth, corrected fractional computed dimensions; final12framesPASS. Preview connection refused after bounded1200s server expired; restarted new owned600s server, thenPASS. No silent retries or product sleeps.

NOT_VERIFIED: subjective device audio, remote hosting/GitHub CI, frame-by-frame smoothness over all input/motion combinations. Source/client tests use disposable browser contexts only; user save/settings untouched. Root CHANGELOG contains one accepted follow-up block.
