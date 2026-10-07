import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const combat=readFileSync(new URL('../src/combat/combat.js',import.meta.url),'utf8');
function fn(name){const start=combat.indexOf('function '+name+'(');assert.ok(start>=0,name);let end=combat.indexOf('{',start)+1,d=1;for(;d;end++){if(combat[end]==='{')d++;if(combat[end]==='}')d--;}return combat.slice(start,end);}
const cloud={radius:19.5,age:8,life:52,density:1,m:{position:{x:0,y:.12,z:0}}};
function fixture(){const c={Math,smokeClouds:[cloud]};vm.createContext(c);vm.runInContext(fn('smokeEnvelope42')+'\n'+fn('smokeVisibilityBetween42'),c);return c;}
test('ground-covering density has a broad base and vanishes at every container edge',()=>{
 const c=fixture();assert.ok(c.smokeEnvelope42(cloud,0,.08,0)>.8);assert.ok(c.smokeEnvelope42(cloud,8,1.75,0)>.8);
 for(const p of [[19.5,3,0],[-19.5,3,0],[0,3,19.5],[0,3,-19.5],[0,-.01,0],[0,19.5*.48,0]])assert.equal(c.smokeEnvelope42(cloud,...p),0);
});
test('dense smoke hides DOM objects inside/behind, preserving foreground and clear paths',()=>{
 const c=fixture();const v=(x,y,z)=>({x,y,z});
 assert.ok(c.smokeVisibilityBetween42(v(0,1.75,0),v(0,1.75,-12))<.01);
 assert.ok(c.smokeVisibilityBetween42(v(0,1.75,32),v(0,1.75,-24))<.01);
 assert.equal(c.smokeVisibilityBetween42(v(0,1.75,32),v(0,1.75,25)),1);
 assert.equal(c.smokeVisibilityBetween42(v(50,1.75,32),v(50,1.75,-24)),1);
 assert.equal(c.smokeVisibilityBetween42(v(0,-1,0),v(0,-1,-12)),1);
 const old=cloud.density;cloud.density=0;assert.equal(c.smokeVisibilityBetween42(v(0,1.75,0),v(0,1.75,-12)),1);cloud.density=old;
});
test('short segments and vertical ground/roof boundaries stay finite and recover after expiry',()=>{
 const c=fixture(),v=(x,y,z)=>({x,y,z});assert.equal(c.smokeVisibilityBetween42(v(0,1,0),v(0,1,0)),1);
 assert.ok(c.smokeVisibilityBetween42(v(0,.01,0),v(0,6,0))<.01);
 c.smokeClouds=[];assert.equal(c.smokeVisibilityBetween42(v(0,1,0),v(0,1,10)),1);
});
