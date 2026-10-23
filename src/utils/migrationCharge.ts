import { historyLabel } from '@/utils/historyYears';
import { formatCurrency } from '@/utils/format';

interface ChargeInput {
  migrationPair: { isFree: boolean };
  plan: { basePrice: string | number; currency: string; history: string; isInception?: boolean };
  yearsOverride?: number | null;
  paymentWaived?: boolean;
  payment?: { amount: string | number; status: string } | null;
}

/** What to show under "Total paid": the amount actually charged, never one computed from the plan price. */
export function chargeSummary(m: ChargeInput): { label: string; value: string } {
  const p = m.payment;
  if (p && /^success$/i.test(p.status)) {
    return { label: 'Total paid', value: `${m.plan.currency} ${formatCurrency(Number(p.amount)).slice(1)}` };
  }
  if (p) return { label: 'Payment', value: /^pending$/i.test(p.status) ? 'Pending' : p.status };
  if (m.paymentWaived) return { label: 'Charge', value: 'None' };
  if (m.migrationPair.isFree || Number(m.plan.basePrice) === 0) return { label: 'Total', value: 'Free' };
  return { label: 'Payment', value: 'Not paid' };
}

/** The plan's history text, or the extended one when the order added years. */
export function historyText(m: ChargeInput): string {
  return m.yearsOverride && !m.plan.isInception ? historyLabel(m.yearsOverride) : m.plan.history;
}
