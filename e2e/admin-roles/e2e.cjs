const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const APP = process.env.APP_URL || 'http://127.0.0.1:14174';
let bad = 0; const check = (n, ok, x = '') => { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  -> ' + x : ''}`); };
const NAV = ['Dashboard', 'Users', 'Roles', 'Permissions', 'Migrations', 'Migration Pairs', 'Migration Help Requests', 'Error Logs', 'Reports', 'Tool Logos', 'Plans', 'Audit & Logs', 'Contacts', 'Inquiry Orders', 'FAQs'];
const nav = async (page) => { const names = []; for (const n of NAV) if (await page.locator('aside[aria-label="Admin"]').getByRole('link', { name: n, exact: true }).count()) names.push(n); return names; };

async function login(browser, email) {
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.goto(`${APP}/admin/login`);
  await page.locator('input[type="email"], input[name="email"], #admin-email').first().fill(email);
  await page.fill('#admin-password', 'whatever');
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  return { ctx, page };
}

(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] });

  { const { ctx, page } = await login(browser, 'admin@x.com'); await page.waitForURL(/\/admin$/, { timeout: 10000 });
    await page.waitForSelector('aside[aria-label="Admin"]');
    const navbar = await page.locator('header, nav').first().innerText();
    check('[admin] sees every section', (await nav(page)).length === NAV.length, (await nav(page)).join(','));
    const stored = JSON.parse(await page.evaluate(() => sessionStorage.getItem('mmc-auth'))).state.admin.user;
    check('[admin] the signed-in profile is the admin\'s own (Real Admin), not another user', stored.firstname === 'Real' && stored.lastname === 'Admin' && stored.email === 'admin@x.com', JSON.stringify(stored));
    await page.goto(`${APP}/admin/users`); await page.waitForSelector('h1:has-text("Users")');
    const btn = page.getByRole('link', { name: /Create User/ }).or(page.getByRole('button', { name: /Create User/ }));
    check('[admin] Users page says "Create User"', (await btn.count()) === 1);
    check('[admin] no "Sub-User" anywhere on Users page', !/sub-?user/i.test(await page.locator('body').innerText()));
    await btn.first().click(); await page.waitForURL(/users\/create/); await page.waitForSelector('h1:has-text("Create User")');
    { const h = await page.locator('h1').innerText(); const b = await page.locator('body').innerText(); check('[admin] create page title is "Create User", no "Sub-User"', h === 'Create User' && !/sub-?user/i.test(b), JSON.stringify(h) + ' ' + (b.match(/.{0,30}sub-?user.{0,30}/i) || [''])[0]); }
    await page.goto(`${APP}/admin/migrations`); await page.waitForSelector('tbody tr');
    const text = await page.locator('tbody').innerText();
    check('[admin] runner column: Olive Ops / Operation Team', /Olive Ops[\s\S]*Operation Team/.test(text));
    check('[admin] runner column: Dev Dan / Developer', /Dev Dan[\s\S]*Developer/.test(text));
    check('[admin] runner column: Customer, and no "Guest"', /Customer/.test(text) && !/Guest/.test(text));
    await ctx.close(); }

  { const { ctx, page } = await login(browser, 'dev@x.com'); await page.waitForURL(/\/admin$/, { timeout: 10000 });
    await page.waitForSelector('aside[aria-label="Admin"]');
    const seen = await nav(page);
    check('[developer] reaches the admin panel', /\/admin$/.test(page.url()));
    check('[developer] sees only read-only sections', JSON.stringify(seen) === JSON.stringify(['Dashboard', 'Migrations', 'Migration Pairs', 'Migration Help Requests', 'Error Logs', 'Reports', 'Plans', 'FAQs']), seen.join(','));
    check('[developer] no Users / Roles / Permissions / Audit / Contacts / Tool Logos', !seen.some((n) => ['Users', 'Roles', 'Permissions', 'Audit & Logs', 'Contacts', 'Inquiry Orders', 'Tool Logos'].includes(n)));
    for (const path of ['/admin/users', '/admin/users/create', '/admin/roles', '/admin/audit']) {
      await page.goto(`${APP}${path}`); await page.waitForSelector('aside[aria-label="Admin"]');
      const t = await page.locator('main, body').first().innerText();
      check(`[developer] typing ${path} shows Access denied, not the page`, /Access denied/.test(t) && !/Create User|Total users|Audit Log/.test(t));
    }
    await page.goto(`${APP}/admin/migrations`); await page.waitForSelector('tbody tr');
    check('[developer] can still open Migrations by URL', !/Access denied/.test(await page.locator('body').innerText()));
    await ctx.close(); }

  { const { ctx, page } = await login(browser, 'cust@x.com'); await page.waitForTimeout(1500);
    check('[customer] is refused admin access', /does not have admin access/i.test(await page.locator('body').innerText()) && /admin\/login/.test(page.url()));
    await ctx.close(); }

  { const ctx = await browser.newContext(); const page = await ctx.newPage(); await page.goto(`${APP}/`); await page.waitForSelector('#reviews');
    const t = await page.locator('#reviews').innerText();
    check('[home] shows the real Trustpilot reviewers', ['Cameron Day-Lewis', 'George Kairinos', 'Donna King'].every((n) => t.includes(n)));
    check('[home] review text is verbatim', t.includes('MMC made the whole process so easy, from the first chat to final migration.') && t.includes('Great, speedy and constant communication throughout the migration process'));
    check('[home] old placeholder reviews and "800+" are gone', !/Sarah M\.|David T\.|Bill R\.|800\+/.test(t));
    check('[home] shows 4.8 and 1,218 reviews', /4\.8/.test(t) && /1,218/.test(t));
    check('[home] links to the Trustpilot page', (await page.locator('#reviews a[href="https://www.trustpilot.com/review/mmcconvert.com"]').count()) >= 1);
    await ctx.close(); }

  await browser.close(); console.log(bad ? `FAILED (${bad})` : 'PASSED'); process.exit(bad ? 1 : 0);
})();
