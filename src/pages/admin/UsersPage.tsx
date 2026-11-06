import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usersService } from '@/api/users';
import { rolesService } from '@/api/roles';
import { userRolesService } from '@/api/userRoles';
import { ApiError } from '@/api/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Pagination } from '@/components/admin/Pagination';
import { Modal } from '@/components/admin/Modal';
import { EditUserModal } from '@/components/admin/UserModals/EditUserModal';
import { DeleteUserModal } from '@/components/admin/UserModals/DeleteUserModal';
import { clampSkip, parseListResponse } from '@/utils/pagination';
import type { Role, UserWithRoles } from '@/types/api';

const STATUS_STYLES = {
  Active:    'bg-green-50 text-green-700',
  Blocked:   'bg-red-50 text-red-700',
  InActive:  'bg-amber-50 text-amber-700',
  Completed: 'bg-blue-50 text-blue-700',
  Cancelled: 'bg-gray-50 text-gray-700',
};

const UsersPage: React.FC = () => {
  const navigate   = useNavigate();
  const { can }    = usePermissions();

  const [users, setUsers]     = useState<UserWithRoles[]>([]);
  const [total, setTotal]     = useState(0);
  const [skip, setSkip]       = useState(0);
  const [take, setTake]     = useState(20);
  const [search, setSearch]   = useState('');
  const [query, setQuery]     = useState('');   // `search` after a short pause, so typing isn't a request per key
  const reqId = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Role assignment modal
  const [allRoles, setAllRoles]           = useState<Role[]>([]);
  const [roleTarget, setRoleTarget]       = useState<UserWithRoles | null>(null);
  const [roleSelection, setRoleSelection] = useState<number[]>([]);
  const [saving, setSaving]               = useState(false);
  const [roleError, setRoleError]         = useState('');

  // Edit / delete
  const [editTarget, setEditTarget]     = useState<UserWithRoles | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserWithRoles | null>(null);
  const [notice, setNotice]             = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      const q = search.trim();
      setQuery((prev) => { if (prev !== q) setSkip(0); return q; });
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    // Only the latest request may update the page — a slow earlier one must not overwrite it.
    const id = ++reqId.current;
    setLoading(true); setError('');
    try {
      const res = await usersService.listUsers({ skip, take, search: query || undefined } as any);
      if (id !== reqId.current) return;
      const { rows, total: count } = parseListResponse<UserWithRoles>(res);
      setUsers(rows);
      setTotal(count);
      // The list can shrink under us (a user removed, a search narrowed): never sit past the end.
      const safe = clampSkip(skip, count, take);
      if (safe !== skip) setSkip(safe);
    } catch (e) {
      if (id !== reqId.current) return;
      setError(e instanceof ApiError ? e.message : 'Failed to load users.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [skip, take, query]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    rolesService.list().then((r) => setAllRoles(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  const handleBanToggle = async (user: UserWithRoles) => {
    const newStatus = user.status === 'Active' ? 'Blocked' : 'Active';
    try {
      await usersService.setUserStatus(user.id, { status: newStatus });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to update user status.');
    }
  };

  // After an edit or delete: close the dialog, say what happened, and refresh. Deleting the last
  // row of a page leaves `skip` past the end — load() clamps it back to the last real page.
  const afterChange = (message: string) => {
    setEditTarget(null);
    setDeleteTarget(null);
    setNotice(message);
    load();
  };

  const openRoleModal = (user: UserWithRoles) => {
    setRoleTarget(user);
    setRoleSelection(user.roles.map((r) => r.role.id));
    setRoleError('');
  };

  const handleAssignRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTarget) return;
    setSaving(true); setRoleError('');
    try {
      await userRolesService.assign({ userId: roleTarget.id, roleIds: roleSelection });
      setRoleTarget(null);
      load();
    } catch (e) {
      setRoleError(e instanceof ApiError ? e.message : 'Failed to assign roles.');
    } finally { setSaving(false); }
  };

  const toggleRole = (id: number) =>
    setRoleSelection((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {total > 0 ? `${total.toLocaleString()} total users` : 'Manage platform users'}
          </p>
        </div>
        {can('users.write') && (
          <button
            onClick={() => navigate('/admin/users/create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Create User
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or username…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
        />
      </div>

      {notice && (
        <div role="status" className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-start justify-between gap-3">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss" className="text-green-800 hover:text-green-900">✕</button>
        </div>
      )}

      {error && <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {/* Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
        <div className="admin-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-light">
                {['User', 'Email', 'Username', 'Status', 'Roles', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array(6).fill(null).map((_, i) => (
                  <tr key={i}>
                    {Array(6).fill(null).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-bg-lighter rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-sm text-text-secondary">No users found</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-bg-light/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-text-primary">{user.firstname} {user.lastname}</p>
                        <p className="text-xs text-text-secondary font-mono">#{user.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{user.email}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs font-mono">{user.username || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[user.status] ?? 'bg-bg-light text-text-secondary'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <span className="text-xs text-text-secondary italic">No roles</span>
                        ) : (
                          user.roles.slice(0, 2).map((r) => (
                            <span key={r.role.id} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-medium">
                              {r.role.name}
                            </span>
                          ))
                        )}
                        {user.roles.length > 2 && (
                          <span className="text-xs text-text-secondary">+{user.roles.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {can('roles.assign') && (
                          <button
                            onClick={() => openRoleModal(user)}
                            className="p-1.5 rounded-md text-text-secondary hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Roles"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          </button>
                        )}
                        {can('users.write') && (
                          <button
                            type="button"
                            onClick={() => { setNotice(''); setEditTarget(user); }}
                            className="p-1.5 rounded-md text-text-secondary hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit user"
                            aria-label={`Edit ${user.firstname} ${user.lastname}`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        )}
                        {can('users.ban') && (
                          <button
                            onClick={() => handleBanToggle(user)}
                            className={`p-1.5 rounded-md transition-colors ${user.status === 'Active' ? 'text-text-secondary hover:text-red-600 hover:bg-red-50' : 'text-text-secondary hover:text-green-600 hover:bg-green-50'}`}
                            title={user.status === 'Active' ? 'Ban user' : 'Activate user'}
                          >
                            {user.status === 'Active' ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                          </button>
                        )}
                        {can('users.delete') && (
                          <button
                            type="button"
                            onClick={() => { setNotice(''); setDeleteTarget(user); }}
                            className="p-1.5 rounded-md text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete user"
                            aria-label={`Delete ${user.firstname} ${user.lastname}`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          skip={skip}
          size={take}
          total={total}
          noun="users"
          disabled={loading}
          onSkipChange={setSkip}
          onSizeChange={(n) => { setTake(n); setSkip(0); }}
        />
      </div>

      {editTarget && (
        <EditUserModal user={editTarget} onClose={() => setEditTarget(null)} onSaved={afterChange} />
      )}

      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={afterChange}
          onBlock={can('users.ban') ? async (u) => {
            try {
              await usersService.setUserStatus(u.id, { status: 'Blocked' });
              afterChange(`Blocked ${u.firstname} ${u.lastname}.`);
            } catch (e) {
              setDeleteTarget(null);
              setError(e instanceof ApiError ? e.message : 'Failed to block the user.');
            }
          } : undefined}
        />
      )}

      {/* Role assignment modal */}
      {roleTarget && (
        <Modal title={`Edit Roles — ${roleTarget.firstname} ${roleTarget.lastname}`} onClose={() => setRoleTarget(null)}>
          <form onSubmit={handleAssignRoles} className="space-y-4">
            {roleError && <div role="alert" className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{roleError}</div>}
            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              This replaces all current roles. Always send the complete desired set.
            </div>

            {/* Current roles as chips */}
            {roleTarget.roles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-text-secondary mb-1.5">Current roles</p>
                <div className="flex flex-wrap gap-1.5">
                  {roleTarget.roles.map((r) => (
                    <span key={r.role.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-medium">
                      {r.role.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-text-secondary mb-1.5">Assign roles <span className="text-text-secondary font-normal">({roleSelection.length} selected)</span></p>
              <div className="border border-border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                {allRoles.map((role) => (
                  <label key={role.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-bg-light cursor-pointer border-b border-border last:border-0">
                    <input type="checkbox" className="accent-blue-600" checked={roleSelection.includes(role.id)} onChange={() => toggleRole(role.id)} />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{role.name}</p>
                      {role.description && <p className="text-xs text-text-secondary">{role.description}</p>}
                    </div>
                    {role.isSystem && <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-semibold">System</span>}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setRoleTarget(null)} className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">{saving ? 'Saving…' : 'Save Roles'}</button>
            </div>
          </form>
        </Modal>
      )}
    </motion.div>
  );
};

export default UsersPage;
