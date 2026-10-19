import React, { useRef, useState } from 'react';
import { Modal } from '@/components/admin/Modal';
import { usersService } from '@/api/users';
import { ApiError } from '@/api/client';
import type { UserWithRoles } from '@/types/api';

interface DeleteUserModalProps {
  user: UserWithRoles;
  onClose: () => void;
  onDeleted: (message: string) => void;
  /** Offered when the delete is refused for business records: blocking is the safe alternative. */
  onBlock?: (user: UserWithRoles) => Promise<void> | void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ user, onClose, onDeleted, onBlock }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // 409s are business rules ("has payments", "can't delete yourself") — shown with the way out.
  const [refused, setRefused] = useState(false);
  const inFlight = useRef(false);
  const name = `${user.firstname} ${user.lastname}`.trim() || user.email;

  const remove = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await usersService.deleteUser(user.id);
      onDeleted(`Deleted ${name}.`);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 404) {
        onDeleted(`${name} was already deleted.`); // someone else got there first — the goal is met
        return;
      }
      setRefused(err instanceof ApiError && err.statusCode === 409);
      setError(err instanceof ApiError ? err.message : 'Could not delete the user. Please try again.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const block = async () => {
    if (!onBlock || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try { await onBlock(user); } finally { inFlight.current = false; setBusy(false); }
  };

  return (
    <Modal title="Delete user" onClose={onClose} locked={busy}>
      <div className="space-y-4">
        <p className="text-sm text-text-primary">
          Permanently delete <strong>{name}</strong>
          {user.email && <> (<span className="font-mono text-xs">{user.email}</span>)</>}?
        </p>
        <p className="text-xs text-text-secondary">
          This removes their account, password and role assignments and can’t be undone. Users who have
          payments or migrations on record can’t be deleted — block them instead.
        </p>

        {error && (
          <div role="alert" className={`px-3 py-2 rounded-lg text-sm border ${refused ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {error}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button type="button" data-autofocus onClick={onClose} disabled={busy}
            className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-light disabled:opacity-60 transition-colors">
            {refused ? 'Close' : 'Cancel'}
          </button>
          {refused && onBlock && user.status === 'Active' && (
            <button type="button" onClick={block} disabled={busy}
              className="px-4 py-2 text-sm font-semibold text-amber-900 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200 disabled:opacity-60 transition-colors">
              {busy ? 'Blocking…' : 'Block account instead'}
            </button>
          )}
          {!refused && (
            <button type="button" onClick={remove} disabled={busy}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors">
              {busy ? 'Deleting…' : 'Delete user'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
