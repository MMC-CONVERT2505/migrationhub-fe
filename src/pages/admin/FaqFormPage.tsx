import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { faqsService } from '@/api/faqs';
import { migrationPairsService } from '@/api/migrationPairs';
import { ApiError } from '@/api/client';
import { extractList } from '@/utils/platformMap';
import { RichTextEditor, isRichTextBlank } from '@/components/admin/RichTextEditor';
import type {
  CreateFaqRequest,
  FaqEntity,
  FaqStatus,
  ListMigrationPairsQuery,
  MigrationPairEntity,
} from '@/types/api';

// ─── Shared UI primitives (match the other admin pages) ───────────────────────

const inputCls =
  'w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors bg-white disabled:bg-bg-light disabled:text-text-tertiary';

const FORM_ID = 'faq-form';

const Field: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, required, hint, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-text-secondary">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11px] text-text-secondary">{hint}</p>}
  </div>
);

// ─── Form state ───────────────────────────────────────────────────────────────

interface QaDraft {
  /** Client-side identity, so a row keeps its editor instance across reorders. */
  uid: string;
  question: string;
  answer: string;
}

interface FaqFormState {
  migrationPairId: string;
  description: string;
  status: FaqStatus;
  items: QaDraft[];
}

const newUid = () => Math.random().toString(36).slice(2, 10);
const emptyDraft = (): QaDraft => ({ uid: newUid(), question: '', answer: '' });
const emptyForm = (): FaqFormState => ({
  migrationPairId: '',
  description: '',
  status: 'Active',
  items: [emptyDraft()],
});

// ─── Question & answer accordion ──────────────────────────────────────────────

const IconButton: React.FC<{
  title: string;
  disabled?: boolean;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ title, disabled, onClick, danger, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    disabled={disabled}
    onClick={onClick}
    className={`p-1.5 rounded-md text-text-secondary transition-colors disabled:opacity-30 disabled:hover:bg-transparent ${
      danger ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-blue-600 hover:bg-blue-50'
    }`}
  >
    {children}
  </button>
);

const QaList: React.FC<{
  items: QaDraft[];
  openUids: Set<string>;
  onChange: (items: QaDraft[]) => void;
  onToggle: (uid: string) => void;
  onAdd: () => void;
}> = ({ items, openUids, onChange, onToggle, onAdd }) => {
  const patch = (uid: string, next: Partial<QaDraft>) =>
    onChange(items.map((item) => (item.uid === uid ? { ...item, ...next } : item)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const open = openUids.has(item.uid);
        const blank = isRichTextBlank(item.answer);

        return (
          <div
            key={item.uid}
            className={`border rounded-xl bg-white overflow-hidden transition-colors ${
              open ? 'border-blue-300 shadow-card' : 'border-border'
            }`}
          >
            {/* Header — the whole label toggles; the controls sit outside it so
                no button is ever nested inside another. */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button
                type="button"
                onClick={() => onToggle(item.uid)}
                aria-expanded={open}
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left group"
              >
                <svg
                  className={`w-4 h-4 flex-shrink-0 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                <span className="flex-shrink-0 w-6 h-6 rounded-md bg-bg-light text-text-secondary text-xs font-semibold flex items-center justify-center">
                  {index + 1}
                </span>
                <span
                  className={`text-sm truncate ${
                    item.question.trim()
                      ? 'font-medium text-text-primary group-hover:text-blue-700'
                      : 'italic text-text-secondary'
                  }`}
                >
                  {item.question.trim() || 'Untitled question'}
                </span>
                {blank && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700">
                    No answer
                  </span>
                )}
              </button>

              <div className="flex items-center gap-0.5 flex-shrink-0">
                <IconButton title="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </IconButton>
                <IconButton title="Move down" disabled={index === items.length - 1} onClick={() => move(index, 1)}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </IconButton>
                <IconButton
                  title="Remove question"
                  danger
                  disabled={items.length === 1}
                  onClick={() => onChange(items.filter((q) => q.uid !== item.uid))}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </IconButton>
              </div>
            </div>

            {open && (
              <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border">
                <Field label="Question" required>
                  <input
                    className={inputCls}
                    value={item.question}
                    onChange={(e) => patch(item.uid, { question: e.target.value })}
                    placeholder="How long does a migration take?"
                  />
                </Field>

                <Field label="Answer" required hint="Formatting and images are allowed; anything unsafe is stripped when saved.">
                  <RichTextEditor
                    value={item.answer}
                    onChange={(html) => patch(item.uid, { answer: html })}
                  />
                </Field>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add question
      </button>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const FaqFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState<FaqFormState>(emptyForm);
  const [openUids, setOpenUids] = useState<Set<string>>(new Set());
  const [pairs, setPairs] = useState<MigrationPairEntity[]>([]);
  const [takenPairIds, setTakenPairIds] = useState<Set<string>>(new Set());
  const [existing, setExisting] = useState<FaqEntity | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [pairRes, faqListRes, faq] = await Promise.all([
        migrationPairsService.list({ take: 200 } as unknown as ListMigrationPairsQuery),
        faqsService.list({ take: 200 }),
        isEdit ? faqsService.getById(id as string) : Promise.resolve(null),
      ]);

      setPairs(extractList<MigrationPairEntity>(pairRes));

      // One FAQ per pair, so every *other* FAQ's pair is unavailable here.
      const all = extractList<FaqEntity>(faqListRes);
      setTakenPairIds(
        new Set(all.filter((f) => f.id !== id).map((f) => f.migrationPairId)),
      );

      if (faq) {
        const items: QaDraft[] = faq.items.length
          ? faq.items.map((item) => ({
              uid: item.id,
              question: item.question,
              answer: item.answer,
            }))
          : [emptyDraft()];

        setExisting(faq);
        setForm({
          migrationPairId: faq.migrationPairId,
          description: faq.description ?? '',
          status: faq.status,
          items,
        });
        // Long answers are the reason this is an accordion: start collapsed so
        // the whole set is scannable, unless there is only one to look at.
        setOpenUids(items.length > 1 ? new Set() : new Set(items.map((i) => i.uid)));
      } else {
        const fresh = emptyForm();
        setForm(fresh);
        setOpenUids(new Set(fresh.items.map((i) => i.uid)));
      }
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load this FAQ.');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    load();
  }, [load]);

  const selectablePairs = useMemo(
    () => pairs.filter((pair) => !takenPairIds.has(String(pair.id))),
    [pairs, takenPairIds],
  );

  const toggleItem = (uid: string) =>
    setOpenUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });

  const addItem = () => {
    const draft = emptyDraft();
    setForm((f) => ({ ...f, items: [...f.items, draft] }));
    setOpenUids((prev) => new Set(prev).add(draft.uid));
  };

  const expandAll = () => setOpenUids(new Set(form.items.map((i) => i.uid)));
  const collapseAll = () => setOpenUids(new Set());

  /** Mirrors the server's checks so a mistake is caught before the round-trip. */
  const buildPayload = (): CreateFaqRequest | null => {
    // A collapsed row hides its own error, so reveal whichever one failed.
    const fail = (uid: string, message: string) => {
      setOpenUids((prev) => new Set(prev).add(uid));
      setFormError(message);
      return null;
    };

    if (!form.migrationPairId) {
      setFormError('Choose a migration pair.');
      return null;
    }

    const items = form.items.map((item) => ({
      question: item.question.trim(),
      answer: item.answer,
    }));

    if (!items.length) {
      setFormError('Add at least one question.');
      return null;
    }

    const seen = new Set<string>();
    for (let index = 0; index < items.length; index++) {
      const { question, answer } = items[index];
      const uid = form.items[index].uid;

      if (!question) return fail(uid, `Question ${index + 1} is empty.`);
      if (seen.has(question.toLowerCase())) {
        return fail(uid, `Duplicate question: “${question}”.`);
      }
      seen.add(question.toLowerCase());
      if (isRichTextBlank(answer)) {
        return fail(uid, `The answer for “${question}” is empty.`);
      }
    }

    return {
      migrationPairId: form.migrationPairId,
      // Empty string, not undefined: undefined means "leave unchanged", which
      // would make clearing the box on an edit silently keep the old text.
      description: isRichTextBlank(form.description) ? '' : form.description,
      status: form.status,
      items,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) {
      // Save sits in the sticky bar but the error banner is at the top of a page
      // that is now long, so bring it into view rather than failing silently.
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      if (isEdit) await faqsService.update(id as string, payload);
      else await faqsService.create(payload);
      navigate('/admin/faqs');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save the FAQ.');
    } finally {
      setSaving(false);
    }
  };

  const pairName = existing?.migrationPair?.displayName ?? existing?.migrationPairId ?? '';
  const subtitle = isEdit && pairName
    ? `Shown on the FAQ step for ${pairName}.`
    : 'Questions shown on the FAQ step for one migration pair.';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Sticky toolbar: the page is long once answers are open, so Save has to
          stay reachable. Bound to the form by id rather than nesting inside it. */}
      <div className="sticky top-16 z-30 -mx-6 px-6 py-3 mb-5 bg-bg/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/faqs"
            title="Back to FAQs"
            className="p-1.5 -ml-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-light transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-text-primary tracking-tight truncate">
              {isEdit ? 'Edit FAQ' : 'New FAQ'}
            </h1>
            <p className="text-xs text-text-secondary truncate">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/admin/faqs"
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-bg-light bg-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              form={FORM_ID}
              disabled={saving || loading || !!loadError}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create FAQ'}
            </button>
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="bg-white border border-border rounded-xl shadow-card p-8 flex flex-col items-center gap-3">
          <p className="text-sm text-red-700">{loadError}</p>
          <Link to="/admin/faqs" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            Back to FAQs
          </Link>
        </div>
      ) : loading ? (
        <div className="bg-white border border-border rounded-xl shadow-card flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>
          )}

          <section className="bg-white border border-border rounded-xl shadow-card p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="sm:col-span-1 xl:col-span-3">
                <Field label="Migration pair" required hint="Each pair can have one FAQ set.">
                  <select
                    className={inputCls}
                    value={form.migrationPairId}
                    onChange={(e) => setForm((f) => ({ ...f, migrationPairId: e.target.value }))}
                  >
                    <option value="">— Select a pair —</option>
                    {selectablePairs.map((pair) => (
                      <option key={String(pair.id)} value={String(pair.id)}>
                        {pair.displayName}
                      </option>
                    ))}
                  </select>
                </Field>
                {!isEdit && selectablePairs.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-700">
                    Every migration pair already has an FAQ — edit one of those instead.
                  </p>
                )}
              </div>
              <Field label="Status" hint="Inactive falls back to the default.">
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FaqStatus }))}
                >
                  <option value="Active">Active</option>
                  <option value="InActive">Inactive</option>
                </select>
              </Field>
            </div>

            <Field
              label="Description"
              hint="Intro shown under the page heading. Formatting and images are allowed. Optional."
            >
              {/* Keyed to the record so navigating straight between two FAQs
                  re-seeds the editor — it reads its initial HTML only on mount. */}
              <RichTextEditor
                key={`description-${id ?? 'new'}`}
                value={form.description}
                onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                placeholder="A few things worth knowing before you continue to plan selection and payment."
              />
            </Field>
          </section>

          <section className="bg-white border border-border rounded-xl shadow-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-sm font-semibold text-text-primary">
                Questions &amp; answers
                <span className="ml-2 font-normal text-text-secondary">
                  ({form.items.length})
                </span>
              </h2>
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-2 py-1 rounded-md font-medium text-text-secondary hover:text-text-primary hover:bg-bg-light transition-colors"
                >
                  Expand all
                </button>
                <span className="text-border">|</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-2 py-1 rounded-md font-medium text-text-secondary hover:text-text-primary hover:bg-bg-light transition-colors"
                >
                  Collapse all
                </button>
              </div>
            </div>

            <QaList
              items={form.items}
              openUids={openUids}
              onChange={(items) => setForm((f) => ({ ...f, items }))}
              onToggle={toggleItem}
              onAdd={addItem}
            />
          </section>
        </form>
      )}
    </motion.div>
  );
};

export default FaqFormPage;
