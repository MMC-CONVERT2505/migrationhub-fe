// Local mock of the public API the frontend calls (no database). catalogue.json = the 9 seeded pairs with country price rows,
// generated from prisma/seeds in mmc-convert-orch via withDerivedPlanPrices. Modes: /__mode {failCreate,down,noFree}.
const http = require('http'); const fs = require('fs');
const catalogue = JSON.parse(fs.readFileSync(process.argv[2] || __dirname + '/catalogue.json', 'utf8'));
const log = []; let inquiryId = 100; const state = { failCreate: false, down: false, noFree: false };
const send = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }); res.end(JSON.stringify(body)); };
http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  let raw = ''; req.on('data', (c) => (raw += c)); req.on('end', () => {
    const body = raw ? JSON.parse(raw) : undefined; const u = req.url.split('?')[0];
    if (u === '/__log') return send(res, 200, log);
    if (u === '/__reset') { log.length = 0; state.failCreate = false; state.down = false; state.noFree = false; return send(res, 200, {}); }
    if (u === '/__mode') { Object.assign(state, JSON.parse(raw || '{}')); return send(res, 200, state); }
    // Sign-in for the browser checks: an identifier starting "op@" is an Operation Team member, anything else a customer.
    const tokenFor = (roles) => ['{"alg":"none"}', JSON.stringify({ sub: 7, type: 'user', roles }), 'sig'].map((x, i) => (i === 2 ? x : Buffer.from(x).toString('base64url'))).join('.');
    if (req.method === 'POST' && u === '/auth/login') return send(res, 200, { accessToken: tokenFor(/^op@/.test((body && body.identifier) || '') ? ['OP_TEAM'] : []) });
    if (req.method === 'GET' && u === '/users/me') {
      let roles = []; try { roles = JSON.parse(Buffer.from(String(req.headers.authorization || '').split('.')[1] || '', 'base64').toString()).roles || []; } catch { /* anonymous */ }
      return send(res, 200, { data: { id: 7, email: roles.length ? 'op@x.com' : 'cust@x.com', firstname: 'Who', lastname: 'Ever', roles } });
    }
    log.push({ m: req.method, u, body });
    if (state.down && u.startsWith('/migration-pairs')) return send(res, 503, { message: 'down' });
    if (req.method === 'GET' && u === '/migration-pairs/available') return send(res, 200, state.noFree ? catalogue.map((p) => (p.destination === 'myob' ? { ...p, isFree: false, planPrices: p.planPrices.map((r) => ({ ...r, basePrice: '389' })) } : p)) : catalogue);
    if (req.method === 'GET' && u.startsWith('/faqs/')) return send(res, 200, []);
    if (req.method === 'POST' && u === '/inquiry-migrations') return send(res, 201, { id: ++inquiryId, editToken: 'tok-' + inquiryId });
    if (req.method === 'PATCH' && u.startsWith('/inquiry-migrations/')) return send(res, 200, {});
    if (req.method === 'POST' && u === '/migrations' && body && (body.migrationStartDate !== undefined || body.migrationEndDate !== undefined)) {
      // The server's rules for a custom range: Operation Team only, and never together with years.
      const roles = (() => { try { return JSON.parse(Buffer.from(String(req.headers.authorization || '').split('.')[1] || '', 'base64').toString()).roles || []; } catch { return []; } })();
      if (!roles.includes('OP_TEAM')) return send(res, 403, { message: 'Only the Operation Team can choose a custom date range' });
      if (body.years !== undefined) return send(res, 400, { message: 'Choose either a number of years or a date range, not both' });
    }
    if (req.method === 'POST' && u === '/migrations') return state.failCreate ? send(res, 400, { message: 'This plan is not available in the customer’s country' }) : send(res, 201, { id: '12345678', migrationPair: { serviceUrl: null } });
    if (req.method === 'GET' && u === '/migrations') return send(res, 200, { data: [], total: 0, skip: 0, take: 0 });
    send(res, 404, { message: 'not mocked ' + u });
  });
}).listen(Number(process.env.MOCK_PORT || 19001), '127.0.0.1', () => console.log('mock api on 19001'));
