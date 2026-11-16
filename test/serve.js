// Tiny static server for tests: serves the repo root over http so voice clips load like on GitHub Pages.
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.mp3': 'audio/mpeg', '.css': 'text/css' };
module.exports = function serve(opts) {
  opts = opts || {}; const log = { hits: 0, missing: [] };
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]); const f = path.join(ROOT, u === '/' ? 'index.html' : u);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end() }
    if (opts.offline && u.startsWith('/voice/')) { res.writeHead(503); return res.end() }
    fs.readFile(f, (e, b) => { if (e) { if (u.startsWith('/voice/')) log.missing.push(u); res.writeHead(404); return res.end() }
      if (u.endsWith('.mp3')) log.hits++;
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Accept-Ranges': 'bytes' }); res.end(b) });
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ url: 'http://127.0.0.1:' + srv.address().port + '/', close: () => srv.close(), log })));
};
