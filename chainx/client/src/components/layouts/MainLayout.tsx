import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Layers,
  LayoutDashboard,
  Users,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckSquare,
  Receipt,
  Package,
  Bell,
  User,
  LifeBuoy,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  ShieldCheck,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@store/auth.store';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Avatar } from '@components/ui/misc';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@components/ui/dropdown-menu';
import { cn } from '@lib/utils';
import { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const userNavItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Products / Orders', href: '/products', icon: Package },
  { label: 'My Referrals', href: '/referrals', icon: Users, badge: 'Tier 1' },
  { label: 'Wallet', href: '/wallet', icon: Wallet },
  { label: 'Deposits', href: '/deposits', icon: ArrowDownCircle },
  { label: 'Withdrawals', href: '/withdrawals', icon: ArrowUpCircle },
  { label: 'Daily Tasks', href: '/tasks', icon: CheckSquare, badge: '5 new' },
  { label: 'Transactions', href: '/transactions', icon: Receipt },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Support', href: '/support', icon: LifeBuoy },
];

export function MainLayout(): React.ReactElement {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  // Breadcrumbs calculation
  const currentPath = location.pathname;
  const activeNavItem = userNavItems.find(
    (item) => item.href === currentPath || (item.href !== '/dashboard' && currentPath.startsWith(item.href))
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-2xl transform transition-transform duration-300 md:hidden flex flex-col justify-between',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-border">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Layers className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight">ChainX</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                  Fintech Core
                </span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {userNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-semibold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-muted-foreground hover:text-destructive text-xs"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Logo & Brand */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                <Layers className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-foreground">
                    ChainX
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase">
                    v1.0
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                  Affiliate & Wallet
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Balance Preview Card */}
          <div className="p-4 border-b border-border/60 bg-muted/30">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>Available Balance</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="text-xl font-bold font-mono tracking-tight text-foreground">
              $1,248.50
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Link
                to="/deposits"
                className="flex-1 text-center py-1 rounded-md text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                Deposit
              </Link>
              <Link
                to="/withdrawals"
                className="flex-1 text-center py-1 rounded-md text-[11px] font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Withdraw
              </Link>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-270px)]">
            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              User Menu
            </p>
            {userNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-semibold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {isAdmin && (
              <div className="pt-3 mt-3 border-t border-border">
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Administration
                </p>
                <Link
                  to="/admin"
                  className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Admin Console</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* User Card & Sign Out in Sidebar */}
        <div className="p-4 border-t border-border space-y-2 bg-card">
          <div className="flex items-center gap-3 px-1">
            <Avatar name={user?.name ?? 'User'} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.name ?? 'Arman Ali'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user?.email ?? 'user@chainx.io'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-xs text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between gap-4 shadow-xs">
          {/* Left: Mobile trigger & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground transition-colors font-medium">
                ChainX
              </Link>
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              <span className="text-foreground font-semibold">
                {activeNavItem?.label ?? 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions, referrals, tasks..."
                className="w-full h-9 pl-9 pr-8 text-xs bg-muted/40 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-70">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right: Notification Dropdown & Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-border bg-muted/30 text-[11px] text-muted-foreground font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>USDT (TRC20) Gateway</span>
            </div>

            {/* Notification Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Notifications"
                  className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors relative border border-border/40"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="p-3 border-b border-border flex items-center justify-between bg-muted/20">
                  <span className="text-xs font-semibold text-foreground">Notifications</span>
                  <Badge variant="secondary" className="text-[10px]">
                    2 unread
                  </Badge>
                </div>
                <div className="divide-y divide-border/60 max-h-72 overflow-y-auto">
                  <div className="p-3 hover:bg-muted/40 transition-colors cursor-pointer text-xs space-y-1">
                    <p className="font-medium text-foreground">Referral Commission Credited</p>
                    <p className="text-muted-foreground text-[11px]">
                      You earned $25.00 from referral level 1 activation.
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">10 mins ago</p>
                  </div>
                  <div className="p-3 hover:bg-muted/40 transition-colors cursor-pointer text-xs space-y-1">
                    <p className="font-medium text-foreground">Daily Task Approved</p>
                    <p className="text-muted-foreground text-[11px]">
                      Task #402 verification passed. $5.00 added to wallet.
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">2 hours ago</p>
                  </div>
                </div>
                <div className="p-2 border-t border-border text-center">
                  <Link
                    to="/notifications"
                    className="text-xs text-primary font-medium hover:underline inline-block py-1"
                  >
                    View all notifications
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors"
                >
                  <Avatar name={user?.name ?? 'User'} size="sm" />
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-semibold leading-none">{user?.name ?? 'Arman Ali'}</p>
                    <p className="text-[11px] leading-none text-muted-foreground">
                      {user?.email ?? 'user@chainx.io'}
                    </p>
                    <Badge variant="outline" className="w-fit text-[10px] mt-1.5">
                      Role: {user?.role ?? 'Member'}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Account Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/wallet')}>
                  <Wallet className="mr-2 h-4 w-4" />
                  <span>Wallet Details</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">Admin Console</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export const UserLayout = MainLayout;
