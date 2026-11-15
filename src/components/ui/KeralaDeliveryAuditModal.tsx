import React, { useState, useMemo } from 'react';
import {
  XIcon,
  MapPinIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  CoinsIcon,
  TruckIcon,
  UserIcon,
  Building2Icon,
  CheckCircle2Icon,
  FileTextIcon,
  PhoneIcon,
  HelpCircleIcon
} from 'lucide-react';
import { formatINR } from '../../utils/helpers';
import type { Trip, UnloadingParty, DistrictRate } from '../../data/types';
import { useOrders } from '../../store/OrdersContext';

interface KeralaDeliveryAuditModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function KeralaDeliveryAuditModal({
  trip,
  isOpen,
  onClose,
  onSuccess
}: KeralaDeliveryAuditModalProps) {
  const { unloadingParties, districtRates, lorries, drivers, auditTripDelivery } = useOrders();

  const lorry = lorries.find((l) => l.id === trip.lorryId || l.plate === trip.lorryId);
  const driver = drivers.find((d) => d.id === trip.driverId);
  const currentBuyer = unloadingParties.find((up) => up.id === trip.unloadingPartyId);

  // Total loaded pieces & total sqft from stoneLines
  const totalLoadedPieces = useMemo(() => {
    return (trip.stoneLines || []).reduce((sum, line) => sum + (Number(line.pieces) || 0), 0);
  }, [trip.stoneLines]);

  const totalLoadedSqft = useMemo(() => {
    return (trip.stoneLines || []).reduce(
      (sum, line) => sum + (Number(line.sqftPerPiece) || 0) * (Number(line.pieces) || 0),
      0
    );
  }, [trip.stoneLines]);

  // Expected Bill Value based on Kerala District Selling Rate
  const buyerDistrict = currentBuyer?.district || 'Palakkad';
  const expectedBillValue = useMemo(() => {
    if (!trip.stoneLines || trip.stoneLines.length === 0) {
      return trip.amountPaid || 0;
    }
    return trip.stoneLines.reduce((sum, line) => {
      const matchRate = districtRates.find(
        (r) =>
          r.district === buyerDistrict &&
          r.size === line.size &&
          r.thickness === line.thickness &&
          r.finish === line.finish
      );
      const rate = matchRate ? matchRate.ratePerSqft : line.ratePerSqft;
      return sum + (Number(line.sqftPerPiece) || 0) * (Number(line.pieces) || 0) * (Number(rate) || 0);
    }, 0);
  }, [trip.stoneLines, districtRates, buyerDistrict, trip.amountPaid]);

  // Form State
  const [unloadingPartyId, setUnloadingPartyId] = useState<string>(trip.unloadingPartyId || '');
  const [unloadingLocation, setUnloadingLocation] = useState<string>(
    trip.unloadingLocation || currentBuyer?.district || 'Palakkad, Kerala'
  );
  const [damagedPieces, setDamagedPieces] = useState<string>(
    trip.damagedPieces !== undefined ? String(trip.damagedPieces) : '0'
  );
  const [unloadedPieces, setUnloadedPieces] = useState<string>(
    trip.unloadedPieces !== undefined
      ? String(trip.unloadedPieces)
      : String(Math.max(0, totalLoadedPieces - (trip.damagedPieces || 0)))
  );
  const [partyToDriverCash, setPartyToDriverCash] = useState<string>(
    trip.partyToDriverCash !== undefined ? String(trip.partyToDriverCash) : '0'
  );
  const [partyToOwnerPhonePe, setPartyToOwnerPhonePe] = useState<string>(
    trip.partyToOwnerPhonePe !== undefined ? String(trip.partyToOwnerPhonePe) : '0'
  );
  const [damageDeduction, setDamageDeduction] = useState<string>(
    trip.damageDeduction !== undefined ? String(trip.damageDeduction) : '0'
  );
  const [shortageDeduction, setShortageDeduction] = useState<string>(
    trip.shortageDeduction !== undefined ? String(trip.shortageDeduction) : '0'
  );
  const [auditNote, setAuditNote] = useState<string>(
    trip.auditNote || ''
  );
  const [auditStatus, setAuditStatus] = useState<'pending_audit' | 'audited' | 'verified' | 'disputed'>(
    trip.auditStatus || 'audited'
  );
  const [markDelivered, setMarkDelivered] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  // Live calculations
  const numDamaged = Number(damagedPieces || 0);
  const numCash = Number(partyToDriverCash || 0);
  const numPhonePe = Number(partyToOwnerPhonePe || 0);
  const numDamageDed = Number(damageDeduction || 0);
  const numShortageDed = Number(shortageDeduction || 0);

  const totalCollected = numCash + numPhonePe;
  const totalLessened = numDamageDed + numShortageDed;
  const remainingPending = Math.max(0, expectedBillValue - totalCollected - totalLessened);

  // Handle damage pieces change -> auto-update good unloaded pieces
  const handleDamagedPiecesChange = (val: string) => {
    setDamagedPieces(val);
    const d = Number(val || 0);
    const good = Math.max(0, totalLoadedPieces - d);
    setUnloadedPieces(String(good));
  };

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await auditTripDelivery(trip.id, {
        unloadingPartyId: unloadingPartyId || trip.unloadingPartyId,
        unloadingLocation,
        unloadedPieces: Number(unloadedPieces || 0),
        damagedPieces: numDamaged,
        damageDeduction: numDamageDed,
        shortageDeduction: numShortageDed,
        partyToDriverCash: numCash,
        partyToOwnerPhonePe: numPhonePe,
        auditNote,
        auditStatus,
        auditedBy: 'Owner (Admin)',
        markDelivered
      });

      setSavedSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save delivery audit');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-gold/40 bg-[#0B0F15] shadow-[0_20px_80px_rgba(0,0,0,0.9)] my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-gradient-to-r from-ink-950 via-[#131A24] to-ink-950">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 border border-gold/40 text-gold shadow-md">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Kerala Unloading &amp; Delivery Audit</span>
                <span className="text-gold font-mono text-sm font-bold">#{trip.code}</span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Audit where the fleet unloaded, payments collected, less/shortage deductions, and damage count.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-lg p-1 hover:bg-white/5"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Fleet & Trip Fast Info Deck */}
        <div className="bg-[#101620] px-6 py-3 border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Fleet Vehicle</span>
            <span className="font-mono font-bold text-gold flex items-center gap-1">
              <TruckIcon className="h-3.5 w-3.5" /> {lorry?.plate || trip.lorryId}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Assigned Driver</span>
            <span className="font-semibold text-neutral-200 flex items-center gap-1">
              <UserIcon className="h-3.5 w-3.5 text-neutral-400" /> {driver?.name || 'Driver on file'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Loaded Stones</span>
            <span className="font-mono font-bold text-white">
              {totalLoadedPieces} pcs ({totalLoadedSqft.toLocaleString()} sqft)
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Agreed Bill (Kerala Rate)</span>
            <span className="font-mono font-bold text-amber-300">
              {formatINR(expectedBillValue)}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {savedSuccess && (
            <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/60 p-4 text-xs font-bold text-emerald-300 flex items-center gap-3 shadow-lg shadow-emerald-500/20">
              <CheckCircle2Icon className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-black text-white">✓ Audit Details Saved &amp; Synced to Database!</p>
                <p className="text-[11px] text-emerald-300/80">All stone pieces, damage count, collections, and deductions are securely committed.</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
              {errorMsg}
            </div>
          )}

          {/* SECTION 1: Where is it Unloading in Kerala? */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-gold tracking-wider">
              <MapPinIcon className="h-4 w-4" />
              <span>1. Unloading Destination &amp; Buyer Party in Kerala</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                  Unloading Buyer Party *
                </label>
                <select
                  value={unloadingPartyId}
                  onChange={(e) => {
                    setUnloadingPartyId(e.target.value);
                    const matched = unloadingParties.find((p) => p.id === e.target.value);
                    if (matched) {
                      setUnloadingLocation(`${matched.district || 'Kerala'}`);
                    }
                  }}
                  className="w-full rounded-xl border border-white/15 bg-[#141B24] px-3 py-2 text-xs text-white focus:border-gold focus:outline-none font-medium"
                >
                  <option value="">-- Choose Buyer / Unloading Party --</option>
                  {unloadingParties.map((up) => (
                    <option key={up.id} value={up.id}>
                      {up.name} ({up.district || 'Kerala'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                  Unloading Site / Kerala District *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Palakkad Yard, Thrissur bypass site, Wayanad depot"
                  value={unloadingLocation}
                  onChange={(e) => setUnloadingLocation(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#141B24] px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Stone Pieces & Damage / Breakage Count */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-blue-400 tracking-wider">
                <CheckCircle2Icon className="h-4 w-4" />
                <span>2. Stone Pieces &amp; Damage Audit</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-neutral-400">
                Loaded at Quarry: <strong className="text-white">{totalLoadedPieces} pcs</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                  Good Unloaded Pieces *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={unloadedPieces}
                  onChange={(e) => setUnloadedPieces(e.target.value)}
                  className="w-full rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-xs font-mono font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none"
                />
                <span className="text-[10px] text-neutral-500 block mt-0.5">Delivered sound condition</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1 flex items-center justify-between">
                  <span>Damaged / Broken Pieces</span>
                  {numDamaged > 0 && (
                    <span className="text-[10px] font-bold text-red-400">
                      ⚠ {numDamaged} broken
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  value={damagedPieces}
                  onChange={(e) => handleDamagedPiecesChange(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-mono font-bold focus:outline-none ${
                    numDamaged > 0
                      ? 'border-red-500/50 bg-red-950/30 text-red-300 focus:border-red-400'
                      : 'border-white/15 bg-[#141B24] text-white focus:border-gold'
                  }`}
                />
                <span className="text-[10px] text-neutral-500 block mt-0.5">Cracked / transit breakage</span>
              </div>

              <div className="flex flex-col justify-center rounded-xl bg-white/5 p-3 border border-white/5">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Transit Breakage Rate</span>
                <span className="font-mono text-sm font-black text-white mt-0.5">
                  {totalLoadedPieces > 0 ? ((numDamaged / totalLoadedPieces) * 100).toFixed(1) : 0}% Breakage
                </span>
                <span className="text-[10px] text-neutral-500">
                  {numDamaged === 0 ? '✓ Zero damage' : `${numDamaged} / ${totalLoadedPieces} pcs damaged`}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Payment Collected & Lessening / Deduction */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400 tracking-wider">
                <CoinsIcon className="h-4 w-4" />
                <span>3. Buyer Payments &amp; Amount Lessened / Deducted</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                Total Bill: <strong className="text-amber-300 font-bold">{formatINR(expectedBillValue)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Payment collected */}
              <div className="space-y-2.5 rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wide block">
                  Payments Collected from Buyer:
                </span>
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-400 mb-0.5">
                    💵 Cash Paid to Driver at Site (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    value={partyToDriverCash}
                    onChange={(e) => setPartyToDriverCash(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-mono font-bold text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-400 mb-0.5">
                    📱 PhonePe / UPI Paid to Owner (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 70000"
                    value={partyToOwnerPhonePe}
                    onChange={(e) => setPartyToOwnerPhonePe(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-mono font-bold text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div className="pt-1 border-t border-white/10 flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-semibold">Total Paid:</span>
                  <span className="font-mono font-black text-emerald-300">{formatINR(totalCollected)}</span>
                </div>
              </div>

              {/* Amount Lessened / Deducted */}
              <div className="space-y-2.5 rounded-xl border border-red-500/20 bg-red-950/10 p-3">
                <span className="text-[11px] font-bold text-red-300 uppercase tracking-wide block">
                  Amount Lessened / Deductions:
                </span>
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-400 mb-0.5">
                    ✂ Damage / Breakage Cut (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 3000"
                    value={damageDeduction}
                    onChange={(e) => setDamageDeduction(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-mono font-bold text-red-200 focus:border-red-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-400 mb-0.5">
                    📉 Shortage / Withheld / Less Payment (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 2000"
                    value={shortageDeduction}
                    onChange={(e) => setShortageDeduction(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-mono font-bold text-red-200 focus:border-red-400 focus:outline-none"
                  />
                </div>
                <div className="pt-1 border-t border-white/10 flex justify-between items-center text-xs">
                  <span className="text-neutral-400 font-semibold">Total Lessened:</span>
                  <span className="font-mono font-black text-red-300">− {formatINR(totalLessened)}</span>
                </div>
              </div>
            </div>

            {/* Remaining Balance Summary Pill */}
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-500/15 via-gold/10 to-transparent p-3 border border-gold/30">
              <span className="text-xs font-bold text-neutral-200">
                Remaining Pending Balance to Collect from Buyer:
              </span>
              <span className="text-base font-black text-gold font-mono">
                {formatINR(remainingPending)}
              </span>
            </div>
          </div>

          {/* SECTION 4: Audit Notes & Sign-off */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-purple-400 tracking-wider">
              <FileTextIcon className="h-4 w-4" />
              <span>4. Audit Notes &amp; Delivery Verification Remarks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                  Audit Notes / Reason for Less Payment
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 15 pieces corner cracked during transit; buyer deducted ₹3,000. Balance ₹10,000 promised via NEFT tomorrow."
                  value={auditNote}
                  onChange={(e) => setAuditNote(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#141B24] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-gold focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                    Audit Verification Status
                  </label>
                  <select
                    value={auditStatus}
                    onChange={(e) => setAuditStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-white/15 bg-[#141B24] px-3 py-2 text-xs text-white focus:border-gold focus:outline-none font-bold"
                  >
                    <option value="audited">✓ Audited &amp; Recorded</option>
                    <option value="verified">★ Verified by Owner</option>
                    <option value="disputed">⚠ Disputed / Shortage Hold</option>
                    <option value="pending_audit">⏳ Pending Verification</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={markDelivered}
                    onChange={(e) => setMarkDelivered(e.target.checked)}
                    className="rounded border-white/20 bg-black text-gold focus:ring-gold h-4 w-4"
                  />
                  <span className="font-semibold">
                    Mark Trip Status as <strong className="text-emerald-400">Delivered &amp; Unloaded</strong>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-neutral-300 hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F5B82E] to-[#E5A81E] px-6 py-2.5 text-xs sm:text-sm font-black text-black shadow-lg hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheckIcon className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving Audit...' : 'Save & Confirm Unloading Audit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
