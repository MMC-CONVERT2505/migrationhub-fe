// Local mock of the API the admin panel and home page call (no database). Logins: admin@, dev@, op@, cust@ (any password).
const http = require('http');
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const tok = (p) => `${b64({ alg: 'none' })}.${b64(p)}.sig`;
const DEV_PERMS = ['migration.read', 'migration-pair.read', 'migration-review.read', 'faq.read', 'system.read'];
const WHO = {
  'admin@x.com': { token: tok({ sub: 1, type: 'admin' }), me: { id: 1, firstname: 'Real', lastname: 'Admin', email: 'admin@x.com', roles: ['admin'] }, type: 'admin' },
  'dev@x.com': { token: tok({ sub: 5, type: 'user', roles: ['DEVELOPER'], permissions: DEV_PERMS }), me: { id: 5, firstname: 'Dev', lastname: 'Dan', email: 'dev@x.com', roles: ['DEVELOPER'] }, type: 'user' },
  'reader@x.com': { token: tok({ sub: 6, type: 'user', roles: ['DEVELOPER'], permissions: [...DEV_PERMS, 'migration-cleaner.read'] }), me: { id: 6, firstname: 'Rea', lastname: 'Der', email: 'reader@x.com', roles: ['DEVELOPER'] }, type: 'user' },
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
// Migration Cleaner: a small in-memory set. Rules mirror the server's, so the page's behaviour is realistic.
const ACTIONS = ['PURGE', 'SOFT_DELETE', 'HARD_DELETE', 'RESTORE'];
const cm = (id, status, over = {}) => {
  const can = { PURGE: true, SOFT_DELETE: true, HARD_DELETE: true, RESTORE: false, ...(over.can || {}) };
  const why = { PURGE: ['Refused.'], SOFT_DELETE: ['Refused.'], HARD_DELETE: ['Refused.'], RESTORE: ['It is not deleted.'], ...(over.why || {}) };
  const { can: _c, why: _w, ...rest } = over;
  return { id, status, createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-02T10:00:00Z', orderSource: 'MIGRATION_HUB', dataPurgedAt: null, deletedAt: null, pair: 'Xero → QBO', customer: 'Cust ' + id, email: id + '@c.com', entity: 'E', runner: { type: 'CUSTOMER', role: null, name: 'Cust ' + id, email: id + '@c.com' }, can, blockedBy: Object.fromEntries(ACTIONS.map((a) => [a, can[a] ? [] : why[a]])), ...rest };
};
let CLEAN = [];
let CLEAN_LOG = [];
let CLEAN_CALLS = [];
const resetClean = () => {
  const running = 'It is running now. Wait for it to finish or fail.';
  CLEAN = [cm('10000001', 'COMPLETED', { runner: { type: 'OP_TEAM', role: 'OP_TEAM', name: 'Olive Ops', email: 'olive@x.com' } }), cm('10000002', 'FAILED', { runner: { type: 'DEVELOPER', role: 'DEVELOPER', name: 'Dev Dan', email: 'dan@x.com' } }),
    cm('10000003', 'COMPLETED', { can: { HARD_DELETE: false }, why: { HARD_DELETE: ['It has a settled payment. Purge its data instead; the record is kept for accounting.'] } }),
    cm('10000004', 'RUNNING', { can: { PURGE: false, SOFT_DELETE: false, HARD_DELETE: false }, why: { PURGE: [running], SOFT_DELETE: [running], HARD_DELETE: [running] } })];
  CLEAN_LOG = []; CLEAN_CALLS = [];
};
resetClean();
const setCan = (r, deleted) => { r.deletedAt = deleted ? '2026-10-31T10:00:00Z' : null; r.can.SOFT_DELETE = !deleted; r.can.RESTORE = deleted; r.blockedBy.SOFT_DELETE = deleted ? ['It is already deleted.'] : []; r.blockedBy.RESTORE = deleted ? [] : ['It is not deleted.']; };
const VERB = { PURGE: 'PURGE', SOFT_DELETE: 'SOFT DELETE', HARD_DELETE: 'HARD DELETE', RESTORE: 'RESTORE' };
const LOGACT = { PURGE: 'PURGE_DATA', SOFT_DELETE: 'SOFT_DELETE', RESTORE: 'RESTORE', HARD_DELETE: 'DELETE_MIGRATION' };
const OUT = { PURGE: 'purged', SOFT_DELETE: 'soft_deleted', RESTORE: 'restored', HARD_DELETE: 'deleted' };
const counts = { logs: 3, webhookEvents: 1, outboundCalls: 1, connectors: 1, dataCount: 1, reviewRequests: 0 };
http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  let raw = ''; req.on('data', (c) => (raw += c)); req.on('end', () => {
    const body = raw ? JSON.parse(raw) : {}; const u = req.url.split('?')[0];
    if (req.method === 'POST' && u === '/auth/login') { const w = WHO[body.identifier]; if (!w) return send(res, 401, { message: 'Invalid credentials' }); current = w; return send(res, 200, { accessToken: w.token, type: w.type }); }
    if (req.method === 'POST' && u === '/auth/logout') return send(res, 200, {});
    if (u === '/__clean-reset') { resetClean(); return send(res, 200, {}); }
    if (u === '/__clean-seed') { const n = Number(new URL(req.url, 'http://x').searchParams.get('n')); CLEAN = Array.from({ length: n }, (_, i) => cm(String(20000000 + i), 'COMPLETED')); CLEAN_LOG = []; CLEAN_CALLS = []; return send(res, 200, { n }); }
    if (u === '/__clean-calls') return send(res, 200, CLEAN_CALLS);
    if (u.startsWith('/admin/migration-cleaner')) {
      const q = new URL(req.url, 'http://x').searchParams;
      const frc = body.force === true || q.get('force') === 'true'; const ok = (r, a) => (frc && a === 'HARD_DELETE' ? true : r.can[a]);
      if (u.endsWith('/search')) { const s2 = (q.get('search') || '').toLowerCase(); const grp = q.get('group'); const rows = CLEAN.filter((r) => (!s2 || r.id.includes(s2) || (r.email || '').includes(s2)) && (grp !== 'deleted' || r.deletedAt)); const sk = Number(q.get('skip') || 0), tk = Number(q.get('take') || 20); return send(res, 200, { data: rows.slice(sk, sk + tk), total: rows.length, skip: sk, take: tk }); }
      if (u.endsWith('/matching-ids')) { const ids = CLEAN.map((r) => r.id); return send(res, 200, { ids, matched: CLEAN.length, capped: false, cap: 5000 }); }
      if (u.endsWith('/history')) return send(res, 200, { data: CLEAN_LOG, total: CLEAN_LOG.length });
      if (u.endsWith('/preview')) { if (body.ids.length > 200) return send(res, 400, { message: 'ids must contain no more than 200 elements' }); const items = body.ids.map((id) => { const r = CLEAN.find((x) => x.id === id); const good = r && ok(r, body.action); return { id, status: r ? r.status : null, eligible: !!good, reasons: good ? [] : [r ? r.blockedBy[body.action][0] : 'It no longer exists.'], overridden: good && frc ? r.blockedBy[body.action] : [], counts: good ? counts : { logs: 0, webhookEvents: 0, outboundCalls: 0, connectors: 0, dataCount: 0, reviewRequests: 0 } }; }); const eligible = items.filter((i) => i.eligible).length; return send(res, 200, { action: body.action, eligible, refused: items.length - eligible, force: frc, confirmationPhrase: (frc ? 'FORCE ' : '') + VERB[body.action] + ' ' + items.length, items }); }
      if (u.endsWith('/execute')) { CLEAN_CALLS.push(body); if (body.ids.length > 200) return send(res, 400, { message: 'ids must contain no more than 200 elements' }); if ((body.action === 'PURGE' || body.action === 'HARD_DELETE') && body.confirm !== (frc ? 'FORCE ' : '') + VERB[body.action] + ' ' + body.ids.length) return send(res, 400, { message: 'Confirmation does not match.' }); const results = body.ids.map((id) => { const r = CLEAN.find((x) => x.id === id); if (!r || !ok(r, body.action)) return { id, outcome: 'skipped', reasons: ['Refused.'] }; if (body.action === 'HARD_DELETE') CLEAN = CLEAN.filter((x) => x.id !== id); else if (body.action === 'SOFT_DELETE') setCan(r, true); else if (body.action === 'RESTORE') setCan(r, false); else { r.dataPurgedAt = '2026-10-31T10:00:00Z'; r.can.PURGE = false; r.blockedBy.PURGE = ['Its data was already purged.']; } CLEAN_LOG.unshift({ id: 'L' + id, migrationId: id, action: LOGACT[body.action], performedBy: 1, performedByType: 'admin', statusAtTime: r.status, pairName: r.pair, customerEmail: r.email, counts, createdAt: '2026-10-31T10:00:00Z' }); return { id, outcome: OUT[body.action], reasons: [], counts }; }); const summary = { purged: 0, soft_deleted: 0, restored: 0, deleted: 0, skipped: 0, failed: 0 }; results.forEach((r) => summary[r.outcome]++); return send(res, 200, { action: body.action, results, summary }); }
    }
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
