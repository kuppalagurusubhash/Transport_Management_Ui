import { ComponentType } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  TruckIcon,
  RouteIcon,
  UsersIcon,
  PackageOpenIcon,
  MapPinnedIcon,
  Gem,
  ClipboardListIcon,
  MapIcon,
  XIcon,
  UserIcon,
  LogOut,
  Settings,
  SparklesIcon,
  ExternalLinkIcon
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  badge?: string;
  icon: ComponentType<{
    className?: string;
  }>;
}

const mainNavItems: NavItem[] = [
  {
    to: '/',
    label: 'Overview',
    icon: LayoutDashboardIcon
  },
  {
    to: '/orders',
    label: 'Orders',
    icon: ClipboardListIcon
  },
  {
    to: '/trips',
    label: 'Trips',
    icon: RouteIcon
  },
  {
    to: '/fleet',
    label: 'Fleet',
    icon: TruckIcon
  },
  {
    to: '/drivers',
    label: 'Drivers',
    icon: UsersIcon
  },
  {
    to: '/loading-parties',
    label: 'Loading Parties',
    icon: PackageOpenIcon
  },
  {
    to: '/unloading-parties',
    label: 'Unloading Parties',
    icon: MapPinnedIcon
  },
  {
    to: '/district-rates',
    label: 'District Rates',
    icon: MapIcon
  },
  {
    to: '/rates',
    label: 'Stone Rates',
    icon: Gem
  }
];

const portalNavItems: NavItem[] = [
  {
    to: '/driver',
    label: 'Driver Portal',
    badge: 'Chit Scanner',
    icon: UserIcon
  },
  {
    to: '/loading',
    label: 'Quarry Loading Portal',
    badge: 'Supervisor',
    icon: TruckIcon
  },
  {
    to: '/buyer',
    label: 'Buyer Order Portal',
    badge: 'Kerala Depot',
    icon: PackageOpenIcon
  }
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    localStorage.removeItem('buyerRef');
    localStorage.removeItem('driverRef');
    navigate('/login');
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-700 bg-ink-950 transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and branding */}
        <div className="flex items-center justify-between border-b border-ink-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gold font-extrabold text-ink-950 shadow-md">
              TA
            </span>
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-tight text-white">
                TRANS IA
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Transport &amp; Logistics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable navigation area */}
        <div className="flex-1 overflow-y-auto ti-scroll p-3 space-y-5">
          {/* Main Management Section */}
          <div>
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Management Ledger
            </p>
            <nav className="space-y-0.5" aria-label="Primary">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-gold/10 text-gold font-semibold'
                          : 'text-neutral-400 hover:bg-ink-850 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Operational Portals (Owner Full Access) */}
          <div className="rounded-xl border border-gold/25 bg-gold/5 p-2 space-y-1">
            <div className="flex items-center justify-between px-2 pt-1 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                <SparklesIcon className="h-3 w-3 text-gold" />
                Operational Portals
              </span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-gold/20 text-gold uppercase">
                Owner Access
              </span>
            </div>
            <nav className="space-y-0.5">
              {portalNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-gold text-ink-950 font-bold shadow-sm'
                          : 'text-neutral-300 hover:bg-gold/15 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-semibold opacity-75 shrink-0 ml-1">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* System Settings */}
          <div>
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              System
            </p>
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-gold/10 text-gold font-semibold'
                    : 'text-neutral-400 hover:bg-ink-850 hover:text-white'
                }`
              }
            >
              <Settings className="h-4 w-4 shrink-0" />
              Settings
            </NavLink>
          </div>
        </div>

        {/* Footer profile & logout */}
        <div className="border-t border-ink-700 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 border border-gold/40 text-xs font-bold text-gold">
                👑
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-white">Owner Account</p>
                <p className="text-[11px] text-green-400">All Portals Unlocked</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded p-1.5 text-neutral-400 hover:bg-ink-800 hover:text-red-400 transition-colors"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}