// ---------- Word Work: read the word you see, out loud ----------
const WORDLV=[
 {n:'Short vowels',tip:'Say each sound, then blend them together.',w:[['cat','cat','short a like hat',['cot','cut','cap']],['sun','sun','short u like fun',['sin','son','sum']],['hop','hop','short o like top',['hip','hot','hog']],['bed','bed','short e like red',['bad','bid','bud']],['pig','pig','short i like big',['peg','pin','big']],['map','map','short a',['mop','mat','nap']],['net','net','short e',['nut','not','men']],['lid','lid','short i',['led','lad','lip']],['box','box','short o',['bus','fox','bax']],['bug','bug','short u',['bag','big','hug']],['jam','jam','short a',['jim','gem','ham']],['wet','wet','short e',['wit','wed','vet']]]},
 {n:'Blends and digraphs',tip:'sh, ch, th are one sound. Blends like fr and st keep both sounds.',w:[['ship','ship','sh is one sound',['shop','chip','slip']],['frog','frog','fr blend',['from','flag','fog']],['chat','chat','ch like chip',['chop','cat','that']],['spin','spin','sp blend',['span','skin','spit']],['thump','thump','th then ump',['thumb','jump','stump']],['stop','stop','st blend',['step','spot','shop']],['brush','brush','br blend, sh at the end',['brash','blush','bush']],['clock','clock','cl blend, ck at the end',['click','cloak','block']],['think','think','th then ink',['thank','thing','thick']],['whisk','whisk','wh then isk',['whisker','wish','whist']],['glass','glass','gl blend',['grass','class','gloss']],['trash','trash','tr blend, sh at the end',['trish','crash','track']]]},
 {n:'Silent e',tip:'Silent e at the end makes the vowel say its name.',w:[['cake','cake','a says its name',['cook','make','back']],['bike','bike','i says its name',['bake','back','like']],['home','home','o says its name',['hum','hole','hose']],['cube','cube','u says its name',['cub','cute','tube']],['smile','smile','long i, silent e',['small','slime','simile']],['plane','plane','long a',['plan','plain','plant']],['stone','stone','long o',['stun','store','stove']],['shine','shine','long i',['shin','shone','shrine']],['grape','grape','long a',['grip','grasp','gripe']],['whale','whale','long a',['while','wheel','wall']],['flute','flute','long u',['flat','float','fluke']],['brave','brave','long a',['brake','bravo','grave']]]},
 {n:'Vowel teams',tip:'Two vowels walk together: ai, ee, oa, ea, igh.',w:[['boat','boat','oa says long o',['bolt','beat','boot']],['rain','rain','ai says long a',['ran','rein','train']],['light','light','igh says long i',['lit','fight','laugh']],['tree','tree','ee says long e',['try','three','tray']],['beach','beach','ea says long e',['bench','batch','bleach']],['coat','coat','oa says long o',['cot','cat','coast']],['night','night','igh says long i',['knit','nice','neat']],['dream','dream','ea says long e',['drum','drama','cream']],['snail','snail','ai says long a',['snack','sail','snarl']],['sweet','sweet','ee says long e',['sweat','swept','sweep']],['toast','toast','oa says long o',['toss','taste','test']],['bright','bright','igh says long i',['bright','brought','bring'].map((x,i)=>i===0?'brit':x)]]},
 {n:'Bossy r',tip:'When r follows a vowel it changes the sound: ar, or, er, ir, ur.',w:[['car','car','ar like star',['core','cur','cart']],['bird','bird','ir says er',['bard','bored','bride']],['fork','fork','or like corn',['fark','fort','frock']],['turn','turn','ur says er',['torn','tarn','true']],['farm','farm','ar',['form','firm','frame']],['storm','storm','or',['stern','strum','stem']],['girl','girl','ir says er',['grill','gull','gal']],['nurse','nurse','ur says er',['norse','nose','noise']],['garden','gar-den','ar then den',['guard','golden','harden']],['corner','cor-ner','or then er',['cornet','coroner','corn']],['hurt','hurt','ur says er',['heart','hut','hart']],['shark','shark','sh then ar',['shirk','shack','sharp']]]},
 {n:'Two parts',tip:'Clap the two parts, then put them together.',w:[['basket','bas-ket','bas, ket',['bucket','blanket','biscuit']],['rabbit','rab-bit','rab, bit',['ribbon','robot','habit']],['picnic','pic-nic','pic, nic',['picture','panic','pickle']],['sunset','sun-set','sun, set',['sunrise','subset','sunlit']],['napkin','nap-kin','nap, kin',['pumpkin','napping','kitten']],['market','mar-ket','mar, ket',['marker','racket','magnet']],['pocket','pock-et','pock, et',['packet','rocket','picket']],['window','win-dow','win, dow',['widow','winter','willow']],['muffin','muf-fin','muf, fin',['muffle','puffin','mitten']],['customer','cus-tom-er','cus, tom, er',['custom','costume','customs']],['problem','prob-lem','prob, lem',['probably','program','emblem']],['money','mon-ey','mon, ey',['monkey','many','honey']]]},
 {n:'Three parts',tip:'Tap each part on the table as you say it. Find the loud part.',w:[['fantastic','fan-tas-tic','loud part: TAS',['fantasy','plastic','frantic']],['remember','re-mem-ber','loud part: MEM',['member','reminder','December']],['important','im-por-tant','loud part: POR',['imported','impatient','importance']],['umbrella','um-brel-la','loud part: BREL',['umbrellas','unbuckle','Cinderella']],['yesterday','yes-ter-day','loud part: YES',['Wednesday','yesteryear','everyday']],['tomorrow','to-mor-row','loud part: MOR',['tomato','borrow','sorrow']],['beautiful','beau-ti-ful','beau sounds like byoo',['bountiful','dutiful','beauty']],['delicious','de-li-cious','cious says shus',['delirious','decision','ambitious']],['adventure','ad-ven-ture','ture says cher',['advantage','venture','adventurous']],['hamburger','ham-bur-ger','ham, bur, ger',['hamper','burger','hamster']],['customer','cus-tom-er','cus, tom, er',['custom','costume','customs']],['business','busi-ness','say BIZ-ness',['busyness','bushiness','basin']]]},
 {n:'Word parts (un-, re-, -ful, -tion)',tip:'Find the base word, then add the beginning or ending.',w:[['unhappy','un-hap-py','un means not',['happily','unhappily','unhook']],['replay','re-play','re means again',['reply','relay','display']],['helpful','help-ful','ful means full of',['helpless','hopeful','handful']],['kindness','kind-ness','ness makes it a thing',['kinds','kingdom','blindness']],['careless','care-less','less means without',['carless','careful','cordless']],['invention','in-ven-tion','tion says shun',['intention','invitation','inventor']],['unlock','un-lock','un means not',['unlucky','unblock','relock']],['rebuild','re-build','re means again',['rebuilt','rebel','rebound']],['powerful','pow-er-ful','ful',['powerless','purposeful','powder']],['location','lo-ca-tion','tion says shun',['vacation','lotion','locate']],['preview','pre-view','pre means before',['review','previous','prevent']],['teacher','teach-er','er means a person who',['teach','teaches','teether']]]},
 {n:'Business words',tip:'These are the words business owners use every day.',w:[['profit','prof-it','money you keep after costs',['prophet','proffer','pro fit'.replace(' ','')]],['revenue','rev-e-nue','all the money that comes in',['avenue','review','venue']],['inventory','in-ven-to-ry','the supply waiting to be sold',['invention','inventor','inventive']],['customer','cus-tom-er','a person who buys',['custom','costume','customs']],['competition','com-pe-ti-tion','other businesses selling the same thing',['completion','compilation','composition']],['advertise','ad-ver-tise','tell people about your product',['advertisement','adverse','advice']],['quality','qual-i-ty','how good something is',['quantity','equality','qualify']],['budget','budg-et','a plan for your money',['bucket','badge','budge']],['expense','ex-pense','money going out',['expand','expensive','expanse']],['investor','in-ves-tor','a person who puts money in to help a business grow',['investigator','inventor','invest']],['discount','dis-count','a lower price',['discard','discount','account'].map((x,i)=>i===1?'viscount':x)],['entrepreneur','en-tre-pre-neur','a person who starts a business',['enterprise','entertainer','interpreter']]]},
];
function wordsQuest(done){
  const N=6;let i=0,right=0;const lvl=()=>sk('words').level;
  // queue: up to 2 tricky words from stories, then words at her level (never the same word twice in a day)
  const used=new Set(today().log.filter(l=>l.m==='words').map(l=>l.w));
  const tricky=Object.keys(D.reading.tricky).filter(w=>D.reading.tricky[w]>0&&!used.has(w)).slice(0,2);
  function nextWord(){const L=WORDLV[Math.min(lvl(),WORDLV.length-1)];const fresh=L.w.filter(x=>!used.has(x[0]));return pick(fresh.length?fresh:L.w)}
  function next(){
    if(i>=N)return finish();
    let entry,fromStory=false;
    if(tricky.length){const w=tricky.shift();entry=WORDLV.flatMap(l=>l.w).find(x=>x[0]===w)||[w,w,'a word from your story',[]];fromStory=true}
    else entry=nextWord();
    used.add(entry[0]);const [w,syl,tip,dis]=entry;const L=WORDLV[Math.min(lvl(),WORDLV.length-1)];
    readWord(w,syl,tip,dis,{head:'🔤 Word Work · '+(fromStory?'from your story':L.n)+' · '+(i+1)+' of '+N,bar:Math.round(100*i/N)},(ok,mode,heard)=>{
      i++;logItem('words',{w,ok,mode,heard,level:lvl(),fromStory});
      if(fromStory){if(ok)D.reading.tricky[w]=Math.max(0,(D.reading.tricky[w]||1)-1)}else record('words',lvl(),ok,true);
      if(ok){right++;coins(2)}
      if(!fromStory&&advanceIfReady('words',WORDLV.length)){return nextBtn(()=>{confetti();render('<div class="stars pop">📚⭐</div><h2 class="center">Reading level up!</h2><p class="center">You mastered <b>'+WORDLV[lvl()-1].n+'</b>. Next: <b>'+WORDLV[lvl()].n+'</b>.</p><div class="row" style="justify-content:center"><button class="btn good" id="go">Keep going!</button></div>');speak('Reading level up! You mastered '+WORDLV[lvl()-1].n+'.');coins(5);$('go').onclick=next})}
      nextBtn(next);
    });
  }
  function finish(){D.stars+=1;coins(8);save();completeQuest('words','You read '+right+' of '+N+' words out loud. Level: '+WORDLV[Math.min(lvl(),WORDLV.length-1)].n+'.',done)}
  micIntro('Word Work','I will show you a word. You read it out loud, and I listen. If it is tricky, I will show you the parts and we say it together.',next);
}
// one word: she reads it; the mic checks; tricky → parts → say it together → try again
function readWord(w,syl,tip,dis,meta,cb){
  let tries=0;
  function screen1(){
    render('<div class="row" style="justify-content:space-between"><span class="muted">'+meta.head+'</span></div><div class="bar"><div style="width:'+meta.bar+'%"></div></div><p class="prompt small muted">Read this word out loud. Tap <b>My turn</b>, then say it.</p><p class="prompt word" id="theword">'+w+'</p><p class="center muted" id="parts" style="font-size:1.3rem;min-height:1.5em"></p><div class="row" style="justify-content:center"><button class="btn pink" id="say" style="font-size:1.5rem">🎙️ My turn</button><button class="btn ghost sm" id="help">🧩 Help me</button></div><p class="feedback" id="fb"></p><div id="extra"></div>');
    if(tries===0&&meta.firstSpeak!==false)speak('Read this word out loud. Tap My turn, then say it.',{force:true});
    $('help').onclick=()=>helpScreen(false);
    $('say').onclick=async()=>{$('say').disabled=true;$('fb').textContent='Listening… say it now';const r=await listen(4500);{const sb=$('say');if(sb)sb.disabled=false};
      if(r.err&&MIC==='no')return noMicFlow();
      if(r.err){$('fb').textContent='I did not catch it. Tap My turn and say it a little louder.';return}
      const ok=wordMatch(w,r.text,r.alts).every(x=>x.ok);
      if(ok){$('fb').textContent=pick(CHEERS)+' I heard "'+r.text+'".';speak(pick(CHEERS));cb(true,'mic',r.text);return}
      tries++;$('fb').textContent='I heard "'+r.text+'". Not quite. Let\'s break it into parts.';speak('I heard '+r.text+'. Not quite. Let\'s break it into parts.',{force:true});
      setTimeout(()=>helpScreen(true),1600);
    };
  }
  function helpScreen(afterMiss){
    const parts=syl.split('-');
    render('<div class="row" style="justify-content:space-between"><span class="muted">'+meta.head+'</span></div><p class="prompt small">Tap each part and say it. Then say the whole word.</p><div class="row" style="justify-content:center;gap:10px" id="parts">'+parts.map((p,k)=>'<button class="opt" data-k="'+k+'" style="font-size:2rem;padding:16px 22px;min-height:0">'+p+'</button>').join('')+'</div><p class="center muted" style="font-size:1.1rem">'+esc(tip)+'</p><div class="row" style="justify-content:center"><button class="btn ghost" id="whole">🔊 Hear the whole word</button></div><p class="feedback" id="fb"></p><div class="row" style="justify-content:center"><button class="btn pink" id="back" hidden style="font-size:1.4rem">🎙️ Now I read it</button></div>');
    let k=0;const partBtns=[...document.querySelectorAll('#parts .opt')];
    const sayPart=(idx)=>speak(parts[idx],{force:true,rate:.75});
    partBtns.forEach(b=>b.onclick=()=>{const j=+b.dataset.k;sayPart(j);b.classList.add('right');if(j===k)k++;if(k>=parts.length){$('back').hidden=false;$('fb').textContent='Now put it together: '+w}});
    $('whole').onclick=()=>speak(w,{force:true,rate:.8});
    speak(parts.length>1?'Tap each part and say it with me.':'Listen: '+w+'. Now tap it and say it.',{force:true});
    $('back').onclick=()=>{if(tries>=2){return cb(false,'mic')}screen1Retry()};
    if(parts.length===1){$('back').hidden=false}
  }
  function screen1Retry(){
    render('<div class="row" style="justify-content:space-between"><span class="muted">'+meta.head+' · try again</span></div><p class="prompt small muted">Say the whole word. Tap <b>My turn</b>.</p><p class="prompt word">'+w+'</p><p class="center muted" style="font-size:1.3rem">'+syl.split('-').join(' · ')+'</p><div class="row" style="justify-content:center"><button class="btn ghost" id="hear">🔊 Hear it</button><button class="btn pink" id="say" style="font-size:1.5rem">🎙️ My turn</button></div><p class="feedback" id="fb"></p>');
    $('hear').onclick=()=>speak(w,{force:true,rate:.8});
    $('say').onclick=async()=>{$('say').disabled=true;$('fb').textContent='Listening…';const r=await listen(4500);{const sb=$('say');if(sb)sb.disabled=false};
      if(r.err&&MIC==='no')return noMicFlow();
      if(r.err){$('fb').textContent='I did not catch it. Try once more, nice and loud.';return}
      const ok=wordMatch(w,r.text,r.alts).every(x=>x.ok);
      if(ok){$('fb').textContent='Yes! That is '+w+'!';speak('Yes! That is '+w+'! You fixed it!');cb(true,'mic',r.text);return}
      tries++;if(tries>=3){$('fb').textContent='Good effort. The word is '+w+'. We will see it again another day.';speak('Good effort. The word is '+w+'. We will see it again another day.',{force:true,rate:.9});D.reading.tricky[w]=(D.reading.tricky[w]||0)+1;save();cb(false,'mic',r.text);return}
      $('fb').textContent='I heard "'+r.text+'". Listen once more, then say it.';speak(w,{force:true,rate:.75});
    };
  }
  // no microphone: listen and tap the word you hear, then say it 3 times
  function noMicFlow(){
    const opts=shuffle([w].concat((dis||[]).slice(0,3)));while(opts.length<4)opts.push(w+'s');
    render('<div class="row" style="justify-content:space-between"><span class="muted">'+meta.head+'</span></div><p class="prompt small">No microphone here, so: listen, then tap the word you hear.</p><div class="row" style="justify-content:center"><button class="btn pink" id="hear">🔊 Hear the word</button></div><div class="opts">'+opts.map(o=>'<button class="opt" style="font-size:1.7rem" data-v="'+esc(o)+'">'+o+'</button>').join('')+'</div><p class="feedback" id="fb"></p>');
    const say=()=>speak(w,{force:true,rate:.85});$('hear').onclick=say;setTimeout(say,500);
    let answered=false;
    document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{if(answered)return;answered=true;const ok=b.dataset.v===w;
      if(ok){b.classList.add('right');$('fb').textContent='You found it! Now say it out loud 3 times: '+w;speak('You found it! Say it three times. '+w+'. '+w+'. '+w+'.',{force:true,rate:.85});nextBtn(()=>cb(true,'tap'),'I said it! Next')}
      else{b.classList.add('wrong');document.querySelectorAll('.opt').forEach(x=>{if(x.dataset.v===w)x.classList.add('right')});$('fb').textContent='The word was "'+w+'": '+syl.split('-').join(' · ');speak('The word was '+w+'. '+syl.split('-').join(', ')+'. '+w+'. Say it with me.',{force:true,rate:.8});D.reading.tricky[w]=(D.reading.tricky[w]||0)+1;save();nextBtn(()=>cb(false,'tap'))}});
  }
  screen1();
}
// microphone warm-up screen (asks permission once per visit)
function micIntro(title,text,next){
  pauseMusicGate(()=>{
    render('<div class="stars">🎙️</div><h2 class="center">'+title+'</h2><p class="center">'+text+'</p>'+(MIC==='yes'?'':'<p class="center muted">First, tap the button and say <b>hello</b> so the microphone wakes up. If your iPad asks, tap <b>Allow</b>.</p>')+'<div class="row" style="justify-content:center">'+(MIC==='yes'?'<button class="btn good" id="go">Start</button>':'<button class="btn pink" id="mic" style="font-size:1.4rem">🎙️ Say hello</button><button class="btn ghost sm" id="skip">No microphone today</button>')+'</div><p class="feedback" id="fb"></p>');
    speak(text,{force:true});
    let started=false;const go=()=>{if(started)return;started=true;next()};
    if($('go'))$('go').onclick=go;
    if($('mic'))$('mic').onclick=async()=>{if(started||!$('mic'))return;$('mic').disabled=true;$('fb').textContent='Listening…';const r=await listen(5000);if(!$('mic'))return;$('mic').disabled=false;
      if(r.text){MIC='yes';$('fb').textContent='I heard "'+r.text+'". Your microphone works!';speak('I heard you! Your microphone works. Let\'s go!');$('mic').hidden=true;$('skip').hidden=true;nextBtn(go,'Start')}
      else if(MIC==='no'){$('fb').textContent='The microphone is not available here. You will listen and tap instead.';$('mic').hidden=true;$('skip').hidden=true;nextBtn(go,'Okay, start')}
      else{$('fb').textContent='I did not hear anything. Tap and say hello a little louder.'}};
    if($('skip'))$('skip').onclick=()=>{if(started)return;MIC='no';go()};
  });
}
