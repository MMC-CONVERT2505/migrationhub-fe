import { TRUST_METRICS } from '@/content/trustMetrics';
import React, { useEffect, useId, useState } from 'react';
import { GuideTree, safeNodes } from '@/components/migration/GuideTree';
import type { GuideNode } from '@/types/api';
import { Spinner } from '@/components/common/Spinner';
import { faqsService } from '@/api/faqs';

interface FaqEntry {
  key: string;
  question: string;
  /** Sanitized HTML: server-side allowlist for admin FAQs, escaped for defaults. */
  answerHtml: string;
  /** Module-list answer; rendered instead of answerHtml. */
  nodes?: GuideNode[] | null;
}

const escapeHtml = (text: string): string =>
  text.replace(
    /[&<>"]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] as string,
  );

/** Shown when the pair has no FAQ configured in the admin panel — and whenever
 *  the API is unreachable, so the FAQ can never block the journey. */
const DEFAULT_FAQS: { q: string; a: string }[] = [
  {
    q: 'How long does a migration take?',
    a: `${TRUST_METRICS.averageMigrationTime ? `Migrations take ${TRUST_METRICS.averageMigrationTime} on average. ` : ''}The time depends on the size of your data and the years of history, and you can track live progress on the migration screen once it starts.`,
  },
  {
    q: 'Is my data safe during the migration?',
    a: 'Yes. We connect to your source in read-only mode, encrypt all data in transit with 256-bit SSL, and never store your accounting credentials. We handle your data as described in our Privacy Policy.',
  },
  {
    q: 'What data gets migrated?',
    a: 'Chart of accounts, customers, suppliers, invoices, bills, payments, journals and the historical transactions for the financial years you select. Every record is mapped and reconciled.',
  },
  {
    q: 'Will my source data change?',
    a: 'No. The source is only ever read. Your original accounting file stays exactly as it is — the migration only writes into the destination platform.',
  },
  {
    q: 'What happens if something fails?',
    a: 'Migrations are auditable line by line. If a category fails, you will see exactly what and why, and our team is available to help resolve it.',
  },
  {
    q: 'Do I need to pay before connecting my applications?',
    a: 'Yes — after reviewing your migration details you complete payment, then connect your source and destination applications to begin.',
  },
];

const DEFAULT_ENTRIES: FaqEntry[] = DEFAULT_FAQS.map((item, index) => ({
  key: `default-${index}`,
  question: item.q,
  answerHtml: `<p>${escapeHtml(item.a)}</p>`,
}));

const defaultDescriptionHtml = (free: boolean) =>
  `<p>${escapeHtml(free ? 'A few things worth knowing before you continue.' : 'A few things worth knowing before you continue to payment.')}</p>`;

const FaqItem: React.FC<{ item: FaqEntry; open: boolean; onToggle: () => void; baseId: string; index: number }> = ({
  item, open, onToggle, baseId, index,
}) => {
  const buttonId = `${baseId}-q${index}`;
  const panelId = `${baseId}-a${index}`;
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white">
      <h3>
        <button
          type="button"
          id={buttonId}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left hover:bg-bg-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
        >
          <span className="text-sm font-semibold text-text-primary">{item.question}</span>
          <svg
            aria-hidden="true"
            className={`w-4 h-4 flex-shrink-0 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </h3>
      {item.nodes && item.nodes.length > 0 ? (
        <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!open} className="px-4 pb-4">
          <GuideTree nodes={item.nodes} />
        </div>
      ) : (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          hidden={!open}
          className="faq-answer px-4 pb-4 text-sm text-text-secondary leading-relaxed"
          // Safe by construction: admin answers are sanitized against a strict
          // allowlist before they are stored, and the defaults above are escaped.
          dangerouslySetInnerHTML={{ __html: item.answerHtml }}
        />
      )}
    </div>
  );
};

/** Per-pair FAQ as an accordion. Loads the pair's admin-authored FAQ and falls back to the
 *  built-in list, so it always has something to show. */
export const FaqAccordion: React.FC<{ pairId?: number | string | null; /** Free migrations have no payment step. */ free?: boolean }> = ({ pairId, free = false }) => {
  const baseId = useId();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [entries, setEntries] = useState<FaqEntry[]>(DEFAULT_ENTRIES);
  const [descriptionHtml, setDescriptionHtml] = useState<string>(defaultDescriptionHtml(free));
  const [loading, setLoading] = useState(pairId != null);

  useEffect(() => {
    // A pair with no id came from the local fallback list — nothing to look up.
    if (pairId == null) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    faqsService
      .byPair(String(pairId))
      .then((res) => {
        if (cancelled) return;
        const faq = res?.faq;
        if (faq && faq.items.length > 0) {
          setEntries(faq.items.map((item) => ({ key: item.id, question: item.question, answerHtml: item.answer, nodes: safeNodes(item.nodes).length ? item.nodes : null })));
          if (faq.description) setDescriptionHtml(faq.description);
          setOpenIdx(0);
        }
      })
      // No FAQ for this pair, or the API is unreachable — the built-in list stands.
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pairId]);

  return (
    <section aria-labelledby={`${baseId}-title`}>
      <h2 id={`${baseId}-title`} className="text-lg font-bold text-text-primary tracking-tight">
        Frequently asked questions
      </h2>
      <div
        className="faq-answer mt-1 mb-4 text-sm text-text-secondary"
        // Sanitized server-side against the allowlist; the built-in default is escaped.
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      />
      {loading ? (
        <div className="flex items-center justify-center py-10" role="status" aria-label="Loading questions">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((item, i) => (
            <FaqItem
              key={item.key}
              item={item}
              index={i}
              baseId={baseId}
              open={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
