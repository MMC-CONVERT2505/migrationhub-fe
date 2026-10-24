import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { rolesService } from '@/api/roles';
import { permissionsService } from '@/api/permissions';
import { ApiError } from '@/api/client';
import { usePermissions } from '@/hooks/usePermissions';
import type { CreateRoleRequest, Permission, Role } from '@/types/api';
import { Modal } from '@/components/admin/Modal';

// ─── Shared primitives ────────────────────────────────────────────────────────
const inputCls =
  'w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white transition-colors';

// ─── Permission checkbox list ─────────────────────────────────────────────────
const PermissionPicker: React.FC<{
  allPermissions: Permission[];
  selected: number[];
  onChange: (ids: number[]) => void;
}> = ({ allPermissions, selected, onChange }) => {
  const byModule = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
      {Object.entries(byModule).map(([module, perms]) => (
        <div key={module}>
          <div className="px-3 py-1.5 bg-bg-light text-xs font-semibold text-text-secondary uppercase tracking-wide sticky top-0">
            {module}
          </div>
          {perms.map((p) => (
            <label key={p.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-bg-light cursor-pointer">
              <input
                type="checkbox"
                className="accent-blue-600"
                checked={selected.includes(p.id)}
                onChange={() => toggle(p.id)}
              />
              <span className="text-sm text-text-primary font-mono">{p.module}.{p.action}</span>
              <span className="text-xs text-text-secondary ml-auto">{p.description}</span>
            </label>
          ))}
        </div>
      ))}
      {allPermissions.length === 0 && (
        <p className="px-3 py-6 text-sm text-text-secondary text-center">No permissions found</p>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const RolesPage: React.FC = () => {
  const { can } = usePermissions();

  const [roles, setRoles]     = useState<Role[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]               = useState('');
  const [expandedId, setExpandedId]     = useState<number | null>(null);

  const [createOpen, setCreateOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  // Assign permissions modal (per-role)
  const [assignTarget, setAssignTarget]   = useState<Role | null>(null);
  const [assignPermIds, setAssignPermIds] = useState<number[]>([]);
  const [assignError, setAssignError]     = useState('');
  const [assignSaving, setAssignSaving]   = useState(false);

  const [form, setForm]       = useState<CreateRoleRequest>({ name: '', description: '', permissionIds: [] });
  const [saving, setSaving]   = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [rolesRes, permsRes] = await Promise.all([
        rolesService.list(),
        permissionsService.list(),
      ]);
      setRoles(Array.isArray(rolesRes) ? rolesRes : (rolesRes as any)?.data ?? []);
      setAllPerms(permsRes);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load roles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Assign permissions (per-role modal) ─────────────────────────────────────
  const openAssign = (role: Role) => {
    setAssignTarget(role);
    setAssignPermIds(role.permissions.map((rp) => rp.permissionId));
    setAssignError('');
  };

  const toggleAssignPerm = (id: number) =>
    setAssignPermIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleAssignSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget) return;
    setAssignSaving(true); setAssignError('');
    try {
      await permissionsService.assign({ roleId: assignTarget.id, permissionIds: assignPermIds });
      setAssignTarget(null);
      load();
    } catch (e) {
      setAssignError(e instanceof ApiError ? e.message : 'Failed to assign permissions.');
    } finally { setAssignSaving(false); }
  };

  const setF = <K extends keyof CreateRoleRequest>(k: K, v: CreateRoleRequest[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      await rolesService.create(form);
      setCreateOpen(false);
      setForm({ name: '', description: '', permissionIds: [] });
      load();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Failed to create role.');
    } finally { setSaving(false); }
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const openEdit = (role: Role) => {
    setEditTarget(role);
    setForm({ name: role.name, description: role.description, permissionIds: role.permissions.map((rp) => rp.permissionId) });
    setFormError('');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true); setFormError('');
    try {
      await rolesService.update(editTarget.id, { name: form.name, description: form.description });
      setEditTarget(null);
      load();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Failed to update role.');
    } finally { setSaving(false); }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await rolesService.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to delete role.');
      setDeleteTarget(null);
    } finally { setSaving(false); }
  };

  const roleForm = (isCreate: boolean) => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Name <span className="text-red-500">*</span></label>
        <input className={inputCls} value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="Migration Manager" required />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
        <textarea className={`${inputCls} resize-none`} rows={2} value={form.description} onChange={(e) => setF('description', e.target.value)} placeholder="Describe what this role can do" />
      </div>
      {isCreate && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Permissions <span className="text-text-secondary font-normal">(optional)</span></label>
          <PermissionPicker allPermissions={allPerms} selected={form.permissionIds ?? []} onChange={(ids) => setF('permissionIds', ids)} />
          <p className="text-xs text-text-secondary mt-1">{(form.permissionIds ?? []).length} selected</p>
        </div>
      )}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Roles</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage named groups of permissions</p>
        </div>
        {can('roles.write') && (
          <button
            onClick={() => { setCreateOpen(true); setForm({ name: '', description: '', permissionIds: [] }); setFormError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            New Role
          </button>
        )}
      </div>

      {error && <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {/* Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
        <div className="admin-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-light">
              {['Role', 'Description', 'Permissions', '', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array(4).fill(null).map((_, i) => (
                <tr key={i}>
                  {Array(5).fill(null).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-bg-lighter rounded animate-pulse w-20" /></td>
                  ))}
                </tr>
              ))
            ) : roles.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-sm text-text-secondary">No roles found</td></tr>
            ) : (
              roles.map((role) => (
                <React.Fragment key={role.id}>
                  <tr className="hover:bg-bg-light/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary">{role.name}</span>
                        {role.isSystem && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-semibold">System</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary max-w-xs truncate">{role.description || '—'}</td>
                    <td className="px-4 py-3 font-mono text-text-secondary">{role.permissions.length}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === role.id ? null : role.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {expandedId === role.id ? 'Hide' : 'View'} permissions
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {can('permissions.assign') && (
                          <button onClick={() => openAssign(role)} className="p-1.5 rounded-md text-text-secondary hover:text-purple-600 hover:bg-purple-50 transition-colors" title="Assign Permissions">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                          </button>
                        )}
                        {can('roles.write') && (
                          <button onClick={() => openEdit(role)} className="p-1.5 rounded-md text-text-secondary hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        )}
                        {can('roles.delete') && (
                          <button
                            onClick={() => !role.isSystem && setDeleteTarget(role)}
                            disabled={role.isSystem}
                            title={role.isSystem ? 'System roles cannot be deleted' : 'Delete'}
                            className={`p-1.5 rounded-md transition-colors ${role.isSystem ? 'text-text-secondary opacity-40 cursor-not-allowed' : 'text-text-secondary hover:text-red-600 hover:bg-red-50'}`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expandedId === role.id && (
                      <motion.tr
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      >
                        <td colSpan={5} className="px-4 pb-4 pt-0 bg-bg-light/40">
                          {role.permissions.length === 0 ? (
                            <p className="text-xs text-text-secondary italic">No permissions assigned</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {role.permissions.map((rp) => (
                                <span key={rp.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-mono">
                                  {rp.permission.module}.{rp.permission.action}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Create Modal */}
      {createOpen && (
        <Modal size="lg" title="Create Role" onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && <div role="alert" className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>}
            {roleForm(true)}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">{saving ? 'Creating…' : 'Create Role'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal size="lg" title={`Edit — ${editTarget.name}`} onClose={() => setEditTarget(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            {formError && <div role="alert" className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>}
            {roleForm(false)}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <Modal size="lg" title="Delete Role" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete <span className="font-semibold text-text-primary">{deleteTarget.name}</span>? Users with this role will lose its permissions.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors">{saving ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign Permissions Modal (per-role) */}
      {assignTarget && (
        <Modal size="lg" title={`Permissions — ${assignTarget.name}`} onClose={() => setAssignTarget(null)}>
          <form onSubmit={handleAssignSave} className="space-y-4">
            {assignError && <div role="alert" className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{assignError}</div>}
            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              This replaces all permissions on this role. Always send the complete desired set.
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary mb-1.5">
                Permissions <span className="text-text-secondary font-normal">({assignPermIds.length} selected)</span>
              </p>
              <div className="border border-border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                {Object.entries(
                  allPerms.reduce<Record<string, Permission[]>>((acc, p) => {
                    (acc[p.module] ??= []).push(p); return acc;
                  }, {})
                ).map(([module, perms]) => (
                  <div key={module}>
                    <div className="px-3 py-1.5 bg-bg-light text-xs font-semibold text-text-secondary uppercase tracking-wide sticky top-0">
                      {module}
                    </div>
                    {perms.map((p) => (
                      <label key={p.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-bg-light cursor-pointer border-b border-border last:border-0">
                        <input
                          type="checkbox"
                          className="accent-blue-600"
                          checked={assignPermIds.includes(p.id)}
                          onChange={() => toggleAssignPerm(p.id)}
                        />
                        <span className="text-sm font-mono text-text-primary">{module}.{p.action}</span>
                        <span className="text-xs text-text-secondary ml-auto">{p.description}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAssignTarget(null)} className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light transition-colors">Cancel</button>
              <button type="submit" disabled={assignSaving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">{assignSaving ? 'Saving…' : 'Save Permissions'}</button>
            </div>
          </form>
        </Modal>
      )}
    </motion.div>
  );
};

export default RolesPage;
