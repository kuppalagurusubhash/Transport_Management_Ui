import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  XIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  ShieldCheckIcon,
  Building2Icon,
  TruckIcon,
  RouteIcon,
  RefreshCwIcon,
  SettingsIcon,
  LogOutIcon,
  CheckCircle2Icon
} from 'lucide-react';
import { authApi } from '../../api/index';
import { useOrders } from '../../store/OrdersContext';

interface OwnerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OwnerProfileModal({ isOpen, onClose }: OwnerProfileModalProps) {
  const navigate = useNavigate();
  const { lorries, trips, orders } = useOrders();

  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [apiSource, setApiSource] = useState<'live' | 'cached'>('cached');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fallbacks from localStorage
  const localName = localStorage.getItem('name') || 'Owner Admin';
  const localUsername = localStorage.getItem('username') || 'owner';
  const localRole = localStorage.getItem('userRole') || 'owner';

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authApi.getMe();
      if (res && (res.user || (res as any).data)) {
        setUserData(res.user || (res as any).data);
        setApiSource('live');
      } else {
        setApiSource('cached');
      }
    } catch (err: any) {
      console.warn('Could not fetch /auth/me from API, using cached session:', err);
      setApiSource('cached');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen, fetchProfile]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const user = userData || {};
  const displayName = user.name || localName;
  const displayUsername = user.username || localUsername;
  const displayRole = (user.role || localRole).toUpperCase();
  const displayEmail = user.email || 'owner@srisaibaba.com';
  const displayPhone = user.phone || '+91 98400 12345';
  const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : 'Active Member';

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    onClose();
    navigate('/login');
  };

  const handleGoSettings = () => {
    onClose();
    navigate('/settings');
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-lg rounded-[28px] border border-white/[0.14] bg-[#070B11]/95 p-5 sm:p-6 shadow-[0_24px_70px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.2)] backdrop-blur-2xl text-neutral-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-profile-title"
      >
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-[#F5B82E]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* Modal Header */}
        <div className="relative flex items-start justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3.5">
            {/* Crown Avatar Squircle */}
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F5B82E]/25 via-[#C98A14]/30 to-black/60 border border-[#F5B82E]/40 text-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_8px_20px_rgba(245,184,46,0.2)]">
              👑
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#070B11]">
                <CheckCircle2Icon className="h-3 w-3 text-white" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 id="owner-profile-title" className="text-base sm:text-lg font-black text-white truncate">
                  {displayName}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#F5B82E]/40 bg-[#F5B82E]/15 px-2 py-0.5 text-[9.5px] font-black text-[#F5B82E] shadow-sm">
                  <ShieldCheckIcon className="h-2.5 w-2.5" />
                  {displayRole}
                </span>
              </div>
              <p className="font-mono text-xs text-neutral-400 mt-0.5 truncate">
                @{displayUsername} • Member since {createdAt}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-neutral-400 hover:border-white/25 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Live API Sync Status Pill */}
        <div className="mt-3.5 flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                apiSource === 'live' ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]' : 'bg-amber-400'
              } ${loading ? 'animate-ping' : ''}`}
            />
            <span className="text-[11px] text-neutral-300 font-medium">
              {loading
                ? 'Syncing with API...'
                : apiSource === 'live'
                  ? 'Live Account Verified via /api/auth/me'
                  : 'Authenticated Session Active'}
            </span>
          </div>

          <button
            onClick={fetchProfile}
            disabled={loading}
            className="flex items-center gap-1 text-[10.5px] font-semibold text-[#F5B82E] hover:underline cursor-pointer disabled:opacity-50"
            title="Refresh profile from backend"
          >
            <RefreshCwIcon className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* User Info Details Grid */}
        <div className="mt-4 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Email */}
            <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-neutral-300">
                <MailIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Email</p>
                <p className="truncate text-xs font-semibold text-white mt-0.5">{displayEmail}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-neutral-300">
                <PhoneIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Contact</p>
                <p className="truncate text-xs font-semibold text-white mt-0.5">{displayPhone}</p>
              </div>
            </div>

            {/* Enterprise Organization */}
            <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-2.5 sm:col-span-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-neutral-300">
                <Building2Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Company</p>
                <p className="truncate text-xs font-semibold text-white mt-0.5">
                  Sri Sai Baba Transport &amp; Stone Logistics
                </p>
              </div>
            </div>
          </div>

          {/* Quick Operations Metrics Under Management */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
            <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2 flex items-center gap-1.5">
              <UserIcon className="h-3 w-3 text-[#F5B82E]" /> Fleet Operations Command
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-black/40 border border-white/5 p-2">
                <div className="flex items-center justify-center gap-1 text-[#F5B82E] mb-0.5">
                  <TruckIcon className="h-3.5 w-3.5" />
                </div>
                <p className="font-mono text-sm font-black text-white">{lorries.length}</p>
                <p className="text-[9.5px] text-neutral-400">Total Lorries</p>
              </div>

              <div className="rounded-lg bg-black/40 border border-white/5 p-2">
                <div className="flex items-center justify-center gap-1 text-emerald-400 mb-0.5">
                  <RouteIcon className="h-3.5 w-3.5" />
                </div>
                <p className="font-mono text-sm font-black text-white">
                  {trips.filter((t) => t.status === 'in-transit' || t.status === 'loading').length}
                </p>
                <p className="text-[9.5px] text-neutral-400">Active Trips</p>
              </div>

              <div className="rounded-lg bg-black/40 border border-white/5 p-2">
                <div className="flex items-center justify-center gap-1 text-sky-400 mb-0.5">
                  <CheckCircle2Icon className="h-3.5 w-3.5" />
                </div>
                <p className="font-mono text-sm font-black text-white">
                  {orders.filter((o) => o.status === 'placed').length}
                </p>
                <p className="text-[9.5px] text-neutral-400">New Orders</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
          <button
            onClick={handleGoSettings}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs font-bold text-neutral-200 hover:border-[#F5B82E]/50 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            <SettingsIcon className="h-3.5 w-3.5" />
            <span>Manage Settings</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-400 hover:border-red-500/60 hover:bg-red-500/20 transition-all cursor-pointer"
          >
            <LogOutIcon className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

