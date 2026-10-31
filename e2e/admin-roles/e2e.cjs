const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const APP = process.env.APP_URL || 'http://127.0.0.1:14174', API = process.env.API_URL || 'http://127.0.0.1:19002';
let bad = 0; const check = (n, ok, x = '') => { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  -> ' + x : ''}`); };
const NAV = ['Dashboard', 'Users', 'Roles', 'Permissions', 'Migrations', 'Migration Pairs', 'Migration Help Requests', 'Error Logs', 'Reports', 'Tool Logos', 'Plans', 'Audit & Logs', 'Contacts', 'Inquiry Orders', 'FAQs', 'Settings'];
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

  // ---- Migration Cleaner
  { await fetch(API + '/__clean-reset');
    const { ctx, page } = await login(browser, 'admin@x.com'); await page.waitForURL(/\/admin$/, { timeout: 10000 });
    await page.locator('aside[aria-label="Admin"]').getByRole('link', { name: 'Settings', exact: true }).click();
    await page.getByRole('link', { name: /Migration Cleaner/ }).click(); await page.waitForSelector('h1:has-text("Migration Cleaner")'); await page.waitForSelector('tbody tr input[type=checkbox]');
    const box = (id) => page.getByLabel(`Select migration ${id}`);
    const sel = async () => page.getByText(/\d+ selected/).innerText();
    const modes = (await page.getByRole('radio').allInnerTexts()).map((t) => t.trim());
    check('[cleaner] offers Soft delete, Hard delete, Purge data and Restore', JSON.stringify(modes) === JSON.stringify(['Soft delete', 'Hard delete', 'Purge data', 'Restore']), modes.join(','));
    check('[cleaner] opens on Soft delete, the reversible one', (await page.getByRole('radio', { name: 'Soft delete' }).getAttribute('aria-checked')) === 'true');
    check('[cleaner] warns what can and cannot be undone', /can be undone/i.test(await page.locator('[role=note]').innerText()) && /cannot/i.test(await page.locator('[role=note]').innerText()));
    check('[cleaner] a running migration cannot be selected, and says why', await box('10000004').isDisabled() && /running now/.test(await page.locator('tr', { hasText: '10000004' }).innerText()));
    check('[cleaner] nothing selected and Review off at first', /^0 selected/.test(await sel()) && await page.getByRole('button', { name: /^Review/ }).isDisabled());
    check('[cleaner] soft delete: the settled-payment migration is allowed (it is reversible)', await box('10000003').isEnabled());
    await page.getByRole('radio', { name: 'Hard delete' }).click();
    check('[cleaner] hard delete: the settled-payment migration is refused, with the reason', await box('10000003').isDisabled() && /settled payment/.test(await page.locator('tr', { hasText: '10000003' }).innerText()));
    await box('10000001').check();
    check('[cleaner] selecting one shows 1 selected', /^1 selected/.test(await sel()));
    await page.getByRole('radio', { name: 'Purge data' }).click();
    check('[cleaner] switching the action clears the selection', /^0 selected/.test(await sel()));

    // --- Soft delete: no typing, reversible
    await page.getByRole('radio', { name: 'Soft delete' }).click();
    await page.getByRole('button', { name: /Select all 4 matching/ }).click(); await page.waitForFunction(() => /^3 selected/.test(document.body.innerText.match(/\d+ selected/)?.[0] || ''));
    check('[cleaner] select all matching picks only what soft delete may run on (3 of 4)', /^3 selected/.test(await sel()));
    await page.getByRole('button', { name: /^Review/ }).click(); const dlg = page.getByRole('dialog'); await dlg.getByText(/can be soft deleted/).waitFor();
    check('[cleaner] soft delete says nothing is removed and needs no typed phrase', /Nothing is removed/.test(await dlg.innerText()) && (await dlg.getByLabel(/To confirm, type/).count()) === 0);
    const go = dlg.getByRole('button', { name: /^Soft delete 3$/ });
    check('[cleaner] its button is ready straight away', await go.isEnabled());
    await go.click(); await page.getByRole('status').filter({ hasText: /soft deleted/ }).waitFor();
    let calls = await (await fetch(API + '/__clean-calls')).json();
    check('[cleaner] sent SOFT_DELETE for exactly the 3 allowed ids, with no confirmation', calls.length === 1 && calls[0].action === 'SOFT_DELETE' && calls[0].ids.length === 3 && calls[0].confirm === undefined, JSON.stringify(calls));
    await page.waitForFunction(() => /Soft deleted/.test(document.querySelector('table').innerText), null, { timeout: 8000 }).catch(() => {});
    check('[cleaner] the rows now show Soft deleted', (await page.locator('table').first().getByText('Soft deleted').count()) === 3);

    // --- Restore
    await page.getByRole('radio', { name: 'Restore' }).click();
    check('[cleaner] restore: only deleted rows are selectable', await box('10000001').isEnabled() && await box('10000004').isDisabled());
    await box('10000002').check(); await page.getByRole('button', { name: /^Review/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: /^Restore 1$/ }).click(); await page.getByRole('status').filter({ hasText: /restored/ }).waitFor();
    calls = await (await fetch(API + '/__clean-calls')).json();
    check('[cleaner] restore sent RESTORE for that id', calls.length === 2 && calls[1].action === 'RESTORE' && calls[1].ids.join() === '10000002', JSON.stringify(calls[1]));

    // --- Who ran each migration
    { const t = await page.locator('table').first().innerText();
      check('[cleaner] list has a Run by column', /run by/i.test(t));
      const row = (id) => page.locator('table').first().locator('tbody tr', { hasText: id });
      const r1 = await row('10000001').innerText(), r2 = await row('10000002').innerText(), r4 = await row('10000004').innerText();
      check('[cleaner] Operation Team run shows the role, name and email', /Operation Team/.test(r1) && /Olive Ops/.test(r1) && /olive@x\.com/.test(r1), r1.replace(/\s+/g, ' '));
      check('[cleaner] Developer run shows the role, name and email', /Developer/.test(r2) && /Dev Dan/.test(r2) && /dan@x\.com/.test(r2), r2.replace(/\s+/g, ' '));
      check('[cleaner] customer run shows Customer with their email', /Customer/.test(r4) && /10000004@c\.com/.test(r4), r4.replace(/\s+/g, ' ')); }

    // --- Force delete: admin accounts only, hard delete only
    await page.getByRole('radio', { name: 'Soft delete' }).click();
    check('[cleaner] the force option is not offered for soft delete', (await page.getByText(/ignoring the safety rules/).count()) === 0);
    await page.getByRole('radio', { name: 'Hard delete' }).click();
    const forceBox = page.getByLabel(/Delete exactly what I select/);
    check('[cleaner] an admin sees the force option under Hard delete, off by default', (await forceBox.count()) === 1 && !(await forceBox.isChecked()));
    check('[cleaner] without force the running migration is still refused', await box('10000004').isDisabled());
    await forceBox.check();
    check('[cleaner] with force the running migration becomes selectable and says it will be deleted anyway', await box('10000004').isEnabled() && /deleted anyway/.test(await page.locator('tr', { hasText: '10000004' }).innerText()));
    await box('10000004').check(); await page.getByRole('button', { name: /^Review/ }).click();
    { const d = page.getByRole('dialog'); await d.getByText(/can be hard deleted/).waitFor();
      check('[cleaner] review shows which rule is being ignored', /Ignoring:.*running/.test(await d.innerText()));
      const go = d.getByRole('button', { name: /^Hard delete 1$/ });
      await d.getByLabel(/To confirm, type/).fill('HARD DELETE 1');
      check('[cleaner] the ordinary phrase is not enough for a forced delete', await go.isDisabled());
      await d.getByLabel(/To confirm, type/).fill('FORCE HARD DELETE 1');
      check('[cleaner] the FORCE phrase turns it on', await go.isEnabled());
      await go.click(); await page.getByRole('status').filter({ hasText: /hard deleted/ }).waitFor();
      const fc = await (await fetch(API + '/__clean-calls')).json(); const last = fc[fc.length - 1];
      check('[cleaner] request carries force and the FORCE phrase', last.force === true && last.action === 'HARD_DELETE' && last.confirm === 'FORCE HARD DELETE 1' && last.ids.join() === '10000004', JSON.stringify(last)); }
    check('[cleaner] switching mode switches force off again', await (async () => { await page.getByRole('radio', { name: 'Soft delete' }).click(); await page.getByRole('radio', { name: 'Hard delete' }).click(); return !(await page.getByLabel(/Delete exactly what I select/).isChecked()); })());

    // --- Hard delete: typed phrase required
    await page.getByRole('radio', { name: 'Hard delete' }).click();
    await box('10000001').check(); await box('10000002').check();
    await page.getByRole('button', { name: /^Review/ }).click(); const dlg2 = page.getByRole('dialog'); await dlg2.getByText(/can be hard deleted/).waitFor();
    const confirm = dlg2.getByRole('button', { name: /^Hard delete 2$/ });
    check('[cleaner] hard delete warns it is for good and lists what goes', /for good/.test(await dlg2.innerText()) && /logs/.test(await dlg2.innerText()));
    check('[cleaner] hard delete is off until the phrase is typed', await confirm.isDisabled());
    await dlg2.getByLabel(/To confirm, type/).fill('DELETE 2');
    check('[cleaner] "DELETE 2" is not enough', await confirm.isDisabled());
    await dlg2.getByLabel(/To confirm, type/).fill('HARD DELETE 2');
    check('[cleaner] the exact phrase turns it on', await confirm.isEnabled());
    await confirm.click(); await page.getByRole('status').filter({ hasText: /hard deleted/ }).waitFor();
    calls = await (await fetch(API + '/__clean-calls')).json();
    check('[cleaner] sent HARD_DELETE with the typed confirmation', (() => { const c = calls.filter((x) => x.action === 'HARD_DELETE' && !x.force).pop(); return !!c && c.confirm === 'HARD DELETE 2' && c.ids.length === 2; })(), JSON.stringify(calls.slice(-1)));
    await page.waitForFunction(() => !document.querySelector('table').innerText.includes('10000001'), null, { timeout: 8000 }).catch(() => {});
    check('[cleaner] the hard-deleted rows are gone from the list', (await page.locator('table').first().locator('tbody tr', { hasText: '10000001' }).count()) === 0);
    const hist = await page.locator('section', { hasText: 'Recent removals' }).innerText();
    check('[cleaner] Recent removals shows each kind', /Hard deleted/.test(hist) && /Soft deleted/.test(hist) && /Restored/.test(hist));
    await page.getByRole('button', { name: 'Deleted', exact: true }).click(); await page.waitForTimeout(500);
    check('[cleaner] the Deleted filter lists the soft-deleted ones', (await page.locator('table').first().locator('tbody tr', { hasText: 'Soft deleted' }).count()) >= 1);
    await ctx.close(); }

  { await fetch(API + '/__clean-reset');
    const { ctx, page } = await login(browser, 'reader@x.com'); await page.waitForURL(/\/admin$/, { timeout: 10000 });
    await page.goto(`${APP}/admin/settings/migration-cleaner`); await page.waitForSelector('h1:has-text("Migration Cleaner")');
    check('[cleaner] a read-only role never sees the force option', (await page.getByLabel(/Delete exactly what I select/).count()) === 0);
    check('[cleaner] a read-only role can look but has no Review button and no checkboxes enabled', (await page.getByRole('button', { name: /^Review/ }).count()) === 0 && await page.getByLabel('Select migration 10000002').isDisabled() && /search but not remove/.test(await page.locator('body').innerText()));
    await ctx.close(); }

  { const { ctx, page } = await login(browser, 'dev@x.com'); await page.waitForURL(/\/admin$/, { timeout: 10000 });
    await page.goto(`${APP}/admin/settings/migration-cleaner`); await page.waitForSelector('aside[aria-label="Admin"]');
    check('[cleaner] a Developer is refused the page by URL', /Access denied/.test(await page.locator('body').innerText()) && (await page.getByText('Migration Cleaner').count()) === 0 || /Access denied/.test(await page.locator('body').innerText()));
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
