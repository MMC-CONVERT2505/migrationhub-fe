/**
 * Xero → MYOB pair-specific constants. Nothing here is consumed by any other
 * migration pair — the shared flow keeps using the generic pair-scoped route.
 */

/** Deep-link slug for the Xero → MYOB pair, in the shape findPairBySlug resolves. */
export const XERO_MYOB_SLUG = 'xero-to-myob';

/**
 * Dedicated step 2 (Migration Details) route for Xero → MYOB. This is the same path
 * pairDetailsPath builds for the pair, so every in-app link into step 2 already lands
 * here; declaring it as its own route pins the pair to the URL instead of leaving it
 * to the generic `:pairSlug` match.
 */
export const XERO_MYOB_DETAILS_PATH = `/migration/${XERO_MYOB_SLUG}/details`;
