import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ApiError } from '@/api/client';
import {
  HELP_DELETE_LIMIT,
  helpDeletePhrase,
  helpRequestCleanerService,
  type HelpCleanupLogEntry,
  type HelpDeleteResponse,
  type HelpRequestRow,
} from '@/api/adminHelpRequestCleaner';
import { reviewStatusMeta } from '@/constants/migrationReviewStatus';
import { usePermissions } from '@/hooks/usePermissions';
import { Modal } from '@/components/admin/Modal';
import { Pagination } from '@/components/admin/Pagination';
import { clampSkip } from '@/utils/pagination';

const PAGE_SIZE = 20;
type State = 'all' | 'open' | 'closed';
const STATES: { key: State; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'closed', label: 'Resolved / dismissed' },
  { key: 'open', label: 'Open' },
];

const fmt = (d: string) => new Date(d).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' });
const errMsg = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

const HelpRequestCleanerPage: React.FC = () => {
  const { can, isAdminAccount } = usePermissions();
  const canDelete = can('help-request-cleaner.run');

  const [state, setState] = useState<State>('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [skip, setSkip] = useState(0);
  const [rows, setRows] = useState<HelpRequestRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // The whole row is kept so the review can still name picks made on other pages.
  const [selected, setSelected] = useState<Map<string, HelpRequestRow>>(new Map());
  const [reviewing, setReviewing] = useState(false);
  const [outcome, setOutcome] = useState<HelpDeleteResponse | null>(null);
  const [history, setHistory] = useState<HelpCleanupLogEntry[] | null>(null);
  const [historyError, setHistoryError] = useState('');
  const reqId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = search.trim();
      setQuery((prev) => {
        if (prev !== q) { setSkip(0); setSelected(new Map()); }
        return q;
      });
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true); setError('');
    try {
      const res = await helpRequestCleanerService.search({
        search: query || undefined,
        state: state === 'all' ? undefined : state,
        skip,
        take: PAGE_SIZE,
      });
      if (id !== reqId.current) return;
      setRows(res.data); setTotal(res.total);
      const safe = clampSkip(skip, res.total, PAGE_SIZE);
      if (safe !== skip) setSkip(safe);
    } catch (e) {
      if (id !== reqId.current) return;
      setRows([]); setTotal(0);
      setError(errMsg(e, 'Failed to load help requests.'));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [query, state, skip]);

  useEffect(() => { load(); }, [load]);

  const loadHistory = useCallback(() => {
    setHistoryError('');
    helpRequestCleanerService.history()
      .then((r) => setHistory(r.data))
      .catch((e) => setHistoryError(errMsg(e, 'Could not load the recent deletions.')));
  }, []);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const changeState = (s: State) => { setState(s); setSkip(0); setSelected(new Map()); };

  const toggle = (row: HelpRequestRow) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(row.id)) next.delete(row.id);
      else if (next.size < HELP_DELETE_LIMIT) next.set(row.id, row);
      return next;
    });

  const pageAllSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const togglePage = () =>
    setSelected((prev) => {
      const next = new Map(prev);
      for (const r of rows) {
        if (pageAllSelected) next.delete(r.id);
        else if (next.size < HELP_DELETE_LIMIT) next.set(r.id, r);
      }
      return next;
    });

  const done = (res: HelpDeleteResponse) => {
    setReviewing(false); setOutcome(res); setSelected(new Map());
    load(); loadHistory();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <h1 className="text-2xl font-bold text-text-primary tracking-tight">Help Request Cleaner</h1>
      <p className="mt-1 text-sm text-text-secondary">Search help requests, then permanently delete them.</p>

      <div role="note" className="mt-4 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-900 leading-relaxed">
        <strong>Hard delete cannot be undone.</strong> Only the help request is removed; its migration and payment stay.
        Open requests are skipped because a customer is waiting (an admin account can override this). Every deletion is
        recorded below.
      </div>

      {outcome && <OutcomeBanner outcome={outcome} onClose={() => setOutcome(null)} />}
      {error && (
        <div role="alert" className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error} <button onClick={load} className="font-semibold underline">Retry</button>
        </div>
      )}

      <div className="mt-5 bg-white border border-border rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-bg-light flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={search}
            maxLength={100}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID, reason, pair, name, email"
            aria-label="Search help requests"
            className="w-72 max-w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          {STATES.map((s) => (
            <button
              key={s.key}
              onClick={() => changeState(s.key)}
              aria-pressed={state === s.key}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                state === s.key ? 'bg-blue-600 text-white' : 'bg-white text-text-secondary hover:text-text-primary border border-border'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="px-5 py-2.5 border-b border-border flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-text-primary" aria-live="polite">{selected.size} selected</span>
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Map())} className="text-text-secondary hover:text-text-primary underline">Clear</button>
          )}
          {selected.size >= HELP_DELETE_LIMIT && <span className="text-amber-700">{HELP_DELETE_LIMIT} is the most one deletion holds.</span>}
          <span className="flex-1" />
          {canDelete ? (
            <button
              onClick={() => setReviewing(true)}
              disabled={selected.size === 0}
              className="px-4 py-1.5 font-semibold text-white rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40"
            >
              Hard delete{selected.size > 0 ? ` ${selected.size}` : ''}…
            </button>
          ) : (
            <span className="text-text-secondary">Your role can search but not delete.</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" aria-label="Select every help request on this page" checked={pageAllSelected} disabled={!canDelete || rows.length === 0} onChange={togglePage} />
                </th>
                {['Migration', 'Customer', 'Reason', 'Status', 'Raised'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-text-secondary">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-text-secondary">{error ? 'Nothing to show.' : 'No help requests match.'}</td></tr>
              ) : rows.map((r) => {
                const meta = reviewStatusMeta(r.status);
                return (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <input type="checkbox" aria-label={`Select help request ${r.id}`} checked={selected.has(r.id)} disabled={!canDelete} onChange={() => toggle(r)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-text-primary">{r.migrationId}</div>
                      <div className="text-[11px] text-text-secondary">{r.pair}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="text-xs text-text-primary truncate">{r.customer ?? '—'}</div>
                      <div className="text-[11px] text-text-secondary truncate">{r.email ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[320px]">
                      <div className="text-xs text-text-secondary truncate" title={r.reason ?? ''}>{r.reason ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${meta.className}`}>{meta.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">{fmt(r.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination skip={skip} size={PAGE_SIZE} total={total} onSkipChange={setSkip} noun="help requests" disabled={loading} />
      </div>

      <section className="mt-6 bg-white border border-border rounded-xl shadow-card overflow-hidden">
        <h2 className="px-5 py-3 text-sm font-bold text-text-primary border-b border-border bg-bg-light">Recent deletions</h2>
        {historyError ? (
          <p role="alert" className="px-5 py-4 text-xs text-red-700">{historyError} <button onClick={loadHistory} className="font-semibold underline">Retry</button></p>
        ) : history === null ? (
          <p className="px-5 py-4 text-xs text-text-secondary">Loading…</p>
        ) : history.length === 0 ? (
          <p className="px-5 py-4 text-xs text-text-secondary">Nothing has been deleted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-2 whitespace-nowrap text-text-secondary">{fmt(h.createdAt)}</td>
                    <td className="px-3 py-2 font-mono">{h.migrationId}</td>
                    <td className="px-3 py-2 text-text-secondary">{h.pairName ?? ''}</td>
                    <td className="px-3 py-2 text-text-secondary">{h.customerEmail ?? ''}</td>
                    <td className="px-3 py-2 text-text-secondary">
                      was {h.statusAtTime.toLowerCase()}{h.forced && ' (forced)'} · by {h.performedByType} #{h.performedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {reviewing && (
        <ReviewModal rows={[...selected.values()]} canForce={isAdminAccount} onClose={() => setReviewing(false)} onDone={done} />
      )}
    </motion.div>
  );
};

const OutcomeBanner: React.FC<{ outcome: HelpDeleteResponse; onClose: () => void }> = ({ outcome, onClose }) => {
  const s = outcome.summary;
  const problems = outcome.results.filter((r) => r.outcome !== 'deleted');
  return (
    <div role="status" className={`mt-4 px-4 py-3 rounded-lg border text-sm ${s.failed ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">
          {s.deleted} hard deleted
          {s.skipped > 0 && ` · ${s.skipped} skipped`}
          {s.failed > 0 && ` · ${s.failed} failed (nothing changed for those)`}
        </p>
        <button onClick={onClose} className="text-xs underline">Dismiss</button>
      </div>
      {problems.length > 0 && (
        <ul className="mt-2 text-xs space-y-0.5 list-disc pl-5">
          {problems.map((p) => <li key={p.id}><span className="font-mono">{p.id}</span>: {p.reasons.join(' ')}</li>)}
        </ul>
      )}
    </div>
  );
};

const ReviewModal: React.FC<{
  rows: HelpRequestRow[];
  canForce: boolean;
  onClose: () => void;
  onDone: (r: HelpDeleteResponse) => void;
}> = ({ rows, canForce, onClose, onDone }) => {
  const [includeOpen, setIncludeOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const openCount = rows.filter((r) => r.isOpen).length;
  const targets = includeOpen ? rows : rows.filter((r) => !r.isOpen);
  const phrase = helpDeletePhrase(targets.length, includeOpen);
  const matches = targets.length > 0 && typed.trim() === phrase;

  const run = async () => {
    if (!matches || running) return;
    setRunning(true); setError('');
    try {
      onDone(await helpRequestCleanerService.delete(targets.map((r) => r.id), phrase, includeOpen));
    } catch (e) {
      setError(errMsg(e, 'The request failed. Check Recent deletions before trying again.'));
      setRunning(false);
    }
  };

  return (
    <Modal title="Hard delete help requests" onClose={onClose} size="lg" locked={running}>
      <div className="space-y-4">
        {error && <div role="alert" className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">{targets.length}</strong> of {rows.length} selected will be deleted for good.
          {!includeOpen && openCount > 0 && <> <strong className="text-amber-700">{openCount}</strong> still open will be skipped.</>}
        </p>
        <ul className="max-h-48 overflow-auto border border-border rounded-lg text-xs">
          {rows.map((r) => (
            <li key={r.id} className="flex justify-between gap-3 px-3 py-2 border-b border-border last:border-0">
              <span className="font-mono">{r.migrationId}</span>
              <span className={r.isOpen && !includeOpen ? 'text-amber-700' : 'text-text-secondary'}>
                {reviewStatusMeta(r.status).label}{r.isOpen && !includeOpen ? ' · skipped' : ''}
              </span>
            </li>
          ))}
        </ul>
        {canForce && openCount > 0 && (
          <label className="flex items-start gap-2 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <input type="checkbox" checked={includeOpen} disabled={running} onChange={(e) => { setIncludeOpen(e.target.checked); setTyped(''); }} className="mt-0.5" />
            <span><strong>Include open requests (admin only).</strong> The customer is still waiting for help on these.</span>
          </label>
        )}
        {targets.length > 0 ? (
          <div>
            <label htmlFor="help-confirm" className="block text-xs font-medium text-text-secondary mb-1.5">
              To confirm, type <code className="px-1.5 py-0.5 bg-bg-light rounded font-mono text-text-primary">{phrase}</code>
            </label>
            <input
              id="help-confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
              autoComplete="off"
              spellCheck={false}
              disabled={running}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border font-mono focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
          </div>
        ) : (
          <p className="text-sm text-text-secondary">Only open requests are selected. Resolve or dismiss them first.</p>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={running} className="px-4 py-2 text-sm font-medium border border-border rounded-lg disabled:opacity-50">Cancel</button>
          <button onClick={run} disabled={!matches || running} className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40">
            {running ? 'Deleting…' : `Hard delete ${targets.length}`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default HelpRequestCleanerPage;
