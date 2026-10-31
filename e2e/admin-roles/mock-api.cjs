// Local mock of the API the admin panel and home page call (no database). Logins: admin@, dev@, op@, cust@ (any password).
const http = require('http');
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const tok = (p) => `${b64({ alg: 'none' })}.${b64(p)}.sig`;
const DEV_PERMS = ['migration.read', 'migration-pair.read', 'migration-review.read', 'faq.read', 'system.read'];
const WHO = {
  'admin@x.com': { token: tok({ sub: 1, type: 'admin' }), me: { id: 1, firstname: 'Real', lastname: 'Admin', email: 'admin@x.com', roles: ['admin'] }, type: 'admin' },
  'dev@x.com': { token: tok({ sub: 5, type: 'user', roles: ['DEVELOPER'], permissions: DEV_PERMS }), me: { id: 5, firstname: 'Dev', lastname: 'Dan', email: 'dev@x.com', roles: ['DEVELOPER'] }, type: 'user' },
  'cust@x.com': { token: tok({ sub: 9, type: 'user', roles: [], permissions: [] }), me: { id: 9, firstname: 'Cu', lastname: 'St', email: 'cust@x.com', roles: [] }, type: 'user' },
};
const pair = { id: 'p1', source: 'xero', destination: 'qbo', displayName: 'Xero → QBO' };
const mig = (id, runner, name) => ({ id, status: 'COMPLETED', progress: 100, currentCategory: null, errorMessage: null, startedAt: null, completedAt: null, createdAt: '2026-10-30T10:00:00Z', isQaPassed: null, migrationPair: pair, user: null, customer: { name: name, email: `${id}@c.com` }, runner, orderSource: 'MIGRATION_HUB', paymentWaived: false, plan: { name: 'Basic' }, karbonWorkItem: null });
const MIGS = [
  mig('11111111', { type: 'OP_TEAM', id: 3, name: 'Olive Ops', email: 'o@x.com', role: 'OP_TEAM', removed: false }, 'C One'),
  mig('22222222', { type: 'DEVELOPER', id: 5, name: 'Dev Dan', email: 'dev@x.com', role: 'DEVELOPER', removed: false }, 'C Two'),
  mig('33333333', { type: 'CUSTOMER', id: null, name: 'Customer', email: null, role: null, removed: false }, 'C Three'),
];
const send = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }); res.end(JSON.stringify(body)); };
let current = null;
http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  let raw = ''; req.on('data', (c) => (raw += c)); req.on('end', () => {
    const body = raw ? JSON.parse(raw) : {}; const u = req.url.split('?')[0];
    if (req.method === 'POST' && u === '/auth/login') { const w = WHO[body.identifier]; if (!w) return send(res, 401, { message: 'Invalid credentials' }); current = w; return send(res, 200, { accessToken: w.token, type: w.type }); }
    if (req.method === 'POST' && u === '/auth/logout') return send(res, 200, {});
    if (u === '/users/me') return send(res, 200, (WHO[Object.keys(WHO).find((k) => WHO[k].token === String(req.headers.authorization || '').slice(7))] || current).me);
    if (u === '/admin/migrations') return send(res, 200, { data: MIGS, total: 3, skip: 0, take: 20 });
    if (u === '/users') return send(res, 200, { data: [], total: 0 });
    if (u === '/roles') return send(res, 200, []);
    if (u === '/admin/analytics/summary') return send(res, 200, { totalMigrations: 3, totalDelta: {}, successRate: 100, successRateDelta: {}, activeNow: 0, activeNowDelta: {}, avgDurationMinutes: 1, avgDurationDelta: {} });
    if (u === '/admin/analytics/pairs') return send(res, 200, { pairs: [] });
    if (u === '/admin/analytics/activity') return send(res, 200, { items: [] });
    if (u === '/admin/analytics/outcomes') return send(res, 200, {});
    if (u === '/migration-pairs/available') return send(res, 200, []);
    send(res, 200, []);
  });
}).listen(Number(process.env.MOCK_PORT || 19002), '127.0.0.1');
