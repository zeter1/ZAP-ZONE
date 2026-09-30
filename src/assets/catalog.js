'use strict';

function G(id){return document.getElementById(id);}
const GAME_LOCAL_FILE_MODE=location.protocol==='file:';
const GAME_HOSTED_HTTP_MODE=/^https?:$/.test(location.protocol);
const GAME_PRESENTATION_ASSETS_ENABLED=GAME_HOSTED_HTTP_MODE||GAME_LOCAL_FILE_MODE;
const GAME_BUILD_ID=typeof window.ZAP_BUILD_ID==='string'?window.ZAP_BUILD_ID:'';
const GAME_BUILD_ID_PATTERN=/^[0-9a-f]{16}$/;

function gameAssetUrl(path){
  if(!GAME_HOSTED_HTTP_MODE||!GAME_BUILD_ID_PATTERN.test(GAME_BUILD_ID)||typeof path!=='string')return path;
  const clean=path.replace(/([?&])v=[0-9a-f]{16}(?=(&|$))/g,'$1').replace(/[?&]$/,'');
  return clean+(clean.includes('?')?'&':'?')+'v='+encodeURIComponent(GAME_BUILD_ID);
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
    smoke:'assets/ui/overlays/smoke-clouds-01.webp',
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
    pack13:'assets/ui/fx/bot-combat-vfx-atlas-13.svg',
    pack14:'assets/ui/fx/player-feedback-vfx-atlas-14.svg',
    pack15Frag:'assets/ui/fx/frag-grenade-shrapnel-bloom-atlas-15.svg',
    pack15Death:'assets/ui/fx/player-death-signal-collapse-atlas-15.svg',
    pack16:'assets/ui/fx/bot-action-vfx-atlas-16.svg',
    pack17:'assets/ui/fx/interaction-vfx-atlas-17.svg',
    pack18:'assets/ui/fx/player-action-vfx-atlas-18.svg',
    pack19Landing:'assets/ui/fx/landing-impact-vfx-atlas-19.svg',
    pack19SmokeThrow:'assets/ui/fx/smoke-throw-vfx-atlas-19.svg',
    pack20GrenadeThrow:'assets/ui/fx/frag-grenade-throw-vfx-atlas-20.svg',
    pack20BombArm:'assets/ui/fx/player-bomb-arm-vfx-atlas-20.svg',
    pack21GrenadeMotion:'assets/ui/fx/frag-grenade-flight-fuse-atlas-21.svg',
    pack21GrenadeBlast:'assets/ui/fx/frag-grenade-explosion-smoke-atlas-21.svg',
    pack21GrenadeDebris:'assets/ui/fx/frag-grenade-debris-scorch-atlas-21.svg',
    pack22RifleReload:'assets/ui/fx/rifle-reload-vfx-atlas-22.webp',
    pack22SniperBolt:'assets/ui/fx/sniper-bolt-cycle-vfx-atlas-22.webp',
    pack23SniperShot:'assets/ui/fx/sniper-shot-vfx-atlas-23.webp',
    pack23SniperBallistics:'assets/ui/fx/sniper-ballistics-vfx-atlas-23.webp',
    pack23SniperCasing:'assets/ui/fx/sniper-casing-vfx-atlas-23.webp',
    pack24RocketReload:'assets/ui/fx/rocket-reload-vfx-atlas-24.webp',
    pack24MineThrow:'assets/ui/fx/mine-throw-vfx-atlas-24.webp',
    pack25PistolReload:'assets/ui/fx/pistol-reload-vfx-atlas-25.webp',
    pack25ShotgunPump:'assets/ui/fx/shotgun-pump-cycle-vfx-atlas-25.webp',
    pack26Discharge:'assets/ui/fx/weapon-discharge-vfx-atlas-26.webp',
    pack26HeavyExplosion:'assets/ui/fx/heavy-explosion-vfx-atlas-26.webp',
    pack27RespawnGate:'assets/ui/fx/player-respawn-gate-vfx-atlas-27.svg',
    pack27TerminalArc:'assets/ui/fx/terminal-electrical-arc-vfx-atlas-27.svg',
    pack28RocketFlight:'assets/ui/fx/rocket-flight-exhaust-vfx-atlas-28.svg',
    pack29SurfaceImpact:'assets/ui/fx/surface-impact-vfx-atlas-29.webp',
    pack30PlasmaFlight:'assets/ui/fx/plasma-flight-ion-sheath-vfx-atlas-30.webp'
  }),
  // Generated tactical HUD atlases are DOM/CSS presentation only. Procedural/SVG UI
  // remains the runtime fallback; no persistent Three.js raster planes are created.
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
    spawnProtection:'assets/ui/feedback/spawn-protection-atlas-01.webp',
    respawnCountdown:'assets/ui/feedback/respawn-countdown-atlas-01.webp',
    explosiveFuse:'assets/ui/explosives/explosive-fuse-atlas-01.webp',
    projectileTrails:'assets/ui/fx/projectile-trail-atlas-01.webp',
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
    matchDeploy:'assets/ui/feedback/match-deploy-splash-tech-01.svg',
    frontlineRetarget:'assets/ui/objective/frontline-retarget-sweep-tech-01.svg',
    secondWindRescue:'assets/ui/feedback/second-wind-rescue-tech-01.svg',
    dodgePhase:'assets/ui/feedback/dodge-phase-tech-01.svg',
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
    bomb:'assets/weapons/fp/bomb-tech.svg',
    smoke:'assets/weapons/fp/smoke-tech.svg',
    sniper:'assets/weapons/fp/sniper-tech.svg'
  }),
  // Generated FPS renders are player-only DOM presentation. Bots keep procedural
  // Three.js weapon models; world pickups use a separate DOM-projection layer.
  generatedFirstPersonWeapons:Object.freeze({
    pistol:'assets/ui/weapons/fp/player-pistol-fps-01.webp',
    shotgun:'assets/ui/weapons/fp/player-shotgun-fps-01.webp',
    rifle:'assets/ui/weapons/fp/player-rifle-fps-01.webp',
    rocket:'assets/ui/weapons/fp/player-rocket-fps-01.webp',
    plasma:'assets/ui/weapons/fp/player-plasma-fps-01.webp',
    mine:'assets/ui/weapons/fp/player-mine-fps-01.webp',
    bomb:'assets/ui/weapons/fp/player-bomb-fps-01.webp',
    smoke:'assets/ui/weapons/fp/player-smoke-fps-01.webp',
    sniper:'assets/ui/weapons/fp/player-sniper-fps-01.webp',
    grenade:'assets/ui/weapons/fp/player-grenade-fps-20.svg'
  }),
  // Generated map-pickup art stays DOM-only: pickups.js projects the real 3D
  // pickup position into screen space and keeps the procedural world model as fallback.
  generatedWorldWeaponPickups:Object.freeze({
    pistol:'assets/ui/pickups/weapons/world-pistol-pickup-01.webp',
    shotgun:'assets/ui/pickups/weapons/world-shotgun-pickup-01.webp',
    rifle:'assets/ui/pickups/weapons/world-rifle-pickup-01.webp',
    rocket:'assets/ui/pickups/weapons/world-rocket-pickup-01.webp',
    plasma:'assets/ui/pickups/weapons/world-plasma-pickup-01.webp',
    mine:'assets/ui/pickups/weapons/world-mine-pickup-01.webp',
    bomb:'assets/ui/pickups/weapons/world-bomb-pickup-01.webp',
    smoke:'assets/ui/pickups/weapons/world-smoke-pickup-01.webp',
    sniper:'assets/ui/pickups/weapons/world-sniper-pickup-01.webp',
    grenade:'assets/ui/pickups/weapons/world-grenade-pickup-20.svg'
  }),
  firstPersonSkins:Object.freeze({
    pistol:'assets/weapons/fp/pistol-skin.svg',
    shotgun:'assets/weapons/fp/shotgun-skin.svg',
    rifle:'assets/weapons/fp/rifle-skin.svg',
    rocket:'assets/weapons/fp/rocket-skin.svg',
    plasma:'assets/weapons/fp/plasma-skin.svg',
    mine:'assets/weapons/fp/mine-skin.svg',
    bomb:'assets/weapons/fp/bomb-skin.svg',
    smoke:'assets/weapons/fp/smoke-skin.svg',
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
  ...Object.values(GAME_ASSETS.presentationHud),
  ...Object.values(GAME_ASSETS.presentationHudV2),
  ...Object.values(GAME_ASSETS.presentationHudV3),
  ...Object.values(GAME_ASSETS.presentationHudV4),
  ...Object.values(GAME_ASSETS.firstPersonWeapons),
  ...Object.values(GAME_ASSETS.generatedFirstPersonWeapons),
  ...Object.values(GAME_ASSETS.generatedWorldWeaponPickups),
  ...Object.values(GAME_ASSETS.firstPersonSkins),
  ...Object.values(GAME_ASSETS.ui),
  ...Object.values(GAME_ASSETS.presentation)
]);

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
function spawnProtectionPresentationFrame(index){
  const i=Math.max(0,Math.min(6,Math.floor(Number(index)||0)));
  return presentationAtlasFrame(GAME_ASSETS.presentationHudV2.spawnProtection,i%4,Math.floor(i/4),4,2);
}
function respawnCountdownPresentationFrame(seconds){
  const sec=Math.max(1,Math.min(15,Math.ceil(Number(seconds)||1))),i=15-sec;
  return presentationAtlasFrame(GAME_ASSETS.presentationHudV2.respawnCountdown,i%4,Math.floor(i/4),4,4);
}
function explosiveFusePresentationFrame(state){
  const pos={safe:[0,0],arming:[1,0],armed:[0,1],danger:[1,1]}[state]||[0,0];
  return presentationAtlasFrame(GAME_ASSETS.presentationHudV2.explosiveFuse,pos[0],pos[1],2,2);
}
function projectileTrailPresentationFrame(kind){
  const row={ballistic:0,sniper:1,plasma:2,rocket:3,impact:4}[kind];
  return Number.isInteger(row)?presentationAtlasFrame(GAME_ASSETS.presentationHudV2.projectileTrails,0,row,1,5):null;
}
function rocketFlightPresentationFrame(index=0){
  const frame=Math.max(0,Math.min(11,Math.floor(Number(index)||0)));
  return presentationAtlasFrame(GAME_ASSETS.presentationVfx.pack28RocketFlight,frame%4,Math.floor(frame/4),4,3);
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
  sniperPressure:Object.freeze({row:1,frames:6,duration:.30,size:158}),
  shotgunMuzzle:Object.freeze({row:2,frames:8,duration:.46,size:176}),
  brassCasing:Object.freeze({row:3,frames:8,duration:.54,size:76}),
  shotgunShell:Object.freeze({row:4,frames:6,duration:.56,size:86}),
  magazineDrop:Object.freeze({row:5,frames:8,duration:.72,size:104}),
  concreteImpact:Object.freeze({row:6,frames:8,duration:.50,size:112}),
  metalImpact:Object.freeze({row:7,frames:8,duration:.38,size:116}),
  woodImpact:Object.freeze({row:8,frames:5,duration:.46,size:118}),
  nearMiss:Object.freeze({row:9,frames:5,duration:.25,size:170}),
  rocketExplosion:Object.freeze({asset:'rocketExplosion',cols:4,rows:3,frames:12,duration:1.00,size:260}),
  plasmaImpact:Object.freeze({asset:'plasmaImpact',cols:4,rows:3,frames:12,duration:.82,size:190}),
  plasmaReload:Object.freeze({asset:'plasmaReload',cols:4,rows:2,frames:8,duration:1.05,width:286,height:161}),
  ricochet:Object.freeze({asset:'pack12',row:0,cols:8,rows:5,frames:8,duration:.62,size:148}),
  penetrationExit:Object.freeze({asset:'pack12',row:1,cols:8,rows:5,frames:8,duration:.78,size:134}),
  smokeDeploy:Object.freeze({asset:'pack12',row:2,cols:8,rows:5,frames:8,duration:1.40,size:260}),
  mineDetonation:Object.freeze({asset:'pack12',row:3,cols:8,rows:5,frames:8,duration:.82,size:236}),
  bombDetonation:Object.freeze({asset:'pack12',row:4,cols:8,rows:5,frames:8,duration:1.08,size:300}),
  botMuzzle:Object.freeze({asset:'pack13',row:0,cols:8,rows:2,frames:8,duration:.38,size:154}),
  botDeath:Object.freeze({asset:'pack13',row:1,cols:8,rows:2,frames:8,duration:.95,size:232}),
  criticalHit:Object.freeze({asset:'pack14',row:0,cols:8,rows:2,frames:8,duration:.70,size:184}),
  playerArmorBreak:Object.freeze({asset:'pack14',row:1,cols:8,rows:2,frames:8,duration:.90,size:286}),
  fragGrenade:Object.freeze({asset:'pack15Frag',row:0,cols:8,rows:1,frames:8,duration:.82,size:248}),
  botPlasmaMuzzle:Object.freeze({asset:'pack16',row:0,cols:8,rows:3,frames:8,duration:.54,size:176}),
  botDodge:Object.freeze({asset:'pack16',row:1,cols:8,rows:3,frames:8,duration:.82,size:188}),
  botSpawn:Object.freeze({asset:'pack16',row:2,cols:8,rows:3,frames:8,duration:1.18,size:238}),
  botReload:Object.freeze({asset:'pack17',row:0,cols:8,rows:3,frames:8,duration:.68,size:178}),
  botHit:Object.freeze({asset:'pack17',row:1,cols:8,rows:3,frames:8,duration:.40,size:148}),
  pickupCollect:Object.freeze({asset:'pack17',row:2,cols:8,rows:3,frames:8,duration:.72,size:174}),
  shotgunShellInsert:Object.freeze({asset:'pack18',row:0,cols:4,rows:7,frames:8,duration:.36,width:118,height:118}),
  footstepMetal:Object.freeze({asset:'pack18',row:2,cols:4,rows:7,frames:4,duration:.40,size:132}),
  footstepDust:Object.freeze({asset:'pack18',row:3,cols:4,rows:7,frames:4,duration:.52,size:138}),
  footstepWater:Object.freeze({asset:'pack18',row:4,cols:4,rows:7,frames:4,duration:.58,size:146}),
  medkitHeal:Object.freeze({asset:'pack18',row:5,cols:4,rows:7,frames:4,duration:.72,size:228}),
  medkitArmor:Object.freeze({asset:'pack18',row:6,cols:4,rows:7,frames:4,duration:.78,size:228}),
  landingDust:Object.freeze({asset:'pack19Landing',row:0,cols:4,rows:4,frames:8,duration:.58,width:260,height:173}),
  landingMetal:Object.freeze({asset:'pack19Landing',row:2,cols:4,rows:4,frames:8,duration:.54,width:260,height:173}),
  smokeThrow:Object.freeze({asset:'pack19SmokeThrow',row:0,cols:4,rows:2,frames:8,duration:.52,size:430}),
  grenadeThrow:Object.freeze({asset:'pack20GrenadeThrow',row:0,cols:4,rows:2,frames:8,duration:.58,size:430}),
  bombArm:Object.freeze({asset:'pack20BombArm',row:0,cols:4,rows:2,frames:8,duration:.72,size:430}),
  grenadeFlight:Object.freeze({asset:'pack21GrenadeMotion',row:0,cols:8,rows:2,frames:8,duration:1.82,size:116}),
  grenadeFuse:Object.freeze({asset:'pack21GrenadeMotion',row:1,cols:8,rows:2,frames:8,duration:.78,size:134}),
  grenadeExplosion21:Object.freeze({asset:'pack21GrenadeBlast',row:0,cols:4,rows:4,frames:8,duration:.76,size:306}),
  grenadeSmoke21:Object.freeze({asset:'pack21GrenadeBlast',row:2,cols:4,rows:4,frames:8,duration:1.35,size:286}),
  grenadeDebris21:Object.freeze({asset:'pack21GrenadeDebris',row:0,cols:8,rows:3,frames:16,duration:.92,size:260}),
  grenadeScorch21:Object.freeze({asset:'pack21GrenadeDebris',row:2,cols:8,rows:3,frames:5,duration:2.60,size:180}),
  rifleReloadTactical:Object.freeze({asset:'pack22RifleReload',row:0,cols:4,rows:3,frames:9,sequence:Object.freeze([0,1,2,3,4,5,6,7,11]),duration:1.45,width:450,height:400}),
  rifleReloadEmpty:Object.freeze({asset:'pack22RifleReload',row:0,cols:4,rows:3,frames:12,duration:2.05,width:450,height:400}),
  sniperBoltCycle:Object.freeze({asset:'pack22SniperBolt',row:0,cols:4,rows:3,frames:12,duration:.95,width:500,height:444}),
  sniperMuzzle23:Object.freeze({asset:'pack23SniperShot',row:0,cols:4,rows:4,frames:8,duration:.20,size:360}),
  sniperSmoke23:Object.freeze({asset:'pack23SniperShot',row:2,cols:4,rows:4,frames:8,duration:.46,size:300}),
  sniperBullet23:Object.freeze({asset:'pack23SniperBallistics',row:0,cols:4,rows:4,frames:8,duration:.11,size:520}),
  sniperSupersonic23:Object.freeze({asset:'pack23SniperBallistics',row:2,cols:4,rows:4,frames:8,duration:.14,size:540}),
  sniperCasing23:Object.freeze({asset:'pack23SniperCasing',row:0,cols:4,rows:3,frames:12,duration:.55,size:180}),
  rocketReload24:Object.freeze({asset:'pack24RocketReload',row:0,cols:4,rows:3,frames:12,duration:2.85,width:450,height:338}),
  mineThrow24:Object.freeze({asset:'pack24MineThrow',row:0,cols:6,rows:1,frames:6,duration:.58,width:430,height:323}),
  pistolReloadTactical25:Object.freeze({asset:'pack25PistolReload',row:0,cols:4,rows:3,frames:9,sequence:Object.freeze([0,1,2,3,4,5,6,7,11]),duration:1.10,width:450,height:338}),
  pistolReloadEmpty25:Object.freeze({asset:'pack25PistolReload',row:0,cols:4,rows:3,frames:12,duration:1.35,width:450,height:338}),
  shotgunPump25:Object.freeze({asset:'pack25ShotgunPump',row:0,cols:4,rows:2,frames:8,duration:.62,width:450,height:338}),
  ballisticDischarge26:Object.freeze({asset:'pack26Discharge',row:0,cols:4,rows:2,frames:4,duration:.18,width:220,height:165}),
  energyDischarge26:Object.freeze({asset:'pack26Discharge',row:1,cols:4,rows:2,frames:4,duration:.24,width:236,height:177}),
  heavyExplosion26:Object.freeze({asset:'pack26HeavyExplosion',row:0,cols:4,rows:2,frames:8,duration:1.12,width:280,height:210}),
  playerRespawnGate27:Object.freeze({asset:'pack27RespawnGate',row:0,cols:3,rows:2,frames:6,duration:1.18,width:460,height:460}),
  terminalArc27:Object.freeze({asset:'pack27TerminalArc',row:0,cols:5,rows:2,frames:10,duration:1.05,width:180,height:240}),
  concreteImpact29:Object.freeze({asset:'pack29SurfaceImpact',row:0,cols:4,rows:4,frames:6,sequence:Object.freeze([0,1,2,2,3,3]),duration:.42,size:136}),
  metalImpact29:Object.freeze({asset:'pack29SurfaceImpact',row:1,cols:4,rows:4,frames:4,sequence:Object.freeze([0,1,2,3]),duration:.28,size:138}),
  techImpact29:Object.freeze({asset:'pack29SurfaceImpact',row:2,cols:4,rows:4,frames:6,sequence:Object.freeze([0,1,1,2,3,3]),duration:.42,size:146}),
  heavyImpact29:Object.freeze({asset:'pack29SurfaceImpact',row:3,cols:4,rows:4,frames:8,sequence:Object.freeze([0,1,1,2,2,3,3,3]),duration:.58,size:158})
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
