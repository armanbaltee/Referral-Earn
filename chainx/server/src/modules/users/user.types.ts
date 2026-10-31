export enum AccountStatus {
  PENDING_PAYMENT = 'pending_payment',
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export enum RegistrationPaymentStatus {
  UNPAID = 'unpaid',
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

export interface UserRegistrationDTO {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  referralCode?: string;
  termsAccepted: boolean;
}

export interface UserLoginDTO {
  email: string;
  password: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  password: string;
  confirmPassword?: string;
}

export interface VerifyEmailDTO {
  token: string;
}

export interface VerifyPhoneDTO {
  phone: string;
  code: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface AdminUserQueryDTO {
  page?: number;
  limit?: number;
  search?: string;
  status?: AccountStatus;
  paymentStatus?: RegistrationPaymentStatus;
  role?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface AdminSuspendUserDTO {
  reason: string;
}

export interface AdminConfirmPaymentDTO {
  transactionId?: string;
  notes?: string;
}
