import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vec3 {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
}

const stateSource=readFileSync(new URL('../src/player/state.js',import.meta.url),'utf8');
const runtimeSource=readFileSync(new URL('../src/game/runtime.js',import.meta.url),'utf8');
const statePreludeEnd=stateSource.indexOf('const ALL_PERKS=');
assert.ok(statePreludeEnd>0,'player state prelude marker must exist');

const context={
  STARTING_AMMO:[15],
  STARTING_RESERVE:[75],
  STARTING_OWNED:[true],
  THREE:{Vector3:Vec3}
};
vm.createContext(context);
vm.runInContext(
  stateSource.slice(0,statePreludeEnd)+
  '\n;globalThis.__PLAYER_CROUCH_TEST__={PLAYER_STAND_EYE_HEIGHT,PLAYER_CROUCH_EYE_HEIGHT,PLAYER_CROUCH_SPEED_M,PLAYER_STANCE_SPEED,playerCrouchHeld,approachPlayerEyeHeight};',
  context,
  {filename:'src/player/state.js'}
);
const api=context.__PLAYER_CROUCH_TEST__;

test('X activates crouch input without Ctrl or Shift conflicts',()=>{
  assert.equal(api.playerCrouchHeld({}),false);
  assert.equal(api.playerCrouchHeld({KeyX:true}),true);
  assert.equal(api.playerCrouchHeld({ControlLeft:true}),false);
  assert.equal(api.playerCrouchHeld({ShiftLeft:true}),false);
});

test('crouch stance is lower and slower than standing',()=>{
  assert.equal(api.PLAYER_STAND_EYE_HEIGHT,1.75);
  assert.ok(api.PLAYER_CROUCH_EYE_HEIGHT<api.PLAYER_STAND_EYE_HEIGHT);
  assert.ok(api.PLAYER_CROUCH_SPEED_M>0&&api.PLAYER_CROUCH_SPEED_M<1);
});

test('stance height transition is bounded and never overshoots',()=>{
  const down=api.approachPlayerEyeHeight(1.75,1.08,.05);
  assert.ok(down<1.75&&down>1.08);
  const up=api.approachPlayerEyeHeight(1.08,1.75,.05);
  assert.ok(up>1.08&&up<1.75);
  assert.equal(api.approachPlayerEyeHeight(1.10,1.08,1),1.08);
  assert.equal(api.approachPlayerEyeHeight(1.73,1.75,1),1.75);
});

test('runtime wires X crouch while keeping Shift sprint',()=>{
  assert.match(runtimeSource,/const runHeld=\(K\['ShiftLeft'\]\|\|K\['ShiftRight'\]\|\|mobileInput\.run\);/);
  assert.match(runtimeSource,/const crouchHeld=!IS_TOUCH&&playerCrouchHeld\(K\);/);
  assert.match(runtimeSource,/const sprintAllowed=!crouchHeld&&!reloading/);
  assert.match(runtimeSource,/const stanceSpeedM=crouching\?PLAYER_CROUCH_SPEED_M:1;/);
  assert.match(runtimeSource,/&&onGnd&&!crouchHeld\)\{jumpV=/);
  assert.match(runtimeSource,/targetEyeHeight=crouching\?PLAYER_CROUCH_EYE_HEIGHT:PLAYER_STAND_EYE_HEIGHT/);
  assert.match(runtimeSource,/camera\.position\.y=approachPlayerEyeHeight\(camera\.position\.y,targetEyeHeight,dt\)/);
});
