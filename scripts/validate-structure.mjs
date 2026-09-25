import { existsSync, readFileSync } from 'node:fs';

const fail=message=>{console.error('VALIDATION ERROR:',message);process.exitCode=1;};
const requiredScripts=[
  'src/assets/catalog.js','src/core/engine.js','src/weapons/system.js','src/player/state.js',
  'src/settings/settings.js','src/combat/combat.js','src/entities/bots.js','src/entities/pickups.js',
  'src/progression/progression.js','src/game/runtime.js'
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
const requiredAssets=[...weaponAssets,...visualAssets,...perkIconAssets];
const html=readFileSync('index.html','utf8');

for(const file of ['src/styles/game.css',...requiredScripts,...requiredAssets,...audioAssets])if(!existsSync(file))fail('missing '+file);
for(const file of requiredScripts)if(!html.includes('src="'+file+'"'))fail('index does not load '+file);
if(!html.includes('href="src/styles/game.css"'))fail('index does not load game.css');
for(const token of ['id="combat-medal"','id="status-icons"','id="armor-break-fx"','id="hitmarker"','id="damage-direction"','id="threat-direction"','id="settings-modal"','id="fps-counter"','id="sniper-scope"','id="frontline-objective"','id="frontline-track"','id="frontline-bearing"']){
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
for(const file of audioAssets){
  const wav=readFileSync(file);
  if(wav.length<44||wav.subarray(0,4).toString()!=='RIFF'||wav.subarray(8,12).toString()!=='WAVE')fail('invalid WAV asset: '+file);
}

const catalog=readFileSync('src/assets/catalog.js','utf8');
for(const file of [...visualAssets,...perkIconAssets])if(!catalog.includes(file))fail('asset missing from catalog: '+file);
if(!catalog.includes('function perkAsset(id,path)'))fail('per-id perk asset resolver missing');
if(!catalog.includes('firstPersonWeapons:Object.freeze'))fail('first-person weapon asset catalog missing');
if(!catalog.includes('firstPersonSkins:Object.freeze'))fail('first-person weapon skin catalog missing');
if(catalog.includes('crosshair.svg'))fail('legacy static gameplay crosshair must not be catalogued');
if(existsSync('assets/ui/crosshair.svg'))fail('legacy static gameplay crosshair file must be removed');

const progression=readFileSync('src/progression/progression.js','utf8');
for(const token of ['perkAsset(p.id,p.path)','perkAsset(perk.id,perk.path)','function showCombatMedal','function showKillMedal','function updateStatusIcons','function showArmorBreakFx','function updateWeaponStateHUD',"w.hitscan?'МГНОВЕННО'","playHitImpactSound(armorImpact?'armor':'body'"]){
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
for(const token of ['FP_HAND_POSES','FP_DECAL_TUNING','FP_MODEL_TUNING','function addFirstPersonWeaponDecal','GAME_ASSETS.firstPersonWeapons','GAME_ASSETS.firstPersonSkins','addFirstPersonHands(gunGrp,w.key)','if(mode===\'firstPerson\'&&detail>1)','model.add(flashM)']){
  if(!weapons.includes(token))fail('premium first-person weapon presentation missing: '+token);
}
if(!weapons.includes("el.style.display=owned&&!selectable?'none':''"))fail('empty owned weapons must disappear from the weapon bar');
const rifleStart=weapons.indexOf("weaponDef('rifle'");
const rifleEnd=weapons.indexOf('})',rifleStart);
const rifleDef=rifleStart>=0&&rifleEnd>rifleStart?weapons.slice(rifleStart,rifleEnd):'';
if(!rifleDef.includes("aimMode:'scope'")||!rifleDef.includes("scopeAsset:'assets/ui/rifle-scope.svg'"))fail('assault rifle must use its RMB optical scope');
const shotgunStart=weapons.indexOf("weaponDef('shotgun'");
const shotgunEnd=weapons.indexOf('})',shotgunStart);
const shotgunDef=shotgunStart>=0&&shotgunEnd>shotgunStart?weapons.slice(shotgunStart,shotgunEnd):'';
if(shotgunDef.includes("aimMode:'scope'"))fail('shotgun must not use rifle/sniper scope');


const settings=readFileSync('src/settings/settings.js','utf8');
for(const token of ['function playSfx','GAME_AUDIO_ASSETS','function playBufferSfx','function combatAcousticProfile','function playWeaponTail','function playSniperCrack','function footstepSurfaceAt','function playFootstepSound','function tickPlayerFootsteps','function playHitImpactSound','function playWeaponMechanicSound','function startBattlefieldAmbience','function playerSuppressionSpreadPenalty','function registerPlayerSuppression','function playWeaponShotSound','function playSurfaceImpactSound','distant.distance>38','function playExplosionSound','function playWhizSound','function showHitMarker','function showDamageDirection','function showThreatDirection','function tickGamePresentation','function lookSensitivityMultiplier',"w.aimMode==='scope'","case 'equip'","case 'shell'","case 'ricochet'","case 'whiz'"]){
  if(!settings.includes(token))fail('settings/presentation integration missing: '+token);
}

const pickups=readFileSync('src/entities/pickups.js','utf8');
for(const token of ['WORLD_WEAPON_KEYS=WEAPONS.map','function randomWeaponReserve','grantWeapon(idx,reserveGrant)','relocateWeaponPickup(pk)']){
  if(!pickups.includes(token))fail('dynamic weapon pickup economy missing: '+token);
}
if(pickups.includes("type:'ammo'"))fail('standalone ammo pickups must not spawn');
if(pickups.includes("type:'bomb'"))fail('bomb must use the same weapon pickup/reserve economy');

const combat=readFileSync('src/combat/combat.js','utf8');
for(const token of ['function spawnPlayerBullet','function spawnEnemyBullet','function destroyEnemyBullet','MAX_ENEMY_BULLETS=260','MAX_ACTIVE_ENEMY_TRACERS','enemyTracerPool','function acquireEnemyTracer','function releaseEnemyTracer','function enemyTracerVisible','function projectileWallEnergy','function tryProjectileWallPenetration','wallEnergy:projectileWallEnergy(w,true)','wallEnergy:projectileWallEnergy(w,false)','wallPenetrations<2','function hitPlayerByEnemyBullet','closestPointOnBulletSegment','Bot firearm projectiles use the same swept-segment principle','function spawnBotSmokeGrenade','function spawnBotFragGrenade','function tickBotGrenades','mapImpactMaterial(wallHit?.object)','playSurfaceImpactSound(surface','function fireInstantSniper','const pRkts=[],eRkts=[],pTrs=[],pBullets=[],eBullets=[],botGrenades=[]','swept segment collision',"w.aimMode==='scope'",'if(w.hitscan)fireInstantSniper','window.addEventListener(\'blur\'','maxRange=120','function effectiveWeaponSpread','playerSuppressionSpreadPenalty','function weaponActionBlocked','function completePlayerReloadStep','function cancelPlayerReload',"reloadMode==='shell'",'oneShotEligible:true','w.oneShot&&b.oneShotEligible','playWeaponShotSound(w.key','playWeaponMechanicSound(\'reload\'','playWeaponMechanicSound(\'bolt\'','playExplosionSound(pos',"zone='body'","playHitImpactSound(hd?'head':hitZone"]){
  if(!combat.includes(token))fail('combat ballistics/handling integration missing: '+token);
}
if(!combat.includes("document.addEventListener('wheel'")||!combat.includes('cycleOwnedWeapon(e.deltaY>0?1:-1)'))fail('mouse wheel must cycle owned weapons only');
for(const token of ['if(ammo<=0&&uAmmo<=0)updateWeaponBar();','weaponReserveValue(mineIdx)<=0)updateWeaponBar();','weaponReserveValue(bombIdx)<=0)updateWeaponBar();','weaponReserveValue(smokeIdx)<=0)updateWeaponBar();']){
  if(!combat.includes(token))fail('depleted weapon bar retirement missing: '+token);
}


const bots=readFileSync('src/entities/bots.js','utf8');
if(!bots.includes("if(wp.hitscan)spawnInstantSniperTrace"))fail('bot SR-9 must use instant hitscan trace');
if(!bots.includes('function botShotClosestApproachToPlayer')||!bots.includes('registerPlayerSuppression(this,wp,approach.point'))fail('physical enemy near-miss suppression integration missing');
if(!bots.includes('GAME_ASSETS.characters.allyMark')||!bots.includes('Extra readability'))fail('new bot armor markings/visor missing');
if(!bots.includes('this.weaponPivot.userData.pose||'))fail('locomotion must preserve per-weapon bot pose');
for(const token of ['this.armRig=built.armRig','function solveBotTwoBoneArm','function updateBotWeaponHands','mesh.localToWorld(_BOT_GRIP_R)','updateBotWeaponHands(this);']){
  if(!bots.includes(token))fail('realistic two-hand bot weapon hold missing: '+token);
}
for(const token of ['pose.elbowR','const strideBob','const hipSway','this.pts[0].position.y=1.82+strideBob*.55']){
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

for(const token of ['function pickPlayerRespawnPoint()',"pushKillFeed(","this.targetEn.team"]){
  if(!bots.includes(token))fail('continuous team battle/kill feed bot integration missing: '+token);
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
  'findFlankPoint(target',
  'registerSuppression(source',
  "case 'flank'",
  "case 'support'",
  "this.tacticalMode==='suppress'",
  'botRoleLabel(this.role)'
]){
  if(!bots.includes(token))fail('Tactical AI 2.0 integration missing: '+token);
}
if(!combat.includes("bot.tacticalMode==='suppress'?-26"))fail('suppressor-aware player pressure ordering missing');
for(const token of [
  'BOT_MAP_ZONES',
  'function refreshBotMapOrder',
  'function botObjectivePoint',
  "squadPlan.doctrine==='retake'",
  "case 'objective'",
  'plan.aliveDelta=aliveDelta',
  "objectivePull>0&&mapObjective"
]){
  if(!bots.includes(token))fail('Combat AI 2.1 map tactics missing: '+token);
}
for(const token of [
  'PLAYER_TACTICAL_PROFILE',
  'function refreshPlayerTacticalProfile',
  "doctrine==='breach'",
  'plan.recoveryUntil=now+3800',
  "this.commandDoctrine==='breach'",
  'BOT_MOVE_CFG',
  'function clampBotVelocity',
  'function moveBotWithSubsteps',
  'this.unstuckT=.48',
  'const hardCap=total*1.10+.035',
  'Math.min(.28,lvl*.012)'
]){
  if(!bots.includes(token))fail('Combat AI 2.2 / anti-teleport integration missing: '+token);
}
if(bots.includes('this.dodgeSpd=this.speed*(2.35+this.aimSkill*.65)'))fail('legacy teleport-like dodge multiplier returned');
if(bots.includes('this.stuckT=0;this.strafeDir*=-1;this.sideBias*=-1;this.triggerDodge()'))fail('stuck recovery must not trigger high-speed dodge');
for(const token of ['playWeaponShotSound(wp.key','objectiveCoverPenalty','objectivePenalty=Math.max','playObjectiveCaptureSound(team)','function botRoutePenalty','function botShotClosestApproachToPlayer','registerPlayerSuppression(this,wp,approach.point','function botAssaultWaveState','waveStart:-999','assaultWaveState===\'staging\'','coverChainT','objectiveAdvance','playWeaponMechanicSound(\'reload\'','footstepDistance','playFootstepSound(this.group.position','frontlineContested','objectiveUrgency','strategicRetreat']){
  if(!bots.includes(token))fail('Combat Presence 1.2 / Frontline coordination missing: '+token);
}
for(const token of ['breachReady:false','smokeWaveId:-1','fragWaveId:-1','function maybeCoordinateBotUtility','spawnBotSmokeGrenade(bot.getMuzzlePos()','spawnBotFragGrenade(bot.getMuzzlePos()',"this.tacticalMode=squadPlan.suppressor===this","breachRole?'breach'","spawnEnemyBullet(from,pd,wp,this",'this.peekPoint=null;this.peekT=0','let coverGoal=this.coverPoint']){
  if(!bots.includes(token))fail('Combat Presence 1.3 squad/ballistic integration missing: '+token);
}
for(const token of ['function smokeRoutePenalty','function steerBotAroundSmoke','function nearestHostileGrenade','cachedGrenadeThreat','suppressorSince:-999','suppressorGeneration:0','const suppressorEligible=','priorSuppressor','suppressMemory=this.tacticalMode===\'suppress\'','this.doShoot(fireTarget,fireDist,suppressMemory)','this.peekDuration=.92','const peekEnvelope=','targetPeekLean']){
  if(!bots.includes(token))fail('Combat Presence 1.4 tactical awareness missing: '+token);
}
if(!bots.includes('if(wp.hitscan){')||!bots.includes('spawnInstantSniperTrace(from,tracerDir'))fail('bot sniper must remain hitscan while normal guns use travelling bullets');
if(bots.includes("Math.random()<(suppressing?.56:.34)"))fail('legacy random player near-miss whiz returned');
for(const token of ['FRONTLINE_CFG','function tickFrontlineObjective','function serializeFrontlineObjective','function restoreFrontlineObjective','function ensureFrontlineMarker','const frontlineBias=s=>','allyControlScore','enemyControlScore']){
  if(!bots.includes(token))fail('Frontline objective integration missing: '+token);
}
const engine=readFileSync('src/core/engine.js','utf8');
for(const token of ['function spawnCombatImpact','function tickCombatImpactFx','function spawnHeadshotFx','function spawnExplosionFx','BALLISTIC_MATERIAL_PROFILES','function mapImpactMaterial','function mapBallisticProfile','function mapPenetrationInfo',"impactMaterial='concrete'","wall.userData.impactMaterial='metal'","body.userData.impactMaterial='wood'",'IMPACT_MARK_MAX=56','impactMarkPool','function wallImpact(pos,col,material=\'concrete\',normal=null)']){
  if(!engine.includes(token))fail('engine FX/material/penetration integration missing: '+token);
}

const runtime=readFileSync('src/game/runtime.js','utf8');
if(!runtime.includes('botRoleLabel(e.role)'))fail('ally panel tactical role label missing');
for(const token of ["botDoctrineLabel(plan.doctrine)","plan.zone?.label","ПРИКАЗ:"]){
  if(!runtime.includes(token))fail('ally map-order HUD missing: '+token);
}
if(!runtime.includes('tickCombatImpactFx(dt)'))fail('combat impact runtime tick missing');
if(!runtime.includes('tickFrontlineObjective(dt,ts)'))fail('Frontline objective runtime tick missing');
if(!runtime.includes('tickPlayerFootsteps(playerMoved,sprintingNow,onGnd)'))fail('distance-driven player footsteps missing');
if(!runtime.includes('tickGamePresentation('))fail('settings presentation runtime tick missing');
if(!runtime.includes('activeW.scopeAsset||GAME_ASSETS.ui.sniperScope'))fail('per-weapon scope asset switching missing');
if(runtime.includes('setWeaponAmmo(SMOKE_WEAPON_INDEX,1)'))fail('smoke cooldown must not generate free ammo');
if(!runtime.includes('ensureCurrentWeaponUsable();'))fail('runtime must auto-switch away from depleted current weapon');
for(const token of ["fireW.automatic","scopedWeapon=activeW.aimMode==='scope'","adsWanted=!IS_TOUCH&&scopedWeapon&&zooming","scopeActive||scopedWeapon","recoilReturn=activeW.recoilReturn","weaponBloom=Math.max","shotResetT>0","weaponEquipT>0","sprintExitT>0","const sprintingNow=wantsSprint","cycleKind==='pump'","cycleKind==='bolt'","completePlayerReloadStep()","updateWeaponStateHUD()","ejectCasing(casingPos"]){if(!runtime.includes(token))fail('runtime weapon lifecycle missing: '+token);}

const css=readFileSync('src/styles/game.css','utf8');
for(const token of ['#combat-medal','#status-icons','#armor-break-fx','combatMedalPop','#hitmarker','#damage-direction','#threat-direction','#settings-modal','#sniper-scope','sniperScopeKick','.xh-arm','#wstate','#frontline-objective','#frontline-track','#frontline-bearing','one authoritative gameplay reticle']){
  if(!css.includes(token))fail('CSS visual integration missing: '+token);
}
if(css.includes('crosshair.svg'))fail('CSS must not render legacy SVG crosshair');
if(!css.includes('#xp-wrap{position:absolute;top:18px;left:18px;transform:none'))fail('level/XP HUD must stay clear of the centered weapon bar');
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
if(!html.includes('ZAP ZONE v23.2'))fail('index version is not v23.2');
if(!process.exitCode)console.log('ZAP ZONE v23.2 Combat Presence 1.4 validation passed.');
