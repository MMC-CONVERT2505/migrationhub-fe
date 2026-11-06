// Local mock API (no database) for the prod-hardening e2e. Response shapes mirror the real backend (flat, no { data } wrapper
// except where the real endpoint paginates). Control endpoints: /__state, /__set?key=value, /__reset.
const http = require('http');
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const tok = (p) => `${b64({ alg: 'none' })}.${b64(p)}.sig`;
const ADMIN = { token: tok({ sub: 1, type: 'admin' }), me: { id: 1, firstname: 'Real', lastname: 'Admin', email: 'admin@x.com', roles: ['admin'] }, type: 'admin' };
const CUST = { token: tok({ sub: 9, type: 'user', roles: [], permissions: [] }), me: { id: 9, firstname: 'Cu', lastname: 'St', email: 'cust@x.com', roles: [] } };
const D = { label: 'vs last week', value: 0, direction: 'flat' };
const send = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }); res.end(JSON.stringify(body)); };

const pair = (id, name) => ({ id, source: 'xero', destination: 'qbo', displayName: name, serviceUrl: 'https://x', fallbackServiceUrl: null, apiVersion: 'v1', healthCheckPath: '/health', environment: 'PRODUCTION', isActive: true, isMaintenance: false, isFree: false, enquiryEmails: [], plans: [], planPrices: [], sourceLogoId: 1, destinationLogoId: null, sourceLogo: null, destinationLogo: null, createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' });
const PAIRS = [pair('p1', 'Xero → QBO'), pair('p2', 'MYOB → QBO')];
const logo = (id, name) => ({ id, name, image: `logo${id}.png`, navigate: null, type: 'ToolLogo', platform: 'Web', heading: null, paragraph: null, status: 'Active', createdAt: `2026-10-0${id}T00:00:00Z`, updatedAt: '2026-10-01T00:00:00Z' });

const plan = { id: 'pl1', name: 'Basic', basePrice: '100', currency: 'AUD', history: '1 year', support: 'Email', features: [], popular: false };
const mig = (id, status, extra = {}) => ({ id, userId: 9, migrationPairId: 'p1', planId: 'pl1', paymentId: null, status, remoteJobId: null, selectedCategories: null, sourceAuthUrl: null, destinationAuthUrl: null, progress: 40, currentCategory: null, errorMessage: null, failedCategory: null, startedAt: null, completedAt: null, createdAt: '2026-10-30T10:00:00Z', updatedAt: '2026-10-30T10:00:00Z', migrationPair: { id: 'p1', source: 'xero', destination: 'qbo', displayName: 'Xero → QBO', isFree: false }, plan, ...extra });
const HISTORY = [['m-draft', 'DRAFT'], ['m-queued', 'QUEUED'], ['m-running', 'RUNNING'], ['m-partial', 'PARTIAL_SUCCESS'], ['m-submitting', 'SUBMITTING'], ['m-payfail', 'PAYMENT_FAILED'], ['m-paypend', 'PAYMENT_PENDING'], ['m-auth', 'SOURCE_AUTH_AWAITING'], ['m-weird', 'SOMETHING_NEW'], ['m-done', 'COMPLETED']].map(([id, s]) => mig(id, s));

const fresh = () => ({ failActivity: false, failMigration: false, failRotate: false, calls: { rotate: 0, deleteLogo: [], usage: [] }, logos: [logo(1, 'Xero logo'), logo(2, 'Unused logo')] });
let S = fresh();

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url, 'http://x'); const u = url.pathname; let raw = ''; req.on('data', (c) => (raw += c)); req.on('end', () => {
    const body = raw ? JSON.parse(raw) : {};
    if (u === '/__reset') { S = fresh(); return send(res, 200, {}); }
    if (u === '/__state') return send(res, 200, S.calls);
    if (u === '/__set') { for (const [k, v] of url.searchParams) S[k] = v === '1'; return send(res, 200, {}); }
    if (u === '/auth/login') { if (body.identifier === 'admin@x.com') return send(res, 200, { accessToken: ADMIN.token, type: 'admin' }); return send(res, 401, { message: 'Invalid credentials' }); }
    if (u === '/auth/logout') return send(res, 200, {});
    if (u === '/users/me') return send(res, 200, String(req.headers.authorization || '').includes(CUST.token) ? CUST.me : ADMIN.me);
    // dashboard
    if (u === '/admin/analytics/summary') return send(res, 200, { totalMigrations: 3, totalDelta: D, successRate: 100, successRateDelta: D, activeNow: 0, activeNowDelta: D, avgDurationMinutes: 1, avgDurationDelta: D });
    if (u === '/admin/analytics/pairs') return send(res, 200, { pairs: [] });
    if (u === '/admin/analytics/activity') return S.failActivity ? send(res, 500, { message: 'Internal server error' }) : send(res, 200, { items: [] });
    if (u === '/admin/analytics/outcomes') return send(res, 200, { total: 0, successRate: 0, completed: 0, failed: 0, inProgress: 0, cancelled: 0, underReview: 0 });
    // pairs + logos
    if (req.method === 'GET' && u === '/migration-pairs') return send(res, 200, { data: PAIRS, total: 2 });
    if (u.endsWith('/assignees')) return send(res, 200, []);
    if (req.method === 'POST' && u.endsWith('/rotate-secret')) { S.calls.rotate++; return S.failRotate ? send(res, 500, { message: 'Internal server error' }) : send(res, 200, { id: 'p1', webhookSecret: 'NEWSECRET-' + 'ab12'.repeat(8) }); }
    if (u === '/plans') return send(res, 200, []);
    if (u === '/users') return send(res, 200, { data: [], total: 0 });
    if (u === '/banner/get-banners') return send(res, 200, { data: url.searchParams.get('type') === 'ToolLogo' ? S.logos : [], total: S.logos.length });
    if (u.startsWith('/banner/usage/')) { const id = Number(u.split('/').pop()); S.calls.usage.push(id); return send(res, 200, { pairs: id === 1 ? [{ id: 'p1', displayName: 'Xero → QBO' }, { id: 'p2', displayName: 'MYOB → QBO' }] : [] }); }
    if (req.method === 'DELETE' && u.startsWith('/banner/delete/')) { const id = Number(u.split('/').pop()); S.calls.deleteLogo.push(id); S.logos = S.logos.filter((l) => l.id !== id); return send(res, 200, { message: 'deleted' }); }
    // customer
    if (req.method === 'GET' && u === '/migrations') return send(res, 200, { data: HISTORY, total: HISTORY.length, skip: 0, take: 20 });
    if (req.method === 'GET' && u === '/migrations/m-running') return S.failMigration ? send(res, 500, { message: 'Internal server error' }) : send(res, 200, mig('m-running', 'RUNNING'));
    if (req.method === 'GET' && u.startsWith('/migrations/')) return send(res, 200, mig(u.split('/').pop(), 'DRAFT'));
    if (u === '/migration-pairs/available') return send(res, 200, []);
    send(res, 200, []);
  });
}).listen(Number(process.env.MOCK_PORT || 19003), '127.0.0.1');
