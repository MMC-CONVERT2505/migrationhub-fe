const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const APP = process.env.APP_URL, API = process.env.API_URL;
let bad = 0; const check = (n, ok, x = '') => { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  -> ' + x : ''}`); };
const j = async (p) => (await fetch(API + p)).json();
const set = (q) => fetch(`${API}/__set?${q}`);
const body = (page) => page.locator('body').innerText();

async function adminPage(browser) {
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.goto(`${APP}/admin/login`);
  await page.locator('input[type="email"], input[name="email"], #admin-email').first().fill('admin@x.com');
  await page.fill('#admin-password', 'whatever');
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/admin$/, { timeout: 10000 });
  return { ctx, page };
}

// A signed-in customer: the session the app keeps in sessionStorage.
async function customerPage(browser) {
  const token = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from('{"sub":9,"type":"user","roles":[],"permissions":[]}').toString('base64url')}.sig`;
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await ctx.addInitScript((t) => {
    sessionStorage.setItem('mmc-auth', JSON.stringify({ state: { user: { accessToken: t, user: { id: 9, firstname: 'Cu', lastname: 'St', email: 'cust@x.com', roles: [] } }, admin: { accessToken: null, user: null } }, version: 2 }));
  }, token);
  return { ctx, page };
}

(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] });
  const errors = [];

  // ---------- 1. Dashboard: refresh failures are visible and recover
  await fetch(API + '/__reset');
  { const { ctx, page } = await adminPage(browser);
    page.on('pageerror', (e) => errors.push('dashboard: ' + e.message));
    await page.waitForSelector('h1:has-text("Migration Dashboard")');
    const head = page.locator('div.justify-between', { has: page.locator('h1:has-text("Migration Dashboard")') }).first();
    check('[dashboard] healthy: shows "Live"', await head.getByText('Live', { exact: true }).isVisible());
    check('[dashboard] healthy: no warning', !/Refresh failing/.test(await body(page)));
    await set('failActivity=1');
    await page.getByText(/Refresh failing/).waitFor({ timeout: 15000 }).catch(() => {});
    check('[dashboard] activity feed failing -> warning replaces "Live"', /Refresh failing/.test(await body(page)) && !(await head.getByText('Live', { exact: true }).count()));
    check('[dashboard] page itself stays usable (title still shown)', await page.locator('h1:has-text("Migration Dashboard")').isVisible());
    await set('failActivity=0');
    await head.getByText('Live', { exact: true }).waitFor({ timeout: 15000 }).catch(() => {});
    check('[dashboard] recovers by itself -> "Live" returns', await head.getByText('Live', { exact: true }).isVisible() && !/Refresh failing/.test(await body(page)));
    await ctx.close(); }

  // ---------- 2. Migration Pairs: rotate webhook secret
  await fetch(API + '/__reset');
  { const { ctx, page } = await adminPage(browser);
    page.on('pageerror', (e) => errors.push('pairs: ' + e.message));
    await page.goto(`${APP}/admin/migration-pairs`); await page.waitForSelector('tbody tr');
    await page.locator('tbody tr').first().getByTitle('Edit').click();
    await page.getByText('Webhook secret', { exact: true }).waitFor();
    check('[rotate] panel present in the edit modal with a warning', /invalidates the current secret immediately/.test(await body(page)));
    await page.getByRole('button', { name: 'Rotate secret' }).click();
    check('[rotate] first click only asks to confirm (no API call yet)', (await j('/__state')).rotate === 0 && await page.getByRole('button', { name: 'Yes, rotate now' }).isVisible());
    await page.getByRole('button', { name: 'Cancel' }).first().click();
    check('[rotate] cancel -> no call, back to the single button', (await j('/__state')).rotate === 0 && await page.getByRole('button', { name: 'Rotate secret' }).isVisible());
    await page.getByRole('button', { name: 'Rotate secret' }).click();
    await page.getByRole('button', { name: 'Yes, rotate now' }).click();
    await page.getByText(/shown only once/).waitFor({ timeout: 5000 }).catch(() => {});
    const t = await body(page);
    check('[rotate] confirm -> exactly one API call', (await j('/__state')).rotate === 1);
    check('[rotate] the NEW secret from the server is shown (real flat response shape)', /NEWSECRET-ab12ab12ab12ab12ab12ab12ab12ab12/.test(t));
    check('[rotate] "shown only once" warning + Copy button', /shown only once/.test(t) && await page.getByRole('button', { name: 'Copy' }).isVisible());
    await set('failRotate=1');
    await page.getByRole('button', { name: 'Rotate secret' }).click();
    await page.getByRole('button', { name: 'Yes, rotate now' }).click();
    await page.getByText(/Something went wrong on our side/).waitFor({ timeout: 5000 }).catch(() => {});
    check('[rotate] server error -> readable message, no crash', /Something went wrong on our side/.test(await body(page)));
    await ctx.close(); }

  // ---------- 3. Tool Logos: usage warning before delete
  await fetch(API + '/__reset');
  { const { ctx, page } = await adminPage(browser);
    page.on('pageerror', (e) => errors.push('logos: ' + e.message));
    await page.goto(`${APP}/admin/tool-logos`); await page.waitForSelector('img[alt="Xero logo"]');
    const card = (name) => page.locator('div.group', { has: page.locator(`img[alt="${name}"]`) }).first();
    await card('Xero logo').hover(); await card('Xero logo').getByTitle('Delete').click();
    await page.getByText(/In use by 2 migration pairs/).waitFor({ timeout: 5000 }).catch(() => {});
    const t = await body(page);
    check('[logos] in-use logo: warns with count and pair names', /In use by 2 migration pairs: Xero → QBO, MYOB → QBO/.test(t));
    check('[logos] in-use logo: button reads "Delete anyway"', await page.getByRole('button', { name: 'Delete anyway' }).isVisible());
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('button', { name: 'Cancel' }).click();
    check('[logos] cancel -> nothing deleted', (await j('/__state')).deleteLogo.length === 0 && await page.locator('img[alt="Xero logo"]').isVisible());
    await card('Unused logo').hover(); await card('Unused logo').getByTitle('Delete').click();
    await dlg.getByRole('button', { name: 'Delete', exact: true }).waitFor({ timeout: 5000 });
    check('[logos] unused logo: no warning, plain "Delete"', !/In use by/.test(await dlg.innerText()) && !(await dlg.getByRole('button', { name: 'Delete anyway' }).count()));
    await dlg.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('img[alt="Unused logo"]'), null, { timeout: 5000 }).catch(() => {});
    check('[logos] unused logo deleted via API and removed from the grid', (await j('/__state')).deleteLogo.join() === '2' && !(await page.locator('img[alt="Unused logo"]').count()));
    await card('Xero logo').hover(); await card('Xero logo').getByTitle('Delete').click();
    await dlg.getByRole('button', { name: 'Delete anyway' }).waitFor();
    await dlg.getByRole('button', { name: 'Delete anyway' }).click();
    await page.waitForFunction(() => !document.querySelector('img[alt="Xero logo"]'), null, { timeout: 5000 }).catch(() => {});
    check('[logos] "Delete anyway" does delete the in-use logo', (await j('/__state')).deleteLogo.join() === '2,1');
    await ctx.close(); }

  // ---------- 4. Customer: My Migrations shows every status, no fake wizard
  await fetch(API + '/__reset');
  { const { ctx, page } = await customerPage(browser);
    page.on('pageerror', (e) => errors.push('history: ' + e.message));
    await page.goto(`${APP}/migrations`); await page.waitForSelector('h1:has-text("My Migrations")');
    await page.waitForSelector('[role="link"]');
    const cards = await page.locator('[role="link"]').count();
    check('[history] all 10 migrations are listed (none hidden)', cards === 10, `cards=${cards}`);
    const t = await body(page);
    for (const [id, label] of [['m-partial', 'Partial success'], ['m-payfail', 'Payment failed'], ['m-paypend', 'Payment pending'], ['m-submitting', 'In progress'], ['m-auth', 'In progress'], ['m-weird', 'In progress']]) {
      const c = page.locator('[role="link"]', { hasText: `ID: ${id}` });
      check(`[history] ${id} is shown with the label "${label}"`, (await c.count()) === 1 && (await c.innerText()).includes(label));
    }
    check('[history] an unknown status is NOT mislabelled "Draft"', !(await page.locator('[role="link"]', { hasText: 'ID: m-weird' }).innerText()).includes('Draft'));
    const sections = (await page.locator('h2').allInnerTexts()).map((s) => s.replace(/\s+/g, ' '));
    check('[history] sections: In progress / Drafts / Completed / Failed', sections.some((s) => /^In progress \(5\)/i.test(s)) && sections.some((s) => /^Drafts \(2\)/i.test(s)) && sections.some((s) => /^Completed \(2\)/i.test(s)) && sections.some((s) => /^Failed \/ Cancelled \(1\)/i.test(s)), sections.join(' | '));
    // Continue/View: never the fake wizard
    const draft = page.locator('[role="link"]', { hasText: 'ID: m-draft' });
    check('[history] draft has no "Continue" button', !(await draft.getByRole('button', { name: /Continue/ }).count()));
    await draft.getByRole('button', { name: 'View', exact: true }).click();
    await page.waitForURL(/\/migrations\/m-draft$/, { timeout: 5000 });
    check('[history] draft "View" opens the real tracking page, not /migration', /\/migrations\/m-draft$/.test(page.url()) && !/\/migration$/.test(page.url()));
    await page.goBack(); await page.waitForSelector('[role="link"]');
    const queued = page.locator('[role="link"]', { hasText: 'ID: m-queued' });
    await queued.getByRole('button', { name: 'View live' }).click();
    await page.waitForURL(/\/migrations\/m-queued$/, { timeout: 5000 });
    check('[history] queued "View live" opens the tracking page', /\/migrations\/m-queued$/.test(page.url()));
    check('[history] fake demo wizard never opened during the above', !/MCX-\d{4}-\d+/.test(await body(page)));
    await ctx.close(); }

  // ---------- 5. Customer tracking page: failing refresh is surfaced, then clears
  await fetch(API + '/__reset');
  { const { ctx, page } = await customerPage(browser);
    page.on('pageerror', (e) => errors.push('track: ' + e.message));
    await page.goto(`${APP}/migrations/m-running`); await page.waitForSelector('text=Xero → QBO');
    check('[track] healthy: no stale-data warning', !/couldn.t refresh the latest status/.test(await body(page)));
    await set('failMigration=1');
    await page.getByText(/couldn.t refresh the latest status/).waitFor({ timeout: 15000 }).catch(() => {});
    check('[track] refresh failing -> warning, last known status still on screen', /couldn.t refresh the latest status/.test(await body(page)) && /Xero → QBO/.test(await body(page)));
    await set('failMigration=0');
    await page.waitForFunction(() => !/couldn.t refresh the latest status/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {});
    check('[track] recovers by itself -> warning disappears', !/couldn.t refresh the latest status/.test(await body(page)));
    await ctx.close(); }

  check('no uncaught page errors in any scenario', errors.length === 0, errors.join(' | '));
  await browser.close(); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('ERROR ' + (e && e.stack || e)); process.exit(2); });
