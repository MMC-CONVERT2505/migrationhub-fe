import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { opTeamService } from '@/api/opTeam';
import { useOpTeamStore } from '@/store/opTeamStore';

/** Shows who is signed in as Operation Team; drops a stale session (expired / deactivated). */
export const OpTeamBadge: React.FC = () => {
  const { token, member, signOut } = useOpTeamStore();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!token) return;
    opTeamService.me().catch((err: { statusCode?: number }) => {
      if (err?.statusCode === 401) signOut();
    });
  }, [token, signOut]);

  if (!token || !member || pathname.startsWith('/admin')) return null;

  const handleSignOut = async () => {
    try { await opTeamService.logout(); } catch { /* token is stateless; ignore */ }
    signOut();
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-full bg-gray-900 px-4 py-2 text-xs text-white shadow-lg">
      <span>Operation Team · {member.name}</span>
      <button onClick={handleSignOut} className="underline hover:no-underline">
        Sign out
      </button>
    </div>
  );
};
