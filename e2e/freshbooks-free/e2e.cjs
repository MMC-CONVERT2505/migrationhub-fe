const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const APP = process.env.APP_URL;
let bad = 0; const check = (n, ok, x = '') => { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  -> ' + x : ''}`); };
const card = (page, re) => page.locator('#pairs div.group').filter({ hasText: re }).first();
const opts = (page, sel) => page.locator(`${sel} option`).evaluateAll((o) => o.map((x) => x.value).filter(Boolean));

(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] });
  const errors = [];
  const open = async (path, vp = { width: 1366, height: 800 }, seed) => { const ctx = await browser.newContext({ viewport: vp, timezoneId: 'Australia/Melbourne', locale: 'en-AU' }); if (seed) await ctx.addInitScript(seed); const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(`${path}: ${e.message}`)); await page.goto(APP + path); await page.waitForLoadState('networkidle'); return { ctx, page }; };

  // ---- Homepage card: plainly free, like the other free tools
  { const { ctx, page } = await open('/');
    const fb = card(page, /QuickBooks.*FreshBooks|FreshBooks/i); await fb.waitFor();
    const t = (await fb.innerText()).replace(/\s+/g, ' ');
    check('[card] QBO to FreshBooks shows "Free" and "Start free"', /Free/.test(t) && /Start free/.test(t), t);
    check('[card] none of "Free in ...", "Paid elsewhere", "Check your region" is left', !/Free in|Paid elsewhere|Check your region/.test(t), t);
    const prosaic = (await card(page, /Prosaic/i).innerText()).replace(/\s+/g, ' ');
    check('[card] it reads the same as another free tool (Xero to Prosaic)', /Start free/.test(prosaic) && /Free/.test(prosaic) && !/Check your region/.test(prosaic), prosaic);
    const qx = (await card(page, /Xero\s*$|QuickBooks.*Xero/i).innerText()).replace(/\s+/g, ' ');
    const regions = await page.locator('#pairs div.group', { hasText: 'Check your region' }).count();
    check('[card] other pairs are unchanged (the one remaining region-based pair, Xero to QBO, still says "Check your region")', regions === 1, `region cards=${regions}`);
    check('[card] the Free / Region-based / Paid filter tabs are gone from the section', (await page.locator('#pairs button', { hasText: /^(All tools|Free|Region-based|Paid)/ }).count()) === 0);
    await ctx.close(); }

  // ---- Plan page: only the United States and Canada
  { const { ctx, page } = await open('/');
    await card(page, /FreshBooks/i).click(); await page.waitForURL(/\/migration\/qbo-to-freshbooks\//, { timeout: 15000 });
    await page.waitForTimeout(1500);
    const url = new URL(page.url()).pathname;
    const sel = (await page.locator('#plan-country').count()) ? '#plan-country' : null;
    const list = sel ? await opts(page, sel) : [];
    check('[plan page] the country list has exactly the United States and Canada', JSON.stringify([...list].sort()) === JSON.stringify(['Canada', 'United States']), `${url} -> ${JSON.stringify(list)}`);
    check('[plan page] no other country is offered (Australia, India, UK, ...)', !list.some((c) => /Australia|India|Kingdom|Zealand|Singapore|Emirates|Africa/.test(c)));
    check('[plan page] nothing outside the list can be selected (starts on the "Select your country" prompt, as on every priced pair)', sel && ['', 'United States', 'Canada'].includes(await page.locator(sel).inputValue()));
    await page.selectOption('#plan-country', 'Canada'); await page.waitForTimeout(600);
    const txt = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    check('[plan page] choosing Canada shows the Basic plan as free', /Basic/.test(txt) && /Free|\$0|A\$0/.test(txt) && !/A\$|£|₹/.test(txt), txt.slice(txt.indexOf('Choose your migration plan'), txt.indexOf('Choose your migration plan') + 260));
    check('[plan page] Continue is available once a country is chosen', await page.getByRole('button', { name: 'Continue' }).isEnabled());
    await ctx.close(); }

  // ---- A visitor who had chosen Australia elsewhere is moved to a valid country, not left on one that is not sold
  { const seed = () => { try { sessionStorage.setItem('mmc-app', JSON.stringify({ state: { selectedCountry: 'Australia' }, version: 0 })); } catch {} };
    const { ctx, page } = await open('/');
    await page.evaluate(() => { const el = document.querySelector('#pricing-country'); });
    // choose Australia in the homepage pricing selector (this is how a visitor's choice reaches the store)
    await page.locator('#pricing-country').selectOption('Australia').catch(() => {});
    await card(page, /FreshBooks/i).click(); await page.waitForURL(/\/migration\/qbo-to-freshbooks\//, { timeout: 15000 }); await page.waitForTimeout(1500);
    const c = (await page.locator('#plan-country').count()) ? await page.locator('#plan-country').inputValue() : '(none)';
    check('[stale country] Australia chosen on the homepage is NOT carried onto FreshBooks (empty prompt or a sold country)', ['', 'United States', 'Canada'].includes(c), c);
    const body = await page.locator('body').innerText();
    check('[stale country] the page shows no price or error for Australia', !/Australia|A\$/.test(body) && !/Migration unavailable/.test(body));
    await ctx.close(); }

  // ---- The flow still works: details page offers only these countries too
  { const { ctx, page } = await open('/');
    await card(page, /FreshBooks/i).click(); await page.waitForURL(/\/migration\/qbo-to-freshbooks\//); await page.waitForTimeout(1200);
    await page.selectOption('#plan-country', 'United States').catch(() => {}); await page.waitForTimeout(500);
    const r = page.getByRole('radio'); if (await r.count()) await r.first().click();
    await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForURL(/customer-details/, { timeout: 15000 }); await page.waitForSelector('#name');
    const cs = await opts(page, '#country');
    check('[details] the country field on the details page offers only the United States and Canada (or is fixed to one)', cs.length === 0 ? true : cs.every((c) => /United States|Canada/.test(c)), JSON.stringify(cs));
    const val = await page.locator('#country').evaluate((e) => e.value || e.textContent).catch(() => '');
    check('[details] and the chosen country is one of them', /United States|Canada/.test(String(val)), String(val));
    await ctx.close(); }

  // ---- The whole journey is a free one: no payment step, and the migration is created without a payment
  for (const country of ['Canada', 'United States']) {
    await fetch(process.env.API_URL + '/__reset');
    const { ctx, page } = await open('/');
    await card(page, /FreshBooks/i).click(); await page.waitForURL(/\/migration\/qbo-to-freshbooks\//); await page.waitForTimeout(1200);
    await page.selectOption('#plan-country', country); await page.waitForTimeout(500);
    const planText = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    const priceTag = (await page.getByRole('radio').first().locator('xpath=ancestor::*[self::label or self::div][1]').innerText().catch(() => '')).replace(/\s+/g, ' ');
    check(`[free flow ${country}] the plan step says the migration is free and the Basic plan is priced "Free"`, /This migration is free/.test(planText) && /Basic[^]*\bFree\b/.test(planText) && !/[A$£₹]\s?\d{2,}\b(?![^]*Historical years)/.test((planText.split('Migration plans')[1] || '').split('Historical years')[0]), (planText.split('Migration plans')[1] || '').slice(0, 120));
    const r = page.getByRole('radio'); if (await r.count()) await r.first().click();
    await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForURL(/customer-details/, { timeout: 15000 }); await page.waitForSelector('#name');
    await page.fill('#name', 'Fran Fresh'); await page.fill('#email', 'fran@fresh.co'); await page.fill('#phone', country === 'Canada' ? '4165550123' : '2125550123'); await page.fill('#entityName', 'Fresh Books Ltd');
    const created = page.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/migrations', { timeout: 30000 }).catch(() => null);
    await page.getByRole('button', { name: /^Continue/ }).click();
    await page.waitForURL(/\/payment\/success/, { timeout: 15000 }).catch(() => {});
    check(`[free flow ${country}] after the details it goes straight to the success page: no payment page in between`, /\/payment\/success/.test(page.url()) && !/\/payment($|\?)/.test(new URL(page.url()).pathname), page.url().replace(/^https?:\/\/[^/]+/, ''));
    const resp = await created;
    check(`[free flow ${country}] the migration is created automatically (the server accepted it)`, !!resp && resp.status() < 300, resp ? String(resp.status()) : 'no request');
    await page.waitForTimeout(500);
    const log = await (await fetch(process.env.API_URL + '/__log')).json();
    const create = log.filter((x) => x.m === 'POST' && x.u === '/migrations');
    check(`[free flow ${country}] the migration is created once, for this pair, with no payment attached`, create.length === 1 && create[0].body.migrationPairId === 'pair-qbo-freshbooks' && !create[0].body.paymentId, JSON.stringify(create[0] && create[0].body));
    const inq = log.filter((x) => x.m === 'POST' && x.u === '/inquiry-migrations');
    check(`[free flow ${country}] the details were saved for this pair and country`, inq.length === 1 && inq[0].body.migrationPairId === 'pair-qbo-freshbooks' && new RegExp(country).test(inq[0].body.country), JSON.stringify(inq[0] && { pair: inq[0].body.migrationPairId, country: inq[0].body.country }));
    check(`[free flow ${country}] no payment request was ever made`, !log.some((x) => /payment|razorpay/i.test(x.u)));
    await ctx.close();
  }

  // ---- Every other pair keeps its country list
  { const { ctx, page } = await open('/');
    await card(page, /Reckon/i).click(); await page.waitForURL(/xero-to-reckon\/plan/); await page.waitForTimeout(1200);
    const rl = (await page.locator('#plan-country').count()) ? await opts(page, '#plan-country') : [];
    check('[other pairs] Xero to Reckon still offers Australia and New Zealand only', JSON.stringify([...rl].sort()) === JSON.stringify(['Australia', 'New Zealand']), JSON.stringify(rl));
    await ctx.close(); }
  { const { ctx, page } = await open('/migration/qbo-to-xero/plan'); await page.waitForTimeout(1500);
    const xl = await opts(page, '#plan-country');
    check('[other pairs] QBO to Xero still offers all nine countries', xl.length === 9, String(xl.length));
    await ctx.close(); }
  { const { ctx, page } = await open('/');
    const all = await opts(page, '#pricing-country');
    check('[home pricing] the "Select your country" list still has all nine countries plus "Other" (other pairs still sell there)', all.length === 10 && all.includes('Other') && all.filter((c) => c !== 'Other').length === 9, String(all.length));
    await ctx.close(); }

  // ---- Phone
  { const { ctx, page } = await open('/', { width: 390, height: 800 });
    const fb = card(page, /FreshBooks/i); await fb.scrollIntoViewIfNeeded();
    const t = (await fb.innerText()).replace(/\s+/g, ' ');
    check('[card, mobile] free, no region wording, no sideways scroll', /Start free/.test(t) && !/Check your region|Paid elsewhere/.test(t) && (await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, t);
    await ctx.close(); }

  check('no uncaught page errors', errors.length === 0, errors.join(' | '));
  await browser.close(); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('ERROR ' + (e && e.stack || e)); process.exit(2); });
