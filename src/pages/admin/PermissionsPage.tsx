import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { permissionsService } from '@/api/permissions';
import { rolesService } from '@/api/roles';
import { ApiError } from '@/api/client';
import { usePermissions } from '@/hooks/usePermissions';
import type { CreatePermissionRequest, Permission, Role } from '@/types/api';

const inputCls =
  'w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white transition-colors';

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title, onClose, children,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  </div>
);

const PermissionsPage: React.FC = () => {
  const { can } = usePermissions();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles]             = useState<Role[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState('');

  // Create modal
  const [createOpen, setCreateOpen]   = useState(false);
  const [createForm, setCreateForm]   = useState<CreatePermissionRequest>({ module: '', action: '', description: '' });

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);

  // Assign modal
  const [assignOpen, setAssignOpen]         = useState(false);
  const [assignRoleId, setAssignRoleId]     = useState<number | ''>('');
  const [assignPermIds, setAssignPermIds]   = useState<number[]>([]);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [permsRes, rolesRes] = await Promise.all([
        permissionsService.list(),
        rolesService.list().catch(() => [] as Role[]),
      ]);
      setPermissions(permsRes);
      setRoles(Array.isArray(rolesRes) ? rolesRes : (rolesRes as any)?.data ?? []);
    } catch {
      setError('Failed to load permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Group by module for display
  const byModule = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      await permissionsService.create(createForm);
      setCreateOpen(false);
      setCreateForm({ module: '', action: '', description: '' });
      load();
    } catch (e) {
      setFormError(
        e instanceof ApiError
          ? e.message                     // shows 400 "already exists" inline
          : 'Failed to create permission.',
      );
    } finally { setSaving(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await permissionsService.deletePermission(deleteTarget.id);
      setDeleteTarget(null);
      // Remove the row immediately without a full reload
      setPermissions((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to delete permission.');
      setDeleteTarget(null);
    } finally { setSaving(false); }
  };

  // ── Assign ────────────────────────────────────────────────────────────────
  const openAssign = () => {
    setAssignRoleId('');
    setAssignPermIds([]);
    setFormError('');
    setAssignOpen(true);
  };

  const handleRoleChange = (roleId: number) => {
    const role = roles.find((r) => r.id === roleId);
    setAssignRoleId(roleId);
    setAssignPermIds(role?.permissions.map((rp) => rp.permissionId) ?? []);
  };

  const togglePerm = (id: number) =>
    setAssignPermIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignRoleId) { setFormError('Select a role.'); return; }
    setSaving(true); setFormError('');
    try {
      await permissionsService.assign({ roleId: assignRoleId as number, permissionIds: assignPermIds });
      setAssignOpen(false);
      load();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Failed to assign permissions.');
    } finally { setSaving(false); }
  };

  // ── Permission gate ───────────────────────────────────────────────────────
  if (!can('permissions.read')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg className="w-12 h-12 text-text-tertiary mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-text-secondary font-medium">You need the <span className="font-mono text-xs bg-bg-light px-1.5 py-0.5 rounded">permissions.read</span> permission to view this page.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Permissions</h1>
          <p className="mt-1 text-sm text-text-secondary">All capability strings in the system</p>
        </div>
        <div className="flex items-center gap-2">
          {can('permissions.assign') && (
            <button onClick={openAssign} className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              Assign to Role
            </button>
          )}
          {can('permissions.write') && (
            <button
              onClick={() => { setCreateOpen(true); setCreateForm({ module: '', action: '', description: '' }); setFormError(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              New Permission
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-4">
          {Array(4).fill(null).map((_, i) => (
            <div key={i} className="bg-white border border-border rounded-xl p-4 animate-pulse space-y-2">
              <div className="h-3 bg-bg-lighter rounded w-24" />
              <div className="h-3 bg-bg-lighter rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byModule).map(([module, perms]) => (
            <div key={module} className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
              <div className="px-4 py-3 bg-bg-light border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary font-mono">{module}</h3>
                <span className="text-xs text-text-tertiary">{perms.length} action{perms.length !== 1 ? 's' : ''}</span>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {perms.map((p) => (
                    <tr key={p.id} className="hover:bg-bg-light/40 transition-colors">
                      <td className="px-4 py-2.5 w-8">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
                      </td>
                      <td className="px-2 py-2.5 font-mono text-xs text-blue-700 font-semibold w-44">
                        {module}.{p.action}
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary text-xs">{p.description}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {can('permissions.assign') && (
                            <button
                              onClick={openAssign}
                              className="text-xs text-text-tertiary hover:text-blue-600 transition-colors"
                            >
                              Assign →
                            </button>
                          )}
                          {can('permissions.write') && (
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="p-1 rounded text-text-tertiary hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete permission"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {createOpen && (
        <Modal title="Create Permission" onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Module <span className="text-red-500">*</span></label>
                <input className={inputCls} value={createForm.module} onChange={(e) => setCreateForm((f) => ({ ...f, module: e.target.value }))} placeholder="migration" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Action <span className="text-red-500">*</span></label>
                <input className={inputCls} value={createForm.action} onChange={(e) => setCreateForm((f) => ({ ...f, action: e.target.value }))} placeholder="read" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
              <input className={inputCls} value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} placeholder="View migrations" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">{saving ? 'Creating…' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm Modal */}
      {deleteTarget && (
        <Modal title="Delete Permission" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-800">This will remove the permission from all roles</p>
                <p className="text-xs text-red-700 mt-0.5">
                  Any roles that include <span className="font-mono font-bold">{deleteTarget.module}.{deleteTarget.action}</span> will lose this capability immediately.
                </p>
              </div>
            </div>
            <p className="text-sm text-text-secondary">
              Are you sure you want to permanently delete <span className="font-mono font-semibold text-text-primary">{deleteTarget.module}.{deleteTarget.action}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors">{saving ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign Modal */}
      {assignOpen && (
        <Modal title="Assign Permissions to Role" onClose={() => setAssignOpen(false)}>
          <form onSubmit={handleAssign} className="space-y-4">
            {formError && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>}
            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              This replaces all permissions on the role. Always send the complete desired set.
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Role <span className="text-red-500">*</span></label>
              <select className={inputCls} value={assignRoleId} onChange={(e) => handleRoleChange(Number(e.target.value))} required>
                <option value="">Select a role…</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Permissions <span className="text-text-tertiary font-normal">({assignPermIds.length} selected)</span>
              </label>
              <div className="border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                {Object.entries(byModule).map(([module, perms]) => (
                  <div key={module}>
                    <div className="px-3 py-1.5 bg-bg-light text-xs font-semibold text-text-tertiary uppercase tracking-wide sticky top-0">{module}</div>
                    {perms.map((p) => (
                      <label key={p.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-bg-light cursor-pointer">
                        <input type="checkbox" className="accent-blue-600" checked={assignPermIds.includes(p.id)} onChange={() => togglePerm(p.id)} />
                        <span className="text-sm font-mono text-text-primary">{module}.{p.action}</span>
                        <span className="text-xs text-text-tertiary ml-auto">{p.description}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAssignOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">{saving ? 'Saving…' : 'Save Permissions'}</button>
            </div>
          </form>
        </Modal>
      )}
    </motion.div>
  );
};

export default PermissionsPage;
