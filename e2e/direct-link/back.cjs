const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const APP = process.env.APP_URL || 'http://127.0.0.1:14173', API = process.env.API_URL || 'http://127.0.0.1:19001';
const launch = () => chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] });
const api = async (p, body) => (await fetch(API + p, body ? { method: 'POST', body: JSON.stringify(body) } : {})).json();
let bad = 0; const check = (n, ok, x = '') => { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  -> ' + x : ''}`); };
const back = (page) => page.getByRole('button', { name: 'Back', exact: true }).count();
const word = { qbo: 'QuickBooks', xero: 'Xero', myob: 'MYOB', reckon: 'Reckon' };
async function fill(page) { await page.waitForSelector('#name'); await page.fill('#name', 'T U'); await page.fill('#email', 't@example.com'); await page.fill('#phone', '412345678'); await page.fill('#entityName', 'T Pty'); if (await page.locator('input[name="trackingInventory"]').count()) await page.locator('input[name="trackingInventory"][value="false"]').check(); }
(async () => {
  const browser = await launch();
  for (const slug of ['xero-to-myob', 'qbo-to-myob', 'xero-to-reckon']) {
    // direct link: no Back on details, and after a reload (session restored)
    await api('/__reset'); let ctx = await browser.newContext(); let page = await ctx.newPage();
    await page.goto(`${APP}/migration/details/${slug}/free`); await page.waitForURL(/customer-details\?flow=/); await page.waitForSelector('#name');
    check(`[direct ${slug}] details page has NO Back button`, (await back(page)) === 0);
    check(`[direct ${slug}] logo/stepper still present (layout intact)`, (await page.getByText('Migration Information').count()) === 1);
    await page.reload(); await page.waitForSelector('#name');
    check(`[direct ${slug}] still no Back after reload`, (await back(page)) === 0);
    // success/summary stage during the countdown
    await fill(page); await page.getByRole('button', { name: /^Continue/ }).click(); await page.waitForURL(/\/payment\/success/);
    check(`[direct ${slug}] no Back on the summary step before the migration starts`, (await back(page)) === 0);
    await ctx.close();
    // failed creation lifts the lock => Back is available again
    await api('/__reset'); await api('/__mode', { failCreate: true }); ctx = await browser.newContext(); page = await ctx.newPage();
    await page.goto(`${APP}/migration/details/${slug}/free`); await page.waitForURL(/customer-details\?flow=/); await fill(page);
    await page.getByRole('button', { name: /^Continue/ }).click(); await page.waitForURL(/\/payment\/success/);
    await page.waitForResponse((r) => r.url().endsWith('/migrations') && r.request().method() === 'POST', { timeout: 15000 }); await page.waitForTimeout(800);
    check(`[direct ${slug}] after a failed start the lock lifts and Back returns`, (await back(page)) === 1);
    await ctx.close();
    // home flow: Back on plan and on details, and it works
    await api('/__reset'); ctx = await browser.newContext(); page = await ctx.newPage();
    const [s, d] = slug.split('-to-').map((x) => word[x]);
    await page.goto(`${APP}/`); const card = page.locator('div.group').filter({ hasText: new RegExp(s + '.{1,20}' + d, 'i') }).first(); await card.waitFor(); await card.click();
    await page.getByText('Choose your migration plan').waitFor();
    check(`[home ${slug}] plan page HAS a Back button`, (await back(page)) === 1);
    await page.selectOption('#plan-country', { value: 'Australia' }); await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForSelector('#name');
    check(`[home ${slug}] details page HAS a Back button`, (await back(page)) === 1);
    await page.getByRole('button', { name: 'Back', exact: true }).click(); await page.waitForTimeout(800);
    check(`[home ${slug}] Back returns to the plan page`, /\/plan$/.test(new URL(page.url()).pathname), new URL(page.url()).pathname);
    await ctx.close();
  }
  { // a normal pair via deep link keeps its Back button
    await api('/__reset'); const ctx = await browser.newContext(); const page = await ctx.newPage();
    await page.goto(`${APP}/migration/details/xero-to-qbo/free`); await page.getByText('Choose your migration plan').waitFor();
    check('[direct non-dedicated xero-to-qbo] keeps its Back button', (await back(page)) === 1); await ctx.close();
  }
  { // abandoned direct-link flow in the tab, then a normal home-page visit is impossible (locked) - confirm lock still holds & Back stays hidden
    await api('/__reset'); const ctx = await browser.newContext(); const page = await ctx.newPage();
    await page.goto(`${APP}/migration/details/qbo-to-myob/free`); await page.waitForURL(/customer-details\?flow=/);
    await page.goto(`${APP}/migration/xero-to-qbo/plan`); await page.waitForTimeout(1200); await page.waitForSelector('#name');
    check('[edge] another pair URL inside the flow lands on details with NO Back', (await back(page)) === 0 && /customer-details/.test(page.url()));
    await ctx.close();
  }
  await browser.close(); console.log(bad ? `${bad} FAILED` : 'ALL PASSED'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
