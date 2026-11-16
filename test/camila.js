// Plays 7 days as "Camila": starts from her real v1.7 save (low levels + a 50% starting-line check),
// answers like a learner with a true ability per island, reads aloud with a mic that mishears names.
// Prints levels per day, how many questions repeated, and fails on JS errors or stalls.
const { chromium } = require('playwright');const path=require('path');
const TRUE={numbers:6,add:6,sub:4,mul:3,money:3,frac:2,pre:0};
const P=(k,l)=>l<=TRUE[k]?0.95:l===TRUE[k]+1?0.45:0.2;
const FAKE_SR=`class FakeSR{start(){const self=this;setTimeout(()=>{const t=['#sent','#theword','.prompt.word','.prompt.small:not(.muted)'].map(q=>document.querySelector(q)).find(Boolean);let txt=t?t.textContent:'hello';
 if(/Tell me|If you had/.test(txt))txt='I would sell cookies and lemonade because people like them and they are easy to make and cheap';
 if(/Tell me the story/.test(document.body.innerText))txt='first she started a small business and the customers came and she made a profit and then she learned to save money and grow';
 txt=txt.replace(/\\b[A-Z][a-z]+\\b/g,(w,i)=>i===0?w:(Math.random()<.7?'blah':w));if(Math.random()<0.08)txt='um';
 self.onresult&&self.onresult({results:[[{transcript:txt}]]});self.onend&&self.onend()},40)}stop(){}abort(){}}
 window.SpeechRecognition=FakeSR;window.webkitSpeechRecognition=FakeSR;`;
function seed(){const sk=(lv,m)=>({level:lv,hist:{},mastered:m,review:{},reviewMiss:{}});
 const probes=[['numbers',1,1],['numbers',4,1],['add',2,1],['add',4,1],['add',5,0],['sub',2,1],['sub',3,0],['sub',4,0],['mul',1,1],['mul',2,0],['mul',4,0],['money',2,0]];
 return {name:'Camila',avatar:'🦄',welcomed:true,coins:330,stars:20,dayStars:1,streak:1,lastDay:'2026-11-15',days:{'2026-11-15':{done:['check','sparks','math','words','story','speech','typing'],star:true,items:56,correct:46,secs:360,log:[],breaks:0}},
  skills:{numbers:sk(1,[0]),add:sk(1,[0]),sub:sk(0,[]),mul:sk(0,[]),money:sk(0,[]),frac:sk(0,[]),words:sk(1,[0]),speech:sk(1,[0]),typing:sk(1,[0])},
  reading:{level:0,used:['Camila and the Red Door',"Zoe's Dog Walks"],tricky:{diaz:1,her:1,you:1,ask:1,zoe:1},history:[]},speech:{level:0,history:[]},typing:{level:0,history:[]},
  prizes:[{name:'🎧 Headphones',need:30,start:0,earned:null}],badges:['first'],checks:[{date:'2026-11-15',n:1,math:{right:6,of:12,pct:50,items:probes.map(p=>({key:p[0],level:p[1],ok:!!p[2]}))},words:{right:6,of:6,pct:100,items:['sun','ship','cake','rain','market','remember'].map(w=>({w,ok:true}))},read:{wpm:139,comp:2,secs:45}}],
  levelLog:[],settings:{items:10,breakSecs:45,parentCode:'2013'},music:false,plan:{id:'2026-11-15'},planApplied:'2026-11-15'}}
(async()=>{const b=await chromium.launch();const errors=[];let state=seed();const allQ=[];
for(let day=1;day<=7;day++){
  const date=new Date(2026,10,15+day,16,0,0);
  const page=await b.newPage({viewport:{width:820,height:1100}});
  page.on('pageerror',e=>errors.push('day'+day+' pageerror: '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' ')));
  await page.clock.setFixedTime(date);
  await page.addInitScript(FAKE_SR);
  await page.addInitScript(s=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('cq-v1',s);sessionStorage.setItem('seeded','1')}},JSON.stringify(state));
  await page.goto('file://'+path.resolve(__dirname,'../index.html')+'#debug');await page.waitForTimeout(200);
  const click=async sel=>{const el=await page.$(sel);if(!el)return false;try{await el.click({timeout:2000});return true}catch(e){return false}};
  let last='',stalls=0,steps=0;
  for(steps=0;steps<3000;steps++){
    const html=await page.$eval('#screen',s=>s.innerHTML);if(html===last){if(++stalls>25){errors.push('day'+day+' STALL: '+html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,300));break}}else stalls=0;last=html;
    if(await page.evaluate(()=>/Day complete/.test(document.body.innerText)))break;
    if(await click('#nextBtn'))continue;
    if(await click('#go:not([hidden])'))continue;
    if(await click('#next:not([hidden])'))continue;
    const inp=await page.$('#typed');if(inp){const t=await page.evaluate(()=>{const t=document.getElementById('tgt');const i=document.getElementById('typed');return t?t.textContent:(i.placeholder&&i.placeholder!=='type here'?i.placeholder:null)});
      let want=t;if(!want){await page.waitForTimeout(600);want=await page.evaluate(()=>window.__cq.spoken||'')}await inp.fill(Math.random()<0.9&&want?want:'xyz');await click('#ok');continue}
    if(await page.$('#kp .opt:not([disabled])')){const a=await page.evaluate(()=>window.__cq.answer);const v=Math.random()<0.85?a:String(+a+1);for(const ch of v)await page.click('#kp .opt[data-k="'+ch+'"]');await page.click('#kp .opt[data-k="✓"]');await page.waitForTimeout(30);continue}
    // math-style question: answer like the learner
    const isQ=await page.$('#opts .opt');
    if(isQ){const info=await page.evaluate(()=>({a:window.__cq.answer,last:window.__cq.last,head:(document.querySelector('#screen .muted')||{}).textContent||''}));
      const L=info.last||{key:'numbers',level:0};const ok=Math.random()<P(L.key,L.level);
      if(/Brain Sparks|Level Finder|Quest|Island|Money|Leagues|review/.test(info.head)&&!/try again/.test(info.head))allQ.push(await page.$eval('.prompt',e=>e.textContent));
      const opts=await page.$$('#opts .opt');let target=null;for(const o of opts){const v=await o.getAttribute('data-v');if((v===String(info.a))===ok){target=o;break}}await (target||opts[0]).click();continue}
    const cells=await page.$$('#tf .cell, #ta .cell, #ones .cell, #f2 .cell, #tc .opt, #parts .opt, #ev .opt');
    if(cells.length){for(const c of cells){try{await c.click({timeout:800,force:true})}catch(e){}}await page.waitForTimeout(40);if(await page.$('#back:not([hidden])'))await click('#back:not([hidden])');continue}
    if(await click('#say:not([disabled])')){await page.waitForTimeout(150);continue}
    if(await click('#mic')){await page.waitForTimeout(150);continue}
    if(await click('#rec')){await page.waitForTimeout(900);continue}
    if(await click('#stop:not([hidden])')){await page.waitForTimeout(500);continue}
    if(await click('#start'))continue;
    const sopts=await page.$$('#screen .opt');if(sopts.length){const a=await page.evaluate(()=>window.__cq.answer);let pick=sopts[Math.floor(Math.random()*sopts.length)];if(Math.random()<0.85)for(const o of sopts){if(await o.getAttribute('data-v')===a)pick=o}try{await pick.click({timeout:1500})}catch(e){}continue}
    if(await click('#skip'))continue;
    if(await click('.quest.now'))continue;
    if(await click('#home'))continue;
    await page.waitForTimeout(80);
  }
  state=await page.evaluate(()=>JSON.parse(localStorage.getItem('cq-v1')));
  const k=Object.keys(state.days).sort().pop();const d=state.days[k];
  const lv=Object.fromEntries(Object.entries(state.skills).map(([k,v])=>[k,v.level+1]));
  console.log('Day',day,k,'star',d.star,'done',d.done.join(','),'answers',d.items,'right',Math.round(100*d.correct/Math.max(1,d.items))+'%','steps',steps);
  console.log('   tt',state.tt?('cur '+state.tt.cur+' facts '+Object.keys(state.tt.facts).length+' box3+ '+Object.values(state.tt.facts).filter(f=>f.box>=3).length):'-');console.log('   levels',JSON.stringify(lv),'story lv',state.reading.level,'tricky',Object.keys(state.reading.tricky).join(',')||'-');
  console.log('   ',Object.values(d.summaries||{}).map(x=>x.slice(0,110)).join('\n    '));
  await page.close();
}
const uniq=new Set(allQ);console.log('math questions shown',allQ.length,'unique',uniq.size);
if(errors.length){console.log('ERRORS\n'+errors.join('\n'));process.exit(1)}console.log('OK');await b.close()})();
