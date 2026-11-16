import { ComponentType } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  TruckIcon,
  RouteIcon,
  UsersIcon,
  Building2Icon,
  PackageOpenIcon,
  MapPinnedIcon,
  CreditCardIcon,
  WalletCardsIcon,
  FileTextIcon,
  XIcon,
  LogOutIcon,
  ShoppingBagIcon
} from 'lucide-react';


import { useOrders } from '../../store/OrdersContext';

interface NavItem {
  to: string;
  label: string;
  badgeKey?: 'loading' | 'orders';
  icon: ComponentType<{
    className?: string;
  }>;
}

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Overview',
    icon: LayoutDashboardIcon
  },
  {
    to: '/orders',
    label: 'Orders',
    badgeKey: 'orders',
    icon: ShoppingBagIcon
  },
  {
    to: '/loading',
    label: 'Loading',
    badgeKey: 'loading',
    icon: PackageOpenIcon
  },
  {
    to: '/trips',
    label: 'Trips',
    icon: RouteIcon
  },
  {
    to: '/fleet',
    label: 'Lorries',
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
    icon: Building2Icon
  },
  {
    to: '/unloading-parties',
    label: 'Unloading Parties',
    icon: MapPinnedIcon
  },
  {
    to: '/payments',
    label: 'Payments',
    icon: CreditCardIcon
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: FileTextIcon
  },
  {
    to: '/settings?tab=pricing',
    label: 'Settings & Rates',
    icon: WalletCardsIcon
  }
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { trips, orders } = useOrders();

  const loadingCount = trips.filter((t) => t.status === 'loading').length;
  const newOrdersCount = orders.filter((o) => o.status === 'placed').length;

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex w-72 sm:w-64 flex-col bg-[#06090D] border-r border-white/[0.06] text-neutral-100 transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 shadow-[4px_0_30px_rgba(0,0,0,0.6)] pt-safe pb-safe ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundImage: `
            radial-gradient(ellipse 100% 40% at 50% 90%, rgba(245, 184, 46, 0.08) 0%, transparent 70%),
            linear-gradient(180deg, #090E14 0%, #06090D 50%, #040608 100%)
          `
        }}
      >
      {/* Brand Header */}
      <div className="relative flex items-center justify-between px-5 py-4">
        {/* Smooth Glassmorphic Ambient Underline */}
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
        <div className="absolute inset-x-6 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#F5B82E]/35 to-transparent blur-[0.5px] pointer-events-none" />

        <div className="flex items-center gap-3">
          <img
            src="/app-logo.jpg"
            alt="Trans IA Logo"
            className="h-11 w-11 rounded-xl object-cover border border-[#F5B82E]/50 shadow-[0_4px_15px_rgba(245,184,46,0.3)] shrink-0"
          />
          <div className="leading-tight">
            <p className="text-sm font-black tracking-wide text-white">
              SRI SAI BABA
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5B82E]/85">
              TRANSPORT &amp; STONE LOGISTICS
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-neutral-400 hover:bg-white/10 hover:text-white lg:hidden cursor-pointer"
          aria-label="Close menu"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Items List */}
      <div className="ti-scroll flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
        <nav className="space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const badgeNum =
              item.badgeKey === 'loading'
                ? loadingCount
                : item.badgeKey === 'orders'
                  ? newOrdersCount
                  : 0;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-[#F5B82E]/25 via-[#F5B82E]/12 to-transparent text-white border border-[#F5B82E]/40 shadow-[0_0_18px_rgba(245,184,46,0.18)] ring-1 ring-[#F5B82E]/25'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-100 hover:border-white/10'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${isActive
                          ? 'text-[#F5B82E]'
                          : 'text-neutral-400 group-hover:text-[#F5B82E]'
                          }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                      </div>
                      <span className="tracking-wide">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {badgeNum > 0 && (
                        <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-extrabold rounded-full ${item.badgeKey === 'loading'
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          : 'bg-gold/20 text-gold border border-gold/40'
                          }`}>
                          {badgeNum}
                        </span>
                      )}
                      {isActive && (
                        <div className="h-1.5 w-1.5 rounded-full bg-[#F5B82E] shadow-[0_0_8px_#F5B82E]" />
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Mountain Scenic Quote Backdrop */}
      <div className="relative px-4 py-3.5 text-center border-t border-white/5 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#F5B82E]/10 via-transparent to-transparent" />
        <p className="relative font-serif italic text-xs text-[#FCE8A6]/60 leading-relaxed tracking-wide">
          &ldquo;Reliable Transport <br />
          for a Stronger Tomorrow&rdquo;
        </p>
      </div>

      {/* User Account Footer Profile */}
      <div className="border-t border-white/10 p-3.5 bg-[#040608]/80 backdrop-blur-md pb-safe">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F5B82E]/20 to-[#C98A14]/30 border border-[#F5B82E]/40 text-[#F5B82E] text-sm font-bold shadow-inner">
              👑
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-bold text-white">
                Owner Account
              </p>
              <p className="text-[10px] text-neutral-400 font-medium">
                Admin
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-neutral-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOutIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside >
    </>
  );
}
