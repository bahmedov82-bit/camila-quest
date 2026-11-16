// ---------- Camila's education team: daily report out, plan from Dad in ----------
// Out: at the end of each day Camila taps "Send today's star to Dad". It opens Mail to Dad with the
//      readable report plus one CQDATA line the team's Coach reads from Gmail and logs.
// In:  plan.json (next to index.html on GitHub Pages) carries a note from Dad and, when the team
//      and Dad agree, level changes. Each plan id is applied once.
const DAD_EMAIL='bahmedov82@gmail.com';
function teamData(){
  const t=today();const acc=t.items?Math.round(100*t.correct/t.items):0;
  const levels={};SKILL_ORDER.forEach(k=>levels[k]=sk(k).level);
  levels.words=sk('words').level;levels.speech=sk('speech').level;levels.typing=sk('typing').level;levels.story=D.reading.level;levels.tt_table=ttCurTable();levels.tt_memorized=ttMemorizedCount();
  const C=D.checks||[];const c=C.length?C[C.length-1]:null;const c0=C.length?C[0]:null;
  const chk=c?{date:c.date,math:c.math.pct,words:c.words.pct,wpm:c.read.wpm||null,comp:c.read.comp,first:{date:c0.date,math:c0.math.pct,words:c0.words.pct,wpm:c0.read.wpm||null}}:null;
  let speechPct=null;try{const ib=intelligibilityByWeek();if(ib.length)speechPct=ib[ib.length-1].pct??null}catch(e){}
  const misses=(t.log||[]).filter(l=>l.m==='math'&&!l.ok).slice(0,8).map(l=>l.q+'='+l.a+' (said '+l.given+')');
  const tricky=Object.keys(D.reading.tricky||{}).filter(w=>D.reading.tricky[w]>0).slice(0,15);
  return {v:1,app:VERSION,day:todayKey(),quests_done:t.done.length,answers:t.items,pct:acc,min:Math.round(t.secs/60),day_stars:D.dayStars,streak:D.streak,star:t.star?1:0,levels,check:chk,misses,tricky,speech_pct:speechPct,plan:D.planApplied||null};
}
function dadMailHref(){
  const body=reportText()+'\n\n(For the team, please keep this line)\nCQDATA '+JSON.stringify(teamData());
  return 'mailto:'+DAD_EMAIL+'?subject='+encodeURIComponent('Camila\'s Quest · '+todayKey())+'&body='+encodeURIComponent(body);
}
function sendDadHTML(){
  const t=today();
  return '<div class="box center"><p class="prompt small">'+(t.sent?'📨 Sent to Dad today. Thank you!':'Last step: send today\'s star to Dad. +10 coins')+'</p><a class="btn good" id="sendDad" style="text-decoration:none;display:inline-block;font-size:1.3rem" href="'+dadMailHref()+'">📨 '+(t.sent?'Send again':'Send to Dad')+'</a></div>';
}
function wireSendDad(){
  const a=$('sendDad');if(!a)return;
  a.addEventListener('click',()=>{const t=today();if(!t.sent){t.sent=todayKey();coins(10);save();hud()}setTimeout(()=>{const p=a.parentNode&&a.parentNode.querySelector('.prompt');if(p)p.textContent='📨 Sent to Dad today. Thank you!'},400)});
}
// plan from the team (approved by Dad)
function planNoteHTML(){
  const p=D.plan;if(!p||!p.note)return '';
  if(p.until&&p.until<todayKey())return '';
  return '<div class="box gold"><b>💌 From Dad:</b> '+esc(p.note)+'</div>';
}
function applyPlan(p){
  if(!p||typeof p!=='object')return;
  D.plan={id:p.id||null,note:p.note||'',until:p.until||null};
  if(p.id&&p.id!==D.planApplied&&p.levels&&typeof p.levels==='object'){
    Object.keys(p.levels).forEach(k=>{const v=p.levels[k];if(typeof v!=='number'||v<0)return;
      if(k==='story'){D.reading.level=Math.max(0,Math.min(STORY_MAX,Math.floor(v)))}
      else{const max=SKILLS[k]?SKILLS[k].levels.length:k==='words'?WORDLV.length:k==='speech'?SPEECHLV.length:k==='typing'?TYPELV.length:0;if(max)placeSkill(k,Math.floor(v),max)}});
    D.planApplied=p.id;
  }else if(p.id&&!p.levels){D.planApplied=p.id}
  save();
}
async function loadPlan(){
  if(!/^https?:/.test(location.protocol))return;
  try{const r=await fetch('plan.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)return;const p=await r.json();
    const before=JSON.stringify(D.plan||null);applyPlan(p);
    if(JSON.stringify(D.plan||null)!==before&&document.getElementById('qs'))home();
  }catch(e){}
}
setTimeout(loadPlan,50);
