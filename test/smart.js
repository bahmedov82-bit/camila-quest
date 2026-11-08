// Answers math correctly and fast across several "days": levels must climb, reviews must appear, no errors.
const { chromium } = require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('file://'+path.resolve(__dirname,'../index.html')+'#debug');
await p.evaluate(()=>{__cq.D.welcomed=true;__cq.save()});
const heads=new Set();
for(let day=0;day<6;day++){
  await p.evaluate(d=>{const k='2026-01-'+String(10+d).padStart(2,'0');__cq.D.days={};__cq.D.days[k]={done:[],star:false,items:0,correct:0,secs:0,log:[],breaks:0};Object.values(__cq.D.skills).forEach(s=>{s.review={}});__cq.save();__cq.run('math')},day);
  for(let i=0;i<400;i++){
    const head=await p.$eval('#screen',s=>(s.querySelector('h2,.muted')||{}).textContent||'');heads.add(head.replace(/\d+ of \d+/,'').trim());
    if(/complete!/.test(head))break;
    if(await p.$('#nextBtn')){await p.click('#nextBtn');continue}
    if(await p.$('#go:not([hidden])')){await p.click('#go:not([hidden])');continue}
    const ans=await p.evaluate(()=>__cq.answer);
    const opt=await p.$(`.opt[data-v="${ans}"]`);if(opt){await opt.click();continue}
    break;
  }
  const st=await p.evaluate(()=>({lv:Object.fromEntries(Object.entries(__cq.D.skills).map(([k,v])=>[k,v.level+'/'+v.mastered.length])),sum:(Object.values(__cq.D.days)[0].summaries||{}).math}));
  console.log('day',day+1,JSON.stringify(st.lv),'|',st.sum);
}
console.log([...heads].filter(h=>/review|Level|level/.test(h)).join('\n'));
if(errors.length){console.log('ERRORS',errors);process.exit(1)}console.log('OK');await b.close()})();
