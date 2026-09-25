'use strict';

// ─── XP / LEVEL-UP ────
function addXP(amt){
  xp+=amt;
  while(level<30&&xp>=xpFor(level+1)){
    level++;
    if(!lvlAnnOpen&&!perkPickOpen)openLvlAnn(level);
    else pendingLevels++;
  }
  xpHUD();
  saveTick=Math.min(saveTick,1.5);
}
function openLvlAnn(lvl){
  zooming=false;
  G('sniper-scope')?.classList.remove('on','kick');
  lvlAnnOpen=true;refreshMobileHUD();playSfx('level');
  G('lvl-ann-num').textContent=lvl;
  G('lvl-ann-bar').style.width='100%';
  G('lvl-ann').classList.add('on');
  lvlAnnT=lvlAnnMax;
}
function tickLvlAnn(dt){
  lvlAnnT-=dt;
  G('lvl-ann-bar').style.width=Math.max(0,lvlAnnT/lvlAnnMax*100).toFixed(1)+'%';
  if(lvlAnnT<=0){
    G('lvl-ann').classList.remove('on');
    lvlAnnOpen=false;
    openPerkPick(level);
  }
}

function renderPerkChoices(lvl){
  const cards=G('perk-cards');cards.innerHTML='';
  currentPerkChoices.forEach((p,index)=>{
    const taken=perkTimesTaken(p.id);
    const nextRank=taken+1;
    const rarity=PERK_RARITIES[p.rarity]||PERK_RARITIES.common;
    const d=document.createElement('div');
    d.className='pcard rarity-'+p.rarity;
    d.innerHTML=`<img class="pcard-ic" src="${perkAsset(p.id,p.path)}" alt=""><div class="pcard-rarity">${rarity.name}</div><div class="pcard-nm"><span class="perk-emoji">${p.ic}</span> ${p.nm}</div><div class="pcard-ds">${p.ds}</div><div class="pcard-meta"><span class="pcard-path">${PATH_NAMES[p.path]}</span> · <span class="pcard-rank">ранг ${nextRank}/${p.maxRank||1}</span> · клавиша ${index+1}</div>`;
    d.addEventListener('click',()=>pickPerk(p));
    cards.appendChild(d);
  });
  G('perk-build').textContent=currentBuildText();
  const reroll=G('perk-reroll');
  reroll.textContent='🎲 ОБНОВИТЬ ВЫБОР · '+perkRerollsLeft;
  reroll.disabled=perkRerollsLeft<=0;
}
function rerollPerks(){
  if(!perkPickOpen||perkRerollsLeft<=0)return;
  perkRerollsLeft--;
  currentPerkChoices=rollPerkChoices(5);
  renderPerkChoices(level);
}
function openPerkPick(lvl){
  perkPickOpen=true;refreshMobileHUD();
  setGameCursorHidden(false);
  if(document.pointerLockElement===canvas)document.exitPointerLock();
  G('perk-sub').innerHTML='Уровень <span id="perk-lvl-num">'+lvl+'</span> · выбери 1 из 5 улучшений';
  perkRerollsLeft=1;
  currentPerkChoices=rollPerkChoices(5);
  renderPerkChoices(lvl);
  G('perk-menu').classList.add('on');
}
function pickPerk(p){
  if(!canTakePerk(p)){showMsg('Это улучшение уже достигло максимального ранга');return;}
  syncCurrentAmmo();
  p.fn();
  perksGot.push({...p});
  applyPathMilestones();
  for(let i=0;i<WEAPONS.length;i++)weaponAmmo[i]=Math.min(weaponAmmo[i],WEAPONS[i].clip);
  ammo=Math.min(ammo,getW().clip);syncCurrentAmmo();
  updatePerkPanel();updateStats();markHUD();flushHUD();xpHUD();wHUD();
  G('perk-menu').classList.remove('on');
  setDamageOverlay(.24,'gold');setTimeout(()=>setDamageOverlay(0),350);
  perkPickOpen=false;saveProgress(true);
  if(pendingLevels>0){pendingLevels--;openLvlAnn(level);}
  else if(IS_TOUCH){paused=false;running=true;}
  else{paused=true;running=false;setGameCursorHidden(true);requestGamePointerLock();}
  refreshMobileHUD();
}
function updatePerkPanel(){
  const p=G('perk-panel');p.innerHTML='';
  const counts=new Map();
  for(const perk of perksGot){counts.set(perk.id,(counts.get(perk.id)||0)+1);}
  const shown=[];
  for(let i=perksGot.length-1;i>=0;i--){
    const perk=perksGot[i];
    if(shown.includes(perk.id))continue;
    shown.push(perk.id);
    const d=document.createElement('div');d.className='ptag';
    const cnt=counts.get(perk.id)||1;
    d.innerHTML='<img class="ptag-ic" src="'+perkAsset(perk.id,perk.path)+'" alt=""><span>'+perk.ic+' '+perk.nm+' '+cnt+'/'+(perk.maxRank||1)+'</span>';
    p.appendChild(d);
    if(shown.length>=8)break;
  }
}
function updateStats(){
  G('st-hp').textContent=plr.maxHp;
  G('st-dmg').textContent='x'+playerDamageMultiplier().toFixed(2);
  G('st-spd').textContent='x'+plr.spdM.toFixed(2);
  G('st-arm').textContent=Math.round(armor)+'/'+plr.maxArmor;
  G('st-reg').textContent=(plr.regen>0?'+':'')+plr.regen.toFixed(1)+'/с';
  const s=[];
  if(plr.extraShotChance>0)s.push('✌️ Доп. выстрел '+Math.round(plr.extraShotChance*100)+'%');
  if(plr.explode)s.push('💥 Разрывные пули');
  if(plr.secondWind)s.push('💓 Второе дыхание '+(plr.secondWindReady?'готово':'использовано'));
  if(plr.lowHpDamage>0)s.push('🔥 Последний рубеж');
  if(plr.critChance>0)s.push('🎲 Крит '+Math.round(plr.critChance*100)+'% · x'+plr.critMult.toFixed(2));
  if(plr.lifeSteal>0)s.push('💚 Поглощение '+Math.round(plr.lifeSteal*100)+'%');
  if(plr.blastResist>0)s.push('🧱 Взрывозащита '+Math.round(plr.blastResist*100)+'%');
  if(plr.piercing)s.push('🔱 Пробивание');
  if(plr.ammoSaveChance>0)s.push('♻️ Экономия патронов '+Math.round(plr.ammoSaveChance*100)+'%');
  if(plr.closeDamage>0)s.push('🥊 Ближний урон +'+Math.round(plr.closeDamage*100)+'%');
  if(plr.longRangeDamage>0)s.push('🔭 Дальний урон +'+Math.round(plr.longRangeDamage*100)+'%');
  if(plr.dodgeChance>0)s.push('🫥 Уклонение '+Math.round(plr.dodgeChance*100)+'%');
  if(plr.smokeRadiusM>1||plr.smokeDurationM>1||plr.smokeCooldownM<1)s.push('🌫️ Дым: '+Math.round(SMOKE_RADIUS*plr.smokeRadiusM)+'м · '+Math.round(SMOKE_DURATION_SECONDS*plr.smokeDurationM)+'с');
  G('st-perks').innerHTML=s.join('<br>');
  updateStatusIcons();
}

// ─── PLAYER DAMAGE / SHIELD ─────────────
function damageLabel(kind){
  return kind==='rocket'?'ракета':kind==='mine'?'мина':kind==='bomb'?'бомба':kind==='melee'?'контактный удар':'попадание';
}
function applyDamageToPlayer(amount,kind='bullet',attacker=null){
  if(dying||amount<=0)return 0;
  if(respawnShieldT>0)return 0;
  if(kind==='bullet'&&plr.dodgeChance>0&&Math.random()<plr.dodgeChance){showMsg('🫥 Уклонение от пули!');return 0;}
  let dmg=amount;
  if(kind==='bullet'&&plr.smokeResist>0&&smokeStrengthAt(camera.position)>.12)dmg*=Math.max(.45,1-plr.smokeResist);
  if(kind==='rocket')dmg*=PLAYER_ROCKET_DAMAGE_SCALE;
  else if(kind==='mine')dmg*=PLAYER_MINE_DAMAGE_SCALE;
  else if(kind==='bomb')dmg*=PLAYER_BOMB_DAMAGE_SCALE;
  else if(kind==='melee')dmg*=PLAYER_MELEE_DAMAGE_SCALE;
  else dmg*=PLAYER_BULLET_DAMAGE_SCALE;
  if(kind==='rocket'||kind==='mine'||kind==='bomb')dmg*=Math.max(.35,1-plr.blastResist);
  else if(kind==='bullet')dmg*=Math.max(.45,1-plr.bulletResist);
  const armorBefore=armor;
  if(armor>0){
    const absorb=Math.min(armor,dmg*(kind==='rocket'||kind==='mine'?0.45:0.35));
    armor-=absorb;
    dmg-=absorb;
  }
  if(armorBefore>0&&armor<=0)showArmorBreakFx();
  if(dmg<=0)return 0;
  hp-=dmg;
  if(hp<0)hp=0;
  showDamageDirection(attacker,kind,dmg);playSfx('hurt',Math.min(1,.35+dmg/48));
  triggerScreenShake(Math.min(1.15,.24+dmg/55),kind==='rocket'||kind==='bomb'?.24:.13);
  deathReason=damageLabel(kind);
  if(attacker&&attacker.alive)lastPlayerAttacker=attacker;
  hitSlowDur=0;
  hitSlowT=0;
  hitSlowMul=0;
  markHUD();
  trigFlash(Math.min(0.27,0.075+dmg*0.0032),kind==='rocket'||kind==='mine'?150:105);
  if(plr.thorns&&attacker&&attacker.alive){
    attacker.hurt(dmg*0.15,new THREE.Vector3(attacker.group.position.x-camera.position.x,0,attacker.group.position.z-camera.position.z).normalize(),'ally');
  }
  if(kind==='mine')showMsg('💣 Подрыв рядом!');
  if(hp<=0&&plr.secondWind&&plr.secondWindReady){
    plr.secondWindReady=false;hp=Math.max(1,Math.ceil(plr.maxHp*.35));respawnShieldT=2;deathReason='';
    showAnn('💓 ВТОРОЕ ДЫХАНИЕ');showMsg('Смертельный урон отменён · щит 2 секунды');markHUD();updateStats();
  }
  checkDeath();
  return dmg;
}

// ─── HUD ────────────────────────────────
function G(id){return document.getElementById(id);}
function pushKillFeed(killerTeam,killerLabel,victimTeam,victimLabel,kind='bullet'){
  const root=G('kill-feed');if(!root)return;
  const row=document.createElement('div');row.className='kf-row';
  const killer=document.createElement('span');
  killer.className='kf-name '+(killerLabel==='ВЫ'?'player':killerTeam);
  killer.textContent=killerLabel;
  const icon=document.createElement('span');icon.className='kf-icon';
  icon.textContent=kind==='headshot'?'🎯':kind==='rocket'?'🚀':kind==='mine'?'💣':kind==='bomb'?'🧨':kind==='melee'?'⚡':'✦';
  const victim=document.createElement('span');
  victim.className='kf-name '+(victimLabel==='ВЫ'?'player':victimTeam);
  victim.textContent=victimLabel;
  row.append(killer,icon,victim);root.prepend(row);
  while(root.children.length>5)root.lastElementChild.remove();
  setTimeout(()=>{if(!row.isConnected)return;row.classList.add('out');setTimeout(()=>row.remove(),260);},4200);
}
function clearKillFeed(){const root=G('kill-feed');if(root)root.replaceChildren();}
let _hudD=false;function markHUD(){_hudD=true;}
function flushHUD(){
  if(!_hudD)return;_hudD=false;
  G('hv-sc').textContent=score;G('hv-kl').textContent=kills;
  const pct=Math.max(0,hp)/plr.maxHp*100;
  G('hp-fill').style.width=pct+'%';G('hp-txt').textContent='❤️ '+Math.round(Math.max(0,hp))+' / '+plr.maxHp+' HP';
  G('hp-fill').style.background=pct>60?'linear-gradient(90deg,#44cc44,#88ff44)':pct>30?'linear-gradient(90deg,#ffaa00,#ffdd00)':'linear-gradient(90deg,#ff2222,#ff6600)';
  if(armor>0){G('armor-row').style.display='block';G('armor-fill').style.width=(armor/plr.maxArmor*100)+'%';}
  else G('armor-row').style.display='none';
  G('st-arm').textContent=Math.round(armor)+'/'+plr.maxArmor;
  updateStatusIcons();
}
function weaponModeLabel(w){
  if(w.isMine||w.isBomb)return 'DEPLOY';
  if(w.isSmoke)return 'THROW';
  if(w.fireMode==='auto')return 'AUTO';
  if(w.fireMode==='pump')return 'PUMP';
  if(w.fireMode==='bolt')return 'BOLT';
  if(w.fireMode==='launcher')return 'LAUNCHER';
  return 'SEMI';
}
function updateWeaponStateHUD(){
  const el=G('wstate');if(!el)return;
  let text='ГОТОВО',state='ready';
  if(reloading){
    text=reloadMode==='shell'?'ЗАРЯДКА ПАТРОНОВ':reloadMode==='empty'?'ПУСТАЯ ПЕРЕЗАРЯДКА':'ТАКТИЧЕСКАЯ';
    state='busy';
  }else if(weaponEquipT>0){text='ВСКИДЫВАНИЕ';state='busy';
  }else if(wasWeaponSprinting||sprintBlend>.22){text='СПРИНТ · ОРУЖИЕ ОПУЩЕНО';state='blocked';
  }else if(sprintExitT>0){text='ГОТОВНОСТЬ ПОСЛЕ СПРИНТА';state='busy';
  }else if(cycleT>0){text=cycleKind==='bolt'?'ПЕРЕДЁРГИВАНИЕ ЗАТВОРА':'PUMP ACTION';state='busy';
  }else if(weaponReadyT>0){text='ГОТОВНОСТЬ';state='busy';}
  if(el.textContent!==text)el.textContent=text;
  if(el.dataset.state!==state)el.dataset.state=state;
}
function wHUD(){
  const w=getW();G('wname').textContent=w.name;
  const mode=G('wmode');
  if(mode){
    const velocity=w.hitscan?'МГНОВЕННО':w.muzzleVelocity?Math.round(w.muzzleVelocity)+' м/с':w.isRocket?Math.round(PLAYER_ROCKET_SPEED)+' м/с':'';
    mode.textContent=weaponModeLabel(w)+(velocity?' · '+velocity:'');
  }
  G('wammo').textContent=ammo+' / '+w.clip;
  G('wammo').style.color=ammo<=Math.ceil(w.clip*.25)?'#ff4444':ammo<=Math.ceil(w.clip*.5)?'#ffaa00':'#fff';
  let extra='';
  if(w.isSmoke)extra=playerSmokeCD>0?' · кулдаун '+Math.ceil(playerSmokeCD)+'с':' · готова';
  else if(w.isBomb)extra=playerBombCD>0?' · кулдаун '+Math.ceil(playerBombCD)+'с':'';
  else if(w.isMine)extra=playerMineCD>0?' · кулдаун '+Math.ceil(playerMineCD)+'с':'';
  G('wtot').textContent='Запас '+w.label+': '+uAmmo+extra;
  updateMineHUD();
}
function xpHUD(){
  if(level>=30){G('xp-fill').style.width='100%';G('xp-lbl').textContent='ЛВЛ 30 · МАКСИМАЛЬНЫЙ УРОВЕНЬ';return;}
  const cur=xpFor(level),nxt=xpFor(level+1),pct=Math.max(0,Math.min(100,(xp-cur)/(nxt-cur)*100)).toFixed(1);
  G('xp-fill').style.width=pct+'%';G('xp-lbl').textContent='ЛВЛ '+level+' · '+xp+'/'+nxt+' XP';
}

let _statusSig='';
function updateStatusIcons(){
  const wrap=G('status-icons');if(!wrap)return;
  const active=[];
  if(plr.secondWind&&plr.secondWindReady)active.push(['secondWind','Второе дыхание готово']);
  if(plr.lifeSteal>0)active.push(['lifesteal','Биопоглощение '+Math.round(plr.lifeSteal*100)+'%']);
  if(plr.armorRegen>0)active.push(['armorRegen','Регенерация брони']);
  if(hp>0&&hp<plr.maxHp*.35)active.push(['lowHealth','Критическое здоровье']);
  if(plr.smokeResist>0)active.push(['smokeGuard','Защита в дыму']);
  if(plr.critChance>0)active.push(['critReady','Крит '+Math.round(plr.critChance*100)+'%']);
  const sig=active.map(x=>x[0]+':'+x[1]).join('|');
  if(sig===_statusSig)return;_statusSig=sig;wrap.replaceChildren();
  for(const [key,label] of active.slice(0,6)){
    const item=document.createElement('div');item.className='status-chip';item.title=label;
    const img=document.createElement('img');img.src=GAME_ASSETS.status[key];img.alt='';
    const tip=document.createElement('span');tip.textContent=label;
    item.append(img,tip);wrap.appendChild(item);
  }
}
let _combatMedalT=0;
function showCombatMedal(type,label){
  const root=G('combat-medal'),img=G('combat-medal-icon'),txt=G('combat-medal-text');
  if(!root||!img||!txt||!GAME_ASSETS.medals[type])return;
  img.src=GAME_ASSETS.medals[type];txt.textContent=label;
  root.classList.remove('on');void root.offsetWidth;root.classList.add('on');
  clearTimeout(_combatMedalT);_combatMedalT=setTimeout(()=>root.classList.remove('on'),1450);
}
function showKillMedal(ctx={}){
  let type=null,label='';
  if(kills===1){type='first-blood';label='FIRST BLOOD';}
  else if(ctx.explosive){type='explosive-kill';label='EXPLOSIVE KILL';}
  else if(ctx.isCrit){type='critical-kill';label='CRITICAL KILL';}
  else if((ctx.distance||0)>=32){type='longshot';label='LONGSHOT';}
  else if(combo>=5){type='killing-spree';label='KILLING SPREE';}
  else if(combo===4){type='multikill';label='MULTI KILL';}
  else if(combo===3){type='triple-kill';label='TRIPLE KILL';}
  else if(combo===2){type='double-kill';label='DOUBLE KILL';}
  if(type)showCombatMedal(type,label);
}
let _armorBreakT=0;
function showArmorBreakFx(){
  const root=G('armor-break-fx');if(!root)return;
  root.classList.remove('on');void root.offsetWidth;root.classList.add('on');
  clearTimeout(_armorBreakT);_armorBreakT=setTimeout(()=>root.classList.remove('on'),650);
}

let _spT=0,_spEl=null;
function scorePop(t){if(!_spEl)_spEl=G('score-pop');_spEl.textContent=t;_spEl.style.opacity='1';_spEl.style.top='40%';clearTimeout(_spT);_spT=setTimeout(()=>{_spEl.style.opacity='0';_spEl.style.top='36%';},800);}
let _msgT=0;function showMsg(t){G('pmsg').textContent=t;G('pmsg').style.opacity='1';clearTimeout(_msgT);_msgT=setTimeout(()=>G('pmsg').style.opacity='0',2200);}
let _cbT=0;function showCombo(){const c=combo,e=G('combo');e.textContent='🔥 x'+c+' COMBO!';e.style.color=c>5?'#ff4400':c>3?'#ffaa00':'#ffd700';e.style.opacity='1';clearTimeout(_cbT);_cbT=setTimeout(()=>e.style.opacity='0',1000);}
let _damageOverlayKey='';
function setDamageOverlay(alpha=0,color='red'){
  const a=Math.max(0,Math.min(.45,alpha));
  const rgb=color==='gold'?'255,195,40':'135,0,0';
  const key=rgb+'|'+a.toFixed(3);
  if(key===_damageOverlayKey)return;
  _damageOverlayKey=key;
  G('dfx').style.background=`radial-gradient(circle at center,rgba(${rgb},0) 46%,rgba(${rgb},${a.toFixed(3)}) 100%)`;
}
function trigFlash(alpha=.22,dur=90){damageFlashAlpha=Math.max(damageFlashAlpha,alpha);damageFlashDecay=Math.max(damageFlashDecay,alpha/Math.max(0.05,dur/1000));}
function showAnn(t){const e=G('ann');e.textContent=t;e.style.opacity='1';setTimeout(()=>e.style.opacity='0',2500);}

// ─── DEATH CAMERA ────────────────────────
function cleanupDeathCamera(){
  deathCamActive=false;deathCamElapsed=0;deathCamKiller=null;
  if(deathBody){destroySceneObject(deathBody);deathBody=null;}
  gunGrp.visible=true;
  G('xhair').style.opacity='1';
  G('death-flash').style.opacity='1';
}
function startDeathCamera(attacker){
  cleanupDeathCamera();
  deathCamActive=true;deathCamElapsed=0;
  deathCamKiller=attacker&&attacker.alive?attacker:null;
  deathCamPlayerPos.copy(camera.position);
  deathCamPlayerPos.y=Math.max(1.45,deathCamPlayerPos.y);

  // A simple body gives the third-person camera a clear point to show.
  const built=mkHuman(ETYPES[0],'ally');
  deathBody=built.g;
  deathBody.position.set(deathCamPlayerPos.x,.03,deathCamPlayerPos.z);
  deathBody.rotation.y=yaw+Math.PI;
  scene.add(deathBody);

  const deathGround=new THREE.Vector3(deathCamPlayerPos.x,.9,deathCamPlayerPos.z);
  const killerPos=deathCamKiller
    ? deathCamKiller.group.position.clone().add(new THREE.Vector3(0,1.15,0))
    : deathGround.clone().add(new THREE.Vector3(Math.sin(yaw)*8,0,Math.cos(yaw)*8));
  const toward=killerPos.clone().sub(deathGround);toward.y=0;
  if(toward.lengthSq()<.01)toward.set(0,0,1);
  toward.normalize();
  const side=new THREE.Vector3(-toward.z,0,toward.x).multiplyScalar(Math.random()<.5?-1:1);
  deathCamMode=Math.random()<.68?'side':'top';

  if(deathCamMode==='top'){
    deathCamStart.copy(deathGround).addScaledVector(side,2.4).addScaledVector(toward,-1.6);deathCamStart.y=4.6;
    deathCamEnd.copy(deathGround).addScaledVector(side,3.8).addScaledVector(toward,-2.2);deathCamEnd.y=11.5;
  }else{
    deathCamStart.copy(deathGround).addScaledVector(side,3.4).addScaledVector(toward,-1.2);deathCamStart.y=3.2;
    deathCamEnd.copy(deathGround).addScaledVector(side,8.4).addScaledVector(toward,-2.5);deathCamEnd.y=5.4;
  }
  for(const p of [deathCamStart,deathCamEnd]){
    const c=collideWalls(p.x,p.z,.35);p.x=c.x;p.z=c.z;
  }
  deathCamFocus.copy(deathGround);
  if(deathCamKiller&&killerPos.distanceTo(deathGround)<28)deathCamFocus.lerp(killerPos,.28);

  gunGrp.visible=false;
  setGameCursorHidden(true);
  G('xhair').style.opacity='0';
  camera.fov=72;camera.updateProjectionMatrix();
  camera.position.copy(deathCamStart);
  camera.lookAt(deathCamFocus);
}
function tickDeathCamera(dt){
  if(!deathCamActive)return;
  deathCamElapsed+=dt;
  const p=Math.max(0,Math.min(1,deathCamElapsed/deathCamDuration));
  const eased=1-Math.pow(1-p,3);
  camera.position.lerpVectors(deathCamStart,deathCamEnd,eased);

  const corpseFocus=new THREE.Vector3(deathCamPlayerPos.x,.85,deathCamPlayerPos.z);
  deathCamFocus.copy(corpseFocus);
  if(deathCamKiller&&deathCamKiller.alive){
    const kp=deathCamKiller.group.position.clone().add(new THREE.Vector3(0,1.15,0));
    if(kp.distanceTo(corpseFocus)<30)deathCamFocus.lerp(kp,.24);
  }
  camera.lookAt(deathCamFocus);

  if(deathBody){
    const fall=Math.max(0,Math.min(1,deathCamElapsed/.72));
    const fallEase=1-Math.pow(1-fall,3);
    deathBody.rotation.x=fallEase*Math.PI*.48;
    deathBody.position.y=.03;
  }
  // Keep the view readable: strong red flash first, then a light vignette.
  G('death-flash').style.opacity=String(Math.max(.24,1-p*.76));
}
function tickDeathWorld(dt){
  // The battlefield does not freeze. Existing bullets and rockets keep flying through the killcam.
  for(const en of enemies)if(en.alive)en.update(dt);
  tickProjectiles(dt);tickMines(dt);tickSmoke(dt);
  tickParticles(dt);tickGibs(dt);tickCasings(dt);tickImpactMarks(dt);
  tickExpLights(dt);tickMzLights(dt);tickBombBlastWaves(dt);
  updateAllyPanel(dt);
}

// ─── DEATH & RESPAWN ────────────────────
function checkDeath(){
  if(dying||hp>0)return;
  const killer=lastPlayerAttacker&&lastPlayerAttacker.alive?lastPlayerAttacker:null;
  if(killer){
    killer.kills=(killer.kills||0)+1;enemyKills++;updateTeamScore();
    pushKillFeed('enemy','ВРАЖЕСКИЙ БОТ','ally','ВЫ',deathReason||'bullet');
  }
  zooming=false;
  G('sniper-scope')?.classList.remove('on','kick');
  dying=true;running=false;paused=false;lvlAnnOpen=false;perkPickOpen=false;refreshMobileHUD();playSfx('death');
  G('perk-menu').classList.remove('on');G('lvl-ann').classList.remove('on');G('pause').classList.remove('on');
  // Захват мыши во время киллкамеры не отпускаем: иначе браузер часто не даёт
  // вернуть его автоматически после возрождения, появляется курсор и ломается обзор.
  startDeathCamera(killer);
  G('death-flash').style.background='radial-gradient(circle at center,rgba(170,0,0,.05) 34%,rgba(145,0,0,.72) 100%)';
  G('death-flash').style.opacity='1';
  const deathTxt=G('death-msg').querySelector('span');if(deathTxt)deathTxt.textContent='ВЫ ПОГИБЛИ'+(deathReason?' · '+deathReason.toUpperCase():'');
  G('death-msg').style.opacity='1';
  dyingT=deathCamDuration;
}
function doRespawn(){
  cleanupDeathCamera();
  G('death-flash').style.background='rgba(255,0,0,0)';
  G('death-flash').style.opacity='1';
  const deathTxt=G('death-msg').querySelector('span');if(deathTxt)deathTxt.textContent='ВЫ ПОГИБЛИ';
  G('death-msg').style.opacity='0';
  // Keep the live battlefield intact across player deaths. Existing bots,
  // pickups, mines and projectiles remain part of the same 5×5 fight.
  hp=plr.maxHp;
  armor=0;
  reloading=false;reloadT=0;reloadTot=0;sCD=0;recoil=0;
  // Death does not magically unlock or refill the arsenal. Keep the weapons
  // and type-specific reserves the player actually earned from world pickups.
  if(!ownsWeapon(curW))curW=0;
  ammo=Math.max(0,Math.min(getW().clip,weaponAmmo[curW]??0));
  uAmmo=Math.max(0,Math.min(getW().reserveCap??9999,weaponReserve[curW]??0));
  recoilPitch=0;recoilYaw=0;recoilRecovery=0;adsBlend=0;weaponBloom=0;shotSequence=0;shotResetT=0;weaponReadyT=0;weaponEquipT=0;weaponEquipTot=0;sprintBlend=0;sprintExitT=0;wasWeaponSprinting=false;cycleT=0;cycleTot=0;cycleKind='';cycleEjected=false;reloadMode='mag';reloadShellLoaded=0;
  dying=false;paused=false;perkPickOpen=false;pendingLevels=0;lvlAnnOpen=false;lvlAnnT=0;
  combo=0;comboT=0;spawnT=0;plrVx=0;plrVz=0;zooming=false;
  hitSlowT=0;hitSlowDur=0;hitSlowMul=0;
  mineHudSecond=-1;bombHudSecond=-1;smokeHudSecond=-1;
  damageFlashAlpha=0;damageFlashDecay=0;
  respawnShieldT=PLAYER_SPAWN_SHIELD_TIME;
  deathReason='';lastPlayerAttacker=null;plr.secondWindReady=true;
  camera.fov=BASE_FOV;camera.updateProjectionMatrix();

  const respawn=pickPlayerRespawnPoint();
  applyPlayerSpawn(respawn);
  const nearestEnemy=enemies.filter(e=>e.alive&&e.team==='enemy').sort((a,b)=>
    Math.hypot(a.group.position.x-respawn[0],a.group.position.z-respawn[1])-
    Math.hypot(b.group.position.x-respawn[0],b.group.position.z-respawn[1])
  )[0];
  if(nearestEnemy){
    const dx=nearestEnemy.group.position.x-respawn[0],dz=nearestEnemy.group.position.z-respawn[1];
    yaw=Math.atan2(-dx,-dz);
  }else yaw=Math.atan2(respawn[0],respawn[1]);
  pitch=0;onGnd=true;jumpV=0;
  buildGun(getW());wHUD();markHUD();flushHUD();xpHUD();updateStats();updateWeaponBar();updateTeamScore();
  G('rmsg').style.opacity='0';G('reload-wrap').style.display='none';
  setDamageOverlay(0);G('rwarn').style.opacity='0';G('mines-panel').style.display=(getW().isMine||getW().isBomb)?'block':'none';

  showAnn('ТАКТИЧЕСКОЕ ВОЗРОЖДЕНИЕ · БОЙ ПРОДОЛЖАЕТСЯ');
  saveProgress(true);
  lastT=performance.now();
  if(IS_TOUCH){paused=false;running=true;}
  else if(document.pointerLockElement===canvas){
    paused=false;running=true;setGameCursorHidden(true);
  }else{
    // Если браузер всё-таки потерял захват (например, Alt+Tab или ESC во время
    // киллкамеры), не запускаем игру со сломанным управлением — показываем меню.
    paused=true;running=false;showPauseUI();
  }
}

function clearStoredProgress(){
  const keys=[SAVE_KEY,LEGACY_SAVE_KEY,OLDER_SAVE_KEY,OLDEST_SAVE_KEY,ANCIENT_SAVE_KEY,PREHISTORIC_SAVE_KEY,PRIMITIVE_SAVE_KEY,'zap_zone_autosave_v19'];
  for(const key of keys){
    try{localStorage.removeItem(key);sessionStorage.removeItem(key);}catch(e){}
  }
}
function clearWorldForFreshGame(){
  enemies.forEach(e=>e.destroy());enemies.length=0;
  pickups.forEach(p=>destroySceneObject(p.m));pickups.length=0;
  for(const mn of mines)destroySceneObject(mn.m);mines.length=0;
  [...eRkts,...pRkts,...pTrs,...smokeGrenades].forEach(r=>destroySceneObject(r.m));
  eRkts.length=0;pRkts.length=0;pTrs.length=0;smokeGrenades.length=0;
  smokeClouds.forEach(removeSmokeCloud);smokeClouds.length=0;
  if(G('smoke-overlay'))G('smoke-overlay').style.opacity='0';
  _gibs.forEach(g=>destroySceneObject(g.m));_gibs.length=0;
  casings.forEach(c=>scene.remove(c.m));casings.length=0;
  impactMarks.forEach(d=>{scene.remove(d.m);d.m.geometry.dispose();d.m.material.dispose();});impactMarks.length=0;
  bombBlastWaves.forEach(w=>{destroySceneObject(w.ring);destroySceneObject(w.shell);destroySceneObject(w.core);});bombBlastWaves.length=0;
  for(let i=0;i<P_MAX;i++){_pm[i].visible=false;_pp[i].life=0;}_pHead=0;_pCount=0;
  for(const l of _eLights){l._act=false;l.visible=false;}
  for(const l of _mzLights){l._act=false;l.visible=false;}
}
function restartGameFromScratch(){
  if(!confirm('Начать игру заново? Текущий уровень, улучшения, счёт и автосохранение будут удалены.'))return;
  cleanupDeathCamera();
  clearKillFeed();
  clearStoredProgress();
  clearWorldForFreshGame();
  curW=0;hardResetPlayerBuild();
  level=1;xp=0;score=0;kills=0;allyKills=0;enemyKills=0;
  resetFrontlineObjective('mid',true);
  hp=plr.maxHp;armor=0;uAmmo=STARTING_RESERVE[0];ammo=weaponAmmo[0];
  playerMineCD=0;playerBombCD=0;playerSmokeCD=0;mineHudSecond=-1;bombHudSecond=-1;smokeHudSecond=-1;
  reloading=false;reloadT=0;reloadTot=0;sCD=0;recoil=0;recoilPitch=0;recoilYaw=0;recoilRecovery=0;
  dying=false;dyingT=0;paused=false;running=true;lvlAnnOpen=false;perkPickOpen=false;pendingLevels=0;
  combo=0;comboT=0;spawnT=0;plrVx=0;plrVz=0;zooming=false;mouseDown=false;autoFireT=0;
  hitSlowT=0;hitSlowDur=0;hitSlowMul=0;damageFlashAlpha=0;damageFlashDecay=0;
  respawnShieldT=PLAYER_SPAWN_SHIELD_TIME;deathReason='';lastPlayerAttacker=null;
  currentPerkChoices=[];perkRerollsLeft=0;saveTick=8;
  pendingResumeSave=null;preparedSaveLoaded=false;gameSessionActivated=true;inited=true;
  camera.position.set(0,1.75,0);camera.fov=BASE_FOV;camera.updateProjectionMatrix();
  yaw=0;pitch=0;onGnd=true;jumpV=0;prevPX=0;prevPZ=0;
  G('pause').classList.remove('on');G('menu').style.display='none';
  G('perk-menu').classList.remove('on');G('lvl-ann').classList.remove('on');
  G('death-flash').style.background='rgba(255,0,0,0)';G('death-flash').style.opacity='1';G('death-msg').style.opacity='0';
  G('rmsg').style.opacity='0';G('reload-wrap').style.display='none';G('rwarn').style.opacity='0';
  setDamageOverlay(0);
  buildGun(getW());buildWeaponBar();updateWeaponBar();updatePerkPanel();updateStats();
  spawnPickups();spawnInitial();
  wHUD();markHUD();flushHUD();xpHUD();updateTeamScore();
  saveProgress(true);refreshStartButton();showAnn('НОВАЯ ИГРА · УРОВЕНЬ 1');lastT=performance.now();
  if(IS_TOUCH){paused=false;running=true;}
  else{paused=true;running=false;requestGamePointerLock();}
}
