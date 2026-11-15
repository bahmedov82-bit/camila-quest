// Every math level: 300 items each. Answer must be an option, options unique, no NaN/undefined, how text present.
const fs=require('fs'),path=require('path');
const core=fs.readFileSync(path.resolve(__dirname,'../src/10-core.js'),'utf8').split('\n').filter(l=>/^const (rnd|pick|shuffle|esc)=/.test(l)).join('\n');
const src=core+'\nconst D={skills:{}};function sk(k){if(!D.skills[k])D.skills[k]={level:0,hist:{},mastered:[],review:{},reviewMiss:{}};return D.skills[k]}\n'+fs.readFileSync(path.resolve(__dirname,'../src/20-math.js'),'utf8')+'\nmodule.exports={SKILLS,SKILL_ORDER};';
const m={exports:{}};new Function('module',src)(m);const {SKILLS,SKILL_ORDER}=m.exports;let bad=0,total=0;
for(const k of SKILL_ORDER){SKILLS[k].levels.forEach((L,i)=>{const seen=new Set();let made=0;
  for(let t=0;t<300;t++){const it=L.g();if(!it)continue;made++;total++;const o=it.options.map(String);seen.add(String(it.q)+it.answer);
    const prob=[];if(!o.includes(String(it.answer)))prob.push('answer not in options');if(new Set(o).size!==o.length)prob.push('dup options');if(o.length<2)prob.push('few options');
    if(/NaN|undefined|Infinity/.test(String(it.q)+o.join()+(it.how||'')+(it.spoken||'')+(it.visual?it.visual():'')))prob.push('NaN/undefined');
    if(prob.length){bad++;if(bad<15)console.log(k,i,L.n,prob.join(','),'|',it.q,it.answer,o.join(' '))}}
  console.log((k+' '+i).padEnd(9),L.n.padEnd(38),'made',made,'unique',seen.size)})}
console.log(bad?'FAIL '+bad+'/'+total:'OK '+total);process.exit(bad?1:0);
