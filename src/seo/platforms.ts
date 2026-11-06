/** The migrations on offer, by source platform. Static on purpose: crawlers must see them in the HTML.
 *  TODO(confirm): keep in step with the live catalogue (GET /migration-pairs/available). */
export interface PlatformGroup {
  source: string;
  destinations: string[];
}

/** Catalogue key of each platform name below. A pair's page is /migration/<source key>-to-<destination key>/plan
 *  (see pairSlug), so links are built from these keys, never from the display names. */
export const PLATFORM_KEYS: Record<string, string> = {
  'QuickBooks Online': 'qbo',
  Xero: 'xero',
  MYOB: 'myob',
  FreshBooks: 'freshbooks',
  Reckon: 'reckon',
  Prosaic: 'prosaic',
  Tally: 'tally',
  'Zoho Books': 'zoho',
};

export const PLATFORM_GROUPS: PlatformGroup[] = [
  { source: 'QuickBooks Online', destinations: ['Xero', 'FreshBooks', 'MYOB'] },
  { source: 'Xero', destinations: ['QuickBooks Online', 'MYOB', 'Reckon', 'Prosaic'] },
  { source: 'MYOB', destinations: ['QuickBooks Online'] },
  { source: 'Tally', destinations: ['Zoho Books'] },
];
