import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  GitFork,
  Percent,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  CheckSquare,
  FileCheck2,
  Receipt,
  Megaphone,
  BarChart3,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ChevronRight,
  ExternalLink,
  ChevronDown,
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

interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface AdminNavGroup {
  group: string;
  items: AdminNavItem[];
}

const adminNavGroups: AdminNavGroup[] = [
  {
    group: 'Platform Overview',
    items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    group: 'Commerce & Affiliate',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users, badge: '1.2k' },
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      { label: 'Referrals', href: '/admin/referrals', icon: GitFork },
      { label: 'Commissions', href: '/admin/commissions', icon: Percent },
    ],
  },
  {
    group: 'Financial Management',
    items: [
      { label: 'Wallet Management', href: '/admin/wallets', icon: Wallet },
      { label: 'Deposits', href: '/admin/deposits', icon: ArrowDownCircle, badge: '3 pending' },
      { label: 'Withdrawals', href: '/admin/withdrawals', icon: ArrowUpCircle, badge: '5 pending' },
      { label: 'Refunds', href: '/admin/refunds', icon: RotateCcw },
      { label: 'Transactions', href: '/admin/transactions', icon: Receipt },
    ],
  },
  {
    group: 'Tasks & Operations',
    items: [
      { label: 'Tasks', href: '/admin/tasks', icon: CheckSquare },
      { label: 'Task Submissions', href: '/admin/task-submissions', icon: FileCheck2, badge: '12 new' },
      { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    ],
  },
  {
    group: 'System & Intelligence',
    items: [
      { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export function AdminLayout(): React.ReactElement {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 dark:bg-background">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 shadow-2xl transform transition-transform duration-300 md:hidden flex flex-col justify-between text-slate-200',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white">ChainX Admin</span>
                <span className="text-[10px] text-blue-400 uppercase tracking-widest font-semibold">
                  Control Plane
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            {adminNavGroups.map((group) => (
              <div key={group.group} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {group.group}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-sm'
                            : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                        )
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-blue-400 font-semibold border border-blue-500/20">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>Back to User App</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Desktop Admin Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/95 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Logo Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
            <Link to="/admin" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30 transition-transform group-hover:scale-105">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm tracking-tight text-white">ChainX</span>
                  <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] px-1.5 py-0 uppercase">
                    Admin
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Management Console
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Groups */}
          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin">
            {adminNavGroups.map((group) => (
              <div key={group.group} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {group.group}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-sm'
                            : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                        )
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-blue-400 font-semibold border border-blue-500/20">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-900/60">
          <Link
            to="/dashboard"
            className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
              User Dashboard
            </span>
            <ChevronRight className="h-3 w-3" />
          </Link>
          <div className="flex items-center justify-between px-3 pt-1">
            <span className="text-[11px] text-slate-400 font-medium">ChainX Core v1.0.0</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Healthy
            </span>
          </div>
        </div>
      </aside>

      {/* Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Admin Top Navigation */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 md:hidden text-slate-400 hover:text-white"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open admin navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Admin Console</span>
              <ChevronRight className="h-3 w-3 opacity-60" />
              <span className="text-blue-400 font-medium capitalize">
                {currentPath.replace('/admin', '').replace('/', '') || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Admin Global Search */}
          <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Search user email, tx hash, referral code..."
                className="w-full h-9 pl-9 pr-4 text-xs bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Admin Action Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full border border-slate-800 bg-slate-900 text-[11px] text-slate-300 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>MongoDB Connected</span>
            </div>

            {/* Admin Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Admin Notifications"
                  className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors relative border border-slate-800"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-800 text-slate-200">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">System Alerts</span>
                  <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]">
                    2 Action Items
                  </Badge>
                </div>
                <div className="divide-y divide-slate-800/80 text-xs">
                  <div className="p-3 hover:bg-slate-800/60 cursor-pointer">
                    <p className="font-medium text-white">Pending Withdrawal #W-9021</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">$450.00 requested via TRC20 USDT.</p>
                  </div>
                  <div className="p-3 hover:bg-slate-800/60 cursor-pointer">
                    <p className="font-medium text-white">Refund Request #RF-104</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">User reached 10 verified referrals.</p>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Avatar name={user?.name ?? 'Super Admin'} size="sm" />
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-semibold text-white">{user?.name ?? 'Admin User'}</p>
                    <p className="text-[11px] text-slate-400">{user?.email ?? 'admin@chainx.io'}</p>
                    <Badge className="w-fit bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] mt-1.5">
                      SUPER_ADMIN
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem
                  onClick={() => navigate('/dashboard')}
                  className="focus:bg-slate-800 focus:text-white"
                >
                  <ExternalLink className="mr-2 h-4 w-4 text-blue-400" />
                  <span>Switch to User View</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/admin/settings')}
                  className="focus:bg-slate-800 focus:text-white"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Platform Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-rose-400 focus:text-rose-300 focus:bg-rose-950/40"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Admin Main Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
