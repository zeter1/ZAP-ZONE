'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const read = (file) => fs.readFileSync(path.resolve(__dirname,'..',file),'utf8');
function between(source, start, end) {
  const from=source.indexOf(start);
  const to=source.indexOf(end,from+start.length);
  assert.ok(from>=0 && to>from, start);
  return source.slice(from,to);
}
const noop=()=>{};
const makeStorage=()=>new Map();
const storage=(map)=>({
  getItem:(k)=>map.get(k)??null,
  setItem:(k,v)=>map.set(k,v),
  removeItem:(k)=>map.delete(k),
});
const element=()=>({style:{},classList:{add:noop, remove:noop, contains:()=>false},querySelector:()=>null});
const state=between(read('src/player/state.js'),'const SAVE_KEY=', 'function switchW(');
const progression=read('src/progression/progression.js');
const xpSource=between(progression,'function addXP(', 'function renderPerkChoices(');
const pickSource=between(progression,'function pickPerk(', 'function updatePerkPanel(');
const killSource=between(progression,'function checkDeath(', 'function doRespawn(');
const clearWorldSource=between(progression,'function clearWorldForFreshGame(', 'function restartGameFromScratch(');
const damageSource=between(progression,'function damageLabel(', '// ─── HUD');
const combat=read('src/combat/combat.js');
const keySource=between(combat,'// ─── INPUT', 'function bindMobileControls(');
const key='zap_zone_autosave_v26';
function createHarness(primary=makeStorage(), secondary=makeStorage()) {
  const listeners={};
  const docListeners={};
  const weaps=[{key:'pistol',clip:12,rate:1,reload:1},{key:'rocket',clip:1,rate:10,reload:2.85}];
  const node=element();
  const api={
    G:()=>node, console:{info:noop,error:noop}, window:{addEventListener:(kind,fn)=>listeners[kind]=fn, localStorage:storage(primary),sessionStorage:storage(secondary)},
    document:{querySelector:()=>({content:'24.1'}),addEventListener:(kind,fn)=>docListeners[kind]=fn, hidden:false},
    localStorage:storage(primary),sessionStorage:storage(secondary),
    WEAPONS:weaps,W_DEFAULTS:{clips:[12,1],rates:[1,10],reloads:[1,2.85],cycleTimes:[]},
    STARTING_AMMO:[12,0],STARTING_RESERVE:[40,0],STARTING_OWNED:[true,false],
    weaponAmmo:[12,0],weaponReserve:[40,0],weaponOwned:[true,false],curW:0,lastW:0,ammo:12,uAmmo:40,
    camera:{position:{x:0,z:0,y:1.75}}, yaw:0,pitch:0,prevPX:0,prevPZ:0,PLR_R:.4,collideWalls:(x,z)=>({x,z}),
    plr:{maxHp:100,pathMilestones:new Set()},perksGot:[],level:1,xp:0,score:0,kills:0,allyKills:0,enemyKills:0,
    matchRemaining:480,restoreMatchClock:(seconds)=>{api.matchRemaining=Number.isFinite(seconds)?seconds:480;},hp:100,armor:0,playerMineCD:0,playerBombCD:0,playerSmokeCD:0,
    ROCKET_FIRE_INTERVAL:10,MINE_COOLDOWN_SECONDS:32,BOMB_COOLDOWN_SECONDS:180,SMOKE_COOLDOWN_SECONDS:240,
    mineHudSecond:0,bombHudSecond:0,smokeHudSecond:0,playerRocketShotCD:0,
    inited:true,webglLost:false,preparedSaveLoaded:false,PLAYER_SPAWN_SHIELD_TIME:2,respawnShieldT:0,
    K:{},paused:false,running:true,dying:false,lvlAnnOpen:false,perkPickOpen:false,
    pendingLevels:0,lvlAnnT:0,lvlAnnMax:1,deathReason:'',dyingT:0,PLAYER_RESPAWN_DELAY:5,lastPlayerAttacker:null,
    cancelFragGrenadeThrow:noop,cancelPendingMineThrow:noop,cancelPendingBombPlant:noop,refreshMobileHUD:noop,
    playSfx:noop,showMsg:noop,pushKillFeed:noop,startDeathCamera:noop,updateRespawnCountdownPresentation:noop,
    enemies:[],pickPlayerRespawnPoint:()=>[42,16],applyPlayerSpawn:([x,z])=>{Object.assign(api.camera.position,{x,z});},
    applyPathMilestones:noop,syncCurrentAmmo:noop,buildGun:noop,applyPlayerTestingSettings:noop,showAnn:noop,
    updatePerkPanel:noop,updateStats:noop,buildWeaponBar:noop,updateWeaponBar:noop,wHUD:noop,
    markHUD:noop,flushHUD:noop,xpHUD:noop,updateTeamScore:noop, xpFor:(lvl)=>(lvl-1)*100,
    gameSettings:{},PLAYER_BULLET_DAMAGE_SCALE:1,PLAYER_ROCKET_DAMAGE_SCALE:1,
    playHitImpactSound:noop,showDamageDirection:noop,triggerScreenShake:noop,trigFlash:noop,
    canTakePerk:()=>true,setDamageOverlay:noop,setTimeout:noop,setGameCursorHidden:noop,requestGamePointerLock:noop,IS_TOUCH:false,
    currentPerkChoices:[],perkRerollsLeft:0,
    ALL_PERKS:[{id:'chosen',fn:noop},{id:'secondwind',fn:()=>{api.plr.secondWind=true;api.plr.secondWindReady=true;}}],
  };
  api.getW=()=>weaps[api.curW];
  api.ownsWeapon=(idx)=>api.weaponOwned[idx];
  const context=vm.createContext(api);
  vm.runInContext([state,xpSource,pickSource,killSource,damageSource,keySource].join('\n'),context);
  return { primary, secondary, api, listeners, docListeners, run:(src)=>vm.runInContext(src,context) };
}

test('blur and hiding release input immediately',()=>{
  const {api,listeners,docListeners}=createHarness();
  listeners.keydown({code:'KeyW',key:'w'});
  listeners.blur();
  assert.ok(!api.K.KeyW);
  listeners.keydown({code:'Space',key:' '});
  api.document.hidden=true;
  docListeners.visibilitychange();
  assert.ok(!api.K.Space);
});
test('resuming a death save respawns and restores launcher cooldown',()=>{
  const a=createHarness();
  a.run('curW=1;weaponOwned[1]=true;weaponAmmo[1]=1;weaponReserve[1]=3;playerRocketShotCD=7.5;hp=0;checkDeath();saveProgress(true)');
  assert.equal(a.api.dying,true);
  const saved=JSON.parse(a.primary.get(key));
  const b=createHarness(a.primary,a.secondary);
  b.run('prepareResumeProgress();activatePreparedGame()');
  assert.equal(saved.hp,0);
  assert.equal(b.api.hp,100);
  assert.equal(b.api.camera.position.x,42);
  assert.equal(b.api.dying,false);
  assert.equal(b.api.curW,1);
  assert.equal(b.api.playerRocketShotCD,7.5);
});
test('level-up entitlement survives closing before selection',()=>{
  const a=createHarness();
  a.run('addXP(200);saveProgress(true)');
  assert.equal(a.api.level,3);
  assert.equal(a.api.lvlAnnOpen,true);
  const b=createHarness(a.primary,a.secondary);
  b.run('prepareResumeProgress();activatePreparedGame()');
  assert.equal(b.api.level,3);
  assert.equal(b.api.lvlAnnOpen,true);
  assert.equal(b.api.perkPickOpen,false);
  assert.equal(b.api.pendingLevels,2);
  b.run("lvlAnnOpen=false;perkPickOpen=true;pickPerk({id:'chosen',fn(){}})");
  assert.equal(b.api.pendingLevels,1);
  assert.equal(b.api.lvlAnnOpen,true);
  const c=createHarness(b.primary,b.secondary);
  c.run('prepareResumeProgress();activatePreparedGame()');
  assert.equal(c.api.pendingLevels,1);
  assert.equal(c.api.lvlAnnOpen,true);
  assert.equal(c.api.perksGot.length,1);
});
test('valid tab backup remains usable after corrupt primary save',()=>{
  const a=createHarness();
  a.run('saveProgress(true)');
  assert.equal(a.run('loadProgress()?.v'),27);
  a.primary.set(key,'{damaged');
  assert.equal(a.run('loadProgress()?.v'),27);
  const onlyBackup=createHarness(new Map(),a.secondary);
  assert.equal(onlyBackup.run('loadProgress().v'),27);
  a.primary.set(key,JSON.stringify({...JSON.parse(a.secondary.get(key)),perks:{}}));
  assert.equal(a.run('loadProgress()?.v'),27);
  a.primary.set(key,JSON.stringify({v:27,gameVersion:'24.0',t:Date.now()+1000}));
  assert.equal(a.run('loadProgress()?.gameVersion'),'24.1');
  assert.ok(a.secondary.has(key));
});
test('restoring a checkpoint in the menu leaves both stored copies intact',()=>{
  const a=createHarness();
  a.run('hp=0;saveProgress(true)');
  const before=a.primary.get(key);
  const b=createHarness(a.primary);
  b.run('prepareResumeProgress()');
  assert.equal(b.api.hp,100);
  assert.equal(a.primary.get(key),before);
  assert.equal(b.secondary.has(key),false);
});
test('a tab that started from an older revision cannot roll back the shared save',()=>{
  const a=createHarness();
  a.run('matchRemaining=370;allyKills=2;saveProgress(true)');
  const b=createHarness(a.primary);
  b.run('prepareResumeProgress()');
  a.run('matchRemaining=240;allyKills=9;saveProgress(true)');
  b.run('matchRemaining=360;saveProgress(true)');
  const latest=JSON.parse(a.primary.get(key));
  assert.deepEqual([latest.matchRemaining,latest.allyKills],[240,9]);
});
test('competing writes serialize and an interrupted save only restores its own revision',async()=>{
  const a=createHarness();
  a.run('matchRemaining=370;saveProgress(true)');
  const queue=[];
  const locks={request:(key,callback)=>new Promise(resolve=>queue.push(()=>resolve(callback())))};
  const b=createHarness(a.primary),c=createHarness(a.primary);
  for(const tab of [b,c]){
    tab.api.navigator={locks};
    tab.run('prepareResumeProgress()');
  }
  const first=b.run('matchRemaining=240;saveProgress(true)');
  const second=c.run('matchRemaining=300;saveProgress(true)');
  assert.equal(c.run('loadProgress().matchRemaining'),300,'before commit the tab backup is available');
  assert.equal(queue.length,2);
  queue.shift()();
  queue.shift()();
  await Promise.all([first,second]);
  assert.equal(JSON.parse(a.primary.get(key)).matchRemaining,240);
  assert.equal(c.run('loadProgress().matchRemaining'),240,'the older tab backup cannot replace a newer shared revision');
});
test('save preserves the spent second wind and the current perk offer',()=>{
  const a=createHarness();
  a.run("level=8;pendingLevels=1;hp=35;applySavedPerk('secondwind');plr.secondWindReady=false;currentPerkChoices=[ALL_PERKS[0]];perkRerollsLeft=0;saveProgress(true)");
  const b=createHarness(a.primary);
  b.run('applyRuntimeSave(loadProgress())');
  assert.equal(b.api.hp,35);
  assert.equal(b.api.plr.secondWindReady,false);
  assert.deepEqual(Array.from(b.api.currentPerkChoices,p=>p.id),['chosen']);
  assert.equal(b.api.perkRerollsLeft,0);
});
test('lethal bullet scores after its shooter dies',()=>{
  const a=createHarness();
  a.api.plr.dodgeChance=0;
  a.api.plr.bulletResist=0;
  a.api.plr.blastResist=0;
  a.api.PLAYER_MINE_DAMAGE_SCALE=1;
  a.run("hp=10; applyDamageToPlayer(30,'bullet',{alive:false,team:'enemy',kills:0})");
  assert.equal(a.api.dying,true);
  assert.equal(a.api.enemyKills,1);
  const b=createHarness();
  b.api.plr.dodgeChance=0;
  b.api.plr.bulletResist=0;
  b.run("hp=10; applyDamageToPlayer(30,'bullet',{alive:true,team:'enemy',kills:0})");
  assert.equal(b.api.dying,true);
  assert.equal(b.api.enemyKills,1);
});
test('fresh match drains and destroys live bullets from either team',()=>{
  const removed=[];
  const context=vm.createContext({
    enemies:[],pickups:[],mines:[],botGrenades:[],smokeGrenades:[],smokeClouds:[],
    pRkts:[{m:'player rocket'}],eRkts:[],pTrs:[],_gibs:[],casings:[],impactMarks:[],bombBlastWaves:[],
    pBullets:[{m:'player bullet'}],eBullets:[{m:'enemy bullet'}],P_MAX:0,_pHead:0,_pCount:0,
    G:()=>null, cancelFragGrenadeThrow:noop,cancelPendingBombPlant:noop,
    releaseEnemyTracer:node=>removed.push(node),
    clearMineWorldArt39:noop,clearGrenadeFlightArt:noop,clearSmokePresentation42:noop,
    removeSmokeCloud:noop,resetTransientCombatLights:noop,destroySceneObject:node=>removed.push(node),
  });
  const bulletCleanup=between(combat,'function destroyPlayerBullet(','function resolvePlayerBulletHit(')+
    between(combat,'function destroyEnemyBullet(','function spawnEnemyBullet(');
  vm.runInContext(bulletCleanup+clearWorldSource+'\nclearWorldForFreshGame()',context);
  assert.equal(context.pRkts.length,0);
  assert.equal(context.pBullets.length,0);
  assert.equal(context.eBullets.length,0);
  assert.deepEqual(removed,['player bullet','enemy bullet','player rocket']);
});

test('required script failure exposes a retry action instead of a permanent loading overlay',async()=>{
  const html=read('index.html');
  const indexBootstrap=between(html,'<script id="cache-bootstrap">','</script>').split('\n').slice(1).join('\n');
  const first=html.match(/<div id="loading-pct">([^<]+)/);
  assert.ok(first);
  const logged=[];
  const scripts=[];
  let reloads=0, retryClick, focused=false;
  const elements = Object.fromEntries(['loading-title','loading-sub','loading-track','loading-pct','loading-error','loading-retry'].map(id=>[id,element()]));
  elements['loading-retry']={hidden:true,focus:()=>{focused=true;},addEventListener:(type,handler)=>{if(type==='click')retryClick=handler;}};
  const document={
    documentElement:{dataset:{}},getElementById:id=>elements[id],
    querySelector:()=>({content:'a69cf3b95a8c30eb'}),
    createElement:()=>({remove:noop}),
    body:{append(script){
      scripts.push(script.src);
      if(script.src.startsWith('src/core/engine.js?')) script.onerror();
      else script.onload();
    }},
  };
  const context=vm.createContext({document,window:{addEventListener:noop},THREE:{WebGLRenderer:noop},setTimeout,clearTimeout,location:{protocol:'file:',reload:()=>{reloads++;}},console:{error:(...args)=>logged.push(String(args.at(-1)))}});
  vm.runInContext(indexBootstrap,context);
  await new Promise(setImmediate);
  assert.equal(first[1],'0%');
  assert.ok(logged.some(message=>message.includes('src/core/engine.js')));
  assert.ok(!scripts.some(url=>url.includes('src/game/runtime.js')));
  assert.equal(document.documentElement.dataset.zapBoot,'failed');
  assert.equal(elements['loading-retry'].hidden,false);
  assert.equal(focused,true);
  assert.ok(elements['loading-error'].textContent);
  retryClick();
  assert.equal(reloads,1);
});

