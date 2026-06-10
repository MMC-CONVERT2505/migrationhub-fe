export const PLATFORM_LOGOS: Record<string, string> = {
  qbo: '/logos/qbo.png',
  xero: '/logos/xero.png',
  myob: '/logos/myob.png',
  freshbooks: '/logos/freshbooks.png',
  tally: '/logos/tally.png',
  zoho: '/logos/zoho.png',
  reckon: '/logos/reckon.png',
  prosaic: '/logos/prosaic.png',
};

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
