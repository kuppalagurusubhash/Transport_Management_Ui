import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Truck, 
  ArrowRight, 
  Scale, 
  DollarSign, 
  FileText,
  Lock,
  Sparkles,
  Printer,
  Coins,
  RotateCcw
} from 'lucide-react';
import { formatINR } from '../../utils/helpers';
import {
  lineAmount,
  tripWorkerTotal,
  tripExpenseTotal,
  tripReturnRevenue,
  tripReturnExpenses,
  tripOutboundExpenses,
  tripTotalJourneyRevenue,
  tripTotalJourneyExpenses,
  tripTotalJourneyProfit,
  type Trip,
  type FinalTripAuditData,
  type DistrictRate,
  type UnloadingParty
} from '../../data/types';
import { TripCompletionModal } from './TripCompletionModal';
import { TripPdfReportModal } from './TripPdfReportModal';

interface FinalTripAuditProps {
  trip: Trip;
  districtRates: DistrictRate[];
  unloadingParties: UnloadingParty[];
  onCompleteTrip: (auditData: FinalTripAuditData) => Promise<void>;
  disabled?: boolean;
}

export function FinalTripAudit({
  trip,
  districtRates,
  unloadingParties,
  onCompleteTrip,
  disabled
}: FinalTripAuditProps) {
  const isSand = trip.returnPlan === 'sand_return' || trip.returnSandLoad !== undefined;
  const isDirect = trip.returnPlan === 'direct_return' || trip.directReturnDetails !== undefined;

  // 1. Calculate Outbound Financials
  const dest = unloadingParties.find((p) => p.id === trip.unloadingPartyId);
  const buyerDistrict = dest?.district;

  const outboundRevenue = (trip.stoneLines || []).reduce((sum, line) => {
    const matchRate = districtRates.find(r => 
      r.district === buyerDistrict &&
      r.size === line.size &&
      r.thickness === line.thickness &&
      r.finish === line.finish
    );
    const rate = matchRate ? matchRate.ratePerSqft : line.ratePerSqft;
    return sum + (line.sqftPerPiece * line.pieces * rate);
  }, 0);

  const stoneBuyingCost = (trip.stoneLines || []).reduce((sum, line) => {
    return sum + (line.sqftPerPiece * line.pieces * line.ratePerSqft);
  }, 0);

  const outboundWorkersHamali = tripWorkerTotal(trip);
  const outboundGeneralExpenses = (trip.expenses || []).reduce((sum, e) => {
    const lbl = e.label.toLowerCase();
    if (lbl.includes('return') || lbl.includes('sand') || lbl.includes('l&t') || lbl.includes('mangalore') || lbl.includes('kanaya')) {
      return sum;
    }
    return sum + (e.amount || 0);
  }, 0);
  const totalOutboundExpenses = outboundWorkersHamali + outboundGeneralExpenses;

  // 2. Calculate Return Financials
  const returnRevenue = tripReturnRevenue(trip);
  const returnExpenses = tripReturnExpenses(trip);

  // 3. Total Journey Financials
  const totalJourneyRevenue = outboundRevenue + returnRevenue;
  const totalJourneyExpenses = totalOutboundExpenses + returnExpenses;
  const totalTripProfit = totalJourneyRevenue - totalJourneyExpenses - stoneBuyingCost;

  // 4. Calculate Driver Cash in Hand & Balance Rollover
  const driverOpeningBalance = Number(trip.driverOpeningBalance || trip.finalAudit?.driverOpeningBalance || 0);
  const driverCashCollected = Number(trip.partyToDriverCash || 0);

  // Driver disbursements in this trip
  const driverPaidExpenses = (trip.expenses || []).reduce((sum, e) => {
    if ((e as any).paidBy === 'driver' || (e as any).paid_by === 'driver') {
      return sum + (Number(e.amount) || 0);
    }
    return sum;
  }, 0);
  const driverPaidQuarry = (trip.loadingPartyPayments || []).reduce((sum, lp) => {
    if (lp.paidBy === 'driver') return sum + (Number(lp.amountPaid) || 0);
    return sum;
  }, 0);
  const driverPaidHamali = (trip.workerPayments || []).reduce((sum, wp: any) => {
    if (wp.paidBy === 'driver') return sum + (Number(wp.amount) || 0);
    return sum;
  }, 0);

  const totalDriverCashSpent = driverPaidExpenses + driverPaidQuarry + driverPaidHamali;
  const netDriverCashInHand = driverOpeningBalance + driverCashCollected - totalDriverCashSpent;

  // Driver Settlement Selection State
  const [driverSettlementType, setDriverSettlementType] = useState<'carry_forward' | 'handed_over' | 'partial_handover'>(
    trip.driverSettlementType || trip.finalAudit?.driverSettlementType || 'carry_forward'
  );
  const [driverCashHandedToOwnerInput, setDriverCashHandedToOwnerInput] = useState<string>(
    String(trip.driverCashHandoverToOwner ?? trip.finalAudit?.driverCashHandedToOwner ?? 0)
  );

  const actualCashHandedToOwner = driverSettlementType === 'handed_over'
    ? Math.max(0, netDriverCashInHand)
    : driverSettlementType === 'partial_handover'
    ? Math.min(Math.max(0, Number(driverCashHandedToOwnerInput) || 0), Math.max(0, netDriverCashInHand))
    : 0;

  const finalDriverClosingBalanceForwarded = driverSettlementType === 'carry_forward'
    ? netDriverCashInHand
    : netDriverCashInHand - actualCashHandedToOwner;

  // Audit Checklist State
  const initialAudit: FinalTripAuditData = trip.finalAudit || {
    stoneLoadingVerified: (trip.stoneLines || []).length > 0,
    stoneUnloadingVerified: trip.auditStatus === 'audited' || trip.auditStatus === 'verified' || trip.unloadedPieces !== undefined,
    returnJourneyVerified: !!trip.returnPlan,
    returnCargoVerified: isSand ? !!trip.returnSandLoad : isDirect ? !!trip.directReturnDetails : false,
    sandOrDirectVerified: isSand ? !!trip.returnSandLoad : isDirect ? !!trip.directReturnDetails : false,
    ltUnloadingVerified: isSand ? !!trip.returnSandUnload : true,
    weightDifferenceReviewed: isSand ? (trip.returnSandUnload?.weightDifferenceTons !== undefined) : true,
    labourHamaliVerified: (trip.workerPayments || []).length > 0 || !isSand,
    mamuluVerified: true,
    expensesVerified: (trip.expenses || []).length > 0 || true,
    driverDetailsVerified: !!trip.driverId,
    vehicleReturnedVerified: !!trip.vehicleReturnDetails || trip.status === 'returned_to_base' || trip.status === 'final_audit_pending',
    finalPaymentVerified: (trip.amountPaid || 0) > 0 || (trip.partyToDriverCash || 0) > 0 || (trip.partyToOwnerPhonePe || 0) > 0,
    driverOpeningBalance,
    driverCashCollected,
    driverCashSpent: totalDriverCashSpent,
    driverNetInHand: netDriverCashInHand,
    driverSettlementType: 'carry_forward',
    driverCashHandedToOwner: 0,
    driverClosingBalanceForwarded: netDriverCashInHand,
    auditedBy: 'Owner / Senior Auditor',
    auditNotes: ''
  };

  const [checklist, setChecklist] = useState<FinalTripAuditData>(initialAudit);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleCheck = (key: keyof FinalTripAuditData) => {
    if (disabled || trip.status === 'completed') return;
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Required keys for validation
  const requiredKeys: (keyof FinalTripAuditData)[] = [
    'stoneLoadingVerified',
    'stoneUnloadingVerified',
    'returnJourneyVerified',
    'returnCargoVerified',
    'sandOrDirectVerified',
    ...(isSand ? ['ltUnloadingVerified' as const, 'weightDifferenceReviewed' as const] : []),
    'labourHamaliVerified',
    'expensesVerified',
    'driverDetailsVerified',
    'vehicleReturnedVerified',
    'finalPaymentVerified'
  ];

  const pendingItemsCount = requiredKeys.filter(k => !checklist[k]).length;
  const isAllVerified = pendingItemsCount === 0;

  const handleVerifyAll = () => {
    setChecklist({
      stoneLoadingVerified: true,
      stoneUnloadingVerified: true,
      returnJourneyVerified: true,
      returnCargoVerified: true,
      sandOrDirectVerified: true,
      ltUnloadingVerified: true,
      weightDifferenceReviewed: true,
      labourHamaliVerified: true,
      mamuluVerified: true,
      expensesVerified: true,
      driverDetailsVerified: true,
      vehicleReturnedVerified: true,
      finalPaymentVerified: true,
      driverOpeningBalance,
      driverCashCollected,
      driverCashSpent: totalDriverCashSpent,
      driverNetInHand: netDriverCashInHand,
      driverSettlementType,
      driverCashHandedToOwner: actualCashHandedToOwner,
      driverClosingBalanceForwarded: finalDriverClosingBalanceForwarded,
      auditedBy: checklist.auditedBy || 'Owner / Senior Auditor',
      auditNotes: checklist.auditNotes || 'All journey legs, weighbridge chits, payments, and return verified.'
    });
  };

  const handleConfirmCompletion = async () => {
    setIsSubmitting(true);
    try {
      const auditPayload: FinalTripAuditData = {
        ...checklist,
        driverOpeningBalance,
        driverCashCollected,
        driverCashSpent: totalDriverCashSpent,
        driverNetInHand: netDriverCashInHand,
        driverSettlementType,
        driverCashHandedToOwner: actualCashHandedToOwner,
        driverClosingBalanceForwarded: finalDriverClosingBalanceForwarded,
        completedAt: new Date().toISOString(),
        completedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        completedTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      await onCompleteTrip(auditPayload);
      setIsCompletionModalOpen(false);
      setIsPdfModalOpen(true);
    } catch (err) {
      console.error('Failed to complete trip audit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-ink-700 bg-gradient-to-b from-ink-900 to-ink-950 p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 text-gold">
            <ShieldCheck className="h-6 w-6" />
            <h3 className="text-lg font-black uppercase tracking-wider">
              FINAL TRIP AUDIT &amp; P&amp;L CLOSURE
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Review the complete journey financials, weights, and return verification before closing the trip
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-bold text-gold hover:bg-gold/20 hover:scale-105 transition-all shadow-md cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Trip PDF Report</span>
          </button>

          {trip.status === 'completed' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-300 font-bold text-xs">
              <CheckCircle2 className="h-4 w-4" /> Trip Completed &amp; Audited
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold font-bold text-xs">
              <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
              Stage 07 · Final Audit
            </span>
          )}
        </div>
      </div>

      {/* THREE-COLUMN SUMMARY: OUTBOUND | RETURN | TOTAL JOURNEY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. OUTBOUND SUMMARY */}
        <div className="rounded-xl border border-ink-700 bg-black/40 p-4.5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-black uppercase text-gold tracking-wider">
              01. Outbound Leg
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono">
              Kadapa → Kerala
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Cargo Type:</span>
              <span className="text-white font-semibold">Black Stone Slabs</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Loaded Quantity:</span>
              <span className="text-white font-mono font-bold">
                {(trip.stoneLines || []).reduce((s, l) => s + (l.pieces || 0), 0)} pcs
              </span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Unloaded Sound:</span>
              <span className="text-emerald-300 font-mono font-bold">
                {trip.unloadedPieces !== undefined ? `${trip.unloadedPieces} pcs` : 'Audited'}
              </span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Outbound Stone Revenue:</span>
              <span className="text-emerald-400 font-mono font-bold">{formatINR(outboundRevenue)}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Stone Purchase Cost:</span>
              <span className="text-neutral-300 font-mono">− {formatINR(stoneBuyingCost)}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Quarry Loading Hamali:</span>
              <span className="text-neutral-300 font-mono">− {formatINR(outboundWorkersHamali)}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Outbound Expenses (Fuel/Toll):</span>
              <span className="text-neutral-300 font-mono">− {formatINR(outboundGeneralExpenses)}</span>
            </div>
            <div className="pt-2 border-t border-white/5 flex justify-between font-bold">
              <span className="text-neutral-300">Net Outbound Profit:</span>
              <span className="text-white font-mono">
                {formatINR(outboundRevenue - stoneBuyingCost - totalOutboundExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. RETURN SUMMARY */}
        <div className="rounded-xl border border-ink-700 bg-black/40 p-4.5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">
              02. Return Leg
            </span>
            <span className={`text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded ${
              isSand ? 'bg-orange-500/10 text-orange-300 border border-orange-500/30' : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
            }`}>
              {isSand ? 'Sand Return' : 'Direct Return'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {isSand ? (
              <>
                <div className="flex justify-between text-neutral-400">
                  <span>Loading Source:</span>
                  <span className="text-white font-semibold">{trip.returnSandLoad?.loadingLocation || 'Mangalore'}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Destination:</span>
                  <span className="text-gold font-semibold">{trip.returnSandLoad?.destination || 'L&T Factory'}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Loaded Sand Weight:</span>
                  <span className="text-white font-mono font-bold">{trip.returnSandLoad?.weightTons || 0} Ton</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Received at L&amp;T:</span>
                  <span className="text-purple-300 font-mono font-bold">
                    {trip.returnSandUnload?.receivedWeightTons || trip.returnSandLoad?.weightTons || 0} Ton
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Weight Difference:</span>
                  <span className={`font-mono font-bold ${
                    (trip.returnSandUnload?.weightDifferenceTons || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {(trip.returnSandUnload?.weightDifferenceTons || 0) > 0
                      ? `− ${trip.returnSandUnload?.weightDifferenceTons} Ton`
                      : '0.00 Ton (Exact)'}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Return Sand Revenue:</span>
                  <span className="text-cyan-300 font-mono font-bold">{formatINR(returnRevenue)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Return Expenses (Labour/Mamulu):</span>
                  <span className="text-neutral-300 font-mono">− {formatINR(returnExpenses)}</span>
                </div>
                <div className="pt-2 border-t border-white/5 flex justify-between font-bold">
                  <span className="text-neutral-300">Net Return Profit:</span>
                  <span className="text-cyan-300 font-mono">
                    {formatINR(returnRevenue - returnExpenses)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-neutral-400">
                  <span>Return Route:</span>
                  <span className="text-white font-semibold">Kerala → Kadapa / Base</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Cargo Status:</span>
                  <span className="text-blue-300 font-semibold font-mono">Empty (No Return Cargo)</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Departure:</span>
                  <span className="text-white font-mono">{trip.directReturnDetails?.departureDate || 'Kerala'}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Return Expenses:</span>
                  <span className="text-neutral-300 font-mono">− {formatINR(returnExpenses)}</span>
                </div>
                <div className="pt-2 border-t border-white/5 text-neutral-500 italic text-[11px]">
                  Direct return to base recorded. No return freight earned.
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. TOTAL JOURNEY SUMMARY & PROFIT */}
        <div className="rounded-xl border border-gold/40 bg-gradient-to-b from-ink-900 via-black to-ink-950 p-4.5 space-y-3.5 shadow-lg">
          <div className="flex items-center justify-between border-b border-gold/20 pb-2">
            <span className="text-xs font-black uppercase text-gold tracking-wider">
              03. Total Journey P&amp;L
            </span>
            <span className="text-[10px] uppercase font-black text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/30 font-mono">
              Complete Round Trip
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-neutral-300">
              <span>Total Revenue:</span>
              <span className="text-emerald-400 font-bold text-sm">{formatINR(totalJourneyRevenue)}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Stone Buying Cost:</span>
              <span className="text-neutral-300">− {formatINR(stoneBuyingCost)}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Total Journey Expenses:</span>
              <span className="text-red-300">− {formatINR(totalJourneyExpenses)}</span>
            </div>
            <div className="pt-3 border-t border-gold/30 flex justify-between items-center">
              <span className="text-xs font-black text-white uppercase font-sans">
                Final Net Journey Profit:
              </span>
              <span className={`text-lg font-black ${totalTripProfit >= 0 ? 'text-gold' : 'text-red-400'}`}>
                {formatINR(totalTripProfit)}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-black/40 border border-white/5 p-2.5 text-[11px] text-neutral-400 space-y-1">
            <div className="flex justify-between">
              <span>Vehicle Base Return:</span>
              <span className="text-white font-medium">{trip.vehicleReturnDetails?.returnDate || 'Kadapa Depot'}</span>
            </div>
            <div className="flex justify-between">
              <span>Fleet Condition:</span>
              <span className="text-emerald-400 capitalize">{trip.vehicleReturnDetails?.vehicleCondition || 'Good'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DRIVER CASH BALANCE ROLLOVER & HANDOVER AUDIT */}
      <div className="rounded-xl border border-blue-500/30 bg-gradient-to-b from-blue-950/20 via-black/40 to-ink-950 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-500/20 pb-3">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-blue-400" />
            <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>Driver Cash Settlement &amp; Balance Rollover</span>
              <span className="text-[10px] font-mono text-blue-300 bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 rounded">
                Next Trip Carry-Forward
              </span>
            </h4>
          </div>
          <span className="text-[11px] text-neutral-400">
            Reconcile whether cash is handed over to owner or carried forward to next trip
          </span>
        </div>

        {/* 4-Step Cash Float Formula Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg border border-white/10 bg-ink-900/80 p-3 space-y-1">
            <span className="text-[9px] uppercase font-bold text-neutral-400 block">
              1. Opening Float from Prior Trip
            </span>
            <span className="font-mono text-base font-black text-white block">
              {formatINR(driverOpeningBalance)}
            </span>
            <span className="text-[9.5px] text-neutral-500">Brought forward balance</span>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3 space-y-1">
            <span className="text-[9px] uppercase font-bold text-emerald-400 block">
              + 2. Cash Collected (Buyer/Party)
            </span>
            <span className="font-mono text-base font-black text-emerald-300 block">
              {formatINR(driverCashCollected)}
            </span>
            <span className="text-[9.5px] text-neutral-400">Collected at Kerala site</span>
          </div>

          <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-3 space-y-1">
            <span className="text-[9px] uppercase font-bold text-red-400 block">
              − 3. Cash Spent by Driver
            </span>
            <span className="font-mono text-base font-black text-red-300 block">
              − {formatINR(totalDriverCashSpent)}
            </span>
            <span className="text-[9.5px] text-neutral-400">Fuel, hamali &amp; quarry pays</span>
          </div>

          <div className="rounded-lg border border-blue-500/40 bg-blue-900/30 p-3 space-y-1 shadow-inner">
            <span className="text-[9px] uppercase font-bold text-blue-300 block">
              = 4. Net Cash Remaining with Driver
            </span>
            <span className={`font-mono text-base font-black block ${netDriverCashInHand >= 0 ? 'text-blue-200' : 'text-red-400'}`}>
              {formatINR(netDriverCashInHand)}
            </span>
            <span className="text-[9.5px] text-blue-300 font-semibold">Total cash in driver&apos;s hand</span>
          </div>
        </div>

        {/* Audit Settlement Decision */}
        <div className="rounded-xl border border-white/10 bg-black/60 p-4 space-y-3">
          <label className="block text-xs font-bold text-neutral-200 uppercase tracking-wide">
            Settlement Action for Remaining Cash ({formatINR(netDriverCashInHand)}):
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <label
              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                driverSettlementType === 'carry_forward'
                  ? 'bg-blue-950/40 border-blue-400 text-white shadow-md'
                  : 'bg-ink-900/60 border-ink-800 text-neutral-400 hover:border-ink-600'
              }`}
            >
              <input
                type="radio"
                name="driverSettlement"
                checked={driverSettlementType === 'carry_forward'}
                onChange={() => setDriverSettlementType('carry_forward')}
                disabled={disabled || trip.status === 'completed'}
                className="mt-0.5 text-blue-500 focus:ring-blue-400"
              />
              <div>
                <strong className="block text-white font-bold mb-0.5">
                  🔄 Carry Forward to Next Trip (Standard)
                </strong>
                <span className="text-[10px] text-neutral-400 block leading-tight">
                  Driver does not hand over cash; full balance ({formatINR(netDriverCashInHand)}) rolls forward as starting float for next trip.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                driverSettlementType === 'handed_over'
                  ? 'bg-emerald-950/40 border-emerald-400 text-white shadow-md'
                  : 'bg-ink-900/60 border-ink-800 text-neutral-400 hover:border-ink-600'
              }`}
            >
              <input
                type="radio"
                name="driverSettlement"
                checked={driverSettlementType === 'handed_over'}
                onChange={() => setDriverSettlementType('handed_over')}
                disabled={disabled || trip.status === 'completed'}
                className="mt-0.5 text-emerald-500 focus:ring-emerald-400"
              />
              <div>
                <strong className="block text-white font-bold mb-0.5">
                  💵 Cash Handed Over to Owner
                </strong>
                <span className="text-[10px] text-neutral-400 block leading-tight">
                  Driver physically deposits/hands full remaining amount ({formatINR(netDriverCashInHand)}) to owner. Next trip float starts at ₹0.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                driverSettlementType === 'partial_handover'
                  ? 'bg-amber-950/40 border-amber-400 text-white shadow-md'
                  : 'bg-ink-900/60 border-ink-800 text-neutral-400 hover:border-ink-600'
              }`}
            >
              <input
                type="radio"
                name="driverSettlement"
                checked={driverSettlementType === 'partial_handover'}
                onChange={() => setDriverSettlementType('partial_handover')}
                disabled={disabled || trip.status === 'completed'}
                className="mt-0.5 text-amber-500 focus:ring-amber-400"
              />
              <div>
                <strong className="block text-white font-bold mb-0.5">
                  ✂ Partial Handover &amp; Roll Remainder
                </strong>
                <span className="text-[10px] text-neutral-400 block leading-tight">
                  Driver hands over a specific amount and carries the remainder into the next trip.
                </span>
              </div>
            </label>
          </div>

          {/* Partial Handover Input */}
          {driverSettlementType === 'partial_handover' && (
            <div className="pt-2 flex flex-wrap items-center gap-4 bg-ink-900/80 p-3 rounded-lg border border-amber-500/30 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-neutral-300 font-semibold">Cash Handed Over to Owner:</span>
                <input
                  type="number"
                  min="0"
                  max={Math.max(0, netDriverCashInHand)}
                  value={driverCashHandedToOwnerInput}
                  onChange={(e) => setDriverCashHandedToOwnerInput(e.target.value)}
                  disabled={disabled || trip.status === 'completed'}
                  className="rounded-lg border border-ink-700 bg-ink-950 px-3 py-1.5 font-mono font-bold text-white text-xs w-32 focus:border-gold focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div className="text-neutral-400">
                Remaining to Carry Forward: <strong className="font-mono text-gold">{formatINR(finalDriverClosingBalanceForwarded)}</strong>
              </div>
            </div>
          )}

          {/* Status summary pill */}
          <div className="pt-1 flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">Balance to Forward into Next Trip:</span>
            <span className="font-black text-gold text-sm">
              {formatINR(finalDriverClosingBalanceForwarded)}
            </span>
          </div>
        </div>
      </div>

      {/* AUDIT CHECKLIST */}
      <div className="rounded-xl border border-ink-700 bg-black/40 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-gold" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Final Trip Audit Checklist
            </h4>
          </div>

          {trip.status !== 'completed' && (
            <button
              type="button"
              onClick={handleVerifyAll}
              className="flex items-center gap-1 text-xs font-bold text-gold hover:underline cursor-pointer self-start"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Quick Verify All Checklist Items</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            { key: 'stoneLoadingVerified' as const, label: '01. Stone loading verified at quarry' },
            { key: 'stoneUnloadingVerified' as const, label: '02. Stone unloading verified at Kerala site' },
            { key: 'returnJourneyVerified' as const, label: '03. Return journey decision verified' },
            { key: 'returnCargoVerified' as const, label: '04. Return cargo plan documented' },
            { key: 'sandOrDirectVerified' as const, label: isSand ? '05. Sand loading verified (Mangalore/Kanaya)' : '05. Direct return verified (No cargo)' },
            ...(isSand
              ? [
                  { key: 'ltUnloadingVerified' as const, label: '06. L&T Factory sand unloading verified' },
                  { key: 'weightDifferenceReviewed' as const, label: '07. Loaded vs Received weight diff reviewed' }
                ]
              : []),
            { key: 'labourHamaliVerified' as const, label: '08. Labour / Hamali wages verified' },
            { key: 'mamuluVerified' as const, label: '09. Mamulu / police / local charges verified' },
            { key: 'expensesVerified' as const, label: '10. Fuel & toll expenses accounted' },
            { key: 'driverDetailsVerified' as const, label: '11. Driver bata & cash advances reconciled' },
            { key: 'vehicleReturnedVerified' as const, label: '12. Vehicle returned safely to base (Kadapa)' },
            { key: 'finalPaymentVerified' as const, label: '13. Party payments & receivables audited' }
          ].map(item => {
            const isChecked = !!checklist[item.key];
            return (
              <div
                key={item.key}
                onClick={() => toggleCheck(item.key)}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                  isChecked
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-ink-900/60 border-ink-800 text-neutral-400 hover:border-ink-600'
                }`}
              >
                {isChecked ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-neutral-600 shrink-0" />
                )}
                <span className="font-medium truncate">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Auditor Notes & Signature */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
              Auditor Name / Designation
            </label>
            <input
              type="text"
              value={checklist.auditedBy || ''}
              onChange={(e) => setChecklist(prev => ({ ...prev, auditedBy: e.target.value }))}
              disabled={disabled || trip.status === 'completed'}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
              placeholder="e.g. Owner - Subhash / Senior Auditor"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
              Final Audit Closure Remarks
            </label>
            <input
              type="text"
              value={checklist.auditNotes || ''}
              onChange={(e) => setChecklist(prev => ({ ...prev, auditNotes: e.target.value }))}
              disabled={disabled || trip.status === 'completed'}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
              placeholder="e.g. Complete round trip verified. All accounts balanced."
            />
          </div>
        </div>
      </div>

      {/* FINAL AUDIT GATE / COMPLETE TRIP ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/10">
        <div>
          {isAllVerified ? (
            <span className="inline-flex items-center gap-2 text-xs text-emerald-400 font-bold">
              <CheckCircle2 className="h-4 w-4" /> All required audit checklist items verified. Ready for closure.
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs text-amber-300 font-semibold">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Complete the {pendingItemsCount} pending audit items before closing this trip.
            </span>
          )}
        </div>

        {trip.status === 'completed' ? (
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/30">
            <CheckCircle2 className="h-4 w-4" /> Completed on {trip.completedDate || 'Audit Date'} by {trip.completedBy || 'Owner'}
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled || !isAllVerified || isSubmitting}
            onClick={() => setIsCompletionModalOpen(true)}
            className={`flex items-center gap-2 rounded-xl px-7 py-3 text-xs font-black transition-all shadow-xl ${
              isAllVerified
                ? 'bg-gradient-to-r from-gold via-gold-400 to-amber-500 text-ink-950 hover:scale-105 cursor-pointer'
                : 'bg-ink-800 text-neutral-500 cursor-not-allowed opacity-50 border border-ink-700'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Complete Round Trip</span>
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      <TripCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        onConfirm={handleConfirmCompletion}
        trip={trip}
        totalRevenue={totalJourneyRevenue}
        totalExpenses={totalJourneyExpenses}
        totalProfit={totalTripProfit}
        isSubmitting={isSubmitting}
      />

      {/* Full Trip PDF Report Modal */}
      <TripPdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        trip={trip}
        unloadingParties={unloadingParties}
        districtRates={districtRates}
      />
    </div>
  );
}
