import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  PlusIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ArrowRightIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  HistoryIcon,
  XIcon
} from 'lucide-react';
import { formatINR } from '../../utils/helpers';
import type { Trip, UnloadingParty, UnloadingAllocation, OrderReassignmentRecord } from '../../data/types';
import { tripUnloadingApi } from '../../api';
import { CancelReassignModal } from '../ui/CancelReassignModal';

interface MultiPartyUnloadingCardProps {
  trip: Trip;
  unloadingParties: UnloadingParty[];
  onTripUpdated: () => void;
}

export function MultiPartyUnloadingCard({
  trip,
  unloadingParties,
  onTripUpdated
}: MultiPartyUnloadingCardProps) {
  const [allocations, setAllocations] = useState<UnloadingAllocation[]>([]);
  const [reassignments, setReassignments] = useState<OrderReassignmentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Allocate party modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('Palakkad');
  const [piecesAssigned, setPiecesAssigned] = useState('');
  const [agreedRate, setAgreedRate] = useState('40');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [savingAdd, setSavingAdd] = useState(false);

  // Delivery record modal
  const [deliveringAlloc, setDeliveringAlloc] = useState<UnloadingAllocation | null>(null);
  const [deliveredCount, setDeliveredCount] = useState('');
  const [damagedCount, setDamagedCount] = useState('0');
  const [damageReason, setDamageReason] = useState('');
  const [collectedAmount, setCollectedAmount] = useState('0');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [savingDelivery, setSavingDelivery] = useState(false);

  // Cancellation & Reassignment modal
  const [reassignAlloc, setReassignAlloc] = useState<UnloadingAllocation | null>(null);

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const [allocRes, histRes] = await Promise.all([
        tripUnloadingApi.getAllocations(trip.id),
        tripUnloadingApi.getAllocationHistory(trip.id).catch(() => ({
          success: false,
          tripId: trip.id,
          tripCode: trip.code,
          allocations: [],
          reassignments: []
        }))
      ]);

      if (allocRes?.allocations) {
        setAllocations(allocRes.allocations);
      }
      if (histRes?.reassignments) {
        setReassignments(histRes.reassignments);
      }
    } catch (err) {
      console.error('Failed to load unloading allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [trip.id]);

  const handlePartySelect = (pId: string) => {
    setSelectedPartyId(pId);
    const match = unloadingParties.find(p => p.id === pId);
    if (match) {
      setPartyName(match.name);
      setDeliveryLocation(match.district || 'Palakkad');
      setContactPhone(match.phone || '');
    }
  };

  const handleAddAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartyId || !piecesAssigned) return;

    setSavingAdd(true);
    try {
      await tripUnloadingApi.addAllocation(trip.id, {
        unloadingPartyId: selectedPartyId,
        partyName: partyName || selectedPartyId,
        deliveryLocation,
        contactPhone,
        piecesAssigned: Number(piecesAssigned),
        agreedRate: Number(agreedRate) || 40,
        deliveryDate: trip.date,
        deliveryNotes: notes
      });

      setIsAddModalOpen(false);
      await fetchAllocations();
      onTripUpdated();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to add party allocation.');
    } finally {
      setSavingAdd(false);
    }
  };

  const handleRecordDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveringAlloc) return;

    setSavingDelivery(true);
    try {
      await tripUnloadingApi.recordDelivery(trip.id, deliveringAlloc.id, {
        piecesDelivered: Number(deliveredCount),
        piecesDamaged: Number(damagedCount) || 0,
        damageReason: damageReason.trim(),
        amountReceived: Number(collectedAmount) || 0,
        deliveryNotes: deliveryNotes.trim()
      });

      setDeliveringAlloc(null);
      await fetchAllocations();
      onTripUpdated();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to record delivery.');
    } finally {
      setSavingDelivery(false);
    }
  };

  // Summaries
  const totalLoadedPieces = (trip.loadingEntries || []).reduce((s, e) => s + (Number(e.pieces) || 0), 0) ||
    (trip.stoneLines || []).reduce((s, l) => s + (Number(l.pieces) || 0), 0);

  const totalAssignedPieces = allocations
    .filter(a => a.status !== 'cancelled')
    .reduce((s, a) => s + (Number(a.piecesAssigned || a.piecesDelivered) || 0), 0);

  const totalDeliveredPieces = allocations
    .filter(a => a.status === 'delivered')
    .reduce((s, a) => s + (Number(a.piecesDelivered) || 0), 0);

  const totalBilled = allocations
    .filter(a => a.status !== 'cancelled')
    .reduce((s, a) => s + (Number(a.totalDeliveryAmount) || 0), 0);

  const totalReceived = allocations
    .filter(a => a.status !== 'cancelled')
    .reduce((s, a) => s + (Number(a.amountReceived) || 0), 0);

  const remainingToDeliver = Math.max(0, totalLoadedPieces - totalDeliveredPieces);

  return (
    <div className="space-y-5">
      {/* Header and Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-gold" />
          <h3 className="text-base font-extrabold text-white">Multiple Unloading Parties in Kerala</h3>
          <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
            {allocations.length} Customer {allocations.length === 1 ? 'Stop' : 'Stops'}
          </span>
        </div>

        <button
          onClick={() => {
            setSelectedPartyId(unloadingParties[0]?.id || '');
            handlePartySelect(unloadingParties[0]?.id || '');
            setPiecesAssigned(String(Math.max(0, totalLoadedPieces - totalAssignedPieces)));
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-md"
        >
          <PlusIcon className="h-4 w-4" />
          <span>+ Allocate Kerala Party Destination</span>
        </button>
      </div>

      {/* Unloading KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="rounded-xl border border-white/10 bg-[#161821] p-3 shadow-md">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Loaded on Lorry</span>
          <span className="font-mono text-base font-black text-white mt-1 block">
            {totalLoadedPieces.toLocaleString('en-IN')} pcs
          </span>
          <span className="text-[10px] text-neutral-500">From Quarry Operations</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161821] p-3 shadow-md">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Allocated</span>
          <span className="font-mono text-base font-black text-blue-400 mt-1 block">
            {totalAssignedPieces.toLocaleString('en-IN')} pcs
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            {Math.max(0, totalLoadedPieces - totalAssignedPieces)} unallocated
          </span>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161821] p-3 shadow-md">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Delivered Sound</span>
          <span className="font-mono text-base font-black text-emerald-400 mt-1 block">
            {totalDeliveredPieces.toLocaleString('en-IN')} pcs
          </span>
          <span className="text-[10px] text-neutral-500">Completed Deliveries</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161821] p-3 shadow-md">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Amount Billed</span>
          <span className="font-mono text-base font-black text-white mt-1 block">
            {formatINR(totalBilled)}
          </span>
          <span className="text-[10px] text-neutral-500">Agreed Delivery Revenue</span>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 shadow-md">
          <span className="text-[10px] uppercase font-bold text-amber-400 block">Pending Outstanding</span>
          <span className="font-mono text-base font-black text-amber-300 mt-1 block">
            {formatINR(Math.max(0, totalBilled - totalReceived))}
          </span>
          <span className="text-[10px] text-amber-400/70 font-mono">
            Received: {formatINR(totalReceived)}
          </span>
        </div>
      </div>

      {/* Allocations Cards Grid */}
      <div className="space-y-3">
        {allocations.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#12141c] p-8 text-center text-xs text-neutral-400">
            No Kerala unloading party destinations allocated yet. Click &quot;+ Allocate Kerala Party Destination&quot; above to assign loaded stones.
          </div>
        ) : (
          allocations.map((alloc) => {
            const isCancelled = alloc.status === 'cancelled';
            const isPartiallyDelivered = alloc.status === 'partially_delivered';
            const isDelivered = alloc.status === 'delivered';
            const assigned = Number(alloc.piecesAssigned || alloc.piecesDelivered) || 0;
            const delivered = Number(alloc.piecesDelivered) || 0;
            const balDue = Math.max(0, (Number(alloc.totalDeliveryAmount) || 0) - (Number(alloc.amountReceived) || 0));

            return (
              <div
                key={alloc.id}
                className={`rounded-2xl border p-4 shadow-lg transition-all ${
                  isCancelled
                    ? 'border-red-500/30 bg-red-950/10 opacity-75'
                    : isDelivered
                    ? 'border-emerald-500/30 bg-[#121c16]'
                    : 'border-white/10 bg-[#161821]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Party Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">{alloc.partyName}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-neutral-300">
                        <MapPinIcon className="h-3 w-3 text-gold" />
                        {alloc.deliveryLocation}
                      </span>
                      {alloc.contactPhone && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400">
                          <PhoneIcon className="h-3 w-3" />
                          {alloc.contactPhone}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                          isCancelled
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : isDelivered
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isPartiallyDelivered
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {alloc.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-neutral-400 flex items-center gap-4">
                      <span>Stone: <strong className="text-white">{alloc.stoneType} ({alloc.size} {alloc.thickness})</strong></span>
                      <span>Agreed Rate: <strong className="text-white font-mono">₹{alloc.agreedRate}/sqft</strong></span>
                      {alloc.invoiceNumber && <span>Invoice: <strong className="font-mono text-neutral-300">{alloc.invoiceNumber}</strong></span>}
                    </div>

                    {alloc.cancellationReason && (
                      <div className="text-xs text-red-300 bg-red-950/30 rounded-lg p-2 border border-red-500/20">
                        <strong>Cancellation Audit:</strong> {alloc.cancellationReason}
                        {alloc.cancelledAt && <span className="text-[10px] text-neutral-400 block mt-0.5">Cancelled at {new Date(alloc.cancelledAt).toLocaleString('en-IN')} by {alloc.cancelledBy || 'Owner'}</span>}
                      </div>
                    )}

                    {alloc.damageReason && (
                      <div className="text-xs text-amber-300 bg-amber-950/20 rounded-lg p-2 border border-amber-500/20">
                        <strong>Damaged:</strong> {alloc.piecesDamaged} pcs — {alloc.damageReason}
                      </div>
                    )}
                  </div>

                  {/* Middle: Pieces & Financials */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-black/40 p-3 rounded-xl border border-white/5">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Assigned</span>
                      <span className="font-mono text-sm font-bold text-white">{assigned} pcs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Delivered</span>
                      <span className="font-mono text-sm font-bold text-emerald-400">{delivered} pcs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Total Bill</span>
                      <span className="font-mono text-sm font-bold text-white">{formatINR(alloc.totalDeliveryAmount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Balance Due</span>
                      <span className="font-mono text-sm font-extrabold text-amber-400">{formatINR(balDue)}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  {!isCancelled && (
                    <div className="flex items-center gap-2">
                      {!isDelivered && (
                        <button
                          onClick={() => {
                            setDeliveringAlloc(alloc);
                            setDeliveredCount(String(assigned));
                            setDamagedCount('0');
                            setCollectedAmount(String(alloc.totalDeliveryAmount));
                          }}
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-md"
                        >
                          <CheckCircle2Icon className="h-3.5 w-3.5" />
                          <span>Record Delivery</span>
                        </button>
                      )}

                      <button
                        onClick={() => setReassignAlloc(alloc)}
                        className="flex items-center gap-1 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
                        title="Cancel Order / Change Destination"
                      >
                        <AlertTriangleIcon className="h-3.5 w-3.5" />
                        <span>Cancel / Reassign</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reassignments Audit Trail Timeline */}
      {reassignments.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#12141c] p-4 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Audit Trail: Cancelled Orders &amp; Alternative Reassignments ({reassignments.length})
            </h4>
          </div>

          <div className="divide-y divide-white/5 text-xs">
            {reassignments.map((r) => (
              <div key={r.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="line-through text-neutral-400">{r.originalCustomerName}</span>
                    <ArrowRightIcon className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-bold text-white">{r.alternativeCustomerName} ({r.newDeliveryLocation})</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Reason: <span className="text-amber-200">{r.cancellationReason}</span> · Reassigned on {r.reassignmentDate} by {r.reassignedBy}
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono text-neutral-300">
                  <div>{r.reassignedQuantityPieces} pieces @ ₹{r.newAgreedRate}/sqft</div>
                  {r.extraTransportCost > 0 && (
                    <div className="text-amber-400 font-sans">Extra Transport: +₹{r.extraTransportCost}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allocate Kerala Party Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#161821] p-6 shadow-2xl text-white">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
            >
              <XIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Allocate Kerala Party Destination</h2>
                <p className="text-xs text-neutral-400">
                  Assign stones loaded on this lorry to a Kerala customer stop
                </p>
              </div>
            </div>

            <form onSubmit={handleAddAllocation} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Customer / Kerala Party <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={selectedPartyId}
                  onChange={(e) => handlePartySelect(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                >
                  {unloadingParties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Delivery Location / District <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Pieces to Allocate <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={piecesAssigned}
                    onChange={(e) => setPiecesAssigned(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 font-mono text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Agreed Selling Rate (₹/sqft) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={agreedRate}
                    onChange={(e) => setAgreedRate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 font-mono text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Delivery Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unload near site gate, driver cash collection instruction"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={savingAdd}
                  className="rounded-xl px-4 py-2 text-neutral-400 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdd}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {savingAdd ? 'Allocating...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Delivery Modal */}
      {deliveringAlloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#161821] p-6 shadow-2xl text-white">
            <button
              onClick={() => setDeliveringAlloc(null)}
              className="absolute right-4 top-4 rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
            >
              <XIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Record Customer Delivery Receipt</h2>
                <p className="text-xs text-neutral-400">{deliveringAlloc.partyName} ({deliveringAlloc.deliveryLocation})</p>
              </div>
            </div>

            <form onSubmit={handleRecordDelivery} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Pieces Delivered <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={deliveringAlloc.piecesAssigned || deliveringAlloc.piecesDelivered}
                    required
                    value={deliveredCount}
                    onChange={(e) => setDeliveredCount(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 font-mono text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Damaged Pieces
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={damagedCount}
                    onChange={(e) => setDamagedCount(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 font-mono text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {Number(damagedCount) > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-amber-400 mb-1">
                    Damage Reason &amp; Site Report
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Broken in transport transit on ghat road"
                    value={damageReason}
                    onChange={(e) => setDamageReason(e.target.value)}
                    className="w-full rounded-xl border border-amber-500/40 bg-[#0d0f14] px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Payment Collected at Site (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2.5 font-mono text-base font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Delivery Receipt Notes / UTR
                </label>
                <input
                  type="text"
                  placeholder="Receipt signed by site supervisor"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0d0f14] px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setDeliveringAlloc(null)}
                  disabled={savingDelivery}
                  className="rounded-xl px-4 py-2 text-neutral-400 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDelivery}
                  className="rounded-xl bg-emerald-500 px-5 py-2 font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
                >
                  {savingDelivery ? 'Saving...' : 'Confirm Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order & Reassign Modal */}
      {reassignAlloc && (
        <CancelReassignModal
          isOpen={true}
          onClose={() => setReassignAlloc(null)}
          onSuccess={() => {
            fetchAllocations();
            onTripUpdated();
          }}
          tripId={trip.id}
          allocation={reassignAlloc}
          unloadingParties={unloadingParties}
        />
      )}
    </div>
  );
}
