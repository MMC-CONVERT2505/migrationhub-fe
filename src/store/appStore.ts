import { create } from 'zustand';
import type { AppState, Screen, Pair } from '@/types';

export const useAppStore = create<AppState>((set) => ({
  currentScreen: 'home',
  selectedPair: null,
  selectedPlanIndex: 1, // middle plan selected by default
  migrationStep: 1,
  selectedDataCategories: [0, 1, 2, 3, 4, 5, 6, 7],
  paymentProcessing: false,
  migrationComplete: false,

  setScreen: (screen: Screen) => set({ currentScreen: screen }),

  setSelectedPair: (pair: Pair | null) => set({ selectedPair: pair }),

  setSelectedPlan: (index: number) => set({ selectedPlanIndex: index }),

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
      selectedPlanIndex: 1,
      migrationStep: 1,
      selectedDataCategories: [0, 1, 2, 3, 4, 5, 6, 7],
      paymentProcessing: false,
      migrationComplete: false,
    }),
}));
