// ---------- Weekly Check: the same test every week, so progress is measurable ----------
// 12 fixed math probes (one per skill-level across the range), 6 fixed words, one benchmark passage.
const CHECK_PROBES=[['numbers',1],['numbers',4],['add',2],['add',4],['add',5],['sub',2],['sub',3],['sub',4],['mul',1],['mul',2],['mul',4],['money',2]];
const CHECK_WORDS=['sun','ship','cake','rain','market','remember'];
const CHECK_PASSAGE={title:'The Saturday Stand',words:104,text:'Every Saturday, Lena sets up a small stand at the end of her street. She sells lemonade for one dollar a cup and cookies for fifty cents. Her mother helps her carry the table, but Lena counts the money herself. Last week she made eleven dollars. She spent four dollars on lemons and sugar, so her profit was seven dollars. This week she wants to try something new. She made a sign with bright colors and asked her neighbor if she could stand near the park instead. More people walk by the park. If more people see her stand, more people might buy.',
 qs:[['How much does a cup of lemonade cost?','One dollar','Fifty cents','Seven dollars','Four dollars'],['What was her profit last week?','Seven dollars','Eleven dollars','Four dollars','One dollar'],['Why does she want to move near the park?','More people walk by there','It is closer to home','Her mother said so','The park has a table']]};
function checkDue(){if(!D.checks.length)return true;const last=D.checks[D.checks.length-1].date;return (dayNum()-dayNumOf(last))>=7}
function dayNumOf(k){const [y,m,d]=k.split('-').map(Number);return Math.floor(Date.UTC(y,m-1,d)/86400000)}
function checkQuest(done){
  const res={date:todayKey(),n:D.checks.length+1,math:{right:0,of:CHECK_PROBES.length,secs:[],items:[]},words:{right:0,of:CHECK_WORDS.length,items:[]},read:{}};
  let i=0;
  function intro(){render('<div class="stars">📏</div><h2 class="center">'+(res.n===1?'Starting Line':'Weekly Check #'+res.n)+'</h2><p class="center">This is the same short check every week, so we can see how much you have grown. No hints this time, just do your best. Wrong answers are fine, they show us what to work on.</p><p class="center muted">12 math questions, 6 words, one short story.</p><div class="row" style="justify-content:center"><button class="btn good" id="go">Start</button></div>');speak(res.n===1?'This is your starting line. The same short check every week shows how much you grow. Just do your best.':'Weekly check! Same questions as last time. Let\'s see how much you grew.');$('go').onclick=math}
  function math(){
    if(i>=CHECK_PROBES.length)return words(0);
    const [key,level]=CHECK_PROBES[i];const item=genItem(key,level);
    showItem(item,{head:'📏 Check · math '+(i+1)+' of '+CHECK_PROBES.length,bar:Math.round(100*i/CHECK_PROBES.length)},(ok,secs,hinted,given)=>{
      res.math.items.push({key,level,ok,secs});if(ok){res.math.right++;res.math.secs.push(secs)}i++;logItem('check',{key,level,ok,secs,q:item.q.replace(/<[^>]+>/g,''),a:String(item.answer),given});
      nextBtn(math)});
  }
  function words(k){
    if(k>=CHECK_WORDS.length)return passage();
    const w=CHECK_WORDS[k];const entry=WORDLV.flatMap(l=>l.w).find(x=>x[0]===w)||[w,w,'',[]];
    readWord(w,entry[1],entry[2],entry[3],{head:'📏 Check · word '+(k+1)+' of '+CHECK_WORDS.length,bar:Math.round(100*k/CHECK_WORDS.length),firstSpeak:k===0},(ok,mode,heard)=>{res.words.items.push({w,ok,mode});if(ok)res.words.right++;res.words.mode=mode;nextBtn(()=>words(k+1))});
  }
  function passage(){
    const P=CHECK_PASSAGE;let t0=null,iv=null;
    if(MIC==='yes'){
      // read aloud in one go: start the clock, read, stop; the mic checks words sentence by sentence afterwards is too slow, so we time the whole read and sample accuracy on 3 sentences
      render('<p class="prompt small">Read this story <b>out loud</b>. Tap Start, read the whole thing, then tap Finished.</p><div class="row" style="justify-content:center"><button class="btn pink" id="start" style="font-size:1.4rem">▶ Start reading</button></div><div id="story" hidden><div class="passage">'+esc(P.text)+'</div><div class="row" style="justify-content:center;margin-top:10px"><button class="btn good" id="stop" style="font-size:1.4rem">✅ Finished</button><span class="big" id="clock" style="font-size:1.4rem">0:00</span></div></div>');
      speak('Read this story out loud. Tap Start, read the whole thing, then tap Finished.',{force:true});
      $('start').onclick=()=>{t0=performance.now();$('start').hidden=true;$('story').hidden=false;iv=setInterval(()=>{const s=Math.floor((performance.now()-t0)/1000);$('clock').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')},250)};
      $('stop').onclick=()=>{clearInterval(iv);res.read.secs=Math.round((performance.now()-t0)/1000);res.read.mode='oral';sample(0)};
    } else {
      render('<p class="prompt small">Read this story to yourself. Tap Start, read, then tap Finished.</p><div class="row" style="justify-content:center"><button class="btn pink" id="start" style="font-size:1.4rem">▶ Start reading</button></div><div id="story" hidden><div class="passage">'+esc(P.text)+'</div><div class="row" style="justify-content:center;margin-top:10px"><button class="btn good" id="stop" style="font-size:1.4rem">✅ Finished</button><span class="big" id="clock" style="font-size:1.4rem">0:00</span></div></div>');
      speak('Read this story to yourself. Tap Start, read, then tap Finished.',{force:true});
      $('start').onclick=()=>{t0=performance.now();$('start').hidden=true;$('story').hidden=false;iv=setInterval(()=>{const s=Math.floor((performance.now()-t0)/1000);$('clock').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')},250)};
      $('stop').onclick=()=>{clearInterval(iv);res.read.secs=Math.round((performance.now()-t0)/1000);res.read.mode='silent';res.read.acc=null;questions(0)};
    }
  }
  // accuracy sample: she re-reads 3 sentences into the mic
  const SAMPLE=sentences(CHECK_PASSAGE.text).filter((s,j)=>[1,3,5].includes(j));
  let sampleOk=0,sampleOf=0;
  function sample(k){
    if(k>=SAMPLE.length){res.read.acc=sampleOf?Math.round(100*sampleOk/sampleOf):null;return questions(0)}
    const s=SAMPLE[k];let fails=0;
    render('<div class="row" style="justify-content:space-between"><span class="muted">📏 Check · read this line '+(k+1)+' of 3</span></div><p class="prompt small muted">One more time, out loud. Tap <b>Read it</b>, then read.</p><div class="sentence">'+esc(s)+'</div><div class="row" style="justify-content:center"><button class="btn pink" id="say" style="font-size:1.4rem">🎙️ Read it</button></div><p class="feedback" id="fb"></p>');
    $('say').onclick=async()=>{$('say').disabled=true;$('fb').textContent='Listening…';const r=await listen(Math.min(15000,3500+s.length*90));{const sb=$('say');if(sb)sb.disabled=false}
      if(r.err){fails++;if(fails>=2)return nextBtn(()=>sample(k+1));$('fb').textContent='I did not catch that. Try once more.';return}
      const m=wordMatch(s,r.text,r.alts).filter(x=>x.w.length>2);sampleOf+=m.length;sampleOk+=m.filter(x=>x.ok).length;$('fb').textContent='Got it.';nextBtn(()=>sample(k+1))};
  }
  function questions(qi){
    const P=CHECK_PASSAGE;if(qi===0)res.read.comp=0;
    if(qi>=P.qs.length)return finish();
    const Q=P.qs[qi];const ans=Q[1];const opts=shuffle(Q.slice(1));
    render('<div class="row" style="justify-content:space-between"><span class="muted">📏 Check · question '+(qi+1)+' of 3</span><button class="speak" id="sp">🔊</button></div><p class="prompt small">'+Q[0]+'</p><div class="opts one">'+opts.map(o=>'<button class="opt txt" data-v="'+esc(o)+'">'+o+'</button>').join('')+'</div><p class="feedback" id="fb"></p>');
    $('sp').onclick=()=>speak(Q[0]+'. '+opts.join('. '),{force:true});let a=false;
    document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{if(a)return;a=true;const ok=b.dataset.v===ans;if(ok){res.read.comp++;b.classList.add('right');$('fb').textContent='Got it.'}else{b.classList.add('wrong');document.querySelectorAll('.opt').forEach(x=>{if(x.dataset.v===ans)x.classList.add('right')});$('fb').textContent='The answer was: '+ans}nextBtn(()=>questions(qi+1))});
  }
  function finish(){
    res.math.pct=Math.round(100*res.math.right/res.math.of);res.math.median=median(res.math.secs);res.words.pct=Math.round(100*res.words.right/res.words.of);
    const P=CHECK_PASSAGE;res.read.wpm=res.read.secs?Math.round(P.words/(res.read.secs/60)):null;res.read.wcpm=(res.read.wpm&&res.read.acc!=null)?Math.round(res.read.wpm*res.read.acc/100):null;
    D.checks.push(res);D.stars+=2;coins(15);save();
    const prev=D.checks.length>1?D.checks[D.checks.length-2]:null;
    const delta=(a,b)=>(a==null||b==null)?'':(a-b>0?' (up '+(a-b)+')':a-b<0?' (down '+(b-a)+')':' (same)');
    const msg='Math '+res.math.pct+'%'+(prev?delta(res.math.pct,prev.math.pct):'')+' · words '+res.words.pct+'%'+(prev?delta(res.words.pct,prev.words.pct):'')+(res.read.wpm?' · reading '+res.read.wpm+' words/min'+(prev&&prev.read.wpm?delta(res.read.wpm,prev.read.wpm):''):'')+' · story questions '+res.read.comp+'/3';
    completeQuest('check',(res.n===1?'Starting line set. ':'Check #'+res.n+' done. ')+msg,done);
  }
  micIntro(res.n===1?'Starting Line':'Weekly Check',res.n===1?'A short check to see where you are today. Same one every week, so you can watch yourself grow.':'Same check as last week. Let\'s see how much you grew.',intro);
}
