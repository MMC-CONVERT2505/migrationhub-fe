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
export type UserStatus = 'active' | 'banned' | 'suspended';

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
  migrationPairId: string;
  planId: string;
}

export interface MigrationRecord {
  id: number | string;
  status: string;
  source: string;
  destination: string;
  planName: string;
  createdAt: string;
}

export type MigrationStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

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
}

// ─── Payments (backend-driven flow) ───────────────────────────────────────────

export interface InitiatePaymentRequest {
  /** Amount in smallest currency unit (paise for INR, cents for AUD). */
  amount: number;
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

export type MigrationEnvironment = 'PRODUCTION' | 'STAGING' | 'DEV';

export interface MigrationPairEntity {
  id: number;
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
  serviceUrl?: string;
  webhookSecret?: string;
  isActive?: boolean;
  isMaintenance?: boolean;
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
  basePrice: string | number;
  currency: string;
  history: string;
  support: string;
  features: string[];
  popular: boolean;
}

export interface CreatePlanRequest {
  name: string;
  basePrice: number;
  currency?: string;
  history: string;
  support: string;
  features: string[];
  popular?: boolean;
}

export type UpdatePlanRequest = Partial<CreatePlanRequest>;
