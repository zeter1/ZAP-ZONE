import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const engine=readFileSync('src/core/engine.js','utf8');
const runtime=readFileSync('src/game/runtime.js','utf8');
const settings=readFileSync('src/settings/settings.js','utf8');
const html=readFileSync('index.html','utf8');

function ownerFunction(source,name,globals={}){
  const body=source.match(new RegExp('function '+name+'\\([^]*?\\n\\}'));
  assert.ok(body,'Missing production policy: '+name);
  return runInNewContext(body[0]+';'+name,globals);
}

test('low FPS keeps real elapsed simulation time without losing a third of every frame',()=>{
  const max=Number(runtime.match(/const MAX_ACTIVE_STEP_SECONDS=(\.\d+);/)?.[1]);
  assert.equal(max,.075);
  const simulationDt=ownerFunction(runtime,'activeSimulationDelta',{MAX_ACTIVE_STEP_SECONDS:max});
  assert.ok(Math.abs(simulationDt(1/20)-1/20)<1e-12,'20 FPS must not run at 66% speed');
  assert.ok(Math.abs(simulationDt(1/15)-1/15)<1e-12,'15 FPS must retain elapsed time');
  assert.equal(simulationDt(.2),.075,'avoid huge simulation jumps');
  assert.equal(simulationDt(-1),0);
  assert.equal(simulationDt(NaN),0);
  assert.match(runtime,/sampleAdaptiveGraphics\(rawDt\)/);
  assert.match(runtime,/const deathDt=activeSimulationDelta\(rawDt\)/);
});

test('missing Safari deviceMemory is not misclassified as 4GB',()=>{
  assert.match(engine,/HW_MEMORY=Number\.isFinite\(reportedMemory\).*?null/);
  const tier=ownerFunction(engine,'initialGraphicsTier');
  assert.equal(tier(false,false,false,false),2);
  assert.equal(tier(false,false,false,true),1,'unknown Mac memory or mobile Radeon starts in balanced graphics');
  assert.match(engine,/const GRAPHICS_RADEON_5300M=/);
  assert.match(engine,/GRAPHICS_MAC&&HW_MEMORY===null/);
  assert.match(engine,/\|\|GRAPHICS_RADEON_5300M/);
  assert.equal(tier(false,false,true,true),0,'integrated Intel graphics starts low');
  assert.equal(tier(true,false,false,false),0);
  assert.equal(tier(false,true,false,false),0);
});

test('adaptive resolution downgrades quickly and upgrades only after sustained good frames',()=>{
  const decide=ownerFunction(engine,'chooseNextGraphicsTier');
  const slow=decide(1/30,.2,2,2,2);
  assert.equal(slow.tier,1);
  assert.equal(slow.goodWindows,0);
  assert.equal(decide(1/25,.8,0,2,0).tier,0);
  const good1=decide(1/60,0,0,2,0);
  const good2=decide(1/60,0,good1.tier,2,good1.goodWindows);
  const good3=decide(1/60,0,good2.tier,2,good2.goodWindows);
  assert.equal(good1.tier,0);
  assert.equal(good2.tier,0);
  assert.equal(good3.tier,1);
  assert.equal(good3.goodWindows,0);
  assert.equal(decide(1/60,0,1,1,2).tier,1,'integrated GPU auto quality is capped');
  assert.match(engine,/renderer\.setPixelRatio\(graphicsPixelRatio\(next\)\)/);
  assert.match(engine,/renderer\.shadowMap\.enabled=next===2/);
});

test('graphics manual override and accurate FPS are wired through settings',()=>{
  assert.match(html,/id="setting-graphics"/);
  assert.match(html,/<option value="auto">/);
  assert.match(settings,/graphicsQuality:\['auto','low','medium','high'\]/);
  assert.match(settings,/setGraphicsQualityMode\(gameSettings\.graphicsQuality\)/);
  assert.match(settings,/fpsAccum\+=frameDt/);
  assert.doesNotMatch(settings,/fpsAccum\+=safeDt/);
});
