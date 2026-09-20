import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboardIcon,
  TruckIcon,
  LayersIcon,
  HistoryIcon,
  UserIcon,
  WalletIcon,
  FileTextIcon,
  BellIcon,
  SettingsIcon,
  HeadphonesIcon,
  ArrowLeftIcon,
  LogOutIcon,
  RefreshCwIcon,
  MapPinIcon,
  CalendarIcon,
  ChevronRightIcon,
  PlusIcon,
  CameraIcon,
  SparklesIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  CoinsIcon,
  SearchIcon,
  XIcon,
  EyeIcon,
  UploadIcon,
  PhoneIcon,
  AwardIcon,
  WrenchIcon,
  PhoneCallIcon,
  ChevronDownIcon,
  CheckIcon,
  FilterIcon,
  ExternalLinkIcon,
  MenuIcon
} from 'lucide-react';
import { useOrders } from '../store/OrdersContext';
import { formatINR } from '../utils/helpers';
import { 
  type LoadingPartyPayment, 
  type Trip, 
  type UnloadingParty, 
  type LoadingParty, 
  type DistrictRate,
  type ExpenseLine
} from '../data/types';
import { ExpensePaperScannerModal } from '../components/ExpensePaperScannerModal';

// --- SUBCOMPONENT: Active Trip Settlement Card ---
interface TripSettlementCardProps {
  trip: Trip;
  unloadingParties: UnloadingParty[];
  loadingParties: LoadingParty[];
  districtRates: DistrictRate[];
  updateTripPayments: (tripId: string, cash: number, phonePe: number, pieces: number, cut: number) => void;
  completeTrip: (tripId: string) => void;
  updateLoadingPartyPayments: (tripId: string, payments: LoadingPartyPayment[]) => void;
}

function TripSettlementCard({
  trip,
  unloadingParties,
  loadingParties,
  districtRates,
  updateTripPayments,
  completeTrip,
  updateLoadingPartyPayments
}: TripSettlementCardProps) {
  const activeBuyer = unloadingParties.find((up) => up.id === trip.unloadingPartyId);

  const [partyCash, setPartyCash] = useState<string>('');
  const [partyPhonePe, setPartyPhonePe] = useState<string>('');
  const [damagedPieces, setDamagedPieces] = useState<string>('0');
  const [damageDeduction, setDamageDeduction] = useState<string>('0');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState<boolean>(false);

  useEffect(() => {
    setPartyCash(trip.partyToDriverCash !== undefined ? String(trip.partyToDriverCash) : '0');
    setPartyPhonePe(trip.partyToOwnerPhonePe !== undefined ? String(trip.partyToOwnerPhonePe) : '0');
    setDamagedPieces(trip.damagedPieces !== undefined ? String(trip.damagedPieces) : '0');
    setDamageDeduction(trip.damageDeduction !== undefined ? String(trip.damageDeduction) : '0');
  }, [trip]);

  const [selectedLPId, setSelectedLPId] = useState<string>('');
  const [quarryAmountPaid, setQuarryAmountPaid] = useState<string>('');
  const [quarryPaymentStatus, setQuarryPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [quarryPaymentMode, setQuarryPaymentMode] = useState<'cash' | 'phonepe' | 'bank_transfer' | 'unspecified'>('cash');
  const [showQuarryPaymentSuccess, setShowQuarryPaymentSuccess] = useState<boolean>(false);

  const tripLoadingPartyIds = useMemo(() => {
    return Array.from(new Set((trip.stoneLines || []).map(line => line.loadingPartyId)));
  }, [trip]);

  useEffect(() => {
    if (tripLoadingPartyIds.length > 0) {
      setSelectedLPId(tripLoadingPartyIds[0]);
    } else {
      setSelectedLPId('');
    }
  }, [tripLoadingPartyIds]);

  const selectedLPPayment = useMemo(() => {
    if (!selectedLPId) return null;
    return (trip.loadingPartyPayments || []).find(p => p.loadingPartyId === selectedLPId);
  }, [trip, selectedLPId]);

  useEffect(() => {
    if (selectedLPPayment) {
      setQuarryAmountPaid(String(selectedLPPayment.amountPaid));
      setQuarryPaymentStatus(selectedLPPayment.status);
      setQuarryPaymentMode(selectedLPPayment.paymentMode || 'cash');
    } else {
      setQuarryAmountPaid('0');
      setQuarryPaymentStatus('pending');
      setQuarryPaymentMode('cash');
    }
  }, [selectedLPId, selectedLPPayment]);

  const quarryLoadedValue = useMemo(() => {
    if (!selectedLPId) return 0;
    return (trip.stoneLines || [])
      .filter(line => line.loadingPartyId === selectedLPId)
      .reduce((sum, line) => sum + (line.sqftPerPiece * line.pieces * line.ratePerSqft), 0);
  }, [trip, selectedLPId]);

  const tripUnloadingValue = useMemo(() => {
    if (!activeBuyer) return 0;
    return trip.stoneLines.reduce((sum, line) => {
      const rate = districtRates.find(
        (r) =>
          r.district === activeBuyer.district &&
          r.size === line.size &&
          r.thickness === line.thickness &&
          r.finish === line.finish
      )?.ratePerSqft || line.ratePerSqft;
      
      const sqft = line.sqftPerPiece * line.pieces;
      return sum + (sqft * rate);
    }, 0);
  }, [trip, activeBuyer, districtRates]);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTripPayments(
      trip.id,
      Number(partyCash || 0),
      Number(partyPhonePe || 0),
      Number(damagedPieces || 0),
      Number(damageDeduction || 0)
    );
    setShowPaymentSuccess(true);
    setTimeout(() => setShowPaymentSuccess(false), 3000);
  };

  const handleQuarryPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLPId) return;

    const currentPayments = [...(trip.loadingPartyPayments || [])];
    const index = currentPayments.findIndex(p => p.loadingPartyId === selectedLPId);

    const newPayment: LoadingPartyPayment = {
      id: selectedLPPayment?.id || `lpp-${Date.now()}`,
      loadingPartyId: selectedLPId,
      amountPaid: Number(quarryAmountPaid || 0),
      paidBy: 'driver',
      status: quarryPaymentStatus,
      paymentMode: quarryPaymentMode
    };

    if (index >= 0) {
      currentPayments[index] = newPayment;
    } else {
      currentPayments.push(newPayment);
    }

    updateLoadingPartyPayments(trip.id, currentPayments);
    setShowQuarryPaymentSuccess(true);
    setTimeout(() => setShowQuarryPaymentSuccess(false), 3000);
  };

  return (
    <div className="rounded-2xl border border-ink-800 bg-[#121216] p-6 space-y-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between border-b border-ink-800 pb-4 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 text-gold border border-gold/30">
            <CoinsIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Trip Settlement &amp; Unloading Ledger
            </h3>
            <p className="text-[11px] text-neutral-400">Record cash received, digital transfers, and quarry disbursements</p>
          </div>
        </div>
        <span className="rounded-full bg-gold/15 text-gold border border-gold/30 px-3 py-1 text-xs font-black uppercase font-mono tracking-wider">
          Trip: {trip.code}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 bg-[#18181f] p-4 rounded-xl border border-ink-800">
          <MapPinIcon className="h-6 w-6 text-gold shrink-0" />
          <div>
            <p className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Origin Point</p>
            <p className="text-sm font-bold text-white">{trip.origin || 'Quarry Cluster'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#18181f] p-4 rounded-xl border border-ink-800">
          <MapPinIcon className="h-6 w-6 text-green-400 shrink-0" />
          <div>
            <p className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Destination Buyer</p>
            <p className="text-sm font-bold text-white truncate max-w-[200px]">
              {activeBuyer?.name} ({activeBuyer?.district})
            </p>
          </div>
        </div>
      </div>

      {/* Record Party Payment & Damage Cost Cuts */}
      <div className="border-t border-ink-800 pt-5 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
            <CoinsIcon className="h-4 w-4 text-gold" />
            Buyer Payments Received &amp; Damage Deductions
          </h4>
          <span className="text-xs font-extrabold text-gold bg-gold/10 px-2.5 py-1 rounded-md border border-gold/20 font-mono">
            Expected Load Value: {formatINR(tripUnloadingValue)}
          </span>
        </div>

        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-400">Cash Received by Driver</label>
              <input
                type="number"
                min="0"
                value={partyCash}
                onChange={(e) => setPartyCash(e.target.value)}
                placeholder="₹ Cash to driver"
                className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-400">PhonePe Directly to Owner</label>
              <input
                type="number"
                min="0"
                value={partyPhonePe}
                onChange={(e) => setPartyPhonePe(e.target.value)}
                placeholder="₹ UPI to Owner"
                className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-400">Damaged Pieces at Site</label>
              <input
                type="number"
                min="0"
                value={damagedPieces}
                onChange={(e) => setDamagedPieces(e.target.value)}
                placeholder="Count of broken stones"
                className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-400">Damage Cost Deducted (₹)</label>
              <input
                type="number"
                min="0"
                value={damageDeduction}
                onChange={(e) => setDamageDeduction(e.target.value)}
                placeholder="₹ Amount cut by buyer"
                className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs text-neutral-400 font-mono">
              Total Logged: <strong className="text-green-400">{formatINR(Number(partyCash || 0) + Number(partyPhonePe || 0))}</strong>
            </div>
            <button
              type="submit"
              className="rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-ink-950 hover:bg-gold-400 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Save Buyer Collections
            </button>
          </div>
        </form>

        <AnimatePresence>
          {showPaymentSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-xs text-green-300"
            >
              <CheckCircle2Icon className="h-4 w-4 shrink-0" />
              Buyer payment &amp; damage deductions saved successfully.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Driver Payment to Quarry (Loading Party) */}
      <div className="border-t border-ink-800 pt-5 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
            <TruckIcon className="h-4 w-4 text-gold" />
            Quarry Loading Party Disbursement (Paid by Driver)
          </h4>
          {selectedLPId && (
            <span className="text-xs font-extrabold text-neutral-300 bg-[#18181f] px-2.5 py-1 rounded-md border border-ink-800 font-mono">
              Quarry Stone Value: {formatINR(quarryLoadedValue)}
            </span>
          )}
        </div>

        {tripLoadingPartyIds.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {tripLoadingPartyIds.map(lpId => {
              const lp = loadingParties.find(p => p.id === lpId);
              const isSelected = selectedLPId === lpId;
              const pRecord = (trip.loadingPartyPayments || []).find(p => p.loadingPartyId === lpId);
              return (
                <button
                  key={lpId}
                  type="button"
                  onClick={() => setSelectedLPId(lpId)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-gold text-ink-950 shadow-md' 
                      : 'bg-[#18181f] text-neutral-400 hover:text-white border border-ink-800'
                  }`}
                >
                  {lp?.name || 'Quarry'} {pRecord?.status === 'paid' ? '✓' : ''}
                </button>
              );
            })}
          </div>
        )}

        {selectedLPId ? (
          <form onSubmit={handleQuarryPaymentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-400">Amount Paid at Quarry</label>
                <input
                  type="number"
                  min="0"
                  value={quarryAmountPaid}
                  onChange={(e) => setQuarryAmountPaid(e.target.value)}
                  placeholder="₹ Amount driver gave quarry"
                  className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-400">Payment Mode</label>
                <select
                  value={quarryPaymentMode}
                  onChange={(e: any) => setQuarryPaymentMode(e.target.value)}
                  className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                >
                  <option value="cash">Cash Given by Driver</option>
                  <option value="phonepe">PhonePe / UPI from Quarry</option>
                  <option value="bank_transfer">Direct Bank Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-400">Settlement Status</label>
                <select
                  value={quarryPaymentStatus}
                  onChange={(e: any) => setQuarryPaymentStatus(e.target.value)}
                  className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                >
                  <option value="paid">Paid &amp; Cleared</option>
                  <option value="pending">Pending / On Credit</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="rounded-xl bg-[#24242e] hover:bg-[#2c2c38] border border-ink-600 px-5 py-2.5 text-xs font-bold text-white transition-all active:scale-95 cursor-pointer"
              >
                Save Quarry Disbursement
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-neutral-500 italic">No loading quarry assigned to this dispatch yet.</p>
        )}

        <AnimatePresence>
          {showQuarryPaymentSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-xs text-green-300"
            >
              <CheckCircle2Icon className="h-4 w-4 shrink-0" />
              Quarry payment updated and logged into ledger.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Complete Trip Action */}
      <div className="border-t border-ink-800 pt-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-white">Finished Delivery?</span>
          <p className="text-[11px] text-neutral-400">
            Completing marks the load as delivered and logs all finances into owner accounting.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Mark trip ${trip.code} as completed and delivered?`)) {
              completeTrip(trip.id);
            }
          }}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <CheckCircle2Icon className="h-4 w-4" />
          Mark Delivery Completed
        </button>
      </div>
    </div>
  );
}

// --- MAIN DRIVER PORTAL COMPONENT ---
export function DriverPortal() {
  const {
    trips,
    drivers,
    lorries,
    addExpenseToTrip,
    addBatchExpensesToTrip,
    unloadingParties,
    updateTripPayments,
    districtRates,
    completeTrip,
    loadingParties,
    updateLoadingPartyPayments,
    syncDatabase
  } = useOrders();

  const navigate = useNavigate();
  const location = useLocation();

  // Mobile sidebar drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Syncing state animation
  const [isSyncing, setIsSyncing] = useState(false);

  // Determine active view from URL subpath
  const currentView = useMemo(() => {
    const p = location.pathname;
    if (p.includes('/driver/active')) return 'active';
    if (p.includes('/driver/details')) return 'details';
    if (p.includes('/driver/history')) return 'history';
    if (p.includes('/driver/profile') || p.includes('/driver/info')) return 'profile';
    if (p.includes('/driver/expenses')) return 'expenses';
    if (p.includes('/driver/documents') || p.includes('/driver/chits')) return 'documents';
    if (p.includes('/driver/notifications')) return 'notifications';
    if (p.includes('/driver/settings')) return 'settings';
    return 'dashboard';
  }, [location.pathname]);

  const setView = (view: string) => {
    setMobileSidebarOpen(false);
    if (view === 'dashboard') navigate('/driver');
    else navigate(`/driver/${view}`);
  };

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState<boolean>(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [viewReceiptModalUrl, setViewReceiptModalUrl] = useState<string | null>(null);

  // Driver switch dropdown state in header
  const [driverMenuOpen, setDriverMenuOpen] = useState(false);

  // Authentication & identity
  const userRole = localStorage.getItem('userRole');
  const isDedicatedDriver = userRole === 'driver';
  const savedDriverRef = localStorage.getItem('driverRef');

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    localStorage.removeItem('buyerRef');
    localStorage.removeItem('driverRef');
    navigate('/login');
  };

  // Selected Driver identity (supports Owner inspecting driver accounts)
  const [selectedDriverId, setSelectedDriverId] = useState<string>(() => {
    return savedDriverRef || '';
  });

  useEffect(() => {
    if (isDedicatedDriver) {
      if (savedDriverRef) {
        setSelectedDriverId(savedDriverRef);
      }
    } else if (drivers.length > 0) {
      if (savedDriverRef && drivers.some((d) => d.id === savedDriverRef)) {
        setSelectedDriverId(savedDriverRef);
      } else if (!selectedDriverId) {
        setSelectedDriverId(drivers[0].id);
      }
    }
  }, [drivers, selectedDriverId, isDedicatedDriver, savedDriverRef]);

  const currentDriver = drivers.find((d) => d.id === selectedDriverId) || drivers[0] || {
    id: 'drv-default',
    name: 'RAJESH',
    phone: '1234567890',
    status: 'active',
    joinedOn: '15 Jan 2024',
    tripsCompleted: 14,
    lorryId: 'lorry-1'
  };

  // Active and Completed Trips for current driver
  const activeTrips = useMemo(() => {
    return trips.filter(
      (t) => t.driverId === currentDriver.id && (t.status === 'loading' || t.status === 'in-transit')
    );
  }, [trips, currentDriver]);

  const activeTrip = activeTrips[0] || null;

  const completedTrips = useMemo(() => {
    return trips.filter(
      (t) => t.driverId === currentDriver.id && t.status !== 'loading' && t.status !== 'in-transit'
    );
  }, [trips, currentDriver]);

  // Active Lorry
  const activeLorry = useMemo(() => {
    return lorries.find((l) => l.id === currentDriver.lorryId || l.driverId === currentDriver.id) || {
      id: 'l-default',
      plate: 'AP-02 BH 3666',
      capacitySqft: 3200,
      addedOn: '2024-02-10',
      status: 'active',
      location: 'NH-44 Corridor / Palakkad Route'
    };
  }, [currentDriver, lorries]);

  // Selected trip for details inspector
  const [inspectedTripId, setInspectedTripId] = useState<string>('');

  useEffect(() => {
    if (!inspectedTripId) {
      if (activeTrips.length > 0) {
        setInspectedTripId(activeTrips[0].id);
      } else if (completedTrips.length > 0) {
        setInspectedTripId(completedTrips[0].id);
      }
    }
  }, [activeTrips, completedTrips, inspectedTripId]);

  const inspectedTrip = useMemo(() => {
    return trips.find(t => t.id === inspectedTripId) || activeTrips[0] || completedTrips[0] || null;
  }, [trips, inspectedTripId, activeTrips, completedTrips]);

  // Active Buyer for active trip
  const activeBuyer = useMemo(() => {
    if (!activeTrip) return null;
    return unloadingParties.find(up => up.id === activeTrip.unloadingPartyId) || {
      id: 'up-default',
      name: 'Subhash Buyer',
      district: 'Palakkad',
      phone: '+91 94471 23456'
    };
  }, [activeTrip, unloadingParties]);

  // Expected Load Value for active trip
  const expectedLoadValue = useMemo(() => {
    if (!activeTrip) return 0;
    return (activeTrip.stoneLines || []).reduce((sum, line) => {
      const rate = districtRates.find(
        (r) =>
          r.district === (activeBuyer?.district || 'Palakkad') &&
          r.size === line.size &&
          r.thickness === line.thickness &&
          r.finish === line.finish
      )?.ratePerSqft || line.ratePerSqft;
      return sum + (line.sqftPerPiece * line.pieces * rate);
    }, 0);
  }, [activeTrip, activeBuyer, districtRates]);

  // Consolidated active expenses
  const consolidatedActiveExpenses = useMemo(() => {
    return activeTrips.flatMap(t => 
      (t.expenses || []).map(e => ({
        ...e,
        tripId: t.id,
        tripCode: t.code,
        tripDate: t.date
      }))
    );
  }, [activeTrips]);

  const todayExpensesTotal = useMemo(() => {
    return consolidatedActiveExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [consolidatedActiveExpenses]);

  // Buyer Collection on active trip
  const activeBuyerCollection = useMemo(() => {
    if (!activeTrip) return 0;
    return Number(activeTrip.partyToDriverCash || 0) + Number(activeTrip.partyToOwnerPhonePe || 0);
  }, [activeTrip]);

  const pendingCollection = Math.max(0, expectedLoadValue - activeBuyerCollection);

  // Historical expenses
  const historicalExpenses = useMemo(() => {
    return completedTrips.flatMap((t) =>
      (t.expenses || []).map((e) => ({
        ...e,
        tripCode: t.code,
        tripDate: t.date,
      }))
    );
  }, [completedTrips]);

  // Manual expense modal inputs
  const [modalExpenseLabel, setModalExpenseLabel] = useState('');
  const [modalExpenseAmount, setModalExpenseAmount] = useState('');
  const [modalExpenseCategory, setModalExpenseCategory] = useState<'fuel' | 'toll' | 'maintenance' | 'other'>('fuel');

  const handleCreateManualExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalExpenseLabel.trim() || !modalExpenseAmount) return;
    const targetTripId = activeTrip?.id || (completedTrips[0]?.id) || 'general';
    addExpenseToTrip(targetTripId, modalExpenseLabel, Number(modalExpenseAmount));
    setModalExpenseLabel('');
    setModalExpenseAmount('');
    setIsAddExpenseModalOpen(false);
  };

  // Upload Chit Modal inputs
  const [uploadChitLabel, setUploadChitLabel] = useState('');
  const [uploadChitAmount, setUploadChitAmount] = useState('');
  const [uploadChitCategory, setUploadChitCategory] = useState<'delivery_slip' | 'cost_chit' | 'other'>('cost_chit');
  const [uploadChitFile, setUploadChitFile] = useState<string | null>(null);

  const handleUploadChitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetTripId = activeTrip?.id || (completedTrips[0]?.id) || 'general';
    addExpenseToTrip(
      targetTripId,
      uploadChitLabel || (uploadChitCategory === 'delivery_slip' ? 'Delivery Chit Slip' : 'Handwritten Cost Paper'),
      Number(uploadChitAmount || 0),
      'other',
      uploadChitFile || undefined
    );
    setUploadChitLabel('');
    setUploadChitAmount('');
    setUploadChitFile(null);
    setIsUploadModalOpen(false);
  };

  // Tab states on Dashboard cards
  const [notifTab, setNotifTab] = useState<'all' | 'tasks' | 'updates'>('all');
  const [docsFilter, setDocsFilter] = useState<'all' | 'delivery' | 'cost' | 'other'>('all');

  // Documents list (extracted from receiptUrls across active & completed trips)
  const allDocuments = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      category: 'delivery_slip' | 'cost_chit' | 'other';
      tripCode: string;
      date: string;
      url: string;
      amount?: number;
    }> = [];

    trips.forEach(t => {
      (t.expenses || []).forEach(e => {
        if (e.receiptUrl) {
          list.push({
            id: e.id,
            title: e.label,
            category: e.label.toLowerCase().includes('delivery') ? 'delivery_slip' : 'cost_chit',
            tripCode: t.code,
            date: t.date,
            url: e.receiptUrl,
            amount: e.amount
          });
        }
      });
    });

    return list;
  }, [trips]);

  const filteredDocuments = useMemo(() => {
    if (docsFilter === 'all') return allDocuments;
    if (docsFilter === 'delivery') return allDocuments.filter(d => d.category === 'delivery_slip');
    if (docsFilter === 'cost') return allDocuments.filter(d => d.category === 'cost_chit');
    return allDocuments.filter(d => d.category === 'other');
  }, [allDocuments, docsFilter]);

  // Notifications mock data (driver specific)
  const notificationsList = [
    {
      id: 'n-1',
      type: 'task',
      level: 'danger',
      title: 'Upload delivery slip',
      description: 'Please scan and upload written slip at delivery',
      time: '2h ago'
    },
    {
      id: 'n-2',
      type: 'task',
      level: 'warning',
      title: 'Add trip expenses',
      description: 'Log your expenses for today',
      time: '3h ago'
    },
    {
      id: 'n-3',
      type: 'update',
      level: 'success',
      title: 'Trip started',
      description: `${activeTrip?.code || 'TRP-1056'} marked as en route`,
      time: '6h ago'
    }
  ];

  const filteredNotifications = useMemo(() => {
    if (notifTab === 'all') return notificationsList;
    if (notifTab === 'tasks') return notificationsList.filter(n => n.type === 'task');
    return notificationsList.filter(n => n.type === 'update');
  }, [notifTab, notificationsList]);

  // Trigger live sync
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    await syncDatabase().catch(() => {});
    setTimeout(() => setIsSyncing(false), 800);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0a0a0d] text-neutral-200 font-sans antialiased selection:bg-gold selection:text-ink-950">

      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR (EXACT REPLICA OF SCREENSHOT) */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-[#1c1c22] bg-[#09090c] p-4 shrink-0 select-none z-30">
        <div className="space-y-6">
          
          {/* Top Branding */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold font-black text-ink-950 text-xl shadow-[0_2px_12px_rgba(212,175,55,0.35)]">
              DP
            </div>
            <div>
              <h1 className="text-base font-black tracking-wider text-white uppercase leading-none">
                TRANSIA
              </h1>
              <span className="text-xs font-bold text-gold block mt-0.5">
                Driver Fleet
              </span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-500 font-medium px-2 -mt-3">
            On-Road Dispatch &amp; Paper Scanner System
          </p>

          {/* Navigation Menu Items */}
          <nav className="space-y-1 pt-1">
            
            {/* 1. Dashboard */}
            <button
              type="button"
              onClick={() => setView('dashboard')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboardIcon className="h-4 w-4 shrink-0" />
                <span>Dashboard</span>
              </div>
            </button>

            {/* 2. Active Trip */}
            <button
              type="button"
              onClick={() => setView('active')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'active'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <TruckIcon className="h-4 w-4 shrink-0" />
                <span>Active Trip</span>
              </div>
            </button>

            {/* 3. Trip Details & Spec */}
            <button
              type="button"
              onClick={() => setView('details')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'details'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayersIcon className="h-4 w-4 shrink-0" />
                <span>Trip Details &amp; Spec</span>
              </div>
            </button>

            {/* 4. Trip History & Logs */}
            <button
              type="button"
              onClick={() => setView('history')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'history'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <HistoryIcon className="h-4 w-4 shrink-0" />
                <span>Trip History &amp; Logs</span>
              </div>
              <span className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                currentView === 'history' ? 'bg-ink-950 text-gold' : 'bg-[#18181f] text-neutral-400'
              }`}>
                {completedTrips.length || 7}
              </span>
            </button>

            {/* 5. Driver Info & Lorry */}
            <button
              type="button"
              onClick={() => setView('profile')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'profile'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserIcon className="h-4 w-4 shrink-0" />
                <span>Driver Info &amp; Lorry</span>
              </div>
            </button>

            {/* 6. Expenses */}
            <button
              type="button"
              onClick={() => setView('expenses')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'expenses'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <WalletIcon className="h-4 w-4 shrink-0" />
                <span>Expenses</span>
              </div>
            </button>

            {/* 7. Documents / Chits */}
            <button
              type="button"
              onClick={() => setView('documents')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'documents'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileTextIcon className="h-4 w-4 shrink-0" />
                <span>Documents / Chits</span>
              </div>
            </button>

            {/* 8. Notifications */}
            <button
              type="button"
              onClick={() => setView('notifications')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'notifications'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <BellIcon className="h-4 w-4 shrink-0" />
                <span>Notifications</span>
              </div>
              <span className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                currentView === 'notifications' ? 'bg-ink-950 text-gold' : 'bg-[#18181f] text-neutral-400'
              }`}>
                3
              </span>
            </button>

            {/* 9. Settings */}
            <button
              type="button"
              onClick={() => setView('settings')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                currentView === 'settings'
                  ? 'bg-gold text-ink-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:bg-[#14141a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <SettingsIcon className="h-4 w-4 shrink-0" />
                <span>Settings</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-4 pt-4 border-t border-[#1a1a20]">
          {/* Need Help Card */}
          <button
            type="button"
            onClick={() => setIsSupportModalOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl border border-[#22222a] bg-[#121217] p-3 text-left transition-all hover:border-gold/40 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gold group-hover:text-ink-950 transition-colors">
                <HeadphonesIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">Need Help?</p>
                <p className="text-[10px] text-neutral-500">Contact Support</p>
              </div>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-neutral-500 group-hover:text-gold transition-colors" />
          </button>

          <div className="px-2 text-[10px] text-neutral-600 space-y-0.5">
            <p className="font-semibold text-neutral-500">TRANSIA v1.0</p>
            <p>Drive Progress Together</p>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN WORKSPACE / CONTENT AREA */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#1c1c22] bg-[#09090c]/95 backdrop-blur px-4 sm:px-8">
          
          {/* Left Header Badges */}
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden rounded-lg p-1.5 text-neutral-400 hover:text-white"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            {/* En Route Pill */}
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{activeTrip ? `En Route (${activeTrip.code})` : 'Standby / Idle'}</span>
            </div>

            {/* Owner View Badge */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-extrabold text-gold uppercase tracking-wider">
              <EyeIcon className="h-3.5 w-3.5" />
              <span>OWNER VIEW</span>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-3">
            
            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setView('notifications')}
              className="relative rounded-full p-2 text-neutral-400 hover:bg-[#16161c] hover:text-white transition-colors cursor-pointer"
            >
              <BellIcon className="h-4 w-4" />
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold font-black text-ink-950 text-[9px]">
                3
              </span>
            </button>

            {/* Driver Profile Switcher Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDriverMenuOpen(!driverMenuOpen)}
                className="flex items-center gap-2 rounded-xl border border-[#22222a] bg-[#141419] px-3 py-1.5 text-xs font-bold text-white hover:border-gold/40 transition-all cursor-pointer"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-ink-950 font-black text-[11px]">
                  {currentDriver.name.charAt(0)}
                </span>
                <span className="uppercase">{currentDriver.name}</span>
                <ChevronDownIcon className="h-3.5 w-3.5 text-neutral-400" />
              </button>

              {/* Driver switch dropdown for owner testing */}
              <AnimatePresence>
                {driverMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-ink-700 bg-ink-950 p-2 shadow-2xl z-50 space-y-1"
                  >
                    <div className="px-2 py-1 text-[10px] uppercase font-bold text-neutral-500">
                      Switch Driver Account
                    </div>
                    {drivers.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setSelectedDriverId(d.id);
                          setDriverMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left cursor-pointer ${
                          selectedDriverId === d.id ? 'bg-gold text-ink-950 font-bold' : 'text-neutral-300 hover:bg-ink-900'
                        }`}
                      >
                        <span>{d.name}</span>
                        <span className="text-[10px] opacity-75">{d.status}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Return to Dashboard */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-bold text-gold hover:bg-gold hover:text-ink-950 transition-all"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Return to Dashboard</span>
            </Link>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#22222a] bg-[#141419] px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-red-400 hover:border-red-500/40 transition-all cursor-pointer"
            >
              <LogOutIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay Drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <motion.div
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                onClick={(e) => e.stopPropagation()}
                className="h-full w-64 bg-[#09090c] p-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-ink-800">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold font-black text-ink-950">
                        DP
                      </div>
                      <span className="font-bold text-white">TRANSIA Driver</span>
                    </div>
                    <button onClick={() => setMobileSidebarOpen(false)}>
                      <XIcon className="h-5 w-5 text-neutral-400" />
                    </button>
                  </div>
                  <nav className="space-y-1">
                    {['dashboard', 'active', 'details', 'history', 'profile', 'expenses', 'documents', 'notifications', 'settings'].map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`w-full text-left capitalize px-3 py-2 text-xs font-bold rounded-lg ${
                          currentView === v ? 'bg-gold text-ink-950' : 'text-neutral-300'
                        }`}
                      >
                        {v.replace('-', ' ')}
                      </button>
                    ))}
                  </nav>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================= */}
        {/* 3. MAIN BODY VIEWS */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">

          {/* ------------------------------------------------------- */}
          {/* VIEW: DASHBOARD (EXACT MATCH OF USER SCREENSHOT) */}
          {/* ------------------------------------------------------- */}
          {currentView === 'dashboard' && (
            <motion.div
              key="view-dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Top Hero Welcome Card */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1e1e26] text-gold text-2xl font-black border border-[#2b2b36]">
                    {currentDriver.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-neutral-400 font-medium">Welcome back,</p>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-white uppercase tracking-tight">
                        {currentDriver.name}
                      </h2>
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black text-emerald-400 uppercase">
                        ACTIVE
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 pt-0.5">
                      <span className="flex items-center gap-1 text-neutral-300">
                        <PhoneIcon className="h-3.5 w-3.5 text-neutral-500" /> {currentDriver.phone}
                      </span>
                      <span className="text-neutral-600">|</span>
                      <span className="flex items-center gap-1">
                        <TruckIcon className="h-3.5 w-3.5 text-neutral-500" /> Assigned Lorry: <strong className="text-white ml-0.5">{activeLorry?.plate}</strong>
                      </span>
                      <span className="text-neutral-600">|</span>
                      <span className="flex items-center gap-1">
                        <FileTextIcon className="h-3.5 w-3.5 text-neutral-500" /> Current Trip: <strong className="text-white ml-0.5">{activeTrip?.code || 'TRP-1056'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Status */}
                  <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-white">En Route</p>
                      <p className="text-[10px] text-neutral-500">On the way to destination</p>
                    </div>
                  </div>

                  {/* Last Sync */}
                  <button
                    type="button"
                    onClick={handleTriggerSync}
                    className="flex items-center gap-2.5 pl-6 border-l border-[#22222a] text-left cursor-pointer group"
                    title="Click to refresh database"
                  >
                    <RefreshCwIcon className={`h-4 w-4 text-neutral-500 group-hover:text-gold transition-colors ${isSyncing ? 'animate-spin text-gold' : ''}`} />
                    <div>
                      <p className="text-[10px] text-neutral-500 font-semibold">Last Sync</p>
                      <p className="text-xs font-bold text-white">Today, 10:24 AM</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 5 Metric Summary Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                
                {/* 1. Trip Status */}
                <button
                  type="button"
                  onClick={() => setView('active')}
                  className="flex items-center justify-between rounded-2xl border border-[#1e1e26] bg-[#121217] p-4 text-left transition-all hover:border-gold/40 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 group-hover:bg-gold group-hover:text-ink-950 transition-colors">
                      <TruckIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 font-medium">Trip Status</p>
                      <p className="text-sm font-bold text-emerald-400">En Route</p>
                      <p className="text-[10px] text-neutral-500 font-mono">{activeTrip?.code || 'TRP-1056'}</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-neutral-600 group-hover:text-gold transition-colors" />
                </button>

                {/* 2. Load / Delivery */}
                <button
                  type="button"
                  onClick={() => setView('details')}
                  className="flex items-center justify-between rounded-2xl border border-[#1e1e26] bg-[#121217] p-4 text-left transition-all hover:border-gold/40 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 group-hover:bg-gold group-hover:text-ink-950 transition-colors">
                      <LayersIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 font-medium">Load / Delivery</p>
                      <p className="text-sm font-bold text-white">In Transit</p>
                      <p className="text-[10px] text-neutral-500">0 / 1 Delivered</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-neutral-600 group-hover:text-gold transition-colors" />
                </button>

                {/* 3. Today's Expenses */}
                <button
                  type="button"
                  onClick={() => setView('expenses')}
                  className="flex items-center justify-between rounded-2xl border border-[#1e1e26] bg-[#121217] p-4 text-left transition-all hover:border-gold/40 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 group-hover:bg-gold group-hover:text-ink-950 transition-colors">
                      <WalletIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 font-medium">Today's Expenses</p>
                      <p className="text-sm font-bold text-white">{formatINR(todayExpensesTotal)}</p>
                      <p className="text-[10px] text-neutral-500">{consolidatedActiveExpenses.length} entries</p>
                    </div>
                  </div>
                </button>

                {/* 4. Buyer Collection */}
                <button
                  type="button"
                  onClick={() => setView('active')}
                  className="flex items-center justify-between rounded-2xl border border-[#1e1e26] bg-[#121217] p-4 text-left transition-all hover:border-gold/40 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 group-hover:bg-gold group-hover:text-ink-950 transition-colors">
                      <CoinsIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 font-medium">Buyer Collection</p>
                      <p className="text-sm font-bold text-white">{formatINR(activeBuyerCollection)}</p>
                      <p className="text-[10px] text-neutral-500">{activeBuyerCollection > 0 ? 'Logged' : 'Not collected yet'}</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-neutral-600 group-hover:text-gold transition-colors" />
                </button>

                {/* 5. Pending Actions */}
                <button
                  type="button"
                  onClick={() => setView('notifications')}
                  className="flex items-center justify-between rounded-2xl border border-[#1e1e26] bg-[#121217] p-4 text-left transition-all hover:border-gold/40 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 group-hover:bg-gold group-hover:text-ink-950 transition-colors">
                      <CheckCircle2Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 font-medium">Pending Actions</p>
                      <p className="text-sm font-bold text-white">2</p>
                      <p className="text-[10px] text-neutral-500">Requires attention</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-neutral-600 group-hover:text-gold transition-colors" />
                </button>

              </div>

              {/* Middle Row: 3 Columns / Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* 1. Current Trip Card (5 columns wide) */}
                <div className="lg:col-span-5 rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileTextIcon className="h-4 w-4 text-gold" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Current Trip</h3>
                      </div>
                      <span className="rounded-lg bg-[#1a1a22] border border-[#2b2b36] px-2.5 py-1 text-[11px] font-black text-gold font-mono">
                        TRIP: {activeTrip?.code || 'TRP-1056'}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 -mt-2">
                      Live trip progress and delivery information
                    </p>

                    {/* Stepper Progress */}
                    <div className="pt-2 pb-1">
                      <div className="relative flex items-center justify-between">
                        {/* Connecting Line */}
                        <div className="absolute left-4 right-4 top-2.5 h-0.5 bg-[#252530] -z-0">
                          <div className="h-full bg-gold w-1/2" />
                        </div>

                        {/* Step 1: Origin */}
                        <div className="flex flex-col items-center text-center z-10 space-y-1">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-ink-950">
                            <span className="h-2 w-2 rounded-full bg-ink-950" />
                          </div>
                          <span className="text-[11px] font-bold text-white">Origin</span>
                          <span className="text-[10px] text-neutral-400">{activeTrip?.origin || 'Ramapuram'}</span>
                          <span className="text-[9px] text-emerald-400 font-semibold">Departed</span>
                        </div>

                        {/* Step 2: En Route */}
                        <div className="flex flex-col items-center text-center z-10 space-y-1">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gold bg-ink-950">
                            <span className="h-2 w-2 rounded-full bg-gold" />
                          </div>
                          <span className="text-[11px] font-bold text-gold">En Route</span>
                          <span className="text-[10px] text-neutral-400">On the way</span>
                        </div>

                        {/* Step 3: Delivery */}
                        <div className="flex flex-col items-center text-center z-10 space-y-1">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#2b2b36] bg-[#16161c]">
                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-600" />
                          </div>
                          <span className="text-[11px] font-bold text-neutral-400">Delivery</span>
                          <span className="text-[10px] text-neutral-500 max-w-[100px] truncate">{activeBuyer?.name || 'Buyer'}</span>
                          <span className="text-[9px] text-neutral-500">Pending</span>
                        </div>
                      </div>
                    </div>

                    {/* Route Details Box */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="rounded-xl border border-[#1e1e26] bg-[#171720] p-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-gold text-xs font-bold">
                          <MapPinIcon className="h-3.5 w-3.5" />
                          <span>Origin Point</span>
                        </div>
                        <p className="text-sm font-bold text-white">{activeTrip?.origin || 'Ramapuram'}</p>
                        <p className="text-[10px] text-neutral-400 flex items-center gap-1 pt-1">
                          <CalendarIcon className="h-3 w-3 text-neutral-500" />
                          <span>Departed: 20 Sep 2026, 08:30 AM</span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#1e1e26] bg-[#171720] p-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                          <MapPinIcon className="h-3.5 w-3.5" />
                          <span>Destination</span>
                        </div>
                        <p className="text-sm font-bold text-white truncate" title={activeBuyer?.name}>
                          {activeBuyer?.name || 'Subhash Buyer'} ({activeBuyer?.district || 'Palakkad'})
                        </p>
                        <p className="text-[10px] text-neutral-400 flex items-center gap-1 pt-1">
                          <CalendarIcon className="h-3 w-3 text-neutral-500" />
                          <span>Estimated Arrival: 10:30 PM</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Quick Actions (3.5 columns wide) */}
                <div className="lg:col-span-3 rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-gold" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Quick Actions</h3>
                  </div>
                  <p className="text-xs text-neutral-400 -mt-2">
                    Common tasks for this trip
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Action 1: Scan Written Slip (Solid Gold) */}
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-gold text-ink-950 font-bold transition-all hover:bg-gold-400 active:scale-95 shadow-md text-center space-y-1 cursor-pointer"
                    >
                      <CameraIcon className="h-6 w-6 text-ink-950" />
                      <span className="text-xs font-black leading-tight">Scan Written Slip</span>
                      <span className="text-[9px] font-bold opacity-80">AI Auto-detect</span>
                    </button>

                    {/* Action 2: Upload Cost Chit (Solid Gold) */}
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-gold text-ink-950 font-bold transition-all hover:bg-gold-400 active:scale-95 shadow-md text-center space-y-1 cursor-pointer"
                    >
                      <UploadIcon className="h-6 w-6 text-ink-950" />
                      <span className="text-xs font-black leading-tight">Upload Cost Chit</span>
                      <span className="text-[9px] font-bold opacity-80">Add written expenses</span>
                    </button>

                    {/* Action 3: Add Expense (Dark) */}
                    <button
                      type="button"
                      onClick={() => setIsAddExpenseModalOpen(true)}
                      className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-[#22222a] bg-[#16161d] text-white font-bold transition-all hover:border-gold/40 active:scale-95 text-center space-y-1 cursor-pointer"
                    >
                      <PlusIcon className="h-6 w-6 text-gold" />
                      <span className="text-xs font-extrabold leading-tight">Add Expense</span>
                      <span className="text-[9px] text-neutral-400">Log new expense</span>
                    </button>

                    {/* Action 4: View Trip Details (Dark) */}
                    <button
                      type="button"
                      onClick={() => setView('details')}
                      className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-[#22222a] bg-[#16161d] text-white font-bold transition-all hover:border-gold/40 active:scale-95 text-center space-y-1 cursor-pointer"
                    >
                      <LayersIcon className="h-6 w-6 text-gold" />
                      <span className="text-xs font-extrabold leading-tight">View Trip Details</span>
                      <span className="text-[9px] text-neutral-400">Specs, buyer info, etc.</span>
                    </button>
                  </div>
                </div>

                {/* 3. Notifications & Tasks (3.5 columns wide) */}
                <div className="lg:col-span-4 rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BellIcon className="h-4 w-4 text-gold" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Notifications &amp; Tasks</h3>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-400 -mt-2">
                      View important updates and pending items
                    </p>

                    {/* Tabs: All (3), Tasks (2), Updates (1) */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setNotifTab('all')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                          notifTab === 'all' ? 'bg-gold text-ink-950 font-black' : 'text-neutral-400 hover:bg-[#1a1a22]'
                        }`}
                      >
                        All ({notificationsList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotifTab('tasks')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                          notifTab === 'tasks' ? 'bg-gold text-ink-950 font-black' : 'text-neutral-400 hover:bg-[#1a1a22]'
                        }`}
                      >
                        Tasks (2)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotifTab('updates')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                          notifTab === 'updates' ? 'bg-gold text-ink-950 font-black' : 'text-neutral-400 hover:bg-[#1a1a22]'
                        }`}
                      >
                        Updates (1)
                      </button>
                    </div>

                    {/* Notification items list */}
                    <div className="space-y-2 pt-1">
                      {filteredNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="flex items-start justify-between rounded-xl border border-[#1e1e26] bg-[#16161d] p-3 hover:border-gold/30 transition-all cursor-pointer"
                          onClick={() => {
                            if (notif.title.includes('slip')) setIsScannerOpen(true);
                            else if (notif.title.includes('expense')) setIsAddExpenseModalOpen(true);
                            else setView('active');
                          }}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5">
                              {notif.level === 'danger' && <AlertCircleIcon className="h-4 w-4 text-red-400" />}
                              {notif.level === 'warning' && <AlertCircleIcon className="h-4 w-4 text-amber-400" />}
                              {notif.level === 'success' && <CheckCircle2Icon className="h-4 w-4 text-emerald-400" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{notif.title}</p>
                              <p className="text-[10px] text-neutral-400">{notif.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
                            <span>{notif.time}</span>
                            <ChevronRightIcon className="h-3 w-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setView('notifications')}
                    className="text-xs font-bold text-gold hover:underline flex items-center justify-center gap-1 pt-2"
                  >
                    View all notifications →
                  </button>
                </div>

              </div>

              {/* Bottom Row: 2 Cards (Expenses & Ledger + Documents / Chits) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* 1. Expenses & Ledger Card */}
                <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <WalletIcon className="h-4 w-4 text-gold" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Expenses &amp; Ledger</h3>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Recent expenses and collections for this trip
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setView('expenses')}
                      className="text-xs font-bold text-gold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      View Full Ledger →
                    </button>
                  </div>

                  {/* Table or Empty State + Summary Block */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                    
                    {/* Left: Table or Empty state (7 cols) */}
                    <div className="md:col-span-7">
                      {consolidatedActiveExpenses.length > 0 ? (
                        <div className="overflow-x-auto max-h-[160px] overflow-y-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-[#22222a] text-neutral-500 text-[10px] uppercase font-bold">
                                <th className="pb-2">Date &amp; Time</th>
                                <th className="pb-2">Expense Name</th>
                                <th className="pb-2 text-right">Amount (₹)</th>
                                <th className="pb-2 text-right">Added By</th>
                              </tr>
                            </thead>
                            <tbody>
                              {consolidatedActiveExpenses.slice(0, 4).map((e) => (
                                <tr key={e.id} className="border-b border-[#1c1c24] text-xs">
                                  <td className="py-2 text-neutral-400 font-mono text-[10px]">{e.tripDate || 'Today'}</td>
                                  <td className="py-2 text-white font-bold">{e.label}</td>
                                  <td className="py-2 text-right text-gold font-mono font-bold">{formatINR(e.amount)}</td>
                                  <td className="py-2 text-right text-neutral-400 text-[10px]">Driver</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 border border-dashed border-[#22222a] rounded-xl bg-[#16161d]/50">
                          <WalletIcon className="h-8 w-8 text-neutral-600" />
                          <div>
                            <p className="text-xs font-bold text-neutral-400">No expenses logged yet</p>
                            <p className="text-[10px] text-neutral-500">Add your expenses to track trip costs</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsAddExpenseModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-1.5 text-xs font-extrabold text-ink-950 hover:bg-gold-400 transition-all cursor-pointer shadow-sm"
                          >
                            <PlusIcon className="h-3.5 w-3.5" /> Add Expense
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right: Embedded Summary Metrics Panel (5 cols) */}
                    <div className="md:col-span-5 rounded-xl border border-[#1e1e26] bg-[#16161d] p-3.5 space-y-2.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Total Expenses</span>
                        <span className="font-bold text-white font-mono">{formatINR(todayExpensesTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Buyer Collection</span>
                        <span className="font-bold text-white font-mono">{formatINR(activeBuyerCollection)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-[#22222a] pt-2">
                        <span className="text-gold font-bold">Pending Collection</span>
                        <span className="font-black text-gold font-mono">{formatINR(pendingCollection)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-[#22222a] pt-2">
                        <span className="text-neutral-500">Expected Load Value</span>
                        <span className="font-bold text-neutral-400 font-mono">{formatINR(expectedLoadValue)}</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 2. Documents / Chits Card */}
                <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileTextIcon className="h-4 w-4 text-gold" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Documents / Chits</h3>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Delivery slips, cost chits and other documents
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-1.5 text-xs font-extrabold text-ink-950 hover:bg-gold-400 transition-all cursor-pointer shadow-sm"
                    >
                      <UploadIcon className="h-3.5 w-3.5" /> Upload New
                    </button>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDocsFilter('all')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                        docsFilter === 'all' ? 'bg-gold text-ink-950 font-black' : 'text-neutral-400 hover:bg-[#1a1a22]'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocsFilter('delivery')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                        docsFilter === 'delivery' ? 'bg-gold text-ink-950 font-black' : 'text-neutral-400 hover:bg-[#1a1a22]'
                      }`}
                    >
                      Delivery Slips
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocsFilter('cost')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                        docsFilter === 'cost' ? 'bg-gold text-ink-950 font-black' : 'text-neutral-400 hover:bg-[#1a1a22]'
                      }`}
                    >
                      Cost Chits
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocsFilter('other')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                        docsFilter === 'other' ? 'bg-gold text-ink-950 font-black' : 'text-neutral-400 hover:bg-[#1a1a22]'
                      }`}
                    >
                      Other
                    </button>
                  </div>

                  {/* Documents List or Empty State */}
                  {filteredDocuments.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 max-h-[160px] overflow-y-auto">
                      {filteredDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => setViewReceiptModalUrl(doc.url)}
                          className="flex items-center gap-3 p-3 rounded-xl border border-[#1e1e26] bg-[#16161d] hover:border-gold/40 transition-all cursor-pointer"
                        >
                          <img
                            src={doc.url}
                            alt={doc.title}
                            className="h-10 w-10 rounded-lg object-cover bg-black"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{doc.title}</p>
                            <p className="text-[10px] text-neutral-400 font-mono">{doc.tripCode} • {doc.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 border border-dashed border-[#22222a] rounded-xl bg-[#16161d]/50">
                      <FileTextIcon className="h-8 w-8 text-neutral-600" />
                      <div>
                        <p className="text-xs font-bold text-neutral-400">No documents uploaded yet</p>
                        <p className="text-[10px] text-neutral-500">Scan or upload delivery slips, cost chits, etc.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsUploadModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 text-gold px-3.5 py-1.5 text-xs font-bold hover:bg-gold hover:text-ink-950 transition-all cursor-pointer"
                      >
                        <UploadIcon className="h-3.5 w-3.5" /> Upload Document
                      </button>
                    </div>
                  )}
                </div>

              </div>

            </motion.div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW: ACTIVE TRIP */}
          {/* ------------------------------------------------------- */}
          {currentView === 'active' && (
            <motion.div
              key="view-active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <TruckIcon className="h-5 w-5 text-gold" />
                    Active Trip Operations
                  </h2>
                  <p className="text-xs text-neutral-400">Manage route settlements, unloading collections, and quarry payments</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-ink-950 shadow-md hover:bg-gold-400 cursor-pointer"
                >
                  <CameraIcon className="h-4 w-4" /> Scan Written Chit
                </button>
              </div>

              {activeTrips.length > 0 ? (
                <div className="space-y-6">
                  {activeTrips.map(trip => (
                    <TripSettlementCard
                      key={trip.id}
                      trip={trip}
                      unloadingParties={unloadingParties}
                      loadingParties={loadingParties}
                      districtRates={districtRates}
                      updateTripPayments={updateTripPayments}
                      completeTrip={completeTrip}
                      updateLoadingPartyPayments={updateLoadingPartyPayments}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-12 text-center space-y-3">
                  <TruckIcon className="h-10 w-10 text-neutral-600 mx-auto" />
                  <h3 className="text-base font-bold text-white">No Active Trip Dispatched</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    You are currently idle. When the transport coordinator assigns a load, the active trip details will appear here.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW: TRIP DETAILS & SPEC */}
          {/* ------------------------------------------------------- */}
          {currentView === 'details' && (
            <motion.div
              key="view-details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Trip Selector Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-800 bg-[#121217] p-4">
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <LayersIcon className="h-5 w-5 text-gold" />
                    Trip Specifications &amp; Load Breakdown
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Inspect stone cuts, quarry suppliers, sqft measurements, and delivery instructions
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-400">Select Trip:</span>
                  <select
                    value={inspectedTripId}
                    onChange={(e) => setInspectedTripId(e.target.value)}
                    className="rounded-xl border border-ink-700 bg-ink-950 px-3 py-2 text-xs font-bold text-white focus:border-gold focus:outline-none"
                  >
                    {activeTrips.map(t => (
                      <option key={t.id} value={t.id}>
                        ACTIVE: {t.code} ({t.status})
                      </option>
                    ))}
                    {completedTrips.map(t => (
                      <option key={t.id} value={t.id}>
                        ARCHIVED: {t.code} ({t.date})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {inspectedTrip ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-4 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">Trip Reference</span>
                      <p className="text-base font-black text-gold font-mono">{inspectedTrip.code}</p>
                      <span className="inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase bg-gold/15 text-gold border border-gold/30">
                        {inspectedTrip.status}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-4 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">Dispatch Date</span>
                      <p className="text-sm font-bold text-white flex items-center gap-1.5">
                        <CalendarIcon className="h-4 w-4 text-neutral-400" />
                        {inspectedTrip.date}
                      </p>
                      <span className="text-[10px] text-neutral-500">Origin: {inspectedTrip.origin || 'Ramapuram'}</span>
                    </div>

                    <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-4 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">Destination Party</span>
                      {(() => {
                        const buyer = unloadingParties.find(up => up.id === inspectedTrip.unloadingPartyId);
                        return (
                          <>
                            <p className="text-sm font-bold text-white truncate" title={buyer?.name}>
                              {buyer?.name || 'Kerala Depot Party'}
                            </p>
                            <span className="text-[10px] text-emerald-400 font-semibold">{buyer?.district || 'Kerala'}</span>
                          </>
                        );
                      })()}
                    </div>

                    <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-4 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">Assigned Lorry</span>
                      <p className="text-sm font-bold text-white flex items-center gap-1.5">
                        <TruckIcon className="h-4 w-4 text-gold" />
                        {activeLorry?.plate}
                      </p>
                      <span className="text-[10px] text-neutral-500">Capacity: {activeLorry?.capacitySqft} SQFT</span>
                    </div>
                  </div>

                  {/* Stone Specifications Table */}
                  <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-6 space-y-4 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between border-b border-[#22222a] pb-3 gap-2">
                      <div>
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                          <LayersIcon className="h-4 w-4 text-gold" />
                          Stone Specifications Loaded on Lorry
                        </h3>
                        <p className="text-[11px] text-neutral-500">Breakdown of pieces, dimensions, square footage, and quarry source</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-[#181820] border border-[#22222a] px-3 py-1 text-xs font-bold text-neutral-300 font-mono">
                          Total Pieces: {(inspectedTrip.stoneLines || []).reduce((s, l) => s + l.pieces, 0)} pcs
                        </span>
                        <span className="rounded-lg bg-gold/15 border border-gold/30 px-3 py-1 text-xs font-black text-gold font-mono">
                          Total SQFT: {(inspectedTrip.stoneLines || []).reduce((s, l) => s + (l.sqftPerPiece * l.pieces), 0).toFixed(1)} SQFT
                        </span>
                      </div>
                    </div>

                    {(inspectedTrip.stoneLines || []).length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[#22222a] text-neutral-500 uppercase tracking-wider text-[10px]">
                              <th className="py-3 font-bold">Stone Specification</th>
                              <th className="py-3 font-bold">Thickness &amp; Finish</th>
                              <th className="py-3 font-bold">Loading Quarry</th>
                              <th className="py-3 font-bold text-center">Pieces</th>
                              <th className="py-3 font-bold text-right">Sqft / Pc</th>
                              <th className="py-3 font-bold text-right">Total Sqft</th>
                              <th className="py-3 font-bold text-right">Rate/Sqft</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inspectedTrip.stoneLines.map((line, idx) => {
                              const lp = loadingParties.find(p => p.id === line.loadingPartyId);
                              const totalSqft = (line.sqftPerPiece * line.pieces);
                              return (
                                <tr key={idx} className="border-b border-[#1c1c24] hover:bg-[#181820] transition-colors">
                                  <td className="py-3.5 font-bold text-white">{line.size} Rough Stone</td>
                                  <td className="py-3.5 text-neutral-300">
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="rounded bg-[#1a1a24] border border-[#22222a] px-1.5 py-0.5 text-[10px] font-mono">
                                        {line.thickness}
                                      </span>
                                      <span className="capitalize">{line.finish}</span>
                                    </span>
                                  </td>
                                  <td className="py-3.5 text-gold font-semibold">{lp?.name || 'Local Quarry'}</td>
                                  <td className="py-3.5 text-center font-bold text-white">{line.pieces} pcs</td>
                                  <td className="py-3.5 text-right font-mono text-neutral-400">{line.sqftPerPiece} sqft</td>
                                  <td className="py-3.5 text-right font-black text-gold font-mono">{totalSqft.toFixed(1)} sqft</td>
                                  <td className="py-3.5 text-right font-mono text-neutral-300">₹{line.ratePerSqft}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 italic py-4">No stone lines listed on this trip record.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW: TRIP HISTORY & LOGS */}
          {/* ------------------------------------------------------- */}
          {currentView === 'history' && (
            <motion.div
              key="view-history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <HistoryIcon className="h-5 w-5 text-gold" />
                    Trip History &amp; Archived Logs
                  </h2>
                  <p className="text-xs text-neutral-400">Review past dispatches, completed runs, and lifetime delivery metrics</p>
                </div>
              </div>

              {completedTrips.length > 0 ? (
                <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-6 space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#22222a] text-neutral-500 uppercase tracking-wider text-[10px]">
                          <th className="py-3 font-bold">Trip Date</th>
                          <th className="py-3 font-bold">Trip Code</th>
                          <th className="py-3 font-bold">Destination Buyer</th>
                          <th className="py-3 font-bold text-right">Lorry Expenses</th>
                          <th className="py-3 font-bold text-right">Cash Received</th>
                          <th className="py-3 font-bold text-right">PhonePe Owner</th>
                          <th className="py-3 font-bold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedTrips.map((t) => {
                          const buyer = unloadingParties.find(up => up.id === t.unloadingPartyId);
                          const totalExpenses = (t.expenses || []).reduce((s, e) => s + e.amount, 0);
                          return (
                            <tr key={t.id} className="border-b border-[#1c1c24] hover:bg-[#181820] transition-colors">
                              <td className="py-3 text-neutral-400 font-mono">{t.date}</td>
                              <td className="py-3 font-bold text-white font-mono">{t.code}</td>
                              <td className="py-3 text-neutral-300">{buyer?.name || 'Kerala Buyer'} ({buyer?.district || 'Kerala'})</td>
                              <td className="py-3 text-right font-bold text-neutral-300 font-mono">{formatINR(totalExpenses)}</td>
                              <td className="py-3 text-right font-bold text-emerald-400 font-mono">{formatINR(t.partyToDriverCash || 0)}</td>
                              <td className="py-3 text-right font-bold text-blue-400 font-mono">{formatINR(t.partyToOwnerPhonePe || 0)}</td>
                              <td className="py-3 text-right">
                                <span className="rounded px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  {t.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-12 text-center text-xs text-neutral-500">
                  No completed trips found yet.
                </div>
              )}
            </motion.div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW: DRIVER INFO & LORRY */}
          {/* ------------------------------------------------------- */}
          {currentView === 'profile' && (
            <motion.div
              key="view-profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-gold" />
                    Driver Information &amp; Assigned Lorry
                  </h2>
                  <p className="text-xs text-neutral-400">Driver identity verification, compliance documents, and vehicle telemetry</p>
                </div>
              </div>

              {/* Driver Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-2xl border border-[#1e1e26] bg-[#121217] p-6 shadow-xl">
                <div className="md:col-span-2 flex items-center gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gold font-black text-ink-950 text-3xl shadow-lg">
                    {currentDriver.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black text-white">{currentDriver.name}</h2>
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black text-emerald-400 uppercase">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 flex items-center gap-2">
                      <PhoneIcon className="h-3.5 w-3.5 text-gold" /> {currentDriver.phone}
                    </p>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      Driver ID: DRV-{currentDriver.id.toUpperCase()} • Heavy Vehicle License
                    </p>
                  </div>
                </div>

                <div className="border-t md:border-t-0 md:border-l border-[#22222a] pt-4 md:pt-0 md:pl-6 flex flex-col justify-center space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-0.5">Joined Fleet</span>
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <CalendarIcon className="h-3.5 w-3.5 text-gold" /> {currentDriver.joinedOn}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-0.5">Assigned Lorry</span>
                    <p className="font-bold text-gold flex items-center gap-1.5">
                      <TruckIcon className="h-3.5 w-3.5" /> {activeLorry?.plate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lorry Telematics */}
              <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-2">
                  <TruckIcon className="h-4 w-4" /> Vehicle Specifications
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-[#1e1e26] bg-[#171720] p-4">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Registration Plate</span>
                    <p className="text-base font-black text-white font-mono mt-1">{activeLorry?.plate}</p>
                  </div>
                  <div className="rounded-xl border border-[#1e1e26] bg-[#171720] p-4">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Max Capacity</span>
                    <p className="text-base font-black text-gold font-mono mt-1">{activeLorry?.capacitySqft} SQFT</p>
                  </div>
                  <div className="rounded-xl border border-[#1e1e26] bg-[#171720] p-4">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Service Date</span>
                    <p className="text-sm font-bold text-white mt-1">{activeLorry?.addedOn}</p>
                  </div>
                  <div className="rounded-xl border border-[#1e1e26] bg-[#171720] p-4">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Lorry Status</span>
                    <p className="text-sm font-bold text-emerald-400 uppercase mt-1">{activeLorry?.status}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW: EXPENSES & LEDGER */}
          {/* ------------------------------------------------------- */}
          {currentView === 'expenses' && (
            <motion.div
              key="view-expenses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <WalletIcon className="h-5 w-5 text-gold" />
                    Expenses &amp; Financial Ledger
                  </h2>
                  <p className="text-xs text-neutral-400">Track fuel, tolls, batte, maintenance costs, and owner approval audits</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gold/40 text-gold px-3.5 py-2 text-xs font-bold hover:bg-gold hover:text-ink-950 transition-all cursor-pointer"
                  >
                    <CameraIcon className="h-3.5 w-3.5" /> Scan Paper
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddExpenseModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-extrabold text-ink-950 hover:bg-gold-400 transition-all cursor-pointer shadow-md"
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Add Expense
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-6 space-y-4">
                {consolidatedActiveExpenses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#22222a] text-neutral-500 uppercase tracking-wider text-[10px]">
                          <th className="py-3 font-bold">Date &amp; Time</th>
                          <th className="py-3 font-bold">Trip Code</th>
                          <th className="py-3 font-bold">Expense Name</th>
                          <th className="py-3 font-bold">Receipt Proof</th>
                          <th className="py-3 font-bold text-right">Amount (₹)</th>
                          <th className="py-3 font-bold text-right">Audit Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consolidatedActiveExpenses.map((exp) => (
                          <tr key={exp.id} className="border-b border-[#1c1c24] hover:bg-[#181820] transition-colors">
                            <td className="py-3.5 text-neutral-400 font-mono">{exp.tripDate || 'Today'}</td>
                            <td className="py-3.5 font-bold text-white font-mono">{exp.tripCode}</td>
                            <td className="py-3.5 text-white font-bold">{exp.label}</td>
                            <td className="py-3.5">
                              {exp.receiptUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setViewReceiptModalUrl(exp.receiptUrl!)}
                                  className="text-[11px] text-gold hover:underline flex items-center gap-1 font-bold cursor-pointer"
                                >
                                  <EyeIcon className="h-3 w-3" /> View Slip
                                </button>
                              ) : (
                                <span className="text-[10px] text-neutral-500">Manual Entry</span>
                              )}
                            </td>
                            <td className="py-3.5 text-right font-black text-gold font-mono">{formatINR(exp.amount)}</td>
                            <td className="py-3.5 text-right">
                              <span className="rounded px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                {exp.review || 'approved'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-2">
                    <p className="text-xs text-neutral-500 italic">No expenses registered on this trip yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW: DOCUMENTS / CHITS */}
          {/* ------------------------------------------------------- */}
          {currentView === 'documents' && (
            <motion.div
              key="view-documents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5 text-gold" />
                    Documents, Chits &amp; Paper Proofs
                  </h2>
                  <p className="text-xs text-neutral-400">Archive of scanned handwritten papers, delivery slips, and toll receipts</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-ink-950 shadow-md hover:bg-gold-400 cursor-pointer"
                >
                  <UploadIcon className="h-4 w-4" /> Upload Document
                </button>
              </div>

              {allDocuments.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {allDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setViewReceiptModalUrl(doc.url)}
                      className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-3 space-y-2 hover:border-gold/40 transition-all cursor-pointer group"
                    >
                      <img
                        src={doc.url}
                        alt={doc.title}
                        className="h-36 w-full rounded-xl object-cover bg-black group-hover:opacity-90 transition-opacity"
                      />
                      <div>
                        <p className="text-xs font-bold text-white truncate">{doc.title}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">{doc.tripCode} • {doc.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-12 text-center text-xs text-neutral-500 space-y-3">
                  <FileTextIcon className="h-10 w-10 text-neutral-600 mx-auto" />
                  <p>No paper documents uploaded yet.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW: NOTIFICATIONS */}
          {/* ------------------------------------------------------- */}
          {currentView === 'notifications' && (
            <motion.div
              key="view-notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <BellIcon className="h-5 w-5 text-gold" />
                    Driver Notifications &amp; Tasks
                  </h2>
                  <p className="text-xs text-neutral-400">Important dispatch reminders, required slip uploads, and trip alerts</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-6 space-y-3">
                {notificationsList.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start justify-between rounded-xl border border-[#1e1e26] bg-[#16161d] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {notif.level === 'danger' && <AlertCircleIcon className="h-5 w-5 text-red-400" />}
                        {notif.level === 'warning' && <AlertCircleIcon className="h-5 w-5 text-amber-400" />}
                        {notif.level === 'success' && <CheckCircle2Icon className="h-5 w-5 text-emerald-400" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{notif.title}</h4>
                        <p className="text-xs text-neutral-400 mt-0.5">{notif.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-500 font-mono">{notif.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW: SETTINGS */}
          {/* ------------------------------------------------------- */}
          {currentView === 'settings' && (
            <motion.div
              key="view-settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5 text-gold" />
                    Driver Portal Settings
                  </h2>
                  <p className="text-xs text-neutral-400">Manage device alerts, language preferences, and offline sync</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#1e1e26] bg-[#121217] p-6 space-y-5 max-w-xl">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-300">Registered Phone Number</label>
                  <input
                    type="text"
                    disabled
                    value={currentDriver.phone}
                    className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-xs text-neutral-400"
                  />
                  <p className="text-[10px] text-neutral-500">To update contact number, notify the fleet dispatcher.</p>
                </div>

                <div className="flex items-center justify-between border-t border-[#22222a] pt-4">
                  <div>
                    <p className="text-xs font-bold text-white">High-Contrast Road Mode</p>
                    <p className="text-[10px] text-neutral-500">Maximum brightness contrast for road visibility</p>
                  </div>
                  <span className="text-xs text-gold font-bold">Enabled</span>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. MODALS & POPUPS */}
      {/* ========================================================= */}

      {/* 1. AI Paper Scanner Modal */}
      <ExpensePaperScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        activeTrips={activeTrips.length > 0 ? activeTrips : (trips.slice(0, 1))}
        onSaveExpenses={(tripId, expenses) => {
          addBatchExpensesToTrip(tripId, expenses);
        }}
      />

      {/* 2. Manual Expense Modal */}
      <AnimatePresence>
        {isAddExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-md w-full rounded-2xl border border-[#22222a] bg-[#121217] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#22222a] pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <PlusIcon className="h-4 w-4 text-gold" /> Log New Road Expense
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:text-white"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateManualExpense} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Expense Label / Description</label>
                  <input
                    type="text"
                    required
                    value={modalExpenseLabel}
                    onChange={(e) => setModalExpenseLabel(e.target.value)}
                    placeholder="e.g. Diesel at Hosur HP Pump"
                    className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={modalExpenseAmount}
                    onChange={(e) => setModalExpenseAmount(e.target.value)}
                    placeholder="₹ Amount spent"
                    className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Category</label>
                  <select
                    value={modalExpenseCategory}
                    onChange={(e: any) => setModalExpenseCategory(e.target.value)}
                    className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                  >
                    <option value="fuel">Fuel / Diesel</option>
                    <option value="toll">Toll Gate Ticket</option>
                    <option value="maintenance">Maintenance / Repair</option>
                    <option value="other">Batte / Food / Other</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddExpenseModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gold px-5 py-2 text-xs font-bold text-ink-950 hover:bg-gold-400 shadow-md"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Upload Cost Chit Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-md w-full rounded-2xl border border-[#22222a] bg-[#121217] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#22222a] pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <UploadIcon className="h-4 w-4 text-gold" /> Upload Cost Chit / Document
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:text-white"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUploadChitSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Document Type</label>
                  <select
                    value={uploadChitCategory}
                    onChange={(e: any) => setUploadChitCategory(e.target.value)}
                    className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                  >
                    <option value="cost_chit">Cost Chit / Handwritten Paper</option>
                    <option value="delivery_slip">Signed Delivery Slip</option>
                    <option value="other">Toll Receipt / Fuel Bill</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Label / Name</label>
                  <input
                    type="text"
                    required
                    value={uploadChitLabel}
                    onChange={(e) => setUploadChitLabel(e.target.value)}
                    placeholder="e.g. Quarry Loading Weight Slip"
                    className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Amount (Optional)</label>
                  <input
                    type="number"
                    min={0}
                    value={uploadChitAmount}
                    onChange={(e) => setUploadChitAmount(e.target.value)}
                    placeholder="₹ Amount on slip (if applicable)"
                    className="w-full rounded-xl border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
                  />
                </div>

                {/* File Upload / Camera Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Snap Photo or Choose File</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => setUploadChitFile(event.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gold file:text-ink-950 hover:file:bg-gold-400 cursor-pointer"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gold px-5 py-2 text-xs font-bold text-ink-950 hover:bg-gold-400 shadow-md"
                  >
                    Upload &amp; Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Support Hotline Modal */}
      <AnimatePresence>
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-md w-full rounded-2xl border border-[#22222a] bg-[#121217] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#22222a] pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <HeadphonesIcon className="h-4 w-4 text-gold" /> 24/7 Driver Road Support
                </div>
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(false)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:text-white"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <a
                  href="tel:+919988776655"
                  className="flex items-center justify-between rounded-xl border border-[#1e1e26] bg-[#171720] p-4 hover:border-gold/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <PhoneCallIcon className="h-5 w-5 text-gold" />
                    <div>
                      <p className="text-xs font-bold text-white">Owner / Dispatch Desk</p>
                      <p className="text-[11px] text-neutral-400">+91 99887 76655</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gold">Call Now</span>
                </a>

                <a
                  href="tel:1800100200"
                  className="flex items-center justify-between rounded-xl border border-[#1e1e26] bg-[#171720] p-4 hover:border-gold/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <WrenchIcon className="h-5 w-5 text-red-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Highway Breakdown &amp; Towing</p>
                      <p className="text-[11px] text-neutral-400">1800-100-200</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-400">Emergency</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Lightbox for Paper Receipts */}
      <AnimatePresence>
        {viewReceiptModalUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-2xl w-full rounded-2xl border border-ink-700 bg-ink-950 p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-ink-800 pb-3">
                <div className="flex items-center gap-2 text-gold font-bold text-sm">
                  <FileTextIcon className="h-4 w-4" /> Attached Written Paper Chit / Slip
                </div>
                <button
                  type="button"
                  onClick={() => setViewReceiptModalUrl(null)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:text-white"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center justify-center bg-black/60 rounded-xl p-2 max-h-[70vh] overflow-auto">
                <img
                  src={viewReceiptModalUrl}
                  alt="Written Chit Preview"
                  className="max-h-[65vh] w-auto rounded object-contain"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setViewReceiptModalUrl(null)}
                  className="rounded-xl bg-ink-800 px-5 py-2 text-xs font-bold text-white hover:bg-ink-700 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
