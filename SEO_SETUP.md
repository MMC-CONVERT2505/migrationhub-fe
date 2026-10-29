# SEO setup for migrationhub.mmcconvert.com

## What was done

| Area | How |
|---|---|
| Crawlable HTML | The 7 public pages are rendered to real HTML at build time (`scripts/prerender.mjs`, using `src/entry-server.tsx`, which renders the same `<App/>`). The browser hydrates that HTML (`src/main.tsx`). Everything else (wizard, admin, payment, tracking, sign-in) is the unchanged client-rendered app. `dist/index.html` stays the untouched app shell. |
| Public pages | `/`, `/how-it-works`, `/supported-platforms`, `/about`, `/contact`, `/privacy`, `/termsofuse`. List and copy: `src/seo/pages.json`. |
| Metadata | `src/components/seo/SEO.tsx` (`<SEO/>` and `<RouteSEO/>`, `react-helmet-async`): title, description, canonical, robots, Open Graph, Twitter card, JSON-LD. Every route that is not a public page gets `noindex, nofollow`, including the 404 page. |
| Structured data | `src/seo/jsonLd.ts`. Home: WebSite, Organization, SoftwareApplication. Inner pages: BreadcrumbList. `/how-it-works`: FAQPage (mirrors the visible FAQ). No ratings, reviews, prices or unpublished profiles. |
| robots.txt | `public/robots.txt`. Blocks only private routes; never `/assets/`. `/sign-in` and `/sign-up` stay crawlable so their `noindex` can be read. |
| sitemap.xml | `scripts/generate-sitemap.mjs`, run by `npm run build`, from `pages.json`, with `lastmod` from git (else the build date). Served as `application/xml`. |
| nginx | `nginx.conf` + `security-headers.conf` (see "Deploying the nginx change"). |
| Performance | Self-hosted IBM Plex fonts (`public/fonts`) instead of two render-blocking Google Fonts requests; hero no longer fades in from opacity 0; page-level fade removed from public pages. |
| Brand assets | `favicon.svg/.ico`, `apple-touch-icon.png`, `icon-192/512.png`, `og-image.png` (1200x630), `site.webmanifest`, `theme-color` (brand orange `#D97706`). |
| Internal links | Header and footer link to How it works and Supported platforms; breadcrumbs on inner pages; footer links to https://www.mmcconvert.com. |
| Hero `<h1>` | Now "MigrationHub: move your accounting data right now, in minutes" (brand term in the one `<h1>`). |

## Add a new public page

1. Create the page component and its route in `src/App.tsx` (use one `<h1>`).
2. Add an entry to `src/seo/pages.json`: `path`, `name`, `title` (40-64 chars), `description` (150-160 chars), `source` (files that decide its `lastmod`).
3. Add its first path segment to the two lists in `nginx.conf` (`$spa_route` map and the `location ~ ^/(?<page>...)$` blocks). A test fails if they disagree with `pages.json`.
4. `npm run build && npm run seo:check` (checks title/description lengths, canonical, one h1, JSON-LD, Open Graph, sitemap, robots).

Prerender, sitemap and the checks all read `pages.json`, so no other list needs editing.

## Environment variables (public tokens, optional, baked in at build time)

| Variable | Effect |
|---|---|
| `VITE_GSC_VERIFICATION` | Adds `<meta name="google-site-verification">` to the home page. |
| `VITE_BING_VERIFICATION` | Adds `<meta name="msvalidate.01">` to the home page. |

Docker: `docker build --build-arg VITE_GSC_VERIFICATION=... --build-arg VITE_BING_VERIFICATION=... .` DNS TXT verification works too and needs no variable. No analytics (GA4/GTM) was added.

## Deploying the nginx change

`nginx.conf` + `security-headers.conf` are for the frontend container (the `Dockerfile` copies both). Production answers with `Server: nginx/1.24.0 (Ubuntu)`, so a host nginx is in front or serves the files itself, and its config is not in this repo. **Before deploying:**

1. On the server, back it up: `sudo cp -a /etc/nginx /etc/nginx.bak-$(date +%F)`.
2. If the host nginx only proxies to the container, deploy the new image and check `curl -sI https://migrationhub.mmcconvert.com/about`. If the host nginx serves `dist` itself, port the `map` blocks, the `location` blocks and the `security-headers.conf` include into its server block.
3. `sudo nginx -t && sudo systemctl reload nginx`. Never reload without `-t`.
4. Purge the CDN/cache for `/`, the public pages, `/robots.txt`, `/sitemap.xml`.

## Manual steps after deploy

1. **Google Search Console**: add `https://migrationhub.mmcconvert.com/` (URL-prefix property), verify (meta env var or DNS TXT), then Sitemaps -> submit `sitemap.xml`.
2. **URL Inspection** -> inspect `https://migrationhub.mmcconvert.com/` -> **Request Indexing**. Repeat for `/how-it-works` and `/supported-platforms`.
3. **Bing Webmaster Tools**: import from Search Console (or verify with the Bing token), submit the sitemap.
4. **Backlinks** (outside this repo): link from mmcconvert.com to the MigrationHub home page with the anchor text "MigrationHub"; create LinkedIn, Crunchbase, G2 profiles, then add their URLs to `SAME_AS` in `src/seo/site.ts`.
5. **Rich results**: paste the home page and `/how-it-works` into https://search.google.com/test/rich-results.
6. **Monitor**: after 2-4 weeks check Search Console -> Performance for the queries "migrationhub", "migration hub mmc convert", "mmc convert migrationhub"; check Pages for "Excluded" reasons.
7. Watch the CSP report-only header for a few days, then change it to `Content-Security-Policy` (the old Google Fonts hosts were removed from it).

## Needs your decision or input

- **`TODO(owner)`**: official profile URLs for `SAME_AS`; the official MMC Convert logo file for `LOGO_URL` (the MigrationHub mark is used for now).
- **`TODO(confirm)`**: the six steps on `/how-it-works`, the four FAQ answers (`src/seo/faq.ts`), and the platform list (`src/seo/platforms.ts`, which must match the live catalogue). "Every migration includes a reconciliation report" was already on the site; confirm it.
- **Accessibility contrast (not changed, brand decision)**: the MMC accent `#D97706` gives white text 3.18:1 and the small grey labels 4.16:1 (WCAG AA wants 4.5:1). Darkening the accent to about `#B45309` and `--text-tertiary` to `#6b6b6b` would fix Lighthouse's remaining accessibility finding.
- **`/features` and `/pricing` pages** were not created: they would duplicate the home page and pricing varies by pair and country. Pricing stays a home-page section.
- **`logos/bdo.svg`** has been missing for a long time (a 404 in the console, see `public/logos/README.md`); supply the file or remove BDO from `CompanyLogos`.
- The hero no longer fades in (it ships visible in the prerendered HTML, which is what the LCP needs).
