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


// Bot body geometry / hit meshes / weapon arm rig: src/entities/bot-presentation.js

// Bot navigation / locomotion owner: src/ai/bot-navigation.js

// Bot perception / threat sensing owner: src/ai/bot-perception.js

// Bot tactical cover / flank destination owner: src/ai/bot-positioning.js

// Bot fire-control execution owner: src/ai/bot-fire-control.js

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
    this.motionX=0;this.motionZ=0;
    this.gaitPhase=Math.random()*Math.PI*2;this.gaitSpeed=0;this.footstepDistance=Math.random()*1.1;
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
    this.unstuckT=0;this.unstuckDir=Math.random()<.5?-1:1;
    this.commandDoctrine='hold';
    this.sT=.18+Math.random()*.22;
    this.reloadT=0;
    this.mineCD=8+Math.random()*12;
    this.bombCD=24+Math.random()*52;
    this.mineScanT=Math.random()*.18;
    this.cachedMineThreat=null;
    this.grenadeScanT=Math.random()*.12;this.cachedGrenadeThreat=null;
    this.weaponSwitchT=2.2+Math.random()*2.0;
    this.coverEvalT=.38+Math.random()*.22;
    this.coverPoint=null;this.coverChainT=0;
    this.peekPoint=null;this.peekT=0;this.peekDuration=0;this.peekCooldownT=.45+Math.random()*.45;this.peekLean=0;
    this.suppressedT=0;this.suppressionSource=null;
    this.flankPoint=null;this.flankEvalT=.25+Math.random()*.35;this.flankCommitT=0;
    this.tacticalMode='normal';
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
    this.lastKnownVel=new THREE.Vector3();
    this.targetLockT=0;
    this.searchPoint=null;this.searchStep=0;
    this.coverHoldT=0;this.coverCooldownT=0;
    this.hearingScanT=Math.random()*.12;
    this.heardT=0;this.heardSource=null;this.heardIsPlayer=false;
    this.heardPos=new THREE.Vector3(x,0,z);
    this.cachedRocketThreat=null;

    this.dodgeDir=0;this.dodgeT=0;this.dodgeCD=0;this.dodgeSpd=0;
    this.strafeDir=Math.random()<.5?-1:1;this.strafeSwitchT=1.1+Math.random()*1.4;
    this.flashT=0;this.jV=0;this.jT=999;this.jCD=4+Math.random()*3;
    this.uiT=0;this.uiVis=false;this.uiX=0;this.uiY=0;
    this.rocketCheckT=.18+Math.random()*.10;

    const built=mkHuman(et,team);
    this.group=built.g;this.pts=built.pts;this.weaponPivot=built.weaponPivot;this.armRig=built.armRig;
    this.group.position.set(x,0,z);
    scene.add(this.group);

    this.hEl=document.createElement('div');
    const barCol=team==='ally'?'rgba(0,70,150,.88)':'rgba(120,0,24,.88)';
    this.hEl.style.cssText='position:fixed;width:52px;height:5px;background:'+barCol+';border:1px solid '+(team==='ally'?'#4dd8ff':'#ff4966')+';border-radius:3px;pointer-events:none;z-index:5;display:none;box-shadow:0 0 8px '+(team==='ally'?'rgba(60,210,255,.7)':'rgba(255,50,80,.7)')+';';
    this.hFill=document.createElement('div');
    this.hFill.style.cssText='height:100%;border-radius:2px;width:100%;background:'+(team==='ally'?'#45d5ff':'#ff3655')+';';
    this.hEl.appendChild(this.hFill);document.getElementById('ui').appendChild(this.hEl);

    this.weapon=chooseBotWeaponByDistance(22,-1,true,this.role);
    this.mag=this.weapon.clip;
    this.syncScale(true);
    refreshBotWeaponVisual(this);
  }

  syncScale(force=false){
    applyBotProgressionScaling(this,force);
  }

  findReachableHealthPickup(maxDist=30){
    let best=null,bestScore=maxDist;
    const from=this.group.position.clone();from.y=.55;
    for(const pk of pickups){
      if(pk.type!=='hp'||!pk.m.visible)continue;
      const d=pk.m.position.distanceTo(this.group.position);
      if(d>=bestScore)continue;
      const to=pk.m.position.clone();to.y=.55;
      if(wallBetween(from,to,losMeshes))continue;
      best=pk;bestScore=d;
    }
    return best;
  }


  nearbyThreatCount(radius=18){
    const r2=radius*radius;let n=0;
    for(const other of enemies){
      if(!other.alive||other===this||other.team===this.team)continue;
      if(other.group.position.distanceToSquared(this.group.position)<r2)n++;
    }
    if(this.team==='enemy'&&!dying&&camera.position.distanceToSquared(this.group.position)<r2)n++;
    return n;
  }

  currentTargetWeapon(){
    if(this.targetEn&&this.targetEn.alive)return this.targetEn.weapon||null;
    if(this.targetIsPlayer&&this.team==='enemy'&&!dying)return getW();
    return null;
  }



  triggerDodge(preferredDir=0,urgency=1){
    applyBotDodgeResponse(this,preferredDir,urgency);
  }

  registerSuppression(source,intensity=.6){
    applyBotSuppressionResponse(this,source,intensity);
  }

  update(dt){
    if(!this.alive)return false;
    this.syncScale();
    this.ph+=dt*3;
    if(this.lastDamageT>0)this.lastDamageT-=dt;
    if(this.suppressedT>0){this.suppressedT=Math.max(0,this.suppressedT-dt);if(this.suppressedT<=0)this.suppressionSource=null;}
    if(this.flankEvalT>0)this.flankEvalT-=dt;
    if(this.flankCommitT>0)this.flankCommitT-=dt;
    if(this.unstuckT>0)this.unstuckT=Math.max(0,this.unstuckT-dt);
    if(this.nearMissCd>0)this.nearMissCd-=dt;
    if(this.coverChainT>0)this.coverChainT=Math.max(0,this.coverChainT-dt);
    if(this.peekT>0)this.peekT=Math.max(0,this.peekT-dt);
    if(this.peekCooldownT>0)this.peekCooldownT=Math.max(0,this.peekCooldownT-dt);
    if(this.peekT<=0)this.peekPoint=null;

    if(this.flashT>0){this.flashT-=dt;if(this.flashT<=0)this.pts.forEach(p=>{if(p.material&&p.material.emissive)p.material.emissive.setRGB(0,0,0);});}

    if(this.jV!==0||this.group.position.y>0){
      this.jV-=22*dt;this.group.position.y+=this.jV*dt;
      if(this.group.position.y<=0){this.group.position.y=0;this.jV=0;}
    }

    if(this.dodgeCD>0)this.dodgeCD-=dt;
    if(this.mineCD>0)this.mineCD-=dt;
    if(this.bombCD>0)this.bombCD-=dt;
    if(this.reloadT>0){this.reloadT-=dt;if(this.reloadT<=0)finishBotReload(this);}

    this._lastDt=dt;
    if(this.reactionT>0)this.reactionT-=dt;
    if(this.burstPauseT>0)this.burstPauseT-=dt;
    if(this.targetLockT>0)this.targetLockT-=dt;
    if(this.coverCooldownT>0)this.coverCooldownT-=dt;
    syncPlayerCombatNoise();
    if(updateBotHearingPerception(this,dt)){
      if(this.aiState==='patrol'||this.aiState==='search')this.aiState='hunt';
      this.stateCD=Math.min(this.stateCD,.12);
    }
    updateBotTargetPerception(this);
    const targetPos=botTargetPosition(this);
    if(!targetPos)this.aiState='patrol';

    const myX=this.group.position.x,myZ=this.group.position.z;
    let dx=0,dz=0,dist=999;
    if(targetPos){dx=targetPos.x-myX;dz=targetPos.z-myZ;dist=Math.sqrt(dx*dx+dz*dz)+0.001;}

    const mineThreat=updateBotMineThreat(this,dt);
    const grenadeThreat=updateBotGrenadeThreat(this,dt);
    if((mineThreat||grenadeThreat)&&this.dodgeT<=0){
      this.aiState='retreat';
      this.stateCD=.45;
      this.coverPoint=null;this.peekPoint=null;this.peekT=0;
    }

    this.weaponSwitchT-=dt;
    if(targetPos&&shouldBotReconsiderWeapon(this,dist))selectBotWeapon(this,dist,false);

    updateBotLineOfSight(this,targetPos,dt);
    const hpPct=this.hp/this.maxHp;
    const localThreats=this.nearbyThreatCount(18);
    const opponentWeapon=this.currentTargetWeapon();
    const squadPlan=refreshBotTeamTactics(this.team);
    this.commandDoctrine=squadPlan.doctrine;
    const mapObjective=botObjectivePoint(this,squadPlan);
    const assaultWaveState=botAssaultWaveState(squadPlan);
    const objectiveDist=mapObjective?this.group.position.distanceTo(mapObjective):999;
    const activeFrontline=frontlineZone();
    const frontlineDist=Math.hypot(this.group.position.x-activeFrontline.x,this.group.position.z-activeFrontline.z);
    const frontlineContested=frontlineObjective.allyPresence>.20&&frontlineObjective.enemyPresence>.20;
    const frontlineBehind=frontlineObjective.owner&&frontlineObjective.owner!==this.team;
    const friendlyPresence=this.team==='ally'?frontlineObjective.allyPresence:frontlineObjective.enemyPresence;
    const hostilePresence=this.team==='ally'?frontlineObjective.enemyPresence:frontlineObjective.allyPresence;
    const objectiveUrgency=Math.max(0,Math.min(1.35,(frontlineContested?.72:.18)+(frontlineBehind?.34:0)+Math.max(0,hostilePresence-friendlyPresence)*.16));
    const frontlineCommitted=frontlineDist<squadPlan.zoneRadius*.95&&(frontlineContested||frontlineBehind);
    const strategicRetreat=hpPct<.18||!frontlineCommitted||localThreats>=4;
    const focusMatches=botMatchesSquadFocus(this,squadPlan);
    const roleFlanker=this.role==='flankL'||this.role==='flankR';
    const supportMate=squadPlan.wounded&&squadPlan.wounded!==this&&squadPlan.wounded.alive?squadPlan.wounded:null;
    const supportDist=supportMate?this.group.position.distanceTo(supportMate.group.position):999;
    const supportReady=!!supportMate&&(this.role==='engineer'||this.role==='anchor')&&supportDist<34&&hpPct>.42&&!(this.canSeeTarget&&dist<12);
    const coordinatedFlank=roleFlanker&&focusMatches&&!!squadPlan.suppressor&&hpPct>.38&&!this.reloadT&&targetPos&&dist>10;
    const mapOrderWanted=!!mapObjective&&(
      !targetPos||
      (assaultWaveState==='staging'&&objectiveDist>squadPlan.zoneRadius*.42)||
      (assaultWaveState==='active'&&(squadPlan.doctrine==='breach'||squadPlan.doctrine==='retake')&&objectiveDist>squadPlan.zoneRadius*.34&&(!this.canSeeTarget||dist>10))||
      (squadPlan.doctrine==='hold'&&objectiveDist>squadPlan.zoneRadius*.62&&(!this.canSeeTarget||dist>24))||
      (frontlineContested&&objectiveDist>squadPlan.zoneRadius*.48&&(!this.canSeeTarget||dist>18))||
      (frontlineBehind&&objectiveDist>squadPlan.zoneRadius*.55&&(!this.canSeeTarget||dist>16))||
      ((squadPlan.doctrine==='push'||squadPlan.doctrine==='retake'||squadPlan.doctrine==='breach')&&!this.canSeeTarget&&this.lastSeenT>2.2&&objectiveDist>4.2)
    );
    if(this.flankEvalT<=0&&coordinatedFlank){
      const sign=this.role==='flankL'?-1:1;
      const nextFlank=findBotFlankPoint(this,squadPlan.focusPos,sign);
      if(nextFlank){this.flankPoint=nextFlank;this.flankCommitT=(squadPlan.doctrine==='breach'?3.5:2.6)+Math.random()*1.2;}
      this.flankEvalT=(squadPlan.doctrine==='breach'?.58:.82)+Math.random()*.42;
    }
    if(!coordinatedFlank&&this.flankCommitT<=0)this.flankPoint=null;
    const breachRole=squadPlan.breachReady&&assaultWaveState==='active'&&this.role==='assault'&&focusMatches;
    this.tacticalMode=squadPlan.suppressor===this&&focusMatches&&squadPlan.flankerCount>0?'suppress':
      this.flankPoint&&this.flankCommitT>0?'flank':breachRole?'breach':supportReady?'support':'normal';
    maybeCoordinateBotUtility(this,squadPlan,targetPos,dist,assaultWaveState);
    if(this.mag<=Math.max(1,Math.ceil(this.weapon.clip*.22))&&!this.reloadT&&(!this.canSeeTarget||dist>this.weapon.opt*1.15))startBotReload(this);
    if((hpPct<.38||(hpPct<.56&&this.reloadT>0))&&(!this.pickupTarget||!this.pickupTarget.m.visible)){
      this.pickupTarget=this.findReachableHealthPickup(30);
    }

    this.coverEvalT-=dt;
    if(this.coverEvalT<=0&&targetPos&&this.coverCooldownT<=0){
      const needCover=(!this.canSeeTarget&&dist>10)||(hpPct<0.52)||(this.reloadT>0)||(this.role==='anchor'&&dist>12)||(this.lastDamageT>0&&dist>8)||(this.suppressedT>0);
      const nextCover=needCover?findBotTacticalCover(this,targetPos):null;
      if(nextCover&&(!this.coverPoint||this.coverPoint.distanceToSquared(nextCover)>.64))this.coverHoldT=.28+Math.random()*.42;
      this.coverPoint=nextCover;
      this.coverEvalT=.82+Math.random()*.48;
    }

    this.aiT+=dt;this.stateCD-=dt;
    if(this.stateCD<=0){
      if(this.pickupTarget&&this.pickupTarget.m.visible&&hpPct<.48)this.aiState='resupply';
      else if(targetPos&&strategicRetreat&&((hpPct<0.25&&dist<20)||(localThreats>=3&&hpPct<.58)))this.aiState='retreat';
      else if(targetPos&&supportReady&&this.tacticalMode==='support')this.aiState='support';
      else if(targetPos&&this.coverPoint&&(!this.canSeeTarget||this.role==='anchor'||this.reloadT>0||(localThreats>=3&&hpPct<.72)||this.suppressedT>0))this.aiState='cover';
      else if(targetPos&&this.flankPoint&&this.flankCommitT>0&&this.tacticalMode==='flank')this.aiState='flank';
      else if(mapOrderWanted)this.aiState='objective';
      else if(targetPos&&this.canSeeTarget&&dist<=this.weapon.range*(this.team==='ally'?1.14:1.08))this.aiState='engage';
      else if(targetPos&&this.lastSeenT<8.5)this.aiState='hunt';
      else if(targetPos&&this.lastSeenT<14.5)this.aiState='search';
      else this.aiState=mapObjective?'objective':'patrol';
      this.stateCD=.22+Math.random()*.30;
    }

    let mx=0,mz=0;
    const spd=this.speed;
    if(grenadeThreat){
      const gp=grenadeThreat.grenade.m.position;
      const awayX=this.group.position.x-gp.x,awayZ=this.group.position.z-gp.z;
      const gd=Math.max(.001,Math.hypot(awayX,awayZ));
      const sideX=-awayZ/gd*this.sideBias,sideZ=awayX/gd*this.sideBias;
      mx=(awayX/gd)*spd*1.30+sideX*spd*.30;
      mz=(awayZ/gd)*spd*1.30+sideZ*spd*.30;
      this.desiredYaw=Math.atan2(awayX,awayZ);
    }else if(mineThreat){
      const awayX=this.group.position.x-mineThreat.mine.m.position.x;
      const awayZ=this.group.position.z-mineThreat.mine.m.position.z;
      const md=Math.max(.001,Math.hypot(awayX,awayZ));
      mx=(awayX/md)*spd*1.34;
      mz=(awayZ/md)*spd*1.34;
      this.desiredYaw=Math.atan2(awayX,awayZ);
    }else if(this.unstuckT>0){
      const fwdX=Math.sin(this.group.rotation.y),fwdZ=Math.cos(this.group.rotation.y);
      const rightX=Math.cos(this.group.rotation.y),rightZ=-Math.sin(this.group.rotation.y);
      mx=rightX*this.unstuckDir*spd*.92-fwdX*spd*.22;
      mz=rightZ*this.unstuckDir*spd*.92-fwdZ*spd*.22;
      this.desiredYaw+=this.unstuckDir*dt*.85;
    }else if(this.dodgeT>0&&targetPos){
      this.dodgeT-=dt;
      const px=-dz/dist,pz=dx/dist;
      mx=px*this.dodgeDir*this.dodgeSpd;mz=pz*this.dodgeDir*this.dodgeSpd;
      this.desiredYaw=Math.atan2(dx,dz);
    }else switch(this.aiState){
      case 'objective':{
        if(mapObjective){
          const ox=mapObjective.x-myX,oz=mapObjective.z-myZ,od=Math.hypot(ox,oz)+.001;
          const stopR=squadPlan.doctrine==='hold'?(this.role==='anchor'?3.8:4.8):3.2;
          const baseSpeedM=squadPlan.doctrine==='breach'?(this.role==='assault'?1.14:1.06):squadPlan.doctrine==='push'?(this.role==='assault'?1.12:1.02):squadPlan.doctrine==='retake'?1.08:.82;
          const waveSpeedM=assaultWaveState==='staging'?.78:assaultWaveState==='active'?1.10:1;
          const speedM=(baseSpeedM+objectiveUrgency*.12)*waveSpeedM;
          if(targetPos&&this.canSeeTarget)this.desiredYaw=Math.atan2(dx,dz);
          else this.desiredYaw=Math.atan2(ox||((this.team==='ally'?1:-1)*.01),oz);
          if(od>stopR){
            mx=(ox/od)*spd*speedM;mz=(oz/od)*spd*speedM;
          }else if(targetPos){
            const px=-dz/dist,pz=dx/dist;
            const orbit=this.role==='anchor'?.16:.28;
            mx=px*this.sideBias*spd*orbit;mz=pz*this.sideBias*spd*orbit;
          }else{
            const enemyDir=this.team==='ally'?1:-1;
            this.desiredYaw=Math.atan2(enemyDir,0);
          }
        }else this.aiState='patrol';
        break;
      }
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
          if(!this.peekPoint&&this.peekCooldownT<=0&&targetPos&&this.reloadT<=0){
            const tx=targetPos.x-this.coverPoint.x,tz=targetPos.z-this.coverPoint.z,td=Math.max(.001,Math.hypot(tx,tz));
            const px=-tz/td,pz=tx/td;
            for(const sign of [this.sideBias,-this.sideBias]){
              const rawX=this.coverPoint.x+px*sign*1.35,rawZ=this.coverPoint.z+pz*sign*1.35;
              const coll=collideWalls(rawX,rawZ,BOT_R);
              if(Math.hypot(coll.x-rawX,coll.z-rawZ)>.55)continue;
              const eye=new THREE.Vector3(coll.x,1.38,coll.z),tgt=targetPos.clone();tgt.y+=1.15;
              if(!wallBetween(eye,tgt,losMeshes)&&!smokeBlocksSight(eye,tgt)){
                this.peekPoint=new THREE.Vector3(coll.x,0,coll.z);this.peekDuration=.92+Math.random()*.34;this.peekT=this.peekDuration;
                this.peekCooldownT=1.25+Math.random()*.85;this.sideBias=sign;break;
              }
            }
          }
          let coverGoal=this.coverPoint,peekMoveM=.98;
          if(this.peekPoint&&this.peekT>0&&this.peekDuration>0){
            const p=Math.max(0,Math.min(1,1-this.peekT/this.peekDuration));
            const envelope=p<.24?p/.24:p>.72?(1-p)/.28:1;
            coverGoal=this.coverPoint.clone().lerp(this.peekPoint,Math.max(0,envelope));
            peekMoveM=.68;
          }
          const cx=coverGoal.x-myX,cz=coverGoal.z-myZ,cd=Math.sqrt(cx*cx+cz*cz)+0.001;
          if(cd>(this.peekPoint?.42:1.4)){mx=(cx/cd)*spd*peekMoveM;mz=(cz/cd)*spd*peekMoveM;}
          else{
            this.coverHoldT-=dt;
            if(this.reloadT<=0&&this.coverHoldT<=0){
              const canChain=(squadPlan.doctrine==='breach'||squadPlan.doctrine==='retake')&&assaultWaveState==='active'&&targetPos&&mapObjective&&this.coverChainT<=0;
              const nextCover=canChain?findBotTacticalCover(this,targetPos):null;
              const advances=nextCover&&nextCover.distanceToSquared(this.group.position)>6.25&&
                nextCover.distanceTo(mapObjective)+1.2<this.group.position.distanceTo(mapObjective);
              if(advances){
                this.coverPoint=nextCover;this.coverHoldT=.16+Math.random()*.22;this.coverChainT=.72+Math.random()*.35;
              }else{
                this.coverPoint=null;this.coverCooldownT=.95+Math.random()*.70;
                this.aiState=this.canSeeTarget?'engage':'hunt';this.stateCD=.32;
              }
            }
          }
          if(targetPos)this.desiredYaw=Math.atan2(dx,dz);
        }
        break;
      }
      case 'hunt':{
        let tx=this.canSeeTarget&&targetPos?targetPos.x:this.lastKnown.x;
        let tz=this.canSeeTarget&&targetPos?targetPos.z:this.lastKnown.z;
        const intel=TEAM_INTEL[this.team];
        if(!this.canSeeTarget){
          const memoryLead=Math.min(1.45,this.lastSeenT)*.72;
          tx+=this.lastKnownVel.x*memoryLead;tz+=this.lastKnownVel.z*memoryLead;
          const intelMatches=this.targetIsPlayer?intel.target==='player':intel.target===this.targetEn;
          if(intelMatches&&performance.now()-intel.time<4500&&intel.time>this.lastTargetSeenAt){
            tx=intel.pos.x;tz=intel.pos.z;
          }
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
      case 'flank':{
        if(this.flankPoint&&targetPos){
          const fx=this.flankPoint.x-myX,fz=this.flankPoint.z-myZ,fd=Math.hypot(fx,fz)+.001;
          this.desiredYaw=this.canSeeTarget?Math.atan2(dx,dz):Math.atan2(fx,fz);
          if(fd>2.2){mx=(fx/fd)*spd*1.12;mz=(fz/fd)*spd*1.12;}
          if(fd<=2.2||(this.canSeeTarget&&this.flankCommitT<.72)){
            this.flankPoint=null;this.flankCommitT=0;this.aiState='engage';this.stateCD=.36;
          }
        }else{this.flankPoint=null;this.aiState=targetPos?'hunt':'patrol';}
        break;
      }
      case 'support':{
        const mate=supportMate;
        if(mate&&mate.alive){
          const sx=mate.group.position.x-myX,sz=mate.group.position.z-myZ,sd=Math.hypot(sx,sz)+.001;
          if(targetPos)this.desiredYaw=Math.atan2(dx,dz);else this.desiredYaw=Math.atan2(sx,sz);
          if(sd>7.2){mx=(sx/sd)*spd*.94;mz=(sz/sd)*spd*.94;}
          else if(sd<3.6){mx=-(sx/sd)*spd*.36;mz=-(sz/sd)*spd*.36;}
          else if(targetPos){
            const px=-dz/dist,pz=dx/dist;
            mx=px*this.sideBias*spd*.34;mz=pz*this.sideBias*spd*.34;
          }
        }else{this.aiState=targetPos?'hunt':'patrol';this.stateCD=.32;}
        break;
      }
      case 'search':{
        if(!this.searchPoint||this.searchPoint.distanceToSquared(this.group.position)<3.2){
          this.searchStep++;
          let found=null;
          const baseR=4.0+Math.min(8.5,this.lastSeenT*.55);
          for(let attempt=0;attempt<7;attempt++){
            const ang=this.searchStep*2.399963+this.sideBias*.36+attempt*.58;
            const rad=baseR*(.62+attempt*.075);
            const sx=Math.max(-91,Math.min(91,this.lastKnown.x+Math.cos(ang)*rad));
            const sz=Math.max(-91,Math.min(91,this.lastKnown.z+Math.sin(ang)*rad));
            const sc=collideWalls(sx,sz,BOT_R);
            if(Math.hypot(sc.x-sx,sc.z-sz)<.22){found=new THREE.Vector3(sc.x,0,sc.z);break;}
          }
          this.searchPoint=found||this.lastKnown.clone().setY(0);
        }
        if(this.searchPoint){
          const sx=this.searchPoint.x-myX,sz=this.searchPoint.z-myZ,sd=Math.hypot(sx,sz)+.001;
          this.desiredYaw=Math.atan2(sx,sz);
          if(sd>1.55){mx=(sx/sd)*spd*.92;mz=(sz/sd)*spd*.92;}
          else{this.searchPoint=null;this.sideBias*=-1;}
        }
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
        let strafeM=this.tacticalMode==='suppress'?.48:.82;
        if(this.tacticalMode==='suppress')optRange*=1.08;
        if(opponentWeapon){
          if(opponentWeapon.key==='shotgun')optRange=Math.max(optRange,18);
          else if(opponentWeapon.isRocket){optRange=Math.max(optRange,17);strafeM=1.02;}
          else if(opponentWeapon.isSniper){
            strafeM=1.08;
            if(this.weapon.key==='shotgun'||this.role==='assault')optRange=Math.min(optRange,21);
            else optRange=Math.max(optRange,30);
            this.strafeSwitchT=Math.min(this.strafeSwitchT,.48+Math.random()*.22);
          }
        }
        mx=px*this.strafeDir*spd*strafeM;mz=pz*this.strafeDir*spd*strafeM;
        const objectivePull=frontlineContested?.40:frontlineBehind?.31:(squadPlan.doctrine==='hold'?.46:0);
        if(objectivePull>0&&mapObjective&&objectiveDist>squadPlan.zoneRadius*.58){
          const ox=mapObjective.x-myX,oz=mapObjective.z-myZ,od=Math.max(.001,Math.hypot(ox,oz));
          mx+=(ox/od)*spd*objectivePull;mz+=(oz/od)*spd*objectivePull;
        }
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
    const wallSteered=steerBotAroundWalls(this,mx,mz);
    const steered=steerBotAroundSmoke(this,wallSteered.x,wallSteered.z);
    const urgentMove=!!grenadeThreat||!!mineThreat||this.dodgeT>0||this.unstuckT>0;
    const maxMoveM=grenadeThreat?BOT_MOVE_CFG.mineMaxM:mineThreat?BOT_MOVE_CFG.mineMaxM:this.dodgeT>0?BOT_MOVE_CFG.dodgeMaxM:
      this.aiState==='retreat'?BOT_MOVE_CFG.retreatMaxM:BOT_MOVE_CFG.normalMaxM;
    const cappedDesired=clampBotVelocity(steered.x,steered.z,spd*maxMoveM);
    const desiredMoveX=cappedDesired.x,desiredMoveZ=cappedDesired.z;
    const desiredMoveSpeed=Math.hypot(desiredMoveX,desiredMoveZ);
    const currentMoveSpeed=Math.hypot(this.motionX,this.motionZ);
    const response=urgentMove?11.5:(desiredMoveSpeed>currentMoveSpeed+.08?5.6:8.2);
    const responseT=1-Math.exp(-response*dt);
    let nextMotionX=this.motionX+(desiredMoveX-this.motionX)*responseT;
    let nextMotionZ=this.motionZ+(desiredMoveZ-this.motionZ)*responseT;
    const dvx=nextMotionX-this.motionX,dvz=nextMotionZ-this.motionZ,dv=Math.hypot(dvx,dvz);
    const maxDv=spd*(urgentMove?BOT_MOVE_CFG.urgentAccelM:BOT_MOVE_CFG.maxAccelM)*dt;
    if(dv>maxDv&&dv>.0001){
      const dm=maxDv/dv;nextMotionX=this.motionX+dvx*dm;nextMotionZ=this.motionZ+dvz*dm;
    }
    const cappedMotion=clampBotVelocity(nextMotionX,nextMotionZ,spd*maxMoveM);
    this.motionX=cappedMotion.x;this.motionZ=cappedMotion.z;
    if(desiredMoveSpeed<.05&&Math.hypot(this.motionX,this.motionZ)<.08){
      this.motionX=0;this.motionZ=0;
    }
    mx=this.motionX;mz=this.motionZ;

    const movedPos=moveBotWithSubsteps(myX,myZ,mx,mz,dt);
    this.group.position.x=movedPos.x;this.group.position.z=movedPos.z;
    this.velX=(this.group.position.x-myX)/Math.max(dt,.001);
    this.velZ=(this.group.position.z-myZ)/Math.max(dt,.001);
    const actualCap=clampBotVelocity(this.velX,this.velZ,spd*maxMoveM*1.04);
    this.velX=actualCap.x;this.velZ=actualCap.z;
    this.motionX=this.velX;this.motionZ=this.velZ;
    this.group.rotation.y=lerpAngle(this.group.rotation.y,this.desiredYaw,Math.min(1,dt*(5.2+this.aimSkill*3.2)));
    const peekProgress=this.peekPoint&&this.peekDuration>0?Math.max(0,Math.min(1,1-this.peekT/this.peekDuration)):0;
    const peekEnvelope=peekProgress<.24?peekProgress/.24:peekProgress>.72?(1-peekProgress)/.28:1;
    const targetPeekLean=this.peekPoint?(-this.sideBias*.105*Math.max(0,peekEnvelope)):0;
    this.peekLean+=(targetPeekLean-this.peekLean)*(1-Math.exp(-dt*11));
    this.group.rotation.z+=(this.peekLean-this.group.rotation.z)*(1-Math.exp(-dt*12));
    const intended=Math.hypot(mx,mz);
    const moved=Math.hypot(this.group.position.x-myX,this.group.position.z-myZ);
    if(intended>.6&&moved<.015)this.stuckT+=dt;else this.stuckT=Math.max(0,this.stuckT-dt*2);
    if(this.stuckT>.55){
      this.stuckT=0;this.strafeDir*=-1;this.sideBias*=-1;
      this.unstuckDir=this.sideBias;this.unstuckT=.48+Math.random()*.18;
      this.motionX*=.35;this.motionZ*=.35;
      this.coverPoint=null;this.flankPoint=null;this.flankCommitT=0;
      const wp=WPTS[(Math.random()*WPTS.length)|0];this.ptgt.set(wp[0]+(Math.random()-.5)*6,0,wp[1]+(Math.random()-.5)*6);
    }

    const actualSpeed=Math.hypot(this.velX,this.velZ);
    if(actualSpeed>.65&&moved>.0005){
      this.footstepDistance+=Math.min(.55,moved);
      const runningStep=actualSpeed>this.speed*.90;
      const stride=runningStep?1.54:2.02;
      if(this.footstepDistance>=stride){
        this.footstepDistance%=stride;
        if(this.group.position.distanceToSquared(camera.position)<1764)playFootstepSound(this.group.position,runningStep,true);
      }
    }
    const gaitFollow=1-Math.exp(-dt*(actualSpeed>this.gaitSpeed?10.5:14));
    this.gaitSpeed+=(actualSpeed-this.gaitSpeed)*gaitFollow;
    if(this.gaitSpeed<.025)this.gaitSpeed=0;
    const gaitNorm=Math.min(1.18,this.gaitSpeed/Math.max(1,this.speed));
    if(moved>.0005)this.gaitPhase+=moved*(2.05+Math.min(.55,gaitNorm*.32));

    const yaw=this.group.rotation.y;
    const fwdX=Math.sin(yaw),fwdZ=Math.cos(yaw);
    const rightX=Math.cos(yaw),rightZ=-Math.sin(yaw);
    const localForward=this.velX*fwdX+this.velZ*fwdZ;
    const localSide=this.velX*rightX+this.velZ*rightZ;
    const reverseStride=(Math.abs(localForward)>Math.abs(localSide)*.72&&localForward<-.12)?-1:1;
    const sideRatio=this.gaitSpeed>.15?Math.max(-1,Math.min(1,localSide/this.gaitSpeed)):0;
    const strideAmp=Math.min(.52,gaitNorm*.47);
    const strideWave=Math.sin(this.gaitPhase)*reverseStride;
    const leftSwing=strideWave*strideAmp,rightSwing=-leftSwing;
    const leftLift=Math.max(0,Math.sin(this.gaitPhase+.42))*gaitNorm;
    const rightLift=Math.max(0,Math.sin(this.gaitPhase+Math.PI+.42))*gaitNorm;
    const strideBob=Math.cos(this.gaitPhase*2)*.018*gaitNorm;
    const hipSway=Math.sin(this.gaitPhase)*.018*gaitNorm;
    const strafeRoll=sideRatio*.060*gaitNorm;
    const forwardRatio=this.gaitSpeed>.15?Math.max(-1,Math.min(1,localForward/this.gaitSpeed)):0;
    const bodyLean=forwardRatio*.036*gaitNorm;
    const combatPose=(this.aiState==='engage'||this.aiState==='flank'||this.aiState==='support'||this.aiState==='objective')&&this.canSeeTarget;
    const armScale=combatPose?.18:.56;

    if(this.pts[8]){
      this.pts[8].rotation.x=leftSwing;
      this.pts[8].rotation.z=-strafeRoll;
    }
    if(this.pts[9]){
      this.pts[9].rotation.x=rightSwing;
      this.pts[9].rotation.z=-strafeRoll;
    }
    if(this.pts[10]){
      this.pts[10].rotation.x=-leftSwing*.22+leftLift*.34;
      this.pts[10].rotation.z=strafeRoll*.45;
    }
    if(this.pts[11]){
      this.pts[11].rotation.x=-rightSwing*.22+rightLift*.34;
      this.pts[11].rotation.z=strafeRoll*.45;
    }
    if(this.pts[12]){
      this.pts[12].rotation.x=-leftSwing*.18-leftLift*.16;
      this.pts[12].rotation.z=strafeRoll*.30;
    }
    if(this.pts[13]){
      this.pts[13].rotation.x=-rightSwing*.18-rightLift*.16;
      this.pts[13].rotation.z=strafeRoll*.30;
    }
    if(this.pts[0])this.pts[0].position.y=1.82+strideBob*.55;
    if(this.pts[1])this.pts[1].position.y=1.88+strideBob*.55;
    if(this.pts[2]){
      this.pts[2].position.y=1.25+strideBob;
      this.pts[2].position.x=hipSway*.28;
      this.pts[2].rotation.x=-bodyLean;
      this.pts[2].rotation.y=-Math.sin(this.gaitPhase)*.040*gaitNorm;
      this.pts[2].rotation.z=-strafeRoll*.55;
    }
    if(this.pts[3]){
      this.pts[3].position.y=.88+strideBob*.78;
      this.pts[3].position.x=hipSway*.20;
      this.pts[3].rotation.x=-bodyLean*.65;
      this.pts[3].rotation.y=Math.sin(this.gaitPhase)*.030*gaitNorm;
      this.pts[3].rotation.z=-strafeRoll*.72;
    }
    if(this.pts[8]){this.pts[8].position.y=.52+leftLift*.018;this.pts[8].position.z=-leftSwing*.035;}
    if(this.pts[9]){this.pts[9].position.y=.52+rightLift*.018;this.pts[9].position.z=-rightSwing*.035;}
    if(this.pts[12])this.pts[12].position.z=.05-leftSwing*.060;
    if(this.pts[13])this.pts[13].position.z=.05-rightSwing*.060;
    if(this.weaponPivot){
      const idleBreath=Math.sin(this.ph*.55)*(1-Math.min(1,gaitNorm))*.008;
      const stepBob=Math.sin(this.gaitPhase*2)*.012*gaitNorm;
      const pose=this.weaponPivot.userData.pose||{p:[.39,1.23,-.07],r:[.05,.07,-.35]};
      this.weaponPivot.position.x=pose.p[0]+Math.sin(this.gaitPhase)*.008*gaitNorm;
      this.weaponPivot.position.y=pose.p[1]+stepBob;
      this.weaponPivot.position.z=pose.p[2];
      this.weaponPivot.rotation.x=pose.r[0]+idleBreath+stepBob*1.8+(combatPose?.05:0);
      this.weaponPivot.rotation.y=pose.r[1]+(combatPose?.14*this.strafeDir:0)+sideRatio*.025*gaitNorm;
      this.weaponPivot.rotation.z=pose.r[2]+(combatPose?-.05*this.strafeDir:0)-strafeRoll*.35;
    }
    // The arm solver runs after weapon sway/pose so both hands stay physically
    // attached to the real grip points while walking, strafing and fighting.
    updateBotWeaponHands(this);

    const suppressMemory=this.tacticalMode==='suppress'&&!this.canSeeTarget&&targetPos&&this.lastSeenT<2.6&&!this.weapon.isRocket;
    if((this.canSeeTarget||suppressMemory)&&targetPos&&dist<=this.weapon.range*1.08){
      this.sT-=dt;
      const playerFireAllowed=!(this.team==='enemy'&&this.targetIsPlayer)||canPressurePlayer(this);
      if(!playerFireAllowed&&this.sT<=0)this.sT=.20+Math.random()*.25;
      if(playerFireAllowed&&this.sT<=0&&this.reactionT<=0&&this.burstPauseT<=0){
        if(this.mag<=0&&!this.reloadT)startBotReload(this);
        else if(!this.reloadT){
          const fireTarget=suppressMemory?this.lastKnown.clone().addScaledVector(this.lastKnownVel,Math.min(.45,this.lastSeenT*.16)):targetPos;
          const fireDist=Math.max(1,this.group.position.distanceTo(fireTarget));
          if(!this.weapon.isRocket&&!suppressMemory&&tryPlantBotBomb(this,dist,targetPos)){
            this.sT=.85;
          }else if(!this.weapon.isRocket&&!suppressMemory&&tryPlantBotMine(this,dist,targetPos)){
            this.sT=.48;
          }else{
            executeBotShot(this,fireTarget,fireDist,suppressMemory);
            applyBotPostShotCadence(this);
          }
        }
      }
    }

    const rocketThreat=updateBotRocketThreat(this,dt);
    if(rocketThreat&&this.dodgeCD<=0&&this.dodgeT<=0){
      const urgency=rocketThreat.time<.55?1.22:rocketThreat.time<.9?1.10:1;
      this.triggerDodge(rocketThreat.side,urgency);
      this.coverPoint=null;this.coverCooldownT=0;
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
    if(this.uiVis){
      const sx=this.uiX,sy=this.uiY;
      this.hEl.style.left=(sx-24)+'px';this.hEl.style.top=(sy-10)+'px';
      this.hFill.style.width=(this.hp/this.maxHp*100)+'%';
      const pct=this.hp/this.maxHp;
      if(this.team==='ally')this.hFill.style.background=pct>.6?'#45d5ff':pct>.3?'#2f9dff':'#5d72ff';
      else this.hFill.style.background=pct>.6?'#ff3655':pct>.3?'#ff6a3d':'#ff1744';
    }

    if(this.team==='enemy'&&dist<1.02&&!this.targetEn&&!wallBetween(this.group.position.clone().setY(1.1),camera.position.clone(),losMeshes))return true;
    return false;
  }

  hurt(dmg,dir,fromTeam,source=null){
    if(!this.alive)return;
    this.hp-=dmg;
    this.flashT=.09;
    this.lastDamageT=.9;
    this.coverPoint=null;this.coverCooldownT=0;
    this.pts.forEach(p=>{if(p.material&&p.material.emissive)p.material.emissive.setRGB(1,0,0);});
    if(this.hp>0&&Math.random()<Math.min(.90,.48+level*.018+kills*.0025))this.triggerDodge();
    applyBotDamageReaction(this,dmg,fromTeam,source);
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
    try{this.hEl.remove();}catch(e){}
  }

  destroy(){
    try{
      if(this.alive){scene.remove(this.group);disposeObject3D(this.group);}
      this.hEl.remove();
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
const TEAM_SIZE=5;       // красная команда: пять вражеских ботов
const ALLY_BOT_TARGET=4; // синяя команда: игрок + четыре союзных бота
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
function pickPlayerRespawnPoint(){
  const living=enemies.filter(e=>e.alive);
  const hostiles=living.filter(e=>e.team==='enemy').map(e=>[e.group.position.x,e.group.position.z]);
  const friendlies=living.filter(e=>e.team==='ally').map(e=>[e.group.position.x,e.group.position.z]);
  const occupied=living.map(e=>[e.group.position.x,e.group.position.z]);
  const candidates=shuffle(ALLY_SPAWN_POOL.length?ALLY_SPAWN_POOL:VALID_SPAWN_POINTS);
  let best=null,bestScore=-Infinity;
  for(const base of candidates){
    const pt=tryJitterSpawn(base,occupied,5.5,.52);
    if(!pt)continue;
    const enemyMin=hostiles.length?Math.min(...hostiles.map(p=>dist2D(pt,p))):99;
    const allyMin=friendlies.length?Math.min(...friendlies.map(p=>dist2D(pt,p))):14;
    let score=Math.min(enemyMin,70)*2.8-Math.min(allyMin,28)*.22+Math.random()*3;
    if(enemyMin<18)score-=(18-enemyMin)*18;
    if(enemyMin<10)score-=160;
    if(score>bestScore){bestScore=score;best=pt;}
  }
  if(best)return best;
  let fallback=null,fallbackEnemy=-1;
  for(const base of ALLY_SPAWN_POOL){
    if(!isSpawnWalkable(base[0],base[1],.52))continue;
    const enemyMin=hostiles.length?Math.min(...hostiles.map(p=>dist2D(base,p))):99;
    if(enemyMin>fallbackEnemy){fallbackEnemy=enemyMin;fallback=base.slice();}
  }
  return fallback||[-46,0];
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
  const allyTotal=allyKills+allyControlScore*FRONTLINE_CFG.capturePoints;
  const enemyTotal=enemyKills+enemyControlScore*FRONTLINE_CFG.capturePoints;
  G('tb-ally').textContent='СИНИЕ '+allyTotal;
  G('tb-enemy').textContent='КРАСНЫЕ '+enemyTotal;
  G('tb-ally').title='Убийства: '+allyKills+' · Захваты: '+allyControlScore;
  G('tb-enemy').title='Убийства: '+enemyKills+' · Захваты: '+enemyControlScore;
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
  plan.allies.forEach((pt)=>{enemies.push(new Enemy(pt[0],pt[1],1+Math.floor(Math.random()*3),'ally'));});
  plan.enemies.forEach((pt)=>{enemies.push(new Enemy(pt[0],pt[1],1+Math.floor(Math.random()*3),'enemy'));});
  while(countTeam('ally')<ALLY_BOT_TARGET)spawnBot('ally');
  while(countTeam('enemy')<TEAM_SIZE)spawnBot('enemy');
  updateTeamScore();
}
