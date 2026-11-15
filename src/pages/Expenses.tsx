import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useOrders } from '../store/OrdersContext';
import { formatINR } from '../utils/helpers';
import type { ExpenseCategory, ExpenseLine, Trip } from '../data/types';
import {
  CoinsIcon,
  FuelIcon,
  MapPinIcon,
  WrenchIcon,
  WalletIcon,
  PlusIcon,
  CheckCircle2Icon,
  ClockIcon,
  FilterIcon,
  TruckIcon,
  UserIcon,
  SearchIcon,
  XIcon,
  Building2Icon,
  LayersIcon,
  ArrowRightIcon,
  SparklesIcon,
  CheckIcon,
  ChevronDownIcon,
  PhoneIcon,
  ReceiptIcon
} from 'lucide-react';
import { Card } from '../components/ui/Card';

export function Expenses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { trips, lorries, drivers, loadingParties, addExpenseToTrip } = useOrders();

  // Find default fleet: prefer KL lorry if exists, otherwise first lorry or fallback
  const defaultPlate = useMemo(() => {
    const klLorry = lorries.find((l) => l.plate.toUpperCase().includes('KL'));
    if (klLorry) return klLorry.plate;
    if (lorries.length > 0) return lorries[0].plate;
    return 'KL 03BH 3333';
  }, [lorries]);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedLorryPlate, setSelectedLorryPlate] = useState<string>(defaultPlate);
  const [tripScope, setTripScope] = useState<'present' | 'all'>('present');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);

  // Form State for Expense Recording
  const [formDescription, setFormDescription] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('fuel');
  const [formTripId, setFormTripId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentMode, setFormPaymentMode] = useState<string>('Cash');
  const [formPaidBy, setFormPaidBy] = useState<'owner' | 'driver'>('driver');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync with URL params if provided, otherwise set default
  useEffect(() => {
    const urlLorry = searchParams.get('lorry') || searchParams.get('plate');
    if (urlLorry) {
      const matchLorry = lorries.find(
        (l) => l.plate.toLowerCase() === urlLorry.toLowerCase() || l.id.toLowerCase() === urlLorry.toLowerCase()
      );
      if (matchLorry) {
        setSelectedLorryPlate(matchLorry.plate);
        return;
      }
    }
    if (!selectedLorryPlate && defaultPlate) {
      setSelectedLorryPlate(defaultPlate);
    }
  }, [searchParams, lorries, defaultPlate]);

  // Extract all expenses across trips, including driver-paid quarry stone payments and hamali labour payments
  const allExpenses = useMemo(() => {
    const list: Array<{
      id: string;
      label: string;
      amount: number;
      category: string;
      tripCode: string;
      tripId: string;
      lorryPlate: string;
      driverName: string;
      date: string;
      notes?: string;
      paymentMode?: string;
      paidBy: 'owner' | 'driver' | 'admin';
      status: string;
    }> = [];

    trips.forEach((t) => {
      const lorry = lorries.find((l) => l.id === t.lorryId || l.plate === t.lorryId);
      const lorryPlate = lorry?.plate || t.lorryId || 'KL 03BH 3333';
      const driver = drivers.find((d) => d.id === t.driverId);
      const driverName = driver?.name || 'Driver';

      // 1. Regular Expenses recorded in trip
      const recordedExpIds = new Set<string>();
      (t.expenses || []).forEach((e, idx) => {
        recordedExpIds.add(e.id);
        let cat = e.category || 'other';
        const lbl = (e.label || '').toLowerCase();
        if (lbl.includes('diesel') || lbl.includes('fuel') || lbl.includes('diseal') || lbl.includes('disel')) {
          cat = 'fuel';
        } else if (lbl.includes('driver') || lbl.includes('bata') || lbl.includes('wage')) {
          cat = 'driver';
        } else if (lbl.includes('toll') || lbl.includes('fastag')) {
          cat = 'toll';
        } else if (lbl.includes('maintenance') || lbl.includes('grease') || lbl.includes('tyre') || lbl.includes('puncture') || lbl.includes('brake')) {
          cat = 'maintenance';
        } else if (lbl.includes('quarry') || lbl.includes('stone payment')) {
          cat = 'quarry_payment';
        } else if (lbl.includes('hamali') || lbl.includes('labor') || lbl.includes('coolie') || lbl.includes('mamullu')) {
          cat = 'hamali';
        }

        const isDriverPaid = lbl.includes('driver') || e.notes?.toLowerCase().includes('driver') || lbl.includes('[driver');

        list.push({
          id: e.id || `exp-${t.id}-${idx}`,
          label: e.label,
          amount: Number(e.amount) || 0,
          category: cat,
          tripCode: t.code,
          tripId: t.id,
          lorryPlate,
          driverName,
          date: t.date || 'Recent',
          notes: e.notes,
          paymentMode: isDriverPaid ? 'Driver Cash Payout' : 'Company Account',
          paidBy: isDriverPaid ? 'driver' : 'owner',
          status: e.review || 'approved'
        });
      });

      // 2. Quarry Stone Payments where Paid By === 'driver' (if not already recorded in expenses)
      (t.loadingPartyPayments || []).forEach((lpPay, idx) => {
        const expKey = `exp-quarry-${lpPay.loadingPartyId}`;
        if (lpPay.paidBy === 'driver' && Number(lpPay.amountPaid) > 0 && !recordedExpIds.has(expKey)) {
          const party = loadingParties.find((p) => p.id === lpPay.loadingPartyId);
          list.push({
            id: `lpp-${t.id}-${idx}`,
            label: `Quarry Stone Payment - ${party?.name || 'Quarry'} [Driver Paid ${lpPay.paymentMode?.toUpperCase() || 'CASH'}]`,
            amount: Number(lpPay.amountPaid),
            category: 'quarry_payment',
            tripCode: t.code,
            tripId: t.id,
            lorryPlate,
            driverName,
            date: t.date || 'Recent',
            notes: `Paid by driver in ${lpPay.paymentMode || 'cash'} to ${party?.name || 'loading quarry'}`,
            paymentMode: `Driver ${lpPay.paymentMode?.toUpperCase() || 'CASH'}`,
            paidBy: 'driver',
            status: lpPay.status || 'paid'
          });
        }
      });

      // 3. Worker Payments (Hamali / Mamullu) where Paid By === 'driver' (if not already recorded in expenses)
      (t.workerPayments || []).forEach((wPay, idx) => {
        const isDriver = (wPay as any).paidBy === 'driver' || wPay.note?.toLowerCase().includes('driver');
        const wExpKey = `w-hamali-${wPay.loadingPartyId}`;
        if (isDriver && Number(wPay.amount) > 0 && !recordedExpIds.has(wExpKey) && !recordedExpIds.has(wPay.id)) {
          const party = loadingParties.find((p) => p.id === wPay.loadingPartyId);
          list.push({
            id: `wp-${t.id}-${idx}`,
            label: `Hamali Labour / Tips - ${party?.name || 'Quarry'} [Driver Paid]`,
            amount: Number(wPay.amount),
            category: 'hamali',
            tripCode: t.code,
            tripId: t.id,
            lorryPlate,
            driverName,
            date: t.date || 'Recent',
            notes: wPay.note || 'Loading coolie labour wages paid by driver',
            paymentMode: 'Driver Cash',
            paidBy: 'driver',
            status: 'approved'
          });
        }
      });
    });

    return list;
  }, [trips, lorries, drivers, loadingParties]);

  // Selected Fleet Object
  const currentSelectedLorry = useMemo(() => {
    return lorries.find(
      (l) => l.plate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === selectedLorryPlate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    ) || lorries[0] || null;
  }, [selectedLorryPlate, lorries]);

  // Assigned Driver for the selected fleet
  const currentDriver = useMemo(() => {
    if (!currentSelectedLorry) return null;
    return drivers.find(
      (d) => d.id === currentSelectedLorry.driverId || d.lorryId === currentSelectedLorry.id
    ) || null;
  }, [currentSelectedLorry, drivers]);

  const activeStages = useMemo(() => [
    'loading',
    'loaded',
    'in-transit',
    'dispatched',
    'arrived_kerala',
    'stone_unloading',
    'return_decision_pending',
    'return_sand_loading',
    'return_loaded',
    'returning',
    'arrived_lt_factory',
    'sand_unloaded',
    'direct_return',
    'final_audit_pending'
  ], []);

  // Active in-progress trip for this fleet
  const activeFleetTrip = useMemo(() => {
    if (!currentSelectedLorry) return null;
    const cleanSelected = (currentSelectedLorry.plate || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const lorryId = currentSelectedLorry.id;

    // Look for in-progress active trip
    const active = trips.find(
      (t) =>
        (t.lorryId === lorryId || (t.lorryId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanSelected) &&
        activeStages.includes(t.status as string)
    );
    return active || null;
  }, [currentSelectedLorry, trips, activeStages]);

  // Filtered Expenses strictly for this SELECTED FLEET and Trip Scope (defaults to present active trip only)
  const fleetSpecificExpenses = useMemo(() => {
    const cleanFilterPlate = selectedLorryPlate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const lorryExpenses = allExpenses.filter((item) => {
      const cleanItemPlate = item.lorryPlate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return cleanItemPlate.includes(cleanFilterPlate);
    });

    // If tripScope === 'present' (default), scope strictly to the active present trip
    if (tripScope === 'present') {
      if (!activeFleetTrip) {
        // Vehicle is Idle / Stationed at depot base (no active trip) -> return 0 expenses
        return [];
      }
      return lorryExpenses.filter(
        (item) => item.tripId === activeFleetTrip.id || item.tripCode === activeFleetTrip.code
      );
    }

    return lorryExpenses;
  }, [allExpenses, selectedLorryPlate, tripScope, activeFleetTrip]);

  // Filtered by Category and Search strictly within the selected fleet
  const filteredList = useMemo(() => {
    return fleetSpecificExpenses.filter((item) => {
      // Category filter
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLabel = item.label.toLowerCase().includes(q);
        const matchTrip = item.tripCode.toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        if (!matchLabel && !matchTrip && !matchNotes) return false;
      }
      return true;
    });
  }, [fleetSpecificExpenses, filterCategory, searchQuery]);

  // KPIs strictly computed for the SELECTED FLEET ONLY
  const fleetKPIs = useMemo(() => {
    const totalRecorded = fleetSpecificExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalFuel = fleetSpecificExpenses
      .filter((e) => e.category === 'fuel')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalDriverWages = fleetSpecificExpenses
      .filter((e) => e.category === 'driver')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalToll = fleetSpecificExpenses
      .filter((e) => e.category === 'toll')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalQuarryAndHamali = fleetSpecificExpenses
      .filter((e) => e.category === 'quarry_payment' || e.category === 'hamali')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalMaintenance = fleetSpecificExpenses
      .filter((e) => e.category === 'maintenance')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalDriverPaid = fleetSpecificExpenses
      .filter((e) => e.paidBy === 'driver')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalCompanyPaid = fleetSpecificExpenses
      .filter((e) => e.paidBy !== 'driver')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      totalRecorded,
      totalFuel,
      totalDriverWages,
      totalToll,
      totalQuarryAndHamali,
      totalMaintenance,
      totalDriverPaid,
      totalCompanyPaid,
      count: fleetSpecificExpenses.length
    };
  }, [fleetSpecificExpenses]);

  // Grouped by Trip structure strictly for this fleet
  const groupedByTrip = useMemo(() => {
    const map = new Map<string, { tripCode: string; tripId: string; lorryPlate: string; driverName: string; total: number; items: typeof filteredList }>();

    filteredList.forEach((item) => {
      if (!map.has(item.tripId)) {
        map.set(item.tripId, {
          tripCode: item.tripCode,
          tripId: item.tripId,
          lorryPlate: item.lorryPlate,
          driverName: item.driverName,
          total: 0,
          items: []
        });
      }
      const entry = map.get(item.tripId)!;
      entry.total += item.amount;
      entry.items.push(item);
    });

    return Array.from(map.values());
  }, [filteredList]);

  // Switch fleet handler
  const handleSelectLorry = (plate: string) => {
    setSelectedLorryPlate(plate);
    setSearchParams({ lorry: plate });
  };

  // Set default selected trip when opening modal
  const openModal = () => {
    if (activeFleetTrip) {
      setFormTripId(activeFleetTrip.id);
    } else {
      const matchTrip = trips.find(
        (t) => t.lorryId === currentSelectedLorry?.id || t.lorryId === currentSelectedLorry?.plate
      );
      if (matchTrip) {
        setFormTripId(matchTrip.id);
      } else if (trips.length > 0) {
        setFormTripId(trips[0].id);
      }
    }

    setFormDescription('');
    setFormAmount('');
    setFormNotes('');
    setFormError('');
    setIsRecordModalOpen(true);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim()) {
      setFormError('Please enter an expense description');
      return;
    }
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid expense amount');
      return;
    }
    if (!formTripId && trips.length > 0) {
      setFormError('Please assign this expense to a trip');
      return;
    }

    try {
      setIsSubmitting(true);
      const targetTripId = formTripId || (trips[0]?.id ?? `t-${Date.now()}`);
      const paidByTag = formPaidBy === 'driver' ? '[Driver Paid]' : '[Owner Paid]';
      const fullLabel = formNotes
        ? `${formDescription.trim()} ${paidByTag} (${formNotes.trim()})`
        : `${formDescription.trim()} ${paidByTag}`;

      await addExpenseToTrip(
        targetTripId,
        fullLabel,
        amt,
        formCategory,
        undefined,
        `Recorded by ${formPaidBy.toUpperCase()} on ${formDate} via ${formPaymentMode}`
      );

      setIsRecordModalOpen(false);
      setFormDescription('');
      setFormAmount('');
      setFormNotes('');
      setFormError('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full space-y-6 p-4 sm:p-6 lg:p-8">
      {/* 1. Header with Vehicle Switcher and Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 border border-gold/40 px-3 py-1 text-xs font-black uppercase text-gold tracking-wide">
              <TruckIcon className="h-3.5 w-3.5" /> Fleet Expenses Profile
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>Expenses for</span>
            <span className="text-gold font-mono border-b-2 border-gold pb-0.5">{selectedLorryPlate}</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400">
            Showing strictly this vehicle&apos;s diesel slips, driver allowances, toll fastag, and driver quarry &amp; labour payouts.
          </p>
        </div>

        {/* Switch Vehicle Selector & Record Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Lorry Switcher Dropdown */}
          <div className="relative">
            <select
              value={selectedLorryPlate}
              onChange={(e) => handleSelectLorry(e.target.value)}
              className="appearance-none rounded-xl border border-gold/40 bg-ink-900 pl-4 pr-10 py-2.5 text-xs sm:text-sm font-black text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold cursor-pointer shadow-lg shadow-black/40"
            >
              {lorries.map((l) => (
                <option key={l.id} value={l.plate} className="bg-ink-950 text-white font-mono">
                  🚛 {l.plate} ({drivers.find((d) => d.id === l.driverId || d.lorryId === l.id)?.name || 'Driver'})
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold pointer-events-none" />
          </div>

          <button
            onClick={openModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F5B82E] to-[#E5A81E] px-4 py-2.5 text-xs sm:text-sm font-black text-black shadow-[0_4px_20px_rgba(245,184,46,0.35)] transition-all hover:scale-105 hover:shadow-[0_6px_25px_rgba(245,184,46,0.5)] cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* 2. FLEET QUICK SELECT PILLS (Click to switch between lorries) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 ti-scroll">
        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <TruckIcon className="h-3.5 w-3.5 text-gold" /> Select Fleet:
        </span>
        {lorries.map((l) => {
          const isSelected =
            selectedLorryPlate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ===
            l.plate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const driver = drivers.find((d) => d.id === l.driverId || d.lorryId === l.id);

          return (
            <button
              key={l.id}
              onClick={() => handleSelectLorry(l.plate)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs transition-all shrink-0 cursor-pointer border ${
                isSelected
                  ? 'bg-gradient-to-r from-gold via-gold-400 to-amber-500 text-ink-950 border-gold shadow-lg shadow-gold/25 font-black'
                  : 'border-white/10 bg-ink-900 text-neutral-300 hover:border-gold/40 hover:bg-ink-850 font-semibold'
              }`}
            >
              <TruckIcon className="h-3.5 w-3.5" />
              <span className="font-mono tracking-wide">{l.plate}</span>
              {driver && (
                <span className={`text-[10px] ${isSelected ? 'text-black/80 font-bold' : 'text-neutral-500'}`}>
                  ({driver.name})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Dedicated Fleet Profile & Financial Health Card */}
      <Card className="p-5 bg-gradient-to-r from-ink-900 via-ink-950 to-ink-900 border-gold/40 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 h-48 w-48 rounded-full bg-gold/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Lorry Details */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/50 text-gold shadow-lg shrink-0">
              <TruckIcon className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-wider">
                  {selectedLorryPlate}
                </h2>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
                  {currentSelectedLorry?.status?.toUpperCase() || 'ACTIVE'}
                </span>
                {activeFleetTrip && (
                  <Link
                    to={`/trips/${activeFleetTrip.id}`}
                    className="rounded-full bg-gold/20 border border-gold/40 px-2.5 py-0.5 text-[10px] font-bold text-gold hover:underline flex items-center gap-1"
                  >
                    <span>Active Trip #{activeFleetTrip.code}</span>
                    <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-gold" />
                  Driver: <strong className="text-white font-bold">{currentDriver?.name || 'Assigned Driver'}</strong>
                </span>
                {currentDriver?.phone && (
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <PhoneIcon className="h-3 w-3 text-gold" /> {currentDriver.phone}
                  </span>
                )}
                {currentSelectedLorry?.capacitySqft && (
                  <span className="text-neutral-400">
                    Capacity: <strong className="text-neutral-200">{currentSelectedLorry.capacitySqft.toLocaleString()} sqft</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Fleet's Expense Summary Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                Total Fleet Expense
              </span>
              <span className="text-xl font-black text-gold font-mono">
                {formatINR(fleetKPIs.totalRecorded)}
              </span>
              <span className="text-[10px] text-neutral-400 block">{fleetKPIs.count} expenses logged</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">
                Driver Cash Payouts
              </span>
              <span className="text-xl font-black text-blue-300 font-mono">
                {formatINR(fleetKPIs.totalDriverPaid)}
              </span>
              <span className="text-[10px] text-neutral-400 block">Bata &amp; driver cash pays</span>
            </div>

            <div className="space-y-0.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                Company / Fastag Pays
              </span>
              <span className="text-xl font-black text-neutral-200 font-mono">
                {formatINR(fleetKPIs.totalCompanyPaid)}
              </span>
              <span className="text-[10px] text-neutral-400 block">Bank &amp; direct bills</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Fleet-Specific Financial KPI Cards (Strictly for this vehicle) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="rounded-2xl border border-[#F5B82E]/30 bg-[#F5B82E]/5 p-4 space-y-1">
          <div className="flex items-center gap-2 text-[10.5px] uppercase font-black tracking-wider text-[#F5B82E]">
            <CoinsIcon className="h-3.5 w-3.5" />
            <span>Total Logged</span>
          </div>
          <p className="font-mono text-xl font-black text-white">{formatINR(fleetKPIs.totalRecorded)}</p>
          <p className="text-[10px] text-neutral-400">{fleetKPIs.count} entries for this fleet</p>
        </div>

        <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/5 p-4 space-y-1">
          <div className="flex items-center gap-2 text-[10.5px] uppercase font-black tracking-wider text-yellow-400">
            <FuelIcon className="h-3.5 w-3.5" />
            <span>Diesel &amp; Fuel</span>
          </div>
          <p className="font-mono text-xl font-black text-white">{formatINR(fleetKPIs.totalFuel)}</p>
          <p className="text-[10px] text-neutral-400">Bunk refills &amp; fuel slips</p>
        </div>

        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-4 space-y-1">
          <div className="flex items-center gap-2 text-[10.5px] uppercase font-black tracking-wider text-blue-400">
            <UserIcon className="h-3.5 w-3.5" />
            <span>Driver Bata</span>
          </div>
          <p className="font-mono text-xl font-black text-white">{formatINR(fleetKPIs.totalDriverWages)}</p>
          <p className="text-[10px] text-neutral-400">Food &amp; driver allowance</p>
        </div>

        <div className="rounded-2xl border border-purple-500/25 bg-purple-500/5 p-4 space-y-1">
          <div className="flex items-center gap-2 text-[10.5px] uppercase font-black tracking-wider text-purple-400">
            <MapPinIcon className="h-3.5 w-3.5" />
            <span>Tolls &amp; Fastag</span>
          </div>
          <p className="font-mono text-xl font-black text-white">{formatINR(fleetKPIs.totalToll)}</p>
          <p className="text-[10px] text-neutral-400">Highway toll checkpoints</p>
        </div>

        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4 space-y-1">
          <div className="flex items-center gap-2 text-[10.5px] uppercase font-black tracking-wider text-amber-300">
            <Building2Icon className="h-3.5 w-3.5" />
            <span>Quarry &amp; Hamali</span>
          </div>
          <p className="font-mono text-xl font-black text-amber-300">{formatINR(fleetKPIs.totalQuarryAndHamali)}</p>
          <p className="text-[10px] text-neutral-400">Driver quarry &amp; coolie pays</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-[10.5px] uppercase font-black tracking-wider text-emerald-400">
            <WrenchIcon className="h-3.5 w-3.5" />
            <span>Maintenance</span>
          </div>
          <p className="font-mono text-xl font-black text-white">{formatINR(fleetKPIs.totalMaintenance)}</p>
          <p className="text-[10px] text-neutral-400">Repairs, tyres &amp; grease</p>
        </div>
      </div>

      {/* 5. Filters & Search Deck for this Fleet */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0F141A] p-3 sm:p-4">
        {/* Category Pills & Trip Scope Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Trip Scope Selector */}
          <div className="flex items-center rounded-xl border border-gold/40 bg-black/80 p-1 text-xs shadow-inner">
            <button
              onClick={() => setTripScope('present')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tripScope === 'present'
                  ? 'bg-gradient-to-r from-gold via-gold-400 to-amber-500 text-ink-950 font-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ClockIcon className="h-3.5 w-3.5" />
              <span>Present Active Trip {activeFleetTrip ? `(#${activeFleetTrip.code})` : ''}</span>
            </button>
            <button
              onClick={() => setTripScope('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tripScope === 'all'
                  ? 'bg-gradient-to-r from-gold via-gold-400 to-amber-500 text-ink-950 font-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayersIcon className="h-3.5 w-3.5" />
              <span>All Historical Trips</span>
            </button>
          </div>

          <div className="hidden lg:block h-6 w-[1px] bg-white/10 mx-1" />

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'fuel', label: 'Diesel & Fuel' },
              { id: 'driver', label: 'Driver Bata' },
              { id: 'toll', label: 'Tolls & Fastag' },
              { id: 'quarry_payment', label: 'Quarry Stone Pays' },
              { id: 'hamali', label: 'Hamali & Labour' },
              { id: 'maintenance', label: 'Maintenance' },
              { id: 'other', label: 'Other' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === cat.id
                    ? 'bg-[#F5B82E] text-black shadow-md'
                    : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode & Search Input */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-white/15 bg-black/60 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-gold text-ink-950 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                viewMode === 'grouped' ? 'bg-gold text-ink-950 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Group by Trip
            </button>
          </div>

          <div className="relative flex-1 sm:w-48">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder={`Search ${selectedLorryPlate} expenses...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-black/60 pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-[#F5B82E] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 6. Expenses Data Display (Strictly for this Fleet) */}
      {viewMode === 'list' ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B0F14] shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#121820] text-[10.5px] uppercase font-black text-neutral-400 tracking-wider">
                  <th className="p-4">Expense Description</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Trip Code</th>
                  <th className="p-4">Paid By &amp; Method</th>
                  <th className="p-4 text-right">Amount (₹)</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-neutral-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <TruckIcon className="h-8 w-8 text-neutral-600" />
                        <p className="font-semibold text-neutral-200">
                          {tripScope === 'present' && activeFleetTrip ? (
                            <>No expenses logged yet for present trip <span className="text-gold font-mono">#{activeFleetTrip.code}</span>.</>
                          ) : tripScope === 'present' ? (
                            <>No active trip running for <span className="text-gold font-mono">{selectedLorryPlate}</span> (Vehicle is stationed at depot base).</>
                          ) : (
                            <>No expense records found for <span className="text-gold font-mono">{selectedLorryPlate}</span>.</>
                          )}
                        </p>
                        {tripScope === 'present' && !activeFleetTrip && (
                          <p className="text-xs text-neutral-500">
                            You can click <button onClick={() => setTripScope('all')} className="text-gold underline font-bold cursor-pointer">All Historical Trips</button> to view past completed trip logs.
                          </p>
                        )}
                        {activeFleetTrip && (
                          <button
                            onClick={openModal}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gold/20 border border-gold/40 px-3 py-1.5 text-xs font-bold text-gold hover:bg-gold/30 transition-all cursor-pointer"
                          >
                            <PlusIcon className="h-3.5 w-3.5" /> Record Expense for #{activeFleetTrip.code}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, i) => (
                    <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-xs sm:text-sm">{item.label}</div>
                        {item.notes && (
                          <div className="text-[10px] text-neutral-400 mt-0.5">{item.notes}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            item.category === 'fuel'
                              ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
                              : item.category === 'driver'
                              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                              : item.category === 'toll'
                              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                              : item.category === 'quarry_payment'
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                              : item.category === 'hamali'
                              ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                              : item.category === 'maintenance'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/10 text-neutral-300 border border-white/20'
                          }`}
                        >
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link
                          to={`/trips/${item.tripId}`}
                          className="font-mono font-bold text-[#F5B82E] hover:underline"
                        >
                          #{item.tripCode}
                        </Link>
                        <div className="text-[10px] text-neutral-500 font-mono">{item.date}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold ${
                          item.paidBy === 'driver'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-gold/20 text-gold border border-gold/30'
                        }`}>
                          {item.paymentMode || (item.paidBy === 'driver' ? 'Driver Cash' : 'Owner Bank')}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-black text-white text-sm sm:text-base">
                        {formatINR(item.amount)}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                          <CheckCircle2Icon className="h-3 w-3" /> Logged
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grouped by Trip View for this Fleet */
        <div className="space-y-4">
          {groupedByTrip.length === 0 ? (
            <Card className="p-8 text-center text-neutral-400 text-xs">
              No expenses recorded for {selectedLorryPlate} with the active filter.
            </Card>
          ) : (
            groupedByTrip.map((group) => (
              <Card key={group.tripId} className="overflow-hidden border-ink-700 bg-ink-950/80">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800 bg-ink-900/90 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/trips/${group.tripId}`}
                      className="text-sm font-black font-mono text-gold hover:underline"
                    >
                      Trip #{group.tripCode}
                    </Link>
                    <span className="text-neutral-600">•</span>
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <TruckIcon className="h-3.5 w-3.5 text-neutral-400" /> {group.lorryPlate}
                    </span>
                    <span className="text-neutral-600">•</span>
                    <span className="text-xs text-neutral-400 font-medium">
                      Driver: {group.driverName}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase text-neutral-500 font-semibold block">Trip Expenses Total</span>
                    <span className="text-sm font-black text-gold font-mono">{formatINR(group.total)}</span>
                  </div>
                </div>

                <div className="divide-y divide-ink-800/40 p-2">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-white/[0.02]">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-white">{item.label}</div>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                          <span className="uppercase text-amber-300 font-bold">{item.category.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{item.paymentMode}</span>
                          {item.notes && <span>• {item.notes}</span>}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-white text-sm">
                        {formatINR(item.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* 7. Modal: Record Expense Form (Pre-fills this fleet) */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#F5B82E]/30 bg-[#0F141A] shadow-[0_20px_70px_rgba(0,0,0,0.8)] my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#141B24]">
              <div className="flex items-center gap-2.5">
                <CoinsIcon className="h-5 w-5 text-[#F5B82E]" />
                <h3 className="text-base font-black text-white">Record Expense for {selectedLorryPlate}</h3>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
                  {formError}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diesel 250 Liters, Driver Subhash bata, Toll at Palakkad, or Hamali coolie"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-[#F5B82E] focus:outline-none"
                />
              </div>

              {/* Amount & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    placeholder="e.g. 24000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 font-mono text-sm font-bold text-white placeholder-neutral-500 focus:border-[#F5B82E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white focus:border-[#F5B82E] focus:outline-none"
                  >
                    <option value="fuel">Diesel &amp; Fuel</option>
                    <option value="driver">Driver Bata / Wages</option>
                    <option value="toll">Toll &amp; Fastag</option>
                    <option value="quarry_payment">Quarry Stone Payment</option>
                    <option value="hamali">Hamali (Coolie Labour / Tips)</option>
                    <option value="maintenance">Vehicle Maintenance</option>
                    <option value="police_rto">Police &amp; RTO</option>
                    <option value="other">Other Expense</option>
                  </select>
                </div>
              </div>

              {/* Assign to Trip / Fleet */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Assign to Fleet &amp; Trip *
                </label>
                <select
                  value={formTripId}
                  onChange={(e) => setFormTripId(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white focus:border-[#F5B82E] focus:outline-none"
                >
                  <option value="">-- Choose Assigned Fleet / Trip --</option>
                  {trips.map((t) => {
                    const l = lorries.find((lorry) => lorry.id === t.lorryId || lorry.plate === t.lorryId);
                    const d = drivers.find((driver) => driver.id === t.driverId);
                    const isCurrentVehicle =
                      (l?.plate || t.lorryId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ===
                      selectedLorryPlate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

                    return (
                      <option key={t.id} value={t.id}>
                        {isCurrentVehicle ? '★ [THIS FLEET] ' : ''}{l?.plate || t.lorryId} — #{t.code} ({d?.name || 'Driver'}) [{t.status}]
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Paid By & Payment Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    Paid By *
                  </label>
                  <select
                    value={formPaidBy}
                    onChange={(e) => setFormPaidBy(e.target.value as any)}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white focus:border-[#F5B82E] focus:outline-none"
                  >
                    <option value="driver">Paid by Driver (Cash/Bata)</option>
                    <option value="owner">Paid by Owner / Company</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    Payment Mode
                  </label>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white focus:border-[#F5B82E] focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="PhonePe">PhonePe / UPI</option>
                    <option value="Fastag">Fastag Account</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Fuel Card">HPCL / Fuel Card</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Optional Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bunk receipt slip #4892 or driver reimbursement"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-[#F5B82E] focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-neutral-300 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F5B82E] to-[#E5A81E] px-5 py-2 text-xs font-black text-black shadow-lg hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Record for Fleet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
