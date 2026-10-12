import { apiClient } from './client';
import type {
  JourneyStage,
  JourneyStageKey,
  JourneyStageState,
} from '@/types/api';
import type {
  KarbonMigrationView,
  KarbonWorkItemSummary,
} from './adminKarbon';

export type { JourneyStage, JourneyStageKey, JourneyStageState };

export type MigrationStatus =
  | 'DRAFT' | 'PAYMENT_PENDING' | 'PAYMENT_FAILED'
  | 'SOURCE_AUTH_PENDING' | 'SOURCE_AUTH_AWAITING' | 'SOURCE_AUTH_COMPLETED'
  | 'DESTINATION_AUTH_PENDING' | 'DESTINATION_AUTH_AWAITING' | 'DESTINATION_AUTH_COMPLETED'
  | 'DATA_COUNT_PENDING' | 'DATA_COUNT_READY' | 'SUBMITTING' | 'QUEUED' | 'RUNNING'
  | 'PARTIAL_SUCCESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type MigrationStatusGroup = 'active' | 'completed' | 'failed';

interface PairLogo { image: string; name: string }

export type OrderSource = 'MIGRATION_HUB' | 'APP_STORE';

export const ORDER_SOURCE_LABEL: Record<OrderSource, string> = {
  MIGRATION_HUB: 'MigrationHub',
  APP_STORE: 'App Store',
};

export interface AdminMigrationPair {
  source: string;
  destination: string;
  displayName: string;
  /** Returned by the detail endpoint only. */
  isFree?: boolean;
  sourceLogo?: PairLogo | null;
  destinationLogo?: PairLogo | null;
}

// Normalized "who is this migration for", computed server-side (inquiry-first,
// falling back to the account). Use this everywhere customer identity is shown.
export interface MigrationCustomer {
  name: string | null;
  email: string | null;
  phone: string | null;
  entityName: string | null;
  country: string | null;
}

/** Who ran the migration: an Operation Team member signed in (via the normal Sign in) with the OP_TEAM role, otherwise a guest. */
export interface MigrationRunner {
  type: 'GUEST' | 'OP_TEAM';
  id: number | null;
  name: string;
  email: string | null;
  /** The operator's account no longer exists; name/email are the creation-time snapshot. */
  removed: boolean;
}

export interface AdminMigrationListItem {
  id: string;
  status: MigrationStatus;
  progress: number;
  currentCategory: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  isQaPassed: boolean | null;
  migrationPair: AdminMigrationPair;
  user: { email: string | null; firstname: string; lastname: string } | null;
  customer: MigrationCustomer;
  runner: MigrationRunner;
  /** Where the order was placed: the MigrationHub itself, or the App Store (run by the migration tool). */
  orderSource: OrderSource;
  /** What an App Store tool said it sold (years, matched plan…); null for hub orders. */
  externalDetails?: { years?: number | null; isInception?: boolean } | null;
  plan: { name: string } | null;
  /** Karbon mirror state — null when the integration has never run for this row. */
  karbonWorkItem: KarbonWorkItemSummary | null;
}

export interface AdminMigrationLog {
  id: string;
  level: string; // ActivityStatus: SUCCESS | INFO | WARNING | FAILED
  message: string;
  category: string | null;
  service: string | null;
  createdAt: string;
}

export interface AdminMigrationWebhookEvent {
  eventType: string;
  status: string;
  receivedAt: string;
  failureReason: string | null;
}

export interface AdminMigrationConnector {
  id: string;
  side: 'SOURCE' | 'DESTINATION';
  platform: string;
  tenantName: string | null;
  status: string;
  connectedAt: string | null;
}

export interface AdminMigrationInquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  entityName: string;
  financialYearEnd: string;
  /** Null when the customer was never asked — the row predates the question, or the pair doesn't ask it. */
  addOnsConfirmed: boolean | null;
  trackingInventory: boolean | null;
}

export type PaymentStatus = 'Pending' | 'Success' | 'Failed' | 'Cancelled';

export interface AdminMigrationPayment {
  id: number;
  status: PaymentStatus;
  /** Decimal string, 2 places. */
  amount: string;
  currency: string;
  /** Who took the payment: Razorpay for hub checkouts, AppStore for App Store orders. */
  gateway: string;
  /** The gateway's own payment / transaction id, once one exists. */
  transactionId: string | null;
  reference: string | null;
  isSettled: boolean;
  settledOn: string | null;
  customerName: string | null;
  customerEmail: string | null;
  company: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMigrationDetail extends AdminMigrationListItem {
  remoteJobId: string | null;
  failedCategory: string | null;
  qaReviewedAt: string | null;
  qaReviewedBy: number | null;
  connectors: AdminMigrationConnector[];
  logs: AdminMigrationLog[];
  webhookEvents: AdminMigrationWebhookEvent[];
  journey: JourneyStage[];
  inquiry: AdminMigrationInquiry | null;
  /** The payment ledger entry; null when none was recorded (free pair, or not paid yet). */
  payment: AdminMigrationPayment | null;
  /** Expected-vs-actual Karbon Work Item state, computed server-side. */
  karbon: KarbonMigrationView;
}

export interface AdminMigrationListResponse {
  data: AdminMigrationListItem[];
  total: number;
  skip: number;
  take: number;
}

export interface ListAdminMigrationsParams {
  group?: MigrationStatusGroup;
  orderSource?: OrderSource;
  search?: string;
  skip?: number;
  take?: number;
}

export const adminMigrationsService = {
  list: (params?: ListAdminMigrationsParams) =>
    apiClient
      .get<AdminMigrationListResponse>('/admin/migrations', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<AdminMigrationDetail>(`/admin/migrations/${id}`)
      .then((r) => r.data),

  setQa: (id: string, isQaPassed: boolean) =>
    apiClient
      .patch<AdminMigrationDetail>(`/admin/migrations/${id}/qa`, { isQaPassed })
      .then((r) => r.data),
};
