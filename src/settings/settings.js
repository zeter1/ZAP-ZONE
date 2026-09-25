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

let damageDirectionTimer=0;
function showDamageDirection(attacker,kind='bullet',amount=0){
  const el=byId('damage-direction');if(!el)return;let degrees=180;
  const src=attacker&&(attacker.group?.position||attacker.m?.position||attacker.position);
  if(src&&typeof yaw==='number'&&typeof camera!=='undefined'){
    const dx=src.x-camera.position.x,dz=src.z-camera.position.z;
    const sourceHeading=Math.atan2(dx,dz),forwardHeading=Math.atan2(-Math.sin(yaw),-Math.cos(yaw));
    let diff=sourceHeading-forwardHeading;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
    degrees=diff*180/Math.PI;
  }
  el.style.transform='translate(-50%,-50%) rotate('+degrees.toFixed(1)+'deg)';el.className='';void el.offsetWidth;el.classList.add('on');
  if(kind==='rocket'||kind==='mine'||kind==='bomb')el.classList.add('explosive');
  el.style.setProperty('--damage-strength',Math.max(.72,Math.min(1.18,.78+(Number(amount)||0)/120)).toFixed(2));
  clearTimeout(damageDirectionTimer);damageDirectionTimer=setTimeout(()=>{el.className='';},760);
}

let shakeTime=0,shakeDuration=.1,shakePower=0,fpsAccum=0,fpsFrames=0;
function triggerScreenShake(power=.3,duration=.12){
  if(!gameSettings.screenShake)return;const p=Math.max(0,Math.min(1.4,Number(power)||0));if(p<=0)return;
  shakePower=Math.max(shakePower,p);shakeDuration=Math.max(shakeDuration,Math.max(.06,Number(duration)||.12));shakeTime=Math.max(shakeTime,shakeDuration);
}
function tickGamePresentation(dt,ts){
  const safeDt=Math.max(0,Math.min(.05,Number(dt)||0)),fps=byId('fps-counter');
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
  byId('menuSettingsBtn')?.addEventListener('click',openGameSettings);byId('pauseSettingsBtn')?.addEventListener('click',openGameSettings);byId('settingsCloseBtn')?.addEventListener('click',closeGameSettings);
  sens?.addEventListener('input',()=>{gameSettings.sensitivity=clampSetting(sens.value,.5,2,1);saveGameSettings();});
  sfx?.addEventListener('input',()=>{gameSettings.sfx=clampSetting(sfx.value,0,1,.65);ensureGameAudio();saveGameSettings();});
  shake?.addEventListener('change',()=>{gameSettings.screenShake=shake.checked;saveGameSettings();});
  crosshair?.addEventListener('change',()=>{gameSettings.dynamicCrosshair=crosshair.checked;saveGameSettings();});
  fps?.addEventListener('change',()=>{gameSettings.showFps=fps.checked;saveGameSettings();});
  window.addEventListener('keydown',e=>{if(e.code==='Escape'&&settingsOpen){e.preventDefault();e.stopImmediatePropagation();closeGameSettings();}},true);
  applyGameSettings();
}
bindGameSettings();
