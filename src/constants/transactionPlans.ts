// Types of data migration offered by the Xero → QBO conversion tool.
// Values mirror the BE `TransactionPlan` Prisma enum — the API rejects anything else.
export const TRANSACTION_PLANS = [
  { value: 'PayrollWithTransaction', label: 'Payroll With Transaction' },
  { value: 'Transaction', label: 'Transaction' },
] as const;

export type TransactionPlan = (typeof TRANSACTION_PLANS)[number]['value'];

export const transactionPlanLabel = (value?: string | null) =>
  TRANSACTION_PLANS.find((p) => p.value === value)?.label ?? null;
