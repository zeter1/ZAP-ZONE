# Bot weapon-selection policy contract

## Canonical owner

`src/ai/bot-weapon-policy.js` владеет per-bot политикой **переоценки, удержания и принятия смены основного оружия** после появления бота в матче. `shouldBotReconsiderWeapon(bot, dist)` решает, пора ли пересмотреть оружие по timer/range/safety сигналам; `selectBotWeapon(bot, distHint, force)` применяет hold/hysteresis policy, вызывает canonical scorer и при принятом switch обновляет `weapon`, `mag`, `weaponSwitchT` и presentation refresh.

## Соседние owners

- `src/weapons/system.js` — единственный source of truth для `WEAPONS`, `BOT_PRIMARY_POOL`, role/range scoring в `chooseBotWeaponByDistance(...)`, clip/range/opt metadata и `refreshBotWeaponVisual(...)` implementation.
- `src/entities/bots.js` — FSM, target context, per-frame timer decrement, fire gate/burst cadence и policy consumer.
- `src/ai/bot-fire-control.js` — aim/muzzle/reload/shot/hit execution. Rocket safety может поставить `bot.weaponSwitchT=0` как reselection request, но не выбирает replacement.
- `src/ai/tactics.js` не выбирает индивидуальное оружие и не должен получать weapon scoring.

## Spawn initialization — намеренное исключение

Первичный spawn остаётся в `Enemy`: `this.weapon=chooseBotWeaponByDistance(22,-1,true,this.role)`, затем `mag=clip` и `refreshBotWeaponVisual(this)`. До spawn-selection конструктор задаёт отдельный начальный `weaponSwitchT=2.2+random*2.0`; использование post-spawn helper изменило бы его на `4.5+random*4.0` и перестало бы быть pure refactor.

## Invariants

- reconsider: `weaponSwitchT<=0`, distance `> range*1.18`, rocket ближе `8`, shotgun дальше `22`;
- current usability: distance `<= range*1.04`, rocket не ближе `9`, shotgun не дальше `22`, sniper не ближе `22`;
- loaded-current hold chance `0.78`, delay `2.4 + random*2.2`;
- fit hysteresis `nextFit > prevFit*0.82`, marginal hold chance `0.72`, delay `2.2 + random*2.0`;
- accepted switch delay `4.5 + random*4.0`;
- valid magazine сохраняется; `force`, empty или oversize mag refills до clip;
- `refreshBotWeaponVisual(bot)` вызывается только после принятой смены и после присвоения `bot.weapon`.

Ни один коэффициент или random-call order нельзя «заодно улучшать» в ownership-refactor.

## Forbidden drift

Не переносить в policy: `BOT_PRIMARY_POOL`/scoring weights, model/pose construction, FSM/burst/reload/projectile/hit code или squad doctrine. В `bots.js` нельзя возвращать `chooseWeapon(...)` implementation или raw post-spawn switch predicate.

## Verification

`node --test scripts/bot-weapon-policy-owner.test.mjs` → `node scripts/validate-structure.mjs` → `node scripts/stamp-web-build.mjs --check` → HTTP boot smoke → real `file://` menu smoke → exact PR Validate → merged-main Validate.
