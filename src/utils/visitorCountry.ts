/**
 * Which of our price-list countries the visitor is most likely in, read from the browser itself: no network call, no
 * IP lookup, nothing stored or sent anywhere. The time zone is the main signal (an IANA name such as "Asia/Kolkata");
 * the language region ("en-IN") is only a fallback when the time zone says nothing. Returns null when neither points
 * at a country we sell in, and the caller then keeps its own default.
 */
const ZONES: Array<[RegExp, string]> = [
  [/^(Asia\/(Kolkata|Calcutta))$/, 'India'],
  [/^(Australia\/|Antarctica\/Macquarie$)/, 'Australia'],
  [/^(Pacific\/(Auckland|Chatham)|NZ(-CHAT)?)$/, 'New Zealand'],
  [/^(Europe\/(London|Belfast|Jersey|Guernsey|Isle_of_Man)|GB|GB-Eire)$/, 'United Kingdom'],
  [/^(Asia\/Singapore|Singapore)$/, 'Singapore'],
  [/^Asia\/Dubai$/, 'United Arab Emirates'],
  [/^Africa\/Johannesburg$/, 'South Africa'],
  [
    /^(Canada\/|America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Montreal|Moncton|Glace_Bay|Goose_Bay|Iqaluit|Whitehorse|Yellowknife|Rankin_Inlet|Cambridge_Bay|Dawson|Dawson_Creek|Fort_Nelson|Swift_Current|Thunder_Bay|Nipigon|Rainy_River|Pangnirtung|Resolute|Atikokan|Blanc-Sablon|Creston|Inuvik|Coral_Harbour)$)/,
    'Canada',
  ],
  [
    /^(US\/|America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Juneau|Sitka|Nome|Adak|Menominee|Yakutat|Metlakatla|Indiana\/|Kentucky\/|North_Dakota\/)|Pacific\/Honolulu$)/,
    'United States',
  ],
];

const REGIONS: Record<string, string> = {
  IN: 'India',
  AU: 'Australia',
  NZ: 'New Zealand',
  GB: 'United Kingdom',
  SG: 'Singapore',
  AE: 'United Arab Emirates',
  ZA: 'South Africa',
  CA: 'Canada',
  US: 'United States',
};

export function countryFromSignals(timeZone: string | null | undefined, languages: readonly string[] | null | undefined): string | null {
  const tz = (timeZone ?? '').trim();
  if (tz) {
    const hit = ZONES.find(([re]) => re.test(tz));
    if (hit) return hit[1];
  }
  for (const lang of languages ?? []) {
    const region = /^[A-Za-z]{2,3}[-_]([A-Za-z]{2})\b/.exec(String(lang))?.[1]?.toUpperCase();
    if (region && REGIONS[region]) return REGIONS[region];
  }
  return null;
}

/** The visitor's likely country from this browser, or null (never throws: some privacy modes block these APIs). */
export function detectVisitorCountry(): string | null {
  try {
    const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;
    const langs = typeof navigator !== 'undefined' ? (navigator.languages?.length ? navigator.languages : [navigator.language]) : [];
    return countryFromSignals(tz, langs);
  } catch {
    return null;
  }
}
