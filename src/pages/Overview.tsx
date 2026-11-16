import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import {
  TruckIcon,
  CoinsIcon,
  WalletIcon,
  BarChart3Icon,
  FileTextIcon,
  WrenchIcon,
  FuelIcon,
  PauseCircleIcon,
  ArrowUpRightIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  MapPinIcon,
  Building2Icon,
  ShieldCheckIcon
} from 'lucide-react';
import { dashboardApi, lorriesApi, type OwnerDashboardData, type LorryStatsData } from '../api/index';
import { formatINR } from '../utils/helpers';
import { useOrders } from '../store/OrdersContext';
import { useSocket } from '../hooks/useSocket';
import { FleetShowcaseCarousel } from '../components/dashboard/FleetShowcaseCarousel';
import { type ShowcaseFleetItem } from '../data/fleetShowcase';
import { KeralaDeliveryAuditModal } from '../components/ui/KeralaDeliveryAuditModal';
import type { Trip } from '../data/types';

export function Overview() {
  const { trips, lorries, drivers, districtRates, unloadingParties, loadingParties, syncDatabase } = useOrders();
  const [timePeriod, setTimePeriod] = useState<'This Month' | 'Today' | 'This Week' | 'This Quarter' | 'This Year' | 'All Time'>('All Time');
  const [auditingTrip, setAuditingTrip] = useState<Trip | null>(null);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<OwnerDashboardData | null>(null);

  // Selected vehicle in the fleet carousel & its real-time telemetry
  const [selectedLorry, setSelectedLorry] = useState<ShowcaseFleetItem | null>(null);
  const [selectedLorryStats, setSelectedLorryStats] = useState<LorryStatsData | null>(null);
  const [fleetScope, setFleetScope] = useState<'vehicle' | 'all'>('vehicle');
  const [isFetchingStats, setIsFetchingStats] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await dashboardApi.getOwner();
      if (res && res.data) {
        setDashboardData(res.data);
      }
    } catch {
      // Graceful fallback to real store calculations
    }
    await syncDatabase();
  }, [syncDatabase]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // WebSocket live updates
  useSocket({
    onOrderCreated: () => fetchDashboard(),
    onTripDispatched: () => fetchDashboard(),
    onTripUpdated: () => fetchDashboard(),
    onOrderStatus: () => fetchDashboard()
  });

  // When selected vehicle in the carousel changes, query backend lorry stats API
  useEffect(() => {
    if (!selectedLorry) return;
    const plate = selectedLorry.plate || (selectedLorry as any).id;
    if (!plate) return;

    let isMounted = true;
    setIsFetchingStats(true);

    lorriesApi
      .getStats(plate)
      .then((res: any) => {
        const stats = res?.data || res;
        if (isMounted && stats) {
          setSelectedLorryStats(stats);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch lorry stats from backend API:', err);
      })
      .finally(() => {
        if (isMounted) setIsFetchingStats(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedLorry?.plate]);

  // Filter trips by selected time period
  const filteredTrips = useMemo(() => {
    if (timePeriod === 'All Time') return trips;
    const now = new Date();

    return trips.filter((t) => {
      const dateStr = t.date;
      if (!dateStr) return true;
      const tripDate = new Date(dateStr);
      if (isNaN(tripDate.getTime())) return true;

      if (timePeriod === 'Today') {
        return (
          tripDate.getDate() === now.getDate() &&
          tripDate.getMonth() === now.getMonth() &&
          tripDate.getFullYear() === now.getFullYear()
        );
      }
      if (timePeriod === 'This Week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return tripDate >= startOfWeek;
      }
      if (timePeriod === 'This Month') {
        return (
          tripDate.getMonth() === now.getMonth() &&
          tripDate.getFullYear() === now.getFullYear()
        );
      }
      if (timePeriod === 'This Quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const tripQuarter = Math.floor(tripDate.getMonth() / 3);
        return tripQuarter === currentQuarter && tripDate.getFullYear() === now.getFullYear();
      }
      if (timePeriod === 'This Year') {
        return tripDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [trips, timePeriod]);

  // Real-time trips specifically for the selected vehicle
  const vehicleTrips = useMemo(() => {
    if (!selectedLorry) return filteredTrips;
    const cleanSelected = (selectedLorry.plate || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const matchedLorry = lorries.find(
      (l) => (l.plate || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanSelected
    );
    const matchedId = matchedLorry?.id;

    return filteredTrips.filter((t) => {
      const cleanTLorry = (t.lorryId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return (
        (matchedId && t.lorryId === matchedId) ||
        (selectedLorry.id && t.lorryId === selectedLorry.id) ||
        cleanTLorry === cleanSelected ||
        t.lorryId === selectedLorry.plate
      );
    });
  }, [filteredTrips, selectedLorry, lorries]);

  // Overall financial & operational statistics
  const stats = useMemo(() => {
    let revenue = 0;
    let expenses = 0;

    filteredTrips.forEach((t) => {
      const buyer = unloadingParties.find((up) => up.id === t.unloadingPartyId);
      const buyerDistrict = buyer?.district;
      const rev =
        t.stoneLines && t.stoneLines.length > 0
          ? t.stoneLines.reduce((sum, l) => {
            const matchRate = districtRates.find(
              (r) =>
                r.district === buyerDistrict &&
                r.size === l.size &&
                r.thickness === l.thickness &&
                r.finish === l.finish
            );
            const rate = matchRate ? matchRate.ratePerSqft : l.ratePerSqft;
            return sum + (l.sqftPerPiece || 0) * (l.pieces || 0) * (rate || 0);
          }, 0)
          : (t.amountPaid || (t.partyToDriverCash || 0) + (t.partyToOwnerPhonePe || 0) || 0);

      const expLines = (t.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const workerPay = (t.workerPayments || []).reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
      const driverWage = Number((t as any).driverWage) || 0;

      revenue += rev;
      expenses += expLines + workerPay + driverWage;
    });

    if (revenue === 0 && expenses === 0 && dashboardData?.summary) {
      revenue = dashboardData.summary.totalRevenue || 0;
      expenses = dashboardData.summary.totalExpenses || 0;
    }

    const profit = revenue - expenses;

    return {
      revenue,
      expenses,
      profit,
      totalTrips: filteredTrips.length || (dashboardData?.summary?.totalTrips ?? trips.length)
    };
  }, [filteredTrips, unloadingParties, districtRates, dashboardData, trips.length]);

  // Live Fleet Status Counts
  const activeLorriesList = useMemo(() => {
    return lorries.filter((l) => l.status !== 'sold');
  }, [lorries]);

  const totalLorriesCount = activeLorriesList.length || (dashboardData?.summary?.activeLorries ?? 2);

  const onTripCount = useMemo(() => {
    return activeLorriesList.filter(
      (l) =>
        l.status === 'active' ||
        (l.status as string) === 'on_trip' ||
        trips.some(
          (t) =>
            t.lorryId === l.id &&
            (t.status === 'in-transit' || t.status === 'loading' || (t.status as string) === 'dispatched')
        )
    ).length;
  }, [activeLorriesList, trips]);

  const idleCount = useMemo(() => {
    return activeLorriesList.filter((l) => l.status === 'idle').length;
  }, [activeLorriesList]);

  const maintenanceCount = useMemo(() => {
    return activeLorriesList.filter((l) => l.status === 'maintenance').length;
  }, [activeLorriesList]);

  const availableCount = useMemo(() => {
    const assigned = onTripCount + idleCount + maintenanceCount;
    return Math.max(0, totalLorriesCount - assigned);
  }, [totalLorriesCount, onTripCount, idleCount, maintenanceCount]);

  // Overall fuel usage across all trips (detecting fuel, diesel, diseal)
  const fuelMetrics = useMemo(() => {
    let totalFuelAmount = 0;
    filteredTrips.forEach((t) => {
      (t.expenses || []).forEach((e) => {
        const lbl = (e.label || '').toLowerCase();
        const cat = e.category || '';
        if (
          cat === 'fuel' ||
          lbl.includes('fuel') ||
          lbl.includes('diesel') ||
          lbl.includes('diseal') ||
          lbl.includes('disel') ||
          lbl.includes('deisel') ||
          lbl.includes('petrol')
        ) {
          totalFuelAmount += Number(e.amount) || 0;
        }
      });
    });
    const estLiters = totalFuelAmount > 0 ? Math.round(totalFuelAmount / 95) : 0;
    return {
      amount: totalFuelAmount,
      liters: estLiters
    };
  }, [filteredTrips]);

  // Vehicle-specific Revenue
  const vehicleRevenue = useMemo(() => {
    if (selectedLorryStats?.summary?.totalRevenue && timePeriod === 'All Time') {
      return selectedLorryStats.summary.totalRevenue;
    }
    return vehicleTrips.reduce((total, t) => {
      const buyer = unloadingParties.find((up) => up.id === t.unloadingPartyId);
      const buyerDistrict = buyer?.district;
      const rev =
        t.stoneLines && t.stoneLines.length > 0
          ? t.stoneLines.reduce((sum, l) => {
            const matchRate = districtRates.find(
              (r) =>
                r.district === buyerDistrict &&
                r.size === l.size &&
                r.thickness === l.thickness &&
                r.finish === l.finish
            );
            const rate = matchRate ? matchRate.ratePerSqft : l.ratePerSqft;
            return sum + (l.sqftPerPiece || 0) * (l.pieces || 0) * (rate || 0);
          }, 0)
          : (t.amountPaid || (t.partyToDriverCash || 0) + (t.partyToOwnerPhonePe || 0) || 0);
      return total + rev;
    }, 0);
  }, [vehicleTrips, unloadingParties, districtRates, selectedLorryStats, timePeriod]);

  // Active in-progress trip for selected vehicle (if any)
  const selectedVehicleActiveTrip = useMemo(() => {
    if (!selectedLorry) return null;
    const cleanPlate = (selectedLorry.plate || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const matchedLorry = lorries.find(
      (l) => (l.plate || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanPlate
    );
    const lorryId = matchedLorry?.id || selectedLorry.id;

    const activeStages = [
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
    ];

    return (
      trips.find(
        (t) =>
          (t.lorryId === lorryId || t.lorryId === selectedLorry.plate) &&
          activeStages.includes(t.status as string)
      ) || null
    );
  }, [selectedLorry, lorries, trips]);

  // Vehicle-specific Running Expenses Breakdown (shows only current active trip expenses, or 0 if trip ended/idle)
  const vehicleExpensesList = useMemo(() => {
    let fuel = 0;
    let driverWages = 0;
    let toll = 0;
    let quarryHamali = 0;
    let maintenance = 0;
    let other = 0;

    // Only compute running expenses if there is an active trip currently in progress
    if (selectedVehicleActiveTrip) {
      const t = selectedVehicleActiveTrip;
      const workerPay = (t.workerPayments || []).reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
      const tripWage = Number((t as any).driverWage) || 0;
      driverWages += tripWage;

      // Add driver paid loading quarry stone payments
      (t.loadingPartyPayments || []).forEach((lp) => {
        if (lp.paidBy === 'driver' && Number(lp.amountPaid) > 0) {
          quarryHamali += Number(lp.amountPaid);
        }
      });

      // Add driver paid worker hamali payments
      (t.workerPayments || []).forEach((wp: any) => {
        if (wp.paidBy === 'driver' && Number(wp.amount) > 0) {
          quarryHamali += Number(wp.amount);
        }
      });

      (t.expenses || []).forEach((e) => {
        const amt = Number(e.amount) || 0;
        const cat = e.category || '';
        const lbl = (e.label || '').toLowerCase();
        if (
          cat === 'fuel' ||
          lbl.includes('fuel') ||
          lbl.includes('diesel') ||
          lbl.includes('diseal') ||
          lbl.includes('disel') ||
          lbl.includes('deisel') ||
          lbl.includes('petrol')
        ) {
          fuel += amt;
        } else if (cat === 'toll' || lbl.includes('toll') || lbl.includes('fastag')) {
          toll += amt;
        } else if (cat === 'quarry_payment' || lbl.includes('quarry') || lbl.includes('stone payment')) {
          quarryHamali += amt;
        } else if (cat === 'hamali' || lbl.includes('hamali') || lbl.includes('labor') || lbl.includes('coolie') || lbl.includes('mamullu')) {
          quarryHamali += amt;
        } else if (cat === 'maintenance' || lbl.includes('repair') || lbl.includes('tyre') || lbl.includes('service') || lbl.includes('grease')) {
          maintenance += amt;
        } else if (cat === 'driver' || cat === 'bata_food' || lbl.includes('driver') || lbl.includes('bata')) {
          driverWages += amt;
        } else {
          other += amt;
        }
      });
    }

    return [
      { label: 'Fuel / Diesel', amount: fuel, color: 'text-amber-400', bg: 'bg-amber-500/15', icon: FuelIcon },
      { label: 'Driver Bata', amount: driverWages, color: 'text-blue-400', bg: 'bg-blue-500/15', icon: CoinsIcon },
      { label: 'Tolls & Fastag', amount: toll, color: 'text-purple-400', bg: 'bg-purple-500/15', icon: MapPinIcon },
      { label: 'Quarry & Hamali', amount: quarryHamali, color: 'text-amber-300', bg: 'bg-amber-400/20', icon: Building2Icon },
      { label: 'Maintenance', amount: maintenance, color: 'text-cyan-400', bg: 'bg-cyan-500/15', icon: WrenchIcon },
      { label: 'Other', amount: other, color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: WalletIcon }
    ];
  }, [selectedVehicleActiveTrip]);

  const vehicleFuelAmount = useMemo(() => {
    const item = vehicleExpensesList.find((e) => e.label.includes('Fuel'));
    return item?.amount || 0;
  }, [vehicleExpensesList]);

  const vehicleFuelLiters = useMemo(() => {
    const amt = vehicleFuelAmount;
    return amt > 0 ? Math.round(amt / 95) : 0;
  }, [vehicleFuelAmount]);

  const totalVehicleExpenses = useMemo(() => {
    return vehicleExpensesList.reduce((sum, item) => sum + item.amount, 0);
  }, [vehicleExpensesList]);

  // Donut chart dataset from live fleet data (All Fleet)
  const fleetPieData = useMemo(() => {
    const total = totalLorriesCount > 0 ? totalLorriesCount : 1;
    const pOnTrip = Math.round((onTripCount / total) * 100);
    const pIdle = Math.round((idleCount / total) * 100);
    const pMaint = Math.round((maintenanceCount / total) * 100);
    const pAvail = Math.max(0, 100 - (pOnTrip + pIdle + pMaint));

    return [
      { name: 'On Trip', value: onTripCount, percentage: `${pOnTrip}%`, color: '#10b981' },
      { name: 'Idle', value: idleCount, percentage: `${pIdle}%`, color: '#06b6d4' },
      { name: 'Maintenance', value: maintenanceCount, percentage: `${pMaint}%`, color: '#f59e0b' },
      { name: 'Available', value: availableCount, percentage: `${pAvail}%`, color: '#6366f1' }
    ];
  }, [totalLorriesCount, onTripCount, idleCount, maintenanceCount, availableCount]);

  // Dynamic Pie data reflecting selected vehicle or all fleet
  const displayPieData = useMemo(() => {
    if (fleetScope === 'all') {
      return fleetPieData;
    }
    const totalVTrips = vehicleTrips.length || selectedLorryStats?.summary?.totalTrips || 0;
    if (totalVTrips === 0) {
      const isTrip = selectedLorry?.status === 'active' || selectedLorry?.statusLabel === 'On Trip';
      const isIdle = selectedLorry?.status === 'idle' || selectedLorry?.statusLabel === 'Idle';
      return [
        { name: 'On Trip', value: isTrip ? 1 : 0, percentage: isTrip ? '100%' : '0%', color: '#10b981' },
        { name: 'Idle', value: isIdle ? 1 : 0, percentage: isIdle ? '100%' : '0%', color: '#06b6d4' },
        { name: 'Delivered', value: 0, percentage: '0%', color: '#3b82f6' },
        { name: 'Loading', value: 0, percentage: '0%', color: '#f59e0b' }
      ];
    }

    const deliveredCount = vehicleTrips.filter((t) => t.status === 'delivered' || t.status === 'paid').length;
    const onTripVCount = vehicleTrips.filter((t) => t.status === 'in-transit' || (t.status as string) === 'dispatched').length;
    const loadingCount = vehicleTrips.filter((t) => t.status === 'loading').length;
    const otherCount = Math.max(0, totalVTrips - (deliveredCount + onTripVCount + loadingCount));

    const pDelivered = Math.round((deliveredCount / totalVTrips) * 100);
    const pOnTrip = Math.round((onTripVCount / totalVTrips) * 100);
    const pLoading = Math.round((loadingCount / totalVTrips) * 100);
    const pOther = Math.max(0, 100 - (pDelivered + pOnTrip + pLoading));

    return [
      { name: 'Delivered', value: deliveredCount, percentage: `${pDelivered}%`, color: '#10b981' },
      { name: 'On Trip', value: onTripVCount, percentage: `${pOnTrip}%`, color: '#06b6d4' },
      { name: 'Loading', value: loadingCount, percentage: `${pLoading}%`, color: '#f59e0b' },
      { name: 'Scheduled', value: otherCount, percentage: `${pOther}%`, color: '#6366f1' }
    ];
  }, [fleetScope, fleetPieData, vehicleTrips, selectedLorryStats, selectedLorry]);

  const resolveTripDisplay = (t: Trip) => {
    switch (t.status) {
      case 'loading':
        return { label: 'Loading Quarry', color: '#f59e0b', bgClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'loaded':
        return { label: 'Quarry Loaded', color: '#f59e0b', bgClass: 'bg-amber-500/20 text-amber-200 border-amber-500/40' };
      case 'in-transit':
        return { label: 'In Transit (Kerala)', color: '#3b82f6', bgClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30' };
      case 'arrived_kerala':
        return { label: 'Arrived at Kerala', color: '#a855f7', bgClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
      case 'stone_unloading':
        return { label: 'Stone Unloading', color: '#06b6d4', bgClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
      case 'stone_unloaded':
        return { label: 'Stone Unloaded', color: '#14b8a6', bgClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };
      case 'return_decision_pending':
        return { label: 'Return Plan Pending', color: '#f59e0b', bgClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'return_sand_loading':
        return { label: 'Return Sand Loading', color: '#f97316', bgClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30' };
      case 'return_loaded':
        return { label: 'Return Sand Loaded', color: '#f97316', bgClass: 'bg-orange-500/20 text-orange-200 border-orange-500/40' };
      case 'returning':
        return { label: 'Returning (Transit)', color: '#6366f1', bgClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' };
      case 'arrived_lt_factory':
        return { label: 'Arrived L&T Factory', color: '#a855f7', bgClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
      case 'sand_unloaded':
        return { label: 'Sand Unloaded (L&T)', color: '#10b981', bgClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
      case 'direct_return':
        return { label: 'Direct Return (Base)', color: '#3b82f6', bgClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30' };
      case 'returned_to_base':
        return { label: 'Returned to Base', color: '#10b981', bgClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40' };
      case 'final_audit_pending':
        return { label: 'Final Audit Pending', color: '#F5B82E', bgClass: 'bg-gold/15 text-gold border-gold/40' };
      case 'completed':
        return { label: 'Trip Completed', color: '#10b981', bgClass: 'bg-green-500/20 text-green-300 border-green-500/40' };
      case 'delivered':
        return { label: 'Delivered', color: '#F5B82E', bgClass: 'bg-gold/15 text-gold border-gold/30' };
      case 'paid':
        return { label: 'Paid & Closed', color: '#10b981', bgClass: 'bg-green-500/15 text-green-300 border-green-500/30' };
      default:
        return { label: 'On Trip', color: '#10b981', bgClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    }
  };

  // Recent Trips computed dynamically
  const recentTripsList = useMemo(() => {
    const sorted = [...trips].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    }).slice(0, 5);

    return sorted.map((t) => {
      const lorry = lorries.find((l) => l.id === t.lorryId);
      const driver = drivers.find((d) => d.id === t.driverId);
      const buyer = unloadingParties.find((up) => up.id === t.unloadingPartyId);
      const quarry = loadingParties.find((lp) => lp.id === (t.stoneLines?.[0]?.loadingPartyId || ''));

      const origin = quarry?.name || quarry?.location || t.origin || 'Ramapuram';
      const destination = buyer?.name || buyer?.district || 'Kerala';
      const route = `${origin} → ${destination}`;

      const disp = resolveTripDisplay(t);

      return {
        id: t.id,
        plate: lorry?.plate || t.code,
        driver: driver?.name || 'Assigned Driver',
        route,
        status: disp.label,
        statusColor: disp.color,
        bgClass: disp.bgClass
      };
    });
  }, [trips, lorries, drivers, unloadingParties, loadingParties]);

  // Dynamic Recent Trips for selected vehicle
  const displayTripsList = useMemo(() => {
    if (fleetScope === 'all') {
      return recentTripsList;
    }
    const sorted = [...vehicleTrips].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    }).slice(0, 5);

    if (sorted.length === 0 && selectedLorryStats?.recentTrips && selectedLorryStats.recentTrips.length > 0) {
      return selectedLorryStats.recentTrips.map((st) => {
        const buyer = unloadingParties.find((up) => up.id === st.unloadingPartyId);
        const destination = buyer?.name || buyer?.district || 'Kerala';
        const route = `${st.origin || 'Ramapuram'} → ${destination}`;
        const disp = resolveTripDisplay(st as Trip);

        return {
          id: st.id,
          plate: selectedLorry?.plate || st.code,
          driver: selectedLorry?.driver || 'Assigned Driver',
          route,
          status: disp.label,
          statusColor: disp.color,
          bgClass: disp.bgClass
        };
      });
    }

    return sorted.map((t) => {
      const lorry = lorries.find((l) => l.id === t.lorryId) || selectedLorry;
      const driver = drivers.find((d) => d.id === t.driverId);
      const buyer = unloadingParties.find((up) => up.id === t.unloadingPartyId);
      const quarry = loadingParties.find((lp) => lp.id === (t.stoneLines?.[0]?.loadingPartyId || ''));

      const origin = quarry?.name || quarry?.location || t.origin || 'Ramapuram';
      const destination = buyer?.name || buyer?.district || 'Kerala';
      const route = `${origin} → ${destination}`;
      const disp = resolveTripDisplay(t);

      return {
        id: t.id,
        plate: lorry?.plate || t.code,
        driver: driver?.name || 'Assigned Driver',
        route,
        status: disp.label,
        statusColor: disp.color,
        bgClass: disp.bgClass
      };
    });
  }, [fleetScope, recentTripsList, vehicleTrips, selectedLorryStats, selectedLorry, lorries, drivers, unloadingParties, loadingParties]);

  // Trip expenses dynamically grouped by category (All Fleet)
  const tripExpensesList = useMemo(() => {
    let fuel = 0;
    let driverWages = 0;
    let toll = 0;
    let quarryHamali = 0;
    let maintenance = 0;
    let other = 0;

    filteredTrips.forEach((t) => {
      // Driver wages & worker payments
      const workerPay = (t.workerPayments || []).reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
      const tripWage = Number((t as any).driverWage) || 0;
      driverWages += tripWage;

      // Add driver paid loading quarry stone payments
      (t.loadingPartyPayments || []).forEach((lp) => {
        if (lp.paidBy === 'driver' && Number(lp.amountPaid) > 0) {
          quarryHamali += Number(lp.amountPaid);
        }
      });

      // Add driver paid worker hamali payments
      (t.workerPayments || []).forEach((wp: any) => {
        if (wp.paidBy === 'driver' && Number(wp.amount) > 0) {
          quarryHamali += Number(wp.amount);
        }
      });

      (t.expenses || []).forEach((e) => {
        const amt = Number(e.amount) || 0;
        const cat = e.category || '';
        const lbl = (e.label || '').toLowerCase();

        if (
          cat === 'fuel' ||
          lbl.includes('fuel') ||
          lbl.includes('diesel') ||
          lbl.includes('diseal') ||
          lbl.includes('disel') ||
          lbl.includes('deisel') ||
          lbl.includes('petrol')
        ) {
          fuel += amt;
        } else if (cat === 'toll' || lbl.includes('toll') || lbl.includes('fastag')) {
          toll += amt;
        } else if (cat === 'quarry_payment' || lbl.includes('quarry') || lbl.includes('stone payment')) {
          quarryHamali += amt;
        } else if (cat === 'hamali' || lbl.includes('hamali') || lbl.includes('labor') || lbl.includes('coolie') || lbl.includes('mamullu')) {
          quarryHamali += amt;
        } else if (cat === 'maintenance' || lbl.includes('repair') || lbl.includes('tyre') || lbl.includes('service') || lbl.includes('grease')) {
          maintenance += amt;
        } else if (cat === 'driver' || cat === 'bata_food' || lbl.includes('driver') || lbl.includes('bata')) {
          driverWages += amt;
        } else {
          other += amt;
        }
      });
    });

    return [
      { label: 'Fuel / Diesel', amount: fuel, color: 'text-amber-400', bg: 'bg-amber-500/15', icon: FuelIcon },
      { label: 'Driver Bata', amount: driverWages, color: 'text-blue-400', bg: 'bg-blue-500/15', icon: CoinsIcon },
      { label: 'Tolls & Fastag', amount: toll, color: 'text-purple-400', bg: 'bg-purple-500/15', icon: MapPinIcon },
      { label: 'Quarry & Hamali', amount: quarryHamali, color: 'text-amber-300', bg: 'bg-amber-400/20', icon: Building2Icon },
      { label: 'Maintenance', amount: maintenance, color: 'text-cyan-400', bg: 'bg-cyan-500/15', icon: WrenchIcon },
      { label: 'Other', amount: other, color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: WalletIcon }
    ];
  }, [filteredTrips]);

  const totalTripExpenses = useMemo(() => {
    return tripExpensesList.reduce((sum, item) => sum + item.amount, 0);
  }, [tripExpensesList]);

  // Dynamically select expenses and total for active scope
  const displayExpensesList = useMemo(() => {
    return fleetScope === 'vehicle' ? vehicleExpensesList : tripExpensesList;
  }, [fleetScope, vehicleExpensesList, tripExpensesList]);

  const displayTotalExpenses = useMemo(() => {
    return fleetScope === 'vehicle' ? totalVehicleExpenses : totalTripExpenses;
  }, [fleetScope, totalVehicleExpenses, totalTripExpenses]);

  // Unloading Details mapped for the dedicated Unloading Operations Module
  const unloadingDetailsList = useMemo(() => {
    const sourceTrips = fleetScope === 'vehicle' ? vehicleTrips : filteredTrips;
    return sourceTrips
      .filter((t: any) => t.unloadingPartyId || (t.stops && t.stops.length > 0))
      .map((t: any) => {
        const lorry = lorries.find((l) => l.id === t.lorryId) || (selectedLorry?.plate === t.lorryId ? selectedLorry : null);
        const driver = drivers.find((d) => d.id === t.driverId);
        const buyer = unloadingParties.find((up) => up.id === t.unloadingPartyId);
        const stop = t.stops?.[0];

        const partyName = stop?.buyerName || buyer?.name || t.unloadingPartyId || 'Buyer Party';
        const district = stop?.district || buyer?.district || 'Palakkad, Kerala';
        const phone = stop?.buyerPhone || (buyer as any)?.phone || '';

        const totalPieces =
          stop?.totalPieces ||
          (t.stoneLines || []).reduce((sum: number, l: any) => sum + (Number(l.pieces) || 0), 0);
        const totalSqft =
          stop?.totalSqft ||
          (t.stoneLines || []).reduce(
            (sum: number, l: any) => sum + (Number(l.sqftPerPiece) || 0) * (Number(l.pieces) || 0),
            0
          );

        const summaryText =
          stop?.stoneSummary ||
          (t.stoneLines || []).map((l: any) => `${l.size} (${l.pieces} pcs)`).join(', ') ||
          'Stone consignment';

        let statusBadge = {
          label: 'Scheduled',
          color: '#06b6d4',
          bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
        };
        if (t.status === 'delivered') {
          statusBadge = {
            label: 'Delivered & Unloaded',
            color: '#10b981',
            bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          };
        } else if (t.status === 'in-transit' || (t.status as string) === 'dispatched') {
          statusBadge = {
            label: 'En Route — In Transit',
            color: '#3b82f6',
            bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
          };
        } else if (t.status === 'loading') {
          statusBadge = {
            label: 'Loading at Yard',
            color: '#f59e0b',
            bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          };
        }

        const totalPaid =
          t.amountPaid || (t.partyToDriverCash || 0) + (t.partyToOwnerPhonePe || 0);

        const loadedPcs = totalPieces;
        const damagedPcs = Number(t.damagedPieces || 0);
        const unloadedPcs = t.unloadedPieces !== undefined
          ? Number(t.unloadedPieces)
          : Math.max(0, loadedPcs - damagedPcs);

        const damageCut = Number(t.damageDeduction || 0);
        const shortageCut = Number(t.shortageDeduction || 0);
        const totalLess = damageCut + shortageCut;

        return {
          tripId: t.id,
          tripCode: t.code,
          date: t.date,
          lorryPlate: lorry?.plate || t.lorryId || 'Lorry',
          driverName: driver?.name || 'Assigned Driver',
          partyName,
          district: t.unloadingLocation || district,
          phone,
          totalPieces: loadedPcs,
          unloadedPieces: unloadedPcs,
          damagedPieces: damagedPcs,
          damageDeduction: damageCut,
          shortageDeduction: shortageCut,
          totalLessened: totalLess,
          totalSqft,
          summaryText,
          statusBadge,
          totalPaid,
          cashToDriver: Number(t.partyToDriverCash || 0),
          phonePeToOwner: Number(t.partyToOwnerPhonePe || 0),
          auditNote: t.auditNote,
          auditStatus: t.auditStatus || (t.status === 'delivered' ? 'audited' : 'pending_audit'),
          auditedAt: t.auditedAt
        };
      });
  }, [fleetScope, vehicleTrips, filteredTrips, lorries, drivers, unloadingParties, selectedLorry]);

  // Overall Kerala Delivery Audit KPIs
  const unloadingAuditKPIs = useMemo(() => {
    let totalCash = 0;
    let totalPhonePe = 0;
    let totalLessened = 0;
    let totalDamaged = 0;
    let totalUnloaded = 0;
    let totalLoaded = 0;

    unloadingDetailsList.forEach((item) => {
      totalCash += item.cashToDriver;
      totalPhonePe += item.phonePeToOwner;
      totalLessened += item.totalLessened;
      totalDamaged += item.damagedPieces;
      totalUnloaded += item.unloadedPieces;
      totalLoaded += item.totalPieces;
    });

    return {
      totalCash,
      totalPhonePe,
      totalLessened,
      totalDamaged,
      totalUnloaded,
      totalLoaded,
      count: unloadingDetailsList.length
    };
  }, [unloadingDetailsList]);

  return (
    <div className="min-h-full max-w-[1600px] mx-auto space-y-4 sm:space-y-5 px-4 py-3.5 sm:px-6 sm:py-5 lg:px-8">
      {/* 1. Sleek & Compact Command Center Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10B981]" />
          </span>
          <h1 className="text-xs sm:text-sm font-black uppercase tracking-[0.24em] bg-gradient-to-r from-white via-neutral-100 to-[#F5B82E] bg-clip-text text-transparent">
            COMMAND CENTER
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-emerald-400 backdrop-blur-md">
            LIVE OPS
          </span>
        </div>

        {/* Compact iPhone Frosted Glass Period Filter Pill */}
        <div className="relative z-30">
          <button
            onClick={() => setIsPeriodOpen(!isPeriodOpen)}
            className="flex items-center gap-2 rounded-full border border-white/[0.14] bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-semibold text-neutral-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_4px_16px_rgba(0,0,0,0.3)] backdrop-blur-2xl backdrop-saturate-150 transition-all hover:border-[#F5B82E]/50 hover:bg-white/[0.09] hover:text-white cursor-pointer active:scale-95"
          >
            <span className="text-[11px]">📅</span>
            <span>{timePeriod}</span>
            <ChevronDownIcon className="h-3 w-3 text-neutral-400" />
          </button>

          {isPeriodOpen && (
            <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-2xl border border-white/[0.15] bg-[#0A0F15]/90 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-2xl backdrop-saturate-150">
              {(['This Month', 'Today', 'This Week', 'This Quarter', 'This Year', 'All Time'] as const).map(
                (period) => (
                  <button
                    key={period}
                    onClick={() => {
                      setTimePeriod(period);
                      setIsPeriodOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      timePeriod === period
                        ? 'bg-[#F5B82E]/20 text-[#F5B82E] font-bold border border-[#F5B82E]/30'
                        : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{period}</span>
                    {timePeriod === period && <div className="h-1.5 w-1.5 rounded-full bg-[#F5B82E] shadow-[0_0_8px_#F5B82E]" />}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. iPhone Frosted Glass 4 KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {/* Total Revenue */}
        <motion.div
          whileHover={{ y: -2, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] p-3 sm:p-3.5 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_8px_24px_rgba(0,0,0,0.35)] hover:border-emerald-500/40 hover:bg-white/[0.07] transition-all"
        >
          {/* Ambient Backlight Glow */}
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/15 blur-2xl transition-all group-hover:bg-emerald-500/25" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] backdrop-blur-xl">
              <CoinsIcon className="h-5 w-5 drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 truncate">Revenue</p>
                <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-400 backdrop-blur-md shrink-0 shadow-sm">
                  <ArrowUpRightIcon className="h-2.5 w-2.5" />+12%
                </span>
              </div>
              <p className="font-mono text-sm sm:text-base font-black text-white truncate mt-0.5 tracking-tight">
                {formatINR(stats.revenue)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Total Expenses */}
        <motion.div
          whileHover={{ y: -2, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] p-3 sm:p-3.5 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_8px_24px_rgba(0,0,0,0.35)] hover:border-rose-500/40 hover:bg-white/[0.07] transition-all"
        >
          {/* Ambient Backlight Glow */}
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-500/15 blur-2xl transition-all group-hover:bg-rose-500/25" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-rose-400/25 bg-rose-500/10 text-rose-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] backdrop-blur-xl">
              <WalletIcon className="h-5 w-5 drop-shadow-[0_2px_8px_rgba(244,63,94,0.5)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 truncate">Expenses</p>
                <span className="inline-flex items-center gap-0.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-rose-400 backdrop-blur-md shrink-0 shadow-sm">
                  <ArrowUpRightIcon className="h-2.5 w-2.5" />+8%
                </span>
              </div>
              <p className="font-mono text-sm sm:text-base font-black text-rose-300 truncate mt-0.5 tracking-tight">
                {formatINR(stats.expenses)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Total Profit */}
        <motion.div
          whileHover={{ y: -2, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] p-3 sm:p-3.5 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_8px_24px_rgba(0,0,0,0.35)] hover:border-[#F5B82E]/50 hover:bg-white/[0.07] transition-all"
        >
          {/* Ambient Backlight Glow */}
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#F5B82E]/15 blur-2xl transition-all group-hover:bg-[#F5B82E]/25" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-[#F5B82E]/35 bg-[#F5B82E]/10 text-[#F5B82E] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] backdrop-blur-xl">
              <BarChart3Icon className="h-5 w-5 drop-shadow-[0_2px_8px_rgba(245,184,46,0.5)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 truncate">Net Profit</p>
                <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-400 backdrop-blur-md shrink-0 shadow-sm">
                  <ArrowUpRightIcon className="h-2.5 w-2.5" />+24%
                </span>
              </div>
              <p className="font-mono text-sm sm:text-base font-black text-[#F5B82E] truncate mt-0.5 tracking-tight drop-shadow-[0_0_12px_rgba(245,184,46,0.25)]">
                {formatINR(stats.profit)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Total Trips */}
        <motion.div
          whileHover={{ y: -2, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] p-3 sm:p-3.5 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_8px_24px_rgba(0,0,0,0.35)] hover:border-sky-500/40 hover:bg-white/[0.07] transition-all"
        >
          {/* Ambient Backlight Glow */}
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-500/15 blur-2xl transition-all group-hover:bg-sky-500/25" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-sky-400/25 bg-sky-500/10 text-sky-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] backdrop-blur-xl">
              <FileTextIcon className="h-5 w-5 drop-shadow-[0_2px_8px_rgba(56,189,248,0.5)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 truncate">Total Trips</p>
                <span className="inline-flex items-center gap-0.5 rounded-full border border-sky-500/30 bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-sky-400 backdrop-blur-md shrink-0 shadow-sm">
                  <ArrowUpRightIcon className="h-2.5 w-2.5" />+20%
                </span>
              </div>
              <p className="font-mono text-sm sm:text-base font-black text-white truncate mt-0.5 tracking-tight">
                {stats.totalTrips}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. Hero Fleet Showcase: Compact Glassy Fleet Showroom */}
      <FleetShowcaseCarousel onSelectLorry={setSelectedLorry} />

      {/* 4. Fleet Statistics Section (Includes Trip Breakdown) */}
      <div className="space-y-3 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F5B82E]" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.18em] text-white">
              Fleet Statistics
            </h2>
            {isFetchingStats && (
              <span className="flex h-2 w-2 rounded-full bg-[#F5B82E] animate-ping" title="Syncing vehicle data..." />
            )}
          </div>

          {/* Scope Selector: Selected Vehicle vs All Fleet */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-white/10 bg-[#0A0E14] p-0.5 shadow-inner">
              <button
                type="button"
                onClick={() => setFleetScope('vehicle')}
                className={`flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  fleetScope === 'vehicle'
                    ? 'bg-gradient-to-r from-[#F5B82E] to-amber-500 text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <TruckIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">{selectedLorry?.plate || 'Vehicle'}</span>
              </button>
              <button
                type="button"
                onClick={() => setFleetScope('all')}
                className={`flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  fleetScope === 'all'
                    ? 'bg-gradient-to-r from-[#F5B82E] to-amber-500 text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>All Fleet ({totalLorriesCount})</span>
              </button>
            </div>

            <Link
              to="/fleet"
              title="All Lorries"
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-neutral-300 hover:border-[#F5B82E] hover:text-[#F5B82E] transition-all cursor-pointer"
            >
              <span className="hidden sm:inline">Fleet</span>
              <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* 6 iPhone Frosted Glass Fleet Status Cards (5 Telemetry + 6th Trip Breakdown Card) */}
        {fleetScope === 'vehicle' && selectedLorry ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {/* 1. Vehicle Status */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] p-3 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.3)] hover:border-white/20 transition-all">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] backdrop-blur-xl"
                  style={{
                    backgroundColor: `${selectedLorry.statusColor || '#F5B82E'}25`,
                    color: selectedLorry.statusColor || '#F5B82E',
                    borderColor: `${selectedLorry.statusColor || '#F5B82E'}40`
                  }}
                >
                  <TruckIcon className="h-4 w-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider truncate">Status</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs sm:text-sm font-black text-white truncate">
                      {selectedLorry.statusLabel}
                    </p>
                    <span
                      className="h-1.5 w-1.5 rounded-full animate-pulse shrink-0"
                      style={{ backgroundColor: selectedLorry.statusColor }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Vehicle Total Trips */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] p-3 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.3)] hover:border-blue-400/30 transition-all">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-blue-400/30 bg-blue-500/15 text-blue-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] backdrop-blur-xl">
                  <FileTextIcon className="h-4 w-4 drop-shadow-[0_2px_6px_rgba(59,130,246,0.4)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider truncate">Trips</p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="font-mono text-xs sm:text-sm font-black text-white">{vehicleTrips.length}</p>
                    <span className="text-[9.5px] font-bold text-emerald-400">
                      {vehicleTrips.filter((t) => t.status === 'in-transit' || t.status === 'loading').length > 0
                        ? 'Active'
                        : 'Done'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Vehicle Revenue */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] p-3 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.3)] hover:border-[#F5B82E]/35 transition-all">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-[#F5B82E]/35 bg-[#F5B82E]/15 text-[#F5B82E] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] backdrop-blur-xl">
                  <CoinsIcon className="h-4 w-4 drop-shadow-[0_2px_6px_rgba(245,184,46,0.4)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider truncate">Earnings</p>
                  <p className="font-mono text-xs sm:text-sm font-black text-[#F5B82E] truncate">
                    {formatINR(vehicleRevenue)}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Payload Capacity & Driver */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] p-3 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.3)] hover:border-purple-400/30 transition-all">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-purple-400/30 bg-purple-500/15 text-purple-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] backdrop-blur-xl">
                  <WrenchIcon className="h-4 w-4 drop-shadow-[0_2px_6px_rgba(168,85,247,0.4)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider truncate">Capacity</p>
                  <p className="font-mono text-xs sm:text-sm font-black text-white truncate">
                    {selectedLorry.capacity || '1,805 sqft'}
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Vehicle Fuel Usage */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] p-3 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.3)] hover:border-amber-400/30 transition-all">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-amber-400/30 bg-amber-500/15 text-amber-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] backdrop-blur-xl">
                  <FuelIcon className="h-4 w-4 drop-shadow-[0_2px_6px_rgba(245,158,11,0.4)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider truncate">Fuel</p>
                  <p className="font-mono text-xs sm:text-sm font-black text-white truncate">
                    {vehicleFuelLiters > 0
                      ? `${vehicleFuelLiters.toLocaleString('en-IN')} L`
                      : vehicleFuelAmount > 0
                        ? `₹${vehicleFuelAmount.toLocaleString('en-IN')}`
                        : '0 L'}
                  </p>
                </div>
              </div>
            </div>

            {/* 6. Trip Breakdown (Added inside Fleet Statistics) */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#F5B82E]/30 bg-gradient-to-br from-[#F5B82E]/[0.08] to-white/[0.03] p-3 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5B82E] truncate">
                  Trip Breakdown
                </span>
                <span className="font-mono text-[10px] font-black text-white">{vehicleTrips.length}</span>
              </div>
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                {displayPieData.map((d) => (
                  <div
                    key={d.name}
                    style={{
                      width: d.percentage === '0%' ? '33%' : d.percentage,
                      backgroundColor: d.color
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between gap-1 text-[9.5px] text-neutral-300">
                {displayPieData.map((d) => (
                  <span key={d.name} className="inline-flex items-center gap-1 truncate">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <strong className="font-mono text-white">{d.value}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {/* 1. Total Lorries */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] p-3 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.3)] hover:border-[#F5B82E]/30 transition-all">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-[#F5B82E]/30 bg-[#F5B82E]/15 text-[#F5B82E] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] backdrop-blur-xl">
                  <TruckIcon className="h-4 w-4 drop-shadow-[0_2px_6px_rgba(245,184,46,0.4)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider truncate">Total Fleet</p>
                  <p className="font-mono text-xs sm:text-sm font-black text-white">{totalLorriesCount}</p>
                </div>
              </div>
            </div>

            {/* 2. On Trip */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] p-3 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.3)] hover:border-emerald-400/30 transition-all">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] backdrop-blur-xl">
                  <TruckIcon className="h-4 w-4 drop-shadow-[0_2px_6px_rgba(16,185,129,0.4)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider truncate">On Trip</p>
                  <p className="font-mono text-xs sm:text-sm font-black text-emerald-400">{onTripCount}</p>
                </div>
              </div>
            </div>

            {/* 3. Idle */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] p-3 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.3)] hover:border-blue-400/30 transition-all">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-blue-400/30 bg-blue-500/15 text-blue-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] backdrop-blur-xl">
                  <PauseCircleIcon className="h-4 w-4 drop-shadow-[0_2px_6px_rgba(59,130,246,0.4)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider truncate">Idle</p>
                  <p className="font-mono text-xs sm:text-sm font-black text-blue-400">{idleCount}</p>
                </div>
              </div>
            </div>

            {/* 4. Maintenance */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] p-3 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.3)] hover:border-rose-400/30 transition-all">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-rose-400/30 bg-rose-500/15 text-rose-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] backdrop-blur-xl">
                  <WrenchIcon className="h-4 w-4 drop-shadow-[0_2px_6px_rgba(244,63,94,0.4)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider truncate">Service</p>
                  <p className="font-mono text-xs sm:text-sm font-black text-amber-400">{maintenanceCount}</p>
                </div>
              </div>
            </div>

            {/* 5. Total Fuel Usage */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.04] p-3 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.3)] hover:border-amber-400/30 transition-all">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-amber-400/30 bg-amber-500/15 text-amber-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] backdrop-blur-xl">
                  <FuelIcon className="h-4 w-4 drop-shadow-[0_2px_6px_rgba(245,158,11,0.4)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider truncate">Fuel</p>
                  <p className="font-mono text-xs sm:text-sm font-black text-white truncate">
                    {fuelMetrics.liters > 0
                      ? `${fuelMetrics.liters.toLocaleString('en-IN')} L`
                      : fuelMetrics.amount > 0
                        ? `₹${fuelMetrics.amount.toLocaleString('en-IN')}`
                        : '0 L'}
                  </p>
                </div>
              </div>
            </div>

            {/* 6. Trip Breakdown (Added inside Fleet Statistics) */}
            <div className="group relative overflow-hidden rounded-2xl border border-[#F5B82E]/30 bg-gradient-to-br from-[#F5B82E]/[0.08] to-white/[0.03] p-3 backdrop-blur-2xl backdrop-saturate-180 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5B82E] truncate">
                  Trip Breakdown
                </span>
                <span className="font-mono text-[10px] font-black text-white">{filteredTrips.length}</span>
              </div>
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                {displayPieData.map((d) => (
                  <div
                    key={d.name}
                    style={{
                      width: d.percentage === '0%' ? '33%' : d.percentage,
                      backgroundColor: d.color
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between gap-1 text-[9.5px] text-neutral-300">
                {displayPieData.map((d) => (
                  <span key={d.name} className="inline-flex items-center gap-1 truncate">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <strong className="font-mono text-white">{d.value}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Bottom Analytics Grid: Recent Trips (5 cols) + Expanded Trip Expenses (7 cols) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Panel (5 cols): Recent Trips */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5 sm:p-4 shadow-xl backdrop-blur-2xl">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <TruckIcon className="h-3.5 w-3.5 shrink-0 text-[#F5B82E]" />
                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-white truncate">
                  {fleetScope === 'vehicle' && selectedLorry
                    ? `Recent Trips (${selectedLorry.plate})`
                    : 'Recent Trips'}
                </h3>
              </div>
              <Link
                to="/trips"
                className="flex items-center gap-1 text-[11px] font-semibold text-[#F5B82E] hover:underline shrink-0"
              >
                <span>All</span>
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-2.5 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[9.5px] uppercase font-bold text-neutral-500 tracking-wider">
                    <th className="py-2 px-1.5">Lorry</th>
                    <th className="py-2 px-1.5">Driver</th>
                    <th className="py-2 px-1.5">Route</th>
                    <th className="py-2 px-1.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayTripsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-neutral-500">
                        No trips in this period.{' '}
                        <Link to="/trips" className="text-[#F5B82E] hover:underline font-semibold">
                          View Trips
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    displayTripsList.map((t, i) => (
                      <tr key={t.id || i} className="hover:bg-white/5 transition-colors">
                        <td className="py-2 px-1.5 font-mono font-bold text-white text-[11px] whitespace-nowrap">{t.plate}</td>
                        <td className="py-2 px-1.5 text-neutral-300 font-medium text-[11px] whitespace-nowrap">{t.driver}</td>
                        <td className="py-2 px-1.5 text-neutral-400 text-[11px] truncate max-w-[110px]">{t.route}</td>
                        <td className="py-2 px-1.5 text-right whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border ${t.bgClass}`}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: t.statusColor }}
                            />
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panel (7 cols): Expanded Trip Expenses */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5 sm:p-4 shadow-xl backdrop-blur-2xl">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <WalletIcon className="h-3.5 w-3.5 shrink-0 text-[#F5B82E]" />
                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-white truncate">
                  {fleetScope === 'vehicle' && selectedLorry
                    ? `Expenses (${selectedLorry.plate})`
                    : 'Trip Expenses'}
                </h3>
              </div>
              <Link
                to={`/expenses?lorry=${encodeURIComponent(selectedLorry?.plate || (lorries.find(l => l.plate.toUpperCase().includes('KL'))?.plate || lorries[0]?.plate || 'KL 03BH 3333'))}`}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#F5B82E] hover:underline shrink-0"
              >
                <span>Ledger</span>
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>

            {/* Expanded 2-Column Glassy Expense Categories Grid */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {displayExpensesList.map((exp) => {
                const Icon = exp.icon;
                const sharePct =
                  displayTotalExpenses > 0
                    ? Math.min(100, Math.round((exp.amount / displayTotalExpenses) * 100))
                    : 0;
                return (
                  <div
                    key={exp.label}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5 hover:border-[#F5B82E]/30 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${exp.bg} ${exp.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-neutral-200 text-xs block truncate">{exp.label}</span>
                          <span className="text-[9.5px] text-neutral-500">{sharePct}% of total</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-white text-xs shrink-0">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#F5B82E] to-amber-400 transition-all duration-500"
                        style={{ width: `${sharePct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Total Expenses Highlight Bar */}
          <div className="mt-3 rounded-xl border border-[#F5B82E]/35 bg-gradient-to-r from-amber-500/15 via-[#F5B82E]/10 to-transparent px-3.5 py-2.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CoinsIcon className="h-4 w-4 text-[#F5B82E] shrink-0" />
                <span className="text-xs font-bold text-neutral-200 truncate">
                  {fleetScope === 'vehicle' && selectedLorry
                    ? `${selectedLorry.plate} Total Expenses`
                    : 'Total Expenses'}
                </span>
              </div>
              <span className="font-mono text-sm sm:text-base font-black text-[#F5B82E] shrink-0">
                ₹ {displayTotalExpenses.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Kerala Delivery & Unloading Audit (Always Visible, Streamlined Necessary Info) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F5B82E]" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.18em] text-white">
              Kerala Delivery &amp; Unloading Audit
            </h2>
            <span className="rounded-full bg-[#F5B82E]/15 border border-[#F5B82E]/30 px-2 py-0.5 text-[10px] font-mono font-bold text-[#F5B82E]">
              {unloadingDetailsList.length}
            </span>
          </div>
          <Link
            to="/unloading-parties"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#F5B82E] hover:underline"
          >
            <span>Buyers</span>
            <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>

        {/* Mobile Compact Audit Cards (<768px) */}
        <div className="space-y-2.5 md:hidden">
          {unloadingDetailsList.length === 0 ? (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 text-center text-xs text-neutral-500">
              No unloading delivery records for this view.{' '}
              <Link to="/trips" className="text-[#F5B82E] hover:underline font-bold">
                View Trips
              </Link>
            </div>
          ) : (
            unloadingDetailsList.map((item) => {
              const matchTrip = trips.find((t) => t.id === item.tripId);
              const isCompletedAudit =
                item.auditStatus === 'audited' || Boolean(item.auditedAt) || item.statusBadge.label === 'Delivered & Unloaded';
              return (
                <div
                  key={item.tripId}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-xl space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link
                        to={`/trips/${item.tripId}`}
                        className="font-mono font-bold text-gold hover:underline text-xs"
                      >
                        #{item.tripCode}
                      </Link>
                      <span className="font-mono text-xs font-black text-white truncate">
                        {item.lorryPlate}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border shrink-0 ${item.statusBadge.bg}`}
                    >
                      {item.statusBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs text-neutral-300">
                    <span className="truncate font-semibold">{item.partyName} ({item.district})</span>
                    <span className="font-mono text-white shrink-0">
                      {item.unloadedPieces}/{item.totalPieces} pcs
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      Paid: {formatINR(item.totalPaid)}
                    </span>
                    {isCompletedAudit ? (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                        ✓ Audited
                      </span>
                    ) : (
                      matchTrip && (
                        <button
                          onClick={() => setAuditingTrip(matchTrip)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#F5B82E] px-2.5 py-1 text-[11px] font-black text-black cursor-pointer"
                        >
                          <ShieldCheckIcon className="h-3 w-3" />
                          <span>Audit</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Compact Audit Table (>=768px) */}
        <div className="hidden md:block rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 shadow-xl backdrop-blur-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  <th className="py-2 px-3">Trip / Lorry</th>
                  <th className="py-2 px-3">Kerala Buyer</th>
                  <th className="py-2 px-3">Pieces</th>
                  <th className="py-2 px-3">Collected</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {unloadingDetailsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-xs text-neutral-500">
                      No unloading delivery records for this view.{' '}
                      <Link to="/trips" className="text-[#F5B82E] hover:underline font-bold">
                        View Trips
                      </Link>
                    </td>
                  </tr>
                ) : (
                  unloadingDetailsList.map((item) => {
                    const matchTrip = trips.find((t) => t.id === item.tripId);
                    const isCompletedAudit =
                      item.auditStatus === 'audited' || Boolean(item.auditedAt) || item.statusBadge.label === 'Delivered & Unloaded';
                    return (
                      <tr key={item.tripId} className="hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/trips/${item.tripId}`}
                              className="font-mono font-bold text-gold hover:underline text-xs"
                            >
                              #{item.tripCode}
                            </Link>
                            <span className="font-mono font-bold text-white text-xs">
                              {item.lorryPlate}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-white text-xs">{item.partyName}</span>
                          <span className="text-[10.5px] text-emerald-300 ml-1.5">({item.district})</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-white">
                          {item.unloadedPieces} <span className="text-neutral-500">/ {item.totalPieces} pcs</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 text-xs">
                          {formatINR(item.totalPaid)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold border ${item.statusBadge.bg}`}
                          >
                            {item.statusBadge.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isCompletedAudit ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                              ✓ Audited
                            </span>
                          ) : (
                            matchTrip && (
                              <button
                                onClick={() => setAuditingTrip(matchTrip)}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#F5B82E] px-2.5 py-1 text-[11px] font-black text-black hover:brightness-110 transition-all cursor-pointer"
                              >
                                <ShieldCheckIcon className="h-3 w-3" />
                                <span>Audit</span>
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Owner Kerala Delivery Audit Modal */}
      {auditingTrip && (
        <KeralaDeliveryAuditModal
          trip={auditingTrip}
          isOpen={Boolean(auditingTrip)}
          onClose={() => setAuditingTrip(null)}
          onSuccess={fetchDashboard}
        />
      )}
    </div>
  );
}