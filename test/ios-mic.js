// iPad-style mic: words arrive only after stop(). Checks listen() still returns them and the matcher accepts.
const {chromium}=require('playwright');const fs=require('fs');
const c=fs.readFileSync(__dirname+'/../src/10-core.js','utf8');
const grab=(start,end)=>{const a=c.indexOf(start);return c.slice(a,c.indexOf(end,a)+end.length)};
const code=['const SR=window.webkitSpeechRecognition;let MIC="unknown",MICFAIL=0,MICERR="";',grab('function listen(ms)','\n})}\n'),
 grab('const norm=','\n'),grab('const NUMWORDS=','\n'),grab('const HOMO=','};\n'),grab('const sameSound=','\n'),grab('function lev1','\n'),grab('const soundsLike=','\n'),grab('function wordMatch','\n')].join('\n');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
for(const mode of ['afterStop','normal']){
 await p.setContent('<html></html>');
 await p.evaluate(({code,mode})=>{class F{start(){if(mode==='normal'){const s=this;setTimeout(()=>{s.onresult({results:[Object.assign([{transcript:'World'}],{isFinal:true})]});s.onend()},200)}}stop(){const s=this;if(mode==='afterStop')setTimeout(()=>{s.onresult({results:[Object.assign([{transcript:'World'}],{isFinal:true})]});s.onend()},300)}abort(){}}
  window.webkitSpeechRecognition=F;window.speechSynthesis={cancel(){}};(0,eval)(code+';window.listen=listen;window.wordMatch=wordMatch;')},{code,mode});
 const r=await p.evaluate(async()=>{const t=Date.now();const x=await listen(2000);return {x,ms:Date.now()-t,ok:wordMatch('world',x.text||'',x.alts).every(y=>y.ok)}});
 console.log(mode,JSON.stringify(r));}
await b.close()})();
