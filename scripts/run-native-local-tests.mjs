import {spawnSync} from 'node:child_process';
for(const file of ['test-initialization.mjs','test-financing.mjs','test-documents.mjs','test-native-sol.mjs','test-financing.mjs']){
  const result=spawnSync(process.execPath,['scripts/'+file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);
}
