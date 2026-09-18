/**
 * Xero → Reckon One pair-specific constants. Nothing here is consumed by any other
 * migration pair — the shared flow keeps using the generic pair-scoped route.
 */

/**
 * Deep-link slug for the Xero → Reckon One pair, in the shape findPairBySlug resolves.
 * The destination is spelled `reckon` because that is the pair's `destination` key in
 * the DB ("Reckon One" is the product name, not the key); a `xero-to-reckon-one` slug
 * would match no pair and strand the visitor on "Migration unavailable".
 */
export const XERO_RECKON_SLUG = 'xero-to-reckon';

/**
 * Dedicated step 2 (Migration Details) route for Xero → Reckon One. This is the same
 * path pairDetailsPath builds for the pair, so every in-app link into step 2 already
 * lands here; declaring it as its own route pins the pair to the URL instead of leaving
 * it to the generic `:pairSlug` match.
 */
export const XERO_RECKON_DETAILS_PATH = `/migration/${XERO_RECKON_SLUG}/details`;
