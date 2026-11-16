// Unit checks for the recorded voice player (src/12-voice.js), in a browser with iPad-style autoplay rules.
//   node test/voice.js
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const serve = require('./serve');
const lines = JSON.parse(fs.readFileSync(path.join(__dirname, '../tools/voice/lines.json'), 'utf8'));
const have = l => fs.existsSync(path.join(__dirname, '../voice/v1', l.id + '.mp3'));
const fullA = lines.find(l => l.kind === 'full' && l.t.length > 40 && have(l));
const fullB = lines.find(l => l.kind === 'full' && l.t.length > 20 && l !== fullA && have(l));
const SPY = `window.__log=[];const P=HTMLMediaElement.prototype,_p=P.play;P.play=function(){if(!/^data:/.test(this.src))__log.push(['play',this.src.split('/').pop(),this.playbackRate]);return _p.call(this)};
  const _pause=P.pause;P.pause=function(){__log.push(['pause']);return _pause.call(this)};
  speechSynthesis.speak=function(u){__log.push(['tts',u.text]);setTimeout(()=>u.onend&&u.onend(),30)};speechSynthesis.cancel=function(){__log.push(['cancel'])};`;
const checks = []; const ok = (name, cond, info) => { checks.push([name, !!cond]); console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond ? '' : '  ' + JSON.stringify(info))) };
(async () => {
  if (!fullA || !fullB) { console.log('need recorded clips first (python3 tools/voice/make.py)'); process.exit(1) }
  const srv = await serve();
  const b = await chromium.launch({ args: ['--autoplay-policy=user-gesture-required'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(SPY);
  await p.goto(srv.url + 'index.html#debug'); await p.waitForTimeout(600);
  const idx = await p.evaluate(() => __cq.voice.idx ? __cq.voice.idx.size : 0);
  ok('clip index loads over http', idx > 0, idx);
  const say = async (t, o) => p.evaluate(([t, o]) => __cq.voice.speak(t, o), [t, o || {}]);
  const log = async () => p.evaluate(() => __log.splice(0));
  const wait = ms => p.waitForTimeout(ms);
  // 1. before any tap: the browser blocks audio; the line must not be lost silently by the player itself
  await log(); await say(fullA.t); await wait(800); let L = await log();
  const blocked = await p.evaluate(() => __cq.voice.aud.paused);
  ok('before a tap: the line is not lost (clip plays, or device voice takes over when blocked)', L.some(x => x[0] === 'play') && (!blocked || L.some(x => x[0] === 'tts')), [blocked, L]);
  // 2. after a tap: the clip plays
  await p.mouse.click(5, 5); await wait(100); await log();
  await say(fullA.t); await wait(600); L = await log();
  ok('after a tap: plays the recording', L.some(x => x[0] === 'play' && x[1] === fullA.id + '.mp3') && !L.some(x => x[0] === 'tts'), L);
  ok('recording is really playing', await p.evaluate(() => !__cq.voice.aud.paused && __cq.voice.aud.currentTime > 0));
  // 3. a new line stops the old one (no talking over itself)
  await say(fullB.t); await wait(500); L = await log();
  ok('new line interrupts the old one', L.some(x => x[0] === 'pause') && L.some(x => x[0] === 'play' && x[1] === fullB.id + '.mp3'), L);
  ok('only the new clip is playing', await p.evaluate(id => __cq.voice.aud.src.endsWith(id + '.mp3'), fullB.id));
  // 4. hush stops everything
  await p.evaluate(() => __cq.voice.hush()); await wait(200);
  ok('hush stops the voice', await p.evaluate(() => __cq.voice.aud.paused));
  // 5. queue: second line waits for the first
  await log(); await say('Cat.'); await say(fullB.t, { queue: true }); await wait(250); L = await log();
  ok('queued line waits its turn', L.filter(x => x[0] === 'play').length <= 1, L);
  await wait(9000); L = await log();
  ok('queued line plays after', L.some(x => x[0] === 'play' && x[1] === fullB.id + '.mp3'), L);
  // 6. slow words use a slower playback rate
  await say('cat', { rate: .75 }); await wait(300); L = await log();
  const pl = L.find(x => x[0] === 'play'); ok('slow word plays slower', pl && pl[2] < 0.9, L);
  // 7. a line with no recording falls back to the device voice; a mixed line keeps the recorded parts
  await say('Zorbleflax quibbleton.'); await wait(300); L = await log();
  ok('unknown line uses the device voice', L.some(x => x[0] === 'tts' && /Zorbleflax/.test(x[1])), L);
  await p.evaluate(() => __cq.voice.hush());
  const plan = await p.evaluate(() => __cq.voice.vplan('Good effort. The word is {cat}. Start at 7. {Zorbleflax} complete!'));
  ok('plan stitches pieces: numbers and slot words', plan.filter(s => s.clip).length >= 4 && plan.some(s => s.tts === 'Zorbleflax'), plan);
  ok('no slot marks reach the device voice', plan.every(s => !s.tts || !/[{}]/.test(s.tts)), plan);
  // 8. emoji and money read right
  const p2 = await p.evaluate(() => __cq.voice.vplan('Tap 🔊 to hear it. You have $5.25!'));
  ok('emoji dropped, money spelled out', !JSON.stringify(p2).includes('🔊') && /dollars and/.test(JSON.stringify(p2)), p2);
  // 9. music on: no talking unless forced
  await p.evaluate(() => { __cq.D.music = true }); await p.click('#musicBtn').catch(() => {}); await log();
  await say(fullB.t); await wait(300); L = await log();
  ok('music on: voice stays quiet', !L.some(x => x[0] === 'play' || x[0] === 'tts'), L);
  await say(fullB.t, { force: true }); await wait(300); L = await log();
  ok('music on: forced lines still speak', L.some(x => x[0] === 'play'), L);
  await p.click('#musicBtn').catch(() => {});
  // 10. a missing clip file falls back to the device voice without stalling
  await p.evaluate(() => { __cq.voice.idx.add('zzzzzzzzzzz') });
  const r = await p.evaluate(() => new Promise(res => { const a = __cq.voice.aud; const t0 = Date.now(); __cq.voice.speak('x'); res(Date.now() - t0) }));
  ok('speak never blocks the page', r < 50, r);
  // 11. device voice chosen in settings: no recordings used
  await p.evaluate(() => { __cq.D.voiceName = 'Some Device Voice' }); await log();
  await say(fullB.t); await wait(300); L = await log();
  ok('device voice setting is respected', L.some(x => x[0] === 'tts') && !L.some(x => x[0] === 'play'), L);
  await p.evaluate(() => { delete __cq.D.voiceName });
  // 12. offline: everything still speaks with the device voice
  const off = await serve({ offline: true }); const p3 = await b.newPage(); await p3.addInitScript(SPY);
  await p3.goto(off.url + 'index.html#debug'); await p3.waitForTimeout(400); await p3.mouse.click(5, 5);
  await p3.evaluate(t => __cq.voice.speak(t), fullA.t); await p3.waitForTimeout(3000);
  const L3 = await p3.evaluate(() => __log);
  ok('offline: falls back to the device voice', L3.some(x => x[0] === 'tts') && !L3.some(x => x[0] === 'play'), L3);
  off.close();
  ok('no page errors', !errs.length, errs);
  await b.close(); srv.close();
  const bad = checks.filter(c => !c[1]); console.log(bad.length ? bad.length + ' FAILED' : 'OK (' + checks.length + ' checks)'); process.exit(bad.length ? 1 : 0);
})();
