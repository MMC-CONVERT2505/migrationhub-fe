const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const APP = process.env.APP_URL;
let bad = 0; const check = (n, ok, x = '') => { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  -> ' + x : ''}`); };
const TITLE = 'Security at Migration Hub | MigrationHub by MMC Convert';
const DESC = 'How Migration Hub protects your accounting data: ISO/IEC 27001:2022 certified, TLS 1.2 in transit, encrypted at rest, role-based access, automatic deletion.';

(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] });
  const errors = [];
  const open = async (path, vp = { width: 1366, height: 900 }) => {
    const ctx = await browser.newContext({ viewport: vp, timezoneId: 'Australia/Melbourne', locale: 'en-AU' }); const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${path}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`${path} console: ${m.text().slice(0, 120)}`); });
    await page.goto(APP + path); await page.waitForLoadState('networkidle');
    return { ctx, page };
  };

  // ---------- the footer link
  for (const from of ['/', '/about', '/contact', '/privacy']) {
    const { ctx, page } = await open(from);
    const link = page.locator('footer').getByRole('link', { name: 'Security', exact: true });
    const href = await link.getAttribute('href');
    check(`[footer ${from}] "Security" is an in-site link to /security, not the MMC Convert site`, (await link.count()) === 1 && href === '/security' && (await link.getAttribute('target')) === null, href);
    check(`[footer ${from}] no link to mmcconvert.com/security remains anywhere on the page`, (await page.locator('a[href*="mmcconvert.com/security"]').count()) === 0);
    await ctx.close();
  }
  { const { ctx, page } = await open('/');
    await page.locator('footer').getByRole('link', { name: 'Security', exact: true }).click();
    await page.waitForURL(/\/security$/, { timeout: 10000 });
    check('[footer click] opens /security in the same tab (no new tab)', new URL(page.url()).pathname === '/security' && ctx.pages().length === 1, page.url().replace(APP, ''));
    check('[footer click] the Security page is shown', (await page.locator('h1').innerText()).replace(/\s+/g, ' ') === 'Security at Migration Hub');
    await page.goBack(); await page.waitForLoadState('networkidle');
    check('[footer click] the browser Back button returns to the homepage', new URL(page.url()).pathname === '/' && /Migration Hub: move your books/.test(await page.locator('h1').innerText()));
    await ctx.close(); }

  // ---------- opening the URL directly, and the head tags search engines read
  { const { ctx, page } = await open('/security');
    check('[page] opens directly at /security', new URL(page.url()).pathname === '/security');
    check('[page] exactly one h1: "Security at Migration Hub"', (await page.locator('h1').count()) === 1 && (await page.locator('h1').innerText()).replace(/\s+/g, ' ') === 'Security at Migration Hub');
    check('[seo] browser tab title', (await page.title()) === TITLE, await page.title());
    check('[seo] canonical URL is https://migrationhub.mmcconvert.com/security', (await page.locator('link[rel=canonical]').getAttribute('href')) === 'https://migrationhub.mmcconvert.com/security', await page.locator('link[rel=canonical]').getAttribute('href'));
    check('[seo] meta description is set and unique to this page', (await page.locator('meta[name=description]').getAttribute('content')) === DESC);
    check('[seo] the page is indexable (no noindex)', !/noindex/i.test((await page.locator('meta[name=robots]').first().getAttribute('content').catch(() => '')) || ''));
    check('[seo] there is one title, one canonical and one description (no duplicates after hydration)', (await page.locator('head title').count()) === 1 && (await page.locator('link[rel=canonical]').count()) === 1 && (await page.locator('meta[name=description]').count()) === 1);
    const bc = await page.getByRole('navigation', { name: 'Breadcrumb' }).innerText();
    check('[page] breadcrumb reads Home / Security', /Home\s*\/\s*Security/.test(bc.replace(/\s+/g, ' ')), bc.replace(/\s+/g, ' '));
    const lead = (await page.locator('h1 ~ p').first().innerText()).replace(/\s+/g, ' ');
    check('[content] intro paragraph, word for word', lead === 'Your accounting data holds years of financial history. Migration Hub is built so that only the people who need it can reach it, it is encrypted wherever it travels or rests, and it is deleted on a set schedule. We are data migration experts, and we treat client data accordingly.', lead.slice(0, 80));
    const badges = await page.locator('ul[aria-label="Security at a glance"] li').allInnerTexts();
    check('[content] the six badges, in order', JSON.stringify(badges.map((b) => b.trim())) === JSON.stringify(['ISO/IEC 27001:2022 certified', 'TLS 1.2 in transit', 'Encrypted at rest', 'Role-based access', 'No sub-processors', 'Automatic deletion']), badges.join(' | '));
    check('[content] "Last updated November 2026" is shown', /Last updated November 2026/.test(await page.locator('main').innerText()));
    const h2 = (await page.locator('main h2').allInnerTexts()).map((t) => t.trim());
    check('[content] section headings, in order', JSON.stringify(h2) === JSON.stringify(['What happens to your data, step by step', 'How we protect it', 'You stay in control', 'Certification and privacy', 'Have a security question?']), h2.join(' | '));
    const intro = await page.locator('#journey-title ~ p').innerText();
    check('[content] journey intro line', intro.trim() === 'Every migration follows the same path. Here it is in order, with nothing hidden.');
    const steps = await page.locator('section[aria-labelledby="journey-title"] ol > li').evaluateAll((lis) => lis.map((li) => ({ title: li.querySelector('h3').innerText.trim(), when: (li.querySelector('span.uppercase') || {}).innerText || null, text: li.querySelector('p').innerText.trim() })));
    check('[content] five steps in order: Upload, Conversion, Quality check (optional), Job complete, Deletion', JSON.stringify(steps.map((s) => s.title)) === JSON.stringify(['Upload', 'Conversion', 'Quality check (optional)', 'Job complete', 'Deletion']), steps.map((s) => s.title).join(' | '));
    check('[content] "Day 0" marks the upload and "Day 7" the deletion; no marker on the others', JSON.stringify(steps.map((s) => s.when)) === JSON.stringify(['DAY 0', null, null, null, 'DAY 7']) || JSON.stringify(steps.map((s) => s.when && s.when.toUpperCase())) === JSON.stringify(['DAY 0', null, null, null, 'DAY 7']), JSON.stringify(steps.map((s) => s.when)));
    check('[content] the upload and deletion wording is exact', steps[0].text === 'You choose what to upload or connect. Transfers are encrypted with TLS 1.2 and land in a private AWS environment in the region nearest to you.' && steps[4].text === 'If you requested manual QA, your data is kept for up to 7 days so the review can be completed. It is then deleted automatically on the eighth day after conversion.');
    const prot = await page.locator('section[aria-labelledby="protect-title"] li h3').allInnerTexts();
    check('[content] eight protections, in order', JSON.stringify(prot) === JSON.stringify(['Private cloud environment', 'Encryption', 'Least-privilege access', 'Strong credentials', 'Regular testing', 'Malware protection', 'Backup and recovery', 'Incident response']), prot.join(' | '));
    const body = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    for (const s of ['Runs on Amazon Web Services inside a Virtual Private Cloud, with network access control lists restricting traffic.', 'Remote access to our internal network is through secure VPN only.', 'Passwords must meet complexity rules, are rotated regularly, and accounts lock after repeated failed sign-ins.', 'Vulnerability scanning and penetration testing run every quarter. Patches are applied based on published vulnerabilities (CVEs).', 'Microsoft Defender runs on our systems with regularly updated definitions, and antivirus activity is logged.', 'S3 storage with versioning, plus documented backup, business continuity and disaster recovery procedures.', 'A documented response plan and a dedicated security response team. Staff must report suspected incidents immediately.'])
      check(`[content] "${s.slice(0, 48)}…"`, body.includes(s));
    const ctl = await page.locator('section[aria-labelledby="control-title"] ul li').allInnerTexts();
    check('[content] "You stay in control": the intro and the four promises', body.includes('Migration Hub is a self-serve tool, so the decisions that matter are yours.') && JSON.stringify(ctl.map((t) => t.trim())) === JSON.stringify(['You decide how many historical years of data to upload or connect.', 'You decide whether to request a manual quality check.', 'We remove our access to your source systems when the job is done.', 'Your data is deleted on a fixed schedule, not left to chance.']), ctl.join(' | '));
    const rows = await page.locator('dl > div').evaluateAll((d) => d.map((r) => [r.querySelector('dt').innerText.trim(), r.querySelector('dd').innerText.trim()]));
    check('[content] "Certification and privacy": six rows with the right terms', JSON.stringify(rows.map((r) => r[0])) === JSON.stringify(['ISO/IEC 27001:2022', 'Written policies', 'Use of your data', 'Sub-processors', 'Records of processing', 'Data location']), rows.map((r) => r[0]).join(' | '));
    check('[content] the certification wording keeps its typographic apostrophe', rows[0][1] === 'MMC Convert’s Information Security Management System is certified for accounting, bookkeeping and data migration services.');
    check('[content] sub-processors, use of data and data location wording is exact', rows[2][1] === 'Used only to deliver the migration you requested.' && rows[3][1] === 'We do not pass your data to sub-processors.' && rows[5][1] === 'Stored in the AWS region nearest to the customer.');
    const mail = page.getByRole('link', { name: /Contact: migrations@mmcconvert\.com/ });
    check('[content] the contact button is a mailto: link to migrations@mmcconvert.com', (await mail.count()) === 1 && (await mail.getAttribute('href')) === 'mailto:migrations@mmcconvert.com');
    check('[content] the question text above it is exact', body.includes('Ask us about our policies, request documentation for a vendor review, or report a concern.'));
    check('[content] no leftover from the Word document ("Page 2", "Security | Last updated", bullets)', !/Page \d|Security \| Last updated|•/.test(body));
    check('[content] no "SOC 2" or other certification beyond the ISO one named in the document', !/SOC ?2|HIPAA|PCI/i.test(body));
    await ctx.close(); }

  // ---------- accessibility structure
  { const { ctx, page } = await open('/security');
    const levels = await page.locator('main h1, main h2, main h3').evaluateAll((h) => h.map((x) => Number(x.tagName[1])));
    check('[a11y] heading levels never skip (h1 > h2 > h3)', levels[0] === 1 && levels.every((l, i) => i === 0 || l - levels[i - 1] <= 1), levels.join(''));
    const labelled = await page.locator('main section[aria-labelledby]').evaluateAll((s) => s.every((x) => document.getElementById(x.getAttribute('aria-labelledby')) && document.getElementById(x.getAttribute('aria-labelledby')).textContent.trim()));
    check('[a11y] every section is named by its own heading', labelled && (await page.locator('main section[aria-labelledby]').count()) === 5);
    const svgs = await page.locator('main svg').evaluateAll((s) => s.every((x) => x.getAttribute('aria-hidden') === 'true'));
    check('[a11y] all the decorative icons are hidden from screen readers', svgs);
    check('[a11y] the lists are real lists (steps are an ordered list, the rest unordered or a description list)', (await page.locator('main section ol').count()) === 1 && (await page.locator('main section dl').count()) === 1 && (await page.locator('main section ul').count()) >= 3);
    await page.locator('main a[href^="mailto:"]').focus();
    const ring = await page.evaluate(() => { const c = getComputedStyle(document.activeElement); return `${c.boxShadow} ${c.outlineStyle}`; });
    check('[a11y] the email button shows a visible keyboard focus ring', /rgb/.test(ring) && ring.trim() !== 'none none', ring.slice(0, 60));
    const contrast = await page.evaluate(() => { const rgb = (s) => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number); const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }; const el = document.querySelector('main section[aria-labelledby="contact-title"] a'); const cs = getComputedStyle(el); const a = lum(rgb(cs.color)), b = lum(rgb(cs.backgroundColor)); return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 10) / 10; });
    check('[a11y] the email button text has at least 4.5:1 contrast', contrast >= 4.5, String(contrast));
    await ctx.close(); }

  // ---------- layout on every screen size
  for (const [label, vp] of [['desktop', { width: 1366, height: 900 }], ['tablet', { width: 820, height: 1000 }], ['phone', { width: 390, height: 800 }], ['small phone', { width: 320, height: 700 }]]) {
    const { ctx, page } = await open('/security', vp);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const cols = await page.locator('section[aria-labelledby="protect-title"] ul > li').evaluateAll((li) => new Set(li.map((x) => Math.round(x.getBoundingClientRect().left))).size);
    const wantCols = vp.width >= 768 ? 2 : 1;
    check(`[layout ${label} ${vp.width}px] no sideways scroll, protection cards in ${wantCols} column${wantCols > 1 ? 's' : ''}`, over <= 0 && cols === wantCols, `overflow=${over}, columns=${cols}`);
    const clipped = await page.locator('main h1, main h2, main h3, main p, main li, main dt, main dd').evaluateAll((els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; }).length);
    check(`[layout ${label}] no text runs off the screen`, clipped === 0, String(clipped));
    if (label === 'small phone') await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/security-320.png` : undefined, fullPage: true }).catch(() => {});
    await ctx.close();
  }

  // ---------- the header and footer around it still work
  { const { ctx, page } = await open('/security');
    const nav = (await page.locator('header nav a').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    check('[chrome] the header links are unchanged (Platforms, Reviews, Contact Us)', ['Platforms', 'Reviews', 'Contact Us'].every((l) => nav.includes(l)), nav.join(' | '));
    check('[chrome] the footer is there, with the new tagline and its Security link', /Switching accounting software before your coffee/.test(await page.locator('footer').innerText()) && (await page.locator('footer a[href="/security"]').count()) === 1);
    await ctx.close(); }
  { const { ctx, page } = await open('/security/');
    check('[url] /security/ (trailing slash) still shows the page in the app', /Security at Migration Hub/.test(await page.locator('h1').innerText().catch(() => '')));
    await ctx.close(); }

  check('no uncaught page errors or console errors', errors.length === 0, errors.join(' | '));
  await browser.close(); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('ERROR ' + (e && e.stack || e)); process.exit(2); });
