import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ApiError } from '@/api/client';
import {
  migrationCleanerService,
  type CleanerAction,
  type CleanerExecuteResponse,
  type CleanerGroup,
  type CleanerPreview,
  type CleanerRow,
  type CleanupLogEntry,
  type RemovalCounts,
} from '@/api/adminMigrationCleaner';
import { statusMeta } from '@/constants/migrationStatus';
import { usePermissions } from '@/hooks/usePermissions';
import { Modal } from '@/components/admin/Modal';
import { Pagination } from '@/components/admin/Pagination';
import { clampSkip } from '@/utils/pagination';
import { SELECTION_LIMIT, blockedBy, canRun, confirmPhrase, needsPhrase, togglePage } from '@/utils/cleanerSelection';

const PAGE_SIZE = 20;
const GROUPS: { key: CleanerGroup | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'failed', label: 'Failed / cancelled' },
  { key: 'active', label: 'Unfinished' },
  { key: 'deleted', label: 'Deleted' },
];
const MODE_ORDER: CleanerAction[] = ['SOFT_DELETE', 'HARD_DELETE', 'PURGE', 'RESTORE'];
const MODES: Record<
  CleanerAction,
  { label: string; verb: string; done: string; undoable: boolean; tone: 'blue' | 'red' | 'green'; blurb: string }
> = {
  SOFT_DELETE: {
    label: 'Soft delete',
    verb: 'Soft delete',
    done: 'soft deleted',
    undoable: true,
    tone: 'blue',
    blurb:
      'Hides the migration from the customer, the admin lists and the dashboard numbers. Nothing is removed, and it can be restored.',
  },
  HARD_DELETE: {
    label: 'Hard delete',
    verb: 'Hard delete',
    done: 'hard deleted',
    undoable: false,
    tone: 'red',
    blurb:
      'Permanently removes the migration and everything under it. Refused for a settled payment, an App Store order or a Karbon work item.',
  },
  PURGE: {
    label: 'Purge data',
    verb: 'Purge',
    done: 'purged',
    undoable: false,
    tone: 'blue',
    blurb:
      'Permanently removes logs, webhook events, tool calls, connections and data counts. The order, its payment and the customer’s inquiry stay.',
  },
  RESTORE: {
    label: 'Restore',
    verb: 'Restore',
    done: 'restored',
    undoable: true,
    tone: 'green',
    blurb: 'Brings soft-deleted migrations back, exactly as they were.',
  },
};
const TONE_BTN = {
  blue: 'bg-blue-600 hover:bg-blue-700',
  red: 'bg-red-600 hover:bg-red-700',
  green: 'bg-green-600 hover:bg-green-700',
} as const;

const HISTORY_LABEL: Record<CleanupLogEntry['action'], { text: string; cls: string }> = {
  DELETE_MIGRATION: { text: 'Hard deleted', cls: 'bg-red-50 text-red-700' },
  PURGE_DATA: { text: 'Data purged', cls: 'bg-blue-50 text-blue-700' },
  SOFT_DELETE: { text: 'Soft deleted', cls: 'bg-amber-50 text-amber-700' },
  RESTORE: { text: 'Restored', cls: 'bg-green-50 text-green-700' },
};

const fmt = (d: string) => new Date(d).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' });
const totalRows = (c: RemovalCounts) => Object.values(c).reduce((a, b) => a + b, 0);
const errMsg = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

const MigrationCleanerPage: React.FC = () => {
  const { can } = usePermissions();
  const canRunIt = can('migration-cleaner.run');

  const [mode, setMode] = useState<CleanerAction>('SOFT_DELETE');
  const [group, setGroup] = useState<CleanerGroup | 'all'>('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [skip, setSkip] = useState(0);
  const [rows, setRows] = useState<CleanerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectingAll, setSelectingAll] = useState(false);
  const [capNote, setCapNote] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [history, setHistory] = useState<CleanupLogEntry[] | null>(null);
  const [outcome, setOutcome] = useState<CleanerExecuteResponse | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = search.trim();
      setQuery((prev) => {
        if (prev !== q) { setSkip(0); setSelected(new Set()); setCapNote(''); }
        return q;
      });
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true); setError('');
    try {
      const res = await migrationCleanerService.search({
        search: query || undefined,
        group: group === 'all' ? undefined : group,
        skip,
        take: PAGE_SIZE,
      });
      if (id !== reqId.current) return;
      setRows(res.data); setTotal(res.total);
      const safe = clampSkip(skip, res.total, PAGE_SIZE);
      if (safe !== skip) setSkip(safe);
    } catch (e) {
      if (id === reqId.current) setError(errMsg(e, 'Failed to load migrations.'));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [query, group, skip]);

  useEffect(() => { load(); }, [load]);

  const loadHistory = useCallback(() => {
    migrationCleanerService.history(0, 10).then((r) => setHistory(r.data)).catch(() => setHistory([]));
  }, []);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const changeMode = (m: CleanerAction) => { setMode(m); setSelected(new Set()); setCapNote(''); };
  const changeGroup = (g: CleanerGroup | 'all') => { setGroup(g); setSkip(0); setSelected(new Set()); setCapNote(''); };

  const pageAllowed = useMemo(() => rows.filter((r) => canRun(r, mode)), [rows, mode]);
  const pageAllSelected = pageAllowed.length > 0 && pageAllowed.every((r) => selected.has(r.id));

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < SELECTION_LIMIT) next.add(id);
      return next;
    });

  const selectAllMatching = async () => {
    setSelectingAll(true); setError(''); setCapNote('');
    try {
      const res = await migrationCleanerService.matchingIds({
        search: query || undefined,
        group: group === 'all' ? undefined : group,
        action: mode,
      });
      const ids = res.ids.slice(0, SELECTION_LIMIT);
      setSelected(new Set(ids));
      if (res.ids.length > SELECTION_LIMIT || res.capped) {
        setCapNote(`Selected the first ${ids.length} of ${res.matched} matches. Run it, then select the rest.`);
      } else if (res.matched > ids.length) {
        setCapNote(`${ids.length} of ${res.matched} matches can be ${MODES[mode].done}; the rest are refused by the safety rules.`);
      }
    } catch (e) {
      setError(errMsg(e, 'Could not select the matching migrations.'));
    } finally { setSelectingAll(false); }
  };

  const done = (res: CleanerExecuteResponse) => {
    setReviewing(false); setOutcome(res); setSelected(new Set()); setCapNote('');
    load(); loadHistory();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <h1 className="text-2xl font-bold text-text-primary tracking-tight">Migration Cleaner</h1>
      <p className="mt-1 text-sm text-text-secondary">Search migrations, then purge their data or delete them.</p>

      <div role="note" className="mt-4 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-900 leading-relaxed">
        <strong>Soft delete and restore can be undone. Hard delete and purge cannot.</strong> Running and recently active
        migrations and ones with an open help request are refused automatically; so are hard deletes of ones with a settled
        payment, an App Store order or a Karbon work item. Nothing here removes data held by the migration tool itself.
        Every action is recorded permanently below.
      </div>

      {outcome && <OutcomeBanner outcome={outcome} onClose={() => setOutcome(null)} />}
      {error && <div role="alert" className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="mt-5 bg-white border border-border rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-bg-light space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div role="radiogroup" aria-label="Action" className="inline-flex rounded-lg border border-border overflow-hidden">
              {MODE_ORDER.map((m) => (
                <button
                  key={m}
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => changeMode(m)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                    mode === m ? `${TONE_BTN[MODES[m].tone].split(' ')[0]} text-white` : 'bg-white text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {MODES[m].label}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-secondary flex-1 min-w-[16rem]">{MODES[mode].blurb}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, name, email, entity"
              aria-label="Search migrations"
              className="w-64 px-3 py-1.5 text-xs rounded-lg border border-border bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            {GROUPS.map((g) => (
              <button
                key={g.key}
                onClick={() => changeGroup(g.key)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  group === g.key ? 'bg-blue-600 text-white' : 'bg-white text-text-secondary hover:text-text-primary border border-border'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selection bar */}
        <div className="px-5 py-2.5 border-b border-border flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-text-primary" aria-live="polite">{selected.size} selected</span>
          {canRunIt && (
            <button
              onClick={selectAllMatching}
              disabled={selectingAll || total === 0}
              className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
            >
              {selectingAll ? 'Selecting…' : `Select all ${total} matching`}
            </button>
          )}
          {selected.size > 0 && (
            <button onClick={() => { setSelected(new Set()); setCapNote(''); }} className="text-text-secondary hover:text-text-primary underline">Clear</button>
          )}
          {capNote && <span className="text-amber-700">{capNote}</span>}
          <span className="flex-1" />
          {canRunIt ? (
            <button
              onClick={() => setReviewing(true)}
              disabled={selected.size === 0}
              className={`px-4 py-1.5 font-semibold text-white rounded-lg disabled:opacity-40 transition-colors ${TONE_BTN[MODES[mode].tone]}`}
            >
              Review {selected.size > 0 ? `${selected.size} to ` : ''}{MODES[mode].verb.toLowerCase()}…
            </button>
          ) : (
            <span className="text-text-secondary">Your role can search but not remove.</span>
          )}
        </div>

        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-border">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    aria-label="Select every removable migration on this page"
                    checked={pageAllSelected}
                    disabled={!canRunIt || pageAllowed.length === 0}
                    onChange={() => setSelected((s) => togglePage(s, rows, mode))}
                  />
                </th>
                {['Migration', 'Customer', 'Status', 'Updated', 'Result'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-text-secondary">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-text-secondary">No migrations match.</td></tr>
              ) : rows.map((r) => {
                const ok = canRun(r, mode);
                const meta = statusMeta(r.status);
                return (
                  <tr key={r.id} className={`border-b border-border last:border-0 ${ok ? '' : 'bg-bg-light/60'}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select migration ${r.id}`}
                        checked={selected.has(r.id)}
                        disabled={!ok || !canRunIt}
                        onChange={() => toggleOne(r.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-text-primary">{r.id}</div>
                      <div className="text-[11px] text-text-secondary">{r.pair}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="text-xs text-text-primary truncate">{r.customer ?? '—'}</div>
                      <div className="text-[11px] text-text-secondary truncate">{r.email ?? ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${meta.className}`}>{meta.label}</span>
                      {r.deletedAt && <div className="mt-1 text-[11px] font-semibold text-red-700">Soft deleted</div>}
                      {r.dataPurgedAt && <div className="mt-1 text-[11px] text-text-secondary">Data purged</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">{fmt(r.updatedAt)}</td>
                    <td className="px-4 py-3 text-xs max-w-[280px]">
                      {ok ? (
                        <span className="text-green-700 font-medium">Can be {MODES[mode].done}</span>
                      ) : (
                        <span className="text-text-secondary" title={blockedBy(r, mode).join(' ')}>{blockedBy(r, mode)[0]}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border">
          <Pagination skip={skip} size={PAGE_SIZE} total={total} onSkipChange={setSkip} noun="migrations" disabled={loading} />
        </div>
      </div>

      <section className="mt-6 bg-white border border-border rounded-xl shadow-card overflow-hidden">
        <h2 className="px-5 py-3 text-sm font-bold text-text-primary border-b border-border bg-bg-light">Recent removals</h2>
        {history === null ? (
          <p className="px-5 py-4 text-xs text-text-secondary">Loading…</p>
        ) : history.length === 0 ? (
          <p className="px-5 py-4 text-xs text-text-secondary">Nothing has been removed yet.</p>
        ) : (
          <table className="w-full text-xs">
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-2 whitespace-nowrap text-text-secondary">{fmt(h.createdAt)}</td>
                  <td className="px-3 py-2 font-mono">{h.migrationId}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${HISTORY_LABEL[h.action].cls}`}>
                      {HISTORY_LABEL[h.action].text}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{h.pairName ?? ''}</td>
                  <td className="px-3 py-2 text-text-secondary">{totalRows(h.counts)} rows · by {h.performedByType} #{h.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {reviewing && (
        <ReviewModal
          action={mode}
          ids={[...selected]}
          onClose={() => setReviewing(false)}
          onDone={done}
        />
      )}
    </motion.div>
  );
};

const OutcomeBanner: React.FC<{ outcome: CleanerExecuteResponse; onClose: () => void }> = ({ outcome, onClose }) => {
  const s = outcome.summary;
  const problems = outcome.results.filter((r) => r.outcome === 'skipped' || r.outcome === 'failed');
  const removed = s.purged + s.deleted + s.soft_deleted + s.restored;
  return (
    <div role="status" className={`mt-4 px-4 py-3 rounded-lg border text-sm ${s.failed ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">
          {removed} {MODES[outcome.action].done}
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
  action: CleanerAction;
  ids: string[];
  onClose: () => void;
  onDone: (r: CleanerExecuteResponse) => void;
}> = ({ action, ids, onClose, onDone }) => {
  const [preview, setPreview] = useState<CleanerPreview | null>(null);
  const [error, setError] = useState('');
  const [typed, setTyped] = useState('');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let live = true;
    migrationCleanerService.preview(ids, action)
      .then((p) => { if (live) setPreview(p); })
      .catch((e) => { if (live) setError(errMsg(e, 'Could not prepare the review.')); });
    return () => { live = false; };
  }, [ids, action]);

  const eligible = useMemo(() => preview?.items.filter((i) => i.eligible) ?? [], [preview]);
  const phrase = confirmPhrase(action, eligible.length);
  const rowTotal = eligible.reduce((a, i) => a + totalRows(i.counts), 0);
  const matches = eligible.length > 0 && (!needsPhrase(action) || typed.trim() === phrase);

  const run = async () => {
    if (!matches || running) return;
    setRunning(true); setError('');
    try {
      onDone(await migrationCleanerService.execute(eligible.map((i) => i.id), action, needsPhrase(action) ? typed.trim() : undefined));
    } catch (e) {
      setError(errMsg(e, 'The request failed. Check the Recent removals list before trying again.'));
      setRunning(false);
    }
  };

  return (
    <Modal title={`${MODES[action].verb} ${ids.length} ${ids.length === 1 ? 'migration' : 'migrations'}`} onClose={onClose} size="xl" locked={running}>
      {!preview && !error && <p className="text-sm text-text-secondary py-6 text-center">Checking each migration…</p>}
      {error && <div role="alert" className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {preview && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            <strong className="text-text-primary">{eligible.length}</strong> can be {MODES[action].done}
            {preview.refused > 0 && <>, <strong className="text-amber-700">{preview.refused}</strong> will be skipped</>}.
            {eligible.length > 0 && !MODES[action].undoable && <> About <strong className="text-text-primary">{rowTotal}</strong> rows will be removed for good.</>}
            {eligible.length > 0 && action === 'SOFT_DELETE' && <> Nothing is removed; they can be restored.</>}
          </p>
          <div className="max-h-64 overflow-auto border border-border rounded-lg">
            <table className="w-full text-xs">
              <tbody>
                {preview.items.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-mono align-top">{i.id}</td>
                    <td className="px-3 py-2">
                      {i.eligible && MODES[action].undoable ? (
                        <span className="text-text-secondary">{action === 'SOFT_DELETE' ? 'Will be hidden. Nothing removed.' : 'Will be visible again.'}</span>
                      ) : i.eligible ? (
                        <span className="text-text-secondary">
                          {i.counts.logs} logs · {i.counts.webhookEvents} events · {i.counts.outboundCalls} calls · {i.counts.connectors} connections
                          {i.counts.reviewRequests > 0 && ` · ${i.counts.reviewRequests} help requests`}
                        </span>
                      ) : (
                        <span className="text-amber-700">Skipped: {i.reasons.join(' ')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {eligible.length > 0 && needsPhrase(action) ? (
            <div>
              <label htmlFor="cleaner-confirm" className="block text-xs font-medium text-text-secondary mb-1.5">
                To confirm, type <code className="px-1.5 py-0.5 bg-bg-light rounded font-mono text-text-primary">{phrase}</code>
              </label>
              <input
                id="cleaner-confirm"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
                autoComplete="off"
                spellCheck={false}
                disabled={running}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border font-mono focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>
          ) : eligible.length === 0 ? (
            <p className="text-sm text-text-secondary">Nothing here can be changed. Close this and pick different migrations.</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} disabled={running} className="px-4 py-2 text-sm font-medium border border-border rounded-lg disabled:opacity-50">Cancel</button>
            <button
              onClick={run}
              disabled={!matches || running}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-40 ${TONE_BTN[MODES[action].tone]}`}
            >
              {running ? 'Working…' : `${MODES[action].verb} ${eligible.length}`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default MigrationCleanerPage;
