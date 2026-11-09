const { chromium } = require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});const ctx=await b.newContext();await ctx.grantPermissions(['microphone']);const p=await ctx.newPage();await p.addInitScript(`delete window.SpeechRecognition; Object.defineProperty(window,'webkitSpeechRecognition',{value:undefined,configurable:true});`);const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve(__dirname,'../index.html')+'#debug');
await p.evaluate(()=>{__cq.D.welcomed=true;__cq.save()});
// recordingBooth is inside the IIFE, so drive it via UI instead: run speech quest to the end quickly is long; call via window hook
await p.evaluate(()=>{window.__cq.run('speech')});
// skip mic intro -> no microphone, honor mode x5, then booth
const click=async s=>{const e=await p.$(s);if(!e)return false;try{await e.click({timeout:2000});return true}catch(err){return false}};
for(let i=0;i<60;i++){if(await p.$('#rec')){break}if(await click('#nextBtn'))continue;if(await click('#skip'))continue;if(await click('#go:not([hidden])'))continue;if(await click('#say:not([disabled])')){await p.waitForTimeout(300);continue}await p.waitForTimeout(100)}
console.log('booth reached', !!(await p.$('#rec')));
await click('#rec');await p.waitForTimeout(2500);await click('#stop');await p.waitForTimeout(1500);
console.log('fb:',await p.$eval('#fb',e=>e.textContent),'| audio:',!!(await p.$('audio')));
const n=await p.evaluate(()=>__cq.listClips().then(c=>c.length));console.log('clips saved',n);
await p.evaluate(()=>__cq.parentPanel('recordings'));await p.waitForTimeout(800);console.log('tab:',(await p.$eval('#clips',e=>e.textContent)).slice(0,120));
if(errs.length){console.log('ERRORS',errs);process.exit(1)}console.log('OK');await b.close()})();
