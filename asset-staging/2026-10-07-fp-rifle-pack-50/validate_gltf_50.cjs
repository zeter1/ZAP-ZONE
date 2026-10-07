const fs=require('fs');
const path=require('path');
const validator=require(path.join(process.env.TEMP,'zap-gltf-validator-50','node_modules','gltf-validator'));
const file=path.resolve(__dirname,'../../assets/weapons/models/zap-fp-rifle-50.glb');
const reportFile=path.resolve(__dirname,'gltf-validator-report.json');
validator.validateBytes(new Uint8Array(fs.readFileSync(file)),{uri:path.basename(file)})
  .then(report=>{
    fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
    const summary={
      version:report.validatorVersion,
      errors:report.issues.numErrors,
      warnings:report.issues.numWarnings,
      infos:report.issues.numInfos,
      hints:report.issues.numHints,
      triangles:report.info?.totalTriangleCount,
      drawCalls:report.info?.drawCallCount
    };
    console.log(JSON.stringify(summary,null,2));
    if(summary.errors||summary.warnings||summary.infos||summary.hints)process.exitCode=1;
  })
  .catch(error=>{console.error(error);process.exitCode=2;});
