import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, DateRangeSelection, PendingMigration, Screen, Pair, InquiryDetails } from '@/types';
import { newFlowToken } from '@/constants/dedicatedFlow';

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
      selectedYears: null,
      selectedDateRange: null,
      selectedCountry: null,
      inquiryDetails: null,
      entryLocked: false,
      dedicatedFlow: null,

      // A different country is a different price list row: the extended-years choice no longer applies.
      setSelectedCountry: (country: string | null) =>
        set((s) => (s.selectedCountry === country ? {} : { selectedCountry: country, selectedYears: null })),
      setScreen: (screen: Screen) => set({ currentScreen: screen }),
      // A custom period belongs to one order: another pair means another order, so it never carries over.
      // (The same pair being re-resolved, e.g. after a refresh of the listing, keeps it.)
      setSelectedPair: (pair: Pair | null) =>
        set((s) =>
          s.selectedPair && pair && s.selectedPair.src === pair.src && s.selectedPair.dst === pair.dst
            ? { selectedPair: pair }
            : { selectedPair: pair, selectedDateRange: null },
        ),
      setEntryLocked: (locked: boolean) => set({ entryLocked: locked }),
      // A fresh entry always gets a fresh token, so an old link or another tab's token can never match.
      startDedicatedFlow: (slug: string) => set({ dedicatedFlow: { slug, token: newFlowToken() }, entryLocked: true }),
      endDedicatedFlow: () => set({ dedicatedFlow: null, entryLocked: false }),

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
          selectedYears: null,
          selectedDateRange: null,
          selectedCountry: null,
          entryLocked: false,
          dedicatedFlow: null,
          // A finished flow's inquiry must not be attached to the next pair's checkout.
          inquiryDetails: null,
        }),

      // Choosing a different plan drops any extended-years choice made for the previous one.
      setSelectedPlanId: (planId: string | null) =>
        set((s) => (s.selectedPlanId === planId ? {} : { selectedPlanId: planId, selectedYears: null })),
      // Years and an exact period are alternatives: choosing one drops the other.
      setSelectedYears: (years: number | null) => set({ selectedYears: years, selectedDateRange: null }),
      setSelectedDateRange: (range: DateRangeSelection | null) =>
        set(range ? { selectedDateRange: range, selectedYears: null } : { selectedDateRange: null }),

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
        selectedYears: s.selectedYears,
        selectedDateRange: s.selectedDateRange,
        selectedCountry: s.selectedCountry,
        inquiryDetails: s.inquiryDetails,
        entryLocked: s.entryLocked,
        dedicatedFlow: s.dedicatedFlow,
      }),
    },
  ),
);

export { PENDING_MIGRATION_LS_KEY };
