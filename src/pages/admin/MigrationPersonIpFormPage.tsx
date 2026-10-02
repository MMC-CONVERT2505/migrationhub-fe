import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { migrationPersonIpService } from '@/api/migrationPersonIp';
import { ApiError } from '@/api/client';
import type { CreateMigrationPersonIpMappingRequest } from '@/types/api';

// ─── Shared UI primitives (match the other admin pages) ───────────────────────

const inputCls =
  'w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors bg-white disabled:bg-bg-light disabled:text-text-tertiary';

const FORM_ID = 'migration-person-ip-form';

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
    {hint && <p className="text-[11px] text-text-tertiary">{hint}</p>}
  </div>
);

// IPv4 or IPv6 — mirrors the backend's @IsIP() check so a mistake is caught
// before the round-trip.
const IP_RE =
  /^(?:(?:\d{1,3}\.){3}\d{1,3}|[0-9a-fA-F:]+:[0-9a-fA-F:]*)$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  name: string;
  email: string;
  machineIp: string;
  isActive: boolean;
}

const emptyForm = (): FormState => ({
  name: '',
  email: '',
  machineIp: '',
  isActive: true,
});

const MigrationPersonIpFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    setLoadError('');
    try {
      const mapping = await migrationPersonIpService.getById(id as string);
      setForm({
        name: mapping.name,
        email: mapping.email,
        machineIp: mapping.machineIp,
        isActive: mapping.isActive,
      });
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : 'Failed to load this mapping.',
      );
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    load();
  }, [load]);

  /** Mirrors the server's checks so a mistake is caught before the round-trip. */
  const buildPayload = (): CreateMigrationPersonIpMappingRequest | null => {
    const name = form.name.trim();
    if (!name) {
      setFormError('Name is required.');
      return null;
    }

    const email = form.email.trim();
    if (!EMAIL_RE.test(email)) {
      setFormError('Please provide a valid email address.');
      return null;
    }

    const machineIp = form.machineIp.trim();
    if (!IP_RE.test(machineIp)) {
      setFormError('Please provide a valid IP address.');
      return null;
    }

    return { name, email, machineIp, isActive: form.isActive };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      if (isEdit) await migrationPersonIpService.update(id as string, payload);
      else await migrationPersonIpService.create(payload);
      navigate('/admin/migration-person-ip');
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Failed to save this mapping.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="sticky top-16 z-30 -mx-6 px-6 py-3 mb-5 bg-bg/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/migration-person-ip"
            title="Back to Person & IP Mapping"
            className="p-1.5 -ml-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-light transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-text-primary tracking-tight truncate">
              {isEdit ? 'Edit Mapping' : 'New Mapping'}
            </h1>
            <p className="text-xs text-text-secondary truncate">
              Who ran a migration, and from which machine — used for the audit trail.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/admin/migration-person-ip"
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
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Mapping'}
            </button>
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="bg-white border border-border rounded-xl shadow-card p-8 flex flex-col items-center gap-3">
          <p className="text-sm text-red-700">{loadError}</p>
          <Link to="/admin/migration-person-ip" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            Back to Person & IP Mapping
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name" required>
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="John Smith"
                />
              </Field>

              <Field label="Email" required>
                <input
                  type="email"
                  className={inputCls}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </Field>

              <Field label="Machine IP" required hint="The operator machine this person runs migrations from.">
                <input
                  className={inputCls}
                  value={form.machineIp}
                  onChange={(e) => setForm((f) => ({ ...f, machineIp: e.target.value }))}
                  placeholder="192.168.1.25"
                />
              </Field>

              <Field label="Status">
                <select
                  className={inputCls}
                  value={form.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === 'active' }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>
          </section>
        </form>
      )}
    </motion.div>
  );
};

export default MigrationPersonIpFormPage;
