import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const combat=read('src/combat/combat.js'),control=read('src/ai/bot-fire-control.js'),cadence=read('src/ai/bot-fire-cadence.js');
const outcomes={EMITTED:'emitted',OCCLUDED:'blocked-occluded',FRIENDLY_FIRE:'blocked-friendly-fire',ROCKET_SAFETY:'blocked-rocket-safety',ROCKET_COOLDOWN:'blocked-rocket-cooldown'};
test('player cannot bypass rocket cooldown by resetting common shot timer or reloading',()=>{
 const start=combat.indexOf('function shoot(){'),end=combat.indexOf('  if(!infiniteAmmo&&ammo<=0)',start);
 const messages=[],c={getW:()=>({isRocket:true}),testingInfiniteAmmoEnabled:()=>true,reloading:false,sCD:0,playerRocketShotCD:9.9,pRkts:[],showMsg:(...args)=>messages.push(args),weaponActionBlocked:()=>false};
 vm.createContext(c);vm.runInContext(combat.slice(start,end)+"return 'ready';}",c);
 assert.equal(c.shoot(),undefined);assert.deepEqual(messages.pop(),['Перезарядка и остывание ракетницы',true]);
 c.playerRocketShotCD=0;c.pRkts.push({});assert.equal(c.shoot(),'ready');assert.equal(messages.length,0);c.pRkts.length=0;
 c.reloading=true;assert.equal(c.shoot(),undefined);assert.equal(messages.length,1);c.reloading=false;assert.equal(c.shoot(),'ready');
 c.playerRocketShotCD=8;c.getW=()=>({key:'pistol'});assert.equal(c.shoot(),'ready');
});
test('bot weapon switch cannot bypass its rocket interval and blocked attempt emits nothing',()=>{
 const start=control.indexOf('function executeBotShot('),end=control.indexOf('  const from=getBotMuzzlePos',start);
 const c={BOT_SHOT_OUTCOME:outcomes};vm.createContext(c);vm.runInContext(control.slice(start,end)+"return 'ready';}",c);
 const bot={weapon:{isRocket:true},rocketShotCD:9.9};assert.equal(c.executeBotShot(bot),outcomes.ROCKET_COOLDOWN);
 bot.rocketShotCD=0;assert.equal(c.executeBotShot(bot),'ready');bot.weapon={key:'rifle'};bot.rocketShotCD=9;assert.equal(c.executeBotShot(bot),'ready');
});
test('centered rocket warning expires and ordinary messages return to their normal placement',()=>{
 const progression=read('src/progression/progression.js'),start=progression.indexOf('let _msgT=0;'),end=progression.indexOf('\n',start);
 const el={style:{},classList:{toggle(name,value){this[name]=value;}}},timers=new Map();let sequence=0;
 const c={G:()=>el,setTimeout(fn,delay){assert.equal(delay,2200);timers.set(++sequence,fn);return sequence;},clearTimeout(id){timers.delete(id);}};
 vm.createContext(c);vm.runInContext(progression.slice(start,end),c);
 c.showMsg('Перезарядка и остывание ракетницы',true);assert.equal(el.textContent,'Перезарядка и остывание ракетницы');assert.equal(el.style.opacity,'1');assert.equal(el.classList['rocket-cooling-message'],true);
 c.showMsg('Перезарядка и остывание ракетницы',true);assert.equal(timers.size,1);timers.get(sequence)();assert.equal(el.style.opacity,'0');
 c.showMsg('Обычное уведомление');assert.equal(el.classList['rocket-cooling-message'],false);assert.equal(el.style.opacity,'1');
});
test('rocket cooldown starts at launch and impact never restarts it',()=>{
 const start=combat.indexOf('function detonateRocket('),end=combat.indexOf('\nfunction ',start+1),source=combat.slice(start,end);
 assert.ok(!source.includes('playerRocketShotCD='));
 const launchStart=combat.indexOf('    playerRocketShotCD=ROCKET_FIRE_INTERVAL;');assert.ok(launchStart>=0);
 const clockStart=combat.indexOf('function tickRocketFireCooldowns('),clockEnd=combat.indexOf('\nfunction ',clockStart+1);
 const c={playerRocketShotCD:10,ROCKET_BLAST_RADIUS:9.1,enemies:[],camera:{position:{distanceTo:()=>200}},showGeneratedRocketExplosionVfx:()=>true,explode(){},applyBlastDamage(){},destroySceneObject(){}};
 vm.createContext(c);vm.runInContext(combat.slice(clockStart,clockEnd)+source,c);
 c.tickRocketFireCooldowns(3);const r={m:{},ownerType:'player',blastRadius:9.1,dmg:0},arr=[r];c.detonateRocket(arr,0,r,{clone(){return this;}});assert.equal(c.playerRocketShotCD,7);assert.equal(arr.length,0);
 c.tickRocketFireCooldowns(7);assert.equal(c.playerRocketShotCD,0);
});
test('bot cooldown scheduling preserves burst/ammo and does not draw random values',()=>{
 const c={BOT_SHOT_OUTCOME:outcomes,Math:Object.create(Math)};c.Math.random=()=>{throw Error('blocked cooldown must not draw RNG');};vm.createContext(c);vm.runInContext(cadence,c);
 const bot={rocketShotCD:7.25,burstLeft:3,mag:1};c.applyBotFireCadence(bot,outcomes.ROCKET_COOLDOWN);
 assert.equal(bot.sT,7.25);assert.equal(bot.burstLeft,3);assert.equal(bot.mag,1);
});
test('active simulation counts down separate player/bot timers independently of selected weapon',()=>{
 const start=combat.indexOf('function tickRocketFireCooldowns(');assert.ok(start>=0);
 const end=combat.indexOf('\nfunction ',start+1),c={playerRocketShotCD:10,enemies:[{rocketShotCD:10},{rocketShotCD:0}]};
 vm.createContext(c);vm.runInContext(combat.slice(start,end),c);c.tickRocketFireCooldowns(9.99);
 assert.ok(c.playerRocketShotCD>0);assert.ok(c.enemies[0].rocketShotCD>0);c.tickRocketFireCooldowns(.02);
 assert.equal(c.playerRocketShotCD,0);assert.equal(c.enemies[0].rocketShotCD,0);assert.equal(c.enemies[1].rocketShotCD,0);
});
test('runtime counts rocket interval before any new player or bot firing, after pause gates',()=>{
 const runtime=read('src/game/runtime.js'),clock=runtime.indexOf('tickRocketFireCooldowns(dt);');
 assert.ok(clock>runtime.indexOf('if(perkPickOpen||paused)'));assert.ok(clock<runtime.indexOf('const activeW=getW()'));
 assert.ok(clock<runtime.indexOf('const mel=en.update(dt)'));assert.ok(!combat.includes('function tickProjectiles(dt){\n  tickRocketFireCooldowns(dt);'));
});
test('killcam active world counts rocket cooldown before bot firing as well',()=>{
 const progression=read('src/progression/progression.js'),start=progression.indexOf('function tickDeathWorld(dt){'),end=progression.indexOf('\nfunction ',start+1),source=progression.slice(start,end);
 assert.ok(source.indexOf('tickRocketFireCooldowns(dt);')>=0);assert.ok(source.indexOf('tickRocketFireCooldowns(dt);')<source.indexOf('en.update('));
 const bot={rocketShotCD:10,alive:true,update(){assert.equal(this.rocketShotCD,9.5);}},c={playerRocketShotCD:10,enemies:[bot],gameSettings:{stopBots:false}};
 for(const name of ['tickProjectiles','tickMines','syncExplosiveFuseArt','tickSmoke','tickParticles','tickGibs','tickCasings','tickImpactMarks','tickExpLights','tickMzLights','tickBombBlastWaves','updateAllyPanel'])c[name]=()=>{};
 const clockStart=combat.indexOf('function tickRocketFireCooldowns('),clockEnd=combat.indexOf('\nfunction ',clockStart+1);
 vm.createContext(c);vm.runInContext(combat.slice(clockStart,clockEnd)+source,c);c.tickDeathWorld(.5);assert.equal(c.playerRocketShotCD,9.5);
});
