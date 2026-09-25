import { existsSync, readFileSync } from 'node:fs';

const fail=message=>{console.error('VALIDATION ERROR:',message);process.exitCode=1;};
const requiredScripts=[
  'src/assets/catalog.js','src/core/engine.js','src/weapons/system.js','src/player/state.js',
  'src/settings/settings.js','src/combat/combat.js','src/entities/bots.js','src/entities/pickups.js',
  'src/progression/progression.js','src/game/runtime.js'
];
const weaponAssets=['pistol.svg','shotgun.svg','rifle.svg','rocket.svg','plasma.svg','mine.svg','bomb.svg','smoke.svg']
  .map(name=>'assets/weapons/'+name);

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
  'assets/perks/assault.svg','assets/perks/precision.svg','assets/perks/survival.svg','assets/perks/mobility.svg','assets/perks/demolition.svg',
  'assets/fx/headshot.svg','assets/fx/headshot-kill.svg','assets/fx/explosion.svg','assets/fx/levelup.svg','assets/fx/skull.svg',
  'assets/fx/bullet-hit.svg','assets/fx/wall-impact.svg','assets/fx/plasma-impact.svg','assets/fx/rocket-impact.svg','assets/fx/critical-hit.svg','assets/fx/armor-break.svg',
  'assets/medals/first-blood.svg','assets/medals/double-kill.svg','assets/medals/triple-kill.svg','assets/medals/multikill.svg','assets/medals/killing-spree.svg','assets/medals/longshot.svg','assets/medals/critical-kill.svg','assets/medals/explosive-kill.svg',
  'assets/status/second-wind.svg','assets/status/lifesteal.svg','assets/status/armor-regen.svg','assets/status/low-health.svg','assets/status/smoke-guard.svg','assets/status/crit-ready.svg',
  'assets/ui/logo.svg','assets/ui/crosshair.svg','assets/ui/health.svg','assets/ui/armor.svg','assets/ui/xp.svg'
];
const requiredAssets=[...weaponAssets,...visualAssets,...perkIconAssets];
const html=readFileSync('index.html','utf8');

for(const file of ['src/styles/game.css',...requiredScripts,...requiredAssets])if(!existsSync(file))fail('missing '+file);
for(const file of requiredScripts)if(!html.includes('src="'+file+'"'))fail('index does not load '+file);
if(!html.includes('href="src/styles/game.css"'))fail('index does not load game.css');
for(const token of ['id="combat-medal"','id="status-icons"','id="armor-break-fx"','id="hitmarker"','id="damage-direction"','id="settings-modal"','id="fps-counter"']){
  if(!html.includes(token))fail('HUD integration missing: '+token);
}
if(/<style>[\s\S]{200,}<\/style>/i.test(html))fail('large inline style returned');
for(const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)){
  if(match[1].trim().length>120)fail('large inline game script returned');
}
for(const file of requiredAssets){
  const svg=readFileSync(file,'utf8');
  if(!/<svg\b/i.test(svg)||!/<\/svg>\s*$/i.test(svg))fail('invalid SVG envelope: '+file);
}

const catalog=readFileSync('src/assets/catalog.js','utf8');
for(const file of [...visualAssets,...perkIconAssets])if(!catalog.includes(file))fail('asset missing from catalog: '+file);
if(!catalog.includes('function perkAsset(id,path)'))fail('per-id perk asset resolver missing');

const progression=readFileSync('src/progression/progression.js','utf8');
for(const token of ['perkAsset(p.id,p.path)','perkAsset(perk.id,perk.path)','function showCombatMedal','function showKillMedal','function updateStatusIcons','function showArmorBreakFx']){
  if(!progression.includes(token))fail('progression visual integration missing: '+token);
}

const settings=readFileSync('src/settings/settings.js','utf8');
for(const token of ['function playSfx','function showHitMarker','function showDamageDirection','function tickGamePresentation','function lookSensitivityMultiplier']){
  if(!settings.includes(token))fail('settings/presentation integration missing: '+token);
}

const combat=readFileSync('src/combat/combat.js','utf8');
for(const token of ['spawnCombatImpact(hitFx','showKillMedal({distance:dist','showKillMedal({explosive:true})',"spawnCombatImpact(pos,'rocket')",'showHitMarker(hitKind)',"playSfx('shoot'",'lookSensitivityMultiplier(zooming)']){
  if(!combat.includes(token))fail('combat visual integration missing: '+token);
}

const engine=readFileSync('src/core/engine.js','utf8');
for(const token of ['function spawnCombatImpact','function tickCombatImpactFx','function spawnHeadshotFx','function spawnExplosionFx']){
  if(!engine.includes(token))fail('engine FX missing: '+token);
}

const runtime=readFileSync('src/game/runtime.js','utf8');
if(!runtime.includes('tickCombatImpactFx(dt)'))fail('combat impact runtime tick missing');
if(!runtime.includes('tickGamePresentation('))fail('settings presentation runtime tick missing');

const css=readFileSync('src/styles/game.css','utf8');
for(const token of ['#combat-medal','#status-icons','#armor-break-fx','combatMedalPop','#hitmarker','#damage-direction','#settings-modal']){
  if(!css.includes(token))fail('CSS visual integration missing: '+token);
}

if(!process.exitCode)console.log('ZAP ZONE v21.9 structure, assets, settings and combat feedback validation passed.');
