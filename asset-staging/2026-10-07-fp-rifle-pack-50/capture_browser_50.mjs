import { writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { openBrowserCdpSession } from '../../scripts/browser-cdp-session.mjs';

function setupAdsCapture(){
  const model=gunGrp.userData.firstPersonRifle50;
  const adsX=gunBasePos.x*(1-.94);
  const adsY=gunBasePos.y+.035;
  const adsZ=gunBasePos.z-.075;
  gunGrp.position.set(adsX,adsY,adsZ);
  gunGrp.rotation.set(0,0,0);
  updateFirstPersonRifleModel50(model,{adsBlend:1,recoil:0,reloading:false,reloadProgress:0,cycle:0,shotSequence});
  renderer.render(scene,camera);
  return {position:gunGrp.position.toArray(),modelPosition:model?.position?.toArray()||[]};
}

function setupCapture(){
  buildGun(WEAPON_BY_KEY.rifle);
  gunGrp.visible=true;
  gunGrp.position.copy(gunBasePos);
  gunGrp.rotation.set(0,0,0);
  hideGeneratedFirstPersonWeaponArt(true);
  for(const id of ['menu','loading','pause','settings-modal','lvl-ann','perk-menu','rotate-lock']){
    const el=document.getElementById(id);if(el)el.style.display='none';
  }
  const ui=document.getElementById('ui');if(ui)ui.style.display='block';
  for(const id of ['left-tactical-stack','team-bar','weapon-bar','stats-panel','hud','whud','hp-wrap','xp-wrap']){
    const el=document.getElementById(id);if(el)el.style.display='none';
  }
  scene.background=new THREE.Color(0x111820);
  renderer.render(scene,camera);
  return {
    pack:gunGrp.userData.firstPersonRifle50?.userData?.packVersion||0,
    pos:gunGrp.position.toArray(),
    scale:gunGrp.userData.firstPersonRifle50?.scale?.toArray()||[]
  };
}

const session=await openBrowserCdpSession({
  endpoint:'http://127.0.0.1:9222/json/list',
  waitMs:10000,
  pageMatches:p=>p.url.startsWith('http://127.0.0.1:8000'),
  pageUnavailableMessage:()=> 'Pack50 capture: HTTP page unavailable',
  websocketTimeoutMessage:'Pack50 capture: websocket timeout',
  websocketErrorMessage:'Pack50 capture: websocket failed'
});
const {send}=session;
try{
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1600,height:900,deviceScaleFactor:1,mobile:false});
  const evaluated=await send('Runtime.evaluate',{expression:'('+setupCapture.toString()+')()',returnByValue:true});
  if(evaluated.exceptionDetails)throw new Error(JSON.stringify(evaluated.exceptionDetails));
  await sleep(250);
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
  writeFileSync(new URL('./browser-fp-rifle50-http.png',import.meta.url),Buffer.from(shot.data,'base64'));
  const ads=await send('Runtime.evaluate',{expression:'('+setupAdsCapture.toString()+')()',returnByValue:true});
  if(ads.exceptionDetails)throw new Error(JSON.stringify(ads.exceptionDetails));
  await sleep(120);
  const adsShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
  writeFileSync(new URL('./browser-fp-rifle50-ads-http.png',import.meta.url),Buffer.from(adsShot.data,'base64'));
  console.log('Pack50 capture written',JSON.stringify({hip:evaluated.result?.value,ads:ads.result?.value}));
}finally{
  try{await send('Page.reload',{ignoreCache:true});}catch{}
  session.close();
}
