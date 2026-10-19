import React, { useRef, useState } from 'react';
import { Modal } from '@/components/admin/Modal';
import { usersService } from '@/api/users';
import { ApiError } from '@/api/client';
import type { UserWithRoles } from '@/types/api';
import {
  DIAL_CODES, buildUserUpdate, fieldForServerError, toFormValues, validateUserEdit,
  type UserFormErrors, type UserFormValues,
} from '@/utils/userForm';

// Width is added per use: a base that already said w-full made the dial-code select swallow the
// whole row (Tailwind can't have two widths on one element) and squeezed the number field away.
const control =
  'px-3 py-2 text-sm border border-border rounded-lg bg-white text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:bg-bg-light';
const input = `${control} w-full`;
const inputErr = 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20';

const Field: React.FC<{ id: string; label: string; error?: string; hint?: string; children: React.ReactNode }> = ({
  id, label, error, hint, children,
}) => (
  <div>
    <label htmlFor={id} className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
    {children}
    {error ? (
      <p id={`${id}-error`} className="mt-1 text-xs text-red-600">{error}</p>
    ) : hint ? (
      <p id={`${id}-hint`} className="mt-1 text-xs text-text-secondary">{hint}</p>
    ) : null}
  </div>
);

interface EditUserModalProps {
  user: UserWithRoles;
  onClose: () => void;
  /** Called after a successful save, so the list can refresh. */
  onSaved: (message: string) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSaved }) => {
  const [values, setValues] = useState<UserFormValues>(() => toFormValues(user));
  const [errors, setErrors] = useState<UserFormErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const set = <K extends keyof UserFormValues>(k: K, v: UserFormValues[K]) => {
    setValues((p) => ({ ...p, [k]: v }));
    setErrors((p) => (p[k] ? { ...p, [k]: undefined } : p));
    setFormError('');
  };
  const aria = (k: keyof UserFormValues) => ({
    'aria-invalid': !!errors[k],
    'aria-describedby': errors[k] ? `edit-${k}-error` : undefined,
  });

  const payload = buildUserUpdate(values, user);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inFlight.current) return;
    const found = validateUserEdit(values, user);
    if (Object.values(found).some(Boolean)) {
      setErrors(found);
      const first = (Object.keys(found) as (keyof UserFormValues)[]).find((k) => found[k]);
      if (first) document.getElementById(`edit-${first}`)?.focus();
      return;
    }
    if (!payload) { onClose(); return; }

    inFlight.current = true;
    setSaving(true);
    setFormError('');
    try {
      await usersService.updateUserById(user.id, payload);
      onSaved(`Saved changes to ${payload.firstname} ${payload.lastname}.`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not save the changes. Please try again.';
      const field = err instanceof ApiError ? fieldForServerError(message) : null;
      if (field) {
        setErrors({ [field]: message });
        document.getElementById(`edit-${field}`)?.focus();
      } else {
        setFormError(message);
      }
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit user — ${user.firstname} ${user.lastname}`.trim()} onClose={onClose} size="lg" locked={saving}>
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="edit-firstname" label="First name" error={errors.firstname}>
            <input id="edit-firstname" className={`${input} ${errors.firstname ? inputErr : ''}`} value={values.firstname}
              onChange={(e) => set('firstname', e.target.value)} maxLength={50} autoComplete="off" {...aria('firstname')} />
          </Field>
          <Field id="edit-lastname" label="Last name" error={errors.lastname}>
            <input id="edit-lastname" className={`${input} ${errors.lastname ? inputErr : ''}`} value={values.lastname}
              onChange={(e) => set('lastname', e.target.value)} maxLength={50} autoComplete="off" {...aria('lastname')} />
          </Field>
        </div>

        <Field id="edit-email" label="Email" error={errors.email}>
          <input id="edit-email" type="email" className={`${input} ${errors.email ? inputErr : ''}`} value={values.email}
            onChange={(e) => set('email', e.target.value)} autoComplete="off" {...aria('email')} />
        </Field>

        <Field
          id="edit-username"
          label="Username"
          error={errors.username}
          hint="Optional. Leave as is unless it needs to change — sign-in is by email."
        >
          <input id="edit-username" className={`${input} ${errors.username ? inputErr : ''}`} value={values.username}
            onChange={(e) => set('username', e.target.value)} maxLength={64} autoComplete="off" {...aria('username')} />
        </Field>

        <Field id="edit-mobile" label="Mobile (optional)" error={errors.mobile} hint="Leave empty to remove the number.">
          <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2">
            <select
              aria-label="Dial code"
              value={values.dialCode}
              onChange={(e) => set('dialCode', e.target.value)}
              className={`${control} w-full`}
            >
              {[...new Set([...DIAL_CODES, values.dialCode])].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <input id="edit-mobile" inputMode="tel" className={`${input} ${errors.mobile ? inputErr : ''}`} value={values.mobile}
              onChange={(e) => set('mobile', e.target.value)} placeholder="412 345 678" maxLength={20} autoComplete="off" {...aria('mobile')} />
          </div>
        </Field>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light disabled:opacity-60 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || !payload}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
