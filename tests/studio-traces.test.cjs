const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const cache={};
function load(file){
 if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
 if(cache[file])return cache[file];
 const scope={exports:{},require:id=>{
  const full=path.resolve(path.dirname(file),id);
  return load(full.endsWith('.json')?full:full+'.ts');
 }};
 const code=fs.readFileSync(file,'utf8');
 vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,scope);
 return cache[file]=scope.exports;
}
const {studioTraces,traceWindow,pointAlong,STUDIO_DURATION}=load(path.join(__dirname,'../src/components/intro/studioTraceTimeline.ts'));

test('moving strokes stay on their finite paths, with the head ahead of the tail',()=>{
 for(const trace of studioTraces){
  for(let ms=0;ms<=STUDIO_DURATION;ms+=17){
   const f=traceWindow(trace,ms);
   assert.ok(f.head>=f.tail-1e-6 && f.tail>=0 && f.head<=trace.length);
   assert.ok(f.opacity>=0 && f.opacity<=1);
   const p=pointAlong(trace,f.head);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
  }
 }
});
test('held title contains only complete glyph paths, with no moving colored tips',()=>{
 for(const trace of studioTraces){
  for(const ms of [5200,5700,6200]){
   const f=traceWindow(trace,ms);
   assert.equal(f.tail,trace.targetStart);
   assert.equal(f.head,trace.length);
   assert.equal(f.opacity,1);
   assert.equal(f.accent,0);
  }
 }
});
test('all strokes are gone before the next scene',()=>{
 for(const trace of studioTraces)assert.equal(traceWindow(trace,STUDIO_DURATION).opacity,0);
});
test('reduced motion never slides the visible section along a contour',()=>{
 for(const trace of studioTraces){
  for(const ms of [0,1600,3000,5000]){
   const f=traceWindow(trace,ms,true);
   assert.equal(f.tail,trace.targetStart);assert.equal(f.head,trace.length);assert.equal(f.accent,0);
  }
 }
});

test('every bitmap trajectory participates and erasure follows its moving tail',()=>{
 const contours=load(path.join(__dirname,'../src/components/intro/studioEmblemContours.json'));
 assert.equal(studioTraces.length,contours.tracks.length);
 assert.ok(contours.coverage>.9999);
 for(const trace of studioTraces){
  assert.equal(traceWindow(trace,1000).erased,0);
  assert.equal(traceWindow(trace,4500).erased,trace.sourceLength);
  let previous=0;
  for(let ms=0;ms<5000;ms+=31){
   const f=traceWindow(trace,ms);
   assert.equal(f.erased,Math.min(trace.sourceLength,f.tail));
   assert.ok(f.erased>=previous);previous=f.erased;
  }
 }
});
