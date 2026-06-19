import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, PendingMigration, Screen, Pair, InquiryDetails } from '@/types';

const PENDING_MIGRATION_LS_KEY = 'mmc-pending-migration';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentScreen: 'home',
      selectedPair: null,
      migrationStep: 1,
      selectedDataCategories: [0, 1, 2, 3, 4, 5, 6, 7],
      paymentProcessing: false,
      migrationComplete: false,
      pendingMigration: null,
      selectedPlanId: null,
      inquiryDetails: null,

      setScreen: (screen: Screen) => set({ currentScreen: screen }),
      setSelectedPair: (pair: Pair | null) => set({ selectedPair: pair }),

      nextMigrationStep: () =>
        set((s) => ({ migrationStep: Math.min(s.migrationStep + 1, 5) })),

      prevMigrationStep: () =>
        set((s) => ({ migrationStep: Math.max(s.migrationStep - 1, 1) })),

      toggleDataCategory: (index: number) =>
        set((state) => {
          const selected = state.selectedDataCategories.includes(index)
            ? state.selectedDataCategories.filter((i) => i !== index)
            : [...state.selectedDataCategories, index];
          return { selectedDataCategories: selected };
        }),

      startPaymentProcessing: () => set({ paymentProcessing: true }),
      completeMigration: () => set({ migrationComplete: true }),

      resetMigration: () =>
        set({
          currentScreen: 'home',
          selectedPair: null,
          migrationStep: 1,
          selectedDataCategories: [0, 1, 2, 3, 4, 5, 6, 7],
          paymentProcessing: false,
          migrationComplete: false,
          pendingMigration: null,
          selectedPlanId: null,
        }),

      setSelectedPlanId: (planId: string | null) => set({ selectedPlanId: planId }),

      setPendingMigration: (data: PendingMigration | null) => {
        if (data) {
          localStorage.setItem(PENDING_MIGRATION_LS_KEY, JSON.stringify(data));
        } else {
          localStorage.removeItem(PENDING_MIGRATION_LS_KEY);
        }
        set({ pendingMigration: data });
      },

      setInquiryDetails: (data: InquiryDetails | null) => set({ inquiryDetails: data, }),
    }),
    {
      name: 'mmc-app',
      storage: createJSONStorage(() => sessionStorage),
      // Persist pair selection so it survives sign-in redirect
      partialize: (s) => ({
        selectedPair: s.selectedPair,
        selectedPlanId: s.selectedPlanId,
        inquiryDetails: s.inquiryDetails,
      }),
    },
  ),
);

export { PENDING_MIGRATION_LS_KEY };
