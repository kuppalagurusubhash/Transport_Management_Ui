import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import {
  MenuIcon,
  SearchIcon,
  CalendarIcon,
  LogOutIcon,
  TruckIcon,
  UsersIcon,
  RouteIcon,
  PackageIcon,
  XIcon,
  LayoutDashboardIcon,
  ShoppingBagIcon,
  PackageOpenIcon,
  CreditCardIcon
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { NotificationBell } from './NotificationBell';
import { useOrders } from '../../store/OrdersContext';
import { showcaseFleetData } from '../../data/fleetShowcase';

export function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { trips, orders, lorries, drivers, loadingParties, unloadingParties, isSyncing } = useOrders();
  const loadingCount = trips.filter((t) => t.status === 'loading').length;
  const newOrdersCount = orders.filter((o) => o.status === 'placed').length;

  // Format live real-time date string: "11 Sep 2025, 04:32 PM"
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted =
        now.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) +
        ', ' +
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      setCurrentTime(formatted);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    navigate('/login');
  };

  // Filtered search results
  const q = searchQuery.toLowerCase().trim();
  const matchedTrips = q
    ? trips.filter(
      (t) =>
        (t.code || '').toLowerCase().includes(q) ||
        (t.origin || '').toLowerCase().includes(q)
    )
    : [];
  const matchedLorries = q
    ? [...lorries, ...showcaseFleetData].filter(
      (l) =>
        (l.plate || '').toLowerCase().includes(q) ||
        ((l as any).model || '').toLowerCase().includes(q)
    )
    : [];
  const matchedDrivers = q
    ? drivers.filter(
      (d) =>
        (d.name || '').toLowerCase().includes(q) ||
        (d.phone || '').includes(q)
    )
    : [];
  const matchedParties = q
    ? [...loadingParties, ...unloadingParties].filter((p) =>
      (p.name || '').toLowerCase().includes(q)
    )
    : [];

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#05090D] text-neutral-200">
      {/* Sidebar Navigation */}
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-[#0B1117] via-[#080D12] to-[#05090D]">
        {/* Top Header Bar with Smooth Glassmorphic Effect */}
          <header className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center justify-between bg-[#080D12]/90 px-4 sm:px-6 lg:px-8 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_4px_30px_rgba(0,0,0,0.5)] pt-safe">
            {/* Smooth Glassmorphic Bottom Divider Line & Ambient Light Ribbon */}
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
            <div className="absolute inset-x-8 sm:inset-x-16 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#F5B82E]/40 to-transparent blur-[1px] pointer-events-none" />
            <div className="absolute inset-x-16 sm:inset-x-32 -bottom-2 h-4 bg-gradient-to-r from-transparent via-[#F5B82E]/10 to-transparent blur-md pointer-events-none" />

            {/* Live Backend Sync Shimmer Bar */}
            {isSyncing && (
              <div className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-[#F5B82E]/15 pointer-events-none">
                <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#F5B82E] to-amber-300 animate-pulse" />
              </div>
            )}

            {/* Left: Mobile Menu Toggle & Brand Monogram */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setMenuOpen(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-300 hover:border-[#F5B82E]/50 hover:text-[#F5B82E] active:scale-95 lg:hidden cursor-pointer transition-all backdrop-blur-md"
                aria-label="Open menu"
              >
                <MenuIcon className="h-5 w-5" />
              </button>

              {/* Brand Logo for Mobile or Header */}
              <Link to="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <img
                  src="/app-logo.jpg"
                  alt="Trans IA Logo"
                  className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-xl object-cover border border-[#F5B82E]/50 shadow-md shadow-[#F5B82E]/25"
                />
                <div className="leading-tight min-w-0">
                  <p className="truncate text-xs sm:text-sm font-black tracking-wide text-white">
                    SRI SAI BABA
                  </p>
                  <p className="truncate text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#F5B82E]/85">
                    Transport &amp; Stone Logistics
                  </p>
                </div>
              </Link>
            </div>

            {/* Center: Global Search Bar with Frosted Glass */}
            <div className="relative mx-4 hidden max-w-md flex-1 md:block">
              <div
                onClick={() => {
                  setSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="flex h-10 w-full cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-3.5 text-xs text-neutral-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md transition-all hover:border-[#F5B82E]/50 hover:bg-white/[0.06] hover:text-neutral-200"
              >
                <div className="flex items-center gap-2.5">
                  <SearchIcon className="h-4 w-4 text-neutral-400" />
                  <span>Search trips, lorries, drivers, parties...</span>
                </div>
                <kbd className="inline-flex h-5 items-center rounded border border-white/15 bg-white/5 px-1.5 font-mono text-[10px] text-neutral-400">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Right Header Controls */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Mobile Quick Search Button */}
              <button
                onClick={() => {
                  setSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-300 hover:border-[#F5B82E]/50 hover:text-[#F5B82E] active:scale-95 md:hidden cursor-pointer transition-all"
                aria-label="Search"
              >
                <SearchIcon className="h-4 w-4" />
              </button>

              {/* Live Date & Time Widget with Frosted Glass */}
              <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-neutral-300 shadow-sm backdrop-blur-md sm:flex">
                <CalendarIcon className="h-4 w-4 text-[#F5B82E]" />
                <span className="font-semibold tracking-tight">{currentTime || '11 Sep 2025, 04:32 PM'}</span>
              </div>

              {/* Notification Bell */}
              <NotificationBell />

              {/* Logout Button with Frosted Glass */}
              <button
                onClick={handleLogout}
                className="flex h-9 sm:h-auto items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 sm:px-3 py-2 text-xs font-semibold text-neutral-300 backdrop-blur-md transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 active:scale-95 cursor-pointer"
                title="Logout"
              >
                <LogOutIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>

          {/* Global Search Modal Drawer */}
          {searchOpen && (
              <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/80 p-3 pt-14 sm:p-4 sm:pt-20 backdrop-blur-md">
                <div className="relative w-full max-w-2xl rounded-2xl border border-[#F5B82E]/25 bg-[#0D1218] p-3.5 sm:p-4 shadow-2xl">
                  <div className="flex items-center gap-2.5 sm:gap-3 border-b border-white/10 pb-3">
                    <SearchIcon className="h-5 w-5 shrink-0 text-[#F5B82E]" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search trips, lorries, drivers, parties..."
                      className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
                    />
                    <button
                      onClick={() => setSearchOpen(false)}
                      className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white cursor-pointer"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Search Results List */}
                  <div className="ti-scroll max-h-80 overflow-y-auto pt-3 space-y-3 text-xs">
                    {!q && (
                      <div className="p-6 text-center text-neutral-400">
                        <p className="font-semibold text-neutral-300">Quick Search</p>
                        <p className="mt-1 text-[11px]">Type a lorry plate (e.g. KL-03), driver name, trip code, or stone party.</p>
                      </div>
                    )}

                    {/* Lorries */}
                    {matchedLorries.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#F5B82E] pb-1 flex items-center gap-1.5">
                          <TruckIcon className="h-3.5 w-3.5" /> Lorries ({matchedLorries.length})
                        </p>
                        <div className="space-y-1">
                          {matchedLorries.slice(0, 4).map((l, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setSearchOpen(false);
                                navigate(`/fleet/${l.id}`);
                              }}
                              className="flex items-center justify-between rounded-lg p-2 hover:bg-white/5 cursor-pointer text-white"
                            >
                              <span className="font-mono font-bold">{l.plate}</span>
                              <span className="text-neutral-400">{(l as any).model || 'Heavy Hauler'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trips */}
                    {matchedTrips.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 pb-1 flex items-center gap-1.5">
                          <RouteIcon className="h-3.5 w-3.5" /> Trips ({matchedTrips.length})
                        </p>
                        <div className="space-y-1">
                          {matchedTrips.slice(0, 4).map((t, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setSearchOpen(false);
                                navigate(`/trips/${t.id}`);
                              }}
                              className="flex items-center justify-between rounded-lg p-2 hover:bg-white/5 cursor-pointer text-white"
                            >
                              <span className="font-mono font-bold">{t.code}</span>
                              <span className="text-neutral-400">{t.origin} &bull; {t.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Drivers */}
                    {matchedDrivers.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 pb-1 flex items-center gap-1.5">
                          <UsersIcon className="h-3.5 w-3.5" /> Drivers ({matchedDrivers.length})
                        </p>
                        <div className="space-y-1">
                          {matchedDrivers.slice(0, 4).map((d, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setSearchOpen(false);
                                navigate(`/drivers/${d.id}`);
                              }}
                              className="flex items-center justify-between rounded-lg p-2 hover:bg-white/5 cursor-pointer text-white"
                            >
                              <span className="font-bold">{d.name}</span>
                              <span className="text-neutral-400">{d.phone}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Parties */}
                    {matchedParties.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 pb-1 flex items-center gap-1.5">
                          <PackageIcon className="h-3.5 w-3.5" /> Parties ({matchedParties.length})
                        </p>
                        <div className="space-y-1">
                          {matchedParties.slice(0, 4).map((p, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setSearchOpen(false);
                                navigate('/loading-parties');
                              }}
                              className="flex items-center justify-between rounded-lg p-2 hover:bg-white/5 cursor-pointer text-white"
                            >
                              <span className="font-bold">{p.name}</span>
                              <span className="text-neutral-400">{(p as any).location || (p as any).district || ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
        )}

              {/* Scrollable Page Outlet */}
                <main className="ti-scroll relative z-10 flex-1 overflow-y-auto overflow-x-hidden pb-28 sm:pb-32 lg:pb-10">
                  <Outlet />
              {/* Extra mobile bottom spacer so content never hides behind fixed bottom navigation */}
              <div className="h-16 lg:hidden shrink-0 pointer-events-none" aria-hidden="true" />
            </main>

        {/* Luxury Mobile Bottom Navigation Dock (iPhone 12 Pro Max / iOS Optimized) */}
          <nav
            aria-label="Mobile quick navigation"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-[#F5B82E]/25 bg-[#060A0F]/95 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_-10px_35px_rgba(0,0,0,0.85)] lg:hidden pb-safe"
          >
              <div className="grid grid-cols-6 items-center px-2 pt-2 pb-1.5">
                {[
                  { to: '/', label: 'Home', icon: LayoutDashboardIcon, end: true },
                  { to: '/orders', label: 'Orders', icon: ShoppingBagIcon, badge: newOrdersCount },
                  { to: '/loading', label: 'Loading', icon: PackageOpenIcon, badge: loadingCount },
                  { to: '/trips', label: 'Trips', icon: RouteIcon },
                  { to: '/payments', label: 'Ledgers', icon: CreditCardIcon }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `relative flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition-all ${isActive
                          ? 'text-[#F5B82E]'
                          : 'text-neutral-400 hover:text-neutral-200 active:scale-95'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute -top-1.5 h-0.5 w-6 rounded-full bg-[#F5B82E] shadow-[0_0_8px_#F5B82E]" />
                          )}
                          <div className="relative flex h-6 w-6 items-center justify-center">
                            <Icon className="h-4 w-4" />
                            {item.badge && item.badge > 0 ? (
                              <span className="absolute -right-2 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#F5B82E] px-1 text-[9px] font-black text-[#05090D] shadow">
                                {item.badge}
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[9.5px] font-bold tracking-tight leading-none">
                            {item.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  );
                })}

                {/* More / Full Menu Drawer Trigger */}
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition-all cursor-pointer ${menuOpen ? 'text-[#F5B82E]' : 'text-neutral-400 hover:text-neutral-200 active:scale-95'
                    }`}
                >
                  <div className="flex h-6 w-6 items-center justify-center">
                    <MenuIcon className="h-4 w-4" />
                  </div>
                  <span className="text-[9.5px] font-bold tracking-tight leading-none">
                    Menu
                  </span>
                </button>
              </div>
          </nav>
      </div>
    </div>
  );
}