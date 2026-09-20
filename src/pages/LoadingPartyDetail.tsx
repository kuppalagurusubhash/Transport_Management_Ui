import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, Filter, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatINR } from '../utils/helpers';
import { useOrders } from '../store/OrdersContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, SectionLabel } from '../components/ui/Card';
import { LoadingPartyModal } from '../components/ui/LoadingPartyModal';
import { type Trip } from '../data/types';

export function LoadingPartyDetail() {
  const { partyId } = useParams();
  const { trips, lorries, drivers, loadingParties, updateLoadingPartyPayments, batchUpdateLoadingPartyPayments, updateLoadingParty } = useOrders();
  const party = loadingParties.find(p => p.id === partyId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLumpSumModalOpen, setIsLumpSumModalOpen] = useState(false);
  const [lumpSumAmount, setLumpSumAmount] = useState('');
  const [lumpSumMode, setLumpSumMode] = useState<'cash' | 'phonepe' | 'bank_transfer' | 'unspecified'>('phonepe');

  // Pagination and filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [tripLorryId, setTripLorryId] = useState('');
  const [tripPageSize, setTripPageSize] = useState(5);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [partyId, tripStartDate, tripEndDate, tripLorryId, tripPageSize]);

  // Auto-distribute any unallocated direct profile payments to trips
  React.useEffect(() => {
    if (!party || trips.length === 0) return;

    // 1. Calculate the sum of all payments recorded on dispatches for this party
    const partyTrips = trips.filter((t) =>
      t.stoneLines.some((line) => line.loadingPartyId === party.id)
    );
    
    const tripPaymentsSum = partyTrips.reduce((acc, t) => {
      const lpPayments = t.loadingPartyPayments || [];
      const partyPaid = lpPayments
        .filter((p) => p.loadingPartyId === party.id)
        .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
      return acc + partyPaid;
    }, 0);

    // The unallocated direct paid amount is:
    const initialPaid = (party.paid || 0) - tripPaymentsSum;

    // Check if there are any unsettled dispatches
    const hasUnsettled = partyTrips.some(trip => {
      const partyLines = (trip.stoneLines || []).filter(line => line.loadingPartyId === party.id);
      const quarryStoneValue = partyLines.reduce((sum, line) => sum + (line.sqftPerPiece * line.pieces * line.ratePerSqft), 0);
      const lpPayments = (trip.loadingPartyPayments || []).filter(p => p.loadingPartyId === party.id);
      const totalPaidForTrip = lpPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      return (quarryStoneValue - totalPaidForTrip) > 0;
    });

    if (initialPaid > 0 && hasUnsettled) {
      let remaining = initialPaid;
      const batchUpdates: { tripId: string; payments: any[] }[] = [];
      const oldestToNewest = [...partyTrips].reverse();

      for (const trip of oldestToNewest) {
        if (remaining <= 0) break;

        const partyLines = (trip.stoneLines || []).filter(line => line.loadingPartyId === party.id);
        const quarryStoneValue = partyLines.reduce((sum, line) => sum + (line.sqftPerPiece * line.pieces * line.ratePerSqft), 0);
        const lpPayments = (trip.loadingPartyPayments || []).filter(p => p.loadingPartyId === party.id);
        const totalPaidForTrip = lpPayments.reduce((sum, p) => sum + p.amountPaid, 0);
        const pending = Math.max(0, quarryStoneValue - totalPaidForTrip);

        if (pending <= 0) continue;

        const allocateAmount = Math.min(remaining, pending);
        const isCleared = (totalPaidForTrip + allocateAmount >= quarryStoneValue);

        const newPayment = {
          id: `lpp-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          loadingPartyId: party.id,
          amountPaid: allocateAmount,
          paidBy: 'owner' as const,
          status: isCleared ? ('paid' as const) : ('pending' as const),
          paymentMode: 'unspecified' as const
        };

        const updatedPayments = [...(trip.loadingPartyPayments || []), newPayment];
        batchUpdates.push({
          tripId: trip.id,
          payments: updatedPayments
        });

        remaining -= allocateAmount;
      }

      if (batchUpdates.length > 0) {
        batchUpdateLoadingPartyPayments(batchUpdates);
        updateLoadingParty(party.id, { paid: Math.max(0, remaining) });
      }
    }
  }, [party, trips, batchUpdateLoadingPartyPayments, updateLoadingParty]);

  // Payments editing states
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [isAddingPaymentTripId, setIsAddingPaymentTripId] = useState<string | null>(null);
  const [quarryAmountPaid, setQuarryAmountPaid] = useState<string>('');
  const [quarryPaymentStatus, setQuarryPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [quarryPaidBy, setQuarryPaidBy] = useState<'owner' | 'driver'>('owner');
  const [quarryPaymentMode, setQuarryPaymentMode] = useState<'cash' | 'phonepe' | 'bank_transfer' | 'unspecified'>('phonepe');

  const handleStartAddPayment = (trip: Trip, remainingBalance: number) => {
    setIsAddingPaymentTripId(trip.id);
    setEditingPaymentId(null);
    setQuarryAmountPaid(String(remainingBalance));
    setQuarryPaymentStatus('paid');
    setQuarryPaidBy('owner');
    setQuarryPaymentMode('phonepe');
  };

  const handleStartEditPayment = (payment: any) => {
    setEditingPaymentId(payment.id);
    setIsAddingPaymentTripId(null);
    setQuarryAmountPaid(String(payment.amountPaid));
    setQuarryPaymentStatus(payment.status);
    setQuarryPaidBy(payment.paidBy);
    setQuarryPaymentMode(payment.paymentMode || 'phonepe');
  };

  const handleSavePayment = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip || !partyId) return;

    const currentPayments = [...(trip.loadingPartyPayments || [])];
    
    if (isAddingPaymentTripId) {
      // Create new payment record
      const newPayment = {
        id: `lpp-${Date.now()}`,
        loadingPartyId: partyId,
        amountPaid: Number(quarryAmountPaid || 0),
        paidBy: quarryPaidBy,
        status: quarryPaymentStatus,
        paymentMode: quarryPaymentMode
      };
      currentPayments.push(newPayment);
    } else if (editingPaymentId) {
      // Update existing payment record
      const index = currentPayments.findIndex(p => p.id === editingPaymentId);
      if (index >= 0) {
        currentPayments[index] = {
          ...currentPayments[index],
          amountPaid: Number(quarryAmountPaid || 0),
          paidBy: quarryPaidBy,
          status: quarryPaymentStatus,
          paymentMode: quarryPaymentMode
        };
      }
    }

    updateLoadingPartyPayments(tripId, currentPayments);
    setIsAddingPaymentTripId(null);
    setEditingPaymentId(null);
  };

  const handleDeletePayment = (tripId: string, paymentId: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    if (!window.confirm("Are you sure you want to delete this payment record?")) return;

    const currentPayments = (trip.loadingPartyPayments || []).filter(p => p.id !== paymentId);
    updateLoadingPartyPayments(tripId, currentPayments);
  };

  const handleSettleLumpSum = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(lumpSumAmount || 0);
    if (amount <= 0 || !partyId || !party) return;

    if (amount > party.pending) {
      alert(`Entered amount (₹${amount.toLocaleString()}) exceeds the total pending balance (₹${party.pending.toLocaleString()}).`);
      return;
    }

    let remaining = amount;
    const batchUpdates: { tripId: string; payments: any[] }[] = [];

    // Filter and sort trips from oldest (bottom) to newest (top)
    const partyTrips = trips.filter((t) =>
      t.stoneLines.some((line) => line.loadingPartyId === party.id)
    );
    const oldestToNewest = [...partyTrips].reverse();

    for (const trip of oldestToNewest) {
      if (remaining <= 0) break;

      const partyLines = (trip.stoneLines || []).filter(line => line.loadingPartyId === partyId);
      const quarryStoneValue = partyLines.reduce((sum, line) => sum + (line.sqftPerPiece * line.pieces * line.ratePerSqft), 0);
      const lpPayments = (trip.loadingPartyPayments || []).filter(p => p.loadingPartyId === partyId);
      const totalPaidForTrip = lpPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const pending = Math.max(0, quarryStoneValue - totalPaidForTrip);

      if (pending <= 0) continue;

      const allocateAmount = Math.min(remaining, pending);
      const isCleared = (totalPaidForTrip + allocateAmount >= quarryStoneValue);

      const newPayment = {
        id: `lpp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        loadingPartyId: partyId,
        amountPaid: allocateAmount,
        paidBy: 'owner' as const,
        status: isCleared ? ('paid' as const) : ('pending' as const),
        paymentMode: lumpSumMode
      };

      const updatedPayments = [...(trip.loadingPartyPayments || []), newPayment];
      batchUpdates.push({
        tripId: trip.id,
        payments: updatedPayments
      });

      remaining -= allocateAmount;
    }

    if (batchUpdates.length > 0) {
      batchUpdateLoadingPartyPayments(batchUpdates);
    }

    setLumpSumAmount('');
    setIsLumpSumModalOpen(false);
  };

  if (!party) {
    return (
      <div className="p-8">
        <p className="text-neutral-400">Loading party not found.</p>
        <Link to="/loading-parties" className="mt-2 inline-block text-gold hover:underline">
          Back to loading parties
        </Link>
      </div>
    );
  }

  // Find all trips where this party loaded stones
  const partyTrips = trips.filter((t) => 
    t.stoneLines.some(line => line.loadingPartyId === party.id)
  );

  const getDriverName = (driverId: string) => {
    return drivers.find(d => d.id === driverId)?.name || 'Unknown Driver';
  };
  const getLorryPlate = (lorryId: string) => {
    return lorries.find(l => l.id === lorryId)?.plate || 'Unknown Lorry';
  };

  // Calculate totals dynamically from dispatches and unallocated paid profile state
  const purchased = partyTrips.reduce((acc, trip) => {
    const partyLines = (trip.stoneLines || []).filter(line => line.loadingPartyId === party.id);
    return acc + partyLines.reduce((sum, line) => sum + (line.sqftPerPiece * line.pieces * line.ratePerSqft), 0);
  }, 0);

  const tripPaymentsSum = partyTrips.reduce((acc, trip) => {
    const lpPayments = (trip.loadingPartyPayments || []).filter(p => p.loadingPartyId === party.id);
    return acc + lpPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  }, 0);

  const unallocatedPaid = Math.max(0, (party.paid || 0) - tripPaymentsSum);
  const paid = unallocatedPaid + tripPaymentsSum;
  const pending = Math.max(0, purchased - paid);

  // Filtered trips
  const filteredTrips = partyTrips.filter((t) => {
    if (tripStartDate && t.date < tripStartDate) return false;
    if (tripEndDate && t.date > tripEndDate) return false;
    if (tripLorryId && t.lorryId !== tripLorryId) return false;
    return true;
  });

  const totalFilteredTrips = filteredTrips.length;
  const totalPages = Math.ceil(totalFilteredTrips / tripPageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);

  const startIndex = (activePage - 1) * tripPageSize;
  const endIndex = Math.min(startIndex + tripPageSize, totalFilteredTrips);
  const displayTrips = filteredTrips.slice(startIndex, endIndex);

  return (
    <div className="min-h-full">
      <PageHeader
        title={party.name}
        subtitle={`Quarry / Loading Party · ${party.location}`}
        action={
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-neutral-400">
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Total Dispatches</span>
                <span className="font-bold text-white text-xs sm:text-sm">{partyTrips.length}</span>
              </div>
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Total Purchased</span>
                <span className="font-bold text-gold text-xs sm:text-sm">{formatINR(purchased)}</span>
              </div>
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Amount Paid</span>
                <span className="font-bold text-green-450 text-xs sm:text-sm">{formatINR(paid)}</span>
              </div>
              <div className="border-r border-ink-700 pr-4 sm:pr-6">
                <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-0.5">Pending Balance</span>
                <span className="font-bold text-white text-xs sm:text-sm">{formatINR(pending)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {party.pending > 0 && (
                <button
                  onClick={() => setIsLumpSumModalOpen(true)}
                  className="rounded-md bg-gold px-3.5 py-1.5 text-xs font-bold text-ink-950 transition-colors hover:bg-gold-400 flex items-center gap-1.5 shadow-md"
                >
                  Settle Balance (Lump-Sum)
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-md border border-ink-700 bg-ink-950 px-3.5 py-1.5 text-xs font-semibold text-neutral-350 transition-colors hover:border-gold hover:text-gold"
              >
                Edit Quarry
              </button>
            </div>
          </div>
        }
      />
      
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <Link
            to="/loading-parties"
            className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white">
            <ArrowLeftIcon className="h-4 w-4" /> All loading parties
          </Link>
        </div>

        {/* Dispatch & Loading Logs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionLabel>Loading Dispatches &amp; Logs ({filteredTrips.length})</SectionLabel>
          </div>

          {partyTrips.length === 0 ? (
            <p className="text-sm text-neutral-600 italic">No loading dispatches logged for this quarry yet.</p>
          ) : (
            <>
              {/* Filters bar */}
              <div className="flex flex-wrap items-center gap-3 bg-ink-950 p-3 rounded-lg border border-ink-800">
                <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
                  <Filter className="h-3.5 w-3.5 text-gold" />
                  <span className="font-bold uppercase tracking-wider">Filter:</span>
                </div>

                {/* Lorry Selector */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={tripLorryId}
                    onChange={(e) => setTripLorryId(e.target.value)}
                    className="rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none min-w-[120px]"
                  >
                    <option value="">All Vehicles</option>
                    {lorries.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.plate}
                      </option>
                    ))}
                  </select>
                </div>

                {/* From Date */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">From</span>
                  <input
                    type="date"
                    value={tripStartDate}
                    onChange={(e) => setTripStartDate(e.target.value)}
                    className="rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none"
                  />
                </div>

                {/* To Date */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">To</span>
                  <input
                    type="date"
                    value={tripEndDate}
                    onChange={(e) => setTripEndDate(e.target.value)}
                    className="rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none"
                  />
                </div>

                {/* Limit Select */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">Limit</span>
                  <select
                    value={tripPageSize}
                    onChange={(e) => setTripPageSize(Number(e.target.value))}
                    className="rounded border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-white focus:border-gold focus:outline-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>

                {/* Clear button */}
                {(tripStartDate || tripEndDate || tripLorryId) && (
                  <button
                    onClick={() => {
                      setTripStartDate('');
                      setTripEndDate('');
                      setTripLorryId('');
                    }}
                    className="inline-flex items-center gap-1 rounded bg-red-500/10 border border-red-500/20 px-2 py-1 text-[10px] text-red-400 font-semibold hover:bg-red-500/20"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {displayTrips.length === 0 && (
                  <p className="text-sm text-neutral-600">No trips match the active filters.</p>
                )}
                {displayTrips.map((trip) => {
                  // Filter lines & payments strictly for THIS loading party
                  const partyLines = (trip.stoneLines || []).filter(line => line.loadingPartyId === party.id);
                  const partyPayments = (trip.workerPayments || []).filter(payment => payment.loadingPartyId === party.id);
                  
                  const totalLoadedSqft = partyLines.reduce((sum, line) => sum + (line.sqftPerPiece * line.pieces), 0);
                  const totalLoadingCost = partyPayments.reduce((sum, p) => sum + p.amount, 0);

                  const driverName = getDriverName(trip.driverId);
                  const lorryPlate = getLorryPlate(trip.lorryId);

                  return (
                    <Card key={trip.id} className="p-5 border border-ink-700 bg-ink-950/40 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-850 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link to={`/trips/${trip.id}`} className="text-sm font-extrabold text-white hover:text-gold transition-colors">
                              {trip.code}
                            </Link>
                            <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                              trip.status === 'loading'
                                ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                                : trip.status === 'in-transit'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                : 'bg-green-500/10 text-green-300 border border-green-500/20'
                            }`}>
                              {trip.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono">Date: {trip.date}</span>
                        </div>

                        <div className="text-right">
                          <span className="block text-[10px] uppercase text-neutral-500 font-semibold">Driver &amp; Vehicle</span>
                          <span className="text-xs font-bold text-neutral-300">{driverName} · {lorryPlate}</span>
                        </div>
                      </div>

                      {/* Loaded Stones Specs & Quantities */}
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                          Quarry Load Dispatched ({totalLoadedSqft} Total Sqft)
                        </p>
                        {partyLines.length === 0 ? (
                          <p className="text-xs text-neutral-600 italic">No load specs recorded.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {partyLines.map((line, idx) => (
                              <div key={idx} className="bg-ink-900 border border-ink-850/80 rounded p-2.5 flex justify-between items-center text-xs">
                                <div>
                                  <p className="font-bold text-neutral-200">{line.size} · {line.thickness} ({line.finish})</p>
                                  <p className="text-[9px] text-neutral-500">Loaded: {line.pieces} pcs</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-mono text-neutral-400">{line.sqftPerPiece * line.pieces} sqft</p>
                                  <p className="font-bold text-gold">{formatINR(line.sqftPerPiece * line.pieces * line.ratePerSqft)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Worker Payments */}
                      {partyPayments.length > 0 && (
                        <div className="border-t border-ink-850 pt-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                              Worker / Loading Payments
                            </p>
                            <span className="text-xs font-bold text-neutral-400">Total: {formatINR(totalLoadingCost)}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {partyPayments.map((payment) => (
                              <div key={payment.id} className="bg-ink-900 border border-ink-850 px-3 py-1.5 rounded-full text-[11px] flex items-center gap-2">
                                <span className="font-bold text-neutral-200">{formatINR(payment.amount)}</span>
                                {payment.note && <span className="text-[9px] text-neutral-500 italic">({payment.note})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stone Purchase & Payment Audit */}
                      {(() => {
                        const quarryStoneValue = partyLines.reduce((sum, line) => sum + (line.sqftPerPiece * line.pieces * line.ratePerSqft), 0);
                        const lpPayments = (trip.loadingPartyPayments || []).filter(p => p.loadingPartyId === party.id);
                        const totalPaidForTrip = lpPayments.reduce((sum, p) => sum + p.amountPaid, 0);
                        const tripRemaining = Math.max(0, quarryStoneValue - totalPaidForTrip);
                        const isAdding = isAddingPaymentTripId === trip.id;
                        const activeEditPayment = lpPayments.find(p => p.id === editingPaymentId);

                        return (
                          <div className="border-t border-ink-850 pt-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                                Stone Purchase &amp; Payment Audit
                              </p>
                              {!isAdding && !activeEditPayment && (
                                <span className={`text-xs font-bold ${tripRemaining <= 0 ? 'text-green-400' : 'text-amber-400'}`}>
                                  {tripRemaining <= 0 ? 'Cleared' : 'Unsettled'}
                                </span>
                              )}
                            </div>

                            {/* Render list of recorded payments */}
                            {!isAdding && !activeEditPayment && lpPayments.length > 0 && (
                              <div className="space-y-1.5">
                                {lpPayments.map((p) => (
                                  <div key={p.id} className="bg-ink-900 border border-ink-850/60 p-2.5 rounded-xl flex items-center justify-between text-xs">
                                    <div className="font-mono">
                                      Paid: <strong className="text-green-400">{formatINR(p.amountPaid)}</strong> ({p.paidBy === 'owner' ? 'Owner' : 'Driver'} via <span className="capitalize text-neutral-350">{p.paymentMode || 'unspecified'}</span>)
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleStartEditPayment(p)}
                                        className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-1 rounded border border-gold/20 hover:bg-gold hover:text-ink-950 transition-colors"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeletePayment(trip.id, p.id)}
                                        className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {isAdding || activeEditPayment ? (
                              <div className="bg-ink-900 border border-ink-800 p-4 rounded-xl space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                                  <div>
                                    <label className="block text-[10px] text-neutral-500 uppercase font-semibold mb-1">Amount Paid (₹)</label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={quarryAmountPaid}
                                      onChange={(e) => setQuarryAmountPaid(e.target.value)}
                                      className="w-full rounded border border-ink-700 bg-ink-950 px-2 py-1.5 text-white focus:border-gold focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-neutral-500 uppercase font-semibold mb-1">Paid By</label>
                                    <select
                                      value={quarryPaidBy}
                                      onChange={(e) => setQuarryPaidBy(e.target.value as 'owner' | 'driver')}
                                      className="w-full rounded border border-ink-700 bg-ink-950 px-2 py-1.5 text-white focus:border-gold focus:outline-none"
                                    >
                                      <option value="owner">Owner</option>
                                      <option value="driver">Driver</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-neutral-500 uppercase font-semibold mb-1">Payment Mode</label>
                                    <select
                                      value={quarryPaymentMode}
                                      onChange={(e) => setQuarryPaymentMode(e.target.value as 'cash' | 'phonepe' | 'bank_transfer' | 'unspecified')}
                                      className="w-full rounded border border-ink-700 bg-ink-950 px-2 py-1.5 text-white focus:border-gold focus:outline-none"
                                    >
                                      <option value="cash">Cash</option>
                                      <option value="phonepe">PhonePe</option>
                                      <option value="bank_transfer">Bank Transfer</option>
                                      <option value="unspecified">Unspecified</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-neutral-500 uppercase font-semibold mb-1">Status</label>
                                    <select
                                      value={quarryPaymentStatus}
                                      onChange={(e) => setQuarryPaymentStatus(e.target.value as 'paid' | 'pending')}
                                      className="w-full rounded border border-ink-700 bg-ink-950 px-2 py-1.5 text-white focus:border-gold focus:outline-none"
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="paid">Paid</option>
                                    </select>
                                  </div>
                                </div>
                                
                                <div className="text-[10px] text-neutral-450 flex flex-wrap justify-between items-center gap-2 border-t border-ink-850/40 pt-2.5">
                                  <span>Trip Stone Value: <strong className="text-white">{formatINR(quarryStoneValue)}</strong></span>
                                  <span>Already Paid: <strong className="text-green-400">{formatINR(totalPaidForTrip - (activeEditPayment ? activeEditPayment.amountPaid : 0))}</strong></span>
                                  <span>Remaining Balance: <strong className="text-amber-400 font-mono">{formatINR(quarryStoneValue - (totalPaidForTrip - (activeEditPayment ? activeEditPayment.amountPaid : 0)))}</strong></span>
                                </div>

                                <div className="flex justify-end gap-2 text-xs">
                                  <button
                                    onClick={() => {
                                      setIsAddingPaymentTripId(null);
                                      setEditingPaymentId(null);
                                    }}
                                    className="rounded border border-ink-750 px-3 py-1 text-neutral-400 hover:text-white"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSavePayment(trip.id)}
                                    className="rounded bg-gold px-4 py-1 font-bold text-ink-950 hover:bg-gold-400"
                                  >
                                    Save Payment
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-ink-900/60 border border-ink-850 p-3 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
                                <div className="space-y-1">
                                  <p className="text-neutral-450 flex items-center gap-2">
                                    Loaded Stone Value: <strong className="text-white">{formatINR(quarryStoneValue)}</strong>
                                  </p>
                                  {lpPayments.length === 0 && (
                                    <p className="text-[11.5px] text-neutral-500 italic">No payments logged yet.</p>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-6">
                                  <div className="text-right">
                                    <p className="text-[10px] uppercase text-neutral-500 font-semibold mb-0.5">Trip Balance Pending</p>
                                    <p className={`text-sm font-black font-mono ${tripRemaining <= 0 ? 'text-green-400' : 'text-amber-400'}`}>
                                      {formatINR(tripRemaining)}
                                    </p>
                                  </div>
                                  
                                  <button
                                    onClick={() => handleStartAddPayment(trip, tripRemaining)}
                                    className="rounded bg-gold/10 border border-gold/30 text-gold px-3.5 py-1.5 text-xs font-bold hover:bg-gold hover:text-ink-950 transition-all active:scale-[0.98]"
                                  >
                                    {lpPayments.length > 0 ? 'Add Payment' : 'Pay Quarry'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </Card>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-ink-800 pt-4 text-xs text-neutral-400">
                  <span>
                    Showing <strong className="text-white font-medium">{startIndex + 1}</strong> to Extent <strong className="text-white font-medium">{endIndex}</strong> of{' '}
                    <strong className="text-gold font-semibold">{totalFilteredTrips}</strong> dispatch{totalFilteredTrips !== 1 ? 'es' : ''}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={activePage === 1}
                      className="inline-flex h-7 w-7 items-center justify-center rounded border border-ink-700 bg-ink-900 text-neutral-400 transition-colors hover:border-gold hover:text-gold disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-[11px] text-neutral-500 font-medium px-2">
                      Page {activePage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={activePage === totalPages}
                      className="inline-flex h-7 w-7 items-center justify-center rounded border border-ink-700 bg-ink-900 text-neutral-400 transition-colors hover:border-gold hover:text-gold disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}   </div>

      </div>

      <LoadingPartyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        partyToEdit={party}
      />

      {/* Lump-Sum Settlement Modal */}
      {isLumpSumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-lg border border-ink-700 bg-ink-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-800 px-5 py-4">
              <h3 className="text-base font-extrabold text-white">
                Record Lump-Sum Payment to {party.name}
              </h3>
              <button
                onClick={() => setIsLumpSumModalOpen(false)}
                className="text-neutral-500 hover:text-white transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSettleLumpSum} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5 flex justify-between">
                  <span>Amount to Settle (₹)</span>
                  <span className="text-[10px] text-neutral-450 normal-case font-normal">Max: {formatINR(party.pending)}</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={party.pending}
                  required
                  placeholder="e.g. 50000"
                  value={lumpSumAmount}
                  onChange={(e) => setLumpSumAmount(e.target.value)}
                  className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
                />
                <p className="mt-1.5 text-[10px] text-neutral-500 leading-normal">
                  This payment will automatically settle the oldest dispatches first (from bottom to top) until fully cleared.
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
                  Payment Mode
                </label>
                <select
                  value={lumpSumMode}
                  onChange={(e) => setLumpSumMode(e.target.value as any)}
                  className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                >
                  <option value="phonepe">PhonePe</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="unspecified">Unspecified</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLumpSumModalOpen(false)}
                  className="rounded-md border border-ink-700 px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-gold px-4 py-2 text-xs font-semibold text-ink-950 hover:bg-gold-400 transition-colors"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
