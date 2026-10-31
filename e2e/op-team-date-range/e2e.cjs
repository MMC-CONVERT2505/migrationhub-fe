const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const APP = process.env.APP_URL || 'http://127.0.0.1:14173', API = process.env.API_URL || 'http://127.0.0.1:19001';
const launch = () => chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] });
const api = async (p, body) => (await fetch(API + p, body ? { method: 'POST', body: JSON.stringify(body) } : {})).json();
let bad = 0; const check = (n, ok, x = '') => { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  -> ' + x : ''}`); };

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = (roles) => `${b64({ alg: 'none' })}.${b64({ sub: 7, type: 'user', roles })}.sig`;
const OP = token(['OP_TEAM']), CUSTOMER = token([]);
const authState = (t, roles) => JSON.stringify({ state: { user: { accessToken: t, user: { id: 7, email: 'op@mmcconvert.com', firstname: 'Op', lastname: 'Team', roles } }, admin: { accessToken: null, user: null } }, version: 2 });

const today = new Date(); const pad = (n) => String(n).padStart(2, '0');
const localDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const TODAY = localDay(today);
const tomorrow = localDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
const FROM = '2024-07-01', TO = '2025-06-30';

const word = { qbo: 'QuickBooks', xero: 'Xero', myob: 'MYOB' };
async function newPage(browser, { who, opts = {} } = {}) {
  const ctx = await browser.newContext(opts);
  // Seed once per tab: a reload must not bring a removed session back.
  if (who) await ctx.addInitScript(([k, v]) => { if (!sessionStorage.getItem('e2e-seeded')) { sessionStorage.setItem(k, v); sessionStorage.setItem('e2e-seeded', '1'); } }, ['mmc-auth', authState(who === 'op' ? OP : CUSTOMER, who === 'op' ? ['OP_TEAM'] : [])]);
  return { ctx, page: await ctx.newPage() };
}
async function startFromHome(page, slug = 'xero-to-myob') {
  const [s, d] = slug.split('-to-').map((x) => word[x]);
  await page.goto(`${APP}/`); const card = page.locator('div.group').filter({ hasText: new RegExp(s + '.{1,20}' + d, 'i') }).first();
  await card.waitFor(); await card.click(); await page.getByText('Choose your migration plan').waitFor();
  await page.selectOption('#plan-country', { value: 'Australia' });
}
const periodBox = (page) => page.getByRole('group', { name: 'Migration period' });
const creates = async () => (await api('/__log')).filter((r) => r.m === 'POST' && r.u === '/migrations');
async function fillDetails(page) { await page.waitForSelector('#name'); await page.fill('#name', 'T U'); if (await page.locator('#email').isEnabled()) await page.fill('#email', 't@example.com'); /* Operation Team: locked to the team inbox, phone not required */ if (await page.locator('#phone').isEnabled()) await page.fill('#phone', '412345678'); await page.fill('#entityName', 'T Pty'); await page.locator('input[name="trackingInventory"][value="false"]').check().catch(() => {}); }
async function submitAndCreate(page) {
  await page.getByRole('button', { name: /^Continue/ }).click(); await page.waitForURL(/\/payment\/success/);
  await page.waitForResponse((r) => r.url().endsWith('/migrations') && r.request().method() === 'POST', { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(600);
}

(async () => {
  const browser = await launch();

  // ---- Operation Team: the control, validation, and what is sent
  { await api('/__reset'); const { ctx, page } = await newPage(browser, { who: 'op' });
    await startFromHome(page);
    check('[op] sees the "Migration period" choice, defaulting to the plan years', (await periodBox(page).count()) === 1 && (await page.getByLabel('Financial years (plan)').isChecked()));
    check('[op] no date inputs until Custom date range is chosen', (await page.locator('#range-from').count()) === 0);
    await page.getByLabel('Custom date range').check();
    check('[op] Custom shows From and To, and hides the years selector', (await page.locator('#range-from').count()) === 1 && (await page.locator('#history-years').count()) === 0);
    check('[op] date pickers cannot go past today', (await page.locator('#range-to').getAttribute('max')) === TODAY);

    // aria-disabled (not disabled): a real person can press it to see what is missing, so force the click past Playwright's guard.
    await page.getByRole('button', { name: 'Continue' }).click({ force: true }); await page.waitForTimeout(300);
    check('[op] Continue with empty dates stays put and says what is missing', /\/plan$/.test(new URL(page.url()).pathname) && (await page.getByText('Select a From date.').count()) === 1 && (await page.getByText('Select a To date.').count()) === 1);

    await page.fill('#range-from', '2025-06-02'); await page.fill('#range-to', '2025-06-01'); await page.locator('#range-to').blur();
    check('[op] From after To is refused on the To field', (await page.getByText('To date must not be before the From date.').count()) === 1);
    await page.fill('#range-from', '2024-07-01'); await page.fill('#range-to', tomorrow); await page.locator('#range-to').blur();
    check('[op] a future To date is refused', (await page.getByText('To date cannot be in the future.').count()) === 1);
    await page.fill('#range-from', '2000-01-01'); await page.fill('#range-to', TODAY); await page.locator('#range-to').blur();
    check('[op] a period of 15 years or more is refused', (await page.getByText(/shorter than 15 years/).count()) === 1);
    await page.getByRole('button', { name: 'Continue' }).click({ force: true }); await page.waitForTimeout(300);
    check('[op] ... and Continue still does not proceed', /\/plan$/.test(new URL(page.url()).pathname));

    await page.fill('#range-from', FROM); await page.fill('#range-to', TO);
    check('[op] a valid range shows its summary and no error', (await page.getByText(/1 Jul 2024 – 30 Jun 2025 · 365 days/).count()) === 1 && (await page.locator('[role=alert]').count()) === 0);
    await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForURL(/customer-details/);
    check('[op] a valid range lets the flow continue', true);
    await fillDetails(page);
    await page.getByRole('button', { name: /^Continue/ }).click(); await page.waitForURL(/\/payment\/success/);
    await page.getByText('Migration Ready').waitFor();
    const summary = await page.locator('main').innerText();
    check('[op] the summary names the exact period', /1 Jul 2024 – 30 Jun 2025/.test(summary) && /Custom date range/.test(summary), summary.match(/Date range[^\n]*\n?[^\n]*/)?.[0]);
    await page.waitForResponse((r) => r.url().endsWith('/migrations') && r.request().method() === 'POST', { timeout: 15000 }).catch(() => {});
    const c = await creates();
    check('[op] one migration is created with the dates, and no years', c.length === 1 && c[0].body.migrationStartDate === FROM && c[0].body.migrationEndDate === TO && c[0].body.years === undefined && c[0].body.migrationPairId === 'pair-xero-myob' && c[0].body.planId === 'plan-basic', JSON.stringify(c[0]?.body));
    await ctx.close(); }

  // ---- Operation Team keeps the normal years path working exactly as before
  { await api('/__reset'); const { ctx, page } = await newPage(browser, { who: 'op' });
    await startFromHome(page);
    await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForURL(/customer-details/);
    await fillDetails(page); await submitAndCreate(page);
    const c = await creates();
    check('[op default] ignoring the new control sends no dates (the normal order)', c.length === 1 && c[0].body.migrationStartDate === undefined && c[0].body.migrationEndDate === undefined, JSON.stringify(c[0]?.body));
    await ctx.close(); }
  { await api('/__reset'); const { ctx, page } = await newPage(browser, { who: 'op' });
    await startFromHome(page); await page.getByLabel('Custom date range').check(); await page.fill('#range-from', FROM); await page.fill('#range-to', TO);
    await page.getByLabel('Financial years (plan)').check();
    check('[op] switching back to years clears the range and brings the years selector back', (await page.locator('#range-from').count()) === 0);
    await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForURL(/customer-details/); await fillDetails(page); await submitAndCreate(page);
    const c = await creates();
    check('[op] ... and nothing of the range is sent', c.length === 1 && c[0].body.migrationStartDate === undefined, JSON.stringify(c[0]?.body));
    await ctx.close(); }

  // ---- Customers never see it, never send it
  for (const who of [undefined, 'customer']) {
    await api('/__reset'); const { ctx, page } = await newPage(browser, { who });
    await startFromHome(page);
    check(`[${who || 'guest'}] no "Migration period" choice at all`, (await periodBox(page).count()) === 0 && (await page.locator('#range-from').count()) === 0);
    await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForURL(/customer-details/); await fillDetails(page); await submitAndCreate(page);
    const c = await creates();
    check(`[${who || 'guest'}] the order is created exactly as before: no dates`, c.length === 1 && c[0].body.migrationStartDate === undefined && c[0].body.migrationEndDate === undefined, JSON.stringify(c[0]?.body));
    await ctx.close(); }

  // ---- A leftover range in a customer's tab never reaches their order (same pair, so only the plan-page guard can stop it)
  { await api('/__reset'); const { ctx, page } = await newPage(browser, { who: 'customer' });
    await startFromHome(page);
    await page.evaluate(() => { const k = 'mmc-app'; const o = JSON.parse(sessionStorage.getItem(k)); o.state.selectedDateRange = { from: '2024-07-01', to: '2025-06-30' }; sessionStorage.setItem(k, JSON.stringify(o)); });
    await page.reload(); await page.getByText('Choose your migration plan').waitFor(); await page.waitForTimeout(400);
    const left = await page.evaluate(() => JSON.parse(sessionStorage.getItem('mmc-app') || '{}').state?.selectedDateRange ?? null);
    check('[stale] a range left in a customer\'s tab is cleared on the plan page', left === null, JSON.stringify(left));
    await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForURL(/customer-details/); await fillDetails(page); await submitAndCreate(page);
    const c = await creates();
    check('[stale] ... and the order carries no dates', c.length === 1 && c[0].body.migrationStartDate === undefined, JSON.stringify(c[0]?.body));
    await ctx.close(); }

  // ---- A range never follows the operator to another pair
  { await api('/__reset'); const { ctx, page } = await newPage(browser, { who: 'op' });
    await startFromHome(page, 'xero-to-myob'); await page.getByLabel('Custom date range').check(); await page.fill('#range-from', FROM); await page.fill('#range-to', TO);
    await startFromHome(page, 'qbo-to-myob');
    check('[leak] the next pair starts on the normal period, not the previous range', (await page.getByLabel('Financial years (plan)').isChecked()) && (await page.locator('#range-from').count()) === 0);
    await ctx.close(); }

  // ---- Role lost mid-flow: refuse to start rather than migrate the wrong period
  { await api('/__reset'); const { ctx, page } = await newPage(browser, { who: 'op' });
    await startFromHome(page); await page.getByLabel('Custom date range').check(); await page.fill('#range-from', FROM); await page.fill('#range-to', TO);
    await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForURL(/customer-details/); await fillDetails(page);
    await page.getByRole('button', { name: /^Continue/ }).click(); await page.waitForURL(/\/payment\/success/);
    await page.evaluate(() => sessionStorage.removeItem('mmc-auth')); // the Operation Team session ends
    await api('/__reset'); await page.reload(); await page.waitForTimeout(6500);
    const body = await page.locator('body').innerText();
    check('[role lost] the order is NOT created, and the person is told why', (await creates()).length === 0 && /Operation Team access has ended/.test(body), body.slice(0, 120).replace(/\n/g, ' '));
    await ctx.close(); }

  // ---- Timezones: the days chosen are the days sent and shown
  for (const tz of ['Pacific/Kiritimati', 'Pacific/Pago_Pago', 'Asia/Kolkata']) {
    await api('/__reset'); const { ctx, page } = await newPage(browser, { who: 'op', opts: { timezoneId: tz } });
    await startFromHome(page); await page.getByLabel('Custom date range').check(); await page.fill('#range-from', FROM); await page.fill('#range-to', TO);
    check(`[tz ${tz}] the summary shows the same two days`, (await page.getByText(/1 Jul 2024 – 30 Jun 2025/).count()) === 1);
    await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForURL(/customer-details/); await fillDetails(page); await submitAndCreate(page);
    const c = await creates();
    check(`[tz ${tz}] the dates sent are exactly the days chosen`, c.length === 1 && c[0].body.migrationStartDate === FROM && c[0].body.migrationEndDate === TO, JSON.stringify(c[0]?.body));
    await ctx.close(); }

  // ---- Small screens
  { await api('/__reset'); const { ctx, page } = await newPage(browser, { who: 'op', opts: { viewport: { width: 375, height: 700 } } });
    await startFromHome(page); await page.getByLabel('Custom date range').check();
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    check('[mobile 375px] the control fits the screen and the inputs are usable', fits && (await page.locator('#range-from').isVisible()) && (await page.locator('#range-to').isVisible()));
    await ctx.close(); }

  await browser.close(); console.log(bad ? `${bad} FAILED` : 'ALL PASSED'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
