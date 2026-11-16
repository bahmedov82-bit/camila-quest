// ---------- showing one math item ----------
function optLabel(item,o){return item.labels?item.labels[o]:(item.fmt?item.fmt(o):(item.html&&/\//.test(String(o))?frac(...String(o).split('/')):o))}
function showItem(item,meta,onDone){
  const t0=performance.now();let hinted=false;if(window.__cq)window.__cq.answer=String(item.answer);
  const opts=item.options.map(o=>'<button class="opt" data-v="'+esc(o)+'">'+optLabel(item,o)+'</button>').join('');
  render('<div class="row" style="justify-content:space-between"><span class="muted">'+meta.head+'</span><button class="speak" id="sp" aria-label="Read aloud">🔊</button></div>'+(meta.bar!==undefined?'<div class="bar"><div style="width:'+meta.bar+'%"></div></div>':'')+'<p class="prompt">'+item.q+'</p><div id="vis">'+(item.show?item.visual():'')+'</div><div class="row" style="justify-content:center"><button class="btn ghost" id="show"'+(item.show?' hidden':'')+'>👀 Show me a picture</button><button class="btn ghost" id="bd">🧩 Break it down</button><button class="btn ghost" id="tools">🧰 Tools</button></div><div id="bdbox" hidden></div><div id="toolbox" hidden></div><div class="opts" id="opts">'+opts+'</div><p class="feedback" id="fb"></p>');
  $('sp').onclick=()=>speak(item.spoken);
  if(meta.say)setTimeout(()=>speak(item.spoken),400);
  $('show').onclick=()=>{if(item.show)return;hinted=true;$('vis').innerHTML=item.visual();$('show').hidden=true};
  $('tools').onclick=()=>{hinted=true;mathTools(CUR_KEY,$('toolbox'))};
  $('bd').onclick=()=>{hinted=true;breakDown(item,$('bdbox'));$('bd').hidden=true;if(!item.show){$('vis').innerHTML=item.visual();$('show').hidden=true}};
  let answered=false;
  document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    if(answered)return;answered=true;
    const v=b.dataset.v;const ok=String(v)===String(item.answer);const secs=Math.round((performance.now()-t0)/100)/10;
    if(ok){b.classList.add('right');const c=pick(CHEERS);$('fb').textContent=c+(secs<5&&!hinted?' ⚡':'');speak(c);coins(2)}
    else{b.classList.add('wrong');$('fb').textContent=pick(NOTYET);speak($('fb').textContent,{force:true});document.querySelectorAll('.opt').forEach(x=>{if(String(x.dataset.v)===String(item.answer))x.classList.add('right')});$('vis').innerHTML=item.visual();$('show').hidden=true}
    onDone(ok,secs,hinted,v);
  });
}
// After a miss: she does the work, then the SAME question comes back once.
function missFlow(item,meta,after){
  let opened=false;const open=()=>{if(opened)return;opened=true;teachScreen(item,()=>{const it=Object.assign({},item,{options:shuffle(item.options)});showItem(it,Object.assign({},meta,{head:meta.head+' · try again'}),(ok2)=>{if(ok2){coins(1)}nextBtn(after)})})};
  nextBtn(open,'Show me how ➜','pink');
  const btn=$('nextBtn');setTimeout(()=>{if(!opened&&btn&&btn.isConnected)open()},3200);
}
function teachScreen(item,done){
  const T=item.teach||{};TEACH_Q=item.q;
  if(T.type==='on')return countOn(item,done);
  if(T.type==='away')return takeAway(item,done);
  if(T.type==='count')return tapCount(Object.assign({},item,{teach:{groups:T.n,per:1}}),done);
  if(T.type==='missing')return missingAddend(item,done);
  if(T.type==='bridge')return bridgeTen(item,done);
  if(T.type==='ones')return takeOnes(item,done);
  if(T.groups)return tapCount(item,done);
  return explainScreen(item,done);
}
let TEACH_Q='';
function teachShell(title,body){render((TEACH_Q?'<p class="center muted" style="font-size:1.1rem">'+TEACH_Q+'</p>':'')+'<p class="prompt small">'+title+'</p>'+body+'<p class="big" id="run" style="font-size:2.4rem">&nbsp;</p><p class="feedback" id="tfb"></p><div class="row" style="justify-content:center"><button class="btn ghost sm" id="again">🔊 Say it again</button><button class="btn good" id="go" hidden>I got it! Try the question again</button></div>')}
function finishTeach(text,done){$('tfb').textContent=text;setTimeout(()=>speak(text,{force:true}),500);$('go').hidden=false;$('go').onclick=done}
function explainScreen(item,done){
  const how=item.how||item.spoken||'';
  render('<p class="prompt small">Let\'s see how it works.</p><p class="prompt small muted">'+item.q+'</p><div id="vis">'+(item.visual?item.visual():'')+'</div><div class="parent" style="border-style:solid"><span class="tag">How to get it</span><p style="font-size:1.25rem">'+esc(how)+'</p></div><div class="row" style="justify-content:center"><button class="btn ghost" id="again">🔊 Say it again</button><button class="btn good" id="go">Got it! Try again</button></div>');
  const say=()=>speak(how,{force:true,rate:.95});say();$('again').onclick=say;$('go').onclick=done;
}
function cellBtn(i,filled,cls){return '<button class="cell" data-i="'+i+'" style="width:52px;height:52px;border-radius:10px;background:var(--card);cursor:pointer">'+(filled?'<span class="dot '+(cls||'')+'"></span>':'')+'</button>'}
function grid(id,cells,filled,cls){return '<div id="'+id+'" style="display:grid;grid-template-columns:repeat(5,52px);gap:8px;justify-content:center">'+Array.from({length:cells},(_,i)=>cellBtn(i,i<filled,cls)).join('')+'</div>'}
function countOn(item,done){
  const a=item.teach.start,n=item.teach.n,total=a+n;const cells=total>10?20:10;
  teachShell('Start at <b>'+a+'</b>. Tap the empty boxes one at a time and count on. No fingers needed, the boxes do the counting.',grid('tf',cells,a));
  $('run').textContent=a;
  const say=()=>speak('Start at '+a+'. Tap the empty boxes and count on: '+(a+1)+', '+(a+2)+'...',{force:true});say();$('again').onclick=say;
  let k=0;
  document.querySelectorAll('#tf .cell').forEach(c=>c.onclick=()=>{const i=+c.dataset.i;if(i!==a+k||k>=n)return;c.innerHTML='<span class="dot b"></span>';k++;$('run').textContent=a+k;speak(String(a+k),{force:true});
    if(k===n)finishTeach(a+' and '+n+' more is '+total+'. You counted it!',done)});
}
function missingAddend(item,done){
  const a=item.teach.start,t=item.teach.target;const cells=t>10?20:10;
  teachShell('<b>'+a+'</b> are filled. Tap empty boxes until you reach <b>'+t+'</b>. The pink dots you add are the missing number.',grid('tf',cells,a)+'<p class="center muted" id="added" style="font-size:1.2rem">Added so far: 0</p>');
  $('run').textContent=a;
  const say=()=>speak(a+' are filled. Tap the empty boxes and count up until you reach '+t+'. Then count the pink dots you added.',{force:true});say();$('again').onclick=say;
  let k=0;
  document.querySelectorAll('#tf .cell').forEach(c=>c.onclick=()=>{const i=+c.dataset.i;if(i!==a+k||a+k>=t)return;c.innerHTML='<span class="dot b"></span>';k++;$('run').textContent=a+k;$('added').textContent='Added so far: '+k;speak(String(a+k),{force:true});
    if(a+k===t)finishTeach('You added '+k+' pink dots to get from '+a+' to '+t+'. So '+a+' plus '+k+' is '+t+'. The missing number is '+k+'.',done)});
}
function bridgeTen(item,done){
  const a=item.teach.a,b=item.teach.b,need=10-a,rest=b-need;
  render('<p class="prompt small">Make a 10 first. Tap <b>'+need+'</b> pink dots to move them into the first box.</p><div class="visual" style="gap:20px">'+grid('f1',10,a)+grid('f2',10,0)+'</div><p class="big" id="run" style="font-size:2rem">'+a+' + '+b+'</p><p class="feedback" id="tfb"></p><div class="row" style="justify-content:center"><button class="btn ghost sm" id="again">🔊 Say it again</button><button class="btn good" id="go" hidden>I got it! Try the question again</button></div>');
  document.querySelectorAll('#f2 .cell').forEach((c,i)=>{if(i<b)c.innerHTML='<span class="dot b"></span>'});
  const say=()=>speak(a+' needs '+need+' to make 10. Tap '+need+' pink dots to move them to the first box.',{force:true});say();$('again').onclick=say;
  let moved=0;
  document.querySelectorAll('#f2 .cell').forEach(c=>c.onclick=()=>{if(moved>=need||!c.innerHTML)return;c.innerHTML='';const tgt=document.querySelectorAll('#f1 .cell')[a+moved];tgt.innerHTML='<span class="dot b"></span>';moved++;speak(String(a+moved),{force:true});
    if(moved===need){$('run').textContent='10 + '+rest;$('tfb').textContent='Now the first box is a full 10, and '+rest+' are left. 10 plus '+rest+' is '+(a+b)+'!';setTimeout(()=>speak('Now you have a full 10 and '+rest+' left over. 10 plus '+rest+' is '+(a+b)+'.',{force:true}),500);$('go').hidden=false;$('go').onclick=done}});
}
function takeAway(item,done){
  const a=item.teach.total,n=item.teach.n;
  teachShell('There are <b>'+a+'</b>. Tap <b>'+n+'</b> of them to take them away.','<div class="visual" id="ta" style="gap:10px">'+Array.from({length:a},(_,i)=>cellBtn(i,true)).join('')+'</div>');
  $('run').textContent=a;
  const say=()=>speak('There are '+a+'. Tap '+n+' of them to take them away.',{force:true});say();$('again').onclick=say;
  let gone=0,phase=1,counted=0;
  document.querySelectorAll('#ta .cell').forEach(c=>c.onclick=()=>{
    if(phase===1){if(c.dataset.gone)return;c.dataset.gone='1';c.innerHTML='<span style="font-size:1.6rem">✖</span>';gone++;$('run').textContent=(a-gone);speak(String(a-gone),{force:true});
      if(gone===n){phase=2;$('tfb').textContent='Now tap the ones that are left and count them.';speak('Now tap the ones that are left and count them.',{force:true});$('run').textContent='0'}}
    else{if(c.dataset.gone||c.dataset.c)return;c.dataset.c='1';c.style.background='var(--goodbg)';counted++;$('run').textContent=counted;speak(String(counted),{force:true});
      if(counted===a-n)finishTeach(a+' take away '+n+' leaves '+(a-n)+'. You did it!',done)}});
}
function takeOnes(item,done){
  const a=item.teach.a,b=item.teach.b,t=T(a),o=O(a);
  teachShell(a+' is <b>'+t+' tens</b> and <b>'+o+' ones</b>. We only take away ones. Tap <b>'+b+'</b> of the little squares.','<div class="visual" style="gap:24px;align-items:flex-end"><div style="display:flex;gap:6px" id="rods">'+Array.from({length:t},()=>'<span class="rod"></span>').join('')+'</div><div id="ones" style="display:grid;grid-template-columns:repeat(5,44px);gap:6px">'+Array.from({length:o},(_,i)=>'<button class="cell" data-i="'+i+'" style="width:44px;height:44px;border-radius:8px;background:var(--coin);border-color:var(--coin);cursor:pointer"></button>').join('')+'</div></div><p class="center muted" id="lbl" style="font-size:1.2rem">'+t+' tens and '+o+' ones</p>');
  $('run').textContent=a;
  const say=()=>speak(a+' is '+t+' tens and '+o+' ones. The sticks are tens. They stay. Tap '+b+' of the little ones to take them away.',{force:true});say();$('again').onclick=say;
  let gone=0;
  document.querySelectorAll('#ones .cell').forEach(c=>c.onclick=()=>{if(gone>=b||c.dataset.gone)return;c.dataset.gone='1';c.style.background='var(--card)';c.innerHTML='✖';gone++;$('run').textContent=a-gone;$('lbl').textContent=t+' tens and '+(o-gone)+' ones';speak(String(a-gone),{force:true});
    if(gone===b)finishTeach('The '+t+' tens did not change. '+o+' ones take away '+b+' is '+(o-b)+'. '+t+' tens and '+(o-b)+' ones is '+(a-b)+'.',done)});
}
function tapCount(item,done){
  const g=item.teach.groups,n=item.teach.per;let i=0;
  const say0=n===10?'Each stick is ten. Tap the first one and say ten.':'Each group has '+n+'. Tap the first group and say '+n+'.';
  teachShell('Let\'s count together. Tap each group, one at a time. Watch the numbers grow.','<div class="visual" id="tc" style="gap:12px">'+Array.from({length:g},(_,k)=>'<button class="opt" data-k="'+k+'" style="padding:10px;min-height:0;display:flex;flex-direction:column;align-items:center;gap:6px">'+(n===10?'<span class="rod" style="height:70px"></span>':'<div class="group">'+Array.from({length:n},()=>'<span class="dot" style="width:12px;height:12px"></span>').join('')+'</div>')+'<span class="cnt" style="font-size:1.6rem;min-height:1.2em">&nbsp;</span></button>').join('')+'</div>');
  const say=()=>speak(say0,{force:true,rate:.95});say();$('again').onclick=say;
  document.querySelectorAll('#tc .opt').forEach(b=>b.onclick=()=>{const k=+b.dataset.k;if(k!==i)return;b.classList.add('right');b.querySelector('.cnt').textContent=(k+1)*n;$('run').textContent=Array.from({length:k+1},(_,j)=>(j+1)*n).join(', ');speak(String((k+1)*n),{force:true});i++;
    if(i===g)finishTeach(g+' groups of '+n+' makes '+(g*n)+'. You counted it yourself!',done)});
}

// ---------- Math Quest: today's adaptive set ----------
// No repeats: a question she saw in the last ~150 comes back only when the level has nothing new left.
let CUR_KEY='numbers';
function genItem(key,level){const L=SKILLS[key].levels[Math.max(0,Math.min(level,SKILLS[key].levels.length-1))];D.recentQ=D.recentQ||[];let it=null,best=null,g=0;
  while(g<60){g++;const c=L.g();if(!c)continue;best=best||c;const sig=key+'|'+String(c.q).replace(/<[^>]+>/g,'')+'|'+c.answer;if(!D.recentQ.includes(sig)){it=c;break}}
  it=it||best;CUR_KEY=key;if(window.__cq)window.__cq.last={key,level};const sig=key+'|'+String(it.q).replace(/<[^>]+>/g,'')+'|'+it.answer;D.recentQ.push(sig);if(D.recentQ.length>150)D.recentQ.splice(0,D.recentQ.length-150);return it}
function mathQuest(done){
  const N=D.settings.items||10;let i=0,right=0;const back={},wrongRun={},touched=new Set();let streak=0;
  // Two focus skills per day (the two furthest behind, rotating on ties) get most of the questions, so a level can be mastered in one sitting.
  const open=SKILL_ORDER.filter(skillOpen);const ratio=k=>sk(k).level/SKILLS[k].levels.length+((SKILL_ORDER.indexOf(k)+dayNum())%open.length)*0.001;
  const focus=open.slice().sort((a,b)=>ratio(a)-ratio(b)).slice(0,2);
  function pickSkill(){const w=open.map(k=>focus.includes(k)?3:0.6);let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let j=0;j<open.length;j++){r-=w[j];if(r<=0)return open[j]}return open[0]}
  function next(){
    if(i>=N)return finish();
    let key,level,review=false;
    if(i%4===3){for(const k of shuffle(SKILL_ORDER)){const l=dueReview(k);if(l!==null){key=k;level=l;review=true;break}}}
    if(!key){key=pickSkill();level=Math.max(0,sk(key).level-(back[key]||0))}
    const item=genItem(key,level);const S_=SKILLS[key];touched.add(key);
    showItem(item,{head:S_.em+' '+S_.name+' · '+(review?'quick review':S_.levels[level].n)+' · '+(i+1)+' of '+N,bar:Math.round(100*i/N)},(ok,secs,hinted,given)=>{
      i++;logItem('math',{key,level,ok,secs,hint:hinted,q:item.q.replace(/<[^>]+>/g,''),a:String(item.answer),given,review});
      if(review){reviewResult(key,level,ok)}else{record(key,level,ok&&!hinted,secs<6)}
      if(ok){right++;streak++;wrongRun[key]=0;if(!review&&advanceIfReady(key,S_.levels.length)){return nextBtn(()=>levelUp(key,next),'Next ➜')}return nextBtn(next)}
      streak=0;wrongRun[key]=(wrongRun[key]||0)+1;
      if(!review&&stepDownIfStuck(key)){back[key]=0;wrongRun[key]=0;return missFlow(item,{head:S_.em+' '+S_.name},()=>stepBack(S_,next))}
      if(wrongRun[key]>=2&&!review&&level>0){back[key]=(back[key]||0)+1;wrongRun[key]=0;return missFlow(item,{head:S_.em+' '+S_.name},()=>stepBack(S_,next))}
      missFlow(item,{head:S_.em+' '+S_.name},next);
    });
  }
  function stepBack(S_,cont){render('<div class="stars">🪜</div><h2 class="center">Let\'s take one step back</h2><p class="center">That was a tough one. We will practice an easier one on '+S_.name+' first, then climb back up. That is how experts learn.</p><div class="row" style="justify-content:center"><button class="btn good" id="go">Okay!</button></div>');speak('Let\'s take one step back and warm up with an easier one. Then we climb again.');$('go').onclick=cont}
  function finish(){const pct=Math.round(100*right/N);D.stars+=1;if(pct>=80)D.stars+=1;coins(10);save();
    const lv=[...touched].map(k=>SKILLS[k].em+' level '+(sk(k).level+1)).join(' · ');
    completeQuest('math','You answered '+right+' of '+N+' right ('+pct+'%). '+(pct>=80?'Two stars!':'One star.')+' Where you are: '+lv,done)}
  next();
}
function levelUp(key,cont){const s=sk(key),S_=SKILLS[key];confetti();render('<div class="stars pop">⭐🎉⭐</div><h2 class="center">Level up on '+S_.name+'!</h2><p class="center">You mastered <b>'+S_.levels[s.level-1].n+'</b>. Next up: <b>'+S_.levels[s.level].n+'</b>.</p><p class="center muted">+5 coins</p><div class="row" style="justify-content:center"><button class="btn good" id="go">Let\'s go!</button></div>');coins(5);speak('Level up! You mastered '+S_.levels[s.level-1].n+'. Amazing, Camila!');$('go').onclick=cont}

// ---------- Brain Sparks: warm-up on things she already knows (builds fast recall) ----------
function sparksQuest(done){
  const N=6;let i=0,fast=0,right=0;
  // warm-up on the two highest levels she owns in each island, so it is quick but never babyish
  const pool=[];SKILL_ORDER.forEach(k=>sk(k).mastered.slice().sort((a,b)=>b-a).slice(0,2).forEach(l=>pool.push([k,l])));
  if(pool.length<3){SKILL_ORDER.filter(skillOpen).forEach(k=>pool.push([k,Math.max(0,sk(k).level-1)]))}
  let lastKey=null;
  function next(){
    if(i>=N)return finish();
    let kl=pick(pool),g=0;while(kl[0]===lastKey&&g++<6)kl=pick(pool);const [key,level]=kl;lastKey=key;const item=genItem(key,level);const S_=SKILLS[key];
    showItem(item,{head:'⚡ Brain Sparks · '+(i+1)+' of '+N,bar:Math.round(100*i/N)},(ok,secs,hinted,given)=>{
      i++;logItem('sparks',{key,level,ok,secs,hint:hinted,q:item.q.replace(/<[^>]+>/g,''),a:String(item.answer),given});
      if(sk(key).mastered.includes(level))reviewResult(key,level,ok);
      if(ok){right++;if(secs<5&&!hinted){fast++;$('fb').textContent+=' Lightning fast!'}return nextBtn(next)}
      missFlow(item,{head:'⚡ Brain Sparks'},next);
    });
  }
  function finish(){D.stars+=1;coins(5);save();completeQuest('sparks','Brain warmed up: '+right+' of '+N+' right, '+fast+' lightning fast ⚡.',done)}
  render('<div class="stars">⚡</div><h2 class="center">Brain Sparks</h2><p class="center">Six quick ones you already know. Try to just <b>see</b> the answer, no counting on fingers. The faster your brain gets, the easier everything else becomes.</p><div class="row" style="justify-content:center"><button class="btn good" id="go">Start</button></div>');
  speak('Brain Sparks! Six quick ones you already know. Try to just see the answer.');$('go').onclick=next;
}

// ---------- Break it down: the same problem-solving routine every time, one step at a time, never the answer ----------
function breakSteps(item){const ans=String(item.answer);const q=String(item.q).replace(/<[^>]+>/g,'');
  const hide=t=>t.replace(new RegExp('(^|[^\\d.])'+ans.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![\\d])','g'),'$1__');
  let specific=(item.how||'').split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(Boolean);
  // drop sentences that only announce the answer; mask the answer anywhere else
  specific=specific.filter(x=>!/^(answer|total|so the answer|that is|the missing number is)\b/i.test(x)&&!(new RegExp('^'+ans.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[.!]?$').test(x))).map(hide);
  const steps=[{em:'👀',t:'Read it twice. Out loud if you can.',say:q},{em:'🗣️',t:'Say it in your own words. What is happening?'},{em:'🔎',t:'What do I know? Find the numbers and what they mean.'},{em:'🎯',t:'What am I looking for? Point to the question.'}];
  if(specific.length)steps.push({em:'✂️',t:'Make it smaller:',sub:specific});
  steps.push({em:'✅',t:'Now try it. Then check: does my answer make sense?'});
  return steps}
function breakDown(item,box){const steps=breakSteps(item);let i=0;box.hidden=false;box.className='box';
  function show(){const st=steps[i];box.innerHTML='<div class="row" style="justify-content:space-between"><span class="muted">🧩 Break it down · step '+(i+1)+' of '+steps.length+'</span><button class="speak" id="bdsp">🔊</button></div><p style="font-size:1.25rem"><b>'+st.em+' '+esc(st.t)+'</b></p>'+(st.sub?'<ol style="margin:0;padding-left:22px;font-size:1.15rem">'+st.sub.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>':'')+'<div class="row" style="justify-content:center">'+(i<steps.length-1?'<button class="btn sm" id="bdn">Next step ➜</button>':'<button class="btn sm good" id="bdn">Got it, I will try</button>')+'</div>';
    const text=st.t+(st.say?' '+st.say:'')+(st.sub?' '+st.sub.join(' '):'');speak(text.replace(/__/g,'blank'),{force:true,rate:.95});$('bdsp').onclick=()=>speak(text.replace(/__/g,'blank'),{force:true,rate:.95});
    $('bdn').onclick=()=>{i++;if(i>=steps.length){box.hidden=true;box.innerHTML='';try{speechSynthesis.cancel()}catch(e){}return}show()}}
  show()}

// ---------- Math Toolkit: the aids a teacher would put on the desk. Using one counts as help (not mastery). ----------
function mathTools(key,box){
  const tabs=[];
  if(['numbers','add','sub','money'].includes(key))tabs.push(['hund','💯 Hundred chart']);
  tabs.push(['line','📏 Number line']);
  if(['mul','money','frac','pre'].includes(key))tabs.push(['times','✖️ Times chart']);
  if(['frac','pre'].includes(key))tabs.push(['bars','🍫 Fraction bars']);
  if(key==='money')tabs.push(['coins','🪙 Coins']);
  box.hidden=false;box.className='box';
  function show(t){
    let h='<div class="row" style="justify-content:center;gap:6px">'+tabs.map(x=>'<button class="btn sm '+(x[0]===t?'':'ghost')+'" data-t="'+x[0]+'">'+x[1]+'</button>').join('')+'<button class="btn sm ghost" id="tclose">✖ Close</button></div>';
    if(t==='hund'){h+='<p class="center muted" style="font-size:.95rem">Tap numbers to mark your jumps. Down one row = +10. Right one box = +1.</p><div id="hc" style="display:grid;grid-template-columns:repeat(10,1fr);gap:2px;max-width:480px;margin:auto">'+Array.from({length:100},(_,i)=>'<button data-n="'+(i+1)+'" style="padding:6px 0;font-size:.95rem;border:1px solid #dde;border-radius:5px;background:var(--card);cursor:pointer">'+(i+1)+'</button>').join('')+'</div>'}
    if(t==='line'){const max=key==='pre'?10:20,min=key==='pre'?-10:0;h+='<p class="center muted" style="font-size:.95rem">Tap where you start, then tap each hop. Right = add, left = take away.</p><div id="nl" style="display:flex;gap:2px;justify-content:center;flex-wrap:wrap">'+Array.from({length:max-min+1},(_,i)=>i+min).map(v=>'<button data-n="'+v+'" style="width:34px;padding:8px 0;font-size:.95rem;border:none;border-top:3px solid var(--ink,#334);background:transparent;cursor:pointer">'+(v<0?'−'+(-v):v)+'</button>').join('')+'</div><p class="center" id="nlr" style="font-size:1.2rem"></p>'}
    if(t==='times'){h+='<p class="center muted" style="font-size:.95rem">Tap a box to see the fact. Then try to remember it without the chart.</p><div style="display:grid;grid-template-columns:repeat(11,1fr);gap:2px;max-width:480px;margin:auto;font-size:.9rem;text-align:center"><b>×</b>'+Array.from({length:10},(_,i)=>'<b>'+(i+1)+'</b>').join('');for(let a=1;a<=10;a++){h+='<b>'+a+'</b>';for(let b=1;b<=10;b++)h+='<button class="tc" data-a="'+a+'" data-b="'+b+'" style="padding:5px 0;border:1px solid #dde;border-radius:5px;background:var(--card);cursor:pointer;font-size:.9rem">'+(a*b)+'</button>'}h+='</div><p class="center" id="tcr" style="font-size:1.3rem"></p>'}
    if(t==='bars'){const ds=[1,2,3,4,5,6,8,10];h+='<p class="center muted" style="font-size:.95rem">Each bar is one whole. Line them up to compare.</p>'+ds.map(d=>'<div style="display:grid;grid-template-columns:repeat('+d+',1fr);gap:2px;margin:3px auto;max-width:480px">'+Array.from({length:d},()=>'<button class="fb" style="padding:6px 0;border:1px solid #dde;border-radius:4px;background:var(--card);font-size:.85rem;cursor:pointer">'+(d===1?'1':'1/'+d)+'</button>').join('')+'</div>').join('')}
    if(t==='coins'){h+='<div class="row" style="justify-content:center;gap:12px;font-size:1.2rem"><span class="pill">penny 1¢</span><span class="pill">nickel 5¢</span><span class="pill">dime 10¢</span><span class="pill">quarter 25¢</span><span class="pill">$1 = 100¢</span></div><p class="center muted">4 quarters = $1 · 10 dimes = $1 · count the big coins first</p>'}
    box.innerHTML=h;
    box.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>show(b.dataset.t));$('tclose').onclick=()=>{box.hidden=true;box.innerHTML=''};
    box.querySelectorAll('#hc button').forEach(b=>b.onclick=()=>{const on=b.style.background!=='var(--coin)';b.style.background=on?'var(--coin)':'var(--card)';if(on)speak(b.dataset.n,{force:true})});
    let start=null,hops=0;box.querySelectorAll('#nl button').forEach(b=>b.onclick=()=>{const v=+b.dataset.n;if(start===null){start=v;hops=0;b.style.background='var(--coin)';$('nlr').textContent='Start at '+v}else{b.style.background='#cfe8ff';hops=v-start;$('nlr').textContent='From '+start+' to '+v+': '+(hops>=0?'+':'−')+Math.abs(hops)+' (that is '+Math.abs(hops)+' hops)'}speak(String(v),{force:true})});
    box.querySelectorAll('.tc').forEach(b=>b.onclick=()=>{const a=+b.dataset.a,c=+b.dataset.b;box.querySelectorAll('.tc').forEach(x=>{x.style.background=(+x.dataset.a===a||+x.dataset.b===c)?'#fff4cc':'var(--card)'});b.style.background='var(--coin)';$('tcr').textContent=a+' × '+c+' = '+(a*c);speak(a+' times '+c+' is '+(a*c),{force:true})});
    box.querySelectorAll('.fb').forEach(b=>b.onclick=()=>{b.style.background=b.style.background==='var(--accent)'?'var(--card)':'var(--accent)'});
  }
  show(tabs[0][0]);
}
