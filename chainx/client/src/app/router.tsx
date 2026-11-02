import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import { AuthLayout } from '@components/layouts/AuthLayout';
import { MainLayout } from '@components/layouts/MainLayout';
import { AdminLayout } from '@components/layouts/AdminLayout';
import { FeaturePlaceholder } from '@components/common/FeaturePlaceholder';
import { useAuthStore } from '@store/auth.store';
import { UserRole } from '@/types';

// ─── Lazy-loaded pages ─────────────────────────────────────────────────────────
const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@features/auth/pages/RegisterPage'));
const RegistrationPaymentPage = lazy(() => import('@features/auth/pages/RegistrationPaymentPage'));
const ForgotPasswordPage = lazy(() => import('@features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@features/auth/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@features/auth/pages/VerifyEmailPage'));
const DashboardPage = lazy(() => import('@features/dashboard/pages/DashboardPage'));
const AdminDashboardPage = lazy(() => import('@features/dashboard/pages/AdminDashboardPage'));
const ProductCatalogPage = lazy(() => import('@features/products/pages/ProductCatalogPage'));
const ProductDetailPage = lazy(() => import('@features/products/pages/ProductDetailPage'));
const OrderHistoryPage = lazy(() => import('@features/products/pages/OrderHistoryPage'));
const AdminProductsPage = lazy(() => import('@features/products/pages/AdminProductsPage'));
const AdminOrdersPage = lazy(() => import('@features/products/pages/AdminOrdersPage'));
const AdminRegistrationPaymentsPage = lazy(
  () => import('@features/registrationPayment/pages/AdminRegistrationPaymentsPage')
);
const ReferralsPage = lazy(() => import('@features/referrals/pages/ReferralsPage'));
const AdminReferralsPage = lazy(() => import('@features/referrals/pages/AdminReferralsPage'));

// ─── Phase 6: Wallet, Deposits, Withdrawals, Transactions ────────────────────
const WalletPage = lazy(() => import('@features/wallet/pages/WalletPage'));
const DepositsPage = lazy(() => import('@features/wallet/pages/DepositsPage'));
const WithdrawalsPage = lazy(() => import('@features/wallet/pages/WithdrawalsPage'));
const TransactionsPage = lazy(() => import('@features/wallet/pages/TransactionsPage'));
const AdminWalletsPage = lazy(() => import('@features/wallet/pages/AdminWalletsPage'));
const AdminDepositsPage = lazy(() => import('@features/wallet/pages/AdminDepositsPage'));
const AdminWithdrawalsPage = lazy(() => import('@features/wallet/pages/AdminWithdrawalsPage'));
const AdminLedgerPage = lazy(() => import('@features/wallet/pages/AdminLedgerPage'));

// ─── Phase 7: Daily Tasks & Reward System ────────────────────────────────────
const TaskMarketplacePage = lazy(() => import('@features/tasks/pages/TaskMarketplacePage'));
const TaskDetailPage = lazy(() => import('@features/tasks/pages/TaskDetailPage'));
const MySubmissionsPage = lazy(() => import('@features/tasks/pages/MySubmissionsPage'));
const AdminTasksPage = lazy(() => import('@features/tasks/pages/AdminTasksPage'));
const AdminTaskSubmissionsPage = lazy(() => import('@features/tasks/pages/AdminTaskSubmissionsPage'));

// ─── Route Guards ──────────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }): React.ReactElement {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }): React.ReactElement {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

// ─── Page Loading Fallback ─────────────────────────────────────────────────────
function PageLoader(): React.ReactElement {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

// ─── Router Configuration ──────────────────────────────────────────────────────
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  // Guest / Auth routes
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: (
          <GuestRoute>
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          </GuestRoute>
        ),
      },
      {
        path: '/register',
        element: (
          <GuestRoute>
            <Suspense fallback={<PageLoader />}>
              <RegisterPage />
            </Suspense>
          </GuestRoute>
        ),
      },
      {
        path: '/register-payment',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RegistrationPaymentPage />
          </Suspense>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ForgotPasswordPage />
          </Suspense>
        ),
      },
      {
        path: '/reset-password',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ResetPasswordPage />
          </Suspense>
        ),
      },
      {
        path: '/verify-email',
        element: (
          <Suspense fallback={<PageLoader />}>
            <VerifyEmailPage />
          </Suspense>
        ),
      },
    ],
  },
  // Authenticated User Routes (User Layout)
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: '/products',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProductCatalogPage />
          </Suspense>
        ),
      },
      {
        path: '/products/:slug',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProductDetailPage />
          </Suspense>
        ),
      },
      {
        path: '/orders',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OrderHistoryPage />
          </Suspense>
        ),
      },
      {
        path: '/referrals',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ReferralsPage />
          </Suspense>
        ),
      },
      {
        path: '/wallet',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WalletPage />
          </Suspense>
        ),
      },
      {
        path: '/deposits',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DepositsPage />
          </Suspense>
        ),
      },
      {
        path: '/withdrawals',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WithdrawalsPage />
          </Suspense>
        ),
      },
      {
        path: '/tasks',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TaskMarketplacePage />
          </Suspense>
        ),
      },
      {
        path: '/tasks/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TaskDetailPage />
          </Suspense>
        ),
      },
      {
        path: '/tasks/submissions',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MySubmissionsPage />
          </Suspense>
        ),
      },
      {
        path: '/transactions',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TransactionsPage />
          </Suspense>
        ),
      },
      {
        path: '/notifications',
        element: (
          <FeaturePlaceholder
            title="Notification Center"
            description="Real-time alerts for commissions, approvals, task verification, and platform news."
          />
        ),
      },
      {
        path: '/profile',
        element: (
          <FeaturePlaceholder
            title="User Profile & Security"
            description="Manage personal credentials, two-factor authentication, and payout addresses."
          />
        ),
      },
      {
        path: '/support',
        element: (
          <FeaturePlaceholder
            title="Help & Support Desk"
            description="Submit support tickets, live chat assistance, and platform knowledge base."
          />
        ),
      },
    ],
  },
  // Authenticated Admin Routes (Admin Layout)
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'users',
        element: (
          <FeaturePlaceholder
            title="User Management"
            description="Search, view, verify, ban, and manage user accounts and KYC statuses."
            backHref="/admin"
          />
        ),
      },
      {
        path: 'products',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminProductsPage />
          </Suspense>
        ),
      },
      {
        path: 'orders',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminOrdersPage />
          </Suspense>
        ),
      },
      {
        path: 'registration-payments',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminRegistrationPaymentsPage />
          </Suspense>
        ),
      },
      {
        path: 'referrals',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminReferralsPage />
          </Suspense>
        ),
      },
      {
        path: 'commissions',
        element: (
          <FeaturePlaceholder
            title="Commission Engine"
            description="Configure tier percentages, rule sets, payout splits, and bonus pools."
            backHref="/admin"
          />
        ),
      },
      {
        path: 'wallets',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminWalletsPage />
          </Suspense>
        ),
      },
      {
        path: 'deposits',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminDepositsPage />
          </Suspense>
        ),
      },
      {
        path: 'withdrawals',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminWithdrawalsPage />
          </Suspense>
        ),
      },
      {
        path: 'refunds',
        element: (
          <FeaturePlaceholder
            title="100% Refund Claims"
            description="Verify 10-referral milestone claims and execute automated full deposit refunds."
            backHref="/admin"
          />
        ),
      },
      {
        path: 'tasks',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminTasksPage />
          </Suspense>
        ),
      },
      {
        path: 'task-submissions',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminTaskSubmissionsPage />
          </Suspense>
        ),
      },
      {
        path: 'transactions',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminLedgerPage />
          </Suspense>
        ),
      },
      {
        path: 'transactions',
        element: (
          <FeaturePlaceholder
            title="Global Transactions"
            description="Global financial journal, double-entry audit statements, and export tools."
            backHref="/admin"
          />
        ),
      },
      {
        path: 'announcements',
        element: (
          <FeaturePlaceholder
            title="Announcements & Banners"
            description="Broadcast platform news, maintenance notices, and promotion popups."
            backHref="/admin"
          />
        ),
      },
      {
        path: 'reports',
        element: (
          <FeaturePlaceholder
            title="Financial & Performance Reports"
            description="Generate profit/loss summaries, user retention metrics, and liability forecasts."
            backHref="/admin"
          />
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <FeaturePlaceholder
            title="System Audit Logs"
            description="Immutable record of administrative actions, logins, and permission changes."
            backHref="/admin"
          />
        ),
      },
      {
        path: 'settings',
        element: (
          <FeaturePlaceholder
            title="Platform Settings"
            description="Configure site metadata, email gateways, blockchain nodes, and rate limits."
            backHref="/admin"
          />
        ),
      },
    ],
  },
  // 404 Route
  {
    path: '*',
    element: (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <h1 className="text-6xl font-black text-primary">404</h1>
        <p className="text-xl font-semibold">Page Not Found</p>
        <p className="text-muted-foreground">The requested page does not exist.</p>
        <a
          href="/dashboard"
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90"
        >
          Return to Dashboard
        </a>
      </div>
    ),
  },
]);

export function AppRouter(): React.ReactElement {
  return <RouterProvider router={router} />;
}
