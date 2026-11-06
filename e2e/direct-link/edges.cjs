const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const APP = process.env.APP_URL || 'http://127.0.0.1:14173', API = process.env.API_URL || 'http://127.0.0.1:19001';
const launch = () => chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] });
const api = async (p, body) => (await fetch(API + p, body ? { method: 'POST', body: JSON.stringify(body) } : {})).json();
let bad = 0; const check = (n, ok, x = '') => { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  -> ' + x : ''}`); };
const back = (page) => page.getByRole('button', { name: 'Back', exact: true }).count();
const at = (page) => new URL(page.url()).pathname + new URL(page.url()).search;
const planHeading = (page) => page.getByText('Choose your migration plan');
(async () => {
  const browser = await launch();
  const fresh = async () => { const ctx = await browser.newContext(); return { ctx, page: await ctx.newPage() }; };

  // A website deep link to a NORMAL pair, in a tab that holds a direct-link flow: it replaces the flow (no wrong pair).
  for (const held of ['xero-to-reckon', 'xero-to-myob', 'qbo-to-myob']) for (const next of ['xero-to-qbo', 'qbo-to-xero', 'myob-to-qbo']) {
    await api('/__reset'); const { ctx, page } = await fresh();
    await page.goto(`${APP}/migration/details/${held}/free`); await page.waitForURL(/customer-details\?flow=/);
    await page.goto(`${APP}/migration/details/${next}/free`); await planHeading(page).waitFor({ timeout: 8000 }).catch(() => {});
    const body = await page.locator('body').innerText();
    check(`[replace] ${held} flow held, deep link to ${next} shows ${next}'s plan page (not the old form)`, (await planHeading(page).count()) === 1 && !/flow=/.test(page.url()) && !/Migration Information/.test(body), at(page));
    check(`[replace] ... the old flow is cleared: Back is shown and home is the normal locked entry`, (await back(page)) === 1);
    await ctx.close();
  }

  // Resume: opening the same deep link again keeps the same flow (same token), it does not mint a new one.
  for (const slug of ['xero-to-myob', 'qbo-to-myob']) {
    await api('/__reset'); const { ctx, page } = await fresh();
    await page.goto(`${APP}/migration/details/${slug}/free`); await page.waitForURL(/customer-details\?flow=/);
    const t1 = new URL(page.url()).searchParams.get('flow');
    await page.goto(`${APP}/migration/details/${slug}/free`); await page.waitForURL(/customer-details\?flow=/); await page.waitForSelector('#name');
    check(`[resume] ${slug} same link again keeps the same flow token`, new URL(page.url()).searchParams.get('flow') === t1, at(page));
    await ctx.close();
  }

  // Dedicated pair whose Free plan is missing: the plan step stays, inside the flow, with no Back, and Continue keeps the token.
  for (const slug of ['xero-to-myob', 'qbo-to-myob']) {
    await api('/__reset'); await api('/__mode', { noFree: true }); const { ctx, page } = await fresh();
    await page.goto(`${APP}/migration/details/${slug}/free`); await planHeading(page).waitFor({ timeout: 8000 }).catch(() => {});
    check(`[no free plan] ${slug} shows the plan page (nothing to take for the person), no Back`, (await planHeading(page).count()) === 1 && (await back(page)) === 0, at(page));
    await page.selectOption('#plan-country', { value: 'Australia' }).catch(() => {});
    await page.locator('input[type="radio"]').first().check(); // a paid Basic plan: the person must choose it
    await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForURL(/customer-details/);
    check(`[no free plan] ${slug} Continue goes to details carrying the flow token, still no Back`, /customer-details\?flow=/.test(at(page)) && (await back(page)) === 0, at(page));
    await ctx.close();
  }
  await api('/__reset');

  // Small screens keep the same rule.
  { await api('/__reset'); const ctx = await browser.newContext({ viewport: { width: 375, height: 700 } }); const page = await ctx.newPage();
    await page.goto(`${APP}/migration/details/qbo-to-myob/free`); await page.waitForSelector('#name');
    check('[mobile 375px] direct link: no Back, form usable', (await back(page)) === 0 && (await page.locator('#name').isVisible()));
    await ctx.close(); }

  await browser.close(); console.log(bad ? `${bad} FAILED` : 'ALL PASSED'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
