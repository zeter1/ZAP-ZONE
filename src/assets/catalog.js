'use strict';

function G(id){return document.getElementById(id);}
const GAME_LOCAL_FILE_MODE=location.protocol==='file:';
const GAME_HOSTED_HTTP_MODE=/^https?:$/.test(location.protocol);
const GAME_PRESENTATION_ASSETS_ENABLED=GAME_HOSTED_HTTP_MODE||GAME_LOCAL_FILE_MODE;
const GAME_BUILD_ID=typeof window.ZAP_BUILD_ID==='string'?window.ZAP_BUILD_ID:'';
const GAME_BUILD_ID_PATTERN=/^[0-9a-f]{16}$/;

function gameAssetUrl(path){
  if(typeof path!=='string'||(!GAME_HOSTED_HTTP_MODE&&!GAME_LOCAL_FILE_MODE))return path;
  const clean=path.replace(/([?&])v=[0-9a-f]{16}(?=(&|$))/g,'$1').replace(/[?&]$/,'');
  const resolved=new URL(clean,document.baseURI);
  if(GAME_HOSTED_HTTP_MODE&&GAME_BUILD_ID_PATTERN.test(GAME_BUILD_ID))resolved.searchParams.set('v',GAME_BUILD_ID);
  return resolved.href;
}
function versionAssetTree(value){
  if(typeof value==='string')return gameAssetUrl(value);
  if(!value||typeof value!=='object')return value;
  const out={};
  for(const [key,child] of Object.entries(value))out[key]=versionAssetTree(child);
  return Object.freeze(out);
}
function versionDomAssetUrls(){
  if(!GAME_HOSTED_HTTP_MODE||!GAME_BUILD_ID_PATTERN.test(GAME_BUILD_ID))return;
  document.querySelectorAll('img[src^="assets/"]').forEach(img=>{
    img.src=gameAssetUrl(img.getAttribute('src')||'');
    if(img.dataset.generatedSrc)img.dataset.generatedSrc=gameAssetUrl(img.dataset.generatedSrc);
    if(img.dataset.fallbackSrc)img.dataset.fallbackSrc=gameAssetUrl(img.dataset.fallbackSrc);
  });
}
function activateGeneratedDomAssets(){
  document.querySelectorAll('img[data-generated-src]').forEach(img=>{
    const generated=img.dataset.generatedSrc||'';
    const fallback=img.dataset.fallbackSrc||img.getAttribute('src')||'';
    if(generated&&fallback)imageAssetWithFallback(img,generated,fallback);
  });
}

// Generated DOM/CSS presentation art must work both on uCoz/static HTTP(S) hosting
// and when index.html is opened directly from disk. Only HTTP(S) gets cache-busting
// query parameters; file:// keeps plain relative paths and the same generated art.
if(GAME_PRESENTATION_ASSETS_ENABLED){
  if(GAME_HOSTED_HTTP_MODE)versionDomAssetUrls();
  document.documentElement.classList.add('generated-art-enabled');
  activateGeneratedDomAssets();
}

// Centralized visual asset catalog. Paths are root-relative to the game URL.
const GAME_ASSETS=versionAssetTree({
  pickups:Object.freeze({
    ammo:'assets/pickups/ammo.svg',
    medkit:'assets/pickups/medkit.svg'
  }),
  environment:Object.freeze({
    crate:'assets/environment/crate.svg',
    hazard:'assets/environment/hazard.svg',
    terminal:'assets/environment/terminal.svg',
    foliage:'assets/environment/foliage.svg',
    water:'assets/environment/water.svg'
  }),
  characters:Object.freeze({
    ally:'assets/characters/ally-emblem.svg',
    enemy:'assets/characters/enemy-emblem.svg',
    allyMark:'assets/characters/ally-armor-mark.svg',
    enemyMark:'assets/characters/enemy-armor-mark.svg'
  }),
  perks:Object.freeze({
    assault:'assets/perks/assault.svg',
    precision:'assets/perks/precision.svg',
    survival:'assets/perks/survival.svg',
    mobility:'assets/perks/mobility.svg',
    demolition:'assets/perks/demolition.svg'
  }),
  perkGeneratedIcons:Object.freeze({
    'damage':'assets/ui/perks/icons-v2/damage.webp',
    'overclock':'assets/ui/perks/icons-v2/overclock.webp',
    'magazine':'assets/ui/perks/icons-v2/magazine.webp',
    'reload':'assets/ui/perks/icons-v2/reload.webp',
    'doubletap':'assets/ui/perks/icons-v2/doubletap.webp',
    'bulletstorm':'assets/ui/perks/icons-v2/bulletstorm.webp',
    'crit':'assets/ui/perks/icons-v2/crit.webp',
    'critpower':'assets/ui/perks/icons-v2/critpower.webp',
    'headshot':'assets/ui/perks/icons-v2/headshot.webp',
    'executioner':'assets/ui/perks/icons-v2/executioner.webp',
    'piercing':'assets/ui/perks/icons-v2/piercing.webp',
    'predator':'assets/ui/perks/icons-v2/predator.webp',
    'vitality':'assets/ui/perks/icons-v2/vitality.webp',
    'armor':'assets/ui/perks/icons-v2/armor.webp',
    'nanorepair':'assets/ui/perks/icons-v2/nanorepair.webp',
    'armorregen':'assets/ui/perks/icons-v2/armorregen.webp',
    'lifesteal':'assets/ui/perks/icons-v2/lifesteal.webp',
    'hunter':'assets/ui/perks/icons-v2/hunter.webp',
    'blastshield':'assets/ui/perks/icons-v2/blastshield.webp',
    'secondwind':'assets/ui/perks/icons-v2/secondwind.webp',
    'immortal':'assets/ui/perks/icons-v2/immortal.webp',
    'mobility':'assets/ui/perks/icons-v2/mobility.webp',
    'laststand':'assets/ui/perks/icons-v2/laststand.webp',
    'reflex':'assets/ui/perks/icons-v2/reflex.webp',
    'thorns':'assets/ui/perks/icons-v2/thorns.webp',
    'explosive_payload':'assets/ui/perks/icons-v2/explosive_payload.webp',
    'rockettech':'assets/ui/perks/icons-v2/rockettech.webp',
    'minetech':'assets/ui/perks/icons-v2/minetech.webp',
    'bombtech':'assets/ui/perks/icons-v2/bombtech.webp',
    'explosive_rounds':'assets/ui/perks/icons-v2/explosive_rounds.webp',
    'warmachine':'assets/ui/perks/icons-v2/warmachine.webp',
    'ammo_saver':'assets/ui/perks/icons-v2/ammo_saver.webp',
    'close_quarters':'assets/ui/perks/icons-v2/close_quarters.webp',
    'full_charge':'assets/ui/perks/icons-v2/full_charge.webp',
    'steady_grip':'assets/ui/perks/icons-v2/steady_grip.webp',
    'longshot':'assets/ui/perks/icons-v2/longshot.webp',
    'crit_repair':'assets/ui/perks/icons-v2/crit_repair.webp',
    'headshot_armor':'assets/ui/perks/icons-v2/headshot_armor.webp',
    'ballistic_lining':'assets/ui/perks/icons-v2/ballistic_lining.webp',
    'field_medic':'assets/ui/perks/icons-v2/field_medic.webp',
    'surplus_armor':'assets/ui/perks/icons-v2/surplus_armor.webp',
    'smoke_guard':'assets/ui/perks/icons-v2/smoke_guard.webp',
    'sprint_drive':'assets/ui/perks/icons-v2/sprint_drive.webp',
    'jump_servos':'assets/ui/perks/icons-v2/jump_servos.webp',
    'combat_momentum':'assets/ui/perks/icons-v2/combat_momentum.webp',
    'evasive_matrix':'assets/ui/perks/icons-v2/evasive_matrix.webp',
    'smoke_radius':'assets/ui/perks/icons-v2/smoke_radius.webp',
    'smoke_duration':'assets/ui/perks/icons-v2/smoke_duration.webp',
    'smoke_reload':'assets/ui/perks/icons-v2/smoke_reload.webp',
    'short_fuse':'assets/ui/perks/icons-v2/short_fuse.webp',
    'rocket_radius':'assets/ui/perks/icons-v2/rocket_radius.webp',
    'mine_radius':'assets/ui/perks/icons-v2/mine_radius.webp',
  }),
  perkIcons:Object.freeze({
    'damage':'assets/perks/damage.svg',
    'overclock':'assets/perks/overclock.svg',
    'magazine':'assets/perks/magazine.svg',
    'reload':'assets/perks/reload.svg',
    'doubletap':'assets/perks/doubletap.svg',
    'bulletstorm':'assets/perks/bulletstorm.svg',
    'crit':'assets/perks/crit.svg',
    'critpower':'assets/perks/critpower.svg',
    'headshot':'assets/perks/headshot.svg',
    'executioner':'assets/perks/executioner.svg',
    'piercing':'assets/perks/piercing.svg',
    'predator':'assets/perks/predator.svg',
    'vitality':'assets/perks/vitality.svg',
    'armor':'assets/perks/armor.svg',
    'nanorepair':'assets/perks/nanorepair.svg',
    'armorregen':'assets/perks/armorregen.svg',
    'lifesteal':'assets/perks/lifesteal.svg',
    'hunter':'assets/perks/hunter.svg',
    'blastshield':'assets/perks/blastshield.svg',
    'secondwind':'assets/perks/secondwind.svg',
    'immortal':'assets/perks/immortal.svg',
    'mobility':'assets/perks/mobility.svg',
    'laststand':'assets/perks/laststand.svg',
    'reflex':'assets/perks/reflex.svg',
    'thorns':'assets/perks/thorns.svg',
    'explosive_payload':'assets/perks/explosive_payload.svg',
    'rockettech':'assets/perks/rockettech.svg',
    'minetech':'assets/perks/minetech.svg',
    'bombtech':'assets/perks/bombtech.svg',
    'explosive_rounds':'assets/perks/explosive_rounds.svg',
    'warmachine':'assets/perks/warmachine.svg',
    'ammo_saver':'assets/perks/ammo_saver.svg',
    'close_quarters':'assets/perks/close_quarters.svg',
    'full_charge':'assets/perks/full_charge.svg',
    'steady_grip':'assets/perks/steady_grip.svg',
    'longshot':'assets/perks/longshot.svg',
    'crit_repair':'assets/perks/crit_repair.svg',
    'headshot_armor':'assets/perks/headshot_armor.svg',
    'ballistic_lining':'assets/perks/ballistic_lining.svg',
    'field_medic':'assets/perks/field_medic.svg',
    'surplus_armor':'assets/perks/surplus_armor.svg',
    'smoke_guard':'assets/perks/smoke_guard.svg',
    'sprint_drive':'assets/perks/sprint_drive.svg',
    'jump_servos':'assets/perks/jump_servos.svg',
    'combat_momentum':'assets/perks/combat_momentum.svg',
    'evasive_matrix':'assets/perks/evasive_matrix.svg',
    'smoke_radius':'assets/perks/smoke_radius.svg',
    'smoke_duration':'assets/perks/smoke_duration.svg',
    'smoke_reload':'assets/perks/smoke_reload.svg',
    'short_fuse':'assets/perks/short_fuse.svg',
    'rocket_radius':'assets/perks/rocket_radius.svg',
    'mine_radius':'assets/perks/mine_radius.svg'
  }),
  medals:Object.freeze({
    'first-blood':'assets/medals/first-blood.svg',
    'double-kill':'assets/medals/double-kill.svg',
    'triple-kill':'assets/medals/triple-kill.svg',
    'multikill':'assets/medals/multikill.svg',
    'killing-spree':'assets/medals/killing-spree.svg',
    'longshot':'assets/medals/longshot.svg',
    'critical-kill':'assets/medals/critical-kill.svg',
    'explosive-kill':'assets/medals/explosive-kill.svg'
  }),
  // Generated combat medals are presentation-only DOM images. SVG medal/fx assets
  // above remain the fallback path for decode/load failures in either runtime mode.
  presentationMedals:Object.freeze({
    'first-blood':'assets/ui/medals/first-blood-tech-01.png',
    'double-kill':'assets/ui/medals/double-kill-tech-01.png',
    'triple-kill':'assets/ui/medals/triple-kill-tech-01.png',
    'multikill':'assets/ui/medals/multikill-tech-02.webp',
    'killing-spree':'assets/ui/medals/killing-spree-tech-01.png',
    'longshot':'assets/ui/medals/longshot-tech-01.png',
    'critical-kill':'assets/ui/medals/critical-kill-tech-01.png',
    'explosive-kill':'assets/ui/medals/explosive-kill-tech-01.png',
    'headshot':'assets/ui/medals/headshot-tech-01.png'
  }),
  status:Object.freeze({
    secondWind:'assets/status/second-wind.svg',
    lifesteal:'assets/status/lifesteal.svg',
    armorRegen:'assets/status/armor-regen.svg',
    lowHealth:'assets/status/low-health.svg',
    smokeGuard:'assets/status/smoke-guard.svg',
    critReady:'assets/status/crit-ready.svg'
  }),
  // Generated status icons are DOM-only presentation with the SVG status set above
  // as the authoritative load/decode fallback in both HTTP(S) and file:// runtimes.
  presentationStatus:Object.freeze({
    secondWind:'assets/ui/status/second-wind-tech-01.webp',
    lifesteal:'assets/ui/status/lifesteal-tech-01.webp',
    armorRegen:'assets/ui/status/armor-regen-tech-01.webp',
    lowHealth:'assets/ui/status/low-health-tech-01.webp',
    smokeGuard:'assets/ui/status/smoke-guard-tech-01.webp',
    critReady:'assets/ui/status/crit-ready-tech-01.webp'
  }),
  impact:Object.freeze({
    bullet:'assets/fx/bullet-hit.svg',
    wall:'assets/fx/wall-impact.svg',
    plasma:'assets/fx/plasma-impact.svg',
    sniper:'assets/fx/sniper-shot.svg',
    rocket:'assets/fx/rocket-impact.svg',
    critical:'assets/fx/critical-hit.svg',
    armorBreak:'assets/fx/armor-break.svg'
  }),
  fx:Object.freeze({
    headshot:'assets/fx/headshot.svg',
    headshotKill:'assets/fx/headshot-kill.svg',
    explosion:'assets/fx/explosion.svg',
    levelup:'assets/fx/levelup.svg',
    skull:'assets/fx/skull.svg'
  }),
  // Generated combat textures are presentation-only DOM/CSS layers. They never
  // become persistent WebGL planes/sprites; procedural HUD/world feedback remains fallback.
  presentationCombat:Object.freeze({
    lowHealth:'assets/ui/overlays/low-health-vignette-01.webp',
    damageDirection:'assets/ui/overlays/damage-direction-01.webp',
    smoke:'assets/ui/overlays/smoke-inside-dense-42.webp',
    ballisticMuzzle:'assets/ui/fx/ballistic-muzzle-flash-sheet-01.webp',
    plasmaMuzzle:'assets/ui/fx/plasma-discharge-sheet-01.webp',
    explosionShockwave:'assets/ui/overlays/explosion-shockwave-01.webp',
    suppression:'assets/ui/overlays/suppression-vignette-01.webp',
    armorHit:'assets/ui/overlays/armor-hit-field-01.webp',
    sprint:'assets/ui/overlays/sprint-speed-lines-01.webp',
    respawn:'assets/ui/overlays/respawn-materialize-01.webp'
  }),
  // Generated Asset Pack 10 — ten logical one-shot combat animations packed into
  // one uniform alpha-WebP atlas. Playback remains DOM-only and frame-time driven.
  presentationVfx:Object.freeze({
    combatAtlas:'assets/ui/fx/combat-vfx-atlas-10.webp',
    rocketExplosion:'assets/ui/fx/rocket-explosion-fireball-atlas-11.svg',
    plasmaImpact:'assets/ui/fx/plasma-impact-ion-bloom-atlas-11.svg',
    plasmaReload:'assets/ui/fx/plasma-reload-energy-lock-atlas-11.svg',
    pack12:'assets/ui/fx/combat-vfx-atlas-12.svg',
    pack15Frag:'assets/ui/fx/frag-grenade-shrapnel-bloom-atlas-15.svg',
    pack15Death:'assets/ui/fx/player-death-signal-collapse-atlas-15.svg',
    pack18:'assets/ui/fx/player-action-vfx-atlas-18.svg',
    pack42SmokeReady:'assets/ui/weapons/fp/player-smoke-fps-42.webp',
    pack42SmokeThrow:'assets/ui/fx/smoke-throw-atlas-42.webp',
    pack42SmokeReload:'assets/ui/fx/smoke-reload-atlas-42.webp',
    pack42SmokeWorld:'assets/ui/fx/smoke-world-atlas-42.webp',
    pack42SmokeCloud:'assets/ui/fx/smoke-cloud-atlas-42.webp',
    pack42SmokeNear:'assets/ui/fx/smoke-near-atlas-42.webp',
    pack42SmokeFar:'assets/ui/fx/smoke-far-atlas-42.webp',
    pack42SmokeWisps:'assets/ui/fx/smoke-wisps-atlas-42.webp',
    pack42SmokeInsideDense:'assets/ui/overlays/smoke-inside-dense-42.webp',
    pack42SmokeInsideEdge:'assets/ui/overlays/smoke-inside-edge-42.webp',
    pack20GrenadeThrow:'assets/ui/fx/frag-grenade-throw-vfx-atlas-20.svg',
    pack41BombReady:'assets/ui/weapons/fp/player-bomb-ready-41.webp',
    pack41BombPlant:'assets/ui/fx/bomb-plant-atlas-41.webp',
    pack41BombExplosion:'assets/ui/fx/bomb-explosion-sequence-41.webp',
    pack41BombWorldTop:'assets/ui/weapons/bomb-world-top-41.webp',
    pack41BombSmoke:'assets/ui/fx/bomb-smoke-41.webp',
    pack41BombSmokeSequence:'assets/ui/fx/bomb-smoke-sequence-41.webp',
    pack41BombShockwave:'assets/ui/fx/bomb-shockwave-atlas-41.webp',
    pack21GrenadeMotion:'assets/ui/fx/frag-grenade-flight-fuse-atlas-21.svg',
    pack34GrenadeWorld:'assets/ui/equipment/grenade-world-states-atlas-34.webp',
    pack34GrenadeThrow:'assets/ui/fx/player-grenade-throw-atlas-34.webp',
    pack34GrenadeBlast:'assets/ui/fx/grenade-explosion-atlas-34.webp',
    pack34GrenadeSmoke:'assets/ui/fx/grenade-smoke-atlas-34.webp',
    pack34GrenadeDebris:'assets/ui/fx/grenade-debris-atlas-34.webp',
    pack34GrenadeScorch:'assets/ui/fx/grenade-scorch-atlas-34.webp',
    pack21GrenadeBlast:'assets/ui/fx/frag-grenade-explosion-smoke-atlas-21.svg',
    pack21GrenadeDebris:'assets/ui/fx/frag-grenade-debris-scorch-atlas-21.svg',
    pack22RifleReload:'assets/ui/fx/rifle-reload-vfx-atlas-22.webp',
    pack22SniperBolt:'assets/ui/fx/sniper-bolt-cycle-vfx-atlas-22.webp',
    pack23SniperShot:'assets/ui/fx/sniper-shot-vfx-atlas-23.webp',
    pack23SniperBallistics:'assets/ui/fx/sniper-ballistics-vfx-atlas-23.webp',
    pack23SniperCasing:'assets/ui/fx/sniper-casing-vfx-atlas-23.webp',
    pack24RocketReload:'assets/ui/fx/rocket-reload-vfx-atlas-24.webp',
    pack39MineReady:'assets/ui/weapons/fp/player-mine-ready-39.webp',
    pack39MineThrow:'assets/ui/fx/player-mine-throw-atlas-39.webp',
    pack39MineReload:'assets/ui/fx/player-mine-reload-atlas-39.webp',
    pack39MineWorld:'assets/ui/fx/mine-world-states-atlas-39.webp',
    pack39MineExplosion:'assets/ui/fx/mine-explosion-atlas-39.webp',
    pack39MineSmoke:'assets/ui/fx/mine-smoke-atlas-39.webp',
    pack39MineUtility:'assets/ui/fx/mine-utility-atlas-39.webp',
    pack39MineIcon:'assets/ui/weapons/mine-weapon-icon-39.webp',
    pack24MineThrow:'assets/ui/fx/mine-throw-vfx-atlas-24.webp',
    pack25PistolReload:'assets/ui/fx/pistol-reload-vfx-atlas-25.webp',
    pack40PistolReady:'assets/ui/weapons/fp/player-pistol-fps-40.webp',
    pack40PistolReload:'assets/ui/fx/pistol-reload-atlas-40.webp',
    pack40PistolEffects:'assets/ui/fx/pistol-effects-atlas-40.webp',
    pack40PistolIcon:'assets/ui/weapons/pistol-icon-40.webp',
    pack25ShotgunPump:'assets/ui/fx/shotgun-pump-cycle-vfx-atlas-25.webp',
    pack26Discharge:'assets/ui/fx/weapon-discharge-vfx-atlas-26.webp',
    pack27TerminalArc:'assets/ui/fx/terminal-electrical-arc-vfx-atlas-27.svg',
    pack28RocketFlight:'assets/ui/fx/rocket-flight-exhaust-vfx-atlas-28.svg',
    pack29SurfaceImpact:'assets/ui/fx/surface-impact-vfx-atlas-29.webp',
    pack45SurfaceImpact:'assets/ui/fx/surface-impact-atlas-45.webp',
    pack30PlasmaFlight:'assets/ui/fx/plasma-flight-ion-sheath-vfx-atlas-30.webp',
    pack32SniperAction:'assets/ui/fx/sniper-action-vfx-atlas-32.webp',
    pack32SniperEffects:'assets/ui/fx/sniper-effects-vfx-atlas-32.webp',
    pack33PlasmaReload:'assets/ui/fx/plasma-core-reload-vfx-atlas-33.webp',
    pack35RocketReady:'assets/ui/weapons/fp/player-rocket-fps-35.webp',
    pack37ShotgunReady:'assets/ui/weapons/fp/player-shotgun-fps-38.webp',
    pack37ShotgunAction:'assets/ui/fx/shotgun-action-atlas-38.webp',
    pack37ShotgunEffects:'assets/ui/fx/shotgun-effects-atlas-38.webp',
    pack36RifleReload:'assets/ui/fx/rifle-reload-vfx-atlas-36.webp',
    pack36RifleReady:'assets/ui/weapons/fp/player-rifle-fps-36.webp',
    pack36RifleEffects:'assets/ui/fx/rifle-effects-vfx-atlas-36.webp',
    pack35RocketReload:'assets/ui/fx/rocket-reload-vfx-atlas-35.webp',
    pack35RocketEffects:'assets/ui/fx/rocket-effects-vfx-atlas-35.webp',
    pack35RocketScorch:'assets/ui/fx/rocket-scorch-35.webp',
    pack35RocketWall:'assets/ui/fx/rocket-wall-impact-35.webp',
    pack33PlasmaReady:'assets/ui/weapons/fp/player-plasma-fps-33.webp',
    pack31PlasmaReload:'assets/ui/fx/plasma-core-reload-vfx-atlas-31.webp'
  }),
  // Generated tactical HUD atlases are DOM/CSS presentation only. Procedural/SVG UI
  // remains the runtime fallback; no persistent Three.js raster planes are created.
  // Pack43: generated-reference metal shells; DOM decoration with text/shape fallback.
  presentationHudShells:Object.freeze({
    "xp": "assets/ui/hud/xp-shell-tech-43.svg",
    "teamBlue": "assets/ui/hud/team-blue-shell-tech-43.svg",
    "teamRed": "assets/ui/hud/team-red-shell-tech-43.svg",
    "map": "assets/ui/hud/map-shell-tech-43.svg",
    "stats": "assets/ui/hud/stats-shell-tech-43.svg",
    "health": "assets/ui/hud/health-shell-tech-43.svg",
    "ammo": "assets/ui/hud/ammo-shell-tech-43.svg",
    "score": "assets/ui/hud/score-shell-tech-43.svg",
    "squad": "assets/ui/hud/squad-shell-tech-43.svg",
    "order": "assets/ui/hud/order-shell-tech-43.svg"
}),
  presentationHud:Object.freeze({
    hitmarkers:'assets/ui/combat/hitmarker-sheet-01.webp',
    botRoles:'assets/ui/bots/bot-role-badges-01.webp',
    botDoctrines:'assets/ui/bots/tactical-doctrine-badges-01.webp',
    killFeed:'assets/ui/killfeed/killfeed-weapon-icons-01.webp',
    threats:'assets/ui/threat/threat-warning-icons-01.webp',
    frontlineContested:'assets/ui/objective/frontline-contested-alert-01.webp',
    ammoWarning:'assets/ui/weapons/low-ammo-warning-01.webp',
    reloadStates:'assets/ui/weapons/reload-state-sheet-01.webp',
    perkRarityFrames:'assets/ui/perks/perk-rarity-frames-01.webp',
    pickupNotification:'assets/ui/pickups/pickup-notification-frame-01.webp'
  }),
  // Pack 8 remains DOM/canvas presentation-only. Existing procedural UI stays
  // authoritative and becomes the graceful fallback if a generated atlas fails.
  presentationHudV2:Object.freeze({
    reticles:'assets/ui/combat/reticle-identity-atlas-01.webp',
    minimapMarkers:'assets/ui/minimap/minimap-marker-atlas-01.webp',
    respawnCountdown:'assets/ui/feedback/respawn-countdown-atlas-01.webp',
    explosiveFuse:'assets/ui/explosives/explosive-fuse-atlas-01.webp',
    weaponSwitch:'assets/ui/weapons/weapon-switch-swipe-atlas-01.webp',
    botOverhead:'assets/ui/bots/bot-overhead-frame-atlas-01.webp',
    comboMeter:'assets/ui/feedback/combo-meter-atlas-01.webp',
    pickupBeacon:'assets/ui/pickups/pickup-beacon-atlas-01.webp'
  }),
  // Pack 9 converts generated contact-sheet direction into compact vector runtime
  // derivatives. They stay DOM/CSS-only and keep procedural/text fallbacks.
  presentationHudV4:Object.freeze({
    grenadeUi:'assets/ui/equipment/frag-grenade-ui-atlas-20.svg'
  }),
  presentationHudV3:Object.freeze({
    perkPathCrests:'assets/ui/perks/perk-path-crest-atlas-01.svg',
    equipmentReadiness:'assets/ui/equipment/equipment-readiness-atlas-01.svg',
    frontlineProgress:'assets/ui/objective/frontline-capture-progress-frame-01.svg',
    allyCallouts:'assets/ui/bots/ally-tactical-callout-atlas-01.svg',
    pausePanel:'assets/ui/panels/pause-panel-tech-01.svg',
    mobileControls:'assets/ui/mobile/mobile-control-icons-atlas-01.svg'
  }),
  firstPersonWeapons:Object.freeze({
    pistol:'assets/weapons/fp/pistol-tech.svg',
    shotgun:'assets/weapons/fp/shotgun-tech.svg',
    rifle:'assets/weapons/fp/rifle-tech.svg',
    rocket:'assets/weapons/fp/rocket-tech.svg',
    plasma:'assets/weapons/fp/plasma-tech.svg',
    mine:'assets/weapons/fp/mine-tech.svg',
    sniper:'assets/weapons/fp/sniper-tech.svg'
  }),
  // Generated FPS renders are player-only DOM presentation. Bots keep procedural
  // Three.js weapon models; world pickups use a separate DOM-projection layer.
  legacyFirstPersonWeapons:Object.freeze({
    plasma:'assets/ui/weapons/fp/player-plasma-fps-01.webp'
  }),
  generatedFirstPersonWeaponFallbacks:Object.freeze({
    pistol:'assets/ui/weapons/fp/player-pistol-fps-01.webp',
    mine:'assets/ui/weapons/fp/player-mine-fps-01.webp',
    shotgun:'assets/ui/weapons/fp/player-shotgun-fps-01.webp',
    rifle:'assets/ui/weapons/fp/player-rifle-fps-01.webp',
    rocket:'assets/ui/weapons/fp/player-rocket-fps-01.webp',
    plasma:'assets/ui/weapons/fp/player-plasma-fps-31.webp',
    sniper:'assets/ui/weapons/fp/player-sniper-fps-01.webp'
  }),
  generatedFirstPersonWeapons:Object.freeze({
    pistol:'assets/ui/weapons/fp/player-pistol-fps-40.webp',
    shotgun:'assets/ui/weapons/fp/player-shotgun-fps-38.webp',
    rifle:'assets/ui/weapons/fp/player-rifle-fps-36.webp',
    rocket:'assets/ui/weapons/fp/player-rocket-fps-35.webp',
    plasma:'assets/ui/weapons/fp/player-plasma-fps-33.webp',
    mine:'assets/ui/weapons/fp/player-mine-ready-39.webp',
    bomb:'assets/ui/weapons/fp/player-bomb-ready-41.webp',
    smoke:'assets/ui/weapons/fp/player-smoke-fps-42.webp',
    sniper:'assets/ui/weapons/fp/player-sniper-fps-32.webp',
    grenade:'assets/ui/weapons/fp/player-grenade-ready-34.webp'
  }),
  // Generated map-pickup art stays DOM-only: pickups.js projects the real 3D
  // pickup position into screen space and keeps the procedural world model as fallback.
  legacyWorldWeaponPickups:Object.freeze({plasma:'assets/ui/pickups/weapons/world-plasma-pickup-01.webp',pistol:'assets/ui/pickups/weapons/world-pistol-pickup-01.webp',mine:'assets/ui/pickups/weapons/world-mine-pickup-01.webp',shotgun:'assets/ui/pickups/weapons/world-shotgun-pickup-01.webp',rifle:'assets/ui/pickups/weapons/world-rifle-pickup-01.webp',rocket:'assets/ui/pickups/weapons/world-rocket-pickup-01.webp'}),
  detailedWorldWeaponPickups:Object.freeze({
    pistol:'assets/ui/pickups/weapons/world-pistol-pickup-44.webp',
    shotgun:'assets/ui/pickups/weapons/world-shotgun-pickup-44.webp',
    rifle:'assets/ui/pickups/weapons/world-rifle-pickup-44.webp',
    rocket:'assets/ui/pickups/weapons/world-rocket-pickup-44.webp',
    plasma:'assets/ui/pickups/weapons/world-plasma-pickup-44.webp',
    bomb:'assets/ui/pickups/weapons/world-bomb-pickup-44.webp',
    smoke:'assets/ui/pickups/weapons/world-smoke-pickup-44.webp',
    sniper:'assets/ui/pickups/weapons/world-sniper-pickup-44.webp'
  }),
  detailedMedkitPickup:'assets/ui/pickups/world-medkit-pickup-44.webp',
  generatedWorldWeaponPickups:Object.freeze({
    pistol:'assets/ui/pickups/weapons/world-pistol-pickup-40.webp',
    shotgun:'assets/ui/pickups/weapons/world-shotgun-pickup-37.webp',
    rifle:'assets/ui/pickups/weapons/world-rifle-pickup-36.webp',
    rocket:'assets/ui/pickups/weapons/world-rocket-pickup-35.webp',
    plasma:'assets/ui/pickups/weapons/world-plasma-pickup-43.webp',
    mine:'assets/ui/pickups/weapons/world-mine-pickup-39.webp',
    bomb:'assets/ui/pickups/weapons/world-bomb-pickup-41.webp',
    smoke:'assets/ui/pickups/weapons/world-smoke-pickup-42.webp',
    sniper:'assets/ui/pickups/weapons/world-sniper-pickup-01.webp',
    grenade:'assets/ui/pickups/weapons/world-grenade-pickup-34.webp'
  }),
  firstPersonSkins:Object.freeze({
    pistol:'assets/weapons/fp/pistol-skin.svg',
    shotgun:'assets/weapons/fp/shotgun-skin.svg',
    rifle:'assets/weapons/fp/rifle-skin.svg',
    rocket:'assets/weapons/fp/rocket-skin.svg',
    plasma:'assets/weapons/fp/plasma-skin.svg',
    mine:'assets/weapons/fp/mine-skin.svg',
    sniper:'assets/weapons/fp/sniper-skin.svg'
  }),
  ui:Object.freeze({
    logo:'assets/ui/logo.svg',
    health:'assets/ui/health.svg',
    armor:'assets/ui/armor.svg',
    xp:'assets/ui/xp.svg',
    sniperScope:'assets/ui/sniper-scope.svg',
    rifleScope:'assets/ui/rifle-scope.svg',
    generatedSniperScope:'assets/ui/scopes/sniper-scope-tech-01.webp',
    generatedRifleScope:'assets/ui/scopes/rifle-scope-tech-01.webp'
  }),
  // Generated raster presentation art is intentionally DOM/CSS-only. Do not use
  // these assets as persistent Three.js texture planes/sprites on uCoz-hosted scenes.
  presentation:Object.freeze({
    menuBackground:'assets/ui/backgrounds/menu-bg-arena-01.jpg',
    loadingBackground:'assets/ui/backgrounds/loading-bg-arena-01.jpg',
    logo:'assets/ui/zap-zone-logo-01.png',
    health:'assets/ui/health-icon-tech-01.png',
    armor:'assets/ui/armor-icon-01.png',
    xp:'assets/ui/xp-star-01.png',
    hazardPanel:'assets/environment/hazard-panel-01.jpg',
    terminalScreen:'assets/environment/terminal-screen-01.jpg',
    blueTeam:'assets/ui/teams/blue-team-emblem-01.png',
    redTeam:'assets/ui/teams/red-team-emblem-01.png',
    ammo:'assets/ui/icons/ammo-tech-01.png',
    damagePerk:'assets/ui/perks/damage-tech-01.png',
    speedPerk:'assets/ui/perks/speed-tech-01.png',
    reloadPerk:'assets/ui/perks/reload-tech-01.png',
    defenderPerk:'assets/ui/perks/defender-tech-01.webp',
    predatorPerk:'assets/ui/perks/predator-tech-01.webp',
    warmachinePerk:'assets/ui/perks/warmachine-tech-01.webp',
    bulletstormPerk:'assets/ui/perks/bulletstorm-tech-01.webp',
    immortalPerk:'assets/ui/perks/immortal-tech-01.webp',
    doubletapPerk:'assets/ui/perks/doubletap-tech-01.webp',
    piercingPerk:'assets/ui/perks/piercing-tech-01.webp',
    laststandPerk:'assets/ui/perks/laststand-tech-01.webp',
    thornsPerk:'assets/ui/perks/thorns-tech-01.webp',
    explosiveRoundsPerk:'assets/ui/perks/explosive-rounds-tech-01.webp',
    evasiveMatrixPerk:'assets/ui/perks/evasive-matrix-tech-01.webp',
    headshotArmorPerk:'assets/ui/perks/headshot-armor-tech-01.webp',
    bombtechPerk:'assets/ui/perks/bombtech-tech-01.webp',
    levelUp:'assets/ui/feedback/levelup-core-tech-01.webp',
    death:'assets/ui/feedback/death-skull-tech-01.webp',
    armorBreak:'assets/ui/feedback/armor-break-tech-01.webp',
    frontline:'assets/ui/objective/frontline-beacon-01.png',
    frontlineCapture:'assets/ui/objective/frontline-capture-tech-01.webp',
    frontlineCaptureBurst:'assets/ui/objective/frontline-capture-burst-tech-01.webp',
    weaponCrate:'assets/ui/pickups/weapon-crate-tech-01.png',
    ammoCrate:'assets/ui/pickups/ammo-crate-tech-02.webp',
    medkitPickup:'assets/ui/pickups/world-medkit-pickup-01.webp',
    battleResultFrame:'assets/ui/feedback/battle-result-frame-tech-01.webp'
  })
});

const GAME_ASSET_PATHS=Object.freeze([
  ...Object.values(GAME_ASSETS.pickups),
  ...Object.values(GAME_ASSETS.environment),
  ...Object.values(GAME_ASSETS.characters),
  ...Object.values(GAME_ASSETS.perks),
  ...Object.values(GAME_ASSETS.perkIcons),
  ...Object.values(GAME_ASSETS.medals),
  ...Object.values(GAME_ASSETS.presentationMedals),
  ...Object.values(GAME_ASSETS.status),
  ...Object.values(GAME_ASSETS.presentationStatus),
  ...Object.values(GAME_ASSETS.impact),
  ...Object.values(GAME_ASSETS.fx),
  ...Object.values(GAME_ASSETS.presentationVfx),
  ...Object.values(GAME_ASSETS.presentationHudShells),
  ...Object.values(GAME_ASSETS.presentationHud),
  ...Object.values(GAME_ASSETS.presentationHudV2),
  ...Object.values(GAME_ASSETS.presentationHudV3),
  ...Object.values(GAME_ASSETS.presentationHudV4),
  ...Object.values(GAME_ASSETS.firstPersonWeapons),
  ...Object.values(GAME_ASSETS.generatedFirstPersonWeapons),
  ...Object.values(GAME_ASSETS.generatedWorldWeaponPickups),
  ...Object.values(GAME_ASSETS.detailedWorldWeaponPickups),
  GAME_ASSETS.detailedMedkitPickup,
  ...Object.values(GAME_ASSETS.legacyWorldWeaponPickups),
  ...Object.values(GAME_ASSETS.firstPersonSkins),
  ...Object.values(GAME_ASSETS.ui),
  ...Object.values(GAME_ASSETS.presentation)
]);

// URLs already resolved against the document, including direct local-file mode.
if(GAME_PRESENTATION_ASSETS_ENABLED){
  for(const [key,url] of Object.entries(GAME_ASSETS.presentationHudShells)){
    document.documentElement.style.setProperty('--hud-'+key+'-shell','url("'+url+'")');
  }
}
const _gameTextureLoader=new THREE.TextureLoader();
const _gameTextureCache=new Map();

function makeLocalAssetFallbackTexture(){
  const data=new Uint8Array([255,255,255,0]);
  const tex=new THREE.DataTexture(data,1,1,THREE.RGBAFormat);
  tex.encoding=THREE.sRGBEncoding;tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;tex.needsUpdate=true;
  return tex;
}
function gameTexture(path){
  if(_gameTextureCache.has(path))return _gameTextureCache.get(path);
  if(GAME_LOCAL_FILE_MODE){
    const tex=makeLocalAssetFallbackTexture();_gameTextureCache.set(path,tex);return tex;
  }
  const tex=_gameTextureLoader.load(
    path,
    loaded=>{
      loaded.encoding=THREE.sRGBEncoding;
      loaded.minFilter=THREE.LinearFilter;
      loaded.magFilter=THREE.LinearFilter;
      loaded.needsUpdate=true;
    },
    undefined,
    err=>console.warn('Не удалось загрузить игровой asset:',path,err)
  );
  tex.encoding=THREE.sRGBEncoding;
  tex.minFilter=THREE.LinearFilter;
  tex.magFilter=THREE.LinearFilter;
  _gameTextureCache.set(path,tex);
  return tex;
}

function makeAssetPlane(path,width,height,options={}){
  const material=new THREE.MeshBasicMaterial({
    map:gameTexture(path),
    transparent:true,
    opacity:options.opacity??1,
    depthWrite:false,
    depthTest:options.depthTest??true,
    side:options.side??THREE.DoubleSide,
    toneMapped:false,
    polygonOffset:true,
    polygonOffsetFactor:-2,
    polygonOffsetUnits:-2
  });
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
  mesh.renderOrder=options.renderOrder??3;
  return mesh;
}

function makeAssetSprite(path,width,height,options={}){
  const material=new THREE.SpriteMaterial({
    map:gameTexture(path),
    transparent:true,
    opacity:options.opacity??1,
    depthWrite:false,
    depthTest:options.depthTest??false,
    toneMapped:false
  });
  const sprite=new THREE.Sprite(material);
  sprite.scale.set(width,height,1);
  sprite.renderOrder=options.renderOrder??12;
  return sprite;
}

function perkFallbackAsset(id,path){
  return GAME_ASSETS.perkIcons[id]||GAME_ASSETS.perks[path]||GAME_ASSETS.perks.assault;
}
function perkAsset(id,path){
  if(GAME_ASSETS.perkGeneratedIcons[id])return GAME_ASSETS.perkGeneratedIcons[id];
  if(id==='damage')return GAME_ASSETS.presentation.damagePerk;
  if(id==='reload')return GAME_ASSETS.presentation.reloadPerk;
  if(id==='mobility'||id==='sprint_drive')return GAME_ASSETS.presentation.speedPerk;
  if(id==='predator')return GAME_ASSETS.presentation.predatorPerk;
  if(id==='warmachine')return GAME_ASSETS.presentation.warmachinePerk;
  if(id==='bulletstorm')return GAME_ASSETS.presentation.bulletstormPerk;
  if(id==='immortal')return GAME_ASSETS.presentation.immortalPerk;
  if(id==='doubletap')return GAME_ASSETS.presentation.doubletapPerk;
  if(id==='piercing')return GAME_ASSETS.presentation.piercingPerk;
  if(id==='laststand')return GAME_ASSETS.presentation.laststandPerk;
  if(id==='thorns')return GAME_ASSETS.presentation.thornsPerk;
  if(id==='explosive_rounds')return GAME_ASSETS.presentation.explosiveRoundsPerk;
  if(id==='evasive_matrix')return GAME_ASSETS.presentation.evasiveMatrixPerk;
  if(id==='headshot_armor')return GAME_ASSETS.presentation.headshotArmorPerk;
  if(id==='bombtech')return GAME_ASSETS.presentation.bombtechPerk;
  if(['armor','armorregen','blastshield','ballistic_lining','surplus_armor','smoke_guard'].includes(id))return GAME_ASSETS.presentation.defenderPerk;
  return perkFallbackAsset(id,path);
}

function imageAssetWithFallback(img,source,fallback){
  if(!img||!source||!fallback)return;
  img.dataset.fallbackSrc=fallback;
  img.onerror=()=>{img.onerror=null;img.src=img.dataset.fallbackSrc;};
  img.src=source;
}
function statusFallbackAsset(key){return GAME_ASSETS.status[key]||'';}
function statusAsset(key){
  const fallback=statusFallbackAsset(key);
  return GAME_ASSETS.presentationStatus[key]||fallback;
}
function combatMedalFallbackAsset(type){return GAME_ASSETS.medals[type]||'';}
function combatMedalAsset(type){
  const fallback=combatMedalFallbackAsset(type);
  return GAME_ASSETS.presentationMedals[type]||fallback;
}
function headshotFallbackAsset(lethal=false){return lethal?GAME_ASSETS.fx.headshotKill:GAME_ASSETS.fx.headshot;}
function headshotAsset(lethal=false){
  const fallback=headshotFallbackAsset(lethal);
  return GAME_ASSETS.presentationMedals.headshot||fallback;
}

function presentationAtlasFrame(asset,col=0,row=0,cols=1,rows=1){
  if(!asset)return null;
  return{asset,col,row,cols,rows};
}
function presentationAtlasPercent(index,count){return count<=1?50:index/(count-1)*100;}
function applyPresentationAtlasFrame(el,frame){
  if(!el||!frame?.asset)return false;
  el.style.backgroundImage='url("'+frame.asset+'")';
  el.style.backgroundSize=(frame.cols*100)+'% '+(frame.rows*100)+'%';
  el.style.backgroundPosition=presentationAtlasPercent(frame.col,frame.cols).toFixed(3)+'% '+presentationAtlasPercent(frame.row,frame.rows).toFixed(3)+'%';
  el.style.backgroundRepeat='no-repeat';
  return true;
}
function applyPresentationAtlasVariables(el,prefix,frame){
  if(!el||!prefix||!frame?.asset)return false;
  el.style.setProperty('--'+prefix+'-image','url("'+frame.asset+'")');
  el.style.setProperty('--'+prefix+'-size',(frame.cols*100)+'% '+(frame.rows*100)+'%');
  el.style.setProperty('--'+prefix+'-position',presentationAtlasPercent(frame.col,frame.cols).toFixed(3)+'% '+presentationAtlasPercent(frame.row,frame.rows).toFixed(3)+'%');
  return true;
}
function hitMarkerPresentationFrame(kind='hit'){
  const pos={hit:[0,0],head:[1,0],crit:[0,1],kill:[1,1]}[kind]||[0,0];
  return presentationAtlasFrame(GAME_ASSETS.presentationHud.hitmarkers,pos[0],pos[1],2,2);
}
function botRolePresentationFrame(role){
  const col={assault:0,flankL:1,flankR:2,anchor:3,engineer:4}[role];
  return Number.isInteger(col)?presentationAtlasFrame(GAME_ASSETS.presentationHud.botRoles,col,0,5,1):null;
}
function botDoctrinePresentationFrame(doctrine){
  const col={breach:0,push:1,hold:2,retake:3}[doctrine];
  return Number.isInteger(col)?presentationAtlasFrame(GAME_ASSETS.presentationHud.botDoctrines,col,0,4,1):null;
}
function killFeedPresentationFrame(kind){
  if(kind==='grenade')return presentationAtlasFrame(GAME_ASSETS.presentationHudV4.grenadeUi,1,1,2,2);
  const pos={pistol:[0,0],shotgun:[1,0],rifle:[2,0],rocket:[3,0],plasma:[4,0],sniper:[0,1],mine:[1,1],bomb:[2,1],smoke:[3,1],headshot:[4,1]}[kind];
  return pos?presentationAtlasFrame(GAME_ASSETS.presentationHud.killFeed,pos[0],pos[1],5,2):null;
}
function threatPresentationFrame(kind){
  const normalized=kind==='grenade'?'frag':kind;
  const pos={rocket:[0,0],mine:[1,0],bomb:[2,0],frag:[0,1],sniper:[1,1],plasma:[2,1]}[normalized];
  return pos?presentationAtlasFrame(GAME_ASSETS.presentationHud.threats,pos[0],pos[1],3,2):null;
}
function ammoWarningPresentationFrame(state){
  const col=state==='low'?0:state==='empty'?1:null;
  return col===null?null:presentationAtlasFrame(GAME_ASSETS.presentationHud.ammoWarning,col,0,2,1);
}
function reloadPresentationFrame(mode){
  const col=mode==='mag'||mode==='tactical'?0:mode==='empty'?1:mode==='shell'?2:null;
  return col===null?null:presentationAtlasFrame(GAME_ASSETS.presentationHud.reloadStates,col,0,3,1);
}
function perkRarityPresentationFrame(rarity){
  const pos={common:[0,0],rare:[1,0],epic:[0,1],legendary:[1,1]}[rarity];
  return pos?presentationAtlasFrame(GAME_ASSETS.presentationHud.perkRarityFrames,pos[0],pos[1],2,2):null;
}
function frontlineContestedPresentationFrame(){return presentationAtlasFrame(GAME_ASSETS.presentationHud.frontlineContested);}
function pickupNotificationPresentationFrame(){return presentationAtlasFrame(GAME_ASSETS.presentationHud.pickupNotification);}


function reticlePresentationFrame(key){
  const pos={pistol:[0,0],shotgun:[1,0],rifle:[2,0],plasma:[0,1],rocket:[1,1],sniper:[2,1]}[key];
  return pos?presentationAtlasFrame(GAME_ASSETS.presentationHudV2.reticles,pos[0],pos[1],3,2):null;
}
function minimapMarkerPresentationFrame(kind){
  const pos={player:[0,0],ally:[1,0],weapon:[2,0],medkit:[0,1],objectiveActive:[1,1],objectiveNeutral:[2,1],mine:[0,2],bomb:[1,2],smoke:[2,2]}[kind];
  return pos?presentationAtlasFrame(GAME_ASSETS.presentationHudV2.minimapMarkers,pos[0],pos[1],3,3):null;
}
function respawnCountdownPresentationFrame(seconds){
  const sec=Math.max(1,Math.min(15,Math.ceil(Number(seconds)||1))),i=15-sec;
  return presentationAtlasFrame(GAME_ASSETS.presentationHudV2.respawnCountdown,i%4,Math.floor(i/4),4,4);
}
function explosiveFusePresentationFrame(state){
  const pos={safe:[0,0],arming:[1,0],armed:[0,1],danger:[1,1]}[state]||[0,0];
  return presentationAtlasFrame(GAME_ASSETS.presentationHudV2.explosiveFuse,pos[0],pos[1],2,2);
}
// Pack35 probes are lazy, terminal and shared by all presentation consumers.
const rocketPresentationProbes35=new Map();
const ROCKET_PRESENTATION_DIMENSIONS35=Object.freeze({
  pack35RocketReady:[960,720],pack35RocketReload:[2304,1152],
  pack35RocketEffects:[1024,1024],pack35RocketScorch:[512,512],pack35RocketWall:[512,512]
});
function rocketPresentationAssetReady35(key){
  const size=ROCKET_PRESENTATION_DIMENSIONS35[key],asset=GAME_ASSETS.presentationVfx[key];
  if(!size||!asset)return false;
  let probe=rocketPresentationProbes35.get(asset);
  if(!probe){probe=new Image();rocketPresentationProbes35.set(asset,probe);probe.src=gameAssetUrl(asset);}
  return probe.complete&&probe.naturalWidth===size[0]&&probe.naturalHeight===size[1];
}
function rocketFlightPresentationFrame35(index=0){
  const frame=Math.max(0,Math.min(3,Math.floor(Number(index)||0)));
  return presentationAtlasFrame(GAME_ASSETS.presentationVfx.pack35RocketEffects,frame,1,4,4);
}
function rocketFlightPresentationFrame(index=0){
  const frame=Math.max(0,Math.min(11,Math.floor(Number(index)||0)));
  return presentationAtlasFrame(GAME_ASSETS.presentationVfx.pack28RocketFlight,frame%4,Math.floor(frame/4),4,3);
}
function grenadeFlightPresentationFrame(index=3){
  const frame=Math.max(0,Math.min(7,Math.floor(Number(index)||0)));
  return presentationAtlasFrame(GAME_ASSETS.presentationVfx.pack34GrenadeWorld,frame%4,Math.floor(frame/4),4,2);
}
function plasmaFlightPresentationFrame(index=0){
  const frame=Math.max(0,Math.min(15,Math.floor(Number(index)||0)));
  return presentationAtlasFrame(GAME_ASSETS.presentationVfx.pack30PlasmaFlight,frame%4,Math.floor(frame/4),4,4);
}
function botOverheadPresentationFrame(team,state='normal'){
  const col=team==='enemy'?1:0,row=state==='armor'?1:state==='critical'||state==='broken'?2:0;
  return presentationAtlasFrame(GAME_ASSETS.presentationHudV2.botOverhead,col,row,2,3);
}
function comboMeterPresentationFrame(value){
  const n=Math.max(0,Number(value)||0),row=n>=7?4:n>=5?3:n>=4?2:n>=3?1:0;
  return presentationAtlasFrame(GAME_ASSETS.presentationHudV2.comboMeter,0,row,1,5);
}
function pickupBeaconPresentationFrame(kind){
  const pos={weapon:[0,0],heavy:[1,0],utility:[0,1],medkit:[1,1]}[kind]||[0,0];
  return presentationAtlasFrame(GAME_ASSETS.presentationHudV2.pickupBeacon,pos[0],pos[1],2,2);
}

function perkPathPresentationFrame(path){
  const col={assault:0,survival:1,demolition:2,precision:3,mobility:4}[path];
  return Number.isInteger(col)?presentationAtlasFrame(GAME_ASSETS.presentationHudV3.perkPathCrests,col,0,5,1):null;
}
function equipmentReadinessPresentationFrame(kind,ready=true){
  if(kind==='mine')return presentationAtlasFrame(GAME_ASSETS.presentationVfx.pack39MineIcon);
  const col={mine:0,bomb:1,smoke:2}[kind];
  return Number.isInteger(col)?presentationAtlasFrame(GAME_ASSETS.presentationHudV3.equipmentReadiness,col,ready?0:1,3,2):null;
}
function allyCalloutPresentationFrame(kind){
  const col={cover:0,suppress:1,flank:2,reload:3,recover:4}[kind];
  return Number.isInteger(col)?presentationAtlasFrame(GAME_ASSETS.presentationHudV3.allyCallouts,col,0,5,1):null;
}
function mobileControlPresentationFrame(kind){
  const col={fire:0,jump:1,sprint:2,reload:3,mine:4,next:5}[kind];
  return Number.isInteger(col)?presentationAtlasFrame(GAME_ASSETS.presentationHudV3.mobileControls,col,0,6,1):null;
}


const GENERATED_COMBAT_VFX_SPECS=Object.freeze({
  rocketBackblast:Object.freeze({row:0,frames:6,duration:.40,size:168}),
  shotgunMuzzle:Object.freeze({row:2,frames:8,duration:.46,size:176}),
  brassCasing:Object.freeze({row:3,frames:8,duration:.54,size:76}),
  shotgunShell:Object.freeze({row:4,frames:6,duration:.56,size:86}),
  magazineDrop:Object.freeze({row:5,frames:8,duration:.72,size:104}),
  concreteImpact:Object.freeze({row:6,frames:8,duration:.50,size:112}),
  metalImpact:Object.freeze({row:7,frames:8,duration:.38,size:116}),
  woodImpact:Object.freeze({row:8,frames:5,duration:.46,size:118}),
  rocketExplosion:Object.freeze({asset:'rocketExplosion',cols:4,rows:3,frames:12,duration:1.00,size:210}),
  plasmaImpact:Object.freeze({asset:'plasmaImpact',cols:4,rows:3,frames:12,duration:.82,size:150}),
  plasmaReload:Object.freeze({asset:'plasmaReload',cols:4,rows:2,frames:8,duration:1.05,width:286,height:161}),
  ricochet:Object.freeze({asset:'pack12',row:0,cols:8,rows:5,frames:8,duration:.62,size:148}),
  penetrationExit:Object.freeze({asset:'pack12',row:1,cols:8,rows:5,frames:8,duration:.78,size:134}),
  smokeDeploy:Object.freeze({asset:'pack12',row:2,cols:8,rows:5,frames:8,occlude:true,duration:1.40,size:260}),
  mineDetonation:Object.freeze({asset:'pack12',row:3,cols:8,rows:5,frames:8,duration:.82,size:236}),
  fragGrenade:Object.freeze({asset:'pack15Frag',row:0,cols:8,rows:1,frames:8,duration:.82,size:248,worldSizeM:5,occlude:true}),
  shotgunShellInsert:Object.freeze({asset:'pack18',row:0,cols:4,rows:7,frames:8,duration:.36,width:118,height:118}),
  smokeThrow42:Object.freeze({asset:'pack42SmokeThrow',cols:3,rows:2,frames:6,duration:.58,width:1280,height:720,size:1280}),
  smokeReload42:Object.freeze({asset:'pack42SmokeReload',cols:3,rows:1,frames:3,duration:.8,width:1280,height:720,size:1280}),
  grenadeThrow:Object.freeze({asset:'pack20GrenadeThrow',row:0,cols:4,rows:2,frames:8,duration:.58,size:430}),
  grenadeThrow34:Object.freeze({asset:'pack34GrenadeThrow',row:0,cols:2,rows:4,frames:8,duration:.58,width:768,height:432}),
  grenadeExplosion34:Object.freeze({asset:'pack34GrenadeBlast',row:0,cols:4,rows:2,frames:8,duration:.76,size:306,worldSizeM:8.0,maxScreenSize:720,occlude:true}),
  grenadeSmoke34:Object.freeze({asset:'pack34GrenadeSmoke',row:0,cols:4,rows:1,frames:4,duration:1.35,size:286,worldSizeM:6.4,maxScreenSize:640,occlude:true}),
  grenadeDebris34:Object.freeze({asset:'pack34GrenadeDebris',row:0,cols:2,rows:1,frames:2,duration:.70,size:260,worldSizeM:8.4,maxScreenSize:720,occlude:true}),
  grenadeScorch34:Object.freeze({asset:'pack34GrenadeScorch',row:0,cols:2,rows:1,frames:2,duration:15,coolAfter:.65,fadeSeconds:2,groundPlane:true,size:180,worldSizeM:2.8,occlude:true}),
  bombPlant41:Object.freeze({asset:'pack41BombPlant',cols:2,rows:2,frames:6,sequence:Object.freeze([0,1,2,3,3,0]),duration:.96,width:1600,height:900}),
  bombReload41:Object.freeze({asset:'pack41BombPlant',cols:2,rows:2,frames:2,sequence:Object.freeze([3,0]),duration:.9,width:1600,height:900}),
  bombReloadHold41:Object.freeze({asset:'pack41BombReady',cols:1,rows:1,frames:1,duration:.9,width:1600,height:900}),
  bombExplosion41:Object.freeze({asset:'pack41BombExplosion',cols:5,rows:4,frames:17,duration:2.1,size:768,width:1075,height:768,worldSizeM:18,maxScreenSize:1100,occlude:true,originY:.94}),
  bombShockwave41:Object.freeze({asset:'pack41BombShockwave',cols:3,rows:2,frames:6,duration:.9,fadeSeconds:.2,size:512,worldSizeM:28,groundPlane:true,occlude:true}),
  bombScorch41:Object.freeze({asset:'pack35RocketScorch',cols:1,rows:1,frames:1,duration:15,fadeSeconds:2,groundPlane:true,size:180,worldSizeM:2.8,occlude:true}),
  bombSmoke41:Object.freeze({asset:'pack41BombSmoke',cols:1,rows:1,frames:1,duration:4.5,fadeSeconds:2.5,size:768,worldSizeM:14,maxScreenSize:1000,occlude:true,originY:.925}),
  bombSmokeSequence41:Object.freeze({asset:'pack41BombSmokeSequence',cols:3,rows:2,frames:6,duration:3,size:512,worldSizeM:14,maxScreenSize:1000,occlude:true,originY:.94}),
  grenadeFlight:Object.freeze({asset:'pack21GrenadeMotion',row:0,cols:8,rows:2,frames:8,duration:1.82,size:116}),
  grenadeFuse:Object.freeze({asset:'pack21GrenadeMotion',row:1,cols:8,rows:2,frames:8,duration:.78,size:134}),
  grenadeExplosion21:Object.freeze({asset:'pack21GrenadeBlast',row:0,cols:4,rows:4,frames:8,duration:.76,size:306,worldSizeM:5,occlude:true}),
  grenadeSmoke21:Object.freeze({asset:'pack21GrenadeBlast',row:2,cols:4,rows:4,frames:8,duration:1.35,size:286,worldSizeM:4.6,occlude:true}),
  grenadeDebris21:Object.freeze({asset:'pack21GrenadeDebris',row:0,cols:8,rows:3,frames:17,duration:.92,size:260,worldSizeM:5.2,occlude:true}),
  grenadeScorch21:Object.freeze({asset:'pack21GrenadeDebris',row:2,cols:8,rows:3,frames:5,duration:15,fadeSeconds:2,groundPlane:true,size:180,worldSizeM:2.8,occlude:true}),
  rifleReloadTactical36:Object.freeze({asset:'pack36RifleReload',cols:3,rows:2,frames:5,sequence:Object.freeze([5,1,2,3,5]),duration:1.935,width:768,height:576}),
  rifleReloadEmpty36:Object.freeze({asset:'pack36RifleReload',cols:3,rows:2,frames:6,sequence:Object.freeze([5,1,2,3,4,5]),duration:2.408,width:768,height:576}),
  rifleReloadHold36:Object.freeze({asset:'pack36RifleReady',cols:1,rows:1,frames:1,duration:2.408,width:960,height:720}),
  rifleMuzzle36:Object.freeze({asset:'pack36RifleEffects',row:0,cols:4,rows:4,frames:4,duration:.09,size:104}),
  rifleSmoke36:Object.freeze({asset:'pack36RifleEffects',row:1,cols:4,rows:4,frames:4,duration:.32,size:96}),
  rifleCasing36:Object.freeze({asset:'pack36RifleEffects',row:3,cols:4,rows:4,frames:4,duration:.32,size:42}),
  rifleReloadTactical:Object.freeze({asset:'pack22RifleReload',row:0,cols:4,rows:3,frames:9,sequence:Object.freeze([0,1,2,3,4,5,6,7,11]),duration:1.45,width:450,height:400}),
  rifleReloadEmpty:Object.freeze({asset:'pack22RifleReload',row:0,cols:4,rows:3,frames:12,duration:2.05,width:450,height:400}),
  sniperBoltCycle:Object.freeze({asset:'pack22SniperBolt',row:0,cols:4,rows:3,frames:12,duration:.95,width:500,height:444}),
  sniperMuzzle23:Object.freeze({asset:'pack23SniperShot',row:0,cols:4,rows:4,frames:8,duration:.20,size:360}),
  sniperSmoke23:Object.freeze({asset:'pack23SniperShot',row:2,cols:4,rows:4,frames:8,duration:.46,size:300}),
  sniperBullet23:Object.freeze({asset:'pack23SniperBallistics',row:0,cols:4,rows:4,frames:8,duration:.11,size:520}),
  sniperSupersonic23:Object.freeze({asset:'pack23SniperBallistics',row:2,cols:4,rows:4,frames:8,duration:.14,size:540}),
  sniperCasing23:Object.freeze({asset:'pack23SniperCasing',row:0,cols:4,rows:3,frames:12,duration:.55,size:180}),
  rocketMuzzle35:Object.freeze({asset:'pack35RocketEffects',row:0,cols:4,rows:4,frames:4,duration:.16,size:132}),
  rocketExplosion35:Object.freeze({asset:'pack35RocketEffects',row:2,cols:4,rows:4,frames:4,duration:.72,size:256,worldSizeM:10.64,maxScreenSize:896,occlude:true}),
  rocketResidual35:Object.freeze({asset:'pack35RocketEffects',row:3,cols:4,rows:4,frames:4,duration:1.35,size:256,worldSizeM:8.68,maxScreenSize:812,occlude:true}),
  rocketWall35:Object.freeze({asset:'pack35RocketWall',cols:1,rows:1,frames:1,duration:15,fadeSeconds:2,groundPlane:true,surfacePlane:true,size:180,worldSizeM:2.8,occlude:true}),
  rocketScorch35:Object.freeze({asset:'pack35RocketScorch',cols:1,rows:1,frames:1,duration:15,fadeSeconds:2,groundPlane:true,size:180,worldSizeM:2.8,occlude:true}),
  rocketReload35:Object.freeze({asset:'pack35RocketReload',cols:3,rows:2,frames:6,sequence:Object.freeze([5,1,2,3,4,5]),duration:2.85,width:768,height:576}),
  rocketReloadHold35:Object.freeze({asset:'pack35RocketReady',cols:1,rows:1,frames:1,duration:2.85,width:960,height:720}),
  rocketReload24:Object.freeze({asset:'pack24RocketReload',row:0,cols:4,rows:3,frames:12,duration:2.85,width:450,height:338}),
  mineThrow39:Object.freeze({asset:'pack39MineThrow',cols:3,rows:2,frames:6,duration:.58,width:1280,height:720}),
  mineReload39:Object.freeze({asset:'pack39MineReload',cols:3,rows:1,frames:3,duration:3.2,width:1280,height:720}),
  mineExplosion39:Object.freeze({asset:'pack39MineExplosion',cols:4,rows:2,frames:8,duration:.82,size:512,worldSizeM:7,maxScreenSize:680,occlude:true,originY:472/512}),
  mineSmoke39:Object.freeze({asset:'pack39MineSmoke',cols:3,rows:2,frames:6,duration:1.4,size:512,worldSizeM:6,maxScreenSize:600,occlude:true,originY:472/512}),
  mineMetal39:Object.freeze({asset:'pack39MineUtility',cols:3,rows:2,frames:1,sequence:Object.freeze([0]),duration:.65,size:512,worldSizeM:5,occlude:true,originY:472/512}),
  mineElectronics39:Object.freeze({asset:'pack39MineUtility',cols:3,rows:2,frames:1,sequence:Object.freeze([1]),duration:.6,size:512,worldSizeM:4,occlude:true,originY:472/512}),
  mineLand39:Object.freeze({asset:'pack39MineUtility',cols:3,rows:2,frames:1,sequence:Object.freeze([2]),duration:.3,size:512,worldSizeM:1.5,occlude:true,originY:472/512}),
  mineScorch39:Object.freeze({asset:'pack39MineUtility',cols:3,rows:2,frames:2,sequence:Object.freeze([3,4]),duration:15,coolAfter:.65,fadeSeconds:2,groundPlane:true,size:180,worldSizeM:2.8,occlude:true}),
  mineActivation39:Object.freeze({asset:'pack39MineUtility',cols:3,rows:2,frames:1,sequence:Object.freeze([5]),duration:.3,size:512,worldSizeM:1.2,occlude:true,originY:472/512}),
  mineTriggered39:Object.freeze({asset:'pack39MineWorld',cols:3,rows:3,frames:1,sequence:Object.freeze([4]),duration:.08,size:512,worldSizeM:.85,occlude:true}),
  mineThrow24:Object.freeze({asset:'pack24MineThrow',row:0,cols:6,rows:1,frames:6,duration:.58,width:430,height:323}),
  pistolReloadTactical25:Object.freeze({asset:'pack25PistolReload',row:0,cols:4,rows:3,frames:9,sequence:Object.freeze([0,1,2,3,4,5,6,7,11]),duration:1.10,width:450,height:338}),
  pistolReloadTactical40:Object.freeze({asset:'pack40PistolReload',cols:3,rows:2,frames:5,sequence:Object.freeze([0,1,2,3,5]),duration:1.10,width:1280,height:960}),
  pistolReloadEmpty40:Object.freeze({asset:'pack40PistolReload',cols:3,rows:2,frames:6,sequence:Object.freeze([0,1,2,3,4,5]),duration:1.35,width:1280,height:960}),
  pistolReloadHold40:Object.freeze({asset:'pack40PistolReady',cols:1,rows:1,frames:1,duration:1.35,width:1448,height:1086}),
  pistolMuzzle40:Object.freeze({asset:'pack40PistolEffects',row:0,cols:4,rows:4,frames:4,duration:.09,size:98}),
  pistolSmoke40:Object.freeze({asset:'pack40PistolEffects',row:1,cols:4,rows:4,frames:4,duration:.32,size:92}),
  pistolCasing40:Object.freeze({asset:'pack40PistolEffects',row:3,cols:4,rows:4,frames:1,duration:.48,size:62}),
  pistolReloadEmpty25:Object.freeze({asset:'pack25PistolReload',row:0,cols:4,rows:3,frames:12,duration:1.35,width:450,height:338}),
  shotgunPump37:Object.freeze({asset:'pack37ShotgunAction',cols:3,rows:2,frames:5,sequence:Object.freeze([0,1,1,2,0]),duration:.62,width:768,height:576}),
  shotgunLoad37:Object.freeze({asset:'pack37ShotgunAction',cols:3,rows:2,frames:5,sequence:Object.freeze([0,3,4,5,0]),duration:.611,width:768,height:576}),
  shotgunHold37:Object.freeze({asset:'pack37ShotgunReady',cols:1,rows:1,frames:1,duration:.62,width:960,height:720}),
  shotgunMuzzle37:Object.freeze({asset:'pack37ShotgunEffects',row:0,cols:4,rows:4,frames:4,duration:.10,size:126}),
  shotgunSmoke37:Object.freeze({asset:'pack37ShotgunEffects',row:1,cols:4,rows:4,frames:4,duration:.42,size:114}),
  shotgunCasing37:Object.freeze({asset:'pack37ShotgunEffects',row:3,cols:4,rows:4,frames:1,duration:.52,size:96}),
  shotgunPump25:Object.freeze({asset:'pack25ShotgunPump',row:0,cols:4,rows:2,frames:8,duration:.62,width:450,height:338}),
  ballisticDischarge26:Object.freeze({asset:'pack26Discharge',row:0,cols:4,rows:2,frames:4,duration:.18,width:220,height:165}),
  energyDischarge26:Object.freeze({asset:'pack26Discharge',row:1,cols:4,rows:2,frames:4,duration:.24,width:236,height:177}),
  terminalArc27:Object.freeze({asset:'pack27TerminalArc',row:0,cols:5,rows:2,frames:10,duration:1.05,width:180,height:240}),
  concreteImpact45:Object.freeze({asset:'pack45SurfaceImpact',row:0,cols:6,rows:4,frames:3,duration:.22,size:128,worldSizeM:.82,minScreenSize:0,maxScreenSize:90,originY:.64,occlude:true}),
  metalImpact45:Object.freeze({asset:'pack45SurfaceImpact',row:1,cols:6,rows:4,frames:3,duration:.16,size:128,worldSizeM:.72,minScreenSize:0,maxScreenSize:82,originY:.64,occlude:true}),
  woodImpact45:Object.freeze({asset:'pack45SurfaceImpact',row:2,cols:6,rows:4,frames:3,duration:.22,size:128,worldSizeM:.82,minScreenSize:0,maxScreenSize:90,originY:.64,occlude:true}),
  heavyImpact45:Object.freeze({asset:'pack45SurfaceImpact',row:3,cols:6,rows:4,frames:3,duration:.26,size:128,worldSizeM:1.16,minScreenSize:0,maxScreenSize:110,originY:.64,occlude:true}),
  concreteImpact29:Object.freeze({asset:'pack29SurfaceImpact',row:0,cols:4,rows:4,frames:6,sequence:Object.freeze([0,1,2,2,3,3]),duration:.32,size:72,worldSizeM:.95,minScreenSize:0,maxScreenSize:128,occlude:true}),
  metalImpact29:Object.freeze({asset:'pack29SurfaceImpact',row:1,cols:4,rows:4,frames:4,sequence:Object.freeze([0,1,2,3]),duration:.24,size:74,worldSizeM:1.05,minScreenSize:0,maxScreenSize:136,occlude:true}),
  techImpact29:Object.freeze({asset:'pack29SurfaceImpact',row:2,cols:4,rows:4,frames:6,sequence:Object.freeze([0,1,1,2,3,3]),duration:.42,size:80}),
  heavyImpact29:Object.freeze({asset:'pack29SurfaceImpact',row:3,cols:4,rows:4,frames:6,sequence:Object.freeze([1,1,2,2,3,3]),duration:.36,size:88,worldSizeM:1.24,minScreenSize:0,maxScreenSize:150,occlude:true}),
  sniperReloadTactical32:Object.freeze({asset:'pack32SniperAction',row:0,cols:4,rows:4,frames:12,duration:3.196,width:512,height:384}),
  sniperReloadEmpty32:Object.freeze({asset:'pack32SniperAction',row:0,cols:4,rows:4,frames:17,sequence:Object.freeze([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,11]),duration:3.74,width:512,height:384}),
  sniperBoltCycle32:Object.freeze({asset:'pack32SniperAction',row:0,cols:4,rows:4,frames:6,sequence:Object.freeze([11,12,13,14,15,11]),duration:.92,width:512,height:384}),
  sniperMuzzle32:Object.freeze({asset:'pack32SniperEffects',row:0,cols:4,rows:4,frames:4,duration:.13,size:108}),
  sniperSmoke32:Object.freeze({asset:'pack32SniperEffects',row:1,cols:4,rows:4,frames:4,duration:.38,size:116}),
  sniperBullet32:Object.freeze({asset:'pack32SniperEffects',row:2,cols:4,rows:4,frames:4,duration:.11,size:84}),
  sniperCasing32:Object.freeze({asset:'pack32SniperEffects',row:3,cols:4,rows:4,frames:4,duration:.42,size:68}),
  plasmaReloadTactical33:Object.freeze({asset:'pack33PlasmaReload',cols:3,rows:2,frames:6,sequence:Object.freeze([5,1,2,3,4,5]),duration:1.49,width:768,height:576}),
  plasmaReloadEmpty33:Object.freeze({asset:'pack33PlasmaReload',cols:3,rows:2,frames:8,sequence:Object.freeze([5,1,2,2,3,4,4,5]),duration:1.75,width:768,height:576}),
  plasmaReloadHold33:Object.freeze({asset:'pack33PlasmaReady',cols:1,rows:1,frames:1,duration:1.75,width:960,height:720}),
  plasmaReloadTactical31:Object.freeze({asset:'pack31PlasmaReload',row:0,cols:4,rows:3,frames:10,sequence:Object.freeze([0,1,2,3,4,6,7,8,9,11]),duration:1.49,width:180,height:135}),
  plasmaReloadEmpty31:Object.freeze({asset:'pack31PlasmaReload',row:0,cols:4,rows:3,frames:12,duration:1.75,width:180,height:135})
});
function generatedCombatVfxSpec(kind){return GENERATED_COMBAT_VFX_SPECS[kind]||null;}
function generatedCombatVfxFrame(kind,index=0){
  const spec=generatedCombatVfxSpec(kind);if(!spec)return null;
  const frame=Math.max(0,Math.min(spec.frames-1,Math.floor(Number(index)||0)));
  const sourceFrame=Array.isArray(spec.sequence)?(spec.sequence[frame]??frame):frame;
  if(spec.asset){
    const cols=Math.max(1,spec.cols||1),rows=Math.max(1,spec.rows||1);
    return presentationAtlasFrame(GAME_ASSETS.presentationVfx[spec.asset],sourceFrame%cols,(spec.row||0)+Math.floor(sourceFrame/cols),cols,rows);
  }
  return presentationAtlasFrame(GAME_ASSETS.presentationVfx.combatAtlas,sourceFrame,spec.row,8,10);
}

const SHOTGUN_EFFECT_EMITTERS38=Object.freeze({"flame":[[0.889155,0.523923],[0.873206,0.536151],[0.909888,0.491228],[0.873206,0.49176]],"smoke":[[0.838118,0.597488],[0.838118,0.597744],[0.838118,0.555821],[0.838118,0.555423]]});
// Dense emitter roots measured on the actual 1254x1254 source. Floor crops
// alternate 313/314 pixels; normalize against each exact source cell, not 320.
const PISTOL_EFFECT_EMITTERS40=Object.freeze({
  flame:Object.freeze([[278/313,251/313],[264/314,253/313],[252/313,251/313],[253/314,251/313]]),
  smoke:Object.freeze([[274/313,261/314],[266/314,260/314],[256/313,263/314],[258/314,269/314]])
});
