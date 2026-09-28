import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../src/game/frontline.js',import.meta.url),'utf8');

function makeHarness({playerInside=false}={}){
  const elements=new Map();
  const element=id=>{
    if(!elements.has(id))elements.set(id,{
      id,style:{},textContent:'',offsetWidth:1,onanimationend:null,
      classList:{add(){},remove(){},toggle(){}},
    });
    return elements.get(id);
  };
  class DummyMaterial{
    constructor(options={}){Object.assign(this,options);this.color={setHex(){}};}
  }
  class DummyObject{
    constructor(){
      this.position={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;}};
      this.rotation={x:0};
      this.scale={set(){}};
      this.material=new DummyMaterial();
    }
  }
  class Group extends DummyObject{add(){}}
  class Mesh extends DummyObject{constructor(_geometry,material){super();this.material=material;}}
  const presence={ally:0,enemy:0};
  const context=vm.createContext({
    console,
    performance:{now:()=>1000},
    BOT_MAP_ZONES:[
      {id:'mid',label:'ЦЕНТР',x:0,z:0,r:10,weight:1},
      {id:'right',label:'ПРАВЫЙ ФЛАНГ',x:20,z:0,r:8,weight:2},
    ],
    dying:false,
    camera:{position:{x:playerInside?0:100,z:playerInside?0:100}},
    yaw:0,
    THREE:{
      Group,Mesh,
      RingGeometry:class{},CircleGeometry:class{},CylinderGeometry:class{},
      MeshBasicMaterial:DummyMaterial,DoubleSide:2,
    },
    scene:{add(){}},
    G:element,
    BOT_TEAM_TACTICS:{ally:{orderUntil:0},enemy:{orderUntil:0}},
    botZonePresence:(_zone,team)=>presence[team],
    score:0,
    xpAwarded:0,
    hudMarks:0,
    teamScoreUpdates:0,
    saved:0,
    captureSounds:[],
    messages:[],
    announcements:[],
    addXP(value){context.xpAwarded+=value;},
    markHUD(){context.hudMarks+=1;},
    updateTeamScore(){context.teamScoreUpdates+=1;},
    saveProgress(force){if(force)context.saved+=1;},
    playObjectiveCaptureSound(team){context.captureSounds.push(team);},
    showMsg(message){context.messages.push(message);},
    showAnn(message){context.announcements.push(message);},
  });
  vm.runInContext(source,context,{filename:'src/game/frontline.js'});
  return{context,presence,run(code){return vm.runInContext(code,context);}};
}

test('Frontline restore sanitizes persisted state and serialize preserves the public schema',()=>{
  const h=makeHarness();
  const data={zoneId:'right',progress:999,owner:'invalid',rotateT:999,zoneOwners:{mid:'ally',right:'enemy'},allyControlScore:3.9,enemyControlScore:-2};
  h.run('restoreFrontlineObjective('+JSON.stringify(data)+')');
  const saved=h.run('serializeFrontlineObjective()');
  assert.deepEqual(JSON.parse(JSON.stringify(saved)),{
    zoneId:'right',progress:100,owner:null,rotateT:44,
    zoneOwners:{mid:'ally',right:'enemy'},allyControlScore:3,enemyControlScore:0,
  });
});

test('Frontline hard reset clears control scores and zone ownership',()=>{
  const h=makeHarness();
  const data={zoneId:'right',progress:-55,owner:'enemy',rotateT:20,zoneOwners:{mid:'ally',right:'enemy'},allyControlScore:2,enemyControlScore:4};
  h.run('restoreFrontlineObjective('+JSON.stringify(data)+')');
  h.run("resetFrontlineObjective('mid',true)");
  const saved=h.run('serializeFrontlineObjective()');
  assert.deepEqual(JSON.parse(JSON.stringify(saved)),{
    zoneId:'mid',progress:0,owner:null,rotateT:44,
    zoneOwners:{mid:null,right:null},allyControlScore:0,enemyControlScore:0,
  });
});

test('Frontline capture awards the assisting player once and persists the objective',()=>{
  const h=makeHarness({playerInside:true});
  const data={zoneId:'mid',progress:99,owner:null,rotateT:44,zoneOwners:{mid:null,right:null},allyControlScore:0,enemyControlScore:0};
  h.run('restoreFrontlineObjective('+JSON.stringify(data)+')');
  h.presence.ally=2.5;
  h.run('tickFrontlineObjective(1,1000)');
  h.run('tickFrontlineObjective(0.1,1016)');
  const saved=h.run('serializeFrontlineObjective()');
  assert.equal(saved.owner,'ally');
  assert.equal(saved.zoneOwners.mid,'ally');
  assert.equal(saved.allyControlScore,1);
  assert.equal(h.context.teamScoreUpdates,1);
  assert.equal(h.context.score,150);
  assert.equal(h.context.xpAwarded,35);
  assert.equal(h.context.hudMarks,1);
  assert.equal(h.context.saved,1);
  assert.deepEqual(h.context.captureSounds,['ally']);
  assert.match(h.context.messages[0],/\+150 .*\+35 XP/);
});
