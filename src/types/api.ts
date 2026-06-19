// ─── Common ───────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface SendCodeRequest {
  type: 'register' | 'update';
  email?: string;
  mobile?: string;
  username?: string;
  country?: string;
}

export interface VerifyCodeRequest {
  transport: 'email' | 'sms';
  target: string;
  code: string;
  userId?: number;
}

export interface RegisterRequest {
  firstname: string;
  lastname: string;
  username: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  email?: string;
  password: string;
  dialCode?: string;
  mobile?: string;
  country: string;
  countryCode?: string;
  verificationCode?: string;
  rememberMe?: boolean;
  deviceFCMToken?: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokenPayload {
  accessToken: string;
  type?: string;
  user?: UserProfile;
}

export interface VerifyOtpRequest {
  code: string;
  mobile: string;
  userId?: number;
}

export interface ForgotPasswordRequest {
  mobile: string;
  email?: string;
}

export interface ResetPasswordRequest {
  mobile: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'other';
export type UserStatus = 'Active' | 'Blocked' | 'InActive' | 'Completed' | 'Cancelled';

export interface UserProfile {
  id: number;
  firstname: string;
  lastname: string;
  username: string;
  email: string | null;
  mobile: string | null;
  dialCode: string | null;
  country: string | null;
  countryCode: string | null;
  dob: string | null;
  gender: Gender | null;
  profileImage: string | null;
  status: UserStatus;
  roles?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstname: string;
  lastname: string;
  email: string;
  username?: string;
  dob?: string;
  gender?: Gender;
  mobile?: string;
  dialCode?: string;
  country?: string;
  countryCode?: string;
}

export interface UpdateProfileImageRequest {
  profileImage: string;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword: string;
  confirmPassword: string;
  googleId?: string;
}

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  age?: number;
}

export interface CreateSubUserRequest {
  firstname: string;
  lastname: string;
  email: string;
  username?: string;
  password: string;
  roleIds?: number[];
}

// ─── RBAC ─────────────────────────────────────────────────────────────────────

export interface Permission {
  id: number;
  module: string;
  action: string;
  description: string;
}

export interface RolePermission {
  id: number;
  permissionId: number;
  permission: Permission;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: RolePermission[];
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  isSystem?: boolean;
  permissionIds?: number[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}

export interface CreatePermissionRequest {
  module: string;
  action: string;
  description: string;
}

export interface AssignPermissionsRequest {
  roleId: number;
  permissionIds: number[];
}

export interface AssignUserRolesRequest {
  userId: number;
  roleIds: number[];
  expiresAt?: string;
}

export interface ListUsersAdminQuery {
  skip?: number;
  take?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export interface UserWithRoles {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  status: UserStatus;
  roles: Array<{ role: { id: number; name: string } }>;
}

export interface ResetUserPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

export interface Remark {
  id: number;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetRemarksQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface SetUserStatusRequest {
  status: UserStatus;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminProfile {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAdminProfileRequest {
  firstname?: string;
  lastname?: string;
  email?: string;
}

export interface ChangeAdminPasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface AuthenticateAdminRequest {
  password: string;
}

// ─── Migrations ───────────────────────────────────────────────────────────────

export interface CreateMigrationRequest {
  paymentId?: string;
  migrationPairId?: string;
  planId?: string;
  inquiryId?: number;
}

export interface MigrationRecord {
  id: string;
  userId: number;
  migrationPairId: string;
  planId: string;
  paymentId?: number | string | null;
  status: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  migrationPair?: {
    id: string;
    source: string;
    destination: string;
    displayName: string;
    isFree: boolean;
    serviceUrl?: string;
    fallbackServiceUrl?: string | null;
  };
}

export type MigrationStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

// Canonical end-to-end step flow, computed server-side and shared by the admin
// tracing view and the customer tracking view. Keep in sync with the backend
// `migration-journey.ts`.
export type JourneyStageKey =
  | 'created'
  | 'payment'
  | 'source_auth'
  | 'destination_auth'
  | 'data_analysis'
  | 'migration'
  | 'outcome';

export type JourneyStageState =
  | 'completed'
  | 'active'
  | 'pending'
  | 'failed'
  | 'skipped';

export interface JourneyStage {
  key: JourneyStageKey;
  label: string;
  state: JourneyStageState;
  at: string | null;
  detail: string | null;
}

export interface UserMigration {
  id: string;
  userId: number;
  migrationPairId: string;
  planId: string;
  paymentId: string | null;
  status: MigrationStatus;
  remoteJobId: string | null;
  selectedCategories: string[] | null;
  sourceAuthUrl: string | null;
  destinationAuthUrl: string | null;
  progress: number;
  currentCategory: string | null;
  errorMessage: string | null;
  failedCategory: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  migrationPair: {
    id: string;
    source: string;
    destination: string;
    displayName: string;
    isFree: boolean;
  };
  plan: {
    id: string;
    name: string;
    basePrice: string | number;
    currency: string;
    history: string;
    support: string;
    features: string[];
    popular: boolean;
  };
  connectors: unknown[];
  /** Present on single-migration fetches (`getById`); absent on list. */
  journey?: JourneyStage[];
}

// ─── Payments (backend-driven flow) ───────────────────────────────────────────

export interface InitiatePaymentRequest {
  /** Amount in USD cents (e.g. $50.00 → 5000). */
  amount: number;
  migrationPairId: string;
  planId: string;
  currency?: string;
  description?: string;
  name?: string;
  email?: string;
  company?: string;
}

export interface InitiatePaymentResponse {
  paymentId: number | string;
  paymentUrl: string;
}

export type PaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface PaymentStatusResponse {
  paymentId: string;
  status: PaymentStatus;
  planName: string;
  amount: number;
  currency: string;
  failureReason?: string;
  completedAt?: string;
  migrationId?: string;
}

// ─── Razorpay ─────────────────────────────────────────────────────────────────

export interface CreateDepositOrderRequest {
  amount: number;
  currency?: string;
  description?: string;
}

export interface RazorpayOrder {
  id: string;
  keyId: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  created_at: number;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RefundPaymentRequest {
  razorpayPaymentId: string;
  amount?: number;
  reason?: string;
}

// ─── Migration Pairs ─────────────────────────────────────────────────────────

export type MigrationEnvironment = 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT';

/** Lightweight banner shape returned as a pair's source/destination logo. */
export interface PairLogo {
  id: number;
  name: string;
  image: string;
  status: BannerStatus;
}

export interface MigrationPairEntity {
  id: number | string;
  source: string;
  destination: string;
  displayName: string;
  serviceUrl: string;
  fallbackServiceUrl: string | null;
  apiVersion: string;
  healthCheckPath: string;
  environment: MigrationEnvironment;
  isActive: boolean;
  isMaintenance: boolean;
  isFree: boolean;
  plans: ApiPlan[];
  sourceLogoId: number | null;
  destinationLogoId: number | null;
  sourceLogo: PairLogo | null;
  destinationLogo: PairLogo | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMigrationPairRequest {
  source: string;
  destination: string;
  displayName: string;
  serviceUrl: string;
  fallbackServiceUrl?: string;
  apiVersion?: string;
  healthCheckPath?: string;
  webhookSecret?: string;
  serviceApiKey?: string;
  environment?: MigrationEnvironment;
  isActive?: boolean;
  isFree?: boolean;
  planIds?: string[];
  sourceLogoId?: number | null;
  destinationLogoId?: number | null;
}

export interface ListMigrationPairsQuery {
  page?: number;
  limit?: number;
  source?: string;
  destination?: string;
  isActive?: boolean;
  isMaintenance?: boolean;
}

export interface UpdateMigrationPairRequest {
  source?: string;
  destination?: string;
  displayName?: string;
  serviceUrl?: string;
  fallbackServiceUrl?: string;
  apiVersion?: string;
  healthCheckPath?: string;
  webhookSecret?: string;
  environment?: MigrationEnvironment;
  isActive?: boolean;
  isMaintenance?: boolean;
  isFree?: boolean;
  sourceLogoId?: number | null;
  destinationLogoId?: number | null;
}

// ─── Banners (incl. tool / home logos) ─────────────────────────────────────────

export type BannerType = 'Home' | 'SplashScreen' | 'HomeLogo' | 'ToolLogo';
export type BannerPlatform = 'Web' | 'Mobile';
export type BannerStatus = 'Active' | 'InActive';

export interface BannerEntity {
  id: number;
  name: string;
  image: string;
  navigate: string | null;
  type: BannerType;
  platform: BannerPlatform;
  heading: string | null;
  paragraph: string | null;
  status: BannerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerRequest {
  name: string;
  /** Uploaded file name returned by the /upload endpoint. */
  image: string;
  type: BannerType;
  platform: BannerPlatform;
  navigate?: string;
  heading?: string;
  paragraph?: string;
}

export type UpdateBannerRequest = Partial<CreateBannerRequest>;

export interface ListBannersQuery {
  type?: BannerType;
  platform?: BannerPlatform;
  status?: BannerStatus;
  skip?: number;
  take?: number;
}

export interface UploadResponse {
  url: string;
  meta: {
    originalname: string;
    filename: string;
    mimetype: string;
    size: number;
  };
}

export interface RotateSecretResponse {
  webhookSecret: string;
}

// ─── Admin Analytics ─────────────────────────────────────────────────────────

export interface AnalyticsDelta {
  value: number;
  label: string;
  positive: boolean;
}

export interface AnalyticsSummary {
  totalMigrations: number;
  totalDelta: AnalyticsDelta;
  successRate: number;
  successRateDelta: AnalyticsDelta;
  activeNow: number;
  activeNowDelta: AnalyticsDelta;
  avgDurationMinutes: number;
  avgDurationDelta: AnalyticsDelta;
}

export interface AnalyticsPair {
  id: string;
  source: string;
  destination: string;
  displayName: string;
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  successRate: number;
  isActive: boolean;
  isMaintenance: boolean;
  avgDurationMinutes: number;
}

export interface ActivityItem {
  id: string;
  kind: string;
  displayText: string;
  createdAt: string;
  metadata: Record<string, string>;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export type AuditLogLevel = 'Success' | 'Info' | 'Warning' | 'Error';
export type AuditLogType = 'auth' | 'oauth' | 'migration' | 'payment' | 'system' | 'admin' | 'security';

export interface AuditLogItem {
  id: string;
  type: AuditLogType;
  action: string;
  status: string;
  message: string;
  adminId: number | null;
  userId: number | null;
  entityId: string | null;
  entityType: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: string;
  level: AuditLogLevel;
}

export interface GetActivitiesQuery {
  level?: AuditLogLevel;
  from?: string;
  to?: string;
  skip?: number;
  take?: number;
  userId?: number;
  adminId?: number;
  type?: AuditLogType;
}

export interface AnalyticsOutcomes {
  completed: number;
  inProgress: number;
  pending: number;
  failed: number;
  total: number;
  successRate: number;
  byPair: Array<{
    id: string;
    displayName: string;
    source: string;
    destination: string;
    completed: number;
    successRate: number;
  }>;
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export interface ApiPlan {
  id: string;
  name: string;
  basePrice: string;   // Decimal string — parse with parseFloat()
  currency: string;    // "USD"
  history: string;
  years: number | null;     // null when isInception
  isInception: boolean;     // unlimited "inception to date" plan
  support: string;
  features: string[];
  popular: boolean;
}

export interface CreatePlanRequest {
  name: string;
  basePrice: number;
  currency?: string;
  history: string;
  years?: number;        // ignored when isInception is true
  isInception?: boolean;
  support: string;
  features: string[];
  popular?: boolean;
}

export type UpdatePlanRequest = Partial<CreatePlanRequest>;
