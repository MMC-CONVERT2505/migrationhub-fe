import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { FlowLayout } from '@/components/migration/FlowLayout';
import { SelectedPairBanner } from '@/components/migration/SelectedPairBanner';
import { PlanCard } from '@/components/payment/PlanCard';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/store/appStore';
import { migrationPairsService } from '@/api/migrationPairs';
import { apiPairToUiPair, extractList, findPairBySlug, pairCustomerPath, pairSlug } from '@/utils/platformMap';
import { findSelectedPlan, planRequired, usesFreePairBenefits } from '@/constants/migrationFlow';
import type { MigrationPairEntity } from '@/types/api';

// Display order: Free → Basic → Standard → Enterprise (unknown names sort last).
const PLAN_ORDER = ['free', 'basic', 'standard', 'enterprise'];
const rank = (name: string) => {
  const i = PLAN_ORDER.indexOf(name.trim().toLowerCase());
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};

/** Flow step 1: choose one of the plans attached to the selected pair. */
const MigrationPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPair = useAppStore((s) => s.selectedPair);
  const selectedPlanId = useAppStore((s) => s.selectedPlanId);
  const setSelectedPlanId = useAppStore((s) => s.setSelectedPlanId);
  const setSelectedPair = useAppStore((s) => s.setSelectedPair);

  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');

  const plans = useMemo(
    () => [...(selectedPair?.plans ?? [])].sort((a, b) => rank(a.name) - rank(b.name)),
    [selectedPair],
  );
  const selectedPlan = findSelectedPlan(selectedPair, selectedPlanId);

  // Pre-select a plan handed over by the website (?plan=<id or name>). Applied only when it names one of this pair's plans; the customer can still change it.
  const planParam = searchParams.get('plan');
  const pairId = selectedPair?.id;
  useEffect(() => {
    if (!planParam || plans.length === 0) return;
    const want = planParam.trim().toLowerCase();
    const match = plans.find((p) => p.id === planParam || p.name.trim().toLowerCase() === want);
    if (match?.id) setSelectedPlanId(match.id);
    // Consumed: drop it from the URL so coming back here later doesn't override a changed choice.
    setSearchParams((p) => { p.delete('plan'); return p; }, { replace: true });
  }, [planParam, pairId, plans, setSelectedPlanId, setSearchParams]);

  // A free pair with a single plan has nothing to choose between, and its card no longer
  // names the plan — so pick it for the customer rather than leave an unlabelled radio to find.
  const soleFreePlanId =
    selectedPair?.isFree && plans.length === 1 && Number(plans[0].basePrice) === 0 ? plans[0].id : undefined;
  useEffect(() => {
    if (soleFreePlanId && selectedPlanId !== soleFreePlanId) setSelectedPlanId(soleFreePlanId);
  }, [soleFreePlanId, selectedPlanId, setSelectedPlanId]);

  if (!selectedPair) return <Navigate to="/" replace />;

  const needsPlan = planRequired(selectedPair);

  // Re-fetch the public listing for this pair — the same call PairSlugGate makes.
  const retry = async () => {
    setRetrying(true);
    setRetryError('');
    try {
      const res = await migrationPairsService.available();
      const match = findPairBySlug(extractList<MigrationPairEntity>(res), pairSlug(selectedPair.src, selectedPair.dst));
      if (match) setSelectedPair(apiPairToUiPair(match));
      if (!match || (match.plans ?? []).length === 0) {
        setRetryError('No plans are available for this migration yet.');
      }
    } catch {
      setRetryError('We could not load the plans. Please check your connection and try again.');
    } finally {
      setRetrying(false);
    }
  };

  const noPlans = plans.length === 0 && needsPlan;

  return (
    <FlowLayout page="plan">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-card sm:p-8">
        <SelectedPairBanner pair={selectedPair} className="mb-6" />

        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Choose your migration plan</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {selectedPair.isFree
            ? 'This migration is free — choose the plan that fits your data.'
            : 'Pick the plan that matches how much history you need to bring across.'}
        </p>

        {noPlans ? (
          <div role="alert" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
            <p className="text-sm font-semibold text-text-primary">We couldn&rsquo;t load plans for this migration</p>
            <p className="mt-1 text-sm text-text-secondary">
              {retryError || 'Try again, or contact us and we will set it up for you.'}
            </p>
            <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
              <Button type="button" variant="primary" loading={retrying} onClick={retry}>Retry</Button>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-light"
              >
                Contact us
              </Link>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <p className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-text-secondary">
            This migration is free and has no plan to choose — continue to enter your details.
          </p>
        ) : (
          <fieldset className="mt-6 space-y-3">
            <legend className="sr-only">Migration plans</legend>
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                name="migration-plan"
                selected={selectedPlan?.id === plan.id}
                onSelect={setSelectedPlanId}
                freePairBenefits={usesFreePairBenefits(selectedPair, plan)}
              />
            ))}
          </fieldset>
        )}

        {!noPlans && (
          <div className="mt-6">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              disabled={needsPlan && !selectedPlan}
              onClick={() => navigate(pairCustomerPath(selectedPair))}
            >
              Continue
            </Button>
            {needsPlan && !selectedPlan && (
              <p className="mt-2 text-center text-xs text-text-tertiary">Select a plan to continue.</p>
            )}
          </div>
        )}
      </div>
    </FlowLayout>
  );
};

export default MigrationPlanPage;
