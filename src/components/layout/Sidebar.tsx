import { ComponentType, useState } from 'react';
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
import { OwnerProfileModal } from '../ui/OwnerProfileModal';

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
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);

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

      {/* Floating Capsule Sidebar Rail — Deep Jet-Black Obsidian Glass */}
      <aside
        className={`group/sidebar fixed z-[60] flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          /* Mobile full-height slide-out drawer */
          inset-y-0 left-0 w-64 ${open ? 'translate-x-0' : '-translate-x-full'}
          /* Desktop floating glass capsule dock */
          lg:translate-x-0 lg:inset-y-auto lg:top-3 lg:bottom-3 lg:left-3 lg:w-[72px] lg:hover:w-64
          rounded-none lg:rounded-[26px]
          border-r lg:border border-white/[0.07]
          bg-[#06080C]/90 backdrop-blur-2xl backdrop-saturate-150
          shadow-[0_12px_40px_rgba(0,0,0,0.75),inset_0_1px_0_0_rgba(255,255,255,0.12)]
          hover:shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.1)]
          overflow-hidden text-neutral-100 pt-safe pb-safe
        `}
        style={{
          backgroundImage: `
            linear-gradient(180deg, rgba(14, 18, 25, 0.85) 0%, rgba(6, 8, 12, 0.95) 50%, rgba(3, 4, 6, 0.98) 100%)
          `
        }}
      >
        {/* Brand Header */}
        <div className="relative flex h-16 shrink-0 items-center justify-center lg:group-hover/sidebar:justify-between border-b border-white/[0.04] px-3.5">
          <NavLink
            to="/"
            className="flex items-center gap-3 min-w-0 group/brand"
            title="SGSP Transport & Logistics"
          >
            {/* Logo Emblem inside frosted squircle — Centered in collapsed mode */}
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.12] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-300 group-hover/sidebar:scale-105 group-hover/brand:border-[#F5B82E]/40">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[#F5B82E]/10 blur-md transition-all duration-300 group-hover/sidebar:bg-[#F5B82E]/25" />
              <img
                src="/sidebar-logo.png"
                alt="SGSP Logo"
                className="relative h-9 w-9 object-contain filter drop-shadow-[0_2px_10px_rgba(245,184,46,0.5)] select-none transition-transform duration-300 group-hover/brand:scale-105"
              />
            </div>

            {/* Brand Title (Visible on mobile, reveals on desktop hover) */}
            <div className="leading-tight whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100 max-w-full lg:opacity-0 lg:max-w-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-w-[160px]">
              <p className="text-sm font-black tracking-[0.2em]">
                <span className="text-white">SG</span>
                <span className="text-[#F5B82E]">SP</span>
              </p>
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-neutral-400 mt-0.5">
                TRANSPORT &amp; LOGISTICS
              </p>
            </div>
          </NavLink>

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
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-3.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {/* Category Header Label — Centered in collapsed rail */}
              <div className="px-1 py-1 flex items-center justify-center lg:group-hover/sidebar:justify-start">
                <span className="text-[9px] font-black tracking-widest text-neutral-500 uppercase select-none transition-all duration-200">
                  <span className="hidden lg:inline lg:group-hover/sidebar:hidden">
                    {section.shortTitle}
                  </span>
                  <span className="inline lg:hidden lg:group-hover/sidebar:inline tracking-[0.16em] text-[9.5px] text-neutral-400 px-1.5">
                    {section.title}
                  </span>
                </span>
              </div>

              {/* Items in Category — Centered icons in collapsed rail */}
              <nav className="space-y-1.5 flex flex-col items-center w-full" aria-label={section.title}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const badgeNum =
                    item.badgeKey === 'loading'
                      ? loadingCount
                      : item.badgeKey === 'orders'
                        ? newOrdersCount
                        : 0;

                  return (
                    <div
                      key={item.to}
                      className="relative w-full flex items-center justify-center lg:group-hover/sidebar:justify-start"
                    >
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        onClick={onClose}
                        aria-label={item.label}
                        className={({ isActive }) =>
                          `group/item relative flex h-10 items-center transition-all duration-200 select-none
                          /* Mobile: full width */
                          w-full justify-start px-2.5 rounded-xl
                          /* Desktop Collapsed: exact 40px square squircle, icon dead center, zero excess space on right! */
                          lg:w-10 lg:justify-center lg:p-0 lg:rounded-xl
                          /* Desktop Hover: expands smoothly to full width */
                          lg:group-hover/sidebar:w-full lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:px-2.5
                          ${isActive
                            ? 'bg-white/[0.12] text-white border border-white/[0.18] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_4px_16px_rgba(0,0,0,0.5)] backdrop-blur-xl'
                            : 'text-neutral-400 hover:bg-white/[0.06] hover:text-white hover:border-white/10 border border-transparent'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {/* Active Left Indicator Bar (Sits on outer edge of rail, does not push or crowd icon!) */}
                            {isActive && (
                              <span className="absolute -left-3.5 lg:group-hover/sidebar:-left-2 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.85)] transition-all duration-200" />
                            )}

                            {/* Centered Icon Container (40px square, icon dead in the center) */}
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                              <div className="relative flex items-center justify-center">
                                <Icon
                                  className={`h-[18px] w-[18px] transition-colors duration-200 ${isActive
                                      ? 'text-white drop-shadow-[0_2px_6px_rgba(255,255,255,0.4)]'
                                      : 'text-neutral-400 group-hover/item:text-neutral-100'
                                    }`}
                                />
                                {/* Collapsed Mini Badge Dot */}
                                {badgeNum > 0 && (
                                  <span className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#06080C] lg:group-hover/sidebar:hidden shadow-[0_0_6px_#34D399]" />
                                )}
                              </div>
                            </div>

                            {/* Expanded Label & Pill Badge (Only revealed on hover) */}
                            <div className="flex flex-1 items-center justify-between min-w-0 pr-1 overflow-hidden whitespace-nowrap transition-all duration-200 opacity-100 max-w-full lg:opacity-0 lg:max-w-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-w-[170px]">
                              <span
                                className={`truncate text-xs ${isActive ? 'font-bold text-white' : 'font-medium text-neutral-300'
                                  }`}
                              >
                                {item.label}
                              </span>

                              {badgeNum > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-white/15 text-white border border-white/20 shrink-0">
                                  {badgeNum}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </NavLink>
                    </div>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Account Footer Profile (Clickable to show Owner Info Modal from API) */}
        <div className="shrink-0 border-t border-white/[0.04] p-2 bg-[#040608]/80 backdrop-blur-md pb-safe">
          <div className="flex items-center justify-center lg:group-hover/sidebar:justify-between gap-2">
            <button
              type="button"
              onClick={() => setOwnerModalOpen(true)}
              className="flex items-center gap-2.5 min-w-0 p-1 rounded-xl hover:bg-white/[0.08] transition-all cursor-pointer group/owner text-left select-none"
              title="Click to view Owner account info from API"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.12] text-[#F5B82E] text-sm font-bold shadow-inner group-hover/owner:border-[#F5B82E]/50 group-hover/owner:scale-105 group-hover/owner:shadow-[0_0_12px_rgba(245,184,46,0.3)] transition-all"
              >
                👑
              </div>
              <div className="min-w-0 leading-tight whitespace-nowrap overflow-hidden transition-all duration-200 opacity-100 max-w-full lg:opacity-0 lg:max-w-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-w-[120px]">
                <p className="truncate text-xs font-bold text-white group-hover/owner:text-[#F5B82E] transition-colors">
                  {localStorage.getItem('name') || 'Owner'}
                </p>
                <p className="text-[10px] text-neutral-400 font-medium">
                  {localStorage.getItem('userRole') || 'Admin'}
                </p>
              </div>
            </button>

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

      {/* Owner Profile API Modal */}
      <OwnerProfileModal
        isOpen={ownerModalOpen}
        onClose={() => setOwnerModalOpen(false)}
      />
    </>
  );
}
