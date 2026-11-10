import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserCountry, isPricedCountry } from '@/utils/browserCountry';

describe('browserCountry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('uses the browser locale region when it is supported', () => {
    vi.stubGlobal('navigator', { language: 'en-IN' });
    expect(browserCountry()).toBe('India');
  });

  it('falls back to a supported timezone when the locale has no region', () => {
    vi.stubGlobal('navigator', { language: 'en' });
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
      resolvedOptions: () => ({ timeZone: 'Asia/Kolkata' }),
    }) as Intl.DateTimeFormat);
    expect(browserCountry()).toBe('India');
  });

  it('returns null for an unsupported browsing region', () => {
    vi.stubGlobal('navigator', { language: 'fr-FR' });
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
      resolvedOptions: () => ({ timeZone: 'Europe/Paris' }),
    }) as Intl.DateTimeFormat);
    expect(browserCountry()).toBeNull();
  });
});

describe('isPricedCountry', () => {
  it('rejects the explicit Other fallback', () => {
    expect(isPricedCountry('India')).toBe(true);
    expect(isPricedCountry('Other')).toBe(false);
    expect(isPricedCountry(null)).toBe(false);
  });
});
