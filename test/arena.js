const { chromium } = require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:820,height:1200}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve(__dirname,'../index.html')+'#debug');
const guide=`1. photosynthesis - how plants make food from sunlight
cell membrane: the outer layer that controls what goes in and out
What is the powerhouse of the cell? mitochondria
Q: Who was Charlemagne?
A: King of the Franks crowned emperor in 800
nucleus - the control center of the cell
Which organelle makes proteins? ribosome
chloroplast\tgreen part where photosynthesis happens
vacuole - stores water and nutrients`;
const n=await p.evaluate(g=>{__cq.D.welcomed=true;const cards=__cq.parseGuide(g);__cq.addDeck('science','Cells test',cards);__cq.save();return cards.length},guide);
console.log('parsed cards',n);
// win: answer correctly using the deck's answers
await p.evaluate(()=>__cq.battle(__cq.decks()[0]));await p.click('#go');
const click=async s=>{const e=await p.$(s);if(!e)return false;try{await e.click({timeout:2000});return true}catch(err){return false}};
let steps=0,won=false;
while(steps++<200){const h=await p.$eval('#screen',s=>s.textContent);if(/Boss defeated/.test(h)){won=true;break}if(/boss escaped/i.test(h)){break}
 if(await click('#nextBtn'))continue;
 const q=await p.$eval('.prompt',e=>e.textContent).catch(()=>null);if(!q){await p.waitForTimeout(100);continue}
 const ans=await p.evaluate(q=>{const d=__cq.decks()[0];const c=d.cards.find(c=>c.q===q);return c?c.a:null},q);
 if(await p.$('#typed')){await p.fill('#typed',ans);await click('#ok');continue}
 const opt=await p.$(`.opt[data-v="${ans.replace(/"/g,'&quot;')}"]`);if(opt){await opt.click({force:true})}else{const o=await p.$$(".opt");if(o.length)await o[0].click({force:true})}}
console.log('win run: won=',won,'steps',steps,'mastery',await p.evaluate(()=>{const d=__cq.decks()[0];return d.cards.map(c=>c.box).join('')+' wins '+d.wins+' due '+d.due}));
// lose: answer wrong 3 times
await p.evaluate(()=>__cq.battle(__cq.decks()[0]));await p.click('#go');steps=0;let lost=false;
while(steps++<60){const h=await p.$eval('#screen',s=>s.textContent);if(/boss escaped/i.test(h)&&await p.$('#review')){lost=true;break}
 if(await click('#nextBtn'))continue;
 const q=await p.$eval('.prompt',e=>e.textContent).catch(()=>null);if(!q){await p.waitForTimeout(100);continue}
 const ans=await p.evaluate(q=>{const d=__cq.decks()[0];const c=d.cards.find(c=>c.q===q);return c?c.a:null},q);
 if(await p.$('#typed')){await p.fill('#typed','wrong answer');await click('#ok');continue}
 const o=await p.$$(`.opt:not([data-v="${ans.replace(/"/g,'&quot;')}"])`);if(o.length)await o[0].click({force:true})}
console.log('lose run: lost=',lost,'losses',await p.evaluate(()=>__cq.decks()[0].losses));
await click('#review');await p.waitForTimeout(300);console.log('review screen:',(await p.$eval('#screen',s=>s.textContent)).slice(0,60));
await p.evaluate(()=>__cq.parentPanel('school'));await p.waitForTimeout(300);console.log('school tab ok:',/Cells test/.test(await p.$eval('#screen',s=>s.textContent)));
await p.evaluate(()=>__cq.home());console.log('arena tile:',!!(await p.$('#arena')));
await p.evaluate(()=>__cq.parentPanel('analytics'));await p.waitForTimeout(300);console.log('analytics has school:',/Study Arena/.test(await p.$eval('#screen',s=>s.textContent)));
if(errs.length){console.log('ERRORS',errs);process.exit(1)}console.log('OK');await b.close()})();
