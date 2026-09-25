'use strict';

// Player settings, Web Audio SFX and presentation-only combat feedback.
const GAME_SETTINGS_KEY='zap_zone_settings_v1';
const GAME_SETTINGS_DEFAULTS=Object.freeze({
  sensitivity:1,sfx:.65,screenShake:true,dynamicCrosshair:true,showFps:false
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
      showFps:saved.showFps===true
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
  pistol:'assets/audio/pistol.wav',
  rifle:'assets/audio/rifle.wav',
  shotgun:'assets/audio/shotgun.wav',
  sniper:'assets/audio/sniper.wav',
  rocket:'assets/audio/rocket-launch.wav',
  plasma:'assets/audio/plasma.wav',
  explosion:'assets/audio/explosion.wav',
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
const gameAudioBuffers=new Map(),gameAudioLoads=new Map();
const acousticProfileCache=new Map(),acousticTailCooldowns=new Map();
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
  if(gameAudioBuffers.has(key))return Promise.resolve(gameAudioBuffers.get(key));
  if(gameAudioLoads.has(key))return gameAudioLoads.get(key);
  const path=GAME_AUDIO_ASSETS[key],ctx=gameAudioCtx;
  if(!path||!ctx)return Promise.resolve(null);
  const load=fetch(path)
    .then(res=>{if(!res.ok)throw new Error('HTTP '+res.status);return res.arrayBuffer();})
    .then(raw=>ctx.decodeAudioData(raw.slice(0)))
    .then(buffer=>{gameAudioBuffers.set(key,buffer);gameAudioLoads.delete(key);return buffer;})
    .catch(err=>{gameAudioLoads.delete(key);console.warn('Не удалось загрузить аудио asset:',path,err);return null;});
  gameAudioLoads.set(key,load);return load;
}
function preloadGameAudio(){
  if(!gameAudioCtx||gameSettings.sfx<=0)return;
  for(const key of Object.keys(GAME_AUDIO_ASSETS))loadGameAudioAsset(key);
}
function playBufferSfx(key,intensity=1,source=null,maxDistance=82,rate=1,delay=0){
  const ctx=ensureGameAudio();if(!ctx||!gameAudioMaster)return false;
  const buffer=gameAudioBuffers.get(key);
  if(!buffer){loadGameAudioAsset(key);return false;}
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
  const key={reload:'reloadMag',reloadDone:'reloadDone',shell:'shellInsert',bolt:'boltCycle',pump:'pumpCycle',equip:'equipSample'}[name];
  const heavy=weaponKey==='sniper'||weaponKey==='shotgun'||weaponKey==='rocket';
  const rate=(heavy?.94:1.02)*(.97+Math.random()*.06);
  if(key&&playBufferSfx(key,Math.max(.12,Math.min(1.15,intensity)),source,source?38:18,rate))return;
  playSfx(name,intensity,weaponKey);
}
function startBattlefieldAmbience(){
  if(battlefieldAmbienceSource||battlefieldAmbiencePending||gameSettings.sfx<=0)return;
  const ctx=ensureGameAudio();if(!ctx||!gameAudioMaster)return;
  const buffer=gameAudioBuffers.get('battlefield');
  if(!buffer){
    battlefieldAmbiencePending=true;
    loadGameAudioAsset('battlefield').then(()=>{battlefieldAmbiencePending=false;startBattlefieldAmbience();});
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
  showThreatDirection(source,sniper?'sniper':'bullet',.55+proximity*.55);
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
  const el=byId('hitmarker');if(!el)return;el.className='';void el.offsetWidth;el.classList.add('on',kind);
  clearTimeout(hitMarkerTimer);hitMarkerTimer=setTimeout(()=>{el.className='';},220);pulseCrosshair('hit');
}
function pulseCrosshair(kind='fire'){
  if(!gameSettings.dynamicCrosshair)return;const el=byId('xhair');if(!el)return;
  const cls=kind==='hit'?'dynamic-hit':'dynamic-fire';el.classList.remove('dynamic-fire','dynamic-hit');void el.offsetWidth;el.classList.add(cls);
  clearTimeout(crosshairTimer);crosshairTimer=setTimeout(()=>el.classList.remove('dynamic-fire','dynamic-hit'),kind==='hit'?140:95);
}

let damageDirectionTimer=0,threatDirectionTimer=0;
function showDamageDirection(attacker,kind='bullet',amount=0){
  const el=byId('damage-direction');if(!el)return;
  const degrees=combatBearingDegrees(attacker);
  el.style.transform='translate(-50%,-50%) rotate('+degrees.toFixed(1)+'deg)';el.className='';void el.offsetWidth;el.classList.add('on');
  if(kind==='rocket'||kind==='mine'||kind==='bomb')el.classList.add('explosive');
  el.style.setProperty('--damage-strength',Math.max(.72,Math.min(1.18,.78+(Number(amount)||0)/120)).toFixed(2));
  clearTimeout(damageDirectionTimer);damageDirectionTimer=setTimeout(()=>{el.className='';},760);
}
function showThreatDirection(source,kind='bullet',intensity=.6){
  const el=byId('threat-direction');if(!el)return;
  const degrees=combatBearingDegrees(source);
  el.style.transform='translate(-50%,-50%) rotate('+degrees.toFixed(1)+'deg)';
  el.style.setProperty('--threat-strength',Math.max(.45,Math.min(1.15,Number(intensity)||.6)).toFixed(2));
  el.className='';void el.offsetWidth;el.classList.add('on',kind);
  clearTimeout(threatDirectionTimer);threatDirectionTimer=setTimeout(()=>{el.className='';},520);
}

let shakeTime=0,shakeDuration=.1,shakePower=0,fpsAccum=0,fpsFrames=0;
function triggerScreenShake(power=.3,duration=.12){
  if(!gameSettings.screenShake)return;const p=Math.max(0,Math.min(1.4,Number(power)||0));if(p<=0)return;
  shakePower=Math.max(shakePower,p);shakeDuration=Math.max(shakeDuration,Math.max(.06,Number(duration)||.12));shakeTime=Math.max(shakeTime,shakeDuration);
}
function tickGamePresentation(dt,ts){
  const safeDt=Math.max(0,Math.min(.05,Number(dt)||0)),fps=byId('fps-counter');
  playerSuppression=Math.max(0,playerSuppression-safeDt*(playerSuppression>.85?.34:.52));
  playerSuppressionPulse=Math.max(0,playerSuppressionPulse-safeDt*1.35);
  const suppressionReticle=byId('xhair');
  if(suppressionReticle){
    suppressionReticle.classList.toggle('suppressed',playerSuppression>.12);
    suppressionReticle.style.setProperty('--suppression',Math.min(1,playerSuppression).toFixed(3));
  }
  if(gameSettings.showFps&&fps){
    fps.style.display='block';fpsAccum+=safeDt;fpsFrames++;
    if(fpsAccum>=.45){fps.textContent='FPS '+Math.round(fpsFrames/Math.max(.001,fpsAccum));fpsAccum=0;fpsFrames=0;}
  }else if(fps){fps.style.display='none';fpsAccum=0;fpsFrames=0;}
  if(shakeTime>0&&gameSettings.screenShake){
    shakeTime=Math.max(0,shakeTime-safeDt);const remain=shakeDuration>0?shakeTime/shakeDuration:0,amp=shakePower*remain;
    const x=Math.sin((ts||0)*.091)*amp*5.2,y=Math.cos((ts||0)*.117)*amp*3.6;
    canvas.style.transform='translate3d('+x.toFixed(2)+'px,'+y.toFixed(2)+'px,0) scale('+(1+amp*.004).toFixed(4)+')';
    if(shakeTime<=0){shakePower=0;canvas.style.transform='';}
  }else if(typeof canvas!=='undefined'&&canvas.style.transform){canvas.style.transform='';shakeTime=0;shakePower=0;}
}

function syncSettingsControls(){
  const sens=byId('setting-sensitivity'),sfx=byId('setting-sfx'),shake=byId('setting-shake'),crosshair=byId('setting-crosshair'),fps=byId('setting-fps');
  if(sens)sens.value=String(gameSettings.sensitivity);if(sfx)sfx.value=String(gameSettings.sfx);
  if(shake)shake.checked=gameSettings.screenShake;if(crosshair)crosshair.checked=gameSettings.dynamicCrosshair;if(fps)fps.checked=gameSettings.showFps;
  if(byId('setting-sensitivity-value'))byId('setting-sensitivity-value').textContent=gameSettings.sensitivity.toFixed(2)+'×';
  if(byId('setting-sfx-value'))byId('setting-sfx-value').textContent=Math.round(gameSettings.sfx*100)+'%';
}
function applyGameSettings(){
  if(gameAudioMaster&&gameAudioCtx)gameAudioMaster.gain.setTargetAtTime(gameSettings.sfx,gameAudioCtx.currentTime,.02);
  const fps=byId('fps-counter');if(fps)fps.style.display=gameSettings.showFps?'block':'none';
  if(!gameSettings.screenShake){shakeTime=0;shakePower=0;if(typeof canvas!=='undefined')canvas.style.transform='';}
  syncSettingsControls();
}
function openGameSettings(){const modal=byId('settings-modal');if(!modal)return;settingsOpen=true;syncSettingsControls();modal.classList.add('on');modal.setAttribute('aria-hidden','false');playSfx('ui');}
function closeGameSettings(){const modal=byId('settings-modal');if(!modal)return;settingsOpen=false;modal.classList.remove('on');modal.setAttribute('aria-hidden','true');saveGameSettings();playSfx('ui');}
function bindGameSettings(){
  const sens=byId('setting-sensitivity'),sfx=byId('setting-sfx'),shake=byId('setting-shake'),crosshair=byId('setting-crosshair'),fps=byId('setting-fps');
  const primeAudio=()=>{ensureGameAudio();preloadGameAudio();startBattlefieldAmbience();};
  window.addEventListener('pointerdown',primeAudio,{once:true,capture:true});
  window.addEventListener('keydown',primeAudio,{once:true,capture:true});
  byId('menuSettingsBtn')?.addEventListener('click',openGameSettings);byId('pauseSettingsBtn')?.addEventListener('click',openGameSettings);byId('settingsCloseBtn')?.addEventListener('click',closeGameSettings);
  sens?.addEventListener('input',()=>{gameSettings.sensitivity=clampSetting(sens.value,.5,2,1);saveGameSettings();});
  sfx?.addEventListener('input',()=>{gameSettings.sfx=clampSetting(sfx.value,0,1,.65);ensureGameAudio();preloadGameAudio();startBattlefieldAmbience();saveGameSettings();});
  shake?.addEventListener('change',()=>{gameSettings.screenShake=shake.checked;saveGameSettings();});
  crosshair?.addEventListener('change',()=>{gameSettings.dynamicCrosshair=crosshair.checked;saveGameSettings();});
  fps?.addEventListener('change',()=>{gameSettings.showFps=fps.checked;saveGameSettings();});
  window.addEventListener('keydown',e=>{if(e.code==='Escape'&&settingsOpen){e.preventDefault();e.stopImmediatePropagation();closeGameSettings();}},true);
  applyGameSettings();
}
bindGameSettings();
