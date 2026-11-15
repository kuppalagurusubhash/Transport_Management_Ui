import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TruckIcon,
  PackageOpenIcon,
  LayersIcon,
  PlusIcon,
  Trash2Icon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  SendIcon,
  PrinterIcon,
  CalculatorIcon,
  UsersIcon,
  SparklesIcon,
  Building2Icon,
  CoinsIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  InfoIcon,
  CheckIcon,
  XIcon,
  FileSpreadsheetIcon,
  UserCheckIcon,
  MapPinIcon,
  TrendingUpIcon,
  ZapIcon,
  ClockIcon,
  ShoppingBagIcon
} from 'lucide-react';
import { useOrders } from '../store/OrdersContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, SectionLabel } from '../components/ui/Card';
import { TripStatusBadge } from '../components/ui/Badge';
import { formatINR, getSqftFromSize } from '../utils/helpers';
import { type Finish, type StoneLine, type WorkerPayment, type Trip, type Lorry, type Driver } from '../data/types';
import { tripsApi, lorriesApi } from '../api/index';
import { LoadingPartyModal } from '../components/ui/LoadingPartyModal';

interface StoneSpecItem {
  id: string;
  size: string;
  thickness: string;
  finish: Finish;
  pieces: number;
  ratePerSqft: number; // Ramapuram Quarry Base Purchase Rate
}

interface QuarryLoadingBlock {
  id: string;
  loadingPartyId: string;
  stoneLines: StoneSpecItem[];
  hamaliAmount: number;
  hamaliRatePerStone: number;
  hamaliCalculationMode: 'lump' | 'per_stone';
  hamaliNote: string;
  hamaliPaidBy: 'owner' | 'driver' | 'quarry';
  hamaliPaymentMode: 'cash' | 'phonepe' | 'bank_transfer';
  hamaliStatus: 'paid' | 'pending';
  mamulluAmount: number;
  mamulluNote: string;
  mamulluPaidBy: 'owner' | 'driver';
}

const standardSizes = ['2x2', '3x3', '2x1', '4x2', '1.5x1.5', '1x1'];
const standardThicknesses = ['40mm', '50mm', '30mm', '60mm', '25mm', '20mm'];
const finishOptions: Finish[] = ['polish', 'rough'];

export function Loading() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    trips,
    lorries,
    drivers,
    orders,
    loadingParties,
    unloadingParties,
    stoneSpecs,
    districtRates,
    dispatchTrip,
    syncDatabase
  } = useOrders();

  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isChallanModalOpen, setIsChallanModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Helper to lookup genuine Ramapuram base quarry purchase rate
  const getRamapuramRate = (size: string, thickness: string, finish: Finish): number => {
    const match = (stoneSpecs || []).find(
      (s) => s.size === size && s.thickness === thickness && s.finish === finish
    );
    if (match && match.ratePerSqft > 0) return match.ratePerSqft;

    // Standard Ramapuram base quarry sourcing purchase rates (₹/sqft):
    if (size === '3x3') {
      return finish === 'polish' ? 24 : 22;
    }
    if (thickness === '50mm') {
      return finish === 'polish' ? 21 : 19;
    }
    if (thickness === '40mm') {
      return finish === 'polish' ? 19 : 17;
    }
    if (thickness === '30mm') {
      return finish === 'polish' ? 17 : 15;
    }
    if (thickness === '25mm' || thickness === '20mm') {
      return finish === 'polish' ? 16 : 14;
    }
    return 18;
  };

  // Only fleets that are actively awaiting stone loading in Ramapuram
  const loadingTrips = useMemo(() => {
    return trips.filter((t) => t.status === 'loading');
  }, [trips]);

  // Fleets currently in transit
  const inTransitTrips = useMemo(() => {
    return trips.filter((t) => t.status === 'in-transit');
  }, [trips]);

  // Unassigned / placed orders waiting for a lorry
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'placed' || o.status === 'confirmed');
  }, [orders]);

  // Auto-select trip from URL or pick first loading trip
  useEffect(() => {
    const urlTripId = searchParams.get('tripId');
    const urlLorryId = searchParams.get('lorryId');

    // 1. If explicit trip ID is in URL and it's currently awaiting loading:
    if (urlTripId && loadingTrips.some((t) => t.id === urlTripId)) {
      setSelectedTripId(urlTripId);
    } else if (urlLorryId) {
      const matchTrip = loadingTrips.find(
        (t) => t.lorryId === urlLorryId || t.lorryId === lorries.find((l) => l.id === urlLorryId)?.plate
      );
      if (matchTrip) {
        setSelectedTripId(matchTrip.id);
      } else if (loadingTrips.length > 0) {
        setSelectedTripId(loadingTrips[0].id);
      } else {
        setSelectedTripId('');
      }
    } else if (selectedTripId) {
      // Check if current selected trip was dispatched / is no longer in loading
      const stillLoading = loadingTrips.some((t) => t.id === selectedTripId);
      if (!stillLoading) {
        if (loadingTrips.length > 0) {
          setSelectedTripId(loadingTrips[0].id);
        } else {
          setSelectedTripId('');
        }
      }
    } else if (loadingTrips.length > 0) {
      setSelectedTripId(loadingTrips[0].id);
    }
  }, [searchParams, trips, loadingTrips, lorries, selectedTripId]);

  const currentTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return loadingTrips.find((t) => t.id === selectedTripId) || null;
  }, [loadingTrips, selectedTripId]);

  const currentLorry = useMemo(() => {
    if (!currentTrip) return null;
    return lorries.find((l) => l.id === currentTrip.lorryId || l.plate === currentTrip.lorryId) || null;
  }, [lorries, currentTrip]);

  const currentDriver = useMemo(() => {
    if (!currentTrip) return null;
    return drivers.find((d) => d.id === currentTrip.driverId) || null;
  }, [drivers, currentTrip]);

  const currentBuyer = useMemo(() => {
    if (!currentTrip) return null;
    return unloadingParties.find((p) => p.id === currentTrip.unloadingPartyId) || null;
  }, [unloadingParties, currentTrip]);

  const currentOrder = useMemo(() => {
    if (!currentTrip || !currentTrip.orderId) return null;
    return orders.find((o) => o.id === currentTrip.orderId) || null;
  }, [orders, currentTrip]);

  // Multi-Quarry Loading State
  const [quarryStops, setQuarryStops] = useState<QuarryLoadingBlock[]>([]);

  // Helper to normalize stone lines to Ramapuram cost
  const normalizeStoneLineToRamapuram = (line: { size: string; thickness: string; finish: Finish; pieces: number; ratePerSqft?: number }) => {
    const defaultRamaRate = getRamapuramRate(line.size, line.thickness, line.finish);
    const effectiveRate = line.ratePerSqft && line.ratePerSqft < 28 && line.ratePerSqft > 5 ? line.ratePerSqft : defaultRamaRate;
    return {
      id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      size: line.size || '2x2',
      thickness: line.thickness || '40mm',
      finish: (line.finish || 'polish') as Finish,
      pieces: Number(line.pieces) || 0,
      ratePerSqft: effectiveRate
    };
  };

  // Initialize or re-populate quarry stops when selected trip changes
  useEffect(() => {
    if (!currentTrip) {
      setQuarryStops([]);
      return;
    }

    const defaultPartyId = loadingParties[0]?.id || 'lp1';

    // 1. Check if trip already has stoneLines grouped by quarry
    const partyIds = Array.from(
      new Set([
        ...(currentTrip.stoneLines || []).map((l) => l.loadingPartyId),
        ...(currentTrip.workerPayments || []).map((w) => w.loadingPartyId)
      ])
    ).filter(Boolean);

    if (partyIds.length > 0) {
      const stops: QuarryLoadingBlock[] = partyIds.map((pid, idx) => {
        const rawLines = (currentTrip.stoneLines || []).filter((l) => l.loadingPartyId === pid);
        const lines: StoneSpecItem[] = rawLines.map((l) => normalizeStoneLineToRamapuram(l));

        const hamaliWorker = (currentTrip.workerPayments || []).find(
          (w) => w.loadingPartyId === pid && (w.type === 'hamali' || !w.type || w.note?.toLowerCase().includes('hamali') || w.note?.toLowerCase().includes('labour') || w.note?.toLowerCase().includes('coolie'))
        );

        const mamulluWorker = (currentTrip.workerPayments || []).find(
          (w) => w.loadingPartyId === pid && (w.type === 'mamullu' || w.note?.toLowerCase().includes('mamul') || w.note?.toLowerCase().includes('tip'))
        );

        const defaultRatePerStone = 5;
        const totalPcs = lines.reduce((s, l) => s + (l.pieces || 0), 0);

        return {
          id: `quarry-stop-${idx}-${Date.now()}`,
          loadingPartyId: pid,
          stoneLines: lines.length > 0 ? lines : [
            {
              id: `line-${Date.now()}-0`,
              size: '2x2',
              thickness: '40mm',
              finish: 'polish',
              pieces: 50,
              ratePerSqft: getRamapuramRate('2x2', '40mm', 'polish')
            }
          ],
          hamaliAmount: hamaliWorker ? hamaliWorker.amount : totalPcs > 0 ? totalPcs * defaultRatePerStone : 600,
          hamaliRatePerStone: defaultRatePerStone,
          hamaliCalculationMode: 'per_stone',
          hamaliNote: hamaliWorker?.note || 'Ramapuram loading gang labour coolie',
          hamaliPaidBy: (hamaliWorker?.paidBy as any) || 'owner',
          hamaliPaymentMode: (hamaliWorker?.paymentMode as any) || 'cash',
          hamaliStatus: 'paid',
          mamulluAmount: mamulluWorker ? mamulluWorker.amount : 200,
          mamulluNote: mamulluWorker?.note || 'Quarry loader & gate mamool',
          mamulluPaidBy: (mamulluWorker?.paidBy as any) || 'owner'
        };
      });

      setQuarryStops(stops);
    } else if (currentOrder && currentOrder.lines && currentOrder.lines.length > 0) {
      // 2. Pre-fill from the assigned order's stone requirements using Ramapuram purchase rates!
      const lines: StoneSpecItem[] = currentOrder.lines.map((orderLine) =>
        normalizeStoneLineToRamapuram(orderLine)
      );

      const totalPcs = lines.reduce((s, l) => s + (l.pieces || 0), 0);
      const defaultRatePerStone = 5;

      setQuarryStops([
        {
          id: `quarry-stop-order-${Date.now()}`,
          loadingPartyId: defaultPartyId,
          stoneLines: lines,
          hamaliAmount: totalPcs * defaultRatePerStone,
          hamaliRatePerStone: defaultRatePerStone,
          hamaliCalculationMode: 'per_stone',
          hamaliNote: 'Ramapuram loading coolie labour',
          hamaliPaidBy: 'owner',
          hamaliPaymentMode: 'cash',
          hamaliStatus: 'paid',
          mamulluAmount: 200,
          mamulluNote: 'Quarry crew & crane operator mamool',
          mamulluPaidBy: 'owner'
        }
      ]);
    } else {
      // 3. Default blank stop
      setQuarryStops([
        {
          id: `quarry-stop-init-${Date.now()}`,
          loadingPartyId: defaultPartyId,
          stoneLines: [
            {
              id: `line-${Date.now()}-1`,
              size: '2x2',
              thickness: '40mm',
              finish: 'polish',
              pieces: 60,
              ratePerSqft: getRamapuramRate('2x2', '40mm', 'polish')
            }
          ],
          hamaliAmount: 300,
          hamaliRatePerStone: 5,
          hamaliCalculationMode: 'per_stone',
          hamaliNote: 'Ramapuram loading coolie labour',
          hamaliPaidBy: 'owner',
          hamaliPaymentMode: 'cash',
          hamaliStatus: 'paid',
          mamulluAmount: 150,
          mamulluNote: 'Quarry crew & crane operator mamool',
          mamulluPaidBy: 'owner'
        }
      ]);
    }
  }, [currentTrip, currentOrder, loadingParties, stoneSpecs]);

  // Quarry Management Handlers
  const handleAddQuarryStop = () => {
    const usedPartyIds = new Set(quarryStops.map((q) => q.loadingPartyId));
    const nextParty = loadingParties.find((p) => !usedPartyIds.has(p.id)) || loadingParties[0];
    const newPartyId = nextParty?.id || `lp-new-${Date.now()}`;

    const newStop: QuarryLoadingBlock = {
      id: `quarry-stop-${Date.now()}`,
      loadingPartyId: newPartyId,
      stoneLines: [
        {
          id: `line-${Date.now()}`,
          size: '2x2',
          thickness: '40mm',
          finish: 'polish',
          pieces: 40,
          ratePerSqft: getRamapuramRate('2x2', '40mm', 'polish')
        }
      ],
      hamaliAmount: 200,
      hamaliRatePerStone: 5,
      hamaliCalculationMode: 'per_stone',
      hamaliNote: 'Quarry loading coolie wages',
      hamaliPaidBy: 'owner',
      hamaliPaymentMode: 'cash',
      hamaliStatus: 'paid',
      mamulluAmount: 100,
      mamulluNote: 'Quarry tip / mamool',
      mamulluPaidBy: 'owner'
    };

    setQuarryStops((prev) => [...prev, newStop]);
  };

  const handleRemoveQuarryStop = (stopId: string) => {
    if (quarryStops.length <= 1) {
      alert('At least one quarry loading stop is required.');
      return;
    }
    setQuarryStops((prev) => prev.filter((q) => q.id !== stopId));
  };

  const handleUpdateQuarryParty = (stopId: string, partyId: string) => {
    setQuarryStops((prev) =>
      prev.map((q) => (q.id === stopId ? { ...q, loadingPartyId: partyId } : q))
    );
  };

  // Reset all stone lines in all quarry stops to Ramapuram base rates
  const handleResetToRamapuramRates = () => {
    setQuarryStops((prev) =>
      prev.map((q) => ({
        ...q,
        stoneLines: q.stoneLines.map((l) => ({
          ...l,
          ratePerSqft: getRamapuramRate(l.size, l.thickness, l.finish)
        }))
      }))
    );
    setSaveSuccessMsg('⚡ All stone lines recalculated according to Ramapuram Quarry base purchase rates!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Stone Line Handlers per Quarry
  const handleAddStoneLine = (stopId: string) => {
    const newLine: StoneSpecItem = {
      id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      size: '2x2',
      thickness: '40mm',
      finish: 'polish',
      pieces: 40,
      ratePerSqft: getRamapuramRate('2x2', '40mm', 'polish')
    };

    setQuarryStops((prev) =>
      prev.map((q) => {
        if (q.id !== stopId) return q;
        const updatedLines = [...q.stoneLines, newLine];
        let updatedHamali = q.hamaliAmount;
        if (q.hamaliCalculationMode === 'per_stone') {
          const totalPieces = updatedLines.reduce((s, l) => s + (Number(l.pieces) || 0), 0);
          updatedHamali = totalPieces * (q.hamaliRatePerStone || 5);
        }
        return {
          ...q,
          stoneLines: updatedLines,
          hamaliAmount: updatedHamali
        };
      })
    );
  };

  const handleRemoveStoneLine = (stopId: string, lineId: string) => {
    setQuarryStops((prev) =>
      prev.map((q) => {
        if (q.id !== stopId) return q;
        if (q.stoneLines.length <= 1) return q;
        const updatedLines = q.stoneLines.filter((l) => l.id !== lineId);
        let updatedHamali = q.hamaliAmount;
        if (q.hamaliCalculationMode === 'per_stone') {
          const totalPieces = updatedLines.reduce((s, l) => s + (Number(l.pieces) || 0), 0);
          updatedHamali = totalPieces * (q.hamaliRatePerStone || 5);
        }
        return {
          ...q,
          stoneLines: updatedLines,
          hamaliAmount: updatedHamali
        };
      })
    );
  };

  const handleUpdateStoneLine = (
    stopId: string,
    lineId: string,
    updates: Partial<StoneSpecItem>
  ) => {
    setQuarryStops((prev) =>
      prev.map((q) => {
        if (q.id !== stopId) return q;
        const updatedLines = q.stoneLines.map((l) => {
          if (l.id !== lineId) return l;
          const merged = { ...l, ...updates };

          if ((updates.size || updates.thickness || updates.finish) && updates.ratePerSqft === undefined) {
            merged.ratePerSqft = getRamapuramRate(merged.size, merged.thickness, merged.finish);
          }
          return merged;
        });

        let updatedHamali = q.hamaliAmount;
        if (q.hamaliCalculationMode === 'per_stone' || updates.pieces !== undefined) {
          const totalPieces = updatedLines.reduce((s, l) => s + (Number(l.pieces) || 0), 0);
          updatedHamali = totalPieces * (q.hamaliRatePerStone || 5);
        }

        return {
          ...q,
          stoneLines: updatedLines,
          hamaliAmount: updatedHamali
        };
      })
    );
  };

  // Hamali & Mamullu Handlers per Quarry Stop
  const handleUpdateHamaliMamullu = (
    stopId: string,
    updates: Partial<QuarryLoadingBlock>
  ) => {
    setQuarryStops((prev) =>
      prev.map((q) => {
        if (q.id !== stopId) return q;
        const merged = { ...q, ...updates };

        if (updates.hamaliRatePerStone !== undefined || updates.hamaliCalculationMode === 'per_stone') {
          const totalPieces = q.stoneLines.reduce((s, l) => s + (Number(l.pieces) || 0), 0);
          merged.hamaliAmount = totalPieces * (updates.hamaliRatePerStone || q.hamaliRatePerStone || 5);
        }

        return merged;
      })
    );
  };

  // Calculations Across All Quarries (Ramapuram Sourcing Cost vs Kerala Selling Revenue)
  const totals = useMemo(() => {
    let totalPieces = 0;
    let totalSqft = 0;
    let totalRamapuramStoneCost = 0;
    let totalHamali = 0;
    let totalMamullu = 0;
    let totalEstimatedRevenue = 0;

    const buyerDistrict = currentBuyer?.district || 'Palakkad';

    quarryStops.forEach((q) => {
      totalHamali += Number(q.hamaliAmount) || 0;
      totalMamullu += Number(q.mamulluAmount) || 0;

      q.stoneLines.forEach((l) => {
        const pcs = Number(l.pieces) || 0;
        const sqftFactor = getSqftFromSize(l.size);
        const lineSqft = pcs * sqftFactor;
        const ramapuramRate = Number(l.ratePerSqft) || getRamapuramRate(l.size, l.thickness, l.finish);
        const lineStoneCost = lineSqft * ramapuramRate;

        totalPieces += pcs;
        totalSqft += lineSqft;
        totalRamapuramStoneCost += lineStoneCost;

        // Lookup destination selling rate for buyer's Kerala district
        const sellingRateMatch = districtRates.find(
          (dr) =>
            dr.district === buyerDistrict &&
            dr.size === l.size &&
            dr.thickness === l.thickness &&
            dr.finish === l.finish
        );
        const sellingRate = sellingRateMatch ? sellingRateMatch.ratePerSqft : ramapuramRate + 20;
        totalEstimatedRevenue += lineSqft * sellingRate;
      });
    });

    const lorryCapacity = currentLorry?.capacitySqft || 2400;
    const capacityUsagePct = Math.round((totalSqft / lorryCapacity) * 100);
    const totalLabourCost = totalHamali + totalMamullu;
    const grandTotalLandedCost = totalRamapuramStoneCost + totalLabourCost;
    const estimatedGrossProfit = totalEstimatedRevenue - grandTotalLandedCost;
    const grossMarginPercentage = totalEstimatedRevenue > 0 ? Math.round((estimatedGrossProfit / totalEstimatedRevenue) * 100) : 0;

    return {
      totalPieces,
      totalSqft,
      totalRamapuramStoneCost,
      totalStoneCost: totalRamapuramStoneCost,
      totalHamali,
      totalMamullu,
      totalLabourCost,
      grandTotalLandedCost,
      grandTotalSourcingAndLabour: grandTotalLandedCost,
      totalEstimatedRevenue,
      estimatedGrossProfit,
      grossMarginPercentage,
      lorryCapacity,
      capacityUsagePct
    };
  }, [quarryStops, currentBuyer, districtRates, currentLorry, stoneSpecs]);

  // Persist Details to Database & State and Transition to Next Incoming Fleet
  const handleSaveDetails = async (dispatchAfterSave = false) => {
    if (!currentTrip) {
      alert('Please select a fleet/trip to record loading details.');
      return;
    }

    if (totals.totalPieces <= 0 || totals.totalSqft <= 0) {
      alert('Please add at least one stone specification with pieces greater than 0.');
      return;
    }

    setSaveLoading(true);
    setSaveSuccessMsg(null);

    try {
      const dispatchedPlate = currentLorry?.plate || currentTrip.lorryId;

      // 1. Build all StoneLines
      const formattedStoneLines: StoneLine[] = [];
      const formattedWorkerPayments: WorkerPayment[] = [];

      quarryStops.forEach((q, qIdx) => {
        q.stoneLines.forEach((line, lIdx) => {
          const sqftFactor = getSqftFromSize(line.size);
          formattedStoneLines.push({
            id: `sl-${q.loadingPartyId}-${qIdx}-${lIdx}-${Date.now()}`,
            loadingPartyId: q.loadingPartyId,
            size: line.size,
            thickness: line.thickness,
            finish: line.finish,
            sqftPerPiece: sqftFactor,
            pieces: Number(line.pieces) || 0,
            ratePerSqft: Number(line.ratePerSqft) || getRamapuramRate(line.size, line.thickness, line.finish)
          });
        });

        // 2. Build Hamali (Labour) payment
        if (q.hamaliAmount > 0) {
          formattedWorkerPayments.push({
            id: `w-hamali-${q.loadingPartyId}-${Date.now()}`,
            loadingPartyId: q.loadingPartyId,
            amount: Number(q.hamaliAmount),
            note: `Hamali (Labour): ${q.hamaliNote || 'Loading coolie'} · ${q.hamaliPaidBy.toUpperCase()}`,
            type: 'hamali',
            paidBy: q.hamaliPaidBy,
            paymentMode: q.hamaliPaymentMode
          });
        }

        // 3. Build Mamullu (Quarry Tip) payment
        if (q.mamulluAmount > 0) {
          formattedWorkerPayments.push({
            id: `w-mamullu-${q.loadingPartyId}-${Date.now()}`,
            loadingPartyId: q.loadingPartyId,
            amount: Number(q.mamulluAmount),
            note: `Mamullu (Tips): ${q.mamulluNote || 'Quarry crew tip'} · ${q.mamulluPaidBy.toUpperCase()}`,
            type: 'mamullu',
            paidBy: q.mamulluPaidBy
          });
        }
      });

      // 4. Update Trip via API
      const updatedPayload: Partial<Trip> = {
        stoneLines: formattedStoneLines,
        workerPayments: formattedWorkerPayments,
        status: dispatchAfterSave ? 'in-transit' : currentTrip.status
      };

      await tripsApi.update(currentTrip.id, updatedPayload);

      // If dispatching, also update lorry location & trigger dispatch event
      if (dispatchAfterSave && currentLorry) {
        await lorriesApi.update(currentLorry.id, {
          location: `En route to ${currentBuyer?.district || 'Kerala'} — dispatched from Ramapuram`,
          status: 'active'
        }).catch(() => { });
        dispatchTrip(currentTrip.id);
      }

      await syncDatabase();

      if (dispatchAfterSave) {
        // Find next remaining fleet in the loading queue
        const remainingWaitingTrips = trips.filter(
          (t) => t.id !== currentTrip.id && t.status === 'loading'
        );

        if (remainingWaitingTrips.length > 0) {
          const nextTrip = remainingWaitingTrips[0];
          const nextLorry = lorries.find((l) => l.id === nextTrip.lorryId || l.plate === nextTrip.lorryId);
          setSelectedTripId(nextTrip.id);
          setSearchParams({ tripId: nextTrip.id });
          setSaveSuccessMsg(
            `🚀 Fleet ${dispatchedPlate} dispatched successfully! Switched to next incoming fleet (${nextLorry?.plate || nextTrip.lorryId}) in Ramapuram queue.`
          );
        } else {
          // No more fleets awaiting loading in yard
          setSelectedTripId('');
          setSearchParams({});
          setSaveSuccessMsg(
            `🚀 Fleet ${dispatchedPlate} dispatched successfully! All assigned lorries in Ramapuram yard have departed. Awaiting next incoming fleet.`
          );
        }
      } else {
        setSaveSuccessMsg(
          `✅ Loading details for ${dispatchedPlate} (${totals.totalPieces} stones across ${quarryStops.length} quarries at Ramapuram cost) saved successfully!`
        );
      }

      setTimeout(() => setSaveSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error('Failed to save loading details:', err);
      alert('Could not save loading details. Please check network connection.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-full pb-16">
      <PageHeader
        title="Fleet Stone Loading Operations"
        subtitle="Select an awaiting fleet in Ramapuram yard to record multi-quarry stones and labour wages. Dispatched fleets automatically move into transit."
        action={
          <div className="flex flex-wrap items-center gap-3">
            {currentTrip && (
              <button
                onClick={handleResetToRamapuramRates}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3.5 py-2 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-400/20"
                title="Recalculate all stone lines with standard Ramapuram base quarry purchase rates"
              >
                <ZapIcon className="h-4 w-4 text-amber-400" />
                ⚡ Recalculate at Ramapuram Cost
              </button>
            )}
            <button
              onClick={() => setIsPartyModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-3.5 py-2 text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
            >
              <Building2Icon className="h-4 w-4" />
              + Add Quarry Account
            </button>
            {currentTrip && (
              <button
                onClick={() => setIsChallanModalOpen(true)}
                disabled={totals.totalPieces === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3.5 py-2 text-xs font-semibold text-neutral-200 transition-colors hover:bg-ink-700 hover:text-white disabled:opacity-40"
              >
                <PrinterIcon className="h-4 w-4" />
                Print Loading Challan
              </button>
            )}
          </div>
        }
      />

        <div className="space-y-4 sm:space-y-6 p-3.5 sm:p-6 lg:p-8">
          {/* Success Alert Banner */}
          <AnimatePresence>
            {saveSuccessMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between rounded-xl border border-green-500/40 bg-green-500/15 p-3.5 sm:p-4 text-xs sm:text-sm font-semibold text-green-300 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2Icon className="h-5 w-5 shrink-0 text-green-400" />
                  <span>{saveSuccessMsg}</span>
                </div>
                <button
                  onClick={() => setSaveSuccessMsg(null)}
                  className="rounded p-1 text-green-400 hover:bg-green-500/20"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 1: Fleet & Trip Selector Header */}
              <Card className="p-3.5 sm:p-5">
                <div className="flex flex-col gap-3.5 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                          1
                        </span>
                          <h2 className="text-sm sm:text-base font-bold text-white">
                            Active Fleet Loading Queue (Ramapuram Yard)
                          </h2>
                        </div>
                        <p className="text-xs text-neutral-400">
                          Only lorries awaiting stone loading are listed. Once dispatched, lorries move to in-transit automatically.
                        </p>
                    </div>

                    {/* Fleet Dropdown (Filters exclusively for loading trips) */}
                        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
                          <div className="w-full sm:w-auto sm:min-w-[300px]">
                            <select
                              value={selectedTripId}
                              onChange={(e) => {
                                setSelectedTripId(e.target.value);
                                if (e.target.value) {
                                  setSearchParams({ tripId: e.target.value });
                                } else {
                                  setSearchParams({});
                                }
                              }}
                              className="w-full rounded-xl border border-ink-600 bg-ink-900 px-3 sm:px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-inner focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                            >
                              {loadingTrips.length === 0 ? (
                                <option value="">-- No lorries currently awaiting loading in yard --</option>
                              ) : (
                                <>
                                  <option value="">-- Choose Awaiting Lorry ({loadingTrips.length} in queue) --</option>
                                  {loadingTrips.map((t) => {
                                    const l = lorries.find((lorry) => lorry.id === t.lorryId || lorry.plate === t.lorryId);
                                    const d = drivers.find((driver) => driver.id === t.driverId);
                                    const b = unloadingParties.find((party) => party.id === t.unloadingPartyId);
                                    return (
                                      <option key={t.id} value={t.id}>
                                        🟡 {l?.plate || t.lorryId} — {d?.name || 'Driver'} → {b?.name || 'Buyer'} ({b?.district || 'Kerala'})
                                      </option>
                                    );
                                  })}
                                </>
                              )}
                            </select>
                          </div>

                          {loadingTrips.length > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30">
                              <span className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
                              {loadingTrips.length} Fleet{loadingTrips.length > 1 ? 's' : ''} in Yard Queue
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-300 border border-green-500/30">
                              <CheckCircle2Icon className="h-3.5 w-3.5 text-green-400" />
                              Yard Clear · All Dispatched
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selected Fleet Information Showcase Card */}
                      {currentTrip ? (
                              <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 rounded-xl border border-ink-700/80 bg-ink-950/60 p-3 sm:p-4">
                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 border border-gold/30 text-gold shadow-sm">
                                    <TruckIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                  </div>
                                      <div className="min-w-0">
                                        <span className="text-[9.5px] sm:text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block truncate">
                                          Vehicle Plate
                                        </span>
                                          <p className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                                            {currentLorry?.plate || currentTrip.lorryId}
                                          </p>
                                            <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate">
                                              Cap: <strong className="text-gold font-mono">{totals.lorryCapacity.toLocaleString('en-IN')} sqft</strong>
                                            </p>
                                          </div>
                                      </div>

                                          <div className="flex items-center gap-2.5 sm:gap-3 sm:border-l border-ink-800 sm:pl-4 min-w-0">
                                            <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 shadow-sm">
                                              <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                            </div>
                                                <div className="min-w-0">
                                                  <span className="text-[9.5px] sm:text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block truncate">
                                                    Assigned Driver
                                                  </span>
                                                    <p className="text-xs sm:text-sm font-bold text-white truncate">
                                                      {currentDriver?.name || 'Assigned Driver'}
                                                    </p>
                                                      <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate">
                                                        {currentDriver?.phone || 'Contact on file'}
                                                      </p>
                                                    </div>
                                                </div>

                                                    <div className="flex items-center gap-2.5 sm:gap-3 border-t sm:border-t-0 lg:border-l border-ink-800 pt-2.5 sm:pt-0 lg:pl-4 min-w-0">
                                                      <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm">
                                                        <MapPinIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                                      </div>
                                                          <div className="min-w-0">
                                                            <span className="text-[9.5px] sm:text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block truncate">
                                                              Destination &amp; Buyer
                                                            </span>
                                                              <p className="text-xs sm:text-sm font-bold text-white truncate">
                                                                {currentBuyer?.name || 'Kerala Buyer'}
                                                              </p>
                                                                <p className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold truncate">
                                                                  {currentBuyer?.district || 'Kerala'} District
                                                                </p>
                                                              </div>
                                                          </div>

                                                              <div className="flex items-center gap-2.5 sm:gap-3 border-t sm:border-t-0 lg:border-l border-ink-800 pt-2.5 sm:pt-0 lg:pl-4 min-w-0">
                                                                <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 shadow-sm">
                                                                  <LayersIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                                                </div>
                                                                    <div className="min-w-0">
                                                                      <span className="text-[9.5px] sm:text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block truncate">
                                                                        Loading Status
                                                                      </span>
                                                                      <div className="mt-0.5">
                                                                        <TripStatusBadge status={currentTrip.status} />
                                                                      </div>
                                                                        <p className="text-[9.5px] sm:text-[10px] text-neutral-400 mt-0.5 truncate">
                                                                          Trip: <span className="font-mono text-white">{currentTrip.code}</span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                              </div>
                                                              ) : (
                                                              <div className="mt-5 rounded-2xl border border-dashed border-ink-700 bg-ink-950/40 p-8 text-center space-y-4">
                                                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-gold/20 border border-gold/30 text-gold shadow-lg">
                                                                  <TruckIcon className="h-7 w-7" />
                                                                </div>
                                                                <div className="max-w-md mx-auto space-y-1">
                                                                  <h3 className="text-base font-bold text-white">
                                                                    {loadingTrips.length === 0
                                                                      ? 'All Assigned Fleets Have Been Dispatched!'
                                                                      : 'Select a Fleet to Record Loading Details'}
                                                                  </h3>
                                                                  <p className="text-xs text-neutral-400 leading-relaxed">
                                                                    {loadingTrips.length === 0
                                                                      ? 'No more lorries are currently waiting in the Ramapuram yard loading queue. Go to Orders to assign incoming fleet or track lorries in transit below.'
                                                                      : 'Choose an awaiting lorry from the dropdown above to fill stone counts and Hamali & Mamullu labour details.'}
                                                                  </p>
                                                                </div>

                                                                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                                                  <Link
                                                                    to="/orders"
                                                                    className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-ink-950 shadow-md hover:bg-gold-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                                  >
                                                                    <ShoppingBagIcon className="h-4 w-4" />
                                                                    View Orders &amp; Assign Incoming Fleet
                                                                  </Link>
                                                                  <Link
                                                                    to="/trips"
                                                                    className="inline-flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-ink-800 transition-all"
                                                                  >
                                                                    <MapPinIcon className="h-4 w-4 text-emerald-400" />
                                                                    Track Fleets in Transit ({inTransitTrips.length})
                                                                  </Link>
                                                                </div>
                                                              </div>
          )}
                                                            </Card>

                                                            {currentTrip ? (
                                                              <>
                                                                {/* Live Visual Capacity & Multi-Quarry Sourcing Indicator Bar */}
                                                                <Card className="p-4 bg-gradient-to-br from-ink-900 via-ink-950 to-ink-900 border-gold/20">
                                                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                                    <div>
                                                                      <div className="flex items-center gap-2">
                                                                        <SparklesIcon className="h-4 w-4 text-gold" />
                                                                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                                                                          Fleet Loading Volume Meter
                                                                        </span>
                                                                      </div>
                                                                      <p className="text-xs text-neutral-400 mt-0.5">
                                                                        Loaded <strong className="text-white font-mono">{totals.totalPieces} stones</strong> across{' '}
                                                                        <strong className="text-gold">{quarryStops.length} Ramapuram {quarryStops.length === 1 ? 'Quarry' : 'Quarries'}</strong>
                                                                      </p>
                                                                    </div>

                                                                    <div className="text-right">
                                                                      <span className={`text-base font-black font-mono ${totals.capacityUsagePct > 105 ? 'text-red-400' : totals.capacityUsagePct >= 80 ? 'text-green-400' : 'text-gold'}`}>
                                                                        {totals.totalSqft.toLocaleString('en-IN')} / {totals.lorryCapacity.toLocaleString('en-IN')} SQFT ({totals.capacityUsagePct}%)
                                                                      </span>
                                                                      {totals.capacityUsagePct > 100 && (
                                                                        <span className="ml-2 inline-flex items-center gap-1 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
                                                                          <AlertTriangleIcon className="h-3 w-3" /> Overloaded
                                                                        </span>
                                                                      )}
                                                                    </div>
                                                                  </div>

                                                                  <div className="mt-3 h-2.5 w-full rounded-full bg-ink-800 overflow-hidden border border-ink-700/60 shadow-inner">
                                                                    <div
                                                                      style={{ width: `${Math.min(totals.capacityUsagePct, 100)}%` }}
                                                                      className={`h-full transition-all duration-500 ${totals.capacityUsagePct > 100
                                                                          ? 'bg-gradient-to-r from-amber-500 to-red-500'
                                                                          : totals.capacityUsagePct >= 80
                                                                            ? 'bg-gradient-to-r from-gold to-green-500'
                                                                            : 'bg-gradient-to-r from-gold-600 to-gold'
                                                                        }`}
                                                                    />
                                                                  </div>
                                                                </Card>

                                                                {/* Step 2: Multi-Quarry Stone Loading Blocks */}
                                                                <div className="space-y-6">
                                                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                                                    <div className="space-y-0.5">
                                                                      <div className="flex items-center gap-2">
                                                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                                                                          2
                                                                        </span>
                                                                        <h3 className="text-base font-bold text-white">
                                                                          Multi-Quarry Split Loading Breakdown (Ramapuram Sourcing Cost)
                                                                        </h3>
                                                                      </div>
                                                                      <p className="text-xs text-neutral-400">
                                                                        Calculated using Ramapuram quarry base purchase cost per sqft.
                                                                      </p>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                      <button
                                                                        type="button"
                                                                        onClick={handleResetToRamapuramRates}
                                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-400/20 transition-colors"
                                                                      >
                                                                        <ZapIcon className="h-3.5 w-3.5 text-amber-400" />
                                                                        Reset to Ramapuram Rates
                                                                      </button>
                                                                      <button
                                                                        type="button"
                                                                        onClick={handleAddQuarryStop}
                                                                        className="inline-flex items-center gap-2 rounded-lg bg-gold px-3.5 py-1.5 text-xs font-bold text-ink-950 shadow-md transition-all hover:bg-gold-400 hover:scale-[1.02] active:scale-[0.98]"
                                                                      >
                                                                        <PlusIcon className="h-4 w-4" />
                                                                        + Add Quarry Stop
                                                                      </button>
                                                                    </div>
                                                                  </div>

                                                                  {/* List of Quarry Cards */}
                                                                  {quarryStops.map((quarryStop, qIndex) => {
                                                                    const party = loadingParties.find((p) => p.id === quarryStop.loadingPartyId);
                                                                    const quarryPieces = quarryStop.stoneLines.reduce((s, l) => s + (Number(l.pieces) || 0), 0);
                                                                    const quarrySqft = quarryStop.stoneLines.reduce((s, l) => s + (Number(l.pieces) || 0) * getSqftFromSize(l.size), 0);
                                                                    const quarryStoneCost = quarryStop.stoneLines.reduce(
                                                                      (s, l) => s + (Number(l.pieces) || 0) * getSqftFromSize(l.size) * (Number(l.ratePerSqft) || 0),
                                                                      0
                                                                    );

                                                                    return (
                                                                      <motion.div
                                                                        key={quarryStop.id}
                                                                        initial={{ opacity: 0, y: 15 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ duration: 0.25 }}
                                                                      >
                                                                        <Card className="overflow-hidden border-ink-650 shadow-xl bg-ink-900/90">
                                                                          {/* Quarry Stop Header */}
                                                                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-700 bg-ink-950/80 px-5 py-3.5">
                                                                            <div className="flex items-center gap-3">
                                                                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/20 text-xs font-black text-gold border border-gold/30">
                                                                                Q{qIndex + 1}
                                                                              </div>
                                                                              <div>
                                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                                                                  Quarry Stop #{qIndex + 1}
                                                                                </span>
                                                                                <div className="flex items-center gap-2">
                                                                                  <select
                                                                                    value={quarryStop.loadingPartyId}
                                                                                    onChange={(e) => handleUpdateQuarryParty(quarryStop.id, e.target.value)}
                                                                                    className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-1.5 text-xs font-bold text-white focus:border-gold focus:outline-none"
                                                                                  >
                                                                                    {loadingParties.map((lp) => (
                                                                                      <option key={lp.id} value={lp.id}>
                                                                                        {lp.name} ({lp.location})
                                                                                      </option>
                                                                                    ))}
                                                                                  </select>
                                                                                  <span className="text-xs text-neutral-400 font-medium">
                                                                                    Location: <strong className="text-white">{party?.location || 'Ramapuram'}</strong>
                                                                                  </span>
                                                                                </div>
                                                                              </div>
                                                                            </div>

                                                                            <div className="flex items-center gap-4">
                                                                              <div className="text-right">
                                                                                <span className="text-[10px] uppercase text-neutral-500 font-semibold block">
                                                                                  Quarry Sourcing Subtotal
                                                                                </span>
                                                                                <span className="text-xs font-bold text-gold font-mono">
                                                                                  {quarryPieces} stones · {quarrySqft.toLocaleString('en-IN')} sqft · {formatINR(quarryStoneCost)}
                                                                                </span>
                                                                              </div>

                                                                              {quarryStops.length > 1 && (
                                                                                <button
                                                                                  type="button"
                                                                                  onClick={() => handleRemoveQuarryStop(quarryStop.id)}
                                                                                  className="rounded-lg border border-red-500/30 p-1.5 text-neutral-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                                                                  title="Remove Quarry Stop"
                                                                                >
                                                                                  <Trash2Icon className="h-4 w-4" />
                                                                                </button>
                                                                              )}
                                                                            </div>
                                                                          </div>

                                                                          {/* Stone Lines Table */}
                                                                          <div className="p-5 space-y-4">
                                                                            <div className="ti-scroll overflow-x-auto">
                                                                              <table className="w-full min-w-[760px] text-left text-xs">
                                                                                <thead>
                                                                                  <tr className="border-b border-ink-800 bg-ink-950/40 text-[11px] uppercase tracking-wider text-neutral-400">
                                                                                    <th className="px-3 py-2.5 font-semibold">Stone Size</th>
                                                                                    <th className="px-3 py-2.5 font-semibold">Thickness</th>
                                                                                    <th className="px-3 py-2.5 font-semibold">Finish</th>
                                                                                    <th className="px-3 py-2.5 text-center font-semibold">Pieces / Stones</th>
                                                                                    <th className="px-3 py-2.5 text-right font-semibold">
                                                                                      Ramapuram Cost (₹/sqft)
                                                                                    </th>
                                                                                    <th className="px-3 py-2.5 text-right font-semibold">Total Sqft</th>
                                                                                    <th className="px-3 py-2.5 text-right font-semibold">Sourcing Cost</th>
                                                                                    <th className="px-3 py-2.5 text-right font-semibold">Kerala Rate</th>
                                                                                    <th className="px-3 py-2.5 text-right font-semibold">Est. Revenue</th>
                                                                                    <th className="px-3 py-2.5 text-center font-semibold">Action</th>
                                                                                  </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-ink-800/60">
                                                                                  {quarryStop.stoneLines.map((line) => {
                                                                                    const sqftPerPiece = getSqftFromSize(line.size);
                                                                                    const totalLineSqft = (Number(line.pieces) || 0) * sqftPerPiece;
                                                                                    const ramapuramRate = Number(line.ratePerSqft) || getRamapuramRate(line.size, line.thickness, line.finish);
                                                                                    const totalLineCost = totalLineSqft * ramapuramRate;

                                                                                    const buyerDistrict = currentBuyer?.district || 'Palakkad';
                                                                                    const sellingRateMatch = districtRates.find(
                                                                                      (dr) =>
                                                                                        dr.district === buyerDistrict &&
                                                                                        dr.size === line.size &&
                                                                                        dr.thickness === line.thickness &&
                                                                                        dr.finish === line.finish
                                                                                    );
                                                                                    const sellingRate = sellingRateMatch ? sellingRateMatch.ratePerSqft : ramapuramRate + 20;
                                                                                    const lineRevenue = totalLineSqft * sellingRate;

                                                                                    return (
                                                                                      <tr key={line.id} className="hover:bg-white/[0.02] transition-colors">
                                                                                        {/* Size */}
                                                                                        <td className="px-3 py-2.5">
                                                                                          <select
                                                                                            value={line.size}
                                                                                            onChange={(e) =>
                                                                                              handleUpdateStoneLine(quarryStop.id, line.id, { size: e.target.value })
                                                                                            }
                                                                                            className="w-20 rounded-lg border border-ink-700 bg-ink-900 px-2 py-1.5 text-xs font-semibold text-white focus:border-gold focus:outline-none"
                                                                                          >
                                                                                            {standardSizes.map((s) => (
                                                                                              <option key={s} value={s}>
                                                                                                {s}
                                                                                              </option>
                                                                                            ))}
                                                                                          </select>
                                                                                        </td>

                                                                                        {/* Thickness */}
                                                                                        <td className="px-3 py-2.5">
                                                                                          <select
                                                                                            value={line.thickness}
                                                                                            onChange={(e) =>
                                                                                              handleUpdateStoneLine(quarryStop.id, line.id, { thickness: e.target.value })
                                                                                            }
                                                                                            className="w-20 rounded-lg border border-ink-700 bg-ink-900 px-2 py-1.5 text-xs font-semibold text-white focus:border-gold focus:outline-none"
                                                                                          >
                                                                                            {standardThicknesses.map((t) => (
                                                                                              <option key={t} value={t}>
                                                                                                {t}
                                                                                              </option>
                                                                                            ))}
                                                                                          </select>
                                                                                        </td>

                                                                                        {/* Finish */}
                                                                                        <td className="px-3 py-2.5">
                                                                                          <select
                                                                                            value={line.finish}
                                                                                            onChange={(e) =>
                                                                                              handleUpdateStoneLine(quarryStop.id, line.id, { finish: e.target.value as Finish })
                                                                                            }
                                                                                            className="w-22 rounded-lg border border-ink-700 bg-ink-900 px-2 py-1.5 text-xs font-semibold text-white capitalize focus:border-gold focus:outline-none"
                                                                                          >
                                                                                            {finishOptions.map((f) => (
                                                                                              <option key={f} value={f}>
                                                                                                {f}
                                                                                              </option>
                                                                                            ))}
                                                                                          </select>
                                                                                        </td>

                                                                                        {/* Pieces */}
                                                                                        <td className="px-3 py-2.5 text-center">
                                                                                          <input
                                                                                            type="number"
                                                                                            min="1"
                                                                                            value={line.pieces || ''}
                                                                                            onChange={(e) =>
                                                                                              handleUpdateStoneLine(quarryStop.id, line.id, {
                                                                                                pieces: parseInt(e.target.value) || 0
                                                                                              })
                                                                                            }
                                                                                            placeholder="0"
                                                                                            className="w-18 rounded-lg border border-ink-600 bg-ink-950 px-2 py-1.5 text-center text-xs font-bold text-white shadow-inner focus:border-gold focus:outline-none"
                                                                                          />
                                                                                        </td>

                                                                                        {/* Ramapuram Purchase Rate */}
                                                                                        <td className="px-3 py-2.5 text-right">
                                                                                          <div className="inline-flex items-center gap-1">
                                                                                            <span className="text-amber-400 font-bold">₹</span>
                                                                                            <input
                                                                                              type="number"
                                                                                              min="1"
                                                                                              step="0.5"
                                                                                              value={line.ratePerSqft || ''}
                                                                                              onChange={(e) =>
                                                                                                handleUpdateStoneLine(quarryStop.id, line.id, {
                                                                                                  ratePerSqft: parseFloat(e.target.value) || 0
                                                                                                })
                                                                                              }
                                                                                              className="w-16 rounded-lg border border-amber-400/40 bg-ink-950 px-2 py-1.5 text-right text-xs font-bold text-amber-300 shadow-inner focus:border-gold focus:outline-none"
                                                                                            />
                                                                                          </div>
                                                                                        </td>

                                                                                        {/* Total Sqft */}
                                                                                        <td className="px-3 py-2.5 text-right font-mono font-medium text-neutral-300">
                                                                                          {totalLineSqft.toLocaleString('en-IN')} sqft
                                                                                        </td>

                                                                                        {/* Ramapuram Stone Amount */}
                                                                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-300">
                                                                                          {formatINR(totalLineCost)}
                                                                                        </td>

                                                                                        {/* Selling Rate */}
                                                                                        <td className="px-3 py-2.5 text-right font-mono text-neutral-400">
                                                                                          ₹{sellingRate}/sqft
                                                                                        </td>

                                                                                        {/* Est. Revenue */}
                                                                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-400">
                                                                                          {formatINR(lineRevenue)}
                                                                                        </td>

                                                                                        {/* Action */}
                                                                                        <td className="px-3 py-2.5 text-center">
                                                                                          <button
                                                                                            type="button"
                                                                                            onClick={() => handleRemoveStoneLine(quarryStop.id, line.id)}
                                                                                            disabled={quarryStop.stoneLines.length <= 1}
                                                                                            className="rounded p-1 text-neutral-500 hover:text-red-400 disabled:opacity-30"
                                                                                          >
                                                                                            <Trash2Icon className="h-3.5 w-3.5" />
                                                                                          </button>
                                                                                        </td>
                                                                                      </tr>
                                                                                    );
                                                                                  })}
                                                                                </tbody>
                                                                              </table>
                                                                            </div>

                                                                            <button
                                                                              type="button"
                                                                              onClick={() => handleAddStoneLine(quarryStop.id)}
                                                                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-gold-300 hover:underline"
                                                                            >
                                                                              <PlusIcon className="h-3.5 w-3.5" />
                                                                              + Add another stone specification to this quarry
                                                                            </button>

                                                                            {/* Quarry Hamali & Mamullu (Labour Expenses) Sub-block */}
                                                                            <div className="mt-4 rounded-xl border border-ink-750 bg-ink-950/70 p-4 space-y-3">
                                                                              <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                  <UsersIcon className="h-4 w-4 text-amber-400" />
                                                                                  <span className="text-xs font-bold text-white">
                                                                                    Quarry Labour Wages: Hamali (కూలీ) &amp; Mamullu (మామూళ్ళు)
                                                                                  </span>
                                                                                </div>
                                                                                <span className="text-[11px] text-neutral-400">
                                                                                  Subtotal Labour:{' '}
                                                                                  <strong className="text-amber-300 font-mono">
                                                                                    {formatINR((Number(quarryStop.hamaliAmount) || 0) + (Number(quarryStop.mamulluAmount) || 0))}
                                                                                  </strong>
                                                                                </span>
                                                                              </div>

                                                                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                                                {/* Hamali (Labour coolie) */}
                                                                                <div className="rounded-lg border border-ink-700 bg-ink-900/60 p-3 space-y-2">
                                                                                  <div className="flex items-center justify-between">
                                                                                    <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                                                                                      Hamali (Loading Labour)
                                                                                    </label>
                                                                                    <span className="text-[10px] text-neutral-500 font-mono">
                                                                                      {quarryStop.hamaliCalculationMode === 'per_stone' ? `₹${quarryStop.hamaliRatePerStone}/stone` : 'Fixed'}
                                                                                    </span>
                                                                                  </div>

                                                                                  <div className="flex items-center gap-2">
                                                                                    <div className="relative flex-1">
                                                                                      <span className="absolute left-2.5 top-2 text-xs text-neutral-400">₹</span>
                                                                                      <input
                                                                                        type="number"
                                                                                        value={quarryStop.hamaliAmount || ''}
                                                                                        onChange={(e) =>
                                                                                          handleUpdateHamaliMamullu(quarryStop.id, {
                                                                                            hamaliAmount: parseFloat(e.target.value) || 0,
                                                                                            hamaliCalculationMode: 'lump'
                                                                                          })
                                                                                        }
                                                                                        placeholder="0"
                                                                                        className="w-full rounded-lg border border-ink-600 bg-ink-950 pl-6 pr-2 py-1.5 text-xs font-bold text-white focus:border-gold focus:outline-none"
                                                                                      />
                                                                                    </div>
                                                                                    <select
                                                                                      value={quarryStop.hamaliPaidBy}
                                                                                      onChange={(e) =>
                                                                                        handleUpdateHamaliMamullu(quarryStop.id, {
                                                                                          hamaliPaidBy: e.target.value as any
                                                                                        })
                                                                                      }
                                                                                      className="rounded-lg border border-ink-600 bg-ink-950 px-2 py-1.5 text-[11px] font-semibold text-neutral-300 focus:border-gold focus:outline-none"
                                                                                    >
                                                                                      <option value="owner">Paid by Owner</option>
                                                                                      <option value="driver">Paid by Driver</option>
                                                                                      <option value="quarry">Quarry Borne</option>
                                                                                    </select>
                                                                                  </div>

                                                                                  <input
                                                                                    type="text"
                                                                                    value={quarryStop.hamaliNote}
                                                                                    onChange={(e) =>
                                                                                      handleUpdateHamaliMamullu(quarryStop.id, {
                                                                                        hamaliNote: e.target.value
                                                                                      })
                                                                                    }
                                                                                    placeholder="Labour crew note (e.g. 6-member gang coolie)"
                                                                                    className="w-full rounded-lg border border-ink-800 bg-ink-950 px-2.5 py-1 text-[11px] text-neutral-300 placeholder:text-neutral-600 focus:border-gold focus:outline-none"
                                                                                  />
                                                                                </div>

                                                                                {/* Mamullu (Quarry Tips / Crew Mamool) */}
                                                                                <div className="rounded-lg border border-ink-700 bg-ink-900/60 p-3 space-y-2">
                                                                                  <div className="flex items-center justify-between">
                                                                                    <label className="text-[11px] font-bold text-gold uppercase tracking-wider">
                                                                                      Mamullu (Quarry Tips)
                                                                                    </label>
                                                                                    <span className="text-[10px] text-neutral-500 font-mono">Tips / Extras</span>
                                                                                  </div>

                                                                                  <div className="flex items-center gap-2">
                                                                                    <div className="relative flex-1">
                                                                                      <span className="absolute left-2.5 top-2 text-xs text-neutral-400">₹</span>
                                                                                      <input
                                                                                        type="number"
                                                                                        value={quarryStop.mamulluAmount || ''}
                                                                                        onChange={(e) =>
                                                                                          handleUpdateHamaliMamullu(quarryStop.id, {
                                                                                            mamulluAmount: parseFloat(e.target.value) || 0
                                                                                          })
                                                                                        }
                                                                                        placeholder="0"
                                                                                        className="w-full rounded-lg border border-ink-600 bg-ink-950 pl-6 pr-2 py-1.5 text-xs font-bold text-white focus:border-gold focus:outline-none"
                                                                                      />
                                                                                    </div>
                                                                                    <select
                                                                                      value={quarryStop.mamulluPaidBy}
                                                                                      onChange={(e) =>
                                                                                        handleUpdateHamaliMamullu(quarryStop.id, {
                                                                                          mamulluPaidBy: e.target.value as any
                                                                                        })
                                                                                      }
                                                                                      className="rounded-lg border border-ink-600 bg-ink-950 px-2 py-1.5 text-[11px] font-semibold text-neutral-300 focus:border-gold focus:outline-none"
                                                                                    >
                                                                                      <option value="owner">By Owner</option>
                                                                                      <option value="driver">By Driver</option>
                                                                                    </select>
                                                                                  </div>

                                                                                  <input
                                                                                    type="text"
                                                                                    value={quarryStop.mamulluNote}
                                                                                    onChange={(e) =>
                                                                                      handleUpdateHamaliMamullu(quarryStop.id, {
                                                                                        mamulluNote: e.target.value
                                                                                      })
                                                                                    }
                                                                                    placeholder="Mamool reason (e.g. loader operator tip)"
                                                                                    className="w-full rounded-lg border border-ink-800 bg-ink-950 px-2.5 py-1 text-[11px] text-neutral-300 placeholder:text-neutral-600 focus:border-gold focus:outline-none"
                                                                                  />
                                                                                </div>

                                                                                {/* Quick Hamali Calculator Helper */}
                                                                                <div className="rounded-lg border border-dashed border-ink-700/80 bg-ink-900/30 p-3 space-y-1.5">
                                                                                  <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                                                                                    <CalculatorIcon className="h-3 w-3 text-gold" /> Auto-Compute Helper
                                                                                  </span>
                                                                                  <p className="text-[11px] text-neutral-400 leading-tight">
                                                                                    Sourced <strong className="text-white font-mono">{quarryPieces} stones</strong> from this quarry.
                                                                                  </p>
                                                                                  <div className="flex items-center gap-1.5 pt-1">
                                                                                    {[4, 5, 6, 7].map((rate) => (
                                                                                      <button
                                                                                        key={rate}
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                          handleUpdateHamaliMamullu(quarryStop.id, {
                                                                                            hamaliRatePerStone: rate,
                                                                                            hamaliCalculationMode: 'per_stone',
                                                                                            hamaliAmount: quarryPieces * rate
                                                                                          })
                                                                                        }
                                                                                        className={`rounded px-2 py-1 text-[10px] font-bold border transition-colors ${quarryStop.hamaliRatePerStone === rate
                                                                                            ? 'bg-gold text-ink-950 border-gold'
                                                                                            : 'border-ink-700 bg-ink-950 text-neutral-300 hover:border-gold/40'
                                                                                          }`}
                                                                                      >
                                                                                        ₹{rate}/pc
                                                                                      </button>
                                                                                    ))}
                                                                                  </div>
                                                                                </div>
                                                                              </div>
                                                                            </div>
                                                                          </div>
                                                                        </Card>
                                                                      </motion.div>
                                                                    );
                                                                  })}
                                                                </div>

                                                                {/* Step 3: Comprehensive Financial Summary & Dispatch Bar */}
                                                                <Card className="p-6 bg-gradient-to-b from-ink-900 via-ink-950 to-ink-950 border-gold/30 shadow-2xl">
                                                                  <div className="flex items-center justify-between border-b border-ink-800 pb-4 mb-4">
                                                                    <div className="flex items-center gap-2">
                                                                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                                                                        3
                                                                      </span>
                                                                      <h3 className="text-base font-bold text-white">
                                                                        Overall Loading Cost (Ramapuram Sourcing) &amp; Profit Intelligence
                                                                      </h3>
                                                                    </div>
                                                                    <span className="text-xs text-neutral-400">
                                                                      Target Destination: <strong className="text-white">{currentBuyer?.district || 'Kerala'}</strong>
                                                                    </span>
                                                                  </div>

                                                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                                                    <div className="rounded-xl border border-ink-800 bg-ink-900/50 p-3">
                                                                      <span className="text-[10px] uppercase font-semibold text-neutral-400 block">
                                                                        Total Stones Loaded
                                                                      </span>
                                                                      <p className="text-lg font-black text-white font-mono mt-1">
                                                                        {totals.totalPieces.toLocaleString('en-IN')} <span className="text-xs font-normal text-neutral-500">pcs</span>
                                                                      </p>
                                                                      <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                                                                        {totals.totalSqft.toLocaleString('en-IN')} SQFT
                                                                      </p>
                                                                    </div>

                                                                    <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
                                                                      <span className="text-[10px] uppercase font-bold text-amber-300 block">
                                                                        Ramapuram Sourcing Cost
                                                                      </span>
                                                                      <p className="text-lg font-black text-amber-300 font-mono mt-1">
                                                                        {formatINR(totals.totalRamapuramStoneCost)}
                                                                      </p>
                                                                      <p className="text-[10px] text-amber-300/80 mt-0.5 font-medium">
                                                                        At Ramapuram Quarry Rates
                                                                      </p>
                                                                    </div>

                                                                    <div className="rounded-xl border border-ink-800 bg-ink-900/50 p-3">
                                                                      <span className="text-[10px] uppercase font-semibold text-neutral-400 block">
                                                                        Total Hamali (Labour)
                                                                      </span>
                                                                      <p className="text-lg font-black text-amber-300 font-mono mt-1">
                                                                        {formatINR(totals.totalHamali)}
                                                                      </p>
                                                                      <p className="text-[10px] text-neutral-400 mt-0.5">
                                                                        Coolie loading wages
                                                                      </p>
                                                                    </div>

                                                                    <div className="rounded-xl border border-ink-800 bg-ink-900/50 p-3">
                                                                      <span className="text-[10px] uppercase font-semibold text-neutral-400 block">
                                                                        Total Mamullu (Tips)
                                                                      </span>
                                                                      <p className="text-lg font-black text-amber-400 font-mono mt-1">
                                                                        {formatINR(totals.totalMamullu)}
                                                                      </p>
                                                                      <p className="text-[10px] text-neutral-400 mt-0.5">
                                                                        Quarry crew tips
                                                                      </p>
                                                                    </div>

                                                                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                                                                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                                                                        Kerala Selling Revenue
                                                                      </span>
                                                                      <p className="text-lg font-black text-emerald-400 font-mono mt-1">
                                                                        {formatINR(totals.totalEstimatedRevenue)}
                                                                      </p>
                                                                      <p className="text-[10px] text-emerald-400/80 mt-0.5 font-mono">
                                                                        {currentBuyer?.district || 'Kerala'} rates
                                                                      </p>
                                                                    </div>

                                                                    <div className="rounded-xl border border-gold/40 bg-gold/15 p-3 shadow-inner">
                                                                      <span className="text-[10px] uppercase font-black text-gold block flex items-center justify-between">
                                                                        <span>Est. Gross Profit</span>
                                                                        <span className="text-[9px] bg-gold/30 px-1 py-0.5 rounded font-mono text-white">+{totals.grossMarginPercentage}%</span>
                                                                      </span>
                                                                      <p className={`text-lg font-black font-mono mt-1 ${totals.estimatedGrossProfit >= 0 ? 'text-gold' : 'text-red-400'}`}>
                                                                        {formatINR(totals.estimatedGrossProfit)}
                                                                      </p>
                                                                      <p className="text-[10px] text-gold/80 mt-0.5 font-semibold">
                                                                        Net after Ramapuram &amp; labour
                                                                      </p>
                                                                    </div>
                                                                  </div>

                                                                  {/* Action Buttons Bar */}
                                                                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink-800 pt-5">
                                                                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                                                                      <InfoIcon className="h-4 w-4 text-gold shrink-0" />
                                                                      <span>
                                                                        Clicking <strong>Save &amp; Dispatch Fleet</strong> dispatches this lorry and automatically switches to the next incoming lorry in queue.
                                                                      </span>
                                                                    </div>

                                                                    <div className="flex flex-wrap items-center gap-3">
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => handleSaveDetails(false)}
                                                                        disabled={saveLoading}
                                                                        className="inline-flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-800 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-ink-700 hover:border-gold/50 shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                                                                      >
                                                                        {saveLoading ? <RefreshCwIcon className="h-4 w-4 animate-spin text-gold" /> : <CheckIcon className="h-4 w-4 text-gold" />}
                                                                        Save Loading Details (Draft)
                                                                      </button>

                                                                      <button
                                                                        type="button"
                                                                        onClick={() => handleSaveDetails(true)}
                                                                        disabled={saveLoading}
                                                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold via-gold-400 to-amber-500 px-6 py-2.5 text-xs font-black text-ink-950 shadow-lg shadow-gold/20 transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                                                                      >
                                                                        <SendIcon className="h-4 w-4" />
                                                                        Save &amp; Dispatch Fleet (Next Incoming Lorry →)
                                                                      </button>
                                                                    </div>
                                                                  </div>
                                                                </Card>
                                                              </>
                                                            ) : (
                                                              /* Dispatched & In-Transit Fleets Live Monitor (when queue is clear or no trip is selected) */
                                                              <div className="space-y-6">
                                                                <div className="flex items-center justify-between">
                                                                  <div>
                                                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                                                      <TruckIcon className="h-5 w-5 text-gold" />
                                                                      Active Fleets Dispatched from Ramapuram ({inTransitTrips.length})
                                                                    </h3>
                                                                    <p className="text-xs text-neutral-400">
                                                                      Lorries currently on road delivering stones to Kerala buyers.
                                                                    </p>
                                                                  </div>

                                                                  <Link
                                                                    to="/orders"
                                                                    className="inline-flex items-center gap-2 rounded-lg bg-gold/15 border border-gold/40 px-3.5 py-1.5 text-xs font-bold text-gold hover:bg-gold/25 transition-colors"
                                                                  >
                                                                    <PlusIcon className="h-4 w-4" />
                                                                    Assign New Incoming Fleet
                                                                  </Link>
                                                                </div>

                                                                {inTransitTrips.length === 0 ? (
                                                                  <Card className="p-8 text-center text-neutral-500 text-xs">
                                                                    No active fleets currently in transit.
                                                                  </Card>
                                                                ) : (
                                                                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                                    {inTransitTrips.map((t) => {
                                                                      const l = lorries.find((lorry) => lorry.id === t.lorryId || lorry.plate === t.lorryId);
                                                                      const d = drivers.find((driver) => driver.id === t.driverId);
                                                                      const b = unloadingParties.find((party) => party.id === t.unloadingPartyId);
                                                                      const totalPcs = (t.stoneLines || []).reduce((s, sl) => s + (sl.pieces || 0), 0);
                                                                      const totalSqft = (t.stoneLines || []).reduce((s, sl) => s + (sl.pieces || 0) * (sl.sqftPerPiece || 4), 0);

                                                                      return (
                                                                        <Card key={t.id} className="p-4 hover:border-gold/40 transition-colors">
                                                                          <div className="flex items-center justify-between border-b border-ink-800 pb-2.5 mb-3">
                                                                            <div className="flex items-center gap-2">
                                                                              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                                                                              <span className="text-xs font-bold text-white tracking-wide">
                                                                                {l?.plate || t.lorryId}
                                                                              </span>
                                                                            </div>
                                                                            <TripStatusBadge status={t.status} />
                                                                          </div>

                                                                          <div className="space-y-1.5 text-xs">
                                                                            <div className="flex justify-between text-neutral-400">
                                                                              <span>Driver:</span>
                                                                              <strong className="text-white">{d?.name || 'Driver'}</strong>
                                                                            </div>
                                                                            <div className="flex justify-between text-neutral-400">
                                                                              <span>Destination:</span>
                                                                              <strong className="text-emerald-400">{b?.name || 'Buyer'} ({b?.district || 'Kerala'})</strong>
                                                                            </div>
                                                                            <div className="flex justify-between text-neutral-400">
                                                                              <span>Loaded Volume:</span>
                                                                              <strong className="text-gold font-mono">{totalPcs} stones ({totalSqft.toLocaleString('en-IN')} sqft)</strong>
                                                                            </div>
                                                                          </div>

                                                                          <div className="mt-4 pt-3 border-t border-ink-800/80 flex items-center justify-between">
                                                                            <span className="text-[10px] text-neutral-500 font-mono">
                                                                              Trip: {t.code}
                                                                            </span>
                                                                            <Link
                                                                              to={`/trips/${t.id}`}
                                                                              className="text-xs font-bold text-gold hover:underline flex items-center gap-1"
                                                                            >
                                                                              View Trip →
                                                                            </Link>
                                                                          </div>
                                                                        </Card>
                                                                      );
                                                                    })}
                                                                  </div>
                                                                )}
                                                              </div>
                                                            )}
                                                          </div>

                                                          {/* Add Quarry Modal */}
                                                          <LoadingPartyModal
                                                            isOpen={isPartyModalOpen}
                                                            onClose={() => setIsPartyModalOpen(false)}
                                                          />

                                                          {/* Printable Loading Slip / Challan Modal */}
                                                          {isChallanModalOpen && currentTrip && (
                                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                                                              <div className="w-full max-w-2xl rounded-2xl border border-ink-700 bg-ink-950 p-6 shadow-2xl text-white">
                                                                <div className="flex items-center justify-between border-b border-ink-800 pb-3">
                                                                  <div>
                                                                    <h3 className="text-base font-bold text-white">
                                                                      Transport Loading Challan / Pass
                                                                    </h3>
                                                                    <p className="text-xs text-neutral-400">
                                                                      Sri Sai Baba Transport &amp; Stone Logistics — Ramapuram Yard
                                                                    </p>
                                                                  </div>
                                                                  <button
                                                                    onClick={() => setIsChallanModalOpen(false)}
                                                                    className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white"
                                                                  >
                                                                    <XIcon className="h-5 w-5" />
                                                                  </button>
                                                                </div>

                                                                <div className="mt-4 space-y-4 text-xs font-mono">
                                                                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-ink-900/60 p-3 border border-ink-800">
                                                                    <div>
                                                                      <p className="text-neutral-500 uppercase text-[10px]">Trip Code / Date</p>
                                                                      <p className="font-bold text-white">{currentTrip.code} · {new Date().toLocaleDateString('en-GB')}</p>
                                                                    </div>
                                                                    <div>
                                                                      <p className="text-neutral-500 uppercase text-[10px]">Lorry Plate / Driver</p>
                                                                      <p className="font-bold text-gold">{currentLorry?.plate || currentTrip.lorryId} ({currentDriver?.name || 'Driver'})</p>
                                                                    </div>
                                                                    <div>
                                                                      <p className="text-neutral-500 uppercase text-[10px]">Destination Buyer</p>
                                                                      <p className="font-bold text-white">{currentBuyer?.name || 'Buyer'} ({currentBuyer?.district || 'Kerala'})</p>
                                                                    </div>
                                                                    <div>
                                                                      <p className="text-neutral-500 uppercase text-[10px]">Total Loaded Volume</p>
                                                                      <p className="font-bold text-emerald-400">{totals.totalPieces} Stones · {totals.totalSqft} SQFT</p>
                                                                    </div>
                                                                  </div>

                                                                  {/* Breakdown by Quarry */}
                                                                  <div className="space-y-2">
                                                                    <p className="font-bold text-neutral-300 uppercase text-[11px] font-sans">
                                                                      Sourced Quarries &amp; Stone Specifications (Ramapuram Cost):
                                                                    </p>
                                                                    {quarryStops.map((qs, i) => {
                                                                      const p = loadingParties.find((lp) => lp.id === qs.loadingPartyId);
                                                                      const qPcs = qs.stoneLines.reduce((s, l) => s + (Number(l.pieces) || 0), 0);
                                                                      const qSqft = qs.stoneLines.reduce((s, l) => s + (Number(l.pieces) || 0) * getSqftFromSize(l.size), 0);
                                                                      const qCost = qs.stoneLines.reduce((s, l) => s + (Number(l.pieces) || 0) * getSqftFromSize(l.size) * (Number(l.ratePerSqft) || 0), 0);
                                                                      return (
                                                                        <div key={qs.id} className="rounded border border-ink-800 bg-ink-900/40 p-2.5">
                                                                          <div className="flex justify-between font-bold text-gold border-b border-ink-800/60 pb-1 mb-1.5">
                                                                            <span>Quarry #{i + 1}: {p?.name || qs.loadingPartyId} ({p?.location || 'Ramapuram'})</span>
                                                                            <span>{qPcs} pcs · {qSqft} sqft · {formatINR(qCost)}</span>
                                                                          </div>
                                                                          <div className="space-y-1 text-neutral-300">
                                                                            {qs.stoneLines.map((line) => (
                                                                              <div key={line.id} className="flex justify-between text-[11px]">
                                                                                <span>• {line.size} · {line.thickness} · {line.finish} @ ₹{line.ratePerSqft}/sqft (Ramapuram)</span>
                                                                                <span>{line.pieces} pcs × {getSqftFromSize(line.size)} sqft = {(line.pieces * getSqftFromSize(line.size)).toLocaleString('en-IN')} sqft</span>
                                                                              </div>
                                                                            ))}
                                                                          </div>
                                                                          <div className="mt-2 pt-1 border-t border-ink-800/40 flex justify-between text-[10px] text-amber-300">
                                                                            <span>Hamali: {formatINR(qs.hamaliAmount)} ({qs.hamaliNote})</span>
                                                                            <span>Mamullu: {formatINR(qs.mamulluAmount)}</span>
                                                                          </div>
                                                                        </div>
                                                                      );
                                                                    })}
                                                                  </div>

                                                                  {/* Signatures */}
                                                                  <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[10px] text-neutral-400">
                                                                    <div className="border-t border-ink-700 pt-1">
                                                                      Quarry Supervisor Sign
                                                                    </div>
                                                                    <div className="border-t border-ink-700 pt-1">
                                                                      Hamali Gang Leader Sign
                                                                    </div>
                                                                    <div className="border-t border-ink-700 pt-1">
                                                                      Lorry Driver Sign
                                                                    </div>
                                                                  </div>
                                                                </div>

                                                                <div className="mt-6 flex justify-end gap-3 border-t border-ink-800 pt-4">
                                                                  <button
                                                                    onClick={() => setIsChallanModalOpen(false)}
                                                                    className="rounded-lg border border-ink-700 px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
                                                                  >
                                                                    Close
                                                                  </button>
                                                                  <button
                                                                    onClick={() => {
                                                                      window.print();
                                                                    }}
                                                                    className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-xs font-bold text-ink-950 hover:bg-gold-400"
                                                                  >
                                                                    <PrinterIcon className="h-4 w-4" />
                                                                    Print Challan
                                                                  </button>
                                                                </div>
                                                              </div>
                                                            </div>
                                                          )}
                                                      </div>
                                                      );
}
