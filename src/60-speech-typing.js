// ---------- Echo Stage: speech ----------
const SPEECHLV=[
 {n:'Clear sounds',hint:'Say every sound. Especially the end of the word.',items:['red','little','think','three','spoon','street','yellow','brother','world','girl','squirrel','mother','thank','crisp','lamp']},
 {n:'Two-part words',hint:'Clap the two parts, then say it smoothly.',items:['basket','rabbit','window','market','pocket','napkin','customer','muffin','sister','winter','garden','money','ticket','rocket','jacket']},
 {n:'Short sentences',hint:'Say the whole sentence in one breath.',items:['I sell muffins.','The box is full.','She counts the money.','We walk to the door.','The dog is happy.','My brother likes pizza.','The red car is fast.','It is time for lunch.']},
 {n:'Business talk',hint:'Slow and clear, like talking to a customer.',items:['Would you like a muffin today?','Thank you for your order.','That will be two dollars, please.','Profit is the money you keep.','Here is your change.','Come back and see us again!','What flavor would you like?','I made these this morning.']},
 {n:'Longer sentences',hint:'Pause at the comma. Keep going to the end.',items:['When the sun came out, everyone wanted cold lemonade.','A customer is a person who buys what you sell.','She saved her money in three jars: spend, save, and grow.','If you listen to your customers, they will come back.','My cost was six dollars, and my revenue was twelve.','Good quality takes more time, but it brings people back.']},
 {n:'Tell me about it',hint:'Talk for a few sentences. There is no wrong answer.',open:true,items:['Tell me two things you would sell and why.','Tell me about your favorite song and why you like it.','Tell me what you did at school today.','Tell me how to make a sandwich, step by step.','If you had one hundred dollars for a business, what would you buy first?','Tell me about a time you helped someone.']},
 {n:'Tongue twisters',hint:'Slow first. Then a little faster. Smile!',items:['She sells seashells by the seashore.','Red lorry, yellow lorry.','Six sticky skeletons.','Fresh fried fish.','Which wristwatches are Swiss wristwatches?','A proper copper coffee pot.']},
];
function speechQuest(done){
  const N=5;let i=0,right=0;const lvl=()=>sk('speech').level;const used=new Set();
  function next(){
    if(i>=N)return finish();
    const L=SPEECHLV[Math.min(lvl(),SPEECHLV.length-1)];const fresh=L.items.filter(x=>!used.has(x));const target=pick(fresh.length?fresh:L.items);used.add(target);let tries=0;
    render('<div class="row" style="justify-content:space-between"><span class="muted">🎤 Echo Stage · '+L.n+' · '+(i+1)+' of '+N+'</span></div><div class="bar"><div style="width:'+Math.round(100*i/N)+'%"></div></div><p class="prompt small muted">'+(L.open?'Answer out loud. Tap <b>My turn</b>, then talk.':'Read this out loud. Tap <b>My turn</b>, then say it.')+'</p><p class="prompt '+(target.length<12?'word':'small')+'" style="'+(L.open?'font-weight:500':'')+'">'+esc(target)+'</p><p class="center muted" style="font-size:1rem">'+L.hint+'</p><div class="row" style="justify-content:center">'+(L.open?'':'<button class="btn ghost" id="hear">🔊 Hear it</button>')+'<button class="btn pink" id="say" style="font-size:1.5rem">🎙️ My turn</button></div><p class="feedback" id="fb"></p><div id="words" class="center"></div>');
    if($('hear'))$('hear').onclick=()=>speak(target,{force:true,rate:.85});
    if(i===0)speak(L.open?'Answer out loud. Tap My turn, then talk.':'Read this out loud. Tap My turn, then say it.',{force:true});
    if(L.open)speak(target,{force:true,queue:true});
    $('say').onclick=async()=>{$('say').disabled=true;$('fb').textContent='Listening…';const r=await listen(L.open?20000:(target.length>30?9000:6000));{const sb=$('say');if(sb)sb.disabled=false};
      if(r.err&&MIC==='no'){ // honor mode
        $('fb').textContent='No microphone here. Listen, then say it 3 times, loud and clear.';speak(target+'. '+target+'. '+target+'.',{force:true,rate:.8});return nextBtn(()=>mark(target,true,'honor'),'I said it 3 times! Next')}
      if(r.err){$('fb').textContent='I did not catch that. Tap My turn and speak up.';return}
      if(L.open){const wc=norm(r.text).split(' ').filter(Boolean).length;$('words').innerHTML='<p class="muted" style="font-size:.95rem">I heard: "'+esc(r.text)+'"</p>';
        if(wc>=8){$('fb').textContent='Great answer! '+wc+' words. Clear and strong.';speak('Great answer! You said '+wc+' words. Clear and strong.');return mark(target,true,'mic',r.text)}
        if(tries<1){tries++;$('fb').textContent='Good start ('+wc+' words). Say a little more. Why? What else?';speak('Good start! Tell me more. Why? What else?',{force:true});return}
        $('fb').textContent='Nice. Next time try for a few sentences.';return mark(target,wc>=4,'mic',r.text)}
      const m=wordMatch(target,r.text,r.alts).filter(x=>x.w.length>1);const score=m.filter(x=>x.ok).length/m.length;
      $('words').innerHTML=m.map(x=>'<span class="chip '+(x.ok?'ok':'bad')+'">'+x.w+'</span>').join('')+'<p class="muted" style="font-size:.95rem">I heard: "'+esc(r.text||'…')+'"</p>';
      if(score>=0.9){$('fb').textContent=pick(CHEERS);speak(pick(CHEERS));return mark(target,true,'mic',r.text)}
      if(tries<2){tries++;$('fb').textContent='Almost! Listen to the pink words, then try again.';speak('Almost. Listen. '+target+'. Your turn.',{force:true,rate:.8});return}
      $('fb').textContent='Good effort. Here it is once more, then we move on.';speak(target,{force:true,rate:.8});mark(target,false,'mic',r.text);
    };
  }
  function mark(t,ok,mode,heard){i++;logItem('speech',{t,ok,mode,heard,level:lvl()});if(mode==='mic')record('speech',lvl(),ok,true);if(ok){right++;coins(2)}
    if(advanceIfReady('speech',SPEECHLV.length)){return nextBtn(()=>{confetti();render('<div class="stars pop">🎤⭐</div><h2 class="center">Speech level up!</h2><p class="center">Next: <b>'+SPEECHLV[lvl()].n+'</b>.</p><div class="row" style="justify-content:center"><button class="btn good" id="go">Keep going!</button></div>');speak('Speech level up! Your voice is getting clearer every day.');coins(5);$('go').onclick=next})}
    nextBtn(next)}
  function finish(){D.stars+=1;coins(8);save();completeQuest('speech',right+' of '+N+' said clearly · level: '+SPEECHLV[Math.min(lvl(),SPEECHLV.length-1)].n,done)}
  micIntro('Echo Stage','You are the star. I show you words and lines, you say them out loud, and I check every word. Clear voice, big smile.',next);
}

// ---------- Typing Island ----------
const TYPELV=[
 {n:'Copy the word',mode:'copy',src:'level'},
 {n:'Spell what you hear',mode:'hear',src:'level'},
 {n:'Copy the sentence',mode:'copy',items:['I sell muffins.','The box is full.','She counts the money.','We walk to the door.','The dog runs fast.','My mom likes tea.']},
 {n:'Spell what you hear',mode:'hear',src:'level'},
 {n:'Type the sentence you hear',mode:'hear',items:['Thank you for your order.','That will be two dollars.','We walk to the next house.','Profit is the money you keep.','A customer buys what you sell.']},
 {n:'Business words',mode:'hear',items:['profit','customer','price','cost','revenue','inventory','location','budget','quality','service']},
];
function typingQuest(done){
  const N=5;let i=0,right=0;const times=[];const lvl=()=>sk('typing').level;const used=new Set();
  function source(L){if(L.items)return L.items;const W=WORDLV[Math.min(sk('words').level,WORDLV.length-1)].w.map(x=>x[0]);return W}
  function next(){
    if(i>=N)return finish();
    const L=TYPELV[Math.min(lvl(),TYPELV.length-1)];const pool=source(L).filter(x=>!used.has(x));const target=pick(pool.length?pool:source(L));used.add(target);const hear=L.mode==='hear';let t0=null,tries=0;
    render('<div class="row" style="justify-content:space-between"><span class="muted">⌨️ Typing Island · '+L.n+' · '+(i+1)+' of '+N+'</span><button class="speak" id="sp" aria-label="Hear it">🔊</button></div><div class="bar"><div style="width:'+Math.round(100*i/N)+'%"></div></div><p class="prompt small muted">'+(hear?'Listen, then type what you hear.':'Type exactly what you see.')+'</p>'+(hear?'<div class="row" style="justify-content:center"><button class="btn ghost" id="hear2">🔊 Hear it again</button></div>':'<p class="prompt '+(target.length<12?'word':'small')+'" id="tgt">'+esc(target)+'</p>')+'<div class="row" style="justify-content:center"><input type="text" id="typed" class="wide" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" style="font-size:1.6rem;text-align:center" placeholder="type here"><button class="btn good" id="ok">Check</button></div><p class="feedback" id="fb"></p>');
    const say=()=>speak(target,{force:true,rate:.85});$('sp').onclick=say;if(hear){$('hear2').onclick=say;setTimeout(say,500)}
    const inp=$('typed');inp.focus();inp.oninput=()=>{if(!t0)t0=performance.now()};
    const check=()=>{const v=norm(inp.value),want=norm(target);if(!v)return;const secs=t0?Math.round((performance.now()-t0)/100)/10:null;
      if(v===want){$('fb').textContent=pick(CHEERS);speak(pick(CHEERS));logItem('typing',{t:target,typed:inp.value,ok:true,secs,tries,level:lvl()});record('typing',lvl(),tries===0,true);right++;coins(2);if(secs)times.push({chars:target.length,secs});i++;
        if(advanceIfReady('typing',TYPELV.length)){return nextBtn(()=>{confetti();render('<div class="stars pop">⌨️⭐</div><h2 class="center">Typing level up!</h2><p class="center">Next: <b>'+TYPELV[lvl()].n+'</b>.</p><div class="row" style="justify-content:center"><button class="btn good" id="go">Keep going!</button></div>');coins(5);$('go').onclick=next})}
        return nextBtn(next)}
      if(tries<1){tries++;const diff=want.split('').map((c,k)=>c===(v[k]||'')?c:'<b style="color:var(--accent)">'+(c===' '?'␣':c)+'</b>').join('');$('fb').innerHTML='Not yet. The pink letters need fixing: '+diff;speak('Not yet. Look at the pink letters. '+(hear?'Listen again: '+target:'')+'. Fix it and check again.',{force:true,rate:.9});inp.focus();return}
      $('fb').innerHTML='It is spelled <b>'+esc(target)+'</b>. Type it once to lock it in.';speak('It is spelled like this. Type it once to lock it in.',{force:true});inp.value='';inp.placeholder=target;logItem('typing',{t:target,typed:v,ok:false,secs,tries,level:lvl()});record('typing',lvl(),false);tries=99;i++;
      $('ok').onclick=()=>{if(norm(inp.value)===want){coins(1);next()}else{inp.focus()}}};
    $('ok').onclick=check;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('ok').click()}};
  }
  function finish(){const tot=times.reduce((a,x)=>({c:a.c+x.chars,s:a.s+x.secs}),{c:0,s:0});const wpm=tot.s?Math.round((tot.c/5)/(tot.s/60)):null;D.typing.history.push({date:todayKey(),wpm,right});D.stars+=1;coins(8);save();completeQuest('typing',right+' of '+N+' typed right'+(wpm?' · about '+wpm+' words per minute':'')+' · level: '+TYPELV[Math.min(lvl(),TYPELV.length-1)].n,done)}
  render('<div class="stars">⌨️</div><h2 class="center">Typing Island</h2><p class="center">Five words or lines. Type carefully. Spelling counts, speed comes later.</p><div class="row" style="justify-content:center"><button class="btn good" id="go">Start</button></div>');speak('Typing Island! Five words or lines. Type carefully.');$('go').onclick=next;
}
