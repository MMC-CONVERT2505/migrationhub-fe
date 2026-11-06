const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const APP = process.env.APP_URL, API = process.env.API_URL;
let bad = 0; const check = (n, ok, x = '') => { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  -> ' + x : ''}`); };
const api = async (p) => (await fetch(API + p)).json();
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const tok = (roles) => `${b64({ alg: 'none' })}.${b64({ sub: 7, type: 'user', roles })}.sig`;
const session = (roles) => JSON.stringify({ state: { user: { accessToken: tok(roles), user: { id: 7, email: 'who@x.com', firstname: 'Who', lastname: 'Ever', roles } }, admin: { accessToken: null, user: null } }, version: 2 });
const word = { qbo: 'QuickBooks', xero: 'Xero', myob: 'MYOB' };
const REQUIRED = 'Phone number is required.';

async function toDetails(browser, who, slug) {
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  const roles = who === 'op' ? ['OP_TEAM'] : [];
  await ctx.addInitScript(([k, v]) => { if (!sessionStorage.getItem('e2e-seeded')) { sessionStorage.setItem(k, v); sessionStorage.setItem('e2e-seeded', '1'); } }, ['mmc-auth', session(roles)]);
  const [s, d] = slug.split('-to-').map((x) => word[x]);
  await page.goto(`${APP}/`);
  const card = page.locator('div.group').filter({ hasText: new RegExp(s + '.{1,20}' + d, 'i') }).first();
  await card.waitFor(); await card.click(); await page.getByText('Choose your migration plan').waitFor();
  await page.selectOption('#plan-country', { value: 'Australia' });
  // A paid pair needs a plan chosen before Continue enables; a free one has none to pick.
  if (await page.getByRole('radio').count()) await page.getByRole('radio').first().click();
  try {
    await page.getByRole('button', { name: 'Continue' }).click({ timeout: 8000 }); await page.waitForURL(/customer-details/);
  } catch (e) {
    console.log('DEBUG url=' + page.url() + ' buttons=' + JSON.stringify(await page.getByRole('button').allInnerTexts()) + ' radios=' + (await page.getByRole('radio').count()));
    throw e;
  }
  await page.waitForSelector('#name');
  return { ctx, page };
}
const submit = async (page) => { await page.getByRole('button', { name: /^Continue/ }).click(); await page.waitForTimeout(500); };
const fillRest = async (page, withEmail) => { await page.fill('#name', 'T U'); if (withEmail) await page.fill('#email', 't@example.com'); await page.fill('#entityName', 'T Pty'); await page.locator('input[name="trackingInventory"][value="false"]').check().catch(() => {}); };
const posts = async () => (await api('/__log')).filter((r) => r.m === 'POST' && r.u === '/inquiry-migrations');
const phoneLabel = (page) => page.locator('label[for="phone"]');

(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] });
  const errors = [];

  // ---------- Operation Team on QBO → Xero: phone is required
  await api('/__reset');
  { const { ctx, page } = await toDetails(browser, 'op', 'qbo-to-xero');
    page.on('pageerror', (e) => errors.push(e.message));
    check('[op QBO→Xero] phone box is live (not greyed out)', await page.locator('#phone').isEnabled() && await page.locator('#dialCode').isEnabled());
    check('[op QBO→Xero] label shows the required marker', (await phoneLabel(page).innerHTML()).includes('text-red-500'));
    check('[op QBO→Xero] no "Not required" placeholder', (await page.locator('#phone').getAttribute('placeholder')) !== 'Not required' && (await page.locator('#phone').getAttribute('aria-required')) === 'true');
    check('[op QBO→Xero] email stays locked to the shared team inbox', !(await page.locator('#email').isEnabled()) && (await page.locator('#email').inputValue()) === 'preeti@mmcconvert.com');
    await fillRest(page, false);
    await submit(page);
    check('[op QBO→Xero] blank phone: "Phone number is required." and stays on the form', (await page.getByText(REQUIRED).count()) === 1 && /customer-details/.test(page.url()));
    check('[op QBO→Xero] blank phone: nothing is sent to the server', (await posts()).length === 0);
    check('[op QBO→Xero] phone field flagged invalid for assistive tech', (await page.locator('#phone').getAttribute('aria-invalid')) === 'true');
    await page.fill('#phone', '   '); await submit(page);
    check('[op QBO→Xero] whitespace-only phone is treated as blank', (await page.getByText(REQUIRED).count()) === 1 && (await posts()).length === 0);
    await page.fill('#phone', '12'); await submit(page);
    check('[op QBO→Xero] malformed phone: "Enter a valid phone number."', (await page.getByText('Enter a valid phone number.').count()) === 1 && (await posts()).length === 0);
    await page.fill('#phone', '412 345 678'); await page.locator('#phone').blur();
    check('[op QBO→Xero] the error clears once the phone is valid', (await page.getByText('Enter a valid phone number.').count()) === 0 && (await page.getByText(REQUIRED).count()) === 0);
    await submit(page); await page.waitForURL(/\/payment/, { timeout: 8000 }).catch(() => {});
    const sent = await posts();
    check('[op QBO→Xero] valid phone: the form proceeds', /\/payment/.test(page.url()), page.url());
    check('[op QBO→Xero] sent exactly one inquiry with dial code + phone and the shared inbox', sent.length === 1 && sent[0].body.phone === '+61412345678' && sent[0].body.email === 'preeti@mmcconvert.com', JSON.stringify(sent[0] && sent[0].body));
    await ctx.close(); }

  // ---------- Operation Team on every other pair: unchanged (phone locked, not required)
  for (const slug of ['xero-to-qbo', 'qbo-to-myob', 'xero-to-myob']) {
    await api('/__reset');
    const { ctx, page } = await toDetails(browser, 'op', slug);
    page.on('pageerror', (e) => errors.push(e.message));
    check(`[op ${slug}] phone stays locked with "Not required"`, !(await page.locator('#phone').isEnabled()) && (await page.locator('#phone').getAttribute('placeholder')) === 'Not required' && !(await phoneLabel(page).innerHTML()).includes('text-red-500'));
    await fillRest(page, false); await submit(page); await page.waitForURL(/\/payment/, { timeout: 8000 }).catch(() => {});
    const sent = await posts();
    check(`[op ${slug}] still continues with no phone`, /\/payment/.test(page.url()) && sent.length === 1 && !sent[0].body.phone, JSON.stringify(sent[0] && sent[0].body));
    await ctx.close();
  }

  // ---------- Customers: unchanged (phone required everywhere)
  for (const slug of ['qbo-to-xero', 'xero-to-myob']) {
    await api('/__reset');
    const { ctx, page } = await toDetails(browser, 'customer', slug);
    page.on('pageerror', (e) => errors.push(e.message));
    check(`[customer ${slug}] phone box is live and required`, await page.locator('#phone').isEnabled() && (await phoneLabel(page).innerHTML()).includes('text-red-500'));
    await fillRest(page, true); await submit(page);
    check(`[customer ${slug}] blank phone still says "Phone number is required."`, (await page.getByText(REQUIRED).count()) === 1 && (await posts()).length === 0);
    await page.fill('#phone', '412345678'); await submit(page); await page.waitForURL(/\/payment/, { timeout: 8000 }).catch(() => {});
    const sent = await posts();
    check(`[customer ${slug}] valid phone proceeds with their own email`, /\/payment/.test(page.url()) && sent.length === 1 && sent[0].body.email === 't@example.com' && sent[0].body.phone === '+61412345678', JSON.stringify(sent[0] && sent[0].body));
    await ctx.close();
  }

  check('no uncaught page errors in any scenario', errors.length === 0, errors.join(' | '));
  await browser.close(); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('ERROR ' + (e && e.stack || e)); process.exit(2); });
