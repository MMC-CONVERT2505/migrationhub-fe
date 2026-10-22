/** Customer-facing platform names. Internal keys ("QBO") stay as they are — slugs, logos and per-pair rules depend on them. */
const DISPLAY: Record<string, string> = { qbo: 'QuickBooks Online' };

export const platformDisplayName = (name: string): string => DISPLAY[name.trim().toLowerCase()] ?? name;

/** "Xero → QuickBooks Online" */
export const pairDisplayName = (pair: { src: string; dst: string }): string =>
  `${platformDisplayName(pair.src)} → ${platformDisplayName(pair.dst)}`;
