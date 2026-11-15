import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  MenuIcon,
  SearchIcon,
  CalendarIcon,
  LogOutIcon,
  TruckIcon,
  UsersIcon,
  RouteIcon,
  PackageIcon,
  XIcon
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

  const { trips, lorries, drivers, loadingParties, unloadingParties } = useOrders();

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
    <div className="flex h-screen w-full overflow-hidden bg-[#05090D] text-neutral-200">
      {/* Sidebar Navigation */}
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-[#0B1117] via-[#080D12] to-[#05090D]">
        {/* Top Header Bar with Smooth Glassmorphic Effect */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between bg-[#080D12]/70 px-4 sm:px-6 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          {/* Smooth Glassmorphic Bottom Divider Line & Ambient Light Ribbon */}
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
          <div className="absolute inset-x-16 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#F5B82E]/40 to-transparent blur-[1px] pointer-events-none" />
          <div className="absolute inset-x-32 -bottom-2 h-4 bg-gradient-to-r from-transparent via-[#F5B82E]/10 to-transparent blur-md pointer-events-none" />

          {/* Left: Mobile Menu Toggle & Brand Monogram */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-neutral-300 hover:border-[#F5B82E]/50 hover:text-[#F5B82E] lg:hidden cursor-pointer transition-all backdrop-blur-md"
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            {/* Brand Logo for Mobile or Header */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F5B82E] via-[#E2A621] to-[#C98A14] font-black text-[#05090D] shadow-md shadow-[#F5B82E]/25 text-sm tracking-tighter">
                SB
              </div>
              <div className="leading-tight">
                <p className="text-sm font-black tracking-wide text-white">
                  SRI SAI BABA
                </p>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5B82E]/85">
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
          <div className="flex items-center gap-2.5 sm:gap-3">
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
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-semibold text-neutral-300 backdrop-blur-md transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
              title="Logout"
            >
              <LogOutIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Global Search Modal Drawer */}
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 pt-20 backdrop-blur-md">
            <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0D1218] p-4 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <SearchIcon className="h-5 w-5 text-[#F5B82E]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search trips, lorries, drivers, loading/unloading parties..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="rounded-lg p-1 text-neutral-400 hover:bg-white/10 hover:text-white cursor-pointer"
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
        <div className="ti-scroll flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}