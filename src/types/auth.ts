// ─── Auth Form Types ──────────────────────────────────────────────────────────

export interface SignInFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  country: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

export interface AuthError {
  field?: string;
  message: string;
}

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordRequirement {
  label: string;
  met: boolean;
}
