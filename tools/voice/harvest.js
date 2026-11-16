// Collects every line Camila's Quest can say, so tools/voice/make.py can record it with the natural voice.
//   node tools/voice/harvest.js [simRuns]   → tools/voice/lines.json
// Sources: (1) all text in the app's content (stories, words, decks, cheers, speech drills, checks, breaks),
// (2) every math level's generator run many times, (3) lines heard while the smoke-test robot plays whole days.
// Static sentences are recorded whole. Sentences with numbers in them are recorded as pieces (text runs + numbers),
// which the app stitches together; numbers 0-1000 are always recorded.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../..');
const simRuns = +(process.argv[2] || 6);
const LOG = `window.__said=[];const _sp=speechSynthesis.speak.bind(speechSynthesis);
  speechSynthesis.speak=function(u){window.__said.push(u.cqRaw||u.text);setTimeout(()=>{try{u.onend&&u.onend()}catch(e){}},5)};`;
(async () => {
  const browser = await chromium.launch();
  const full = new Set(), sim = new Set();
  // ---- 1 + 2: static content and math generators ----
  {
    const page = await browser.newPage();
    await page.goto('file://' + ROOT + '/index.html#debug');
    await page.waitForTimeout(400);
    const got = await page.evaluate(() => {
      const out = new Set(); const math = new Set();
      const walk = (x, depth) => { if (depth > 8 || x == null) return; if (typeof x === 'string') { if (/[a-z]/i.test(x) && !/[<>{}]|=>|function/.test(x) && x.length < 1500) out.add(x); return }
        if (Array.isArray(x)) return x.forEach(v => walk(v, depth + 1)); if (typeof x === 'object') Object.values(x).forEach(v => walk(v, depth + 1)) };
      const G = Object.assign({}, __cq.data); const SKILLS = G.SKILLS; delete G.SKILLS;
      Object.values(G).forEach(v => walk(v, 0));
      Object.values(SKILLS).forEach(sk => { walk(sk.name, 0); sk.levels.forEach(l => { walk(l.n, 0); for (let i = 0; i < 400; i++) { let it = null; try { it = l.g() } catch (e) {} if (!it) continue;
        [it.spoken, it.how, it.q].forEach(t => { if (typeof t === 'string') math.add(t.replace(/<[^>]+>/g, ' ')) });
        if (it.teach) Object.values(it.teach).forEach(t => { if (typeof t === 'string' && /[a-z]/i.test(t)) math.add(t) });
        if (Array.isArray(it.steps)) it.steps.forEach(t => { if (typeof t === 'string') math.add(t.replace(/<[^>]+>/g, ' ')) }) } }) });
      return { stat: [...out], math: [...math] };
    });
    got.stat.forEach(t => full.add(t)); got.math.forEach(t => sim.add(t));
    await page.close();
  }
  // ---- 3: lines spoken while a robot plays whole days (mic and no-mic), on several levels ----
  const smoke = fs.readFileSync(path.join(ROOT, 'test/smoke.js'), 'utf8');
  for (let r = 0; r < simRuns; r++) {
    const mode = r % 2 ? 'nomic' : 'mic';
    const page = await browser.newPage({ viewport: { width: 820, height: 1100 } });
    await page.addInitScript(LOG);
    await page.addInitScript(mode === 'mic' ? `class FakeSR{start(){const s=this;setTimeout(()=>{const t=document.querySelector('#sent, #theword, .prompt.word, .prompt');let x=t?t.textContent:'hello';if(Math.random()<0.3)x='blah';s.onresult&&s.onresult({results:[[{transcript:x}]]});s.onend&&s.onend()},40)}stop(){}abort(){}};window.SpeechRecognition=FakeSR;window.webkitSpeechRecognition=FakeSR;` : `delete window.SpeechRecognition;Object.defineProperty(window,'webkitSpeechRecognition',{value:undefined,configurable:true});`);
    await page.goto('file://' + ROOT + '/index.html#debug');
    await page.waitForTimeout(300);
    // spread levels so later content is reached too
    await page.evaluate(r => { const D = __cq.D; D.welcomed = true; const bump = Math.floor(r / 2);
      ['numbers', 'add', 'sub', 'mul', 'money', 'frac'].forEach(k => { const s = D.skills[k] = D.skills[k] || { level: 0, hist: {}, mastered: [], review: {}, reviewMiss: {} }; s.level = Math.min(bump * 2, 7); s.mastered = Array.from({ length: s.level }, (_, i) => i) });
      D.reading.level = Math.min(bump, 4); D.speech.level = Math.min(bump, 4); D.typing.level = Math.min(bump, 4); __cq.save(); __cq.home() }, r);
    await runDay(page);
    const said = await page.evaluate(() => window.__said);
    said.forEach(t => sim.add(t));
    await page.close();
  }
  await browser.close();
  // ---- split into what to record ----
  const ctx = {}; new Function('ctx', fs.readFileSync(path.join(ROOT, 'src/12-voice.js'), 'utf8').split('let VIDX=null')[0].replace(/^let VOICE=null;/m, '').replace(/try\{pickVoice\(\);[^\n]*\n/, '') + ';ctx.vkey=vkey;ctx.vsentences=vsentences;ctx.vpieces=vpieces;ctx.vhash=vhash;ctx.vclean=vclean;ctx.unslot=unslot;')(ctx);
  const rec = new Map(); // key -> text
  const add = (t, kind) => { const k = ctx.vkey(t); if (!k || k.length > 400) return; if (!rec.has(k)) rec.set(k, { t: t.trim(), kind }) };
  // every whole-literal speak('...') in the source (Settings → Hear it, rare screens the robot may not reach)
  for (const f of fs.readdirSync(path.join(ROOT, 'src'))) { const src = fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');
    for (const m of src.matchAll(/speak\('((?:[^'\\]|\\.)*)'\s*[,)]/g)) full.add(m[1].replace(/\\'/g, "'")) }
  for (const t of full) for (const s of ctx.vsentences(t)) { add(s, 'full'); if (/\d/.test(s) && s.length < 60) ctx.vpieces(s).forEach(p => add(p, 'piece')) }
  // single words: she can tap any word in a story or passage to hear it
  for (const t of full) if (t.length > 60) for (const w of t.split(/[^A-Za-z'\u2019]+/)) { const x = w.replace(/^'+|'+$/g, ''); if (x.length > 1 || /^[aI]$/.test(x)) add(x.toLowerCase(), 'word') }
  for (const t of sim) for (const s of ctx.vsentences(t)) { if (/[\d{]/.test(s)) ctx.vpieces(s).forEach(p => add(p, 'piece')); else add(s, 'full') }
  // text pieces of templated lines in the math and times code (hints the robot rarely reaches, like "anything times 1 is itself")
  for (const f of ['20-math.js', '30-math-run.js', '74-times.js']) { const src = fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');
    for (const m of src.matchAll(/'((?:[^'\\\n]|\\.){2,200})'/g)) { const lit = m[1].replace(/\\'/g, "'"); if (!/[a-z]{2}/i.test(lit) || /[<>{}=]|class|style|px|var\(/.test(lit)) continue;
      for (const s of ctx.vsentences(lit)) ctx.vpieces(s).forEach(p => add(p, 'piece')) } }
  for (let n = 0; n <= 1000; n++) add(String(n), 'num');
  const lines = [...rec.entries()].map(([k, v]) => ({ id: ctx.vhash(k), t: v.t, kind: v.kind }));
  // keep lines found by earlier runs (the robot takes random paths, so each run finds a few different ones)
  const prevF = path.join(__dirname, 'lines.json');
  if (!process.argv.includes('--fresh') && fs.existsSync(prevF)) { const have = new Set(lines.map(l => l.id)); let kept = 0; for (const l of JSON.parse(fs.readFileSync(prevF, 'utf8'))) if (!have.has(l.id)) { lines.push(l); have.add(l.id); kept++ } console.log('kept', kept, 'lines from earlier harvests') }
  fs.writeFileSync(path.join(__dirname, 'lines.json'), JSON.stringify(lines, null, 0));
  const by = lines.reduce((a, l) => (a[l.kind] = (a[l.kind] || 0) + 1, a), {});
  console.log('lines', lines.length, JSON.stringify(by), 'chars', lines.reduce((a, l) => a + l.t.length, 0));
})();

async function runDay(page) {
  const click = async (sel) => { const el = await page.$(sel); if (!el) return false; try { await el.click({ timeout: 1500, force: true }); return true } catch (e) { return false } };
  let last = '', stalls = 0;
  for (let steps = 0; steps < 2500; steps++) {
    const html = await page.$eval('#screen', s => s.innerHTML);
    if (html === last) { if (++stalls > 8) break } else stalls = 0; last = html;
    if (await click('#nextBtn')) continue;
    if (await click('#go:not([hidden])')) continue;
    if (await click('#next:not([hidden])')) continue;
    if (await page.$('#kp .opt:not([disabled])')) { const a = await page.evaluate(() => window.__cq.answer); const v = Math.random() < 0.8 ? String(a) : String(+a + 1); for (const ch of v) await page.click('#kp .opt[data-k="' + ch + '"]').catch(() => {}); await page.click('#kp .opt[data-k="✓"]').catch(() => {}); continue }
    const inp = await page.$('#typed'); if (inp) { const tgt = await page.evaluate(() => { const t = document.getElementById('tgt'); const i = document.getElementById('typed'); return t ? t.textContent : (i.placeholder !== 'type here' ? i.placeholder : 'cat') }); await inp.fill(Math.random() < 0.6 ? tgt : 'xyz'); await click('#ok'); continue }
    const cells = await page.$$('#tf .cell, #ta .cell, #ones .cell, #f2 .cell, #tc .opt, #parts .opt, #ev .opt');
    if (cells.length) { for (const c of cells) { try { await c.click({ timeout: 800, force: true }) } catch (e) {} } await page.waitForTimeout(40); await click('#back:not([hidden])'); continue }
    if (await click('#say:not([disabled])')) { await page.waitForTimeout(150); continue }
    if (await click('#mic')) { await page.waitForTimeout(150); continue }
    if (await click('#rec')) { await page.waitForTimeout(300); continue }
    if (await click('#stop:not([hidden])')) { await page.waitForTimeout(300); continue }
    if (await click('#start')) continue;
    if (await click('#stop')) continue;
    const opts = await page.$$('#screen .opt'); if (opts.length) { try { await opts[Math.floor(Math.random() * opts.length)].click({ timeout: 800 }) } catch (e) {} continue }
    if (await click('#skip')) continue;
    if (await click('.quest.now')) continue;
    if (await click('#brk')) continue;
    if (await click('#home')) continue;
    const star = await page.evaluate(() => { try { return Object.values(__cq.D.days).some(d => d.star) } catch (e) { return false } });
    if (star) break;
    await page.waitForTimeout(80);
  }
}
