/**
 * The country a chosen dial code should select, or null to leave the country alone.
 *
 * Only unambiguous codes move the country: the current country is kept whenever it already
 * uses the code (so +1 never flips Canada to the United States), a code shared by several
 * allowed countries picks the first of them, and a code no allowed country uses — an overseas
 * number on a region-restricted pair — changes nothing.
 */
export function countryForDialCode(
  dialCode: string,
  allowedCountries: readonly string[],
  currentCountry: string,
  dialCodeByCountry: Readonly<Record<string, string>>,
): string | null {
  const matches = allowedCountries.filter((c) => dialCodeByCountry[c] === dialCode);
  if (matches.length === 0 || matches.includes(currentCountry)) return null;
  return matches[0];
}
