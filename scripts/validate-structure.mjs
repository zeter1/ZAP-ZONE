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
  'assets/ui/logo.svg','assets/ui/crosshair.svg','assets/ui/health.svg','assets/ui/armor.svg','assets/ui/xp.svg'
];
const requiredAssets=[...weaponAssets,...visualAssets];
const html=readFileSync('index.html','utf8');

for(const file of ['src/styles/game.css',...requiredScripts,...requiredAssets]){
  if(!existsSync(file))fail('missing '+file);
}
for(const file of requiredScripts){
  if(!html.includes('src="'+file+'"'))fail('index does not load '+file);
}
if(!html.includes('href="src/styles/game.css"'))fail('index does not load game.css');
if(!html.includes('src="assets/ui/logo.svg"'))fail('menu logo asset is not wired');
if(/<style>[\s\S]{200,}<\/style>/i.test(html))fail('large inline style returned');
for(const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)){
  if(match[1].trim().length>120)fail('large inline game script returned');
}

for(const file of requiredAssets){
  const svg=readFileSync(file,'utf8');
  if(!/<svg\b/i.test(svg)||!/<\/svg>\s*$/i.test(svg))fail('invalid SVG envelope: '+file);
}

const catalog=readFileSync('src/assets/catalog.js','utf8');
for(const file of visualAssets){
  if(!catalog.includes(file))fail('visual asset missing from catalog: '+file);
}
const weapons=readFileSync('src/weapons/system.js','utf8');
for(const key of ['pistol','shotgun','rifle','rocket','plasma','mine','bomb','smoke']){
  if(!weapons.includes("weaponDef('"+key+"'"))fail('weapon missing: '+key);
}
if(!weapons.includes('function createWeaponModel'))fail('shared weapon model factory missing');

const engine=readFileSync('src/core/engine.js','utf8');
for(const token of ['GAME_ASSETS.environment.crate','GAME_ASSETS.environment.hazard','GAME_ASSETS.environment.terminal']){
  if(!engine.includes(token))fail('environment asset not wired: '+token);
}
const pickups=readFileSync('src/entities/pickups.js','utf8');
for(const token of ['GAME_ASSETS.pickups.ammo','GAME_ASSETS.pickups.medkit','WORLD_WEAPON_PICKUPS',"type:'weapon'"]){
  if(!pickups.includes(token))fail('pickup visual/runtime missing: '+token);
}
const css=readFileSync('src/styles/game.css','utf8');
for(const asset of ['crosshair.svg','health.svg','armor.svg','xp.svg']){
  if(!css.includes(asset))fail('HUD asset not wired: '+asset);
}
if(!process.exitCode)console.log('ZAP ZONE structure and asset validation passed.');
