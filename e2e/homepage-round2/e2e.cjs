const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const APP = process.env.APP_URL;
let bad = 0; const check = (n, ok, x = '') => { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  -> ' + x : ''}`); };
const fs = require('fs');
// The real Tally image uploaded in the admin panel (a checkerboard is baked into its pixels), served as the "uploaded" logo.
const CHECKER = require('path').join(__dirname, 'fixtures', 'tally-uploaded.png');

(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] });
  const errors = [];
  const open = async (path, { vp = { width: 1366, height: 800 }, tz = 'Australia/Melbourne', locale = 'en-AU', banners = null } = {}) => {
    const ctx = await browser.newContext({ viewport: vp, timezoneId: tz, locale }); const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${path}: ${e.message}`));
    if (banners) {
      await page.route('**/banner/get-banners**', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ data: banners, total: banners.length }) }));
      await page.route('**/img/*.png', (r) => { const n = r.request().url().split('/').pop(); const f = n === 'tally.png' ? CHECKER : null; r.fulfill({ status: 200, headers: { 'content-type': 'image/png', 'access-control-allow-origin': '*' }, body: f ? fs.readFileSync(f) : Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }); });
    }
    await page.goto(APP + path); await page.waitForLoadState('networkidle');
    return { ctx, page };
  };
  const text = (page, sel) => page.locator(sel).first().innerText();

  // ---------- 10, 11: hero
  { const { ctx, page } = await open('/');
    const h1 = (await text(page, 'h1')).replace(/\s+/g, ' ');
    check('[hero] H1 reads "Migration Hub: move your books yourself, in minutes"', h1 === 'Migration Hub: move your books yourself, in minutes', h1);
    const col = await page.evaluate(() => { const h = document.querySelector('#hero-title'); const sp = h.querySelector('span'); const eyebrow = [...document.querySelectorAll('p')].find((p) => /Migration pairs/i.test(p.textContent)); return { h1: getComputedStyle(h).color, span: getComputedStyle(sp).color, spanText: sp.textContent, brand: getComputedStyle(eyebrow).color, h1font: getComputedStyle(h).fontFamily.slice(0, 22), spanFont: getComputedStyle(sp).fontFamily.slice(0, 22), w1: getComputedStyle(h).fontWeight, w2: getComputedStyle(sp).fontWeight }; });
    check('[hero] "yourself" is the orange accent (the same brand orange as before) and nothing else in the H1 is', col.spanText === 'yourself' && col.span === col.brand && col.h1 !== col.span, JSON.stringify(col));
    check('[hero] same font, weight and size style as the rest of the H1', col.h1font === col.spanFont && col.w1 === col.w2);
    const sub = (await text(page, '#hero-title ~ p')).replace(/\s+/g, ' ');
    check('[hero] subline is "Accounting migration in minutes. No quotes, no queues, no people in between."', sub === 'Accounting migration in minutes. No quotes, no queues, no people in between.', sub);
    check('[hero] the old wording is gone', !/right now|No waiting for quotes|uploading files/.test(await text(page, 'main')));
    await ctx.close(); }

  // ---------- 1: no filter tabs
  { const { ctx, page } = await open('/');
    const tabs = await page.locator('#pairs button').allInnerTexts();
    check('[pairs] no "All tools / Free / Region-based / Paid" tabs', !tabs.some((t) => /All tools|Region-based|^\s*(Free|Paid)\b/.test(t)), tabs.join(' | '));
    check('[pairs] all 9 pairs still show, unfiltered', (await page.locator('#pairs div.group').count()) === 9);
    check('[pairs] the heading is still there and no filter wording remains', /Select your migration path/.test(await text(page, '#pairs')) && !/No migration pairs found for this filter/.test(await text(page, '#pairs')));
    await ctx.close(); }

  // ---------- 2: Trusted by, eight logos, 4 + 4
  for (const [label, vp, rowsWant] of [['desktop', { width: 1366, height: 800 }, [4, 4]], ['tablet', { width: 820, height: 900 }, [4, 4]], ['phone', { width: 390, height: 800 }, [2, 2, 2, 2]]]) {
    const { ctx, page } = await open('/', { vp });
    const sec = page.locator('section', { hasText: 'Trusted by' }).first(); await sec.scrollIntoViewIfNeeded(); await page.waitForTimeout(1200);
    const info = await sec.evaluate((s) => ({ imgs: [...s.querySelectorAll('img')].map((i) => ({ n: i.alt, ok: i.naturalWidth > 0, top: Math.round(i.getBoundingClientRect().top + i.getBoundingClientRect().height / 2), h: Math.round(i.getBoundingClientRect().height), left: Math.round(i.getBoundingClientRect().left) })), texts: [...s.querySelectorAll('span')].map((e) => e.textContent.trim()).filter((t) => t && t !== 'Trusted by') }));
    const names = info.imgs.map((i) => i.n.replace(' logo', '')).concat(info.texts);
    check(`[trusted ${label}] eight logos including ShineWing`, names.length === 8 && names.some((n) => /ShineWing/.test(n)), names.join(', '));
    const sw = info.imgs.find((i) => /ShineWing/.test(i.n));
    check(`[trusted ${label}] the ShineWing logo image loads and is as tall as the other featured logos (>= 44px)`, sw && sw.ok && sw.h >= 44, JSON.stringify(sw));
    const rows = {}; { let k = -1, last = -1e9; [...info.imgs].sort((a, b) => a.top - b.top).forEach((i) => { if (i.top - last > 30) k++; last = i.top; rows[k] = (rows[k] || 0) + 1; }); }
    if (label !== 'phone') check(`[trusted ${label}] 4 logos on the first row and 4 on the second`, JSON.stringify(Object.keys(rows).sort((a, b) => a - b).map((k) => rows[k])) === JSON.stringify(rowsWant), JSON.stringify(rows));
    else { const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); check('[trusted phone] two per row, no sideways scroll', over <= 0, String(over)); }
    await ctx.close();
  }

  // ---------- 3: Trustpilot
  { const { ctx, page } = await open('/');
    const sec = page.locator('#reviews'); const t = (await sec.innerText()).replace(/\s+/g, ' ');
    check('[trustpilot] "Based on 1,218 reviews" is shown once, next to the 4.8 / 5', /4\.8 \/ 5.*Based on 1,218 reviews/.test(t) && (t.match(/1,218/g) || []).length === 1, `mentions of 1,218: ${(t.match(/1,218/g) || []).length}`);
    check('[trustpilot] the extra "1,218 reviews on Trustpilot" tile is gone', !/\d[\d,]* reviews on Trustpilot/.test(t));
    const link = sec.getByRole('link', { name: /Read all reviews on Trustpilot/ });
    check('[trustpilot] the link reads "Read all reviews on Trustpilot" and still goes to Trustpilot in a new tab', (await link.count()) === 1 && /trustpilot\.com/.test(await link.getAttribute('href')) && (await link.getAttribute('target')) === '_blank' && /noopener/.test(await link.getAttribute('rel')));
    check('[trustpilot] the old "Read 1,218 reviews" wording is gone', !/Read (all )?1,218/.test(t));
    await ctx.close(); }

  // ---------- 4: pricing country
  { const { ctx, page } = await open('/');
    check('[pricing] the label reads "Select your country"', (await page.locator('label[for="pricing-country"]').innerText()).trim() === 'Select your country' && !/Show prices for/.test(await text(page, '#pricing')));
    await ctx.close(); }
  for (const [tz, locale, want] of [['Asia/Kolkata', 'en-IN', 'India'], ['Australia/Sydney', 'en-AU', 'Australia'], ['Pacific/Auckland', 'en-NZ', 'New Zealand'], ['Europe/London', 'en-GB', 'United Kingdom'], ['America/Toronto', 'en-CA', 'Canada'], ['America/Chicago', 'en-US', 'United States'], ['Asia/Singapore', 'en-SG', 'Singapore'], ['Asia/Dubai', 'en-AE', 'United Arab Emirates'], ['Africa/Johannesburg', 'en-ZA', 'South Africa']]) {
    const { ctx, page } = await open('/', { tz, locale });
    const v = await page.locator('#pricing-country').inputValue();
    check(`[pricing country] browsing from ${tz} -> ${want}`, v === want, v);
    await ctx.close();
  }
  { const { ctx, page } = await open('/', { tz: 'Asia/Kolkata', locale: 'en-IN' });
    const card = page.locator('#pricing h3', { hasText: /^Basic$/ }).locator('xpath=..');
    check('[pricing country] India shows INR prices with the India GST note', /₹/.test(await card.innerText()) && /18% GST/.test(await card.innerText()));
    await ctx.close(); }
  for (const [tz, locale, label] of [['Europe/Paris', 'fr-FR', 'France (unsold)'], ['Asia/Tokyo', 'ja-JP', 'Japan (unsold)'], ['UTC', 'en', 'UTC with no region']]) {
    const { ctx, page } = await open('/', { tz, locale });
    const v = await page.locator('#pricing-country').inputValue();
    check(`[pricing country] ${label} -> "Other", with a clear "contact us" message instead of mixed-currency prices`, v === 'Other' && (await page.locator('#pricing h3').count()) === 0 && /Not on the list\?/.test(await page.locator('#pricing').innerText()) && (await page.locator('#pricing a[href="/contact"]').count()) === 1, v);
    await ctx.close();
  }
  { const { ctx, page } = await open('/', { tz: 'Asia/Kolkata', locale: 'en-US' });
    check('[pricing country] a US-English browser in India still gets India (time zone beats language)', (await page.locator('#pricing-country').inputValue()) === 'India');
    await page.locator('#pricing-country').selectOption('Other');
    await page.waitForTimeout(600);
    check('[pricing country] picking "Other" sticks (detection does not snap it back to India)', (await page.locator('#pricing-country').inputValue()) === 'Other');
    await page.locator('#pricing-country').selectOption('Canada');
    check('[pricing country] ...and a real country can be picked again afterwards, bringing the prices back', (await page.locator('#pricing-country').inputValue()) === 'Canada' && (await page.locator('#pricing h3', { hasText: /^Basic$/ }).count()) === 1);
    await ctx.close(); }
  { const { ctx, page } = await open('/', { tz: 'UTC', locale: 'en-NZ' });
    check('[pricing country] no useful time zone, but an en-NZ browser -> New Zealand (language fallback)', (await page.locator('#pricing-country').inputValue()) === 'New Zealand');
    await ctx.close(); }
  { const { ctx, page } = await open('/', { tz: 'Asia/Kolkata', locale: 'en-IN' });
    await page.locator('#pricing-country').selectOption('Singapore');
    const card = page.locator('#pricing h3', { hasText: /^Basic$/ }).locator('xpath=..');
    check('[pricing country] a visitor\'s own choice wins over detection and updates the prices', (await page.locator('#pricing-country').inputValue()) === 'Singapore' && /\$/.test(await card.innerText()) && !/₹/.test(await card.innerText()));
    await page.reload(); await page.waitForLoadState('networkidle');
    check('[pricing country] ...and is kept after a reload (not reset to India)', (await page.locator('#pricing-country').inputValue()) === 'Singapore');
    await ctx.close(); }
  { const { ctx, page } = await open('/', { tz: 'Asia/Kolkata', locale: 'en-IN' });
    const stored = await page.evaluate(() => JSON.stringify(JSON.parse(sessionStorage.getItem('mmc-app') || '{}')?.state?.selectedCountry ?? null));
    check('[pricing country] detection alone stores nothing (it is only a starting point)', stored === 'null', stored);
    await ctx.close(); }

  // ---------- 5: Tally logo (the uploaded image has a checkerboard baked in; a clean one is used)
  { const banners = ['qbo', 'xero', 'myob', 'freshbook', 'prosaic', 'reckon', 'tally', 'zohobook'].map((n, i) => ({ id: i + 1, name: n, image: `${APP.replace('14202', '19022')}/img/${n}.png`, type: 'ToolLogo', status: 'Active' }));
    const { ctx, page } = await open('/', { banners });
    const sec = page.locator('section', { hasText: 'Works with' }).first(); await sec.scrollIntoViewIfNeeded(); await page.waitForTimeout(1800);
    const t = await sec.evaluate((s) => { const im = [...s.querySelectorAll('img')].find((i) => i.alt === 'tally'); if (!im) return null; const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const px = (a, b) => Array.from(x.getImageData(a, b, 1, 1).data); return { src: im.src, ok: im.naturalWidth > 0, corners: [px(2, 2), px(c.width - 3, 2), px(2, c.height - 3), px(c.width - 3, c.height - 3)], h: Math.round(im.getBoundingClientRect().height), framed: getComputedStyle(im.parentElement).borderTopWidth }; });
    check('[tally] the Tally logo comes from the clean transparent file, not the uploaded checkerboard image', t && /tally-logo\.png$/.test(t.src) && t.ok, t && t.src);
    check('[tally] all four corners are fully transparent (no checkerboard, no frame)', t && t.corners.every((p) => p[3] === 0), t && JSON.stringify(t.corners));
    check('[tally] it is shown at the same height class as the other logos (36-52px) with no border', t && t.h >= 36 && t.h <= 52 && t.framed === '0px', t && `${t.h}px border ${t.framed}`);
    const others = await sec.evaluate((s) => [...s.querySelectorAll('img')].filter((i) => i.alt !== 'tally').map((i) => i.src));
    check('[tally] every other logo still uses its own uploaded image', others.length === 7 && others.every((u) => /\/img\/|blob:/.test(u)), String(others.length));
    const rows = await sec.evaluate((s) => { const cs = [...s.querySelectorAll('img')].map((i) => { const q = i.getBoundingClientRect(); return q.top + q.height / 2; }).sort((x, y) => x - y); const out = []; let last = -1e9; cs.forEach((c) => { if (c - last > 30) out.push(0); out[out.length - 1]++; last = c; }); return out; });
    check('[works with] still 4 + 4', JSON.stringify(rows) === JSON.stringify([4, 4]), JSON.stringify(rows));
    await ctx.close(); }

  // ---------- 6: "We stand behind every migration" is gone
  { const { ctx, page } = await open('/');
    const body = await text(page, 'main');
    check('[safety net] the "We stand behind every migration" section is gone, with its heading, copy and button', !/We stand behind every migration|Start your migration|Data backup|Post-migration support/.test(body), '');
    check('[safety net] the section above (Built by accountants) is now the last one before the footer', (await page.locator('main > section').last().innerText()).includes('Built by accountants, for accountants'));
    await ctx.close(); }

  // ---------- 7: How it Works?
  { const { ctx, page } = await open('/');
    const sec = page.locator('#how-it-works'); await sec.scrollIntoViewIfNeeded(); await page.waitForTimeout(900);
    check('[how it works] the section exists with the heading "How it Works?"', (await sec.locator('h2').innerText()).trim() === 'How it Works?');
    const img = sec.locator('img'); const alt = await img.getAttribute('alt');
    check('[how it works] the four steps are one image, named for screen readers in order', (await sec.locator('img').count()) === 1 && /1\. Choose your migration.*2\. Place your order.*3\. Connect both accounts.*4\. Migrate and verify/.test(alt), alt);
    const nat = await img.evaluate((i) => ({ ok: i.naturalWidth > 0, src: i.currentSrc.replace(location.origin, '') }));
    check('[how it works] desktop uses the wide image and it loads', nat.ok && /how-it-works\.svg$/.test(nat.src), nat.src);
    const svg = await (await fetch(`${APP}/static/how-it-works.svg`)).text();
    check('[how it works] the image contains the four step names, exactly as written', ['Choose your migration', 'Place your Order', 'Connect both accounts', 'Migrate and Verify'].every((s) => svg.includes(s)));
    const y = async (sel) => page.locator(sel).first().evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
    const ys = { rev: await y('#reviews'), works: await y('section:has-text("Works with")'), how: await y('#how-it-works'), pricing: await y('#pricing') };
    check('[how it works] sits after the reviews and before "Works with" and "Pricing" (as already live)', ys.rev < ys.how && ys.how < ys.works && ys.works < ys.pricing, JSON.stringify(ys));
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check('[how it works] no sideways scroll on desktop', over <= 0);
    await ctx.close(); }
  for (const w of [390, 320]) {
    const { ctx, page } = await open('/', { vp: { width: w, height: 800 } });
    const sec = page.locator('#how-it-works'); await sec.scrollIntoViewIfNeeded(); await page.waitForTimeout(900);
    const r = await sec.locator('img').evaluate((i) => ({ src: i.currentSrc.replace(location.origin, ''), ok: i.naturalWidth > 0, w: Math.round(i.getBoundingClientRect().width), over: document.documentElement.scrollWidth - innerWidth }));
    check(`[how it works ${w}px] a phone gets the stacked image, it loads, and nothing overflows`, /how-it-works-mobile\.svg$/.test(r.src) && r.ok && r.w <= w && r.over <= 0, JSON.stringify(r));
    // the stacked image's text must fit inside its own canvas (no clipped labels)
    const svg = await (await fetch(`${APP}/static/how-it-works-mobile.svg`)).text();
    const vb = /viewBox="0 0 (\d+) (\d+)"/.exec(svg); const xs = [...svg.matchAll(/<text x="(\d+)"[^>]*font-size="(\d+)"[^>]*>([^<]+)</g)].map((m) => Number(m[1]) + m[3].length * Number(m[2]) * 0.56);
    check(`[how it works ${w}px] every label fits inside the image (widest ends at ${Math.round(Math.max(...xs))} of ${vb[1]})`, Math.max(...xs) <= Number(vb[1]));
    await ctx.close();
  }

  // ---------- 9: footer tagline
  { const { ctx, page } = await open('/');
    const f = page.locator('footer p').first();
    check('[footer] the tagline reads "Switching accounting software before your coffee gets cold."', (await f.innerText()).replace(/\s+/g, ' ').trim() === 'Switching accounting software before your coffee gets cold.', (await f.innerText()).replace(/\s+/g, ' '));
    check('[footer] a coffee-mug icon sits next to "coffee" (decorative, hidden from screen readers)', (await f.locator('svg[aria-hidden="true"]').count()) === 1);
    check('[footer] the old tagline is gone', !/Enterprise-grade/.test(await text(page, 'footer')));
    const h = await f.locator('svg').evaluate((s) => Math.round(s.getBoundingClientRect().height)); const fs2 = await f.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    check('[footer] the mug is sized to the text (about one line tall)', h >= fs2 * 0.9 && h <= fs2 * 1.5, `${h}px vs ${fs2}px text`);
    await ctx.close(); }
  { const { ctx, page } = await open('/contact');
    check('[footer] the same tagline on other pages', /Switching accounting software before your coffee/.test(await text(page, 'footer')));
    await ctx.close(); }

  check('no uncaught page errors', errors.length === 0, errors.join(' | '));
  await browser.close(); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('ERROR ' + (e && e.stack || e)); process.exit(2); });
