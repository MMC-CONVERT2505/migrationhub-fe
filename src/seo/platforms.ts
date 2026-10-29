/** The migrations on offer, by source platform. Static on purpose: crawlers must see them in the HTML.
 *  TODO(confirm): keep in step with the live catalogue (GET /migration-pairs/available). */
export interface PlatformGroup {
  source: string;
  destinations: string[];
}

export const PLATFORM_GROUPS: PlatformGroup[] = [
  { source: 'QuickBooks Online', destinations: ['Xero', 'FreshBooks', 'MYOB'] },
  { source: 'Xero', destinations: ['QuickBooks Online', 'MYOB', 'Reckon', 'Prosaic'] },
  { source: 'MYOB', destinations: ['QuickBooks Online'] },
  { source: 'Tally', destinations: ['Zoho Books'] },
];
