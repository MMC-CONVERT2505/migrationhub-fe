import type { TransactionPlan } from '@/constants/transactionPlans';

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
  url: string | null;
  toolUrl: string | null;
  myobBusiness?: boolean;
}

// ─── Pricing Plan Types ──────────────────────────────────────────────────────

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

export interface PendingMigration {
  migrationPairId: string;
  planId?: string;
  /** Carried across the Razorpay redirect so the created migration links to its inquiry. */
  inquiryId?: number;
}

export interface InquiryDetails {
  id?: number;
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
  inquiryDetails: InquiryDetails | null;
  /** True when the user arrived via an external deep link — the home page is then locked. */
  entryLocked: boolean;

  setScreen: (screen: Screen) => void;
  setSelectedPair: (pair: Pair | null) => void;
  setEntryLocked: (locked: boolean) => void;
  nextMigrationStep: () => void;
  prevMigrationStep: () => void;
  toggleDataCategory: (index: number) => void;
  startPaymentProcessing: () => void;
  completeMigration: () => void;
  resetMigration: () => void;
  setPendingMigration: (data: PendingMigration | null) => void;
  setSelectedPlanId: (planId: string | null) => void;
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
