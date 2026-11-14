// ---------- Study Arena: boss battles built from her school study guides, one deck per subject ----------
const SUBJECTS=[['math','🔢','Math'],['ela','📚','English / ELA'],['science','🔬','Science'],['history','🏛️','Social Studies'],['spanish','🌎','World Language'],['other','📝','Other']];
const subjOf=id=>SUBJECTS.find(s=>s[0]===id)||SUBJECTS[5];
// Parse a pasted study guide into cards. Accepts "term - definition", "term: definition", "Question? Answer",
// "Q: ... / A: ..." on consecutive lines, or tab-separated. Returns [{q,a}].
function parseGuide(text){const lines=String(text||'').split(/\r?\n/).map(l=>l.replace(/^\s*(\d+[.)]|[-*•])\s*/,'').trim()).filter(Boolean);const cards=[];let pendingQ=null;
  for(const l of lines){let m;
    if((m=l.match(/^(?:q|question)\s*[:.)-]\s*(.+)$/i))){pendingQ=m[1].trim();continue}
    if((m=l.match(/^(?:a|answer)\s*[:.)-]\s*(.+)$/i))){if(pendingQ){cards.push({q:pendingQ,a:m[1].trim()});pendingQ=null}continue}
    if(pendingQ&&!/[\t:–—]| - /.test(l)&&!/\?/.test(l)){cards.push({q:pendingQ,a:l});pendingQ=null;continue}
    if((m=l.match(/^(.+?)\t+(.+)$/))){cards.push({q:m[1].trim(),a:m[2].trim()});continue}
    if((m=l.match(/^(.+?\?)\s*(.+)$/))){cards.push({q:m[1].trim(),a:m[2].trim()});continue}
    if((m=l.match(/^(.+?)\s+[-–—=]\s+(.+)$/))){cards.push({q:m[1].trim(),a:m[2].trim()});continue}
    if((m=l.match(/^([^:]{1,80}):\s+(.+)$/))){cards.push({q:m[1].trim(),a:m[2].trim()});continue}
    if(/\?$/.test(l)){pendingQ=l;continue}
  }
  return cards.filter(c=>c.q.length>1&&c.a.length>0&&c.q.length<300&&c.a.length<300)}
function decks(){D.decks=D.decks||[];return D.decks}
function addDeck(subject,title,cards){const d={id:'d'+Date.now().toString(36),subject,title:title||subjOf(subject)[2]+' study guide',cards:cards.map(c=>({q:c.q,a:c.a,box:0,seen:0,right:0,wrong:0})),created:todayKey(),due:todayKey(),wins:0,losses:0,best:null,history:[]};decks().push(d);save();return d}
function deckMastery(d){if(!d.cards.length)return 0;return Math.round(100*d.cards.reduce((a,c)=>a+Math.min(c.box,3),0)/(3*d.cards.length))}
function dueDecks(){const t=todayKey();return decks().filter(d=>d.due<=t&&deckMastery(d)<100)}
function scheduleDeck(d,won){const m=deckMastery(d);const days=!won?1:m>=100?14:m>=70?7:m>=40?3:1;const n=new Date();n.setDate(n.getDate()+days);d.due=keyOf(n);save()}
const isNumeric=s=>/^[\d.,$%\s/-]+$/.test(s);
// distractors: other answers from the same deck (same "shape" where possible)
function distractFor(d,card){const others=[...new Set(d.cards.filter(c=>c!==card&&norm(c.a)!==norm(card.a)).map(c=>c.a))];const wc=s=>s.trim().split(/\s+/).length;const cap=s=>/^[A-Z0-9]/.test(s);const sim=a=>Math.abs(wc(a)-wc(card.a))+(cap(a)===cap(card.a)?0:2)+(isNumeric(a)===isNumeric(card.a)?0:3)+Math.random()*0.9;const pool=others.sort((x,y)=>sim(x)-sim(y)).slice(0,6);const out=shuffle(pool).slice(0,3);while(out.length<3)out.push(isNumeric(card.a)?String(parseFloat(card.a.replace(/[^\d.-]/g,''))+out.length+1||'0'):['Not sure','None of these','All of these'][out.length]);return out}

function arenaHome(){
  const ds=decks();const due=dueDecks();
  const list=ds.length?ds.map(d=>{const s=subjOf(d.subject);const m=deckMastery(d);const isDue=d.due<=todayKey();return '<button class="quest '+(m>=100?'done':isDue?'now':'')+'" data-id="'+d.id+'"><span class="em">'+s[1]+'</span><b>'+esc(d.title)+'</b><span class="sub">'+s[2]+' · '+d.cards.length+' cards · '+m+'% mastered'+(m>=100?' · 🏆':isDue?' · ready to battle':' · comes back '+d.due)+'</span><div class="bar" style="height:8px;margin-top:6px"><div style="width:'+m+'%"></div></div></button>'}).join(''):'<p class="muted">No study guides loaded yet. A grown-up can paste one in Grown-ups → School, or send it to Claude to load.</p>';
  render('<div class="row" style="justify-content:space-between"><h2>⚔️ Study Arena</h2><button class="btn ghost sm" id="back">Back to the map</button></div><p>Each study guide is a boss. Hit it with right answers. Three hearts. Lose them all and the boss escapes.'+(due.length?' <b>'+due.length+' boss'+(due.length>1?'es':'')+' ready today.</b>':'')+'</p><div class="quests" id="decks">'+list+'</div>');
  $('back').onclick=home;document.querySelectorAll('#decks .quest').forEach(b=>b.onclick=()=>deckMenu(ds.find(d=>d.id===b.dataset.id)));
  speak('Study Arena! Pick a boss.');
}
function deckMenu(d){const s=subjOf(d.subject);const m=deckMastery(d);const weak=d.cards.filter(c=>c.wrong>c.right).length;
  render('<div class="row" style="justify-content:space-between"><span class="muted">'+s[1]+' '+s[2]+'</span><button class="btn ghost sm" id="back">Back</button></div><h2>'+esc(d.title)+'</h2><p>'+d.cards.length+' cards · '+m+'% mastered · wins '+d.wins+' · escapes '+d.losses+(d.best!=null?' · best run: '+d.best+' hearts left':'')+(weak?' · '+weak+' tricky cards':'')+'</p><div class="opts"><button class="opt" id="study" style="font-size:1.3rem">📖 Study first<br><span class="muted" style="font-size:.9rem;font-weight:500">flip through the cards, hear them read</span></button><button class="opt" id="battle" style="font-size:1.3rem;border-color:var(--accent)">⚔️ Battle the boss<br><span class="muted" style="font-size:.9rem;font-weight:500">win coins, or lose your hearts</span></button></div>');
  $('back').onclick=arenaHome;$('study').onclick=()=>studyCards(d,()=>deckMenu(d));$('battle').onclick=()=>battle(d);
}
function studyCards(d,done){let i=0;const order=shuffle(d.cards.map((_,k)=>k));
  function show(){const c=d.cards[order[i]];let flipped=false;
    render('<div class="row" style="justify-content:space-between"><span class="muted">📖 Study · card '+(i+1)+' of '+order.length+'</span><button class="btn ghost sm" id="quit">Done studying</button></div><button class="opt txt" id="card" style="min-height:200px;font-size:1.5rem;text-align:center"><span class="muted" style="font-size:.9rem;display:block">QUESTION · tap to flip</span>'+esc(c.q)+'</button><div class="row" style="justify-content:center"><button class="btn ghost" id="hear">🔊 Read it</button><button class="btn" id="next">Next card ➜</button></div>');
    const read=()=>speak(flipped?c.a:c.q,{force:true,rate:.95});read();$('hear').onclick=read;
    $('card').onclick=()=>{flipped=!flipped;$('card').innerHTML='<span class="muted" style="font-size:.9rem;display:block">'+(flipped?'ANSWER':'QUESTION')+' · tap to flip</span>'+esc(flipped?c.a:c.q);$('card').style.background=flipped?'var(--goodbg)':'';read()};
    $('next').onclick=()=>{i++;if(i>=order.length)return done();show()};$('quit').onclick=done}
  show();
}
function battle(d){
  const s=subjOf(d.subject);let hearts=3,streak=0,hits=0,t0=Date.now();const missed=new Set();
  // queue: cards needing the most work first; a card leaves the battle once answered right twice this run
  const need={};d.cards.forEach((c,k)=>need[k]=2);
  let queue=shuffle(d.cards.map((_,k)=>k)).sort((a,b)=>(d.cards[a].box-d.cards[b].box));
  const total=d.cards.length*2;const bossHP=()=>Object.values(need).reduce((a,b)=>a+b,0);
  const hud_=()=>'<div class="row" style="justify-content:space-between"><span>'+'❤️'.repeat(hearts)+'🖤'.repeat(3-hearts)+'</span><span class="muted">'+s[1]+' '+esc(d.title)+'</span><span>'+(streak>=3?'🔥 x'+streak+' ':'')+'</span></div><div class="row" style="gap:8px;align-items:center"><span style="font-size:1.6rem">👹</span><div class="bar" style="flex:1;height:18px"><div style="width:'+Math.round(100*bossHP()/total)+'%;background:linear-gradient(90deg,#9b5cff,var(--accent))"></div></div><span class="muted" style="font-size:.9rem">'+bossHP()+'</span></div>';
  function next(){
    if(bossHP()<=0)return win();
    if(!queue.length)queue=shuffle(Object.keys(need).filter(k=>need[k]>0).map(Number));
    const k=queue.shift();const c=d.cards[k];const typed=c.box>=2&&c.a.length<=14&&!/\s.*\s/.test(c.a);
    const opts=typed?null:shuffle([c.a].concat(distractFor(d,c)));
    render(hud_()+'<p class="prompt small" style="margin-top:8px">'+esc(c.q)+'</p>'+(typed?'<p class="center muted" style="font-size:.95rem">Type the answer</p><div class="row" style="justify-content:center"><input type="text" id="typed" class="wide" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" style="font-size:1.4rem;text-align:center"><button class="btn good" id="ok">Attack!</button></div>':'<div class="opts one">'+opts.map(o=>'<button class="opt txt" data-v="'+esc(o)+'">'+esc(o)+'</button>').join('')+'</div>')+'<p class="feedback" id="fb"></p><div class="row" style="justify-content:center"><button class="speak" id="sp" aria-label="Read aloud">🔊</button></div>');
    $('sp').onclick=()=>speak(c.q+(opts?'. '+opts.join('. '):''),{force:true});speak(c.q,{force:true});
    const answer=(given)=>{const ok=norm(given)===norm(c.a)||(typed&&soundsLike(given,c.a)&&norm(given).length>=3);c.seen++;
      if(ok){c.right++;need[k]=Math.max(0,need[k]-1);streak++;hits++;const dmg=streak>=5?3:streak>=3?2:1;if(dmg>1)need[k]=Math.max(0,need[k]-(dmg-1));if(need[k]===0)c.box=Math.min(3,c.box+1);
        $('fb').textContent=pick(['Hit!','Direct hit!','Boom!','Critical hit!','The boss stumbles!'])+(dmg>1?' x'+dmg+' combo!':'');speak($('fb').textContent);coins(1);save();return nextBtn(next,'Next ➜')}
      c.wrong++;c.box=Math.max(0,c.box-1);streak=0;hearts--;missed.add(k);queue.splice(Math.min(3,queue.length),0,k);need[k]=2;save();
      $('fb').innerHTML='Ouch! You lost a heart. The answer is: <b>'+esc(c.a)+'</b>';speak('Ouch, you lost a heart. The answer is '+c.a+'. It will come back, so remember it.',{force:true});
      document.querySelectorAll('.opt').forEach(x=>{if(norm(x.dataset.v)===norm(c.a))x.classList.add('right');else if(norm(x.dataset.v)===norm(given))x.classList.add('wrong')});
      if(hearts<=0)return nextBtn(lose,'The boss escaped…','pink');nextBtn(next,'Keep fighting ➜')};
    if(typed){$('typed').focus();const go=()=>{if(!$('typed').value.trim())return;$('ok').disabled=true;answer($('typed').value)};$('ok').onclick=go;$('typed').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}}}
    else{let a=false;document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{if(a)return;a=true;answer(b.dataset.v)})}
  }
  function win(){d.wins++;d.best=d.best==null?hearts:Math.max(d.best,hearts);d.history.push({date:todayKey(),won:true,hearts,secs:Math.round((Date.now()-t0)/1000)});scheduleDeck(d,true);const m=deckMastery(d);const reward=10+hearts*5+(m>=100?20:0);coins(reward);D.stars+=1;if(m>=100&&!D.badges.includes('deck_'+d.id)){D.badges.push('deck_'+d.id)}save();confetti();
    render('<div class="stars pop">🏆⚔️🏆</div><h1 class="center">Boss defeated!</h1><p class="center">'+esc(d.title)+' · '+hearts+' heart'+(hearts===1?'':'s')+' left · +'+reward+' coins</p><p class="center">Mastery: <b>'+m+'%</b>'+(m>=100?' · DECK MASTERED! 🎉':' · comes back '+d.due+' so it sticks')+'</p>'+(missed.size?'<p class="center muted">Still tricky: '+[...missed].map(k=>esc(d.cards[k].q)).slice(0,5).join(' · ')+'</p>':'')+'<div class="row" style="justify-content:center"><button class="btn" id="back">Back to the Arena</button></div>');
    speak('Boss defeated! '+hearts+' hearts left. '+(m>=100?'Deck mastered!':'Great work!'));$('back').onclick=arenaHome;logItem('arena',{deck:d.title,won:true,hearts})}
  function lose(){d.losses++;d.history.push({date:todayKey(),won:false,hits,secs:Math.round((Date.now()-t0)/1000)});scheduleDeck(d,false);save();logItem('arena',{deck:d.title,won:false,hits});
    render('<div class="stars">💨👹</div><h2 class="center">The boss escaped!</h2><p class="center">You landed '+hits+' hits. No coins this time, but you know exactly what to study: the cards you missed are below. Review them, then challenge the boss again.</p><div class="row" style="justify-content:center"><button class="btn pink" id="review">📖 Review the '+missed.size+' missed card'+(missed.size===1?'':'s')+'</button><button class="btn ghost" id="back">Back to the Arena</button></div>');
    speak('The boss escaped! No coins this time. Review the cards you missed, then challenge it again. You will get it.',{force:true});$('back').onclick=arenaHome;
    $('review').onclick=()=>{const sub={cards:[...missed].map(k=>d.cards[k])};studyCards(sub,()=>{render('<div class="stars">⚔️</div><h2 class="center">Ready for a rematch?</h2><div class="row" style="justify-content:center"><button class="btn good" id="again">Challenge the boss again</button><button class="btn ghost" id="later">Later</button></div>');$('again').onclick=()=>battle(d);$('later').onclick=arenaHome})}}
  render('<div class="stars">👹</div><h2 class="center">'+esc(d.title)+'</h2><p class="center">The boss has <b>'+total+'</b> health. Every right answer is a hit, three in a row hits harder. You have <b>3 hearts</b>. A wrong answer costs one, and that card comes back.</p><p class="center muted">No clock. Think before you tap.</p><div class="row" style="justify-content:center"><button class="btn pink" id="go" style="font-size:1.4rem">⚔️ Fight!</button><button class="btn ghost sm" id="back">Back</button></div>');
  speak('The boss has '+total+' health. You have three hearts. Think before you tap. Fight!',{force:true});$('go').onclick=next;$('back').onclick=()=>deckMenu(d);
}
// grown-ups: load and manage decks
function schoolHTML(){const ds=decks();return '<p class="muted" style="font-size:.95rem">Paste a study guide below. One item per line: "term - definition", "term: definition", "Question? Answer", or Q:/A: on two lines. Each guide becomes a boss in the Study Arena.</p><div class="box gold"><div class="row"><label>Subject <select id="dSubj">'+SUBJECTS.map(s=>'<option value="'+s[0]+'">'+s[1]+' '+s[2]+'</option>').join('')+'</select></label><label>Title <input type="text" id="dTitle" class="wide" style="width:14em" placeholder="e.g. Ch. 5 Ancient Rome test"></label></div><textarea id="dText" style="width:100%;min-height:160px;font:inherit;font-size:.95rem;border-radius:12px;border:2px solid var(--line);padding:10px;background:var(--card);color:var(--fg)" placeholder="photosynthesis - how plants make food from sunlight&#10;What is the capital of Italy? Rome&#10;Q: Who was Charlemagne?&#10;A: King of the Franks crowned emperor in 800"></textarea><div class="row"><button class="btn sm" id="dPreview">Preview</button><button class="btn sm good" id="dAdd" disabled>Add deck</button><span id="dCount" class="muted" style="font-size:.9rem"></span></div><div id="dPrev" style="font-size:.9rem"></div></div>'+(ds.length?'<h3>Decks</h3>'+ds.map(d=>{const s=subjOf(d.subject);const weak=d.cards.filter(c=>c.wrong>c.right);return '<div class="box" data-id="'+d.id+'"><div class="row" style="justify-content:space-between"><b>'+s[1]+' '+esc(d.title)+'</b><span class="muted">'+d.cards.length+' cards · '+deckMastery(d)+'% · wins '+d.wins+' · escapes '+d.losses+' · next '+d.due+'</span></div>'+(weak.length?'<p style="font-size:.9rem">Tricky: '+weak.slice(0,8).map(c=>'<span class="chip bad">'+esc(c.q)+'</span>').join('')+'</p>':'')+'<div class="row"><button class="btn ghost sm dDue">Make it due today</button><button class="btn ghost sm dReset">Reset mastery</button><button class="btn ghost sm dDel">Delete</button></div></div>'}).join(''):'')}
function wireSchool(){const prev=()=>{const cards=parseGuide($('dText').value);$('dCount').textContent=cards.length+' card'+(cards.length===1?'':'s')+' found';$('dAdd').disabled=cards.length<3;$('dPrev').innerHTML=cards.slice(0,6).map(c=>'<div>• <b>'+esc(c.q)+'</b> → '+esc(c.a)+'</div>').join('')+(cards.length>6?'<div class="muted">…and '+(cards.length-6)+' more</div>':'')};
  if($('dPreview'))$('dPreview').onclick=prev;if($('dText'))$('dText').oninput=prev;
  if($('dAdd'))$('dAdd').onclick=()=>{const cards=parseGuide($('dText').value);if(cards.length<3)return;addDeck($('dSubj').value,$('dTitle').value.trim(),cards);parentPanel('school')};
  document.querySelectorAll('.box[data-id]').forEach(b=>{const d=decks().find(x=>x.id===b.dataset.id);if(!d)return;const del=b.querySelector('.dDel'),due=b.querySelector('.dDue'),rs=b.querySelector('.dReset');if(del)del.onclick=()=>{if(confirm('Delete "'+d.title+'"?')){D.decks=decks().filter(x=>x!==d);save();parentPanel('school')}};if(due)due.onclick=()=>{d.due=todayKey();save();parentPanel('school')};if(rs)rs.onclick=()=>{d.cards.forEach(c=>{c.box=0});d.due=todayKey();save();parentPanel('school')}})}
