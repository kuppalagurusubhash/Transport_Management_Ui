import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LockIcon, 
  UserIcon, 
  ArrowRightIcon, 
  WifiIcon, 
  WifiOffIcon,
  AlertCircleIcon
} from 'lucide-react';
import { authApi } from '../api/index';
import { useOrders } from '../store/OrdersContext';

export function Login() {
  const navigate = useNavigate();
  const { syncDatabase } = useOrders();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  // Check if backend is reachable on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9090/api';
        await fetch(`${apiUrl}/drivers`, { 
          method: 'GET',
          signal: controller.signal 
        }).catch(() => {
          // Ignore actual response, we just care if network succeeds or fails
        });
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
        // Map backend loading_supervisor to frontend loading
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

        if (role === 'driver') navigate('/driver');
        else if (role === 'loading') navigate('/loading');
        else if (role === 'buyer') navigate('/buyer');
        else navigate('/');
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
    <div className="relative flex min-h-screen w-full items-center justify-center bg-ink-950 px-4 py-12 text-neutral-200 overflow-hidden font-sans">
      {/* Background Image with Vignette Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.16] scale-105"
          style={{ backgroundImage: 'url(/login_bg.jpg)' }}
        />
        <div 
          className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle at center, transparent 15%, #0f0f0f 85%)' }}
        />
      </div>

      {/* Background Animated Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-gold/5 blur-[130px]" 
        />
        <motion.div 
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-gold/5 blur-[130px]" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-md space-y-6 rounded-2xl border border-ink-800 bg-ink-900/70 p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl relative"
      >
        {/* Live Server Connection Indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-ink-950/80 border border-ink-800 text-[10px] font-semibold">
          {isBackendOnline === null ? (
            <>
              <span className="flex h-1.5 w-1.5 rounded-full bg-neutral-500 animate-pulse" />
              <span className="text-neutral-400">Connecting...</span>
            </>
          ) : isBackendOnline ? (
            <>
              <WifiIcon className="h-3 w-3 text-green-400" />
              <span className="text-green-400">Live Database</span>
            </>
          ) : (
            <>
              <WifiOffIcon className="h-3 w-3 text-amber-500" />
              <span className="text-amber-500">Connecting to Backend</span>
            </>
          )}
        </div>

        {/* Header */}
        <div className="text-center pt-2">
          <motion.div
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-gold-600 to-gold text-ink-950 font-black text-2xl mb-3 shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:scale-105 transition-transform cursor-default"
          >
            TA
          </motion.div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-transparent">
            TRANS IA
          </h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-neutral-400 font-semibold">
            Logistics & Transport Management
          </p>
        </div>

        {/* Error Alert */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 space-y-2"
            >
              <div className="flex items-start gap-2">
                <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Username or Email
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500 group-focus-within:text-gold transition-colors">
                <UserIcon className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-ink-700 bg-ink-950/50 py-2.5 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                placeholder="Enter username or email"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500 group-focus-within:text-gold transition-colors">
                <LockIcon className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-ink-700 bg-ink-950/50 py-2.5 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-600 py-3 text-sm font-bold text-ink-950 transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 shadow-[0_4px_15px_rgba(212,175,55,0.2)] group cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && (
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            )}
          </button>
        </form>

        {/* Link to Register */}
        <div className="text-center text-xs text-neutral-400 pt-2 border-t border-ink-800">
          Need a portal account?{' '}
          <Link 
            to="/register" 
            className="text-gold font-bold hover:underline transition-colors ml-1"
          >
            Register Profile
          </Link>
        </div>

      </motion.div>
    </div>
  );
}
