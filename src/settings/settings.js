'use strict';

// Player settings, Web Audio SFX and presentation-only combat feedback.
const GAME_SETTINGS_KEY='zap_zone_settings_v1';
const GAME_SETTINGS_DEFAULTS=Object.freeze({
  sensitivity:1,sfx:.65,screenShake:true,dynamicCrosshair:true,showFps:false,graphicsQuality:'auto',
  stopBots:false,infiniteAmmo:false,allWeapons:false,invincible:false
});
function clampSetting(v,min,max,fallback){
  const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
}
function loadGameSettings(){
  try{
    const saved=JSON.parse(localStorage.getItem(GAME_SETTINGS_KEY)||'{}');
    return {
      sensitivity:clampSetting(saved.sensitivity,.5,2,1),
      sfx:clampSetting(saved.sfx,0,1,.65),
      screenShake:saved.screenShake!==false,
      dynamicCrosshair:saved.dynamicCrosshair!==false,
      showFps:saved.showFps===true,
      graphicsQuality:['auto','low','medium','high'].includes(saved.graphicsQuality)?saved.graphicsQuality:'auto',
      stopBots:saved.stopBots===true,
      infiniteAmmo:saved.infiniteAmmo===true,
      allWeapons:saved.allWeapons===true,
      invincible:saved.invincible===true
    };
  }catch(e){return {...GAME_SETTINGS_DEFAULTS};}
}
const gameSettings=loadGameSettings();
let settingsOpen=false;
function byId(id){return document.getElementById(id);}
function saveGameSettings(){try{localStorage.setItem(GAME_SETTINGS_KEY,JSON.stringify(gameSettings));}catch(e){}applyGameSettings();}
function lookSensitivityMultiplier(zoomed=false){
  const w=typeof getW==='function'?getW():null;
  const zoomMultiplier=(zoomed&&w&&w.aimMode==='scope') ? .22 : 1;
  return gameSettings.sensitivity*zoomMultiplier;
}

let gameAudioCtx=null,gameAudioMaster=null,gameNoiseBuffer=null;
const GAME_AUDIO_ASSETS=Object.freeze({
  pistol:'assets/audio/pistol-shot-40.wav',
  pistolMag40:'assets/audio/pistol-mag-40.wav',
  pistolSlide40:'assets/audio/pistol-slide-40.wav',
  pistolDone40:'assets/audio/pistol-done-40.wav',
  rifle:'assets/audio/rifle.wav',
  shotgun:'assets/audio/shotgun-shot-37.wav',
  shotgunPump37:'assets/audio/shotgun-pump-37.wav',
  shotgunShell37:'assets/audio/shotgun-shell-37.wav',
  shotgunLoad37:'assets/audio/shotgun-load-37.wav',
  sniper:'assets/audio/sniper.wav',
  rocket:'assets/audio/rocket-launch.wav',
  plasma:'assets/audio/plasma.wav',
  explosion:'assets/audio/explosion.wav',
  mineThrow39:'assets/audio/mine-throw-39.wav',
  mineLand39:'assets/audio/mine-land-39.wav',
  mineArm39:'assets/audio/mine-arm-39.wav',
  mineTrigger39:'assets/audio/mine-trigger-39.wav',
  mineDetonate39:'assets/audio/mine-detonate-39.wav',
  smokePin42:'assets/audio/smoke-pin-42.wav',
  smokeThrow42:'assets/audio/smoke-throw-42.wav',
  smokeBounce42:'assets/audio/smoke-bounce-42.wav',
  smokeVent42:'assets/audio/smoke-vent-42.wav',
  smokeReload42:'assets/audio/smoke-reload-42.wav',
  ricochet:'assets/audio/ricochet.wav',
  whiz:'assets/audio/whiz.wav',
  objectiveCapture:'assets/audio/objective-capture.wav',
  tailOpen:'assets/audio/tail-open.wav',
  tailTight:'assets/audio/tail-tight.wav',
  sniperCrack:'assets/audio/sniper-crack.wav',
  footstepWalk:'assets/audio/footstep-walk.wav',
  footstepRun:'assets/audio/footstep-run.wav',
  hitBody:'assets/audio/hit-body.wav',
  hitArmor:'assets/audio/hit-armor.wav',
  hitHead:'assets/audio/hit-head.wav',
  battlefield:'assets/audio/battlefield-loop.wav',
  reloadMag:'assets/audio/reload-mag.wav',
  reloadDone:'assets/audio/reload-done.wav',
  shellInsert:'assets/audio/shell-insert.wav',
  boltCycle:'assets/audio/bolt-cycle.wav',
  pumpCycle:'assets/audio/pump-cycle.wav',
  equipSample:'assets/audio/equip.wav',
  footstepMetal:'assets/audio/footstep-metal.wav',
  footstepGravel:'assets/audio/footstep-gravel.wav',
  footstepWater:'assets/audio/footstep-water.wav'
});
const gameAudioBuffers=new Map(),gameAudioLoads=new Map(),gameAudioRetryAfter=new Map();
const GAME_AUDIO_FILE_ASSETS_ENABLED=location.protocol!=='file:';
const acousticProfileCache=new Map(),acousticTailCooldowns=new Map();
let gameAudioWarmupScheduled=false;
let playerFootstepDistance=0,battlefieldAmbienceSource=null,battlefieldAmbienceGain=null,battlefieldAmbiencePending=false;
let playerSuppression=0,playerSuppressionPulse=0;
function combatSourcePosition(source){
  return source&&(source.group?.position||source.m?.position||source.position||source);
}
function combatBearingDegrees(source){
  const src=combatSourcePosition(source);
  if(!src||typeof yaw!=='number'||typeof camera==='undefined')return 180;
  const dx=src.x-camera.position.x,dz=src.z-camera.position.z;
  const sourceHeading=Math.atan2(dx,dz),forwardHeading=Math.atan2(-Math.sin(yaw),-Math.cos(yaw));
  let diff=sourceHeading-forwardHeading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
  return diff*180/Math.PI;
}
function spatialAudioMix(source,maxDistance=82){
  const src=combatSourcePosition(source);
  if(!src||typeof camera==='undefined')return{gain:1,pan:0,distance:0};
  const dx=src.x-camera.position.x,dz=src.z-camera.position.z,dist=Math.hypot(dx,dz);
  if(dist>=maxDistance)return{gain:0,pan:0,distance:dist};
  const normalized=Math.max(0,1-dist/maxDistance);
  const gain=Math.pow(normalized,1.22);
  const side=dist>.001?(dx*Math.cos(yaw)-dz*Math.sin(yaw))/dist:0;
  return{gain,pan:Math.max(-.92,Math.min(.92,side*.92)),distance:dist};
}
function combatAcousticProfile(source){
  const src=combatSourcePosition(source)||(typeof camera!=='undefined'?camera.position:null);
  if(!src||typeof THREE==='undefined'||typeof wallBetween!=='function'||typeof wallMeshes==='undefined')return'open';
  const cellX=Math.round(src.x/6),cellZ=Math.round(src.z/6),key=cellX+':'+cellZ,now=performance.now();
  const cached=acousticProfileCache.get(key);if(cached&&now-cached.time<900)return cached.profile;
  const origin=new THREE.Vector3(src.x,Math.max(.85,Math.min(1.75,Number(src.y)||1.2)),src.z);
  let blocked=0;
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const to=new THREE.Vector3(origin.x+dx*12,origin.y,origin.z+dz*12);
    if(wallBetween(origin,to,wallMeshes))blocked++;
  }
  const profile=blocked>=2?'tight':'open';
  acousticProfileCache.set(key,{profile,time:now});
  if(acousticProfileCache.size>72)acousticProfileCache.delete(acousticProfileCache.keys().next().value);
  return profile;
}
function loadGameAudioAsset(key){
  if(!GAME_AUDIO_FILE_ASSETS_ENABLED)return Promise.resolve(null);
  if(gameAudioBuffers.has(key))return Promise.resolve(gameAudioBuffers.get(key));
  if(gameAudioLoads.has(key))return gameAudioLoads.get(key);
  const retryAt=gameAudioRetryAfter.get(key)||0;
  if(retryAt>performance.now())return Promise.resolve(null);
  const path=GAME_AUDIO_ASSETS[key],ctx=gameAudioCtx;
  if(!path||!ctx)return Promise.resolve(null);
  const load=fetch(path)
    .then(res=>{if(!res.ok)throw new Error('HTTP '+res.status);return res.arrayBuffer();})
    .then(raw=>ctx.decodeAudioData(raw.slice(0)))
    .then(buffer=>{gameAudioBuffers.set(key,buffer);gameAudioLoads.delete(key);gameAudioRetryAfter.delete(key);return buffer;})
    .catch(err=>{
      gameAudioLoads.delete(key);
      gameAudioRetryAfter.set(key,performance.now()+12000);
      console.warn('Не удалось загрузить аудио asset:',path,err);
      return null;
    });
  gameAudioLoads.set(key,load);return load;
}
function preloadGameAudio(){
  if(!GAME_AUDIO_FILE_ASSETS_ENABLED||!gameAudioCtx||gameSettings.sfx<=0)return;
  for(const key of Object.keys(GAME_AUDIO_ASSETS))loadGameAudioAsset(key);
}
function scheduleGameAudioWarmup(){
  if(!GAME_AUDIO_FILE_ASSETS_ENABLED||gameAudioWarmupScheduled||gameSettings.sfx<=0)return;
  gameAudioWarmupScheduled=true;
  const run=()=>{gameAudioWarmupScheduled=false;preloadGameAudio();startBattlefieldAmbience();};
  if(typeof requestIdleCallback==='function')requestIdleCallback(run,{timeout:700});
  else setTimeout(run,80);
}
function playBufferSfx(key,intensity=1,source=null,maxDistance=82,rate=1,delay=0){
  const ctx=ensureGameAudio();if(!ctx||!gameAudioMaster)return false;
  const buffer=gameAudioBuffers.get(key);
  if(!buffer){if(GAME_AUDIO_FILE_ASSETS_ENABLED)loadGameAudioAsset(key);return false;}
  const mix=spatialAudioMix(source,maxDistance);
  if(mix.gain<=.015)return true;
  const src=ctx.createBufferSource(),gain=ctx.createGain();
  src.buffer=buffer;src.playbackRate.value=Math.max(.78,Math.min(1.24,rate));
  gain.gain.value=Math.max(.0001,Math.min(1.35,(Number(intensity)||1)*mix.gain));
  src.connect(gain);
  if(typeof ctx.createStereoPanner==='function'){
    const pan=ctx.createStereoPanner();pan.pan.value=mix.pan;gain.connect(pan);pan.connect(gameAudioMaster);
  }else gain.connect(gameAudioMaster);
  src.start(ctx.currentTime+Math.max(0,Number(delay)||0));return true;
}
function weaponAudioAsset(weaponKey){
  return weaponKey==='sniper'?'sniper':weaponKey==='shotgun'?'shotgun':weaponKey==='rifle'?'rifle':
    weaponKey==='rocket'?'rocket':weaponKey==='plasma'?'plasma':'pistol';
}
function playWeaponTail(weaponKey,intensity=1,source=null){
  const pos=combatSourcePosition(source),tailKey=pos?(Math.round(pos.x/6)+':'+Math.round(pos.z/6)):'player';
  const now=performance.now(),last=acousticTailCooldowns.get(tailKey)||-999;
  if(now-last<72)return;
  acousticTailCooldowns.set(tailKey,now);
  if(acousticTailCooldowns.size>48)acousticTailCooldowns.delete(acousticTailCooldowns.keys().next().value);
  const profile=combatAcousticProfile(source);
  const power=weaponKey==='sniper'?.66:weaponKey==='shotgun'?.52:weaponKey==='rocket'?.48:weaponKey==='rifle'?.34:weaponKey==='plasma'?.24:.27;
  playBufferSfx(profile==='tight'?'tailTight':'tailOpen',power*intensity,source,profile==='tight'?72:125,.96+Math.random()*.08,profile==='tight'?.026:.055);
}
function playSniperCrack(source=null,intensity=1,listenerCrack=false){
  return playBufferSfx('sniperCrack',Math.min(1.2,.78*intensity),listenerCrack?null:source,listenerCrack?90:140,.96+Math.random()*.07,listenerCrack?.006:.014);
}
function playWeaponShotSound(weaponKey,intensity=1,source=null){
  const asset=weaponAudioAsset(weaponKey),rate=source?(.96+Math.random()*.08):1;
  const played=playBufferSfx(asset,intensity,source,weaponKey==='sniper'?125:92,rate);
  if(!played){
    const mix=spatialAudioMix(source,weaponKey==='sniper'?125:92);
    if(mix.gain>.02)playSfx('shoot',intensity*mix.gain,weaponKey);
  }
  playWeaponTail(weaponKey,intensity,source);
  if(source){
    const distant=spatialAudioMix(source,145);
    if(distant.distance>38&&distant.gain>.012){
      const echoPower=Math.min(.24,.07+distant.distance/760)*intensity;
      playBufferSfx('tailOpen',echoPower,source,145,.84+Math.random()*.10,.085+Math.min(.10,distant.distance/900));
    }
  }
  if(weaponKey==='sniper')playSniperCrack(source,intensity,false);
}
function playSurfaceImpactSound(material='concrete',source=null,intensity=.6,ricochet=false){
  const rate=material==='metal'?(ricochet?1.18:1.08):material==='wood'?.78:.94;
  const power=Math.max(.12,Math.min(1,(ricochet?.78:.38)*intensity));
  if(playBufferSfx('ricochet',power,source,ricochet?62:42,rate))return;
  if(ricochet)playSfx('ricochet',power);
}
function playMineSound39(event,source=null){
  const detonation=event==='Detonate';
  // Same one historical explosion pitch draw, whether WAV or synthesis is used.
  const rate=detonation?.94+Math.random()*.08:1;
  if(playBufferSfx('mine'+event+'39',detonation?.88:.5,source,detonation?105:40,rate))return;
  const mix=spatialAudioMix(source,detonation?105:40);
  if(mix.gain<=.02)return;
  if(detonation)playSfx('explosion',mix.gain*.88);
  else{
    // New short events use tones: do not initialize the shared RNG-noise buffer earlier.
    const freq=event==='Throw'?260:event==='Land'?390:event==='Trigger'?180:520;
    synthTone(freq,.06,.025*mix.gain,'triangle',freq*.8);
  }
}
function playExplosionSound(source,intensity=1){
  if(playBufferSfx('explosion',intensity,source,105,.94+Math.random()*.08))return;
  const mix=spatialAudioMix(source,105);if(mix.gain>.02)playSfx('explosion',intensity*mix.gain);
}
function playRicochetSound(source,intensity=1){
  if(playBufferSfx('ricochet',intensity,source,52,.94+Math.random()*.14))return;
  const mix=spatialAudioMix(source,52);if(mix.gain>.02)playSfx('ricochet',intensity*mix.gain);
}
function playWhizSound(source,intensity=1){
  if(playBufferSfx('whiz',intensity,source,72,.92+Math.random()*.16))return;
  playSfx('whiz',intensity);
}
function playObjectiveCaptureSound(team='ally'){
  if(playBufferSfx('objectiveCapture',.82,null,90,team==='enemy'?.86:1))return;
  playSfx(team==='enemy'?'hurt':'level',.72);
}
function footstepSurfaceAt(source=null){
  const p=combatSourcePosition(source)||(typeof camera!=='undefined'?camera.position:null);
  if(!p)return'concrete';
  if(p.x>=-68&&p.x<=-52&&p.z>=10&&p.z<=20)return'water';
  if(Math.hypot(p.x,p.z)>=58)return'gravel';
  if(Math.abs(p.x)<=24&&Math.abs(p.z)<=24)return'metal';
  return'concrete';
}
function playFootstepSound(source=null,running=false,isBot=false,surface=null){
  const ground=surface||footstepSurfaceAt(source);
  const key=ground==='water'?'footstepWater':ground==='gravel'?'footstepGravel':ground==='metal'?'footstepMetal':(running?'footstepRun':'footstepWalk');
  const surfaceM=ground==='water'?.78:ground==='gravel'?.90:ground==='metal'?.86:1;
  const intensity=(running?.34:.25)*(isBot?.80:1)*surfaceM;
  const rate=(running?1.08:.94)*(.94+Math.random()*.12);
  const played=playBufferSfx(key,intensity,source,isBot?42:18,rate);
  if(!played&&!isBot)synthNoise(running?.055:.045,running?.018:.012,ground==='metal'?1500:ground==='gravel'?760:520);
}
function tickPlayerFootsteps(distance,running,onGround){
  const d=Math.max(0,Math.min(.65,Number(distance)||0));
  if(!onGround||d<.0005)return;
  playerFootstepDistance+=d;
  const stride=running?1.62:2.12;
  if(playerFootstepDistance>=stride){
    playerFootstepDistance%=stride;
    playFootstepSound(null,running,false,footstepSurfaceAt(null));
  }
}
function playHitImpactSound(zone='body',source=null,intensity=1){
  const key=zone==='head'?'hitHead':zone==='armor'?'hitArmor':'hitBody';
  const power=zone==='head'?.72:zone==='armor'?.58:.50;
  if(playBufferSfx(key,power*intensity,source,86,.94+Math.random()*.12))return;
  playSfx(zone==='head'?'crit':'hit',Math.min(1,power*intensity));
}
function playWeaponMechanicSound(name,intensity=1,weaponKey='',source=null){
  const key=(weaponKey==='pistol'?{reload:'pistolMag40',reloadDone:'pistolDone40'}[name]:null)||(weaponKey==='shotgun'?{reload:'shotgunLoad37',shell:'shotgunShell37',pump:'shotgunPump37'}[name]:null)||{reload:'reloadMag',reloadDone:'reloadDone',shell:'shellInsert',bolt:'boltCycle',pump:'pumpCycle',equip:'equipSample'}[name];
  const heavy=weaponKey==='sniper'||weaponKey==='shotgun'||weaponKey==='rocket';
  const rate=(heavy?.94:1.02)*(.97+Math.random()*.06);
  if(key&&playBufferSfx(key,Math.max(.12,Math.min(1.15,intensity)),source,source?38:18,rate))return;
  playSfx(name,intensity,weaponKey);
}
function playPistolSlideSound40(){
  if(playBufferSfx('pistolSlide40',.72,null,18,1))return;
  // Existing action timer owns the event; fallback adds no gameplay RNG draw or delayed callback.
  synthTone(470,.055,.020,'square',350);synthTone(620,.03,.016,'square',520,.045);
}
function startBattlefieldAmbience(){
  if(!GAME_AUDIO_FILE_ASSETS_ENABLED||battlefieldAmbienceSource||battlefieldAmbiencePending||gameSettings.sfx<=0)return;
  const ctx=ensureGameAudio();if(!ctx||!gameAudioMaster)return;
  const buffer=gameAudioBuffers.get('battlefield');
  if(!buffer){
    battlefieldAmbiencePending=true;
    loadGameAudioAsset('battlefield').then(loaded=>{
      battlefieldAmbiencePending=false;
      if(loaded)startBattlefieldAmbience();
    });
    return;
  }
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  src.buffer=buffer;src.loop=true;src.loopStart=Math.min(.08,buffer.duration*.04);src.loopEnd=Math.max(src.loopStart+.25,buffer.duration-.08);
  filter.type='lowpass';filter.frequency.value=1650;filter.Q.value=.35;
  gain.gain.value=.095;
  src.connect(filter);filter.connect(gain);gain.connect(gameAudioMaster);
  src.onended=()=>{if(battlefieldAmbienceSource===src){battlefieldAmbienceSource=null;battlefieldAmbienceGain=null;}};
  battlefieldAmbienceSource=src;battlefieldAmbienceGain=gain;src.start();
}
function playerSuppressionSpreadPenalty(){
  return Math.min(.012,Math.max(0,playerSuppression)*.0065);
}
function registerPlayerSuppression(source,weapon=null,closestPoint=null,closestDistance=1,threshold=1.55){
  const d=Math.max(0,Number(closestDistance)||0),limit=Math.max(.65,Number(threshold)||1.55);
  if(d>limit)return 0;
  const proximity=Math.max(0,Math.min(1,1-d/limit));
  const sniper=!!weapon?.isSniper;
  const pressure=Math.min(1.2,.36+proximity*.72+(sniper?.16:0));
  playerSuppression=Math.min(1.45,playerSuppression+.16+pressure*.31);
  playerSuppressionPulse=Math.max(playerSuppressionPulse,.16+pressure*.14);
  playWhizSound(closestPoint||source,.42+proximity*.64);
  if(sniper)playSniperCrack(null,.72+proximity*.46,true);
  if(typeof gunSwayX==='number')gunSwayX=Math.max(-.055,Math.min(.055,gunSwayX+(Math.random()-.5)*.010*pressure));
  if(typeof gunSwayY==='number')gunSwayY=Math.max(-.045,Math.min(.045,gunSwayY+(Math.random()-.5)*.008*pressure));
  triggerScreenShake(.045+pressure*.075,.065+pressure*.045);
  return pressure;
}
function ensureGameAudio(){
  if(gameSettings.sfx<=0)return null;
  const Ctor=window.AudioContext||window.webkitAudioContext;if(!Ctor)return null;
  try{
    if(!gameAudioCtx){
      gameAudioCtx=new Ctor();gameAudioMaster=gameAudioCtx.createGain();
      gameAudioMaster.gain.value=gameSettings.sfx;gameAudioMaster.connect(gameAudioCtx.destination);
    }
    if(gameAudioCtx.state==='suspended')gameAudioCtx.resume().catch(()=>{});
    gameAudioMaster.gain.setTargetAtTime(gameSettings.sfx,gameAudioCtx.currentTime,.015);
    return gameAudioCtx;
  }catch(e){return null;}
}
function synthTone(freq,duration=.08,volume=.08,type='square',endFreq=null,delay=0){
  const ctx=ensureGameAudio();if(!ctx||!gameAudioMaster)return;
  const t=ctx.currentTime+Math.max(0,delay),osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=type;osc.frequency.setValueAtTime(Math.max(30,freq),t);
  if(endFreq)osc.frequency.exponentialRampToValueAtTime(Math.max(30,endFreq),t+duration);
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.008);
  gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  osc.connect(gain);gain.connect(gameAudioMaster);osc.start(t);osc.stop(t+duration+.015);
}
function synthNoise(duration=.09,volume=.07,cutoff=1200,delay=0){
  const ctx=ensureGameAudio();if(!ctx||!gameAudioMaster)return;
  if(!gameNoiseBuffer){
    const len=Math.max(1,Math.floor(ctx.sampleRate*.30));gameNoiseBuffer=ctx.createBuffer(1,len,ctx.sampleRate);
    const data=gameNoiseBuffer.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;
  }
  const t=ctx.currentTime+Math.max(0,delay),src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  src.buffer=gameNoiseBuffer;filter.type='lowpass';filter.frequency.value=cutoff;
  gain.gain.setValueAtTime(Math.max(.0002,volume),t);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  src.connect(filter);filter.connect(gain);gain.connect(gameAudioMaster);src.start(t);src.stop(t+duration+.01);
}
function playSfx(name,intensity=1,weaponKey=''){
  if(gameSettings.sfx<=0)return;const k=Math.max(.12,Math.min(1.25,Number(intensity)||1));
  switch(name){
    case 'shoot':{
      const f=weaponKey==='sniper'?58:weaponKey==='shotgun'?82:weaponKey==='rocket'?62:weaponKey==='rifle'?170:weaponKey==='plasma'?430:155;
      const dur=weaponKey==='sniper'?.22:weaponKey==='rocket'?.16:weaponKey==='shotgun'?.13:.075;
      synthTone(f,dur,.075*k,weaponKey==='plasma'?'sine':'square',Math.max(35,f*.55));
      synthNoise(dur*.75,weaponKey==='sniper'?.095*k:.055*k,weaponKey==='plasma'?2500:weaponKey==='sniper'?1500:1100);
      if(weaponKey==='sniper'){synthTone(1220,.07,.034*k,'triangle',760,.018);synthNoise(.12,.038*k,3200,.035);}
      if(weaponKey==='plasma')synthTone(760,.055,.035*k,'sine',420,.018);break;
    }
    case 'hit':synthTone(760,.045,.032*k,'square',620);break;
    case 'crit':synthTone(980,.07,.045*k,'triangle',720);synthTone(1460,.055,.028*k,'sine',1120,.025);break;
    case 'kill':synthTone(520,.09,.045*k,'triangle',760);synthTone(880,.12,.035*k,'sine',1180,.055);break;
    case 'hurt':synthNoise(.11,.045*k,420);synthTone(92,.13,.04*k,'sawtooth',62);break;
    case 'reload':synthTone(330,.045,.025*k,'square',460);synthNoise(.035,.014*k,2200,.045);break;
    case 'reloadDone':synthTone(520,.055,.028*k,'square',660);break;
    case 'dry':synthTone(180,.035,.020*k,'square',145);synthNoise(.025,.010*k,900,.012);break;
    case 'equip':synthTone(260,.035,.014*k,'square',340);synthNoise(.030,.008*k,1800,.018);break;
    case 'shell':synthTone(390,.030,.017*k,'square',520);synthNoise(.032,.012*k,2100,.015);break;
    case 'reloadCancel':synthTone(240,.028,.012*k,'square',190);break;
    case 'ricochet':synthTone(1180,.055,.020*k,'triangle',1760);break;
    case 'whiz':synthTone(920,.075,.014*k,'sine',1380);synthNoise(.050,.007*k,4200);break;
    case 'bolt':synthTone(470,.035,.020*k,'square',350,.28);synthNoise(.045,.018*k,2400,.31);synthTone(620,.03,.016*k,'square',520,.39);break;
    case 'pump':synthTone(310,.045,.022*k,'square',245,.20);synthNoise(.055,.020*k,1700,.24);synthTone(390,.035,.018*k,'square',520,.34);break;
    case 'level':synthTone(440,.13,.035*k,'triangle',660);synthTone(660,.14,.032*k,'triangle',880,.10);synthTone(880,.18,.028*k,'sine',1180,.20);break;
    case 'death':synthTone(120,.48,.055*k,'sawtooth',42);synthNoise(.32,.035*k,300);break;
    case 'explosion':synthNoise(.28,.10*k,520);synthTone(58,.30,.065*k,'sine',34);break;
    case 'ui':synthTone(540,.045,.022*k,'sine',680);break;
  }
}

let hitMarkerTimer=0,crosshairTimer=0;
function showHitMarker(kind='hit'){
  const el=byId('hitmarker');if(!el)return;
  el.className='';
  const frame=typeof hitMarkerPresentationFrame==='function'?hitMarkerPresentationFrame(kind):null;
  if(frame&&applyPresentationAtlasFrame(el,frame))el.classList.add('generated');
  void el.offsetWidth;el.classList.add('on',kind);
  clearTimeout(hitMarkerTimer);hitMarkerTimer=setTimeout(()=>{el.className='';},220);pulseCrosshair('hit');
}
function pulseCrosshair(kind='fire'){
  if(!gameSettings.dynamicCrosshair)return;const el=byId('xhair');if(!el)return;
  const cls=kind==='hit'?'dynamic-hit':'dynamic-fire';el.classList.remove('dynamic-fire','dynamic-hit');void el.offsetWidth;el.classList.add(cls);
  clearTimeout(crosshairTimer);crosshairTimer=setTimeout(()=>el.classList.remove('dynamic-fire','dynamic-hit'),kind==='hit'?140:95);
}

let damageDirectionTimer=0;
function showDamageDirection(attacker,kind='bullet',amount=0){
  const el=byId('damage-direction');if(!el)return;
  const degrees=combatBearingDegrees(attacker);
  el.style.transform='translate(-50%,-50%) rotate('+degrees.toFixed(1)+'deg)';el.className='';void el.offsetWidth;el.classList.add('on');
  if(kind==='rocket'||kind==='mine'||kind==='bomb')el.classList.add('explosive');
  const strength=Math.max(.72,Math.min(1.18,.78+(Number(amount)||0)/120));
  el.style.setProperty('--damage-strength',strength.toFixed(2));
  const edge=ensureCombatOverlay('damage-edge-overlay','damageDirection');
  if(edge){
    edge.style.setProperty('--overlay-strength',Math.min(1,strength).toFixed(2));
    edge.style.transform='rotate('+(degrees+90).toFixed(1)+'deg)';
    edge.classList.remove('on');void edge.offsetWidth;edge.classList.add('on');
  }
  clearTimeout(damageDirectionTimer);damageDirectionTimer=setTimeout(()=>{el.className='';if(edge)edge.classList.remove('on');},760);
}
let armorHitTimer=0,explosionShockwaveTimer=0,respawnMaterializeTimer=0;
function ensureCombatOverlay(id,assetKey){
  let el=byId(id);
  if(!el){
    const root=byId('ui');if(!root)return null;
    el=document.createElement('div');el.id=id;el.className='generated-combat-overlay';el.setAttribute('aria-hidden','true');
    root.insertBefore(el,root.firstChild);
  }
  const asset=GAME_ASSETS.presentationCombat?.[assetKey];
  if(asset&&el.dataset.asset!==asset){
    el.dataset.asset=asset;
    el.style.setProperty('--combat-overlay-image','url("'+asset+'")');
  }
  return el;
}
function ensureGeneratedCombatPresentation(){
  const smoke=byId('smoke-overlay'),smokeAsset=GAME_ASSETS.presentationCombat?.smoke;
  if(smoke&&smokeAsset&&smoke.dataset.generatedSmoke!==smokeAsset){
    smoke.dataset.generatedSmoke=smokeAsset;
    smoke.style.setProperty('--smoke-overlay-image','url("'+smokeAsset+'")');
  }
  ensureCombatOverlay('low-health-overlay','lowHealth');
  ensureCombatOverlay('damage-edge-overlay','damageDirection');
  ensureCombatOverlay('suppression-overlay','suppression');
  ensureCombatOverlay('armor-hit-overlay','armorHit');
  ensureCombatOverlay('explosion-shockwave-overlay','explosionShockwave');
  ensureCombatOverlay('sprint-speed-overlay','sprint');
  ensureCombatOverlay('respawn-materialize-overlay','respawn');
}
function setLowHealthCombatOverlay(strength=0){
  const el=ensureCombatOverlay('low-health-overlay','lowHealth');if(!el)return;
  el.style.opacity=String(Math.max(0,Math.min(.78,Number(strength)||0)));
}
function setSprintSpeedOverlay(strength=0){
  const el=ensureCombatOverlay('sprint-speed-overlay','sprint');if(!el)return;
  const value=Math.max(0,Math.min(1,Number(strength)||0));
  el.style.opacity=String(value*.52);
}
function showArmorHitFx(amount=0){
  const el=ensureCombatOverlay('armor-hit-overlay','armorHit');if(!el)return;
  el.style.setProperty('--overlay-strength',Math.max(.35,Math.min(1,.42+(Number(amount)||0)/45)).toFixed(2));
  el.classList.remove('on');void el.offsetWidth;el.classList.add('on');
  clearTimeout(armorHitTimer);armorHitTimer=setTimeout(()=>el.classList.remove('on'),520);
}
function triggerExplosionShockwave(source,radius=3){
  const src=combatSourcePosition(source);if(!src||typeof camera==='undefined')return;
  const dist=Math.hypot(src.x-camera.position.x,src.y-camera.position.y,src.z-camera.position.z);
  const reach=Math.max(10,Math.min(30,10+(Number(radius)||3)*3.6));if(dist>reach)return;
  const strength=Math.max(.16,Math.min(1,1-dist/reach));
  const el=ensureCombatOverlay('explosion-shockwave-overlay','explosionShockwave');if(!el)return;
  el.style.setProperty('--overlay-strength',strength.toFixed(3));
  el.classList.remove('on');void el.offsetWidth;el.classList.add('on');
  clearTimeout(explosionShockwaveTimer);explosionShockwaveTimer=setTimeout(()=>el.classList.remove('on'),720);
}
function showRespawnMaterializeFx(){
  // Spawn protection remains gameplay-authoritative, but respawn art no longer flashes over the crosshair.
  const el=byId('respawn-materialize-overlay');if(el)el.classList.remove('on');
}

let shakeTime=0,shakeDuration=.1,shakePower=0,fpsAccum=0,fpsFrames=0;
function triggerScreenShake(power=.3,duration=.12){
  if(!gameSettings.screenShake)return;const p=Math.max(0,Math.min(1.4,Number(power)||0));if(p<=0)return;
  shakePower=Math.max(shakePower,p);shakeDuration=Math.max(shakeDuration,Math.max(.06,Number(duration)||.12));shakeTime=Math.max(shakeTime,shakeDuration);
}
function tickGamePresentation(dt,ts){
  const frameDt=Math.max(0,Math.min(.25,Number(dt)||0));
  const safeDt=Math.min(.05,frameDt),fps=byId('fps-counter');
  tickGeneratedCombatVfx(safeDt);
  playerSuppression=Math.max(0,playerSuppression-safeDt*(playerSuppression>.85?.34:.52));
  playerSuppressionPulse=Math.max(0,playerSuppressionPulse-safeDt*1.35);
  const suppressionReticle=byId('xhair');
  if(suppressionReticle){
    suppressionReticle.classList.toggle('suppressed',playerSuppression>.12);
    suppressionReticle.style.setProperty('--suppression',Math.min(1,playerSuppression).toFixed(3));
  }
  const suppressionOverlay=ensureCombatOverlay('suppression-overlay','suppression');
  if(suppressionOverlay)suppressionOverlay.style.opacity=String(Math.min(.66,playerSuppression*.40+playerSuppressionPulse*.72));
  if(settingsOpen){
    const graphicsState=byId('setting-graphics-state');
    const label='Сейчас: '+graphicsQualityLabel();
    if(graphicsState&&graphicsState.textContent!==label)graphicsState.textContent=label;
  }
  if(gameSettings.showFps&&fps){
    fps.style.display='block';
    // Count actual wall-clock frame time; clamped animation dt inflated low-FPS readings.
    if(frameDt>0){fpsAccum+=frameDt;fpsFrames++;}
    if(fpsAccum>=.60){fps.textContent='FPS '+Math.round(fpsFrames/Math.max(.001,fpsAccum));fpsAccum=0;fpsFrames=0;}
  }else if(fps){fps.style.display='none';fpsAccum=0;fpsFrames=0;}
  if(shakeTime>0&&gameSettings.screenShake){
    shakeTime=Math.max(0,shakeTime-safeDt);const remain=shakeDuration>0?shakeTime/shakeDuration:0,amp=shakePower*remain;
    const x=Math.sin((ts||0)*.091)*amp*5.2,y=Math.cos((ts||0)*.117)*amp*3.6;
    canvas.style.transform='translate3d('+x.toFixed(2)+'px,'+y.toFixed(2)+'px,0) scale('+(1+amp*.004).toFixed(4)+')';
    if(shakeTime<=0){shakePower=0;canvas.style.transform='';}
  }else if(typeof canvas!=='undefined'&&canvas.style.transform){canvas.style.transform='';shakeTime=0;shakePower=0;}
}

function syncSettingsControls(){
  const sens=byId('setting-sensitivity'),sfx=byId('setting-sfx'),shake=byId('setting-shake'),crosshair=byId('setting-crosshair'),fps=byId('setting-fps'),graphics=byId('setting-graphics');
  const stopBots=byId('setting-stop-bots'),infiniteAmmo=byId('setting-infinite-ammo'),allWeapons=byId('setting-all-weapons'),invincible=byId('setting-invincible');
  if(sens)sens.value=String(gameSettings.sensitivity);if(sfx)sfx.value=String(gameSettings.sfx);
  if(shake)shake.checked=gameSettings.screenShake;if(crosshair)crosshair.checked=gameSettings.dynamicCrosshair;if(fps)fps.checked=gameSettings.showFps;
  if(graphics)graphics.value=gameSettings.graphicsQuality;
  if(byId('setting-graphics-state'))byId('setting-graphics-state').textContent='Сейчас: '+graphicsQualityLabel();
  if(stopBots)stopBots.checked=gameSettings.stopBots;if(infiniteAmmo)infiniteAmmo.checked=gameSettings.infiniteAmmo;if(allWeapons)allWeapons.checked=gameSettings.allWeapons;if(invincible)invincible.checked=gameSettings.invincible;
  if(byId('setting-sensitivity-value'))byId('setting-sensitivity-value').textContent=gameSettings.sensitivity.toFixed(2)+'×';
  if(byId('setting-sfx-value'))byId('setting-sfx-value').textContent=Math.round(gameSettings.sfx*100)+'%';
}
function applyGameSettings(){
  if(gameAudioMaster&&gameAudioCtx)gameAudioMaster.gain.setTargetAtTime(gameSettings.sfx,gameAudioCtx.currentTime,.02);
  const fps=byId('fps-counter');if(fps)fps.style.display=gameSettings.showFps?'block':'none';
  setGraphicsQualityMode(gameSettings.graphicsQuality);
  if(!gameSettings.screenShake){shakeTime=0;shakePower=0;if(typeof canvas!=='undefined')canvas.style.transform='';}
  if(typeof applyPlayerTestingSettings==='function')applyPlayerTestingSettings();
  syncSettingsControls();
}
function openGameSettings(){const modal=byId('settings-modal');if(!modal)return;settingsOpen=true;syncSettingsControls();modal.classList.add('on');modal.setAttribute('aria-hidden','false');playSfx('ui');}
function closeGameSettings(){const modal=byId('settings-modal');if(!modal)return;settingsOpen=false;modal.classList.remove('on');modal.setAttribute('aria-hidden','true');saveGameSettings();playSfx('ui');}
function bindGameSettings(){
  const sens=byId('setting-sensitivity'),sfx=byId('setting-sfx'),shake=byId('setting-shake'),crosshair=byId('setting-crosshair'),fps=byId('setting-fps'),graphics=byId('setting-graphics');
  const stopBots=byId('setting-stop-bots'),infiniteAmmo=byId('setting-infinite-ammo'),allWeapons=byId('setting-all-weapons'),invincible=byId('setting-invincible');
  const primeAudio=()=>{ensureGameAudio();scheduleGameAudioWarmup();};
  window.addEventListener('pointerdown',primeAudio,{once:true,capture:true});
  window.addEventListener('keydown',primeAudio,{once:true,capture:true});
  byId('menuSettingsBtn')?.addEventListener('click',openGameSettings);byId('pauseSettingsBtn')?.addEventListener('click',openGameSettings);byId('settingsCloseBtn')?.addEventListener('click',closeGameSettings);
  sens?.addEventListener('input',()=>{gameSettings.sensitivity=clampSetting(sens.value,.5,2,1);saveGameSettings();});
  sfx?.addEventListener('input',()=>{gameSettings.sfx=clampSetting(sfx.value,0,1,.65);ensureGameAudio();scheduleGameAudioWarmup();saveGameSettings();});
  shake?.addEventListener('change',()=>{gameSettings.screenShake=shake.checked;saveGameSettings();});
  crosshair?.addEventListener('change',()=>{gameSettings.dynamicCrosshair=crosshair.checked;saveGameSettings();});
  fps?.addEventListener('change',()=>{gameSettings.showFps=fps.checked;saveGameSettings();});
  graphics?.addEventListener('change',()=>{gameSettings.graphicsQuality=graphics.value;saveGameSettings();});
  stopBots?.addEventListener('change',()=>{gameSettings.stopBots=stopBots.checked;saveGameSettings();});
  infiniteAmmo?.addEventListener('change',()=>{gameSettings.infiniteAmmo=infiniteAmmo.checked;saveGameSettings();});
  allWeapons?.addEventListener('change',()=>{gameSettings.allWeapons=allWeapons.checked;saveGameSettings();});
  invincible?.addEventListener('change',()=>{gameSettings.invincible=invincible.checked;saveGameSettings();});
  window.addEventListener('keydown',e=>{if(e.code==='Escape'&&settingsOpen){e.preventDefault();e.stopImmediatePropagation();closeGameSettings();}},true);
  applyGameSettings();
}
ensureGeneratedCombatPresentation();
bindGameSettings();



const generatedCombatVfx=[];
const GENERATED_COMBAT_VFX_LIMIT=(typeof MOBILE_LOW!=='undefined'&&MOBILE_LOW)?8:18;
function ensureGeneratedCombatVfxLayer(){
  let layer=byId('generated-combat-vfx-layer');if(layer)return layer;
  const root=byId('ui');if(!root)return null;
  layer=document.createElement('div');layer.id='generated-combat-vfx-layer';
  layer.className='generated-combat-vfx-layer';layer.setAttribute('aria-hidden','true');
  root.insertBefore(layer,root.firstChild);return layer;
}
function removeGeneratedCombatVfx(item){
  if(!item)return;
  item.el?.remove();
  const index=generatedCombatVfx.indexOf(item);if(index>=0)generatedCombatVfx.splice(index,1);
}
function playGeneratedCombatVfx(kind,options={}){
  const spec=typeof generatedCombatVfxSpec==='function'?generatedCombatVfxSpec(kind):null;
  const first=typeof generatedCombatVfxFrame==='function'?generatedCombatVfxFrame(kind,0):null;
  const layer=ensureGeneratedCombatVfxLayer();
  if(!spec||!first||!layer)return false;
  // Long-lived floor decals have a separate bounded budget; bursts cannot evict them.
  const sameBudget=generatedCombatVfx.filter(item=>Boolean(item.spec.groundPlane)===Boolean(spec.groundPlane));
  const limit=spec.groundPlane?128:GENERATED_COMBAT_VFX_LIMIT;
  while(sameBudget.length>=limit)removeGeneratedCombatVfx(sameBudget.shift());
  const el=document.createElement('span');el.className='generated-combat-vfx';el.dataset.kind=kind;
  el.style.width=(spec.width||spec.size)+'px';el.style.height=(spec.height||spec.size)+'px';applyPresentationAtlasFrame(el,first);layer.appendChild(el);
  const worldObject=options.worldObject?.position?.clone?options.worldObject:null;
  const worldPos=worldObject?worldObject.position.clone():(options.worldPos?.clone?options.worldPos.clone():null);
  const item={el,kind,spec,groundY:options.groundY,surfaceCorners:options.surfaceCorners,age:0,delay:Math.max(0,Number(options.delay)||0),frame:-1,worldPos,worldObject,
    screen:worldPos&&typeof THREE!=='undefined'?new THREE.Vector3():null,
    anchor:options.anchor||'center',rotation:Number(options.rotation)||0,scale:Math.max(.35,Number(options.scale)||1)};
  generatedCombatVfx.push(item);positionGeneratedCombatVfx(item);if(item.delay>0)el.style.visibility='hidden';return true;
}
// Ground decals project four points on the arena floor, rather than facing the camera.
function positionGroundGrenadeDecal(item){
  const el=item.el,center=item.worldPos,groundY=(item.groundY??-.04)+.015;
  const surfaceCenter=item.spec.surfacePlane?center:new THREE.Vector3(center?.x||0,groundY,center?.z||0);
  if(!center||wallBetween(camera.position,surfaceCenter,wallMeshes)||
    (typeof smokeVisibilityBetween42==='function'&&smokeVisibilityBetween42(camera.position,surfaceCenter)<.015)){
    el.style.visibility='hidden';return;
  }
  const half=item.spec.worldSizeM*.5*item.scale,angle=item.rotation*Math.PI/180;
  const c=Math.cos(angle),s=Math.sin(angle),points=[];
  const surfaceCorners=item.spec.surfacePlane?item.surfaceCorners:null;
  if(item.spec.surfacePlane&&surfaceCorners?.length!==4){el.style.visibility='hidden';return;}
  let cornerIndex=0;
  for(const [u,v] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
    const point=(surfaceCorners?surfaceCorners[cornerIndex++].clone():new THREE.Vector3(center.x+half*(u*c-v*s),groundY,center.z+half*(u*s+v*c))).project(camera);
    if(point.z<=-1||point.z>=1){el.style.visibility='hidden';return;}
    points.push({x:(point.x*.5+.5)*innerWidth,y:(-point.y*.5+.5)*innerHeight});
  }
  if(points.every(p=>p.x<0)||points.every(p=>p.x>innerWidth)||points.every(p=>p.y<0)||points.every(p=>p.y>innerHeight)){
    el.style.visibility='hidden';return;
  }
  const [p0,p1,p2,p3]=points;
  const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
  const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
  const det=dx1*dy2-dx2*dy1;
  if(Math.abs(det)<.001){el.style.visibility='hidden';return;}
  const g=(dx3*dy2-dx2*dy3)/det,h=(dx1*dy3-dx3*dy1)/det;
  const size=item.spec.size;
  const matrix=[(p1.x-p0.x+g*p1.x)/size,(p1.y-p0.y+g*p1.y)/size,0,g/size,
    (p3.x-p0.x+h*p3.x)/size,(p3.y-p0.y+h*p3.y)/size,0,h/size,
    0,0,1,0,p0.x,p0.y,0,1];
  if(!matrix.every(Number.isFinite)){el.style.visibility='hidden';return;}
  el.style.visibility='visible';el.style.left='0px';el.style.top='0px';el.style.transformOrigin='0 0';
  el.style.transform='matrix3d('+matrix.map(n=>n.toFixed(7)).join(',')+')';
}

function positionGeneratedCombatVfx(item){
  const el=item?.el;if(!el)return;
  if(item.spec.groundPlane){positionGroundGrenadeDecal(item);return;}
  if(item.worldObject?.position?.clone&&item.worldPos)item.worldPos.copy(item.worldObject.position);
  if(item.spec.originY!=null){
    el.style.transformOrigin='50% '+(item.spec.originY*100)+'%';
    el.style.transform='translate(-50%,'+(-item.spec.originY*100)+'%) rotate(var(--vfx-rot)) scale(var(--vfx-scale))';
  }
  let x=innerWidth*.5,y=innerHeight*.48,scale=item.scale;
  if(item.kind==='bombSmoke41')scale*=.82+.28*Math.min(1,Math.max(0,item.age-item.delay)/item.spec.duration);
  if(item.worldPos&&item.screen&&typeof camera!=='undefined'){
    item.screen.copy(item.worldPos).project(camera);
    if(item.screen.z<=-1||item.screen.z>=1||Math.abs(item.screen.x)>1.18||Math.abs(item.screen.y)>1.18){el.style.visibility='hidden';return;}
    x=(item.screen.x*.5+.5)*innerWidth;y=(-item.screen.y*.5+.5)*innerHeight;
    if(item.spec.occlude&&wallBetween(camera.position,item.worldPos,wallMeshes)){el.style.visibility='hidden';return;}
    if(typeof smokeVisibilityBetween42==='function'&&smokeVisibilityBetween42(camera.position,item.worldPos)<.015){el.style.visibility='hidden';return;}
    const dist=camera.position.distanceTo(item.worldPos);
    if(item.spec.worldSizeM){
      const focal=innerHeight/(2*Math.tan(camera.fov*Math.PI/360));
      const px=Math.max(item.spec.minScreenSize??6,Math.min(item.spec.maxScreenSize||520,innerWidth*.60,item.spec.worldSizeM*focal/Math.max(.6,dist)));
      scale*=px/(item.spec.size||item.spec.width);
    }else scale*=Math.max(.48,Math.min(1.08,12/Math.max(7,dist)));
  }else{
    {
      const stage=byId('fp-weapon-art-stage'),flash=byId('fp-weapon-flash');
      if(item.anchor==='grenadeThrow'){
        if(stage){const r=stage.getBoundingClientRect();x=r.left+r.width*.58;y=r.top+r.height*.55;}
        else{x=innerWidth*.60;y=innerHeight*.68;}
      }
      else if(item.anchor==='pistolMuzzle'||item.anchor==='pistolEjection'){
        const marker=byId(item.anchor==='pistolEjection'?'fp-pistol-ejection-anchor':'fp-pistol-muzzle-anchor');
        if(marker){const r=marker.getBoundingClientRect();x=r.left;y=r.top;}
        if(item.kind==='pistolCasing40'){
          if(!item.spawnScreen)item.spawnScreen={x,y};
          const t=Math.max(0,item.age-item.delay),s=Math.max(.8,Math.min(1.4,innerHeight/900));
          x=item.spawnScreen.x+165*t*s;y=item.spawnScreen.y+(-105*t+880*t*t)*s;
          item.rotation=(item.initialRotation??(item.initialRotation=item.rotation))+540*t;
        }
        if(item.kind==='pistolMuzzle40'||item.kind==='pistolSmoke40'){
          item.rotation=Math.atan2(innerHeight*.5-y,innerWidth*.5-x)*180/Math.PI+140;
          const origins=PISTOL_EFFECT_EMITTERS40[item.kind==='pistolSmoke40'?'smoke':'flame'];
          const origin=origins[Math.max(0,Math.min(3,item.frame))];
          el.style.transformOrigin=(origin[0]*100)+'% '+(origin[1]*100)+'%';
          el.style.transform='translate('+(-origin[0]*100)+'%,'+(-origin[1]*100)+'%) rotate(var(--vfx-rot)) scale(var(--vfx-scale))';
        }
      }
      else if(item.anchor==='shotgunMuzzle'||item.anchor==='shotgunEjection'){
        const marker=byId(item.anchor==='shotgunEjection'?'fp-shotgun-ejection-anchor':'fp-shotgun-muzzle-anchor');
        if(marker){const r=marker.getBoundingClientRect();x=r.left;y=r.top;}
        if(item.kind==='shotgunCasing37'){
          // Snapshot the transformed port at emission; detached shell no longer follows recoil.
          if(!item.spawnScreen)item.spawnScreen={x,y};
          const t=Math.max(0,item.age-item.delay),s=Math.max(.8,Math.min(1.4,innerHeight/900));
          x=item.spawnScreen.x+180*t*s;y=item.spawnScreen.y+(-95*t+900*t*t)*s;
          item.rotation=(item.initialRotation??(item.initialRotation=item.rotation))+540*t;
        }
        if(item.kind==='shotgunMuzzle37'||item.kind==='shotgunSmoke37'){
          item.rotation=Math.atan2(innerHeight*.5-y,innerWidth*.5-x)*180/Math.PI-180;
          // Pin the generated flame's actual nozzle, rather than its rectangle center.
          const origins=SHOTGUN_EFFECT_EMITTERS38[item.kind==='shotgunSmoke37'?'smoke':'flame'];
          const origin=origins[Math.max(0,Math.min(3,item.frame))];
          el.style.transformOrigin=(origin[0]*100)+'% '+(origin[1]*100)+'%';
          el.style.transform='translate('+(-origin[0]*100)+'%,'+(-origin[1]*100)+'%) rotate(var(--vfx-rot)) scale(var(--vfx-scale))';
        }
      }
      else if(item.anchor==='rifleMuzzle'||item.anchor==='rifleEjection'){
        const scoped=G('sniper-scope')?.classList.contains('on');
        const marker=byId('fp-rifle-muzzle-anchor');
        if(scoped){el.style.visibility='hidden';return;}
        if(item.anchor==='rifleEjection'&&stage){const r=stage.getBoundingClientRect();x=r.left+r.width*.62;y=r.top+r.height*.65;}
        else if(marker){const r=marker.getBoundingClientRect();x=r.left;y=r.top;}
        if(item.kind==='rifleMuzzle36'||item.kind==='rifleSmoke36'){
          const angle=Math.atan2(innerHeight*.5-y,innerWidth*.5-x);
          item.rotation=item.kind==='rifleSmoke36'?0:angle*180/Math.PI-180;
          // Each generated tile has its nozzle at a different pixel, away from
          // its center. Pin that pixel to the live zero-size barrel marker.
          // Smoke rises from the narrow lower tail in each tile.
          const origins=item.kind==='rifleSmoke36'?[[.60,.96],[.47,.98],[.68,.98],[.35,.98]]:[[.900,.755],[.865,.755],[.785,.755],[.780,.755]];
          const origin=origins[Math.max(0,Math.min(3,item.frame))];
          el.style.transformOrigin=(origin[0]*100)+'% '+(origin[1]*100)+'%';
          el.style.transform='translate('+(-origin[0]*100)+'%,'+(-origin[1]*100)+'%) rotate(var(--vfx-rot)) scale(var(--vfx-scale))';
        }
      }
      else if(item.anchor==='rocketMuzzle'){const marker=byId('fp-rocket-muzzle-anchor');if(marker){const r=marker.getBoundingClientRect();x=r.left;y=r.top;item.rotation=Math.atan2(innerHeight*.5-y,innerWidth*.5-x)*180/Math.PI;}}
      else if(item.anchor==='muzzle'&&flash){const r=flash.getBoundingClientRect();x=r.left+r.width*.50;y=r.top+r.height*.50;}
      else if(item.anchor==='sniperFlight'){
        const tx=innerWidth*.5,ty=innerHeight*.5;
        if(stage){
          const sr=stage.getBoundingClientRect(),fr=flash?.getBoundingClientRect();
          const sx=fr&&fr.width?fr.left+fr.width*.5:sr.left+sr.width*.30;
          const sy=fr&&fr.height?fr.top+fr.height*.5:sr.top+sr.height*.38;
          x=(sx+tx)*.5;y=(sy+ty)*.5;
          item.rotation=Math.atan2(ty-sy,tx-sx)*180/Math.PI;
        }else{x=innerWidth*.55;y=innerHeight*.52;item.rotation=-165;}
      }
      else if((item.anchor==='ejection'||item.anchor==='magazine')&&stage){
        const r=stage.getBoundingClientRect();x=r.left+r.width*(item.anchor==='magazine'?.68:.58);y=r.top+r.height*(item.anchor==='magazine'?.64:.38);
        if(item.kind==='sniperCasing32'){x=r.left+r.width*.80;y=r.top+r.height*.66;}
      }
    }
  }
  el.style.visibility='visible';el.style.left=x.toFixed(1)+'px';el.style.top=y.toFixed(1)+'px';
  el.style.setProperty('--vfx-rot',item.rotation.toFixed(2)+'deg');el.style.setProperty('--vfx-scale',scale.toFixed(3));
}
function tickGeneratedCombatVfx(dt){
  const safeDt=Math.max(0,Math.min(.05,Number(dt)||0));
  for(let i=generatedCombatVfx.length-1;i>=0;i--){
    const item=generatedCombatVfx[i];item.age+=safeDt;
    if(item.age<item.delay){item.el.style.visibility='hidden';continue;}
    const activeAge=item.age-item.delay;
    const progress=Math.max(0,Math.min(1,activeAge/Math.max(.001,item.spec.duration)));
    const frame=item.spec.coolAfter!=null?(activeAge<item.spec.coolAfter?0:item.spec.frames-1):Math.min(item.spec.frames-1,Math.floor(progress*item.spec.frames));
    if(frame!==item.frame){applyPresentationAtlasFrame(item.el,generatedCombatVfxFrame(item.kind,frame));item.frame=frame;}
    item.el.style.opacity=String(item.spec.fadeSeconds?Math.min(1,Math.max(0,(item.spec.duration-activeAge)/item.spec.fadeSeconds)):(progress>.78?Math.max(0,(1-progress)/.22):1));positionGeneratedCombatVfx(item);
    if(progress>=1)removeGeneratedCombatVfx(item);
  }
}
// A new atlas must actually load before it can replace a visible fallback.
const sniperPresentationProbes32=new Map();
function sniperPresentationAssetReady32(key){
  const asset=GAME_ASSETS.presentationVfx[key];if(!asset)return false;
  let probe=sniperPresentationProbes32.get(asset);
  if(!probe){probe=new Image();sniperPresentationProbes32.set(asset,probe);probe.src=gameAssetUrl(asset);}
  return probe.complete&&probe.naturalWidth>0&&probe.naturalHeight>0;
}
function showGeneratedSniperShotVfx(){
  if(sniperPresentationAssetReady32('pack32SniperEffects')){
    const muzzle=playGeneratedCombatVfx('sniperMuzzle32',{anchor:'muzzle'});
    playGeneratedCombatVfx('sniperSmoke32',{anchor:'muzzle',delay:.045});
    playGeneratedCombatVfx('sniperBullet32',{anchor:'sniperFlight',delay:.012});
    return muzzle;
  }
  const muzzle=playGeneratedCombatVfx('sniperMuzzle23',{anchor:'muzzle',scale:1.04});
  playGeneratedCombatVfx('sniperSmoke23',{anchor:'muzzle',scale:.78,delay:.045});
  const seq=(showGeneratedSniperShotVfx._seq=(showGeneratedSniperShotVfx._seq||0)+1);
  playGeneratedCombatVfx(seq%2?'sniperBullet23':'sniperSupersonic23',{anchor:'sniperFlight',scale:1,delay:.012});
  return muzzle;
}
const shotgunPresentationProbes37=new Map();
function shotgunPresentationAssetReady37(key){
  const asset=GAME_ASSETS.presentationVfx[key];if(!asset)return false;
  let probe=shotgunPresentationProbes37.get(asset);
  if(!probe){probe=new Image();shotgunPresentationProbes37.set(asset,probe);probe.src=gameAssetUrl(asset);}
  const size=key==='pack37ShotgunAction'?[3840,1920]:key==='pack37ShotgunEffects'?[768,768]:[1448,1086];
  return probe.complete&&probe.naturalWidth===size[0]&&probe.naturalHeight===size[1];
}
function showGeneratedShotgunShotVfx(){
  if(!fpGeneratedWeaponActive||!shotgunPresentationAssetReady37('pack37ShotgunEffects'))return false;
  const muzzle=playGeneratedCombatVfx('shotgunMuzzle37',{anchor:'shotgunMuzzle'});
  playGeneratedCombatVfx('shotgunSmoke37',{anchor:'shotgunMuzzle',delay:.05});
  return muzzle;
}
const riflePresentationProbes36=new Map();
const pistolPresentationProbes40=new Map();
function pistolPresentationAssetReady40(key){
  if(key==='pack40PistolEffects'&&!PISTOL_EFFECT_EMITTERS40)return false;
  const size={pack40PistolReady:[1448,1086],pack40PistolReload:[3840,1920],pack40PistolEffects:[768,768],pack25PistolReload:[960,540]}[key];
  const asset=GAME_ASSETS.presentationVfx[key];if(!size||!asset)return false;
  let probe=pistolPresentationProbes40.get(asset);
  if(!probe){probe=new Image();pistolPresentationProbes40.set(asset,probe);probe.src=gameAssetUrl(asset);}
  return probe.complete&&probe.naturalWidth===size[0]&&probe.naturalHeight===size[1];
}
function showGeneratedPistolShotVfx(){
  if(!fpGeneratedWeaponActive||!pistolPresentationAssetReady40('pack40PistolEffects'))return false;
  const muzzle=playGeneratedCombatVfx('pistolMuzzle40',{anchor:'pistolMuzzle'});
  playGeneratedCombatVfx('pistolSmoke40',{anchor:'pistolMuzzle',delay:.04});
  return muzzle;
}
function riflePresentationAssetReady36(key){
  const asset=GAME_ASSETS.presentationVfx[key];if(!asset)return false;
  let probe=riflePresentationProbes36.get(asset);
  if(!probe){probe=new Image();riflePresentationProbes36.set(asset,probe);probe.src=gameAssetUrl(asset);}
  if(!probe.complete||!probe.naturalWidth||!probe.naturalHeight)return false;
  const size=key==='pack36RifleReload'?[2304,1152]:key==='pack36RifleEffects'?[768,768]:null;
  return !size||(probe.naturalWidth===size[0]&&probe.naturalHeight===size[1]);
}
function showGeneratedRifleShotVfx(){
  // The rifle body is hidden in optics; handle the effect without spawning it.
  if(G('sniper-scope')?.classList.contains('on'))return true;
  if(!fpGeneratedWeaponActive||!riflePresentationAssetReady36('pack36RifleEffects'))return false;
  const muzzle=playGeneratedCombatVfx('rifleMuzzle36',{anchor:'rifleMuzzle'});
  playGeneratedCombatVfx('rifleSmoke36',{anchor:'rifleMuzzle',delay:.04});
  return muzzle;
}
function showGeneratedWeaponShotVfx(weaponKey){
  if(weaponKey==='pistol')return showGeneratedPistolShotVfx();
  if(weaponKey==='rifle')return showGeneratedRifleShotVfx();
  if(weaponKey==='rocket')return fpGeneratedWeaponActive&&rocketPresentationAssetReady35('pack35RocketEffects')?playGeneratedCombatVfx('rocketMuzzle35',{anchor:'rocketMuzzle'}):false;
  if(weaponKey==='shotgun')return showGeneratedShotgunShotVfx();
  if(weaponKey==='sniper')return showGeneratedSniperShotVfx();
  // The normal first-person muzzle flash already owns pistol/rifle/shotgun/rocket/plasma feedback.
  // Do not stack generated weapon/hands/backblast tiles over the actual gun.
  return false;
}
function showGeneratedCasingFx(isShotgun=false){
  if(isShotgun&&typeof updateGeneratedShotgunAnchors38==='function')updateGeneratedShotgunAnchors38();
  const rotation=(Math.random()-.5)*24; // Keep the historical draw even when art replaces the casing.
  if(!isShotgun&&getW().key==='pistol')return fpGeneratedWeaponActive&&pistolPresentationAssetReady40('pack40PistolEffects')?playGeneratedCombatVfx('pistolCasing40',{anchor:'pistolEjection',rotation,scale:1}):false;
  const rifle=!isShotgun&&fpGeneratedWeaponActive&&getW().key==='rifle'&&riflePresentationAssetReady36('pack36RifleEffects');
  const shotgun=isShotgun&&fpGeneratedWeaponActive&&shotgunPresentationAssetReady37('pack37ShotgunEffects');
  return playGeneratedCombatVfx(shotgun?'shotgunCasing37':rifle?'rifleCasing36':isShotgun?'shotgunShell':'brassCasing',{anchor:shotgun?'shotgunEjection':rifle?'rifleEjection':'ejection',rotation,scale:rifle?1:isShotgun?1.02:.96});
}
function showGeneratedSniperCasingFx(){return playGeneratedCombatVfx(sniperPresentationAssetReady32('pack32SniperEffects')?'sniperCasing32':'sniperCasing23',{anchor:'ejection',rotation:-12,scale:1});}
function showGeneratedMagazineDropFx(weaponKey,render=true){
  if(!['pistol','rifle','plasma','sniper'].includes(weaponKey))return false;
  const rotation=(Math.random()-.5)*18;
  if(!render)return false;
  return playGeneratedCombatVfx('magazineDrop',{anchor:'magazine',rotation,scale:.94});
}
const surfaceImpactProbes45=new Map();
const surfaceImpactProbes29=new Map();
function surfaceImpactAssetReady45(){
  const asset=GAME_ASSETS.presentationVfx.pack45SurfaceImpact;if(!asset)return false;
  let probe=surfaceImpactProbes45.get(asset);
  if(!probe){probe=new Image();surfaceImpactProbes45.set(asset,probe);probe.src=gameAssetUrl(asset);}
  return probe.complete&&probe.naturalWidth===768&&probe.naturalHeight===512;
}
function surfaceImpactAssetReady29(){
  const asset=GAME_ASSETS.presentationVfx.pack29SurfaceImpact;if(!asset)return false;
  let probe=surfaceImpactProbes29.get(asset);
  if(!probe){probe=new Image();surfaceImpactProbes29.set(asset,probe);probe.src=gameAssetUrl(asset);}
  return probe.complete&&probe.naturalWidth===320&&probe.naturalHeight===320;
}
function warmSurfaceImpactVfx(){surfaceImpactAssetReady29();surfaceImpactAssetReady45();}
function showGeneratedSurfaceImpactVfx(material,pos,variant='normal'){
  const now=performance.now(),minGap=(typeof MOBILE_LOW!=='undefined'&&MOBILE_LOW)?72:28;
  if(now-(showGeneratedSurfaceImpactVfx._last||-999)<minGap)return false;
  showGeneratedSurfaceImpactVfx._last=now;
  // Preserve the historical RNG draw; a terminal never adds an electrical ring.
  const oldKind=variant==='tech'?'techImpact29':material==='metal'?'metalImpact29':variant==='heavy'?'heavyImpact29':'concreteImpact29';
  const rotation=(Math.random()-.5)*(oldKind==='metalImpact29'?12:oldKind==='heavyImpact29'?10:16);
  const options={worldPos:pos,rotation,scale:1};
  const primaryKind=material==='metal'?'metalImpact29':variant==='heavy'?'heavyImpact29':'concreteImpact29';
  if(material!=='wood'&&surfaceImpactAssetReady29()&&playGeneratedCombatVfx(primaryKind,options))return true;
  const fallbackKind=material==='metal'?'metalImpact45':material==='wood'?'woodImpact45':variant==='heavy'?'heavyImpact45':'concreteImpact45';
  if(surfaceImpactAssetReady45())return playGeneratedCombatVfx(fallbackKind,options);
  return false; // wallImpact retains depth-tested particles and surface marks.
}
function showGeneratedTerminalArcVfx(pos){
  // Hit-triggered terminal cable/arc overlay is retired.
  return false;
}
function showGeneratedRocketExplosionVfx(pos,groundImpact=false,wallSurface=null){
  const rotation=(Math.random()-.5)*8; // Preserve the one historical presentation draw.
  if(rocketPresentationAssetReady35('pack35RocketEffects')){
    const blast=playGeneratedCombatVfx('rocketExplosion35',{worldPos:pos,rotation,scale:1});
    playGeneratedCombatVfx('rocketResidual35',{worldPos:pos,rotation,scale:1,delay:.12});
    if(groundImpact&&rocketPresentationAssetReady35('pack35RocketScorch'))playGeneratedCombatVfx('rocketScorch35',{worldPos:pos,groundY:-.04,rotation,scale:1});
    if(wallSurface&&rocketPresentationAssetReady35('pack35RocketWall'))playGeneratedCombatVfx('rocketWall35',{worldPos:wallSurface.center,surfaceCorners:wallSurface.corners,rotation:0,scale:1});
    return blast;
  }
  return false; // Retired SVG blast must never return while Pack35 is loading/failed.
}
function showGeneratedPlasmaImpactVfx(pos){
  const now=performance.now(),minGap=(typeof MOBILE_LOW!=='undefined'&&MOBILE_LOW)?86:52;
  if(now-(showGeneratedPlasmaImpactVfx._last||-999)<minGap)return false;
  showGeneratedPlasmaImpactVfx._last=now;
  return playGeneratedCombatVfx('plasmaImpact',{worldPos:pos,rotation:(Math.random()-.5)*18,scale:.76});
}
function showGeneratedPlasmaReloadVfx(){
  return playGeneratedCombatVfx('plasmaReload',{anchor:'magazine',rotation:0,scale:1});
}
function showGeneratedShotgunShellInsertVfx(){
  return playGeneratedCombatVfx('shotgunShellInsert',{anchor:'magazine',rotation:-6,scale:1});
}
const SMOKE_PRESENTATION_DIMENSIONS42=Object.freeze({
  pack42SmokeReady:[1600,900],pack42SmokeThrow:[3840,1440],pack42SmokeReload:[3840,720],
  pack42SmokeWorld:[1536,768],pack42SmokeCloud:[1536,1024],pack42SmokeNear:[1536,1536],
  pack42SmokeFar:[1536,1024],pack42SmokeWisps:[1536,768],pack42SmokeInsideDense:[960,540],pack42SmokeInsideEdge:[960,540]
});
const smokePresentationProbes42=new Map();
function smokePresentationAssetReady42(key){
  const size=SMOKE_PRESENTATION_DIMENSIONS42[key],asset=GAME_ASSETS.presentationVfx[key];
  if(!size||!asset)return false;
  let state=smokePresentationProbes42.get(asset);
  if(!state){
    state={ready:false};const probe=new Image();smokePresentationProbes42.set(asset,state);
    probe.onload=async()=>{
      if(probe.naturalWidth!==size[0]||probe.naturalHeight!==size[1])return;
      try{await probe.decode();state.ready=probe.naturalWidth===size[0]&&probe.naturalHeight===size[1];}catch(e){state.ready=false;}
    };
    probe.onerror=()=>{state.ready=false;};probe.src=gameAssetUrl(asset);
  }
  return state.ready;
}
function playSmokeSound42(event,source=null){
  const name=event[0].toUpperCase()+event.slice(1);
  if(playBufferSfx('smoke'+name+'42',event==='vent'?.32:.45,source,32,1))return true;
  const mix=spatialAudioMix(source,32);if(mix.gain<=.02)return false;
  if(event==='vent')synthTone(95,.35,.012*mix.gain,'sawtooth',55);
  else synthTone(event==='pin'?850:event==='bounce'?270:440,.04,.035*mix.gain,'triangle',200);
  return false;
}
function showGeneratedSmokeThrowVfx(duration=.58){
  return smokePresentationAssetReady42('pack42SmokeThrow')&&playGeneratedFirstPersonAction('smokeThrow42',duration);
}
function showGeneratedSmokeReloadVfx(duration=.8){
  playSmokeSound42('reload');
  return smokePresentationAssetReady42('pack42SmokeReload')&&playGeneratedFirstPersonAction('smokeReload42',duration);
}
const grenadePresentationProbes34=new Map();
function grenadePresentationAssetReady34(key){
  const asset=GAME_ASSETS.presentationVfx[key];if(!asset)return false;
  let probe=grenadePresentationProbes34.get(asset);
  if(!probe){probe=new Image();grenadePresentationProbes34.set(asset,probe);probe.src=asset;}
  return probe.complete&&probe.naturalWidth>0&&probe.naturalHeight>0;
}
function showGeneratedGrenadeThrowVfx(){
  if(!grenadePresentationAssetReady34('pack34GrenadeThrow'))return false;
  return playGeneratedFirstPersonAction('grenadeThrow34',.58);
}
const BOMB_PRESENTATION_DIMENSIONS41=Object.freeze({
  pack41BombReady:[1600,900],pack41BombPlant:[3200,1800],pack41BombExplosion:[3840,3072],
  pack41BombWorldTop:[512,768],pack41BombSmoke:[768,768],pack41BombSmokeSequence:[1536,1024],pack41BombShockwave:[1536,1024]
});
const bombPresentationProbes41=new Map();
function bombPresentationAssetReady41(key){
  const size=BOMB_PRESENTATION_DIMENSIONS41[key],asset=GAME_ASSETS.presentationVfx[key];
  if(!GAME_PRESENTATION_ASSETS_ENABLED||!size||!asset)return false;
  let probe=bombPresentationProbes41.get(asset);
  if(!probe){probe=new Image();bombPresentationProbes41.set(asset,probe);probe.src=gameAssetUrl(asset);}
  return probe.complete&&probe.naturalWidth===size[0]&&probe.naturalHeight===size[1];
}
function clearBombPresentation41(){
  if(typeof clearBombWorldArt41==='function')clearBombWorldArt41();
  for(const item of [...generatedCombatVfx])if(item.kind.startsWith('bomb'))removeGeneratedCombatVfx(item);
}
function showGeneratedBombArmVfx(duration=.96){
  return bombPresentationAssetReady41('pack41BombPlant')&&playGeneratedFirstPersonAction('bombPlant41',duration);
}
function showGeneratedRicochetVfx(pos,surface='concrete'){
  const now=performance.now(),minGap=(typeof MOBILE_LOW!=='undefined'&&MOBILE_LOW)?58:24;
  if(now-(showGeneratedRicochetVfx._last||-999)<minGap)return false;
  showGeneratedRicochetVfx._last=now;
  // Keep the historical decoration RNG draw without rendering the removed fan/ring.
  Math.random();
  return false;
}
function showGeneratedPenetrationExitVfx(pos,surface='concrete'){
  // Exit already emits wallImpact. Retire the separate gold ring/triangles.
  Math.random();return false; // Preserve its historical presentation RNG draw.
}
function showGeneratedSmokeDeployVfx(pos){
  // Keep the historic random draw without publishing the retired flash/ring.
  Math.random();return false;
}
const MINE_PRESENTATION_DIMENSIONS39=Object.freeze({
  pack39MineReady:[1600,900],pack39MineThrow:[3840,1440],pack39MineReload:[3840,720],
  pack39MineWorld:[1536,1536],pack39MineExplosion:[2048,1024],pack39MineSmoke:[1536,1024],pack39MineUtility:[1536,1024]
});
const minePresentationProbes39=new Map();
function minePresentationAssetReady39(key){
  const size=MINE_PRESENTATION_DIMENSIONS39[key],asset=GAME_ASSETS.presentationVfx[key];
  if(!GAME_PRESENTATION_ASSETS_ENABLED||!size||!asset)return false;
  let probe=minePresentationProbes39.get(asset);
  if(!probe){probe=new Image();minePresentationProbes39.set(asset,probe);probe.src=gameAssetUrl(asset);}
  return probe.complete&&probe.naturalWidth===size[0]&&probe.naturalHeight===size[1];
}
function mineDetonationPresentationReady39(){
  return ['pack39MineExplosion','pack39MineSmoke','pack39MineUtility'].map(minePresentationAssetReady39).every(Boolean);
}
function showGeneratedMineDetonationVfx(pos,groundY=null){
  const rotation=(Math.random()-.5)*8; // Preserve the previous one presentation draw.
  if(!mineDetonationPresentationReady39())return playGeneratedCombatVfx('mineDetonation',{worldPos:pos,rotation,scale:1.02});
  const options={worldPos:pos,rotation:0,scale:1};
  const blast=playGeneratedCombatVfx('mineExplosion39',options);
  playGeneratedCombatVfx('mineSmoke39',{...options,delay:.12});
  playGeneratedCombatVfx('mineMetal39',options);playGeneratedCombatVfx('mineElectronics39',options);
  if(groundY!==null)playGeneratedCombatVfx('mineScorch39',{...options,groundY,rotation,delay:.2});
  return blast;
}
function showGeneratedMineEvent39(kind,pos){
  return minePresentationAssetReady39('pack39MineUtility')&&playGeneratedCombatVfx(kind,{worldPos:pos,rotation:0,scale:1});
}
function showGeneratedBombDetonationVfx(pos){
  const rotation=(Math.random()-.5)*6; // Keep the historical single decoration RNG draw.
  const seq=(showGeneratedBombDetonationVfx._seq=(showGeneratedBombDetonationVfx._seq||0)+1);
  if(bombPresentationAssetReady41('pack41BombExplosion')){
    const center=pos.clone();center.y=.08;
    const base=playGeneratedCombatVfx('bombExplosion41',{worldPos:center,rotation:0,scale:1});
    if(bombPresentationAssetReady41('pack41BombShockwave'))playGeneratedCombatVfx('bombShockwave41',{worldPos:center,groundY:0,rotation:0,scale:1,delay:.04});
    if(bombPresentationAssetReady41('pack41BombSmokeSequence'))playGeneratedCombatVfx('bombSmokeSequence41',{worldPos:center,rotation:0,scale:1,delay:.85});
    if(bombPresentationAssetReady41('pack41BombSmoke'))playGeneratedCombatVfx('bombSmoke41',{worldPos:center,rotation,scale:1,delay:1.8});
    if(rocketPresentationAssetReady35('pack35RocketScorch'))playGeneratedCombatVfx('bombScorch41',{worldPos:pos,groundY:0,rotation:seq*37%360,scale:1.8,delay:.25});
    return base;
  }
  return false; // Missing new art never brings back obsolete bomb pictures.
}
function showGeneratedFragGrenadeVfx(pos,groundY=pos.y<=.35?-.04:null){
  // Preserve all six historical presentation RNG draws for subsequent combat/AI.
  const rotation=(Math.random()-.5)*18,scale=.96+Math.random()*.10;
  const blastRotation=(Math.random()-.5)*8,debrisRotation=(Math.random()-.5)*18;
  const smokeRotation=(Math.random()-.5)*6,scorchRotation=(Math.random()-.5)*12;
  const complete=['pack34GrenadeBlast','pack34GrenadeSmoke','pack34GrenadeDebris','pack34GrenadeScorch'].map(grenadePresentationAssetReady34).every(Boolean);
  const center=pos.clone();center.y+=.8;
  if(complete){
    const blast=playGeneratedCombatVfx('grenadeExplosion34',{worldPos:center,rotation:blastRotation,scale:1.02});
    playGeneratedCombatVfx('grenadeDebris34',{worldPos:center,rotation:debrisRotation,scale:1});
    playGeneratedCombatVfx('grenadeSmoke34',{worldPos:center,rotation:smokeRotation,scale:1,delay:.16});
    if(groundY!==null)playGeneratedCombatVfx('grenadeScorch34',{worldPos:pos,groundY,rotation:scorchRotation,scale:.92,delay:.42});
    return blast;
  }
  // Retained legacy art uses the same local world sizing/opaque-cover policy.
  const options={worldPos:center,rotation,scale};
  const base=playGeneratedCombatVfx('fragGrenade',options);
  playGeneratedCombatVfx('grenadeExplosion21',{worldPos:center,rotation:blastRotation,scale:1.02});
  playGeneratedCombatVfx('grenadeDebris21',{worldPos:center,rotation:debrisRotation,scale:1});
  playGeneratedCombatVfx('grenadeSmoke21',{worldPos:center,rotation:smokeRotation,scale:1,delay:.16});
  if(groundY!==null)playGeneratedCombatVfx('grenadeScorch21',{worldPos:pos,groundY,rotation:scorchRotation,scale:.92,delay:.42});
  return base;
}
function suppressLegacyGrenadeMotionVfx(source){
  for(const item of [...generatedCombatVfx])if(item.worldObject===source&&(item.kind==='grenadeFlight'||item.kind==='grenadeFuse'))removeGeneratedCombatVfx(item);
}
function showGeneratedGrenadeFlightVfx(source){
  if(!source?.position?.clone)return false;
  if(typeof grenadeFlightPresentationAvailable==='function'&&grenadeFlightPresentationAvailable())return true;
  return playGeneratedCombatVfx('grenadeFlight',{worldObject:source,rotation:0,scale:.92});
}
function showGeneratedGrenadeFuseVfx(source){
  if(!source?.position?.clone)return false;
  if(typeof grenadeFlightPresentationAvailable==='function'&&grenadeFlightPresentationAvailable())return true;
  return playGeneratedCombatVfx('grenadeFuse',{worldObject:source,rotation:0,scale:1});
}
let generatedPlayerDeathVfxAge=-1,generatedPlayerDeathVfxFrameIndex=-1,generatedPlayerDeathReducedMotion=false;
const GENERATED_PLAYER_DEATH_VFX_DURATION=1.18;
function ensureGeneratedPlayerDeathVfx(){
  let el=byId('player-death-vfx');if(el)return el;
  el=document.createElement('div');el.id='player-death-vfx';el.setAttribute('aria-hidden','true');
  const flash=byId('death-flash');
  if(flash?.parentNode)flash.parentNode.insertBefore(el,flash.nextSibling);else document.body.appendChild(el);
  return el;
}
function playerDeathVfxFrame(index=0){
  const frame=Math.max(0,Math.min(7,Math.floor(Number(index)||0)));
  return presentationAtlasFrame(GAME_ASSETS.presentationVfx.pack15Death,frame,0,8,1);
}
function showGeneratedPlayerDeathVfx(){
  const el=ensureGeneratedPlayerDeathVfx(),frame=playerDeathVfxFrame(0);if(!el||!frame)return false;
  generatedPlayerDeathReducedMotion=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  generatedPlayerDeathVfxAge=0;generatedPlayerDeathVfxFrameIndex=generatedPlayerDeathReducedMotion?1:0;
  applyPresentationAtlasFrame(el,playerDeathVfxFrame(generatedPlayerDeathVfxFrameIndex));
  el.style.opacity='1';el.classList.add('on');return true;
}
function tickGeneratedPlayerDeathVfx(dt){
  if(generatedPlayerDeathVfxAge<0)return;
  const el=byId('player-death-vfx');if(!el){generatedPlayerDeathVfxAge=-1;return;}
  const duration=generatedPlayerDeathReducedMotion?0.55:GENERATED_PLAYER_DEATH_VFX_DURATION;
  generatedPlayerDeathVfxAge+=Math.max(0,Math.min(.05,Number(dt)||0));
  const progress=Math.max(0,Math.min(1,generatedPlayerDeathVfxAge/Math.max(.001,duration)));
  const frame=generatedPlayerDeathReducedMotion?1:Math.min(7,Math.floor(progress*8));
  if(frame!==generatedPlayerDeathVfxFrameIndex){applyPresentationAtlasFrame(el,playerDeathVfxFrame(frame));generatedPlayerDeathVfxFrameIndex=frame;}
  el.style.opacity=String(generatedPlayerDeathReducedMotion?Math.max(0,1-progress):progress>.72?Math.max(0,(1-progress)/.28):1);
  if(progress>=1)resetGeneratedPlayerDeathVfx();
}
function resetGeneratedPlayerDeathVfx(){
  generatedPlayerDeathVfxAge=-1;generatedPlayerDeathVfxFrameIndex=-1;generatedPlayerDeathReducedMotion=false;
  const el=byId('player-death-vfx');if(!el)return;el.classList.remove('on');el.style.opacity='0';
}
// Generated Asset Pack 10 — time-based one-shot VFX atlas; procedural effects remain fallback.
// Generated Asset Pack 8 — transient DOM-only presentation helpers.
function showWeaponSwitchSwipe(){
  // Intentionally disabled: the center-screen swipe obscures the view during weapon changes.
}
function syncComboMeterPresentation(){
  const el=byId('combo');if(!el)return;
  if(combo<=0){el.classList.remove('generated-meter');return;}
  applyPresentationAtlasVariables(el,'combo-meter',comboMeterPresentationFrame(combo));
  el.classList.add('generated-meter');
}

function syncGeneratedRifleEffectAnchors36(){
  for(const item of generatedCombatVfx)if(item.anchor==='rifleMuzzle'&&item.age>=item.delay)positionGeneratedCombatVfx(item);
}
function syncGeneratedShotgunEffectAnchors38(){
  for(const item of generatedCombatVfx)if(item.anchor==='shotgunMuzzle'&&item.age>=item.delay)positionGeneratedCombatVfx(item);
}
function syncGeneratedPistolEffectAnchors40(){
  for(const item of generatedCombatVfx)if(item.anchor==='pistolMuzzle'&&item.age>=item.delay)positionGeneratedCombatVfx(item);
}
