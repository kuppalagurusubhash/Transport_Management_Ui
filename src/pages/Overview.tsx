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
    <div className="min-h-full space-y-4 sm:space-y-5 p-3 sm:p-5 lg:p-6">
      {/* 1. Header: DASHBOARD / Overall Business Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F5B82E]" />
            <span className="text-[10px] font-extrabold tracking-[0.25em] text-[#F5B82E] uppercase">
              DASHBOARD
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F5B82E]/15 text-[#F5B82E] border border-[#F5B82E]/25">
              <BarChart3Icon className="h-4 w-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Overall Business Status
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-neutral-400">
            Your transport business at a glance
          </p>
        </div>

        {/* Right Period Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsPeriodOpen(!isPeriodOpen)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0F141A] px-3 py-1.5 text-xs font-semibold text-neutral-200 shadow-md transition-all hover:border-[#F5B82E]/50 hover:bg-[#141B24] cursor-pointer"
          >
            <span className="text-neutral-400 text-xs">📅</span>
            <span>{timePeriod}</span>
            <ChevronDownIcon className="h-3.5 w-3.5 text-neutral-400" />
          </button>

          {isPeriodOpen && (
            <div className="absolute right-0 z-30 mt-1.5 w-40 overflow-hidden rounded-xl border border-white/15 bg-[#0F141A] p-1 shadow-2xl backdrop-blur-xl">
              {(['This Month', 'Today', 'This Week', 'This Quarter', 'This Year', 'All Time'] as const).map(
                (period) => (
                  <button
                    key={period}
                    onClick={() => {
                      setTimePeriod(period);
                      setIsPeriodOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${timePeriod === period
                        ? 'bg-[#F5B82E]/20 text-[#F5B82E] font-bold'
                        : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <span>{period}</span>
                    {timePeriod === period && <div className="h-1.5 w-1.5 rounded-full bg-[#F5B82E]" />}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Top 4 KPI Stat Cards (2x2 Bento Grid on iPhone, 4-Column on Desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {/* Total Revenue */}
        <motion.div
          whileHover={{ y: -2 }}
          className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#0F1D17] via-[#0C1612] to-[#080E0C] p-2.5 sm:p-3.5 shadow-md"
        >
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 shadow-inner">
              <CoinsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-semibold text-neutral-400 truncate">Total Revenue</p>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-1 sm:gap-2">
                <span className="font-mono text-sm sm:text-xl font-black text-white truncate">
                  {formatINR(stats.revenue)}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-400">
                  <ArrowUpRightIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> +12%
                </span>
              </div>
              <p className="text-[9px] sm:text-[9.5px] text-neutral-500">vs last month</p>
            </div>
          </div>
        </motion.div>

        {/* Total Expenses */}
        <motion.div
          whileHover={{ y: -2 }}
          className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#241315] via-[#1B0F10] to-[#12090A] p-2.5 sm:p-3.5 shadow-md"
        >
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/25 shadow-inner">
              <WalletIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-semibold text-neutral-400 truncate">Total Expenses</p>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-1 sm:gap-2">
                <span className="font-mono text-sm sm:text-xl font-black text-red-400 truncate">
                  {formatINR(stats.expenses)}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-red-400">
                  <ArrowUpRightIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> +8%
                </span>
              </div>
              <p className="text-[9px] sm:text-[9.5px] text-neutral-500">vs last month</p>
            </div>
          </div>
        </motion.div>

        {/* Total Profit */}
        <motion.div
          whileHover={{ y: -2 }}
          className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#241B0D] via-[#1A1308] to-[#120D05] p-2.5 sm:p-3.5 shadow-md"
        >
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5B82E]/20 text-[#F5B82E] border border-[#F5B82E]/25 shadow-inner">
              <BarChart3Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-semibold text-neutral-400 truncate">Total Profit</p>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-1 sm:gap-2">
                <span className="font-mono text-sm sm:text-xl font-black text-[#F5B82E] truncate">
                  {formatINR(stats.profit)}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-400">
                  <ArrowUpRightIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> +24%
                </span>
              </div>
              <p className="text-[9px] sm:text-[9.5px] text-neutral-500">vs last month</p>
            </div>
          </div>
        </motion.div>

        {/* Total Trips */}
        <motion.div
          whileHover={{ y: -2 }}
          className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#101A29] via-[#0C1320] to-[#070C14] p-2.5 sm:p-3.5 shadow-md"
        >
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/25 shadow-inner">
              <FileTextIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-semibold text-neutral-400 truncate">Total Trips</p>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-1 sm:gap-2">
                <span className="font-mono text-sm sm:text-xl font-black text-white">
                  {stats.totalTrips}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-400">
                  <ArrowUpRightIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> +20%
                </span>
              </div>
              <p className="text-[9px] sm:text-[9.5px] text-neutral-500">All time trips</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. Hero Fleet Showcase: Compact 3D Interactive Moving Fleet Showroom */}
      <FleetShowcaseCarousel onSelectLorry={setSelectedLorry} />

      {/* 4. Fleet Statistics Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F5B82E]/15 text-[#F5B82E] border border-[#F5B82E]/25">
              <TruckIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Fleet Statistics
                </h2>
                {isFetchingStats && (
                  <span className="flex h-2 w-2 rounded-full bg-[#F5B82E] animate-ping" title="Syncing vehicle data..." />
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                {fleetScope === 'vehicle' && selectedLorry
                  ? `Live telemetry & operational statistics for ${selectedLorry.plate}`
                  : 'Live status of all vehicles in your fleet'}
              </p>
            </div>
          </div>

          {/* Scope Selector: Selected Vehicle vs All Fleet */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <div className="flex items-center rounded-lg border border-white/10 bg-[#0A0E14] p-0.5 shadow-inner flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={() => setFleetScope('vehicle')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  fleetScope === 'vehicle'
                    ? 'bg-gradient-to-r from-[#F5B82E] to-amber-500 text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <TruckIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">{selectedLorry?.plate || 'Current Vehicle'}</span>
              </button>
              <button
                type="button"
                onClick={() => setFleetScope('all')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
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
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#0F141A] px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-neutral-300 hover:border-[#F5B82E] hover:text-[#F5B82E] transition-all cursor-pointer shadow-sm shrink-0"
            >
              <span>All Lorries</span>
              <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>

                                    {/* 5 Quick Fleet Status Cards (Dynamically reacting to selected vehicle or whole fleet) */}
                                    {fleetScope === 'vehicle' && selectedLorry ? (
                                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                                        {/* 1. Vehicle Status */}
                                        <div className="rounded-xl border border-white/10 bg-[#0D1218]/90 p-2.5 sm:p-3 shadow-md backdrop-blur-xl">
                                          <div className="flex items-center gap-2.5">
                                            <div
                                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
                                              style={{
                                                backgroundColor: `${selectedLorry.statusColor || '#F5B82E'}20`,
                                                color: selectedLorry.statusColor || '#F5B82E',
                                                borderColor: `${selectedLorry.statusColor || '#F5B82E'}40`
                                              }}
                                            >
                                              <TruckIcon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-[10.5px] text-neutral-400 font-medium">Vehicle Status</p>
                                              <div className="flex items-baseline gap-1.5">
                                                <p className="text-sm sm:text-base font-black text-white truncate">
                                                  {selectedLorry.statusLabel}
                                                </p>
                                                <span
                                                  className="h-1.5 w-1.5 rounded-full animate-pulse shrink-0"
                                                  style={{ backgroundColor: selectedLorry.statusColor }}
                                                />
                                              </div>
                                              <p className="text-[9.5px] text-neutral-500 truncate">
                                                {selectedLorry.route || 'Depot — Ramapuram'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* 2. Vehicle Total Trips */}
                                        <div className="rounded-xl border border-white/10 bg-[#0D1218]/90 p-2.5 sm:p-3 shadow-md backdrop-blur-xl">
                                          <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                              <FileTextIcon className="h-4 w-4" />
                                            </div>
                                            <div>
                                              <p className="text-[10.5px] text-neutral-400 font-medium">Vehicle Trips</p>
                                              <div className="flex items-baseline gap-1.5">
                                                <p className="text-base sm:text-lg font-black text-white">{vehicleTrips.length}</p>
                                                <span className="text-[10px] font-bold text-emerald-400">
                                                  {vehicleTrips.filter((t) => t.status === 'in-transit' || t.status === 'loading').length > 0
                                                    ? '↗ Active'
                                                    : 'Done'}
                                                </span>
                                              </div>
                                              <p className="text-[9.5px] text-neutral-500">{timePeriod.toLowerCase()} trips</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* 3. Vehicle Revenue */}
                                        <div className="rounded-xl border border-white/10 bg-[#0D1218]/90 p-2.5 sm:p-3 shadow-md backdrop-blur-xl">
                                          <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5B82E]/15 text-[#F5B82E] border border-[#F5B82E]/20">
                                              <CoinsIcon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-[10.5px] text-neutral-400 font-medium">Vehicle Revenue</p>
                                              <div className="flex items-baseline gap-1.5">
                                                <p className="text-sm sm:text-base font-black text-[#F5B82E] font-mono truncate">
                                                  {formatINR(vehicleRevenue)}
                                                </p>
                                              </div>
                                              <p className="text-[9.5px] text-neutral-500 truncate">Total earnings</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* 4. Payload Capacity & Driver */}
                                        <div className="rounded-xl border border-white/10 bg-[#0D1218]/90 p-2.5 sm:p-3 shadow-md backdrop-blur-xl">
                                          <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/20">
                                              <WrenchIcon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-[10.5px] text-neutral-400 font-medium">Rated Capacity</p>
                                              <div className="flex items-baseline gap-1.5">
                                                <p className="text-sm sm:text-base font-black text-white truncate">
                                                  {selectedLorry.capacity || '1,805 sqft'}
                                                </p>
                                              </div>
                                              <p className="text-[9.5px] text-neutral-500 truncate">
                                                Driver: {selectedLorry.driver || 'Assigned'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* 5. Vehicle Fuel Usage */}
                                        <div className="col-span-2 sm:col-span-1 rounded-xl border border-white/10 bg-[#0D1218]/90 p-2.5 sm:p-3 shadow-md backdrop-blur-xl">
                                          <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                                              <FuelIcon className="h-4 w-4" />
                                            </div>
                                            <div>
                                              <p className="text-[10.5px] text-neutral-400 font-medium">Vehicle Fuel</p>
                                              <div className="flex items-baseline gap-1.5">
                                                <p className="text-base sm:text-lg font-black text-white">
                                                  {vehicleFuelLiters > 0
                                                    ? `${vehicleFuelLiters.toLocaleString('en-IN')} L`
                                                    : vehicleFuelAmount > 0
                                                      ? `₹${vehicleFuelAmount.toLocaleString('en-IN')}`
                                                      : '0 L'}
                                                </p>
                                                <span className="text-[10px] font-bold text-amber-400">Live</span>
                                              </div>
                                              <p className="text-[9.5px] text-neutral-500 truncate">
                                                {vehicleFuelAmount > 0 ? `₹${vehicleFuelAmount.toLocaleString('en-IN')}` : 'Diesel consumption'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                                        {/* Total Lorries */}
                                        <div className="rounded-xl border border-white/10 bg-[#0D1218]/90 p-2.5 sm:p-3 shadow-md backdrop-blur-xl">
                                          <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5B82E]/15 text-[#F5B82E] border border-[#F5B82E]/20">
                                              <TruckIcon className="h-4 w-4" />
                                            </div>
                                            <div>
                                              <p className="text-[10.5px] text-neutral-400 font-medium">Total Lorries</p>
                                              <div className="flex items-baseline gap-1.5">
                                                <p className="text-base sm:text-lg font-black text-white">{totalLorriesCount}</p>
                                                <span className="text-[10px] font-bold text-emerald-400">↗ Active</span>
                                              </div>
                                              <p className="text-[9.5px] text-neutral-500">In fleet registry</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* On Trip */}
                                        <div className="rounded-xl border border-white/10 bg-[#0D1218]/90 p-2.5 sm:p-3 shadow-md backdrop-blur-xl">
                                          <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                              <TruckIcon className="h-4 w-4" />
                                            </div>
                                            <div>
                                              <p className="text-[10.5px] text-neutral-400 font-medium">On Trip</p>
                                              <div className="flex items-baseline gap-1.5">
                                                <p className="text-base sm:text-lg font-black text-white">{onTripCount}</p>
                                                <span className="text-[10px] font-bold text-emerald-400">
                                                  {totalLorriesCount > 0 ? `${Math.round((onTripCount / totalLorriesCount) * 100)}%` : '0%'}
                                                </span>
                                              </div>
                                              <p className="text-[9.5px] text-neutral-500">Currently running</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Idle */}
                                        <div className="rounded-xl border border-white/10 bg-[#0D1218]/90 p-2.5 sm:p-3 shadow-md backdrop-blur-xl">
                                          <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                              <PauseCircleIcon className="h-4 w-4" />
                                            </div>
                                            <div>
                                              <p className="text-[10.5px] text-neutral-400 font-medium">Idle</p>
                                              <div className="flex items-baseline gap-1.5">
                                                <p className="text-base sm:text-lg font-black text-white">{idleCount}</p>
                                                <span className="text-[10px] font-bold text-blue-400">
                                                  {totalLorriesCount > 0 ? `${Math.round((idleCount / totalLorriesCount) * 100)}%` : '0%'}
                                                </span>
                                              </div>
                                              <p className="text-[9.5px] text-neutral-500">Not assigned</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Under Maintenance */}
                                        <div className="rounded-xl border border-white/10 bg-[#0D1218]/90 p-2.5 sm:p-3 shadow-md backdrop-blur-xl">
                                          <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400 border border-red-500/20">
                                              <WrenchIcon className="h-4 w-4" />
                                            </div>
                                            <div>
                                              <p className="text-[10.5px] text-neutral-400 font-medium">Under Maintenance</p>
                                              <div className="flex items-baseline gap-1.5">
                                                <p className="text-base sm:text-lg font-black text-white">{maintenanceCount}</p>
                                                <span className="text-[10px] font-bold text-amber-400">
                                                  {totalLorriesCount > 0 ? `${Math.round((maintenanceCount / totalLorriesCount) * 100)}%` : '0%'}
                                                </span>
                                              </div>
                                              <p className="text-[9.5px] text-neutral-500">In service/repair</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Total Fuel Usage */}
                                        <div className="col-span-2 sm:col-span-1 rounded-xl border border-white/10 bg-[#0D1218]/90 p-2.5 sm:p-3 shadow-md backdrop-blur-xl">
                                          <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                                              <FuelIcon className="h-4 w-4" />
                                            </div>
                                            <div>
                                              <p className="text-[10.5px] text-neutral-400 font-medium">Total Fuel Usage</p>
                                              <div className="flex items-baseline gap-1.5">
                                                <p className="text-base sm:text-lg font-black text-white">
                                                  {fuelMetrics.liters > 0
                                                    ? `${fuelMetrics.liters.toLocaleString('en-IN')} L`
                                                    : (fuelMetrics.amount > 0 ? `₹${fuelMetrics.amount.toLocaleString('en-IN')}` : '0 L')}
                                                </p>
                                                <span className="text-[10px] font-bold text-emerald-400">Live</span>
                                              </div>
                                              <p className="text-[9.5px] text-neutral-500">{timePeriod.toLowerCase()}</p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* 5. Bottom 3-Column Analytics Grid */}
                                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                    {/* Column 1: Recent Trips */}
                                    <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0D1218]/95 p-3.5 sm:p-4 shadow-xl backdrop-blur-2xl">
                                      <div>
                                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                          <div className="flex items-center gap-2">
                                            <TruckIcon className="h-4 w-4 text-[#F5B82E]" />
                                            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                                              {fleetScope === 'vehicle' && selectedLorry
                                                ? `Recent Trips (${selectedLorry.plate})`
                                                : 'Recent Trips'}
                                            </h3>
                                          </div>
                                          <Link
                                            to="/trips"
                                            className="flex items-center gap-1 text-[11px] font-semibold text-[#F5B82E] hover:underline"
                                          >
                                            <span>View All</span>
                                            <ArrowRightIcon className="h-2.5 w-2.5" />
                                          </Link>
                                        </div>

                                        <div className="mt-2.5 overflow-x-auto">
                                          <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                              <tr className="border-b border-white/5 text-[9.5px] uppercase font-bold text-neutral-500 tracking-wider">
                                                <th className="py-2 px-1">Lorry No.</th>
                                                <th className="py-2 px-1">Driver</th>
                                                <th className="py-2 px-1">Route</th>
                                                <th className="py-2 px-1 text-right">Status</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                              {displayTripsList.length === 0 ? (
                                                <tr>
                                                  <td colSpan={4} className="py-6 text-center text-xs text-neutral-500">
                                                    {fleetScope === 'vehicle' && selectedLorry ? (
                                                      <>
                                                        No trips recorded for <strong className="text-neutral-300">{selectedLorry.plate}</strong> in this period.{' '}
                                                        <Link to="/trips" className="text-[#F5B82E] hover:underline font-semibold">
                                                          Assign or create a trip
                                                        </Link>
                                                      </>
                                                    ) : (
                                                      <>
                                                        No trips recorded yet.{' '}
                                                        <Link to="/trips" className="text-[#F5B82E] hover:underline font-semibold">
                                                          Create or view trips
                                                        </Link>
                                                      </>
                                                    )}
                                                  </td>
                                                </tr>
                                              ) : (
                                                displayTripsList.map((t, i) => (
                                                  <tr key={t.id || i} className="hover:bg-white/5 transition-colors">
                                                    <td className="py-2 px-1 font-mono font-bold text-white text-[10.5px]">{t.plate}</td>
                                                    <td className="py-2 px-1 text-neutral-300 font-medium text-[11px]">{t.driver}</td>
                                                    <td className="py-2 px-1 text-neutral-400 text-[10.5px] truncate max-w-[120px]">{t.route}</td>
                                                    <td className="py-2 px-1 text-right">
                                                      <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border ${t.bgClass}`}
                                                      >
                                                        <span
                                                          className="h-1 w-1 rounded-full"
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

                                    {/* Column 2: Fleet Status Overview / Vehicle Status Breakdown (Donut Chart) */}
                                    <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0D1218]/95 p-3.5 sm:p-4 shadow-xl backdrop-blur-2xl">
                                      <div>
                                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                          <div className="flex items-center gap-2">
                                            <TruckIcon className="h-4 w-4 text-[#F5B82E]" />
                                            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                                              {fleetScope === 'vehicle' && selectedLorry
                                                ? `Trip Breakdown (${selectedLorry.plate})`
                                                : 'Fleet Status Overview'}
                                            </h3>
                                          </div>
                                          <Link
                                            to="/fleet"
                                            className="flex items-center gap-1 text-[11px] font-semibold text-[#F5B82E] hover:underline"
                                          >
                                            <span>View All</span>
                                            <ArrowRightIcon className="h-2.5 w-2.5" />
                                          </Link>
                                        </div>

                                        {/* Donut Chart with Center Text & Legend */}
                                        <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3.5">
                                          <div className="relative h-32 w-32 sm:h-36 sm:w-36 shrink-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                              <PieChart>
                                                <Pie
                                                  data={displayPieData}
                                                  cx="50%"
                                                  cy="50%"
                                                  innerRadius={36}
                                                  outerRadius={52}
                                                  paddingAngle={3}
                                                  dataKey="value"
                                                >
                                                  {displayPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0D1218" strokeWidth={2} />
                                                  ))}
                                                </Pie>
                                                <Tooltip
                                                  contentStyle={{
                                                    background: '#0B1117',
                                                    border: '1px solid rgba(255,255,255,0.15)',
                                                    borderRadius: 8,
                                                    fontSize: 11
                                                  }}
                                                  itemStyle={{ color: '#fff' }}
                                                />
                                              </PieChart>
                                            </ResponsiveContainer>
                                            {/* Center Stats */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                              <span className="text-lg font-black text-white leading-none">
                                                {fleetScope === 'vehicle' ? vehicleTrips.length : totalLorriesCount}
                                              </span>
                                              <span className="text-[9px] font-semibold text-neutral-400 mt-0.5">
                                                {fleetScope === 'vehicle' ? 'Vehicle Trips' : 'Total Lorries'}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Legend Breakdown */}
                                          <div className="flex-1 space-y-1.5 text-[11px] w-full">
                                            {displayPieData.map((item) => (
                                              <div key={item.name} className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                  <span
                                                    className="h-2 w-2 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                  />
                                                  <span className="text-neutral-300 font-medium">{item.name}</span>
                                                </div>
                                                <span className="font-mono font-bold text-white text-xs">
                                                  {item.value} <span className="text-neutral-500 font-normal text-[10px]">({item.percentage})</span>
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Column 3: Trip Expenses / Vehicle Expenses */}
                                    <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0D1218]/95 p-3.5 sm:p-4 shadow-xl backdrop-blur-2xl">
                                      <div>
                                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                          <div className="flex items-center gap-2">
                                            <WalletIcon className="h-4 w-4 text-[#F5B82E]" />
                                            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                                              {fleetScope === 'vehicle' && selectedLorry
                                                ? `Expenses (${selectedLorry.plate})`
                                                : 'Trip Expenses'}
                                            </h3>
                                          </div>
                                          <Link
                                            to={`/expenses?lorry=${encodeURIComponent(selectedLorry?.plate || (lorries.find(l => l.plate.toUpperCase().includes('KL'))?.plate || lorries[0]?.plate || 'KL 03BH 3333'))}`}
                                            className="flex items-center gap-1 text-[11px] font-semibold text-[#F5B82E] hover:underline"
                                          >
                                            <span>View {fleetScope === 'vehicle' && selectedLorry ? selectedLorry.plate : (selectedLorry?.plate || (lorries.find(l => l.plate.toUpperCase().includes('KL'))?.plate || lorries[0]?.plate || 'KL 03BH 3333'))}</span>
                                            <ArrowRightIcon className="h-2.5 w-2.5" />
                                          </Link>
                                        </div>

                                        {/* Expense Categories List */}
                                        <div className="mt-2.5 space-y-1.5 text-xs">
                                          {displayExpensesList.map((exp) => {
                                            const Icon = exp.icon;
                                            return (
                                              <div
                                                key={exp.label}
                                                className="flex items-center justify-between rounded-lg border border-white/5 bg-[#121822]/60 p-1.5 px-2.5 hover:bg-[#161F2C] transition-colors"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <div className={`flex h-6 w-6 items-center justify-center rounded-md ${exp.bg} ${exp.color}`}>
                                                    <Icon className="h-3 w-3" />
                                                  </div>
                                                  <span className="font-medium text-neutral-300 text-[11px]">{exp.label}</span>
                                                </div>
                                                <span className="font-mono font-bold text-white text-xs">
                                                  ₹ {exp.amount.toLocaleString('en-IN')}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Bottom Total Expenses Highlight Bar */}
                                      <div className="mt-3 rounded-xl border border-[#F5B82E]/40 bg-gradient-to-r from-amber-500/20 via-[#F5B82E]/15 to-amber-500/10 p-2.5 shadow-sm">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F5B82E]/20 text-[#F5B82E] border border-[#F5B82E]/30">
                                              <CoinsIcon className="h-3.5 w-3.5" />
                                            </div>
                                            <span className="text-[11px] font-bold text-neutral-200">
                                              {fleetScope === 'vehicle' && selectedLorry
                                                ? `${selectedLorry.plate} Total`
                                                : 'Total Expenses'}
                                            </span>
                                          </div>
                                          <span className="font-mono text-base font-black text-[#F5B82E]">
                                            ₹ {displayTotalExpenses.toLocaleString('en-IN')}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

      {/* 6. Dedicated Kerala Fleet Delivery & Unloading Audit Module */}
      <div className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/40 shadow-md">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Kerala Delivery &amp; Unloading Audit
                </h2>
                <span className="text-[10px] sm:text-[11px] font-mono text-gold border border-gold/30 bg-gold/10 px-2 py-0.5 rounded-full font-bold">
                  OWNER AUDIT HUB
                </span>
                <span className="rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30">
                  {fleetScope === 'vehicle' && selectedLorry ? `${selectedLorry.plate}` : 'All Fleets'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Audit where the fleet unloaded in Kerala, stone pieces, damages, cash to driver, PhonePe to owner, and amount lessened.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/unloading-parties"
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#0F141A] px-3 py-1.5 text-xs font-bold text-neutral-300 hover:border-gold hover:text-gold transition-all cursor-pointer shadow-sm"
            >
              <span>Buyer Parties</span>
              <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Audit Quick KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-2.5 sm:p-3 space-y-0.5">
            <span className="text-[9.5px] sm:text-[10px] uppercase font-bold text-emerald-400 block truncate">Sound Unloaded</span>
            <span className="font-mono text-sm sm:text-base font-black text-white block truncate">
              {unloadingAuditKPIs.totalUnloaded.toLocaleString('en-IN')} pcs
            </span>
            <span className="text-[9px] sm:text-[9.5px] text-neutral-400 block truncate">of {unloadingAuditKPIs.totalLoaded.toLocaleString('en-IN')} loaded</span>
          </div>

          <div
            className={`rounded-xl p-2.5 sm:p-3 space-y-0.5 border ${
              unloadingAuditKPIs.totalDamaged > 0
                ? 'border-red-500/40 bg-red-950/30 text-red-300'
                : 'border-white/10 bg-black/40 text-neutral-400'
            }`}
          >
            <span className="text-[9.5px] sm:text-[10px] uppercase font-bold block truncate">Damaged Stones</span>
            <span className="font-mono text-sm sm:text-base font-black text-red-300 block truncate">
              {unloadingAuditKPIs.totalDamaged > 0 ? `⚠ ${unloadingAuditKPIs.totalDamaged} pcs` : '0 pcs'}
            </span>
            <span className="text-[9px] sm:text-[9.5px] text-neutral-400 block truncate">
              {unloadingAuditKPIs.totalDamaged > 0 ? 'Transit / site breakages' : '✓ Zero damages'}
            </span>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-2.5 sm:p-3 space-y-0.5">
            <span className="text-[9.5px] sm:text-[10px] uppercase font-bold text-emerald-400 block truncate">💵 Cash to Driver</span>
            <span className="font-mono text-sm sm:text-base font-black text-emerald-300 block truncate">
              {formatINR(unloadingAuditKPIs.totalCash)}
            </span>
            <span className="text-[9px] sm:text-[9.5px] text-neutral-400 block truncate">Collected at site</span>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-2.5 sm:p-3 space-y-0.5">
            <span className="text-[9.5px] sm:text-[10px] uppercase font-bold text-blue-400 block truncate">📱 PhonePe to Owner</span>
            <span className="font-mono text-sm sm:text-base font-black text-blue-300 block truncate">
              {formatINR(unloadingAuditKPIs.totalPhonePe)}
            </span>
            <span className="text-[9px] sm:text-[9.5px] text-neutral-400 block truncate">Direct owner account</span>
          </div>

          <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-2.5 sm:p-3 space-y-0.5">
            <span className="text-[9.5px] sm:text-[10px] uppercase font-bold text-red-400 block truncate">✂ Amount Lessened</span>
            <span className="font-mono text-sm sm:text-base font-black text-red-300 block truncate">
              − {formatINR(unloadingAuditKPIs.totalLessened)}
            </span>
            <span className="text-[9px] sm:text-[9.5px] text-neutral-400 block truncate">Damage &amp; shortage cuts</span>
          </div>

          <div className="rounded-xl border border-gold/30 bg-gold/5 p-2.5 sm:p-3 space-y-0.5">
            <span className="text-[9.5px] sm:text-[10px] uppercase font-bold text-gold block truncate">Active Deliveries</span>
            <span className="font-mono text-sm sm:text-base font-black text-gold block truncate">
              {unloadingAuditKPIs.count} Consignments
            </span>
            <span className="text-[9px] sm:text-[9.5px] text-neutral-400 block truncate">Kerala buyers</span>
          </div>
        </div>

        {/* Mobile Luxury Audit Cards (iPhone / <768px) */}
                                                                        <div className="space-y-3 md:hidden">
                                                                          {unloadingDetailsList.length === 0 ? (
                                                                            <div className="rounded-2xl border border-white/10 bg-[#0D1218]/95 p-6 text-center text-xs text-neutral-500">
                                                                              No unloading delivery records found for this view.{' '}
                                                                              <Link to="/trips" className="text-gold hover:underline font-bold">
                                                                                View all trips
                                                                              </Link>
                                                                            </div>
                                                                          ) : (
                                                                            unloadingDetailsList.map((item) => {
                                                                              const matchTrip = trips.find((t) => t.id === item.tripId);
                                                                              return (
                                                                                <div
                                                                                  key={item.tripId}
                                                                                  className="rounded-2xl border border-white/10 bg-[#0D1218]/95 p-3.5 shadow-xl space-y-3"
                                                                                >
                                                                                  <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                                                                                    <div>
                                                                                      <div className="flex items-center gap-2">
                                                                                        <Link
                                                                                          to={`/trips/${item.tripId}`}
                                                                                          className="font-mono font-bold text-gold hover:underline text-xs"
                                                                                        >
                                                                                          #{item.tripCode}
                                                                                        </Link>
                                                                                        <span className="font-mono text-xs font-black text-white flex items-center gap-1">
                                                                                          <TruckIcon className="h-3 w-3 text-gold" />
                                                                                          {item.lorryPlate}
                                                                                        </span>
                                                                                      </div>
                                                                                      <p className="text-[10px] text-neutral-400 mt-0.5">
                                                                                        Driver: <span className="text-neutral-200 font-semibold">{item.driverName}</span>
                                                                                      </p>
                                                                                    </div>
                                                                                    <span
                                                                                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold border shrink-0 ${item.statusBadge.bg}`}
                                                                                    >
                                                                                      <span
                                                                                        className="h-1 w-1 rounded-full"
                                                                                        style={{ backgroundColor: item.statusBadge.color }}
                                                                                      />
                                                                                      {item.statusBadge.label}
                                                                                    </span>
                                                                                  </div>

                                                                                  {/* Destination & Pieces */}
                                                                                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                                                                                    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
                                                                                      <span className="text-[9.5px] uppercase font-bold text-neutral-500 block">Kerala Buyer</span>
                                                                                      <p className="font-bold text-white truncate mt-0.5">{item.partyName}</p>
                                                                                      <p className="text-[10px] text-emerald-300 font-semibold truncate">📍 {item.district}</p>
                                                                                    </div>
                                                                                    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
                                                                                      <span className="text-[9.5px] uppercase font-bold text-neutral-500 block">Stone Pieces</span>
                                                                                      <p className="font-mono font-bold text-white mt-0.5">
                                                                                        {item.unloadedPieces} <span className="text-neutral-400 font-normal">/ {item.totalPieces} pcs</span>
                                                                                      </p>
                                                                                      {item.damagedPieces > 0 ? (
                                                                                        <p className="text-[10px] font-bold text-red-400">⚠ {item.damagedPieces} damaged</p>
                                                                                      ) : (
                                                                                        <p className="text-[10px] font-semibold text-emerald-400">✓ 0 damages</p>
                                                                                      )}
                                                                                    </div>
                                                                                  </div>

                                                                                  {/* Payment Breakdown */}
                                                                                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-black/40 border border-white/5 p-2.5 text-[10px]">
                                                                                    <div>
                                                                                      <span className="text-neutral-500 block">💵 Driver Cash</span>
                                                                                      <span className="font-mono font-bold text-emerald-300 text-xs">{formatINR(item.cashToDriver)}</span>
                                                                                    </div>
                                                                                    <div>
                                                                                      <span className="text-neutral-500 block">📱 PhonePe</span>
                                                                                      <span className="font-mono font-bold text-blue-300 text-xs">{formatINR(item.phonePeToOwner)}</span>
                                                                                    </div>
                                                                                    <div>
                                                                                      <span className="text-neutral-500 block">✂ Lessened</span>
                                                                                      <span className="font-mono font-bold text-red-300 text-xs">
                                                                                        {item.totalLessened > 0 ? `−${formatINR(item.totalLessened)}` : '₹0'}
                                                                                      </span>
                                                                                    </div>
                                                                                  </div>

                                                                                  {matchTrip && (
                                                                                    <button
                                                                                      onClick={() => setAuditingTrip(matchTrip)}
                                                                                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F5B82E] to-[#E5A81E] py-2 text-xs font-black text-black shadow-md active:scale-[0.98] transition-all cursor-pointer"
                                                                                    >
                                                                                      <ShieldCheckIcon className="h-3.5 w-3.5" />
                                                                                      <span>Audit Unloading &amp; Payments</span>
                                                                                    </button>
                                                                                  )}
                                                                                </div>
                                                                              );
                                                                            })
                                                                          )}
                                                                        </div>

                                                                        {/* Detailed Kerala Unloading & Delivery Audit Table (Desktop >=768px) */}
                                                                        <div className="hidden md:block rounded-2xl border border-white/10 bg-[#0D1218]/95 p-3.5 sm:p-4 shadow-xl backdrop-blur-2xl">
                                                                          <div className="overflow-x-auto">
                                                                            <table className="w-full text-left text-xs border-collapse">
                                                                              <thead>
                                                                                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                                                                                  <th className="py-3 px-3">Trip / Fleet</th>
                                                                                  <th className="py-3 px-3">Where Unloading in Kerala</th>
                                                                                  <th className="py-3 px-3">Pieces &amp; Damage Audit</th>
                                                                                  <th className="py-3 px-3">Buyer Payments</th>
                                                                                  <th className="py-3 px-3">Amount Lessened</th>
                                                                                  <th className="py-3 px-3">Audit Notes &amp; Status</th>
                                                                                  <th className="py-3 px-3 text-right">Owner Action</th>
                                                                                </tr>
                                                                              </thead>
                                                                              <tbody className="divide-y divide-white/5">
                                                                                {unloadingDetailsList.length === 0 ? (
                                                                                  <tr>
                                                                                    <td colSpan={7} className="py-8 text-center text-xs text-neutral-500">
                                                                                      No unloading delivery records found for this view.{' '}
                                                                                      <Link to="/trips" className="text-gold hover:underline font-bold">
                                                                                        View all trips
                                                                                      </Link>
                                                                                    </td>
                                                                                  </tr>
                                                                                ) : (
                                                                                  unloadingDetailsList.map((item) => {
                                                                                    const matchTrip = trips.find((t) => t.id === item.tripId);
                                                                                    return (
                                                                                      <tr key={item.tripId} className="hover:bg-white/5 transition-colors">
                                                                                        {/* 1. Trip / Fleet */}
                                                                                        <td className="py-3 px-3">
                                                                                          <Link
                                                                                            to={`/trips/${item.tripId}`}
                                                                                            className="font-mono font-bold text-gold hover:underline text-xs"
                                                                                          >
                                                                                            #{item.tripCode}
                                                                                          </Link>
                                                                                          <div className="text-[10px] font-bold text-white flex items-center gap-1 mt-0.5">
                                                                                            <TruckIcon className="h-3 w-3 text-gold" />
                                                                                            <span>{item.lorryPlate}</span>
                                                                                          </div>
                                                                                          <div className="text-[9.5px] text-neutral-400">
                                                                                            Driver: {item.driverName}
                                                                                          </div>
                                                                                        </td>

                                                                                        {/* 2. Where Unloading in Kerala */}
                                                                                        <td className="py-3 px-3">
                                                                                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                                                                            <MapPinIcon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                                                                            <span>{item.partyName}</span>
                                                                                          </div>
                                                                                          <p className="text-[10px] text-emerald-300 font-semibold mt-0.5">
                                                                                            📍 {item.district}
                                                                                          </p>
                                                                                          {item.phone && (
                                                                                            <p className="text-[9.5px] text-neutral-400">{item.phone}</p>
                                                                                          )}
                                                                                        </td>

                                                                                        {/* 3. Pieces & Damage Audit */}
                                                                                        <td className="py-3 px-3">
                                                                                          <div className="font-mono text-xs">
                                                                                            <span className="font-bold text-white">{item.unloadedPieces}</span>
                                                                                            <span className="text-neutral-400"> / {item.totalPieces} pcs</span>
                                                                                          </div>
                                                                                          {item.damagedPieces > 0 ? (
                                                                                            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-red-400 bg-red-950/40 border border-red-500/30 px-1.5 py-0.5 rounded mt-0.5">
                                                                                              ⚠ {item.damagedPieces} damaged
                                                                                            </span>
                                                                                          ) : (
                                                                                            <span className="text-[9.5px] text-emerald-400 font-semibold block mt-0.5">
                                                                                              ✓ 0 damages
                                                                                            </span>
                                                                                          )}
                                                                                        </td>

                                                                                        {/* 4. Buyer Payments */}
                                                                                        <td className="py-3 px-3">
                                                                                          <div className="font-mono font-bold text-emerald-400 text-xs">
                                                                                            {formatINR(item.totalPaid)}
                                                                                          </div>
                                                                                          <div className="text-[9.5px] text-neutral-400 mt-0.5 space-y-0.5">
                                                                                            <div>💵 Driver Cash: <strong className="text-neutral-200">{formatINR(item.cashToDriver)}</strong></div>
                                                                                            <div>📱 PhonePe: <strong className="text-neutral-200">{formatINR(item.phonePeToOwner)}</strong></div>
                                                                                          </div>
                                                                                        </td>

                                                                                        {/* 5. Amount Lessened / Deducted */}
                                                                                        <td className="py-3 px-3">
                                                                                          {item.totalLessened > 0 ? (
                                                                                            <div>
                                                                                              <span className="font-mono font-bold text-red-300 text-xs">
                                                                                                − {formatINR(item.totalLessened)}
                                                                                              </span>
                                                                                              <div className="text-[9px] text-neutral-400 mt-0.5">
                                                                                                {item.damageDeduction > 0 && `Damage: ${formatINR(item.damageDeduction)} `}
                                                                                                {item.shortageDeduction > 0 && `Shortage: ${formatINR(item.shortageDeduction)}`}
                                                                                              </div>
                                                                                            </div>
                                                                                          ) : (
                                                                                            <span className="text-[10px] text-neutral-500">₹0 (Full Pay)</span>
                                                                                          )}
                                                                                        </td>

                                                                                        {/* 6. Audit Notes & Status */}
                                                                                        <td className="py-3 px-3">
                                                                                          <span
                                                                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold border ${item.statusBadge.bg}`}
                                                                                          >
                                                                                            <span
                                                                                              className="h-1 w-1 rounded-full"
                                                                                              style={{ backgroundColor: item.statusBadge.color }}
                                                                                            />
                                                                                            {item.statusBadge.label}
                                                                                          </span>
                                                                                          {item.auditNote && (
                                                                                            <p className="text-[9.5px] text-neutral-300 italic mt-1 truncate max-w-[160px]" title={item.auditNote}>
                                                                                              &ldquo;{item.auditNote}&rdquo;
                                                                                            </p>
                                                                                          )}
                                                                                        </td>

                                                                                        {/* 7. Action Button */}
                                                                                        <td className="py-3 px-3 text-right">
                                                                                          {matchTrip && (
                                                                                            <button
                                                                                              onClick={() => setAuditingTrip(matchTrip)}
                                                                                              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F5B82E] to-[#E5A81E] px-3 py-1.5 text-xs font-black text-black shadow-md hover:scale-105 hover:shadow-gold/30 transition-all cursor-pointer"
                                                                                            >
                                                                                              <ShieldCheckIcon className="h-3.5 w-3.5" />
                                                                                              <span>Audit Unloading</span>
                                                                                            </button>
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