import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { migrationPairsService } from '@/api/migrationPairs';
import { apiPairToUiPair, extractList } from '@/utils/platformMap';
import { summarisePlans, type PlanSummary } from '@/utils/pricing';
import { formatCurrency } from '@/utils/format';
import { goToSection } from '@/utils/scroll';
import type { Pair } from '@/types';
import type { MigrationPairEntity } from '@/types/api';

const priceLabel = (p: PlanSummary) => {
  if (p.max === 0) return 'Free';
  return p.min === p.max ? formatCurrency(p.min) : `from ${formatCurrency(p.min)}`;
};

/** Home-page "Pricing" section: the plans on offer across all migrations, priced per migration pair. */
export const PricingSection: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    migrationPairsService
      .available()
      .then((res) => {
        if (cancelled) return;
        setPairs(extractList<MigrationPairEntity>(res).map(apiPairToUiPair));
        setState('ready');
      })
      .catch(() => { if (!cancelled) setState('error'); });
    return () => { cancelled = true; };
  }, []);

  const plans = useMemo(() => summarisePlans(pairs), [pairs]);
  const showPlans = state === 'ready' && plans.length > 0;

  return (
    <section id="pricing" className="py-20 bg-bg-light scroll-mt-16" aria-labelledby="pricing-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">Pricing</p>
          <h2 id="pricing-title" className="mt-3 text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Simple, one-time pricing</h2>
          <p className="mt-3 text-text-secondary">
            Pay once per migration — no subscriptions. The exact price depends on the migration you choose, so pick yours to see it.
          </p>
        </motion.div>

        {state === 'loading' && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6" aria-hidden="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-56 rounded-xl bg-white border border-border animate-pulse" />)}
          </div>
        )}

        {showPlans && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div key={p.key} className={`relative bg-white rounded-xl p-6 flex flex-col border ${p.popular ? 'border-blue-600 shadow-card' : 'border-border'}`}>
                {p.popular && <span className="absolute -top-px right-4 rounded-b-md bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Most popular</span>}
                <h3 className="text-lg font-bold text-text-primary">{p.name}</h3>
                {p.history && <p className="mt-0.5 text-xs text-text-secondary">{p.history}</p>}
                <p className="mt-4 font-mono text-3xl font-bold text-text-primary">{priceLabel(p)}</p>
                {p.max > 0 && <p className="text-[11px] text-text-tertiary">one-time · {p.currency}</p>}
                {p.support && <p className="mt-3 text-sm text-text-secondary">{p.support}</p>}
                {p.features.length > 0 && (
                  <ul className="mt-3 space-y-1.5 flex-1">
                    {p.features.slice(0, 6).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {state !== 'loading' && !showPlans && (
          <p className="mt-10 text-center text-sm text-text-secondary">
            Plans and prices are shown for each migration. Choose your migration below to see them.
          </p>
        )}

        <div className="mt-10 text-center">
          <Button variant="primary" size="lg" onClick={() => goToSection('pairs', pathname, navigate)}>Choose your migration</Button>
        </div>
      </div>
    </section>
  );
};
