import { create } from 'zustand';
import type { AppState, Screen } from '@/types';

export const useAppStore = create<AppState>((set) => ({
  currentScreen: 'home',
  selectedPairIndex: null,
  selectedPlanIndex: 1, // Standard selected by default
  migrationStep: 1,
  selectedDataCategories: [0, 1, 2, 3, 4, 5, 6, 7], // All selected by default
  paymentProcessing: false,
  migrationComplete: false,

  setScreen: (screen: Screen) => set({ currentScreen: screen }),

  setSelectedPair: (index: number | null) => set({ selectedPairIndex: index }),

  setSelectedPlan: (index: number) => set({ selectedPlanIndex: index }),

  nextMigrationStep: () =>
    set((state) => ({
      migrationStep: Math.min(state.migrationStep + 1, 5),
    })),

  prevMigrationStep: () =>
    set((state) => ({
      migrationStep: Math.max(state.migrationStep - 1, 1),
    })),

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
      selectedPairIndex: null,
      selectedPlanIndex: 1,
      migrationStep: 1,
      selectedDataCategories: [0, 1, 2, 3, 4, 5, 6, 7],
      paymentProcessing: false,
      migrationComplete: false,
    }),
}));
