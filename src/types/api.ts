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

// ─── Razorpay ─────────────────────────────────────────────────────────────────

export interface CreateDepositOrderRequest {
  amount: number;
  currency?: string;
  description?: string;
}

export interface RazorpayOrder {
  id: string;
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

// ─── Plans ────────────────────────────────────────────────────────────────────

export interface ApiPlan {
  id: number;
  name: string;
  price: number;
  currency: string;
  years: number;
  maxRecords: number;
  retryLimit: number;
  queuePriority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanRequest {
  name: string;
  price: number;
  currency?: string;
  years: number;
  maxRecords: number;
  retryLimit?: number;
  queuePriority?: number;
}

export type UpdatePlanRequest = Partial<CreatePlanRequest>;
