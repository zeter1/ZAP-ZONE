function stringifyConsoleArg(arg){
  if(!arg||typeof arg!=='object')return String(arg??'');
  if(Object.prototype.hasOwnProperty.call(arg,'value')){
    const value=arg.value;
    if(typeof value==='string')return value;
    try{return JSON.stringify(value);}catch{return String(value);}
  }
  return String(arg.description??arg.unserializableValue??arg.type??'');
}

export function classifyBrowserDiagnostic(message){
  if(!message||typeof message!=='object')return null;

  if(message.method==='Runtime.exceptionThrown'){
    const details=message.params?.exceptionDetails||{};
    return {
      kind:'exception',level:'error',fatal:true,
      text:String(details.exception?.description??details.text??'Unhandled runtime exception'),
      source:'runtime',url:String(details.url??''),
      line:Number.isInteger(details.lineNumber)?details.lineNumber:null,
      column:Number.isInteger(details.columnNumber)?details.columnNumber:null
    };
  }

  if(message.method==='Runtime.consoleAPICalled'){
    const type=message.params?.type;
    if(type!=='error'&&type!=='warning')return null;
    const stackFrame=message.params?.stackTrace?.callFrames?.[0];
    const text=(message.params?.args||[]).map(stringifyConsoleArg).filter(Boolean).join(' ').trim();
    return {
      kind:'console',level:type,fatal:type==='error',
      text:text||`console.${type}`,source:'console',url:String(stackFrame?.url??''),
      line:Number.isInteger(stackFrame?.lineNumber)?stackFrame.lineNumber:null,
      column:Number.isInteger(stackFrame?.columnNumber)?stackFrame.columnNumber:null
    };
  }

  if(message.method==='Log.entryAdded'){
    const entry=message.params?.entry;
    if(entry?.level!=='error'&&entry?.level!=='warning')return null;
    return {
      kind:'log',level:entry.level,fatal:entry.level==='error',
      text:String(entry.text??`log.${entry.level}`),source:String(entry.source??'log'),url:String(entry.url??''),
      line:Number.isInteger(entry.lineNumber)?entry.lineNumber:null,column:null
    };
  }

  return null;
}

export function formatBrowserDiagnostic(diagnostic){
  if(!diagnostic)return '';
  const location=diagnostic.url
    ? ` @ ${diagnostic.url}${diagnostic.line!==null?`:${diagnostic.line}`:''}${diagnostic.column!==null?`:${diagnostic.column}`:''}`
    : '';
  const source=diagnostic.source?`[${diagnostic.source}] `:'';
  return `${diagnostic.kind}.${diagnostic.level} ${source}${diagnostic.text}${location}`.trim();
}
