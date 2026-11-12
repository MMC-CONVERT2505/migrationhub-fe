import { describe, expect, it } from 'vitest';
import { ALL_SECTIONS, PRIVACY_UPDATED, type Block } from '../privacyPolicy';

/** The plain text of every block of the policy, so a wording edit is checked against what a visitor reads. */
function textOf(b: Block): string {
  const node = (n: unknown): string =>
    typeof n === 'string' ? n : Array.isArray(n) ? n.map(node).join(' ') : n && typeof n === 'object' && 'props' in n ? node((n as { props: { children?: unknown } }).props.children) : '';
  if (b.type === 'p') return `${b.lead ?? ''} ${node(b.content)}`.trim();
  if (b.type === 'list') return b.items.map(node).join('\n');
  return [b.caption, ...b.head, ...b.rows.flat().map(node)].join('\n');
}
const POLICY = ALL_SECTIONS.flatMap((s) => s.blocks.map(textOf)).join('\n').replace(/[ \t]+/g, ' ');

describe('privacy policy: the requested wording', () => {
  it.each([
    ['Cloud hosting: Amazon Web Services'],
    ['Encryption in transit (TLS 1.2 or higher) and at rest (AES-256)'],
    ['Security testing and vulnerability management annually'],
    ['Automated decisions. Migration Hub uses software to map and transfer records. We do not make decisions about you that have legal or similarly significant effects based solely on automated processing.'],
    ['Changes to this policy. We will post any update on this page and change the "Last updated" date. If a change is significant, for example a new purpose for your data, we will tell you by email or in the app at least 14 days before it takes effect and, where required, ask for your consent. Previous versions are available on request.'],
    ['Our migration specialists access your data only to resolve errors or answer your support requests, under confidentiality obligations.'],
    ['We keep data only as long as we need it for the purposes above, then delete or anonymise it.'],
  ])('says exactly: %s', (line) => {
    expect(POLICY).toContain(line);
  });

  it.each([
    'Proposed periods are below',
    'final figures to be confirmed',
    '[Amazon Web Services]',
    '[AES-256]',
    '[at least annually]',
    '[14]',
    'our specialists review mappings',
    'only to review mappings',
  ])('no longer says: %s', (gone) => {
    expect(POLICY).not.toContain(gone);
  });

  it('leaves no sentence ending in a stray space or double space where text was removed', () => {
    expect(POLICY).not.toMatch(/delete or anonymise it\.\s+\n/);
    expect(POLICY).not.toMatch(/records\.  We/);
  });

  it('shows a real, current "Last updated" date', () => {
    expect(PRIVACY_UPDATED).toBe('12th November 2026');
  });
});
