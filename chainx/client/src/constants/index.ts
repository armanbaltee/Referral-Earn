export const APP_NAME = (import.meta.env.VITE_APP_NAME as string) ?? 'ChainX';
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? '/api/v1';

// ─── Routes ────────────────────────────────────────────────────────────────────
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  WALLET: '/wallet',
  REFERRALS: '/referrals',
  TRANSACTIONS: '/transactions',
  DEPOSITS: '/deposits',
  WITHDRAWALS: '/withdrawals',
  TASKS: '/tasks',
  PRODUCTS: '/products',
  NOTIFICATIONS: '/notifications',
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    PRODUCTS: '/admin/products',
    DEPOSITS: '/admin/deposits',
    WITHDRAWALS: '/admin/withdrawals',
    TASKS: '/admin/tasks',
    ANNOUNCEMENTS: '/admin/announcements',
    AUDIT_LOGS: '/admin/audit-logs',
  },
} as const;

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  AUTH_ME: ['auth', 'me'],
  USERS: ['users'],
  USER: (id: string) => ['users', id],
  PRODUCTS: ['products'],
  PRODUCT: (id: string) => ['products', id],
  WALLET: ['wallet'],
  REFERRALS: ['referrals'],
  TRANSACTIONS: ['transactions'],
  DEPOSITS: ['deposits'],
  WITHDRAWALS: ['withdrawals'],
  COMMISSIONS: ['commissions'],
  TASKS: ['tasks'],
  TASK: (id: string) => ['tasks', id],
  NOTIFICATIONS: ['notifications'],
  NOTIFICATIONS_UNREAD_COUNT: ['notifications', 'unread-count'],
  ANNOUNCEMENTS: ['announcements'],
  AUDIT_LOGS: ['audit-logs'],
} as const;

// ─── Financial ─────────────────────────────────────────────────────────────────
export const MIN_DEPOSIT_PAISA = 50_000; // PKR 500
export const MIN_WITHDRAWAL_PAISA = 100_000; // PKR 1,000
export const MAX_WITHDRAWAL_PAISA = 10_000_000; // PKR 100,000

// ─── Pagination ────────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
