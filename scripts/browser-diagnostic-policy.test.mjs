import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyBrowserDiagnostic, formatBrowserDiagnostic } from './browser-diagnostic-policy.mjs';

test('unhandled runtime exceptions are fatal and retain location context',()=>{
  const diagnostic=classifyBrowserDiagnostic({
    method:'Runtime.exceptionThrown',
    params:{exceptionDetails:{
      text:'Uncaught',url:'http://127.0.0.1:8000/src/game/runtime.js',lineNumber:41,columnNumber:7,
      exception:{description:'ReferenceError: missingThing is not defined'}
    }}
  });
  assert.equal(diagnostic?.fatal,true);
  assert.equal(diagnostic?.kind,'exception');
  assert.equal(diagnostic?.level,'error');
  assert.match(formatBrowserDiagnostic(diagnostic),/ReferenceError: missingThing/);
  assert.match(formatBrowserDiagnostic(diagnostic),/runtime\.js:41:7/);
});

test('console and Log errors fail closed while warnings remain non-fatal diagnostics',()=>{
  const cases=[
    [{method:'Runtime.consoleAPICalled',params:{type:'error',args:[{value:'bad console'}]}},true,'console.error'],
    [{method:'Runtime.consoleAPICalled',params:{type:'warning',args:[{value:'expected warning'}]}},false,'console.warning'],
    [{method:'Log.entryAdded',params:{entry:{level:'error',source:'network',text:'script failed'}}},true,'log.error'],
    [{method:'Log.entryAdded',params:{entry:{level:'warning',source:'deprecation',text:'legacy API'}}},false,'log.warning']
  ];
  for(const [message,fatal,label] of cases){
    const diagnostic=classifyBrowserDiagnostic(message);
    assert.ok(diagnostic,label+' should be collected');
    assert.equal(diagnostic.fatal,fatal,label+' fatal policy');
    assert.match(formatBrowserDiagnostic(diagnostic),new RegExp(label.replace('.','\\.')));
  }
});

test('unrelated CDP traffic is ignored instead of becoming a flaky failure',()=>{
  assert.equal(classifyBrowserDiagnostic({method:'Runtime.consoleAPICalled',params:{type:'log',args:[{value:'hello'}]}}),null);
  assert.equal(classifyBrowserDiagnostic({method:'Log.entryAdded',params:{entry:{level:'info',text:'loaded'}}}),null);
  assert.equal(classifyBrowserDiagnostic({method:'Network.requestWillBeSent'}),null);
  assert.equal(classifyBrowserDiagnostic(null),null);
});
