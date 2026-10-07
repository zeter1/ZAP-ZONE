import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
class Vec3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}clone(){return new Vec3(this.x,this.y,this.z);}copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}set(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return this;}addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}}
const source=readFileSync(new URL('../src/ai/bot-deployables.js',import.meta.url),'utf8');
function device(){return {position:new Vec3()};}
function createHarness({randoms=[0],teamMines=0,bombs=0,bombNear=false}={}){
  let randomIndex=0;const nextRandom=()=>randoms[Math.min(randomIndex++,randoms.length-1)];
  const context={THREE:{Vector3:Vec3},BOT_MINE_CFG:{dmg:105,triggerRange:12,cooldown:30},BOT_BOMB_CFG:{dmg:10500,radius:32,minRange:10,maxRange:30,cooldown:180},BOT_MAX_TEAM_MINES:12,BOT_MAX_ACTIVE_BOMBS:3,MAX_MINES:140,BOMB_FUSE_SECONDS:45,BOT_DAMAGE_BOOST:1.2,EXPLOSION_DAMAGE_BOOST:1.1,level:10,kills:20,mines:[],scene:{add:mock.fn()},countTeamMines:mock.fn(()=>teamMines),activeBombCount:mock.fn(()=>bombs),bombNearPoint:mock.fn(()=>bombNear),mkMine:mock.fn(()=>device()),mkBomb:mock.fn(()=>device()),safeBombPlacement:mock.fn((origin,dir,distance)=>origin.clone().addScaledVector(dir,distance).set(origin.x,.34,origin.z+distance)),nextRandom};
  vm.createContext(context);vm.runInContext('Math.random=nextRandom;',context);vm.runInContext(source+'\n;globalThis.__BOT_DEPLOYABLES_TEST__={tryPlantBotMine,tryPlantBotBomb};',context,{filename:'src/ai/bot-deployables.js'});
  return {context,randomCount:()=>randomIndex};
}
function makeBot(overrides={}){return {team:'ally',role:'assault',commandDoctrine:'hold',mineCD:0,bombCD:0,canSeeTarget:true,baseDmgMul:1.5,group:{position:new Vec3(2,0,3),rotation:{y:0}},aiState:'engage',sT:.1,burstLeft:4,burstPauseT:.2,...overrides};}

test('bomb180s lock belongs to each bot, successful retry at zero and never during lock',()=>{
 const {context}=createHarness({randoms:[0,0,0,0,0,0]});const a=makeBot(),b=makeBot();
 const plant=context.__BOT_DEPLOYABLES_TEST__.tryPlantBotBomb,target=new Vec3(0,0,10);
 assert.equal(plant(a,18,target),true);assert.equal(a.bombCD,180);assert.equal(b.bombCD,0);
 assert.equal(plant(a,18,target),false);assert.equal(plant(b,18,target),true);assert.equal(b.bombCD,180);
 a.bombCD=.001;assert.equal(plant(a,18,target),false);a.bombCD=0;assert.equal(plant(a,18,target),true);assert.equal(a.bombCD,180);
});
function near(a,e,l,eps=1e-9){assert.ok(Math.abs(a-e)<=eps,l+' expected '+e+', got '+a);}
test('mine planting preserves decision/random order, spawn state and cooldown',()=>{const {context,randomCount}=createHarness({randoms:[.7,.2,.4]});const bot=makeBot({role:'engineer',commandDoctrine:'hold'});const before={aiState:bot.aiState,sT:bot.sT,burstLeft:bot.burstLeft,burstPauseT:bot.burstPauseT};assert.equal(context.__BOT_DEPLOYABLES_TEST__.tryPlantBotMine(bot,5,new Vec3(0,0,8)),true);assert.equal(randomCount(),3);assert.equal(context.mkMine.mock.callCount(),1);assert.equal(context.scene.add.mock.callCount(),1);assert.equal(context.mines.length,1);const mn=context.mines[0];near(mn.m.position.x,2,'mine x');near(mn.m.position.z,3.65,'mine z');near(mn.aT,1.04,'arm delay');near(mn.checkT,.12,'check delay');near(mn.dmg,105*1.2*1.1*1.5,'mine damage');assert.equal(mn.team,'ally');assert.equal(mn.owner,'bot');assert.equal(mn.src,bot);assert.equal(bot.mineCD,30);assert.deepEqual({aiState:bot.aiState,sT:bot.sT,burstLeft:bot.burstLeft,burstPauseT:bot.burstPauseT},before);});
test('mine eligibility fails before randomness or construction',()=>{const {context,randomCount}=createHarness({randoms:[.1]});const bot=makeBot({mineCD:2});assert.equal(context.__BOT_DEPLOYABLES_TEST__.tryPlantBotMine(bot,5,new Vec3()),false);assert.equal(randomCount(),0);assert.equal(context.mkMine.mock.callCount(),0);assert.equal(context.mines.length,0);});
test('bomb planting preserves doctrine chance, collision placement, fuse and cooldown random order',()=>{const {context,randomCount}=createHarness({randoms:[.3,.25]});const bot=makeBot({role:'engineer',commandDoctrine:'breach'});assert.equal(context.__BOT_DEPLOYABLES_TEST__.tryPlantBotBomb(bot,18,new Vec3(0,0,10)),true);assert.equal(randomCount(),2);assert.equal(context.mkBomb.mock.callCount(),1);assert.equal(context.safeBombPlacement.mock.callCount(),1);const mn=context.mines[0];near(mn.m.position.x,2,'bomb x');near(mn.m.position.y,.34,'bomb y');near(mn.m.position.z,4.05,'bomb z');assert.equal(mn.kind,'bomb');assert.equal(mn.fuseT,45);assert.equal(mn.fuseTotal,45);near(mn.dmg,10500*1.18,'bomb damage');assert.equal(mn.radius,32);assert.equal(bot.bombCD,180);});
test('bomb spacing guard fails before randomness or construction',()=>{const {context,randomCount}=createHarness({randoms:[.01],bombNear:true});const bot=makeBot({role:'engineer',commandDoctrine:'breach'});assert.equal(context.__BOT_DEPLOYABLES_TEST__.tryPlantBotBomb(bot,18,new Vec3()),false);assert.equal(randomCount(),0);assert.equal(context.mkBomb.mock.callCount(),0);assert.equal(context.mines.length,0);assert.equal(context.bombNearPoint.mock.callCount(),1);});
