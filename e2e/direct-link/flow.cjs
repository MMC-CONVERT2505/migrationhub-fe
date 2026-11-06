const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const APP = process.env.APP_URL || 'http://127.0.0.1:14173', API = process.env.API_URL || 'http://127.0.0.1:19001';
const launch = () => chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] });
const api = async (p, body) => (await fetch(API + p, body ? { method: 'POST', body: JSON.stringify(body) } : {})).json();
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  -> ' + extra : ''}`); };
const PAIRS = { 'xero-to-myob': { id: 'pair-xero-myob', tracking: true }, 'qbo-to-myob': { id: 'pair-qbo-myob', tracking: true }, 'xero-to-reckon': { id: 'pair-xero-reckon', tracking: false } };
const path = (page) => new URL(page.url()).pathname + new URL(page.url()).search;

async function fillDetails(page, { country = 'Australia (AUD)', tracking = false } = {}) {
  await page.waitForSelector('#name');
  await page.fill('#name', 'Test User'); await page.fill('#email', 'test@example.com'); await page.fill('#phone', '412345678');
  if (await page.locator('select#country').count()) await page.selectOption('select#country', { value: country });
  await page.fill('#entityName', 'Test Pty Ltd');
  if (tracking) await page.locator('input[name="trackingInventory"][value="false"]').check();
}
async function submitAndStart(page) {
  await page.getByRole('button', { name: /^Continue/ }).click();
  await page.waitForURL(/\/payment\/success/, { timeout: 10000 });
  // the page auto-starts after a 5 s countdown; wait for the create call either way
  await page.waitForResponse((r) => r.url().endsWith('/migrations') && r.request().method() === 'POST', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
}
const created = async () => (await api('/__log')).filter((r) => r.m === 'POST' && r.u === '/migrations');

(async () => {
  const browser = await launch();
  const fresh = async () => { const ctx = await browser.newContext(); const page = await ctx.newPage(); page.on('pageerror', (e) => console.log('  pageerror:', e.message)); return { ctx, page }; };

  // ---- 1. DIRECT LINK, each pair, both countries
  for (const [slug, meta] of Object.entries(PAIRS)) for (const country of ['Australia (AUD)', 'New Zealand (NZD)']) {
    await api('/__reset'); const { ctx, page } = await fresh();
    await page.goto(`${APP}/migration/details/${slug}/free`);
    await page.waitForURL(/customer-details\?flow=/, { timeout: 10000 }).catch(() => {});
    const p1 = path(page);
    check(`[direct ${slug}] lands on customer-details with flow token`, new RegExp(`/migration/${slug}/customer-details\\?flow=`).test(p1), p1);
    check(`[direct ${slug}] no "Change plan" and no plan step`, (await page.getByRole('button', { name: 'Change plan' }).count()) === 0);
    await page.goto(`${APP}/`); await page.waitForTimeout(800);
    check(`[direct ${slug}] home is locked out (returns to the flow)`, /customer-details\?flow=/.test(path(page)), path(page));
    await fillDetails(page, { country, tracking: meta.tracking });
    await submitAndStart(page);
    const c = await created();
    const b = c[0] && c[0].body;
    check(`[direct ${slug} ${country}] creates one migration for the right pair + Basic plan`, c.length === 1 && b.migrationPairId === meta.id && b.planId === 'plan-basic' && !!b.inquiryId, JSON.stringify(b));
    const inq = (await api('/__log')).find((r) => r.u === '/inquiry-migrations' && r.m === 'POST');
    check(`[direct ${slug} ${country}] inquiry carries pair id, country${meta.tracking ? ', trackingInventory' : ''}`, inq.body.migrationPairId === meta.id && inq.body.country === country && (!meta.tracking || inq.body.trackingInventory === false), JSON.stringify(inq.body));
    await ctx.close();
  }

  // ---- 2. HOME PAGE FLOW, each pair, both countries
  for (const [slug, meta] of Object.entries(PAIRS)) for (const country of ['Australia', 'New Zealand']) {
    await api('/__reset'); const { ctx, page } = await fresh();
    await page.goto(`${APP}/`);
    const word = { qbo: 'QuickBooks', xero: 'Xero', myob: 'MYOB', reckon: 'Reckon' }; const [src, dst] = slug.split('-to-').map((x) => word[x]);
    await page.locator('div.group').filter({ hasText: new RegExp(src + '.{1,20}' + dst, 'i') }).first().waitFor({ timeout: 10000 });
    await page.locator('div.group').filter({ hasText: new RegExp(src + '.{1,20}' + dst, 'i') }).first().click();
    await page.waitForURL(new RegExp(`/migration/${slug}/plan`));
    await page.getByText('Choose your migration plan').waitFor({ timeout: 8000 }).catch(() => {});
    check(`[home ${slug}] plan page shown (not skipped, no flow token)`, !/flow=/.test(path(page)) && (await page.getByText('Choose your migration plan').count()) === 1, path(page));
    await page.selectOption('#plan-country', { value: country });
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForURL(new RegExp(`/migration/${slug}/customer-details`));
    check(`[home ${slug}] details has no flow token and home is reachable`, !/flow=/.test(path(page)));
    await fillDetails(page, { tracking: meta.tracking });
    await submitAndStart(page);
    const c = await created(); const b = c[0] && c[0].body;
    const inq = (await api('/__log')).find((r) => r.u === '/inquiry-migrations' && r.m === 'POST');
    check(`[home ${slug} ${country}] creates one migration for the right pair + Basic plan`, c.length === 1 && b.migrationPairId === meta.id && b.planId === 'plan-basic' && inq.body.country.startsWith(country), JSON.stringify(b) + ' ' + inq.body.country);
    await ctx.close();
  }

  // ---- 3. EDGES
  { // switching between two website deep links in the same tab
    await api('/__reset'); const { ctx, page } = await fresh();
    await page.goto(`${APP}/migration/details/xero-to-reckon/free`); await page.waitForURL(/customer-details\?flow=/);
    await page.goto(`${APP}/migration/details/xero-to-myob/free`); await page.waitForTimeout(1500);
    check('[edge] deep link to a different dedicated pair in the same tab shows THAT pair', /\/migration\/xero-to-myob\/customer-details\?flow=/.test(path(page)), path(page));
    const banner = (await page.locator('body').innerText());
    check('[edge] and the form names MYOB, not Reckon', /MYOB/.test(banner) && !/Reckon/.test(banner.split('Migration Information')[1]?.slice(0, 300) || ''));
    await ctx.close();
  }
  { // legacy/alias slug forms and pair id
    for (const alias of ['xero-myob', 'pair-qbo-myob', 'QBO-to-MYOB']) {
      await api('/__reset'); const { ctx, page } = await fresh();
      await page.goto(`${APP}/migration/details/${alias}/free`); await page.waitForTimeout(1500);
      check(`[edge] deep link slug form "${alias}" is dedicated (canonical URL)`, /\/migration\/(xero|qbo)-to-myob\/customer-details\?flow=/.test(path(page)), path(page));
      await ctx.close();
    }
  }
  { // reverse pair and a non-dedicated pair are unaffected
    for (const [slug, expectPlan] of [['myob-to-qbo', true], ['xero-to-qbo', true], ['qbo-to-xero', true]]) {
      await api('/__reset'); const { ctx, page } = await fresh();
      await page.goto(`${APP}/migration/details/${slug}/free`); await page.waitForTimeout(1500);
      await page.getByText('Choose your migration plan').waitFor({ timeout: 8000 }).catch(() => {});
      check(`[edge] ${slug} deep link stays a normal pair (plan page shown, no flow token)`, (await page.getByText('Choose your migration plan').count()) === 1 && !/flow=/.test(page.url()), path(page));
      await ctx.close();
    }
  }
  { // other-pair URL inside an active flow is sent back; plan URL of the same pair too
    await api('/__reset'); const { ctx, page } = await fresh();
    await page.goto(`${APP}/migration/details/qbo-to-myob/free`); await page.waitForURL(/customer-details\?flow=/);
    await page.goto(`${APP}/migration/xero-to-qbo/plan`); await page.waitForTimeout(1200);
    check('[edge] inside the flow, another pair\'s URL returns to the flow', /\/migration\/qbo-to-myob\/customer-details\?flow=/.test(path(page)), path(page));
    await page.goto(`${APP}/migration/qbo-to-myob/plan`); await page.waitForTimeout(1200);
    check('[edge] inside the flow, the plan URL returns to details', /\/migration\/qbo-to-myob\/customer-details\?flow=/.test(path(page)), path(page));
    const tok = new URL(page.url()).searchParams.get('flow');
    await page.goto(`${APP}/migration/qbo-to-myob/customer-details?flow=forged`); await page.waitForTimeout(1200);
    check('[edge] forged flow token is replaced by this tab\'s token', new URL(page.url()).searchParams.get('flow') === tok, path(page));
    await page.goBack(); await page.waitForTimeout(800);
    check('[edge] browser Back stays on customer-details', /customer-details/.test(path(page)), path(page));
    await ctx.close();
  }
  { // a fresh tab with the plain (no token) details URL is a normal pair, not locked
    await api('/__reset'); const { ctx, page } = await fresh();
    await page.goto(`${APP}/migration/xero-to-myob/customer-details`); await page.waitForTimeout(1500);
    check('[edge] pasted plain details URL (no deep link) is the normal flow (no token; sent to the plan step)', !/flow=/.test(path(page)) && /\/migration\/xero-to-myob\//.test(path(page)), path(page));
    await page.goto(`${APP}/`); await page.waitForTimeout(800);
    check('[edge] ... and home is reachable', new URL(page.url()).pathname === '/', path(page));
    await ctx.close();
  }
  { // creation failure lifts the lock
    await api('/__reset'); await api('/__mode', { failCreate: true }); const { ctx, page } = await fresh();
    await page.goto(`${APP}/migration/details/xero-to-myob/free`); await page.waitForURL(/customer-details\?flow=/);
    await fillDetails(page, { tracking: true }); await submitAndStart(page);
    await page.goto(`${APP}/`); await page.waitForTimeout(1000);
    check('[edge] failed creation lifts the lock (home reachable)', new URL(page.url()).pathname === '/', path(page));
    await ctx.close();
  }
  { // catalogue down on direct link: error screen, homepage escape
    await api('/__reset'); await api('/__mode', { down: true }); const { ctx, page } = await fresh();
    await page.goto(`${APP}/migration/details/qbo-to-myob/free`); await page.waitForTimeout(2500);
    check('[edge] API down: "Migration unavailable" with a way out', (await page.getByText('Migration unavailable').count()) === 1 && (await page.getByRole('link', { name: 'Go to homepage' }).count()) === 1);
    await api('/__mode', { down: false }); await page.getByRole('button', { name: 'Try again' }).click(); await page.waitForTimeout(2500);
    check('[edge] API back: Try again recovers into the flow', /customer-details\?flow=/.test(path(page)), path(page));
    await ctx.close();
  }
  { // unknown pair slug
    await api('/__reset'); const { ctx, page } = await fresh();
    await page.goto(`${APP}/migration/details/xero-to-nowhere/free`); await page.waitForTimeout(1500);
    check('[edge] unknown pair slug shows "Migration unavailable"', (await page.getByText('Migration unavailable').count()) === 1);
    await ctx.close();
  }
  await browser.close();
  const bad = results.filter((r) => !r.ok);
  console.log(`\n${results.length - bad.length}/${results.length} passed`); process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
