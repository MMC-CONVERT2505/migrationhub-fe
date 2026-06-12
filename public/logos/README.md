# Accounting firm logos

Used by `src/components/home/CompanyLogos` for the "Trusted by leading
accounting firms" section. Drop each file in with the **exact** name below
(SVG preferred for crisp scaling; PNG works too — if you use PNG, change the
extension in `CompanyLogos/index.tsx` to match).

Any firm whose file is missing falls back to a styled text badge automatically,
so the section is never broken.

| Firm           | File                       | Status            |
| -------------- | -------------------------- | ----------------- |
| KPMG           | `kpmg.png`                 | present           |
| Deloitte       | `deloitte.jpg`             | present           |
| Grant Thornton | `grant-thornton.png`       | present           |
| BDO            | `bdo.svg`                  | MISSING (fallback) |
| RSM            | `rsm.webp`                 | present           |
| Mazars         | `mazars.jpg`               | present           |
| PKF            | `pkf.png`                  | present           |

If the file name/extension here changes, update the matching entry in
`src/components/home/CompanyLogos/index.tsx`. BDO has no file yet, so it renders
as a text badge until `bdo.svg` (or another format — update the component) is added.

Only these seven firms are referenced. Do not add software/product logos
(Xero, QuickBooks, MYOB, etc.) here — they are not part of this section.
