import type { Request } from 'express';
import type { JwtPayload } from 'jsonwebtoken';

// ─── User Roles ────────────────────────────────────────────────────────────────
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

// ─── JWT Payload ───────────────────────────────────────────────────────────────
export interface AccessTokenPayload extends JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  userId: string;
  tokenFamily: string;
}

// ─── Authenticated Request ─────────────────────────────────────────────────────
export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}

// ─── API Response ──────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Validation ────────────────────────────────────────────────────────────────
export interface ValidationError {
  field: string;
  message: string;
}

// ─── Pagination Query ──────────────────────────────────────────────────────────
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

// ─── Financial ─────────────────────────────────────────────────────────────────
/** Financial amounts are stored as integer paisa (PKR minor units). 1 PKR = 100 paisa */
export type PaisaAmount = number;

export function formatPKR(paisa: PaisaAmount): string {
  return `PKR ${(paisa / 100).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
