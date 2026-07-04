export const PLATFORM_LOGOS: Record<string, string> = {
  qbo: '/logos/qbo.svg',
  xero: '/logos/xero.svg',
  myob: '/logos/myob.svg',
  freshbooks: '/logos/freshbooks.svg',
  tally: '/logos/tally.svg',
  zoho: '/logos/zoho.svg',
  reckon: '/logos/reckon.svg',
  prosaic: '/logos/prosaic.svg',
};

// Maps a pair's raw source/destination (slug or display name) to the canonical
// public-folder logo key. Keeps the lookup tolerant of naming variants so any
// pair tool resolves to its /logos/<file> when one exists.
const LOGO_ALIASES: Record<string, string> = {
  qbo: 'qbo',
  qb: 'qbo',
  quickbooks: 'qbo',
  quickbooksonline: 'qbo',
  xero: 'xero',
  myob: 'myob',
  freshbooks: 'freshbooks',
  freshbook: 'freshbooks',
  fb: 'freshbooks',
  tally: 'tally',
  tallyprime: 'tally',
  zoho: 'zoho',
  zohobooks: 'zoho',
  reckon: 'reckon',
  prosaic: 'prosaic',
};

/**
 * Resolve a platform key/name (e.g. "qbo", "QuickBooks Online") to its bundled
 * public-folder logo path, or null when there's no matching file. Matching is
 * case/punctuation-insensitive so it works off a pair's source/destination.
 */
export function platformLogo(key: string | null | undefined): string | null {
  if (!key) return null;
  const slug = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  const canonical = LOGO_ALIASES[slug] ?? slug;
  return PLATFORM_LOGOS[canonical] ?? null;
}

export const PLATFORM_KEY: Record<string, string> = {
  QBO: 'qbo',
  Xero: 'xero',
  MYOB: 'myob',
  FreshBooks: 'freshbooks',
  Tally: 'tally',
  ZOHO: 'zoho',
  Reckon: 'reckon',
  Prosaic: 'prosaic',
};

export const PLATFORM_COLORS: Record<string, string> = {
  QBO: '#2CA01C',
  Xero: '#13B5EA',
  MYOB: '#9B1C1C',
  FreshBooks: '#1E7FC3',
  Tally: '#EA580C',
  ZOHO: '#B91C1C',
  Reckon: '#1D4ED8',
  Prosaic: '#5B21B6',
};

export const PLATFORM_ABBR: Record<string, string> = {
  QBO: 'QB',
  Xero: 'XE',
  MYOB: 'MY',
  FreshBooks: 'FB',
  Tally: 'TA',
  ZOHO: 'ZO',
  Reckon: 'RK',
  Prosaic: 'PR',
};

export const WORKS_WITH_PLATFORMS = [
  { name: 'QuickBooks', key: 'qbo', abbr: 'QB', color: '#2CA01C' },
  { name: 'Xero', key: 'xero', abbr: 'XE', color: '#13B5EA' },
  { name: 'MYOB', key: 'myob', abbr: 'MY', color: '#9B1C1C' },
  { name: 'FreshBooks', key: 'freshbooks', abbr: 'FB', color: '#1E7FC3' },
  { name: 'Tally', key: 'tally', abbr: 'TA', color: '#EA580C' },
  { name: 'ZOHO', key: 'zoho', abbr: 'ZO', color: '#B91C1C' },
  { name: 'Reckon', key: 'reckon', abbr: 'RK', color: '#1D4ED8' },
  { name: 'Prosaic', key: 'prosaic', abbr: 'PR', color: '#5B21B6' },
];
