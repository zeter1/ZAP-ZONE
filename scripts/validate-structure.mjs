import { existsSync, readFileSync } from 'node:fs';

const fail=message=>{console.error('VALIDATION ERROR:',message);process.exitCode=1;};
const requiredScripts=[
  'src/assets/catalog.js','src/core/engine.js','src/weapons/system.js','src/player/state.js',
  'src/settings/settings.js','src/combat/combat.js','src/entities/bots.js','src/entities/pickups.js',
  'src/progression/progression.js','src/ui/minimap.js','src/game/runtime.js'
];
const weaponAssets=['pistol.svg','shotgun.svg','rifle.svg','rocket.svg','plasma.svg','mine.svg','bomb.svg','smoke.svg','sniper.svg']
  .map(name=>'assets/weapons/'+name);
const audioAssets=['pistol.wav','rifle.wav','shotgun.wav','sniper.wav','rocket-launch.wav','plasma.wav','explosion.wav','ricochet.wav','whiz.wav','objective-capture.wav','tail-open.wav','tail-tight.wav','sniper-crack.wav','footstep-walk.wav','footstep-run.wav','hit-body.wav','hit-armor.wav','hit-head.wav','battlefield-loop.wav','reload-mag.wav','reload-done.wav','shell-insert.wav','bolt-cycle.wav','pump-cycle.wav','equip.wav','footstep-metal.wav','footstep-gravel.wav','footstep-water.wav']
  .map(name=>'assets/audio/'+name);

const state=readFileSync('src/player/state.js','utf8');
const perkIds=[...state.matchAll(/\{id:'([^']+)'/g)].map(m=>m[1]);
if(perkIds.length!==52)fail('expected 52 perks, found '+perkIds.length);
if(new Set(perkIds).size!==perkIds.length)fail('duplicate perk ids');
const perkIconAssets=perkIds.map(id=>'assets/perks/'+id+'.svg');

const visualAssets=[
  'assets/pickups/ammo.svg','assets/pickups/medkit.svg',
  'assets/environment/crate.svg','assets/environment/hazard.svg','assets/environment/terminal.svg',
  'assets/environment/foliage.svg','assets/environment/water.svg',
  'assets/characters/ally-emblem.svg','assets/characters/enemy-emblem.svg',
  'assets/characters/ally-armor-mark.svg','assets/characters/enemy-armor-mark.svg',
  'assets/perks/assault.svg','assets/perks/precision.svg','assets/perks/survival.svg','assets/perks/mobility.svg','assets/perks/demolition.svg',
  'assets/fx/headshot.svg','assets/fx/headshot-kill.svg','assets/fx/explosion.svg','assets/fx/levelup.svg','assets/fx/skull.svg',
  'assets/fx/bullet-hit.svg','assets/fx/wall-impact.svg','assets/fx/plasma-impact.svg','assets/fx/sniper-shot.svg','assets/fx/rocket-impact.svg','assets/fx/critical-hit.svg','assets/fx/armor-break.svg',
  'assets/medals/first-blood.svg','assets/medals/double-kill.svg','assets/medals/triple-kill.svg','assets/medals/multikill.svg','assets/medals/killing-spree.svg','assets/medals/longshot.svg','assets/medals/critical-kill.svg','assets/medals/explosive-kill.svg',
  'assets/status/second-wind.svg','assets/status/lifesteal.svg','assets/status/armor-regen.svg','assets/status/low-health.svg','assets/status/smoke-guard.svg','assets/status/crit-ready.svg',
  'assets/ui/logo.svg','assets/ui/health.svg','assets/ui/armor.svg','assets/ui/xp.svg','assets/ui/sniper-scope.svg','assets/ui/rifle-scope.svg',
  'assets/weapons/fp/pistol-tech.svg','assets/weapons/fp/shotgun-tech.svg','assets/weapons/fp/rifle-tech.svg',
  'assets/weapons/fp/rocket-tech.svg','assets/weapons/fp/plasma-tech.svg','assets/weapons/fp/mine-tech.svg',
  'assets/weapons/fp/bomb-tech.svg','assets/weapons/fp/smoke-tech.svg','assets/weapons/fp/sniper-tech.svg',
  'assets/weapons/fp/pistol-skin.svg','assets/weapons/fp/shotgun-skin.svg','assets/weapons/fp/rifle-skin.svg',
  'assets/weapons/fp/rocket-skin.svg','assets/weapons/fp/plasma-skin.svg','assets/weapons/fp/mine-skin.svg',
  'assets/weapons/fp/bomb-skin.svg','assets/weapons/fp/smoke-skin.svg','assets/weapons/fp/sniper-skin.svg'
];
const combatMedalRasterAssets=[
  'assets/ui/medals/first-blood-tech-01.png','assets/ui/medals/double-kill-tech-01.png',
  'assets/ui/medals/triple-kill-tech-01.png','assets/ui/medals/killing-spree-tech-01.png',
  'assets/ui/medals/longshot-tech-01.png','assets/ui/medals/critical-kill-tech-01.png',
  'assets/ui/medals/explosive-kill-tech-01.png','assets/ui/medals/headshot-tech-01.png'
];
const generatedFeedbackWebpAssets=[
  'assets/ui/medals/multikill-tech-02.webp',
  'assets/ui/feedback/levelup-core-tech-01.webp','assets/ui/feedback/death-skull-tech-01.webp',
  'assets/ui/feedback/armor-break-tech-01.webp','assets/ui/objective/frontline-capture-tech-01.webp',
  'assets/ui/perks/defender-tech-01.webp'
];
const generatedFirstPersonWebpAssets=[
  'assets/ui/weapons/fp/player-pistol-fps-01.webp','assets/ui/weapons/fp/player-shotgun-fps-01.webp',
  'assets/ui/weapons/fp/player-rifle-fps-01.webp','assets/ui/weapons/fp/player-rocket-fps-01.webp',
  'assets/ui/weapons/fp/player-plasma-fps-01.webp','assets/ui/weapons/fp/player-sniper-fps-01.webp'
];
const presentationRasterAssets=[
  'assets/ui/backgrounds/menu-bg-arena-01.jpg','assets/ui/backgrounds/loading-bg-arena-01.jpg',
  'assets/ui/zap-zone-logo-01.png','assets/ui/health-icon-tech-01.png','assets/ui/armor-icon-01.png','assets/ui/xp-star-01.png',
  'assets/environment/hazard-panel-01.jpg','assets/environment/terminal-screen-01.jpg',
  'assets/ui/teams/blue-team-emblem-01.png','assets/ui/teams/red-team-emblem-01.png',
  'assets/ui/icons/ammo-tech-01.png',
  'assets/ui/perks/damage-tech-01.png','assets/ui/perks/speed-tech-01.png','assets/ui/perks/reload-tech-01.png',
  'assets/ui/objective/frontline-beacon-01.png','assets/ui/pickups/weapon-crate-tech-01.png',
  ...combatMedalRasterAssets,...generatedFeedbackWebpAssets,...generatedFirstPersonWebpAssets
];
const presentationCssRasterAssets=[
  'assets/ui/backgrounds/menu-bg-arena-01.jpg','assets/ui/backgrounds/loading-bg-arena-01.jpg',
  'assets/ui/health-icon-tech-01.png','assets/ui/armor-icon-01.png','assets/ui/xp-star-01.png',
  'assets/environment/hazard-panel-01.jpg','assets/environment/terminal-screen-01.jpg',
  'assets/ui/teams/blue-team-emblem-01.png','assets/ui/teams/red-team-emblem-01.png',
  'assets/ui/icons/ammo-tech-01.png','assets/ui/perks/reload-tech-01.png',
  'assets/ui/objective/frontline-capture-tech-01.webp','assets/ui/pickups/weapon-crate-tech-01.png'
];
const requiredAssets=[...weaponAssets,...visualAssets,...perkIconAssets];
const html=readFileSync('index.html','utf8');
const gameCss=readFileSync('src/styles/game.css','utf8');
const versionManifest=JSON.parse(readFileSync('version.json','utf8'));
const htmlBuild=html.match(/<meta name="application-build" content="([0-9a-f]{16})">/)?.[1]||'';
if(!html.includes('<meta name="application-version" content="23.9">'))fail('application-version marker missing');
if(!htmlBuild)fail('application-build marker missing or invalid');
if(versionManifest.version!=='23.9'||versionManifest.build!==htmlBuild)fail('version.json does not match index build metadata');
for(const token of ['id="cache-bootstrap"',"location.protocol==='file:'","cache:'no-store'","manifestUrl.searchParams.set('_',String(Date.now()))","pageUrl.searchParams.set('zap_build',remoteBuild)",'location.replace(pageUrl.href)','window.ZAP_BUILD_ID']){
  if(!html.includes(token))fail('cache/update bootstrap missing: '+token);
}


for(const file of ['src/styles/game.css','version.json','scripts/stamp-web-build.mjs',...requiredScripts,...requiredAssets,...presentationRasterAssets,...audioAssets])if(!existsSync(file))fail('missing '+file);
for(const file of requiredScripts)if(!html.includes("'"+file+"'"))fail('cache bootstrap does not load '+file);
if(!html.includes('id="game-styles"')||!html.includes('href="src/styles/game.css?v='))fail('index does not load versioned game.css');
if(requiredScripts.some(file=>html.includes('<script src="'+file)))fail('local game scripts must load through cache bootstrap');
for(const token of ['id="combat-medal"','id="status-icons"','id="armor-break-fx"','id="hitmarker"','id="damage-direction"','id="threat-direction"','id="settings-modal"','id="fps-counter"','id="sniper-scope"','id="frontline-map"','id="frontline-minimap"','id="frontline-map-hint"','id="left-tactical-stack"','id="frontline-objective"','id="frontline-track"','id="frontline-bearing"','id="fp-weapon-art-wrap"','id="fp-weapon-art-stage"','id="fp-weapon-art"','id="fp-weapon-flash"']){
  if(!html.includes(token))fail('HUD integration missing: '+token);
}
if(/<style>[\s\S]{200,}<\/style>/i.test(html))fail('large inline style returned');
for(const match of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(/id=["']cache-bootstrap["']/.test(match[1]))continue;
  if(match[2].trim().length>120)fail('large inline game script returned');
}
for(const file of requiredAssets){
  const svg=readFileSync(file,'utf8');
  if(!/<svg\b/i.test(svg)||!/<\/svg>\s*$/i.test(svg))fail('invalid SVG envelope: '+file);
}
for(const file of presentationRasterAssets){
  const bytes=readFileSync(file);
  if(bytes.length<2048)fail('generated presentation asset is unexpectedly small: '+file);
  if(file.endsWith('.png')&&bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')fail('invalid PNG signature: '+file);
  if(file.endsWith('.jpg')&&!(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[bytes.length-2]===0xff&&bytes[bytes.length-1]===0xd9))fail('invalid JPEG envelope: '+file);
  if(file.endsWith('.webp')&&!(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'))fail('invalid WebP envelope: '+file);
}
if(!html.includes('src="assets/ui/logo.svg"')||!html.includes('data-generated-src="assets/ui/zap-zone-logo-01.png"')||!html.includes('data-fallback-src="assets/ui/logo.svg"'))fail('generated logo/fallback wiring missing');
for(const token of [
  'data-generated-src="assets/ui/feedback/levelup-core-tech-01.webp"',
  'data-generated-src="assets/ui/feedback/death-skull-tech-01.webp"',
  'data-generated-src="assets/ui/feedback/armor-break-tech-01.webp"',
  'id="frontline-art"'
]){
  if(!html.includes(token))fail('generated feedback DOM wiring missing: '+token);
}
for(const file of presentationCssRasterAssets){
  if(!gameCss.includes('../../'+file))fail('generated presentation asset missing from CSS: '+file);
}
for(const fallback of ['../../assets/ui/health.svg','../../assets/ui/armor.svg','../../assets/ui/xp.svg'])if(!gameCss.includes(fallback))fail('file-mode UI fallback missing: '+fallback);
if(!gameCss.includes('.generated-art-enabled #menu')||!gameCss.includes('.generated-art-enabled #loading'))fail('hosted presentation-art gate missing');
for(const token of ['#tb-ally::before','#tb-enemy::before','#wammo::before','#reload-lbl::before','#frontline-art','#menu .hints::after']){
  if(!gameCss.includes(token))fail('generated gameplay UI CSS wiring missing: '+token);
}
for(const file of audioAssets){
  const wav=readFileSync(file);
  if(wav.length<44||wav.subarray(0,4).toString()!=='RIFF'||wav.subarray(8,12).toString()!=='WAVE')fail('invalid WAV asset: '+file);
}

const catalog=readFileSync('src/assets/catalog.js','utf8');
for(const file of [...visualAssets,...perkIconAssets,...presentationRasterAssets])if(!catalog.includes(file))fail('asset missing from catalog: '+file);
if(!catalog.includes('function perkAsset(id,path)')||!catalog.includes('function perkFallbackAsset(id,path)'))fail('per-id perk asset resolver/fallback missing');
for(const token of ["id==='damage'","id==='reload'","id==='mobility'||id==='sprint_drive'"]){
  if(!catalog.includes(token))fail('generated perk presentation mapping missing: '+token);
}
for(const token of [
  "defenderPerk:'assets/ui/perks/defender-tech-01.webp'",
  "['armor','armorregen','blastshield','ballistic_lining','surplus_armor','smoke_guard'].includes(id)",
  "levelUp:'assets/ui/feedback/levelup-core-tech-01.webp'",
  "death:'assets/ui/feedback/death-skull-tech-01.webp'",
  "armorBreak:'assets/ui/feedback/armor-break-tech-01.webp'",
  "frontlineCapture:'assets/ui/objective/frontline-capture-tech-01.webp'"
]){
  if(!catalog.includes(token))fail('generated feedback pack mapping missing: '+token);
}
for(const token of [
  "presentationMedals:Object.freeze",
  "'first-blood':'assets/ui/medals/first-blood-tech-01.png'",
  "'double-kill':'assets/ui/medals/double-kill-tech-01.png'",
  "'triple-kill':'assets/ui/medals/triple-kill-tech-01.png'",
  "'multikill':'assets/ui/medals/multikill-tech-02.webp'",
  "'killing-spree':'assets/ui/medals/killing-spree-tech-01.png'",
  "'longshot':'assets/ui/medals/longshot-tech-01.png'",
  "'critical-kill':'assets/ui/medals/critical-kill-tech-01.png'",
  "'explosive-kill':'assets/ui/medals/explosive-kill-tech-01.png'",
  "'headshot':'assets/ui/medals/headshot-tech-01.png'",
  'function imageAssetWithFallback','function combatMedalFallbackAsset','function combatMedalAsset',
  'function headshotFallbackAsset','function headshotAsset'
]){
  if(!catalog.includes(token))fail('combat medal raster/fallback catalog contract missing: '+token);
}
for(const token of [
  "'first-blood':'assets/medals/first-blood.svg'",
  "'double-kill':'assets/medals/double-kill.svg'",
  "'triple-kill':'assets/medals/triple-kill.svg'",
  "'killing-spree':'assets/medals/killing-spree.svg'",
  "'longshot':'assets/medals/longshot.svg'",
  "'critical-kill':'assets/medals/critical-kill.svg'",
  "'explosive-kill':'assets/medals/explosive-kill.svg'",
  "headshot:'assets/fx/headshot.svg'","headshotKill:'assets/fx/headshot-kill.svg'"
]){
  if(!catalog.includes(token))fail('combat medal/headshot SVG fallback missing: '+token);
}
for(const token of ['function G(id)','GAME_LOCAL_FILE_MODE','GAME_HOSTED_HTTP_MODE','GAME_BUILD_ID','function gameAssetUrl','function versionAssetTree','function versionDomAssetUrls','function activateGeneratedDomAssets','generated-art-enabled','dataset.generatedSrc','function makeLocalAssetFallbackTexture','if(GAME_LOCAL_FILE_MODE)']){
  if(!catalog.includes(token))fail('early DOM/local-file asset fallback missing: '+token);
}
if(!catalog.includes('firstPersonWeapons:Object.freeze'))fail('first-person weapon asset catalog missing');
if(!catalog.includes('firstPersonSkins:Object.freeze'))fail('first-person weapon skin catalog missing');
if(!catalog.includes('generatedFirstPersonWeapons:Object.freeze'))fail('generated first-person weapon catalog missing');
for(const file of generatedFirstPersonWebpAssets)if(!catalog.includes(file))fail('generated first-person weapon missing from catalog: '+file);
if(catalog.includes('crosshair.svg'))fail('legacy static gameplay crosshair must not be catalogued');
if(existsSync('assets/ui/crosshair.svg'))fail('legacy static gameplay crosshair file must be removed');

const progression=readFileSync('src/progression/progression.js','utf8');
if(progression.includes('function G(id)'))fail('G helper must be available before progression.js loads');
for(const token of ['perkAsset(p.id,p.path)','perkAsset(perk.id,perk.path)','perkFallbackAsset(p.id,p.path)','perkFallbackAsset(perk.id,perk.path)','data-fallback-src','function showCombatMedal','function showKillMedal','combatMedalFallbackAsset(type)','combatMedalAsset(type)','imageAssetWithFallback(img,combatMedalAsset(type),fallback)','function updateStatusIcons','function showArmorBreakFx','function updateWeaponStateHUD',"w.hitscan?'МГНОВЕННО'","playHitImpactSound(armorImpact?'armor':'body'"]){
  if(!progression.includes(token))fail('progression visual/weapon HUD integration missing: '+token);
}

const weapons=readFileSync('src/weapons/system.js','utf8');
const weaponDefs=[...weapons.matchAll(/weaponDef\('([^']+)'/g)].map(m=>m[1]);
if(weaponDefs.length!==9)fail('expected 9 weapon definitions, found '+weaponDefs.length);
if(!weaponDefs.includes('sniper'))fail('sniper weapon definition missing');
for(const token of ["fireMode:'bolt'","isSniper:true","aimMode:'scope'","hitscan:true","oneShot:true","headshotMult:2.55","muzzleVelocity:85","bulletGravity:4.8","reloadStyle:'shell'","equipTime:.26","sprintRecover:.12","tacticalReloadM:.88","emptyReloadM:1.08","cycleTimes:WEAPONS.map","function weaponDamageScaleAtDistance"]){
  if(!weapons.includes(token))fail('weapon physics/handling integration missing: '+token);
}
const sniperStart=weapons.indexOf("weaponDef('sniper'");
const sniperEnd=weapons.indexOf('})',sniperStart);
const sniperDef=sniperStart>=0&&sniperEnd>sniperStart?weapons.slice(sniperStart,sniperEnd):'';
if(!sniperDef.includes("aimMode:'scope'")||!sniperDef.includes('hitscan:true')||!sniperDef.includes('oneShot:true'))fail('SR-9 must be scope-only one-shot hitscan');
if(sniperDef.includes('muzzleVelocity:')||sniperDef.includes('bulletGravity:'))fail('SR-9 must not use projectile travel physics');
for(const key of ['pistol','shotgun','rifle','plasma']){
  const start=weapons.indexOf("weaponDef('"+key+"'");
  const end=weapons.indexOf('})',start);
  const def=start>=0&&end>start?weapons.slice(start,end):'';
  if(!def.includes('muzzleVelocity:'))fail(key+' missing muzzleVelocity ballistic profile');
}
if((weapons.match(/pickupAmmoMin:50,pickupAmmoMax:400/g)||[]).length!==9)fail('all 9 weapons must grant random 50..400 reserve on pickup');
for(const token of ['STARTING_RESERVE','STARTING_OWNED','BOT_WEAPON_POSES','gripR:','gripL:','userData.pose=pose','НЕ НАЙДЕНО']){
  if(!weapons.includes(token))fail('pickup/ownership or bot weapon presentation missing: '+token);
}
if(weapons.includes('function addBotWeaponGrip'))fail('bot weapon model must not carry fake detached hands');
for(const token of ['FP_HAND_POSES','FP_DECAL_TUNING','FP_MODEL_TUNING','function addFirstPersonWeaponDecal','new THREE.BoxGeometry(sw*.82','new THREE.BoxGeometry(tw*.42','emissive:accentColor','const boltMat=','w.key===\'rifle\'||w.key===\'sniper\'','w.key===\'plasma\'','const coil=new THREE.Mesh','addFirstPersonHands(gunGrp,w.key)','if(mode===\'firstPerson\'&&detail>1)','model.add(flashM)']){
  if(!weapons.includes(token))fail('polished procedural first-person weapon presentation missing: '+token);
}
if(weapons.includes('makeAssetPlane(')||weapons.includes('GAME_ASSETS.firstPersonWeapons')||weapons.includes('GAME_ASSETS.firstPersonSkins')){
  fail('first-person weapon scene must not depend on SVG texture planes');
}
for(const token of ['FP_GENERATED_ART_TUNING','function setGeneratedFirstPersonWeaponArt','function syncGeneratedFirstPersonWeaponArt','GAME_ASSETS.generatedFirstPersonWeapons','model.visible=false',"G('fp-weapon-art-wrap')","wrap.classList.toggle('shown',show)"]){
  if(!weapons.includes(token))fail('generated player-held weapon presentation missing: '+token);
}
if(weapons.includes('gameTexture(GAME_ASSETS.generatedFirstPersonWeapons')||weapons.includes('makeAssetPlane(GAME_ASSETS.generatedFirstPersonWeapons')){
  fail('generated player-held weapon art must stay DOM-only');
}
if(!weapons.includes("el.style.display=owned&&!selectable?'none':''"))fail('empty owned weapons must disappear from the weapon bar');
const rifleStart=weapons.indexOf("weaponDef('rifle'");
const rifleEnd=weapons.indexOf('})',rifleStart);
const rifleDef=rifleStart>=0&&rifleEnd>rifleStart?weapons.slice(rifleStart,rifleEnd):'';
if(!rifleDef.includes("aimMode:'scope'")||!rifleDef.includes("scopeAsset:'assets/ui/rifle-scope.svg'"))fail('assault rifle must use its RMB optical scope');
const shotgunStart=weapons.indexOf("weaponDef('shotgun'");
const shotgunEnd=weapons.indexOf('})',shotgunStart);
const shotgunDef=shotgunStart>=0&&shotgunEnd>shotgunStart?weapons.slice(shotgunStart,shotgunEnd):'';
if(shotgunDef.includes("aimMode:'scope'"))fail('shotgun must not use rifle/sniper scope');


const settings=readFileSync('src/settings/settings.js','utf8');
for(const token of ['function playSfx','GAME_AUDIO_ASSETS','function playBufferSfx','gameAudioRetryAfter','GAME_AUDIO_FILE_ASSETS_ENABLED','function scheduleGameAudioWarmup','requestIdleCallback','if(!GAME_AUDIO_FILE_ASSETS_ENABLED)return Promise.resolve(null)','if(loaded)startBattlefieldAmbience()','function combatAcousticProfile','function playWeaponTail','function playSniperCrack','function footstepSurfaceAt','function playFootstepSound','function tickPlayerFootsteps','function playHitImpactSound','function playWeaponMechanicSound','function startBattlefieldAmbience','function playerSuppressionSpreadPenalty','function registerPlayerSuppression','function playWeaponShotSound','function playSurfaceImpactSound','distant.distance>38','function playExplosionSound','function playWhizSound','function showHitMarker','function showDamageDirection','function showThreatDirection','function tickGamePresentation','function lookSensitivityMultiplier',"w.aimMode==='scope'","case 'equip'","case 'shell'","case 'ricochet'","case 'whiz'"]){
  if(!settings.includes(token))fail('settings/presentation integration missing: '+token);
}

const pickups=readFileSync('src/entities/pickups.js','utf8');
for(const token of ['WORLD_WEAPON_COPIES','WEAPONS.flatMap','pistol:2','shotgun:2','rifle:3','rocket:2','plasma:2','sniper:2','function randomWeaponReserve','grantWeapon(idx,reserveGrant)','relocateWeaponPickup(pk)']){
  if(!pickups.includes(token))fail('dynamic weapon pickup economy missing: '+token);
}
if(pickups.includes("type:'ammo'"))fail('standalone ammo pickups must not spawn');
if(pickups.includes("type:'bomb'"))fail('bomb must use the same weapon pickup/reserve economy');

const combat=readFileSync('src/combat/combat.js','utf8');
for(const token of ['function spawnPlayerBullet','function spawnEnemyBullet','function destroyEnemyBullet','MAX_ENEMY_BULLETS=260','MAX_ACTIVE_ENEMY_TRACERS','enemyTracerPool','function acquireEnemyTracer','function releaseEnemyTracer','function enemyTracerVisible','function projectileWallEnergy','function tryProjectileWallPenetration','wallEnergy:projectileWallEnergy(w,true)','wallEnergy:projectileWallEnergy(w,false)','wallPenetrations<2','function hitPlayerByEnemyBullet','closestPointOnBulletSegment','Bot firearm projectiles use the same swept-segment principle','function spawnBotSmokeGrenade','function spawnBotFragGrenade','function tickBotGrenades','mapImpactMaterial(wallHit?.object)','playSurfaceImpactSound(surface','function fireInstantSniper','const pRkts=[],eRkts=[],pTrs=[],pBullets=[],eBullets=[],botGrenades=[]','swept segment collision',"w.aimMode==='scope'",'if(w.hitscan)fireInstantSniper','window.addEventListener(\'blur\'','maxRange=120','function effectiveWeaponSpread','playerSuppressionSpreadPenalty','function weaponActionBlocked','function completePlayerReloadStep','function cancelPlayerReload',"reloadMode==='shell'",'oneShotEligible:true','w.oneShot&&b.oneShotEligible','playWeaponShotSound(w.key','playWeaponMechanicSound(\'reload\'','playWeaponMechanicSound(\'bolt\'','playExplosionSound(pos',"zone='body'","playHitImpactSound(hd?'head':hitZone"]){
  if(!combat.includes(token))fail('combat ballistics/handling integration missing: '+token);
}
for(const token of ['headshotAsset(lethalHeadshot)','headshotFallbackAsset(lethalHeadshot)','imageAssetWithFallback(hsIcon,headshotAsset(lethalHeadshot),headshotFallbackAsset(lethalHeadshot))']){
  if(!combat.includes(token))fail('generated headshot presentation/fallback wiring missing: '+token);
}
if(!html.includes('id="hs-pop-icon" src="assets/fx/headshot.svg"'))fail('headshot DOM must retain SVG initial fallback');
if(!combat.includes("document.addEventListener('wheel'")||!combat.includes('cycleOwnedWeapon(e.deltaY>0?1:-1)'))fail('mouse wheel must cycle owned weapons only');
for(const token of ['if(ammo<=0&&uAmmo<=0)updateWeaponBar();','weaponReserveValue(mineIdx)<=0)updateWeaponBar();','weaponReserveValue(bombIdx)<=0)updateWeaponBar();','weaponReserveValue(smokeIdx)<=0)updateWeaponBar();']){
  if(!combat.includes(token))fail('depleted weapon bar retirement missing: '+token);
}


const bots=readFileSync('src/entities/bots.js','utf8');
if(!bots.includes("if(wp.hitscan)spawnInstantSniperTrace"))fail('bot SR-9 must use instant hitscan trace');
if(!bots.includes('function botShotClosestApproachToPlayer')||!bots.includes('registerPlayerSuppression(this,wp,approach.point'))fail('physical enemy near-miss suppression integration missing');
if(!bots.includes('const addInsignia=')||!bots.includes('Extra readability'))fail('new procedural bot armor markings/visor missing');
if(!bots.includes('this.weaponPivot.userData.pose||'))fail('locomotion must preserve per-weapon bot pose');
for(const token of ['this.armRig=built.armRig','function solveBotTwoBoneArm','function updateBotWeaponHands','mesh.localToWorld(_BOT_GRIP_R)','updateBotWeaponHands(this);']){
  if(!bots.includes(token))fail('realistic two-hand bot weapon hold missing: '+token);
}
for(const token of ['pose.elbowR','const strideBob','const hipSway','this.pts[0].position.y=1.82+strideBob*.55']){
  if(!bots.includes(token))fail('advanced bot walk/weapon pose refinement missing: '+token);
}
for(const token of [
  'this.motionX=0;this.motionZ=0',
  'const responseT=1-Math.exp(-response*dt)',
  'this.gaitPhase+=moved*',
  'const localForward=this.velX*fwdX+this.velZ*fwdZ',
  'if(this.pts[10])',
  'if(this.pts[12])',
  "const combatPose=(this.aiState==='engage'||this.aiState==='flank'||this.aiState==='support'||this.aiState==='objective')&&this.canSeeTarget"
]){
  if(!bots.includes(token))fail('bot locomotion integration missing: '+token);
}

for(const token of ['function pickPlayerRespawnPoint()',"pushKillFeed(","this.targetEn.team"]){
  if(!bots.includes(token))fail('continuous team battle/kill feed bot integration missing: '+token);
}
for(const token of ['function pushKillFeed(','function clearKillFeed()','const respawn=pickPlayerRespawnPoint();','ТАКТИЧЕСКОЕ ВОЗРОЖДЕНИЕ · БОЙ ПРОДОЛЖАЕТСЯ']){
  if(!progression.includes(token))fail('continuous player respawn/kill feed integration missing: '+token);
}
for(const token of ["pushKillFeed('ally','ВЫ'","victim.team"]){
  if(!combat.includes(token))fail('combat kill feed integration missing: '+token);
}
if(!html.includes('id="kill-feed"'))fail('kill feed HUD root missing');

for(const token of [
  'BOT_TEAM_TACTICS',
  'function refreshBotTeamTactics',
  'findFlankPoint(target',
  'registerSuppression(source',
  "case 'flank'",
  "case 'support'",
  "this.tacticalMode==='suppress'",
  'function botRoleLabel'
]){
  if(!bots.includes(token))fail('Tactical AI 2.0 integration missing: '+token);
}
if(!combat.includes("bot.tacticalMode==='suppress'?-26"))fail('suppressor-aware player pressure ordering missing');
for(const token of [
  'BOT_MAP_ZONES',
  'function refreshBotMapOrder',
  'function botObjectivePoint',
  "squadPlan.doctrine==='retake'",
  "case 'objective'",
  'plan.aliveDelta=aliveDelta',
  "objectivePull>0&&mapObjective"
]){
  if(!bots.includes(token))fail('Combat AI 2.1 map tactics missing: '+token);
}
for(const token of [
  'PLAYER_TACTICAL_PROFILE',
  'function refreshPlayerTacticalProfile',
  "doctrine==='breach'",
  'plan.recoveryUntil=now+3800',
  "this.commandDoctrine==='breach'",
  'BOT_MOVE_CFG',
  'function clampBotVelocity',
  'function moveBotWithSubsteps',
  'this.unstuckT=.48',
  'const hardCap=total*1.10+.035',
  'Math.min(.28,lvl*.012)'
]){
  if(!bots.includes(token))fail('Combat AI 2.2 / anti-teleport integration missing: '+token);
}
if(bots.includes('this.dodgeSpd=this.speed*(2.35+this.aimSkill*.65)'))fail('legacy teleport-like dodge multiplier returned');
if(bots.includes('this.stuckT=0;this.strafeDir*=-1;this.sideBias*=-1;this.triggerDodge()'))fail('stuck recovery must not trigger high-speed dodge');
for(const token of ['playWeaponShotSound(wp.key','objectiveCoverPenalty','objectivePenalty=Math.max','playObjectiveCaptureSound(team)','function botRoutePenalty','function botShotClosestApproachToPlayer','registerPlayerSuppression(this,wp,approach.point','function botAssaultWaveState','waveStart:-999','assaultWaveState===\'staging\'','coverChainT','objectiveAdvance','playWeaponMechanicSound(\'reload\'','footstepDistance','playFootstepSound(this.group.position','frontlineContested','objectiveUrgency','strategicRetreat']){
  if(!bots.includes(token))fail('Combat Presence 1.2 / Frontline coordination missing: '+token);
}
for(const token of ['breachReady:false','smokeWaveId:-1','smokeDecisionWaveId:-1','smokeDecisionUse:false','smokeReadyAt:-999','Math.random()<.30','plan.smokeReadyAt=now+14000+Math.random()*8000','fragWaveId:-1','function maybeCoordinateBotUtility','spawnBotSmokeGrenade(bot.getMuzzlePos()','spawnBotFragGrenade(bot.getMuzzlePos()',"this.tacticalMode=squadPlan.suppressor===this","breachRole?'breach'","spawnEnemyBullet(from,pd,wp,this",'this.peekPoint=null;this.peekT=0','let coverGoal=this.coverPoint']){
  if(!bots.includes(token))fail('Combat Presence 1.3 squad/ballistic integration missing: '+token);
}
for(const token of ['const insigniaMat=','const addInsignia=','addInsignia(.281,Math.PI)','addInsignia(-.219,0)']){
  if(!bots.includes(token))fail('procedural bot insignia missing: '+token);
}
if(bots.includes('makeAssetPlane('))fail('bot scene must not depend on SVG texture planes');
if(bots.includes('this.wEl')||bots.includes('updateBadge()')||bots.includes("ally?'СВОЙ':'ВРАГ'")){
  fail('bot overhead text badges must stay removed; only health bars are allowed above bots');
}
for(const token of ["this.hEl=document.createElement('div')","this.hFill=document.createElement('div')","this.hEl.style.display=this.uiVis?'block':'none'","this.hFill.style.width=(this.hp/this.maxHp*100)+'%'"]){
  if(!bots.includes(token))fail('bot overhead health bar missing: '+token);
}
for(const token of ['function smokeRoutePenalty','function steerBotAroundSmoke','function nearestHostileGrenade','cachedGrenadeThreat','suppressorSince:-999','suppressorGeneration:0','const suppressorEligible=','priorSuppressor','suppressMemory=this.tacticalMode===\'suppress\'','this.doShoot(fireTarget,fireDist,suppressMemory)','this.peekDuration=.92','const peekEnvelope=','targetPeekLean']){
  if(!bots.includes(token))fail('Combat Presence 1.4 tactical awareness missing: '+token);
}
if(!bots.includes('if(wp.hitscan){')||!bots.includes('spawnInstantSniperTrace(from,tracerDir'))fail('bot sniper must remain hitscan while normal guns use travelling bullets');
if(bots.includes("Math.random()<(suppressing?.56:.34)"))fail('legacy random player near-miss whiz returned');
for(const token of ['FRONTLINE_CFG','function tickFrontlineObjective','function serializeFrontlineObjective','function restoreFrontlineObjective','function ensureFrontlineMarker','const frontlineZoneOwners=','zoneOwners:{...frontlineZoneOwners}','frontlineZoneOwners[zone.id]=team','frontline-map-hint','const frontlineBias=s=>','allyControlScore','enemyControlScore']){
  if(!bots.includes(token))fail('Frontline objective/map integration missing: '+token);
}
const engine=readFileSync('src/core/engine.js','utf8');
for(const file of presentationRasterAssets)if(engine.includes(file))fail('generated raster presentation asset must stay out of WebGL engine scene: '+file);
for(const token of ['function spawnCombatImpact','function tickCombatImpactFx','function spawnHeadshotFx','function spawnExplosionFx','BALLISTIC_MATERIAL_PROFILES','function mapImpactMaterial','function mapBallisticProfile','function mapPenetrationInfo',"impactMaterial='concrete'","wall.userData.impactMaterial='metal'","body.userData.impactMaterial='wood'",'const minimapStaticGeometry=[]','minimapDescriptor','function createArenaCover','ARENA_COVER_LAYOUT','coverType','coverPalette','const palettes=','const accentColor=','const bolt=new THREE.MeshStandardMaterial','function createProceduralHazardPanel','screenMat','glyphMat','IMPACT_MARK_MAX=56','impactMarkPool','function wallImpact(pos,col,material=\'concrete\',normal=null)']){
  if(!engine.includes(token))fail('polished engine FX/material/cover integration missing: '+token);
}
if(engine.includes('makeAssetPlane(')||engine.includes('makeAssetSprite(')||engine.includes('gameTexture(')){
  fail('3D engine scene must not depend on external SVG/image texture quads');
}
for(const token of ['function makeProceduralBurst','function setProceduralFxOpacity','const burst=makeProceduralBurst(col','const marker=makeProceduralBurst(gold','poolMat.emissiveIntensity=.30']){
  if(!engine.includes(token))fail('hosting-safe procedural transient FX missing: '+token);
}
if(engine.includes('waterTex')||engine.includes('map:waterTex')||engine.includes('GAME_ASSETS.fx.')||engine.includes('GAME_ASSETS.impact[')){
  fail('hosting-sensitive external FX/water texture reference returned to engine');
}

const runtime=readFileSync('src/game/runtime.js','utf8');
if(!runtime.includes('botRoleLabel(e.role)'))fail('ally panel tactical role label missing');
for(const token of ["botDoctrineLabel(plan.doctrine)","plan.zone?.label","ПРИКАЗ:"]){
  if(!runtime.includes(token))fail('ally map-order HUD missing: '+token);
}
if(!runtime.includes('tickCombatImpactFx(dt)'))fail('combat impact runtime tick missing');
if(!runtime.includes('tickFrontlineObjective(dt,ts)'))fail('Frontline objective runtime tick missing');
if(!runtime.includes('tickTacticalMinimap(dt,ts)'))fail('real tactical minimap runtime tick missing');
if(!runtime.includes('tickPlayerFootsteps(playerMoved,sprintingNow,onGnd)'))fail('distance-driven player footsteps missing');
if(!runtime.includes('tickGamePresentation('))fail('settings presentation runtime tick missing');
if(!runtime.includes('syncGeneratedFirstPersonWeaponArt(gunGrp.visible)'))fail('generated player-held weapon runtime pose sync missing');
for(const token of ['idleRenderAt=0','const menuIdle=!running','ts-idleRenderAt>=180','ts-idleRenderAt>=85']){
  if(!runtime.includes(token))fail('menu/Firefox idle render throttling missing: '+token);
}
if(!runtime.includes('activeW.scopeAsset||GAME_ASSETS.ui.sniperScope'))fail('per-weapon scope asset switching missing');
if(runtime.includes('setWeaponAmmo(SMOKE_WEAPON_INDEX,1)'))fail('smoke cooldown must not generate free ammo');
if(!runtime.includes('ensureCurrentWeaponUsable();'))fail('runtime must auto-switch away from depleted current weapon');
for(const token of ["fireW.automatic","scopedWeapon=activeW.aimMode==='scope'","adsWanted=!IS_TOUCH&&scopedWeapon&&zooming","scopeActive||scopedWeapon","recoilReturn=activeW.recoilReturn","weaponBloom=Math.max","shotResetT>0","weaponEquipT>0","sprintExitT>0","const sprintingNow=wantsSprint","cycleKind==='pump'","cycleKind==='bolt'","completePlayerReloadStep()","updateWeaponStateHUD()","ejectCasing(casingPos"]){if(!runtime.includes(token))fail('runtime weapon lifecycle missing: '+token);}

const css=readFileSync('src/styles/game.css','utf8');
for(const token of ['#combat-medal','#status-icons','#armor-break-fx','combatMedalPop','#hitmarker','#damage-direction','#threat-direction','#settings-modal','#sniper-scope','sniperScopeKick','.xh-arm','#wstate','#frontline-map','#frontline-minimap','#left-tactical-stack','#frontline-objective','#frontline-track','#frontline-bearing','#fp-weapon-art-wrap','#fp-weapon-art-wrap.on.shown','#fp-weapon-art-stage','#fp-weapon-flash','#menu .btn','one authoritative gameplay reticle']){
  if(!css.includes(token))fail('CSS visual integration missing: '+token);
}
for(const token of ['width:254px','width:236px','width:218px;height:218px','width:202px','width:176px;height:176px']){
  if(!css.includes(token))fail('compact tactical HUD sizing missing: '+token);
}
if(css.includes('crosshair.svg'))fail('CSS must not render legacy SVG crosshair');
if(css.includes('transform:none#xp-wrap')||css.includes('transform:none#'))fail('CSS selector concatenation/corruption detected');
const xpBase='#xp-wrap{position:absolute;top:18px;left:18px;transform:none;text-align:left';
if((css.split(xpBase).length-1)!==1)fail('xp-wrap base selector must be defined exactly once');
if(!css.includes(xpBase))fail('level/XP HUD must stay clear of the centered weapon bar');
const rifleScope=readFileSync('assets/ui/rifle-scope.svg','utf8');
if(!rifleScope.includes('Transparent center')||rifleScope.includes('<rect width="1920" height="1080" fill="#020406"'))fail('rifle scope must preserve transparent world view');
if((html.match(/id="xhair"/g)||[]).length!==1)fail('gameplay HUD must contain exactly one xhair root');

for(const token of ['let curW=0,lastW=0','function quickSwitchWeapon()',"playWeaponMechanicSound('equip'",'w.cycleTime=Math.max'] ){if(!state.includes(token))fail('player weapon lifecycle missing: '+token);}
for(const token of ['const weaponReserve=STARTING_RESERVE.slice()','const weaponOwned=STARTING_OWNED.slice()','function grantWeapon','function ownsWeapon','function weaponTotalAmmo','function weaponSelectable','function cycleOwnedWeapon(direction)','function ensureCurrentWeaponUsable','weaponReserve:reserves','weaponOwned:weaponOwned.slice()','v:27','serializeFrontlineObjective','restoreFrontlineObjective']){
  if(!state.includes(token))fail('per-weapon ownership/reserve save model missing: '+token);
}
if(!state.includes('if(!weaponSelectable(idx))'))fail('empty owned weapon must not be selectable');
if(!html.includes('id="wstate"'))fail('weapon readiness HUD missing');
if(!html.includes('KeyQ') && !combat.includes("e.code==='KeyQ'"))fail('Q quick switch binding missing');
const menuSmoke=readFileSync('scripts/browser-menu-smoke.mjs','utf8');
for(const token of ['menuSettingsBtn','fileAudioEnabled','pendingLoads','settingsOpen','settingsClosed']){
  if(!menuSmoke.includes(token))fail('local file menu regression smoke missing: '+token);
}
const pickupsSrc=readFileSync('src/entities/pickups.js','utf8');
for(const token of ['WORLD_WEAPON_COPIES','rifle:3','sniper:2','WEAPONS.flatMap']){
  if(!pickupsSrc.includes(token))fail('expanded world weapon distribution missing: '+token);
}
for(const token of ['function addPickupBeacon','new THREE.OctahedronGeometry(.075*scale','new THREE.TorusGeometry(.115*scale','group.userData.pickupBeacon','beacon.material.opacity=.52+pulse*.22','beacon.halo.scale.setScalar','addPickupBeacon(g,0x48ffd0,.82','addPickupBeacon(g,0xff4058,.86','addPickupBeacon(g,haloColor,.90']){
  if(!pickupsSrc.includes(token))fail('polished procedural pickup beacon missing: '+token);
}
if(pickupsSrc.includes('makeAssetSprite('))fail('persistent pickup scene must not depend on SVG sprites');
const minimap=readFileSync('src/ui/minimap.js','utf8');
for(const token of ['MINIMAP_WORLD_HALF=92','minimapStaticGeometry','BOT_MAP_ZONES','frontlineZoneOwners','camera.position',"team!=='ally'","pk.type!=='weapon'",'MINIMAP_HZ=10',"ctx.strokeStyle='rgba(3,10,16,.92)'","performance.now()*.006","minimapDrawTriangle(pos.x,pos.z,bot.group.rotation.y,'#5fc9ff'"]){
  if(!minimap.includes(token))fail('polished tactical minimap integration missing: '+token);
}
if(!html.includes('ZAP ZONE v23.9'))fail('index version is not v23.9');
if(!process.exitCode)console.log('ZAP ZONE v23.9 texture-quad-free 3D FX validation passed.');
