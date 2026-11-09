// Headless smoke test. Mode 'mic': a fake SpeechRecognition that hears the on-screen text ~70% of the time.
// Mode 'nomic': no SpeechRecognition at all (listen-and-tap paths). Fails on any JS error or stalled screen.
const { chromium } = require('playwright');
const path = require('path');
const mode = process.argv[2] || 'mic';
const FAKE_SR = `
  class FakeSR { constructor(){this.lang='';} start(){ const self=this; setTimeout(()=>{ const t=document.querySelector('#sent, #theword, .prompt.word, .prompt'); let txt=t?t.textContent:'hello'; if(/Tell me|If you had/.test(txt)) txt='I would sell cookies and lemonade because people like them and they are easy to make'; if(Math.random()<0.3) txt='blah blah'; if(self.onresult) self.onresult({results:[[{transcript:txt},{transcript:txt}]]}); if(self.onend) self.onend(); }, 60); } stop(){} abort(){} }
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;`;
const NO_SR = `delete window.SpeechRecognition; Object.defineProperty(window,'webkitSpeechRecognition',{value:undefined,configurable:true});`;
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 820, height: 1100 } });
  await page.addInitScript(mode === 'mic' ? FAKE_SR : NO_SR);
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../index.html') + '#debug');
  await page.waitForTimeout(300);
  const seen = new Set(); const trail = []; let stalls = 0, steps = 0; let lastHtml = '';
  const click = async (sel) => { const el = await page.$(sel); if (!el) return false; try { await el.click({ timeout: 2500 }); return true; } catch (e) { errors.push('clickfail ' + sel + ': ' + e.message.split('\n')[0]); return false; } };
  const typeAnswer = async () => { const inp = await page.$('#typed'); if (!inp) return false; const tgt = await page.evaluate(() => { const t = document.getElementById('tgt'); const i = document.getElementById('typed'); return t ? t.textContent : (i.placeholder !== 'type here' ? i.placeholder : 'cat'); }); await inp.fill(Math.random() < 0.7 ? tgt : 'xyz'); await click('#ok'); return true; };
  for (steps = 0; steps < 2500; steps++) {
    const head = await page.$eval('#screen', s => (s.querySelector('h1,h2,.muted')||{}).textContent || '');
    trail.push(head.slice(0,50)); seen.add(head.replace(/\d+/g, '#').trim().slice(0, 70));
    const html = await page.$eval('#screen', s => s.innerHTML);
    if (html === lastHtml) { stalls++; if (stalls > 8) { errors.push('STALL at: ' + head + ' :: ' + html.replace(/<[^>]+>/g,' ').slice(0, 300)); break; } } else stalls = 0;
    lastHtml = html;
    if (await click('#nextBtn')) continue;
    if (await click('#go:not([hidden])')) continue;
    if (await click('#next:not([hidden])')) continue;
    if (await typeAnswer()) continue;
    const cells = await page.$$('#tf .cell, #ta .cell, #ones .cell, #f2 .cell, #tc .opt, #parts .opt, #ev .opt');
    if (cells.length) { for (const c of cells) { try { await c.click({ timeout: 1500 }); } catch (e) { errors.push('cellfail: '+e.message.split('\n')[0]); } } await page.waitForTimeout(60); if (await page.$('#back:not([hidden])')) await click('#back:not([hidden])'); continue; }
    if (await click('#say:not([disabled])')) { await page.waitForTimeout(250); continue; }
    if (await click('#mic')) { await page.waitForTimeout(250); continue; }
    if (await click('#rec')) { await page.waitForTimeout(1200); continue; }
    if (await click('#stop:not([hidden])')) { await page.waitForTimeout(800); continue; }
    if (await click('#start')) continue;
    if (await click('#stop')) continue;
    const opts = await page.$$('#screen .opt');
    if (opts.length) { const o = opts[Math.floor(Math.random() * opts.length)]; try { await o.click({ timeout: 1500 }); } catch (e) {} continue; }
    if (await click('#skip')) continue;
    if (await click('.quest.now')) continue;
    if (await click('#brk')) continue;
    if (await click('#home')) continue;
    const star = await page.evaluate(() => { try { const s = JSON.parse(localStorage.getItem('cq-v1')); return Object.values(s.days)[0].star } catch (e) { return false } });
    if (star) break;
    await page.waitForTimeout(100);
  }
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('cq-v1')));
  const day = Object.values(state.days)[0] || {};
  console.log('mode', mode, 'steps', steps, 'done', (day.done||[]).join(','), 'star', day.star, 'items', day.items, 'correct', day.correct);
  console.log('skills', JSON.stringify(Object.fromEntries(Object.entries(state.skills).map(([k,v])=>[k,v.level]))), 'reading lvl', state.reading.level, 'tricky', Object.keys(state.reading.tricky).join(','));
  console.log('trail:', trail.filter((h,i)=>h!==trail[i-1]).join(' > ')); console.log('screens seen:', [...seen].length); console.log([...seen].join('\n'));
  if (errors.length) { console.log('ERRORS\n' + errors.join('\n')); process.exit(1); }
  console.log('OK');
  await browser.close();
})();
