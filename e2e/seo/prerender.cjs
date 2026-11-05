// Real-browser checks of the prerendered public pages: content without JavaScript, clean hydration, one set of head
// tags after hydration, client-side navigation, and noindex on private and unknown routes.
//   APP_URL=http://127.0.0.1:18090 PLAYWRIGHT_PATH=... CHROME_PATH=... node e2e/seo/prerender.cjs
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const APP = process.env.APP_URL || 'http://127.0.0.1:18090';
const SITE = 'https://migrationhub.mmcconvert.com';
const PAGES = require('../../src/seo/pages.json');
let bad = 0; const check = (n, ok, x = '') => { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  -> ' + x : ''}`); };
const HYDRATION = /#4(18|19|22|23|25)|hydrat/i;

(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] });

  // 1. No JavaScript at all: the HTML a crawler's first pass sees.
  { const ctx = await browser.newContext({ javaScriptEnabled: false });
    for (const p of PAGES) {
      const page = await ctx.newPage(); await page.goto(APP + p.path);
      const h1 = await page.locator('h1').count();
      const title = await page.title();
      const canon = await page.locator('link[rel=canonical]').getAttribute('href');
      const ld = await page.locator('script[type="application/ld+json"]').count();
      const body = (await page.locator('main').first().innerText()).length;
      check(`[no-JS ${p.path}] one h1, title, canonical, JSON-LD and real body text`, h1 === 1 && title === p.title && canon === (p.path === '/' ? SITE + '/' : SITE + p.path) && ld >= 1 && body > 300, `h1=${h1} body=${body}`);
      await page.close();
    }
    await ctx.close(); }

  // 2. With JavaScript: hydrates without errors and without duplicating head tags.
  for (const p of PAGES) {
    const ctx = await browser.newContext(); const page = await ctx.newPage(); const errs = [];
    // Not ours: the mock API has no banner route, and logos/bdo.svg was a known missing file (now bdo_logo_color.png).
    const IGNORED = /\/banner\/get-banners|\/logos\/bdo\.svg/; const ignoredHits = [];
    page.on('response', (r) => { if (r.status() >= 400 && IGNORED.test(r.url())) ignoredHits.push(r.url()); });
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') { if (/Failed to load resource/.test(m.text()) && ignoredHits.length > 0) return; errs.push(m.text()); } });
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(APP + p.path); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
    const hyd = errs.filter((e) => HYDRATION.test(e));
    check(`[JS ${p.path}] hydrates with no React hydration error`, hyd.length === 0, hyd[0]?.slice(0, 160));
    check(`[JS ${p.path}] no other console errors`, errs.filter((e) => !HYDRATION.test(e)).length === 0, errs.find((e) => !HYDRATION.test(e))?.slice(0, 160));
    const n = async (sel) => page.locator(sel).count();
    check(`[JS ${p.path}] exactly one title, description, canonical, robots after hydration`, (await n('title')) === 1 && (await n('meta[name=description]')) === 1 && (await n('link[rel=canonical]')) === 1 && (await n('meta[name=robots]')) === 1, `title=${await n('title')} desc=${await n('meta[name=description]')} canon=${await n('link[rel=canonical]')} robots=${await n('meta[name=robots]')}`);
    check(`[JS ${p.path}] still one h1 and the right title`, (await n('h1')) === 1 && (await page.title()) === p.title);
    await ctx.close();
  }

  // 3. Client-side navigation swaps the metadata (and the app is interactive after hydration).
  { const ctx = await browser.newContext(); const page = await ctx.newPage(); await page.goto(APP + '/'); await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: 'How it works' }).first().click(); await page.waitForURL('**/how-it-works');
    const t = await page.title(); const c = await page.locator('link[rel=canonical]').getAttribute('href');
    check('[nav] / -> How it works updates title, canonical and h1', t === PAGES.find((p) => p.path === '/how-it-works').title && c === SITE + '/how-it-works' && /works/i.test(await page.locator('h1').innerText()), `${t} | ${c}`);
    check('[nav] breadcrumb shown on the inner page', (await page.getByRole('navigation', { name: 'Breadcrumb' }).count()) === 1);
    await page.getByRole('link', { name: 'See supported platforms' }).click(); await page.waitForURL('**/supported-platforms');
    check('[nav] inner link goes to /supported-platforms with its own metadata', (await page.title()) === PAGES.find((p) => p.path === '/supported-platforms').title);
    await ctx.close(); }

  // 4. Home page content that depends on the API still loads after hydration, and the hash link still scrolls.
  { const ctx = await browser.newContext(); const page = await ctx.newPage(); await page.goto(APP + '/#pricing'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(1500);
    check('[home] pair cards load after hydration', (await page.locator('a[href*="/migration/"]').count()) >= 5);
    const top = await page.locator('#pricing').evaluate((el) => Math.round(el.getBoundingClientRect().top));
    check('[home] /#pricing scrolls to the pricing section', top >= -5 && top < 200, `top=${top}`);
    await ctx.close(); }

  // 5. Private and unknown routes: noindex in the DOM too.
  for (const [path, why] of [['/sign-in', 'sign-in'], ['/migration/xero-to-qbo/plan', 'wizard'], ['/nope-xyz', 'unknown URL (404 page)'], ['/sign-up', 'sign-up'], ['/forgot-password', 'password reset']]) {
    const ctx = await browser.newContext(); const page = await ctx.newPage(); await page.goto(APP + path); await page.waitForLoadState('networkidle'); await page.waitForTimeout(600);
    const robots = await page.locator('meta[name=robots]').getAttribute('content');
    check(`[private ${why}] meta robots is noindex, nofollow and there is no canonical`, robots === 'noindex, nofollow' && (await page.locator('link[rel=canonical]').count()) === 0, robots);
    await ctx.close();
  }

  await browser.close(); console.log(bad ? `${bad} FAILED` : 'ALL PASSED'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
