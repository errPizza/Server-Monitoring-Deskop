const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
test('login and refresh match the mobile server JSON parser contract',async()=>{
  const values=new Map([['pi-command-center.refresh-token','refresh-test-token']]);
  const requests=[];
  const scope={exports:{},crypto:require('node:crypto').webcrypto,AbortController,setTimeout,clearTimeout,require:id=>{
    if(id==='./Desktop')return {apiFetch:(...args)=>scope.fetch(...args),desktop:{config:{platform:'win32'}},secureStore:{getItemAsync:async key=>values.get(key)||null,setItemAsync:async(key,value)=>values.set(key,value),deleteItemAsync:async key=>values.delete(key)}};
    if(id==='react-native')return {Platform:{OS:'android'}};
    if(id==='../config/environment')return {environment:{apiBaseUrl:'https://example.invalid/api',requestTimeoutMs:1000}};
    throw Error(id);
  },fetch:async(url,options)=>{
    // Fastify's production JSON parser puts the posted object in body.data.
    const request={body:{data:JSON.parse(options.body)}};
    requests.push(request.body.data);
    if(url.endsWith('/login')){
      assert.equal(request.body.data.email,'user@example.invalid');assert.equal(request.body.data.password,'test-password');
      assert.ok(request.body.data.deviceId.length>=8);assert.equal(request.body.data.platform,'win32');
      return {ok:true,json:async()=>({status:'pending',session:{id:'test',deviceName:'Test',requestedAt:1}})};
    }
    assert.equal(request.body.data.refreshToken,'refresh-test-token');
    return {ok:true,json:async()=>({accessToken:'new-access',refreshToken:'new-refresh'})};
  }};
  const code=fs.readFileSync('src/services/AuthService.ts','utf8');
  vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,scope);
  assert.equal((await scope.exports.authService.login('user@example.invalid','test-password')).status,'pending');
  const refreshed = await Promise.all([scope.exports.authService.refresh(), scope.exports.authService.refresh(), scope.exports.authService.refresh()]);
  assert.ok(refreshed.every(Boolean));assert.equal(scope.exports.tokenStore.getAccessToken(),'new-access');assert.equal(requests.length,2);
});
