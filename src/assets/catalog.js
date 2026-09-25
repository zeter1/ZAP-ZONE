'use strict';

// Centralized visual asset catalog. Paths are root-relative to the game URL.
const GAME_ASSETS=Object.freeze({
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
    enemy:'assets/characters/enemy-emblem.svg'
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
  status:Object.freeze({
    secondWind:'assets/status/second-wind.svg',
    lifesteal:'assets/status/lifesteal.svg',
    armorRegen:'assets/status/armor-regen.svg',
    lowHealth:'assets/status/low-health.svg',
    smokeGuard:'assets/status/smoke-guard.svg',
    critReady:'assets/status/crit-ready.svg'
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
  ui:Object.freeze({
    logo:'assets/ui/logo.svg',
    crosshair:'assets/ui/crosshair.svg',
    health:'assets/ui/health.svg',
    armor:'assets/ui/armor.svg',
    xp:'assets/ui/xp.svg',
    sniperScope:'assets/ui/sniper-scope.svg'
  })
});

const GAME_ASSET_PATHS=Object.freeze([
  ...Object.values(GAME_ASSETS.pickups),
  ...Object.values(GAME_ASSETS.environment),
  ...Object.values(GAME_ASSETS.characters),
  ...Object.values(GAME_ASSETS.perks),
  ...Object.values(GAME_ASSETS.perkIcons),
  ...Object.values(GAME_ASSETS.medals),
  ...Object.values(GAME_ASSETS.status),
  ...Object.values(GAME_ASSETS.impact),
  ...Object.values(GAME_ASSETS.fx),
  ...Object.values(GAME_ASSETS.ui)
]);

const _gameTextureLoader=new THREE.TextureLoader();
const _gameTextureCache=new Map();

function gameTexture(path){
  if(_gameTextureCache.has(path))return _gameTextureCache.get(path);
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

function perkAsset(id,path){
  return GAME_ASSETS.perkIcons[id]||GAME_ASSETS.perks[path]||GAME_ASSETS.perks.assault;
}
