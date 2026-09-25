import { existsSync, readFileSync } from 'node:fs';

const fail=message=>{console.error('VALIDATION ERROR:',message);process.exitCode=1;};
const requiredScripts=[
  'src/assets/catalog.js','src/core/engine.js','src/weapons/system.js','src/player/state.js',
  'src/settings/settings.js','src/combat/combat.js','src/entities/bots.js','src/entities/pickups.js',
  'src/progression/progression.js','src/game/runtime.js'
];
const weaponAssets=['pistol.svg','shotgun.svg','rifle.svg','rocket.svg','plasma.svg','mine.svg','bomb.svg','smoke.svg','sniper.svg']
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
  'assets/characters/ally-armor-mark.svg','assets/characters/enemy-armor-mark.svg',
  'assets/perks/assault.svg','assets/perks/precision.svg','assets/perks/survival.svg','assets/perks/mobility.svg','assets/perks/demolition.svg',
  'assets/fx/headshot.svg','assets/fx/headshot-kill.svg','assets/fx/explosion.svg','assets/fx/levelup.svg','assets/fx/skull.svg',
  'assets/fx/bullet-hit.svg','assets/fx/wall-impact.svg','assets/fx/plasma-impact.svg','assets/fx/sniper-shot.svg','assets/fx/rocket-impact.svg','assets/fx/critical-hit.svg','assets/fx/armor-break.svg',
  'assets/medals/first-blood.svg','assets/medals/double-kill.svg','assets/medals/triple-kill.svg','assets/medals/multikill.svg','assets/medals/killing-spree.svg','assets/medals/longshot.svg','assets/medals/critical-kill.svg','assets/medals/explosive-kill.svg',
  'assets/status/second-wind.svg','assets/status/lifesteal.svg','assets/status/armor-regen.svg','assets/status/low-health.svg','assets/status/smoke-guard.svg','assets/status/crit-ready.svg',
  'assets/ui/logo.svg','assets/ui/health.svg','assets/ui/armor.svg','assets/ui/xp.svg','assets/ui/sniper-scope.svg','assets/ui/rifle-scope.svg'
];
const requiredAssets=[...weaponAssets,...visualAssets,...perkIconAssets];
const html=readFileSync('index.html','utf8');

for(const file of ['src/styles/game.css',...requiredScripts,...requiredAssets])if(!existsSync(file))fail('missing '+file);
for(const file of requiredScripts)if(!html.includes('src="'+file+'"'))fail('index does not load '+file);
if(!html.includes('href="src/styles/game.css"'))fail('index does not load game.css');
for(const token of ['id="combat-medal"','id="status-icons"','id="armor-break-fx"','id="hitmarker"','id="damage-direction"','id="settings-modal"','id="fps-counter"','id="sniper-scope"']){
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
if(catalog.includes('crosshair.svg'))fail('legacy static gameplay crosshair must not be catalogued');
if(existsSync('assets/ui/crosshair.svg'))fail('legacy static gameplay crosshair file must be removed');

const progression=readFileSync('src/progression/progression.js','utf8');
for(const token of ['perkAsset(p.id,p.path)','perkAsset(perk.id,perk.path)','function showCombatMedal','function showKillMedal','function updateStatusIcons','function showArmorBreakFx','function updateWeaponStateHUD',"w.hitscan?'МГНОВЕННО'"]){
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
for(const token of ['STARTING_RESERVE','STARTING_OWNED','BOT_WEAPON_POSES','function addBotWeaponGrip','userData.pose=pose','НЕ НАЙДЕНО']){
  if(!weapons.includes(token))fail('pickup/ownership or bot weapon presentation missing: '+token);
}
const rifleStart=weapons.indexOf("weaponDef('rifle'");
const rifleEnd=weapons.indexOf('})',rifleStart);
const rifleDef=rifleStart>=0&&rifleEnd>rifleStart?weapons.slice(rifleStart,rifleEnd):'';
if(!rifleDef.includes("aimMode:'scope'")||!rifleDef.includes("scopeAsset:'assets/ui/rifle-scope.svg'"))fail('assault rifle must use its RMB optical scope');
const shotgunStart=weapons.indexOf("weaponDef('shotgun'");
const shotgunEnd=weapons.indexOf('})',shotgunStart);
const shotgunDef=shotgunStart>=0&&shotgunEnd>shotgunStart?weapons.slice(shotgunStart,shotgunEnd):'';
if(shotgunDef.includes("aimMode:'scope'"))fail('shotgun must not use rifle/sniper scope');


const settings=readFileSync('src/settings/settings.js','utf8');
for(const token of ['function playSfx','function showHitMarker','function showDamageDirection','function tickGamePresentation','function lookSensitivityMultiplier',"w.aimMode==='scope'","case 'equip'","case 'shell'","case 'ricochet'","case 'whiz'"]){
  if(!settings.includes(token))fail('settings/presentation integration missing: '+token);
}

const pickups=readFileSync('src/entities/pickups.js','utf8');
for(const token of ['WORLD_WEAPON_KEYS=WEAPONS.map','function randomWeaponReserve','grantWeapon(idx,reserveGrant)','relocateWeaponPickup(pk)']){
  if(!pickups.includes(token))fail('dynamic weapon pickup economy missing: '+token);
}
if(pickups.includes("type:'ammo'"))fail('standalone ammo pickups must not spawn');
if(pickups.includes("type:'bomb'"))fail('bomb must use the same weapon pickup/reserve economy');

const combat=readFileSync('src/combat/combat.js','utf8');
for(const token of ['function spawnPlayerBullet','function fireInstantSniper','const pRkts=[],eRkts=[],pTrs=[],pBullets=[]','swept segment collision',"w.aimMode==='scope'",'if(w.hitscan)fireInstantSniper','window.addEventListener(\'blur\'','maxRange=120','function effectiveWeaponSpread','function weaponActionBlocked','function completePlayerReloadStep','function cancelPlayerReload',"reloadMode==='shell'",'oneShotEligible:true','w.oneShot&&b.oneShotEligible',"playSfx('ricochet'"]){
  if(!combat.includes(token))fail('combat ballistics/handling integration missing: '+token);
}

const bots=readFileSync('src/entities/bots.js','utf8');
if(!bots.includes("if(wp.hitscan)spawnInstantSniperTrace"))fail('bot SR-9 must use instant hitscan trace');
if(!bots.includes("playSfx('whiz'"))fail('enemy near-miss whiz feedback missing');
if(!bots.includes('GAME_ASSETS.characters.allyMark')||!bots.includes('Extra readability'))fail('new bot armor markings/visor missing');
if(!bots.includes('this.weaponPivot.userData.pose||'))fail('locomotion must preserve per-weapon bot pose');
for(const token of [
  'this.motionX=0;this.motionZ=0',
  'const responseT=1-Math.exp(-response*dt)',
  'this.gaitPhase+=moved*',
  'const localForward=this.velX*fwdX+this.velZ*fwdZ',
  'if(this.pts[10])',
  'if(this.pts[12])',
  "const combatPose=this.aiState==='engage'&&this.canSeeTarget"
]){
  if(!bots.includes(token))fail('bot locomotion integration missing: '+token);
}

const engine=readFileSync('src/core/engine.js','utf8');
for(const token of ['function spawnCombatImpact','function tickCombatImpactFx','function spawnHeadshotFx','function spawnExplosionFx']){
  if(!engine.includes(token))fail('engine FX missing: '+token);
}

const runtime=readFileSync('src/game/runtime.js','utf8');
if(!runtime.includes('tickCombatImpactFx(dt)'))fail('combat impact runtime tick missing');
if(!runtime.includes('tickGamePresentation('))fail('settings presentation runtime tick missing');
if(!runtime.includes('activeW.scopeAsset||GAME_ASSETS.ui.sniperScope'))fail('per-weapon scope asset switching missing');
if(runtime.includes('setWeaponAmmo(SMOKE_WEAPON_INDEX,1)'))fail('smoke cooldown must not generate free ammo');
for(const token of ["fireW.automatic","scopedWeapon=activeW.aimMode==='scope'","adsWanted=!IS_TOUCH&&scopedWeapon&&zooming","scopeActive||scopedWeapon","recoilReturn=activeW.recoilReturn","weaponBloom=Math.max","shotResetT>0","weaponEquipT>0","sprintExitT>0","const sprintingNow=wantsSprint","cycleKind==='pump'","cycleKind==='bolt'","completePlayerReloadStep()","updateWeaponStateHUD()","ejectCasing(casingPos"]){if(!runtime.includes(token))fail('runtime weapon lifecycle missing: '+token);}

const css=readFileSync('src/styles/game.css','utf8');
for(const token of ['#combat-medal','#status-icons','#armor-break-fx','combatMedalPop','#hitmarker','#damage-direction','#settings-modal','#sniper-scope','sniperScopeKick','.xh-arm','#wstate','one authoritative gameplay reticle']){
  if(!css.includes(token))fail('CSS visual integration missing: '+token);
}
if(css.includes('crosshair.svg'))fail('CSS must not render legacy SVG crosshair');
if((html.match(/id="xhair"/g)||[]).length!==1)fail('gameplay HUD must contain exactly one xhair root');

for(const token of ['let curW=0,lastW=0','function quickSwitchWeapon()','playSfx(\'equip\')','w.cycleTime=Math.max'] ){if(!state.includes(token))fail('player weapon lifecycle missing: '+token);}
for(const token of ['const weaponReserve=STARTING_RESERVE.slice()','const weaponOwned=STARTING_OWNED.slice()','function grantWeapon','function ownsWeapon','weaponReserve:reserves','weaponOwned:weaponOwned.slice()','v:26']){
  if(!state.includes(token))fail('per-weapon ownership/reserve save model missing: '+token);
}
if(!html.includes('id="wstate"'))fail('weapon readiness HUD missing');
if(!html.includes('KeyQ') && !combat.includes("e.code==='KeyQ'"))fail('Q quick switch binding missing');
if(!html.includes('ZAP ZONE v22.2'))fail('index version is not v22.2');
if(!process.exitCode)console.log('ZAP ZONE v22.2 pickup inventory, bot locomotion/presentation and dual-optic validation passed.');
