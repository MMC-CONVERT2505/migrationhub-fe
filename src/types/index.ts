// ─── Platform & Migration Pair Types ────────────────────────────────────────

export interface Pair {
  src: string;
  dst: string;
  srcColor: string;
  dstColor: string;
  srcAbbr: string;
  dstAbbr: string;
  count: string;
  status: 'paid' | 'free' | 'region';
  url: string | null;
  myobBusiness?: boolean;
}

// ─── Pricing Plan Types ──────────────────────────────────────────────────────

export interface Plan {
  name: string;
  history: string;
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

export interface AppState {
  currentScreen: Screen;
  selectedPairIndex: number | null;
  selectedPlanIndex: number;
  migrationStep: number;
  selectedDataCategories: number[];
  paymentProcessing: boolean;
  migrationComplete: boolean;
  setScreen: (screen: Screen) => void;
  setSelectedPair: (index: number | null) => void;
  setSelectedPlan: (index: number) => void;
  nextMigrationStep: () => void;
  prevMigrationStep: () => void;
  toggleDataCategory: (index: number) => void;
  startPaymentProcessing: () => void;
  completeMigration: () => void;
  resetMigration: () => void;
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
