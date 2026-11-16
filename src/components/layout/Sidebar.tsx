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
  SlidersHorizontalIcon,
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

interface NavSection {
  title: string;
  shortTitle: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'MAIN',
    shortTitle: 'MAIN',
    items: [
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
      }
    ]
  },
  {
    title: 'OPERATIONS',
    shortTitle: 'OPS',
    items: [
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
      }
    ]
  },
  {
    title: 'FINANCE',
    shortTitle: 'FIN',
    items: [
      {
        to: '/payments',
        label: 'Payments',
        icon: CreditCardIcon
      },
      {
        to: '/expenses',
        label: 'Expenses',
        icon: WalletCardsIcon
      },
      {
        to: '/reports',
        label: 'Reports',
        icon: FileTextIcon
      },
      {
        to: '/settings?tab=pricing',
        label: 'Settings & Rates',
        icon: SlidersHorizontalIcon
      }
    ]
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

      {/* Desktop Layout Rail Spacer (Ensures dashboard content never shifts when sidebar expands on hover) */}
      <div className="hidden lg:block shrink-0 w-[90px] h-full pointer-events-none" />

      {/* Floating Capsule Sidebar Rail */}
      <aside
        className={`group/sidebar fixed z-[60] flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          /* Mobile full-height slide-out drawer */
          inset-y-0 left-0 w-64 ${open ? 'translate-x-0' : '-translate-x-full'}
          /* Desktop floating glass capsule dock */
          lg:translate-x-0 lg:inset-y-auto lg:top-3 lg:bottom-3 lg:left-3 lg:w-[72px] lg:hover:w-64
          rounded-none lg:rounded-[26px]
          border-r lg:border border-white/[0.08]
          bg-[#070B11]/85 backdrop-blur-2xl backdrop-saturate-150
          shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.1)]
          hover:shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_0_1px_rgba(245,184,46,0.2)]
          overflow-hidden text-neutral-100 pt-safe pb-safe
        `}
        style={{
          backgroundImage: `
            radial-gradient(ellipse 120% 50% at 50% 0%, rgba(245, 184, 46, 0.08) 0%, transparent 65%),
            linear-gradient(180deg, #090E14 0%, #06090D 60%, #040608 100%)
          `
        }}
      >
        {/* Brand Header */}
        <div className="relative flex h-16 shrink-0 items-center justify-between border-b border-white/[0.04] px-3.5">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo Emblem inside frosted squircle */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08] shadow-inner transition-transform duration-300 group-hover/sidebar:scale-105">
              <div className="pointer-events-none absolute inset-1 rounded-full bg-emerald-400/20 blur-md transition-all duration-300 group-hover/sidebar:bg-emerald-400/35 group-hover/sidebar:blur-lg" />
              <img
                src="/sidebar-logo.png?v=floating"
                alt="SGSP Logo"
                className="relative h-8 w-8 object-contain filter drop-shadow-[0_2px_8px_rgba(74,222,128,0.45)] select-none"
              />
            </div>

            {/* Brand Title (Always visible on mobile, smooth expand on desktop hover) */}
            <div className="leading-tight whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100 max-w-full lg:opacity-0 lg:max-w-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-w-[160px]">
              <p className="text-sm font-black tracking-[0.2em] bg-gradient-to-r from-white via-neutral-100 to-[#F5B82E] bg-clip-text text-transparent">
                SGSP
              </p>
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#F5B82E]/85 mt-0.5">
                TRANSPORT &amp; LOGISTICS
              </p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-white/10 hover:text-white lg:hidden cursor-pointer shrink-0"
            aria-label="Close menu"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Categories and Items List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {/* Category Header Label */}
              <div className="px-1 py-1 flex items-center justify-center lg:group-hover/sidebar:justify-start">
                <span className="text-[9px] font-black tracking-widest text-neutral-500 uppercase select-none transition-all duration-200">
                  <span className="hidden lg:inline lg:group-hover/sidebar:hidden">
                    {section.shortTitle}
                  </span>
                  <span className="inline lg:hidden lg:group-hover/sidebar:inline tracking-[0.16em] text-[9.5px] text-neutral-400">
                    {section.title}
                  </span>
                </span>
              </div>

              {/* Items in Category */}
              <nav className="space-y-1" aria-label={section.title}>
                {section.items.map((item) => {
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
                      aria-label={item.label}
                      className={({ isActive }) =>
                        `group/item relative flex h-10 w-full items-center rounded-xl text-xs font-medium transition-all duration-200 select-none ${
                          isActive
                            ? 'bg-gradient-to-r from-[#F5B82E]/20 via-[#F5B82E]/10 to-white/[0.02] text-white border border-[#F5B82E]/35 shadow-[0_4px_16px_rgba(245,184,46,0.15)] ring-1 ring-[#F5B82E]/25'
                            : 'text-neutral-400 hover:bg-white/[0.06] hover:text-white hover:border-white/10 border border-transparent'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Active Left Indicator Bar (Pill on outer left edge) */}
                          {isActive && (
                            <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-[#F5B82E] shadow-[0_0_12px_#F5B82E]" />
                          )}

                          {/* Icon Container */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                            <div className="relative flex items-center justify-center">
                              <Icon
                                className={`h-[18px] w-[18px] transition-colors duration-200 ${
                                  isActive
                                    ? 'text-[#F5B82E] drop-shadow-[0_0_8px_rgba(245,184,46,0.6)]'
                                    : 'text-neutral-400 group-hover/item:text-neutral-100'
                                }`}
                              />
                              {/* Collapsed Mini Badge Dot */}
                              {badgeNum > 0 && (
                                <span className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-[#F5B82E] ring-2 ring-[#070B11] lg:group-hover/sidebar:hidden" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Label & Pill Badge */}
                          <div className="flex flex-1 items-center justify-between min-w-0 pr-2.5 overflow-hidden whitespace-nowrap transition-all duration-200 opacity-100 max-w-full lg:opacity-0 lg:max-w-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-w-[170px]">
                            <span
                              className={`truncate text-xs ${
                                isActive ? 'font-bold text-white' : 'font-medium text-neutral-300'
                              }`}
                            >
                              {item.label}
                            </span>

                            {badgeNum > 0 && (
                              <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-[#F5B82E]/20 text-[#F5B82E] border border-[#F5B82E]/40 shrink-0">
                                {badgeNum}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Account Footer Profile */}
        <div className="shrink-0 border-t border-white/[0.04] p-2 bg-[#040608]/70 backdrop-blur-md pb-safe">
          <div className="flex items-center justify-center lg:group-hover/sidebar:justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F5B82E]/20 to-[#C98A14]/30 border border-[#F5B82E]/40 text-[#F5B82E] text-sm font-bold shadow-inner"
                title="Owner Account (Admin)"
              >
                👑
              </div>
              <div className="min-w-0 leading-tight whitespace-nowrap overflow-hidden transition-all duration-200 opacity-100 max-w-full lg:opacity-0 lg:max-w-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-w-[120px]">
                <p className="truncate text-xs font-bold text-white">Owner</p>
                <p className="text-[10px] text-neutral-400 font-medium">Admin</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex lg:hidden lg:group-hover/sidebar:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-neutral-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
              title="Logout"
            >
              <LogOutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
