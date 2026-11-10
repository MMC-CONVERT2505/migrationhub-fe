import { describe, expect, it } from 'vitest';
import { logoSource } from '..';

describe('logoSource', () => {
  const uploaded = 'https://api.example.test/storage/banner/abc.png';

  it('uses the clean local file for Tally, whatever the casing or spacing of its name', () => {
    for (const name of ['tally', 'Tally', 'TALLY', ' Tally ', 'Tally Prime'.replace(' Prime', '')]) {
      expect(logoSource(name, uploaded)).toBe('/logos/tally-logo.png');
    }
  });

  it('leaves every other logo on its uploaded image', () => {
    for (const name of ['qbo', 'xero', 'myob', 'freshbook', 'prosaic', 'reckon', 'zohobook', 'Tallyman']) {
      expect(logoSource(name, uploaded)).toBe(uploaded);
    }
  });

  it('never throws on an odd name', () => {
    expect(logoSource('', uploaded)).toBe(uploaded);
    expect(logoSource('   ', uploaded)).toBe(uploaded);
  });
});
