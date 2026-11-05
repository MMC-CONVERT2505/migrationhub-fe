import { describe, expect, it } from 'vitest';
import { pricingInclusions } from '../pricingInclusions';

const TAIL = ['All data categories', 'Payroll', 'Attachments', 'Multi-Currency', 'Quality Analysis Report'];

describe('pricingInclusions', () => {
  it('lists exactly the requested inclusions, in order, for the three plans', () => {
    expect(pricingInclusions('Basic')).toEqual(['Current Financial Year + 1 Historical Year', ...TAIL]);
    expect(pricingInclusions('Standard')).toEqual(['Current Financial Year + 3 Historical Years', ...TAIL]);
    expect(pricingInclusions('Enterprise')).toEqual(['Inception to date', ...TAIL]);
  });
  it('ignores case and surrounding spaces in the plan name', () => {
    expect(pricingInclusions('  BASIC ')).toEqual(pricingInclusions('Basic'));
  });
  it('leaves other plans (Free, custom) alone', () => {
    expect(pricingInclusions('Free')).toBeNull();
    expect(pricingInclusions('Custom')).toBeNull();
  });
  it('keeps none of the old inclusions', () => {
    const all = ['Basic', 'Standard', 'Enterprise'].flatMap((n) => [...pricingInclusions(n)!]).join('|');
    for (const gone of ['Email support', 'Priority', 'revisions', 'Reconciliation', 'Unlimited', 'Phone', 'year history', 'Dedicated', 'Payroll Included', 'Payroll +']) expect(all).not.toContain(gone);
  });
});
