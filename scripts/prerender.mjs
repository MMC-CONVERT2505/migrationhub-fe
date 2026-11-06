// Writes real HTML for every public page (src/seo/pages.json) into the build, using the SSR bundle of the same App.
// dist/index.html stays the untouched SPA shell: every other route (wizard, admin, payment...) is still client-rendered.
//   vite build && vite build --ssr src/entry-server.tsx --outDir dist-ssr && node scripts/prerender.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const OUT = process.env.OUT_DIR || 'dist';
const SSR = process.env.SSR_DIR || 'dist-ssr';
const pages = JSON.parse(fs.readFileSync('src/seo/pages.json', 'utf8'));
const template = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
const { render } = await import(pathToFileURL(path.resolve(SSR, 'entry-server.js')).href);

/** "/" is written as home.html (index.html must remain the shell); "/about" as about.html. */
export const fileFor = (route) => (route === '/' ? 'home.html' : `${route.replace(/^\//, '')}.html`);

for (const page of pages) {
  const { html, helmet } = await render(page.path);
  const head = [helmet.priority, helmet.meta, helmet.link, helmet.script].map((t) => t.toString()).join('\n    ');
  const out = template
    .replace(/<title>[\s\S]*?<\/title>/, helmet.title.toString())
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root" data-prerendered="true">${html}</div>`);
  if (out === template || !out.includes('data-prerendered')) throw new Error(`Prerender produced nothing for ${page.path}`);
  fs.writeFileSync(path.join(OUT, fileFor(page.path)), out);
  console.log(`prerendered ${page.path} -> ${fileFor(page.path)} (${Math.round(out.length / 1024)} kB)`);
}
