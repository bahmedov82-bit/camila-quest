// ---------- Times Tables: memorize the multiplication facts, one table at a time ----------
// Each fact (like 3×7, same as 7×3) has a box 0-4. Right AND fast (under 5 s, typed on the keypad) moves it up one box;
// right but slow stays; a miss drops it back (to box 1 if it was solid, else 0). A box comes back after [0,1,2,4,7] days.
// Memorized = box 3 or more (answered fast on at least 3 different days). The next table opens when every fact
// of the current table: 8 of its 10 facts at box 2 or more (the rest keep coming back as reviews).
const TT_ORDER=[2,10,5,3,4,9,6,8,7];
const TT_GAP=[0,1,2,4,7];
const ttKey=(a,b)=>Math.min(a,b)+'x'+Math.max(a,b);
function tt(){D.tt=D.tt||{cur:0,facts:{},log:[]};return D.tt}
function ttFact(a,b){const T=tt();const k=ttKey(a,b);return T.facts[k]=T.facts[k]||{box:0,seen:0,right:0,due:todayKey()}}
function ttTable(n){return Array.from({length:10},(_,i)=>[n,i+1])}
function ttCurTable(){return TT_ORDER[Math.min(tt().cur,TT_ORDER.length-1)]}
function ttUnlocked(){return TT_ORDER.slice(0,tt().cur+1)}
function ttMemorizedCount(){const set=new Set();for(let a=2;a<=10;a++)for(let b=1;b<=10;b++){const f=tt().facts[ttKey(a,b)];if(f&&f.box>=3)set.add(ttKey(a,b))}return set.size}
function ttTotal(){const set=new Set();for(let a=2;a<=10;a++)for(let b=1;b<=10;b++)set.add(ttKey(a,b));return set.size}
function ttTableDone(n){return ttTable(n).filter(([a,b])=>(tt().facts[ttKey(a,b)]||{box:0}).box>=2).length>=8}
function ttMapHTML(){
  const color=b=>b>=3?'var(--good)':b===2?'#7bd3a8':b===1?'var(--coin)':b===0?'#f6c1d9':'var(--card)';
  let h='<div style="display:grid;grid-template-columns:repeat(11,1fr);gap:3px;max-width:520px;margin:8px auto;font-size:.85rem;text-align:center"><b>×</b>';
  for(let b=1;b<=10;b++)h+='<b>'+b+'</b>';
  for(let a=2;a<=10;a++){h+='<b>'+a+'</b>';for(let b=1;b<=10;b++){const f=tt().facts[ttKey(a,b)];h+='<span style="padding:5px 0;border-radius:6px;background:'+(f&&f.seen?color(f.box):'var(--card)')+';border:1px solid var(--line,#dde)">'+(f&&f.box>=3?a*b:'')+'</span>'}}
  return h+'</div><p class="center muted" style="font-size:.9rem">🟩 memorized · 🟨 learning · 🩷 tricky · ⬜ not yet</p>'}
// on-screen number pad: no keyboard popping up, works the same on any iPad
function keypadHTML(){return '<div class="center" style="font-size:2.6rem;font-weight:800;min-height:1.3em" id="kpv">&nbsp;</div><div id="kp" style="display:grid;grid-template-columns:repeat(3,84px);gap:10px;justify-content:center">'+[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map(k=>'<button class="opt" data-k="'+k+'" style="min-height:64px;font-size:1.8rem;padding:0">'+k+'</button>').join('')+'</div>'}
function wireKeypad(onEnter){let v='';const show=()=>{$('kpv').innerHTML=v||'&nbsp;'};
  document.querySelectorAll('#kp .opt').forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(k==='⌫')v=v.slice(0,-1);else if(k==='✓'){if(v)onEnter(+v)}else if(v.length<3)v+=k;show()});
  return {clear:()=>{v='';show()},set:x=>{v=String(x);show()}}}

function timesQuest(done){
  const T=tt();const N=12;let i=0,right=0,fast=0;const items=[];const today_=todayKey();
  // advance tables if the current one is learned
  while(T.cur<TT_ORDER.length-1&&ttTableDone(ttCurTable()))T.cur++;
  const cur=ttCurTable();
  // 1) reviews that are due from tables already open (oldest boxes first), up to 7
  const due=[];ttUnlocked().forEach(n=>ttTable(n).forEach(([a,b])=>{const f=T.facts[ttKey(a,b)];if(f&&f.seen&&f.due<=today_&&!due.some(x=>ttKey(x[0],x[1])===ttKey(a,b)))due.push([a,b])}));
  due.sort((x,y)=>ttFact(...x).box-ttFact(...y).box);shuffle(due.slice(0,7)).forEach(x=>items.push({f:x,mode:'review'}));
  // 2) current table: facts not yet solid, 3 brand-new ones per day at most
  const learning=ttTable(cur).filter(([a,b])=>{const f=T.facts[ttKey(a,b)];return !f||f.box<2}).filter(x=>!items.some(y=>ttKey(...y.f)===ttKey(...x)));
  let fresh=0;for(const x of learning){if(items.length>=N)break;const f=T.facts[ttKey(...x)];if(!f||!f.seen){if(fresh>=3)continue;fresh++;items.push({f:x,mode:'new'})}else items.push({f:x,mode:'practice'})}
  // 3) fill with mixed practice from open tables
  let guard=0;while(items.length<N&&guard++<60){const n=pick(ttUnlocked()),b=rnd(1,10);if(!items.some(y=>ttKey(...y.f)===ttKey(n,b)))items.push({f:[n,b],mode:'practice'})}
  const order=items.filter(x=>x.mode==='new').concat(shuffle(items.filter(x=>x.mode!=='new')));

  function intro(){render('<div class="stars">✖️</div><h2 class="center">Times Tables</h2><p class="center">This week\'s table: <b>×'+cur+'</b>. Type the answer on the keypad. Fast and right makes a fact grow. When a square turns green, you own it forever.</p><p class="center"><b>'+ttMemorizedCount()+' of '+ttTotal()+'</b> facts memorized</p>'+ttMapHTML()+'<div class="row" style="justify-content:center"><button class="btn good" id="go">Start</button><button class="btn ghost" id="learn">📖 See the ×'+cur+' table first</button></div>');
    speak('Times Tables! This week, the '+cur+' table. Type the answer on the keypad. Fast and right makes it grow.');$('go').onclick=next;$('learn').onclick=()=>learnTable(cur,intro)}
  function next(){if(i>=order.length)return finish();const it=order[i];if(it.mode==='new')return learnFact(it.f,()=>ask(it));ask(it)}
  function ask(it){
    let [a,b]=it.f;if(rnd(0,1)&&a!==b)[a,b]=[b,a];const ans=a*b;const f=ttFact(a,b);const t0=performance.now();let tries=0;
    render('<div class="row" style="justify-content:space-between"><span class="muted">✖️ Times Tables · ×'+cur+' week · '+(i+1)+' of '+order.length+(it.mode==='review'?' · remember this one?':'')+'</span><button class="speak" id="sp">🔊</button></div><div class="bar"><div style="width:'+Math.round(100*i/order.length)+'%"></div></div><p class="prompt" style="font-size:3rem">'+a+' × '+b+' = ?</p>'+keypadHTML()+'<p class="feedback" id="fb"></p>');
    if(window.__cq)window.__cq.answer=String(ans);
    const say=()=>speak(a+' times '+b);$('sp').onclick=say;say();
    const kp=wireKeypad(v=>{const secs=(performance.now()-t0)/1000;
      if(v===ans){const quick=secs<5&&tries===0;f.seen++;
        if(tries===0){f.right++;right++;if(quick){fast++;f.box=Math.min(4,f.box+1)}}
        f.due=keyOf(addDays(new Date(),TT_GAP[f.box]));T.log.push({d:todayKey(),f:ttKey(a,b),ok:tries===0,s:Math.round(secs*10)/10});if(T.log.length>400)T.log.shift();
        logItem('times',{t:a+'x'+b,ok:tries===0,secs:Math.round(secs*10)/10,fast:quick});
        $('fb').textContent=tries?'Yes! '+a+' × '+b+' = '+ans+'. Lock it in.':(quick?pick(CHEERS)+' ⚡':'Right! Next time try to just know it.');speak(tries?a+' times '+b+' is '+ans:quick?pick(CHEERS):'Right!');coins(quick?2:1);save();
        document.querySelectorAll('#kp .opt').forEach(x=>x.disabled=true);i++;return nextBtn(next)}
      tries++;if(tries===1)f.box=f.box>=2?1:0;f.due=todayKey();save();kp.clear();
      if(tries===1){$('fb').innerHTML='Not yet. Think: '+hintFor(a,b);speak('Not yet. '+hintFor(a,b).replace(/<[^>]+>/g,''),{force:true});return}
      $('fb').innerHTML='<b>'+a+' × '+b+' = '+ans+'</b>. Say it 3 times, then type it.';speak(a+' times '+b+' is '+ans+'. Say it with me. '+a+' times '+b+' is '+ans+'.',{force:true,rate:.85});logItem('times',{t:a+'x'+b,ok:false})});
  }
  function hintFor(a,b){const big=Math.max(a,b),small=Math.min(a,b);
    if(small===1)return 'anything times 1 is itself';if(small===2)return 'times 2 is a double: '+big+' + '+big;if(big===10||small===10)return 'times 10: put a zero on the end';
    if(small===5||big===5)return 'count by 5s: '+skipList(5,small===5?big:small);if(small===9||big===9){const o=small===9?big:small;return 'times 9: '+o+' × 10 = '+(o*10)+', take away '+o}
    if(small===4||big===4){const o=small===4?big:small;return 'double, then double again: '+o+' → '+(2*o)+' → ?'}
    if(small===3||big===3){const o=small===3?big:small;return 'double it, then add one more '+o+': '+(2*o)+' + '+o}
    return small+' × 5 = '+(small*5)+', then add '+(big-5)+' more groups of '+small}
  function learnFact([a,b],cont){const ans=a*b;
    render('<div class="row" style="justify-content:space-between"><span class="muted">✖️ New fact</span></div><p class="prompt" style="font-size:2.6rem">'+a+' × '+b+' = <span style="color:var(--good)">'+ans+'</span></p>'+(b<=10&&a<=10?groupsTot(b,a):'')+'<p class="center" style="font-size:1.2rem">'+hintFor(a,b)+'</p><p class="center muted">Say it out loud 3 times: "'+a+' times '+b+' is '+ans+'."</p><div class="row" style="justify-content:center"><button class="btn good" id="go">I said it 3 times</button></div>');
    speak('New fact. '+a+' times '+b+' is '+ans+'. Say it three times.',{force:true,rate:.9});$('go').onclick=cont}
  function finish(){const T2=tt();const was=T2.cur;while(T2.cur<TT_ORDER.length-1&&ttTableDone(ttCurTable()))T2.cur++;D.stars+=1;coins(8);save();
    const up=T2.cur>was?' New table unlocked: ×'+ttCurTable()+'!':'';if(up)confetti();
    completeQuest('times',right+' of '+order.length+' right, '+fast+' lightning fast. '+ttMemorizedCount()+' of '+ttTotal()+' facts memorized. Working on ×'+ttCurTable()+'.'+up,done)}
  intro();
}
// the whole table, tap to count up by skip counting
function learnTable(n,back){let k=0;
  render('<h2 class="center">The ×'+n+' table</h2><p class="center muted">Tap each row and say it out loud.</p><div class="opts one" id="tl">'+Array.from({length:10},(_,i)=>'<button class="opt txt" data-i="'+i+'" style="font-size:1.4rem">'+n+' × '+(i+1)+' = <b class="ans" style="visibility:hidden">'+(n*(i+1))+'</b></button>').join('')+'</div><div class="row" style="justify-content:center"><button class="btn good" id="back">Ready to practice</button></div>');
  document.querySelectorAll('#tl .opt').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;b.querySelector('.ans').style.visibility='visible';b.classList.add('right');speak(n+' times '+(i+1)+' is '+(n*(i+1)),{force:true})});
  speak('The '+n+' table. Tap each row and say it out loud.',{force:true});$('back').onclick=back}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
