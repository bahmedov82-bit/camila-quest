// ---------- helpers ----------
const $=id=>document.getElementById(id);
const screen=$('screen');
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[rnd(0,a.length-1)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const todayKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const dayNum=()=>Math.floor((Date.now()-new Date().getTimezoneOffset()*60000)/86400000);
const median=a=>{if(!a.length)return null;const s=a.slice().sort((x,y)=>x-y);const m=Math.floor(s.length/2);return s.length%2?s[m]:Math.round(((s[m-1]+s[m])/2)*10)/10};
function render(html){screen.innerHTML=html;window.scrollTo({top:0})}
function nextBtn(fn,label,cls){const fb=$('fb');const row=document.createElement('div');row.className='row';row.style.justifyContent='center';row.innerHTML='<button class="btn '+(cls||'good')+'" id="nextBtn">'+(label||'Next ➜')+'</button>';(fb?fb.parentNode:screen).appendChild(row);$('nextBtn').onclick=fn;try{$('nextBtn').focus({preventScroll:true})}catch(e){}}
function confetti(){try{const c=document.createElement('div');c.className='confetti';const cols=['#ff4fa3','#2f6bff','#ffb400','#19a974','#9b5cff'];for(let i=0;i<70;i++){const s=document.createElement('i');s.style.left=Math.random()*100+'vw';s.style.background=pick(cols);s.style.animationDelay=(Math.random()*.8)+'s';s.style.transform='rotate('+rnd(0,360)+'deg)';c.appendChild(s)}document.body.appendChild(c);setTimeout(()=>c.remove(),3600)}catch(e){}}

// ---------- persistent state ----------
const KEY='cq-v1';
const D=Object.assign({
  name:'Camila', avatar:'🦄', created:new Date().toISOString(), coins:0, stars:0, dayStars:0, streak:0, lastDay:null,
  days:{}, skills:{}, reading:{level:0,used:[],tricky:{},history:[]}, speech:{level:0,history:[]}, typing:{level:0,history:[]},
  prizes:[{name:'🎧 Headphones',need:30,start:0,earned:null,added:new Date().toISOString()}],
  badges:[], checks:[], levelLog:[], settings:{items:10,breakSecs:45,parentCode:'2013'}, music:false, cur:null
},load());
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}}
function today(){const k=todayKey();if(!D.days[k])D.days[k]={done:[],star:false,items:0,correct:0,secs:0,log:[],breaks:0,started:new Date().toISOString()};return D.days[k]}
function hud(){$('coins').textContent=D.coins;$('stars').textContent=D.stars;$('streak').textContent=D.streak;prizebar()}
function coins(n){D.coins+=n;hud()}
function logItem(mod,rec){const t=today();t.items++;if(rec.ok)t.correct++;if(rec.secs)t.secs+=rec.secs;t.log.push(Object.assign({m:mod,at:Date.now()},rec));save()}

// ---------- voice ----------
let MUSIC=!!D.music;
function setMusic(on){MUSIC=on;D.music=on;save();const b=$('musicBtn');if(b){b.textContent='🎵 My music: '+(on?'on':'off');b.setAttribute('aria-pressed',on?'true':'false');b.style.borderColor=on?'var(--accent)':''}if(on){try{speechSynthesis.cancel()}catch(e){}}}
let VOICE=null;
// Voice: the most natural English voice the device has. iPad: Enhanced/Premium voices (downloadable in Settings) beat the compact defaults.
function voiceScore(v){if(!v.lang||!/^en/i.test(v.lang))return -1;let s=0;const n=v.name;if(/premium/i.test(n))s+=50;if(/enhanced/i.test(n))s+=40;if(/natural|neural|online/i.test(n))s+=35;if(/siri/i.test(n))s+=30;['Ava','Zoe','Allison','Samantha','Nicky','Susan','Joelle','Karen','Moira','Tessa','Google US English','Aria','Jenny','Michelle','Emma'].forEach((nm,i)=>{if(n.includes(nm))s+=20-i});if(/en-US/i.test(v.lang))s+=5;if(/compact/i.test(n))s-=20;if(/fred|zarvox|trinoids|whisper|bubbles|bad news|cellos|boing|organ|bells|hysterical|albert|jester|good news|wobble|superstar|grandma|grandpa|rocko|shelley|eddy|flo|reed|sandy|junior|ralph|kathy|bahh|deranged/i.test(n))s-=100;return s}
function englishVoices(){try{return speechSynthesis.getVoices().filter(v=>voiceScore(v)>=0).sort((a,b)=>voiceScore(b)-voiceScore(a))}catch(e){return []}}
function pickVoice(){try{const vs=englishVoices();if(!vs.length)return;if(D.voiceName){const v=vs.find(x=>x.name===D.voiceName);if(v){VOICE=v;return}}VOICE=vs[0]}catch(e){}}
try{pickVoice();speechSynthesis.onvoiceschanged=pickVoice}catch(e){}
function speak(t,opts){try{opts=opts||{};if(MUSIC&&!opts.force)return;if(!('speechSynthesis'in window))return;if(!opts.queue)speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(t).replace(/[*_#]/g,''));u.rate=opts.rate||0.97;u.pitch=opts.pitch||1.0;u.volume=1;if(VOICE)u.voice=VOICE;speechSynthesis.speak(u)}catch(e){}}
const CHEERS=['Yes! You got it!','Boom! Nailed it!','That is right, Camila!','Whoa, great thinking!','Look at you go!','You are on fire!','Amazing, Camila!','Yes yes yes!','Super star!','High five!','Your brain is growing!','That is how a boss does it!'];
const NOTYET=['Not yet, and that is okay. Let\'s look at it together.','So close! Let\'s see how it works.','Good try, Camila. Let me show you.','Tricky one! Let\'s work it out together.','Not yet means you are on your way. Watch this.'];

// ---------- microphone ----------
const SR=window.SpeechRecognition||window.webkitSpeechRecognition||null;
let MIC=SR?'unknown':'no';let MICFAIL=0;let MICERR='';
function listen(ms){return new Promise(res=>{
  if(!SR){MIC='no';return res({err:'nosr'})}
  let r;try{r=new SR()}catch(e){MIC='no';return res({err:'nosr'})}
  r.lang='en-US';r.interimResults=false;r.maxAlternatives=5;r.continuous=false;
  let done=false;const finish=v=>{if(done)return;done=true;try{r.stop()}catch(e){}res(v)};
  r.onresult=e=>{MIC='yes';const alts=[];for(const a of e.results[0])alts.push(a.transcript);finish({text:alts[0]||'',alts})};
  r.onerror=e=>{MICERR=e.error||'';if(e.error==='not-allowed'||e.error==='service-not-allowed'||e.error==='audio-capture')MIC='no';if(e.error==='network'){MICFAIL++;if(MICFAIL>=3&&MIC!=='yes')MIC='no'}finish({err:e.error})};
  r.onend=()=>finish({err:'silence'});
  try{r.start()}catch(e){MIC='no';finish({err:'start'})}
  setTimeout(()=>finish({err:'timeout'}),ms||6000);
})}
const norm=t=>String(t||'').toLowerCase().replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();
const NUMWORDS={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20};
const soundsLike=(a,b)=>{a=norm(a).replace(/'/g,'');b=norm(b).replace(/'/g,'');if(a===b)return true;if(NUMWORDS[a]!==undefined&&String(NUMWORDS[a])===b)return true;if(NUMWORDS[b]!==undefined&&String(NUMWORDS[b])===a)return true;if(a.length>3&&b.length>3&&(a.startsWith(b)||b.startsWith(a)))return true;const f=s=>s.replace(/[aeiouy]/g,'').replace(/(.)\1+/g,'$1');return a.length>3&&f(a)===f(b)&&f(a).length>=2};
function wordMatch(target,said,alts){const T=norm(target).split(' ').filter(Boolean);const all=[said].concat(alts||[]).map(x=>norm(x).split(' '));return T.map(w=>({w,ok:all.some(S=>S.some(x=>soundsLike(w,x)))}))}
function pauseMusicGate(next){
  if(!MUSIC)return next();
  render('<h2 class="center">🎧 This part needs your ears</h2><p class="center">Pause your music for a few minutes, then tap Ready. It comes back after.</p><div class="row" style="justify-content:center"><button class="btn pink" id="go">Ready, music is paused</button></div>');
  $('go').onclick=()=>{setMusic(false);D.musicWasOn=true;save();next()};
}
function resumeMusicHint(){if(D.musicWasOn){D.musicWasOn=false;save();setMusic(true)}}

// ---------- mastery engine ----------
// Each skill has ordered levels. A level is mastered when 5 of the last 6 answers at that level were right
// (and at least 6 answered). Mastered levels come back as quick reviews; two review misses re-open the level.
function sk(key){if(!D.skills[key])D.skills[key]={level:0,hist:{},mastered:[],review:{},reviewMiss:{}};return D.skills[key]}
// hist entries: 0 = wrong or needed a hint, 1 = right, 2 = right and fast (recall, not counting)
function record(key,level,ok,fast){const s=sk(key);const h=s.hist[level]=(s.hist[level]||[]);h.push(ok?(fast?2:1):0);if(h.length>12)h.shift();save()}
function isMastered(key,level){const h=sk(key).hist[level]||[];if(h.length>=4&&h.slice(-4).every(x=>x===2))return true;if(h.length<6)return false;return h.slice(-6).filter(x=>x>0).length>=5}
function levelAcc(key,level){const h=sk(key).hist[level]||[];if(!h.length)return null;return Math.round(100*h.filter(x=>x>0).length/h.length)}
function advanceIfReady(key,max){const s=sk(key);if(isMastered(key,s.level)&&s.level<max-1){if(!s.mastered.includes(s.level))s.mastered.push(s.level);s.review[s.level]=todayKey();s.level++;D.levelLog=D.levelLog||[];D.levelLog.push({d:todayKey(),k:key,l:s.level});save();return true}return false}
function dueReview(key){const s=sk(key);const due=s.mastered.filter(l=>s.review[l]!==todayKey());return due.length?due[rnd(0,due.length-1)]:null}
function reviewResult(key,level,ok){const s=sk(key);s.review[level]=todayKey();if(ok){s.reviewMiss[level]=0}else{s.reviewMiss[level]=(s.reviewMiss[level]||0)+1;if(s.reviewMiss[level]>=2){s.mastered=s.mastered.filter(l=>l!==level);s.hist[level]=[];if(level<s.level)s.level=level;s.reviewMiss[level]=0}}save()}

// ---------- day, streak, prizes, badges ----------
const PRIZE_START=D.dayStars;
function prizebar(){const el=$('prizebar');if(!el)return;const active=D.prizes.filter(p=>!p.earned).slice(0,2);el.innerHTML=active.map(p=>{const got=Math.min(p.need,D.dayStars-p.start);const pct=Math.round(100*got/p.need);return '<div class="pill" style="flex:1;min-width:150px;display:flex;flex-direction:column;align-items:stretch;gap:4px;padding:8px 14px"><span style="font-size:.95rem">🔒 '+esc(p.name)+' <span class="muted">'+got+'/'+p.need+' days</span></span><div class="bar" style="height:8px"><div style="width:'+pct+'%;background:linear-gradient(90deg,var(--coin),var(--accent))"></div></div></div>'}).join('')}
const BADGES=[
 {id:'first',em:'🌱',name:'First Day',test:()=>D.dayStars>=1},
 {id:'s3',em:'🔥',name:'3-day streak',test:()=>D.streak>=3},
 {id:'s7',em:'🚀',name:'7-day streak',test:()=>D.streak>=7},
 {id:'s14',em:'🌟',name:'14-day streak',test:()=>D.streak>=14},
 {id:'s30',em:'👑',name:'30-day streak',test:()=>D.streak>=30},
 {id:'ten',em:'🔟',name:'Make-10 Master',test:()=>sk('add').mastered.includes(2)},
 {id:'tens',em:'🧱',name:'Tens Builder',test:()=>sk('sub').mastered.includes(4)},
 {id:'times',em:'✖️',name:'Times Tamer',test:()=>sk('mul').mastered.length>=3},
 {id:'reader',em:'📚',name:'10 Stories',test:()=>D.reading.history.length>=10},
 {id:'words',em:'🔤',name:'100 Words Read',test:()=>Object.values(D.days).reduce((a,d)=>a+d.log.filter(l=>l.m==='words'&&l.ok).length,0)>=100},
 {id:'voice',em:'🎤',name:'Clear Speaker',test:()=>D.speech.level>=3},
 {id:'typist',em:'⌨️',name:'Typist',test:()=>D.typing.level>=3},
 {id:'coins',em:'💰',name:'500 Coins',test:()=>D.coins>=500},
];
function checkBadges(){const fresh=[];BADGES.forEach(b=>{if(!D.badges.includes(b.id)&&b.test()){D.badges.push(b.id);fresh.push(b)}});save();return fresh}
function badgesHTML(){return '<div class="row" style="justify-content:center;gap:6px">'+BADGES.map(b=>'<div class="badge '+(D.badges.includes(b.id)?'':'off')+'"><span class="em">'+b.em+'</span>'+b.name+'</div>').join('')+'</div>'}
