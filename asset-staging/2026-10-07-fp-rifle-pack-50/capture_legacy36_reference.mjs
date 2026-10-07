import { writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { openBrowserCdpSession } from '../../scripts/browser-cdp-session.mjs';

function setupLegacy(){
  window.__PACK50_CAPTURE_SAVE=window.ZAP_FP_RIFLE_50;
  window.ZAP_FP_RIFLE_50=null;
  buildGun(WEAPON_BY_KEY.rifle);
  gunGrp.visible=true;
  gunGrp.position.copy(gunBasePos);
  gunGrp.rotation.set(0,0,0);
  running=true;paused=true;
  syncGeneratedFirstPersonWeaponArt(true);
  for(const id of ['menu','loading','pause','settings-modal','lvl-ann','perk-menu','rotate-lock']){
    const el=document.getElementById(id);if(el)el.style.display='none';
  }
  const ui=document.getElementById('ui');if(ui)ui.style.display='block';
  for(const id of ['left-tactical-stack','team-bar','weapon-bar','stats-panel','hud','whud','hp-wrap','xp-wrap']){
    const el=document.getElementById(id);if(el)el.style.display='none';
  }
  return true;
}
const session=await openBrowserCdpSession({
  endpoint:'http://127.0.0.1:9222/json/list',waitMs:10000,
  pageMatches:p=>p.url.startsWith('http://127.0.0.1:8000'),
  pageUnavailableMessage:()=> 'legacy capture unavailable',
  websocketTimeoutMessage:'legacy capture timeout',websocketErrorMessage:'legacy capture failed'
});
const {send}=session;
try{
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1600,height:900,deviceScaleFactor:1,mobile:false});
  await send('Runtime.evaluate',{expression:'('+setupLegacy.toString()+')()',returnByValue:true});
  await sleep(1000);
  await send('Runtime.evaluate',{expression:'syncGeneratedFirstPersonWeaponArt(true); renderer.render(scene,camera);',returnByValue:true});
  await sleep(150);
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
  writeFileSync(new URL('./browser-fp-rifle36-reference.png',import.meta.url),Buffer.from(shot.data,'base64'));
  console.log('Legacy Pack36 reference captured');
}finally{
  try{await send('Runtime.evaluate',{expression:'window.ZAP_FP_RIFLE_50=window.__PACK50_CAPTURE_SAVE;delete window.__PACK50_CAPTURE_SAVE;'});}catch{}
  try{await send('Page.reload',{ignoreCache:true});}catch{}
  session.close();
}
