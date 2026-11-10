import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { getAvailablePairs } from '@/api/availablePairs';
import { apiPairToUiPair, extractList } from '@/utils/platformMap';
import { pricingInclusions } from '@/utils/pricingInclusions';
import { MAX_PRICING_CARDS, summarisePlans, type PlanSummary } from '@/utils/pricing';
import { countriesOf, normalizeCountry } from '@/utils/countryPricing';
import { useAppStore } from '@/store/appStore';
import { formatCurrency } from '@/utils/format';
import { goToSection } from '@/utils/scroll';
import { detectVisitorCountry } from '@/utils/visitorCountry';
import type { Pair } from '@/types';
import type { MigrationPairEntity } from '@/types/api';

const priceLabel = (p: PlanSummary) => {
  if (p.max === 0) return 'Free';
  // Lead with what a paying customer pays; free migrations are noted underneath, never shown as "from 0".
  return p.minPaid === p.max ? formatCurrency(p.max, p.currency) : `from ${formatCurrency(p.minPaid, p.currency)}`;
};

/** Home-page "Pricing" section: the plans on offer across all migrations, priced per migration pair. */
export const PricingSection: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    getAvailablePairs()
      .then((res) => {
        if (cancelled) return;
        setPairs(extractList<MigrationPairEntity>(res).map(apiPairToUiPair));
        setState('ready');
      })
      .catch(() => { if (!cancelled) setState('error'); });
    return () => { cancelled = true; };
  }, []);

  // The visitor's country is only a starting hint. An explicit selection remains in session storage and carries into checkout.
  const storedCountry = useAppStore((s) => s.selectedCountry);
  const setSelectedCountry = useAppStore((s) => s.setSelectedCountry);
  const countries = useMemo(() => countriesOf(pairs), [pairs]);
  const stored = normalizeCountry(storedCountry);
  // Where the visitor is browsing from (browser time zone, language as a fallback): a starting point only. Nothing is
  // sent anywhere or saved until they choose; their own choice always wins.
  const detected = useMemo(() => normalizeCountry(detectVisitorCountry()), []);
  // "Other" is its own choice: without it, picking it would empty the stored country and detection would fill it right back in.
  const [otherChosen, setOtherChosen] = useState(false);
  const country = countries.length === 0 || otherChosen
    ? null
    : stored && countries.includes(stored) ? stored : detected && countries.includes(detected) ? detected : null;

  const plans = useMemo(() => summarisePlans(pairs, 'USD', country).slice(0, MAX_PRICING_CARDS), [pairs, country]);
  // "Other" (or a country we do not sell in): without a country the cards would mix every currency, so show none
  // and say where to go instead.
  const otherCountry = state === 'ready' && countries.length > 0 && !country;
  const showPlans = state === 'ready' && !otherCountry && plans.length > 0;

  return (
    <section id="pricing" className="py-20 bg-bg-light scroll-mt-16" aria-labelledby="pricing-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Pricing</p>
          <h2 id="pricing-title" className="mt-3 text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Simple, one-time pricing</h2>
        </motion.div>

        {state === 'ready' && countries.length > 0 && (
          <div className="mt-8 flex flex-col items-center gap-2">
            <label htmlFor="pricing-country" className="text-sm font-medium text-text-secondary">Select your country</label>
            <select
              id="pricing-country"
              value={country ?? 'Other'}
              onChange={(e) => {
                const v = e.target.value;
                setOtherChosen(v === 'Other' || !v);
                setSelectedCountry(v === 'Other' ? null : v || null);
              }}
              className="w-full max-w-xs rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
        )}

        {state === 'loading' && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6" aria-hidden="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-56 rounded-xl bg-white border border-border animate-pulse" />)}
          </div>
        )}

        {showPlans && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-live="polite">
            {plans.map((p) => {
              // Basic, Standard and Enterprise list a fixed set of inclusions (their history is the first one), with no
              // separate history or support line above them; any other plan shows what it is stored with.
              const fixed = pricingInclusions(p.name);
              const features = fixed ? [...fixed] : p.features.slice(0, 6);
              return (
              <div key={p.key} className={`relative bg-white rounded-xl p-6 flex flex-col border ${p.popular ? 'border-blue-600 shadow-card' : 'border-border'}`}>
                {p.popular && <span className="absolute -top-px right-4 rounded-b-md bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Most popular</span>}
                <h3 className="text-lg font-bold text-text-primary">{p.name}</h3>
                {!fixed && p.history && <p className="mt-0.5 text-xs text-text-secondary">{p.history}</p>}
                <p className="mt-4 font-mono text-3xl font-bold text-text-primary">{priceLabel(p)}</p>
                {p.max > 0 && <p className="text-[11px] text-text-tertiary">one-time · {p.currency}{p.taxRate > 0 ? ` · +${p.taxRate}% GST` : ''}{p.hasFree ? ' · free on some migrations' : ''}</p>}
                {!fixed && p.support && <p className="mt-3 text-sm text-text-secondary">{p.support}</p>}
                {features.length > 0 && (
                  <ul className="mt-3 space-y-1.5 flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              );
            })}
          </div>
        )}

        {otherCountry && (
          <p role="status" className="mt-10 text-center text-sm text-text-secondary">
            We sell these migrations in the countries listed above. Not on the list?{' '}
            <Link to="/contact" className="font-semibold text-blue-700 hover:underline">Contact us</Link>
            {' '}and we will tell you what is possible.
          </p>
        )}

        {state !== 'loading' && !showPlans && !otherCountry && (
          <p className="mt-10 text-center text-sm text-text-secondary">
            {state === 'ready' && country
              ? `No plans are listed for ${country} yet. Choose your migration below to see what is available.`
              : 'Plans and prices are shown for each migration. Choose your migration below to see them.'}
          </p>
        )}

        <div className="mt-10 text-center">
          <Button variant="primary" size="lg" onClick={() => goToSection('pairs', pathname, navigate)}>Choose your migration</Button>
        </div>
      </div>
    </section>
  );
};
