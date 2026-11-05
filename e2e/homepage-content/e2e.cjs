const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const APP = process.env.APP_URL, API = process.env.API_URL;
let bad = 0; const check = (n, ok, x = '') => { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  -> ' + x : ''}`); };
const api = async (p, body) => (await fetch(API + p, body ? { method: 'POST', body: JSON.stringify(body) } : {})).json();
const text = (page, sel) => page.locator(sel).first().innerText();

(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] });
  const errors = [];
  const open = async (path, viewport = { width: 1280, height: 800 }) => {
    const ctx = await browser.newContext({ viewport }); const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${path}: ${e.message}`));
    await page.goto(APP + path); await page.waitForLoadState('networkidle');
    return { ctx, page };
  };

  // ---------- Header + footer
  { const { ctx, page } = await open('/');
    const header = page.locator('header').first();
    const hLinks = (await header.locator('nav a, nav button').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    check('[header] desktop links are exactly Platforms, Reviews, Contact Us', ['Platforms', 'Reviews', 'Contact Us'].every((l) => hLinks.includes(l)) && !['What we convert', 'How it works', 'Pricing'].some((l) => hLinks.includes(l)), hLinks.join(' | '));
    const foot = await text(page, 'footer');
    for (const gone of ['Supported platforms', 'Knowledge Base', 'MMC Convert website', 'Blog', 'Careers'])
      check(`[footer] "${gone}" is gone`, !new RegExp(`\\b${gone}\\b`, 'i').test(foot));
    for (const kept of ['Migrations', 'Pricing', 'How it works', 'Security', 'About', 'Contact', 'Privacy Policy', 'Terms of Use'])
      check(`[footer] "${kept}" is still there`, foot.includes(kept));
    const external = await page.locator('footer a[href^="http"]').evaluateAll((as) => as.map((a) => a.href));
    check('[footer] no link to the main MMC Convert site pages that were removed', !external.some((h) => /mmcconvert\.com\/(blog|knowledge-base|mmc-career-data)\/?$/.test(h) || /mmcconvert\.com\/?$/.test(h)), external.join(' '));
    await header.getByRole('link', { name: 'Platforms' }).click(); await page.waitForURL(/\/supported-platforms$/);
    check('[header] Platforms opens the Supported Platforms page', true);
    await ctx.close(); }
  { const { ctx, page } = await open('/', { width: 390, height: 800 });
    await page.getByRole('button', { name: /menu/i }).first().click().catch(() => {});
    const menu = await page.locator('nav[aria-label="Mobile"]').innerText();
    check('[header mobile] menu shows Platforms, Reviews, Contact Us and none of the removed', ['Platforms', 'Reviews', 'Contact Us'].every((l) => menu.includes(l)) && !['What we convert', 'How it works', 'Pricing'].some((l) => menu.includes(l)), menu.replace(/\s+/g, ' | '));
    await ctx.close(); }
  { const { ctx, page } = await open('/');
    await page.locator('header').first().getByRole('link', { name: 'Reviews' }).click(); await page.waitForTimeout(900);
    const top = await page.locator('#reviews').evaluate((e) => e.getBoundingClientRect().top);
    check('[header] Reviews scrolls to the reviews section', top > -50 && top < 300, `top=${Math.round(top)}`);
    await ctx.close(); }

  // ---------- Homepage: banner, order, sections
  { const { ctx, page } = await open('/');
    const h1 = await text(page, 'h1');
    check('[hero] says "Migration Hub", not "MigrationHub"', /^Migration Hub: move your accounting data right now, in minutes/.test(h1.replace(/\s+/g, ' ')) && !/MigrationHub/.test(h1), h1.replace(/\s+/g, ' '));
    check('[hero] letters-and-stars block is gone', (await page.locator('#hero-title').locator('xpath=ancestor::section').locator('svg.text-yellow-400').count()) === 0 && !/Rated .* accounting firms/.test(await text(page, 'section')));
    const y = async (sel) => page.locator(sel).first().evaluate((e) => e.getBoundingClientRect().top + window.scrollY).catch(() => -1);
    const ys = {
      hero: await y('#hero-title'), pairs: await y('#pairs'),
      trusted: await y('section:has-text("Trusted by")'), reviews: await y('#reviews'),
      works: await y('section:has-text("Works with")'), pricing: await y('#pricing'), why: await y('#why'),
    };
    const order = Object.entries(ys).sort((a, b) => a[1] - b[1]).map(([k]) => k).join(' > ');
    check('[home] order: banner > pairs > trusted by > reviews > works with > pricing > why', order === 'hero > pairs > trusted > reviews > works > pricing > why' && Object.values(ys).every((v) => v >= 0), order);
    const pairsTop = await page.locator('#pairs h2').first().evaluate((e) => e.getBoundingClientRect().top);
    check('[home] "Select your migration path" heading is on the first screen (no scrolling)', pairsTop < 800 && pairsTop > 0, `heading top=${Math.round(pairsTop)}px of 800`);
    const body = await text(page, 'main');
    check('[home] the "9 pairs / 24/7 Expert Support" strip is gone', !/Platform pairs/.test(body) && !(await page.getByText('24/7', { exact: true }).count()));
    const whyH = await text(page, '#why h2');
    check('[why] heading reads "Built by accountants, for accountants"', whyH.trim() === 'Built by accountants, for accountants', whyH);
    check('[why] the sentence under the heading is gone', !(await page.getByText(/We understand the complexity of migrating financial data/).count()));
    check('[home] no "MigrationHub" text in the page body', !/MigrationHub/.test(body));
    await ctx.close(); }

  // ---------- Pair cards
  { const { ctx, page } = await open('/');
    const cards = page.locator('#pairs div.group');
    const n = await cards.count();
    check('[pairs] all 9 pair cards still show', n === 9, `n=${n}`);
    let dup = 0, named = 0;
    for (let i = 0; i < n; i++) {
      const c = cards.nth(i);
      const vis = await c.evaluate((el) => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t = ''; while (w.nextNode()) { const p = w.currentNode.parentElement; if (p && !p.closest('.sr-only') && getComputedStyle(p).display !== 'none') t += w.currentNode.textContent + ' '; } return t; });
      if (/→|\bto\b|QuickBooks Online\s+(FreshBooks|MYOB|Xero)|Xero\s+(MYOB|Reckon|Prosaic|QuickBooks)/i.test(vis.replace(/\s+/g, ' ').replace(/Check your region|Start free|See pricing|→/g, ''))) dup++;
      const name = await c.locator('a').first().getAttribute('aria-label');
      if (name && /:/.test(name)) named++;
    }
    check('[pairs] no card repeats the pair name as visible text', dup === 0, `cards with duplicate text=${dup}`);
    check('[pairs] every card is still a named link for screen readers', named === 9, `named=${named}`);
    const first = cards.first(); await first.scrollIntoViewIfNeeded(); await page.waitForTimeout(500); const box = await first.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height - 12);
    await page.waitForURL(/\/migration\/.+\/plan/, { timeout: 8000 }).catch(() => {});
    check('[pairs] clicking anywhere on a card (even its bottom edge) still opens the pair', /\/migration\/.+\/plan/.test(page.url()), page.url());
    await ctx.close(); }

  // ---------- Trusted by + Works with
  { const { ctx, page } = await open('/');
    const trusted = page.locator('section', { hasText: 'Trusted by' }).first();
    await trusted.scrollIntoViewIfNeeded(); await page.waitForTimeout(900);
    const info = await trusted.evaluate((sec) => {
      const out = {};
      sec.querySelectorAll('img').forEach((img) => { const r = img.getBoundingClientRect(); const cs = getComputedStyle(img.parentElement); out[img.alt.replace(' logo', '')] = { h: Math.round(r.height), w: Math.round(r.width), ok: img.naturalWidth > 0, border: cs.borderTopWidth, bg: cs.backgroundColor, radius: cs.borderRadius }; });
      const bdo = [...sec.querySelectorAll('span')].find((s) => s.textContent.trim() === 'BDO');
      out.BDO_text = bdo ? { size: parseFloat(getComputedStyle(bdo).fontSize), border: getComputedStyle(bdo.parentElement).borderTopWidth } : null;
      out.framed = [...sec.querySelectorAll('div')].filter((d) => parseFloat(getComputedStyle(d).borderTopWidth) > 0 && d.querySelector('img,span')).length;
      return out;
    });
    const rowsT = await trusted.evaluate((sec) => new Set([...sec.querySelectorAll('img, span')].filter((e) => e.closest('div.h-14')).map((e) => Math.round(e.getBoundingClientRect().top / 30))).size);
    check('[trusted] all seven logos fit on ONE row at 1366px (no lone logo on a second row)', rowsT === 1, `rows=${rowsT}`);
    check('[trusted] no frame/box around any logo', info.framed === 0, JSON.stringify(info.framed));
    check('[trusted] KPMG is large and legible (>= 44px tall)', info.KPMG && info.KPMG.ok && info.KPMG.h >= 44, JSON.stringify(info.KPMG));
    check('[trusted] Deloitte wordmark is large and legible (>= 36px tall, was ~6px)', info.Deloitte && info.Deloitte.ok && info.Deloitte.h >= 36, JSON.stringify(info.Deloitte));
    check('[trusted] Grant Thornton is large and legible (>= 36px tall)', info['Grant Thornton'] && info['Grant Thornton'].ok && info['Grant Thornton'].h >= 36, JSON.stringify(info['Grant Thornton']));
    check('[trusted] BDO shows its real logo (image loads, >= 44px tall), not the text fallback', info.BDO && info.BDO.ok && info.BDO.h >= 44 && !info.BDO_text, JSON.stringify(info.BDO));
    check('[trusted] the four featured firms are bigger than the other three', ['KPMG', 'Deloitte', 'Grant Thornton', 'BDO'].every((k) => info[k].h > info.RSM.h) && info.RSM.ok, `rsm=${info.RSM && info.RSM.h}`);
    const works = page.locator('section', { hasText: 'Works with' }).first();
    await works.scrollIntoViewIfNeeded(); await page.waitForTimeout(900);
    const w = await works.evaluate((sec) => {
      const framed = [...sec.querySelectorAll('div')].filter((d) => parseFloat(getComputedStyle(d).borderTopWidth) > 0 && d.children.length && d !== sec && !d.matches('section>div')).length;
      const marks = [...sec.querySelectorAll('div')].filter((d) => /w-9/.test(d.className)).map((d) => Math.round(d.getBoundingClientRect().height));
      return { framed, marks, bg: getComputedStyle(sec).backgroundColor, items: sec.querySelectorAll('span').length };
    });
    check('[works with] no frame/box around any logo', w.framed === 0, JSON.stringify(w));
    check('[works with] logos are bigger than before (36px marks, was 24px)', w.marks.length > 0 && w.marks.every((h) => h >= 36), JSON.stringify(w.marks));
    check('[works with] section background is white, so frameless logos never show a box', w.bg === 'rgb(255, 255, 255)', w.bg);
    await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/home-logos.png` : undefined, fullPage: false }).catch(() => {});
    await ctx.close(); }

  // ---------- Footer: the WhatsApp icon + number is one link that opens WhatsApp (web on a computer, the app on a phone)
  { const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    await ctx.route('https://wa.me/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>wa</title>' }));
    const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(`footer-wa: ${e.message}`));
    await page.goto(APP + '/'); await page.waitForLoadState('networkidle');
    const foot = page.locator('footer');
    const wa = foot.locator('a[href^="https://wa.me/"]'); const mail = foot.locator('a[href^="mailto:"]');
    check('[footer whatsapp] exactly one WhatsApp link', (await wa.count()) === 1);
    check('[footer whatsapp] it opens a chat with the site number (wa.me, digits only)', (await wa.getAttribute('href')) === 'https://wa.me/919926477000', await wa.getAttribute('href'));
    check('[footer whatsapp] there is NO tel: link left (a computer shows "No Apps Available" for those)', (await foot.locator('a[href^="tel:"]').count()) === 0);
    check('[footer whatsapp] the number is the link\'s text, so clicking the number opens WhatsApp', (await wa.innerText()).trim() === '+919926477000');
    const icon = await wa.locator('svg').boundingBox(); const num = await wa.locator('span').boundingBox(); const box = await wa.boundingBox();
    check('[footer whatsapp] the icon sits BEFORE the number, on the same line, inside the one link', icon.x + icon.width <= num.x + 1 && Math.abs((icon.y + icon.height / 2) - (num.y + num.height / 2)) < 8, `icon right=${Math.round(icon.x + icon.width)} number left=${Math.round(num.x)}`);
    check('[footer whatsapp] the whole icon + number is one big target (>= 32px tall)', box.height >= 32, `${Math.round(box.width)}x${Math.round(box.height)}`);
    const label = await wa.getAttribute('aria-label');
    check('[footer whatsapp] named for screen readers with the number, icon hidden from them', /WhatsApp/.test(label) && label.includes('+919926477000') && /new tab/.test(label) && (await wa.locator('svg').getAttribute('aria-hidden')) === 'true', label);
    check('[footer whatsapp] opens safely in a new tab (noopener noreferrer)', (await wa.getAttribute('target')) === '_blank' && /noopener/.test(await wa.getAttribute('rel')) && /noreferrer/.test(await wa.getAttribute('rel')));
    const color = await wa.locator('svg').evaluate((el) => getComputedStyle(el).color);
    check('[footer whatsapp] the icon is WhatsApp green', color === 'rgb(21, 128, 61)', color);
    await mail.focus(); await page.keyboard.press('Tab');
    const f1 = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('href'));
    const ring = await page.evaluate(() => { const c = getComputedStyle(document.activeElement); return c.boxShadow + ' ' + c.outlineStyle; });
    check('[footer whatsapp] keyboard: Tab from the email lands on WhatsApp (one stop) with a visible focus ring', f1 === 'https://wa.me/919926477000' && /rgb/.test(ring) && ring.trim() !== 'none none', `${f1} | ${ring.slice(0, 50)}`);
    // Clicking the NUMBER (not the icon) must open WhatsApp.
    let [popup] = await Promise.all([ctx.waitForEvent('page', { timeout: 8000 }), foot.getByText('+919926477000', { exact: true }).click()]);
    await popup.waitForLoadState().catch(() => {});
    check('[footer whatsapp] clicking the NUMBER opens WhatsApp\'s chat link in a NEW tab and keeps the site open', popup.url() === 'https://wa.me/919926477000' && page.url() === APP + '/', popup.url());
    check('[footer whatsapp] the new tab cannot reach back into the site (window.opener is null)', (await popup.evaluate(() => window.opener)) === null);
    await popup.close();
    [popup] = await Promise.all([ctx.waitForEvent('page', { timeout: 8000 }), wa.locator('svg').click()]);
    check('[footer whatsapp] clicking the ICON opens the same chat link in a new tab', popup.url() === 'https://wa.me/919926477000', popup.url());
    await popup.close();
    for (const route of ['/contact', '/about', '/supported-platforms']) {
      await page.goto(APP + route); await page.waitForLoadState('networkidle');
      check(`[footer whatsapp] same single WhatsApp link, no tel: link, in the footer of ${route}`, (await page.locator('footer a[href="https://wa.me/919926477000"]').count()) === 1 && (await page.locator('footer a[href^="tel:"]').count()) === 0);
    }
    await ctx.close(); }
  { const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } }); const page = await ctx.newPage();
    await page.goto(APP + '/'); await page.waitForLoadState('networkidle');
    const wa = page.locator('footer a[href^="https://wa.me/"]'); await wa.scrollIntoViewIfNeeded();
    const icon = await wa.locator('svg').boundingBox(); const num = await wa.locator('span').boundingBox();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('[footer whatsapp mobile] icon still before the number on one line at 390px, no sideways scroll', icon.x + icon.width <= num.x + 1 && Math.abs((icon.y + icon.height / 2) - (num.y + num.height / 2)) < 8 && overflow <= 0, `overflow=${overflow}`);
    await ctx.close(); }

  // ---------- Pricing cards: fixed inclusions, no history/support lines, intro sentence gone
  const WANT = { Basic: 'Current Financial Year + 1 Historical Year', Standard: 'Current Financial Year + 3 Historical Years', Enterprise: 'Inception to date' };
  const TAIL = ['All data categories', 'Payroll', 'Attachments', 'Multi-Currency', 'Quality Analysis Report'];
  for (const [label, vp] of [['desktop', { width: 1366, height: 800 }], ['mobile', { width: 390, height: 800 }]]) {
    const { ctx, page } = await open('/', vp);
    const sec = page.locator('#pricing'); await sec.scrollIntoViewIfNeeded(); await page.waitForTimeout(1200);
    check(`[pricing ${label}] the "Pay once per migration..." sentence is gone, heading kept`, !/Pay once per migration|pick yours to see it/.test(await sec.innerText()) && /Simple, one-time pricing/.test(await sec.innerText()));
    for (const [name, first] of Object.entries(WANT)) {
      const card = sec.locator('h3', { hasText: new RegExp(`^${name}$`) }).locator('xpath=..');
      const items = await card.locator('li').allInnerTexts();
      check(`[pricing ${label}] ${name}: exactly the six requested inclusions, in order`, JSON.stringify(items.map((t) => t.trim())) === JSON.stringify([first, ...TAIL]), items.join(' | '));
      const text = await card.innerText();
      const gone = ['Email support', 'Priority email', 'Phone, chat', 'revisions', 'Reconciliation report', 'Unlimited history', 'year history', 'Dedicated senior', 'Payroll Included', 'Payroll +', 'Inception to Date'].filter((g) => text.includes(g));
      check(`[pricing ${label}] ${name}: no old heading or inclusion left`, gone.length === 0, gone.join(', '));
      check(`[pricing ${label}] ${name}: the history text appears once (as the first inclusion, not also as a heading)`, text.split(first).length === 2, String(text.split(first).length - 1));
      check(`[pricing ${label}] ${name}: still shows its name and a price`, /\$|A\$|Free|from/.test(await card.locator('p.font-mono').innerText()));
    }
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`[pricing ${label}] no sideways scroll`, over <= 0, String(over));
    if (label === 'desktop') { const hs = await sec.locator('h3').evaluateAll((e) => e.map((x) => Math.round(x.getBoundingClientRect().top))); check('[pricing desktop] the three cards line up in one row', new Set(hs).size === 1, hs.join(',')); }
    await ctx.close();
  }

  // ---------- Supported platforms
  { const { ctx, page } = await open('/supported-platforms');
    const main = await text(page, 'main');
    check('[platforms] "MigrationHub" is gone from the banner, text and bottom link', !/MigrationHub/.test(main) && (main.match(/Migration Hub/g) || []).length === 3, `Migration Hub x${(main.match(/Migration Hub/g) || []).length}`);
    const links = await page.locator('main section:nth-of-type(2) ul a').evaluateAll((as) => as.map((a) => ({ t: a.innerText.replace(/\s+/g, ' ').trim(), h: new URL(a.href).pathname })));
    check('[platforms] all 9 pairs are links', links.length === 9, `n=${links.length}`);
    check('[platforms] none ends with the word "migration"', links.every((l) => !/migration$/i.test(l.t)), links.map((l) => l.t).join(' | '));
    const expected = { 'QuickBooks Online to Xero': 'qbo-to-xero', 'QuickBooks Online to FreshBooks': 'qbo-to-freshbooks', 'QuickBooks Online to MYOB': 'qbo-to-myob', 'Xero to QuickBooks Online': 'xero-to-qbo', 'Xero to MYOB': 'xero-to-myob', 'Xero to Reckon': 'xero-to-reckon', 'Xero to Prosaic': 'xero-to-prosaic', 'MYOB to QuickBooks Online': 'myob-to-qbo', 'Tally to Zoho Books': 'tally-to-zoho' };
    check('[platforms] each link goes to its own pair page', links.every((l) => l.h === `/migration/${expected[l.t]}/plan`) && new Set(links.map((l) => l.h)).size === 9, JSON.stringify(links.filter((l) => l.h !== `/migration/${expected[l.t]}/plan`)));
    await page.getByRole('link', { name: 'QuickBooks Online to Xero', exact: true }).click();
    await page.getByText('Choose your migration plan').waitFor({ timeout: 10000 }).catch(() => {});
    check('[platforms] clicking QuickBooks Online to Xero opens that pair\'s plan page', /\/migration\/qbo-to-xero\/plan$/.test(page.url()) && (await page.getByText('Choose your migration plan').count()) === 1 && /Xero/.test(await text(page, 'body')), page.url());
    await page.goBack(); await page.waitForSelector('main h1');
    await page.getByRole('link', { name: 'Tally to Zoho Books', exact: true }).click();
    await page.getByText('Choose your migration plan').waitFor({ timeout: 10000 }).catch(() => {});
    check('[platforms] Tally to Zoho Books also resolves (different keys than its display name)', /\/migration\/tally-to-zoho\/plan$/.test(page.url()) && (await page.getByText('Choose your migration plan').count()) === 1, page.url());
    await ctx.close(); }
  { const { ctx, page } = await open('/migration/not-a-pair/plan');
    await page.getByText('Migration unavailable').waitFor({ timeout: 10000 }).catch(() => {});
    check('[platforms] a pair that does not exist fails safely with a way home, not a crash', (await page.getByText('Migration unavailable').count()) === 1 && (await page.getByRole('link', { name: 'Go to homepage' }).count()) === 1);
    await ctx.close(); }

  // ---------- About
  { const { ctx, page } = await open('/about');
    check('[about] exactly one h1, "Our Team"', (await page.locator('h1').count()) === 1 && (await text(page, 'h1')).replace(/\s+/g, ' ') === 'Our Team');
    const names = await page.locator('article h2').allInnerTexts();
    check('[about] the five team members, in order, with their roles', JSON.stringify(names.map((n) => n.replace(/\s+/g, ' ').trim())) === JSON.stringify(['Ankit Mehta - Founder', 'Shanu Mehta - Co-Founder', 'Meagan Wood - Marketing Advisor', 'Meena Berry - AU Partnerships Advisor', 'Gavin Fernandes - Growth Advisor']), names.join(' | '));
    const body = await text(page, 'main');
    check('[about] bios are the team-page text verbatim (spot checks)', body.includes("one of the world's most advanced accounting data-migration platforms") && body.includes("ranked #245 among America's fastest-growing companies by Inc.com") && body.includes('Her career spans Xero, PwC and fintech') && body.includes('His experience across MYOB, Xero, Workday and Fathom'));
    await page.locator('article img').last().scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
    const imgs = await page.locator('article img').evaluateAll((is) => is.map((i) => ({ ok: i.naturalWidth > 0, alt: i.alt })));
    check('[about] all five photos load, each with a descriptive alt', imgs.length === 5 && imgs.every((i) => i.ok && i.alt.includes(',')), JSON.stringify(imgs.filter((i) => !i.ok)));
    const social = await page.locator('article a').evaluateAll((as) => as.map((a) => ({ h: a.href, l: a.getAttribute('aria-label'), t: a.target, r: a.rel })));
    check('[about] 5 LinkedIn + 5 WhatsApp links, opening safely in a new tab', social.length === 10 && social.every((s) => s.t === '_blank' && /noopener/.test(s.r) && /new tab/.test(s.l)), String(social.length));
    check('[about] LinkedIn and WhatsApp point at the right person', social.some((s) => s.h === 'https://www.linkedin.com/in/gavinfernandes1' && /Gavin/.test(s.l)) && social.some((s) => s.h === 'https://wa.me/61450466343' && /Gavin/.test(s.l)) && social.some((s) => s.h === 'https://wa.me/61448054412' && /Meena/.test(s.l)) && social.some((s) => s.h === 'https://wa.me/61402900868' && /Meagan/.test(s.l)));
    const offices = await page.locator('#offices-title').locator('xpath=following-sibling::ul/li').allInnerTexts();
    check('[about] five offices with their addresses', offices.length === 5 && offices.some((o) => /INDIA/i.test(o) && o.includes('163 RNT MARG')) && offices.some((o) => o.includes('1250 N Lasalle Street')), offices.length + '');
    check('[about] the old About content is gone', !/Our mission|Ready to migrate\?|Accounting migrations,|Secure by design/.test(body));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('[about] no sideways scroll on desktop', overflow <= 0, String(overflow));
    await ctx.close(); }
  { const { ctx, page } = await open('/about', { width: 390, height: 800 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('[about mobile] no sideways scroll at 390px wide', overflow <= 0, String(overflow));
    await ctx.close(); }

  // ---------- Contact
  for (const vp of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 1280, height: 720 }]) {
    const { ctx, page } = await open('/contact', vp);
    const r = await page.getByRole('button', { name: 'Send message' }).evaluate((b) => { const x = b.getBoundingClientRect(); return { bottom: Math.round(x.bottom), top: Math.round(x.top) }; });
    const formTop = await page.locator('form').evaluate((f) => Math.round(f.getBoundingClientRect().top));
    check(`[contact ${vp.width}x${vp.height}] the whole form and "Send message" are visible without scrolling`, r.bottom <= vp.height && formTop > 0, `button bottom=${r.bottom} of ${vp.height}`);
    await ctx.close();
  }
  { await api('/__reset'); const { ctx, page } = await open('/contact');
    const labels = (await page.locator('form label').allInnerTexts()).map((l) => l.replace(/\s*\*/g, ' *').replace(/\s+/g, ' ').trim());
    check('[contact] fields in order: Name, Work email, Company name, Country / Region, Phone (optional), Message', JSON.stringify(labels.filter((l) => !/^$/.test(l))) === JSON.stringify(['Name *', 'Work email *', 'Company name *', 'Country / Region *', 'Phone (optional)', 'Message *']), labels.join(' | '));
    check('[contact] Message is an open text box (textarea)', (await page.locator('textarea#message').count()) === 1);
    await page.getByRole('button', { name: 'Send message' }).click();
    const errs = await page.locator('form p.text-red-600').allInnerTexts();
    check('[contact] empty submit lists every missing required field', ['Name is required.', 'Email is required.', 'Company name is required.', 'Please select a country.', 'Please enter a message.'].every((m) => errs.some((e) => e.includes(m))), errs.join(' | '));
    check('[contact] nothing is sent while invalid', (await api('/__log')).filter((r) => r.u === '/contact').length === 0);
    await page.fill('#name', 'Jane Doe'); await page.fill('#email', 'jane@acme.com'); await page.fill('#companyName', 'Acme Pty Ltd'); await page.selectOption('#country', 'Australia');
    await page.fill('#message', '   ');
    await page.getByRole('button', { name: 'Send message' }).click();
    check('[contact] a message of only spaces is still "required"', (await page.getByText('Please enter a message.').count()) === 1 && (await api('/__log')).filter((r) => r.u === '/contact').length === 0);
    const long = 'x'.repeat(2500); await page.fill('#message', long);
    check('[contact] the message box stops at 2000 characters', (await page.inputValue('#message')).length === 2000);
    await page.fill('#message', 'Line one\nLine two: moving QuickBooks Online to Xero.');
    await api('/__mode', { failContact: true });
    await page.getByRole('button', { name: 'Send message' }).click();
    await page.getByText(/Something went wrong on our side/).waitFor({ timeout: 8000 }).catch(() => {});
    check('[contact] server error: readable message, and everything typed is kept', (await page.getByText(/Something went wrong on our side/).count()) === 1 && (await page.inputValue('#name')) === 'Jane Doe' && /Line two/.test(await page.inputValue('#message')));
    await api('/__mode', { failContact: false }); await api('/__reset');
    const btn = page.getByRole('button', { name: 'Send message' });
    await btn.dblclick();
    await page.getByText('Thanks — we’ve got it').waitFor({ timeout: 8000 }).catch(() => {});
    const posts = (await api('/__log')).filter((r) => r.u === '/contact');
    check('[contact] a double-click sends one request, not two', posts.length === 1, String(posts.length));
    check('[contact] sends name, email, company, country and the message (phone omitted when blank)', posts[0] && posts[0].body.name === 'Jane Doe' && posts[0].body.email === 'jane@acme.com' && posts[0].body.companyName === 'Acme Pty Ltd' && posts[0].body.country === 'Australia' && posts[0].body.message === 'Line one\nLine two: moving QuickBooks Online to Xero.' && !('phone' in posts[0].body), JSON.stringify(posts[0] && posts[0].body));
    const card = (await text(page, 'main form, main h2:has-text("Thanks")')).length;
    const thanks = await page.locator('h2:has-text("Thanks")').locator('xpath=..').innerText();
    check('[contact] confirmation reads exactly as requested', /Thanks — we.ve got it\s+Your message is on its way to our team\. We.ll be in touch within the next 24 hours\./.test(thanks.replace(/\s+/g, ' ')) && !/shortly|Thank you for contact|via email/.test(thanks), thanks.replace(/\s+/g, ' '));
    await page.getByRole('button', { name: 'Send another message' }).click();
    check('[contact] "Send another message" gives a clean form', (await page.inputValue('#name')) === '' && (await page.inputValue('#message')) === '');
    await page.fill('#name', 'Bo'); await page.fill('#email', 'bo@acme.com'); await page.fill('#companyName', 'Beta Co'); await page.selectOption('#country', 'New Zealand'); await page.fill('#phone', '21 345 678'); await page.fill('#message', 'Second enquiry');
    await page.getByRole('button', { name: 'Send message' }).click(); await page.getByText('Thanks — we’ve got it').waitFor({ timeout: 8000 }).catch(() => {});
    const p2 = (await api('/__log')).filter((r) => r.u === '/contact')[1];
    check('[contact] the page intro makes the same 24-hour promise, not "one business day"', /within the\s+next 24 hours/.test(await page.locator('main').innerText()) && !/business day/i.test(await page.locator('main').innerText()));
    check('[contact] a phone, when given, is sent with its dial code', p2 && /^\+64\d{8,9}$/.test(p2.body.phone), JSON.stringify(p2 && p2.body.phone));
    await ctx.close(); }
  { const { ctx, page } = await open('/contact', { width: 390, height: 800 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('[contact mobile] form works at 390px wide with no sideways scroll', overflow <= 0 && (await page.locator('textarea#message').isVisible()), String(overflow));
    await ctx.close(); }

  check('no uncaught page errors in any scenario', errors.length === 0, errors.join(' | '));
  await browser.close(); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('ERROR ' + (e && e.stack || e)); process.exit(2); });
