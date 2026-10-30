import type { TransactionPlan } from '@/constants/transactionPlans';
import type { DedicatedFlow } from '@/constants/dedicatedFlow';

// ─── Platform & Migration Pair Types ────────────────────────────────────────

export interface Pair {
  id?: number | string;
  src: string;
  dst: string;
  srcColor: string;
  dstColor: string;
  srcAbbr: string;
  dstAbbr: string;
  /** Brand logo URLs (ToolLogo banners); absent/null falls back to the abbr mark. */
  srcLogo?: string | null;
  dstLogo?: string | null;
  count: string;
  status: 'paid' | 'free' | 'region';
  isFree?: boolean;
  plans: Plan[];
  /** Country price list; when present it, not the plans' own price, prices every order. */
  planPrices?: PlanPrice[];
  /** Countries where the pair's cheapest plan costs nothing (sponsored), from the price list. */
  freeCountries?: string[];
  url: string | null;
  toolUrl: string | null;
  myobBusiness?: boolean;
}

// ─── Pricing Plan Types ──────────────────────────────────────────────────────

/** One row of the country price list: what a plan costs on a pair for a country. */
export interface PlanPrice {
  planId: string;
  country: string;
  currency: string;
  basePrice: number;
  extraYearPrice: number | null;
  taxRate: number;
}

export interface Plan {
  id?: string;
  name: string;
  history: string;
  /** Total financial years covered (current + historical). null for inception plans. */
  years?: number | null;
  /** Unlimited "inception to date" coverage. */
  isInception?: boolean;
  support: string;
  basePrice: number;
  /** Price per extra financial year; absent/null = customers cannot extend this plan. */
  extraYearPrice?: number | null;
  /** ISO currency code the plan is priced in; absent falls back to DEFAULT_CURRENCY. */
  currency?: string;
  /** % added on top of the price (e.g. India GST 18); absent/0 = none. */
  taxRate?: number;
  features: string[];
  popular?: boolean;
}

// ─── Admin Dashboard Types ───────────────────────────────────────────────────

export interface AdminPairData {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  successRate: number;
  avgTime: string;
}

export type FeedItemType = 'success' | 'info' | 'warning' | 'error';

export interface FeedItem {
  type: FeedItemType;
  title: string;
  description: string;
  timestamp: string;
}

// ─── Data Category Types ─────────────────────────────────────────────────────

export interface DataCategory {
  icon: string;
  name: string;
  estimatedRecords: number;
}

// ─── KPI Card Types ──────────────────────────────────────────────────────────

export interface KPICard {
  label: string;
  value: string;
  change: string;
  changePositive: boolean;
  icon: string;
}

// ─── App State Types ─────────────────────────────────────────────────────────

export type Screen = 'home' | 'payment' | 'migration' | 'admin';

/** From/To days as YYYY-MM-DD; either may still be empty while the form is being filled. */
export interface DateRangeSelection {
  from: string;
  to: string;
}

export interface PendingMigration {
  migrationPairId: string;
  planId?: string;
  /** Carried across the Razorpay redirect so the created migration links to its inquiry. */
  inquiryId?: number;
  /** Total years the customer paid for when extending the plan's history. */
  years?: number;
}

export interface InquiryDetails {
  id?: number;
  /** UI-only: the pair this inquiry was created for, so a different pair never reuses it. */
  migrationPairId?: string;
  name: string;
  email: string;
  phone: string;
  entityName: string;
  financialYearEnd?: string;
  country?: string;
  transactionPlan?: TransactionPlan;
  addOnsConfirmed?: boolean;
  trackingInventory?: boolean;
  /** Returned only from POST /inquiry-migrations. Sent solely as the PATCH
   *  x-inquiry-edit-token header — never rendered, logged, or put in a URL. */
  editToken?: string;
}

export interface AppState {
  currentScreen: Screen;
  selectedPair: Pair | null;
  migrationStep: number;
  selectedDataCategories: number[];
  paymentProcessing: boolean;
  migrationComplete: boolean;
  /** Set before Razorpay redirect; also written to localStorage for post-redirect survival. */
  pendingMigration: PendingMigration | null;
  selectedPlanId: string | null;
  /** Operation Team only: total financial years chosen beyond the plan's coverage. */
  selectedYears: number | null;
  /** Operation Team only: an exact From/To period instead of years (null = not in use). Never both with selectedYears. */
  selectedDateRange: DateRangeSelection | null;
  /** Customer country (plain name, e.g. "Australia"): selects the price list row. Single source for the whole flow. */
  selectedCountry: string | null;
  inquiryDetails: InquiryDetails | null;
  /** True when the user arrived via an external deep link — the home page is then locked. */
  entryLocked: boolean;
  /** Dedicated pair flows only: issued on entry through the Hub, proves this tab came in properly. */
  dedicatedFlow: DedicatedFlow | null;

  setSelectedCountry: (country: string | null) => void;
  setScreen: (screen: Screen) => void;
  setSelectedPair: (pair: Pair | null) => void;
  setEntryLocked: (locked: boolean) => void;
  /** Enter a dedicated pair's flow: issues this tab's token and locks the session to the flow. */
  startDedicatedFlow: (slug: string) => void;
  endDedicatedFlow: () => void;
  nextMigrationStep: () => void;
  prevMigrationStep: () => void;
  toggleDataCategory: (index: number) => void;
  startPaymentProcessing: () => void;
  completeMigration: () => void;
  resetMigration: () => void;
  setPendingMigration: (data: PendingMigration | null) => void;
  setSelectedPlanId: (planId: string | null) => void;
  setSelectedYears: (years: number | null) => void;
  setSelectedDateRange: (range: DateRangeSelection | null) => void;
  setInquiryDetails: (data: InquiryDetails | null) => void;
}

// ─── Component Prop Types ────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'blue' | 'green' | 'gray';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export type PlatformLogoSize = 'sm' | 'md' | 'lg';

export interface PlatformLogoProps {
  platformName: string;
  size?: PlatformLogoSize;
  className?: string;
}

// ─── Chart Types ─────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

// ─── Payment Types ───────────────────────────────────────────────────────────

export interface PaymentFormData {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  billingEmail: string;
  company: string;
  country: string;
  postalCode: string;
}

// ─── Migration Step Types ─────────────────────────────────────────────────────

export interface MigrationStepConfig {
  id: number;
  label: string;
  description: string;
}

export interface ProgressCategory {
  categoryIndex: number;
  progress: number;
  status: 'queued' | 'running' | 'done';
}
