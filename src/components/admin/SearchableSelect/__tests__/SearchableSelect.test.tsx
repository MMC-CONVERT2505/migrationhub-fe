import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SearchableSelect } from '..';

const base = { label: 'Migration runner', allLabel: 'All runners', options: [], onSelect: () => {} };

describe('SearchableSelect (closed)', () => {
  it('shows the "all" label and is collapsed when nothing is picked', () => {
    const m = renderToStaticMarkup(<SearchableSelect {...base} selected={null} />);
    expect(m).toContain('All runners');
    expect(m).toContain('aria-expanded="false"');
    expect(m).toContain('aria-haspopup="listbox"');
  });
  it('names the picked option even when it is not in the option list', () => {
    const m = renderToStaticMarkup(<SearchableSelect {...base} selected={{ value: '7', label: 'Asha Rao' }} />);
    expect(m).toContain('Asha Rao');
    expect(m).not.toContain('All runners');
  });
});
