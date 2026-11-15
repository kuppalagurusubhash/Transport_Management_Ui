import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  WalletCardsIcon,
  PlusIcon,
  CoinsIcon
} from 'lucide-react';
import { authApi } from '../api/index';
import { useOrders } from '../store/OrdersContext';
import { districts } from '../utils/helpers';
import type { DistrictRate } from '../data/types';
import { AddDistrictRateModal } from '../components/ui/AddDistrictRateModal';

export function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'profile' | 'pricing' | 'security' | 'preferences'>(
    (searchParams.get('tab') as any) || 'pricing'
  );
  
  // Feedback Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Orders Context for Rates & Pricing
  const { districtRates, updateDistrictRate, stoneSpecs } = useOrders();
  const [rates, setRates] = useState<DistrictRate[]>([]);
  const [isRatesModified, setIsRatesModified] = useState(false);
  const [isSavingRates, setIsSavingRates] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  // Sync Rates from Context
  useEffect(() => {
    setRates(districtRates || []);
  }, [districtRates]);

  // Sync tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'pricing', 'security', 'preferences'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'profile' | 'pricing' | 'security' | 'preferences') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

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
    triggerToast('success', 'System preferences saved locally!');
  };

  // ── Rates & Pricing Helpers ──────────────────────────────────────────────
  const sellableSpecs = useMemo(() => {
    return Array.from(
      new Map(
        districtRates.map((r) => [
          `${r.size}-${r.thickness}-${r.finish}`,
          { size: r.size, thickness: r.thickness, finish: r.finish }
        ])
      ).values()
    );
  }, [districtRates]);

  const getRamapuramPrice = (size: string, thickness: string, finish: string) => {
    const s = (stoneSpecs || []).find(
      (spec) => spec.size === size && spec.thickness === thickness && spec.finish === finish
    );
    return s?.ratePerSqft ?? 0;
  };

  const rateFor = (
    district: string,
    size: string,
    thickness: string,
    finish: string
  ) =>
    rates.find(
      (r) =>
        r.district === district &&
        r.size === size &&
        r.thickness === thickness &&
        r.finish === finish
    );

  const updateRate = (id: string, value: number) => {
    setRates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ratePerSqft: value } : r))
    );
    setIsRatesModified(true);
  };

  const handleSaveRates = async () => {
    setIsSavingRates(true);
    try {
      const modified = rates.filter((r) => {
        const original = districtRates.find((orig) => orig.id === r.id);
        return original && original.ratePerSqft !== r.ratePerSqft;
      });

      for (const r of modified) {
        await updateDistrictRate(r.id, r.ratePerSqft);
      }
      setIsRatesModified(false);
      triggerToast('success', 'District & Ramapuram rates updated successfully!');
    } catch (err) {
      console.error('Failed to save district rates:', err);
      triggerToast('error', 'Failed to save rate updates.');
    } finally {
      setIsSavingRates(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Page Header */}
      <header className="border-b border-ink-700 bg-ink-950 px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">
              Settings &amp; Configuration
            </h1>
            <p className="mt-0.5 text-sm text-neutral-400">
              Manage quarry procurement rates, Kerala district selling prices, user profile, security, and portal preferences
            </p>
          </div>

          {activeTab === 'pricing' && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-ink-950 transition-all hover:bg-gold-400 shadow-md cursor-pointer"
              >
                <PlusIcon className="h-4 w-4" /> Add District Rate
              </button>
              {isRatesModified && (
                <button
                  type="button"
                  onClick={handleSaveRates}
                  disabled={isSavingRates}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-ink-950 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <SaveIcon className="h-4 w-4" />
                  {isSavingRates ? 'Saving Rates...' : 'Save Rate Changes'}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Settings Container */}
      <div className="ti-scroll flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
        
        {/* Toast Alerts */}
        <AnimatePresence mode="wait">
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300 flex items-center gap-2.5 max-w-4xl"
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
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center gap-2.5 max-w-4xl"
            >
              <AlertCircleIcon className="h-5 w-5 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Tab Selectors */}
        <div className="flex border-b border-ink-800 gap-2 overflow-x-auto pb-px max-w-6xl">
          <button
            onClick={() => handleTabChange('pricing')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'pricing'
                ? 'border-gold text-gold bg-gold/10 rounded-t-lg'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-ink-850/50'
            }`}
          >
            <WalletCardsIcon className="h-4 w-4" />
            Rates &amp; Pricing Matrix
          </button>

          <button
            onClick={() => handleTabChange('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-gold text-gold bg-gold/10 rounded-t-lg'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-ink-850/50'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            Profile Settings
          </button>
          
          <button
            onClick={() => handleTabChange('security')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'security'
                ? 'border-gold text-gold bg-gold/10 rounded-t-lg'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-ink-850/50'
            }`}
          >
            <LockIcon className="h-4 w-4" />
            Password &amp; Security
          </button>
          
          <button
            onClick={() => handleTabChange('preferences')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'preferences'
                ? 'border-gold text-gold bg-gold/10 rounded-t-lg'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-ink-850/50'
            }`}
          >
            <SlidersIcon className="h-4 w-4" />
            System Preferences
          </button>
        </div>

        {/* Tab Contents */}
        <div className="pt-2">

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* TAB: RATES & PRICING MATRIX                                         */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'pricing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Architecture Explanation Banner */}
              <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 flex flex-wrap items-center justify-between gap-4 max-w-6xl shadow-inner">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-2">
                    <CoinsIcon className="h-4 w-4" />
                    Ramapuram Procurement vs Kerala Destination Rate Matrix
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    <strong className="text-amber-400">Our Base Cost (Ramapuram Quarry):</strong> Procurement purchase cost per sqft at the Kadapa quarry yard.
                    <br />
                    <strong className="text-emerald-400">District Order Price:</strong> Selling rate automatically billed to buyers when orders are created for Kerala districts.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="rounded-xl bg-ink-950/80 border border-white/10 px-3.5 py-2 text-center">
                    <span className="text-[10px] text-neutral-400 block uppercase font-medium">Base Quarry</span>
                    <span className="font-mono font-bold text-amber-400">Ramapuram, Kadapa</span>
                  </div>
                  <div className="rounded-xl bg-ink-950/80 border border-white/10 px-3.5 py-2 text-center">
                    <span className="text-[10px] text-neutral-400 block uppercase font-medium">Destinations</span>
                    <span className="font-mono font-bold text-emerald-400">14 Kerala Districts</span>
                  </div>
                </div>
              </div>

              {/* Matrix Table Card */}
              <div className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/60 shadow-xl max-w-6xl">
                <div className="ti-scroll overflow-x-auto">
                  <table className="w-full min-w-[840px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-ink-700 bg-ink-950 text-xs uppercase tracking-[0.08em] text-neutral-400">
                        <th className="sticky left-0 z-10 bg-ink-950 px-4 py-3.5 font-bold text-white">
                          Stone Specification
                        </th>
                        <th className="px-4 py-3.5 font-black text-amber-400 border-r border-ink-800 bg-amber-500/10 text-right">
                          Procurement Rate (Ramapuram)
                        </th>
                        {districts.map((d) => (
                          <th key={d} className="px-4 py-3.5 text-right font-semibold text-neutral-300">
                            {d}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-800 font-mono text-xs">
                      {sellableSpecs.map((spec) => {
                        const ramapuramRate = getRamapuramPrice(spec.size, spec.thickness, spec.finish);

                        return (
                          <tr
                            key={`${spec.size}-${spec.thickness}-${spec.finish}`}
                            className="transition-colors hover:bg-ink-800/40"
                          >
                            <td className="sticky left-0 z-10 bg-ink-900 px-4 py-3 font-sans font-medium text-white border-r border-ink-800">
                              <span className="font-bold">{spec.size}</span>
                              <span className="text-neutral-400 ml-1">({spec.thickness})</span>
                              <span className="ml-2 rounded bg-ink-800 px-1.5 py-0.5 text-[10px] uppercase text-neutral-300 font-semibold">
                                {spec.finish}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right font-bold text-amber-400 border-r border-ink-800 bg-amber-500/5">
                              ₹{ramapuramRate.toFixed(2)}/sqft
                            </td>

                            {districts.map((d) => {
                              const r = rateFor(d, spec.size, spec.thickness, spec.finish);

                              return (
                                <td key={d} className="px-3 py-2 text-right">
                                  {r ? (
                                    <div className="flex items-center justify-end gap-1">
                                      <span className="text-neutral-500 font-mono text-[11px]">₹</span>
                                      <input
                                        type="number"
                                        step="0.5"
                                        value={r.ratePerSqft}
                                        onChange={(e) => updateRate(r.id, parseFloat(e.target.value) || 0)}
                                        className="w-16 rounded border border-ink-700 bg-ink-950 px-2 py-1 text-right font-mono text-xs text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-neutral-600">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {isRatesModified && (
                  <div className="p-3 bg-amber-500/10 border-t border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
                    <span>⚠️ You have unsaved rate adjustments.</span>
                    <button
                      type="button"
                      onClick={handleSaveRates}
                      disabled={isSavingRates}
                      className="rounded-lg bg-gold hover:bg-gold-400 text-ink-950 font-bold px-3 py-1 text-xs transition-all cursor-pointer"
                    >
                      {isSavingRates ? 'Saving...' : 'Apply & Save Rate Changes'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* TAB: PROFILE SETTINGS                                               */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleUpdateProfile}
              className="rounded-2xl border border-ink-700 bg-ink-900/60 p-6 space-y-6 max-w-3xl shadow-xl"
            >
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-gold" />
                  Owner Profile Details
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Update your contact info and personal settings visible to other portal entities.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Username (Login Identifier)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={username}
                    className="w-full rounded-lg border border-ink-800 bg-ink-950/80 py-2.5 px-3 text-sm text-neutral-500 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-neutral-600">Fixed system account name.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Account Role
                  </label>
                  <input
                    type="text"
                    disabled
                    value={userRole.toUpperCase()}
                    className="w-full rounded-lg border border-ink-800 bg-ink-950/80 py-2.5 px-3 text-sm text-gold font-bold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Display / Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Sri Sai Baba Owner"
                    className="w-full rounded-lg border border-ink-700 bg-ink-950/40 py-2.5 px-3 text-sm text-white focus:border-gold focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Contact Phone (WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98480 22338"
                    className="w-full rounded-lg border border-ink-700 bg-ink-950/40 py-2.5 px-3 text-sm text-white focus:border-gold focus:outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-ink-800">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-gold hover:opacity-90 active:scale-[0.98] text-ink-950 py-2.5 px-5 text-xs font-extrabold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <SaveIcon className="h-4 w-4" />
                  {loading ? 'Saving Profile...' : 'Save Profile Changes'}
                </button>
              </div>
            </motion.form>
          )}

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* TAB: PASSWORD & SECURITY                                            */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'security' && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handlePasswordChange}
              className="rounded-2xl border border-ink-700 bg-ink-900/60 p-6 space-y-6 max-w-3xl shadow-xl"
            >
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <LockIcon className="h-5 w-5 text-gold" />
                  Update Credentials &amp; Security Key
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Ensure strong passwords containing numbers and symbols to secure owner dashboard functions.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-ink-700 bg-ink-950/40 py-2.5 px-3 pr-10 text-sm text-white focus:border-gold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                    >
                      {showCurrent ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full rounded-lg border border-ink-700 bg-ink-950/40 py-2.5 px-3 pr-10 text-sm text-white focus:border-gold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                      >
                        {showNew ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full rounded-lg border border-ink-700 bg-ink-950/40 py-2.5 px-3 pr-10 text-sm text-white focus:border-gold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                      >
                        {showConfirm ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-ink-800">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-gold hover:opacity-90 active:scale-[0.98] text-ink-950 py-2.5 px-5 text-xs font-extrabold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <ShieldAlertIcon className="h-4 w-4" />
                  {loading ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </motion.form>
          )}

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* TAB: SYSTEM PREFERENCES                                             */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'preferences' && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSavePreferences}
              className="rounded-2xl border border-ink-700 bg-ink-900/60 p-6 space-y-6 max-w-3xl shadow-xl"
            >
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <SlidersIcon className="h-5 w-5 text-gold" />
                  Logistics &amp; Operational Preferences
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Customize fallback rates, formatting symbols, alert thresholds, and automation settings.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                      Default Currency Display
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full rounded-lg border border-ink-700 bg-ink-950/40 py-2.5 px-3 text-sm text-white focus:border-gold focus:outline-none"
                    >
                      <option value="₹">INR (₹) - Indian Rupee</option>
                      <option value="$">USD ($) - US Dollar</option>
                      <option value="AED">AED (د.إ) - UAE Dirham</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                      New Assignment Default Status
                    </label>
                    <select
                      value={defaultTripStatus}
                      onChange={(e) => setDefaultTripStatus(e.target.value)}
                      className="w-full rounded-lg border border-ink-700 bg-ink-950/40 py-2.5 px-3 text-sm text-white focus:border-gold focus:outline-none"
                    >
                      <option value="loading">Loading Stage (Quarry)</option>
                      <option value="in-transit">In-Transit (Dispatched)</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-ink-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <p className="text-[10px] text-neutral-500">Triggers UI alert for vehicles dropping below this percentage.</p>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-xs font-semibold text-neutral-400">
                      Auto-Notifications &amp; WhatsApp Alerts
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
                          Auto-notify driver via WhatsApp on trip dispatch
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
                          Auto-notify buyer when vehicle is en-route
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-ink-800">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-gold hover:opacity-90 active:scale-[0.98] text-ink-950 py-2.5 px-5 text-xs font-extrabold transition-all shadow-md cursor-pointer"
                >
                  <SaveIcon className="h-4 w-4" />
                  Save System Preferences
                </button>
              </div>
            </motion.form>
          )}
        </div>
        
      </div>

      {/* Add District Rate Modal */}
      {isAddModalOpen && (
        <AddDistrictRateModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}
