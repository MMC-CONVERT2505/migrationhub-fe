/**
 * What the home-page pricing cards list for each plan, in this exact order. It replaces the plan's own history line,
 * support line and feature list on those cards only; the plan step and checkout still show the plan as stored.
 * Plans not listed here (e.g. Free) keep showing what they are stored with.
 */
export const PRICING_INCLUSIONS: Readonly<Record<string, readonly string[]>> = {
  basic: ['Current Financial Year + 1 Historical Year', 'All data categories', 'Payroll', 'Attachments', 'Multi-Currency', 'Quality Analysis Report'],
  standard: ['Current Financial Year + 3 Historical Years', 'All data categories', 'Payroll', 'Attachments', 'Multi-Currency', 'Quality Analysis Report'],
  enterprise: ['Inception to date', 'All data categories', 'Payroll', 'Attachments', 'Multi-Currency', 'Quality Analysis Report'],
};

export const pricingInclusions = (planName: string): readonly string[] | null =>
  PRICING_INCLUSIONS[planName.trim().toLowerCase()] ?? null;
