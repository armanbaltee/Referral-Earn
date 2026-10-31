import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  LayoutDashboard,
  Users,
  Wallet,
  CheckSquare,
  Package,
  Bell,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@store/auth.store';
import { Button } from '@components/ui/button';

export function MainLayout(): React.ReactElement {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col justify-between hidden md:flex">
        <div>
          <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Layers className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">ChainX</span>
          </div>

          <nav className="p-4 space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/referrals"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Users className="h-4 w-4" />
              Referrals
            </Link>
            <Link
              to="/wallet"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Wallet className="h-4 w-4" />
              Wallet
            </Link>
            <Link
              to="/tasks"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <CheckSquare className="h-4 w-4" />
              Tasks
            </Link>
            <Link
              to="/products"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Package className="h-4 w-4" />
              Products
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between px-2">
            <div>
              <p className="text-xs font-medium text-foreground">{user?.name ?? 'User'}</p>
              <p className="text-[11px] text-muted-foreground">
                {user?.email ?? 'user@example.com'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 md:hidden">
            <Layers className="h-6 w-6 text-primary" />
            <span className="font-bold">ChainX</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button
              aria-label="Notifications"
              className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent transition-colors relative"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
