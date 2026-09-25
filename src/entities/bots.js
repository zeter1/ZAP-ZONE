'use strict';

// ─── ENEMY / ALLY BOT AI ────────────────
// ═══════════════════════════════════════════

const ETYPES=[
  {skin:0xdda87c,cloth:0x8a8070,arm:0x778866,spd:3.8, hp:120,  sRange:0,  sCD:3.5,dmg:0,   acc:.055},
  {skin:0xdda87c,cloth:0x882222,arm:0x553322,spd:3.15,hp:155, sRange:38, sCD:2.2,dmg:30,  acc:.045},
  {skin:0xaacc88,cloth:0x226622,arm:0x115520,spd:4.8, hp:135, sRange:30, sCD:1.8,dmg:22,  acc:.058},
  {skin:0xcc8844,cloth:0x881100,arm:0xaa2211,spd:2.15,hp:300, sRange:50, sCD:2.5,dmg:50,  acc:.035},
  {skin:0xcc88ee,cloth:0x6622aa,arm:0x4411cc,spd:3.45,hp:210, sRange:45, sCD:2.0,dmg:35,  acc:.040},
  {skin:0xddaa88,cloth:0x442211,arm:0x221100,spd:4.0, hp:175, sRange:35, sCD:1.6,dmg:28,  acc:.050},
];

const enemies=[];
let allyKills=0,enemyKills=0;

function lvlHpMult(){ return 1 + level * 0.06; }
function lvlDmgMult(){ return 1 + level * 0.06; }
function lvlSpdMult(){ return 1 + level * 0.02; }


function mkHuman(et,team){
  const g=new THREE.Group();const pts=[];
  const ally=team==='ally';
  const clothCol=ally?0x173f86:et.cloth;
  const armCol=ally?0x2f73c9:et.arm;
  const suitDark=ally?0x0b1c32:0x281016;
  const glowCol=ally?0x43c9ff:0xff3c58;

  // Gameplay hit meshes. Their order is intentionally unchanged.
  const A=(geo,col,x,y,z,rx=0,ry=0,rz=0)=>{
    const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:col,roughness:.62,metalness:.10}));
    m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;g.add(m);pts.push(m);return m;
  };
  A(new THREE.SphereGeometry(.22,8,6),et.skin,0,1.82,0);
  const helm=new THREE.Mesh(
    new THREE.SphereGeometry(.245,8,5,0,Math.PI*2,0,Math.PI/2),
    new THREE.MeshStandardMaterial({color:armCol,roughness:.30,metalness:.62})
  );
  helm.position.set(0,1.88,0);helm.castShadow=true;g.add(helm);pts.push(helm);
  A(new THREE.BoxGeometry(.52,.70,.28),clothCol,0,1.25,0);
  A(new THREE.BoxGeometry(.44,.22,.24),clothCol,0,.88,0);
  A(new THREE.BoxGeometry(.14,.52,.14),clothCol,-.35,1.22,0,0,0,.18);
  A(new THREE.BoxGeometry(.14,.52,.14),clothCol,.35,1.22,0,0,0,-.18);
  A(new THREE.BoxGeometry(.11,.42,.11),et.skin,-.36,.88,0);
  A(new THREE.BoxGeometry(.11,.42,.11),et.skin,.36,.88,0);
  A(new THREE.BoxGeometry(.18,.54,.20),clothCol,-.15,.52,0);
  A(new THREE.BoxGeometry(.18,.54,.20),clothCol,.15,.52,0);
  A(new THREE.BoxGeometry(.14,.50,.16),0x22262d,-.15,.14,0);
  A(new THREE.BoxGeometry(.14,.50,.16),0x22262d,.15,.14,0);
  A(new THREE.BoxGeometry(.15,.10,.26),0x0d1116,-.15,-.05,.05);
  A(new THREE.BoxGeometry(.15,.10,.26),0x0d1116,.15,-.05,.05);

  // Decorative armor is excluded from pts[] so gameplay hitboxes do not change.
  const armorMat=new THREE.MeshStandardMaterial({color:armCol,roughness:.26,metalness:.72});
  const darkMat=new THREE.MeshStandardMaterial({color:suitDark,roughness:.48,metalness:.42});
  const glowMat=new THREE.MeshStandardMaterial({color:glowCol,roughness:.18,metalness:.48,emissive:glowCol,emissiveIntensity:.88});
  const V=(geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{
    const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=!MOBILE_LOW;g.add(m);return m;
  };

  V(new THREE.BoxGeometry(.30,.085,.26),glowMat,0,1.875,-.18,.04);
  V(new THREE.BoxGeometry(.28,.085,.08),darkMat,0,1.73,-.205,-.16);
  V(new THREE.BoxGeometry(.08,.18,.10),armorMat,-.245,1.84,-.02,0,0,.18);
  V(new THREE.BoxGeometry(.08,.18,.10),armorMat,.245,1.84,-.02,0,0,-.18);
  V(new THREE.BoxGeometry(.46,.38,.075),armorMat,0,1.33,-.178,-.03);
  V(new THREE.BoxGeometry(.25,.09,.12),darkMat,0,1.57,-.11);
  V(new THREE.BoxGeometry(.21,.14,.32),armorMat,-.36,1.43,0,0,0,.20);
  V(new THREE.BoxGeometry(.21,.14,.32),armorMat,.36,1.43,0,0,0,-.20);
  V(new THREE.BoxGeometry(.34,.09,.08),glowMat,0,1.13,-.19);
  V(new THREE.BoxGeometry(.35,.42,.15),darkMat,0,1.27,.20);
  V(new THREE.BoxGeometry(.48,.10,.30),darkMat,0,.89,0);
  V(new THREE.BoxGeometry(.18,.16,.23),armorMat,-.15,.44,-.06,.05);
  V(new THREE.BoxGeometry(.18,.16,.23),armorMat,.15,.44,-.06,.05);
  V(new THREE.BoxGeometry(.15,.10,.27),armorMat,-.15,.10,-.02);
  V(new THREE.BoxGeometry(.15,.10,.27),armorMat,.15,.10,-.02);

  const emblem=makeAssetPlane(
    ally?GAME_ASSETS.characters.ally:GAME_ASSETS.characters.enemy,
    .25,.25,{opacity:.98,depthTest:true,renderOrder:8}
  );
  emblem.position.set(0,1.36,-.219);g.add(emblem);

  const ringCol=ally?0x4aa3ff:0xff3355;
  const ringOpacity=ally?.62:.92;
  const ring=new THREE.Mesh(
    new THREE.TorusGeometry(.40,.045,5,16),
    new THREE.MeshBasicMaterial({color:ringCol,transparent:true,opacity:ringOpacity})
  );
  ring.rotation.x=Math.PI/2;ring.position.y=.02;g.add(ring);

  const weaponPivot=new THREE.Group();
  weaponPivot.position.set(.42,1.20,-.02);
  weaponPivot.rotation.set(.10,.12,-.42);
  g.add(weaponPivot);
  return{g,pts,weaponPivot};
}
const WPTS=[
  [0,0],[-20,20],[20,-20],[-20,-20],[20,20],
  [-40,5],[40,-5],[-5,-40],[5,40],[-30,-30],[30,30],[-30,30],[30,-30],
  [50,10],[-50,-10],[10,50],[-10,-50],
  [0,-55],[0,55],[-55,0],[55,0],
  [40,40],[-40,-40],[40,-40],[-40,40],
  [-65,25],[65,-25],[-25,65],[25,-65],
  [-75,0],[75,0],[0,-75],[0,75],
];


class Enemy{
  constructor(x,z,type,team){
    const et=ETYPES[type%ETYPES.length];
    this.alive=true;
    this.type=type;
    this.et=et;
    this.team=team;
    this.role=teamRoleForNextBot(team);
    this.baseHp=et.hp;
    this.baseSpeed=et.spd;
    this.baseAcc=et.acc;
    this.ph=Math.random()*Math.PI*2;

    this.aiState='patrol';this.aiT=0;this.stateCD=0;
    this.desiredYaw=0;
    this.velX=0;this.velZ=0;
    this.targetScanT=0;this.targetIsPlayer=false;
    this.reactionT=.22+Math.random()*.22;
    this.skillSeed=Math.random()*.18;
    this.aimSkill=.58+this.skillSeed;
    this.kills=0;
    this.aimPoint=new THREE.Vector3(x,1.2,z);
    this.burstLeft=2+Math.floor(Math.random()*4);
    this.burstPauseT=0;
    this.pickupTarget=null;
    this.stuckT=0;this.lastMoveX=x;this.lastMoveZ=z;
    this.sT=.18+Math.random()*.22;
    this.reloadT=0;
    this.mineCD=8+Math.random()*12;
    this.bombCD=24+Math.random()*52;
    this.mineScanT=Math.random()*.18;
    this.cachedMineThreat=null;
    this.weaponSwitchT=2.2+Math.random()*2.0;
    this.coverEvalT=.38+Math.random()*.22;
    this.coverPoint=null;
    this.levelSync=-1;
    this.lastDamageT=0;
    this.lastTargetSeenAt=0;
    this.sideBias=this.role==='flankL'?-1:this.role==='flankR'?1:(Math.random()<.5?-1:1);
    this.bravery=this.role==='assault'?1.18:this.role==='anchor'?0.88:1.0;

    this.patrolIdx=Math.floor(Math.random()*WPTS.length);
    this.ptgt=new THREE.Vector3(WPTS[this.patrolIdx][0]+(Math.random()-.5)*10,0,WPTS[this.patrolIdx][1]+(Math.random()-.5)*10);
    this.losT=.18+Math.random()*.14;this.canSeeTarget=false;
    this.targetEn=null;
    this.lastSeenT=999;
    this.lastKnown=new THREE.Vector3(x,0,z);

    this.dodgeDir=0;this.dodgeT=0;this.dodgeCD=0;this.dodgeSpd=0;
    this.strafeDir=Math.random()<.5?-1:1;this.strafeSwitchT=1.1+Math.random()*1.4;
    this.flashT=0;this.jV=0;this.jT=999;this.jCD=4+Math.random()*3;
    this.uiT=0;this.uiVis=false;this.uiX=0;this.uiY=0;
    this.rocketCheckT=.18+Math.random()*.10;

    const built=mkHuman(et,team);
    this.group=built.g;this.pts=built.pts;this.weaponPivot=built.weaponPivot;
    this.group.position.set(x,0,z);
    scene.add(this.group);

    this.hEl=document.createElement('div');
    const barCol=team==='ally'?'rgba(0,40,100,.7)':'rgba(60,0,0,.7)';
    this.hEl.style.cssText='position:fixed;width:48px;height:4px;background:'+barCol+';border-radius:2px;pointer-events:none;z-index:5;display:none;';
    this.hFill=document.createElement('div');
    this.hFill.style.cssText='height:100%;border-radius:2px;width:100%;background:'+(team==='ally'?'#4488ff':'#44ff44')+';';
    this.hEl.appendChild(this.hFill);document.getElementById('ui').appendChild(this.hEl);
    this.wEl=document.createElement('div');
    this.wEl.style.cssText='position:fixed;font-size:11px;pointer-events:none;z-index:5;display:none;background:rgba(0,0,0,.55);padding:1px 3px;border-radius:3px;';
    document.getElementById('ui').appendChild(this.wEl);

    this.weapon=chooseBotWeaponByDistance(22,-1,true,this.role);
    this.mag=this.weapon.clip;
    this.syncScale(true);
    this.updateBadge();
    refreshBotWeaponVisual(this);
  }

  updateBadge(){
    const icon=this.weapon?.icon||'🔫';
    const badge=this.team==='ally'?GAME_ASSETS.characters.ally:GAME_ASSETS.characters.enemy;
    this.wEl.innerHTML='<img class="bot-badge-icon" src="'+badge+'" alt=""><span>'+icon+'</span>';
  }

  syncScale(force=false){
    if(!force&&this.levelSync===level)return;
    const oldMax=this.maxHp||1;
    const oldHp=this.hp||oldMax;
    const hpRatio=force?1:Math.max(.24,Math.min(1,oldHp/oldMax));
    const roleHp=this.role==='anchor'?1.18:this.role==='assault'?1.02:this.role==='engineer'?1.10:1.05;
    const roleSpd=(this.role==='flankL'||this.role==='flankR')?1.12:(this.role==='anchor'?.96:1.03);
    const roleDmg=this.role==='anchor'?1.10:(this.role==='engineer'?1.02:1.06);
    const lvl=Math.max(1,level);
    const dominance=Math.min(.55,kills*.009);
    const combatGrowth=Math.min(.28,kills*.0045);
    this.aimSkill=Math.min(.97,.58+this.skillSeed+lvl*.013+Math.min(.13,kills*.0018));
    this.maxHp=this.baseHp*(1.08+lvl*.082+dominance)*roleHp;
    this.hp=force?this.maxHp:Math.min(this.maxHp,this.maxHp*hpRatio+Math.max(10,this.maxHp*.05));
    this.speed=this.baseSpeed*(1.02+lvl*.016+Math.min(.20,kills*.0032))*roleSpd;
    this.baseDmgMul=(.86+this.type*.06)*(1+lvl*.038+combatGrowth)*roleDmg;
    this.curAcc=Math.max(.0075,this.baseAcc*(1.03-Math.min(lvl*.019,.58)-Math.min(.18,kills*.0022))*(this.role==='anchor'?.82:1));
    this.fireRateMul=Math.max(.62,1.08-lvl*.013-Math.min(.20,kills*.0025))*(this.role==='assault'?.92:1);
    this.levelSync=level;
  }

  chooseWeapon(distHint=22,force=false){
    const prev=this.weapon?this.weapon.idx:-1;
    this.weapon=chooseBotWeaponByDistance(distHint,prev,force,this.role);
    if(force||this.mag<=0||this.mag>this.weapon.clip)this.mag=this.weapon.clip;
    this.weaponSwitchT=4.5+Math.random()*4.0;
    this.updateBadge();
    refreshBotWeaponVisual(this);
  }

  findTarget(){
    this.targetScanT-=this._lastDt||.016;
    const mx=this.group.position.x,mz=this.group.position.z;
    if(this.targetScanT>0){
      if(this.targetEn&&this.targetEn.alive)return Math.hypot(this.targetEn.group.position.x-mx,this.targetEn.group.position.z-mz);
      if(this.targetIsPlayer&&!dying)return Math.hypot(camera.position.x-mx,camera.position.z-mz);
    }
    const prev=this.targetEn,prevPlayer=this.targetIsPlayer;
    let bestScore=Infinity,bestE=null,bestPlayer=false;
    for(const e of enemies){
      if(!e.alive||e===this)continue;
      const dx=e.group.position.x-mx,dz=e.group.position.z-mz;
      const d=Math.sqrt(dx*dx+dz*dz);
      const wounded=(1-e.hp/e.maxHp)*3.4;
      const crowdPenalty=Math.max(0,countTargeters(e,this.team)-1)*2.6;
      const roleBias=e.role==='anchor'?-1.2:e.role==='engineer'?-1.8:0;
      const score=d-wounded+crowdPenalty+roleBias;
      if(score<bestScore){bestScore=score;bestE=e;bestPlayer=false;}
    }
    if(!dying){
      const d=Math.hypot(camera.position.x-mx,camera.position.z-mz);
      const playerThreat=Math.min(9,kills*.085+level*.20);
      const focused=countPlayerTargeters(this.team,this);
      const crowdPenalty=focused>=2?8+(focused-2)*5:focused*1.8;
      const score=d-1.0-playerThreat+crowdPenalty;
      if(score<bestScore){bestScore=score;bestE=null;bestPlayer=true;}
    }
    this.targetEn=bestE;this.targetIsPlayer=bestPlayer;
    this.targetScanT=.18+Math.random()*.22;
    if(prev!==bestE||prevPlayer!==bestPlayer){
      this.reactionT=.12+(1-this.aimSkill)*.55+Math.random()*.14;
      this.burstPauseT=Math.max(this.burstPauseT,.08);
    }
    if(bestE)return Math.hypot(bestE.group.position.x-mx,bestE.group.position.z-mz);
    if(bestPlayer)return Math.hypot(camera.position.x-mx,camera.position.z-mz);
    return 999;
  }

  getTargetPos(){
    if(this.targetEn&&this.targetEn.alive)return this.targetEn.group.position;
    if(this.targetIsPlayer&&!dying)return camera.position;
    return null;
  }

  getAimPoint(tp){
    const aim=tp.clone();
    if(this.targetEn&&this.targetEn.alive)aim.y+=1.26;
    else aim.y=camera.position.y-.10;
    const dist=Math.max(1,this.group.position.distanceTo(tp));
    let lead=0;
    if(this.weapon.isRocket)lead=Math.min(1.05,dist/BOT_ROCKET_SPEED)*(.72+this.aimSkill*.20);
    else if(this.weapon.key==='plasma')lead=Math.min(.42,dist/TRACER_SPEED.plasma)*.45;
    const vx=this.targetEn&&this.targetEn.alive?(this.targetEn.velX||0):plrVx;
    const vz=this.targetEn&&this.targetEn.alive?(this.targetEn.velZ||0):plrVz;
    aim.x+=vx*lead;aim.z+=vz*lead;
    const smooth=.16+this.aimSkill*.18;
    if(!Number.isFinite(this.aimPoint.x))this.aimPoint.copy(aim);
    this.aimPoint.lerp(aim,smooth);
    return this.aimPoint.clone();
  }

  getMuzzlePos(){
    const fwd=new THREE.Vector3(Math.sin(this.group.rotation.y),0,Math.cos(this.group.rotation.y));
    const mp=this.group.position.clone();
    mp.y+=1.22;
    mp.addScaledVector(fwd,.96);
    return mp;
  }

  triggerDodge(){
    if(this.dodgeCD>0||this.dodgeT>0)return;
    this.dodgeDir=Math.random()<.5?-1:1;
    this.dodgeT=0.40+Math.random()*.30;
    this.dodgeSpd=this.speed*(2.35+this.aimSkill*.65);
    this.dodgeCD=.78+Math.random()*.58;
    if(Math.random()<0.16&&this.jV===0)this.jV=4.6+Math.random()*1.6;
  }

  startReload(){if(this.reloadT<=0)this.reloadT=this.weapon.reload*(0.86+Math.random()*.18);}
  finishReload(){this.mag=this.weapon.clip;this.reloadT=0;}

  maybePlantMine(dist,tp){
    if(this.mineCD>0||!this.canSeeTarget||!tp||dist>BOT_MINE_CFG.triggerRange)return false;
    if(mines.length>=MAX_MINES||countTeamMines(this.team)>=BOT_MAX_TEAM_MINES)return false;
    let chance=dist<6?.42:dist<9?.30:.18;
    if(this.role==='engineer')chance*=1.55;
    if(this.role==='anchor')chance*=0.65;
    if(Math.random()>chance)return false;
    const dir=new THREE.Vector3(Math.sin(this.group.rotation.y),0,Math.cos(this.group.rotation.y));
    const m=mkMine();
    m.position.copy(this.group.position.clone().addScaledVector(dir,.65));
    scene.add(m);
    mines.push({m,vx:dir.x*2.2,vy:3.2,vz:dir.z*2.2,fall:true,life:Infinity,armed:false,aT:.95+Math.random()*.45,checkT:.08+Math.random()*.10,ph:0,team:'bot',owner:'bot',src:this,dmg:BOT_MINE_CFG.dmg*BOT_DAMAGE_BOOST*EXPLOSION_DAMAGE_BOOST*this.baseDmgMul});
    this.mineCD=BOT_MINE_CFG.cooldown;
    return true;
  }

  maybePlantBomb(dist,tp){
    if(this.bombCD>0||!this.canSeeTarget||!tp)return false;
    if(dist<BOT_BOMB_CFG.minRange||dist>BOT_BOMB_CFG.maxRange)return false;
    if(mines.length>=MAX_MINES||activeBombCount()>=BOT_MAX_ACTIVE_BOMBS)return false;
    const pos=this.group.position.clone();
    if(bombNearPoint(pos,24))return false;
    let chance=this.role==='engineer'?.19:this.role==='anchor'?.12:.075;
    chance*=1+Math.min(.65,level*.018+kills*.002);
    if(Math.random()>chance)return false;
    const dir=new THREE.Vector3(Math.sin(this.group.rotation.y),0,Math.cos(this.group.rotation.y));
    const m=mkBomb();
    const bp=this.group.position.clone().addScaledVector(dir,1.05);
    const coll=collideWalls(bp.x,bp.z,.42);m.position.set(coll.x,.34,coll.z);scene.add(m);
    mines.push({
      m,vx:0,vy:0,vz:0,fall:false,life:Infinity,armed:true,aT:0,checkT:0,ph:0,
      team:'bot',owner:'bot',src:this,kind:'bomb',fuseT:BOMB_FUSE_SECONDS,fuseTotal:BOMB_FUSE_SECONDS,
      dmg:BOT_BOMB_CFG.dmg*(1+level*.018),radius:BOT_BOMB_CFG.radius
    });
    this.bombCD=BOT_BOMB_CFG.cooldown+Math.random()*24;
    return true;
  }

  dealDamageToCurrentTarget(amount,dir){
    if(amount<=0)return;
    if(this.targetEn&&this.targetEn.alive){
      this.targetEn.hurt(amount,dir,this.team);
      if(!this.targetEn.alive){
        this.kills=(this.kills||0)+1;
        enemyKills++;
        updateTeamScore();
      }
      return;
    }
    if(this.targetIsPlayer)applyDamageToPlayer(amount*ENEMY_VS_PLAYER_DAMAGE_SCALE,'bullet',this);
  }

  doShoot(tp,dist){
    const wp=this.weapon;
    const from=this.getMuzzlePos();
    const aim=this.getAimPoint(tp);
    if(wallBetween(from,aim,losMeshes)||smokeBlocksSight(from,aim)){
      if(Math.random()<.20){
        const missDir=aim.clone().sub(from).normalize();
        const missCol=this.team==='ally'?0x8cbcff:wp.bCol;
        if(wp.hitscan)spawnInstantSniperTrace(from,missDir,Math.min(dist,18),missCol);
        else spawnTracer(from,missDir,Math.min(dist,18),missCol,wp.key);
      }
      return;
    }

    let dir=aim.clone().sub(from).normalize();
    const acc=wp.isRocket?(this.curAcc*.50+wp.spread*.45):(this.curAcc*.40+wp.spread*.78);
    dir.x+=(Math.random()-.5)*acc;
    dir.y+=(Math.random()-.5)*acc*.28;
    dir.z+=(Math.random()-.5)*acc;
    dir.normalize();

    const shotCol=this.team==='ally'?0x8cbcff:wp.bCol;
    if(friendlyInLine(from,dir,this.team,Math.max(2,dist*.88))){
      this.sT=.10+Math.random()*.12;
      return;
    }
    if(wp.isRocket&&(dist<10||friendlyNearPoint(aim,this.team,5.2))){
      this.weaponSwitchT=0;
      this.sT=.18;
      return;
    }
    trigMuzzle(from,shotCol,wp.isRocket?1.45:wp.isSniper?1.38:wp.key==='shotgun'?1.2:1);
    if(wp.key!=='rocket'&&wp.key!=='plasma'){
      const q=new THREE.Quaternion().setFromAxisAngle(_UP,this.group.rotation.y);
      ejectCasing(from.clone().add(new THREE.Vector3(0,.08,0)),q,wp.key==='shotgun');
    }

    if(wp.isRocket){
      spawnERkt(from,dir,wp.dmg*BOT_DAMAGE_BOOST*EXPLOSION_DAMAGE_BOOST*this.baseDmgMul,this.team,this);
      this.mag--;
      return;
    }

    const pellets=wp.pellets||1;
    const distanceDamageScale=weaponDamageScaleAtDistance(wp,dist);
    let totalDmg=0;
    let tracerDir=dir.clone();
    for(let i=0;i<pellets;i++){
      const pd=dir.clone();
      if(pellets>1){
        const pe=wp.spread*(0.65+dist/Math.max(10,wp.range)*0.75);
        pd.x+=(Math.random()-.5)*pe;
        pd.y+=(Math.random()-.5)*pe*.34;
        pd.z+=(Math.random()-.5)*pe;
        pd.normalize();
        if(i===0)tracerDir.copy(pd);
      }
      const rangePenalty=dist/(wp.range*1.55);
      const movingPenalty=(Math.abs(plrVx)+Math.abs(plrVz))*0.01;
      let hitChance=Math.max(.10,Math.min(.982,wp.hitBias-rangePenalty-Math.random()*this.curAcc-movingPenalty));
      if(this.targetEn&&this.targetEn.alive){
        if(Math.random()<hitChance){
          const crit=Math.random()<.10?1.35:1;
          totalDmg+=wp.dmg*distanceDamageScale*BOT_DAMAGE_BOOST*this.baseDmgMul*(pellets>1?.58:1)*crit;
        }
      }else if(this.team==='enemy'){
        const toPlr=new THREE.Vector3(camera.position.x-from.x,camera.position.y-from.y,camera.position.z-from.z).normalize();
        const align=pd.dot(toPlr);
        hitChance*=0.72;
        const requiredAlign=pellets>1?.905:.958;
        if(Math.random()<hitChance&&align>requiredAlign){
          totalDmg+=wp.dmg*distanceDamageScale*BOT_DAMAGE_BOOST*this.baseDmgMul*(pellets>1?.46:.88);
        }
      }
    }

    if(wp.hitscan)spawnInstantSniperTrace(from,tracerDir,Math.min(dist,wp.range+10),shotCol);
    else spawnTracer(from,tracerDir,Math.min(dist,wp.range+10),shotCol,wp.key);
    if(totalDmg>0)this.dealDamageToCurrentTarget(totalDmg,tracerDir);
    this.mag--;
  }

  update(dt){
    if(!this.alive)return false;
    this.syncScale();
    this.ph+=dt*3;
    if(this.lastDamageT>0)this.lastDamageT-=dt;

    if(this.flashT>0){this.flashT-=dt;if(this.flashT<=0)this.pts.forEach(p=>{if(p.material&&p.material.emissive)p.material.emissive.setRGB(0,0,0);});}

    if(this.jV!==0||this.group.position.y>0){
      this.jV-=22*dt;this.group.position.y+=this.jV*dt;
      if(this.group.position.y<=0){this.group.position.y=0;this.jV=0;}
    }

    if(this.dodgeCD>0)this.dodgeCD-=dt;
    if(this.mineCD>0)this.mineCD-=dt;
    if(this.bombCD>0)this.bombCD-=dt;
    if(this.reloadT>0){this.reloadT-=dt;if(this.reloadT<=0)this.finishReload();}

    this._lastDt=dt;
    if(this.reactionT>0)this.reactionT-=dt;
    if(this.burstPauseT>0)this.burstPauseT-=dt;
    this.findTarget();
    const targetPos=this.getTargetPos();
    if(!targetPos)this.aiState='patrol';

    const myX=this.group.position.x,myZ=this.group.position.z;
    let dx=0,dz=0,dist=999;
    if(targetPos){dx=targetPos.x-myX;dz=targetPos.z-myZ;dist=Math.sqrt(dx*dx+dz*dz)+0.001;}

    this.mineScanT-=dt;
    if(this.mineScanT<=0){
      this.mineScanT=.16+Math.random()*.12;
      this.cachedMineThreat=nearestHostileMine(this.group.position,this.team,this.role==='engineer'?18:20,this);
    }
    const mineThreat=this.cachedMineThreat&&!this.cachedMineThreat.mine.removed?this.cachedMineThreat:null;
    if(mineThreat&&this.dodgeT<=0){
      this.aiState='retreat';
      this.stateCD=.45;
      this.coverPoint=null;
    }

    this.weaponSwitchT-=dt;
    if(targetPos&&(this.weaponSwitchT<=0||dist>this.weapon.range*1.18||(dist<8&&this.weapon.isRocket)||(this.weapon.key==='shotgun'&&dist>22))){
      this.chooseWeapon(dist,false);
    }

    this.losT-=dt;
    if(this.losT<=0&&targetPos){
      this.losT=this.team==='ally' ? (.16+Math.random()*.09) : (.22+Math.random()*.12);
      const eye=this.group.position.clone();eye.y+=1.48;
      const th=targetPos.clone();th.y+=(this.targetEn&&this.targetEn.alive)?1.24:0;
      const sawBefore=this.canSeeTarget;
      this.canSeeTarget=!wallBetween(eye,th,losMeshes)&&!smokeBlocksSight(eye,th);
      if(this.canSeeTarget){
        this.lastKnown.copy(targetPos);this.lastSeenT=0;this.lastTargetSeenAt=performance.now();
        TEAM_INTEL[this.team].pos.copy(targetPos);TEAM_INTEL[this.team].time=performance.now();TEAM_INTEL[this.team].target=this.targetEn||'player';
        if(!sawBefore)this.reactionT=Math.max(this.reactionT,.12+(1-this.aimSkill)*.32);
      }
    }
    this.lastSeenT+=dt;
    const hpPct=this.hp/this.maxHp;
    if(this.mag<=Math.max(1,Math.ceil(this.weapon.clip*.22))&&!this.reloadT&&(!this.canSeeTarget||dist>this.weapon.opt*1.15))this.startReload();
    if((hpPct<.38||(hpPct<.56&&this.reloadT>0))&&(!this.pickupTarget||!this.pickupTarget.m.visible)){
      this.pickupTarget=nearestVisiblePickup('hp',this.group.position,30);
    }

    this.coverEvalT-=dt;
    if(this.coverEvalT<=0&&targetPos){
      const needCover=(!this.canSeeTarget&&dist>10)||(hpPct<0.52)||(this.reloadT>0)||(this.role==='anchor'&&dist>12)||(this.lastDamageT>0&&dist>8);
      this.coverPoint=needCover?findCoverPoint(this.group.position,targetPos,this.sideBias):null;
      this.coverEvalT=.85+Math.random()*.55;
    }

    this.aiT+=dt;this.stateCD-=dt;
    if(this.stateCD<=0&&targetPos){
      if(this.pickupTarget&&this.pickupTarget.m.visible&&hpPct<.48)this.aiState='resupply';
      else if(hpPct<0.25&&dist<20)this.aiState='retreat';
      else if(this.coverPoint&&(!this.canSeeTarget||this.role==='anchor'||this.reloadT>0))this.aiState='cover';
      else if(this.canSeeTarget&&dist<=this.weapon.range*(this.team==='ally'?1.14:1.08))this.aiState='engage';
      else if(this.lastSeenT<9&&dist>3)this.aiState='hunt';
      else this.aiState='patrol';
      this.stateCD=.22+Math.random()*.30;
    }

    let mx=0,mz=0;
    const spd=this.speed;
    if(mineThreat){
      const awayX=this.group.position.x-mineThreat.mine.m.position.x;
      const awayZ=this.group.position.z-mineThreat.mine.m.position.z;
      const md=Math.max(.001,Math.hypot(awayX,awayZ));
      mx=(awayX/md)*spd*1.55;
      mz=(awayZ/md)*spd*1.55;
      this.desiredYaw=Math.atan2(awayX,awayZ);
    }else if(this.dodgeT>0&&targetPos){
      this.dodgeT-=dt;
      const px=-dz/dist,pz=dx/dist;
      mx=px*this.dodgeDir*this.dodgeSpd;mz=pz*this.dodgeDir*this.dodgeSpd;
      this.desiredYaw=Math.atan2(dx,dz);
    }else switch(this.aiState){
      case 'patrol':{
        const wx=this.ptgt.x-myX,wz=this.ptgt.z-myZ,wd=Math.sqrt(wx*wx+wz*wz);
        if(wd<3){
          this.patrolIdx=(this.patrolIdx+1+Math.floor(Math.random()*3))%WPTS.length;
          const wp=WPTS[this.patrolIdx];
          this.ptgt.set(wp[0]+(Math.random()-.5)*8,0,wp[1]+(Math.random()-.5)*8);
        }else{mx=(wx/wd)*spd*.64;mz=(wz/wd)*spd*.64;this.desiredYaw=Math.atan2(wx,wz);} 
        break;
      }
      case 'cover':{
        if(this.coverPoint){
          const cx=this.coverPoint.x-myX,cz=this.coverPoint.z-myZ,cd=Math.sqrt(cx*cx+cz*cz)+0.001;
          if(cd>1.4){mx=(cx/cd)*spd*.98;mz=(cz/cd)*spd*.98;}
          else if(targetPos){this.aiState='engage';this.stateCD=.22;}
          if(targetPos)this.desiredYaw=Math.atan2(dx,dz);
        }
        break;
      }
      case 'hunt':{
        let tx=this.canSeeTarget&&targetPos?targetPos.x:this.lastKnown.x;
        let tz=this.canSeeTarget&&targetPos?targetPos.z:this.lastKnown.z;
        const intel=TEAM_INTEL[this.team];
        if(!this.canSeeTarget&&performance.now()-intel.time<4500){
          tx=intel.pos.x;tz=intel.pos.z;
        }
        if(this.role==='flankL'||this.role==='flankR'){
          const sign=this.role==='flankL'?-1:1;
          const fd=Math.max(1,dist);
          tx+=(-dz/fd)*(10+Math.min(8,dist*.12))*sign;
          tz+=(dx/fd)*(10+Math.min(8,dist*.12))*sign;
        }
        const hx=tx-myX,hz=tz-myZ,hd=Math.sqrt(hx*hx+hz*hz)+0.001;
        if(hd>2){mx=(hx/hd)*spd*1.06;mz=(hz/hd)*spd*1.06;this.desiredYaw=Math.atan2(hx,hz);} 
        break;
      }
      case 'engage':{
        if(!targetPos)break;
        this.desiredYaw=Math.atan2(dx,dz);
        this.strafeSwitchT-=dt;
        if(this.strafeSwitchT<=0){this.strafeDir*=-1;this.strafeSwitchT=.55+Math.random()*.75;}
        const px=-dz/dist,pz=dx/dist;
        let optRange=this.weapon.opt*(this.role==='anchor'?1.24:this.role==='assault'?0.78:1.0);
        if(this.role==='engineer')optRange*=0.92;
        mx=px*this.strafeDir*spd*.82;mz=pz*this.strafeDir*spd*.82;
        if(this.role==='flankL'||this.role==='flankR'){
          const sign=this.role==='flankL'?-1:1;
          mx+=px*sign*spd*.24;mz+=pz*sign*spd*.24;
        }
        if(dist<optRange*.54){mx-=(dx/dist)*spd*.52*this.bravery;mz-=(dz/dist)*spd*.52*this.bravery;}
        else if(dist>this.weapon.range*.82){mx+=(dx/dist)*spd*.70;mz+=(dz/dist)*spd*.70;}
        if(this.role==='anchor'&&this.coverPoint){
          const cdx=this.coverPoint.x-myX,cdz=this.coverPoint.z-myZ;
          mx+=cdx*.05;mz+=cdz*.05;
        }
        break;
      }
      case 'resupply':{
        const pk=this.pickupTarget;
        if(pk&&pk.m.visible){
          const hx=pk.m.position.x-myX,hz=pk.m.position.z-myZ,hd=Math.hypot(hx,hz)+.001;
          this.desiredYaw=Math.atan2(hx,hz);
          if(hd>1.05){mx=(hx/hd)*spd*1.08;mz=(hz/hd)*spd*1.08;}
          else{claimHealthPickup(this,pk);this.aiState=targetPos?'hunt':'patrol';this.stateCD=.45;}
        }else{this.pickupTarget=null;this.aiState=targetPos?'hunt':'patrol';}
        break;
      }
      case 'retreat':{
        if(targetPos){
          this.desiredYaw=Math.atan2(dx,dz);
          mx=-(dx/dist)*spd*1.24;mz=-(dz/dist)*spd*1.24;
          const px=-dz/dist,pz=dx/dist;
          mx+=px*this.sideBias*spd*.22;mz+=pz*this.sideBias*spd*.22;
          if(dist>26&&hpPct>.28){this.aiState='hunt';this.stateCD=.6;}
        }
        break;
      }
    }

    const sep=separationVector(this,3.5);
    mx+=sep.x*spd*.75; mz+=sep.z*spd*.75;

    let newX=myX+mx*dt,newZ=myZ+mz*dt;
    newX=Math.max(-93,Math.min(93,newX));newZ=Math.max(-93,Math.min(93,newZ));
    const coll=collideWalls(newX,newZ,BOT_R);
    this.group.position.x=coll.x;this.group.position.z=coll.z;
    this.velX=(this.group.position.x-myX)/Math.max(dt,.001);
    this.velZ=(this.group.position.z-myZ)/Math.max(dt,.001);
    this.group.rotation.y=lerpAngle(this.group.rotation.y,this.desiredYaw,Math.min(1,dt*(5.2+this.aimSkill*3.2)));
    const intended=Math.hypot(mx,mz);
    const moved=Math.hypot(this.group.position.x-myX,this.group.position.z-myZ);
    if(intended>.6&&moved<.015)this.stuckT+=dt;else this.stuckT=Math.max(0,this.stuckT-dt*2);
    if(this.stuckT>.55){
      this.stuckT=0;this.strafeDir*=-1;this.sideBias*=-1;this.triggerDodge();
      const wp=WPTS[(Math.random()*WPTS.length)|0];this.ptgt.set(wp[0]+(Math.random()-.5)*6,0,wp[1]+(Math.random()-.5)*6);
    }

    const mv=Math.abs(mx)+Math.abs(mz)>.05;
    const ls=mv?Math.sin(this.ph)*.28:0;
    if(this.pts[8])this.pts[8].rotation.x=ls;
    if(this.pts[9])this.pts[9].rotation.x=-ls;
    if(this.pts[4])this.pts[4].rotation.x=-ls*.5;
    if(this.pts[5])this.pts[5].rotation.x=ls*.5;
    if(this.weaponPivot){
      this.weaponPivot.rotation.x=.06+Math.sin(this.ph*1.2)*(mv?.05:.012)+(this.aiState==='engage'?.05:0);
      this.weaponPivot.rotation.y=.10+(this.aiState==='engage'?.14*this.strafeDir:0);
      this.weaponPivot.rotation.z=-.42 + (this.aiState==='engage' ? -.05*this.strafeDir : 0);
    }

    if(this.canSeeTarget&&targetPos&&dist<=this.weapon.range*1.08){
      this.sT-=dt;
      const playerFireAllowed=!(this.team==='enemy'&&this.targetIsPlayer)||canPressurePlayer(this);
      if(!playerFireAllowed&&this.sT<=0)this.sT=.20+Math.random()*.25;
      if(playerFireAllowed&&this.sT<=0&&this.reactionT<=0&&this.burstPauseT<=0){
        if(this.mag<=0&&!this.reloadT)this.startReload();
        else if(!this.reloadT){
          if(!this.weapon.isRocket&&this.maybePlantBomb(dist,targetPos)){
            this.sT=.85;
          }else if(!this.weapon.isRocket&&this.maybePlantMine(dist,targetPos)){
            this.sT=.48;
          }else{
            this.doShoot(targetPos,dist);
            this.burstLeft--;
            if(this.burstLeft<=0){
              const attackingPlayer=this.team==='enemy'&&this.targetIsPlayer;
              const base=attackingPlayer
                ? (this.weapon.isRocket||this.weapon.key==='shotgun'||this.weapon.isSniper?1:2)
                : (this.weapon.isSniper?1:(this.weapon.key==='rifle'||this.weapon.key==='plasma'?4:this.weapon.key==='pistol'?3:1));
              const extra=this.weapon.isSniper?1:(attackingPlayer?2:(this.weapon.key==='rifle'||this.weapon.key==='plasma'?5:3));
              this.burstLeft=base+Math.floor(Math.random()*extra);
              const normalPause=(this.weapon.isSniper?.72:this.weapon.isRocket?.58:this.weapon.key==='shotgun'?.34:.16)+Math.random()*(.18+(1-this.aimSkill)*.22);
              this.burstPauseT=attackingPlayer?(.42+Math.random()*.42):normalPause;
            }
            this.sT=Math.max((this.team==='enemy'&&this.targetIsPlayer)?0.095:0.055,this.weapon.rate*this.fireRateMul*(.96+Math.random()*.24));
            if(this.mag<=0)this.startReload();
          }
        }
      }
    }

    this.rocketCheckT-=dt;
    if(this.rocketCheckT<=0&&this.dodgeCD<=0&&this.dodgeT<=0){
      this.rocketCheckT=.20;
      for(const arr of [pRkts,eRkts]){
        for(const rk of arr){
          if(rk._src===this)continue;
          const rdx=rk.m.position.x-myX,rdz=rk.m.position.z-myZ;
          if(rdx*rdx+rdz*rdz<144){
            const dot=rdx*rk.vx+rdz*rk.vz;
            if(dot<0){this.triggerDodge();break;}
          }
        }
        if(this.dodgeT>0)break;
      }
    }

    this.uiT=(this.uiT||0)-dt;
    if(this.uiT<=0){
      this.uiT=0.12;
      const sv=this.group.position.clone();sv.y+=2.4;
      const proj=sv.project(camera);
      const sx=(proj.x*.5+.5)*W,sy=(-proj.y*.5+.5)*H;
      let vis=proj.z>0&&proj.z<1&&sx>-10&&sx<W+10&&sy>-10&&sy<H+10;
      if(vis){
        const eye=camera.position.clone();
        const botHead=this.group.position.clone();botHead.y+=1.5;
        if(wallBetween(eye,botHead,losMeshes)||smokeBlocksSight(eye,botHead))vis=false;
      }
      this.uiVis=vis;this.uiX=sx;this.uiY=sy;
    }

    this.hEl.style.display=this.uiVis?'block':'none';
    this.wEl.style.display=this.uiVis?'block':'none';
    if(this.uiVis){
      const sx=this.uiX,sy=this.uiY;
      this.hEl.style.left=(sx-24)+'px';this.hEl.style.top=(sy-10)+'px';
      this.hFill.style.width=(this.hp/this.maxHp*100)+'%';
      const pct=this.hp/this.maxHp;
      if(this.team==='ally')this.hFill.style.background=pct>.6?'#4488ff':pct>.3?'#5566aa':'#6644aa';
      else this.hFill.style.background=pct>.6?'#44ff44':pct>.3?'#ffaa00':'#ff2222';
      this.wEl.style.left=(sx+20)+'px';this.wEl.style.top=(sy-14)+'px';
    }

    if(this.team==='enemy'&&dist<1.02&&!this.targetEn&&!wallBetween(this.group.position.clone().setY(1.1),camera.position.clone(),losMeshes))return true;
    return false;
  }

  hurt(dmg,dir,fromTeam){
    if(!this.alive)return;
    this.hp-=dmg;
    this.flashT=.09;
    this.lastDamageT=.9;
    this.coverPoint=null;
    this.pts.forEach(p=>{if(p.material&&p.material.emissive)p.material.emissive.setRGB(1,0,0);});
    if(this.hp>0&&Math.random()<Math.min(.90,.48+level*.018+kills*.0025))this.triggerDodge();
    this.lastSeenT=0;
    this.reactionT=Math.min(this.reactionT,.08);
    this.burstPauseT=Math.min(this.burstPauseT,.06);
    if(this.aiState==='patrol'){this.aiState='hunt';this.stateCD=0.18;}
    if(this.hp<=0)this.die(dmg,dir);
  }

  die(dmg,dir){
    this.alive=false;
    for(const mn of mines)if(mn.src===this)mn.src=null;
    const force=Math.min(3+dmg*.05,10);
    const gc=Math.min(Math.floor(3+dmg*.07),this.pts.length);
    const selected=[...this.pts].sort(()=>Math.random()-.5).slice(0,gc);
    selected.forEach(p=>{
      const wp=new THREE.Vector3();p.getWorldPosition(wp);
      this.group.remove(p);p.position.copy(wp);
      if(p.material){const oldMat=p.material;p.material=oldMat.clone();p.material.transparent=true;disposeMaterial(oldMat);}
      scene.add(p);
      _gibs.push({m:p,vx:(Math.random()-.5)*force,vy:Math.random()*force*.7+2,vz:(Math.random()-.5)*force,rx:(Math.random()-.5)*10,ry:(Math.random()-.5)*10,life:2.5});
    });
    scene.remove(this.group);
    disposeObject3D(this.group);
    const gp=this.group.position;
    for(let i=0;i<5;i++)spawnP({x:gp.x,y:gp.y+1,z:gp.z},0xff5533);
    try{this.hEl.remove();this.wEl.remove();}catch(e){}
  }

  destroy(){
    try{
      if(this.alive){scene.remove(this.group);disposeObject3D(this.group);}
      this.hEl.remove();this.wEl.remove();
    }catch(e){}
  }
}


// ─── TEAM SPAWNING / SAFE SPAWN SYSTEM ────────────────
const ALLY_SPTS=[
  [-72,-18],[-68,16],[-58,-34],[-54,34],[-46,0],[-38,-48],[-34,48],[-24,-22],[-22,24],[-14,-58],[-12,56],[-4,-36],[-4,36],[-62,56],[-62,-56]
];
const ENEMY_SPTS=[
  [72,18],[68,-16],[58,34],[54,-34],[46,0],[38,48],[34,-48],[24,22],[22,-24],[14,58],[12,-56],[4,36],[4,-36],[62,-56],[62,56]
];
const EXTRA_SPAWN_POINTS=[
  [-78,0],[-74,28],[-74,-28],[-56,54],[-56,-54],[-44,18],[-44,-18],[-28,62],[-28,-62],[-8,66],[-8,-66],
  [78,0],[74,-28],[74,28],[56,-54],[56,54],[44,-18],[44,18],[28,-62],[28,62],[8,-66],[8,66],
  [-18,-18],[-18,18],[18,-18],[18,18],[-35,10],[35,-10],[-10,35],[10,-35],[-45,20],[45,-20],[-20,45],[20,-45],
  [-32,-30],[32,30],[-32,30],[32,-30],[-58,0],[58,0],[0,-58],[0,58],[-60,22],[60,-22],[-22,60],[22,-60],[-8,-26],[8,26],[-26,8],[26,-8]
];
const SPAWN_POINT_SET=[...ALLY_SPTS,...ENEMY_SPTS,...EXTRA_SPAWN_POINTS,...WPTS,...COVER_POINTS]
  .filter((p,i,arr)=>arr.findIndex(q=>q[0]===p[0]&&q[1]===p[1])===i);
const VALID_SPAWN_POINTS=SPAWN_POINT_SET.filter(([x,z])=>isSpawnWalkable(x,z,0.55));
const ALLY_SPAWN_POOL=VALID_SPAWN_POINTS.filter(([x,z])=>x<=12);
const ENEMY_SPAWN_POOL=VALID_SPAWN_POINTS.filter(([x,z])=>x>=-12);
const TEAM_SIZE=9;       // девять ботов в режиме каждый сам за себя
const ALLY_BOT_TARGET=0; // союзников нет
let spawnT=0;

function isSpawnWalkable(x,z,r=0.45){
  if(x<-89||x>89||z<-89||z>89)return false;
  const c=collideWalls(x,z,r);
  return Math.abs(c.x-x)<0.01&&Math.abs(c.z-z)<0.01;
}
function dist2D(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1]);}
function shuffle(arr){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[out[i],out[j]]=[out[j],out[i]];}return out;}
function tryJitterSpawn(base,used,minDist=9,r=0.45){
  for(let attempt=0;attempt<18;attempt++){
    const ang=Math.random()*Math.PI*2;
    const rad=attempt===0?0:1.4+Math.random()*4.6;
    const x=base[0]+Math.cos(ang)*rad;
    const z=base[1]+Math.sin(ang)*rad;
    if(!isSpawnWalkable(x,z,r))continue;
    if(used.every(p=>dist2D([x,z],p)>=minDist))return [x,z];
  }
  if(isSpawnWalkable(base[0],base[1],r)&&used.every(p=>dist2D(base,p)>=Math.max(6,minDist*.7)))return base.slice();
  return null;
}
function pickSpawnSet(pool,count,used,minDist,opts={}){
  const out=[];
  const farFrom=opts.farFrom||null;
  const minFar=opts.minFar||0;
  const maxNear=opts.maxNear||Infinity;
  const candidates=shuffle(pool.length?pool:VALID_SPAWN_POINTS);
  for(const base of candidates){
    if(out.length>=count)break;
    if(farFrom){const d=dist2D(base,farFrom);if(d<minFar||d>maxNear)continue;}
    const pt=tryJitterSpawn(base,[...used,...out],minDist,opts.radius||0.48);
    if(pt)out.push(pt);
  }
  if(out.length<count&&minDist>5)return out.concat(pickSpawnSet(pool,count-out.length,[...used,...out],minDist-1.6,opts));
  return out;
}
function applyPlayerSpawn(pos){
  camera.position.set(pos[0],1.75,pos[1]);
  prevPX=camera.position.x;prevPZ=camera.position.z;
}
function generateSpawnPlan(){
  const used=[];
  const playerSet=pickSpawnSet(ALLY_SPAWN_POOL,1,used,12,{maxNear:75});
  const player=playerSet[0]||[-46,0];
  used.push(player);
  let allies=pickSpawnSet(ALLY_SPAWN_POOL,ALLY_BOT_TARGET,used,10,{maxNear:82});
  used.push(...allies);
  let enemies=pickSpawnSet(ENEMY_SPAWN_POOL,TEAM_SIZE,used,11,{farFrom:player,minFar:34});
  while(allies.length<ALLY_BOT_TARGET){
    const extra=pickSpawnSet(ALLY_SPAWN_POOL,1,[player,...used,...allies,...enemies],6,{maxNear:86})[0];
    if(!extra)break;
    allies.push(extra); used.push(extra);
  }
  while(enemies.length<TEAM_SIZE){
    const extra=pickSpawnSet(ENEMY_SPAWN_POOL,1,[player,...used,...allies,...enemies],6,{farFrom:player,minFar:26,maxNear:92})[0];
    if(!extra)break;
    enemies.push(extra); used.push(extra);
  }
  return {player,allies,enemies};
}
function updateTeamScore(){
  G('tb-ally').textContent='ВЫ '+kills;
  G('tb-enemy').textContent='БОТЫ '+enemyKills;
}
function countTeam(t){let c=0;for(const e of enemies)if(e.alive&&e.team===t)c++;return c;}
function getAliveTeamPositions(team){return enemies.filter(e=>e.alive&&e.team===team).map(e=>[e.group.position.x,e.group.position.z]);}
function spawnBot(team){
  const pool=team==='ally'?ALLY_SPAWN_POOL:ENEMY_SPAWN_POOL;
  const used=[[camera.position.x,camera.position.z],...enemies.filter(e=>e.alive).map(e=>[e.group.position.x,e.group.position.z])];
  const farFrom=team==='enemy'?[camera.position.x,camera.position.z]:null;
  const pts=pickSpawnSet(pool,1,used,10,{farFrom,minFar:team==='enemy'?26:0,maxNear:90});
  const pt=pts[0]||(team==='ally'?[-46,0]:[46,0]);
  const mt=Math.min(5,Math.floor(level*.5+1));
  let typ=1+Math.floor(Math.random()*mt);
  if(Math.random()<.16)typ=0;
  const en=new Enemy(pt[0],pt[1],typ,team);
  enemies.push(en);
}
function spawnInitial(){
  const plan=generateSpawnPlan();
  applyPlayerSpawn(plan.player);
  plan.enemies.forEach((pt)=>{enemies.push(new Enemy(pt[0],pt[1],1+Math.floor(Math.random()*3),'enemy'));});
  while(countTeam('enemy')<TEAM_SIZE)spawnBot('enemy');
  updateTeamScore();
}
