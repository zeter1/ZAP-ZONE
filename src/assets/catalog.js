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
    sniper:'assets/ui/weapons/fp/player-sniper-fps-01.webp'
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
    sniper:'assets/ui/pickups/weapons/world-sniper-pickup-01.webp'
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
