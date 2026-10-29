// Checks the BUILT output (default dist/) against the SEO rules. Exit 1 on any failure.
//   node scripts/validate-seo.mjs [outDir]
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2] || process.env.OUT_DIR || 'dist';
const SITE = 'https://migrationhub.mmcconvert.com';
const pages = JSON.parse(fs.readFileSync('src/seo/pages.json', 'utf8'));
const fileFor = (r) => (r === '/' ? 'home.html' : `${r.replace(/^\//, '')}.html`);
const failures = [];
const fail = (m) => failures.push(m);
const titles = new Set();
const descs = new Set();

for (const p of pages) {
  const f = path.join(OUT, fileFor(p.path));
  if (!fs.existsSync(f)) { fail(`${p.path}: ${fileFor(p.path)} was not prerendered`); continue; }
  const h = fs.readFileSync(f, 'utf8');
  const title = (h.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1]?.replace(/&amp;/g, '&');
  const desc = (h.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/) || [])[1];
  const canonical = (h.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/) || [])[1];
  const robots = (h.match(/<meta[^>]*name="robots"[^>]*content="([^"]*)"/) || [])[1];
  const h1s = (h.match(/<h1[\s>]/g) || []).length;
  const want = p.path === '/' ? `${SITE}/` : `${SITE}${p.path}`;
  if (title !== p.title) fail(`${p.path}: <title> is "${title}"`);
  if (!title || title.length < 40 || title.length > 64) fail(`${p.path}: title length ${title?.length} outside 40-64`);
  if (!desc || desc.length < 150 || desc.length > 160) fail(`${p.path}: description length ${desc?.length} outside 150-160`);
  if (titles.has(title)) fail(`${p.path}: duplicate title`); titles.add(title);
  if (descs.has(desc)) fail(`${p.path}: duplicate description`); descs.add(desc);
  if (canonical !== want) fail(`${p.path}: canonical is ${canonical}, want ${want}`);
  if (!robots || /noindex/i.test(robots) || !/max-image-preview:large/.test(robots)) fail(`${p.path}: robots is "${robots}"`);
  if (h1s !== 1) fail(`${p.path}: ${h1s} <h1> in the raw HTML`);
  if (p.path === '/' && !/<h1[^>]*>[^]*?MigrationHub[^]*?<\/h1>/.test(h)) fail('/: <h1> does not contain MigrationHub');
  for (const prop of ['og:type', 'og:site_name', 'og:title', 'og:description', 'og:url', 'og:image', 'og:locale'])
    if (!new RegExp(`property="${prop}"`).test(h)) fail(`${p.path}: missing ${prop}`);
  if (!/name="twitter:card" content="summary_large_image"/.test(h)) fail(`${p.path}: missing twitter:card`);
  if (!/<html lang="en"/.test(h) || !/name="viewport"/.test(h) || !/name="theme-color"/.test(h)) fail(`${p.path}: lang/viewport/theme-color`);
  const ld = [...h.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  if (ld.length === 0) fail(`${p.path}: no JSON-LD`);
  for (const m of ld) {
    try {
      const j = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
      const types = (j['@graph'] || [j]).map((n) => n['@type']);
      const need = p.path === '/' ? ['WebSite', 'Organization', 'SoftwareApplication'] : ['BreadcrumbList'];
      for (const t of need) if (!types.includes(t)) fail(`${p.path}: JSON-LD lacks ${t}`);
    } catch (e) { fail(`${p.path}: JSON-LD is not valid JSON (${e.message})`); }
  }
  for (const m of h.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) fail(`${p.path}: <img> without alt: ${m[0].slice(0, 80)}`);
  for (const m of h.matchAll(/<a\b[^>]*>([^<]*)<\/a>/g)) if (/^\s*(click here|here|read more)\s*$/i.test(m[1])) fail(`${p.path}: non-descriptive link text "${m[1]}"`);
}

const shell = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
if (/data-prerendered/.test(shell)) fail('index.html (SPA shell) must not be prerendered');
if (/name="robots"[^>]*content="[^"]*"/.test(shell) && !/noindex/.test(shell)) fail('shell carries an index robots tag');

const sm = fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const want = pages.map((p) => (p.path === '/' ? `${SITE}/` : `${SITE}${p.path}`));
if (!sm.startsWith('<?xml') || !/<\/urlset>\s*$/.test(sm)) fail('sitemap.xml is not well formed');
if (JSON.stringify([...locs].sort()) !== JSON.stringify([...want].sort())) fail(`sitemap URLs differ from the public pages: ${locs}`);
if ((sm.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) || []).length !== pages.length) fail('sitemap.xml: every URL needs a valid <lastmod>');

const robots = fs.readFileSync(path.join(OUT, 'robots.txt'), 'utf8');
const disallows = [...robots.matchAll(/^Disallow:\s*(\S+)/gim)].map((m) => m[1]);
for (const p of pages) for (const d of disallows.filter((x) => !/[*?$]/.test(x))) if (p.path === '/' ? d === '/' : p.path.startsWith(d)) fail(`robots.txt blocks public page ${p.path} (${d})`);
if (/Disallow:\s*\/assets/i.test(robots)) fail('robots.txt blocks /assets/');
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) fail('robots.txt lacks the Sitemap line');

for (const f of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-512.png', 'og-image.png', 'site.webmanifest'])
  if (!fs.existsSync(path.join(OUT, f))) fail(`missing ${f}`);

if (failures.length) { console.error(failures.map((m) => `FAIL ${m}`).join('\n')); process.exit(1); }
console.log(`SEO checks passed for ${pages.length} public pages`);
