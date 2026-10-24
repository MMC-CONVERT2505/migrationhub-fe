import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { FlowLayout } from '@/components/migration/FlowLayout';
import { SelectedPairBanner } from '@/components/migration/SelectedPairBanner';
import { PlanCard } from '@/components/payment/PlanCard';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/store/appStore';
import { Spinner } from '@/components/common/Spinner';
import { dedicatedDetailsPath, dedicatedFreePlan, detailsPathFor, skipsPlanStep } from '@/constants/dedicatedFlow';
import { migrationPairsService } from '@/api/migrationPairs';
import { apiPairToUiPair, extractList, findPairBySlug, pairSlug } from '@/utils/platformMap';
import { findSelectedPlan, planRequired, usesFreePairBenefits } from '@/constants/migrationFlow';
import { useOperationTeamMember } from '@/hooks/useIsOperationTeam';
import { canExtendPlan, effectiveYears, extensionCost, historyLabel, yearOptions } from '@/utils/historyYears';
import { planCurrency } from '@/constants/migrationFlow';
import { formatCurrency } from '@/utils/format';
import { hasPriceList, offeredCountries, orderTotals, pricedPlans, validCountry } from '@/utils/countryPricing';
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
  const selectedYears = useAppStore((s) => s.selectedYears);
  const storedCountry = useAppStore((s) => s.selectedCountry);
  const setSelectedCountry = useAppStore((s) => s.setSelectedCountry);
  const setSelectedYears = useAppStore((s) => s.setSelectedYears);
  const { isOperationTeam } = useOperationTeamMember();

  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');

  // A pair with a country price list is priced per country: the customer picks theirs first, and every
  // plan below is shown (and later charged) at that country's price. Other pairs ignore all of this.
  const priceListed = hasPriceList(selectedPair);
  const countries = useMemo(() => offeredCountries(selectedPair), [selectedPair]);
  const country = priceListed ? validCountry(selectedPair, storedCountry) : null;
  // A single-country pair has nothing to choose; a stale or unsold country is dropped, never guessed.
  useEffect(() => {
    if (!priceListed) return;
    const wanted = country ?? (countries.length === 1 ? countries[0] : null);
    if (wanted !== storedCountry) setSelectedCountry(wanted);
  }, [priceListed, country, storedCountry, countries, setSelectedCountry]);

  const plans = useMemo(
    () => [...pricedPlans(selectedPair, country)].sort((a, b) => rank(a.name) - rank(b.name)),
    [selectedPair, country],
  );
  const selectedPlan = findSelectedPlan(selectedPair, selectedPlanId, country);

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

  // Dedicated pair flow (Xero → Reckon): the plan step is still the first stop, but a free pair has nothing to
  // choose, so take the Free plan and go straight on to customer details with this tab's flow token.
  const dedicatedFlow = useAppStore((s) => s.dedicatedFlow);
  // Every visit to this step moves straight on (replacing it in the history), so it is never a place to come back
  // to: customer-details is the only stop. Back, the logo and the home page all end up there.
  const freeChoice = skipsPlanStep(selectedPair, dedicatedFlow) && selectedPair ? dedicatedFreePlan(selectedPair) : null;
  useEffect(() => {
    if (!freeChoice || !dedicatedFlow) return;
    setSelectedPlanId(freeChoice === 'none' ? null : (freeChoice.id ?? null));
    // The plan was priced for the pair's first country; the details step must start from that same country.
    if (hasPriceList(selectedPair)) setSelectedCountry(validCountry(selectedPair, storedCountry) ?? offeredCountries(selectedPair)[0] ?? null);
    navigate(dedicatedDetailsPath(dedicatedFlow), { replace: true });
  }, [freeChoice, dedicatedFlow, setSelectedPlanId, setSelectedCountry, selectedPair, storedCountry, navigate]);

  if (!selectedPair) return <Navigate to="/" replace />;
  if (freeChoice) return <div className="min-h-screen flex items-center justify-center bg-bg"><Spinner size="lg" /></div>;

  const needsPlan = planRequired(selectedPair);
  // Operation Team only: migrate more historical years than the plan covers.
  const canExtend = canExtendPlan(selectedPlan, isOperationTeam);
  const years = effectiveYears(selectedPlan, selectedYears, isOperationTeam);
  const extra = extensionCost(selectedPlan, years, isOperationTeam);
  const perYear = selectedPlan?.extraYearPrice ?? null;
  const fmt = (n: number) => formatCurrency(n, selectedPlan ? planCurrency(selectedPlan) : undefined);

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

  const awaitingCountry = priceListed && !country;
  const noPlans = plans.length === 0 && needsPlan && !awaitingCountry;

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

        {priceListed && countries.length > 0 && (
          <div className="mt-6">
            <label htmlFor="plan-country" className="text-sm font-semibold text-text-primary">Country your business is registered in</label>
            <p className="mt-0.5 text-xs text-text-secondary">
              This sets your currency and prices, and you&rsquo;ll confirm it with your details next. Not listed?{' '}
              <Link to="/contact" className="font-medium text-blue-700 hover:underline">Contact us</Link>.
            </p>
            <select
              id="plan-country"
              value={country ?? ''}
              onChange={(e) => setSelectedCountry(e.target.value || null)}
              className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {!country && <option value="">Select your country…</option>}
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {awaitingCountry ? (
          <p className="mt-6 rounded-xl border border-border bg-bg-light p-4 text-sm text-text-secondary">
            Select your country to see the plans and prices available to you.
          </p>
        ) : noPlans ? (
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
                historyText={selectedPlan?.id === plan.id && years != null && years !== plan.years ? historyLabel(years) : undefined}
              />
            ))}
          </fieldset>
        )}

        {!noPlans && canExtend && selectedPlan && years != null && (
          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <label htmlFor="history-years" className="text-sm font-semibold text-text-primary">Historical years</label>
            <p className="mt-0.5 text-xs text-text-secondary">
              {isOperationTeam
                ? 'Operation Team: migrate more history than the plan includes (no extra charge).'
                : perYear === 0
                  ? 'Need more history than the plan includes? Extra years are free.'
                  : `Need more history than the plan includes? Add extra years for ${fmt(perYear ?? 0)} each.`}
            </p>
            <select
              id="history-years"
              value={years}
              onChange={(e) => setSelectedYears(Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {yearOptions(selectedPlan).map((y) => (
                <option key={y} value={y}>
                  {historyLabel(y)}
                  {y === selectedPlan.years ? ' (plan)' : !isOperationTeam && perYear ? ` (+${fmt(perYear * (y - (selectedPlan.years ?? y)))})` : ''}
                </option>
              ))}
            </select>
            {!isOperationTeam && extra > 0 && (
              <p className="mt-2 text-sm font-semibold text-text-primary" aria-live="polite">
                Total: {fmt(orderTotals(selectedPlan, extra).subtotal)}{selectedPlan.taxRate ? ` + ${selectedPlan.taxRate}% GST` : ''}
                <span className="ml-1 font-normal text-text-secondary">
                  ({Number(selectedPlan.basePrice) > 0 ? `plan ${fmt(Number(selectedPlan.basePrice))} + ` : ''}{(years ?? 0) - (selectedPlan.years ?? 0)} extra year{(years ?? 0) - (selectedPlan.years ?? 0) === 1 ? '' : 's'})
                </span>
              </p>
            )}
          </div>
        )}

        {!noPlans && !awaitingCountry && (
          <div className="mt-6">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              disabled={(needsPlan && !selectedPlan) || awaitingCountry}
              onClick={() => navigate(detailsPathFor(selectedPair, dedicatedFlow))}
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
