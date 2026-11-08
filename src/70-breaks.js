// ---------- breaks: music and dance ----------
let AC=null;
function beatStart(bpm){if(MUSIC)return ()=>{};try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();}catch(e){return ()=>{}}
  const period=60/bpm;let n=0;let stopped=false;
  function kick(t){const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(45,t+.12);g.gain.setValueAtTime(.9,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+.3)}
  function hat(t){const b=AC.createBuffer(1,AC.sampleRate*.05,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const src=AC.createBufferSource();src.buffer=b;const g=AC.createGain();g.gain.value=.25;const f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=6000;src.connect(f).connect(g).connect(AC.destination);src.start(t)}
  function clap(t){const b=AC.createBuffer(1,AC.sampleRate*.12,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);const src=AC.createBufferSource();src.buffer=b;const g=AC.createGain();g.gain.value=.5;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=1800;src.connect(f).connect(g).connect(AC.destination);src.start(t)}
  function tick(){if(stopped)return;const t=AC.currentTime+.05;kick(t);hat(t+period/2);if(n%2===1)clap(t);n++;setTimeout(tick,period*1000)}
  tick();return ()=>{stopped=true};
}
const BREAK_KINDS=['beat','routine','dance','freeze','chant','mirror','statue'];
function breakMenu(after){
  resumeMusicHint();today().breaks++;save();
  const card=(k,em,t,sub,style)=>'<button class="opt" style="font-size:1.25rem;'+(style||'')+'" data-b="'+k+'">'+em+' '+t+'<br><span class="muted" style="font-size:.85rem;font-weight:500">'+sub+'</span></button>';
  render('<h2 class="center">🎶 Break time! Pick one</h2><div class="opts" id="breaks">'+card('surprise','🎲','Surprise me!','a different break every time','border-color:var(--coin)')+card('routine','🩰','Learn the Routine','8 moves, TikTok style')+card('beat','🥁','Tap the Beat','hit the pads on the beat')+card('dance','💃','Dance Party','a beat plays, do the moves')+card('freeze','🧊','Freeze Dance','dance, then freeze')+card('chant','🎤','Power Chant','repeat after me, loud')+card('mirror','🪞','Copy the Pose','strike and hold')+card('playlist','🎵','My playlist','your song, our moves')+card('skip','🗺️','Skip break','back to the map')+'</div>');
  speak('Break time! Pick one, Camila.');
  document.querySelectorAll('#breaks .opt').forEach(b=>b.onclick=()=>{let k=b.dataset.b;if(k==='skip')return after();if(k==='surprise'){k=pick(BREAK_KINDS.filter(x=>x!==D.lastBreak))}D.lastBreak=k;save();runBreak(k,after)});
}
function runBreak(kind,after){
  const MOVES=shuffle([['👏','Clap clap clap!'],['🌀','Spin around!'],['🦘','Jump jump!'],['🙌','Hands in the air!'],['🐛','Wiggle wiggle!'],['🤖','Robot arms!'],['🕺','Shake your hips!'],['🦶','Stomp stomp!'],['🫧','Float like a bubble!'],['⭐','Star jump!'],['🦩','Stand on one foot!'],['🌊','Make waves with your arms!'],['🐸','Frog hop!'],['🎸','Air guitar!'],['🪩','Disco point!'],['🐢','Slow motion!'],['⚡','Fast fast fast!'],['🧘','Freeze and breathe!'],['🦋','Butterfly arms!'],['🥁','Drum on your knees!']]);
  const CHANT=shuffle(['I can do hard things!','My brain is getting stronger!','Mistakes help me learn!','I am smart and I am brave!','Nothing can stop Camila!','I keep going!','I am a superstar!','Not yet means I am on my way!','I am the boss of my brain!','Every try makes me stronger!','I run my own business!','Big goals, small steps!','I can learn anything!']);
  let t=kind==='routine'?75:(D.settings.breakSecs||45);let stop=()=>{};let timers=[];
  const fmt=s=>Math.floor(Math.max(0,s)/60)+':'+String(Math.max(0,s)%60).padStart(2,'0');
  render('<h2 class="center" id="btitle"></h2><div class="big" id="move" style="font-size:4.5rem;min-height:1.3em">🎶</div><p class="prompt small center" id="mtext"></p><div id="strip"></div><div class="big" id="timer" style="font-size:2rem">'+fmt(t)+'</div><div class="row" style="justify-content:center"><button class="btn ghost" id="more">+30 seconds</button><button class="btn pink" id="skip">Done, next quest</button></div>');
  let restartRoutine=null;
  $('more').onclick=()=>{t+=30;if(restartRoutine)restartRoutine()};
  const show=(em,txt,say)=>{if($('move'))$('move').textContent=em;if($('mtext'))$('mtext').textContent=txt;if(say!==false)speak(txt)};
  if(kind==='beat'){
    $('btitle').textContent='🥁 Tap the Beat';$('mtext').textContent='Tap the pad that lights up, right on the beat!';
    $('move').innerHTML='<div class="opts" id="pads" style="max-width:420px;margin:0 auto">'+[0,1,2,3].map(k=>'<button class="opt" data-k="'+k+'" style="min-height:110px;font-size:2rem;background:var(--soft)">'+['🎵','🎶','🎤','⭐'][k]+'</button>').join('')+'</div><p class="big" id="score" style="font-size:1.6rem">Score 0</p>';
    let score=0,live=null,liveAt=0;const pads=[...document.querySelectorAll('#pads .opt')];
    const light=()=>{if(t<=0)return;pads.forEach(p=>p.style.background='var(--soft)');const k=rnd(0,3);live=k;liveAt=performance.now();pads[k].style.background='var(--accent)';timers.push(setTimeout(()=>{if(live===k){pads[k].style.background='var(--soft)';live=null}},700))};
    stop=beatStart(100);timers.push(setInterval(light,600));
    pads.forEach(p=>p.onclick=()=>{const k=+p.dataset.k;if(live===k){const dt=performance.now()-liveAt;const pts=dt<250?3:dt<500?2:1;score+=pts;p.style.background='var(--good)';live=null;$('score').textContent='Score '+score+(pts===3?' 🔥':'')}else{p.style.background='var(--badbg)';setTimeout(()=>{if(live!==k)p.style.background='var(--soft)'},150)}});
    timers.push(setTimeout(()=>{const bonus=Math.min(10,Math.floor(score/6));coins(bonus);if($('mtext'))$('mtext').textContent='Score '+score+'! +'+bonus+' coins';speak('Score '+score+'! Nice rhythm!')},t*1000));
  }
  if(kind==='routine'){
    const ROUTINES=[
      [['👏','Clap, clap'],['🙌','Arms up'],['👉','Point right'],['👈','Point left'],['🫰','Snap, snap'],['🕺','Hip bump'],['🌀','Spin'],['🙆','Big finish!']],
      [['🦶','Step tap'],['🦶','Step tap'],['🫶','Heart hands'],['🙌','Push the sky'],['🤖','Robot'],['🤖','Robot'],['🌊','Wave arms'],['⭐','Pose!']],
      [['👋','Wave high'],['👋','Wave low'],['🔄','Roll your shoulders'],['🤸','Lean left'],['🤸','Lean right'],['👏','Clap above'],['🦘','Little jump'],['🪩','Disco point!']],
      [['🫰','Snap'],['🫰','Snap'],['🙆','Circle arms'],['👟','Slide right'],['👟','Slide left'],['🙋','Hand up'],['🤷','Shrug'],['🎉','Strike a pose!']],
      [['🤲','Palms out'],['🤲','Palms in'],['👆','Point up'],['👇','Point down'],['💃','Hip left'],['💃','Hip right'],['🌀','Spin'],['😎','Cool pose!']],
      [['🥁','Drum knees'],['🥁','Drum knees'],['🙌','Roof'],['🙌','Roof'],['🦵','Kick'],['🦵','Kick'],['🫶','Heart'],['✨','Sparkle hands!']],
    ];
    const idx=dayNum()%ROUTINES.length;const R=ROUTINES[idx];
    $('btitle').textContent='🩰 Routine #'+(idx+1)+' · learn it like a dance video';
    $('strip').innerHTML='<div class="row" style="justify-content:center;gap:6px">'+R.map((m,i)=>'<div class="pill" id="rm'+i+'" style="flex-direction:column;padding:6px 10px;font-size:.8rem;gap:0"><span style="font-size:1.5rem">'+m[0]+'</span>'+(i+1)+'</div>').join('')+'</div>';
    speak('Learn the routine! Eight moves. Watch the first time, then dance it with me, then full speed.',{force:true});
    stop=beatStart(104);let step=0,round=0;const per=2300;
    const go=()=>{if(t<=0)return;const m=R[step%8];R.forEach((_,i)=>{const el=$('rm'+i);if(el)el.style.borderColor=(i===step%8)?'var(--accent)':'var(--line)'});show(m[0],(round===0?'Watch: ':round===1?'Now you: ':'Full speed: ')+m[1],round<2);step++;if(step%8===0){round++;if(round===1)speak('Now you try it!',{force:true});if(round===2)speak('Full speed! You know it!',{force:true})}};
    restartRoutine=()=>{step=0;round=1};
    timers.push(setTimeout(go,2500));timers.push(setInterval(go,per));
  }
  if(kind==='mirror'){$('btitle').textContent='🪞 Copy the Pose';stop=beatStart(90);speak('Copy the pose! Hold it until the next one!');
    const POSES=shuffle([['🙆','Arms in a big circle'],['🙋','One hand way up'],['🧍','Stand tall like a tree'],['🤸','Lean to the side'],['💪','Flex both arms'],['🤷','Shrug shoulders way up'],['🧎','Down on one knee'],['🙌','Reach for the ceiling'],['🫶','Make a heart with your hands']]);
    let i=0;const go=()=>{const m=POSES[i%POSES.length];i++;show(m[0],m[1])};timers.push(setTimeout(go,1200));timers.push(setInterval(go,5000));}
  if(kind==='statue'){$('btitle').textContent='🗿 Statue Game';speak('Statue game! Dance while the beat plays. When I say statue, hold perfectly still!');
    let playing=false;const cycle=()=>{if(t<=0)return;if(!playing){stop=beatStart(126);playing=true;show('💃','Dance!');timers.push(setTimeout(cycle,rnd(3000,6000)))}else{stop();playing=false;show('🗿','STATUE! Hold it!');timers.push(setTimeout(cycle,rnd(2000,4000)))}};timers.push(setTimeout(cycle,2500));}
  if(kind==='dance'){$('btitle').textContent='💃 Dance Party';stop=beatStart(120);speak('Dance party! Follow the moves!');
    const go=()=>{const m=pick(MOVES);show(m[0],m[1])};timers.push(setTimeout(go,1500));timers.push(setInterval(go,4000));}
  if(kind==='freeze'){$('btitle').textContent='🧊 Freeze Dance';speak('Freeze dance! Dance while the beat plays. When it stops, freeze!');
    let playing=false;const cycle=()=>{if(t<=0)return;if(!playing){stop=beatStart(118);playing=true;show('💃','Dance!');timers.push(setTimeout(cycle,rnd(4000,7000)))}else{stop();playing=false;show('🧊','FREEZE!');timers.push(setTimeout(cycle,2500))}};timers.push(setTimeout(cycle,2500));}
  if(kind==='playlist'){$('btitle').textContent='🎵 My playlist';show('🎧','Start your song, then dance!',false);
    const go=()=>{const m=pick(MOVES);show(m[0],m[1],false)};timers.push(setTimeout(go,6000));timers.push(setInterval(go,4000));}
  if(kind==='chant'){$('btitle').textContent='🎤 Power Chant';stop=beatStart(96);speak('Power chant! Say it after me, loud and proud!');
    let i=0;const go=()=>{const line=CHANT[i%CHANT.length];i++;show('🎤',line,false);speak(line);timers.push(setTimeout(()=>show('👉','Your turn! Say it!',false),1800))};timers.push(setTimeout(go,2200));timers.push(setInterval(go,5000));}
  const iv=setInterval(()=>{t--;if($('timer'))$('timer').textContent=fmt(t);if(t<=0){clearInterval(iv);stop();timers.forEach(clearTimeout);timers.forEach(clearInterval);if(kind!=='beat')show('🏆','Awesome break! Ready for the next quest?');if($('skip'))$('skip').textContent='Next quest ➜'}},1000);
  $('skip').onclick=()=>{clearInterval(iv);stop();timers.forEach(clearTimeout);timers.forEach(clearInterval);try{speechSynthesis.cancel()}catch(e){}after()};
}
