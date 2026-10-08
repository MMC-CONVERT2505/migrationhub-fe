import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface OpTeamMember {
  id: number;
  name: string;
  email: string;
}

interface OpTeamState {
  token: string | null;
  member: OpTeamMember | null;
  signIn: (token: string, member: OpTeamMember) => void;
  signOut: () => void;
}

/**
 * Operation Team session — kept apart from the user/admin sessions so it can
 * never be mistaken for either. Guests simply have no entry here.
 */
export const useOpTeamStore = create<OpTeamState>()(
  persist(
    (set) => ({
      token: null,
      member: null,
      signIn: (token, member) => set({ token, member }),
      signOut: () => set({ token: null, member: null }),
    }),
    { name: 'mmc-op-team', storage: createJSONStorage(() => sessionStorage) },
  ),
);

export const getOpTeamToken = (): string | null => useOpTeamStore.getState().token;
