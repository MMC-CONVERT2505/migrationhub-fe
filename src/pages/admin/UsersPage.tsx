import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usersService } from '@/api/users';
import { rolesService } from '@/api/roles';
import { userRolesService } from '@/api/userRoles';
import { ApiError } from '@/api/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Pagination } from '@/components/admin/Pagination';
import { clampSkip, parseListResponse } from '@/utils/pagination';
import type { Role, UserWithRoles } from '@/types/api';

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title, onClose, children,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  </div>
);

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
            Create Sub-User
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

      {error && <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {/* Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
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

      {/* Role assignment modal */}
      {roleTarget && (
        <Modal title={`Edit Roles — ${roleTarget.firstname} ${roleTarget.lastname}`} onClose={() => setRoleTarget(null)}>
          <form onSubmit={handleAssignRoles} className="space-y-4">
            {roleError && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{roleError}</div>}
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
