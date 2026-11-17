import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useOrders } from '../store/OrdersContext';
import { formatINR } from '../utils/helpers';
import type { ExpenseCategory, Trip } from '../data/types';
import {
  FuelIcon,
  MapPinIcon,
  WrenchIcon,
  PlusIcon,
  CheckCircle2Icon,
  TruckIcon,
  UserIcon,
  SearchIcon,
  XIcon,
  Building2Icon,
  LayersIcon,
  ChevronDownIcon,
  PhoneIcon,
  LayoutListIcon,
  LayoutGridIcon,
  WeightIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Expenses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { trips, lorries, drivers, loadingParties, addExpenseToTrip } = useOrders();

  // Find default fleet: prefer AP 02BH 3666 if exists, otherwise first lorry or fallback
  const defaultPlate = useMemo(() => {
    const matched = lorries.find((l) => l.plate.toUpperCase().includes('3666') || l.plate.toUpperCase().includes('AP 02'));
    if (matched) return matched.plate;
    if (lorries.length > 0) return lorries[0].plate;
    return 'AP 02BH 3666';
  }, [lorries]);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedLorryPlate, setSelectedLorryPlate] = useState<string>(defaultPlate);
  const [tripScope, setTripScope] = useState<'present' | 'all'>('present');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);

  // Form State for Expense Recording
  const [formDescription, setFormDescription] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('fuel');
  const [formTripId, setFormTripId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentMode, setFormPaymentMode] = useState<string>('Fastag');
  const [formPaidBy, setFormPaidBy] = useState<'owner' | 'driver'>('owner');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync with URL params if provided
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

  // Extract all expenses across trips
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
      const lorryPlate = lorry?.plate || t.lorryId || 'AP 02BH 3666';
      const driver = drivers.find((d) => d.id === t.driverId);
      const driverName = driver?.name || 'Subhash';

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
          paymentMode: isDriverPaid ? 'Driver Cash' : 'Company Account',
          paidBy: isDriverPaid ? 'driver' : 'owner',
          status: e.review || 'approved'
        });
      });

      // Quarry stone payments
      (t.loadingPartyPayments || []).forEach((lpPay, idx) => {
        const expKey = `exp-quarry-${lpPay.loadingPartyId}`;
        if (lpPay.paidBy === 'driver' && Number(lpPay.amountPaid) > 0 && !recordedExpIds.has(expKey)) {
          const party = loadingParties.find((p) => p.id === lpPay.loadingPartyId);
          list.push({
            id: `lpp-${t.id}-${idx}`,
            label: `Quarry Stone Payment - ${party?.name || 'Quarry'}`,
            amount: Number(lpPay.amountPaid),
            category: 'quarry_payment',
            tripCode: t.code,
            tripId: t.id,
            lorryPlate,
            driverName,
            date: t.date || 'Recent',
            notes: `Paid by driver via ${lpPay.paymentMode || 'cash'}`,
            paymentMode: `Driver ${lpPay.paymentMode?.toUpperCase() || 'CASH'}`,
            paidBy: 'driver',
            status: lpPay.status || 'paid'
          });
        }
      });

      // Hamali / Labour payments
      (t.workerPayments || []).forEach((wPay, idx) => {
        const isDriver = (wPay as any).paidBy === 'driver' || wPay.note?.toLowerCase().includes('driver');
        const wExpKey = `w-hamali-${wPay.loadingPartyId}`;
        if (isDriver && Number(wPay.amount) > 0 && !recordedExpIds.has(wExpKey) && !recordedExpIds.has(wPay.id)) {
          const party = loadingParties.find((p) => p.id === wPay.loadingPartyId);
          list.push({
            id: `wp-${t.id}-${idx}`,
            label: `Hamali Labour / Tips - ${party?.name || 'Quarry'}`,
            amount: Number(wPay.amount),
            category: 'hamali',
            tripCode: t.code,
            tripId: t.id,
            lorryPlate,
            driverName,
            date: t.date || 'Recent',
            notes: wPay.note || 'Labour wages',
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
    return (
      lorries.find(
        (l) => l.plate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === selectedLorryPlate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      ) ||
      lorries[0] ||
      null
    );
  }, [selectedLorryPlate, lorries]);

  // Assigned Driver for the selected fleet
  const currentDriver = useMemo(() => {
    if (!currentSelectedLorry) return null;
    return (
      drivers.find((d) => d.id === currentSelectedLorry.driverId || d.lorryId === currentSelectedLorry.id) ||
      drivers[0] ||
      null
    );
  }, [currentSelectedLorry, drivers]);

  const activeStages = useMemo(
    () => [
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
    ],
    []
  );

  // Active in-progress trip for this fleet
  const activeFleetTrip = useMemo(() => {
    if (!currentSelectedLorry) return null;
    const cleanSelected = (currentSelectedLorry.plate || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const lorryId = currentSelectedLorry.id;

    return (
      trips.find(
        (t) =>
          (t.lorryId === lorryId || (t.lorryId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanSelected) &&
          activeStages.includes(t.status as string)
      ) || null
    );
  }, [currentSelectedLorry, trips, activeStages]);

  // Filtered Expenses strictly for this SELECTED FLEET and Trip Scope
  const fleetSpecificExpenses = useMemo(() => {
    const cleanFilterPlate = selectedLorryPlate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const lorryExpenses = allExpenses.filter((item) => {
      const cleanItemPlate = item.lorryPlate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return cleanItemPlate.includes(cleanFilterPlate);
    });

    if (tripScope === 'present') {
      if (!activeFleetTrip) {
        return [];
      }
      return lorryExpenses.filter((item) => item.tripId === activeFleetTrip.id || item.tripCode === activeFleetTrip.code);
    }

    return lorryExpenses;
  }, [allExpenses, selectedLorryPlate, tripScope, activeFleetTrip]);

  // Filtered by Category and Search query
  const filteredList = useMemo(() => {
    return fleetSpecificExpenses.filter((item) => {
      if (filterCategory !== 'all') {
        if (filterCategory === 'quarry_pays') {
          if (item.category !== 'quarry_payment') return false;
        } else if (filterCategory === 'hamali_labour') {
          if (item.category !== 'hamali') return false;
        } else if (item.category !== filterCategory) {
          return false;
        }
      }
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

  // KPIs strictly computed for the SELECTED FLEET
  const fleetKPIs = useMemo(() => {
    const totalRecorded = fleetSpecificExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalFuel = fleetSpecificExpenses
      .filter((e) => e.category === 'fuel')
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
    const totalOther = fleetSpecificExpenses
      .filter((e) => e.category === 'other' || e.category === 'driver')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      totalRecorded,
      totalFuel,
      totalToll,
      totalQuarryAndHamali,
      totalMaintenance,
      totalOther
    };
  }, [fleetSpecificExpenses]);

  // Switch fleet handler
  const handleSelectLorry = (plate: string) => {
    setSelectedLorryPlate(plate);
    setSearchParams({ lorry: plate });
  };

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
    <div className="min-h-full space-y-5 p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#F5B82E]/30 selection:text-[#F5B82E]">
      {/* 1. TOP HEADER ROW: TITLE, BADGE, FLEET SELECTOR & RECORD BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Tag, Plate & Active Status */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#F5B82E] font-medium">
            <TruckIcon className="h-3.5 w-3.5" />
            <span className="text-neutral-400">Fleet Expenses Profile</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              {selectedLorryPlate}
            </h1>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-xs font-semibold text-emerald-400">
              Active
            </span>
          </div>
        </div>

        {/* Right: Fleet Dropdown & Record Expense CTA Button */}
        <div className="flex items-center gap-3">
          {/* Lorry Selector Dropdown Pill */}
          <div className="relative">
            <select
              value={selectedLorryPlate}
              onChange={(e) => handleSelectLorry(e.target.value)}
              className="appearance-none rounded-xl border border-white/[0.08] bg-[#121820]/90 pl-10 pr-9 py-2.5 text-xs sm:text-sm font-bold text-white hover:border-white/20 focus:border-[#F5B82E] focus:outline-none cursor-pointer backdrop-blur-md shadow-sm transition-colors"
            >
              {lorries.map((l) => (
                <option key={l.id} value={l.plate} className="bg-[#0B1015] text-white">
                  {l.plate}
                </option>
              ))}
            </select>
            <TruckIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
          </div>

          {/* Record Expense Solid Gold Button */}
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 rounded-xl bg-[#F5B82E] hover:bg-[#e5a820] active:scale-[0.98] px-4 py-2.5 text-xs sm:text-sm font-bold text-neutral-950 shadow-[0_4px_16px_rgba(245,184,46,0.3)] transition-all cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* 2. FLEET SHOWCASE CARD: 3D TRUCK & DRIVER TELEMETRY */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#0C1118]/95 via-[#0A0E14]/90 to-[#141920]/90 p-4 sm:p-5 backdrop-blur-2xl shadow-xl">
        {/* Subtle Ambient Gold Sweep Highlight */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 85% 95%, rgba(245, 184, 46, 0.4) 0%, transparent 60%)'
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5 sm:gap-8">
          {/* 3D Truck Silhouette / Showcase Render */}
          <div className="relative h-20 sm:h-24 w-44 sm:w-52 shrink-0 flex items-center justify-center">
            <img
              src="/fleet/ashok_leyland_hd.png"
              alt="Fleet Truck"
              className="h-full w-full object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] select-none"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          {/* Vehicle & Driver Metadata Inset */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 flex-1">
            {/* Driver Column */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-300">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <p className="text-[11px] text-neutral-400 font-medium">Driver</p>
                <p className="text-sm font-bold text-white mt-0.5">{currentDriver?.name || 'Subhash'}</p>
              </div>
            </div>

            {/* Phone Column */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-300">
                <PhoneIcon className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <p className="text-[11px] text-neutral-400 font-medium">Phone</p>
                <p className="text-sm font-bold text-white mt-0.5 font-mono">
                  {currentDriver?.phone || '7732010001'}
                </p>
              </div>
            </div>

            {/* Capacity Column */}
            <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-300">
                <WeightIcon className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <p className="text-[11px] text-neutral-400 font-medium">Capacity</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {(currentSelectedLorry?.capacitySqft || 1805).toLocaleString()} sqft
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. EXPENSES OVERVIEW HEADING & 5 COMPACT KPI GLASS CARDS */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-white">
          Expenses Overview
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
          {/* Card 1: Diesel & Fuel */}
          <div className="relative overflow-hidden rounded-2xl border border-[#F5B82E]/25 bg-[#14120C]/80 p-3.5 sm:p-4 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5B82E]/10 border border-[#F5B82E]/30 text-[#F5B82E]">
                <FuelIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-neutral-300 font-medium truncate">Diesel &amp; Fuel</p>
                <p className="text-lg sm:text-xl font-bold text-white font-mono mt-0.5">
                  {formatINR(fleetKPIs.totalFuel)}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Tolls & Fastag */}
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-[#0F141E]/80 p-3.5 sm:p-4 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <MapPinIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-neutral-300 font-medium truncate">Tolls &amp; Fastag</p>
                <p className="text-lg sm:text-xl font-bold text-white font-mono mt-0.5">
                  {formatINR(fleetKPIs.totalToll)}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Quarry & Hamali */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-600/20 bg-[#16120E]/80 p-3.5 sm:p-4 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Building2Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-neutral-300 font-medium truncate">Quarry &amp; Hamali</p>
                <p className="text-lg sm:text-xl font-bold text-white font-mono mt-0.5">
                  {formatINR(fleetKPIs.totalQuarryAndHamali)}
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Maintenance */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#0E1713]/80 p-3.5 sm:p-4 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <WrenchIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-neutral-300 font-medium truncate">Maintenance</p>
                <p className="text-lg sm:text-xl font-bold text-white font-mono mt-0.5">
                  {formatINR(fleetKPIs.totalMaintenance)}
                </p>
              </div>
            </div>
          </div>

          {/* Card 5: Other */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111419]/80 p-3.5 sm:p-4 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-0.5 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.1] text-neutral-300">
                <LayersIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-neutral-300 font-medium truncate">Other</p>
                <p className="text-lg sm:text-xl font-bold text-white font-mono mt-0.5">
                  {formatINR(fleetKPIs.totalOther)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SCOPE SWITCHER & CATEGORY FILTER CHIPS ROW */}
      <div className="space-y-3 pt-1">
        {/* Scope Pill Switcher: Present Trip / All Trips */}
        <div className="flex items-center">
          <div className="inline-flex rounded-xl bg-[#10141B] p-1 border border-white/[0.08]">
            <button
              onClick={() => setTripScope('present')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                tripScope === 'present'
                  ? 'bg-[#F5B82E] text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Present Trip
            </button>
            <button
              onClick={() => setTripScope('all')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                tripScope === 'all'
                  ? 'bg-[#F5B82E] text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Trips
            </button>
          </div>
        </div>

        {/* Category Filter Chips & View Mode Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Horizontal Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 ti-scroll">
            {[
              { id: 'all', label: 'All' },
              { id: 'fuel', label: 'Diesel & Fuel' },
              { id: 'driver', label: 'Driver Bata' },
              { id: 'toll', label: 'Tolls & Fastag' },
              { id: 'quarry_pays', label: 'Quarry Pays' },
              { id: 'hamali_labour', label: 'Hamali & Labour' },
              { id: 'maintenance', label: 'Maintenance' },
              { id: 'other', label: 'Other' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  filterCategory === cat.id
                    ? 'bg-[#F5B82E] text-neutral-950 shadow-sm'
                    : 'bg-[#10151D] border border-white/[0.06] text-neutral-300 hover:bg-white/[0.08]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Right: View Mode Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center rounded-xl bg-[#10141B] p-1 border border-white/[0.08]">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#F5B82E] text-neutral-950'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="List View"
                aria-label="List View"
              >
                <LayoutListIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#F5B82E] text-neutral-950'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGridIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. TABLE / EXPENSES DATA VIEW */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A0E14]/80 backdrop-blur-xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#0E131A]/90 text-[11px] font-semibold text-neutral-400">
                <th className="py-3.5 px-5">Description</th>
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Trip Code</th>
                <th className="py-3.5 px-5">Paid By</th>
                <th className="py-3.5 px-5 text-right">Amount (₹)</th>
                <th className="py-3.5 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 px-4 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#F5B82E]/30 bg-[#F5B82E]/10 text-[#F5B82E] shadow-[0_0_20px_rgba(245,184,46,0.15)] mb-3">
                        <TruckIcon className="h-7 w-7" />
                      </div>
                      <p className="text-sm font-bold text-white">No expenses recorded yet</p>
                      <button
                        onClick={openModal}
                        className="mt-3 flex items-center gap-1.5 rounded-xl border border-[#F5B82E]/40 px-4 py-2 text-xs font-bold text-[#F5B82E] hover:bg-[#F5B82E]/10 transition-colors cursor-pointer"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        <span>Record Expense</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-white text-xs sm:text-sm">{item.label}</p>
                      {item.notes && (
                        <p className="text-[10px] text-neutral-400 mt-0.5">{item.notes}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          item.category === 'fuel'
                            ? 'bg-[#F5B82E]/15 text-[#F5B82E] border border-[#F5B82E]/30'
                            : item.category === 'toll'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : item.category === 'quarry_payment'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : item.category === 'hamali'
                            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                            : item.category === 'maintenance'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/10 text-neutral-300 border border-white/20'
                        }`}
                      >
                        {item.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <Link
                        to={`/trips/${item.tripId}`}
                        className="font-mono font-bold text-[#F5B82E] hover:underline"
                      >
                        #{item.tripCode}
                      </Link>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-neutral-300 text-xs font-medium">
                        {item.paidBy === 'driver' ? 'Driver Cash' : 'Owner Fastag / Bank'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-white text-sm">
                      {formatINR(item.amount)}
                    </td>
                    <td className="py-3.5 px-5 text-center">
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

      {/* RECORD EXPENSE FROSTED MODAL */}
      <AnimatePresence>
        {isRecordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl border border-white/[0.12] bg-[#0E141C]/95 p-6 shadow-2xl backdrop-blur-2xl text-neutral-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F5B82E]/15 text-[#F5B82E] border border-[#F5B82E]/30">
                    <PlusIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Record Fleet Expense</h3>
                    <p className="text-[11px] text-neutral-400 font-mono">{selectedLorryPlate}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRecordModalOpen(false)}
                  className="rounded-xl p-1 text-neutral-400 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateExpense} className="mt-4 space-y-4">
                {/* Trip Assignment */}
                <div className="space-y-1 text-left">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                    Assign to Trip
                  </label>
                  <select
                    value={formTripId}
                    onChange={(e) => setFormTripId(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#070B10] py-2.5 px-3 text-xs sm:text-sm text-white focus:border-[#F5B82E] focus:outline-none"
                  >
                    {trips.map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#0B1015]">
                        Trip #{t.code} &bull; {t.lorryId} &bull; {t.status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category & Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                      className="w-full rounded-xl border border-white/[0.1] bg-[#070B10] py-2.5 px-3 text-xs sm:text-sm text-white focus:border-[#F5B82E] focus:outline-none"
                    >
                      <option value="fuel" className="bg-[#0B1015]">Diesel &amp; Fuel</option>
                      <option value="toll" className="bg-[#0B1015]">Tolls &amp; Fastag</option>
                      <option value="quarry_payment" className="bg-[#0B1015]">Quarry Stone Payment</option>
                      <option value="hamali" className="bg-[#0B1015]">Hamali &amp; Labour Wages</option>
                      <option value="maintenance" className="bg-[#0B1015]">Maintenance &amp; Tyres</option>
                      <option value="driver" className="bg-[#0B1015]">Driver Allowance (Bata)</option>
                      <option value="other" className="bg-[#0B1015]">Other Miscellaneous</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="e.g. 3500"
                      className="w-full rounded-xl border border-white/[0.1] bg-[#070B10] py-2.5 px-3 text-xs sm:text-sm text-white font-mono placeholder-neutral-600 focus:border-[#F5B82E] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1 text-left">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g. Fastag toll deduction at Salem Plaza"
                    className="w-full rounded-xl border border-white/[0.1] bg-[#070B10] py-2.5 px-3 text-xs sm:text-sm text-white placeholder-neutral-600 focus:border-[#F5B82E] focus:outline-none"
                  />
                </div>

                {/* Paid By & Payment Mode */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                      Paid By
                    </label>
                    <select
                      value={formPaidBy}
                      onChange={(e) => setFormPaidBy(e.target.value as 'owner' | 'driver')}
                      className="w-full rounded-xl border border-white/[0.1] bg-[#070B10] py-2.5 px-3 text-xs sm:text-sm text-white focus:border-[#F5B82E] focus:outline-none"
                    >
                      <option value="owner" className="bg-[#0B1015]">Company Account</option>
                      <option value="driver" className="bg-[#0B1015]">Driver Cash</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                      Payment Mode
                    </label>
                    <select
                      value={formPaymentMode}
                      onChange={(e) => setFormPaymentMode(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.1] bg-[#070B10] py-2.5 px-3 text-xs sm:text-sm text-white focus:border-[#F5B82E] focus:outline-none"
                    >
                      <option value="Fastag" className="bg-[#0B1015]">Fastag</option>
                      <option value="Cash" className="bg-[#0B1015]">Cash</option>
                      <option value="UPI / Online" className="bg-[#0B1015]">UPI / GPay</option>
                      <option value="Bank Account" className="bg-[#0B1015]">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-[#F5B82E] hover:bg-[#e5a820] active:scale-[0.98] px-5 py-2.5 text-xs font-bold text-neutral-950 shadow-[0_4px_16px_rgba(245,184,46,0.3)] transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Recording...' : 'Save Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
