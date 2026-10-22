import { describe, expect, it } from 'vitest';
import { pairDisplayName, platformDisplayName } from '../platformName';

describe('platformDisplayName', () => {
  it('spells QBO out, whatever its case or padding', () => {
    for (const n of ['QBO', 'qbo', ' Qbo ']) expect(platformDisplayName(n)).toBe('QuickBooks Online');
  });
  it('leaves every other name (and look-alikes) alone', () => {
    for (const n of ['Xero', 'MYOB', 'QuickBooks Online', 'QBOX', 'QBO Desktop', '']) expect(platformDisplayName(n)).toBe(n);
  });
  it('builds the pair label for either direction', () => {
    expect(pairDisplayName({ src: 'QBO', dst: 'Xero' })).toBe('QuickBooks Online → Xero');
    expect(pairDisplayName({ src: 'MYOB', dst: 'QBO' })).toBe('MYOB → QuickBooks Online');
  });
});
