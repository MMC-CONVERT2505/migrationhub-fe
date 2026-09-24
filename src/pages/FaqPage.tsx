import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { MigrationJourney } from '@/components/migration/MigrationJourney';
import { SelectedPairBanner } from '@/components/migration/SelectedPairBanner';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { pairDetailsPath } from '@/utils/platformMap';
import { useAppStore } from '@/store/appStore';
import { faqsService } from '@/api/faqs';

interface FaqEntry {
  key: string;
  question: string;
  /** Sanitized HTML: server-side allowlist for admin FAQs, escaped for defaults. */
  answerHtml: string;
}

const escapeHtml = (text: string): string =>
  text.replace(
    /[&<>"]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] as string,
  );

/** Shown when the pair has no FAQ configured in the admin panel — and whenever
 *  the API is unreachable, so this step can never block the journey. */
const DEFAULT_FAQS: { q: string; a: string }[] = [
  {
    q: 'How long does a migration take?',
    a: 'Most migrations complete in under 30 minutes. Larger datasets with several years of history can take longer — you can track live progress on the migration screen once it starts.',
  },
  {
    q: 'Is my data safe during the migration?',
    a: 'Yes. We connect to your source in read-only mode, encrypt all data in transit with 256-bit SSL, and never store your accounting credentials. We are SOC 2 aligned and GDPR ready.',
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
    a: 'Yes — after reviewing your migration details you select a plan and complete payment, then connect your source and destination applications to begin.',
  },
];

const DEFAULT_ENTRIES: FaqEntry[] = DEFAULT_FAQS.map((item, index) => ({
  key: `default-${index}`,
  question: item.q,
  answerHtml: `<p>${escapeHtml(item.a)}</p>`,
}));

const DEFAULT_DESCRIPTION_HTML = `<p>${escapeHtml(
  'A few things worth knowing before you continue to plan selection and payment.',
)}</p>`;

const FaqItem: React.FC<{ item: FaqEntry; open: boolean; onToggle: () => void }> = ({
  item,
  open,
  onToggle,
}) => (
  <div className="border border-border rounded-xl overflow-hidden bg-white">
    <button
      onClick={onToggle}
      aria-expanded={open}
      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-bg-light transition-colors"
    >
      <span className="text-sm font-semibold text-text-primary">{item.question}</span>
      <svg
        className={`w-4 h-4 flex-shrink-0 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {open && (
      <div
        className="faq-answer px-5 pb-4 text-sm text-text-secondary leading-relaxed"
        // Safe by construction: admin answers are sanitized against a strict
        // allowlist before they are stored, and the defaults above are escaped.
        dangerouslySetInnerHTML={{ __html: item.answerHtml }}
      />
    )}
  </div>
);

const FaqPage: React.FC = () => {
  const navigate = useNavigate();
  const selectedPair = useAppStore((s) => s.selectedPair);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const [entries, setEntries] = useState<FaqEntry[]>(DEFAULT_ENTRIES);
  const [descriptionHtml, setDescriptionHtml] = useState<string>(DEFAULT_DESCRIPTION_HTML);
  const [loading, setLoading] = useState(true);

  const pairId = selectedPair?.id;

  useEffect(() => {
    // A pair with no id came from the local fallback list, so there is nothing
    // to look up — the defaults already in state stand.
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
          setEntries(
            faq.items.map((item) => ({
              key: item.id,
              question: item.question,
              answerHtml: item.answer,
            })),
          );
          if (faq.description) setDescriptionHtml(faq.description);
        }
      })
      // No FAQ for this pair, or the API is unreachable — either way the
      // built-in list is a good answer and the user keeps moving.
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pairId]);

  if (!selectedPair) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-bg animate-screen-enter">
      <Navbar variant="migration" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MigrationJourney current={3} className="mb-8" />

        <SelectedPairBanner pair={selectedPair} className="mb-6" />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Frequently asked questions
          </h1>
          <div
            className="faq-answer mt-1 text-sm text-text-secondary"
            // Same guarantee as the answers: sanitized server-side against the
            // allowlist, and the built-in default above is escaped.
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((item, i) => (
              <FaqItem
                key={item.key}
                item={item}
                open={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? null : i)}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate(pairDetailsPath(selectedPair))}>Back</Button>
          <Button type="button" variant="primary" size="lg" fullWidth onClick={() => navigate('/payment')}>
            Continue to plan &amp; payment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
