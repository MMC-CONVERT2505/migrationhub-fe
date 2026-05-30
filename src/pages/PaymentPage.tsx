import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { PlanCard } from '@/components/payment/PlanCard';
import { OrderSummary } from '@/components/payment/OrderSummary';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { plansService } from '@/api/plans';
import { PLANS } from '@/constants/plans';
import { apiPlanToUiPlan, extractList } from '@/utils/platformMap';
import { useAppStore } from '@/store/appStore';
import type { Plan } from '@/types';
import type { ApiPlan } from '@/types/api';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedPair, selectedPlanIndex, setSelectedPlan } = useAppStore((s) => ({
    selectedPair:      s.selectedPair,
    selectedPlanIndex: s.selectedPlanIndex,
    setSelectedPlan:   s.setSelectedPlan,
  }));

  const [apiPlans, setApiPlans]       = useState<ApiPlan[]>([]);
  const [uiPlans, setUiPlans]         = useState<Plan[]>(PLANS);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Guard: redirect home if no pair is selected
  if (!selectedPair) {
    navigate('/');
    return null;
  }

  // Fetch plans from API, fall back to constants
  useEffect(() => {
    plansService
      .list()
      .then((res) => {
        const items = extractList<ApiPlan>(res);
        if (items.length > 0) {
          setApiPlans(items);
          // Mark the middle plan as popular
          const midIdx = Math.floor(items.length / 2);
          setUiPlans(items.map((p, i) => apiPlanToUiPlan(p, i === midIdx)));
        } else {
          setUiPlans(PLANS);
        }
      })
      .catch(() => setUiPlans(PLANS))
      .finally(() => setLoadingPlans(false));
  }, []);

  const pair = selectedPair;

  return (
    <div className="min-h-screen bg-bg animate-screen-enter">
      <Navbar variant="payment" />

      {/* Page header */}
      <div className="bg-bg-light border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <p className="text-xs text-text-tertiary font-mono mb-2">
            MMC Convert <span className="text-text-secondary">/ Migration Pairs /</span>{' '}
            {pair.src} → {pair.dst}{' '}
            <span className="text-text-secondary">/ Checkout</span>
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white"
                style={{ backgroundColor: pair.srcColor }}
              >
                {pair.srcAbbr}
              </div>
              <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white"
                style={{ backgroundColor: pair.dstColor }}
              >
                {pair.dstAbbr}
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                {pair.src} → {pair.dst} Migration
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">
                Select a plan and complete payment to begin your migration
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-col layout */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
          {/* Left: Plan selector + Order summary */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-base font-bold text-text-primary mb-4">Select Migration Plan</h2>

            {loadingPlans ? (
              <div className="space-y-3 mb-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-28 bg-white border border-border rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {uiPlans.map((plan, i) => (
                  <PlanCard
                    key={plan.name}
                    plan={plan}
                    index={i}
                    selected={selectedPlanIndex === i}
                    onSelect={(idx) => {
                      setSelectedPlan(idx);
                    }}
                  />
                ))}
              </div>
            )}

            <OrderSummary uiPlans={uiPlans} />
          </motion.div>

          {/* Right: Payment form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
          >
            <PaymentForm />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
