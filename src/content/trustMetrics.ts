/**
 * Every trust figure shown on Home, About, Sign-in and Sign-up lives here, so a number can never differ between pages.
 * A null value is hidden everywhere it is used. The values the site showed before were in conflict
 * (migrations 100,000+ vs 50k+, accuracy 99.8% vs 99.9%, time 19 min vs <30 min, 600+ accountants vs 500+ firms,
 * rating 4.9 vs 4.8, reviews 800+ vs 1,200), so none was carried over.
 * Supported pairs and platforms are not listed: they are derived from the catalogue API.
 */
export const TRUST_METRICS = {
  // TODO(owner): migrations completed, e.g. "100,000+"
  migrationsCompleted: null as string | null,
  // TODO(owner): data accuracy, e.g. "99.8%" (needs a documented basis)
  dataAccuracy: null as string | null,
  // TODO(owner): average migration time, e.g. "19 min"
  averageMigrationTime: null as string | null,
  // TODO(owner): accounting firms served, e.g. "500+"
  firmsServed: null as string | null,
  // TODO(owner): Trustpilot rating out of 5, e.g. "4.8"
  rating: null as string | null,
  // TODO(owner): Trustpilot review count, e.g. "1,200"
  reviewCount: null as string | null,
  // TODO(owner): years of conversion experience, e.g. "12+ yrs"
  yearsExperience: null as string | null,
  // TODO(owner): share who would recommend, e.g. "98%"
  wouldRecommend: null as string | null,
};

export type TrustMetricKey = keyof typeof TRUST_METRICS;

/** The stats to show, in order, skipping any the owner has not provided. */
export function visibleStats(
  items: Array<{ key: TrustMetricKey; label: string }>,
  metrics: Record<TrustMetricKey, string | null> = TRUST_METRICS,
): Array<{ value: string; label: string }> {
  return items.flatMap(({ key, label }) => (metrics[key] ? [{ value: metrics[key] as string, label }] : []));
}
