function tryPlantBotMine(bot,dist,targetPos){
  if(bot.mineCD>0||!bot.canSeeTarget||!targetPos||dist>BOT_MINE_CFG.triggerRange)return false;
  if(mines.length>=MAX_MINES||countTeamMines(bot.team)>=BOT_MAX_TEAM_MINES)return false;
  let chance=dist<6?.42:dist<9?.30:.18;
  if(bot.role==='engineer')chance*=1.55;
  if(bot.role==='anchor')chance*=0.65;
  if(bot.commandDoctrine==='hold'||bot.commandDoctrine==='retake')chance*=1.22;
  if(bot.commandDoctrine==='breach')chance*=.72;
  if(Math.random()>chance)return false;
  const dir=new THREE.Vector3(Math.sin(bot.group.rotation.y),0,Math.cos(bot.group.rotation.y));
  const mine=mkMine();
  mine.position.copy(bot.group.position.clone().addScaledVector(dir,.65));
  scene.add(mine);
  mines.push({m:mine,vx:dir.x*2.2,vy:3.2,vz:dir.z*2.2,fall:true,life:Infinity,armed:false,aT:.95+Math.random()*.45,checkT:.08+Math.random()*.10,ph:0,team:bot.team,owner:'bot',src:bot,dmg:BOT_MINE_CFG.dmg*BOT_DAMAGE_BOOST*EXPLOSION_DAMAGE_BOOST*bot.baseDmgMul});
  bot.mineCD=BOT_MINE_CFG.cooldown;
  return true;
}

function tryPlantBotBomb(bot,dist,targetPos){
  if(bot.bombCD>0||!bot.canSeeTarget||!targetPos)return false;
  if(dist<BOT_BOMB_CFG.minRange||dist>BOT_BOMB_CFG.maxRange)return false;
  if(mines.length>=MAX_MINES||activeBombCount()>=BOT_MAX_ACTIVE_BOMBS)return false;
  const pos=bot.group.position.clone();
  if(bombNearPoint(pos,24))return false;
  let chance=bot.role==='engineer'?.19:bot.role==='anchor'?.12:.075;
  chance*=1+Math.min(.65,level*.018+kills*.002);
  if(bot.commandDoctrine==='breach')chance*=bot.role==='engineer'?1.48:1.22;
  else if(bot.commandDoctrine==='hold')chance*=.70;
  if(Math.random()>chance)return false;
  const dir=new THREE.Vector3(Math.sin(bot.group.rotation.y),0,Math.cos(bot.group.rotation.y));
  const bomb=mkBomb();
  const bombPos=bot.group.position.clone().addScaledVector(dir,1.05);
  const coll=collideWalls(bombPos.x,bombPos.z,.42);bomb.position.set(coll.x,.34,coll.z);scene.add(bomb);
  mines.push({
    m:bomb,vx:0,vy:0,vz:0,fall:false,life:Infinity,armed:true,aT:0,checkT:0,ph:0,
    team:bot.team,owner:'bot',src:bot,kind:'bomb',fuseT:BOMB_FUSE_SECONDS,fuseTotal:BOMB_FUSE_SECONDS,
    dmg:BOT_BOMB_CFG.dmg*(1+level*.018),radius:BOT_BOMB_CFG.radius
  });
  bot.bombCD=BOT_BOMB_CFG.cooldown+Math.random()*24;
  return true;
}
