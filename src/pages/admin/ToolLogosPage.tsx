import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { bannersService } from '@/api/banners';
import { uploadService } from '@/api/upload';
import { ApiError } from '@/api/client';
import { extractList } from '@/utils/platformMap';
import type { BannerEntity, BannerType, CreateBannerRequest } from '@/types/api';

// Brand logos are stored as banners. This page manages the two logo types:
// ToolLogo (attached to migration pairs) and HomeLogo (site branding).

// Logo types this page manages, in display order. Promotional banner types
// (Home / SplashScreen) are intentionally excluded.
const LOGO_TYPES: { value: BannerType; label: string; hint: string }[] = [
  { value: 'ToolLogo', label: 'Tool Logo', hint: 'Attachable to migration pairs as a source/destination mark.' },
  { value: 'HomeLogo', label: 'Home Logo', hint: 'Used for site/home-page branding.' },
];
const LOGO_TYPE_VALUES = LOGO_TYPES.map((t) => t.value);
const typeLabel = (t: BannerType) => LOGO_TYPES.find((x) => x.value === t)?.label ?? t;

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const ACCEPT_ATTR = '.png,.jpg,.jpeg,.webp,.svg';
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

const inputCls =
  'w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors bg-white disabled:bg-bg-light disabled:text-text-tertiary';

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

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mb-10"
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

/** File picker with preview + client-side validation. Reports the chosen file
 *  (for upload on submit) and an object-URL preview; or an existing image URL. */
const LogoPicker: React.FC<{
  file: File | null;
  existingUrl?: string | null;
  error?: string;
  onPick: (file: File | null, error?: string) => void;
}> = ({ file, existingUrl, error, onPick }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handle = (f: File | null) => {
    if (!f) return onPick(null);
    if (!ACCEPTED.includes(f.type)) {
      return onPick(null, 'Use a PNG, JPG, WEBP, or SVG image.');
    }
    if (f.size > MAX_BYTES) {
      return onPick(null, 'Image must be 2 MB or smaller.');
    }
    onPick(f);
  };

  const shown = previewUrl ?? existingUrl ?? null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-lg border border-border bg-bg-light flex items-center justify-center overflow-hidden flex-shrink-0">
          {shown ? (
            <img src={shown} alt="logo preview" className="max-w-full max-h-full object-contain" />
          ) : (
            <svg className="w-6 h-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h.01M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors w-fit"
          >
            {shown ? 'Replace image' : 'Choose image'}
          </button>
          <p className="text-[11px] text-text-tertiary">PNG, JPG, WEBP, or SVG · max 2 MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0] ?? null)}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

interface LogoFormState {
  name: string;
  type: BannerType;
  file: File | null;
  fileError?: string;
}

const emptyForm: LogoFormState = { name: '', type: 'ToolLogo', file: null };

const ToolLogosPage: React.FC = () => {
  const [logos, setLogos] = useState<BannerEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BannerEntity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BannerEntity | null>(null);

  const [form, setForm] = useState<LogoFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // The API filters by a single type, so fetch each logo type and merge.
      const results = await Promise.all(
        LOGO_TYPE_VALUES.map((type) => bannersService.list({ type, take: 200 })),
      );
      const merged = results
        .flatMap((res) => extractList<BannerEntity>(res))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setLogos(merged);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load logos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError('');
    setCreateOpen(true);
  };

  const openEdit = (logo: BannerEntity) => {
    setForm({
      name: logo.name,
      type: LOGO_TYPE_VALUES.includes(logo.type) ? logo.type : 'ToolLogo',
      file: null,
    });
    setFormError('');
    setEditTarget(logo);
  };

  const closeForms = () => {
    setCreateOpen(false);
    setEditTarget(null);
    setForm(emptyForm);
    setFormError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setFormError('Name is required.');
    if (!form.file) return setFormError('Please choose a logo image.');
    setSaving(true);
    setFormError('');
    try {
      const { meta } = await uploadService.upload(form.file);
      const payload: CreateBannerRequest = {
        name: form.name.trim(),
        image: meta.filename,
        type: form.type,
        platform: 'Web',
      };
      await bannersService.create(payload);
      closeForms();
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create logo.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!form.name.trim()) return setFormError('Name is required.');
    setSaving(true);
    setFormError('');
    try {
      const data: Record<string, string> = { name: form.name.trim(), type: form.type };
      // Only upload + swap the image when the admin actually picked a new file.
      if (form.file) {
        const { meta } = await uploadService.upload(form.file);
        data.image = meta.filename;
      }
      await bannersService.update(editTarget.id, data);
      closeForms();
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to update logo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await bannersService.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete logo.');
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Tool Logos</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Brand logos — Tool Logos attach to migration pairs; Home Logos are site branding
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Logo
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-text-tertiary">
            <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h.01M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
            <p className="text-sm">No logos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-border">
            {logos.map((logo) => (
              <div key={logo.id} className="bg-white p-4 flex flex-col items-center gap-3 group">
                <div className="w-full h-20 flex items-center justify-center">
                  <img src={logo.image} alt={logo.name} className="max-w-[80%] max-h-full object-contain" />
                </div>
                <p className="text-xs font-medium text-text-primary text-center truncate w-full" title={logo.name}>
                  {logo.name}
                </p>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    logo.type === 'ToolLogo' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}
                >
                  {typeLabel(logo.type)}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(logo)}
                    className="p-1.5 rounded-md text-text-tertiary hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(logo)}
                    className="p-1.5 rounded-md text-text-tertiary hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(createOpen || editTarget) && (
        <Modal title={editTarget ? `Edit — ${editTarget.name}` : 'Add Tool Logo'} onClose={closeForms}>
          <form onSubmit={editTarget ? handleEdit : handleCreate} className="space-y-4">
            {formError && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>
            )}
            <Field label="Name" required hint="Shown to admins when picking a logo, e.g. “QuickBooks Online”.">
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="QuickBooks Online"
                required
              />
            </Field>
            <Field
              label="Type"
              required
              hint={LOGO_TYPES.find((t) => t.value === form.type)?.hint}
            >
              <select
                className={inputCls}
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as BannerType }))}
              >
                {LOGO_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Logo image" required={!editTarget}>
              <LogoPicker
                file={form.file}
                existingUrl={editTarget?.image}
                error={form.fileError}
                onPick={(file, fileError) => setForm((f) => ({ ...f, file, fileError }))}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={closeForms}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-bg-light transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !!form.fileError}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Logo'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete Tool Logo" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Delete <span className="font-semibold text-text-primary">{deleteTarget.name}</span>? Any migration pair
              using it will have the logo detached. This cannot be undone.
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
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default ToolLogosPage;
