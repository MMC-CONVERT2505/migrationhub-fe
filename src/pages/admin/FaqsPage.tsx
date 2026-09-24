import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { faqsService } from '@/api/faqs';
import { ApiError } from '@/api/client';
import { extractList } from '@/utils/platformMap';
import type { FaqEntity, FaqStatus } from '@/types/api';

// ─── Shared UI primitives (match the other admin pages) ───────────────────────

/** Tag-free preview of a rich-text field — the table shows one plain line. */
const plainText = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const Modal: React.FC<{
  title: string;
  wide?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, wide, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`relative bg-white rounded-2xl shadow-2xl w-full mb-10 ${wide ? 'max-w-3xl' : 'max-w-md'}`}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        <button
          onClick={onClose}
          className="text-text-tertiary hover:text-text-primary transition-colors p-1 rounded-md hover:bg-bg-light"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </motion.div>
  </div>
);

const StatusBadge: React.FC<{ status: FaqStatus }> = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
      status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-green-500' : 'bg-red-400'}`} />
    {status === 'Active' ? 'Active' : 'Inactive'}
  </span>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const FaqsPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<FaqEntity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await faqsService.list({ take: 200 });
      setFaqs(extractList<FaqEntity>(res));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load FAQs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await faqsService.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete the FAQ.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const pairLabel = (faq: FaqEntity) => faq.migrationPair?.displayName ?? faq.migrationPairId;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">FAQs</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Questions shown on the FAQ step, per migration pair — pairs without one show the site default
          </p>
        </div>
        <Link
          to="/admin/faqs/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add FAQ
        </Link>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-text-tertiary">
            <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No FAQs yet — every pair shows the site default</p>
            <Link to="/admin/faqs/new" className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-800">
              Add the first one
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-light">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Migration pair</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Questions</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {faqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-bg-light/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/faqs/${faq.id}`}
                        className="font-medium text-text-primary hover:text-blue-700 transition-colors"
                      >
                        {pairLabel(faq)}
                      </Link>
                      {faq.description && plainText(faq.description) && (
                        <p
                          className="text-xs text-text-tertiary truncate max-w-xs"
                          title={plainText(faq.description)}
                        >
                          {plainText(faq.description)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{faq.items.length}</td>
                    <td className="px-4 py-3"><StatusBadge status={faq.status} /></td>
                    <td className="px-4 py-3 text-text-tertiary text-xs">
                      {new Date(faq.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link
                          to={`/admin/faqs/${faq.id}`}
                          className="p-1.5 rounded-md text-text-tertiary hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(faq)}
                          className="p-1.5 rounded-md text-text-tertiary hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <Modal title="Delete FAQ" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Delete the FAQ for{' '}
              <span className="font-semibold text-text-primary">{pairLabel(deleteTarget)}</span>? That pair
              will fall back to the site default. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default FaqsPage;
