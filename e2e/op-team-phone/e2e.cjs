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
  // 'anon' is a visitor nobody has signed in.
  if (who !== 'anon') await ctx.addInitScript(([k, v]) => { if (!sessionStorage.getItem('e2e-seeded')) { sessionStorage.setItem(k, v); sessionStorage.setItem('e2e-seeded', '1'); } }, ['mmc-auth', session(roles)]);
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

  // ---------- Xero -> Reckon (the website deep-link pair): an Operation Team member can sign in inside the flow
  const DEEP = '/migration/details/xero-to-reckon/true';
  const deepLink = async (who) => {
    const ctx = await browser.newContext(); const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push('reckon: ' + e.message));
    if (who) await ctx.addInitScript(([k, v]) => { if (!sessionStorage.getItem('e2e-seeded')) { sessionStorage.setItem(k, v); sessionStorage.setItem('e2e-seeded', '1'); } }, ['mmc-auth', session(who === 'op' ? ['OP_TEAM'] : [])]);
    await page.goto(APP + DEEP); await page.waitForTimeout(2000);
    if (await page.getByRole('button', { name: 'Continue' }).count()) { const r = page.getByRole('radio'); if (await r.count()) await r.first().click().catch(() => {}); await page.selectOption('#plan-country', { value: 'Australia' }).catch(() => {}); await page.getByRole('button', { name: 'Continue' }).click(); }
    await page.waitForURL(/customer-details/, { timeout: 15000 }); await page.waitForSelector('#name');
    return { ctx, page };
  };
  const prompt = (page) => page.getByText('Operation Team member?');
  await api('/__reset');
  { const { ctx, page } = await deepLink(null);
    check('[reckon deep link, fresh tab] a signed-out visitor sees "Operation Team member? Sign in"', (await prompt(page).count()) === 1 && (await page.locator('main a', { hasText: 'Sign in' }).count()) === 1);
    check('[reckon deep link, fresh tab] a customer still gets the normal form: phone live and required', await page.locator('#phone').isEnabled() && (await page.locator('label[for="phone"]').innerHTML()).includes('text-red-500'));
    await fillRest(page, true); await submit(page);
    check('[reckon deep link, fresh tab] and a customer who leaves the phone blank still gets "Phone number is required."', (await page.getByText(REQUIRED).count()) === 1 && (await posts()).length === 0);
    const before = page.url(); const token = new URL(before).searchParams.get('flow');
    await page.locator('main a', { hasText: 'Sign in' }).click(); await page.waitForURL(/\/sign-in/);
    const next = new URL(page.url()).searchParams.get('next');
    check('[reckon sign-in] goes to Sign in carrying the way back (this same step, flow token included)', next === `/migration/xero-to-reckon/customer-details?flow=${token}`, String(next));
    await page.fill('#email', 'op@x.com'); await page.fill('#password', 'whatever'); await page.getByRole('button', { name: /^Sign in/ }).first().click();
    await page.waitForURL((u) => u.pathname === '/migration/xero-to-reckon/customer-details', { timeout: 15000 });
    check('[reckon sign-in] after signing in it lands back on the same step, flow intact (not bounced)', page.url() === before, page.url().replace(APP, ''));
    await page.waitForSelector('#name');
    check('[reckon as Operation Team] the "Sign in" prompt is gone', (await prompt(page).count()) === 0);
    check('[reckon as Operation Team] phone is locked and "Not required"; email is the shared inbox', !(await page.locator('#phone').isEnabled()) && (await page.locator('#phone').getAttribute('placeholder')) === 'Not required' && !(await page.locator('label[for="phone"]').innerHTML()).includes('text-red-500') && (await page.locator('#email').inputValue()) === 'preeti@mmcconvert.com');
    await fillRest(page, false); await submit(page); await page.waitForURL(/\/payment/, { timeout: 8000 }).catch(() => {});
    const sent = await posts();
    check('[reckon as Operation Team] NO "Phone number is required." - continues, and no phone is sent', (await page.getByText(REQUIRED).count()) === 0 && /\/payment/.test(page.url()) && sent.length === 1 && !sent[0].body.phone && sent[0].body.email === 'preeti@mmcconvert.com', JSON.stringify(sent[0] && sent[0].body));
    await ctx.close(); }
  await api('/__reset');
  { const { ctx, page } = await deepLink('op');
    check('[reckon deep link, already signed in as Operation Team] no prompt, phone optional', (await prompt(page).count()) === 0 && !(await page.locator('#phone').isEnabled()));
    await ctx.close(); }
  { const { ctx, page } = await deepLink('customer');
    check('[reckon deep link, signed in as a customer] no prompt, phone required as always', (await prompt(page).count()) === 0 && await page.locator('#phone').isEnabled());
    await ctx.close(); }
  { // a customer who signs in through the link is NOT treated as the team
    const { ctx, page } = await deepLink(null);
    await page.locator('main a', { hasText: 'Sign in' }).click(); await page.waitForURL(/\/sign-in/);
    await page.fill('#email', 'cust@x.com'); await page.fill('#password', 'whatever'); await page.getByRole('button', { name: /^Sign in/ }).first().click();
    await page.waitForURL((u) => u.pathname === '/migration/xero-to-reckon/customer-details', { timeout: 15000 }); await page.waitForSelector('#name');
    check('[reckon sign-in as a customer] still a customer: phone live and required, email editable', await page.locator('#phone').isEnabled() && await page.locator('#email').isEnabled() && (await prompt(page).count()) === 0);
    await ctx.close(); }
  // Everywhere else the prompt must NOT appear: other pairs, and Reckon entered from the Hub home page (not the deep link).
  for (const slug of ['qbo-to-xero', 'xero-to-myob']) {
    const { ctx, page } = await toDetails(browser, 'anon', slug).catch(() => ({}));
    if (!page) continue;
    check(`[no prompt] ${slug} entered from the Hub home page shows no "Operation Team? Sign in"`, (await prompt(page).count()) === 0);
    await ctx.close();
  }
  { const ctx = await browser.newContext(); const page = await ctx.newPage();
    await page.goto(APP + '/'); const card = page.locator('div.group').filter({ hasText: /Xero.{1,20}Reckon/i }).first(); await card.waitFor(); await card.click();
    await page.getByText('Choose your migration plan').waitFor(); await page.selectOption('#plan-country', { value: 'Australia' }); const r = page.getByRole('radio'); if (await r.count()) await r.first().click(); await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForURL(/customer-details/); await page.waitForSelector('#name');
    check('[no prompt] Reckon entered from the Hub home page (normal flow, not the deep link) shows no prompt', (await prompt(page).count()) === 0);
    await ctx.close(); }

  check('no uncaught page errors in any scenario', errors.length === 0, errors.join(' | '));
  await browser.close(); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('ERROR ' + (e && e.stack || e)); process.exit(2); });
