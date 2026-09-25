import { existsSync, readFileSync } from 'node:fs';

const fail=message=>{console.error('VALIDATION ERROR:',message);process.exitCode=1;};
const requiredScripts=[
  'src/assets/catalog.js','src/core/engine.js','src/weapons/system.js','src/player/state.js',
  'src/combat/combat.js','src/entities/bots.js','src/entities/pickups.js',
  'src/progression/progression.js','src/game/runtime.js'
];
const weaponAssets=['pistol.svg','shotgun.svg','rifle.svg','rocket.svg','plasma.svg','mine.svg','bomb.svg','smoke.svg']
  .map(name=>'assets/weapons/'+name);
const visualAssets=[
  'assets/pickups/ammo.svg','assets/pickups/medkit.svg',
  'assets/environment/crate.svg','assets/environment/hazard.svg','assets/environment/terminal.svg',
  'assets/environment/foliage.svg','assets/environment/water.svg',
  'assets/characters/ally-emblem.svg','assets/characters/enemy-emblem.svg',
  'assets/perks/assault.svg','assets/perks/precision.svg','assets/perks/survival.svg','assets/perks/mobility.svg','assets/perks/demolition.svg',
  'assets/fx/headshot.svg','assets/fx/headshot-kill.svg','assets/fx/explosion.svg','assets/fx/levelup.svg','assets/fx/skull.svg',
  'assets/ui/logo.svg','assets/ui/crosshair.svg','assets/ui/health.svg','assets/ui/armor.svg','assets/ui/xp.svg'
];
const requiredAssets=[...weaponAssets,...visualAssets];
const html=readFileSync('index.html','utf8');

for(const file of ['src/styles/game.css',...requiredScripts,...requiredAssets])if(!existsSync(file))fail('missing '+file);
for(const file of requiredScripts)if(!html.includes('src="'+file+'"'))fail('index does not load '+file);
if(!html.includes('href="src/styles/game.css"'))fail('index does not load game.css');
if(!html.includes('src="assets/ui/logo.svg"'))fail('menu logo asset is not wired');
if(!html.includes('assets/fx/headshot.svg')||!html.includes('assets/fx/levelup.svg')||!html.includes('assets/fx/skull.svg'))fail('combat HUD assets are not wired');
if(/<style>[\s\S]{200,}<\/style>/i.test(html))fail('large inline style returned');
for(const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)){
  if(match[1].trim().length>120)fail('large inline game script returned');
}
for(const file of requiredAssets){
  const svg=readFileSync(file,'utf8');
  if(!/<svg\b/i.test(svg)||!/<\/svg>\s*$/i.test(svg))fail('invalid SVG envelope: '+file);
}

const catalog=readFileSync('src/assets/catalog.js','utf8');
for(const file of visualAssets)if(!catalog.includes(file))fail('visual asset missing from catalog: '+file);

const weapons=readFileSync('src/weapons/system.js','utf8');
for(const key of ['pistol','shotgun','rifle','rocket','plasma','mine','bomb','smoke']){
  if(!weapons.includes("weaponDef('"+key+"'"))fail('weapon missing: '+key);
}
if(!weapons.includes('function createWeaponModel'))fail('shared weapon model factory missing');

const engine=readFileSync('src/core/engine.js','utf8');
for(const token of [
  'GAME_ASSETS.environment.crate','GAME_ASSETS.environment.hazard','GAME_ASSETS.environment.terminal',
  'GAME_ASSETS.environment.foliage','GAME_ASSETS.environment.water',
  'function spawnHeadshotFx','function tickHeadshotFx','function spawnExplosionFx','function tickExplosionFx','function tickEnvironment'
]){
  if(!engine.includes(token))fail('engine visual integration missing: '+token);
}
const bots=readFileSync('src/entities/bots.js','utf8');
if(!bots.includes('GAME_ASSETS.characters.enemy')||!bots.includes('Decorative armor'))fail('bot visual layer missing');

const progression=readFileSync('src/progression/progression.js','utf8');
if(!progression.includes('perkAsset(p.path)'))fail('perk SVG cards missing');

const combat=readFileSync('src/combat/combat.js','utf8');
if(!combat.includes('lethalHeadshot')||!combat.includes('spawnHeadshotFx(hitFx,lethalHeadshot)')||!combat.includes('HEADSHOT KILL'))fail('headshot kill finisher missing');

const runtime=readFileSync('src/game/runtime.js','utf8');
if(!runtime.includes('tickHeadshotFx(dt)')||!runtime.includes('tickExplosionFx(dt)')||!runtime.includes('tickEnvironment(dt)'))fail('visual runtime ticks missing');

const css=readFileSync('src/styles/game.css','utf8');
for(const asset of ['crosshair.svg','health.svg','armor.svg','xp.svg'])if(!css.includes(asset))fail('HUD asset not wired: '+asset);
if(!css.includes('zapHeadshotKill')||!css.includes('#hs-kill-flash'))fail('headshot kill CSS animation missing');

if(!process.exitCode)console.log('ZAP ZONE structure, assets and headshot finisher validation passed.');
