// Local mock API (no database) for the homepage/footer/contact e2e. Reuses the seeded 9-pair catalogue.
// Control: /__reset, /__log (requests seen), /__mode {failContact}.
const http = require('http'); const fs = require('fs'); const path = require('path');
const catalogue = JSON.parse(fs.readFileSync(path.join(__dirname, '../op-team-date-range/catalogue.json'), 'utf8'));
const log = []; const state = { failContact: false };
const send = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }); res.end(JSON.stringify(body)); };
http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  let raw = ''; req.on('data', (c) => (raw += c)); req.on('end', () => {
    const body = raw ? JSON.parse(raw) : undefined; const u = req.url.split('?')[0];
    if (u === '/__log') return send(res, 200, log);
    if (u === '/__reset') { log.length = 0; state.failContact = false; return send(res, 200, {}); }
    if (u === '/__mode') { Object.assign(state, body || {}); return send(res, 200, state); }
    log.push({ m: req.method, u, body });
    if (req.method === 'GET' && u === '/migration-pairs/available') return send(res, 200, catalogue);
    if (req.method === 'GET' && u === '/banner/get-banners') return send(res, 200, { data: [], total: 0 });
    if (req.method === 'GET' && u.startsWith('/faqs/')) return send(res, 200, []);
    if (req.method === 'POST' && u === '/contact') {
      if (state.failContact) return send(res, 500, { message: 'Internal server error' });
      return setTimeout(() => send(res, 201, { success: true, id: 1, message: 'ok' }), 250);
    }
    send(res, 404, { message: 'not mocked ' + u });
  });
}).listen(Number(process.env.MOCK_PORT || 19005), '127.0.0.1');
