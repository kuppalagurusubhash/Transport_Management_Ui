import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LockIcon,
  UserIcon,
  ArrowRightIcon,
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldCheckIcon
} from 'lucide-react';
import { authApi } from '../api/index';
import { useOrders } from '../store/OrdersContext';

export function Login() {
  const navigate = useNavigate();
  const { syncDatabase } = useOrders();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  // Check if backend is reachable on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const apiUrl = (import.meta.env.VITE_API_URL || 'https://transport-management-backend-xmzn.onrender.com/api').replace(/\/+$/, '');
        await fetch(`${apiUrl}/drivers`, {
          method: 'GET',
          signal: controller.signal
        }).catch(() => {});
        clearTimeout(timeoutId);
        setIsBackendOnline(true);
      } catch {
        setIsBackendOnline(false);
      }
    };
    checkBackend();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({ username, password });
      if (res && res.success) {
        localStorage.removeItem('isMockMode');
        localStorage.setItem('isAuthenticated', 'true');
        const role = res.user.role === 'loading_supervisor' ? 'loading' : res.user.role;
        localStorage.setItem('userRole', role);
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('username', res.user.username);
        localStorage.setItem('name', res.user.name);
        if (res.user.buyerRef) {
          localStorage.setItem('buyerRef', res.user.buyerRef);
        }
        if (res.user.driverRef) {
          localStorage.setItem('driverRef', res.user.driverRef);
        }

        await syncDatabase().catch(() => {});
        navigate('/');
      } else {
        setError(res.message || 'Login failed. Please check credentials.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid username or password.');
      setLoading(false);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full bg-[#05080C] text-neutral-100 font-sans selection:bg-[#F5B82E]/30 selection:text-[#F5B82E] overflow-hidden flex flex-col justify-between pt-safe pb-safe">
      {/* Background Image: Ashok Leyland Truck Scene with Warm Vignette */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.34] scale-105"
          style={{ backgroundImage: 'url(/login_bg.jpg)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 35% 55%, rgba(5, 8, 12, 0.45) 0%, rgba(5, 8, 12, 0.85) 60%, #05080C 100%)'
          }}
        />
        {/* Warm amber lighting reflection */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-[#F5B82E]/[0.06] blur-[140px] pointer-events-none" />
      </div>

      {/* TOP HEADER BAR */}
      <header className="relative z-20 flex shrink-0 items-center justify-between px-6 sm:px-10 lg:px-14 pt-4 sm:pt-6">
        {/* Logo & Brand Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-white/[0.12] bg-[#121820]/80 p-1 sm:p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md">
            <img
              src="/app-logo.png"
              alt="SGSP Logo"
              className="h-full w-full object-contain filter drop-shadow-[0_2px_8px_rgba(245,184,46,0.35)] select-none"
            />
          </div>
          <div className="leading-tight">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white select-none">
              SGSP
            </h2>
            <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              SRI SAI BABA LOGISTICS
            </p>
          </div>
        </div>

        {/* Live Database Status Pill */}
        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#0E151C]/75 px-3 py-1 text-xs text-neutral-300 backdrop-blur-md shadow-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              isBackendOnline === true
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : isBackendOnline === false
                ? 'bg-amber-400'
                : 'bg-neutral-500 animate-pulse'
            }`}
          />
          <span className="text-[10px] sm:text-[11px] font-medium text-neutral-300">
            {isBackendOnline === true
              ? 'Live database'
              : isBackendOnline === false
              ? 'Backend offline'
              : 'Connecting...'}
          </span>
        </div>
      </header>

      {/* MAIN CONTAINER: PERFECTLY BALANCED IN THE CENTER WITH GENEROUS LEFT/RIGHT PADDING */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 flex-1 flex items-center justify-center my-auto pb-4 lg:pb-0">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT COLUMN: HERO HEADLINE & CONNECTED CORRIDOR (DESKTOP ONLY) */}
          <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-5 xl:space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F5B82E] mb-2.5">
                TRANSPORT &amp; FLEET MANAGEMENT
              </p>
              <h1 className="text-4xl lg:text-5xl xl:text-[56px] font-black tracking-tight leading-[1.08] text-white">
                Your fleet.<br />
                <span className="text-[#F5B82E]">One clear view.</span>
              </h1>
              <p className="mt-3 text-sm text-neutral-300/90 leading-relaxed max-w-md">
                A smoother start to every journey.<br />
                Manage your transport operations in one place.
              </p>
            </div>

            {/* Connected Corridor Glass Card */}
            <div className="max-w-md rounded-2xl border border-white/[0.1] bg-[#0B1118]/60 p-4 xl:p-5 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-2.5">
                CONNECTED CORRIDOR
              </p>

              {/* Kerala to Andhra Pradesh Route Display */}
              <div className="flex items-center justify-between text-base font-bold text-white px-1">
                <span>Kerala</span>
                <span>Andhra Pradesh</span>
              </div>

              {/* Telemetry Route Track with Golden Waypoint Nodes */}
              <div className="relative my-2.5 flex items-center justify-between px-1">
                <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 border-b-2 border-dashed border-[#F5B82E]/40" />
                <div className="relative z-10 h-3 w-3 rounded-full bg-[#F5B82E] ring-4 ring-[#F5B82E]/25 shadow-[0_0_8px_#F5B82E]" />
                <div className="relative z-10 h-2.5 w-2.5 rounded-full bg-[#F5B82E]/80 shadow-[0_0_6px_#F5B82E]" />
                <div className="relative z-10 h-3 w-3 rounded-full bg-[#F5B82E] ring-4 ring-[#F5B82E]/25 shadow-[0_0_8px_#F5B82E]" />
              </div>

              <p className="text-xs text-neutral-400 mt-1.5 px-1">
                Dispatch. Track. Move forward.
              </p>
            </div>

            <p className="text-xs text-neutral-500 font-medium">
              Built for the road. Designed for your team.
            </p>
          </div>

          {/* RIGHT COLUMN: LOGIN INPUTS CARD (ON MOBILE: GEOMETRICALLY CENTERED WITH AMPLE LEFT & RIGHT SPACE) */}
          <div className="w-full lg:col-span-5 flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="w-full max-w-[360px] sm:max-w-[390px] lg:max-w-[420px] mx-auto lg:mx-0 rounded-[26px] sm:rounded-3xl border border-white/[0.1] bg-[#0C1218]/85 p-5 sm:p-7 lg:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.18)] backdrop-blur-2xl backdrop-saturate-150"
            >
              {/* Card Header: Clean on mobile, showing strictly title */}
              <div className="mb-4 sm:mb-6 text-left">
                <p className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.22em] text-[#F5B82E] mb-1.5">
                  ENTERPRISE PORTAL
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Welcome back
                </h2>
                <p className="hidden sm:block text-xs sm:text-sm text-neutral-400 mt-1">
                  Sign in to keep your business moving.
                </p>
              </div>

              {/* Error Alert */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-3.5 rounded-xl border border-red-500/30 bg-red-500/15 p-2.5 sm:p-3 text-xs text-red-300"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                      <span className="leading-snug">{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form: Inputs Only */}
              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                {/* Username or Email Input */}
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-medium text-neutral-300">
                    Username or email
                  </label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400 group-focus-within:text-[#F5B82E] transition-colors pointer-events-none">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.1] bg-[#070B0F]/90 py-2.5 sm:py-3 pl-10 pr-3.5 text-sm text-white placeholder-neutral-500 shadow-inner transition-all duration-200 hover:border-white/[0.2] focus:border-[#F5B82E] focus:bg-[#070B0F] focus:outline-none focus:ring-1 focus:ring-[#F5B82E]"
                      placeholder="Enter username or email"
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Input with Visibility Toggle */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-neutral-300">
                      Password
                    </label>
                    <a
                      href="#forgot-password"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Please contact your SGSP fleet administrator to reset access credentials.');
                      }}
                      className="text-xs text-[#F5B82E]/90 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400 group-focus-within:text-[#F5B82E] transition-colors pointer-events-none">
                      <LockIcon className="h-4 w-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.1] bg-[#070B0F]/90 py-2.5 sm:py-3 pl-10 pr-10 text-sm text-white placeholder-neutral-500 shadow-inner transition-all duration-200 hover:border-white/[0.2] focus:border-[#F5B82E] focus:bg-[#070B0F] focus:outline-none focus:ring-1 focus:ring-[#F5B82E]"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Keep me signed in Checkbox */}
                <div className="flex items-center pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#F5B82E] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#F5B82E]"
                    />
                    <span className="text-xs text-neutral-400">Keep me signed in</span>
                  </label>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5B82E] hover:bg-[#e5a820] active:scale-[0.99] py-3 sm:py-3.5 px-4 text-sm font-bold text-neutral-950 transition-all duration-200 shadow-[0_4px_20px_rgba(245,184,46,0.3)] disabled:opacity-50 cursor-pointer group"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                      <span>Signing In...</span>
                    </span>
                  ) : (
                    <>
                      <span>Sign in to dashboard</span>
                      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Card Footer: Simple register link */}
              <div className="mt-4 sm:mt-5 pt-3.5 border-t border-white/[0.08] text-center space-y-1.5">
                <p className="text-xs text-neutral-400">
                  New to SGSP?{' '}
                  <Link
                    to="/register"
                    className="font-bold text-[#F5B82E] hover:underline ml-1"
                  >
                    Register profile
                  </Link>
                </p>

                <div className="hidden sm:flex items-center justify-center gap-1.5 text-[10px] text-neutral-400">
                  <ShieldCheckIcon className="h-3.5 w-3.5 text-neutral-400" />
                  <span>256-bit encrypted telemetry</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* BOTTOM FOOTER BAR (Desktop only, hidden on mobile so it stays perfectly centered and 1-page fit) */}
      <footer className="relative z-20 hidden lg:flex shrink-0 items-center justify-between px-6 sm:px-10 lg:px-14 pb-4 pt-2 text-[11px] text-neutral-500 border-t border-white/[0.04]">
        <div>
          &copy; SGSP &middot; Sri Sai Baba Logistics
        </div>
        <div>
          Kerala &amp; AP corridor
        </div>
        <div>
          <a
            href="mailto:support@sgsp.in"
            className="hover:text-neutral-300 transition-colors"
          >
            Need help? Contact support
          </a>
        </div>
      </footer>
    </div>
  );
}
