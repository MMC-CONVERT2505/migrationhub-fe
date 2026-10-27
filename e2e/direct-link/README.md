# Direct-link end-to-end checks

Real-browser checks of the website direct links (`/migration/details/<pair>/free`) for Xero → Reckon, Xero → MYOB and
QBO → MYOB, against the Hub home-page flow for the same pairs. They run against a local mock API (`mock-api.cjs`) that
serves `catalogue.json` (the nine seeded pairs and their country prices); no database and no production system.

```
PLAYWRIGHT_PATH=/path/to/node_modules/playwright CHROME_PATH=/usr/bin/google-chrome bash e2e/direct-link/run.sh
```

- `flow.cjs`: both entry modes, Australia and New Zealand, creation payload, lock rules, failure and outage handling.
- `back.cjs`: the Back button is hidden inside a direct-link flow and shown in the home-page flow.
- `edges.cjs`: a deep link replacing a held flow, resuming with the same token, a missing Free plan, a small screen.
