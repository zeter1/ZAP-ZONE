import { existsSync, readFileSync } from 'node:fs';

const fail = message => { console.error('VALIDATION ERROR:', message); process.exitCode = 1; };
const requiredScripts = [
  'src/core/engine.js','src/weapons/system.js','src/player/state.js','src/combat/combat.js',
  'src/entities/bots.js','src/entities/pickups.js','src/progression/progression.js','src/game/runtime.js'
];
const requiredAssets = ['pistol.svg','shotgun.svg','rifle.svg','rocket.svg','plasma.svg','mine.svg','bomb.svg','smoke.svg']
  .map(name => 'assets/weapons/' + name);
const html = readFileSync('index.html','utf8');

for (const file of ['src/styles/game.css',...requiredScripts,...requiredAssets]) if (!existsSync(file)) fail('missing ' + file);
for (const file of requiredScripts) if (!html.includes('src="' + file + '"')) fail('index does not load ' + file);
if (!html.includes('href="src/styles/game.css"')) fail('index does not load game.css');
if (/<style>[\s\S]{200,}<\/style>/i.test(html)) fail('large inline style returned');
for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
  if (match[1].trim().length > 120) fail('large inline game script returned');
}
const weapons=readFileSync('src/weapons/system.js','utf8');
for (const key of ['pistol','shotgun','rifle','rocket','plasma','mine','bomb','smoke']) {
  if (!weapons.includes("weaponDef('" + key + "'")) fail('weapon missing: ' + key);
}
if (!weapons.includes('function createWeaponModel')) fail('shared weapon model factory missing');
const pickups=readFileSync('src/entities/pickups.js','utf8');
if (!pickups.includes('WORLD_WEAPON_PICKUPS')) fail('world weapon pickups missing');
if (!pickups.includes("type:'weapon'")) fail('weapon pickup runtime missing');
if (!process.exitCode) console.log('ZAP ZONE structure validation passed.');
