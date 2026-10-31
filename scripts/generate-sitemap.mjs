// Builds sitemap.xml from the public page list (src/seo/pages.json): absolute https URLs matching each page's
// canonical, each with a <lastmod> from git (the page's own source files), else the build date.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.env.OUT_DIR || 'dist';
const SITE = 'https://migrationhub.mmcconvert.com';
const pages = JSON.parse(fs.readFileSync('src/seo/pages.json', 'utf8'));
const today = new Date().toISOString().slice(0, 10);

function lastmod(sources) {
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...sources], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return iso ? iso.slice(0, 10) : today;
  } catch {
    return today; // no git in the build environment (e.g. Docker)
  }
}

const url = (p) => (p === '/' ? `${SITE}/` : `${SITE}${p}`);
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map((p) => `  <url><loc>${url(p.path)}</loc><lastmod>${lastmod(p.source)}</lastmod></url>`),
  '</urlset>',
  '',
].join('\n');

fs.writeFileSync(path.join(OUT, 'sitemap.xml'), xml);
console.log(`sitemap.xml: ${pages.length} URLs`);
