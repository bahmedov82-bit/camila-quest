// Plays whole days the way Camila would, over http (like GitHub Pages), with the recorded voice on.
//   node test/day.js [days=2] [mode=mic|nomic|mixed] [--offline] [--ipad] [--slow]
// Fails on: any JS error, a stuck screen, a day that does not finish with a star, a broken voice clip,
// the voice talking over itself, or a quest line read by the device voice when a recording should exist.
const { chromium, devices } = require('playwright');
const serve = require('./serve');
const args = process.argv.slice(2); const flag = f => args.includes(f); const pos = args.filter(a => !a.startsWith('--'));
const DAYS = +(pos[0] || 2), MODE = pos[1] || 'mixed';
const FAKE_SR = `class FakeSR{constructor(){this.lang=''}start(){const s=this;setTimeout(()=>{const t=document.querySelector('#sent, #theword, .prompt.word, .prompt');let x=t?t.textContent:'hello';if(/Tell me|If you had/.test(x))x='I would sell cookies and lemonade because people like them and they are easy to make';if(Math.random()<0.3)x='blah blah';s.onresult&&s.onresult({results:[[{transcript:x},{transcript:x}]]});s.onend&&s.onend()},60)}stop(){}abort(){}};window.SpeechRecognition=FakeSR;window.webkitSpeechRecognition=FakeSR;`;
const NO_SR = `delete window.SpeechRecognition;Object.defineProperty(window,'webkitSpeechRecognition',{value:undefined,configurable:true});`;
// watch the shared audio player: overlap (two clips at once), clip errors, and device-voice use while a clip plays
const SPY = (fast) => `window.__v={plays:0,ended:0,errors:[],overlap:0,ttsDuring:0,tts:[],playing:new Set()};
  const P=HTMLMediaElement.prototype,_play=P.play;
  P.play=function(){if(!/^data:/.test(this.src)){__v.plays++;${fast ? 'this.playbackRate=6;' : ''}for(const a of __v.playing)if(a!==this&&!a.paused)__v.overlap++;__v.playing.add(this);
    this.addEventListener('ended',()=>{__v.ended++;__v.playing.delete(this)},{once:true});this.addEventListener('error',()=>{__v.errors.push(this.src)},{once:true})}return _play.call(this)};
  const _sp=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=function(u){__v.tts.push(u.text);for(const a of __v.playing)if(!a.paused&&!a.ended){__v.ttsDuring++;(__v.tdi=__v.tdi||[]).push(u.text+' OVER '+a.src.split('/').pop()+' t='+a.currentTime.toFixed(2))}setTimeout(()=>{try{u.onend&&u.onend()}catch(e){}},${fast ? 20 : 400})};`;
(async () => {
  const srv = await serve({ offline: flag('--offline') });
  const browser = await chromium.launch({ args: ['--autoplay-policy=user-gesture-required'] });
  const ctx = await browser.newContext(flag('--ipad') ? devices['iPad (gen 7)'] : { viewport: { width: 820, height: 1100 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()) });
  let mode = MODE === 'mixed' ? 'mic' : MODE;
  await page.addInitScript(SPY(!flag('--slow')));
  await page.addInitScript(`if(!sessionStorage.nomic){${FAKE_SR}}else{${NO_SR}}`);
  const results = [];
  for (let d = 0; d < DAYS; d++) {
    mode = MODE === 'mixed' ? (d % 2 ? 'nomic' : 'mic') : MODE;
    await page.clock.setFixedTime(new Date(2026, 10, 16 + d, 15, 30));
    await page.goto(srv.url + 'index.html#debug');
    await page.evaluate(m => { if (m === 'nomic') sessionStorage.nomic = 1; else delete sessionStorage.nomic }, mode);
    await page.reload();
    await page.waitForTimeout(400);
    const lv = +((args.find(a => a.startsWith('--level=')) || '=0').split('=')[1]);
    if (lv && d === 0) { await page.evaluate(lv => { const D = __cq.D; D.welcomed = true; ['numbers', 'add', 'sub', 'mul', 'money', 'frac'].forEach(k => { const s = D.skills[k] = D.skills[k] || { level: 0, hist: {}, mastered: [], review: {}, reviewMiss: {} }; s.level = Math.min(lv * 2, __cq.data.SKILLS[k].levels.length - 1); s.mastered = Array.from({ length: s.level }, (_, i) => i) }); D.reading.level = Math.min(lv, 4); D.speech.level = Math.min(lv, 4); D.typing.level = Math.min(lv, 4); __cq.save() }, lv); await page.reload(); await page.waitForTimeout(400) }
    const r = await playDay(page, errors);
    const st = await page.evaluate(() => { const D = __cq.D; const k = Object.keys(D.days).sort().pop(); const day = D.days[k]; const V = __cq.voice.VSTAT;
      return { key: k, done: day.done.join(','), star: day.star, items: day.items, correct: day.correct, streak: D.streak, dayStars: D.dayStars,
        clipChars: V.clipChars, ttsChars: V.ttsChars, ttsLines: V.ttsLines.slice(), idx: __cq.voice.idx ? __cq.voice.idx.size : 0, v: window.__v && { plays: __v.plays, ended: __v.ended, errors: __v.errors, overlap: __v.overlap, ttsDuring: __v.ttsDuring, tdi: (__v.tdi||[]).slice(0,6) } } });
    results.push(Object.assign({ mode, steps: r.steps }, st));
    const cov = st.clipChars + st.ttsChars ? Math.round(1000 * st.clipChars / (st.clipChars + st.ttsChars)) / 10 : 0;
    console.log(`day ${d + 1} ${st.key} ${mode} steps ${r.steps} done [${st.done}] star ${st.star} streak ${st.streak} items ${st.items} correct ${st.correct}`);
    console.log(`   voice: ${cov}% of spoken text from recordings (index ${st.idx}); clips played ${st.v.plays}, ended ${st.v.ended}, errors ${st.v.errors.length}, overlaps ${st.v.overlap}, device voice over a clip ${st.v.ttsDuring}`);
    const uniq = [...new Set(st.ttsLines)];
    if (uniq.length) console.log('   device voice read:', uniq.slice(0, 15).map(x => JSON.stringify(x.slice(0, 80))).join(' | '));
    if (!st.star) errors.push('day ' + (d + 1) + ' finished without a star: ' + st.done);
    if (st.v.errors.length) errors.push('broken clips: ' + st.v.errors.slice(0, 5).join(', '));
    if (st.v.overlap) errors.push('voice overlapped itself ' + st.v.overlap + ' times');
    if (st.v.ttsDuring) console.log('   talked over:', JSON.stringify(st.v.tdi));
    if (st.v.ttsDuring) errors.push('device voice talked over a clip ' + st.v.ttsDuring + ' times');
    if (!flag('--offline') && st.idx && cov < +(process.env.MIN_COVER || 97)) errors.push('voice coverage ' + cov + '% below target');
    if (flag('--offline') && st.v.plays) errors.push('offline but clips played');
  }
  if (results.length > 1 && results[results.length - 1].streak < results.length) errors.push('streak did not grow: ' + results.map(r => r.streak).join(','));
  console.log('server: clip requests', srv.log.hits, 'missing', srv.log.missing.length, srv.log.missing.slice(0, 5).join(' '));
  if (!flag('--offline') && srv.log.missing.length) errors.push('missing clip files: ' + srv.log.missing.length);
  await browser.close(); srv.close();
  if (errors.length) { console.log('ERRORS\n' + [...new Set(errors)].join('\n')); process.exit(1) }
  console.log('OK');
})();

async function playDay(page, errors) {
  const vis = async (sel) => { const el = await page.$(sel + ':visible'); return el };
  const trail = []; const click = async (sel) => { const el = await vis(sel); if (!el) return false; try { await el.click({ timeout: 2500 }); trail.push(sel); if (trail.length > 12) trail.shift(); return true } catch (e) { if (!/not attached|detached/.test(e.message)) errors.push('clickfail ' + sel + ': ' + e.message.split('\n')[0]); return false } };
  let last = '', stalls = 0, steps = 0;
  for (steps = 0; steps < 3000; steps++) {
    const head = await page.$eval('#screen', s => (s.querySelector('h1,h2,.muted') || {}).textContent || '');
    const html = await page.$eval('#screen', s => s.innerHTML);
    if (html === last) { if (++stalls > 12) { errors.push('STALL at: ' + head + ' :: ' + html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300)); break } await page.waitForTimeout(150) } else stalls = 0;
    last = html;
    if (await page.evaluate(() => { try { const D = __cq.D; const t = D.days[Object.keys(D.days).sort().pop()]; return t.star } catch (e) { return false } })) break;
    if (await click('#nextBtn')) continue;
    if (await click('#go')) continue;
    if (await click('#next')) continue;
    if (await page.$('#kp .opt:not([disabled])')) { const a = await page.evaluate(() => window.__cq.answer); const v = Math.random() < 0.8 ? String(a) : String(+a + 1); for (const ch of v) await page.click('#kp .opt[data-k="' + ch + '"]').catch(() => {}); await page.click('#kp .opt[data-k="✓"]').catch(() => {}); continue }
    const inp = await vis('#typed'); if (inp) { const tgt = await page.evaluate(() => { const t = document.getElementById('tgt'); const i = document.getElementById('typed'); return t ? t.textContent : (i.placeholder !== 'type here' ? i.placeholder : 'cat') }); await inp.fill(Math.random() < 0.7 ? tgt : 'xyz'); await click('#ok'); continue }
    const cells = await page.$$('#tf .cell:visible, #ta .cell:visible, #ones .cell:visible, #f2 .cell:visible, #tc .opt:visible, #parts .opt:visible, #ev .opt:visible');
    if (cells.length) { for (const c of cells) { try { await c.click({ timeout: 1500, force: true }) } catch (e) {} } await page.waitForTimeout(60); await click('#back'); continue }
    if (await click('#say:not([disabled])')) { await page.waitForTimeout(250); continue }
    if (await click('#mic')) { await page.waitForTimeout(250); continue }
    if (await click('#rec')) { await page.waitForTimeout(1200); continue }
    if (await click('#start')) { await page.waitForTimeout(500); continue }
    if (await click('#stop')) { await page.waitForTimeout(500); continue }
    const opts = await page.$$('#screen .opt:visible'); if (opts.length) { const ans = await page.evaluate(() => window.__cq && __cq.answer); let o = null; if (ans && Math.random() < 0.6) o = await page.$(`#screen .opt[data-v="${ans}"]:visible`); try { await (o || opts[Math.floor(Math.random() * opts.length)]).click({ timeout: 1500 }) } catch (e) {} continue }
    if (await click('#skip')) continue;
    if (await click('.quest.now')) continue;
    if (await click('#brk')) continue;
    if (await click('#home')) continue;
    const star = await page.evaluate(() => { try { const D = __cq.D; return D.days[Object.keys(D.days).sort().pop()].star } catch (e) { return false } });
    if (star) break;
    await page.waitForTimeout(100);
  }
  if (steps >= 3000) { const scr = await page.$eval('#screen', s => s.innerText.replace(/\s+/g, ' ').slice(0, 200)); console.log('   ran out of steps; last taps:', trail.join(' '), '| screen:', scr) }
  return { steps };
}
