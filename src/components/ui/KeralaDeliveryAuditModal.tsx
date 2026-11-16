import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  XIcon,
  MapPinIcon,
  ShieldCheckIcon,
  CoinsIcon,
  TruckIcon,
  UserIcon,
  CheckCircle2Icon,
  FileTextIcon,
  PackageCheckIcon
} from 'lucide-react';
import { formatINR } from '../../utils/helpers';
import type { Trip } from '../../data/types';
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
  const [auditNote, setAuditNote] = useState<string>(trip.auditNote || '');
  const [auditStatus, setAuditStatus] = useState<'pending_audit' | 'audited' | 'verified' | 'disputed'>(
    trip.auditStatus || 'audited'
  );
  const [markDelivered, setMarkDelivered] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

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
  const breakagePct =
    totalLoadedPieces > 0 ? ((numDamaged / totalLoadedPieces) * 100).toFixed(1) : '0.0';

  // Handle damage pieces change -> auto-update good unloaded pieces
  const handleDamagedPiecesChange = (val: string) => {
    setDamagedPieces(val);
    const d = Number(val || 0);
    const good = Math.max(0, totalLoadedPieces - d);
    setUnloadedPieces(String(good));
  };

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
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save delivery audit');
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-[#F5B82E]/35 bg-gradient-to-b from-[#0E141D] via-[#0A0F16] to-[#070A0F] shadow-[0_25px_90px_rgba(0,0,0,0.95)] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Ambient Gold Highlight Line */}
        <div className="absolute inset-x-12 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#F5B82E] to-transparent pointer-events-none" />

        {/* 1. Sticky Modal Header */}
        <div className="shrink-0 border-b border-white/10 bg-[#0B1018]/90 px-4 py-3 sm:px-6 sm:py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5B82E]/15 border border-[#F5B82E]/40 text-[#F5B82E] shadow-inner">
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                    Kerala Unloading &amp; Delivery Audit
                  </h2>
                  <span className="rounded-md bg-[#F5B82E]/15 border border-[#F5B82E]/35 px-2 py-0.5 font-mono text-xs font-bold text-[#F5B82E]">
                    #{trip.code}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                  Verify unloaded stone pieces, buyer collections, and deductions
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-400 hover:border-white/25 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              aria-label="Close audit modal"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Compact 4-Pill Telemetry Strip */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-white/[0.07] bg-black/40 p-2 text-xs">
            <div className="px-2 py-0.5">
              <span className="text-[9.5px] uppercase font-bold text-neutral-500 block">Fleet Vehicle</span>
              <span className="font-mono font-bold text-[#F5B82E] flex items-center gap-1 truncate mt-0.5">
                <TruckIcon className="h-3 w-3 shrink-0" />
                {lorry?.plate || trip.lorryId}
              </span>
            </div>
            <div className="px-2 py-0.5 border-l border-white/5">
              <span className="text-[9.5px] uppercase font-bold text-neutral-500 block">Driver</span>
              <span className="font-semibold text-neutral-200 flex items-center gap-1 truncate mt-0.5">
                <UserIcon className="h-3 w-3 text-neutral-400 shrink-0" />
                {driver?.name || 'Assigned'}
              </span>
            </div>
            <div className="px-2 py-0.5 sm:border-l border-white/5">
              <span className="text-[9.5px] uppercase font-bold text-neutral-500 block">Loaded Cargo</span>
              <span className="font-mono font-bold text-white block truncate mt-0.5">
                {totalLoadedPieces} pcs <span className="text-neutral-400 font-normal">({totalLoadedSqft.toLocaleString()} sqft)</span>
              </span>
            </div>
            <div className="px-2 py-0.5 border-l border-white/5">
              <span className="text-[9.5px] uppercase font-bold text-neutral-500 block">Agreed Bill</span>
              <span className="font-mono font-black text-amber-300 block truncate mt-0.5">
                {formatINR(expectedBillValue)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="ti-scroll flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {savedSuccess && (
              <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/70 p-3 text-xs font-bold text-emerald-300 flex items-center gap-2.5 shadow-lg">
                <CheckCircle2Icon className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Audit saved &amp; synced to database!</span>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
                {errorMsg}
              </div>
            )}

            {/* Top 2-Column Grid: Section 1 (Destination) & Section 2 (Stone Pieces) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* SECTION 1: Destination & Buyer */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#F5B82E]">
                  <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>1. Kerala Destination &amp; Buyer</span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10.5px] font-semibold text-neutral-400 mb-1">
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
                      className="w-full rounded-xl border border-white/15 bg-[#121822] px-3 py-2 text-xs font-medium text-white focus:border-[#F5B82E] focus:outline-none"
                    >
                      <option value="">-- Choose Buyer Party --</option>
                      {unloadingParties.map((up) => (
                        <option key={up.id} value={up.id}>
                          {up.name} ({up.district || 'Kerala'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-semibold text-neutral-400 mb-1">
                      Unloading Site / District *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Palakkad, Thrissur"
                      value={unloadingLocation}
                      onChange={(e) => setUnloadingLocation(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#121822] px-3 py-2 text-xs text-white focus:border-[#F5B82E] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Stone Pieces & Damage Audit */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-blue-400">
                    <PackageCheckIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>2. Pieces &amp; Damage Audit</span>
                  </div>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] font-bold text-neutral-300">
                    Loaded: <strong className="text-white">{totalLoadedPieces} pcs</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10.5px] font-semibold text-neutral-400 mb-1">
                      Good Unloaded *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={unloadedPieces}
                      onChange={(e) => setUnloadedPieces(e.target.value)}
                      className="w-full rounded-xl border border-emerald-500/35 bg-emerald-950/25 px-3 py-2 text-xs font-mono font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-semibold text-neutral-400 mb-1">
                      Damaged / Broken
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={damagedPieces}
                      onChange={(e) => handleDamagedPiecesChange(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-mono font-bold focus:outline-none ${
                        numDamaged > 0
                          ? 'border-red-500/50 bg-red-950/30 text-red-300 focus:border-red-400'
                          : 'border-white/15 bg-[#121822] text-white focus:border-[#F5B82E]'
                      }`}
                    />
                  </div>
                </div>

                {/* Compact Breakage Status Bar */}
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/35 px-3 py-1.5 text-[11px]">
                  <span className="text-neutral-400 font-medium">Transit Breakage Rate:</span>
                  <span
                    className={`font-mono font-bold ${
                      numDamaged > 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {breakagePct}% ({numDamaged === 0 ? '✓ Zero damage' : `${numDamaged} broken`})
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 3: Buyer Payments & Amount Lessened */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-400">
                  <CoinsIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>3. Buyer Payments &amp; Deductions</span>
                </div>
                <span className="font-mono text-[11px] text-neutral-400">
                  Total Bill: <strong className="text-amber-300">{formatINR(expectedBillValue)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Left: Payments Collected */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-wider text-emerald-400">
                    <span>Collected from Buyer</span>
                    <span className="font-mono text-xs">{formatINR(totalCollected)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-neutral-400 mb-1 truncate">
                        💵 Driver Cash (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={partyToDriverCash}
                        onChange={(e) => setPartyToDriverCash(e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-neutral-400 mb-1 truncate">
                        📱 Owner PhonePe (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={partyToOwnerPhonePe}
                        onChange={(e) => setPartyToOwnerPhonePe(e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Amount Lessened / Deductions */}
                <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-wider text-red-400">
                    <span>Amount Lessened</span>
                    <span className="font-mono text-xs">− {formatINR(totalLessened)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-neutral-400 mb-1 truncate">
                        ✂ Damage Cut (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={damageDeduction}
                        onChange={(e) => setDamageDeduction(e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-xs font-mono font-bold text-red-200 focus:border-red-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-neutral-400 mb-1 truncate">
                        📉 Shortage Cut (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={shortageDeduction}
                        onChange={(e) => setShortageDeduction(e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-xs font-mono font-bold text-red-200 focus:border-red-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Remaining Balance Highlight Bar */}
              <div className="flex items-center justify-between rounded-xl border border-[#F5B82E]/35 bg-gradient-to-r from-[#F5B82E]/15 via-[#F5B82E]/10 to-transparent px-3.5 py-2">
                <span className="text-xs font-bold text-neutral-200">
                  Remaining Pending Balance to Collect:
                </span>
                <span className="font-mono text-sm sm:text-base font-black text-[#F5B82E]">
                  {formatINR(remainingPending)}
                </span>
              </div>
            </div>

            {/* SECTION 4: Audit Notes & Verification Status */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-purple-400">
                <FileTextIcon className="h-3.5 w-3.5 shrink-0" />
                <span>4. Audit Remarks &amp; Verification</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                <div className="sm:col-span-6">
                  <label className="block text-[10.5px] font-semibold text-neutral-400 mb-1">
                    Audit Notes / Reason for Less Payment
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 15 pcs corner cracked; balance promised via NEFT."
                    value={auditNote}
                    onChange={(e) => setAuditNote(e.target.value)}
                    className="ti-scroll w-full rounded-xl border border-white/15 bg-[#121822] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#F5B82E] focus:outline-none resize-none"
                  />
                </div>

                <div className="sm:col-span-6 space-y-2">
                  <div>
                    <label className="block text-[10.5px] font-semibold text-neutral-400 mb-1">
                      Verification Status
                    </label>
                    <select
                      value={auditStatus}
                      onChange={(e) => setAuditStatus(e.target.value as any)}
                      className="w-full rounded-xl border border-white/15 bg-[#121822] px-3 py-2 text-xs font-bold text-white focus:border-[#F5B82E] focus:outline-none"
                    >
                      <option value="audited">✓ Audited &amp; Recorded</option>
                      <option value="verified">★ Verified by Owner</option>
                      <option value="disputed">⚠ Disputed / Shortage Hold</option>
                      <option value="pending_audit">⏳ Pending Verification</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/30 px-3 py-1.5 text-xs text-neutral-300 cursor-pointer hover:border-emerald-500/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={markDelivered}
                      onChange={(e) => setMarkDelivered(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-black text-[#F5B82E] focus:ring-[#F5B82E]"
                    />
                    <span className="font-semibold text-[11px]">
                      Mark Trip Status as <strong className="text-emerald-400">Delivered &amp; Unloaded</strong>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Sticky Modal Footer Actions */}
          <div className="shrink-0 flex items-center justify-end gap-2.5 border-t border-white/10 bg-[#0B1018]/95 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-bold text-neutral-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F5B82E] to-amber-500 px-5 py-2 text-xs font-black text-black shadow-[0_4px_20px_rgba(245,184,46,0.3)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheckIcon className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save & Confirm Unloading Audit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
