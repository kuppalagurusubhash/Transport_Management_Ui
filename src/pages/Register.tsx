import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserIcon, 
  LockIcon, 
  PhoneIcon, 
  UserCheckIcon, 
  ArrowRightIcon, 
  WifiIcon, 
  WifiOffIcon,
  AlertCircleIcon,
  UsersIcon,
  BriefcaseIcon
} from 'lucide-react';
import { authApi, driversApi, unloadingPartiesApi } from '../api/index';
import { useOrders } from '../store/OrdersContext';
import type { Driver, UnloadingParty } from '../data/types';


export function Register() {
  const navigate = useNavigate();
  const { syncDatabase } = useOrders();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'driver' | 'loading_supervisor' | 'buyer'>('driver');
  const [password, setPassword] = useState('');
  const [driverRef, setDriverRef] = useState('');
  const [buyerRef, setBuyerRef] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [unloadingPartiesList, setUnloadingPartiesList] = useState<UnloadingParty[]>([]);
  const [buyerMode, setBuyerMode] = useState<'link' | 'new'>('link');
  const [newBuyerId, setNewBuyerId] = useState('');
  const [newBuyerName, setNewBuyerName] = useState('');
  const [newBuyerDistrict, setNewBuyerDistrict] = useState('Palakkad');
  const [supervisorLocation, setSupervisorLocation] = useState('Ramapuram');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  // Check backend status, load drivers & unloading parties
  useEffect(() => {
    const initData = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        
        // Fetch drivers and unloading parties to populate selectors
        const [driversRes, unloadingRes] = await Promise.all([
          driversApi.getAll().catch(() => []),
          unloadingPartiesApi.getAll().catch(() => [])
        ]);
        clearTimeout(timeoutId);
        
        if (driversRes && Array.isArray(driversRes)) {
          setDrivers(driversRes);
        }
        if (unloadingRes && Array.isArray(unloadingRes)) {
          setUnloadingPartiesList(unloadingRes);
        }
        setIsBackendOnline(true);
      } catch {
        setIsBackendOnline(false);
      }
    };
    initData();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (role === 'loading_supervisor') {
      if (!supervisorLocation.trim() || !supervisorLocation.trim().toLowerCase().startsWith('ramapuram')) {
        setError('Loading Supervisor must be from Ramapuram only.');
        setLoading(false);
        return;
      }
    }

    const payload = {
      name,
      username,
      phone,
      role,
      password,
      location: role === 'loading_supervisor' ? supervisorLocation.trim() : undefined,
      driverRef: role === 'driver' && driverRef ? driverRef : null,
      buyerRef: role === 'buyer' && buyerMode === 'link' && buyerRef ? buyerRef : null,
      buyerInfo: role === 'buyer' && buyerMode === 'new' ? {
        id: newBuyerId.trim().toUpperCase(),
        name: newBuyerName.trim(),
        district: newBuyerDistrict
      } : null
    };

    try {
      const res = await authApi.register(payload);
      if (res && res.success) {
        setSuccess(true);
        setTimeout(async () => {
          localStorage.setItem('isAuthenticated', 'true');
          const mappedRole = res.user.role === 'loading_supervisor' ? 'loading' : res.user.role;
          localStorage.setItem('userRole', mappedRole);
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

          await syncDatabase();

          if (mappedRole === 'driver') navigate('/driver');
          else if (mappedRole === 'loading') navigate('/loading');
          else if (mappedRole === 'buyer') navigate('/buyer');
          else navigate('/');
        }, 1200);
      } else {
        setError(res.message || 'Registration failed. Check inputs.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Error occurred during registration.');
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
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gold/5 blur-[130px]" 
        />
        <motion.div 
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 40, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-gold/5 blur-[130px]" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-md space-y-6 rounded-2xl border border-ink-800 bg-ink-900/60 p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl relative"
      >
        {/* Connection Status Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-ink-950 border border-ink-800 text-[10px] font-semibold text-neutral-400">
          {isBackendOnline === null ? (
            <span className="flex h-1.5 w-1.5 rounded-full bg-neutral-500 animate-pulse" />
          ) : isBackendOnline ? (
            <>
              <WifiIcon className="h-3 w-3 text-green-400" />
              <span className="text-green-400">Live Database</span>
            </>
          ) : (
            <>
              <WifiOffIcon className="h-3 w-3 text-amber-500" />
              <span className="text-amber-500">Connecting...</span>
            </>
          )}
        </div>

        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, rotate: 5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-gold-600 to-gold text-ink-950 font-black text-xl mb-3 shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:scale-105 transition-transform cursor-default"
          >
            TA
          </motion.div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">
            Create Profile
          </h2>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
            Join the TRANS IA Management Network
          </p>
        </div>

        {/* Success Screen */}
        <AnimatePresence>
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-6 text-center space-y-4"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                <UserCheckIcon className="h-8 w-8 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Registration Successful!</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Setting up secure access credentials and preparing your dashboard...
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300 flex items-center gap-2">
                    <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Full Name
                  </label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500 group-focus-within:text-gold transition-colors">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-ink-700 bg-ink-950/40 py-2 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Username / Email
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
                      className="w-full rounded-xl border border-ink-700 bg-ink-950/40 py-2 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                      placeholder="e.g. john_driver"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Phone Number
                  </label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500 group-focus-within:text-gold transition-colors">
                      <PhoneIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-ink-700 bg-ink-950/40 py-2 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                </div>

                  {/* Role and Link Profile Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      System Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'driver' | 'loading_supervisor' | 'buyer')}
                      className="w-full rounded-xl border border-ink-700 bg-ink-900 py-2 px-3 text-sm text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                    >
                      <option value="driver">Driver</option>
                      <option value="loading_supervisor">Loading Supervisor</option>
                      <option value="buyer">Buyer / Quarry Client</option>
                    </select>
                  </div>

                  {role === 'loading_supervisor' && (
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        Location / Area
                      </label>
                      <input
                        type="text"
                        required
                        value={supervisorLocation}
                        onChange={(e) => setSupervisorLocation(e.target.value)}
                        className="w-full rounded-xl border border-ink-700 bg-ink-950/40 py-2 px-3 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                        placeholder="e.g. Ramapuram"
                      />
                    </div>
                  )}

                  {role === 'driver' && (
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        Link Driver Profile
                      </label>
                      <select
                        value={driverRef}
                        onChange={(e) => setDriverRef(e.target.value)}
                        className="w-full rounded-xl border border-ink-700 bg-ink-900 py-2 px-3 text-sm text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                      >
                        <option value="">None / Create New</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {role === 'buyer' && (
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        Buyer Profile Mode
                      </label>
                      <select
                        value={buyerMode}
                        onChange={(e) => setBuyerMode(e.target.value as 'link' | 'new')}
                        className="w-full rounded-xl border border-ink-700 bg-ink-900 py-2 px-3 text-sm text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                      >
                        <option value="link">Link Existing Business</option>
                        <option value="new">Register New Business</option>
                      </select>
                    </div>
                  )}
                </div>

                {role === 'buyer' && buyerMode === 'link' && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      Link Buyer Profile
                    </label>
                    <select
                      required
                      value={buyerRef}
                      onChange={(e) => setBuyerRef(e.target.value)}
                      className="w-full rounded-xl border border-ink-700 bg-ink-900 py-2 px-3 text-sm text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                    >
                      <option value="">Select Buyer Profile</option>
                      {unloadingPartiesList.map(up => (
                        <option key={up.id} value={up.id}>
                          {up.name} ({up.district})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {role === 'buyer' && buyerMode === 'new' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 p-3 rounded-xl border border-ink-800 bg-ink-950/40"
                  >
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gold-400">New Buyer Information</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Buyer ID / Code
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. MAL-BLD"
                          value={newBuyerId}
                          onChange={(e) => setNewBuyerId(e.target.value)}
                          className="w-full rounded-xl border border-ink-700 bg-ink-950/40 py-2 px-3 text-xs text-white placeholder-neutral-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          District
                        </label>
                        <select
                          value={newBuyerDistrict}
                          onChange={(e) => setNewBuyerDistrict(e.target.value)}
                          className="w-full rounded-xl border border-ink-700 bg-ink-900 py-2 px-3 text-xs text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                        >
                          <option value="Palakkad">Palakkad</option>
                          <option value="Wayanad">Wayanad</option>
                          <option value="Kannur">Kannur</option>
                          <option value="Thrissur">Thrissur</option>
                          <option value="Ernakulam">Ernakulam</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        Business Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Malabar Builders"
                        value={newBuyerName}
                        onChange={(e) => setNewBuyerName(e.target.value)}
                        className="w-full rounded-xl border border-ink-700 bg-ink-950/40 py-2 px-3 text-xs text-white placeholder-neutral-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Security Password
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
                      className="w-full rounded-xl border border-ink-700 bg-ink-950/40 py-2 pl-10 pr-3 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-600 py-3 text-sm font-bold text-ink-950 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-[0_4px_15px_rgba(212,175,55,0.15)] group"
                >
                  {loading ? 'Registering...' : 'Register Account'}
                  {!loading && (
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <div className="text-center text-xs text-neutral-400 pt-1">
                Already registered?{' '}
                <Link 
                  to="/login" 
                  className="text-gold font-bold hover:underline transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
