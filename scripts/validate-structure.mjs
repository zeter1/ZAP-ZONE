import { existsSync, readFileSync } from 'node:fs';

const fail=message=>{console.error('VALIDATION ERROR:',message);process.exitCode=1;};
const requiredScripts=[
  'src/assets/catalog.js','src/core/engine.js','src/weapons/system.js','src/player/state.js',
  'src/settings/settings.js','src/combat/combat.js','src/ai/bot-progression-scaling.js','src/ai/bot-perception.js','src/ai/bot-damage-reaction.js','src/ai/bot-suppression-response.js','src/ai/bot-dodge-response.js','src/ai/bot-navigation.js','src/ai/bot-positioning.js','src/ai/bot-weapon-policy.js','src/ai/bot-fire-control.js','src/ai/bot-fire-cadence.js','src/ai/bot-deployables.js','src/ai/bot-state-policy.js','src/ai/tactics.js','src/game/frontline.js','src/entities/bot-presentation.js','src/entities/bots.js','src/entities/pickups.js',
  'src/progression/progression.js','src/game/session.js','src/ui/minimap.js','src/game/runtime.js'
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
  'assets/ui/weapons/fp/player-plasma-fps-01.webp','assets/ui/weapons/fp/player-mine-fps-01.webp',
  'assets/ui/weapons/fp/player-bomb-fps-01.webp','assets/ui/weapons/fp/player-smoke-fps-01.webp','assets/ui/weapons/fp/player-sniper-fps-01.webp'
];
const generatedWorldPickupWebpAssets=[
  'assets/ui/pickups/weapons/world-pistol-pickup-01.webp','assets/ui/pickups/weapons/world-shotgun-pickup-01.webp',
  'assets/ui/pickups/weapons/world-rifle-pickup-01.webp','assets/ui/pickups/weapons/world-rocket-pickup-01.webp',
  'assets/ui/pickups/weapons/world-plasma-pickup-01.webp','assets/ui/pickups/weapons/world-mine-pickup-01.webp',
  'assets/ui/pickups/weapons/world-bomb-pickup-01.webp','assets/ui/pickups/weapons/world-smoke-pickup-01.webp','assets/ui/pickups/weapons/world-sniper-pickup-01.webp'
];
const generatedSupplementalWebpAssets=[
  'assets/ui/pickups/world-medkit-pickup-01.webp','assets/ui/pickups/ammo-crate-tech-02.webp',
  'assets/ui/scopes/sniper-scope-tech-01.webp','assets/ui/scopes/rifle-scope-tech-01.webp',
  'assets/ui/objective/frontline-capture-burst-tech-01.webp','assets/ui/feedback/battle-result-frame-tech-01.webp'
];
const presentationRasterAssets=[
  'assets/ui/backgrounds/menu-bg-arena-01.jpg','assets/ui/backgrounds/loading-bg-arena-01.jpg',
  'assets/ui/zap-zone-logo-01.png','assets/ui/health-icon-tech-01.png','assets/ui/armor-icon-01.png','assets/ui/xp-star-01.png',
  'assets/environment/hazard-panel-01.jpg','assets/environment/terminal-screen-01.jpg',
  'assets/ui/teams/blue-team-emblem-01.png','assets/ui/teams/red-team-emblem-01.png',
  'assets/ui/icons/ammo-tech-01.png',
  'assets/ui/perks/damage-tech-01.png','assets/ui/perks/speed-tech-01.png','assets/ui/perks/reload-tech-01.png',
  'assets/ui/objective/frontline-beacon-01.png','assets/ui/pickups/weapon-crate-tech-01.png',
  ...combatMedalRasterAssets,...generatedFeedbackWebpAssets,...generatedFirstPersonWebpAssets,...generatedWorldPickupWebpAssets,...generatedSupplementalWebpAssets
];
const presentationCssRasterAssets=[
  'assets/ui/backgrounds/menu-bg-arena-01.jpg','assets/ui/backgrounds/loading-bg-arena-01.jpg',
  'assets/ui/health-icon-tech-01.png','assets/ui/armor-icon-01.png','assets/ui/xp-star-01.png',
  'assets/environment/hazard-panel-01.jpg','assets/environment/terminal-screen-01.jpg',
  'assets/ui/teams/blue-team-emblem-01.png','assets/ui/teams/red-team-emblem-01.png',
  'assets/ui/pickups/ammo-crate-tech-02.webp','assets/ui/perks/reload-tech-01.png',
  'assets/ui/objective/frontline-capture-tech-01.webp','assets/ui/objective/frontline-capture-burst-tech-01.webp',
  'assets/ui/feedback/battle-result-frame-tech-01.webp','assets/ui/pickups/weapon-crate-tech-01.png'
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


for(const file of ['src/styles/game.css','version.json','scripts/stamp-web-build.mjs','scripts/frontline-owner.test.mjs','scripts/bot-presentation-owner.test.mjs','scripts/bot-navigation-owner.test.mjs','scripts/bot-progression-scaling-owner.test.mjs','scripts/bot-perception-owner.test.mjs','scripts/bot-damage-reaction-owner.test.mjs','scripts/bot-suppression-response-owner.test.mjs','scripts/bot-positioning-owner.test.mjs','scripts/bot-weapon-policy-owner.test.mjs','scripts/bot-fire-control-owner.test.mjs','scripts/bot-fire-cadence-owner.test.mjs','scripts/bot-state-policy-owner.test.mjs','scripts/bot-deployables-owner.test.mjs',...requiredScripts,...requiredAssets,...presentationRasterAssets,...audioAssets])if(!existsSync(file))fail('missing '+file);
for(const file of requiredScripts)if(!html.includes("'"+file+"'"))fail('cache bootstrap does not load '+file);
if(!html.includes('id="game-styles"')||!html.includes('href="src/styles/game.css?v='))fail('index does not load versioned game.css');
if(requiredScripts.some(file=>html.includes('<script src="'+file)))fail('local game scripts must load through cache bootstrap');
for(const token of ['id="combat-medal"','id="status-icons"','id="armor-break-fx"','id="hitmarker"','id="damage-direction"','id="threat-direction"','id="settings-modal"','id="fps-counter"','id="sniper-scope"','id="frontline-map"','id="frontline-minimap"','id="frontline-map-hint"','id="left-tactical-stack"','id="frontline-objective"','id="frontline-track"','id="frontline-bearing"','id="frontline-capture-burst"','id="battle-result-frame"','id="world-pickup-art-layer"','id="fp-weapon-art-wrap"','id="fp-weapon-art-stage"','id="fp-weapon-art"','id="fp-weapon-flash"']){
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
if(!gameCss.includes('.generated-art-enabled #menu')||!gameCss.includes('.generated-art-enabled #loading'))fail('presentation-art CSS gate missing');
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
for(const token of ['function G(id)','GAME_LOCAL_FILE_MODE','GAME_HOSTED_HTTP_MODE','GAME_PRESENTATION_ASSETS_ENABLED','GAME_BUILD_ID','function gameAssetUrl','function versionAssetTree','function versionDomAssetUrls','function activateGeneratedDomAssets',"if(GAME_PRESENTATION_ASSETS_ENABLED)","if(GAME_HOSTED_HTTP_MODE)versionDomAssetUrls()",'generated-art-enabled','dataset.generatedSrc','function makeLocalAssetFallbackTexture','if(GAME_LOCAL_FILE_MODE)']){
  if(!catalog.includes(token))fail('dual-runtime asset contract missing: '+token);
}
for(const forbidden of [
  '// Generated raster presentation art is enabled only for normal HTTP(S) hosting.',
  "return GAME_HOSTED_HTTP_MODE?(GAME_ASSETS.presentationMedals[type]||fallback):fallback;",
  "return GAME_HOSTED_HTTP_MODE?(GAME_ASSETS.presentationMedals.headshot||fallback):fallback;"
])if(catalog.includes(forbidden))fail('generated presentation art must not be disabled in file:// mode: '+forbidden);
if(/function perkAsset\(id,path\)\{\s*if\(GAME_HOSTED_HTTP_MODE\)/.test(catalog))fail('generated perk art must not be gated off in file:// mode');
if(!catalog.includes('firstPersonWeapons:Object.freeze'))fail('first-person weapon asset catalog missing');
if(!catalog.includes('firstPersonSkins:Object.freeze'))fail('first-person weapon skin catalog missing');
if(!catalog.includes('generatedFirstPersonWeapons:Object.freeze'))fail('generated first-person weapon catalog missing');
for(const file of generatedFirstPersonWebpAssets){
  if(!catalog.includes(file))fail('generated first-person weapon missing from catalog: '+file);
  const bytes=readFileSync(file);
  if(bytes.length>250*1024)fail('generated first-person weapon runtime derivative exceeds 250 KiB: '+file);
}
if(!catalog.includes('generatedWorldWeaponPickups:Object.freeze'))fail('generated world weapon pickup catalog missing');
for(const file of generatedWorldPickupWebpAssets){
  if(!catalog.includes(file))fail('generated world pickup weapon missing from catalog: '+file);
  const bytes=readFileSync(file);
  if(bytes.length>120*1024)fail('generated world pickup derivative exceeds 120 KiB: '+file);
}
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
for(const token of ['FP_MUZZLE_FLASH_SECONDS','FP_RECOIL_VISUAL','FP_GENERATED_ART_TUNING','function setProceduralFirstPersonRigVisible','function setGeneratedFirstPersonWeaponArt','function ensureGeneratedFirstPersonWeaponArtLoaded','function syncGeneratedFirstPersonWeaponArt','GAME_ASSETS.generatedFirstPersonWeapons','setProceduralFirstPersonRigVisible(false)',"G('fp-weapon-art-wrap')","wrap.classList.toggle('shown',show)",'Math.max(-14,Math.min(14','Math.max(-1.6,Math.min(1.6',"mine:{width:'38vw'","bomb:{width:'40vw'","smoke:{width:'34vw'",'--fp-flash-core','flashScale']){
  if(!weapons.includes(token))fail('generated player-held weapon presentation missing: '+token);
}
if(weapons.includes('pending.model.visible=false'))fail('baked-hand generated weapon art must hide the whole procedural first-person rig, not only the weapon body');
if(weapons.includes('gameTexture(GAME_ASSETS.generatedFirstPersonWeapons')||weapons.includes('makeAssetPlane(GAME_ASSETS.generatedFirstPersonWeapons')){
  fail('generated player-held weapon art must stay DOM-only');
}
if(weapons.includes('if(!GAME_HOSTED_HTTP_MODE||!wrap||!asset)return;'))fail('generated player-held weapon art must not be disabled in file:// mode');
if(!weapons.includes('if(!wrap||!asset)return;'))fail('generated player-held weapon loader protocol-neutral guard missing');
if(!weapons.includes("el.style.display=owned&&!selectable?'none':''"))fail('empty owned weapons must disappear from the weapon bar');
const rifleStart=weapons.indexOf("weaponDef('rifle'");
const rifleEnd=weapons.indexOf('})',rifleStart);
const rifleDef=rifleStart>=0&&rifleEnd>rifleStart?weapons.slice(rifleStart,rifleEnd):'';
if(!rifleDef.includes("aimMode:'scope'")||!rifleDef.includes("scopeAsset:'assets/ui/scopes/rifle-scope-tech-01.webp'")||!rifleDef.includes("scopeFallback:'assets/ui/rifle-scope.svg'"))fail('assault rifle must use generated RMB optical scope with SVG fallback');
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
for(const token of ['WORLD_PICKUP_ART_TUNING','WORLD_MEDKIT_PICKUP_ART_TUNING','function worldWeaponPickupAsset','function attachWorldWeaponPickupArt','function attachWorldMedkitPickupArt','function syncWorldWeaponPickupArt','GAME_ASSETS.generatedWorldWeaponPickups','GAME_ASSETS.presentation.medkitPickup','new THREE.Raycaster()','intersectObjects(wallMeshes,false)','model.visible=false','g.userData.proceduralWeaponModel=model']){
  if(!pickups.includes(token))fail('generated world weapon pickup presentation missing: '+token);
}
if(pickups.includes('makeAssetPlane(GAME_ASSETS.generatedWorldWeaponPickups')||pickups.includes('makeAssetSprite(GAME_ASSETS.generatedWorldWeaponPickups')||pickups.includes('gameTexture(GAME_ASSETS.generatedWorldWeaponPickups')){
  fail('generated world weapon pickup art must stay DOM-projected, not WebGL textured');
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


const progressionScaling=readFileSync('src/ai/bot-progression-scaling.js','utf8');
const perception=readFileSync('src/ai/bot-perception.js','utf8');
const damageReaction=readFileSync('src/ai/bot-damage-reaction.js','utf8');
const suppressionResponse=readFileSync('src/ai/bot-suppression-response.js','utf8');
const dodgeResponse=readFileSync('src/ai/bot-dodge-response.js','utf8');
const navigation=readFileSync('src/ai/bot-navigation.js','utf8');
const positioning=readFileSync('src/ai/bot-positioning.js','utf8');
const weaponPolicy=readFileSync('src/ai/bot-weapon-policy.js','utf8');
const fireControl=readFileSync('src/ai/bot-fire-control.js','utf8');
const fireCadence=readFileSync('src/ai/bot-fire-cadence.js','utf8');
const deployables=readFileSync('src/ai/bot-deployables.js','utf8');
const statePolicy=readFileSync('src/ai/bot-state-policy.js','utf8');
const tactics=readFileSync('src/ai/tactics.js','utf8');
const frontline=readFileSync('src/game/frontline.js','utf8');
const presentation=readFileSync('src/entities/bot-presentation.js','utf8');
const bots=readFileSync('src/entities/bots.js','utf8');
for(const token of [
  'function applyBotProgressionScaling(bot,force=false){',
  'if(!force&&bot.levelSync===level)return;',
  'const hpRatio=force?1:Math.max(.24,Math.min(1,oldHp/oldMax));',
  "const roleHp=bot.role==='anchor'?1.18:bot.role==='assault'?1.02:bot.role==='engineer'?1.10:1.05;",
  "const roleSpd=(bot.role==='flankL'||bot.role==='flankR')?1.12:(bot.role==='anchor'?.96:1.03);",
  'const dominance=Math.min(.55,kills*.009);',
  'const combatGrowth=Math.min(.28,kills*.0045);',
  'bot.aimSkill=Math.min(.97,.58+bot.skillSeed+lvl*.013+Math.min(.13,kills*.0018));',
  'bot.maxHp=bot.baseHp*(1.08+lvl*.082+dominance)*roleHp;',
  'bot.hp=force?bot.maxHp:Math.min(bot.maxHp,bot.maxHp*hpRatio+Math.max(10,bot.maxHp*.05));',
  'bot.speed=bot.baseSpeed*(1.02+Math.min(.28,lvl*.012)+Math.min(.12,kills*.0020))*roleSpd;',
  'bot.baseDmgMul=(.86+bot.type*.06)*(1+lvl*.038+combatGrowth)*roleDmg;',
  "bot.curAcc=Math.max(.0075,bot.baseAcc*(1.03-Math.min(lvl*.019,.58)-Math.min(.18,kills*.0022))*(bot.role==='anchor'?.82:1));",
  "bot.fireRateMul=Math.max(.62,1.08-lvl*.013-Math.min(.20,kills*.0025))*(bot.role==='assault'?.92:1);",
  'bot.levelSync=level;'
]){
  if(!progressionScaling.includes(token))fail('bot progression-scaling owner contract missing: '+token);
}
if(/Math\.random\s*\(/.test(progressionScaling))fail('bot progression-scaling owner must remain deterministic');
if(!bots.includes('syncScale(force=false){\n    applyBotProgressionScaling(this,force);\n  }'))fail('bot progression-scaling consumer seam missing');
for(const token of [
  'const dominance=Math.min(.55,kills*.009);',
  'const combatGrowth=Math.min(.28,kills*.0045);',
  'this.maxHp=this.baseHp*(1.08+lvl*.082+dominance)*roleHp;',
  "this.fireRateMul=Math.max(.62,1.08-lvl*.013-Math.min(.20,kills*.0025))*(this.role==='assault'?.92:1);"
]){
  if(bots.includes(token))fail('bot progression-scaling implementation leaked back into bots.js: '+token);
}
for(const token of ['selectBotWeapon(','executeBotShot(','moveBotWithSubsteps(','applyBotDamageReaction(','applyBotDodgeResponse(']){
  if(progressionScaling.includes(token))fail('unrelated bot authority leaked into progression-scaling owner: '+token);
}

for(const token of [
  'function applyBotDamageReaction(bot,dmg,fromTeam,source=null){',
  "const botSource=source&&source!=='player'",
  "const playerSource=bot.team==='enemy'",
  'const shouldRetaliate=!bot.canSeeTarget||bot.targetLockT<=.15||dmg>=bot.maxHp*.10;',
  'bot.targetLockT=.92+bot.aimSkill*.45',
  'bot.reactionT=Math.min(bot.reactionT,.07);',
  'bot.burstPauseT=Math.min(bot.burstPauseT,.06);',
  "bot.aiState='hunt'",
  'bot.stateCD=Math.min(bot.stateCD,.14);'
]){
  if(!damageReaction.includes(token))fail('bot damage-reaction owner contract missing: '+token);
}
if(!bots.includes('applyBotDamageReaction(this,dmg,fromTeam,source);'))fail('Enemy.hurt must consume canonical bot damage-reaction policy');
for(const token of [
  "const botSource=source&&source!=='player'",
  "const playerSource=this.team==='enemy'",
  'const shouldRetaliate=!this.canSeeTarget',
  'this.targetLockT=.92+this.aimSkill*.45'
]){
  if(bots.includes(token))fail('bot damage-reaction implementation leaked back into bots.js: '+token);
}
for(const token of ['this.hp-=','triggerDodge(','die(','Math.random(','class Enemy','registerSuppression(','spawnEnemyBullet','BOT_TEAM_TACTICS','findBotFlankPoint']){
  if(damageReaction.includes(token))fail('HP/dodge/death/RNG/combat/tactics authority leaked into bot damage-reaction owner: '+token);
}
const hurtStart=bots.indexOf('  hurt(dmg,dir,fromTeam,source=null){');
const hurtEnd=bots.indexOf('\n  die(dmg,dir){',hurtStart);
const hurtBody=hurtStart>=0&&hurtEnd>hurtStart?bots.slice(hurtStart,hurtEnd):'';
const hurtDodge=hurtBody.indexOf('this.triggerDodge()');
const hurtReaction=hurtBody.indexOf('applyBotDamageReaction(this,dmg,fromTeam,source);');
const hurtDeath=hurtBody.indexOf('if(this.hp<=0)this.die(dmg,dir);');
if(!(hurtDodge>=0&&hurtDodge<hurtReaction&&hurtReaction<hurtDeath))fail('Enemy.hurt event order must remain dodge -> damage reaction -> death');
for(const token of [
  'function applyBotSuppressionResponse(bot,source,intensity=.6){',
  'if(!bot.alive||!source||source===bot||source.team===bot.team)return;',
  'const pressure=Math.max(.3,Math.min(1.4,intensity));',
  'bot.suppressedT=Math.max(bot.suppressedT,.62+pressure*.78);',
  'bot.suppressionSource=source;',
  'bot.coverCooldownT=Math.min(bot.coverCooldownT,.12);',
  'if(bot.hp/bot.maxHp<.72||pressure>.9){',
  'bot.coverEvalT=Math.min(bot.coverEvalT,.05);',
  'bot.stateCD=Math.min(bot.stateCD,.08);'
]){
  if(!suppressionResponse.includes(token))fail('bot suppression-response owner contract missing: '+token);
}
if(!bots.includes('applyBotSuppressionResponse(this,source,intensity);'))fail('Enemy.registerSuppression must consume canonical suppression-response policy');
for(const token of [
  'const pressure=Math.max(.3,Math.min(1.4,intensity));',
  'this.suppressedT=Math.max(this.suppressedT,.62+pressure*.78);',
  'this.suppressionSource=source;',
  'this.coverCooldownT=Math.min(this.coverCooldownT,.12);',
  'if(this.hp/this.maxHp<.72||pressure>.9)'
]){
  if(bots.includes(token))fail('bot suppression-response implementation leaked back into bots.js: '+token);
}
for(const token of ['Math.random(','class Enemy','registerSuppression(','closestPointOnBulletSegment','near.distance','findBotTacticalCover(','updateBotTargetPerception(','applyBotDamageReaction(']){
  if(suppressionResponse.includes(token))fail('RNG/detection/perception/damage/cover authority leaked into bot suppression-response owner: '+token);
}
const suppressionProducer='nearest.registerSuppression(b.src,b.suppressing?1.10:Math.max(.38,1-nearestD/1.45));';
if(!combat.includes(suppressionProducer))fail('combat near-miss producer must keep Enemy.registerSuppression compatibility seam');
if(combat.includes('applyBotSuppressionResponse('))fail('combat near-miss producer must not bypass Enemy.registerSuppression');
for(const token of [
  'if(this.suppressedT>0){this.suppressedT=Math.max(0,this.suppressedT-dt);if(this.suppressedT<=0)this.suppressionSource=null;}',
  '||(this.suppressedT>0);',
  "||this.suppressedT>0))this.aiState='cover';"
]){
  if(!bots.includes(token))fail('bot suppression lifecycle/consumer contract missing: '+token);
}
for(const token of [
  'function applyBotDodgeResponse(bot,preferredDir=0,urgency=1){',
  'if(bot.dodgeCD>0||bot.dodgeT>0)return;',
  'bot.dodgeDir=preferredDir||(Math.random()<.5?-1:1);',
  'bot.dodgeT=(0.34+Math.random()*.24)*Math.max(.86,Math.min(1.14,urgency));',
  'bot.dodgeSpd=bot.speed*(1.30+bot.aimSkill*.16)*Math.max(.96,Math.min(1.08,urgency));',
  'bot.dodgeCD=.88+Math.random()*.62;',
  'if(Math.random()<0.16*urgency&&bot.jV===0)bot.jV=4.6+Math.random()*1.6;'
]){
  if(!dodgeResponse.includes(token))fail('bot dodge-response owner contract missing: '+token);
}
if(!bots.includes('applyBotDodgeResponse(this,preferredDir,urgency);'))fail('Enemy.triggerDodge must consume canonical dodge-response policy');
for(const token of [
  'this.dodgeDir=preferredDir||(Math.random()<.5?-1:1);',
  'this.dodgeT=(0.34+Math.random()*.24)*Math.max(.86,Math.min(1.14,urgency));',
  'this.dodgeSpd=this.speed*(1.30+this.aimSkill*.16)*Math.max(.96,Math.min(1.08,urgency));',
  'this.dodgeCD=.88+Math.random()*.62;',
  'if(Math.random()<0.16*urgency&&this.jV===0)this.jV=4.6+Math.random()*1.6;'
]){
  if(bots.includes(token))fail('bot dodge-response implementation leaked back into bots.js: '+token);
}
for(const token of ['class Enemy','this.hp-=','die(','applyBotDamageReaction(','applyBotSuppressionResponse(','updateBotRocketThreat(','findBotTacticalCover(','BOT_TEAM_TACTICS','claimHealthPickup(','wallBetween(']){
  if(dodgeResponse.includes(token))fail('damage/perception/navigation/FSM authority leaked into bot dodge-response owner: '+token);
}
if((bots.match(/applyBotDodgeResponse\(/g)||[]).length!==1)fail('bots.js must reach dodge-response owner only through Enemy.triggerDodge');
if(!bots.includes("if(this.hp>0&&Math.random()<Math.min(.90,.48+level*.018+kills*.0025))this.triggerDodge();"))fail('survived-damage producer must keep Enemy.triggerDodge compatibility seam');
if(!bots.includes('this.triggerDodge(rocketThreat.side,urgency);'))fail('rocket-threat producer must keep Enemy.triggerDodge compatibility seam');
for(const sourceOwner of [perception,damageReaction,suppressionResponse,navigation,positioning,weaponPolicy,fireControl,deployables,tactics]){
  if(sourceOwner.includes('applyBotDodgeResponse('))fail('bot producer/owner must not bypass Enemy.triggerDodge compatibility seam');
}
for(const token of [
  'if(this.dodgeCD>0)this.dodgeCD-=dt;',
  'else if(this.dodgeT>0&&targetPos){',
  'mx=px*this.dodgeDir*this.dodgeSpd;mz=pz*this.dodgeDir*this.dodgeSpd;',
  'this.dodgeT>0?BOT_MOVE_CFG.dodgeMaxM'
]){
  if(!bots.includes(token))fail('bot dodge lifecycle/movement consumer contract missing: '+token);
}
for(const token of ['function tryPlantBotMine(bot,dist,targetPos){','function tryPlantBotBomb(bot,dist,targetPos){','countTeamMines(bot.team)','activeBombCount()','bombNearPoint(pos,24)',"bot.commandDoctrine==='breach'",'mkMine()','mkBomb()']){if(!deployables.includes(token))fail('bot deployables owner contract missing: '+token);}
if(/maybePlant(?:Mine|Bomb)\s*\(/.test(bots))fail('bot deployable implementation leaked back into bots.js');
for(const token of ['tryPlantBotBomb(this,dist,targetPos)','tryPlantBotMine(this,dist,targetPos)','this.mineCD=8+Math.random()*12','this.bombCD=24+Math.random()*52','if(this.mineCD>0)this.mineCD-=dt;','if(this.bombCD>0)this.bombCD-=dt;']){if(!bots.includes(token))fail('bot deployables consumer/fire-gate contract missing: '+token);}
const botBombDeployCall=bots.indexOf('tryPlantBotBomb(this,dist,targetPos)'),botMineDeployCall=bots.indexOf('tryPlantBotMine(this,dist,targetPos)'),botShotCall=bots.indexOf('executeBotShot(this,fireTarget,fireDist,suppressMemory)'),botCadenceCall=bots.indexOf('applyBotPostShotCadence(this);');
if(!(botBombDeployCall>=0&&botBombDeployCall<botMineDeployCall&&botMineDeployCall<botShotCall&&botShotCall<botCadenceCall))fail('bot utility/fire/cadence order must remain bomb -> mine -> firearm shot -> post-shot cadence');
for(const token of ['bot.aiState=','bot.burstLeft=','bot.burstPauseT=','bot.sT=','BOT_TEAM_TACTICS','spawnBotSmokeGrenade','spawnBotFragGrenade','executeBotShot','class Enemy']){if(deployables.includes(token))fail('FSM/squad/fire-control authority leaked into bot deployables owner: '+token);}
if(/const\s+BOT_(?:MINE|BOMB)_CFG\s*=/.test(deployables))fail('bot deployables owner must consume, not redefine, deployable config');
for(const token of ['tryPlantBotMine','tryPlantBotBomb'])if(tactics.includes(token))fail('individual deployable policy leaked into team tactics: '+token);
if(!fireControl.includes("if(wp.hitscan)spawnInstantSniperTrace"))fail('bot SR-9 must use instant hitscan trace');
if(!fireControl.includes('function botShotClosestApproachToPlayer')||!fireControl.includes('registerPlayerSuppression(bot,wp,approach.point'))fail('physical enemy near-miss suppression integration missing');
if(!presentation.includes('const addInsignia=')||!presentation.includes('Extra readability'))fail('bot presentation owner must preserve procedural armor markings/visor');
for(const token of ['function mkHuman(et,team){','const armRig={','function setBotLimbBetween(','function solveBotTwoBoneArm(','function updateBotWeaponHands(','mesh.localToWorld(_BOT_GRIP_R)']){
  if(!presentation.includes(token))fail('bot presentation owner contract missing: '+token);
}
for(const token of ['function mkHuman(et,team){','const _BOT_ARM_UP=','function setBotLimbBetween(','function solveBotTwoBoneArm(','function updateBotWeaponHands(','const addInsignia=']){
  if(bots.includes(token))fail('bot presentation owner leaked back into bots.js: '+token);
}
for(const token of ['class Enemy{','const WPTS=','const BOT_MOVE_CFG=','function steerBotAroundWalls(','function botShotClosestApproachToPlayer(']){
  if(presentation.includes(token))fail('AI/movement implementation leaked into bot presentation owner: '+token);
}
for(const token of ['const built=mkHuman(et,team);','this.armRig=built.armRig','this.weaponPivot.userData.pose||','updateBotWeaponHands(this);']){
  if(!bots.includes(token))fail('bot presentation consumer contract missing: '+token);
}
if(!presentation.includes('pose.elbowR'))fail('bot presentation elbow-hint contract missing');
for(const token of ['const strideBob','const hipSway','this.pts[0].position.y=1.82+strideBob*.55']){
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

if(!bots.includes('function pickPlayerRespawnPoint()'))fail('continuous team battle respawn integration missing');
for(const token of ["pushKillFeed(","bot.targetEn.team"]){
  if(!fireControl.includes(token))fail('continuous team battle/kill feed fire-control integration missing: '+token);
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
  'function botRoleLabel',
  'function botDoctrineLabel',
  'function botAssaultWaveState'
]){
  if(!tactics.includes(token))fail('Tactical AI 2.0 owner missing: '+token);
}
for(const token of [
  'findBotFlankPoint(this,squadPlan.focusPos,sign)',
  'registerSuppression(source',
  "case 'flank'",
  "case 'support'",
  "this.tacticalMode==='suppress'"
]){
  if(!bots.includes(token))fail('Tactical AI 2.0 bot execution missing: '+token);
}
if(!combat.includes("bot.tacticalMode==='suppress'?-26"))fail('suppressor-aware player pressure ordering missing');
if(!(html.indexOf("'src/combat/combat.js'")<html.indexOf("'src/ai/bot-progression-scaling.js'")&&html.indexOf("'src/ai/bot-progression-scaling.js'")<html.indexOf("'src/ai/bot-perception.js'")&&html.indexOf("'src/ai/bot-perception.js'")<html.indexOf("'src/ai/bot-damage-reaction.js'")&&html.indexOf("'src/ai/bot-damage-reaction.js'")<html.indexOf("'src/ai/bot-suppression-response.js'")&&html.indexOf("'src/ai/bot-suppression-response.js'")<html.indexOf("'src/ai/bot-dodge-response.js'")&&html.indexOf("'src/ai/bot-dodge-response.js'")<html.indexOf("'src/ai/bot-navigation.js'")&&html.indexOf("'src/ai/bot-navigation.js'")<html.indexOf("'src/ai/bot-positioning.js'")&&html.indexOf("'src/ai/bot-positioning.js'")<html.indexOf("'src/ai/bot-weapon-policy.js'")&&html.indexOf("'src/ai/bot-weapon-policy.js'")<html.indexOf("'src/ai/bot-fire-control.js'")&&html.indexOf("'src/ai/bot-fire-control.js'")<html.indexOf("'src/ai/bot-fire-cadence.js'")&&html.indexOf("'src/ai/bot-fire-cadence.js'")<html.indexOf("'src/ai/bot-deployables.js'")&&html.indexOf("'src/ai/bot-deployables.js'")<html.indexOf("'src/ai/bot-state-policy.js'")&&html.indexOf("'src/ai/bot-state-policy.js'")<html.indexOf("'src/ai/tactics.js'")&&html.indexOf("'src/ai/tactics.js'")<html.indexOf("'src/game/frontline.js'")&&html.indexOf("'src/game/frontline.js'")<html.indexOf("'src/entities/bots.js'"))){
  fail('classic-script order must load combat -> bot progression scaling -> bot perception -> bot damage reaction -> bot suppression response -> bot dodge response -> bot navigation -> bot positioning -> bot weapon policy -> bot fire-control -> bot fire-cadence -> bot deployables -> bot state policy -> tactics -> frontline -> bots');
}
if(!(html.indexOf("'src/entities/bot-presentation.js'")<html.indexOf("'src/entities/bots.js'"))){
  fail('classic-script order must load bot presentation owner before bots');
}
for(const token of ['const BOT_MAP_ZONES=','const BOT_TEAM_TACTICS=','const PLAYER_TACTICAL_PROFILE=','function refreshBotMapOrder(','function refreshBotTeamTactics(','function botObjectivePoint(','function maybeCoordinateBotUtility(']){
  if(bots.includes(token))fail('team/map tactics owner leaked back into bots.js: '+token);
}
for(const token of ['class Enemy{','function findBotFlankPoint(','registerSuppression(source','const BOT_MOVE_CFG=']){
  if(tactics.includes(token))fail('per-bot implementation leaked into tactics owner: '+token);
}
for(const token of [
  'BOT_MAP_ZONES',
  'function refreshBotMapOrder',
  'function botObjectivePoint',
  'plan.aliveDelta=aliveDelta',
  'const frontlineBias=s=>'
]){
  if(!tactics.includes(token))fail('Combat AI 2.1 map tactics owner missing: '+token);
}
for(const token of [
  "squadPlan.doctrine==='retake'",
  "case 'objective'",
  "objectivePull>0&&mapObjective"
]){
  if(!bots.includes(token))fail('Combat AI 2.1 bot integration missing: '+token);
}
for(const token of [
  'PLAYER_TACTICAL_PROFILE',
  'function refreshPlayerTacticalProfile',
  "doctrine==='breach'",
  'plan.recoveryUntil=now+3800'
]){
  if(!tactics.includes(token))fail('Combat AI 2.2 Adaptive Commander owner missing: '+token);
}
for(const token of [
  'const WPTS=','function steerBotAroundWalls(','const BOT_MOVE_CFG=','function clampBotVelocity(',
  'function smokeRoutePenalty(','function botRoutePenalty(','function steerBotAroundSmoke(',
  'function moveBotWithSubsteps(','const hardCap=total*1.10+.035'
]){
  if(!navigation.includes(token))fail('bot navigation owner contract missing: '+token);
}
for(const token of [
  'const WPTS=','function steerBotAroundWalls(','const BOT_MOVE_CFG=','function clampBotVelocity(',
  'function smokeRoutePenalty(','function botRoutePenalty(','function steerBotAroundSmoke(','function moveBotWithSubsteps('
]){
  if(bots.includes(token))fail('bot navigation owner leaked back into bots.js: '+token);
}
for(const token of [
  'function nearestHostileGrenade(','const BOT_NOISE_EVENTS=[];','function emitBotCombatNoise(',
  'function updateBotHearingPerception(','function updateBotTargetPerception(','function botTargetPosition(',
  'function updateBotMineThreat(','function updateBotGrenadeThreat(','function updateBotLineOfSight(',
  'function findBotIncomingRocketThreat(','function updateBotRocketThreat('
]){
  if(!perception.includes(token))fail('bot perception owner contract missing: '+token);
}
for(const token of [
  'function nearestHostileGrenade(','const BOT_NOISE_EVENTS=[];','function botWeaponNoiseRadius(',
  'function botSourceTeam(','function syncPlayerCombatNoise(','canSeePoint(pos','hearCombatNoise(dt)',
  'findIncomingRocketThreat()','findTarget()','getTargetPos()'
]){
  if(bots.includes(token))fail('bot perception owner leaked back into bots.js: '+token);
}
for(const token of [
  'syncPlayerCombatNoise();','updateBotHearingPerception(this,dt)','updateBotTargetPerception(this)',
  'botTargetPosition(this)','updateBotMineThreat(this,dt)','updateBotGrenadeThreat(this,dt)',
  'updateBotLineOfSight(this,targetPos,dt)','updateBotRocketThreat(this,dt)'
]){
  if(!bots.includes(token))fail('bot perception consumer contract missing: '+token);
}
for(const token of ['this.aiState=','executeBotShot(','moveBotWithSubsteps(','refreshBotTeamTactics(']){
  if(perception.includes(token))fail('FSM/combat/navigation/tactics implementation leaked into bot perception owner: '+token);
}
if(navigation.includes('function nearestHostileGrenade('))fail('grenade threat perception must not leak into bot navigation owner');
for(const token of ['function findBotTacticalCover(bot,target){','function findBotFlankPoint(bot,target,sideSign){','objectiveCoverPenalty','objectivePenalty=Math.max','objectiveAdvance','botRoutePenalty(routeFrom,routeTo,bot.team)','const firingLane=!wallBetween(eye,tgt,losMeshes)&&!smokeBlocksSight(eye,tgt)']){
  if(!positioning.includes(token))fail('bot positioning owner contract missing: '+token);
}
for(const token of ['findTacticalCover(target){','findFlankPoint(target,sideSign){'])if(bots.includes(token))fail('bot positioning implementation leaked back into bots.js: '+token);
for(const token of ['findBotTacticalCover(this,targetPos)','findBotFlankPoint(this,squadPlan.focusPos,sign)'])if(!bots.includes(token))fail('bot positioning consumer contract missing: '+token);
for(const token of ["this.aiState=","case 'cover'","case 'flank'",'moveBotWithSubsteps(','refreshBotTeamTactics(','flankCommitT=','coverEvalT='])if(positioning.includes(token))fail('FSM/tactics/locomotion authority leaked into bot positioning owner: '+token);
for(const token of [
  'function shouldBotReconsiderWeapon(bot,dist){','function selectBotWeapon(bot,distHint=22,force=false){',
  'dist>weapon.range*1.18','distHint<=prevWeapon.range*1.04','chooseBotWeaponByDistance(distHint,prev,force,bot.role)',
  'nextFit>prevFit*.82&&Math.random()<.72','refreshBotWeaponVisual(bot)'
]){if(!weaponPolicy.includes(token))fail('bot weapon-selection policy owner contract missing: '+token);}
if(bots.includes('chooseWeapon(distHint=22,force=false){'))fail('bot weapon-selection implementation leaked back into bots.js');
if((bots.match(/chooseBotWeaponByDistance\(/g)||[]).length!==1||!bots.includes('this.weapon=chooseBotWeaponByDistance(22,-1,true,this.role);'))fail('bots.js must keep only the distinct forced spawn weapon initialization');
for(const token of ['shouldBotReconsiderWeapon(this,dist)','selectBotWeapon(this,dist,false)'])if(!bots.includes(token))fail('bot weapon-selection policy consumer contract missing: '+token);
for(const token of ['BOT_PRIMARY_POOL','const scored=BOT_PRIMARY_POOL.map','function refreshBotWeaponVisual(','BOT_WEAPON_POSES','executeBotShot(','bot.aiState=','bot.burstLeft=','function refreshBotTeamTactics('])if(weaponPolicy.includes(token))fail('weapon data/presentation/FSM/fire-control/tactics authority leaked into bot weapon policy: '+token);
if(fireControl.includes('selectBotWeapon(')||fireControl.includes('shouldBotReconsiderWeapon('))fail('fire-control must request reselection, not own weapon-selection policy');
if(!fireControl.includes('bot.weaponSwitchT=0'))fail('rocket safety must retain the bounded reselection request signal');
for(const token of [
  'function botShotClosestApproachToPlayer(','function getBotAimPoint(bot,tp){','function getBotMuzzlePos(bot){',
  'function startBotReload(bot){','function finishBotReload(bot){','function dealBotDamageToCurrentTarget(bot,amount,dir){',
  'function executeBotShot(bot,tp,dist,suppressMemory=false){','spawnEnemyBullet(from,pd,wp,bot','spawnERkt(from,dir',
  'playWeaponShotSound(wp.key','registerPlayerSuppression(bot,wp,approach.point'
]){
  if(!fireControl.includes(token))fail('bot fire-control owner contract missing: '+token);
}
for(const token of ['getAimPoint(tp){','getMuzzlePos(){','startReload(){','finishReload(){','dealDamageToCurrentTarget(amount,dir){','doShoot(tp,dist,suppressMemory=false){','function botShotClosestApproachToPlayer(']){
  if(bots.includes(token))fail('bot fire-control implementation leaked back into bots.js: '+token);
}
for(const token of ['finishBotReload(this)','startBotReload(this)','executeBotShot(this,fireTarget,fireDist,suppressMemory)']){
  if(!bots.includes(token))fail('bot fire-control consumer contract missing: '+token);
}
if(!tactics.includes('getBotMuzzlePos(bot)'))fail('coordinated utility must consume canonical bot muzzle helper');
for(const token of ['bot.aiState=','bot.burstLeft=','bot.burstPauseT=','function maybePlantMine(','function maybePlantBomb(','function refreshBotTeamTactics(','chooseBotWeaponByDistance(']){
  if(fireControl.includes(token))fail('FSM/burst/utility/weapon-selection policy leaked into bot fire-control owner: '+token);
}
for(const token of [
  'function applyBotPostShotCadence(bot){','bot.burstLeft--;',"const attackingPlayer=bot.team==='enemy'&&bot.targetIsPlayer;",
  "const suppressing=bot.tacticalMode==='suppress'&&!bot.weapon.isRocket&&!bot.weapon.isSniper;",
  'bot.burstLeft=base+Math.floor(Math.random()*extra);',
  "const normalPause=((bot.weapon.isSniper?.72:bot.weapon.isRocket?.58:bot.weapon.key==='shotgun'?.34:.16)+Math.random()*(.18+(1-bot.aimSkill)*.22))*(suppressing?.48:1);",
  "bot.burstPauseT=attackingPlayer?(suppressing?.24+Math.random()*.22:.42+Math.random()*.42):normalPause;",
  "bot.sT=Math.max((bot.team==='enemy'&&bot.targetIsPlayer)?0.095:0.055,bot.weapon.rate*bot.fireRateMul*(.96+Math.random()*.24));",
  'if(bot.mag<=0)startBotReload(bot);'
]){if(!fireCadence.includes(token))fail('bot fire-cadence owner contract missing: '+token);}
if(!bots.includes('applyBotPostShotCadence(this);'))fail('bot post-shot fire-cadence consumer contract missing');
for(const token of ['this.burstLeft--;','let base=attackingPlayer','const normalPause=',"this.sT=Math.max((this.team==='enemy'&&this.targetIsPlayer)?0.095:0.055"]){
  if(bots.includes(token))fail('bot post-shot fire-cadence implementation leaked back into bots.js: '+token);
}
for(const token of ['executeBotShot(','tryPlantBotBomb(','tryPlantBotMine(','canPressurePlayer(','bot.aiState=','class Enemy']){
  if(fireCadence.includes(token))fail('fire-gate/shot/deployable/FSM authority leaked into bot fire-cadence owner: '+token);
}
for(const token of [
  'function applyBotStateSelectionPolicy(bot,{',
  "if(bot.pickupTarget&&bot.pickupTarget.m.visible&&hpPct<.48)bot.aiState='resupply';",
  "else if(targetPos&&strategicRetreat&&((hpPct<0.25&&dist<20)||(localThreats>=3&&hpPct<.58)))bot.aiState='retreat';",
  "else if(targetPos&&supportReady&&bot.tacticalMode==='support')bot.aiState='support';",
  "else if(targetPos&&bot.coverPoint&&(!bot.canSeeTarget||bot.role==='anchor'||bot.reloadT>0||(localThreats>=3&&hpPct<.72)||bot.suppressedT>0))bot.aiState='cover';",
  "else if(targetPos&&bot.flankPoint&&bot.flankCommitT>0&&bot.tacticalMode==='flank')bot.aiState='flank';",
  "else if(mapOrderWanted)bot.aiState='objective';",
  "else if(targetPos&&bot.canSeeTarget&&dist<=bot.weapon.range*(bot.team==='ally'?1.14:1.08))bot.aiState='engage';",
  "else if(targetPos&&bot.lastSeenT<8.5)bot.aiState='hunt';",
  "else if(targetPos&&bot.lastSeenT<14.5)bot.aiState='search';",
  "else bot.aiState=mapObjective?'objective':'patrol';",
  'bot.stateCD=.22+Math.random()*.30;'
]){
  if(!statePolicy.includes(token))fail('bot state-policy owner contract missing: '+token);
}
if((statePolicy.match(/Math\.random\(\)/g)||[]).length!==1)fail('bot state-policy must consume exactly one RNG draw per selection');
for(const token of [
  'if(this.stateCD<=0){','applyBotStateSelectionPolicy(this,{',
  'targetPos,hpPct,strategicRetreat,localThreats,supportReady,mapOrderWanted,mapObjective,dist'
]){
  if(!bots.includes(token))fail('bot state-policy consumer seam missing: '+token);
}
for(const token of [
  "if(this.pickupTarget&&this.pickupTarget.m.visible&&hpPct<.48)this.aiState='resupply';",
  "else if(targetPos&&strategicRetreat&&((hpPct<0.25&&dist<20)||(localThreats>=3&&hpPct<.58)))this.aiState='retreat';",
  "else if(mapOrderWanted)this.aiState='objective';",
  "else if(targetPos&&this.lastSeenT<14.5)this.aiState='search';",
  'this.stateCD=.22+Math.random()*.30;'
]){
  if(bots.includes(token))fail('bot state-selection implementation leaked back into bots.js: '+token);
}
for(const token of [
  "case 'objective'", "case 'cover'", "case 'flank'", 'moveBotWithSubsteps(',
  'findBotTacticalCover(', 'findBotFlankPoint(', 'refreshBotTeamTactics(',
  'updateBotTargetPerception(', 'executeBotShot(', 'applyBotPostShotCadence('
]){
  if(statePolicy.includes(token))fail('state execution/perception/tactics/combat authority leaked into bot state-policy owner: '+token);
}
const stateGateStart=bots.indexOf('    this.aiT+=dt;this.stateCD-=dt;');
const stateGateEnd=bots.indexOf('\n\n    let mx=0,mz=0;',stateGateStart);
const stateGate=stateGateStart>=0&&stateGateEnd>stateGateStart?bots.slice(stateGateStart,stateGateEnd):'';
if(!stateGate.includes('if(this.stateCD<=0){')||!stateGate.includes('applyBotStateSelectionPolicy(this,{'))fail('state-policy call must remain behind the stateCD<=0 gate');
if(/Math\.random\s*\(/.test(stateGate))fail('state selection RNG must live only in the canonical state-policy owner');
if(!tactics.includes('BOT_NOISE_EVENTS'))fail('team tactics must consume the canonical perception noise bus');
for(const token of [
  'BOT_MOVE_CFG','clampBotVelocity(','moveBotWithSubsteps(',
  'steerBotAroundWalls(','steerBotAroundSmoke(','this.unstuckT=.48'
]){
  if(!bots.includes(token))fail('Combat AI 2.2 bot locomotion consumer integration missing: '+token);
}
if(bots.includes('this.dodgeSpd=this.speed*(2.35+this.aimSkill*.65)'))fail('legacy teleport-like dodge multiplier returned');
if(bots.includes('this.stuckT=0;this.strafeDir*=-1;this.sideBias*=-1;this.triggerDodge()'))fail('stuck recovery must not trigger high-speed dodge');
for(const token of ['function botAssaultWaveState','waveStart:-999']){
  if(!tactics.includes(token))fail('Combat Presence 1.2 assault-wave owner missing: '+token);
}
for(const token of ['playWeaponShotSound(wp.key','function botShotClosestApproachToPlayer','registerPlayerSuppression(bot,wp,approach.point',"playWeaponMechanicSound('reload'"]){
  if(!fireControl.includes(token))fail('Combat Presence 1.2 fire-control integration missing: '+token);
}
for(const token of ['assaultWaveState===\'staging\'','coverChainT','footstepDistance','playFootstepSound(this.group.position','frontlineContested','objectiveUrgency','strategicRetreat']){
  if(!bots.includes(token))fail('Combat Presence 1.2 / Frontline bot integration missing: '+token);
}
for(const token of ['breachReady:false','smokeWaveId:-1','smokeDecisionWaveId:-1','smokeDecisionUse:false','smokeReadyAt:-999','Math.random()<.30','plan.smokeReadyAt=now+14000+Math.random()*8000','fragWaveId:-1','function maybeCoordinateBotUtility','spawnBotSmokeGrenade(getBotMuzzlePos(bot)','spawnBotFragGrenade(getBotMuzzlePos(bot)']){
  if(!tactics.includes(token))fail('Combat Presence 1.3 coordinated utility owner missing: '+token);
}
if(!fireControl.includes('spawnEnemyBullet(from,pd,wp,bot'))fail('Combat Presence 1.3 bot ballistic execution missing');
for(const token of ["this.tacticalMode=squadPlan.suppressor===this","breachRole?'breach'",'this.peekPoint=null;this.peekT=0','let coverGoal=this.coverPoint']){
  if(!bots.includes(token))fail('Combat Presence 1.3 bot integration missing: '+token);
}
for(const token of ['const insigniaMat=','const addInsignia=','addInsignia(.281,Math.PI)','addInsignia(-.219,0)']){
  if(!presentation.includes(token))fail('procedural bot insignia missing from presentation owner: '+token);
}
if(presentation.includes('makeAssetPlane(')||bots.includes('makeAssetPlane('))fail('bot scene must not depend on SVG texture planes');
if(bots.includes('this.wEl')||bots.includes('updateBadge()')||bots.includes("ally?'СВОЙ':'ВРАГ'")){
  fail('bot overhead text badges must stay removed; only health bars are allowed above bots');
}
for(const token of ["this.hEl=document.createElement('div')","this.hFill=document.createElement('div')","this.hEl.style.display=this.uiVis?'block':'none'","this.hFill.style.width=(this.hp/this.maxHp*100)+'%'"]){
  if(!bots.includes(token))fail('bot overhead health bar missing: '+token);
}
for(const token of ['suppressorSince:-999','suppressorGeneration:0','const suppressorEligible=','priorSuppressor']){
  if(!tactics.includes(token))fail('Combat Presence 1.4 suppressor coordination owner missing: '+token);
}
for(const token of ['cachedGrenadeThreat','updateBotGrenadeThreat(this,dt)','suppressMemory=this.tacticalMode===\'suppress\'','executeBotShot(this,fireTarget,fireDist,suppressMemory)','this.peekDuration=.92','const peekEnvelope=','targetPeekLean']){
  if(!bots.includes(token))fail('Combat Presence 1.4 bot awareness integration missing: '+token);
}
if(!perception.includes('function nearestHostileGrenade'))fail('Combat Presence 1.4 grenade awareness owner missing');
if(!fireControl.includes('if(wp.hitscan){')||!fireControl.includes('spawnInstantSniperTrace(from,tracerDir'))fail('bot sniper must remain hitscan while normal guns use travelling bullets');
if(bots.includes("Math.random()<(suppressing?.56:.34)")||fireControl.includes("Math.random()<(suppressing?.56:.34)"))fail('legacy random player near-miss whiz returned');
for(const token of [
  'let allyControlScore=0,enemyControlScore=0;',
  'const FRONTLINE_CFG=',
  'const frontlineObjective=',
  'const frontlineZoneOwners=',
  'function frontlineZone()',
  'function serializeFrontlineObjective()',
  'function resetFrontlineObjective(',
  'function restoreFrontlineObjective(',
  'function ensureFrontlineMarker()',
  'function updateFrontlineHUD(',
  'function captureFrontline(',
  'function rotateFrontlineObjective()',
  'function tickFrontlineObjective(',
  'zoneOwners:{...frontlineZoneOwners}',
  'frontlineZoneOwners[zone.id]=team',
  'playObjectiveCaptureSound(team)',
  'frontline-map-hint'
]){
  if(!frontline.includes(token))fail('Frontline objective owner missing: '+token);
}
for(const token of [
  'let allyControlScore=0,enemyControlScore=0;',
  'const FRONTLINE_CFG=',
  'const frontlineObjective=',
  'const frontlineZoneOwners=',
  'function serializeFrontlineObjective()',
  'function restoreFrontlineObjective(',
  'function ensureFrontlineMarker()',
  'function captureFrontline(',
  'function tickFrontlineObjective('
]){
  if(bots.includes(token))fail('Frontline objective owner leaked back into bots.js: '+token);
}
for(const token of ['const activeFrontline=frontlineZone();','frontlineContested','objectiveUrgency','allyControlScore*FRONTLINE_CFG.capturePoints']){
  if(!bots.includes(token))fail('Frontline bot consumer contract missing: '+token);
}
if(!tactics.includes('const frontlineBias=s=>'))fail('Frontline map bias must stay owned by tactics');
const engine=readFileSync('src/core/engine.js','utf8');
for(const file of presentationRasterAssets)if(engine.includes(file))fail('generated raster presentation asset must stay out of WebGL engine scene: '+file);
for(const token of ['function spawnCombatImpact','function tickCombatImpactFx','function spawnHeadshotFx','function spawnExplosionFx','BALLISTIC_MATERIAL_PROFILES','function mapImpactMaterial','function mapBallisticProfile','function mapPenetrationInfo',"impactMaterial='concrete'","wall.userData.impactMaterial='metal'","body.userData.impactMaterial='wood'",'const minimapStaticGeometry=[]','minimapDescriptor','function createArenaCover','ARENA_COVER_LAYOUT','coverType','coverPalette','const palettes=','const accentColor=','const bolt=new THREE.MeshStandardMaterial','function createProceduralHazardPanel','screenMat','glyphMat','IMPACT_MARK_MAX=56','impactMarkPool','function wallImpact(pos,col,material=\'concrete\',normal=null)',"typeof syncWorldWeaponPickupArt==='function'"]){
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

const session=readFileSync('src/game/session.js','utf8');
const runtime=readFileSync('src/game/runtime.js','utf8');
for(const token of [
  'let lastT=0;',
  'function tryFullscreen()','function setGameCursorHidden(','function clearPointerLockRequest()',
  'function showPauseUI()','function requestGamePointerLock()','function resumeGameFromPause()','function startOrResumeGame()',
  "G('startBtn').addEventListener('click',startOrResumeGame)","document.addEventListener('pointerlockchange'",
  "document.addEventListener('pointerlockerror'","document.addEventListener('visibilitychange'",
  "window.addEventListener('pagehide'","window.addEventListener('beforeunload'",'let escapeResumePending=false'
]){if(!session.includes(token))fail('session lifecycle owner missing: '+token);}
for(const token of ['function tryFullscreen()','function setGameCursorHidden(','function clearPointerLockRequest()','function showPauseUI()','function requestGamePointerLock()','function resumeGameFromPause()','function startOrResumeGame()']){
  if(state.includes(token))fail('session lifecycle owner leaked back into player state: '+token);
}
for(const token of ["document.addEventListener('pointerlockchange'","document.addEventListener('pointerlockerror'","document.addEventListener('visibilitychange'","G('startBtn').addEventListener",'let escapeResumePending=false']){
  if(runtime.includes(token))fail('runtime must not own session lifecycle wiring: '+token);
}
if(!(html.indexOf("'src/progression/progression.js'")<html.indexOf("'src/game/session.js'")&&html.indexOf("'src/game/session.js'")<html.indexOf("'src/game/runtime.js'"))){
  fail('session.js must load after progression and before runtime');
}

if(!runtime.includes('botRoleLabel(e.role)'))fail('ally panel tactical role label missing');
for(const token of ["botDoctrineLabel(plan.doctrine)","plan.zone?.label","ПРИКАЗ:"]){
  if(!runtime.includes(token))fail('ally map-order HUD missing: '+token);
}
if(!runtime.includes('tickCombatImpactFx(dt)'))fail('combat impact runtime tick missing');
if(!runtime.includes('tickFrontlineObjective(dt,ts)'))fail('Frontline objective runtime tick missing');
if(!runtime.includes('syncWorldWeaponPickupArt();'))fail('DOM-projected weapon/medkit pickup sync missing');
for(const token of ["scopeFallback","imageAssetWithFallback(scopeImg,wantedAsset,fallbackAsset)"])if(!runtime.includes(token))fail('generated scope fallback lifecycle missing: '+token);
if(!runtime.includes('tickTacticalMinimap(dt,ts)'))fail('real tactical minimap runtime tick missing');
if(!runtime.includes('tickPlayerFootsteps(playerMoved,sprintingNow,onGnd)'))fail('distance-driven player footsteps missing');
if(!runtime.includes('tickGamePresentation('))fail('settings presentation runtime tick missing');
if(!runtime.includes('syncGeneratedFirstPersonWeaponArt(gunGrp.visible)'))fail('generated player-held weapon runtime pose sync missing');
for(const token of ['recoil*=Math.pow(.82,dt*60)','recoilVis=FP_RECOIL_VISUAL','recoil*recoilVis.push','recoil*recoilVis.pitch','beamT/FP_MUZZLE_FLASH_SECONDS'])if(!runtime.includes(token))fail('weapon visual recoil/muzzle lifecycle missing: '+token);
if(!weapons.includes('if(!running){wrap.classList.remove(\'shown\')')||!weapons.includes('fpGeneratedWeaponPending={key:w.key,model,asset}'))fail('generated player-held weapon must lazy-load only after match start');
for(const token of ['idleRenderAt=0','const menuIdle=!running','ts-idleRenderAt>=180','ts-idleRenderAt>=85']){
  if(!runtime.includes(token))fail('menu/Firefox idle render throttling missing: '+token);
}
if(!runtime.includes('activeW.scopeAsset||GAME_ASSETS.ui.sniperScope'))fail('per-weapon scope asset switching missing');
if(runtime.includes('setWeaponAmmo(SMOKE_WEAPON_INDEX,1)'))fail('smoke cooldown must not generate free ammo');
if(!runtime.includes('ensureCurrentWeaponUsable();'))fail('runtime must auto-switch away from depleted current weapon');
for(const token of ["fireW.automatic","scopedWeapon=activeW.aimMode==='scope'","adsWanted=!IS_TOUCH&&scopedWeapon&&zooming","scopeActive||scopedWeapon","recoilReturn=activeW.recoilReturn","weaponBloom=Math.max","shotResetT>0","weaponEquipT>0","sprintExitT>0","const sprintingNow=wantsSprint","cycleKind==='pump'","cycleKind==='bolt'","completePlayerReloadStep()","updateWeaponStateHUD()","ejectCasing(casingPos"]){if(!runtime.includes(token))fail('runtime weapon lifecycle missing: '+token);}

const css=readFileSync('src/styles/game.css','utf8');
for(const token of ['#combat-medal','#status-icons','#armor-break-fx','combatMedalPop','#hitmarker','#damage-direction','#threat-direction','#settings-modal','#sniper-scope','sniperScopeKick','.xh-arm','#wstate','#frontline-map','#frontline-minimap','#left-tactical-stack','#frontline-objective','#frontline-track','#frontline-bearing','#frontline-capture-burst','#battle-result-frame','#world-pickup-art-layer','.world-weapon-pickup-art','.world-health-pickup-art','#fp-weapon-art-wrap','#fp-weapon-art-wrap.on.shown','#fp-weapon-art-stage','#fp-weapon-flash','#fp-weapon-flash::before','#fp-weapon-flash::after','--fp-flash-pop','max-width:980px','#hud{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:14px;z-index:24','#hp-wrap{position:absolute;bottom:90px;left:50%;transform:translateX(-50%);text-align:center;z-index:24','#menu .btn','one authoritative gameplay reticle']){
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
for(const token of ['generated-art-enabled','zap-zone-logo-01.png','menu-bg-arena-01.jpg','loading-bg-arena-01.jpg','localGeneratedAssetsReady']){
  if(!menuSmoke.includes(token))fail('local file generated-asset parity smoke missing: '+token);
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

for(const token of ["generatedSniperScope:'assets/ui/scopes/sniper-scope-tech-01.webp'","generatedRifleScope:'assets/ui/scopes/rifle-scope-tech-01.webp'","ammoCrate:'assets/ui/pickups/ammo-crate-tech-02.webp'","medkitPickup:'assets/ui/pickups/world-medkit-pickup-01.webp'","frontlineCaptureBurst:'assets/ui/objective/frontline-capture-burst-tech-01.webp'","battleResultFrame:'assets/ui/feedback/battle-result-frame-tech-01.webp'"]){if(!catalog.includes(token))fail('generated asset pack 4 catalog mapping missing: '+token);}
if(!weapons.includes("scopeFallback:'assets/ui/sniper-scope.svg'"))fail('sniper generated scope must retain SVG fallback');
if(!pickups.includes("bomb:{maxPx:112"))fail('generated bomb world pickup tuning missing');
