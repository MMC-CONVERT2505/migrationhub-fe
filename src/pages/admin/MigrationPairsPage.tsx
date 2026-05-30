import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { migrationPairsService } from '@/api/migrationPairs';
import { ApiError } from '@/api/client';
import { extractList } from '@/utils/platformMap';
import type {
  MigrationPairEntity,
  CreateMigrationPairRequest,
  UpdateMigrationPairRequest,
  MigrationEnvironment,
} from '@/types/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ENV_OPTIONS: MigrationEnvironment[] = ['PRODUCTION', 'STAGING', 'DEV'];

const EMPTY_CREATE: CreateMigrationPairRequest = {
  source: '',
  destination: '',
  displayName: '',
  serviceUrl: '',
  fallbackServiceUrl: '',
  apiVersion: 'v1',
  healthCheckPath: '/health',
  environment: 'PRODUCTION',
  isActive: true,
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Badge: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
      active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-red-400'}`} />
    {label}
  </span>
);

const EnvBadge: React.FC<{ env: MigrationEnvironment }> = ({ env }) => {
  const color =
    env === 'PRODUCTION'
      ? 'bg-blue-50 text-blue-700'
      : env === 'STAGING'
      ? 'bg-yellow-50 text-yellow-700'
      : 'bg-purple-50 text-purple-700';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{env}</span>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}
const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  </div>
);

// ─── Field ────────────────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-text-secondary">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  'w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors bg-white';

// ─── Page ─────────────────────────────────────────────────────────────────────
const MigrationPairsPage: React.FC = () => {
  const [pairs, setPairs] = useState<MigrationPairEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MigrationPairEntity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MigrationPairEntity | null>(null);

  // Form state
  const [createForm, setCreateForm] = useState<CreateMigrationPairRequest>(EMPTY_CREATE);
  const [editForm, setEditForm] = useState<UpdateMigrationPairRequest>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await migrationPairsService.list({ limit: 100 } as any);
      setPairs(extractList<MigrationPairEntity>(res));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load migration pairs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload: CreateMigrationPairRequest = {
        ...createForm,
        fallbackServiceUrl: createForm.fallbackServiceUrl || undefined,
      };
      await migrationPairsService.create(payload);
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create pair.');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const openEdit = (pair: MigrationPairEntity) => {
    setEditTarget(pair);
    setEditForm({ serviceUrl: pair.serviceUrl, isActive: pair.isActive, isMaintenance: pair.isMaintenance });
    setFormError('');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    setFormError('');
    try {
      await migrationPairsService.update(editTarget.id, editForm);
      setEditTarget(null);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to update pair.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await migrationPairsService.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete pair.');
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Migration Pairs</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage source-to-destination migration service endpoints</p>
        </div>
        <button
          onClick={() => { setCreateOpen(true); setFormError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Pair
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-text-tertiary">
            <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <p className="text-sm">No migration pairs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-light">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Route</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Environment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Maintenance</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pairs.map((pair) => (
                  <tr key={pair.id} className="hover:bg-bg-light/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{pair.displayName}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      <span className="font-mono text-xs">{pair.source}</span>
                      <span className="mx-1.5 text-text-tertiary">→</span>
                      <span className="font-mono text-xs">{pair.destination}</span>
                    </td>
                    <td className="px-4 py-3"><EnvBadge env={pair.environment} /></td>
                    <td className="px-4 py-3"><Badge active={pair.isActive} label={pair.isActive ? 'Active' : 'Inactive'} /></td>
                    <td className="px-4 py-3"><Badge active={!pair.isMaintenance} label={pair.isMaintenance ? 'Yes' : 'No'} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(pair)}
                          className="p-1.5 rounded-md text-text-tertiary hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(pair)}
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

      {/* ── Create Modal ─────────────────────────────────────────────────────── */}
      {createOpen && (
        <Modal title="Add Migration Pair" onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Source" required>
                <input className={inputCls} value={createForm.source} onChange={(e) => setCreateForm((f) => ({ ...f, source: e.target.value }))} placeholder="xero" required />
              </Field>
              <Field label="Destination" required>
                <input className={inputCls} value={createForm.destination} onChange={(e) => setCreateForm((f) => ({ ...f, destination: e.target.value }))} placeholder="myob" required />
              </Field>
            </div>
            <Field label="Display Name" required>
              <input className={inputCls} value={createForm.displayName} onChange={(e) => setCreateForm((f) => ({ ...f, displayName: e.target.value }))} placeholder="Xero → MYOB" required />
            </Field>
            <Field label="Service URL" required>
              <input className={inputCls} value={createForm.serviceUrl} onChange={(e) => setCreateForm((f) => ({ ...f, serviceUrl: e.target.value }))} placeholder="https://service.example.com" required />
            </Field>
            <Field label="Fallback Service URL">
              <input className={inputCls} value={createForm.fallbackServiceUrl ?? ''} onChange={(e) => setCreateForm((f) => ({ ...f, fallbackServiceUrl: e.target.value }))} placeholder="https://fallback.example.com" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="API Version">
                <input className={inputCls} value={createForm.apiVersion ?? ''} onChange={(e) => setCreateForm((f) => ({ ...f, apiVersion: e.target.value }))} placeholder="v1" />
              </Field>
              <Field label="Health Check Path">
                <input className={inputCls} value={createForm.healthCheckPath ?? ''} onChange={(e) => setCreateForm((f) => ({ ...f, healthCheckPath: e.target.value }))} placeholder="/health" />
              </Field>
            </div>
            <Field label="Environment">
              <select className={inputCls} value={createForm.environment} onChange={(e) => setCreateForm((f) => ({ ...f, environment: e.target.value as MigrationEnvironment }))}>
                {ENV_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input type="checkbox" checked={createForm.isActive} onChange={(e) => setCreateForm((f) => ({ ...f, isActive: e.target.checked }))} />
              Active on creation
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-bg-light transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {saving ? 'Creating…' : 'Create Pair'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      {editTarget && (
        <Modal title={`Edit — ${editTarget.displayName}`} onClose={() => setEditTarget(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            {formError && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>
            )}
            <Field label="Service URL">
              <input className={inputCls} value={editForm.serviceUrl ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, serviceUrl: e.target.value }))} placeholder="https://service.example.com" />
            </Field>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input type="checkbox" checked={editForm.isActive ?? false} onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input type="checkbox" checked={editForm.isMaintenance ?? false} onChange={(e) => setEditForm((f) => ({ ...f, isMaintenance: e.target.checked }))} />
                Maintenance mode
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-bg-light transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      {deleteTarget && (
        <Modal title="Delete Migration Pair" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete <span className="font-semibold text-text-primary">{deleteTarget.displayName}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors">
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default MigrationPairsPage;
