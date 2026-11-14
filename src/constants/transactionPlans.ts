// Types of data migration offered by the Xero → QBO conversion tool.
// Values mirror the BE `TransactionPlan` Prisma enum — the API rejects anything else.
export const TRANSACTION_PLANS = [
  { value: 'PayrollWithTransaction', label: 'Payroll With Transaction' },
  { value: 'Transaction', label: 'Transaction' },
] as const;

export type TransactionPlan = (typeof TRANSACTION_PLANS)[number]['value'];

/** Preselected on the form, as it always has been: the first option. */
export const DEFAULT_TRANSACTION_PLAN: TransactionPlan = TRANSACTION_PLANS[0].value;

export const transactionPlanLabel = (value?: string | null) =>
  TRANSACTION_PLANS.find((p) => p.value === value)?.label ?? null;

/** Narrows anything read back from storage or the API (a stale value, a typo) to one the API will accept. */
export const isTransactionPlan = (value: unknown): value is TransactionPlan =>
  TRANSACTION_PLANS.some((p) => p.value === value);

/** The migration type is asked on one pair only: Xero → QuickBooks Online. Matched case-insensitively, like every pair check on the form. */
export const asksTransactionPlan = (pair?: { src?: string | null; dst?: string | null } | null): boolean =>
  pair?.src?.toLowerCase() === 'xero' && pair?.dst?.toLowerCase() === 'qbo';

/** What to send with the inquiry: the customer's choice (or the default if it is unusable) on Xero → QBO, nothing on any other pair. */
export const transactionPlanToSend = (
  pair: { src?: string | null; dst?: string | null } | null | undefined,
  chosen: unknown,
): TransactionPlan | undefined => {
  if (!asksTransactionPlan(pair)) return undefined;
  return isTransactionPlan(chosen) ? chosen : DEFAULT_TRANSACTION_PLAN;
};
