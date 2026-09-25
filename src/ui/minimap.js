'use strict';

// ─── TACTICAL MINIMAP ───────────────────
// North stays up. The background is derived from the same collision geometry used by gameplay.
const MINIMAP_WORLD_HALF=92;
const minimapCanvas=G('frontline-minimap');
const minimapCtx=minimapCanvas?.getContext('2d',{alpha:false})||null;
let minimapTickAcc=0;
const MINIMAP_HZ=10;

function minimapWorldToCanvas(x,z){
  const s=minimapCanvas.width/(MINIMAP_WORLD_HALF*2);
  return{x:(x+MINIMAP_WORLD_HALF)*s,y:(MINIMAP_WORLD_HALF-z)*s,s};
}
function minimapDrawRotatedRect(item){
  const p=minimapWorldToCanvas(item.x,item.z),ctx=minimapCtx;
  const w=item.w*p.s,d=item.d*p.s;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-item.ry);
  let fill='#3b4652';
  if(item.kind==='cover')fill=item.variant===2?'#7b6348':'#617b8d';
  else if(item.kind==='crate')fill='#755b43';
  else if(item.kind==='terminal')fill='#2b8198';
  else if(item.kind==='tree')fill='#315b40';
  else if(item.impactMaterial==='metal')fill='#536572';
  ctx.fillStyle=fill;ctx.globalAlpha=item.kind==='tree'?.72:.96;
  ctx.fillRect(-w/2,-d/2,w,d);
  if((item.kind==='cover'||item.impactMaterial==='metal')&&Math.max(w,d)>3){
    ctx.strokeStyle=item.kind==='cover'?'#7bdfff':'#647786';ctx.globalAlpha=.52;ctx.lineWidth=1;
    ctx.strokeRect(-w/2,-d/2,w,d);
  }
  ctx.restore();ctx.globalAlpha=1;
}
function minimapDrawStatic(){
  const ctx=minimapCtx,size=minimapCanvas.width;
  const grad=ctx.createRadialGradient(size*.5,size*.48,size*.08,size*.5,size*.5,size*.72);
  grad.addColorStop(0,'#17212b');grad.addColorStop(1,'#05090e');
  ctx.fillStyle=grad;ctx.fillRect(0,0,size,size);
  ctx.save();ctx.beginPath();ctx.arc(size/2,size/2,size/2-3,0,Math.PI*2);ctx.clip();
  ctx.strokeStyle='rgba(128,184,218,.10)';ctx.lineWidth=1;
  for(let w=-80;w<=80;w+=20){
    const a=minimapWorldToCanvas(w,-MINIMAP_WORLD_HALF),b=minimapWorldToCanvas(w,MINIMAP_WORLD_HALF);
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    const c=minimapWorldToCanvas(-MINIMAP_WORLD_HALF,w),d=minimapWorldToCanvas(MINIMAP_WORLD_HALF,w);
    ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.stroke();
  }
  for(const item of minimapStaticGeometry){
    if(item.h<.55)continue;
    if(item.kind==='tree'&&MOBILE_LOW)continue;
    minimapDrawRotatedRect(item);
  }
  ctx.restore();
}
function minimapDrawZone(zone){
  const ctx=minimapCtx,p=minimapWorldToCanvas(zone.x,zone.z);
  const radius=Math.max(7,zone.r*p.s),owner=frontlineZoneOwners[zone.id],active=frontlineObjective.zoneId===zone.id;
  const fill=owner==='ally'?'rgba(54,164,255,.18)':owner==='enemy'?'rgba(255,55,78,.17)':'rgba(230,235,240,.055)';
  const stroke=active?'#ffe166':owner==='ally'?'#54c8ff':owner==='enemy'?'#ff6576':'rgba(205,220,232,.34)';
  ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
  ctx.lineWidth=active?2.8:1.45;ctx.strokeStyle=stroke;ctx.stroke();
  if(active){
    const pulse=.36+(Math.sin(performance.now()*.006)+1)*.12;
    ctx.beginPath();ctx.arc(p.x,p.y,radius+4,0,Math.PI*2);ctx.strokeStyle='rgba(255,225,102,'+pulse+')';ctx.lineWidth=1.6;ctx.stroke();
  }
  ctx.fillStyle=active?'#fff0a1':owner==='ally'?'#9be6ff':owner==='enemy'?'#ff9aa5':'#c8d0d7';
  ctx.font='900 9px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText({mid:'Ц',north:'С',south:'Ю',west:'З',east:'В'}[zone.id]||zone.label[0],p.x,p.y);
  ctx.restore();
}
function minimapDrawTriangle(x,z,heading,color,size=5){
  const ctx=minimapCtx,p=minimapWorldToCanvas(x,z);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-heading);
  ctx.beginPath();ctx.moveTo(0,-size*1.45);ctx.lineTo(size,size);ctx.lineTo(0,size*.50);ctx.lineTo(-size,size);ctx.closePath();
  ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=size*.9;ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(3,10,16,.92)';ctx.lineWidth=Math.max(1,size*.22);ctx.stroke();ctx.restore();
}
function renderTacticalMinimap(){
  if(!minimapCtx||!minimapCanvas)return;
  minimapDrawStatic();
  for(const zone of BOT_MAP_ZONES)minimapDrawZone(zone);
  for(const pk of pickups){
    if(pk.type!=='weapon'||!pk.m.visible)continue;
    const p=minimapWorldToCanvas(pk.m.position.x,pk.m.position.z);
    minimapCtx.beginPath();minimapCtx.arc(p.x,p.y,1.55,0,Math.PI*2);
    minimapCtx.fillStyle='rgba(255,205,72,.82)';minimapCtx.fill();
  }
  for(const bot of enemies){
    if(!bot.alive||bot.team!=='ally')continue;
    const pos=bot.group.position;minimapDrawTriangle(pos.x,pos.z,bot.group.rotation.y,'#5fc9ff',3.6);
  }
  const playerHeading=Math.atan2(-Math.sin(yaw),-Math.cos(yaw));
  minimapDrawTriangle(camera.position.x,camera.position.z,playerHeading,'#e6ffff',5.5);
  const size=minimapCanvas.width;
  minimapCtx.save();minimapCtx.beginPath();minimapCtx.arc(size/2,size/2,size/2-3,0,Math.PI*2);
  minimapCtx.strokeStyle='rgba(154,226,255,.78)';minimapCtx.lineWidth=2;minimapCtx.stroke();minimapCtx.restore();
}
function tickTacticalMinimap(dt){
  minimapTickAcc+=dt;if(minimapTickAcc<1/MINIMAP_HZ)return;
  minimapTickAcc=0;renderTacticalMinimap();
}
requestAnimationFrame(()=>renderTacticalMinimap());
