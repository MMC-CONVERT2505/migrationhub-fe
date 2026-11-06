import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usersService } from '@/api/users';
import { rolesService } from '@/api/roles';
import { ApiError } from '@/api/client';
import { usePermissions } from '@/hooks/usePermissions';
import type { CreateSubUserRequest, Role } from '@/types/api';

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white transition-colors';

const Field: React.FC<{ label: string; required?: boolean; hint?: string; children: React.ReactNode }> = ({
  label, required, hint, children,
}) => (
  <div>
    <label className="block text-xs font-medium text-text-secondary mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
      {hint && <span className="font-normal text-text-secondary ml-1">({hint})</span>}
    </label>
    {children}
  </div>
);

const CreateUserPage: React.FC = () => {
  const navigate   = useNavigate();
  const { can }    = usePermissions();

  const [form, setForm] = useState<CreateSubUserRequest>({
    firstname: '',
    lastname: '',
    email: '',
    username: '',
    password: '',
    roleIds: [],
  });
  const [allRoles, setAllRoles]   = useState<Role[]>([]);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    rolesService.list().then((r) => setAllRoles(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  const setF = <K extends keyof CreateSubUserRequest>(k: K, v: CreateSubUserRequest[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleRole = (id: number) =>
    setF('roleIds', (form.roleIds ?? []).includes(id)
      ? (form.roleIds ?? []).filter((x) => x !== id)
      : [...(form.roleIds ?? []), id],
    );

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.firstname.trim()) errs.firstname = 'First name is required';
    if (!form.lastname.trim())  errs.lastname  = 'Last name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email is required';
    if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setSaving(true);

    try {
      await usersService.createSubUser({
        ...form,
        username: form.username || undefined,
        roleIds:  form.roleIds?.length ? form.roleIds : undefined,
      });
      navigate('/admin/users');
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.message.toLowerCase().includes('email')) setFieldErrors({ email: e.message });
        else if (e.message.toLowerCase().includes('username')) setFieldErrors({ username: e.message });
        else setError(e.message);
      } else {
        setError('Failed to create user.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!can('users.write')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg className="w-12 h-12 text-text-tertiary mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-text-secondary font-medium">You need the <span className="font-mono text-xs bg-bg-light px-1.5 py-0.5 rounded">users.write</span> permission to create users.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/users')} className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-light transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Create User</h1>
          <p className="mt-0.5 text-sm text-text-secondary">Create a new user and optionally assign roles</p>
        </div>
      </div>

      {error && <div role="alert" className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-border rounded-xl p-6 shadow-card space-y-5 mb-5">
          <h2 className="text-sm font-semibold text-text-primary">Personal Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="First name" required>
              <input className={inputCls} value={form.firstname} onChange={(e) => setF('firstname', e.target.value)} placeholder="Jane" />
              {fieldErrors.firstname && <p className="text-xs text-red-600 mt-1">{fieldErrors.firstname}</p>}
            </Field>
            <Field label="Last name" required>
              <input className={inputCls} value={form.lastname} onChange={(e) => setF('lastname', e.target.value)} placeholder="Smith" />
              {fieldErrors.lastname && <p className="text-xs text-red-600 mt-1">{fieldErrors.lastname}</p>}
            </Field>
          </div>

          <Field label="Email" required>
            <input type="email" className={inputCls} value={form.email} onChange={(e) => setF('email', e.target.value)} placeholder="jane@company.com" />
            {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
          </Field>

          <Field label="Username" hint="optional">
            <input className={inputCls} value={form.username ?? ''} onChange={(e) => setF('username', e.target.value)} placeholder="janesmith" />
            {fieldErrors.username && <p className="text-xs text-red-600 mt-1">{fieldErrors.username}</p>}
          </Field>

          <Field label="Password" required>
            <input type="password" className={inputCls} value={form.password} onChange={(e) => setF('password', e.target.value)} placeholder="Min. 8 characters" />
            {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
          </Field>
        </div>

        {/* Role picker */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Assign Roles</h2>
            <span className="text-xs text-text-secondary">{(form.roleIds ?? []).length} selected · optional</span>
          </div>

          {allRoles.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-4">No roles available</p>
          ) : (
            <div className="space-y-2">
              {allRoles.map((role) => (
                <label key={role.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-bg-light cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="accent-blue-600 mt-0.5"
                    checked={(form.roleIds ?? []).includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{role.name}</span>
                      {role.isSystem && <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-semibold">System</span>}
                    </div>
                    {role.description && <p className="text-xs text-text-secondary mt-0.5">{role.description}</p>}
                    {role.permissions.length > 0 && (
                      <p className="text-xs text-text-secondary mt-1">
                        {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                        {' · '}
                        {role.permissions.slice(0, 3).map((rp) => `${rp.permission.module}.${rp.permission.action}`).join(', ')}
                        {role.permissions.length > 3 && '…'}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/admin/users')} className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
            {saving ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateUserPage;
