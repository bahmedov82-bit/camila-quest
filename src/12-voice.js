// ---------- voice: a natural recorded voice (voice/ clips made with a neural voice), device voice only as a fallback ----------
// Every line is split into sentences; each sentence plays from voice/<VSET>/<hash>.mp3 when that clip exists.
// A sentence with no clip of its own is tried in pieces (text between numbers + numbers), and only what is still
// missing is read by the device voice. Grown-ups → Settings → Voice can switch to a device voice instead.
let VOICE=null;
const VSET='v1';
const VBASE='voice/'+VSET+'/';
function voiceScore(v){if(!v.lang||!/^en/i.test(v.lang))return -1;let s=0;const n=v.name;if(/premium/i.test(n))s+=50;if(/enhanced/i.test(n))s+=40;if(/natural|neural|online/i.test(n))s+=35;if(/siri/i.test(n))s+=30;['Ava','Zoe','Allison','Samantha','Nicky','Susan','Joelle','Karen','Moira','Tessa','Google US English','Aria','Jenny','Michelle','Emma'].forEach((nm,i)=>{if(n.includes(nm))s+=20-i});if(/en-US/i.test(v.lang))s+=5;if(/compact/i.test(n))s-=20;if(/fred|zarvox|trinoids|whisper|bubbles|bad news|cellos|boing|organ|bells|hysterical|albert|jester|good news|wobble|superstar|grandma|grandpa|rocko|shelley|eddy|flo|reed|sandy|junior|ralph|kathy|bahh|deranged/i.test(n))s-=100;return s}
function englishVoices(){try{return speechSynthesis.getVoices().filter(v=>voiceScore(v)>=0).sort((a,b)=>voiceScore(b)-voiceScore(a))}catch(e){return []}}
// device voice (fallback): a saved choice wins unless a much better (Premium / Enhanced / Natural) voice has been installed since
const isGoodVoice=v=>/premium|enhanced|natural|neural|online/i.test(v.name)||/google us english/i.test(v.name);
function pickVoice(){try{const vs=englishVoices();if(!vs.length)return;if(D.voiceName&&D.voiceName!=='rec'){const v=vs.find(x=>x.name===D.voiceName);if(v&&(isGoodVoice(v)||!isGoodVoice(vs[0]))){VOICE=v;return}}VOICE=vs[0]}catch(e){}}
try{pickVoice();speechSynthesis.onvoiceschanged=pickVoice}catch(e){}
const useRec=()=>!D.voiceName||D.voiceName==='rec';
// text → lookup key (same rules as tools/voice/harvest.js)
const vkey=t=>String(t).toLowerCase().replace(/[‘’]/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();
function vhash(str){let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<str.length;i++){const ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return (4294967296*(2097151&h2)+(h1>>>0)).toString(36)}
// clean what is shown on screen into what should be heard
const VORD={2:'half',3:'third',4:'fourth',5:'fifth',6:'sixth',8:'eighth',10:'tenth',12:'twelfth'};
function vmoney(d,c){d=+d;c=c?+c:0;const D_=d?d+(d===1?' dollar':' dollars'):'';const C_=c?c+(c===1?' cent':' cents'):'';return D_&&C_?D_+' and '+C_:(D_||C_||'0 dollars')}
function vclean(t){return String(t).replace(/\s*×\s*/g,' times ').replace(/\s*÷\s*/g,' divided by ').replace(/\s*→\s*/g,', then ').replace(/([\w?)])\s*\+\s*(?=[\w?(])/g,'$1 plus ').replace(/([\w?)])\s*[−–]\s*(?=[\w?(])/g,'$1 minus ').replace(/([\w?])\s+-\s+(?=[\w?])/g,'$1 minus ').replace(/(^|[\s(])-(?=\d)/g,'$1negative ').replace(/__+/g,' blank ').replace(/\s*=\s*/g,' equals ').replace(/\$(\d+)(?:\.(\d\d))?/g,(m,d,c)=>vmoney(d,c)).replace(/(\d+)\s*¢/g,(m,c)=>c+(c==='1'?' cent':' cents')).replace(/\b(\d+)\/(\d+)\b/g,(m,a,b)=>VORD[b]?a+' '+(+a===1?VORD[b]:(b==='2'?'halves':VORD[b]+'s')):a+' over '+b).replace(/[*_#]/g,'').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu,'').replace(/__+/g,'blank').replace(/\s+/g,' ').trim()}
// sentences: split after . ! ? (not inside numbers like 2.5)
function vsentences(t){const out=[];let cur='';const s=vclean(t);for(let i=0;i<s.length;i++){const c=s[i];cur+=c;if(/[.!?]/.test(c)&&!(c==='.'&&/\d/.test(s[i-1]||'')&&/\d/.test(s[i+1]||''))&&!(c==='.'&&/(^|\s)(Mr|Mrs|Ms|Dr|St|Jr|vs|etc|e\.g|i\.e)$/i.test(cur.slice(0,-1)))){while(i+1<s.length&&/[.!?"')\]]/.test(s[i+1])){cur+=s[++i]}if(vkey(cur))out.push(cur.trim());cur=''}}if(vkey(cur))out.push(cur.trim());return out}
// pieces of a sentence: text runs and numbers kept apart, so "There are 14." plays as "There are" + "14"
function vpieces(s){return s.split(/[{}]|(\d+(?:\.\d+)?)/).filter(x=>x!==undefined).map(x=>x.trim()).filter(x=>vkey(x))}
const unslot=t=>String(t).replace(/[{}]/g,'');
let VIDX=null;const VREADY=new Promise(res=>{try{if(location.protocol==='file:')return res();fetch(VBASE+'index.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{if(j&&j.ids)VIDX=new Set(j.ids);res()}).catch(()=>res())}catch(e){res()}setTimeout(res,2500)});
const hasClip=t=>!!VIDX&&VIDX.has(vhash(vkey(t)));
const clipUrl=t=>VBASE+vhash(vkey(t))+'.mp3';
// plan a line: a list of {clip} or {tts} steps
function vplan(text){const steps=[];const tts=t=>{const last=steps[steps.length-1];if(last&&last.tts!==undefined)last.tts+=' '+t;else steps.push({tts:t})};
  for(const s of vsentences(text)){if(hasClip(s)){steps.push({clip:clipUrl(s),t:unslot(s)});continue}const ps=vpieces(s);
    if(ps.length>1&&ps.some(hasClip)){ps.forEach(p=>hasClip(p)?steps.push({clip:clipUrl(p),t:p}):tts(p));continue}tts(s)}
  steps.forEach(x=>{if(x.tts!==undefined){x.raw=x.tts;x.tts=unslot(x.tts)}});return steps}
const VSTAT={clipChars:0,ttsChars:0,ttsLines:[]};
let AUD=null,VGEN=0,VUNLOCKED=false;
function vaudio(){if(!AUD){AUD=new Audio();AUD.preload='auto';try{AUD.preservesPitch=true;AUD.webkitPreservesPitch=true}catch(e){}}return AUD}
// iPad: audio may only start after a tap; one silent play on the first tap unlocks the shared player for the whole visit
function vunlock(){if(VUNLOCKED)return;VUNLOCKED=true;try{const a=vaudio();a.src='data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//OEwAAAAAAAAAAAAEluZm8AAAAPAAAABwAAA2AAVVVVVVVVVVVVVVVVVVVxcXFxcXFxcXFxcXFxcY6Ojo6Ojo6Ojo6Ojo6Oqqqqqqqqqqqqqqqqqqqqx8fHx8fHx8fHx8fHx8fj4+Pj4+Pj4+Pj4+Pj4///////////////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQEIAAAAAAAAANgmVBi7QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//NExAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExFMAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKYAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKwAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExKwAAANIAAAAADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';const p=a.play();if(p&&p.catch)p.catch(()=>{VUNLOCKED=false})}catch(e){VUNLOCKED=false}}
['pointerdown','touchend','keydown'].forEach(ev=>document.addEventListener(ev,vunlock,{capture:true,passive:true}));
function hush(){VGEN++;try{if(AUD){AUD.onended=AUD.onerror=null;AUD.pause()}}catch(e){}try{speechSynthesis.cancel()}catch(e){}}
function ttsSay(t,rate,pitch,done,raw){try{if(!('speechSynthesis'in window))return done();const u=new SpeechSynthesisUtterance(unslot(t));u.cqRaw=raw||t;u.rate=rate||0.97;u.pitch=pitch||1.0;u.volume=1;if(VOICE)u.voice=VOICE;let fin=false;const f=()=>{if(!fin){fin=true;done()}};u.onend=f;u.onerror=f;setTimeout(f,1500+t.length*120);speechSynthesis.speak(u)}catch(e){done()}}
let VQ=Promise.resolve();
function speak(t,opts){if(window.__cq)window.__cq.spoken=unslot(String(t));try{opts=opts||{};if(MUSIC&&!opts.force)return;const text=vclean(t);if(!vkey(text))return;
  if(!opts.queue){hush();VQ=Promise.resolve()}
  const gen=VGEN;const rate=opts.rate||0.97;
  VQ=VQ.then(()=>(VIDX||!useRec())?null:VREADY).then(()=>new Promise(done=>{
    if(gen!==VGEN)return done();
    if(!useRec()){VSTAT.ttsChars+=text.length;return ttsSay(text,rate,opts.pitch,done,text)}
    const steps=vplan(text);steps.forEach(s=>{if(s.clip)VSTAT.clipChars+=s.t.length;else{VSTAT.ttsChars+=s.tts.length;VSTAT.ttsLines.push(s.tts)}});
    steps.forEach(s=>{if(s.clip)try{fetch(s.clip).catch(()=>{})}catch(e){}});
    let i=0;const next=()=>{if(gen!==VGEN||i>=steps.length)return done();const s=steps[i++];
      if(s.tts!==undefined)return ttsSay(s.tts,rate,opts.pitch,next,s.raw);
      const a=vaudio();let fin=false;const go=()=>{if(!fin){fin=true;clearTimeout(guard);if(gen!==VGEN)return done();a.onended=a.onerror=null;next()}};
      const fail=e=>{if(fin)return;fin=true;clearTimeout(guard);if(gen!==VGEN)return done();a.onended=a.onerror=null;if(e&&e.name==='AbortError')return next();ttsSay(s.t,rate,opts.pitch,next)};
      const guard=setTimeout(go,4000+s.t.length*150);
      const pr=Math.max(.6,Math.min(1.3,rate/0.97));a.onended=go;a.onerror=fail;a.defaultPlaybackRate=pr;a.src=s.clip;a.playbackRate=pr;
      const p=a.play();if(p&&p.catch)p.catch(fail)};
    next()}))}catch(e){}}
