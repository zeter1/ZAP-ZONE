'use strict';

// ─── INPUT ──────────────────────────────
window.addEventListener('keydown',e=>{
  K[e.code]=true;
  if(!running||paused||lvlAnnOpen||perkPickOpen||dying)return;
  if(e.code==='KeyR')doReload();
  if(e.code==='KeyQ')quickSwitchWeapon();
  if(e.code==='KeyF')throwMine();
  if(e.code==='KeyG'&&!e.repeat)placeBomb();
  if(e.code==='Digit0'||e.code==='Numpad0')switchW(GRENADE_WEAPON_INDEX);
  const n=parseInt(e.key);if(n>=1&&n<=9)switchW(n-1);
});
window.addEventListener('keyup',e=>{K[e.code]=false;});
let lastWheelWeaponSwitchAt=0;
document.addEventListener('wheel',e=>{
  if(IS_TOUCH||!running||paused||lvlAnnOpen||perkPickOpen||dying)return;
  if(!Number.isFinite(e.deltaY)||Math.abs(e.deltaY)<.01)return;
  e.preventDefault();
  const now=performance.now();
  if(now-lastWheelWeaponSwitchAt<90)return;
  lastWheelWeaponSwitchAt=now;
  cycleOwnedWeapon(e.deltaY>0?1:-1);
},{passive:false});
document.addEventListener('mousemove',e=>{
  if(IS_TOUCH||!running||paused||lvlAnnOpen||perkPickOpen||dying)return;
  const sens=.002*lookSensitivityMultiplier(zooming);
  yaw-=e.movementX*sens;pitch=Math.max(-1.2,Math.min(1.2,pitch-e.movementY*sens));
  gunSwayX=Math.max(-.045,Math.min(.045,gunSwayX+e.movementX*.00010));
  gunSwayY=Math.max(-.035,Math.min(.035,gunSwayY+e.movementY*.00009));
});
let mouseDown=false,zooming=false;
document.addEventListener('mousedown',e=>{
  if(IS_TOUCH)return;
  if(e.button===2){
    e.preventDefault();
    const w=getW();
    zooming=!!(running&&!paused&&!lvlAnnOpen&&!perkPickOpen&&!dying&&!reloading&&w.aimMode==='scope');
    return;
  }
  if(running&&!paused&&!lvlAnnOpen&&!perkPickOpen&&!dying&&e.button===0){mouseDown=true;shoot();}
});
document.addEventListener('mouseup',e=>{
  if(e.button===0){mouseDown=false;releaseFragGrenadeCharge();}
  if(e.button===2)zooming=false;
});
window.addEventListener('blur',()=>{mouseDown=false;zooming=false;cancelFragGrenadeThrow();cancelPendingMineThrow(true);if(typeof cancelPendingSmokeThrow==='function')cancelPendingSmokeThrow(true);cancelPendingBombPlant();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){mouseDown=false;zooming=false;cancelFragGrenadeThrow();cancelPendingMineThrow(true);if(typeof cancelPendingSmokeThrow==='function')cancelPendingSmokeThrow(true);cancelPendingBombPlant();}});
document.addEventListener('contextmenu',e=>{if(!IS_TOUCH)e.preventDefault();});

function bindMobileControls(){ if(!IS_TOUCH) return; }


// ─── RAY-SPHERE ─────────────────────────
const _rsV=new THREE.Vector3();
function rSphere(o,d,c,r){
  _rsV.subVectors(o,c);const b=_rsV.dot(d),q=_rsV.dot(_rsV)-r*r,dd=b*b-q;
  if(dd<0)return Infinity;const sq=Math.sqrt(dd),t0=-b-sq;if(t0>.001)return t0;const t1=-b+sq;return t1>.001?t1:Infinity;
}
const _ht=new THREE.Vector3();
function hitEnemy(o,d,team,exclude=null,maxRange=120){
  let best=Infinity,en=null,hd=false,zone='body';
  const maxD2=maxRange*maxRange;
  for(const e of enemies){
    if(!e.alive||e===exclude||e.team===team)continue;
    const p=e.group.position;
    const dx=p.x-o.x,dz=p.z-o.z;if(dx*dx+dz*dz>maxD2)continue;
    _ht.set(p.x,p.y+1.0,p.z);if(rSphere(o,d,_ht,.85)===Infinity)continue;
    _ht.set(p.x,p.y+.55,p.z);let t=rSphere(o,d,_ht,.36);if(t<best){best=t;en=e;hd=false;zone='body';}
    _ht.set(p.x,p.y+1.25,p.z);t=rSphere(o,d,_ht,.46);if(t<best){best=t;en=e;hd=false;zone='armor';}
    _ht.set(p.x,p.y+1.82,p.z);t=rSphere(o,d,_ht,.28);if(t<best){best=t;en=e;hd=true;zone='head';}
  }
  return{en,dist:best,hd,zone};
}

// ─── ROCKET MESH ────────────────────────
const _UP=new THREE.Vector3(0,1,0);
function mkRkt(col){
  const g=new THREE.Group();
  const body=new THREE.Mesh(
    new THREE.CylinderGeometry(.085,.085,.58,12),
    new THREE.MeshPhongMaterial({color:0x87929f,specular:0xaec8dd,shininess:70})
  );
  g.add(body);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.085,.26,12),new THREE.MeshPhongMaterial({color:0xe2a047,shininess:65}));tip.position.y=.42;g.add(tip);
  for(const y of [-.20,.17]){
    const band=new THREE.Mesh(new THREE.TorusGeometry(.088,.012,5,12),new THREE.MeshBasicMaterial({color:y<0?col:0xff9c28}));
    band.rotation.x=Math.PI/2;band.position.y=y;g.add(band);
  }
  const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.065,.082,.10,12,1,true),new THREE.MeshPhongMaterial({color:0x252a31,side:THREE.DoubleSide,shininess:50}));nozzle.position.y=-.34;g.add(nozzle);
  for(let i=0;i<4;i++){
    const f=new THREE.Mesh(new THREE.BoxGeometry(.022,.23,.15),new THREE.MeshLambertMaterial({color:0x8f99a4}));
    const angle=i*Math.PI/2;f.position.set(Math.sin(angle)*.085,-.23,Math.cos(angle)*.085);f.rotation.y=angle;g.add(f);
  }
  // Красивое пламя без отдельных источников света: additive blending заметен на тёмной карте и почти не нагружает GPU.
  const flameOuter=new THREE.Mesh(
    new THREE.ConeGeometry(.16,.62,7,1,true),
    new THREE.MeshBasicMaterial({color:0xff5a16,transparent:true,opacity:.42,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})
  );
  flameOuter.position.y=-.58;flameOuter.rotation.x=Math.PI;flameOuter._fire=true;g.add(flameOuter);
  const flameCore=new THREE.Mesh(
    new THREE.ConeGeometry(.09,.46,7,1,true),
    new THREE.MeshBasicMaterial({color:0xfff0a0,transparent:true,opacity:.88,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})
  );
  flameCore.position.y=-.52;flameCore.rotation.x=Math.PI;flameCore._fire=true;g.add(flameCore);
  const glow=new THREE.Mesh(
    new THREE.SphereGeometry(.16,6,4),
    new THREE.MeshBasicMaterial({color:0xff8a24,transparent:true,opacity:.30,depthWrite:false,blending:THREE.AdditiveBlending})
  );
  glow.position.y=-.36;glow._fire=true;g.add(glow);
  g.userData.flames=[flameOuter,flameCore,glow];
  return g;
}
function mkMine(){
  const g=new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.28,.32,.14,8),new THREE.MeshLambertMaterial({color:0x222222})));
  const top=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,.10,7),new THREE.MeshLambertMaterial({color:0x1a1a1a}));top.position.y=.12;g.add(top);
  const lens=new THREE.Mesh(new THREE.SphereGeometry(.07,6,4),new THREE.MeshBasicMaterial({color:0xff2200}));lens.position.y=.20;g.add(lens);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.30,.035,6,10),new THREE.MeshBasicMaterial({color:0xffaa00}));ring.rotation.x=Math.PI/2;ring.position.y=.02;g.add(ring);
  return g;
}

function mkBomb(){return createBombDevice41();}

function mkSmokeGrenade(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.10,.10,.34,10),new THREE.MeshLambertMaterial({color:0x879398}));
  body.rotation.z=Math.PI/2;g.add(body);
  const capA=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.055,10),new THREE.MeshLambertMaterial({color:0x263238}));
  capA.rotation.z=Math.PI/2;capA.position.x=.19;g.add(capA);
  const capB=capA.clone();capB.material=capA.material.clone();capB.position.x=-.19;g.add(capB);
  const band=new THREE.Mesh(new THREE.TorusGeometry(.105,.018,6,12),new THREE.MeshBasicMaterial({color:0xbad2cf}));
  band.rotation.y=Math.PI/2;g.add(band);
  return g;
}
function mkFragGrenade(team='enemy'){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),new THREE.MeshLambertMaterial({color:team==='ally'?0x35596c:0x5b4834}));
  body.scale.y=1.18;g.add(body);
  const band=new THREE.Mesh(new THREE.TorusGeometry(.105,.018,5,10),new THREE.MeshBasicMaterial({color:team==='ally'?0x69d8ff:0xff9a45}));
  band.rotation.x=Math.PI/2;g.add(band);
  return g;
}
function removeSmokeCloud(cloud){
  if(!cloud)return;
  removeSmokeArt42(cloud);
  destroySceneObject(cloud.m);
}
// Bounded DOM art belongs to the real cloud/projectile, never to the short combat-VFX pool.
function smokeArtLayer42(){
  let root=G('smoke-world-layer-42');
  if(!root){root=document.createElement('div');root.id='smoke-world-layer-42';root.setAttribute('aria-hidden','true');document.body.appendChild(root);}
  return root;
}
function removeSmokeArt42(item){
  for(const el of item?.art42||[])el.remove();
  if(item)item.art42=null;
}
function clearSmokePresentation42(){
  for(const item of [...smokeGrenades,...smokeClouds])removeSmokeArt42(item);
  G('smoke-world-layer-42')?.replaceChildren();
}
function makeSmokeArt42(item,count){
  if(!item.art42){
    item.art42=[];
    for(let i=0;i<count;i++){
      const el=document.createElement('div');el.className='smoke-world-art-42';
      smokeArtLayer42().appendChild(el);item.art42.push(el);
    }
  }
  return item.art42;
}
function positionSmokeArt42(el,pos,size,opacity,key,frame,cols,rows,angle=0){
  const screen=pos.clone().project(camera),distance=camera.position.distanceTo(pos);
  if(distance<.18||screen.z<=-1||screen.z>=1||(wallBetween(camera.position,pos,wallMeshes)||(typeof smokeVisibilityBetween42==='function'&&smokeVisibilityBetween42(camera.position,pos)<.015))){
    el.style.visibility='hidden';return;
  }
  const pixels=Math.min(innerHeight*4,size*innerHeight/(2*Math.tan(camera.fov*Math.PI/360))/Math.max(.18,distance));
  const x=(screen.x*.5+.5)*innerWidth,y=(-screen.y*.5+.5)*innerHeight;
  if(x+pixels/2<0||x-pixels/2>innerWidth||y+pixels/2<0||y-pixels/2>innerHeight){el.style.visibility='hidden';return;}
  el.style.visibility='visible';el.style.left=x+'px';el.style.top=y+'px';
  el.style.width=pixels+'px';el.style.height=pixels+'px';el.style.opacity=String(Math.max(0,Math.min(1,opacity)));
  el.style.backgroundImage='url("'+gameAssetUrl(GAME_ASSETS.presentationVfx[key])+'")';
  el.style.backgroundSize=cols*100+'% '+rows*100+'%';
  el.style.backgroundPosition=(cols===1?0:frame%cols*100/(cols-1))+'% '+(rows===1?0:Math.floor(frame/cols)*100/(rows-1))+'%';
  el.style.transform='translate(-50%,-50%) rotate('+angle+'deg)';
}
function syncSmokeBodyArt42(g){
  const ready=smokePresentationAssetReady42('pack42SmokeWorld');
  // Art replaces only the device meshes; the simulation group remains authoritative.
  for(const child of g.m.children)child.visible=!ready;
  if(!ready){removeSmokeArt42(g);return;}
  const el=makeSmokeArt42(g,1)[0];
  const angle=Math.atan2(g.vy,Math.hypot(g.vx,g.vz)||.001)*-180/Math.PI;
  positionSmokeArt42(el,g.m.position,.57,1,'pack42SmokeWorld',Math.floor(g.age*7)%4,4,2,angle);
}
function smokeVolumeSupported42(){
  return !!(THREE.ShaderMaterial&&renderer.capabilities.getMaxPrecision('highp')==='highp'&&
    (renderer.capabilities.isWebGL2||renderer.extensions.has('WEBGL_depth_texture')));
}
function smokeVolumeGlsl42(){
  // Shared density/integration for the fast volume and exact silhouette correction.
  return `vec3 smokeMin42,smokeMax42;float smokeAge42,smokeDensity42,smokeSeed42;
      float hash3(vec3 p){p=fract(p*0.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
      float noise3(vec3 p){
        vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);
      }
      float fbm(vec3 p){return noise3(p)*0.70+noise3(p*2.03+17.1)*0.30;}
      float densityAt(vec3 p){
        if(p.y<smokeMin42.y||p.y>smokeMax42.y)return 0.0;
        float growth=mix(0.12,1.0,smoothstep(0.0,4.0,smokeAge42));
        vec3 halfSize=(smokeMax42-smokeMin42)*0.5,center=(smokeMin42+smokeMax42)*0.5;
        vec2 q=(p.xz-center.xz)/(halfSize.xz*growth);
        float radial=length(q),height=(p.y-smokeMin42.y)/(2.0*halfSize.y*growth);
        vec3 flow=p*0.43+vec3(smokeSeed42+smokeAge42*0.055,-smokeAge42*0.21,smokeSeed42*0.73);
        flow.xz+=vec2(sin(p.y*0.6+smokeAge42*0.22),cos(p.x*0.35+smokeAge42*0.18))*0.38;
        float n=fbm(flow);
        float broad=noise3(flow*0.48+7.0);
        // The enclosing box has zero density on ALL faces, including noisy billows.
        float rim=1.0-smoothstep(0.84,1.0,radial);
        float dome=length(vec3(q,height*1.03));
        float billow=dome+(broad-0.5)*0.70+(n-0.5)*0.28;
        float top=1.0-smoothstep(0.90,1.0,height);
        float envelope=(1.0-smoothstep(0.76,1.02,billow))*rim*top;
        // A continuous dense interior cannot acquire transparent holes from the noise.
        float coreShape=sqrt(dot(q,q)+height*height*height*height)+(broad-0.5)*0.12;
        float core=(1.0-smoothstep(0.66,1.02,coreShape))*rim*top;
        float density=max(envelope*(0.35+1.10*smoothstep(0.36,0.66,n)),core*1.20);
        return density*smoothstep(0.0,0.03,p.y-smokeMin42.y)*smokeDensity42;
      }

      vec4 smokeRaymarch42(vec3 origin,vec3 rd,float limit){
        vec3 safeDir=vec3(rd.x<0.0?-max(abs(rd.x),0.00001):max(abs(rd.x),0.00001),
          rd.y<0.0?-max(abs(rd.y),0.00001):max(abs(rd.y),0.00001),rd.z<0.0?-max(abs(rd.z),0.00001):max(abs(rd.z),0.00001));
        vec3 a=(smokeMin42-origin)/safeDir,b=(smokeMax42-origin)/safeDir;
        vec3 lo=min(a,b),hi=max(a,b);
        float start=max(0.0,max(lo.x,max(lo.y,lo.z))),end=min(hi.x,min(hi.y,hi.z));
        if(end<=start||limit<=start||smokeDensity42<=0.0)return vec4(0.0);
        // Keep the sampling grid independent of opaque geometry inside the cloud.
        float stepSize=(end-start)/float(SMOKE_STEPS);
        end=min(end,limit);
        vec4 acc=vec4(0.0);
        for(int i=0;i<SMOKE_STEPS;i++){
          float segmentStart=start+float(i)*stepSize;
          if(segmentStart>=end)break;
          float segment=min(stepSize,end-segmentStart);
          vec3 p=origin+rd*(segmentStart+segment*0.5);float d=densityAt(p);
          float alpha=1.0-exp(-d*segment*4.2);
          float shadow=densityAt(p+vec3(0.7,1.5,0.5))*1.8+densityAt(p+vec3(1.8,3.8,1.3))*2.4;
          float light=clamp(exp(-shadow*2.4)*0.86+0.07,0.0,1.0);
          vec3 color=mix(vec3(0.045,0.053,0.063),vec3(0.52,0.55,0.58),light);
          acc.rgb+=(1.0-acc.a)*alpha*color;acc.a+=(1.0-acc.a)*alpha;
          if(acc.a>0.9995)break;
        }
        return acc;

      }`;
}
function createSmokeVolume42(c){
  const material=new THREE.ShaderMaterial({
    precision:'highp',transparent:true,depthWrite:false,depthTest:false,side:THREE.BackSide,
    uniforms:{uMin:{value:new THREE.Vector3()},uMax:{value:new THREE.Vector3()},uAge:{value:0},uDensity:{value:0},uSeed:{value:0},
      uDepth:{value:null},uResolution:{value:new THREE.Vector2(1,1)},uNear:{value:camera.near},uFar:{value:camera.far}},
    vertexShader:`varying vec3 vWorld;
      void main(){vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader:`
      uniform vec3 uMin,uMax;uniform float uAge,uDensity,uSeed,uNear,uFar;
      uniform sampler2D uDepth;uniform vec2 uResolution;varying vec3 vWorld;
      ${smokeVolumeGlsl42()}
      void main(){
        smokeMin42=uMin;smokeMax42=uMax;smokeAge42=uAge;smokeDensity42=uDensity;smokeSeed42=uSeed;
        vec3 rd=normalize(vWorld-cameraPosition);
        float depth=texture2D(uDepth,gl_FragCoord.xy/uResolution).x;
        float viewDepth=uNear*uFar/(uFar+(uNear-uFar)*depth);
        float opaqueDistance=viewDepth/max(0.0001,-(viewMatrix*vec4(rd,0.0)).z);
        vec4 acc=smokeRaymarch42(cameraPosition,rd,opaqueDistance);
        if(acc.a<0.003)discard;
        gl_FragColor=vec4(acc.rgb/max(acc.a,0.001),acc.a);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`,defines:{SMOKE_STEPS:PERF_MODE?24:40}
  });
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material);
  mesh.renderOrder=12;mesh.frustumCulled=false;c.m.add(mesh);c.volume42=mesh;
  mesh.layers.set(1);
}
function updateSmokeVolume42(c){
  const floor=Math.max(0,c.m.position.y-.12),height=c.radius*.48;
  const x=c.m.position.x,z=c.m.position.z,u=c.volume42.material.uniforms;
  u.uMin.value.set(x-c.radius,floor,z-c.radius);u.uMax.value.set(x+c.radius,floor+height,z+c.radius);
  u.uAge.value=c.age;u.uDensity.value=c.density;u.uSeed.value=c.puffs[0]?.userData.phase||0;
  c.volume42.position.set(0,floor+height*.5-c.m.position.y,0);c.volume42.scale.set(c.radius*2,height,c.radius*2);
}
function syncSmokeCloudArt42(c){
  // Cloud density is world-space, independent of image loading and camera facing.
  removeSmokeArt42(c);c.m.visible=true;
  if(!c.volume42&&smokeVolumeSupported42())createSmokeVolume42(c);
  if(c.volume42){for(const puff of c.puffs)puff.visible=false;updateSmokeVolume42(c);}
}

function smokeEnvelope42(c,x,y,z){
  const t=Math.max(0,Math.min(1,c.age/4)),growth=.12+.88*t*t*(3-2*t);
  const r=c.radius*growth,h=c.radius*.48*growth,floor=Math.max(0,c.m.position.y-.12);
  const radial=Math.hypot(x-c.m.position.x,z-c.m.position.z)/r,ny=(y-floor)/h;
  if(radial>=1||ny<=0||ny>=1)return 0;
  const smooth=(a,b,v)=>{const q=Math.max(0,Math.min(1,(v-a)/(b-a)));return q*q*(3-2*q);};
  return (1-smooth(.56,1,radial))*(1-smooth(.84,1,radial))*(1-smooth(.55,.98,ny))*(1-smooth(.90,1,ny))*smooth(0,.03,y-floor);
}
function smokeVisibilityBetween42(from,to){
  const dx=to.x-from.x,dy=to.y-from.y,dz=to.z-from.z,length=Math.hypot(dx,dy,dz);
  if(length<.001)return 1;
  let optical=0;
  for(const c of smokeClouds){
    if(c.life<=0||c.density<=.001)continue;
    const t=Math.max(0,Math.min(1,c.age/4)),growth=.12+.88*t*t*(3-2*t),r=c.radius*growth;
    const ox=from.x-c.m.position.x,oz=from.z-c.m.position.z,a=dx*dx+dz*dz,b=ox*dx+oz*dz,q=ox*ox+oz*oz-r*r;
    let entry=0,exit=1;
    if(a>.000001){const discriminant=b*b-a*q;if(discriminant<=0)continue;const s=Math.sqrt(discriminant);entry=Math.max(entry,(-b-s)/a);exit=Math.min(exit,(-b+s)/a);}
    else if(q>=0)continue;
    const floor=Math.max(0,c.m.position.y-.12),roof=floor+c.radius*.48*growth;
    if(Math.abs(dy)>.000001){const l=(floor-from.y)/dy,u=(roof-from.y)/dy;entry=Math.max(entry,Math.min(l,u));exit=Math.min(exit,Math.max(l,u));}
    else if(from.y<=floor||from.y>=roof)continue;
    if(exit<=entry)continue;
    const step=(exit-entry)/6;
    for(let i=0;i<6;i++){const s=entry+(i+.5)*step;optical+=smokeEnvelope42(c,from.x+dx*s,from.y+dy*s,from.z+dz*s)*c.density*.8*length*step*4.2;}
    if(optical>8)return 0;
  }
  return Math.exp(-optical);
}

function deploySmokeCloud(pos,radiusM=1,durationM=1,team=null){
  while(smokeClouds.length>=MAX_ACTIVE_SMOKE_CLOUDS)removeSmokeCloud(smokeClouds.shift());
  const group=new THREE.Group();
  group.position.set(pos.x,Math.max(.10,pos.y),pos.z);
  const radius=SMOKE_RADIUS*(team?1:(plr.smokeRadiusM||1))*Math.max(.65,Number(radiusM)||1);
  const duration=SMOKE_DURATION_SECONDS*(team?1:(plr.smokeDurationM||1))*Math.max(.55,Number(durationM)||1);
  // Несколько почти непрозрачных центральных слоёв полностью перекрывают обзор,
  // а внешние клубы смягчают край облака без большого числа тяжёлых частиц.
  const puffCount=PERF_MODE?14:22;
  const coreCount=PERF_MODE?3:5;
  const puffs=[];
  for(let i=0;i<puffCount;i++){
    const center=i===0;
    const core=i<coreCount;
    const ang=Math.random()*Math.PI*2;
    const rr=center?0:Math.sqrt(Math.random())*radius*(core?.22:.68);
    const geo=new THREE.SphereGeometry(1,PERF_MODE?5:6,PERF_MODE?4:5);
    const matObj=new THREE.MeshBasicMaterial({
      color:i%3===0?0x667077:(i%3===1?0x515a60:0x798187),
      transparent:true,opacity:0,depthWrite:false,depthTest:true
    });
    const puff=new THREE.Mesh(geo,matObj);
    puff.position.set(Math.cos(ang)*rr,center?1.65:(core?1.0+Math.random()*2.1:.65+Math.random()*3.2),Math.sin(ang)*rr);
    const base=center?radius*.70:(core?radius*(.44+Math.random()*.13):radius*(.30+Math.random()*.22));
    puff.scale.set(base*(.92+Math.random()*.18),base*(.68+Math.random()*.20),base*(.92+Math.random()*.18));
    puff.userData.baseScale=puff.scale.clone();
    puff.userData.baseY=puff.position.y;
    puff.userData.phase=Math.random()*Math.PI*2;
    puff.userData.baseOpacity=core?1:.90+Math.random()*.08;
    puff.renderOrder=11;
    group.add(puff);puffs.push(puff);
  }
  scene.add(group);
  smokeClouds.push({m:group,center:new THREE.Vector3(pos.x,Math.max(1.6,pos.y+1.48),pos.z),radius,life:duration,maxLife:duration,age:0,puffs,density:0,team});
  playSmokeSound42('vent',group.position);
  showGeneratedSmokeDeployVfx(group.position);
  if(!team)showMsg('🌫️ Дымовое облако развёрнуто на '+Math.round(duration)+' сек.');
}
const _smokeAB=new THREE.Vector3(),_smokeAC=new THREE.Vector3(),_smokeClosest=new THREE.Vector3();
function smokeBlocksSight(from,to){
  _smokeAB.subVectors(to,from);
  const lenSq=_smokeAB.lengthSq();
  if(lenSq<.0001)return false;
  for(const cloud of smokeClouds){
    if(cloud.life<=0||cloud.density<.06)continue;
    _smokeAC.subVectors(cloud.center,from);
    const t=Math.max(0,Math.min(1,_smokeAC.dot(_smokeAB)/lenSq));
    _smokeClosest.copy(from).addScaledVector(_smokeAB,t);
    const effective=cloud.radius*(.86+.14*cloud.density);
    if(_smokeClosest.distanceToSquared(cloud.center)<effective*effective)return true;
  }
  return false;
}
function smokeStrengthAt(pos){
  let strength=0;
  for(const cloud of smokeClouds){
    if(cloud.life<=0||cloud.density<=0)continue;
    const dx=pos.x-cloud.center.x,dy=(pos.y||1.6)-cloud.center.y,dz=pos.z-cloud.center.z;
    const d=Math.sqrt(dx*dx+dy*dy*.35+dz*dz);
    if(d<cloud.radius)strength=Math.max(strength,(1-d/cloud.radius)*cloud.density);
  }
  return strength;
}
function tickSmoke(dt){
  // Camera transforms change earlier in the frame; DOM projection precedes renderer.render.
  // Refresh the inverse once for the whole smoke batch, without visiting the FPS rig.
  if(smokeGrenades.length||smokeClouds.length)camera.updateWorldMatrix(true,false);
  for(let i=smokeGrenades.length-1;i>=0;i--){
    const g=smokeGrenades[i];g.age+=dt;g.life-=dt;g.vy-=18*dt;
    moveSmokeGrenade42(g,dt);
    g.m.rotation.x+=g.rx*dt;g.m.rotation.z+=g.rz*dt;
    syncSmokeBodyArt42(g);
    g.trailT-=dt;
    if(g.trailT<=0){g.trailT=.12;spawnSmoke(g.m.position,0x899095);}
    if((g.grounded&&g.age>=1.05)||g.age>=1.85||g.life<=0){
      const p=g.m.position.clone();p.y=Math.max(.12,p.y-.01);
      removeSmokeArt42(g);
      destroySceneObject(g.m);smokeGrenades.splice(i,1);deploySmokeCloud(p,g.radiusM||1,g.durationM||1,g.team||null);
    }
  }
  for(let i=smokeClouds.length-1;i>=0;i--){
    const c=smokeClouds[i];c.age+=dt;c.life-=dt;
    const fadeIn=Math.min(1,c.age/1.35);
    const fadeOut=Math.min(1,Math.max(0,c.life)/4);
    c.density=fadeIn*fadeOut;
    // World-space bounds stay aligned with the arena support plane.
    for(const puff of c.puffs){
      const pulse=1+Math.sin(c.age*.45+puff.userData.phase)*.025;
      const b=puff.userData.baseScale;
      puff.scale.set(b.x*pulse,b.y*(1+Math.cos(c.age*.36+puff.userData.phase)*.025),b.z*pulse);
      puff.material.opacity=puff.userData.baseOpacity*c.density;
      const growth=.12+.88*Math.min(1,c.age/4);puff.scale.multiplyScalar(growth);
      puff.position.y=Math.max(puff.userData.baseY??puff.position.y,puff.scale.y-Math.min(.12,c.m.position.y));
    }
    syncSmokeCloudArt42(c);
    if(c.life<=0){removeSmokeCloud(c);smokeClouds.splice(i,1);}
  }
  const overlay=G('smoke-overlay');
  if(overlay){
    const strength=Math.min(1,smokeStrengthAt(camera.position)*2.25);
    overlay.style.opacity=String(smokeClouds.some(c=>c.volume42)?0:strength);
    overlay.style.setProperty('--smoke-overlay-image','none');
  }
}

function ensureBombTimer(mn){
  if(mn.timerSprite)return;
  const c=document.createElement('canvas');c.width=192;c.height=48;
  const tex=new THREE.CanvasTexture(c);
  tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:true,depthWrite:false}));
  sp.scale.set(.28,.07,1);sp.position.set(0,.03,0);mn.m.add(sp);
  mn.timerCanvas=c;mn.timerTexture=tex;mn.timerSprite=sp;mn.timerSecond=-1;
}
function updateBombFuseVisual(mn,dt){
  const total=Math.max(.1,mn.fuseTotal||BOMB_FUSE_SECONDS);
  const left=Math.max(0,mn.fuseT);
  const ratio=Math.max(0,Math.min(1,left/total));
  const segs=mn.m.userData.fuseSegments||[];
  const remaining=Math.max(0,Math.min(segs.length,Math.ceil(ratio*segs.length)));
  for(let i=0;i<segs.length;i++)segs[i].visible=i<remaining;
  const spark=mn.m.userData.bombSpark;
  if(spark)spark.visible=false;
  mn.sparkEmitT=(mn.sparkEmitT||0)-dt;
  if(mn.sparkEmitT<=0&&spark){
    mn.sparkEmitT=left<=10?.045:.10;
    // Preserve the prior decoration RNG stream, without emitting old fuse particles.
    // engine::spawnSpark consumes four draws; spawnSmoke consumes three.
    for(let i=0;i<4;i++)Math.random();
    if(Math.random()<.45)for(let i=0;i<3;i++)Math.random();
  }
  ensureBombTimer(mn);
  const sec=Math.ceil(left);
  if(sec!==mn.timerSecond){
    mn.timerSecond=sec;
    const ctx=mn.timerCanvas.getContext('2d');ctx.clearRect(0,0,mn.timerCanvas.width,mn.timerCanvas.height);
    ctx.fillStyle='rgba(8,14,20,.86)';ctx.fillRect(35,4,122,40);
    ctx.fillStyle=sec<=10?'#ff6650':'#ffe27a';ctx.font='700 30px Consolas, monospace';ctx.textAlign='center';ctx.fillText('00:'+String(sec).padStart(2,'0'),96,34);
    mn.timerTexture.needsUpdate=true;
  }
}
const PLASMA_PROJECTILE_VISUAL_SCALE=.78;
function mkTracer(col,key='default'){
  const g=new THREE.Group();
  const plasma=key==='plasma';
  const sniper=key==='sniper';
  const rifle=key==='rifle';
  const shotgun=key==='shotgun';
  const len=sniper?2.85:(plasma?1.48:(rifle?1.18:(shotgun?.86:1.02)));
  const additive=(color,opacity)=>new THREE.MeshBasicMaterial({
    color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending
  });
  const core=new THREE.Mesh(
    new THREE.CylinderGeometry(sniper?.016:(plasma?.028:.012),sniper?.026:(plasma?.040:.018),len,6),
    additive(sniper?0xeaffff:(plasma?0xffffff:0xfff0bf),sniper?.99:(plasma?.96:.92))
  );
  core.rotation.x=Math.PI/2;core.renderOrder=18;g.add(core);
  const tip=new THREE.Mesh(
    new THREE.SphereGeometry(sniper?.050:(plasma?.082:.034),7,5),
    additive(0xffffff,.98)
  );
  tip.position.z=len*.46;tip.renderOrder=20;g.add(tip);
  const halo=new THREE.Mesh(
    new THREE.CylinderGeometry(sniper?.050:(plasma?.085:.034),sniper?.075:(plasma?.12:.052),len*.94,7),
    additive(col,sniper?.46:(plasma?.38:.24))
  );
  halo.rotation.x=Math.PI/2;halo.renderOrder=17;g.add(halo);
  const tail=new THREE.Mesh(
    new THREE.CylinderGeometry(sniper?.020:(plasma?.042:.014),sniper?.050:(plasma?.072:.030),len*.86,6),
    additive(col,sniper?.30:(plasma?.24:.14))
  );
  tail.rotation.x=Math.PI/2;tail.position.z=-len*.28;tail.renderOrder=16;g.add(tail);
  g.userData.halo=halo;g.userData.tail=tail;g.userData.phase=Math.random()*Math.PI*2;
  g.userData.baseOpacities=g.children.map(child=>child.material?.opacity??1);
  if(plasma)g.scale.setScalar(PLASMA_PROJECTILE_VISUAL_SCALE);
  return g;
}

// ─── PROJECTILE ARRAYS ──────────────────
const pRkts=[],eRkts=[],pTrs=[],pBullets=[],eBullets=[],botGrenades=[],mines=[],smokeGrenades=[],smokeClouds=[];
const ROCKET_FLIGHT_VFX_LOOP=Object.freeze([4,5,6,7,8,9,8,7,6,5]);
const rocketFlightArtNodes=new Set();
const rocketFlightScreenPos=new THREE.Vector3();
const rocketFlightAheadPos=new THREE.Vector3();
const rocketFlightDir=new THREE.Vector3();
let rocketFlightVisualSequence=0;
function rocketFlightFrameIndex(r){
  const age=Math.max(0,Number(r?.fT)||0);
  if(age<.18)return Math.min(3,Math.floor(age/.045));
  const phase=Number.isInteger(r?._flightVfxPhase)?r._flightVfxPhase:0;
  return ROCKET_FLIGHT_VFX_LOOP[(Math.floor((age-.18)*16)+phase)%ROCKET_FLIGHT_VFX_LOOP.length];
}
function rocketFlightFrameIndex35(r){return Math.floor(Math.max(0,Number(r?.fT)||0)*16)%4;}
function restoreRocketFlightMesh(r){
  for(const [mesh,visible] of r?._rocketMeshVisibility||[])mesh.visible=visible;
  if(r)r._rocketMeshVisibility=null;
}
function ensureRocketFlightArt(r){
  const layer=G('projectile-trail-layer');
  if(!layer||typeof rocketFlightPresentationFrame!=='function'||typeof applyPresentationAtlasFrame!=='function')return null;
  if(r._flightArt?.isConnected)return r._flightArt;
  const el=document.createElement('span');
  const rocketTeam=r.ownerType==='player'?'ally':(r._src?.team||r.team||'enemy');
  el.className='rocket-flight-vfx '+(rocketTeam==='ally'?'ally':'enemy');
  el._rocketRef=r;
  r._flightVfxPhase=(rocketFlightVisualSequence++*3)%ROCKET_FLIGHT_VFX_LOOP.length;
  layer.appendChild(el);rocketFlightArtNodes.add(el);r._flightArt=el;
  return el;
}
function syncRocketFlightArt(){
  const live=new Set([...eRkts,...pRkts]);
  for(const el of [...rocketFlightArtNodes]){
    if(live.has(el._rocketRef))continue;
    if(el._rocketRef){restoreRocketFlightMesh(el._rocketRef);el._rocketRef._flightArt=null;el._rocketRef._flightVfxFrame=null;}
    el.remove();rocketFlightArtNodes.delete(el);
  }
  for(const r of live){
    const el=ensureRocketFlightArt(r),pos=r.m?.position;
    if(!el||!pos){if(el)el.style.visibility='hidden';continue;}
    const ready35=rocketPresentationAssetReady35('pack35RocketEffects');
    // A missile must retain its actual 3D silhouette/depth from every viewpoint.
    // The atlas contributes only side-on exhaust, never a second metallic body.
    restoreRocketFlightMesh(r);
    el.classList.toggle('pack35',ready35);
    rocketFlightScreenPos.copy(pos).project(camera);
    if(rocketFlightScreenPos.z<-1||rocketFlightScreenPos.z>1||Math.abs(rocketFlightScreenPos.x)>1.18||Math.abs(rocketFlightScreenPos.y)>1.18){
      el.style.visibility='hidden';continue;
    }
    if(typeof wallBetween==='function'&&(wallBetween(camera.position,pos,wallMeshes)||(typeof smokeVisibilityBetween42==='function'&&smokeVisibilityBetween42(camera.position,pos)<.015))){
      el.style.visibility='hidden';continue;
    }
    rocketFlightDir.set(r.vx||0,r.vy||0,r.vz||0);
    const speed=rocketFlightDir.length();
    if(speed<.001){el.style.visibility='hidden';continue;}
    rocketFlightDir.multiplyScalar(1/speed);
    const view=pos.clone().sub(camera.position).normalize();
    const side=Math.sqrt(Math.max(0,1-Math.pow(rocketFlightDir.dot(view),2)));
    el.style.setProperty('--rocket-flight-side',side.toFixed(3));
    if(!ready35||side<.28){el.style.visibility='hidden';continue;}
    rocketFlightAheadPos.copy(pos).addScaledVector(rocketFlightDir,1.25).project(camera);
    const x=(rocketFlightScreenPos.x*.5+.5)*innerWidth;
    const y=(-rocketFlightScreenPos.y*.5+.5)*innerHeight;
    const ax=(rocketFlightAheadPos.x*.5+.5)*innerWidth;
    const ay=(-rocketFlightAheadPos.y*.5+.5)*innerHeight;
    const tailAngle=Math.atan2(ay-y,ax-x)*180/Math.PI+180;
    const distance=Math.max(.1,camera.position.distanceTo(pos));
    const focal=innerHeight/(2*Math.tan(camera.fov*Math.PI/360));
    const size=Math.max(3,Math.min(140,innerWidth*.14,1.4*focal/distance));
    const frameIndex=ready35?rocketFlightFrameIndex35(r):rocketFlightFrameIndex(r);
    const frameKey=(ready35?'35:':'28:')+frameIndex;
    if(r._flightVfxFrame!==frameKey){
      applyPresentationAtlasFrame(el,ready35?rocketFlightPresentationFrame35(frameIndex):rocketFlightPresentationFrame(frameIndex));
      r._flightVfxFrame=frameKey;
    }
    el.style.left=x.toFixed(1)+'px';el.style.top=y.toFixed(1)+'px';
    el.style.setProperty('--rocket-flight-size',size.toFixed(1)+'px');
    el.style.setProperty('--rocket-flight-rot',tailAngle.toFixed(1)+'deg');
    el.style.setProperty('--rocket-flight-opacity',Math.max(.72,Math.min(.98,1-distance/280)).toFixed(2));
    el.style.visibility='visible';
  }
}

const PLASMA_FLIGHT_VFX_LOOP=Object.freeze([4,5,6,7,8,9,10,11,9,7,5,6]);
const plasmaFlightArtNodes=new Set();
const plasmaFlightScreenPos=new THREE.Vector3();
const plasmaFlightAheadPos=new THREE.Vector3();
const plasmaFlightDir=new THREE.Vector3();
const MAX_PLASMA_FLIGHT_ART=PERF_MODE?8:20;
let plasmaFlightVisualSequence=0,plasmaFlightAssetState=0,plasmaFlightAssetProbe=null;
function clearPlasmaFlightArt(){
  for(const el of [...plasmaFlightArtNodes]){
    if(el._plasmaRef)el._plasmaRef._plasmaFlightArt=null;
    el.remove();plasmaFlightArtNodes.delete(el);
  }
}
function initPlasmaFlightAssetProbe(){
  if(plasmaFlightAssetState!==0||!GAME_PRESENTATION_ASSETS_ENABLED||typeof Image==='undefined'||!GAME_ASSETS.presentationVfx?.pack30PlasmaFlight)return;
  plasmaFlightAssetState=1;
  const probe=new Image();plasmaFlightAssetProbe=probe;
  probe.onload=()=>{plasmaFlightAssetState=2;plasmaFlightAssetProbe=null;};
  probe.onerror=()=>{plasmaFlightAssetState=-1;plasmaFlightAssetProbe=null;clearPlasmaFlightArt();};
  probe.src=GAME_ASSETS.presentationVfx.pack30PlasmaFlight;
}
function plasmaFlightPresentationAvailable(){
  if(plasmaFlightAssetState===0)initPlasmaFlightAssetProbe();
  return plasmaFlightAssetState===2;
}
function plasmaFlightFrameIndex(b){
  const maxLife=Math.max(.001,Number(b?.maxLife)||1);
  const life=Math.max(0,Number(b?.life)||0);
  const age=Math.max(0,maxLife-life),lifeRatio=Math.max(0,Math.min(1,life/maxLife));
  if(age<.12)return Math.min(3,Math.floor(age/.03));
  if(lifeRatio<.18)return 12+Math.min(3,Math.floor((.18-lifeRatio)/.045));
  const phase=Number.isInteger(b?._plasmaFlightVfxPhase)?b._plasmaFlightVfxPhase:0;
  return PLASMA_FLIGHT_VFX_LOOP[(Math.floor((age-.12)*18)+phase)%PLASMA_FLIGHT_VFX_LOOP.length];
}
function ensurePlasmaFlightArt(b,team='enemy'){
  const layer=G('projectile-trail-layer');
  if(!layer||!plasmaFlightPresentationAvailable()||typeof plasmaFlightPresentationFrame!=='function'||typeof applyPresentationAtlasFrame!=='function')return null;
  if(b._plasmaFlightArt?.isConnected)return b._plasmaFlightArt;
  if(plasmaFlightArtNodes.size>=MAX_PLASMA_FLIGHT_ART)return null;
  const el=document.createElement('span');
  el.className='plasma-flight-vfx '+(team==='ally'?'ally':'enemy');
  el._plasmaRef=b;
  b._plasmaFlightVfxPhase=(plasmaFlightVisualSequence++*3)%PLASMA_FLIGHT_VFX_LOOP.length;
  layer.appendChild(el);plasmaFlightArtNodes.add(el);b._plasmaFlightArt=el;
  return el;
}
function syncPlasmaFlightArt(){
  const live=[];
  for(const b of pBullets)if(b.wKey==='plasma')live.push([b,'ally']);
  for(const b of eBullets)if(b.wKey==='plasma')live.push([b,b.team==='ally'?'ally':'enemy']);
  const liveRefs=new Set(live.map(entry=>entry[0]));
  for(const el of [...plasmaFlightArtNodes]){
    if(liveRefs.has(el._plasmaRef))continue;
    if(el._plasmaRef)el._plasmaRef._plasmaFlightArt=null;
    el.remove();plasmaFlightArtNodes.delete(el);
  }
  if(!plasmaFlightPresentationAvailable()){
    for(const el of plasmaFlightArtNodes)el.style.visibility='hidden';
    return;
  }
  for(const [b,team] of live){
    const pos=b.pos,existing=b._plasmaFlightArt?.isConnected?b._plasmaFlightArt:null;
    if(!pos){if(existing)existing.style.visibility='hidden';continue;}
    plasmaFlightScreenPos.copy(pos).project(camera);
    const distance=Math.max(.1,camera.position.distanceTo(pos));
    if(distance>112||plasmaFlightScreenPos.z<-1||plasmaFlightScreenPos.z>1||Math.abs(plasmaFlightScreenPos.x)>1.14||Math.abs(plasmaFlightScreenPos.y)>1.14){
      if(existing)existing.style.visibility='hidden';continue;
    }
    if(typeof wallBetween==='function'&&wallBetween(camera.position,pos,losMeshes)){
      if(existing)existing.style.visibility='hidden';continue;
    }
    plasmaFlightDir.copy(b.vel||_UP);
    const speed=plasmaFlightDir.length();
    if(speed<.001){if(existing)existing.style.visibility='hidden';continue;}
    plasmaFlightDir.multiplyScalar(1/speed);
    plasmaFlightAheadPos.copy(pos).addScaledVector(plasmaFlightDir,.9).project(camera);
    const x=(plasmaFlightScreenPos.x*.5+.5)*innerWidth;
    const y=(-plasmaFlightScreenPos.y*.5+.5)*innerHeight;
    const ax=(plasmaFlightAheadPos.x*.5+.5)*innerWidth;
    const ay=(-plasmaFlightAheadPos.y*.5+.5)*innerHeight;
    const angle=Math.atan2(ay-y,ax-x)*180/Math.PI;
    const size=PLASMA_PROJECTILE_VISUAL_SCALE*Math.max(50,Math.min(124,164/(.82+distance*.045)));
    const el=existing||ensurePlasmaFlightArt(b,team);
    if(!el)continue;
    const frameIndex=plasmaFlightFrameIndex(b);
    if(b._plasmaFlightVfxFrame!==frameIndex){
      applyPresentationAtlasFrame(el,plasmaFlightPresentationFrame(frameIndex));
      b._plasmaFlightVfxFrame=frameIndex;
    }
    el.style.left=x.toFixed(1)+'px';el.style.top=y.toFixed(1)+'px';
    el.style.setProperty('--plasma-flight-size',size.toFixed(1)+'px');
    el.style.setProperty('--plasma-flight-rot',angle.toFixed(1)+'deg');
    el.style.setProperty('--plasma-flight-opacity',Math.max(.62,Math.min(.98,1-distance/150)).toFixed(2));
    el.style.visibility='visible';
  }
}
initPlasmaFlightAssetProbe();

// Pack34: persistent grenade body projection, separate from short one-shot VFX.
// The real botGrenades collection owns trajectory, bounce, resting and lifetime.
const grenadeFlightArtNodes=new Set();
const grenadeFlightScreenPos=new THREE.Vector3();
let grenadeFlightAssetState=0,grenadeFlightAssetProbe=null;
function clearGrenadeFlightArt(){
  for(const el of [...grenadeFlightArtNodes]){
    const g=el._grenadeRef;
    if(g){
      for(const [mesh,visible] of g._grenadeMeshVisibility||[])mesh.visible=visible;
      g._grenadeMeshVisibility=null;g._grenadeFlightArt=null;
    }
    el.remove();grenadeFlightArtNodes.delete(el);
  }
}
function grenadeFlightPresentationAvailable(){
  if(grenadeFlightAssetState===0&&GAME_PRESENTATION_ASSETS_ENABLED){
    const asset=GAME_ASSETS.presentationVfx?.pack34GrenadeWorld;
    if(!asset||typeof Image==='undefined')return false;
    grenadeFlightAssetState=1;
    const probe=new Image();grenadeFlightAssetProbe=probe;
    probe.onload=()=>{
      grenadeFlightAssetState=probe.naturalWidth===1024&&probe.naturalHeight===512?2:-1;
      grenadeFlightAssetProbe=null;
      if(grenadeFlightAssetState!==2)clearGrenadeFlightArt();
    };
    probe.onerror=()=>{grenadeFlightAssetState=-1;grenadeFlightAssetProbe=null;clearGrenadeFlightArt();};
    probe.src=gameAssetUrl(asset);
  }
  return grenadeFlightAssetState===2;
}
function grenadeFlightFrameIndex(g){
  if(g.grounded)return 1; // lying, rather than an upright inventory sprite
  return [3,4,5][Math.floor(Math.abs(g.m.rotation.x)*1.5)%3];
}
function syncGrenadeFlightArt(){
  const live=new Set(botGrenades.filter(g=>g.fuse>0&&g.m?.parent));
  for(const el of [...grenadeFlightArtNodes]){
    if(live.has(el._grenadeRef))continue;
    const g=el._grenadeRef;
    if(g){
      for(const [mesh,visible] of g._grenadeMeshVisibility||[])mesh.visible=visible;
      g._grenadeMeshVisibility=null;g._grenadeFlightArt=null;
    }
    el.remove();grenadeFlightArtNodes.delete(el);
  }
  if(!live.size||!grenadeFlightPresentationAvailable())return;
  const layer=G('projectile-trail-layer');if(!layer)return;
  for(const g of live){
    let el=g._grenadeFlightArt;
    if(!el?.isConnected){
      el=document.createElement('span');el.className='grenade-flight-art '+(g.team==='ally'?'ally':'enemy');
      el._grenadeRef=g;el.setAttribute('aria-hidden','true');
      layer.appendChild(el);grenadeFlightArtNodes.add(el);g._grenadeFlightArt=el;g._grenadeFlightFrame=-1;
      suppressLegacyGrenadeMotionVfx(g.m);
      g._grenadeMeshVisibility=g.m.children.map(mesh=>[mesh,mesh.visible]);
      for(const [mesh] of g._grenadeMeshVisibility)mesh.visible=false;
    }
    const pos=g.m.position,distance=camera.position.distanceTo(pos);
    grenadeFlightScreenPos.copy(pos).project(camera);
    if(distance>60||distance<.15||grenadeFlightScreenPos.z<=-1||grenadeFlightScreenPos.z>=1||
       Math.abs(grenadeFlightScreenPos.x)>1.08||Math.abs(grenadeFlightScreenPos.y)>1.08||
       (wallBetween(camera.position,pos,wallMeshes)||(typeof smokeVisibilityBetween42==='function'&&smokeVisibilityBetween42(camera.position,pos)<.015))){
      el.style.visibility='hidden';continue;
    }
    const frame=grenadeFlightFrameIndex(g);
    if(g._grenadeFlightFrame!==frame){
      applyPresentationAtlasFrame(el,grenadeFlightPresentationFrame(frame));g._grenadeFlightFrame=frame;
    }
    // Readable screen size without changing the physical radius or trajectory.
    const size=Math.max(32,Math.min(108,560/Math.max(4,distance)));
    const rotation=g.grounded?0:g.m.rotation.z*180/Math.PI;
    el.dataset.state=g.grounded?'resting':'flight';
    el.classList.toggle('armed',g.fuse<=.78);
    el.style.left=((grenadeFlightScreenPos.x*.5+.5)*innerWidth).toFixed(1)+'px';
    el.style.top=((-grenadeFlightScreenPos.y*.5+.5)*innerHeight).toFixed(1)+'px';
    el.style.width=size.toFixed(1)+'px';el.style.height=size.toFixed(1)+'px';
    el.style.transform='translate(-50%,-50%) rotate('+rotation.toFixed(1)+'deg)';
    el.style.visibility='visible';
  }
}
// End Pack34 grenade body projection.

// Rifle art follows live ballistic objects; no cosmetic projectile or extra RNG.
const rifleFlightArtNodes36=new Set();
const rifleFlightScreen36=new THREE.Vector3(),rifleFlightAhead36=new THREE.Vector3();
function syncRifleFlightArt36(){
  const live=new Set([...pBullets,...eBullets].filter(b=>b.wKey==='rifle'||b.wKey==='shotgun'||b.wKey==='pistol'));
  const rifleReady=riflePresentationAssetReady36('pack36RifleEffects'),shotgunReady=shotgunPresentationAssetReady37('pack37ShotgunEffects'),layer=G('projectile-trail-layer');
  const pistolReady=pistolPresentationAssetReady40('pack40PistolEffects');
  const ready=b=>b.wKey==='pistol'?pistolReady:b.wKey==='shotgun'?shotgunReady:rifleReady;
  for(const el of [...rifleFlightArtNodes36]){
    if(ready(el._rifleRef)&&live.has(el._rifleRef))continue;
    const b=el._rifleRef;if(b?.m&&live.has(b))b.m.visible=b._rifleMeshVisible??true;
    if(b){b._rifleArt=null;b._rifleMeshVisible=null;}
    el.remove();rifleFlightArtNodes36.delete(el);
  }
  if(!layer)return;
  for(const b of live){
    if(!ready(b))continue;
    const pos=b.pos;if(!pos)continue;
    let el=b._rifleArt;
    if(!el?.isConnected){
      if(b.wKey==='rifle'&&rifleFlightArtNodes36.size>=32)continue;
      if(b.wKey==='pistol'&&rifleFlightArtNodes36.size>=32)continue;
      if(rifleFlightArtNodes36.size>=96)continue;
      el=document.createElement('span');el.className='rifle-flight-vfx';el.setAttribute('aria-hidden','true');el._rifleRef=b;
      b._rifleArt=el;if(b.m){b._rifleMeshVisible=b.m.visible;b.m.visible=false;}
      layer.appendChild(el);rifleFlightArtNodes36.add(el);
    }
    rifleFlightScreen36.copy(pos).project(camera);
    if(rifleFlightScreen36.z<=-1||rifleFlightScreen36.z>=1||Math.abs(rifleFlightScreen36.x)>1.12||Math.abs(rifleFlightScreen36.y)>1.12||(wallBetween(camera.position,pos,wallMeshes)||(typeof smokeVisibilityBetween42==='function'&&smokeVisibilityBetween42(camera.position,pos)<.015))){el.style.visibility='hidden';continue;}
    rifleFlightAhead36.copy(pos).addScaledVector(b.vel,.008).project(camera);
    const x=(rifleFlightScreen36.x*.5+.5)*innerWidth,y=(-rifleFlightScreen36.y*.5+.5)*innerHeight;
    const dx=(rifleFlightAhead36.x-rifleFlightScreen36.x)*innerWidth,dy=-(rifleFlightAhead36.y-rifleFlightScreen36.y)*innerHeight;
    const frame=Math.floor(Math.max(0,b.maxLife-b.life)*24)%4;
    applyPresentationAtlasFrame(el,presentationAtlasFrame(b.wKey==='pistol'?GAME_ASSETS.presentationVfx.pack40PistolEffects:b.wKey==='shotgun'?GAME_ASSETS.presentationVfx.pack37ShotgunEffects:GAME_ASSETS.presentationVfx.pack36RifleEffects,frame,2,4,4));
    const focal=innerHeight/(2*Math.tan(camera.fov*Math.PI/360));
    const size=Math.max(6,Math.min(b.wKey==='shotgun'?26:54,(b.wKey==='shotgun'?.16:.42)*focal/Math.max(.7,camera.position.distanceTo(pos))));
    el.style.left=x.toFixed(1)+'px';el.style.top=y.toFixed(1)+'px';el.style.width=size.toFixed(1)+'px';el.style.height=size.toFixed(1)+'px';
    el.style.transform='translate(-50%,-50%) rotate('+(Math.atan2(dy,dx)*180/Math.PI+(b.wKey==='pistol'?180:0)).toFixed(1)+'deg)';el.style.visibility='visible';
  }
}

const MAX_PLAYER_BULLETS=180;
const MAX_ENEMY_BULLETS=260;
const MAX_ACTIVE_ENEMY_TRACERS=PERF_MODE?28:62;
const ENEMY_TRACER_POOL_LIMIT=18;
const enemyTracerPool=new Map();
let activeEnemyTracers=0,enemyTracerSequence=0;
const MAX_BOT_GRENADES=8;
const MAX_PLAYER_FRAG_GRENADES=3;
const FRAG_GRENADE_BLAST=Object.freeze({radius:8,innerRadius:2,healthFraction:.8,armorReduction:.1});
function fragGrenadeDamageScale(distance,radius=FRAG_GRENADE_BLAST.radius){
  if(distance>=radius)return 0;
  const inner=radius*(FRAG_GRENADE_BLAST.innerRadius/FRAG_GRENADE_BLAST.radius);
  return distance<=inner?1:Math.max(0,(radius-distance)/(radius-inner));
}
let pendingFragGrenadeThrow=null;
const FRAG_GRENADE_THROW=Object.freeze({chargeSeconds:1.1,minSpeed:11.6,maxSpeed:18,minLift:5.8,maxLift:8.2});
let fragGrenadeCharge=null;
function updateFragGrenadeChargeHud(){
  const hud=G('whud');if(!hud)return;
  let el=G('grenade-charge');
  if(!el){
    el=document.createElement('div');el.id='grenade-charge';el.setAttribute('aria-label','Сила броска гранаты');
    const label=document.createElement('span');label.className='grenade-charge-label';
    const track=document.createElement('div');track.className='grenade-charge-track';
    const fill=document.createElement('div');fill.className='grenade-charge-fill';track.appendChild(fill);
    el.append(label,track);hud.appendChild(el);
  }
  el.hidden=!fragGrenadeCharge;
  if(fragGrenadeCharge){
    const pct=Math.round(Math.min(1,fragGrenadeCharge.age/FRAG_GRENADE_THROW.chargeSeconds)*100);
    el.querySelector('.grenade-charge-label').textContent='СИЛА БРОСКА · '+pct+'%';
    el.querySelector('.grenade-charge-fill').style.width=pct+'%';
  }
}
function cancelFragGrenadeThrow(){
  fragGrenadeCharge=null;pendingFragGrenadeThrow=null;
  if(typeof fpGeneratedWeaponAction!=='undefined'&&fpGeneratedWeaponAction?.kind==='grenadeThrow34')stopGeneratedFirstPersonAction();
  const el=G('grenade-charge');if(el)el.hidden=true;
}
function beginFragGrenadeCharge(){
  if(fragGrenadeCharge||pendingFragGrenadeThrow||sCD>0||weaponActionBlocked()||reloading||dying||!running||paused)return;
  if(!ownsWeapon(GRENADE_WEAPON_INDEX)||weaponAmmoValue(GRENADE_WEAPON_INDEX)<=0){throwFragGrenade();return;}
  if(activePlayerFragGrenades()>=MAX_PLAYER_FRAG_GRENADES){showMsg('💥 Слишком много активных гранат — дождитесь взрыва');return;}
  fragGrenadeCharge={weaponIndex:curW,age:0};updateFragGrenadeChargeHud();
}
function tickFragGrenadeCharge(dt){
  if(!fragGrenadeCharge)return;
  if(curW!==fragGrenadeCharge.weaponIndex||reloading||dying||!running||paused||lvlAnnOpen||perkPickOpen){cancelFragGrenadeThrow();return;}
  fragGrenadeCharge.age=Math.min(FRAG_GRENADE_THROW.chargeSeconds,fragGrenadeCharge.age+Math.max(0,dt));
  updateFragGrenadeChargeHud();
}
function releaseFragGrenadeCharge(){
  const charge=fragGrenadeCharge;if(!charge)return;
  if(curW!==charge.weaponIndex||!running||paused||reloading||dying||lvlAnnOpen||perkPickOpen||weaponActionBlocked()){cancelFragGrenadeThrow();return;}
  const strength=Math.min(1,charge.age/FRAG_GRENADE_THROW.chargeSeconds);
  fragGrenadeCharge=null;updateFragGrenadeChargeHud();throwFragGrenade(false,strength);
}

function tickPendingFragGrenadeThrow(dt){
  const pending=pendingFragGrenadeThrow;if(!pending)return;
  if(curW!==pending.weaponIndex||reloading||dying||!running||paused){cancelFragGrenadeThrow();return;}
  pending.remaining-=dt;
  if(pending.remaining<=0){pendingFragGrenadeThrow=null;throwFragGrenade(true,pending.strength);}
}
function activeBotFragGrenades(){let c=0;for(const g of botGrenades)if((g.ownerType||'bot')==='bot')c++;return c;}
function activePlayerFragGrenades(){let c=0;for(const g of botGrenades)if(g.ownerType==='player')c++;return c;}
const MAX_PLAYER_MINES=100;
const MAX_MINES=140;
function playerMineCount(){let c=0;for(const mn of mines)if(mn.owner==='player'&&mn.kind!=='bomb')c++;return c;}
function activeBombCount(){let c=0;for(const mn of mines)if(mn.kind==='bomb'&&!mn.removed)c++;return c;}
function bombNearPoint(pos,minDist=22){
  const d2=minDist*minDist;
  return mines.some(mn=>mn.kind==='bomb'&&!mn.removed&&mn.m.position.distanceToSquared(pos)<d2);
}
function updateMineHUD(){
  const mineCd=Math.max(0,Math.ceil(playerMineCD));
  const bombCd=Math.max(0,Math.ceil(playerBombCD));
  const smokeCd=Math.max(0,Math.ceil(playerSmokeCD));
  const mineReady=mineCd>0?mineCd+'с':'ГОТОВА';
  const bombReady=bombCd>0?bombCd+'с':'ГОТОВА';
  const smokeReady=smokeCd>0?smokeCd+'с':'ГОТОВА';
  const bombAmmo=testingInfiniteAmmoEnabled()?'∞':weaponAmmoValue(6);
  const root=G('mine-cnt');if(!root)return;
  root.innerHTML='<span class="equipment-ready-art" data-kind="mine"></span><span>💣 '+playerMineCount()+' · '+mineReady+'</span><span class="equipment-sep">|</span><span class="equipment-ready-art" data-kind="bomb"></span><span>🧨 '+bombAmmo+'/'+WEAPONS[6].clip+' · '+bombReady+'</span><span class="equipment-sep">|</span><span class="equipment-ready-art" data-kind="smoke"></span><span>🌫 '+smokeReady+'</span>';
  root.querySelectorAll('.equipment-ready-art').forEach(el=>{
    const kind=el.dataset.kind;
    const ready=kind==='mine'?mineCd===0:kind==='bomb'?bombCd===0:smokeCd===0;
    applyPresentationAtlasFrame(el,equipmentReadinessPresentationFrame(kind,ready));
  });
}

// ─── SHOOT (player) ─────────────────────

function playerDamageMultiplier(){
  let mult=plr.dmgM*((hp<plr.maxHp*.35)?(1+plr.lowHpDamage):1);
  if(hp>=plr.maxHp*.90)mult*=1+plr.fullHpDamage;
  if(Math.hypot(plrVx,plrVz)>4.5)mult*=1+plr.movingDamage;
  return mult;
}
function grantPlayerKillRewards(){
  if(plr.killHeal>0)hp=Math.min(plr.maxHp,hp+plr.killHeal);
  if(plr.killArmor>0)armor=Math.min(plr.maxArmor,armor+plr.killArmor);
  markHUD();
}
function effectiveWeaponSpread(w,pelletIndex=0,extraShot=false,bloom=weaponBloom,firstShot=false){
  const hip=w.spread||0,ads=w.adsSpread??hip*.55;
  const base=hip+(ads-hip)*Math.max(0,Math.min(1,adsBlend));
  const speed=Math.hypot(plrVx,plrVz);
  const moving=Math.min(1,speed/8);
  const movePenalty=(w.moveSpread||0)*moving;
  const airPenalty=onGnd?0:(w.airSpread||0);
  const pelletFactor=(w.pellets||1)>1?(pelletIndex===0?.35:1):1;
  const extraPenalty=extraShot?.035:0;
  const suppressionPenalty=typeof playerSuppressionSpreadPenalty==='function'?playerSuppressionSpreadPenalty():0;
  const settledFirstShot=firstShot&&onGnd&&speed<1.2;
  const firstShotM=settledFirstShot?(w.firstShotM??1):1;
  return Math.max(0,(base*pelletFactor*firstShotM+movePenalty+airPenalty+bloom+extraPenalty+suppressionPenalty)*plr.spreadM);
}
function kickSniperScope(){
  const scope=G('sniper-scope');if(!scope||!zooming)return;
  scope.classList.remove('kick');void scope.offsetWidth;scope.classList.add('kick');
  clearTimeout(kickSniperScope._t);kickSniperScope._t=setTimeout(()=>scope.classList.remove('kick'),260);
}
function weaponImpactType(w,isCrit=false){
  return w.isSniper?'sniper':(w.key==='plasma'?'plasma':(isCrit?'critical':'bullet'));
}
function destroyPlayerBullet(index){
  const b=pBullets[index];if(!b)return;
  if(b.m)destroySceneObject(b.m);
  pBullets.splice(index,1);
}
function resolvePlayerBulletHit(b,en,hd,hitFx,dir,travelDist,hitZone='body'){
  const w=WEAPON_BY_KEY[b.wKey]||WEAPONS[0];
  const isCrit=Math.random()<plr.critChance;
  const lowTarget=en.hp/en.maxHp<.35;
  const rangeBonus=travelDist<12?1+plr.closeDamage:(travelDist>28?1+plr.longRangeDamage:1);
  const distanceScale=weaponDamageScaleAtDistance(w,travelDist);
  const headshotMult=w.headshotMult||2.10;
  const calculatedDamage=w.dmg*(b.damageScale||1)*distanceScale*PLAYER_DAMAGE_BOOST*(b.shotDamageM||1)*rangeBonus*(hd?headshotMult*plr.headshotM:1)*(isCrit?plr.critMult:1)*(lowTarget?1+plr.executeBonus:1);
  const dmg=w.oneShot&&b.oneShotEligible?Math.max(calculatedDamage,en.hp+1):calculatedDamage;
  en.hurt(dmg,dir.clone(),'ally');
  const feedback=b.shotFeedback;
  const markerEligible=w.key==='shotgun'&&feedback?!feedback.seen:b.markerEligible;
  if(markerEligible)playHitImpactSound(hd?'head':hitZone,hitFx,hd?1.05:.86);
  const lethalHeadshot=hd&&!en.alive;
  if(markerEligible||(!en.alive&&(!feedback||!feedback.kill))){
    if(feedback){feedback.seen=true;if(!en.alive)feedback.kill=true;}
    const hitKind=!en.alive?'kill':isCrit?'crit':hd?'head':'hit';
    showHitMarker(hitKind);playSfx(hitKind==='kill'?'kill':hitKind==='crit'?'crit':'hit',1,w.key);
  }
  if(isCrit&&plr.critHeal>0){hp=Math.min(plr.maxHp,hp+plr.critHeal);markHUD();}
  if(hd&&plr.headshotArmor>0){armor=Math.min(plr.maxArmor,armor+plr.headshotArmor);markHUD();}
  if(b.markerEligible||w.key==='plasma'){spawnSpark(hitFx,b.color);if(w.key==='plasma')spawnP(hitFx,0xc47cff,.55);}
  if(b.markerEligible)spawnCombatImpact(hitFx,weaponImpactType(w,isCrit));
  if(w.key==='plasma')showGeneratedPlasmaImpactVfx(hitFx);
  if(hd){
    spawnHeadshotFx(hitFx,lethalHeadshot);
    const hs=G('hs-pop'),hsIcon=G('hs-pop-icon'),hsText=G('hs-pop-text');
    hs.classList.remove('on','kill');void hs.offsetWidth;
    if(lethalHeadshot){
      hs.classList.add('kill');hsText.textContent='HEADSHOT KILL';
      const flash=G('hs-kill-flash');flash.classList.remove('on');void flash.offsetWidth;flash.classList.add('on');
      clearTimeout(resolvePlayerBulletHit._kft);resolvePlayerBulletHit._kft=setTimeout(()=>flash.classList.remove('on'),520);
    }else{hsText.textContent='HEADSHOT';}
    imageAssetWithFallback(hsIcon,headshotAsset(lethalHeadshot),headshotFallbackAsset(lethalHeadshot));
    hs.classList.add('on');
    clearTimeout(resolvePlayerBulletHit._ht);resolvePlayerBulletHit._ht=setTimeout(()=>hs.classList.remove('on','kill'),lethalHeadshot?940:620);
  }
  if(plr.lifeSteal>0)hp=Math.min(hp+dmg*plr.lifeSteal,plr.maxHp);
  if(!en.alive){
    addXP((en.type+1)*25+level*3);score+=(en.type+1)*100;kills++;grantPlayerKillRewards();
    combo++;comboT=3;if(combo>2)showCombo();
    showKillMedal({distance:travelDist,isCrit,headshot:lethalHeadshot,explosive:false});
    markHUD();scorePop(lethalHeadshot?'HEADSHOT KILL · +'+(en.type+1)*100:'+'+(en.type+1)*100+(hd?' 🎯':'')+(isCrit?' КРИТ!':''));
    allyKills++;updateTeamScore();
    pushKillFeed('ally','ВЫ','enemy','ВРАЖЕСКИЙ БОТ',lethalHeadshot?'headshot':w.key);
  }
  if(plr.explode){
    const center=en.group.position.clone();center.y+=1.0;explode(center,0xff8800,2.6*plr.explodeRadiusM);
    for(const e2 of enemies){
      if(!e2.alive||e2.team==='ally'||e2===en)continue;
      const dd=center.distanceTo(e2.group.position.clone().setY(e2.group.position.y+1));
      const exRadius=3.6*plr.explodeRadiusM;if(dd>=exRadius)continue;
      const splash=dmg*.32*plr.explodeDamageM*(1-dd/exRadius);
      e2.hurt(splash,dir.clone(),'ally');
      if(plr.lifeSteal>0)hp=Math.min(hp+splash*plr.lifeSteal,plr.maxHp);
      if(!e2.alive){addXP((e2.type+1)*22);score+=(e2.type+1)*90;kills++;grantPlayerKillRewards();allyKills++;markHUD();updateTeamScore();pushKillFeed('ally','ВЫ','enemy','ВРАЖЕСКИЙ БОТ','bomb');showKillMedal({explosive:true});scorePop('💥+'+(e2.type+1)*90);}
    }
  }
  return dmg;
}
function spawnInstantSniperTrace(from,dir,dist,color){
  const groundDistance=firstGroundHitDistance(from,dir,dist);
  if(groundDistance<dist-1e-7){
    dist=groundDistance;
    const impact=from.clone().addScaledVector(dir,dist);impact.y=arenaFloor.position.y;
    wallImpact(impact,color,'concrete',_UP,'heavy');spawnCombatImpact(impact,'sniper');playSurfaceImpactSound('concrete',impact,.54,false);
  }
  const start=from.clone().addScaledVector(dir,Math.min(.48,dist)),end=from.clone().addScaledVector(dir,dist);
  const geo=new THREE.BufferGeometry().setFromPoints([start,end]);
  const mat=new THREE.LineBasicMaterial({color,transparent:true,opacity:.92,depthWrite:false,blending:THREE.AdditiveBlending});
  const line=new THREE.Line(geo,mat);line.renderOrder=30;scene.add(line);
  setTimeout(()=>{scene.remove(line);geo.dispose();mat.dispose();},70);
}
function firstFirearmSurfaceHit(from,dir,maxDistance){
  _rc.ray.origin.copy(from);_rc.ray.direction.copy(dir);_rc.near=0;_rc.far=maxDistance;
  _rcWallHits.length=0;_rc.intersectObjects(wallMeshes,false,_rcWallHits);
  const wall=_rcWallHits[0]||null,groundDistance=firstGroundHitDistance(from,dir,maxDistance);
  if(Number.isFinite(groundDistance)&&(!wall||groundDistance<=wall.distance)){
    const point=from.clone().addScaledVector(dir,groundDistance);point.y=arenaFloor.position.y;
    return {distance:groundDistance,point,ground:true,object:arenaFloor};
  }
  return wall;
}
function fireInstantSniper(from,dir,w,meta={}){
  const maxRange=w.range||120,color=PLR_TCOL[w.key]||0xcff8ff;
  const wallHit=firstFirearmSurfaceHit(from,dir,maxRange);
  const wallDist=wallHit?wallHit.distance:maxRange;
  const first=hitEnemy(from,dir,'ally',null,maxRange);
  let traceDist=wallDist;
  if(first.en&&first.dist<wallDist){
    const hitFx=from.clone().addScaledVector(dir,first.dist);
    const fake={wKey:w.key,color,markerEligible:meta.pelletIndex===0,damageScale:1,shotDamageM:playerDamageMultiplier(),oneShotEligible:true};
    resolvePlayerBulletHit(fake,first.en,first.hd,hitFx,dir,first.dist,first.zone);
    traceDist=first.dist;
    let pen=(w.basePenetration||0)+(plr.piercing?1:0);
    if(pen>0){
      const second=hitEnemy(from,dir,'ally',first.en,maxRange);
      if(second.en&&second.dist>first.dist+.05&&second.dist<wallDist){
        fake.markerEligible=false;fake.damageScale=w.isSniper?.72:.64;fake.oneShotEligible=false;
        const hit2=from.clone().addScaledVector(dir,second.dist);
        resolvePlayerBulletHit(fake,second.en,second.hd,hit2,dir,second.dist,second.zone);
        traceDist=second.dist;
      }
    }
  }else if(wallHit){
    const hitFx=wallHit.point.clone(),surface=mapImpactMaterial(wallHit.object);
    wallImpact(hitFx,color,surface,wallHit.ground?_UP:null,'heavy');spawnCombatImpact(hitFx,'sniper');playSurfaceImpactSound(surface,hitFx,.92,surface==='metal');
  }
  spawnInstantSniperTrace(from,dir,Math.max(0,traceDist),color);
}
const _playerMuzzleScreenRay=new THREE.Vector3(),_playerMuzzleAimPoint=new THREE.Vector3();
function playerVisualMuzzleShot(from,dir,w,distance=.72){
  const fallbackPos=from.clone().addScaledVector(dir,w?.key==='rocket'?.90:.48);
  fallbackPos.y-=w?.key==='rocket'?.05:(w?.key==='rifle'||w?.key==='shotgun')?0:.04;
  const fallback={pos:fallbackPos,dir:dir.clone()};
  if(w?.key==='rocket')fallback.pos.copy(guardRocketLaunch(from,fallback.pos));
  if(w?.key==='rifle'||w?.key==='shotgun'||w?.key==='pistol'||w?.key==='plasma'){
    const target=from.clone().addScaledVector(dir,w.range||75);
    const wall=Math.min(firstWallHitDistance(from,target,wallMeshes),firstGroundHitDistance(from,dir,w.range||75));
    if(Number.isFinite(wall))fallback.pos.copy(from).addScaledVector(dir,Math.max(0,Math.min(.48,wall-.03)));
    if(w.key==='rifle'&&adsBlend>.88)return fallback;
  }
  if(!['plasma','rocket','rifle','shotgun','pistol'].includes(w?.key)||typeof fpGeneratedWeaponActive==='undefined'||!fpGeneratedWeaponActive)return fallback;
  // The flash scales to zero between shots; its bounding-box center is not the barrel.
  // A zero-size marker inherits the weapon stage's sway/recoil transform exactly.
  const anchor=G(w.key==='pistol'?'fp-pistol-muzzle-anchor':w.key==='shotgun'?'fp-shotgun-muzzle-anchor':w.key==='rifle'?'fp-rifle-muzzle-anchor':w.key==='plasma'?'fp-plasma-muzzle-anchor':'fp-rocket-muzzle-anchor');
  if(!anchor||innerWidth<=0||innerHeight<=0)return fallback;
  const r=anchor.getBoundingClientRect();
  const sx=r.left,sy=r.top;
  _playerMuzzleScreenRay.set(sx/innerWidth*2-1,1-sy/innerHeight*2,.12).unproject(camera).sub(camera.position).normalize();
  const pos=from.clone().addScaledVector(_playerMuzzleScreenRay,distance);
  let aimDistance=Math.max(24,w.range||90);
  if(w.key==='rifle'||w.key==='shotgun'||w.key==='pistol'||w.key==='rocket'||w.key==='plasma'){
    // Converge on the nearest real target under the mark, not an arbitrary far plane.
    const end=from.clone().addScaledVector(dir,aimDistance);
    const wall=Math.min(firstWallHitDistance(from,end,wallMeshes),firstGroundHitDistance(from,dir,aimDistance)),enemy=hitEnemy(from,dir,'ally',null,aimDistance);
    aimDistance=Math.max(.08,Math.min(aimDistance,wall,enemy.dist));
    if(aimDistance<distance)pos.copy(from).addScaledVector(_playerMuzzleScreenRay,Math.max(0,aimDistance-.03));
    const muzzleEnd=from.clone().addScaledVector(_playerMuzzleScreenRay,from.distanceTo(pos)+(w.key==='shotgun'?.20:.15));
    const muzzleWall=Math.min(firstWallHitDistance(from,muzzleEnd,wallMeshes),firstGroundHitDistance(from,_playerMuzzleScreenRay,from.distanceTo(muzzleEnd)));
    if(Number.isFinite(muzzleWall))pos.copy(from).addScaledVector(_playerMuzzleScreenRay,Math.max(0,muzzleWall-.03));
  }
  if(w.key==='rocket')pos.copy(guardRocketLaunch(from,pos));
  _playerMuzzleAimPoint.copy(from).addScaledVector(dir,aimDistance);
  return{pos,dir:_playerMuzzleAimPoint.sub(pos).normalize().clone()};
}
function spawnPlayerBullet(from,dir,w,meta={}){
  while(pBullets.length>=MAX_PLAYER_BULLETS)destroyPlayerBullet(0);
  const speed=Math.max(1,w.muzzleVelocity||TRACER_SPEED[w.key]||TRACER_SPEED.default);
  const color=PLR_TCOL[w.key]||0xffffaa;
  // Retain the procedural tracer until a real decoded DOM flight node is
  // admitted. Shared presentation capacity or a missing layer cannot hide a shot.
  const m=mkTracer(color,w.key);
  const launch=w.key==='plasma'||w.key==='rifle'||w.key==='shotgun'||w.key==='pistol'?playerVisualMuzzleShot(from,dir,w,.74):null;
  const shotDir=launch?.dir||dir;
  const pos=launch?.pos||from.clone().addScaledVector(dir,.48);if(!launch)pos.y-=.04;
  if(m){m.position.copy(pos);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),shotDir);scene.add(m);}
  const life=(w.range||100)/speed+.40;
  pBullets.push({
    m,pos,vel:shotDir.clone().multiplyScalar(speed),gravity:w.bulletGravity||0,
    life,maxLife:life,range:w.range||100,travel:0,wKey:w.key,color,
    markerEligible:meta.pelletIndex===0,shotFeedback:meta.shotFeedback||null,damageScale:1,shotDamageM:playerDamageMultiplier(),
    penetrationLeft:(w.basePenetration||0)+(plr.piercing?1:0),ignoreEnemy:null,
    wallEnergy:projectileWallEnergy(w,true),wallPenetrations:0,ricochets:0
  });
}
function enemyTracerPoolKey(wKey,color){return wKey+':'+color.toString(16);}
function resetTracerVisual(m){
  const base=m.userData.baseOpacities||[];
  for(let i=0;i<m.children.length;i++){
    const child=m.children[i];
    if(child?.material?.opacity!==undefined)child.material.opacity=base[i]??1;
  }
}
function acquireEnemyTracer(wKey,color){
  const key=enemyTracerPoolKey(wKey,color),pool=enemyTracerPool.get(key)||[];
  const m=pool.pop()||mkTracer(color,wKey);
  enemyTracerPool.set(key,pool);
  resetTracerVisual(m);m.visible=true;
  if(!m.parent)scene.add(m);
  activeEnemyTracers++;return m;
}
function releaseEnemyTracer(m,wKey,color){
  if(!m)return;
  activeEnemyTracers=Math.max(0,activeEnemyTracers-1);
  m.visible=false;resetTracerVisual(m);
  const key=enemyTracerPoolKey(wKey,color),pool=enemyTracerPool.get(key)||[];
  if(pool.length<ENEMY_TRACER_POOL_LIMIT){pool.push(m);enemyTracerPool.set(key,pool);}
  else destroySceneObject(m);
}
function enemyTracerVisible(from,meta){
  if(meta.visual===false||activeEnemyTracers>=MAX_ACTIVE_ENEMY_TRACERS)return false;
  enemyTracerSequence=(enemyTracerSequence+1)%4096;
  const d=Math.hypot(from.x-camera.position.x,from.z-camera.position.z);
  const stride=d>78?4:d>48?2:1;
  return enemyTracerSequence%stride===0;
}
function projectileWallEnergy(w,playerOwned=false){
  const base=w.key==='sniper'?4.8:w.key==='plasma'?3.1:w.key==='rifle'?2.15:w.key==='pistol'?1.05:w.key==='shotgun'?.82:1.15;
  return base+(w.basePenetration||0)*.72+(playerOwned&&plr.piercing?1.15:0);
}
function tryProjectileWallPenetration(b,w,wallHit,dir,playerOwned=false){
  const info=mapPenetrationInfo(wallHit?.object,wallHit?.point||_hitPos,dir);
  if(!info)return null;
  const energy=Math.max(0,b.wallEnergy??projectileWallEnergy(w,playerOwned));
  const cost=info.resistance*info.thickness;
  if(info.thickness>info.maxThickness||energy<=cost)return null;
  const remaining=Math.max(.05,energy-cost);
  const ratio=Math.max(.18,Math.min(.92,remaining/Math.max(.001,energy)));
  b.wallEnergy=remaining;
  return{...info,speedRetention:Math.max(.38,info.speedRetention*(.84+ratio*.16)),damageRetention:Math.max(.30,info.damageRetention*(.78+ratio*.22))};
}
function destroyEnemyBullet(index){
  const b=eBullets[index];if(!b)return;
  if(b.m)releaseEnemyTracer(b.m,b.wKey,b.color);
  eBullets.splice(index,1);
}
function spawnEnemyBullet(from,dir,w,src,meta={}){
  while(eBullets.length>=MAX_ENEMY_BULLETS)destroyEnemyBullet(0);
  const speed=Math.max(18,w.muzzleVelocity||TRACER_SPEED[w.key]||TRACER_SPEED.default);
  const color=src?.team==='ally'?0x8cbcff:(w.bCol||0xff9b67);
  const visual=enemyTracerVisible(from,meta);
  const m=visual?acquireEnemyTracer(w.key,color):null;
  const pos=from.clone().addScaledVector(dir,.48);pos.y-=.035;
  if(m){m.position.copy(pos);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),dir);}
  const range=Math.max(8,w.range||60),life=range/speed+.42;
  eBullets.push({
    m,pos,vel:dir.clone().multiplyScalar(speed),gravity:w.bulletGravity||0,
    life,maxLife:life,range,travel:0,wKey:w.key,color,team:src?.team||'enemy',src,
    damage:Math.max(0,Number(meta.damage)||w.dmg||1),
    playerDamage:Math.max(0,Number(meta.playerDamage)||Number(meta.damage)||w.dmg||1),
    suppressing:!!meta.suppressing,suppressedPlayer:false,suppressedBot:null,ricochets:0,
    wallEnergy:projectileWallEnergy(w,false),wallPenetrations:0
  });
}
const _enemyBulletPlayerCenter=new THREE.Vector3(),_enemyBulletClosest=new THREE.Vector3();
function hitPlayerByEnemyBullet(origin,dir,maxDist){
  if(dying)return Infinity;
  let best=Infinity;
  _enemyBulletPlayerCenter.set(camera.position.x,camera.position.y-.72,camera.position.z);
  best=Math.min(best,rSphere(origin,dir,_enemyBulletPlayerCenter,.42));
  _enemyBulletPlayerCenter.y=camera.position.y-.28;
  best=Math.min(best,rSphere(origin,dir,_enemyBulletPlayerCenter,.39));
  _enemyBulletPlayerCenter.y=camera.position.y-.06;
  best=Math.min(best,rSphere(origin,dir,_enemyBulletPlayerCenter,.25));
  return best<=maxDist?best:Infinity;
}
function closestPointOnBulletSegment(a,b,p,out=_enemyBulletClosest){
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;
  const len2=dx*dx+dy*dy+dz*dz;
  const t=len2>1e-7?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy+(p.z-a.z)*dz)/len2)):0;
  out.set(a.x+dx*t,a.y+dy*t,a.z+dz*t);
  return{distance:out.distanceTo(p),t};
}
function awardBotBulletKill(b,target){
  if(!b?.src||!target)return;
  b.src.kills=(b.src.kills||0)+1;
  if(b.team==='ally')allyKills++;else enemyKills++;
  updateTeamScore();
  if(typeof pushKillFeed==='function')pushKillFeed(
    b.team,b.team==='ally'?'СВОЙ БОТ':'ВРАЖЕСКИЙ БОТ',
    target.team,target.team==='ally'?'СВОЙ БОТ':'ВРАЖЕСКИЙ БОТ',b.wKey||'bullet'
  );
}
function applyEnemyBulletToBot(b,target,damage,dir){
  if(!target?.alive||damage<=0)return;
  const wasAlive=target.alive;
  target.hurt(damage,dir,b.team,b.src);
  if(wasAlive&&!target.alive)awardBotBulletKill(b,target);
}

let playerReloadUsesFullPresentation=false;
function weaponActionBlocked(){
  return weaponReadyT>0||sprintExitT>0||sprintBlend>.20||wasWeaponSprinting||cycleT>0||!!(typeof pendingBombPlant!=='undefined'&&pendingBombPlant);
}
function finishPlayerReload(playDone=true,settle=true){
  const completedWeapon=getW(),usedFullPresentation=playerReloadUsesFullPresentation;
  playerReloadUsesFullPresentation=false;
  if(completedWeapon.key==='shotgun'&&usedFullPresentation)stopGeneratedFirstPersonAction();
  if(completedWeapon.key==='pistol'&&usedFullPresentation)stopGeneratedFirstPersonAction();
  if(completedWeapon.key==='smoke'&&usedFullPresentation)stopGeneratedFirstPersonAction();
  reloading=false;reloadT=0;reloadTot=0;reloadMode='mag';reloadShellLoaded=0;
  if(settle)weaponReadyT=Math.max(weaponReadyT,.08);
  if(playDone){
    playWeaponMechanicSound('reloadDone',.82,completedWeapon.key);
    if(completedWeapon.key==='plasma'&&!usedFullPresentation)showGeneratedPlasmaReloadVfx();
  }
  wHUD();G('rmsg').style.opacity='0';G('reload-wrap').style.display='none';
}
function cancelPlayerReload(){
  if(!reloading)return;
  const shellMode=reloadMode==='shell';
  finishPlayerReload(false,false);
  if(shellMode)playSfx('reloadCancel');
}
function completePlayerReloadStep(){
  if(!reloading)return;
  const w=getW();
  if(reloadMode==='shell'){
    if(ammo<w.clip&&uAmmo>0){
      ammo++;uAmmo--;reloadShellLoaded++;syncCurrentAmmo();wHUD();playWeaponMechanicSound('shell',1,w.key);
      if(w.key==='shotgun'&&!playerReloadUsesFullPresentation&&typeof showGeneratedShotgunShellInsertVfx==='function')showGeneratedShotgunShellInsertVfx();
      G('rmsg').textContent=`ПАТРОН ${ammo} / ${w.clip} · ЛКМ — ПРЕРВАТЬ`;
    }
    if(ammo>=w.clip||uAmmo<=0){finishPlayerReload(true);return;}
    reloadT=Math.max(.16,w.reload*(w.shellInsertM||.26));
    reloadTot=reloadT;
    if(w.key==='shotgun')playerReloadUsesFullPresentation=showGeneratedShotgunLoadVfx(reloadTot);
    return;
  }
  const need=w.clip-ammo,take=Math.min(need,uAmmo);
  ammo+=take;uAmmo-=take;syncCurrentAmmo();finishPlayerReload(true);
}

function shoot(){
  if(typeof pendingMineThrow!=='undefined'&&pendingMineThrow)return;
  const w=getW(),infiniteAmmo=testingInfiniteAmmoEnabled();
  if(w.isRocket&&(reloading||playerRocketShotCD>0)){
    showMsg('Перезарядка и остывание ракетницы',true);return;
  }
  if(reloading){
    if(w.reloadStyle==='shell'&&ammo>0)cancelPlayerReload();
    else return;
  }
  if(sCD>0||weaponActionBlocked())return;
  if(w.isMine){throwMine();return;}if(w.isBomb){placeBomb();return;}if(w.isSmoke){throwSmokeGrenade();return;}if(w.isGrenade){beginFragGrenadeCharge();return;}
  if(!infiniteAmmo&&ammo<=0){
    doReload();
    if(!reloading){playSfx('dry');sCD=Math.max(sCD,.18);}
    noAmmoT=1.5;G('no-ammo').style.opacity='1';return;
  }
  if(!infiniteAmmo&&Math.random()>=plr.ammoSaveChance)ammo--;
  syncCurrentAmmo();
  if(!infiniteAmmo&&ammo<=0&&uAmmo<=0)updateWeaponBar();
  sCD=w.isRocket?0:w.key==='rifle'?w.rate+Math.min(0,sCD):w.rate;recoil=1;wHUD();
  playWeaponShotSound(w.key,1,null);pulseCrosshair('fire');
  const shakePower=w.isRocket?1.15:w.isSniper?.98:w.key==='shotgun'?.78:w.key==='rifle'?.36:.22;
  const shakeDuration=w.isRocket?.22:w.isSniper?.20:.11;
  triggerScreenShake(shakePower,shakeDuration);
  if(w.aimMode==='scope')kickSniperScope();

  // Camera recoil: repeatable pattern + small jitter gives each weapon a learnable cadence.
  const firstShot=shotSequence===0;
  const pattern=w.recoilPattern||[0],patternX=pattern[shotSequence%pattern.length]||0;
  recoilPitch+=(w.recoilY||.02)*(0.88+Math.min(.32,shotSequence*.018)+Math.random()*.16)*plr.recoilM;
  recoilYaw+=(patternX+(Math.random()-.5)*.22)*(w.recoilX||.01)*plr.recoilM;
  recoilRecovery=w.recoilDelay??.3;
  shotSequence++;shotResetT=Math.max(.34,w.rate*2.4);
  if(w.cycleTime){
    cycleTot=w.cycleTime;cycleT=cycleTot;cycleKind=w.fireMode;cycleEjected=false;
    weaponReadyT=Math.max(weaponReadyT,cycleTot);
    if(w.key==='shotgun'&&typeof showGeneratedShotgunPumpVfx==='function')showGeneratedShotgunPumpVfx(cycleTot);
    if(w.isSniper&&typeof showGeneratedSniperBoltCycleVfx==='function')showGeneratedSniperBoltCycleVfx(cycleTot);
  }

  const suppressPlayerMuzzleVisual=(w.key==='rifle'&&G('sniper-scope')?.classList.contains('on'))||(w.key==='pistol'&&fpGeneratedWeaponActive&&pistolPresentationAssetReady40('pack40PistolEffects'))||(w.key==='shotgun'&&fpGeneratedWeaponActive&&shotgunPresentationAssetReady37('pack37ShotgunEffects'))||(w.key==='rifle'&&fpGeneratedWeaponActive&&riflePresentationAssetReady36('pack36RifleEffects'))||(w.key==='rocket'&&fpGeneratedWeaponActive&&rocketPresentationAssetReady35('pack35RocketEffects'))||(w.isSniper&&sniperPresentationAssetReady32('pack32SniperEffects'));
  if(flashM)flashM.material.opacity=suppressPlayerMuzzleVisual?0:1;
  if(beamM){beamM.material.opacity=suppressPlayerMuzzleVisual?0:.72;beamT=suppressPlayerMuzzleVisual?0:FP_MUZZLE_FLASH_SECONDS;}
  const bDir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  const shots=1+(Math.random()<plr.extraShotChance?1:0);

  // Muzzle flash
  const mfp=camera.position.clone().addScaledVector(bDir,.7);mfp.y-=.1;
  trigMuzzle(mfp,w.bCol,w.key==='rocket'?1.55:w.isSniper?1.45:w.key==='shotgun'?1.25:1,!suppressPlayerMuzzleVisual);
  showGeneratedWeaponShotVfx(w.key);
  if(w.key!=='rocket'&&w.key!=='plasma'&&w.key!=='shotgun'&&!w.isSniper){
    const casingPos=camera.position.clone().addScaledVector(new THREE.Vector3(.22,-.08,-.22).applyQuaternion(camera.quaternion),1);
    ejectCasing(casingPos,camera.quaternion,false);
    if(w.key==='rifle'&&fpGeneratedWeaponActive&&riflePresentationAssetReady36('pack36RifleEffects')&&casings.length)casings[casings.length-1].m.visible=false;
    if(w.key==='pistol'&&fpGeneratedWeaponActive&&pistolPresentationAssetReady40('pack40PistolEffects')&&casings.length)casings[casings.length-1].m.visible=false;
    showGeneratedCasingFx(false);
  }

  if(w.isRocket){
    playerRocketShotCD=ROCKET_FIRE_INTERVAL;
    for(let s=0;s<shots;s++){
      const d=bDir.clone();if(s>0){d.x+=(Math.random()-.5)*.12;d.z+=(Math.random()-.5)*.12;d.normalize();}
      const launch=playerVisualMuzzleShot(camera.position,d,w,.86),fireDir=launch.dir;
      const rk=mkRkt(0xff6600),sp=launch.pos;
      rk.position.copy(sp);rk.quaternion.setFromUnitVectors(_UP,fireDir);scene.add(rk);
      pRkts.push({m:rk,vx:fireDir.x*PLAYER_ROCKET_SPEED*plr.rocketSpeedM*.82,vy:fireDir.y*PLAYER_ROCKET_SPEED*plr.rocketSpeedM*.82,vz:fireDir.z*PLAYER_ROCKET_SPEED*plr.rocketSpeedM*.82,life:13,maxSpeed:PLAYER_ROCKET_SPEED*plr.rocketSpeedM,dmg:w.dmg*PLAYER_DAMAGE_BOOST*EXPLOSION_DAMAGE_BOOST*playerDamageMultiplier()*plr.rocketDamageM*plr.explosiveDamageM,sT:0,fT:0,team:'player',ownerType:'player',_src:null,blastRadius:ROCKET_BLAST_RADIUS*plr.explosiveRadiusM*plr.rocketRadiusM});
    }
    return;
  }
  const tc=PLR_TCOL[w.key]||0xffffaa;
  const shotBloom=weaponBloom;
  const shotFeedback=w.key==='shotgun'?{seen:false,kill:false}:null;
  for(let s=0;s<shots;s++){
    for(let p=0;p<w.pellets;p++){
      const d=bDir.clone();
      const sp2=effectiveWeaponSpread(w,p,s>0,shotBloom,firstShot);
      if(sp2>0){d.x+=(Math.random()-.5)*sp2*2;d.y+=(Math.random()-.5)*sp2*2;d.z+=(Math.random()-.5)*sp2*2;d.normalize();}
      if(w.hitscan)fireInstantSniper(camera.position,d,w,{pelletIndex:p,extraShot:s>0});
      else spawnPlayerBullet(camera.position,d,w,{pelletIndex:p,extraShot:s>0,shotFeedback});
    }
  }
  if(w.isSniper)playWeaponMechanicSound('bolt',1,w.key);
  else if(w.key==='shotgun')playWeaponMechanicSound('pump',1,w.key);
  weaponBloom=Math.min(w.bloomMax??.03,weaponBloom+(w.bloomPerShot||0));

}
function spawnTracer(from,dir,dist,col,key='default'){
  if(pTrs.length>=MAX_TRACERS){const old=pTrs.shift();destroySceneObject(old.m);}
  const m=mkTracer(col,key);
  const sp=from.clone().addScaledVector(dir,.50);sp.y-=.05;
  m.position.copy(sp);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),dir);scene.add(m);
  const speed=TRACER_SPEED[key]||TRACER_SPEED.default;
  const travel=Math.max(.05,Math.min(dist,90)/speed);
  const maxLife=travel+.07;
  pTrs.push({m,vx:dir.x*speed,vy:dir.y*speed,vz:dir.z*speed,life:maxLife,maxLife});
}
function doReload(){
  if(typeof cancelPendingBombPlant==='function')cancelPendingBombPlant();
  if(typeof cancelPendingMineThrow==='function')cancelPendingMineThrow();
  if(typeof cancelPendingSmokeThrow==='function')cancelPendingSmokeThrow();
  if(getW().isGrenade)cancelFragGrenadeThrow();
  const w=getW();
  if(reloading||ammo===w.clip||uAmmo===0||weaponActionBlocked())return;
  if(w.aimMode==='scope'&&zooming)zooming=false;
  reloading=true;reloadShellLoaded=0;playerReloadUsesFullPresentation=false;
  if(w.reloadStyle==='shell'){
    reloadMode='shell';
    reloadT=Math.max(.18,w.reload*(w.shellStartM||.22));
  }else{
    const empty=ammo<=0;
    reloadMode=empty?'empty':'tactical';
    const mult=empty?(w.emptyReloadM??1):(w.tacticalReloadM??1);
    reloadT=Math.max(.30,w.reload*mult);
  }
  reloadTot=reloadT;
  const fullBombReload=w.isBomb?showGeneratedBombReloadVfx(reloadTot):false;
  const fullSmokeReload=w.isSmoke?showGeneratedSmokeReloadVfx(reloadTot):false;
  const fullMineReload=w.isMine?showGeneratedMineReloadVfx(reloadTot):false;
  const fullShotgunReload=w.key==='shotgun'?showGeneratedShotgunLoadVfx(reloadTot):false;
  const fullPistolReload=w.key==='pistol'&&typeof showGeneratedPistolReloadVfx==='function'
    ?showGeneratedPistolReloadVfx(reloadMode,reloadTot)
    :false;
  const fullRifleReload=w.key==='rifle'&&typeof showGeneratedRifleReloadVfx==='function'
    ?showGeneratedRifleReloadVfx(reloadMode,reloadTot)
    :false;
  const fullRocketReload=w.key==='rocket'&&typeof showGeneratedRocketReloadVfx==='function'
    ?showGeneratedRocketReloadVfx(reloadTot)
    :false;
  const fullPlasmaReload=w.key==='plasma'&&typeof showGeneratedPlasmaCoreReloadVfx==='function'
    ?showGeneratedPlasmaCoreReloadVfx(reloadMode,reloadTot)
    :false;
  const fullSniperReload=w.key==='sniper'&&typeof showGeneratedSniperReloadVfx==='function'
    ?showGeneratedSniperReloadVfx(reloadMode,reloadTot)
    :false;
  playerReloadUsesFullPresentation=!!(fullSmokeReload||fullBombReload||fullMineReload||fullShotgunReload||fullPistolReload||fullRifleReload||fullRocketReload||fullPlasmaReload||fullSniperReload);
  if(reloadMode!=='shell'&&!w.isSmoke&&!fullBombReload&&!fullMineReload&&!fullPistolReload&&!fullRifleReload&&!fullRocketReload&&!fullPlasmaReload&&!fullSniperReload)showGeneratedMagazineDropFx(w.key);
  // Full SR-9 reload replaces only the picture, preserving its historical RNG draw.
  if(fullSniperReload)showGeneratedMagazineDropFx(w.key,false);
  if(fullBombReload)showGeneratedMagazineDropFx(w.key,false);
  const reloadArt=G('reload-state-art');
  if(reloadArt&&typeof applyPresentationAtlasFrame==='function')applyPresentationAtlasFrame(reloadArt,reloadPresentationFrame(reloadMode));
  // Pack42 audio replaces the old reload sound; retain its one historical pitch draw.
  if(w.isSmoke)Math.random();else playWeaponMechanicSound('reload',1,w.key);
  G('rmsg').textContent=reloadMode==='shell'?'ЗАРЯДКА ПАТРОНОВ...':reloadMode==='empty'?'ПУСТОЙ МАГАЗИН...':'ТАКТИЧЕСКАЯ ПЕРЕЗАРЯДКА...';
  G('rmsg').style.opacity='1';G('reload-wrap').style.display='block';G('reload-fill').style.width='0%';
}
let pendingMineThrow=null;
const MINE_THROW_DURATION39=.58,MINE_THROW_RELEASE39=MINE_THROW_DURATION39*3/6;
function cancelPendingMineThrow(stopReload=false){
  pendingMineThrow=null;
  if(typeof fpGeneratedWeaponAction!=='undefined'&&(['mineThrow39','mineThrow24'].includes(fpGeneratedWeaponAction?.kind)||(stopReload&&fpGeneratedWeaponAction?.kind==='mineReload39')))stopGeneratedFirstPersonAction();
}
function tickPendingMineThrow(dt){
  const pending=pendingMineThrow;if(!pending)return;
  if(curW!==pending.weaponIndex||reloading||dying||!running||paused||lvlAnnOpen||perkPickOpen){cancelPendingMineThrow();return;}
  pending.age+=Math.max(0,Math.min(.05,Number(dt)||0));
  if(pending.age+1e-9<MINE_THROW_RELEASE39)return;
  pendingMineThrow=null;if(!throwMine(true))cancelPendingMineThrow();
}
function throwMine(release=false){
  if(typeof pendingBombPlant!=='undefined'&&pendingBombPlant)return;
  if(typeof pendingSmokeThrow!=='undefined'&&pendingSmokeThrow)return;
  const mineIdx=5,mineW=WEAPONS[mineIdx];
  if(!running||paused||dying||lvlAnnOpen||perkPickOpen||reloading||(!release&&(sCD>0||pendingMineThrow)))return;
  if(!ownsWeapon(mineIdx)){showMsg('💣 Сначала найдите МИНУ на карте');return;}
  if(playerMineCD>0){showMsg('💣 Новую мину можно поставить через '+Math.ceil(playerMineCD)+' сек.');return;}
  if(playerMineCount()>=MAX_PLAYER_MINES||mines.length>=MAX_MINES){showMsg('Лимит активных мин достигнут!');return;}
  const mineAmmo=weaponAmmoValue(mineIdx);
  if(mineAmmo<=0){
    if(weaponReserveValue(mineIdx)>0){
      if(curW===mineIdx)doReload();
      else showMsg('💣 В запасе есть мины — выберите слот 6 и перезарядите');
    }else showMsg('💣 Боезапас мин пуст — подберите ещё МИНУ на карте');
    return;
  }
  if(!release&&typeof showGeneratedMineThrowVfx==='function'&&showGeneratedMineThrowVfx(MINE_THROW_DURATION39)){
    pendingMineThrow={weaponIndex:curW,age:0};zooming=false;return;
  }
  if(!testingInfiniteAmmoEnabled())setWeaponAmmo(mineIdx,mineAmmo-1);
  if(!testingInfiniteAmmoEnabled()&&mineAmmo-1<=0&&weaponReserveValue(mineIdx)<=0)updateWeaponBar();
  sCD=mineW.rate;
  if(curW===mineIdx)wHUD();
  const dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  const m=mkMine();m.position.copy(camera.position.clone().addScaledVector(dir,.6));scene.add(m);
  const vv=dir.clone().multiplyScalar(9);vv.y+=5;
  mines.push({m,vx:vv.x,vy:vv.y,vz:vv.z,fall:true,life:Infinity,armed:false,aT:1.5,checkT:.08,ph:0,team:'player',owner:'player',dmg:mineW.dmg*PLAYER_DAMAGE_BOOST*EXPLOSION_DAMAGE_BOOST*playerDamageMultiplier()*plr.mineDamageM*plr.explosiveDamageM,radius:9*plr.explosiveRadiusM*plr.mineRadiusM});
  playMineSound39('Throw',m.position);
  playerMineCD=MINE_COOLDOWN_SECONDS*plr.mineCooldownM;
  mineHudSecond=-1;updateMineHUD();
  return true;
}
// One gameplay owner: art readiness never controls release or ammo consumption.
let pendingBombPlant=null;
const BOMB_PLANT_DURATION41=.96,BOMB_PLANT_RELEASE41=.48;
function cancelPendingBombPlant(){
  pendingBombPlant=null;
  if(typeof fpGeneratedWeaponAction!=='undefined'&&fpGeneratedWeaponAction?.kind==='bombPlant41')stopGeneratedFirstPersonAction();
}
function bombPlantActionBlocked(){
  return !running||paused||dying||lvlAnnOpen||perkPickOpen||reloading||!onGnd||
    weaponEquipT>0||weaponReadyT>0||sprintExitT>0||sprintBlend>.20||wasWeaponSprinting||cycleT>0;
}
// Sweep the full ground footprint, not just the endpoint: thin walls must not be crossed.
function safeBombPlacement(origin,dir,distance){
  if(!origin||!dir||![origin.x,origin.z,dir.x,dir.z,distance].every(Number.isFinite))return null;
  const radius=.42,dx=dir.x*distance,dz=dir.z*distance;
  let travel=1;
  for(const bb of wallAABBs){
    const minX=bb.min.x-radius,maxX=bb.max.x+radius,minZ=bb.min.z-radius,maxZ=bb.max.z+radius;
    if(origin.x>minX&&origin.x<maxX&&origin.z>minZ&&origin.z<maxZ)return null;
    let enter=0,leave=1;
    for(const [p,delta,min,max]of [[origin.x,dx,minX,maxX],[origin.z,dz,minZ,maxZ]]){
      if(Math.abs(delta)<1e-10){if(p<min||p>max){leave=-1;break;}continue;}
      const a=(min-p)/delta,b=(max-p)/delta;
      enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));
    }
    if(enter<=leave&&leave>=0&&enter<=1)travel=Math.min(travel,Math.max(0,enter-1e-4));
  }
  const x=origin.x+dx*travel,z=origin.z+dz*travel;
  if(Math.abs(x)>93||Math.abs(z)>93)return null;
  for(const bb of wallAABBs)if(x>bb.min.x-radius&&x<bb.max.x+radius&&z>bb.min.z-radius&&z<bb.max.z+radius)return null;
  return new THREE.Vector3(x,.34,z);
}
function playerBombPlacement(){
  const dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  dir.y=0;if(dir.lengthSq()<.01)dir.set(0,0,-1);dir.normalize();
  return safeBombPlacement(camera.position,dir,1.15);
}
function tickPendingBombPlant(dt){
  const pending=pendingBombPlant;if(!pending)return;
  if(curW!==pending.weaponIndex||bombPlantActionBlocked()){cancelPendingBombPlant();return;}
  pending.age+=Math.max(0,Math.min(.05,Number(dt)||0));
  if(!pending.committed&&pending.age+1e-9>=BOMB_PLANT_RELEASE41&&!commitPendingBombPlant(pending)){cancelPendingBombPlant();return;}
  if(pending.age+1e-9>=BOMB_PLANT_DURATION41)pendingBombPlant=null;
}
function placeBomb(){
  if(pendingBombPlant||pendingMineThrow||fragGrenadeCharge||pendingFragGrenadeThrow||(typeof pendingSmokeThrow!=='undefined'&&pendingSmokeThrow)||bombPlantActionBlocked()||sCD>0)return false;
  const bombIdx=6;
  if(!ownsWeapon(bombIdx)){showMsg('🧨 Сначала найдите БОМБУ на карте');return;}
  if(playerBombCD>0){showMsg('🧨 Новую бомбу можно поставить через '+Math.ceil(playerBombCD)+' сек.');return;}
  const bombAmmo=weaponAmmoValue(bombIdx);
  if(bombAmmo<=0){
    if(weaponReserveValue(bombIdx)>0){
      if(curW===bombIdx)doReload();else showMsg('🧨 В запасе есть бомбы — выберите слот 7 и перезарядите');
    }else showMsg('🧨 Боезапас бомб пуст — подберите ещё БОМБУ на карте');
    return;
  }
  if(mines.length>=MAX_MINES){showMsg('Лимит активной взрывчатки достигнут');return;}
  if(!playerBombPlacement()){showMsg('🧨 Для бомбы нужно свободное место на земле');return false;}
  pendingBombPlant={weaponIndex:curW,age:0,committed:false};
  zooming=false;
  if(typeof showGeneratedBombArmVfx==='function')showGeneratedBombArmVfx(BOMB_PLANT_DURATION41);
  return true;
}
function commitPendingBombPlant(pending){
  if(pending!==pendingBombPlant||pending.committed||curW!==pending.weaponIndex||bombPlantActionBlocked())return false;
  const bombIdx=6,bombW=WEAPONS[bombIdx],bombAmmo=weaponAmmoValue(bombIdx);
  if(!ownsWeapon(bombIdx)||bombAmmo<=0||playerBombCD>0||mines.length>=MAX_MINES)return false;
  const pos=playerBombPlacement();if(!pos)return false;
  const m=mkBomb();m.position.copy(pos);scene.add(m);
  const fuse=BOMB_FUSE_SECONDS*plr.bombFuseM;
  mines.push({
    m,vx:0,vy:0,vz:0,fall:false,life:Infinity,armed:true,aT:0,checkT:0,ph:0,
    team:'player',owner:'player',src:null,kind:'bomb',fuseT:fuse,fuseTotal:fuse,
    dmg:BOMB_BASE_DAMAGE*PLAYER_DAMAGE_BOOST*playerDamageMultiplier()*plr.bombDamageM*plr.explosiveDamageM,
    radius:BOMB_BLAST_RADIUS*plr.bombRadiusM*plr.explosiveRadiusM
  });
  pending.committed=true;
  if(!testingInfiniteAmmoEnabled())setWeaponAmmo(bombIdx,bombAmmo-1);
  if(!testingInfiniteAmmoEnabled()&&bombAmmo-1<=0&&weaponReserveValue(bombIdx)<=0)updateWeaponBar();
  sCD=bombW.rate;
  if(curW===bombIdx)wHUD();
  playerBombCD=BOMB_COOLDOWN_SECONDS;
  bombHudSecond=-1;updateMineHUD();
  showMsg('🧨 Фитиль зажжён: мощный взрыв через '+Number(fuse.toFixed(1))+' сек.!');
  return true;
}
function spawnBotSmokeGrenade(from,target,team,src){
  if(smokeGrenades.length>=4||!from||!target)return false;
  const flat=new THREE.Vector3(target.x-from.x,0,target.z-from.z),dist=Math.max(1,flat.length());
  flat.multiplyScalar(1/dist);
  const m=mkSmokeGrenade(),spawn=from.clone().addScaledVector(flat,.55);spawn.y=Math.max(.75,from.y);
  const contact=sweepWallSphere(from,spawn,.12);
  m.position.copy(from).addScaledVector(spawn.clone().sub(from),contact?Math.max(0,contact.t-1e-4):1);scene.add(m);
  const speed=Math.max(8.5,Math.min(13,8.8+dist*.12));
  smokeGrenades.push({
    m,vx:flat.x*speed,vy:4.8+Math.min(2.8,dist*.07),vz:flat.z*speed,
    rx:7+Math.random()*4,rz:6+Math.random()*4,age:0,life:3,grounded:false,trailT:.02,
    team,src,radiusM:.90,durationM:.78
  });
  return true;
}
function spawnBotFragGrenade(from,target,team,src){
  if(activeBotFragGrenades()>=MAX_BOT_GRENADES||!from||!target)return false;
  const flat=new THREE.Vector3(target.x-from.x,0,target.z-from.z),dist=Math.max(1,flat.length());
  flat.multiplyScalar(1/dist);
  const m=mkFragGrenade(team);m.position.copy(from).addScaledVector(flat,.48);m.position.y=Math.max(.78,from.y);scene.add(m);
  const speed=Math.max(8.2,Math.min(12.2,8.5+dist*.10));
  botGrenades.push({
    m,vx:flat.x*speed,vy:5.4+Math.min(2.4,dist*.065),vz:flat.z*speed,
    rx:8+Math.random()*5,rz:7+Math.random()*4,fuse:1.72+Math.random()*.22,
    team,src,ownerType:'bot',dmg:0,radius:FRAG_GRENADE_BLAST.radius,bounces:0
  });
  if(typeof showGeneratedGrenadeFlightVfx==='function')showGeneratedGrenadeFlightVfx(m);
  return true;
}
function throwFragGrenade(release=false,strength=0){
  if(typeof pendingBombPlant!=='undefined'&&pendingBombPlant)return;
  if(typeof pendingMineThrow!=='undefined'&&pendingMineThrow)return;
  const grenadeIdx=GRENADE_WEAPON_INDEX,grenadeW=WEAPONS[grenadeIdx];
  if(grenadeIdx<0||reloading||(!release&&(sCD>0||pendingFragGrenadeThrow)))return;
  if(!ownsWeapon(grenadeIdx)){showMsg('💥 Сначала найдите ОСКОЛОЧНУЮ ГРАНАТУ на карте');return;}
  if(activePlayerFragGrenades()>=MAX_PLAYER_FRAG_GRENADES){showMsg('💥 Слишком много активных гранат — дождитесь взрыва');return;}
  const grenadeAmmo=weaponAmmoValue(grenadeIdx);
  if(grenadeAmmo<=0){
    if(weaponReserveValue(grenadeIdx)>0){
      if(curW===grenadeIdx)doReload();else showMsg('💥 В запасе есть гранаты — выберите слот 0 и перезарядите');
    }else showMsg('💥 Гранаты закончились — найдите новый pickup на карте');
    return;
  }
  if(!release){
    const animated=showGeneratedGrenadeThrowVfx();
    if(animated){
      pendingFragGrenadeThrow={weaponIndex:grenadeIdx,remaining:.58*5/8,strength};
      sCD=.58*5/8;return;
    }
  }
  const dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).normalize();
  const m=mkFragGrenade('ally');m.position.copy(camera.position).addScaledVector(dir,.62);m.position.y-=.12;scene.add(m);
  const power=Math.max(0,Math.min(1,Number(strength)||0));
  const speed=FRAG_GRENADE_THROW.minSpeed+(FRAG_GRENADE_THROW.maxSpeed-FRAG_GRENADE_THROW.minSpeed)*power;
  const lift=FRAG_GRENADE_THROW.minLift+(FRAG_GRENADE_THROW.maxLift-FRAG_GRENADE_THROW.minLift)*power;
  const v=dir.clone().multiplyScalar(speed);v.y+=lift;
  botGrenades.push({
    m,vx:v.x,vy:v.y,vz:v.z,rx:9.5,rz:8.2,fuse:1.82,team:'ally',src:null,ownerType:'player',
    dmg:0, // Grenade damage is target-relative, not multiplied by firearm/perk damage.
    radius:FRAG_GRENADE_BLAST.radius*plr.explosiveRadiusM,bounces:0
  });
  if(typeof showGeneratedGrenadeFlightVfx==='function')showGeneratedGrenadeFlightVfx(m);
  // The projectile is emitted at the action's release frame; no second hand layer is spawned.
  if(!testingInfiniteAmmoEnabled())setWeaponAmmo(grenadeIdx,grenadeAmmo-1);
  if(!testingInfiniteAmmoEnabled()&&grenadeAmmo-1<=0&&weaponReserveValue(grenadeIdx)<=0)updateWeaponBar();
  sCD=grenadeW.rate;recoil=.35;recoilPitch+=(grenadeW.recoilY||.02)*plr.recoilM;
  wHUD();showMsg('💥 Осколочная граната брошена · запал 1.8 сек.');
}

// Mechanics own release even when a presentation file is missing or still decoding.
let pendingSmokeThrow=null;
const SMOKE_THROW_DURATION42=.58,SMOKE_THROW_RELEASE42=SMOKE_THROW_DURATION42*3/6;
function cancelPendingSmokeThrow(stopReload=false){
  pendingSmokeThrow=null;
  if(typeof fpGeneratedWeaponAction!=='undefined'&&(fpGeneratedWeaponAction?.kind==='smokeThrow42'||(stopReload&&fpGeneratedWeaponAction?.kind==='smokeReload42')))stopGeneratedFirstPersonAction();
}
function tickPendingSmokeThrow(dt){
  const pending=pendingSmokeThrow;if(!pending)return;
  if(curW!==pending.weaponIndex||!running||paused||dying||lvlAnnOpen||perkPickOpen||reloading){cancelPendingSmokeThrow();return;}
  pending.age+=Math.max(0,Math.min(.05,Number(dt)||0));
  if(pending.age+1e-9<SMOKE_THROW_RELEASE42)return;
  pendingSmokeThrow=null;
  if(!throwSmokeGrenade(true))cancelPendingSmokeThrow();
}
function throwSmokeGrenade(release=false){
  if(typeof pendingBombPlant!=='undefined'&&pendingBombPlant)return;
  if(pendingMineThrow)return;
  const smokeIdx=SMOKE_WEAPON_INDEX,smokeW=WEAPONS[smokeIdx];
  if(!running||paused||dying||lvlAnnOpen||perkPickOpen||reloading||sCD>0||(!release&&pendingSmokeThrow))return;
  if(!ownsWeapon(smokeIdx)){showMsg('🌫️ Сначала найдите ДЫМОВУХУ на карте');return;}
  if(playerSmokeCD>0){showMsg('🌫️ Дымовуха будет готова через '+Math.ceil(playerSmokeCD)+' сек.');return;}
  if(smokeGrenades.length>=2){showMsg('🌫️ Дождитесь раскрытия предыдущей дымовухи');return;}
  const smokeAmmo=weaponAmmoValue(smokeIdx);
  if(smokeAmmo<=0){
    if(weaponReserveValue(smokeIdx)>0){
      if(curW===smokeIdx)doReload();else showMsg('🌫️ В запасе есть дымовухи — выберите слот 8 и перезарядите');
    }else showMsg('🌫️ Боезапас дымовух пуст — подберите ещё ДЫМОВУХУ на карте');
    return;
  }
  if(!release){
    pendingSmokeThrow={weaponIndex:curW,age:0};zooming=false;
    if(typeof showGeneratedSmokeThrowVfx==='function')showGeneratedSmokeThrowVfx(SMOKE_THROW_DURATION42);
    playSmokeSound42('pin');return true;
  }
  const dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).normalize();
  const m=mkSmokeGrenade();
  const spawn=camera.position.clone().addScaledVector(dir,.72);spawn.y-=.12;
  const contact=sweepWallSphere(camera.position,spawn,.12);
  m.position.copy(camera.position).addScaledVector(spawn.clone().sub(camera.position),contact?Math.max(0,contact.t-1e-4):1);
  scene.add(m);
  const v=dir.clone().multiplyScalar(12.5);v.y+=5.2;
  smokeGrenades.push({m,vx:v.x,vy:v.y,vz:v.z,rx:7+Math.random()*5,rz:6+Math.random()*5,age:0,life:3,grounded:false,trailT:.02});
  playSmokeSound42('throw',m.position);
  if(!testingInfiniteAmmoEnabled())setWeaponAmmo(smokeIdx,smokeAmmo-1);
  if(!testingInfiniteAmmoEnabled()&&smokeAmmo-1<=0&&weaponReserveValue(smokeIdx)<=0)updateWeaponBar();
  sCD=smokeW.rate;recoil=.45;
  recoilPitch+=(smokeW.recoilY||.02)*plr.recoilM;
  trigMuzzle(camera.position.clone().addScaledVector(dir,.62),0xcbd4d8,.72,!smokePresentationAssetReady42('pack42SmokeWorld'));
  playerSmokeCD=SMOKE_COOLDOWN_SECONDS*plr.smokeCooldownM;
  smokeHudSecond=-1;wHUD();
  showMsg('🌫️ Дымовуха запущена · следующая через '+Math.ceil(playerSmokeCD)+' сек.');
  return true;
}

function moveSmokeGrenade42(g,dt){
  let remaining=dt;g.grounded=false;
  for(let contact=0;contact<4&&remaining>1e-7;contact++){
    const from=g.m.position.clone(),to=from.clone().add(new THREE.Vector3(g.vx,g.vy,g.vz).multiplyScalar(remaining));
    let hit=sweepWallSphere(from,to,.12);
    if(to.y<=.13&&g.vy<0){
      const t=Math.max(0,(.13-from.y)/(to.y-from.y));
      if(!hit||t<hit.t)hit={t,axis:'y',sign:1,boundary:.13};
    }
    if(!hit){g.m.position.copy(to);break;}
    g.m.position.copy(from).addScaledVector(to.clone().sub(from),hit.t);
    g.m.position[hit.axis]=hit.boundary+hit.sign*.0001;
    if(hit.axis==='y'&&hit.sign>0){
      if(Math.abs(g.vy)>.9)g.vy=Math.abs(g.vy)*.24;else{g.vy=0;g.grounded=true;}
      g.vx*=.72;g.vz*=.72;
    }else g['v'+hit.axis]*=-.28;
    playSmokeSound42('bounce',g.m.position);
    remaining*=1-hit.t;
  }
  if(g.grounded&&g.m.position.y>.1302){
    const below=g.m.position.clone();below.y-=.002;
    const support=sweepWallSphere(g.m.position,below,.12);
    g.grounded=Boolean(support&&support.axis==='y'&&support.sign>0);
  }
}

// ─── UPDATE PROJECTILES ─────────────────

function awardExplosionKill(victim,ownerType,ownerBot,kind,ownerTeam=null){
  if(ownerType==='player'){
    const pts=kind==='bomb'?160:kind==='mine'?120:kind==='grenade'?130:110;
    addXP((victim.type+1)*(kind==='bomb'?42:kind==='mine'?35:kind==='grenade'?32:28));
    score+=(victim.type+1)*pts;
    kills++;grantPlayerKillRewards();allyKills++;
    markHUD();updateTeamScore();
    pushKillFeed('ally','ВЫ','enemy','ВРАЖЕСКИЙ БОТ',kind);
    showHitMarker('kill');playSfx('kill');
    showKillMedal({explosive:true});
    scorePop((kind==='bomb'?'🧨':kind==='mine'?'💣':kind==='grenade'?'💥':'🚀')+'+'+(victim.type+1)*pts);
  }else{
    const team=ownerBot?.team||ownerTeam;
    if(team==='ally')allyKills++;else enemyKills++;
    if(ownerBot)ownerBot.kills=(ownerBot.kills||0)+1;
    updateTeamScore();
    if(typeof pushKillFeed==='function'){
      pushKillFeed(
        team,
        team==='ally'?'СВОЙ БОТ':'ВРАЖЕСКИЙ БОТ',
        victim.team,
        victim.team==='ally'?'СВОЙ БОТ':'ВРАЖЕСКИЙ БОТ',
        kind
      );
    }
  }
}
function applyBlastDamage(pos,radius,maxDamage,ownerType='world',ownerBot=null,kind='rocket',playerSelfScale=.35,ownerTeamOverride=null,directRocketTarget=null){
  const r2=radius*radius;
  const dir=new THREE.Vector3();
  const ownerTeam=ownerType==='player'?'ally':(ownerBot?.team||ownerTeamOverride||null);
  for(const en of enemies){
    if(!en.alive||en===ownerBot||(ownerTeam&&en.team===ownerTeam))continue;
    const center=en.group.position.clone();center.y+=.9;
    const dx=center.x-pos.x,dy=center.y-pos.y,dz=center.z-pos.z;
    const d2=dx*dx+dy*dy+dz*dz;
    if(d2>=r2)continue;
    const d=Math.sqrt(d2);
    let falloff=kind==='grenade'?fragGrenadeDamageScale(d,radius):Math.max(.08,1-d/radius);
    if(kind==='grenade'){if(wallBetween(pos,center,wallMeshes))continue;}
    else if(wallBetween(pos,center,losMeshes))falloff*=.48;
    const before=en.alive;
    dir.set(dx,Math.max(.12,dy),dz).normalize();
    const blastDamage=(kind==='grenade'?en.maxHp*FRAG_GRENADE_BLAST.healthFraction:maxDamage)*falloff;
    // Only the hostile target accepted by projectile collision receives lethal direct damage.
    const damage=kind==='rocket'&&directRocketTarget===en?Math.max(en.hp,blastDamage):blastDamage;
    en.hurt(damage,dir,ownerTeam||'world',ownerType==='player'?'player':ownerBot);
    if(before&&!en.alive)awardExplosionKill(en,ownerType,ownerBot,kind,ownerTeam);
  }
  const canHitPlayer=ownerType==='player'||ownerTeam==='enemy'||!ownerTeam;
  const pdx=camera.position.x-pos.x,pdy=camera.position.y-pos.y,pdz=camera.position.z-pos.z;
  const pd2=pdx*pdx+pdy*pdy+pdz*pdz;
  if(canHitPlayer&&pd2<r2&&!dying){
    const pd=Math.sqrt(pd2);
    let falloff=kind==='grenade'?fragGrenadeDamageScale(pd,radius):Math.max(.06,1-pd/radius);
    if(kind==='grenade'&&wallBetween(pos,camera.position,wallMeshes))falloff=0;
    else if(kind!=='grenade'&&wallBetween(pos,camera.position.clone(),losMeshes))falloff*=.48;
    if(ownerType==='player'&&kind!=='grenade')falloff*=playerSelfScale;
    let playerBlast=(kind==='grenade'?plr.maxHp*FRAG_GRENADE_BLAST.healthFraction:maxDamage)*falloff;
    if(kind==='bomb')playerBlast=Math.min(playerBlast,850);
    applyDamageToPlayer(playerBlast,kind,ownerBot,kind==='rocket'&&directRocketTarget==='player');
  }
}
// Contact uses each actual box in its local space: rotated cover must not acquire
// invisible AABB corners. LOS deliberately retains its separate endpoint tolerance.
function rocketWallContact(from,to,radius=.10){
  let nearest=null;
  for(const mesh of wallMeshes){
    const p=mesh.geometry?.parameters;if(!p?.width||!p?.height||!p?.depth)continue;
    const a=mesh.worldToLocal(from.clone()),b=mesh.worldToLocal(to.clone());
    const scale=mesh.getWorldScale(new THREE.Vector3());
    const bounds={x:p.width*.5,y:p.height*.5,z:p.depth*.5};
    let enter=0,leave=1,axis=null,sign=0,inside=true,escape=null;
    for(const key of ['x','y','z']){
      const padding=radius/Math.max(.0001,Math.abs(scale[key])),min=-bounds[key]-padding,max=bounds[key]+padding;
      const start=a[key],delta=b[key]-start;
      if(start<=min||start>=max)inside=false;
      const side=start-min<max-start?{axis:key,sign:-1,gap:start-min}:{axis:key,sign:1,gap:max-start};
      if(!escape||side.gap<escape.gap)escape=side;
      if(Math.abs(delta)<1e-10){if(start<min||start>max){leave=-1;break;}continue;}
      const t1=(min-start)/delta,t2=(max-start)/delta;
      if(Math.min(t1,t2)>=enter){enter=Math.min(t1,t2);axis=key;sign=delta>0?-1:1;}
      leave=Math.min(leave,Math.max(t1,t2));if(enter>leave)break;
    }
    if(inside){enter=0;axis=escape.axis;sign=escape.sign;}
    if(!axis||enter<0||enter>leave||enter>1||nearest&&enter>=nearest.t)continue;
    const local=a.clone().addScaledVector(b.clone().sub(a),enter);
    local[axis]=sign*bounds[axis];
    const normal=new THREE.Vector3();normal[axis]=sign;
    const pos=mesh.localToWorld(local.clone().addScaledVector(normal,.025));
    nearest={t:enter,mesh,local,normal,pos,ground:false,directTarget:null};
  }
  return nearest;
}
function rocketActorContact(from,to,center,radius){
  const dx=to.x-from.x,dy=to.y-from.y,dz=to.z-from.z;
  const ox=from.x-center.x,oy=from.y-center.y,oz=from.z-center.z;
  const a=dx*dx+dy*dy+dz*dz,c=ox*ox+oy*oy+oz*oz-radius*radius;
  if(c<=0)return 0;if(a<1e-12)return Infinity;
  const b=ox*dx+oy*dy+oz*dz,disc=b*b-a*c;if(disc<0)return Infinity;
  const t=(-b-Math.sqrt(disc))/a;return t>=0&&t<=1?t:Infinity;
}
function firstRocketContact(r,from,to,playerTargetPos){
  let hit=rocketWallContact(from,to);
  const accept=(t,ground=false,target=null)=>{
    if(!Number.isFinite(t)||t<0||t>1||hit&&t>=hit.t)return;
    const pos=from.clone().addScaledVector(to.clone().sub(from),t);if(ground)pos.y=.10;
    hit={t,pos,ground,directTarget:target};
  };
  if(from.y<=.10)accept(0,true);
  else if(to.y<=.10)accept((.10-from.y)/(to.y-from.y),true);
  const team=r.ownerType==='player'?'ally':(r._src?.team||r.team||null);
  for(const en of enemies){
    if(!en.alive||en===r._src)continue;
    accept(rocketActorContact(from,to,en.group.position,Math.sqrt(2.65)),false,en.team===team?null:en);
  }
  // The shooter is excluded; other friendly bodies still stop the physical missile.
  if(r.ownerType!=='player'&&!dying)accept(rocketActorContact(from,to,playerTargetPos,Math.sqrt(2.5)),false,team==='enemy'?'player':null);
  return hit;
}
function guardRocketLaunch(from,to){
  const hit=rocketWallContact(from,to,.12);
  if(!hit)return to.clone();
  const length=from.distanceTo(to),t=Math.max(0,hit.t-.025/Math.max(.001,length));
  return from.clone().addScaledVector(to.clone().sub(from),t);
}
// Presentation receives the very same accepted wall face as simulation.
function rocketWallImpactSurface(from,to,contact=null){
  const dir=new THREE.Vector3().subVectors(to,from),distance=dir.length();
  if(!contact&&distance<.15)return null;
  const ray=contact?null:new THREE.Raycaster(from,dir.multiplyScalar(1/distance),0,distance);
  const hit=contact?null:ray.intersectObjects(wallMeshes,false)[0],mesh=contact?.mesh||hit?.object;
  if(!mesh?.geometry?.parameters||!contact&&!hit?.face)return null;
  const local=contact?contact.local.clone():mesh.worldToLocal(hit.point.clone()),normal=contact?.normal||hit.face.normal;
  const axis=Math.abs(normal.x)>.5?'x':Math.abs(normal.y)>.5?'y':'z';
  const u=axis==='x'?'z':'x',v=axis==='y'?'z':'y',p=mesh.geometry.parameters;
  const bounds={x:p.width*.5,y:p.height*.5,z:p.depth*.5};
  // Fit inside the actual box face, including rotated walls and edge impacts.
  const half=Math.min(1.4,bounds[u]-Math.abs(local[u])-.025,bounds[v]-Math.abs(local[v])-.025);
  if(!Number.isFinite(half)||half<.06)return null;
  local[axis]+=(normal[axis]>0?1:-1)*.025;
  const center=mesh.localToWorld(local.clone()),corners=[];
  for(const [du,dv] of [[-1,1],[1,1],[1,-1],[-1,-1]]){
    const point=local.clone();point[u]+=du*half;point[v]+=dv*half;corners.push(mesh.localToWorld(point));
  }
  return{center,corners};
}
function detonateRocket(arr,index,r,pos,groundImpact=false,wallSurface=null,directTarget=null){
  const ownerType=r.ownerType||'bot';
  const radius=r.blastRadius||ROCKET_BLAST_RADIUS;
  const blastDistance=camera.position.distanceTo(pos);
  if(blastDistance<105){const proximity=Math.max(.12,1-blastDistance/110);playExplosionSound(pos,proximity);if(blastDistance<55)triggerScreenShake(proximity*.95,.20);}
  const generatedBlast=showGeneratedRocketExplosionVfx(pos,groundImpact,wallSurface);
  // Pack35 owns the blast; fallback has particles only, without retired rings/rays/art.
  explode(pos.clone(),ownerType==='player'?0xff8800:0xff3300,radius,false,generatedBlast?false:'particles');
  applyBlastDamage(pos,radius,r.dmg,ownerType,r._src||null,'rocket',.28,r.ownerType==='player'?'ally':(r._src?.team||r.team||null),directTarget);
  destroySceneObject(r.m);
  arr.splice(index,1);
}

// Continuous 3D contact prevents tunnelling through thin walls at strong throws.
function moveFragGrenade(g,dt){
  let remaining=dt;g.grounded=false;
  for(let contact=0;contact<3&&remaining>1e-7;contact++){
    const from=g.m.position.clone(),to=from.clone();
    to.x+=g.vx*remaining;to.y+=g.vy*remaining;to.z+=g.vz*remaining;
    let hit=sweepWallSphere(from,to,.14);
    if(to.y<=.14&&g.vy<0){
      const t=Math.max(0,(.14-from.y)/(to.y-from.y));
      if(!hit||t<hit.t)hit={t,axis:'y',sign:1,boundary:.14};
    }
    if(!hit){g.m.position.copy(to);break;}
    g.m.position.set(from.x+(to.x-from.x)*hit.t,from.y+(to.y-from.y)*hit.t,from.z+(to.z-from.z)*hit.t);
    g.m.position[hit.axis]=hit.boundary+hit.sign*.0001;
    const velocity='v'+hit.axis;
    if(hit.axis==='y'&&hit.sign>0){
      if(Math.abs(g.vy)>.9){g.vy=Math.abs(g.vy)*.34;g.vx*=.76;g.vz*=.76;g.bounces++;}
      else{g.vy=0;g.vx*=.90;g.vz*=.90;g.grounded=true;}
    }else{g[velocity]*=-.34;g.bounces++;}
    remaining*=1-hit.t;
  }
  // A contact earlier in this step is not proof of support at the final position.
  // Sliding off a roof must restore flight before presentation/detonation consumes it.
  if(g.grounded&&g.m.position.y>.1402){
    const below=g.m.position.clone();below.y-=.002;
    const support=sweepWallSphere(g.m.position,below,.14);
    g.grounded=Boolean(support&&support.axis==='y'&&support.sign>0);
  }
}

function tickBotGrenades(dt){
  for(let i=botGrenades.length-1;i>=0;i--){
    const g=botGrenades[i];g.fuse-=dt;g.vy-=18*dt;
    moveFragGrenade(g,dt);
    g.m.rotation.x+=g.rx*dt;g.m.rotation.z+=g.rz*dt;
    if(g.fuse>0){
      if(!g._generatedFuseVfx&&g.fuse<=.78&&g.m.position.distanceToSquared(camera.position)<625){
        g._generatedFuseVfx=true;
        if(typeof showGeneratedGrenadeFuseVfx==='function')showGeneratedGrenadeFuseVfx(g.m);
      }
      continue;
    }
    const pos=g.m.position.clone();pos.y=Math.max(.14,pos.y);
    const ownerType=g.ownerType||'bot',ownerTeam=ownerType==='player'?'ally':g.team;
    const blastDistance=camera.position.distanceTo(pos),proximity=Math.max(.18,1-blastDistance/70);
    playExplosionSound(pos,.80*proximity);if(blastDistance<42)triggerScreenShake(proximity*.70,.15);
    explode(pos,ownerTeam==='ally'?0x4caeff:0xff5a2a,4,false);spawnCombatImpact(pos,'rocket');
    showGeneratedFragGrenadeVfx(pos,g.grounded?(g.m.position.y<=.141?-.04:g.m.position.y-.14):null);
    applyBlastDamage(pos,g.radius,g.dmg,ownerType,g.src,'grenade',.28,ownerTeam);
    destroySceneObject(g.m);botGrenades.splice(i,1);
  }
}
function tickRocketFireCooldowns(dt){
  playerRocketShotCD=Math.max(0,playerRocketShotCD-dt);
  for(const bot of enemies)bot.rocketShotCD=Math.max(0,(bot.rocketShotCD||0)-dt);
}
function tickProjectiles(dt){
  let warn=false;
  const playerTargetPos=(dying&&deathCamActive)?deathCamPlayerPos:camera.position;
  const _prev=new THREE.Vector3();
  const processRockets=(arr)=>{
    for(let i=arr.length-1;i>=0;i--){
      const r=arr[i];r.life-=dt;
      _prev.copy(r.m.position);
      const rs=Math.hypot(r.vx,r.vy,r.vz);
      // Powered flight accelerates smoothly to the existing weapon speed.
      // Integrate both distance and velocity, so FPS cannot change the flight path.
      const step=Math.min(dt,Math.max(0,r.life+dt));
      let travel=rs*step;
      if(r.maxSpeed&&rs>.001){
        const start=Math.min(rs,r.maxSpeed),decay=Math.exp(-step/.18);
        travel=r.maxSpeed*step-(r.maxSpeed-start)*.18*(1-decay);
        const speed=r.maxSpeed-(r.maxSpeed-start)*decay,mul=speed/rs;
        r.vx*=mul;r.vy*=mul;r.vz*=mul;
      }
      const dir=new THREE.Vector3(r.vx,r.vy,r.vz).normalize();
      r.m.position.addScaledVector(dir,travel);r.m.quaternion.setFromUnitVectors(_UP,dir);
      const contact=firstRocketContact(r,_prev,r.m.position,playerTargetPos);
      if(contact)r.m.position.copy(contact.pos);
      r.fT=(r.fT||0)+dt;
      const flamePulse=.88+Math.sin(r.fT*32)*.12;
      const flames=r.m.userData.flames||[];
      for(let fi=0;fi<flames.length;fi++){
        const flame=flames[fi];
        flame.material.opacity=(fi===1?.82:fi===0?.38:.26)*(.88+flamePulse*.14);
        const s=flamePulse*(fi===0?1.08:1);
        flame.scale.set(s,1+(flamePulse-.88)*1.8,s);
      }
      r.sT=(r.sT||0)+dt;
      if(r.sT>.058){
        r.sT=0;
        const exhaust=r.m.position.clone().addScaledVector(dir,-.38);
        spawnSmoke(exhaust,0x4b4f55);
        if(!PERF_MODE||Math.random()<.55)spawnP(exhaust,0xffa02a,.45);
      }
      const rocketTeam=r.ownerType==='player'?'ally':(r._src?.team||r.team||null);
      if((r.ownerType||'bot')==='bot'&&rocketTeam==='enemy'&&r.m.position.distanceToSquared(playerTargetPos)<225)warn=true;

      if(contact||r.life<=0){
        const pos=r.m.position.clone();
        if(pos.y<.10)pos.y=.10;
        const wallSurface=contact?.mesh?rocketWallImpactSurface(_prev,pos,contact):null;
        detonateRocket(arr,i,r,pos,Boolean(contact?.ground),wallSurface,contact?.directTarget||null);
      }
    }
  };
  processRockets(eRkts);
  processRockets(pRkts);
  syncRocketFlightArt();
  tickBotGrenades(dt);
  syncGrenadeFlightArt();

  // Player firearm projectiles use swept segment collision, so fast rounds cannot tunnel through bots or walls.
  const _stepDir=new THREE.Vector3(),_hitPos=new THREE.Vector3(),_ricochetDir=new THREE.Vector3();
  for(let i=pBullets.length-1;i>=0;i--){
    const b=pBullets[i],w=WEAPON_BY_KEY[b.wKey]||WEAPONS[0];
    b.life-=dt;
    _prev.copy(b.pos);
    if(b.gravity)b.vel.y-=b.gravity*dt;
    b.pos.addScaledVector(b.vel,dt);
    _stepDir.subVectors(b.pos,_prev);
    const stepDist=_stepDir.length();
    if(stepDist<=1e-5){if(b.life<=0)destroyPlayerBullet(i);continue;}
    _stepDir.multiplyScalar(1/stepDist);

    const wallHit=firstFirearmSurfaceHit(_prev,_stepDir,stepDist);
    const wallDist=wallHit?wallHit.distance:Infinity;
    const hit=hitEnemy(_prev,_stepDir,'ally',b.ignoreEnemy,stepDist+1.2);
    const enemyDist=hit.en?hit.dist:Infinity;

    if(hit.en&&enemyDist<=stepDist&&enemyDist<wallDist){
      _hitPos.copy(_prev).addScaledVector(_stepDir,enemyDist);
      const travelDist=b.travel+enemyDist;
      resolvePlayerBulletHit(b,hit.en,hit.hd,_hitPos.clone(),_stepDir,travelDist,hit.zone);
      if(b.penetrationLeft>0){
        b.penetrationLeft--;b.damageScale*=w.isSniper?.72:.64;b.ignoreEnemy=hit.en;
        // Actor separation must not teleport a piercing round through the floor/cover.
        const offsetSurface=firstFirearmSurfaceHit(_hitPos,_stepDir,.14);
        const offset=offsetSurface?Math.max(0,offsetSurface.distance-.0001):.14;
        b.pos.copy(_hitPos).addScaledVector(_stepDir,offset);b.travel=travelDist+offset;
      }else{destroyPlayerBullet(i);continue;}
    }else if(wallDist<=stepDist){
      const surface=mapImpactMaterial(wallHit?.object);
      _hitPos.copy(wallHit.point);
      const n=wallHit.ground?_UP:wallHit?.face?.normal?wallHit.face.normal.clone().transformDirection(wallHit.object.matrixWorld).normalize():null;
      const pen=!wallHit.ground&&b.wallPenetrations<2?tryProjectileWallPenetration(b,w,wallHit,_stepDir,true):null;
      const impactVariant=(pen||(w.key==='shotgun'&&b.markerEligible))?'heavy':'normal';
      wallImpact(_hitPos,b.color,surface,n,impactVariant);spawnCombatImpact(_hitPos,weaponImpactType(w,false));
      if(w.key==='plasma')showGeneratedPlasmaImpactVfx(_hitPos);
      if(pen){
        playSurfaceImpactSound(surface,_hitPos,.62,false);
        wallImpact(pen.exitPoint,b.color,surface,n?n.clone().negate():null);
        showGeneratedPenetrationExitVfx(pen.exitPoint,surface);
        b.pos.copy(pen.exitPoint).addScaledVector(_stepDir,.08);
        b.vel.multiplyScalar(pen.speedRetention);b.damageScale*=pen.damageRetention;
        b.travel+=wallDist+pen.thickness+.08;b.wallPenetrations++;b.ignoreEnemy=null;
        continue;
      }
      if(wallHit.ground)playSurfaceImpactSound(surface,_hitPos,.62,false);
      if(!wallHit.ground&&w.key!=='plasma'&&n){
        const incidence=Math.abs(_stepDir.dot(n));
        const ricochet=rollProjectileRicochet(surface,incidence,b.ricochets,true);
        playSurfaceImpactSound(surface,_hitPos,Math.max(.35,1-incidence),!!ricochet);
        if(ricochet){
          const reflected=reflectProjectileDirection(_stepDir,n,_ricochetDir);
          const speed=b.vel.length()*ricochet.speedRetention;
          b.vel.copy(reflected).multiplyScalar(speed);b.pos.copy(_hitPos).addScaledVector(reflected,ricochet.offset);
          b.damageScale*=ricochet.damageRetention;b.travel+=wallDist+ricochet.offset;b.ricochets++;b.ignoreEnemy=null;
          spawnP(_hitPos,surface==='metal'?0xfff2b8:0xffd69a,.46);
          showGeneratedRicochetVfx(_hitPos,surface);
          continue;
        }
      }
      destroyPlayerBullet(i);continue;
    }else{
      b.travel+=stepDist;b.ignoreEnemy=null;
    }

    if(b.m){
      b.m.position.copy(b.pos);b.m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),_stepDir);
      const fade=Math.max(0,Math.min(1,b.life/Math.max(.001,b.maxLife)));
      if(b.m.children[0])b.m.children[0].material.opacity=Math.min(1,fade*1.35);
      if(b.m.children[1])b.m.children[1].material.opacity=Math.min(1,fade*1.25);
      if(b.m.children[2])b.m.children[2].material.opacity=Math.min(.52,fade*.52);
      if(b.m.children[3])b.m.children[3].material.opacity=Math.min(.34,fade*.34);
    }
    if(b.life<=0||b.travel>=b.range)destroyPlayerBullet(i);
  }

  // Bot firearm projectiles use the same swept-segment principle as player bullets.
  for(let i=eBullets.length-1;i>=0;i--){
    const b=eBullets[i],w=WEAPON_BY_KEY[b.wKey]||WEAPONS[0];
    b.life-=dt;_prev.copy(b.pos);
    if(b.gravity)b.vel.y-=b.gravity*dt;
    b.pos.addScaledVector(b.vel,dt);
    _stepDir.subVectors(b.pos,_prev);
    const stepDist=_stepDir.length();
    if(stepDist<=1e-5){if(b.life<=0)destroyEnemyBullet(i);continue;}
    _stepDir.multiplyScalar(1/stepDist);

    const wallHit=firstFirearmSurfaceHit(_prev,_stepDir,stepDist);
    const wallDist=wallHit?wallHit.distance:Infinity;
    const botHit=hitEnemy(_prev,_stepDir,b.team,b.src,stepDist+.8);
    const botDist=botHit.en?botHit.dist:Infinity;
    const playerDist=b.team==='enemy'?hitPlayerByEnemyBullet(_prev,_stepDir,stepDist):Infinity;
    const visibleStep=Math.min(stepDist,wallDist);

    if(b.team==='enemy'&&!b.suppressedPlayer&&playerDist===Infinity&&!dying){
      _enemyBulletPlayerCenter.set(camera.position.x,camera.position.y-.34,camera.position.z);
      const near=closestPointOnBulletSegment(_prev,_prev.clone().addScaledVector(_stepDir,visibleStep),_enemyBulletPlayerCenter);
      const threshold=w.isSniper?1.78:w.key==='shotgun'?1.92:w.key==='plasma'?1.36:1.55;
      if(near.distance<=threshold){
        registerPlayerSuppression(b.src,w,_enemyBulletClosest.clone(),near.distance,threshold);
        b.suppressedPlayer=true;
      }
    }
    if(!b.suppressedBot){
      let nearest=null,nearestD=Infinity;
      const segEnd=_prev.clone().addScaledVector(_stepDir,visibleStep);
      for(const candidate of enemies){
        if(!candidate.alive||candidate===b.src||candidate.team===b.team)continue;
        const center=candidate.group.position.clone();center.y+=1.15;
        const near=closestPointOnBulletSegment(_prev,segEnd,center);
        if(near.distance<1.32&&near.distance<nearestD){nearest=candidate;nearestD=near.distance;}
      }
      if(nearest&&(!botHit.en||nearest!==botHit.en)){
        nearest.registerSuppression(b.src,b.suppressing?1.10:Math.max(.38,1-nearestD/1.45));
        b.suppressedBot=nearest;
      }
    }

    if(playerDist<wallDist&&playerDist<=stepDist&&playerDist<=botDist){
      _hitPos.copy(_prev).addScaledVector(_stepDir,playerDist);
      const travel=b.travel+playerDist,falloff=weaponDamageScaleAtDistance(w,travel);
      applyDamageToPlayer(b.playerDamage*falloff,'bullet',b.src);
      destroyEnemyBullet(i);continue;
    }
    if(botHit.en&&botDist<=stepDist&&botDist<wallDist){
      _hitPos.copy(_prev).addScaledVector(_stepDir,botDist);
      const travel=b.travel+botDist,falloff=weaponDamageScaleAtDistance(w,travel);
      applyEnemyBulletToBot(b,botHit.en,b.damage*falloff,_stepDir.clone());
      playHitImpactSound(botHit.hd?'head':botHit.zone,_hitPos,.46);
      destroyEnemyBullet(i);continue;
    }
    if(wallDist<=stepDist){
      const surface=mapImpactMaterial(wallHit?.object);
      _hitPos.copy(wallHit.point);
      const n=wallHit.ground?_UP:wallHit?.face?.normal?wallHit.face.normal.clone().transformDirection(wallHit.object.matrixWorld).normalize():null;
      const pen=!wallHit.ground&&b.wallPenetrations<2?tryProjectileWallPenetration(b,w,wallHit,_stepDir,false):null;
      wallImpact(_hitPos,b.color,surface,n,pen?'heavy':'normal');spawnCombatImpact(_hitPos,w.key==='plasma'?'plasma':'wall');
      if(w.key==='plasma')showGeneratedPlasmaImpactVfx(_hitPos);
      if(pen){
        playSurfaceImpactSound(surface,_hitPos,.54,false);
        wallImpact(pen.exitPoint,b.color,surface,n?n.clone().negate():null);
        showGeneratedPenetrationExitVfx(pen.exitPoint,surface);
        b.pos.copy(pen.exitPoint).addScaledVector(_stepDir,.08);
        b.vel.multiplyScalar(pen.speedRetention);
        b.damage*=pen.damageRetention;b.playerDamage*=pen.damageRetention;
        b.travel+=wallDist+pen.thickness+.08;b.wallPenetrations++;
        continue;
      }
      if(wallHit.ground)playSurfaceImpactSound(surface,_hitPos,.54,false);
      if(!wallHit.ground&&w.key!=='plasma'&&n){
        const incidence=Math.abs(_stepDir.dot(n));
        const ricochet=rollProjectileRicochet(surface,incidence,b.ricochets,false);
        playSurfaceImpactSound(surface,_hitPos,Math.max(.30,1-incidence),!!ricochet);
        if(ricochet){
          const reflected=reflectProjectileDirection(_stepDir,n,_ricochetDir);
          const speed=b.vel.length()*ricochet.speedRetention;
          b.vel.copy(reflected).multiplyScalar(speed);b.pos.copy(_hitPos).addScaledVector(reflected,ricochet.offset);
          b.damage*=ricochet.damageRetention;b.playerDamage*=ricochet.damageRetention;b.travel+=wallDist+ricochet.offset;b.ricochets++;
          spawnP(_hitPos,surface==='metal'?0xfff1b8:0xffd69a,.52);
          showGeneratedRicochetVfx(_hitPos,surface);
          continue;
        }
      }
      destroyEnemyBullet(i);continue;
    }
    b.travel+=stepDist;
    if(b.m){
      b.m.position.copy(b.pos);b.m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),_stepDir);
      const fade=Math.max(0,Math.min(1,b.life/Math.max(.001,b.maxLife)));
      for(let c=0;c<b.m.children.length;c++)if(b.m.children[c]?.material?.opacity!==undefined)b.m.children[c].material.opacity*=Math.max(.35,fade);
    }
    if(b.life<=0||b.travel>=b.range)destroyEnemyBullet(i);
  }

  syncPlasmaFlightArt();syncRifleFlightArt36();

  for(let i=pTrs.length-1;i>=0;i--){
    const tr=pTrs[i];tr.life-=dt;
    tr.m.position.x+=tr.vx*dt;tr.m.position.y+=tr.vy*dt;tr.m.position.z+=tr.vz*dt;
    const f=tr.life/tr.maxLife;
    const age=tr.maxLife-tr.life;
    const pulse=.90+Math.sin(age*42+(tr.m.userData.phase||0))*.10;
    tr.m.children[0].material.opacity=Math.max(0,Math.min(1,f*1.20));
    tr.m.children[1].material.opacity=Math.max(0,f*.98);
    if(tr.m.children[2]){tr.m.children[2].material.opacity=Math.max(0,f*.46);tr.m.children[2].scale.set(pulse,pulse,1);}
    if(tr.m.children[3]){tr.m.children[3].material.opacity=Math.max(0,f*.27);tr.m.children[3].scale.set(.95+pulse*.10,.95+pulse*.10,1);}
    if(tr.life<=0){destroySceneObject(tr.m);pTrs.splice(i,1);}
  }
  G('rwarn').style.opacity=warn?'1':'0';
}

function spawnERkt(from,dir,dmg,team,src){
  const color=team==='ally'?0x35bfff:0xff2200;
  const m=mkRkt(color);m.position.copy(guardRocketLaunch(from,from.clone().addScaledVector(dir,.42)));m.quaternion.setFromUnitVectors(_UP,dir);scene.add(m);
  eRkts.push({m,vx:dir.x*BOT_ROCKET_SPEED*.82,vy:dir.y*BOT_ROCKET_SPEED*.82,vz:dir.z*BOT_ROCKET_SPEED*.82,life:12,maxSpeed:BOT_ROCKET_SPEED,dmg,sT:0,fT:0,team,ownerType:'bot',_src:src,blastRadius:ROCKET_BLAST_RADIUS});
}

// Real bomb owns this optional skin; the 3D body remains on decode failure.
const bombWorldArtNodes41=new Set();
function clearBombWorldArt41(){for(const el of bombWorldArtNodes41)el.remove();bombWorldArtNodes41.clear();}
function syncBombWorldArt41(){
  const live=mines.filter(m=>m.kind==='bomb'&&!m.removed&&m.m?.parent);
  for(const el of [...bombWorldArtNodes41])if(!live.includes(el._bombRef)){el.remove();bombWorldArtNodes41.delete(el);}
  if(!live.length||!bombPresentationAssetReady41('pack41BombWorldTop'))return;
  const asset=GAME_ASSETS.presentationVfx.pack41BombWorldTop;
  for(const mn of live){
    if(!GAME_LOCAL_FILE_MODE){
      if(!mn.m.userData.topSkin41){
        const texture=new THREE.Texture(bombPresentationProbes41.get(asset));
        texture.encoding=THREE.sRGBEncoding;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
        const top=new THREE.Mesh(new THREE.PlaneGeometry(.60,.80),new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.025,depthTest:true,depthWrite:true}));
        top.rotation.x=-Math.PI/2;top.position.y=-.217;mn.m.add(top);mn.m.userData.topSkin41=top;
      }
      if(mn.m.userData.nativeDetails41)mn.m.userData.nativeDetails41.visible=false;
      continue;
    }
    let el=mn._bombTop41;
    if(!el?.isConnected){
      const layer=G('projectile-trail-layer');if(!layer)continue;
      el=document.createElement('span');el.className='bomb-world-top-art';el._bombRef=mn;el.setAttribute('aria-hidden','true');
      el.style.backgroundImage='url("'+gameAssetUrl(asset)+'")';layer.appendChild(el);bombWorldArtNodes41.add(el);mn._bombTop41=el;
    }
    if(mn.m.userData.nativeDetails41)mn.m.userData.nativeDetails41.visible=false;
    mn.m.updateMatrixWorld(true);
    const corners=[[-.30,-.40],[.30,-.40],[.30,.40],[-.30,.40]].map(([x,z])=>mn.m.localToWorld(new THREE.Vector3(x,-.217,z)));
    positionGroundGrenadeDecal({el,worldPos:mn.m.position.clone().add(new THREE.Vector3(0,-.217,0)),surfaceCorners:corners,spec:{surfacePlane:true,size:512,worldSizeM:.8},scale:1,rotation:0});
  }
}

// ─── MINES ──────────────────────────────
// Pack39 mine body: the real mines collection owns position/state/lifetime.
const mineWorldArtNodes39=new Set();
const mineWorldScreen39=new THREE.Vector3();
let mineWorldTexture39=null,mineWorldTextureUsers39=0;
function acquireMineWorldTexture39(){
  if(!mineWorldTexture39){
    const image=minePresentationProbes39.get(GAME_ASSETS.presentationVfx.pack39MineWorld);
    const texture=new THREE.Texture(image);
    texture.repeat.set(.25,.25);texture.offset.set(1088/1536,64/1536); // cell8 crop64..448 removes transparent padding
    texture.encoding=THREE.sRGBEncoding;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
    texture.generateMipmaps=false;texture.needsUpdate=true;mineWorldTexture39=texture;
  }
  mineWorldTextureUsers39++;return mineWorldTexture39;
}
function releaseMineWorldTexture39(){
  if(mineWorldTextureUsers39<=0)return;
  if(--mineWorldTextureUsers39===0){mineWorldTexture39.dispose();mineWorldTexture39=null;}
}
function makeMineBody39(){
  // HTTP shares one GPU atlas. file:// uses a horizontal DOM top above native sides.
  const texture=GAME_LOCAL_FILE_MODE?null:acquireMineWorldTexture39();
  const body=new THREE.Group();body.userData.minePack39=true;body.userData.texture39=texture;
  const add=(geometry,material,y)=>{
    const mesh=new THREE.Mesh(geometry,material);mesh.position.y=y;body.add(mesh);return mesh;
  };
  // Physics center stays .08. All visible parts rest directly on surface y=center-.08.
  add(new THREE.CylinderGeometry(.305,.305,.052,48),new THREE.MeshLambertMaterial({color:0x53636e}),-.054);
  add(new THREE.CylinderGeometry(.31,.31,.006,48),new THREE.MeshLambertMaterial({color:0x6a7d89}),-.025);
  add(new THREE.CylinderGeometry(.306,.306,.009,48,1,true),new THREE.MeshBasicMaterial({color:0x32bfe0}),-.060);
  const lugs=new THREE.InstancedMesh(new THREE.BoxGeometry(.09,.058,.045),new THREE.MeshLambertMaterial({color:0x718694}),6);
  const vents=new THREE.InstancedMesh(new THREE.BoxGeometry(.066,.013,.004),new THREE.MeshLambertMaterial({color:0x15242d}),6);
  const matrix=new THREE.Matrix4();
  for(let i=0;i<6;i++){
    const angle=i*Math.PI/3;
    matrix.makeRotationY(angle);matrix.setPosition(Math.sin(angle)*.293,-.051,Math.cos(angle)*.293);lugs.setMatrixAt(i,matrix);
    matrix.makeRotationY(angle);matrix.setPosition(Math.sin(angle)*.318,-.049,Math.cos(angle)*.318);vents.setMatrixAt(i,matrix);
  }
  lugs.instanceMatrix.needsUpdate=true;vents.instanceMatrix.needsUpdate=true;body.add(lugs);body.add(vents);
  body.userData.lugs=lugs;body.userData.vents=vents;
  let top;
  if(texture){
    top=add(new THREE.PlaneGeometry(.64,.64),new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.025,depthTest:true,depthWrite:true}),-.021);
    top.rotation.x=-Math.PI/2;
  }else{
    // Keep a filled metal backing flush with the sides below the approved DOM top.
    top=add(new THREE.CylinderGeometry(.30,.30,.002,48),new THREE.MeshLambertMaterial({color:0x365462}),-.023);
  }
  body.userData.top=top;
  const indicator=add(new THREE.CylinderGeometry(.012,.012,.004,12),new THREE.MeshBasicMaterial({color:0xffa32e}),-.019);
  indicator.position.x=.17;body.userData.indicator=indicator;
  return body;
}
function removeMineWorldArt39(el){
  const mn=el._mineRef;
  if(mn){
    if(mn._mineBody39){
      // Generic material disposal owns its maps; detach the shared map before it runs.
      mn._mineBody39.userData.top.material.map=null;
      mn._mineBody39.userData.lugs.dispose();mn._mineBody39.userData.vents.dispose();
      const ownsTexture=!!mn._mineBody39.userData.texture39;
      mn.m.remove(mn._mineBody39);destroySceneObject(mn._mineBody39);mn._mineBody39=null;
      if(ownsTexture)releaseMineWorldTexture39();
    }
    if(mn.m)mn.m.visible=mn._mineMeshVisible39??true;
    for(const [mesh,visible] of mn._mineChildVisibility39||[])mesh.visible=visible;
    mn._mineArt39=null;mn._mineMeshVisible39=null;mn._mineChildVisibility39=null;
  }
  el.remove();mineWorldArtNodes39.delete(el);
}
function clearMineWorldArt39(){for(const el of [...mineWorldArtNodes39])removeMineWorldArt39(el);}
function mineWorldFrame39(mn){return 5+Math.floor((mn.ph||0)*4)%3;}
function syncMineWorldArt39(){
  const live=new Set(mines.filter(mn=>mn.kind!=='bomb'&&!mn.removed&&mn.m?.parent));
  const ready=live.size&&minePresentationAssetReady39('pack39MineWorld');
  for(const el of [...mineWorldArtNodes39])if(!ready||!live.has(el._mineRef))removeMineWorldArt39(el);
  const layer=G('projectile-trail-layer');if(!ready||!layer)return;
  for(const mn of live){
    let el=mn._mineArt39;
    if(!el?.isConnected){
      if(mineWorldArtNodes39.size>=MAX_MINES)continue;
      el=document.createElement('span');el.className='mine-world-art';el._mineRef=mn;el.setAttribute('aria-hidden','true');
      layer.appendChild(el);mineWorldArtNodes39.add(el);mn._mineArt39=el;
      mn._mineMeshVisible39=mn.m.visible;
      mn._mineChildVisibility39=(mn.m.children||[]).map(mesh=>[mesh,mesh.visible]);
    }
    if(!mn.fall){
      if(!mn._mineBody39){mn._mineBody39=makeMineBody39();mn.m.add(mn._mineBody39);}
      mn.m.visible=mn._mineMeshVisible39??true;
      for(const [mesh] of mn._mineChildVisibility39)mesh.visible=false;
      mn._mineBody39.visible=true;
      mn._mineBody39.userData.indicator.material.color.setHex(mn.armed?(Math.sin((mn.ph||0)*8)>0?0xff7626:0x8f441c):0xffa32e);
      // Actual horizontal mesh: WebGL camera projection, depth-test and wall occlusion.
      el.style.visibility='hidden';el.dataset.state=mn.armed?'armed':'arming';el.dataset.plane='mesh';
      if(GAME_LOCAL_FILE_MODE){
        applyPresentationAtlasFrame(el,presentationAtlasFrame(gameAssetUrl(GAME_ASSETS.presentationVfx.pack39MineWorld),2,2,3,3));
        // cell8 crop64..448: 384px of1536, a .64m surface at actual top y=.059.
        el.style.backgroundSize='400% 400%';el.style.backgroundPosition='94.444444% 94.444444%';
        el.style.width='512px';el.style.height='512px';el.style.opacity='1';el.dataset.plane='ground';
        positionGroundGrenadeDecal({el,worldPos:mn.m.position,groundY:mn.m.position.y-.021-.015,
          spec:{size:512,worldSizeM:.64},scale:1,rotation:(mn.m.rotation?.y||0)*180/Math.PI});
      }
      continue;
    }
    mn.m.visible=false;if(mn._mineBody39)mn._mineBody39.visible=false;
    const pos=mn.m.position,dist=camera.position.distanceTo(pos);
    mineWorldScreen39.copy(pos).project(camera);
    if(dist<.15||dist>60||mineWorldScreen39.z<=-1||mineWorldScreen39.z>=1||Math.abs(mineWorldScreen39.x)>1.08||Math.abs(mineWorldScreen39.y)>1.08||(wallBetween(camera.position,pos,wallMeshes)||(typeof smokeVisibilityBetween42==='function'&&smokeVisibilityBetween42(camera.position,pos)<.015))){
      el.style.visibility='hidden';continue;
    }
    const frame=mineWorldFrame39(mn);
    applyPresentationAtlasFrame(el,presentationAtlasFrame(GAME_ASSETS.presentationVfx.pack39MineWorld,frame%3,Math.floor(frame/3),3,3));
    el.dataset.state='flight';el.dataset.plane='flight';el.style.opacity='1';el.style.transformOrigin='50% 50%';
    el.style.transform='translate(-50%,-50%)';
    const focal=innerHeight/(2*Math.tan(camera.fov*Math.PI/360));
    const size=Math.max(6,Math.min(180,.85*focal/Math.max(.6,dist)));
    el.style.left=((mineWorldScreen39.x*.5+.5)*innerWidth).toFixed(1)+'px';
    el.style.top=((-mineWorldScreen39.y*.5+.5)*innerHeight).toFixed(1)+'px';
    el.style.width=size.toFixed(1)+'px';el.style.height=size.toFixed(1)+'px';el.style.visibility='visible';
  }
}
// End Pack39 mine body.
const explosiveFuseArtNodes=new Set();
const explosiveFuseScreenPos=new THREE.Vector3();
function explosiveFusePresentationState(mn){
  if(mn.fall)return 'safe';
  if(mn.kind==='bomb'){
    if(!Number.isFinite(mn._presentationInitialFuse))mn._presentationInitialFuse=mn.fuseT;
    if(mn.fuseT<=8)return 'danger';
    if(mn._presentationInitialFuse-mn.fuseT<1.5)return 'arming';
    return 'armed';
  }
  return mn.armed?'armed':'arming';
}
function ensureExplosiveFuseArt(mn){
  if(mn.kind==='bomb')return null; // Pack41 uses the device and compact timer only.
  const layer=G('explosive-fuse-layer');if(!layer)return null;
  if(mn._fuseArt?.isConnected)return mn._fuseArt;
  const el=document.createElement('span');
  el.className='explosive-fuse-art';el._mineRef=mn;
  layer.appendChild(el);explosiveFuseArtNodes.add(el);mn._fuseArt=el;
  return el;
}
function syncExplosiveFuseArt(){
  const live=new Set(mines);
  for(const el of [...explosiveFuseArtNodes]){
    if(!live.has(el._mineRef)||el._mineRef.kind==='bomb'){
      el.remove();explosiveFuseArtNodes.delete(el);
      if(el._mineRef._fuseArt===el)el._mineRef._fuseArt=null;
    }
  }
  for(const mn of mines){
    if(mn.kind==='bomb')continue;
    if(mn.kind!=='bomb'&&mn._mineArt39){if(mn._fuseArt)mn._fuseArt.style.visibility='hidden';continue;}
    const el=ensureExplosiveFuseArt(mn);if(!el||!mn.m)continue;
    explosiveFuseScreenPos.copy(mn.m.position);explosiveFuseScreenPos.y+=.72;
    const dist=camera.position.distanceTo(explosiveFuseScreenPos);
    if(dist>.8&&dist<30&&!wallBetween(camera.position,explosiveFuseScreenPos,wallMeshes)){
      explosiveFuseScreenPos.project(camera);
      if(explosiveFuseScreenPos.z>-1&&explosiveFuseScreenPos.z<1&&Math.abs(explosiveFuseScreenPos.x)<1.04&&Math.abs(explosiveFuseScreenPos.y)<1.04){
        const state=explosiveFusePresentationState(mn);
        if(el.dataset.state!==state){
          applyPresentationAtlasFrame(el,explosiveFusePresentationFrame(state));
          el.dataset.state=state;
        }
        el.style.left=((explosiveFuseScreenPos.x*.5+.5)*W).toFixed(1)+'px';
        el.style.top=((-explosiveFuseScreenPos.y*.5+.5)*H).toFixed(1)+'px';
        el.style.setProperty('--fuse-scale',Math.max(.62,Math.min(1.05,14/Math.max(8,dist))).toFixed(3));
        el.style.visibility='visible';continue;
      }
    }
    el.style.visibility='hidden';
  }
}
// Contact mines use their real .32m footprint plus the canonical actor collider.
function mineContactActors(mn){
  if(mn.kind==='bomb'||mn.fall||!mn.armed||mn.removed)return [];
  const mp=mn.m.position,surfaceY=mp.y-.08,contacts=[];
  const touching=(pos,radius)=>{
    const dx=pos.x-mp.x,dz=pos.z-mp.z;
    return dx*dx+dz*dz<=(.32+radius)**2&&Math.abs(pos.y-surfaceY)<=.10&&
      !wallBetween(new THREE.Vector3(pos.x,surfaceY+.14,pos.z),mp,wallMeshes);
  };
  for(const en of enemies)if(en.alive&&!en.jV&&touching(en.group.position,BOT_R))contacts.push(en);
  if(!dying&&onGnd&&touching(new THREE.Vector3(camera.position.x,camera.position.y-1.75,camera.position.z),PLR_R))contacts.push('player');
  return contacts;
}
function applyMineContactKills(contacts,pos,ownerType,ownerBot,ownerTeam){
  for(const target of contacts){
    if(target==='player'){
      if(!dying)applyDamageToPlayer(Math.max(1,hp),'mine',ownerBot,false,true);
      continue;
    }
    if(!target.alive)continue;
    const dir=new THREE.Vector3(target.group.position.x-pos.x,.2,target.group.position.z-pos.z).normalize();
    target.hurt(Math.max(1,target.hp),dir,ownerTeam||'world',ownerType==='player'?'player':ownerBot);
    if(!target.alive&&ownerTeam&&target.team!==ownerTeam&&target!==ownerBot)awardExplosionKill(target,ownerType,ownerBot,'mine',ownerTeam);
  }
}
function tickMines(dt){
  for(let i=mines.length-1;i>=0;i--){
    const mn=mines[i];
    mn.ph=(mn.ph||0)+dt*3;
    if(mn.fall){
      mn.vy-=20*dt;
      mn.m.position.x+=mn.vx*dt;mn.m.position.y+=mn.vy*dt;mn.m.position.z+=mn.vz*dt;
      if(mn.m.position.y<=.08){
        mn.m.position.y=.08;mn.fall=false;mn.vx=mn.vy=mn.vz=0;
        mn.checkT=.04+Math.random()*.08;
        if(mn.kind!=='bomb'){playMineSound39('Land',mn.m.position);showGeneratedMineEvent39('mineLand39',mn.m.position);}
      }
      continue;
    }

    if(mn.kind==='bomb'){
      mn.fuseT-=dt;
      updateBombFuseVisual(mn,dt);
      if(mn.fuseT>0)continue;
      const pos=mn.m.position.clone();pos.y=Math.max(.12,pos.y);
      const ownerType=mn.owner==='player'?'player':'bot';
      const radius=mn.radius||BOMB_BLAST_RADIUS;
      playExplosionSound(pos,1.08);
      const bombProximity=Math.max(0,1-camera.position.distanceTo(pos)/90);if(bombProximity>0)triggerScreenShake(bombProximity*.78,.22);
      explode(pos,ownerType==='player'?0xffb000:0xff3b18,18,false,false);
      showGeneratedBombDetonationVfx(pos);
      spawnBombBlastWave(pos,radius,ownerType,false);
      applyBlastDamage(pos,radius,mn.dmg||BOMB_BASE_DAMAGE,ownerType,mn.src||null,'bomb',.18,mn.owner==='player'?'ally':(mn.src?.team||mn.team||null));
      mn.removed=true;destroySceneObject(mn.m);mines.splice(i,1);updateMineHUD();
      continue;
    }

    mn.aT-=dt;
    if(!mn.armed&&mn.aT<=0){mn.armed=true;playMineSound39('Arm',mn.m.position);showGeneratedMineEvent39('mineActivation39',mn.m.position);}
    mn.checkT=(mn.checkT||0)-dt;
    if(mn.checkT<=0){
      mn.checkT=.12+Math.random()*.10;
      const lens=mn.m.children[2];
      if(lens&&lens.material)lens.material.color.setHex(mn.armed?(Math.sin(mn.ph*8)>0?0xff0000:0x880000):0xff8800);
    }
    if(!mn.armed)continue;
    // Contact detection runs every physics frame, independently of the cosmetic lens poll.
    const contacts=mineContactActors(mn);if(!contacts.length)continue;
    const ownerType=mn.owner==='player'?'player':'bot';
    const ownerBot=mn.src||null,ownerTeam=mn.owner==='player'?'ally':(ownerBot?.team||mn.team||null);
    const radius=mn.radius||9;
    const pos=mn.m.position.clone();
    playMineSound39('Trigger',pos);playMineSound39('Detonate',pos);
    const mineProximity=Math.max(0,1-camera.position.distanceTo(pos)/55);if(mineProximity>0)triggerScreenShake(mineProximity*.52,.14);
    const generated=mineDetonationPresentationReady39();
    explode(pos,0xff4400,6,false,false);
    if(generated&&minePresentationAssetReady39('pack39MineWorld'))playGeneratedCombatVfx('mineTriggered39',{worldPos:pos});
    showGeneratedMineDetonationVfx(pos,!mn.fall&&pos.y<=.1?-.04:null);
    applyMineContactKills(contacts,pos,ownerType,ownerBot,ownerTeam);
    applyBlastDamage(pos,radius,mn.dmg||WEAPONS[5].dmg,ownerType,ownerBot,'mine',.25,ownerTeam);
    if(mn._mineArt39)removeMineWorldArt39(mn._mineArt39);
    mn.removed=true;destroySceneObject(mn.m);mines.splice(i,1);updateMineHUD();
  }
  syncMineWorldArt39();syncBombWorldArt41();
}

// ═══════════════════════════════════════════

const TEAM_INTEL={
  ally:{pos:new THREE.Vector3(),time:-999,target:null},
  enemy:{pos:new THREE.Vector3(),time:-999,target:null}
};
function angleDelta(a,b){return Math.atan2(Math.sin(b-a),Math.cos(b-a));}
function lerpAngle(a,b,t){return a+angleDelta(a,b)*Math.max(0,Math.min(1,t));}
function countTargeters(target,team){
  let n=0;
  for(const b of enemies)if(b.alive&&b.team===team&&b.targetEn===target)n++;
  return n;
}
function countPlayerTargeters(team,exclude=null){
  let n=0;
  for(const b of enemies){
    if(b===exclude||!b.alive||b.team!==team)continue;
    if(b.targetIsPlayer)n++;
  }
  return n;
}
let playerPressureCacheT=-999;
const playerPressureSet=new Set();
function canPressurePlayer(bot){
  if(bot.team!=='enemy')return false;
  const now=performance.now();
  if(now-playerPressureCacheT>120){
    playerPressureCacheT=now;
    playerPressureSet.clear();
    const maxPressure=level<4?2:level<10?3:level<18?4:5;
    const candidates=enemies
      .filter(b=>b.alive&&b.team==='enemy'&&b.targetIsPlayer&&b.canSeeTarget)
      .sort((a,b)=>{
        const tacticalBias=bot=>bot.tacticalMode==='suppress'?-26:(bot.role==='flankL'||bot.role==='flankR'?8:0);
        return tacticalBias(a)-tacticalBias(b)+
          (a.group.position.distanceToSquared(camera.position)-b.group.position.distanceToSquared(camera.position));
      });
    for(let j=0;j<Math.min(maxPressure,candidates.length);j++)playerPressureSet.add(candidates[j]);
  }
  return playerPressureSet.has(bot);
}
function friendlyInLine(from,dir,team,maxDist){
  const r2=.72*.72;
  for(const mate of enemies){
    if(!mate.alive||mate.team!==team)continue;
    const px=mate.group.position.x-from.x,py=mate.group.position.y+1.05-from.y,pz=mate.group.position.z-from.z;
    const t=px*dir.x+py*dir.y+pz*dir.z;
    if(t<=.15||t>=maxDist)continue;
    const cx=px-dir.x*t,cy=py-dir.y*t,cz=pz-dir.z*t;
    if(cx*cx+cy*cy+cz*cz<r2)return true;
  }
  if(team==='ally'&&!dying){
    const px=camera.position.x-from.x,py=camera.position.y-from.y,pz=camera.position.z-from.z;
    const t=px*dir.x+py*dir.y+pz*dir.z;
    if(t>.15&&t<maxDist){
      const cx=px-dir.x*t,cy=py-dir.y*t,cz=pz-dir.z*t;
      if(cx*cx+cy*cy+cz*cz<.55)return true;
    }
  }
  return false;
}
function friendlyNearPoint(pos,team,radius){
  const r2=radius*radius;
  for(const mate of enemies){
    if(!mate.alive||mate.team!==team)continue;
    if(mate.group.position.distanceToSquared(pos)<r2)return true;
  }
  return team==='ally'&&!dying&&camera.position.distanceToSquared(pos)<r2;
}
function nearestVisiblePickup(type,pos,maxDist=28){
  let best=null,bestD=maxDist;
  for(const pk of pickups){
    if(pk.type!==type||!pk.m.visible)continue;
    const d=pk.m.position.distanceTo(pos);
    if(d<bestD){best=pk;bestD=d;}
  }
  return best;
}
function claimHealthPickup(bot,pk){
  if(!pk||!pk.m.visible)return false;
  bot.hp=Math.min(bot.maxHp,bot.hp+Math.max(35,bot.maxHp*.46));
  pk.m.visible=false;pk.respawn=14;pk.cd=.8;
  bot.pickupTarget=null;
  return true;
}
