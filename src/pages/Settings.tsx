import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserIcon, 
  LockIcon, 
  EyeIcon, 
  EyeOffIcon, 
  SlidersIcon, 
  SaveIcon, 
  CheckCircle2Icon, 
  AlertCircleIcon, 
  ShieldAlertIcon, 
  ActivityIcon,
  BellIcon,
  GlobeIcon
} from 'lucide-react';
import { authApi } from '../api/index';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  
  // Feedback Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile Form States
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userRole, setUserRole] = useState('owner');

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Preference States (Loaded from/saved to localStorage)
  const [currency, setCurrency] = useState('₹');
  const [defaultTripStatus, setDefaultTripStatus] = useState('loading');
  const [driverNotification, setDriverNotification] = useState(true);
  const [buyerNotification, setBuyerNotification] = useState(false);
  const [fuelAlertThreshold, setFuelAlertThreshold] = useState('15');

  // Load profile from server or fallback to localStorage
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authApi.getMe();
        if (res && res.success && res.user) {
          setUsername(res.user.username || '');
          setName(res.user.name || '');
          setPhone(res.user.phone || '');
          setUserRole(res.user.role || 'owner');
        } else {
          throw new Error('Failed to parse user details');
        }
      } catch {
        setUsername(localStorage.getItem('username') || '');
        setName(localStorage.getItem('name') || '');
        setPhone(localStorage.getItem('phone') || '');
        setUserRole(localStorage.getItem('userRole') || 'owner');
      }
    };

    // Load Local Preferences
    const storedCurrency = localStorage.getItem('owner_currency');
    if (storedCurrency) setCurrency(storedCurrency);

    const storedStatus = localStorage.getItem('owner_default_trip_status');
    if (storedStatus) setDefaultTripStatus(storedStatus);

    const storedDriverNotif = localStorage.getItem('owner_driver_notifications');
    if (storedDriverNotif) setDriverNotification(storedDriverNotif === 'true');

    const storedBuyerNotif = localStorage.getItem('owner_buyer_notifications');
    if (storedBuyerNotif) setBuyerNotification(storedBuyerNotif === 'true');

    const storedFuel = localStorage.getItem('owner_fuel_threshold');
    if (storedFuel) setFuelAlertThreshold(storedFuel);

    fetchProfile();
  }, []);

  const triggerToast = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(msg);
      setSuccessMsg('');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      triggerToast('error', 'Name is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.updateProfile({ name, phone });
      if (res && res.success) {
        localStorage.setItem('name', res.user.name);
        localStorage.setItem('phone', res.user.phone || '');
        triggerToast('success', 'Profile settings updated successfully!');
      } else {
        triggerToast('error', 'Failed to update profile settings.');
      }
    } catch (err: any) {
      triggerToast('error', err.message || 'Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerToast('error', 'All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('error', 'New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 5) {
      triggerToast('error', 'Password must be at least 5 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.changePassword({ currentPassword, newPassword });
      if (res && res.success) {
        triggerToast('success', 'Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        triggerToast('error', res.message || 'Incorrect current password.');
      }
    } catch (err: any) {
      triggerToast('error', err.message || 'Error updating password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('owner_currency', currency);
    localStorage.setItem('owner_default_trip_status', defaultTripStatus);
    localStorage.setItem('owner_driver_notifications', String(driverNotification));
    localStorage.setItem('owner_buyer_notifications', String(buyerNotification));
    localStorage.setItem('owner_fuel_threshold', fuelAlertThreshold);
    triggerToast('success', 'Preferences saved successfully! Refresh page to apply formatting.');
  };

  return (
    <div className="flex h-full min-w-0 flex-col bg-ink-900 font-sans">
      {/* Header */}
      <header className="border-b border-ink-700 bg-ink-950 px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">
              Settings
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              Manage your owner profile, account credentials, and system configurations
            </p>
          </div>
        </div>
      </header>

      {/* Main Settings Container */}
      <div className="ti-scroll flex-1 overflow-y-auto p-6 sm:p-8 max-w-4xl space-y-6">
        
        {/* Toast Alerts */}
        <AnimatePresence mode="wait">
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300 flex items-center gap-2.5"
            >
              <CheckCircle2Icon className="h-5 w-5 text-green-400 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center gap-2.5"
            >
              <AlertCircleIcon className="h-5 w-5 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Tab Selectors */}
        <div className="flex border-b border-ink-800 gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'profile'
                ? 'border-gold text-gold bg-gold/5'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-ink-850/50'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            Profile Settings
          </button>
          
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'security'
                ? 'border-gold text-gold bg-gold/5'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-ink-850/50'
            }`}
          >
            <LockIcon className="h-4 w-4" />
            Password &amp; Security
          </button>
          
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'preferences'
                ? 'border-gold text-gold bg-gold/5'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-ink-850/50'
            }`}
          >
            <SlidersIcon className="h-4 w-4" />
            System Preferences
          </button>
        </div>

        {/* Tab Contents */}
        <div className="bg-ink-950/40 rounded-xl border border-ink-800 p-6 backdrop-blur-md">
          {activeTab === 'profile' && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleUpdateProfile}
              className="space-y-6"
            >
              <div className="border-b border-ink-800 pb-3">
                <h3 className="text-base font-bold text-white">Owner Profile Information</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Update your contact info and personal settings visible to other portal entities.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Username / Login Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={username}
                    className="w-full rounded-lg border border-ink-700 bg-ink-900/60 py-2 px-3 text-sm text-neutral-400 cursor-not-allowed outline-none"
                  />
                  <p className="text-[10px] text-neutral-600">Username cannot be changed as it uniquely identifies your account.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    System Role
                  </label>
                  <div className="w-full flex items-center justify-between rounded-lg border border-ink-700 bg-ink-900/60 py-2 px-3">
                    <span className="text-sm font-bold text-neutral-300 uppercase tracking-wide">
                      {userRole}
                    </span>
                    <span className="rounded bg-gold/10 text-gold px-2 py-0.5 text-[10px] font-black uppercase border border-gold/20">
                      Primary Admin
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-lg border border-ink-700 bg-ink-950/40 py-2 px-3 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full rounded-lg border border-ink-700 bg-ink-950/40 py-2 px-3 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-gold hover:opacity-90 active:scale-[0.98] text-ink-950 py-2 px-4 text-xs font-extrabold transition-all disabled:opacity-50"
                >
                  <SaveIcon className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Profile Details'}
                </button>
              </div>
            </motion.form>
          )}

          {activeTab === 'security' && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handlePasswordChange}
              className="space-y-6"
            >
              <div className="border-b border-ink-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Password &amp; Access Control</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Maintain secure access parameters for your transport control dashboard.
                  </p>
                </div>
                <ShieldAlertIcon className="h-7 w-7 text-amber-500/80 shrink-0" />
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-ink-700 bg-ink-950/40 py-2 pl-3 pr-10 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-neutral-300"
                    >
                      {showCurrent ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-ink-700 bg-ink-950/40 py-2 pl-3 pr-10 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-neutral-300"
                    >
                      {showNew ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-ink-700 bg-ink-950/40 py-2 pl-3 pr-10 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-neutral-300"
                    >
                      {showConfirm ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-gold hover:opacity-90 active:scale-[0.98] text-ink-950 py-2 px-4 text-xs font-extrabold transition-all disabled:opacity-50"
                >
                  <LockIcon className="h-4 w-4" />
                  {loading ? 'Changing...' : 'Change Account Password'}
                </button>
              </div>
            </motion.form>
          )}

          {activeTab === 'preferences' && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSavePreferences}
              className="space-y-6"
            >
              <div className="border-b border-ink-800 pb-3">
                <h3 className="text-base font-bold text-white">System Defaults &amp; Rules</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Customize fallback rates, formatting symbols, alert thresholds, and automation settings.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual Settings Group */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-gold">
                    <GlobeIcon className="h-4 w-4 shrink-0" />
                    Localization &amp; Interface
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-400">
                      Standard Currency Symbol
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full rounded-lg border border-ink-700 bg-ink-900 py-2 px-2.5 text-sm text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    >
                      <option value="₹">Indian Rupee (₹)</option>
                      <option value="$">US Dollar ($)</option>
                      <option value="€">Euro (€)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-400">
                      Default Trip Status After Creation
                    </label>
                    <select
                      value={defaultTripStatus}
                      onChange={(e) => setDefaultTripStatus(e.target.value)}
                      className="w-full rounded-lg border border-ink-700 bg-ink-900 py-2 px-2.5 text-sm text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    >
                      <option value="loading">Loading (default)</option>
                      <option value="in-transit">In Transit</option>
                      <option value="scheduled">Scheduled / Dispatch pending</option>
                    </select>
                  </div>
                </div>

                {/* Operations & Automation */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-gold">
                    <ActivityIcon className="h-4 w-4 shrink-0" />
                    System Rules &amp; Thresholds
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-400">
                      Low Fuel Warning Level (%)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="40"
                      value={fuelAlertThreshold}
                      onChange={(e) => setFuelAlertThreshold(e.target.value)}
                      className="w-full rounded-lg border border-ink-700 bg-ink-950/40 py-2 px-3 text-sm text-white focus:border-gold focus:outline-none"
                    />
                    <p className="text-[10px] text-neutral-600">Triggers UI maintenance alert for fleets dropping below this level.</p>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-xs font-semibold text-neutral-400">
                      Auto-Notifications &amp; Dispatches
                    </span>
                    <div className="space-y-2 pt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={driverNotification}
                          onChange={(e) => setDriverNotification(e.target.checked)}
                          className="accent-gold h-4 w-4"
                        />
                        <span className="text-xs text-neutral-300">
                          Notify driver when trip is dispatched
                        </span>
                      </label>
                      
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={buyerNotification}
                          onChange={(e) => setBuyerNotification(e.target.checked)}
                          className="accent-gold h-4 w-4"
                        />
                        <span className="text-xs text-neutral-300">
                          Auto-email unloading buyer when lorry is en route
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-ink-800">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-gold hover:opacity-90 active:scale-[0.98] text-ink-950 py-2 px-4 text-xs font-extrabold transition-all"
                >
                  <SaveIcon className="h-4 w-4" />
                  Save System Preferences
                </button>
              </div>
            </motion.form>
          )}
        </div>
        
      </div>
    </div>
  );
}
