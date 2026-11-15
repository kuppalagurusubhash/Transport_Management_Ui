import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckIcon,
  FlagIcon,
  RefreshCwIcon,
  EyeIcon,
  FileTextIcon,
  XIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  CoinsIcon,
  MapPinIcon,
  LayersIcon,
  ScaleIcon,
  TruckIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  PrinterIcon
} from 'lucide-react';
import { formatINR } from '../utils/helpers';
import {
  lineTotalSqft,
  lineAmount,
  tripWorkerTotal,
  tripExpenseTotal,
  tripReturnRevenue,
  tripReturnExpenses,
  tripOutboundExpenses,
  tripTotalJourneyRevenue,
  tripTotalJourneyExpenses,
  tripTotalJourneyProfit,
  type ExpenseReview,
  type Trip,
  type Lorry,
  type Driver,
  type LoadingParty,
  type UnloadingParty,
  type DistrictRate,
  type LoadingPartyPayment,
  type ReturnPlanType,
  type ReturnSandLoad,
  type ReturnSandUnload,
  type DirectReturnDetails,
  type VehicleReturnDetails,
  type FinalTripAuditData,
  type TripStatus
} from '../data/types';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionLabel, Card } from '../components/ui/Card';
import { TripStatusBadge, ReviewBadge } from '../components/ui/Badge';
import { tripsApi, lorriesApi, driversApi, loadingPartiesApi, unloadingPartiesApi, districtRatesApi } from '../api/index';
import { KeralaDeliveryAuditModal } from '../components/ui/KeralaDeliveryAuditModal';
import { TripJourneyTimeline } from '../components/trip/TripJourneyTimeline';
import { ReturnPlanSelector } from '../components/trip/ReturnPlanSelector';
import { ReturnLoadingForm } from '../components/trip/ReturnLoadingForm';
import { ReturnUnloadingForm } from '../components/trip/ReturnUnloadingForm';
import { DirectReturnForm } from '../components/trip/DirectReturnForm';
import { VehicleReturnForm } from '../components/trip/VehicleReturnForm';
import { FinalTripAudit } from '../components/trip/FinalTripAudit';
import { TripPdfReportModal } from '../components/trip/TripPdfReportModal';
import { MultiQuarryLoadingCard } from '../components/trip/MultiQuarryLoadingCard';
import { MultiPartyUnloadingCard } from '../components/trip/MultiPartyUnloadingCard';

export function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [lorries, setLorries] = useState<Lorry[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingParties, setLoadingParties] = useState<LoadingParty[]>([]);
  const [unloadingParties, setUnloadingParties] = useState<UnloadingParty[]>([]);
  const [districtRates, setDistrictRates] = useState<DistrictRate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [savingExpense, setSavingExpense] = useState<string | null>(null);
  const [viewReceiptModalUrl, setViewReceiptModalUrl] = useState<string | null>(null);

  const [selectedLPId, setSelectedLPId] = useState<string>('');
  const [quarryAmountPaid, setQuarryAmountPaid] = useState<string>('');
  const [quarryPaymentStatus, setQuarryPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [quarryPaidBy, setQuarryPaidBy] = useState<'owner' | 'driver'>('owner');
  const [quarryPaymentMode, setQuarryPaymentMode] = useState<'cash' | 'phonepe' | 'bank_transfer' | 'unspecified'>('phonepe');
  const [showQuarryPaymentSuccess, setShowQuarryPaymentSuccess] = useState<boolean>(false);
  const [savingQuarryPayment, setSavingQuarryPayment] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<string>('all');

  const tripLoadingPartyIds = React.useMemo(() => {
    if (!trip) return [];
    return Array.from(new Set((trip.stoneLines || []).map(line => line.loadingPartyId)));
  }, [trip]);

  useEffect(() => {
    if (tripLoadingPartyIds.length > 0 && !selectedLPId) {
      setSelectedLPId(tripLoadingPartyIds[0]);
    }
  }, [tripLoadingPartyIds, selectedLPId]);

  const selectedLPPayment = React.useMemo(() => {
    if (!trip || !selectedLPId) return null;
    return (trip.loadingPartyPayments || []).find(p => p.loadingPartyId === selectedLPId);
  }, [trip, selectedLPId]);

  useEffect(() => {
    if (selectedLPPayment) {
      setQuarryAmountPaid(String(selectedLPPayment.amountPaid));
      setQuarryPaymentStatus(selectedLPPayment.status);
      setQuarryPaidBy(selectedLPPayment.paidBy);
      setQuarryPaymentMode(selectedLPPayment.paymentMode || 'phonepe');
    } else {
      setQuarryAmountPaid('0');
      setQuarryPaymentStatus('pending');
      setQuarryPaidBy('owner');
      setQuarryPaymentMode('phonepe');
    }
  }, [selectedLPId, selectedLPPayment]);

  const quarryLoadedValue = React.useMemo(() => {
    if (!trip || !selectedLPId) return 0;
    return (trip.stoneLines || [])
      .filter(line => line.loadingPartyId === selectedLPId)
      .reduce((sum, line) => sum + (line.sqftPerPiece * line.pieces * line.ratePerSqft), 0);
  }, [trip, selectedLPId]);

  const handleQuarryPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !selectedLPId) return;

    setSavingQuarryPayment(true);
    try {
      const currentPayments = [...(trip.loadingPartyPayments || [])];
      const index = currentPayments.findIndex(p => p.loadingPartyId === selectedLPId);

      const newPayment: LoadingPartyPayment = {
        id: selectedLPPayment?.id || `lpp-${Date.now()}`,
        loadingPartyId: selectedLPId,
        amountPaid: Number(quarryAmountPaid || 0),
        paidBy: quarryPaidBy,
        status: quarryPaymentStatus,
        paymentMode: quarryPaymentMode
      };

      if (index >= 0) {
        currentPayments[index] = newPayment;
      } else {
        currentPayments.push(newPayment);
      }

      // If driver is paying, also record this payment in trip expenses
      const partyName = loadingParties.find(p => p.id === selectedLPId)?.name || 'Quarry';
      const quarryExpId = `exp-quarry-${selectedLPId}`;
      let updatedExpenses = (trip.expenses || []).filter(e => e.id !== quarryExpId);

      if (quarryPaidBy === 'driver' && Number(quarryAmountPaid) > 0) {
        updatedExpenses.push({
          id: quarryExpId,
          label: `Quarry Stone Payment - ${partyName} [Driver Paid ${quarryPaymentMode.toUpperCase()}]`,
          amount: Number(quarryAmountPaid),
          review: quarryPaymentStatus === 'paid' ? 'approved' : 'pending',
          category: 'other',
          notes: `Paid by driver in ${quarryPaymentMode} to quarry loading party.`
        });
      }

      const updatedTrip = {
        ...trip,
        loadingPartyPayments: currentPayments,
        expenses: updatedExpenses
      };
      setTrip(updatedTrip);

      await tripsApi.update(trip.id, {
        loadingPartyPayments: currentPayments,
        expenses: updatedExpenses
      });
      setShowQuarryPaymentSuccess(true);
      setTimeout(() => setShowQuarryPaymentSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update loading party payment:', err);
      fetchTrip();
    } finally {
      setSavingQuarryPayment(false);
    }
  };

  const fetchTrip = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      const [apiTrip, apiLorries, apiDrivers, apiLoadingParties, apiUnloadingParties, apiDistrictRates] = await Promise.all([
        tripsApi.getById(tripId),
        lorriesApi.getAll(),
        driversApi.getAll(),
        loadingPartiesApi.getAll().catch(() => []),
        unloadingPartiesApi.getAll().catch(() => []),
        districtRatesApi.getAll().catch(() => []),
      ]);
      setTrip(apiTrip as Trip);
      if (Array.isArray(apiLorries)) setLorries(apiLorries as Lorry[]);
      if (Array.isArray(apiDrivers)) setDrivers(apiDrivers as Driver[]);
      if (Array.isArray(apiLoadingParties)) setLoadingParties(apiLoadingParties as LoadingParty[]);
      if (Array.isArray(apiUnloadingParties)) setUnloadingParties(apiUnloadingParties as UnloadingParty[]);
      if (Array.isArray(apiDistrictRates)) setDistrictRates(apiDistrictRates as DistrictRate[]);
    } catch (err: any) {
      if (err?.status === 404 || err?.message?.includes('404')) {
        setError('Trip not found.');
      } else {
        setError('Failed to load trip details. Please try again.');
      }
      console.error('TripDetail fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  // Update a single expense review status
  const setReview = async (expenseId: string, review: ExpenseReview) => {
    if (!trip) return;
    setSavingExpense(expenseId);
    try {
      // Optimistically update local state immediately
      const updatedExpenses = trip.expenses.map((e) =>
        e.id === expenseId ? { ...e, review } : e
      );
      setTrip({ ...trip, expenses: updatedExpenses });

      // Persist via API
      await tripsApi.update(trip.id, { expenses: updatedExpenses });
    } catch (err) {
      console.error('Failed to update expense review:', err);
      // Revert on failure by re-fetching
      fetchTrip();
    } finally {
      setSavingExpense(null);
    }
  };

  const getTripStepIndex = (t: Trip) => {
    const isSand = t.returnPlan === 'sand_return' || !!t.returnSandLoad;
    if (t.status === 'completed') return isSand ? 10 : 7;
    if (t.status === 'final_audit_pending' || t.status === 'returned_to_base' || !!t.vehicleReturnDetails) return isSand ? 9 : 6;
    if (t.status === 'sand_unloaded' || !!t.returnSandUnload) return 8;
    if (t.status === 'arrived_lt_factory') return 7;
    if (t.status === 'return_loaded' || t.status === 'returning') return isSand ? 6 : 5;
    if (t.status === 'return_sand_loading' || !!t.returnSandLoad) return 5;
    if (t.status === 'direct_return' || !!t.directReturnDetails) return 5;
    if (t.status === 'return_decision_pending' || t.status === 'stone_unloaded' || t.status === 'delivered' || t.auditStatus === 'audited' || t.auditStatus === 'verified') return 4;
    if (t.status === 'arrived_kerala' || t.status === 'stone_unloading') return 3;
    if (t.status === 'in-transit') return 2;
    return 1;
  };

  const handleSelectReturnPlan = async (plan: ReturnPlanType) => {
    if (!trip) return;
    const nextStatus: TripStatus = plan === 'sand_return' ? 'return_sand_loading' : 'direct_return';
    const updated = { ...trip, returnPlan: plan, status: nextStatus };
    setTrip(updated);
    try {
      await tripsApi.update(trip.id, { returnPlan: plan, status: nextStatus });
    } catch (err) {
      console.error('Failed to update return plan:', err);
      fetchTrip();
    }
  };

  const handleSaveReturnSandLoading = async (data: ReturnSandLoad) => {
    if (!trip) return;
    const updated = { ...trip, returnSandLoad: data, returnPlan: 'sand_return' as const, status: 'return_loaded' as const };
    setTrip(updated);
    try {
      await tripsApi.update(trip.id, { returnSandLoad: data, returnPlan: 'sand_return', status: 'return_loaded' });
    } catch (err) {
      console.error('Failed to save sand loading:', err);
      fetchTrip();
    }
  };

  const handleSaveReturnSandUnloading = async (data: ReturnSandUnload) => {
    if (!trip) return;
    const updated = { ...trip, returnSandUnload: data, status: 'sand_unloaded' as const };
    setTrip(updated);
    try {
      await tripsApi.update(trip.id, { returnSandUnload: data, status: 'sand_unloaded' });
    } catch (err) {
      console.error('Failed to save sand unloading:', err);
      fetchTrip();
    }
  };

  const handleSaveDirectReturn = async (data: DirectReturnDetails) => {
    if (!trip) return;
    const updated = { ...trip, directReturnDetails: data, returnPlan: 'direct_return' as const, status: 'direct_return' as const };
    setTrip(updated);
    try {
      await tripsApi.update(trip.id, { directReturnDetails: data, returnPlan: 'direct_return', status: 'direct_return' });
    } catch (err) {
      console.error('Failed to save direct return:', err);
      fetchTrip();
    }
  };

  const handleSaveVehicleReturn = async (data: VehicleReturnDetails) => {
    if (!trip) return;
    const updated = { ...trip, vehicleReturnDetails: data, status: 'returned_to_base' as const };
    setTrip(updated);
    try {
      await tripsApi.update(trip.id, { vehicleReturnDetails: data, status: 'returned_to_base' });
    } catch (err) {
      console.error('Failed to save vehicle return:', err);
      fetchTrip();
    }
  };

  const handleCompleteTripAudit = async (auditData: FinalTripAuditData) => {
    if (!trip) return;
    const updated = {
      ...trip,
      finalAudit: auditData,
      status: 'completed' as const,
      completedDate: auditData.completedDate,
      completedTime: auditData.completedTime,
      completedBy: auditData.auditedBy || 'Owner',
      driverOpeningBalance: auditData.driverOpeningBalance,
      driverCashHandoverToOwner: auditData.driverCashHandedToOwner,
      driverClosingBalanceForwarded: auditData.driverClosingBalanceForwarded,
      driverSettlementType: auditData.driverSettlementType
    };
    setTrip(updated);
    try {
      await tripsApi.update(trip.id, {
        finalAudit: auditData,
        status: 'completed',
        completedDate: auditData.completedDate,
        completedTime: auditData.completedTime,
        completedBy: auditData.auditedBy || 'Owner',
        driverOpeningBalance: auditData.driverOpeningBalance,
        driverCashHandoverToOwner: auditData.driverCashHandedToOwner,
        driverClosingBalanceForwarded: auditData.driverClosingBalanceForwarded,
        driverSettlementType: auditData.driverSettlementType
      });
      if (trip.lorryId) lorriesApi.update(trip.lorryId, { status: 'idle', location: 'Depot — Kadapa' }).catch(() => { });
      if (trip.driverId) driversApi.update(trip.driverId, { status: 'idle' }).catch(() => { });
    } catch (err) {
      console.error('Failed to complete final trip audit:', err);
      fetchTrip();
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-full p-8">
        <div className="mb-6 h-8 w-36 animate-pulse rounded bg-ink-700" />
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-ink-700 bg-ink-800" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border border-ink-700 bg-ink-800" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error / Not-found state ────────────────────────────────────────────────
  if (error || !trip) {
    return (
      <div className="p-8">
        <p className="text-neutral-400">{error ?? 'Trip not found.'}</p>
        <Link to="/trips" className="mt-2 inline-block text-gold hover:underline">
          ← Back to trips
        </Link>
      </div>
    );
  }

  // ── Derived values from API data ───────────────────────────────────────────
  const lorry = lorries.find((l) => l.id === trip.lorryId);
  const driver = drivers.find((d) => d.id === trip.driverId);
  const dest = unloadingParties.find((p) => p.id === trip.unloadingPartyId);

  const buyerDistrict = dest?.district;
  const revenue = (trip.stoneLines || []).reduce((sum, line) => {
    const matchRate = districtRates.find(r =>
      r.district === buyerDistrict &&
      r.size === line.size &&
      r.thickness === line.thickness &&
      r.finish === line.finish
    );
    const rate = matchRate ? matchRate.ratePerSqft : line.ratePerSqft;
    return sum + (line.sqftPerPiece * line.pieces * rate);
  }, 0);

  const buyingCost = (trip.stoneLines || []).reduce((sum, line) => {
    return sum + (line.sqftPerPiece * line.pieces * line.ratePerSqft);
  }, 0);

  const workers = tripWorkerTotal(trip);
  const expenseTotal = tripExpenseTotal(trip);
  const net = revenue - buyingCost - workers - expenseTotal;

  // Group stone lines + worker payments by loading party
  const partyIds = Array.from(
    new Set([
      ...trip.stoneLines.map((l) => l.loadingPartyId),
      ...trip.workerPayments.map((w) => w.loadingPartyId),
    ])
  );

  return (
    <div className="min-h-full">
      <PageHeader
        title={trip.code}
        subtitle={`${trip.origin} → ${dest?.name ?? trip.unloadingPartyId} · ${dest?.district ?? ''}`}
        action={<TripStatusBadge status={trip.status} />}
      />

          <div className="p-3.5 sm:p-6 lg:p-8">
            <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3">
              <div className="flex items-center justify-between">
                <Link
                  to="/trips"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm text-neutral-400 hover:text-white"
                >
                  <ArrowLeftIcon className="h-4 w-4" /> All trips
                </Link>

                  <button
                    onClick={fetchTrip}
                    className="sm:hidden inline-flex items-center gap-1.5 rounded-lg border border-ink-700 px-2.5 py-1.5 text-xs text-neutral-400 transition-colors hover:border-gold hover:text-gold"
                  >
                    <RefreshCwIcon className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setIsPdfModalOpen(true)}
                    className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 rounded-xl border border-gold/40 bg-gold/10 px-3 sm:px-4 py-2 text-xs font-bold text-gold hover:bg-gold/20 hover:scale-105 transition-all shadow-md cursor-pointer"
                  >
                    <PrinterIcon className="h-4 w-4 shrink-0" />
                    <span>PDF Report</span>
                  </button>

                  <button
                    onClick={() => setIsAuditModalOpen(true)}
                    className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-[#F5B82E] to-[#E5A81E] px-3 sm:px-4 py-2 text-xs font-black text-black shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    <ShieldCheckIcon className="h-4 w-4 shrink-0" />
                    <span>Audit Unloading</span>
                  </button>

                  <button
                    onClick={fetchTrip}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-ink-700 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:border-gold hover:text-gold"
                  >
                    <RefreshCwIcon className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>
              </div>

                  {/* Assignment Cards (3-column compact strip on iPhone & Desktop) */}
                  <div className="mb-5 sm:mb-6 grid grid-cols-3 gap-2 sm:gap-4">
                    <Card className="p-2.5 sm:p-4 min-w-0">
                      <SectionLabel>Lorry</SectionLabel>
                        <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-semibold text-white truncate">
                          {lorry?.plate ?? trip.lorryId}
                        </p>
                        <p className="text-[10px] sm:text-xs text-neutral-500 truncate">{lorry?.location ?? '—'}</p>
                    </Card>
                      <Card className="p-2.5 sm:p-4 min-w-0">
                        <SectionLabel>Driver</SectionLabel>
                          <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-semibold text-white truncate">
                            {driver?.name ?? trip.driverId}
                          </p>
                          <p className="text-[10px] sm:text-xs text-neutral-500 truncate">{driver?.phone ?? '—'}</p>
                      </Card>
                        <Card className="p-2.5 sm:p-4 min-w-0">
                          <SectionLabel>Buyer</SectionLabel>
                            <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-semibold text-white truncate">
                              {dest?.name ?? trip.unloadingPartyId}
                            </p>
                            <p className="text-[10px] sm:text-xs text-neutral-500 truncate">{dest?.district ?? '—'}</p>
                        </Card>
                      </div>

                      {/* 1. Round-Trip Journey Timeline */}
                      <div className="mb-6">
                        <TripJourneyTimeline
                          trip={trip}
                          currentStepIndex={getTripStepIndex(trip)}
                          onStepClick={(step) => {
                            if (step === 1) setActiveWorkflowTab('stage-1');
                            else if (step === 2 || step === 3) setActiveWorkflowTab('stage-2');
                            else if (step === 4) setActiveWorkflowTab('stage-3');
                            else if (step === 5) setActiveWorkflowTab(trip.returnPlan === 'sand_return' ? 'stage-4' : 'stage-6');
                            else if (step === 6 || step === 7) setActiveWorkflowTab('stage-5');
                            else if (step === 8) setActiveWorkflowTab('stage-7');
                            else if (step === 9 || step === 10) setActiveWorkflowTab('stage-8');
                          }}
                        />
                      </div>

                      {/* Workflow Stage Navigator Buttons */}
                      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 ti-scroll">
                        {[
                          { id: 'all', label: 'All Journey Stages' },
                          { id: 'stage-1', label: '01 Outbound Loading' },
                          { id: 'stage-2', label: '02 Kerala Unloading' },
                          { id: 'stage-3', label: '03 Return Plan' },
                          ...(trip.returnPlan === 'sand_return' || trip.returnSandLoad ? [
                            { id: 'stage-4', label: '04 Sand Loading' },
                            { id: 'stage-5', label: '05 L&T Unloading' }
                          ] : []),
                          ...(trip.returnPlan === 'direct_return' || trip.directReturnDetails ? [
                            { id: 'stage-6', label: '06 Direct Return' }
                          ] : []),
                          { id: 'stage-7', label: '07 Base Return' },
                          { id: 'stage-8', label: '08 Final Audit' }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveWorkflowTab(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeWorkflowTab === tab.id
                                ? 'bg-gold text-black shadow-md'
                                : 'bg-ink-900 border border-ink-700 text-neutral-400 hover:text-white hover:border-ink-600'
                              }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* ── STAGE 08: FINAL TRIP AUDIT & CLOSURE ──────────────────────────── */}
                      {(activeWorkflowTab === 'all' || activeWorkflowTab === 'stage-8') && (
                        <div className="mb-6">
                          <FinalTripAudit
                            trip={trip}
                            districtRates={districtRates}
                            unloadingParties={unloadingParties}
                            onCompleteTrip={handleCompleteTripAudit}
                          />
                        </div>
                      )}

                      {/* ── STAGE 03: RETURN PLAN DECISION ────────────────────────────────── */}
                      {(activeWorkflowTab === 'all' || activeWorkflowTab === 'stage-3') && (
                        <div className="mb-6">
                          <ReturnPlanSelector
                            trip={trip}
                            currentPlan={trip.returnPlan}
                            onSelectPlan={handleSelectReturnPlan}
                          />
                        </div>
                      )}

                      {/* ── STAGE 04: RETURN SAND LOADING ─────────────────────────────────── */}
                      {(trip.returnPlan === 'sand_return' || trip.returnSandLoad) && (activeWorkflowTab === 'all' || activeWorkflowTab === 'stage-4') && (
                        <div className="mb-6">
                          <ReturnLoadingForm
                            trip={trip}
                            lorry={lorry}
                            driver={driver}
                            onSave={handleSaveReturnSandLoading}
                          />
                        </div>
                      )}

                      {/* ── STAGE 05: L&T FACTORY SAND UNLOADING ──────────────────────────── */}
                      {(trip.returnPlan === 'sand_return' || trip.returnSandLoad) && (activeWorkflowTab === 'all' || activeWorkflowTab === 'stage-5') && (
                        <div className="mb-6">
                          <ReturnUnloadingForm
                            trip={trip}
                            onSave={handleSaveReturnSandUnloading}
                          />
                        </div>
                      )}

                      {/* ── STAGE 06: DIRECT RETURN DETAILS ───────────────────────────────── */}
                      {(trip.returnPlan === 'direct_return' || trip.directReturnDetails) && (activeWorkflowTab === 'all' || activeWorkflowTab === 'stage-6') && (
                        <div className="mb-6">
                          <DirectReturnForm
                            trip={trip}
                            onSave={handleSaveDirectReturn}
                          />
                        </div>
                      )}

                      {/* ── STAGE 07: VEHICLE RETURN TO BASE ──────────────────────────────── */}
                      {(activeWorkflowTab === 'all' || activeWorkflowTab === 'stage-7') && (
                        <div className="mb-6">
                          <VehicleReturnForm
                            trip={trip}
                            onSave={handleSaveVehicleReturn}
                          />
                        </div>
                      )}

                      {/* ── STAGE 02: KERALA UNLOADING & DELIVERY AUDIT ───────────────────── */}
                      {(activeWorkflowTab === 'all' || activeWorkflowTab === 'stage-2') && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <SectionLabel>Stage 02 · Kerala Unloading &amp; Delivery Audit</SectionLabel>
                            <button
                              onClick={() => setIsAuditModalOpen(true)}
                              className="text-xs font-bold text-gold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldCheckIcon className="h-3.5 w-3.5" />
                              <span>{trip.auditStatus ? 'Update Unloading Audit' : 'Record Unloading Audit'}</span>
                            </button>
                          </div>

                          {/* Multi-Party Kerala Delivery Allocations & Alternative Reassignments */}
                          <div className="mb-5">
                            <MultiPartyUnloadingCard
                              trip={trip}
                              unloadingParties={unloadingParties}
                              onTripUpdated={fetchTrip}
                            />
                          </div>

                          <Card className="p-5 bg-gradient-to-r from-ink-900 via-ink-950 to-ink-900 border-gold/30 shadow-xl overflow-hidden relative">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                              {/* Left Column: Location, Pieces, Damages */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 border border-gold/40 px-2.5 py-0.5 text-[10px] font-black uppercase text-gold">
                                    <MapPinIcon className="h-3 w-3" />
                                    {trip.unloadingLocation || dest?.district || 'Kerala Site'}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${trip.auditStatus === 'verified'
                                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                      : trip.auditStatus === 'disputed'
                                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    }`}>
                                    <CheckIcon className="h-3 w-3" />
                                    {trip.auditStatus ? trip.auditStatus.replace('_', ' ') : 'Audited'}
                                  </span>
                                  {trip.auditedAt && (
                                    <span className="text-[10px] text-neutral-400">
                                      Audited: {new Date(trip.auditedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-3 gap-3 text-xs">
                                  <div className="bg-black/40 rounded-xl p-2.5 border border-white/5">
                                    <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Loaded Quarry</span>
                                    <span className="text-sm font-black text-white font-mono">
                                      {(trip.stoneLines || []).reduce((s, l) => s + (Number(l.pieces) || 0), 0)} pcs
                                    </span>
                                  </div>
                                  <div className="bg-emerald-950/20 rounded-xl p-2.5 border border-emerald-500/20">
                                    <span className="text-[10px] uppercase text-emerald-400 font-semibold block">Unloaded Sound</span>
                                    <span className="text-sm font-black text-emerald-300 font-mono">
                                      {trip.unloadedPieces !== undefined
                                        ? trip.unloadedPieces
                                        : Math.max(0, (trip.stoneLines || []).reduce((s, l) => s + (Number(l.pieces) || 0), 0) - (trip.damagedPieces || 0))} pcs
                                    </span>
                                  </div>
                                  <div className={`rounded-xl p-2.5 border ${(trip.damagedPieces || 0) > 0
                                      ? 'bg-red-950/30 border-red-500/40 text-red-300'
                                      : 'bg-black/40 border-white/5 text-neutral-400'
                                    }`}>
                                    <span className="text-[10px] uppercase font-semibold block">Damaged / Broken</span>
                                    <span className="text-sm font-black font-mono">
                                      {(trip.damagedPieces || 0) > 0 ? `⚠ ${trip.damagedPieces} pcs` : '0 pcs'}
                                    </span>
                                  </div>
                                </div>

                                {trip.auditNote && (
                                  <div className="text-xs text-neutral-300 bg-white/5 rounded-xl p-2.5 border border-white/5">
                                    <strong className="text-gold font-bold">Audit Remarks:</strong> {trip.auditNote}
                                  </div>
                                )}
                              </div>

                              {/* Right Column: Payments Collected vs Lessened/Deductions */}
                              <div className="border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 space-y-2 min-w-[260px]">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-neutral-400">Total Agreed Bill:</span>
                                  <span className="font-mono font-bold text-white">{formatINR(revenue)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-emerald-400">💵 Cash Paid to Driver:</span>
                                  <span className="font-mono font-bold text-emerald-300">{formatINR(trip.partyToDriverCash || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-blue-400">📱 PhonePe to Owner:</span>
                                  <span className="font-mono font-bold text-blue-300">{formatINR(trip.partyToOwnerPhonePe || 0)}</span>
                                </div>
                                {((trip.damageDeduction || 0) + (trip.shortageDeduction || 0)) > 0 && (
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-red-400">✂ Amount Lessened / Cut:</span>
                                    <span className="font-mono font-bold text-red-300">
                                      − {formatINR((trip.damageDeduction || 0) + (trip.shortageDeduction || 0))}
                                    </span>
                                  </div>
                                )}
                                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                                  <span className="text-xs font-bold text-neutral-300">Remaining Pending:</span>
                                  <span className="text-sm font-black text-gold font-mono">
                                    {formatINR(Math.max(0, revenue - (trip.amountPaid || 0) - ((trip.damageDeduction || 0) + (trip.shortageDeduction || 0))))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>
                      )}

                      {/* ── STAGE 01: LOAD BREAKDOWN & QUARRY COST ───────────────────────── */}
                      {(activeWorkflowTab === 'all' || activeWorkflowTab === 'stage-1') && (
                        <div className="mb-6 space-y-6">
                          <MultiQuarryLoadingCard
                            trip={trip}
                            loadingParties={loadingParties}
                            onTripUpdated={fetchTrip}
                          />

                          <SectionLabel>Legacy Outbound Quarry Breakdown</SectionLabel>
                          <div className="mt-4 space-y-5">
                            {partyIds.length === 0 && (
                              <p className="text-sm text-neutral-500">No stone lines loaded for this trip.</p>
                            )}
                            {partyIds.map((pid) => {
                              const party = loadingParties.find((p) => p.id === pid);
                              const lines = trip.stoneLines.filter((l) => l.loadingPartyId === pid);
                              const worker = trip.workerPayments.find((w) => w.loadingPartyId === pid);
                              const lpPayment = (trip.loadingPartyPayments || []).find(p => p.loadingPartyId === pid);

                              return (
                                <Card key={pid} className="overflow-hidden">
                                  <div className="flex items-center justify-between border-b border-ink-700 bg-ink-900/60 px-4 py-3">
                                    <div>
                                      <p className="text-sm font-semibold text-white">
                                        {party?.name ?? pid}
                                      </p>
                                      <p className="text-xs text-neutral-500">
                                        {party?.location ?? '—'}
                                      </p>
                                    </div>
                                    <div className="flex gap-4">
                                      {worker && (
                                        <div className="text-right">
                                          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                                            Worker payment
                                          </p>
                                          <p className="text-sm font-semibold text-gold">
                                            {formatINR(worker.amount)}
                                          </p>
                                        </div>
                                      )}
                                      <div className="text-right border-l border-ink-700 pl-4">
                                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                                          Stone Payment ({lpPayment?.status || 'pending'})
                                        </p>
                                        <p className={`text-sm font-semibold ${lpPayment?.status === 'paid' ? 'text-green-400' : 'text-amber-400'}`}>
                                          {lpPayment ? formatINR(lpPayment.amountPaid) : formatINR(0)}
                                        </p>
                                        {lpPayment && lpPayment.paymentMode && lpPayment.paymentMode !== 'unspecified' && (
                                          <p className="text-[10px] text-neutral-500 capitalize">
                                            via {lpPayment.paymentMode} ({lpPayment.paidBy})
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="ti-scroll overflow-x-auto">
                                    <table className="w-full min-w-[560px] text-left text-sm">
                                      <thead>
                                        <tr className="text-xs uppercase tracking-wide text-neutral-600">
                                          <th className="px-4 py-2 font-medium">Stone</th>
                                          <th className="px-4 py-2 font-medium">Calculation</th>
                                          <th className="px-4 py-2 text-right font-medium">Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {lines.map((line) => (
                                          <tr key={line.id} className="border-t border-ink-800">
                                            <td className="px-4 py-3">
                                              <span className="text-white">
                                                {line.size} · {line.thickness}
                                              </span>
                                              <span className="ml-2 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] capitalize text-neutral-400">
                                                {line.finish}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-neutral-400">
                                              {line.sqftPerPiece} sqft × {line.pieces} pcs ={' '}
                                              {lineTotalSqft(line)} sqft × ₹{line.ratePerSqft}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-gold">
                                              {formatINR(lineAmount(line))}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Expenses with review actions */}
                      <div className="mb-6">
                        <SectionLabel>Expenses &amp; Maintenance</SectionLabel>
                        <Card className="mt-4 overflow-hidden">
                          {trip.expenses.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-neutral-500">
                              No expenses recorded for this trip.
                            </p>
                          ) : (
                            <ul className="divide-y divide-ink-800">
                              {trip.expenses.map((e) => (
                                <li
                                  key={e.id}
                                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-ink-900/30 transition-colors"
                                >
                                  <div className="flex flex-col flex-1 min-w-[180px]">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-semibold text-white">{e.label}</span>
                                      {e.category && (
                                        <span className="rounded bg-ink-800 border border-ink-700 px-2 py-0.5 text-[9px] font-bold text-gold uppercase tracking-wider">
                                          {e.category.replace('_', ' ')}
                                        </span>
                                      )}
                                    </div>
                                    {e.notes && (
                                      <span className="text-[11px] text-neutral-400 italic mt-0.5">{e.notes}</span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    {e.receiptUrl && (
                                      <button
                                        type="button"
                                        onClick={() => setViewReceiptModalUrl(e.receiptUrl!)}
                                        className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline font-semibold bg-gold/10 border border-gold/30 px-2.5 py-1 rounded-lg transition-colors hover:bg-gold/20"
                                      >
                                        <EyeIcon className="h-3.5 w-3.5" /> View Paper Proof
                                      </button>
                                    )}

                                    <span className="text-sm font-extrabold text-neutral-200 font-mono">
                                      {formatINR(e.amount)}
                                    </span>
                                    <ReviewBadge review={e.review} />
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => setReview(e.id, 'approved')}
                                        disabled={savingExpense === e.id}
                                        className="flex h-7 w-7 items-center justify-center rounded border border-ink-700 text-green-400 transition-colors hover:bg-green-400/10 disabled:opacity-40"
                                        aria-label={`Approve ${e.label}`}
                                        title="Approve expense"
                                      >
                                        <CheckIcon className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => setReview(e.id, 'flagged')}
                                        disabled={savingExpense === e.id}
                                        className="flex h-7 w-7 items-center justify-center rounded border border-ink-700 text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
                                        aria-label={`Flag ${e.label}`}
                                        title="Flag expense for audit"
                                      >
                                        <FlagIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </Card>
                      </div>

                      {/* Financial summary — all computed from real API data */}
                      <div>
                        <SectionLabel>Trip Summary</SectionLabel>
                        <Card className="mt-4 p-5">
                          <dl className="space-y-3 text-sm">
                            <Row label="Stone revenue (selling)" value={formatINR(revenue)} />
                            <Row label="Stone purchase cost" value={`− ${formatINR(buyingCost)}`} muted />
                            <Row label="Worker payments" value={`− ${formatINR(workers)}`} muted />
                            <Row label="Expenses" value={`− ${formatINR(expenseTotal)}`} muted />
                            <div className="border-t border-ink-700 pt-3">
                              <Row
                                label="Net profit"
                                value={net >= 0 ? formatINR(net) : `−${formatINR(Math.abs(net))}`}
                                emphasize
                              />
                            </div>
                            <div className="border-t border-ink-700 pt-3">
                              <Row label="Collected from buyer" value={formatINR(trip.amountPaid)} />
                              <div className="pl-4 space-y-1 mt-1 text-xs">
                                <Row label="↳ Cash to Driver" value={formatINR(trip.partyToDriverCash || 0)} muted />
                                <Row label="↳ PhonePe to Owner" value={formatINR(trip.partyToOwnerPhonePe || 0)} muted />
                              </div>
                              <Row
                                label="Pending from buyer"
                                value={formatINR(Math.max(0, revenue - trip.amountPaid - (trip.damageDeduction || 0)))}
                              />
                            </div>
                          </dl>
                        </Card>
                      </div>

                      {/* Record Quarry Stone Payments */}
                      {tripLoadingPartyIds.length > 0 && (
                        <div className="mt-6">
                          <SectionLabel>Quarry Stone Payments (Paid to Loading Parties)</SectionLabel>
                          <Card className="mt-4 p-5">
                            <form onSubmit={handleQuarryPaymentSubmit} className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                                <div>
                                  <label className="block text-xs text-neutral-500 font-semibold mb-1">Select Quarry / Shop</label>
                                  <select
                                    value={selectedLPId}
                                    onChange={(e) => setSelectedLPId(e.target.value)}
                                    className="w-full rounded border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                                  >
                                    {tripLoadingPartyIds.map(lpId => {
                                      const lpName = loadingParties.find(lp => lp.id === lpId)?.name || lpId;
                                      return (
                                        <option key={lpId} value={lpId}>{lpName}</option>
                                      );
                                    })}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-neutral-500 font-semibold mb-1">Amount Paid (₹)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={quarryAmountPaid}
                                    onChange={(e) => setQuarryAmountPaid(e.target.value)}
                                    placeholder="Payment amount"
                                    className="w-full rounded border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-neutral-500 font-semibold mb-1">Paid By</label>
                                  <select
                                    value={quarryPaidBy}
                                    onChange={(e) => setQuarryPaidBy(e.target.value as 'owner' | 'driver')}
                                    className="w-full rounded border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                                  >
                                    <option value="owner">Owner</option>
                                    <option value="driver">Driver</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-neutral-500 font-semibold mb-1">Payment Mode</label>
                                  <select
                                    value={quarryPaymentMode}
                                    onChange={(e) => setQuarryPaymentMode(e.target.value as 'cash' | 'phonepe' | 'bank_transfer' | 'unspecified')}
                                    className="w-full rounded border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                                  >
                                    <option value="cash">Cash</option>
                                    <option value="phonepe">PhonePe</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="unspecified">Unspecified</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-neutral-500 font-semibold mb-1">Payment Status</label>
                                  <select
                                    value={quarryPaymentStatus}
                                    onChange={(e) => setQuarryPaymentStatus(e.target.value as 'paid' | 'pending')}
                                    className="w-full rounded border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                  </select>
                                </div>
                              </div>

                              {selectedLPId && (
                                <p className="text-xs text-neutral-400">
                                  Loaded Stone Cost for this quarry: <strong className="text-white">{formatINR(quarryLoadedValue)}</strong>
                                </p>
                              )}

                              <div className="flex justify-end pt-1">
                                <button
                                  type="submit"
                                  disabled={savingQuarryPayment}
                                  className="rounded bg-gold px-5 py-2 text-xs font-bold text-ink-950 hover:bg-gold-400 disabled:opacity-50 transition-colors"
                                >
                                  {savingQuarryPayment ? 'Saving...' : 'Save Quarry Payment'}
                                </button>
                              </div>
                            </form>

                            {showQuarryPaymentSuccess && (
                              <div className="mt-3 rounded border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-300">
                                Quarry stone payment registered successfully.
                              </div>
                            )}
                          </Card>
                        </div>
                      )}
                  </div>

                  {/* Scanned Paper Receipt Lightbox Modal for Owner */}
                  {viewReceiptModalUrl && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
                      <div className="relative max-w-2xl w-full rounded-2xl border border-ink-700 bg-ink-950 p-5 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-ink-800 pb-3">
                          <div className="flex items-center gap-2 text-gold font-bold text-sm">
                            <FileTextIcon className="h-4 w-4" /> Driver Uploaded Handwritten Paper Proof
                          </div>
                          <button
                            type="button"
                            onClick={() => setViewReceiptModalUrl(null)}
                            className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-ink-800"
                          >
                            <XIcon className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-center bg-ink-900 rounded-xl p-2 max-h-[70vh] overflow-auto">
                          <img
                            src={viewReceiptModalUrl}
                            alt="Driver handwritten paper chit proof"
                            className="max-h-[65vh] w-auto rounded object-contain shadow-lg"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-neutral-400">
                            Verify line items and values against driver's handwritten receipt.
                          </span>
                          <button
                            type="button"
                            onClick={() => setViewReceiptModalUrl(null)}
                            className="rounded-xl bg-ink-800 px-5 py-2 text-xs font-semibold text-white hover:bg-ink-700 transition-colors"
                          >
                            Close Preview
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Kerala Unloading & Delivery Audit Modal */}
                  {isAuditModalOpen && (
                    <KeralaDeliveryAuditModal
                      trip={trip}
                      isOpen={isAuditModalOpen}
                      onClose={() => setIsAuditModalOpen(false)}
                      onSuccess={fetchTrip}
                    />
                  )}

                  {/* Full Trip PDF Report Modal */}
                  {isPdfModalOpen && (
                    <TripPdfReportModal
                      trip={trip}
                      isOpen={isPdfModalOpen}
                      onClose={() => setIsPdfModalOpen(false)}
                      lorries={lorries}
                      drivers={drivers}
                      loadingParties={loadingParties}
                      unloadingParties={unloadingParties}
                      districtRates={districtRates}
                    />
                  )}
              </div>
              );
}

              function Row({
                label,
                value,
                muted,
                emphasize,
}: {
                label: string;
              value: string;
              muted?: boolean;
              emphasize?: boolean;
}) {
  return (
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500">{label}</dt>
                <dd
                  className={
                    emphasize
                      ? 'text-lg font-extrabold text-gold'
                      : muted
                        ? 'text-neutral-400'
                        : 'font-semibold text-white'
                  }
                >
                  {value}
                </dd>
              </div>
              );
}