// ---------- v1.8 progression: put her where she really is, keep her moving ----------
// 1) placeFromCheck: after every Weekly Check (and once on upgrade) levels move UP to what she showed she can do.
// 2) Level Finder: a one-time math quest that binary-searches every island (about 3 questions each).
// 3) Mic clean-up: names and tiny words the recognizer mishears are not counted as her mistakes.
const WORD_CHECK_LV={sun:0,ship:1,cake:2,rain:3,market:5,remember:6};
function frontier(pairs){ // pairs [[level,ok]] → highest level she got right, capped below her lowest miss
  const right=pairs.filter(p=>p[1]).map(p=>p[0]),wrong=pairs.filter(p=>!p[1]).map(p=>p[0]);
  if(!right.length)return null;let top=Math.max(...right);const lowMiss=wrong.length?Math.min(...wrong):Infinity;if(lowMiss<top)top=lowMiss;return top}
function placeUp(key,level,max,log){if(level==null)return;const s=sk(key);if(level>s.level){placeSkill(key,level,max);if(log)log.push(key+' → '+(level+1))}}
function placeFromCheck(c,log){
  if(!c)return;log=log||[];
  const by={};(c.math&&c.math.items||[]).forEach(it=>{(by[it.key]=by[it.key]||[]).push([it.level,!!it.ok])});
  // v1.9: math is never moved up by the check; she earns every math level by mastering it
  const wp=(c.words&&c.words.items||[]).filter(x=>WORD_CHECK_LV[x.w]!==undefined).map(x=>[WORD_CHECK_LV[x.w],!!x.ok]);
  placeUp('words',frontier(wp),WORDLV.length,log);
  const r=c.read||{};let st=null;if(r.wpm&&r.comp!=null){if(r.wpm>=150&&r.comp>=3)st=4;else if(r.wpm>=130&&r.comp>=2)st=3;else if(r.wpm>=110&&r.comp>=2)st=2;else if(r.wpm>=80)st=1}
  if(st!=null&&st>D.reading.level){D.reading.level=st;log.push('stories → level '+st)}
  save();return log}
// names and tiny words in stories: the speech recognizer gets these wrong, not her
let _NAMES=null;
function storyNames(){if(_NAMES)return _NAMES;const cap=new Set(),low=new Set();STORIES.forEach(s=>(s.text+' '+s.title).split(/\s+/).forEach((w,i,a)=>{const c=w.replace(/[^A-Za-z']/g,'').replace(/'s$/,'');if(!c)return;const start=i===0||/[.!?"]$/.test(a[i-1]);if(/^[A-Z]/.test(c)){if(!start)cap.add(c.toLowerCase())}else low.add(c.toLowerCase())}));_NAMES=new Set([...cap].filter(w=>!low.has(w)));return _NAMES}
function countsAsReadingMiss(w){w=norm(w).replace(/'s$/,'');return w.length>3&&!storyNames().has(w)}
function cleanTricky(){const t=D.reading.tricky||{};Object.keys(t).forEach(w=>{if(!countsAsReadingMiss(w)||!(t[w]>0))delete t[w]});const ks=Object.keys(t);if(ks.length>20)ks.slice(0,ks.length-20).forEach(w=>delete t[w]);save()}

// ---------- Level Finder ----------
function finderDue(){return !!D.finderRequested}
function levelFinder(done){
  const keys=SKILL_ORDER.slice();let ki=0,asked=0,right=0;const found={};
  let lo,hi,best,steps,conf;
  function startSkill(){if(ki>=keys.length)return finish();const k=keys[ki];lo=0;hi=SKILLS[k].levels.length-1;best=-1;steps=0;conf=0;ask()}
  function ask(){const k=keys[ki],S_=SKILLS[k];
    if(lo>hi||steps>=3){found[k]=Math.max(0,best);ki++;return startSkill()}
    const mid=Math.ceil((lo+hi)/2);asked++;const item=genItem(k,mid);
    showItem(item,{head:'🧭 Level Finder · '+S_.em+' '+S_.name+' · question '+asked,bar:Math.round(100*ki/keys.length)},(ok,secs,hinted,given)=>{
      logItem('math',{key:k,level:mid,ok,secs,hint:hinted,q:item.q.replace(/<[^>]+>/g,''),a:String(item.answer),given,finder:true});
      const good=ok&&!hinted;if(good)right++;
      // one right answer could be a lucky tap, so going UP needs two in a row at the same level
      if(good&&conf===0){conf=1;$('fb').textContent+=' One more like it to prove it!'}
      else if(good){conf=0;steps++;best=Math.max(best,mid);lo=mid+1;$('fb').textContent+=' Harder one next!'}
      else{conf=0;steps++;hi=mid-1;$('fb').textContent='That is okay. Now we know where to start. An easier one next.'}
      nextBtn(ask)})}
  function finish(){
    const lines=[];keys.forEach(k=>{const max=SKILLS[k].levels.length;const lv=found[k];const s=sk(k);
      // trust the finder in both directions, but never drop more than 1 level below where she already worked
      const target=Math.max(lv,Math.max(0,s.level-1));if(target!==s.level)placeSkill(k,target,max);
      lines.push(SKILLS[k].em+' '+SKILLS[k].name+': level '+(sk(k).level+1)+' · '+SKILLS[k].levels[sk(k).level].n)});
    D.finderDone=todayKey();D.finderRequested=false;D.stars+=2;coins(15);save();
    render('<div class="stars pop">🧭⭐</div><h2 class="center">Your real levels are set!</h2><p class="center">You answered '+right+' of '+asked+'. From now on every island starts right where you are.</p><div class="box">'+lines.map(l=>'<p style="margin:4px 0;font-size:1.1rem">'+esc(l)+'</p>').join('')+'</div><div class="row" style="justify-content:center"><button class="btn good" id="go">Awesome!</button></div>');
    speak('Your real levels are set! From now on every island starts right where you are.');
    $('go').onclick=()=>completeQuest('math','Level Finder: '+right+' of '+asked+' right. Levels set: '+keys.map(k=>SKILLS[k].em+(sk(k).level+1)).join(' '),done)}
  render('<div class="stars">🧭</div><h2 class="center">Level Finder</h2><p class="center">Today Math Quest is special. I will find your <b>real</b> level on every island. Get one right and the next one jumps harder. Miss one and it gets easier. About 30 quick questions, one time only.</p><p class="center muted">No hints today, just do your best. Wrong answers are fine, they tell us where to start.</p><div class="row" style="justify-content:center"><button class="btn good" id="go">Find my level</button></div>');
  speak('Level Finder! Today I find your real level on every island. Get one right and the next one jumps harder.');$('go').onclick=startSkill;
}

// ---------- upgrade from v1.7 (runs once) ----------
function migrateV18(){
  if(D.v18)return;const log=[];
  try{const C=D.checks||[];if(C.length)placeFromCheck(C[C.length-1],log)}catch(e){}
  // levels set by hand or by plan.json earlier did not mark the lower levels as mastered; fix that
  Object.keys(D.skills).forEach(k=>{const s=D.skills[k];const max=SKILLS[k]?SKILLS[k].levels.length:k==='words'?WORDLV.length:k==='speech'?SPEECHLV.length:k==='typing'?TYPELV.length:0;if(!max)return;for(let l=0;l<Math.min(s.level,max);l++){if(!s.mastered.includes(l)){s.mastered.push(l);if(!s.review[l])s.review[l]='2000-01-01'}}});
  cleanTricky();D.v18=todayKey();D.v18log=log;save();
}

// ---------- v1.9: basics first. Undo the v1.8 math jumps; she keeps only the math levels she earned. ----------
function migrateV19(){
  if(D.v19)return;const log=D.levelLog||[];
  SKILL_ORDER.forEach(k=>{const firstPlaced=log.findIndex(e=>e.k===k&&e.placed);if(firstPlaced<0)return;
    const earned=log.slice(0,firstPlaced).filter(e=>e.k===k&&!e.placed);const lv=earned.length?earned[earned.length-1].l:0;
    const s=sk(k);s.level=lv;s.mastered=s.mastered.filter(l=>l<lv);for(let l=0;l<lv;l++)if(!s.mastered.includes(l))s.mastered.push(l);
    Object.keys(s.hist).forEach(l=>{if(+l>=lv)s.hist[l]=[]});if(s.hd)Object.keys(s.hd).forEach(l=>{if(+l>=lv)s.hd[l]=[]});
    log.push({d:todayKey(),k,l:lv,restored:1})});
  D.finderRequested=false;D.v19=todayKey();save();
}
