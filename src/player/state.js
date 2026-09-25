'use strict';

// ─── PLAYER STATE ────────────────────────
let curW=0,lastW=0,ammo=STARTING_AMMO[0],uAmmo=STARTING_RESERVE[0],reloading=false,reloadT=0,reloadTot=0,sCD=0,recoil=0;
const weaponAmmo=STARTING_AMMO.slice();
const weaponReserve=STARTING_RESERVE.slice();
const weaponOwned=STARTING_OWNED.slice();
let yaw=0,pitch=0,onGnd=true,jumpV=0;
let hp=100,score=0,kills=0,xp=0,level=1,armor=0;
let running=false,paused=false,dying=false,inited=false;
let combo=0,comboT=0;
let noAmmoT=0;
let playerMineCD=0;
let playerBombCD=0;
let playerSmokeCD=0;
let mineHudSecond=-1,bombHudSecond=-1,smokeHudSecond=-1;
// Camera recoil
let recoilPitch=0,recoilYaw=0,recoilRecovery=0;
let adsBlend=0,weaponBloom=0,shotSequence=0,shotResetT=0;
let weaponReadyT=0,weaponEquipT=0,weaponEquipTot=0;
let sprintBlend=0,sprintExitT=0,wasWeaponSprinting=false;
let cycleT=0,cycleTot=0,cycleKind='',cycleEjected=false;
let reloadMode='mag',reloadShellLoaded=0;
const K={};
const mobileInput={
  moveId:null,lookId:null,fire:false,run:false,jumpQueued:false,reloadQueued:false,mineQueued:false,
  moveX:0,moveY:0,lookDX:0,lookDY:0,joyR:0,lookActive:false
};
let portraitBlocked=false;
let mobileLookPrevX=0,mobileLookPrevY=0;
let mobileStarted=false;
let pointerLockRequestPending=false;
let pointerLockRequestTimer=0;

let plrVx=0,plrVz=0;

let lvlAnnOpen=false,perkPickOpen=false;
let lvlAnnT=0,lvlAnnMax=3.0;
let pendingLevels=0,dyingT=0;

// Death camera keeps the last hit, projectiles and battlefield visible before respawn.
let deathCamActive=false,deathCamElapsed=0,deathCamDuration=4.6,deathCamKiller=null,deathBody=null;
const deathCamPlayerPos=new THREE.Vector3();
const deathCamFocus=new THREE.Vector3();
const deathCamStart=new THREE.Vector3();
const deathCamEnd=new THREE.Vector3();
let deathCamMode='side';

// SLOWER XP CURVE (level 1 starts at 0 XP)
const XP_CACHE={1:0};
function xpFor(l){
  if(l<=1)return 0;
  if(XP_CACHE[l]!==undefined)return XP_CACHE[l];
  let total=0;
  for(let i=2;i<=l;i++){
    total+=Math.floor(320*Math.pow(1.34,i-2)+(i-2)*90);
  }
  XP_CACHE[l]=total;
  return total;
}

const PERK_RARITIES={
  common:{name:'ОБЫЧНОЕ',weight:62,color:'#a9b3c1'},
  rare:{name:'РЕДКОЕ',weight:30,color:'#38a8ff'},
  epic:{name:'ЭПИЧЕСКОЕ',weight:11,color:'#b66cff'},
  legendary:{name:'ЛЕГЕНДАРНОЕ',weight:3.2,color:'#ffb21c'}
};
const PATH_NAMES={assault:'Штурм',precision:'Точность',survival:'Выживание',mobility:'Мобильность',demolition:'Взрывчатка'};
const plr={
  maxHp:100,dmgM:1,spdM:1,regen:0,critChance:0,critMult:2,lifeSteal:0,armorRegen:0,
  piercing:false,explode:false,explodeRadiusM:1,explodeDamageM:1,headshotM:1,executeBonus:0,
  killHeal:0,killArmor:0,maxArmor:80,blastResist:0,bulletResist:0,rocketSpeedM:1,rocketDamageM:1,
  explosiveDamageM:1,explosiveRadiusM:1,mineDamageM:1,mineCooldownM:1,bombRadiusM:1,bombDamageM:1,
  secondWind:false,secondWindReady:true,lowHpDamage:0,lowHpSpeed:0,extraShotChance:0,thorns:false,
  ammoSaveChance:0,closeDamage:0,longRangeDamage:0,spreadM:1,recoilM:1,critHeal:0,headshotArmor:0,
  medkitM:1,overhealArmor:0,sprintM:1,jumpM:1,movingDamage:0,dodgeChance:0,fullHpDamage:0,
  smokeRadiusM:1,smokeDurationM:1,smokeCooldownM:1,smokeResist:0,bombFuseM:1,rocketRadiusM:1,mineRadiusM:1,
  pathMilestones:new Set()
};
const perksGot=[];
let currentPerkChoices=[];
let perkRerollsLeft=0;

function increaseClips(mult,includeBomb=false){
  syncCurrentAmmo();
  WEAPONS.forEach((w,i)=>{
    if((w.isBomb&&!includeBomb)||w.isSmoke)return;
    const old=w.clip;
    w.clip=Math.max(old+1,Math.round(old*mult));
    const gain=w.clip-old;
    if(ownsWeapon(i))weaponAmmo[i]=Math.min(w.clip,(weaponAmmo[i]??0)+gain);
  });
  ammo=weaponAmmo[curW];
}
function accelerateFire(mult){WEAPONS.forEach(w=>{if(w.isMine||w.isBomb||w.isSmoke)return;w.rate=Math.max(.045,w.rate*mult);if(w.cycleTime)w.cycleTime=Math.max(.18,w.cycleTime*mult);});}
function accelerateReload(mult){WEAPONS.forEach(w=>{w.reload=Math.max(.32,w.reload*mult);});}

const ALL_PERKS=[
  {id:'damage',ic:'⚔️',nm:'Калибровка урона',path:'assault',rarity:'common',maxRank:5,minLevel:2,ds:'+18% к урону всего оружия.',fn:()=>plr.dmgM+=.18},
  {id:'overclock',ic:'💨',nm:'Разгон механики',path:'assault',rarity:'rare',maxRank:4,minLevel:3,ds:'+14% к скорострельности огнестрельного и плазменного оружия.',fn:()=>accelerateFire(.86)},
  {id:'magazine',ic:'🔫',nm:'Расширенные магазины',path:'assault',rarity:'common',maxRank:4,minLevel:2,ds:'+30% к ёмкости магазинов и мгновенное пополнение добавленных патронов.',fn:()=>increaseClips(1.30)},
  {id:'reload',ic:'⏩',nm:'Тактическая перезарядка',path:'assault',rarity:'common',maxRank:4,minLevel:2,ds:'Перезарядка всего оружия быстрее на 18%.',fn:()=>accelerateReload(.82)},
  {id:'doubletap',ic:'✌️',nm:'Двойной импульс',path:'assault',rarity:'epic',maxRank:3,minLevel:7,ds:'+18% шанс выпустить дополнительный полный выстрел без дополнительной задержки.',fn:()=>plr.extraShotChance=Math.min(.60,plr.extraShotChance+.18)},
  {id:'bulletstorm',ic:'🌪️',nm:'Шторм свинца',path:'assault',rarity:'legendary',maxRank:1,minLevel:12,ds:'+35% скорострельности, +50% магазины и +20% скорость перезарядки.',fn:()=>{accelerateFire(.65);increaseClips(1.50);accelerateReload(.80);}},

  {id:'crit',ic:'🎲',nm:'Холодный расчёт',path:'precision',rarity:'common',maxRank:5,minLevel:2,ds:'+8% к шансу критического урона.',fn:()=>plr.critChance=Math.min(.60,plr.critChance+.08)},
  {id:'critpower',ic:'💢',nm:'Критический резонанс',path:'precision',rarity:'rare',maxRank:3,minLevel:4,requires:'crit',ds:'+35% к множителю критического урона.',fn:()=>plr.critMult+=.35},
  {id:'headshot',ic:'🎯',nm:'Нейроприцел',path:'precision',rarity:'rare',maxRank:4,minLevel:4,ds:'+25% к урону попаданий в голову.',fn:()=>plr.headshotM+=.25},
  {id:'executioner',ic:'🗡️',nm:'Добивание',path:'precision',rarity:'rare',maxRank:3,minLevel:5,ds:'+15% урона по ботам с запасом здоровья ниже 35%.',fn:()=>plr.executeBonus+=.15},
  {id:'piercing',ic:'🔱',nm:'Бронебойный сердечник',path:'precision',rarity:'epic',maxRank:1,minLevel:7,ds:'Пуля пробивает первого противника и сохраняет 72% урона для следующей цели.',fn:()=>plr.piercing=true},
  {id:'predator',ic:'👁️',nm:'Режим хищника',path:'precision',rarity:'legendary',maxRank:1,minLevel:13,ds:'+15% крит-шанс, +75% крит-множитель и +50% урон в голову.',fn:()=>{plr.critChance=Math.min(.75,plr.critChance+.15);plr.critMult+=.75;plr.headshotM+=.50;}},

  {id:'vitality',ic:'❤️',nm:'Усиленный организм',path:'survival',rarity:'common',maxRank:6,minLevel:2,ds:'+40 к максимуму HP и мгновенное лечение на 40 HP.',fn:()=>{plr.maxHp+=40;hp=Math.min(plr.maxHp,hp+40);}},
  {id:'armor',ic:'🛡️',nm:'Композитная броня',path:'survival',rarity:'common',maxRank:5,minLevel:2,ds:'+25 к максимуму брони и мгновенно +25 брони.',fn:()=>{plr.maxArmor+=25;armor=Math.min(plr.maxArmor,armor+25);}},
  {id:'nanorepair',ic:'🔋',nm:'Наноремонт',path:'survival',rarity:'rare',maxRank:4,minLevel:4,ds:'+1,5 HP постоянной регенерации в секунду.',fn:()=>plr.regen+=1.5},
  {id:'armorregen',ic:'🔷',nm:'Самовосстановление брони',path:'survival',rarity:'rare',maxRank:4,minLevel:4,requires:'armor',ds:'+1,25 брони в секунду до максимального запаса.',fn:()=>plr.armorRegen+=1.25},
  {id:'lifesteal',ic:'💚',nm:'Биопоглощение',path:'survival',rarity:'epic',maxRank:3,minLevel:6,ds:'3,5% нанесённого прямого урона возвращается в HP.',fn:()=>plr.lifeSteal+=.035},
  {id:'hunter',ic:'🩸',nm:'Охотничий инстинкт',path:'survival',rarity:'rare',maxRank:3,minLevel:5,ds:'Каждое убийство восстанавливает 10 HP и 6 брони.',fn:()=>{plr.killHeal+=10;plr.killArmor+=6;}},
  {id:'blastshield',ic:'🧱',nm:'Противовзрывный слой',path:'survival',rarity:'rare',maxRank:3,minLevel:5,ds:'Входящий урон от ракет, мин и бомб снижается на 15%.',fn:()=>plr.blastResist=Math.min(.45,plr.blastResist+.15)},
  {id:'secondwind',ic:'💓',nm:'Второе дыхание',path:'survival',rarity:'epic',maxRank:1,minLevel:8,ds:'Один раз за жизнь смертельный урон оставляет 35% HP и даёт щит на 2 секунды.',fn:()=>{plr.secondWind=true;plr.secondWindReady=true;}},
  {id:'immortal',ic:'👑',nm:'Несокрушимый',path:'survival',rarity:'legendary',maxRank:1,minLevel:14,ds:'+100 HP, +60 брони, +3 HP/с и эффект «Второе дыхание».',fn:()=>{plr.maxHp+=100;hp=Math.min(plr.maxHp,hp+100);plr.maxArmor+=60;armor=Math.min(plr.maxArmor,armor+60);plr.regen+=3;plr.secondWind=true;plr.secondWindReady=true;}},

  {id:'mobility',ic:'⚡',nm:'Боевой привод',path:'mobility',rarity:'common',maxRank:5,minLevel:2,ds:'+12% к скорости передвижения.',fn:()=>plr.spdM+=.12},
  {id:'laststand',ic:'🔥',nm:'Последний рубеж',path:'mobility',rarity:'epic',maxRank:1,minLevel:7,ds:'При HP ниже 35%: +35% урона и +30% скорости движения.',fn:()=>{plr.lowHpDamage=.35;plr.lowHpSpeed=.30;}},
  {id:'reflex',ic:'🌀',nm:'Рефлекторные сервоприводы',path:'mobility',rarity:'rare',maxRank:3,minLevel:5,ds:'+10% скорость движения и +10% скорость перезарядки.',fn:()=>{plr.spdM+=.10;accelerateReload(.90);}},
  {id:'thorns',ic:'⚡',nm:'Ответный разряд',path:'mobility',rarity:'epic',maxRank:1,minLevel:8,ds:'15% фактически полученного урона возвращается атакующему боту.',fn:()=>plr.thorns=true},

  {id:'explosive_payload',ic:'💥',nm:'Усиленный заряд',path:'demolition',rarity:'common',maxRank:5,minLevel:2,ds:'+18% урон и +8% радиус всех взрывов.',fn:()=>{plr.explosiveDamageM+=.18;plr.explosiveRadiusM+=.08;}},
  {id:'rockettech',ic:'🚀',nm:'Ракетный ускоритель',path:'demolition',rarity:'rare',maxRank:4,minLevel:4,ds:'+18% скорость полёта и +15% урон ракет.',fn:()=>{plr.rocketSpeedM+=.18;plr.rocketDamageM+=.15;}},
  {id:'minetech',ic:'💣',nm:'Инженер мин',path:'demolition',rarity:'rare',maxRank:3,minLevel:4,ds:'Перезарядка мины быстрее на 20%, урон мин +20%.',fn:()=>{plr.mineCooldownM*=.80;plr.mineDamageM+=.20;}},
  {id:'bombtech',ic:'🧨',nm:'Тяжёлая бомба',path:'demolition',rarity:'epic',maxRank:2,minLevel:7,ds:'+25% урон, +15% радиус бомбы и +1 к переносимому запасу.',fn:()=>{plr.bombDamageM+=.25;plr.bombRadiusM+=.15;WEAPONS[6].clip+=1;if(ownsWeapon(6))weaponAmmo[6]=Math.min(WEAPONS[6].clip,(weaponAmmo[6]||0)+1);}},
  {id:'explosive_rounds',ic:'💫',nm:'Разрывные боеприпасы',path:'demolition',rarity:'epic',maxRank:1,minLevel:8,ds:'Прямые попадания пуль создают дополнительный малый взрыв по соседним ботам.',fn:()=>plr.explode=true},
  {id:'warmachine',ic:'☢️',nm:'Машина разрушения',path:'demolition',rarity:'legendary',maxRank:1,minLevel:13,ds:'+50% урон и +25% радиус взрывов, +25% скорость ракет, мина готовится на 25% быстрее.',fn:()=>{plr.explosiveDamageM+=.50;plr.explosiveRadiusM+=.25;plr.rocketSpeedM+=.25;plr.mineCooldownM*=.75;}},

  {id:'ammo_saver',ic:'♻️',nm:'Экономный затвор',path:'assault',rarity:'common',maxRank:3,minLevel:2,ds:'+12% шанс не потратить патрон при выстреле.',fn:()=>plr.ammoSaveChance=Math.min(.42,plr.ammoSaveChance+.12)},
  {id:'close_quarters',ic:'🥊',nm:'Ближний бой',path:'assault',rarity:'rare',maxRank:3,minLevel:4,ds:'+18% урона по целям ближе 12 метров.',fn:()=>plr.closeDamage+=.18},
  {id:'full_charge',ic:'🔆',nm:'Полный заряд',path:'assault',rarity:'rare',maxRank:3,minLevel:4,ds:'+12% урона, пока здоровье выше 90%.',fn:()=>plr.fullHpDamage+=.12},

  {id:'steady_grip',ic:'🧲',nm:'Стабилизатор оружия',path:'precision',rarity:'common',maxRank:3,minLevel:2,ds:'Разброс и отдача уменьшаются на 18%.',fn:()=>{plr.spreadM*=.82;plr.recoilM*=.82;}},
  {id:'longshot',ic:'🔭',nm:'Дальняя баллистика',path:'precision',rarity:'rare',maxRank:3,minLevel:4,ds:'+18% урона по целям дальше 28 метров.',fn:()=>plr.longRangeDamage+=.18},
  {id:'crit_repair',ic:'🩹',nm:'Критический ремонт',path:'precision',rarity:'rare',maxRank:3,minLevel:5,requires:'crit',ds:'Критическое попадание восстанавливает 2,5 HP.',fn:()=>plr.critHeal+=2.5},
  {id:'headshot_armor',ic:'🪖',nm:'Трофейная броня',path:'precision',rarity:'epic',maxRank:2,minLevel:7,ds:'Попадание в голову восстанавливает 3 единицы брони.',fn:()=>plr.headshotArmor+=3},

  {id:'ballistic_lining',ic:'🦺',nm:'Баллистическая подкладка',path:'survival',rarity:'rare',maxRank:3,minLevel:4,ds:'Урон обычных пуль снижается на 10%.',fn:()=>plr.bulletResist=Math.min(.35,plr.bulletResist+.10)},
  {id:'field_medic',ic:'⛑️',nm:'Полевой медик',path:'survival',rarity:'common',maxRank:3,minLevel:2,ds:'Аптечки восстанавливают на 35% больше здоровья.',fn:()=>plr.medkitM+=.35},
  {id:'surplus_armor',ic:'🧰',nm:'Конвертер излишков',path:'survival',rarity:'rare',maxRank:3,minLevel:5,ds:'Аптечка при полном HP даёт до 18 единиц брони.',fn:()=>plr.overhealArmor+=18},
  {id:'smoke_guard',ic:'😷',nm:'Фильтрующая броня',path:'survival',rarity:'epic',maxRank:2,minLevel:7,ds:'В собственном дыму входящий урон пуль снижается на 18%.',fn:()=>plr.smokeResist=Math.min(.50,plr.smokeResist+.18)},

  {id:'sprint_drive',ic:'🏃',nm:'Усиленный спринт',path:'mobility',rarity:'common',maxRank:4,minLevel:2,ds:'+10% к скорости бега.',fn:()=>plr.sprintM+=.10},
  {id:'jump_servos',ic:'🦿',nm:'Прыжковые сервоприводы',path:'mobility',rarity:'common',maxRank:3,minLevel:2,ds:'+12% к высоте и скорости прыжка.',fn:()=>plr.jumpM+=.12},
  {id:'combat_momentum',ic:'💨',nm:'Боевой импульс',path:'mobility',rarity:'rare',maxRank:3,minLevel:5,ds:'+12% урона во время быстрого движения.',fn:()=>plr.movingDamage+=.12},
  {id:'evasive_matrix',ic:'🫥',nm:'Матрица уклонения',path:'mobility',rarity:'epic',maxRank:2,minLevel:8,ds:'+9% шанс полностью уклониться от обычной пули.',fn:()=>plr.dodgeChance=Math.min(.18,plr.dodgeChance+.09)},

  {id:'smoke_radius',ic:'🌫️',nm:'Плотная дымовая смесь',path:'demolition',rarity:'common',maxRank:3,minLevel:2,ds:'+18% к радиусу дымового облака.',fn:()=>plr.smokeRadiusM+=.18},
  {id:'smoke_duration',ic:'⌛',nm:'Долгий дым',path:'demolition',rarity:'rare',maxRank:3,minLevel:4,ds:'+20% к длительности дымового облака.',fn:()=>plr.smokeDurationM+=.20},
  {id:'smoke_reload',ic:'🌪️',nm:'Быстрый дымовой цикл',path:'demolition',rarity:'rare',maxRank:3,minLevel:4,ds:'Дымовуха готовится на 18% быстрее.',fn:()=>plr.smokeCooldownM*=.82},
  {id:'short_fuse',ic:'⏱️',nm:'Укороченный фитиль',path:'demolition',rarity:'rare',maxRank:2,minLevel:5,ds:'Фитиль бомбы сгорает на 18% быстрее.',fn:()=>plr.bombFuseM*=.82},
  {id:'rocket_radius',ic:'🛰️',nm:'Широкий ракетный заряд',path:'demolition',rarity:'rare',maxRank:3,minLevel:5,ds:'+12% к радиусу взрыва ракет.',fn:()=>plr.rocketRadiusM+=.12},
  {id:'mine_radius',ic:'🕳️',nm:'Объёмный датчик мины',path:'demolition',rarity:'rare',maxRank:3,minLevel:5,ds:'+15% к радиусу поражения мин.',fn:()=>plr.mineRadiusM+=.15}
];

function perkTimesTaken(id){return perksGot.filter(p=>p.id===id).length;}
function canTakePerk(p,ignoreRequirements=false){
  if(!p)return false;
  if(perkTimesTaken(p.id)>=(p.maxRank||1))return false;
  if(ignoreRequirements)return true;
  if(level<(p.minLevel||2))return false;
  if(p.requires&&perkTimesTaken(p.requires)===0)return false;
  return true;
}
function pathRank(path){return perksGot.filter(p=>p.path===path).length;}
function applyPathMilestones(){
  const milestones={
    assault:[{n:3,id:'assault3',fn:()=>plr.dmgM+=.10},{n:6,id:'assault6',fn:()=>accelerateFire(.90)}],
    precision:[{n:3,id:'precision3',fn:()=>plr.critChance=Math.min(.75,plr.critChance+.06)},{n:6,id:'precision6',fn:()=>plr.headshotM+=.25}],
    survival:[{n:3,id:'survival3',fn:()=>{plr.maxHp+=25;hp=Math.min(plr.maxHp,hp+25);plr.maxArmor+=20;armor=Math.min(plr.maxArmor,armor+20);}},{n:6,id:'survival6',fn:()=>plr.regen+=1.5}],
    mobility:[{n:3,id:'mobility3',fn:()=>plr.spdM+=.08},{n:6,id:'mobility6',fn:()=>accelerateReload(.90)}],
    demolition:[{n:3,id:'demolition3',fn:()=>{plr.explosiveDamageM+=.12;plr.explosiveRadiusM+=.10;}},{n:6,id:'demolition6',fn:()=>plr.mineCooldownM*=.85}]
  };
  for(const [path,list] of Object.entries(milestones)){
    const rank=pathRank(path);
    for(const m of list){
      if(rank>=m.n&&!plr.pathMilestones.has(m.id)){plr.pathMilestones.add(m.id);m.fn();showMsg('⭐ Бонус пути «'+PATH_NAMES[path]+'» активирован!');}
    }
  }
}
function currentBuildText(){
  const ranked=Object.keys(PATH_NAMES).map(path=>({path,n:pathRank(path)})).sort((a,b)=>b.n-a.n);
  const top=ranked.filter(x=>x.n>0).slice(0,3);
  if(!top.length)return 'Путь развития: выберите первое улучшение';
  return 'Путь развития: '+top.map(x=>PATH_NAMES[x.path]+' '+x.n).join(' · ')+' · бонусы пути на 3 и 6 рангах';
}
function weightedPerkPick(pool,selected){
  const usedPaths=new Set(selected.map(p=>p.path));
  const weights=pool.map(p=>{
    let w=(PERK_RARITIES[p.rarity]||PERK_RARITIES.common).weight;
    if(level>=10&&p.rarity==='epic')w*=1.35;
    if(level>=15&&p.rarity==='legendary')w*=1.9;
    if(usedPaths.has(p.path))w*=.48;
    if(perkTimesTaken(p.id)>0)w*=.82;
    return Math.max(.1,w);
  });
  let r=Math.random()*weights.reduce((a,b)=>a+b,0);
  for(let i=0;i<pool.length;i++){r-=weights[i];if(r<=0)return pool[i];}
  return pool[pool.length-1];
}
function rollPerkChoices(count=4){
  const pool=ALL_PERKS.filter(p=>canTakePerk(p));
  const selected=[];
  while(pool.length&&selected.length<count){
    const p=weightedPerkPick(pool,selected);selected.push(p);pool.splice(pool.indexOf(p),1);
  }
  return selected;
}
function getW(){return WEAPONS[curW];}

function ownsWeapon(idx){return Number.isInteger(idx)&&idx>=0&&idx<WEAPONS.length&&!!weaponOwned[idx];}
function weaponReserveValue(idx){
  if(idx===curW)return uAmmo;
  const w=WEAPONS[idx],val=weaponReserve[idx];
  return Math.max(0,Math.min(w.reserveCap??9999,Number.isFinite(val)?val:0));
}
function syncCurrentAmmo(){
  weaponAmmo[curW]=Math.max(0,Math.min(getW().clip,ammo));
  weaponReserve[curW]=Math.max(0,Math.min(getW().reserveCap??9999,uAmmo));
}
function weaponAmmoValue(idx){
  if(!ownsWeapon(idx))return 0;
  if(idx===curW)return ammo;
  const w=WEAPONS[idx],val=weaponAmmo[idx];
  return Math.max(0,Math.min(w.clip,Number.isFinite(val)?val:0));
}
function setWeaponAmmo(idx,value){
  const w=WEAPONS[idx];if(!w)return 0;
  const val=Math.max(0,Math.min(w.clip,Number(value)||0));
  weaponAmmo[idx]=val;if(idx===curW)ammo=val;return val;
}
function setWeaponReserve(idx,value){
  const w=WEAPONS[idx];if(!w)return 0;
  const val=Math.max(0,Math.min(w.reserveCap??9999,Math.floor(Number(value)||0)));
  weaponReserve[idx]=val;if(idx===curW)uAmmo=val;return val;
}
function grantWeapon(idx,reserveGrant=0){
  if(!Number.isInteger(idx)||idx<0||idx>=WEAPONS.length)return null;
  syncCurrentAmmo();
  const w=WEAPONS[idx],first=!weaponOwned[idx];
  weaponOwned[idx]=true;
  if(first)weaponAmmo[idx]=w.clip;
  const before=weaponReserveValue(idx),after=setWeaponReserve(idx,before+Math.max(0,Math.floor(reserveGrant||0)));
  if(first&&idx!==curW)switchW(idx);else{if(idx===curW){ammo=weaponAmmo[idx];uAmmo=weaponReserve[idx];}updateWeaponBar();wHUD();}
  return{first,added:after-before,total:after};
}

const SAVE_KEY='zap_zone_autosave_v26';
const LEGACY_SAVE_KEY='zap_zone_autosave_v25';
const OLDER_SAVE_KEY='zap_zone_autosave_v24';
const OLDEST_SAVE_KEY='zap_zone_autosave_v23';
const ANCIENT_SAVE_KEY='zap_zone_autosave_v22';
const PREHISTORIC_SAVE_KEY='zap_zone_autosave_v21';
const PRIMITIVE_SAVE_KEY='zap_zone_autosave_v20';
let pendingResumeSave=null;
let saveTick=8;
let preloadStarted=false,preloadDone=false,gameSessionActivated=false,preparedSaveLoaded=false;

function hardResetPlayerBuild(){
  Object.assign(plr,{
    maxHp:100,dmgM:1,spdM:1,regen:0,critChance:0,critMult:2,lifeSteal:0,armorRegen:0,
    piercing:false,explode:false,explodeRadiusM:1,explodeDamageM:1,headshotM:1,executeBonus:0,
    killHeal:0,killArmor:0,maxArmor:80,blastResist:0,bulletResist:0,rocketSpeedM:1,rocketDamageM:1,
    explosiveDamageM:1,explosiveRadiusM:1,mineDamageM:1,mineCooldownM:1,bombRadiusM:1,bombDamageM:1,
    secondWind:false,secondWindReady:true,lowHpDamage:0,lowHpSpeed:0,extraShotChance:0,thorns:false,
    ammoSaveChance:0,closeDamage:0,longRangeDamage:0,spreadM:1,recoilM:1,critHeal:0,headshotArmor:0,
    medkitM:1,overhealArmor:0,sprintM:1,jumpM:1,movingDamage:0,dodgeChance:0,fullHpDamage:0,
    smokeRadiusM:1,smokeDurationM:1,smokeCooldownM:1,smokeResist:0,bombFuseM:1,rocketRadiusM:1,mineRadiusM:1
  });
  plr.pathMilestones=new Set();
  perksGot.length=0;
  WEAPONS.forEach((w,i)=>{w.clip=W_DEFAULTS.clips[i];w.rate=W_DEFAULTS.rates[i];w.reload=W_DEFAULTS.reloads[i];w.cycleTime=W_DEFAULTS.cycleTimes[i]||undefined;});
  weaponAmmo.splice(0,weaponAmmo.length,...STARTING_AMMO);
  weaponReserve.splice(0,weaponReserve.length,...STARTING_RESERVE);
  weaponOwned.splice(0,weaponOwned.length,...STARTING_OWNED);
  if(!ownsWeapon(curW))curW=0;
  if(!ownsWeapon(lastW))lastW=curW;
  ammo=weaponAmmo[curW]??0;
  uAmmo=weaponReserve[curW]??0;
}
const LEGACY_PERK_MAP={
  attack:'damage',attack2:'damage',vitality:'vitality',hpfury:'vitality',triple:'doubletap',dblshot:'doubletap',
  adrenaline:'mobility',speed2:'mobility',explode:'explosive_rounds',regen:'nanorepair',regen2:'nanorepair',
  shield:'armor',vampire:'hunter',berserk:'laststand',mag:'magazine',firerate:'overclock',crit:'crit',
  lifesteal:'lifesteal',armorregen:'armorregen',thorns:'thorns',quickreload:'reload',piercing:'piercing'
};
function applySavedPerk(id){
  const mapped=LEGACY_PERK_MAP[id]||id;
  const perk=ALL_PERKS.find(p=>p.id===mapped);
  if(perk&&canTakePerk(perk,true)){perk.fn();perksGot.push({...perk});}
}
function captureSave(){
  syncCurrentAmmo();
  const mags=weaponAmmo.map((value,i)=>ownsWeapon(i)?Math.max(0,Math.min(WEAPONS[i].clip,value)):0);
  const reserves=weaponReserve.map((value,i)=>ownsWeapon(i)?Math.max(0,Math.min(WEAPONS[i].reserveCap??9999,value)):0);
  return {
    v:26,t:Date.now(),
    level,xp,score,kills,allyKills,enemyKills,
    hp,armor,uAmmo,curW,ammo,weaponAmmo:mags,weaponReserve:reserves,weaponOwned:weaponOwned.slice(),
    playerMineCD,playerBombCD,playerSmokeCD,
    perks:perksGot.map(p=>p.id),
    player:{x:camera.position.x,z:camera.position.z,yaw,pitch}
  };
}
function saveProgress(force=false){
  if((!inited||webglLost)&&!force)return;
  try{
    const raw=JSON.stringify(captureSave());
    localStorage.setItem(SAVE_KEY,raw);
    sessionStorage.setItem(SAVE_KEY,raw);
  }catch(e){}
}
function loadProgress(){
  try{
    const raw=localStorage.getItem(SAVE_KEY)||sessionStorage.getItem(SAVE_KEY)||
      localStorage.getItem(LEGACY_SAVE_KEY)||sessionStorage.getItem(LEGACY_SAVE_KEY)||
      localStorage.getItem(OLDER_SAVE_KEY)||sessionStorage.getItem(OLDER_SAVE_KEY)||
      localStorage.getItem(OLDEST_SAVE_KEY)||sessionStorage.getItem(OLDEST_SAVE_KEY)||
      localStorage.getItem(ANCIENT_SAVE_KEY)||sessionStorage.getItem(ANCIENT_SAVE_KEY)||
      localStorage.getItem(PREHISTORIC_SAVE_KEY)||sessionStorage.getItem(PREHISTORIC_SAVE_KEY)||
      localStorage.getItem(PRIMITIVE_SAVE_KEY)||sessionStorage.getItem(PRIMITIVE_SAVE_KEY);
    if(!raw)return null;
    const data=JSON.parse(raw);
    if(!data||(data.v<20||data.v>26))return null;
    return data;
  }catch(e){return null;}
}
function refreshStartButton(){
  const has=!!loadProgress();
  G('startBtn').textContent=has?'▶ ПРОДОЛЖИТЬ':'▶ ИГРАТЬ';
}
function setLoadingProgress(pct,label){
  const fill=G('loading-fill'),txt=G('loading-pct'),sub=G('loading-sub');
  if(fill)fill.style.width=Math.max(0,Math.min(100,pct))+'%';
  if(txt)txt.textContent=Math.round(pct)+'%';
  if(sub&&label)sub.textContent=label;
}
function nextPreloadFrame(){return new Promise(resolve=>requestAnimationFrame(()=>resolve()));}
function prepareGameContentSync(){
  if(inited)return;
  if(pickups.length===0)spawnPickups();
  if(enemies.length===0)spawnInitial();
  inited=true;
  pendingResumeSave=loadProgress();
  if(pendingResumeSave){applyRuntimeSave(pendingResumeSave);preparedSaveLoaded=true;}
}
function activatePreparedGame(){
  if(gameSessionActivated)return;
  if(!inited)prepareGameContentSync();
  gameSessionActivated=true;
  respawnShieldT=PLAYER_SPAWN_SHIELD_TIME;
  deathReason='';
  showAnn(preparedSaveLoaded?'АВТОСЕЙВ ВОССТАНОВЛЕН':'КОМАНДНЫЙ БОЙ 5×5 — GO!');
}
async function preloadGameContent(){
  if(preloadStarted)return;
  preloadStarted=true;
  const btn=G('startBtn');
  if(btn)btn.disabled=true;
  G('loading')?.classList.remove('hidden');
  try{
    setLoadingProgress(8,'Подготовка интерфейса...');
    await nextPreloadFrame();
    setLoadingProgress(25,'Создание предметов и аптечек...');
    spawnPickups();
    await nextPreloadFrame();
    setLoadingProgress(52,'Подготовка команд и искусственного интеллекта...');
    spawnInitial();
    inited=true;
    await nextPreloadFrame();
    setLoadingProgress(70,'Восстановление сохранения...');
    pendingResumeSave=loadProgress();
    if(pendingResumeSave){applyRuntimeSave(pendingResumeSave);preparedSaveLoaded=true;}
    await nextPreloadFrame();
    setLoadingProgress(84,'Компиляция графики...');
    try{renderer.compile(scene,camera);}catch(e){}
    renderFrame();
    await nextPreloadFrame();
    setLoadingProgress(100,PERF_MODE?'Готово · включён облегчённый режим':'Готово · ресурсы загружены');
    preloadDone=true;
    refreshStartButton();
    if(btn)btn.disabled=false;
    setTimeout(()=>G('loading')?.classList.add('hidden'),180);
  }catch(err){
    console.error('Ошибка предварительной загрузки:',err);
    preloadDone=true;
    if(btn)btn.disabled=false;
    setLoadingProgress(100,'Загрузка завершена с упрощённой подготовкой');
    setTimeout(()=>G('loading')?.classList.add('hidden'),300);
  }
}
function applyRuntimeSave(data){
  if(!data)return;
  const requestedW=Math.max(0,Math.min(WEAPONS.length-1,Number(data.curW)||0));
  hardResetPlayerBuild();
  (data.perks||[]).forEach(applySavedPerk);
  applyPathMilestones();
  level=Math.max(1,Math.min(30,data.level||1));
  xp=Math.max(xpFor(level),data.xp||0);
  score=Math.max(0,data.score||0);
  kills=Math.max(0,data.kills||0);
  allyKills=data.v>=25?Math.max(0,data.allyKills||0):0;
  enemyKills=data.v>=25?Math.max(0,data.enemyKills||0):0;
  armor=Math.max(0,Math.min(plr.maxArmor,data.armor||0));
  hp=Math.max(1,Math.min(data.hp==null?plr.maxHp:data.hp,plr.maxHp));
  playerMineCD=Math.max(0,Math.min(MINE_COOLDOWN_SECONDS,Number(data.playerMineCD)||0));
  playerBombCD=Math.max(0,Math.min(BOMB_COOLDOWN_SECONDS,Number(data.playerBombCD)||0));
  playerSmokeCD=Math.max(0,Math.min(SMOKE_COOLDOWN_SECONDS,Number(data.playerSmokeCD)||0));
  mineHudSecond=-1;bombHudSecond=-1;smokeHudSecond=-1;

  weaponOwned.fill(false);
  if(data.v>=26&&Array.isArray(data.weaponOwned)){
    for(let i=0;i<WEAPONS.length;i++)weaponOwned[i]=!!data.weaponOwned[i];
  }else{
    weaponOwned[0]=true;
    weaponOwned[requestedW]=true;
  }
  weaponOwned[0]=true;

  const legacyReserve=Math.max(50,Math.min(400,Math.floor(Number(data.uAmmo)||120)));
  for(let i=0;i<WEAPONS.length;i++){
    if(!weaponOwned[i]){weaponAmmo[i]=0;weaponReserve[i]=0;continue;}
    const savedMag=Array.isArray(data.weaponAmmo)?data.weaponAmmo[i]:undefined;
    const fallbackMag=i===0?(STARTING_AMMO[0]||WEAPONS[0].clip):WEAPONS[i].clip;
    weaponAmmo[i]=Math.max(0,Math.min(WEAPONS[i].clip,savedMag==null?fallbackMag:savedMag));
    const savedReserve=data.v>=26&&Array.isArray(data.weaponReserve)?data.weaponReserve[i]:undefined;
    const fallbackReserve=i===requestedW?legacyReserve:(i===0?STARTING_RESERVE[0]:0);
    weaponReserve[i]=Math.max(0,Math.min(WEAPONS[i].reserveCap??9999,savedReserve==null?fallbackReserve:savedReserve));
  }

  curW=ownsWeapon(requestedW)?requestedW:0;
  lastW=curW;
  ammo=Math.max(0,Math.min(getW().clip,data.v>=26&&requestedW===curW&&data.ammo!=null?data.ammo:weaponAmmo[curW]));
  weaponAmmo[curW]=ammo;
  uAmmo=weaponReserve[curW];
  buildGun(getW());
  if(data.player){
    const px=Math.max(-89,Math.min(89,Number(data.player.x)||0));
    const pz=Math.max(-89,Math.min(89,Number(data.player.z)||0));
    const coll=collideWalls(px,pz,PLR_R);
    camera.position.x=coll.x;camera.position.z=coll.z;
    yaw=Number.isFinite(data.player.yaw)?data.player.yaw:0;
    pitch=Number.isFinite(data.player.pitch)?data.player.pitch:0;
    prevPX=camera.position.x;prevPZ=camera.position.z;
  }
  updatePerkPanel();updateStats();buildWeaponBar();updateWeaponBar();wHUD();markHUD();flushHUD();xpHUD();updateTeamScore();
  saveProgress(true);
}
function switchW(idx){
  if(!Number.isInteger(idx)||idx<0||idx>=WEAPONS.length||idx===curW)return;
  if(!ownsWeapon(idx)){showMsg('🔒 '+WEAPONS[idx].label+' ещё не найдено — подберите его на карте');return;}
  syncCurrentAmmo();
  if(typeof zooming!=='undefined')zooming=false;
  adsBlend=0;weaponBloom=0;shotSequence=0;shotResetT=0;
  cycleT=0;cycleTot=0;cycleKind='';cycleEjected=false;sprintBlend=0;sprintExitT=0;wasWeaponSprinting=false;
  lastW=curW;
  curW=idx;
  const w=getW();
  ammo=Math.max(0,Math.min(w.clip,weaponAmmo[idx]??0));
  uAmmo=Math.max(0,Math.min(w.reserveCap??9999,weaponReserve[idx]??0));
  reloading=false;reloadT=0;reloadTot=0;reloadMode='mag';reloadShellLoaded=0;
  weaponEquipTot=w.equipTime||.32;weaponEquipT=weaponEquipTot;weaponReadyT=weaponEquipTot;
  playSfx('equip');
  G('rmsg').style.opacity='0';G('reload-wrap').style.display='none';
  buildGun(w);wHUD();updateWeaponBar();
  G('mines-panel').style.display=(w.isMine||w.isBomb)?'block':'none';
  updateMineHUD();
}
function quickSwitchWeapon(){
  if(lastW!==curW&&ownsWeapon(lastW)){switchW(lastW);return;}
  const idx=weaponOwned.findIndex((owned,i)=>owned&&i!==curW);
  if(idx>=0)switchW(idx);
}


function isLandscape(){return innerWidth>=innerHeight;}
function updateOrientationState(){ portraitBlocked=false; }
function refreshMobileHUD(){
  const show=false;
  G('mobile-controls').classList.toggle('on',show);
}
function setMobileFire(v){mobileInput.fire=v; if(!v) autoFireT=0;}
function resetMoveStick(){
  mobileInput.moveId=null;mobileInput.moveX=0;mobileInput.moveY=0;
  const stick=G('joy-stick'); if(stick){stick.style.left='33%';stick.style.top='33%';}
}
function updateMoveStick(clientX,clientY){
  const pad=G('mobile-left'); const stick=G('joy-stick'); if(!pad||!stick)return;
  const rect=pad.getBoundingClientRect();
  const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
  const dx=clientX-cx, dy=clientY-cy;
  const max=rect.width*0.28;
  let nx=dx/max, ny=dy/max;
  const len=Math.hypot(nx,ny)||1;
  if(len>1){nx/=len;ny/=len;}
  mobileInput.moveX=nx;
  mobileInput.moveY=ny;
  const sx=(nx*max)+(rect.width*0.33), sy=(ny*max)+(rect.height*0.33);
  stick.style.left=(sx/rect.width*100)+'%';
  stick.style.top=(sy/rect.height*100)+'%';
}
function beginLook(clientX,clientY){
  mobileInput.lookActive=true;mobileLookPrevX=clientX;mobileLookPrevY=clientY;
}
function updateLook(clientX,clientY){
  const dx=clientX-mobileLookPrevX,dy=clientY-mobileLookPrevY;
  mobileLookPrevX=clientX;mobileLookPrevY=clientY;
  const sens=MOBILE_LOW?0.0042:0.0036;
  yaw-=dx*sens;
  pitch=Math.max(-1.2,Math.min(1.2,pitch-dy*sens));
}
function tryLockLandscape(){
  if(screen.orientation&&screen.orientation.lock){
    screen.orientation.lock('landscape').catch(()=>{});
  }
}
function tryFullscreen(){
  const el=document.documentElement;
  if(el.requestFullscreen&&!document.fullscreenElement){
    el.requestFullscreen().catch(()=>{});
  }
}
function setGameCursorHidden(hidden){
  const shouldHide=!!hidden;
  document.body.classList.toggle('cursor-hidden',shouldHide);
  canvas.style.cursor=shouldHide?'none':'default';
}
function clearPointerLockRequest(){
  pointerLockRequestPending=false;
  if(pointerLockRequestTimer){clearTimeout(pointerLockRequestTimer);pointerLockRequestTimer=0;}
}
function showPauseUI(){
  if(dying||perkPickOpen||lvlAnnOpen)return;
  clearPointerLockRequest();
  paused=true;running=false;mouseDown=false;zooming=false;setMobileFire(false);
  setGameCursorHidden(false);
  G('pause').classList.add('on');refreshMobileHUD();
}
function requestGamePointerLock(){
  if(IS_TOUCH||dying||perkPickOpen||lvlAnnOpen)return;
  if(document.pointerLockElement===canvas){
    clearPointerLockRequest();setGameCursorHidden(true);return;
  }
  if(pointerLockRequestPending)return;
  pointerLockRequestPending=true;
  // В обычном меню курсор остаётся видимым до успешного захвата. Если меню уже
  // закрыто (например, после выбора улучшения), скрываем курсор на время запроса.
  const interactiveMenuVisible=G('menu').style.display!=='none'||G('pause').classList.contains('on')||G('perk-menu').classList.contains('on');
  if(!interactiveMenuVisible)setGameCursorHidden(true);
  try{
    const result=canvas.requestPointerLock();
    if(result&&typeof result.catch==='function')result.catch(()=>{
      clearPointerLockRequest();
      if(!dying&&!perkPickOpen&&!lvlAnnOpen)showPauseUI();
    });
    pointerLockRequestTimer=setTimeout(()=>{
      if(pointerLockRequestPending&&document.pointerLockElement!==canvas){
        clearPointerLockRequest();
        if(!dying&&!perkPickOpen&&!lvlAnnOpen)showPauseUI();
      }
    },1200);
  }catch(err){
    clearPointerLockRequest();showPauseUI();
  }
}
function resumeGameFromPause(){
  if(dying||perkPickOpen||lvlAnnOpen)return;
  mouseDown=false;zooming=false;lastT=performance.now();refreshMobileHUD();
  G('pause').classList.remove('on');
  if(IS_TOUCH){paused=false;running=true;return;}
  // Сразу закрываем меню, но запускаем игру только после успешного захвата мыши.
  // При ошибке requestGamePointerLock снова откроет меню паузы.
  setGameCursorHidden(true);
  paused=true;running=false;
  requestGamePointerLock();
}
function startOrResumeGame(){
  if(!preloadDone){
    setLoadingProgress(90,'Завершается подготовка игры...');
    G('loading')?.classList.remove('hidden');
    return;
  }
  if(IS_TOUCH){
    tryFullscreen();tryLockLandscape();
    G('menu').style.display='none';G('pause').classList.remove('on');
    if(!running&&!dying&&!lvlAnnOpen&&!perkPickOpen){
      running=true;paused=false;lastT=performance.now();
      activatePreparedGame();
      wHUD();markHUD();flushHUD();xpHUD();updateStats();respawnShieldT=PLAYER_SPAWN_SHIELD_TIME;deathReason='';
    }else if(paused){resumeGameFromPause();}
    mobileStarted=true;refreshMobileHUD();updateOrientationState();
  }else{
    requestGamePointerLock();
  }
}
