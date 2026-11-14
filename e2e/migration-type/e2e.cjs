// "Type of Data Migration" (Payroll With Transaction / Transaction) on the Xero -> QuickBooks Online customer form, and its
// absence on every other pair. Real browser against the local mock API (e2e/direct-link/mock-api.cjs): no database.
//   PLAYWRIGHT_PATH=... CHROME_PATH=/usr/bin/google-chrome bash e2e/migration-type/run.sh
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const APP = process.env.APP_URL || 'http://127.0.0.1:14174', API = process.env.API_URL || 'http://127.0.0.1:19002';
let fails = 0; const check = (n, ok, d = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${n}${ok ? '' : '  -> ' + d}`); if (!ok) fails++; };
const api = async (p, body) => (await fetch(API + p, body ? { method: 'POST', body: JSON.stringify(body) } : {})).json();
const inquiries = async (m = 'POST') => (await api('/__log')).filter((r) => r.m === m && r.u.startsWith('/inquiry-migrations'));
const LABEL = 'Type of Data Migration';
const PAIRS = ['xero-to-qbo', 'qbo-to-xero', 'xero-to-myob', 'qbo-to-myob', 'xero-to-reckon', 'tally-to-zoho', 'qbo-to-freshbooks', 'myob-to-qbo', 'xero-to-prosaic'];

(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] });
  const errors = [];
  const open = async (vp = { width: 1280, height: 1000 }) => { const ctx = await browser.newContext({ viewport: vp }); const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(String(e))); return { ctx, page }; };
  /** plan step (when the pair has one) then the customer-details form */
  const toDetails = async (page, slug, country = 'Australia') => {
    await page.goto(`${APP}/migration/${slug}/plan`, { waitUntil: 'networkidle' });
    if (/\/plan/.test(page.url())) {
      const sel = page.locator('#plan-country');
      if (await sel.count()) await sel.selectOption({ label: country }).catch(async () => sel.selectOption({ index: 1 }));
      await page.waitForTimeout(400);
      const radio = page.locator('input[type=radio]').first(); if (await radio.count()) await radio.check().catch(() => {});
      await page.getByRole('button', { name: /^Continue/ }).click();
    }
    await page.waitForURL(/customer-details/, { timeout: 10000 }); await page.waitForSelector('#name');
  };
  const fill = async (page) => {
    await page.fill('#name', 'Test User'); await page.fill('#email', 'test@example.com'); await page.fill('#phone', '412345678'); await page.fill('#entityName', 'Test Pty Ltd');
    const inv = page.locator('input[name="trackingInventory"][value="false"]'); if (await inv.count()) await inv.check();
  };
  const submit = async (page) => { await page.getByRole('button', { name: /^Continue/ }).click(); await page.waitForURL(/\/payment/, { timeout: 12000 }); await page.waitForTimeout(500); };

  // ── 1. Xero → QBO: the dropdown is back, labelled, with exactly the two options, default Payroll With Transaction
  { await api('/__reset'); const { ctx, page } = await open(); await toDetails(page, 'xero-to-qbo');
    const dd = page.getByLabel(LABEL);
    check('Xero → QBO: the "Type of Data Migration" dropdown is on the form, found by its label', (await dd.count()) === 1);
    check('it is marked required with a visible asterisk', (await dd.getAttribute('required')) !== null && /\*/.test(await page.locator('label[for="transactionPlan"]').innerText()));
    const opts = await dd.locator('option').evaluateAll((o) => o.map((x) => [x.value, x.textContent.trim()]));
    check('it offers exactly Payroll With Transaction and Transaction', JSON.stringify(opts) === JSON.stringify([['PayrollWithTransaction', 'Payroll With Transaction'], ['Transaction', 'Transaction']]), JSON.stringify(opts));
    check('Payroll With Transaction is preselected, as before', (await dd.inputValue()) === 'PayrollWithTransaction');
    check('it has a hint wired to it for screen readers', (await dd.getAttribute('aria-describedby')) === 'transactionPlan-hint' && (await page.locator('#transactionPlan-hint').count()) === 1);
    await fill(page); await submit(page);
    const b = (await inquiries())[0].body;
    check('untouched, the default (PayrollWithTransaction) is sent with the inquiry', b.transactionPlan === 'PayrollWithTransaction' && b.migrationPairId === 'pair-xero-qbo', JSON.stringify(b));
    await ctx.close(); }

  // ── 2. choosing Transaction is what gets sent
  { await api('/__reset'); const { ctx, page } = await open(); await toDetails(page, 'xero-to-qbo');
    await page.getByLabel(LABEL).selectOption('Transaction'); await fill(page); await submit(page);
    const b = (await inquiries())[0].body;
    check('choosing Transaction sends Transaction', b.transactionPlan === 'Transaction', JSON.stringify(b));
    // edit: come back to the form; the choice is remembered and can be changed (PATCH)
    await page.goBack().catch(() => {}); await page.waitForTimeout(500);
    if (!/customer-details/.test(page.url())) await page.goto(`${APP}/migration/xero-to-qbo/customer-details`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#name');
    check('coming back to edit, the earlier choice (Transaction) is still selected', (await page.getByLabel(LABEL).inputValue()) === 'Transaction', await page.getByLabel(LABEL).inputValue());
    await page.getByLabel(LABEL).selectOption('PayrollWithTransaction'); await submit(page);
    const patch = (await inquiries('PATCH')).at(-1);
    check('editing and changing it back sends the new value on the update', patch && patch.body.transactionPlan === 'PayrollWithTransaction', JSON.stringify(patch && patch.body));
    await ctx.close(); }

  // ── 3. both variants of this pair: free countries and paid countries
  for (const [country, variant] of [['Australia', 'free (Australia)'], ['United Kingdom', 'paid (United Kingdom)']]) {
    await api('/__reset'); const { ctx, page } = await open(); await toDetails(page, 'xero-to-qbo', country);
    check(`Xero → QBO ${variant}: dropdown present`, (await page.getByLabel(LABEL).count()) === 1);
    const cta = (await page.getByRole('button', { name: /^Continue/ }).innerText()).trim();
    await page.getByLabel(LABEL).selectOption('Transaction'); await fill(page); await submit(page);
    const b = (await inquiries())[0].body;
    check(`Xero → QBO ${variant}: Transaction is sent ("${cta}")`, b.transactionPlan === 'Transaction', JSON.stringify(b));
    await ctx.close(); }

  // ── 4. every OTHER pair: no dropdown, nothing sent
  for (const slug of PAIRS.filter((s) => s !== 'xero-to-qbo')) {
    await api('/__reset'); const { ctx, page } = await open();
    try {
      await toDetails(page, slug); await fill(page);
      const present = await page.getByLabel(LABEL).count();
      await submit(page);
      const log = await inquiries(); const b = log[0] && log[0].body;
      check(`${slug}: no dropdown, and no transactionPlan sent`, present === 0 && b && !('transactionPlan' in b), `dropdown=${present} body=${JSON.stringify(b)}`);
    } catch (e) { check(`${slug}: reached the form and submitted`, false, String(e).slice(0, 120)); }
    await ctx.close();
  }

  // ── 5. the plan-step round trip keeps the choice; a corrupted draft cannot break the form
  { await api('/__reset'); const { ctx, page } = await open(); await toDetails(page, 'xero-to-qbo');
    await page.getByLabel(LABEL).selectOption('Transaction'); await page.fill('#name', 'Keep Me');
    const change = page.getByRole('link', { name: 'Change' }); if (await change.count()) { await change.first().click(); await page.waitForURL(/\/plan/); await page.getByRole('button', { name: /^Continue/ }).click(); await page.waitForURL(/customer-details/); await page.waitForSelector('#name'); }
    check('after visiting the plan step and returning, the chosen type is kept (with the typed name)', (await page.getByLabel(LABEL).inputValue()) === 'Transaction' && (await page.inputValue('#name')) === 'Keep Me', `${await page.getByLabel(LABEL).inputValue()} / ${await page.inputValue('#name')}`);
    await ctx.close(); }
  { await api('/__reset'); const { ctx, page } = await open(); await toDetails(page, 'xero-to-qbo');
    // plant a draft with an invalid migration type under the real pair id, then reload the form
    const pid = 'pair-xero-qbo';
    await page.evaluate((id) => sessionStorage.setItem(`mmc-details-draft:${id}`, JSON.stringify({ name: 'Drafty', email: '', phone: '', entityName: '', transactionPlan: 'garbage<script>' })), pid);
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('#name').catch(() => {});
    const val = await page.getByLabel(LABEL).inputValue().catch(() => 'MISSING');
    check('a corrupted saved draft falls back to the default instead of an invalid value', val === 'PayrollWithTransaction', val);
    await fill(page); await submit(page);
    const b = (await inquiries())[0].body;
    check('and what is sent is still valid', b.transactionPlan === 'PayrollWithTransaction', JSON.stringify(b));
    await ctx.close(); }

  // ── 6. phones and keyboard
  { await api('/__reset'); const { ctx, page } = await open({ width: 390, height: 800 }); await toDetails(page, 'xero-to-qbo');
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check('390px: the form does not scroll sideways with the dropdown', over <= 0, String(over));
    const box = await page.getByLabel(LABEL).boundingBox();
    check('390px: the dropdown fits inside the screen and is tap-sized', box.x >= 0 && box.x + box.width <= 390 && box.height >= 36, JSON.stringify(box));
    await page.getByLabel(LABEL).focus(); await page.keyboard.press('ArrowDown');
    check('keyboard: arrow keys change the value', (await page.getByLabel(LABEL).inputValue()) === 'Transaction');
    await ctx.close(); }

  check('no uncaught page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await browser.close(); console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})();
