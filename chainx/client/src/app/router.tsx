import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import { AuthLayout } from '@components/layouts/AuthLayout';
import { MainLayout } from '@components/layouts/MainLayout';
import { useAuthStore } from '@store/auth.store';
import { UserRole } from '@/types';

// ─── Lazy-loaded pages ─────────────────────────────────────────────────────────
const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@features/auth/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@features/dashboard/pages/DashboardPage'));

// ─── Guards ────────────────────────────────────────────────────────────────────
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
    element: (
      <GuestRoute>
        <AuthLayout />
      </GuestRoute>
    ),
    children: [
      {
        path: '/login',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: '/register',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RegisterPage />
          </Suspense>
        ),
      },
    ],
  },
  // Authenticated App routes
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
        path: '/admin',
        element: (
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Admin Console</h1>
                <p className="text-muted-foreground mt-2">
                  System administration and moderation dashboard.
                </p>
              </div>
            </Suspense>
          </AdminRoute>
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
