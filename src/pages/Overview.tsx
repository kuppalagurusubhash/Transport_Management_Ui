import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import {
  TruckIcon,
  UsersIcon,
  PackageIcon,
  CoinsIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertCircleIcon,
  ActivityIcon,
  MapPinIcon,
  ZapIcon,
  RefreshCwIcon,
  SparklesIcon
} from 'lucide-react';
import { dashboardApi, type OwnerDashboardData } from '../api/index';
import { 
  formatINR 
} from '../utils/helpers';
import { useOrders } from '../store/OrdersContext';
import { useSocket } from '../hooks/useSocket';
import { TripStatusBadge } from '../components/ui/Badge';


export function Overview() {
  const { orders, drivers, lorries, trips, districtRates, loadingParties, unloadingParties } = useOrders();
  const [dashData, setDashData] = useState<OwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveEvents, setLiveEvents] = useState<Array<{ id: string; text: string; time: string }>>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getOwner();
      if (res && res.success && res.data) {
        setDashData(res.data);
        setError(null);
        console.log("%c[Dashboard] Loaded real-time statistics from backend database.", "color: #22c55e; font-weight: bold;");
      } else {
        throw new Error(res?.message || 'Invalid API response format');
      }
      setLastRefresh(new Date());
    } catch (err: any) {
      const message = err.message || 'Backend unavailable';
      console.warn(`%c[Dashboard Error] Backend offline/error (${message}). Running with local ledger data.`, "color: #d4af37; font-weight: bold;");
      setDashData(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // WebSocket live events
  useSocket({
    onOrderCreated: (data: unknown) => {
      const d = data as { order: { code: string } };
      setLiveEvents(prev => [
        { id: `ev-${Date.now()}`, text: `New order: ${d.order?.code}`, time: 'just now' },
        ...prev.slice(0, 9)
      ]);
      fetchDashboard();
    },
    onTripDispatched: (data: unknown) => {
      const d = data as { tripId: string };
      setLiveEvents(prev => [
        { id: `ev-${Date.now()}`, text: `Lorry dispatched — trip ${d.tripId}`, time: 'just now' },
        ...prev.slice(0, 9)
      ]);
      fetchDashboard();
    },
    onTripUpdated: () => fetchDashboard(),
    onOrderStatus: () => fetchDashboard()
  });

  // Calculate dynamic revenue trend from real trips
  const computedRevenueTrend = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap: Record<string, { revenue: number; sqft: number }> = {};
    
    trips.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const monthStr = months[d.getMonth()];
      
      const buyer = unloadingParties.find(up => up.id === t.unloadingPartyId);
      const buyerDistrict = buyer?.district;
      
      const rev = (t.stoneLines || []).reduce((sum, l) => {
        const matchRate = districtRates.find(r => 
          r.district === buyerDistrict &&
          r.size === l.size &&
          r.thickness === l.thickness &&
          r.finish === l.finish
        );
        const rate = matchRate ? matchRate.ratePerSqft : l.ratePerSqft;
        return sum + (l.sqftPerPiece * l.pieces * rate);
      }, 0);
      
      const sqft = (t.stoneLines || []).reduce((sum, l) => sum + (l.sqftPerPiece * l.pieces), 0);
      
      if (!trendMap[monthStr]) {
        trendMap[monthStr] = { revenue: 0, sqft: 0 };
      }
      trendMap[monthStr].revenue += rev;
      trendMap[monthStr].sqft += sqft;
    });
    
    const now = new Date();
    const list = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      const data = trendMap[mName] || { revenue: 0, sqft: 0 };
      list.push({
        month: mName,
        revenue: data.revenue,
        sqft: data.sqft
      });
    }
    return list;
  }, [trips, districtRates, unloadingParties]);

  // Derive comprehensive dashboard data directly from local store if backend API is offline
  const effectiveDashData: OwnerDashboardData = React.useMemo(() => {
    if (dashData) return dashData;

    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalWages = 0;

    trips.forEach(t => {
      const buyer = unloadingParties.find(up => up.id === t.unloadingPartyId);
      const buyerDistrict = buyer?.district;
      const rev = (t.stoneLines && t.stoneLines.length > 0)
        ? t.stoneLines.reduce((sum, l) => {
            const matchRate = districtRates.find(r => 
              r.district === buyerDistrict &&
              r.size === l.size &&
              r.thickness === l.thickness &&
              r.finish === l.finish
            );
            const rate = matchRate ? matchRate.ratePerSqft : l.ratePerSqft;
            return sum + (l.sqftPerPiece * l.pieces * rate);
          }, 0)
        : (t.amountPaid || 0);

      totalRevenue += rev;
      totalExpenses += (t.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
      totalWages += (t.driverWage || 0);
    });

    const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
    const pendingPayments = orders.reduce((sum, o) => sum + Math.max(0, (o.totalAmount || 0) - (o.amountPaid || 0)), 0);
    const netRevenue = totalRevenue - totalExpenses - totalWages;

    const fleetBreakdown = {
      active: lorries.filter(l => l.status === 'active').length,
      idle: lorries.filter(l => l.status === 'idle').length,
      maintenance: lorries.filter(l => l.status === 'maintenance').length,
      loading: lorries.filter(l => l.status === 'loading').length,
      inTransit: lorries.filter(l => l.status === 'in_transit').length
    };

    const recentTrips = trips.slice(0, 5).map(t => {
      const buyer = unloadingParties.find(up => up.id === t.unloadingPartyId);
      const buyerDistrict = buyer?.district;
      const rev = (t.stoneLines && t.stoneLines.length > 0)
        ? t.stoneLines.reduce((sum, l) => {
            const matchRate = districtRates.find(r => 
              r.district === buyerDistrict &&
              r.size === l.size &&
              r.thickness === l.thickness &&
              r.finish === l.finish
            );
            const rate = matchRate ? matchRate.ratePerSqft : l.ratePerSqft;
            return sum + (l.sqftPerPiece * l.pieces * rate);
          }, 0)
        : (t.amountPaid || 0);

      return {
        id: t.id,
        code: t.code,
        lorryId: t.lorryId,
        driverId: t.driverId,
        status: t.status,
        date: t.date,
        revenue: rev
      };
    });

    const loadingPartyBalances = loadingParties.map(lp => ({
      id: lp.id,
      name: lp.name,
      location: lp.location,
      totalPurchased: lp.totalPurchased || 0,
      paid: lp.paid || 0,
      pending: lp.pending || 0
    }));

    const unloadingPartyBalances = unloadingParties.map(up => ({
      id: up.id,
      name: up.name,
      district: up.district,
      totalOrdered: up.totalOrdered || 0,
      paid: up.paid || 0,
      pending: up.pending || 0,
      ordersCount: orders.filter(o => o.unloadingPartyId === up.id).length
    }));

    return {
      summary: {
        totalTrips: trips.length,
        activeDrivers: drivers.filter(d => d.status === 'active').length || drivers.length,
        activeLorries: lorries.filter(l => l.status === 'active' || l.status === 'in_transit').length || lorries.length,
        pendingOrders: pendingOrdersCount,
        totalRevenue,
        pendingPayments,
        totalExpenses,
        totalWages,
        netRevenue
      },
      fleetBreakdown,
      recentTrips,
      loadingPartyBalances,
      unloadingPartyBalances
    };
  }, [dashData, trips, orders, lorries, drivers, loadingParties, unloadingParties, districtRates]);

  const s = effectiveDashData.summary;
  const fleet = effectiveDashData.fleetBreakdown;

  const kpis = [
    { label: 'Total Revenue', value: formatINR(s.totalRevenue), icon: CoinsIcon, color: 'text-gold', sub: 'All time' },
    { label: 'Net Revenue', value: formatINR(s.netRevenue), icon: TrendingUpIcon, color: s.netRevenue >= 0 ? 'text-green-400' : 'text-red-400', sub: 'After expenses & wages' },
    { label: 'Pending Payments', value: formatINR(s.pendingPayments), icon: AlertCircleIcon, color: 'text-amber-400', sub: 'Awaiting collection' },
    { label: 'Total Expenses', value: formatINR(s.totalExpenses + s.totalWages), icon: TrendingDownIcon, color: 'text-red-400', sub: 'Expenses + wages' },
    { label: 'Active Lorries', value: String(s.activeLorries), icon: TruckIcon, color: 'text-blue-400', sub: 'Ready / in service' },
    { label: 'Active Drivers', value: String(s.activeDrivers), icon: UsersIcon, color: 'text-purple-400', sub: 'On duty' },
    { label: 'Pending Orders', value: String(s.pendingOrders), icon: PackageIcon, color: 'text-orange-400', sub: 'Awaiting dispatch' },
    { label: 'Total Trips', value: String(s.totalTrips), icon: ActivityIcon, color: 'text-neutral-400', sub: 'All time' }
  ];

  const fleetBars = [
    { name: 'Active', value: fleet.active, color: '#22c55e' },
    { name: 'Idle', value: fleet.idle, color: '#6b7280' },
    { name: 'Loading', value: fleet.loading, color: '#3b82f6' },
    { name: 'In Transit', value: fleet.inTransit, color: '#d4af37' },
    { name: 'Maint.', value: fleet.maintenance, color: '#ef4444' }
  ];

  return (
    <div className="flex h-full min-w-0 flex-col bg-ink-900">
      {/* Header */}
      <header className="border-b border-ink-700 bg-ink-950 px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">
              Owner Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              TRANS IA — Stone Transport Management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-neutral-600">
              Last refreshed: {lastRefresh.toLocaleTimeString('en-IN')}
            </span>
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-md border border-ink-700 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCwIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="ti-scroll flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">

        {/* Error / Offline Server Notice */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="font-medium text-neutral-200">
                <strong className="text-red-400 font-bold">Database Server Notice:</strong> {error}
              </span>
            </div>
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-bold border border-red-500/40 transition-all shrink-0 cursor-pointer"
            >
              {loading ? 'Reconnecting...' : 'Retry Connection'}
            </button>
          </div>
        )}

        {/* Live WebSocket Events Banner */}
        <AnimatePresence>
          {liveEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-gold/20 bg-gold/5 px-4 py-3 flex items-center gap-3 text-xs"
            >
              <ZapIcon className="h-4 w-4 text-gold animate-pulse shrink-0" />
              <span className="text-gold font-semibold">LIVE:</span>
              <span className="text-neutral-300">{liveEvents[0].text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. KPI Cards Grid */}
        <section>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-4">
            {loading && !dashData ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg border border-ink-700 bg-ink-950 animate-pulse" />
              ))
            ) : (
              kpis.map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-lg border border-ink-700 bg-ink-950 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">{kpi.label}</span>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-[10px] text-neutral-600">{kpi.sub}</p>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Operational Portals Full Access (Owner Direct Entry) */}
        <section className="rounded-2xl border border-gold/30 bg-gradient-to-r from-ink-950 via-gold/5 to-ink-950 p-5 space-y-3 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-800/80 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-gold" />
                Operational Portals — Owner Full Access
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Directly enter, operate, and inspect any portal in the transport network
              </p>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-gold/15 text-gold border border-gold/30">
              👑 All Portals Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <Link
              to="/driver"
              className="group flex flex-col justify-between p-4 rounded-xl border border-ink-700 bg-ink-900/70 hover:border-gold hover:bg-ink-850 transition-all shadow-sm"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold group-hover:scale-105 transition-transform">
                    <UsersIcon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider group-hover:text-gold transition-colors">
                    Open &rarr;
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-gold transition-colors pt-1">
                  Driver Operations Portal
                </h4>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  Upload handwritten cost chits, log trip expenses, and audit driver settlements.
                </p>
              </div>
            </Link>

            <Link
              to="/loading"
              className="group flex flex-col justify-between p-4 rounded-xl border border-ink-700 bg-ink-900/70 hover:border-gold hover:bg-ink-850 transition-all shadow-sm"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 group-hover:scale-105 transition-transform">
                    <TruckIcon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider group-hover:text-gold transition-colors">
                    Open &rarr;
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-gold transition-colors pt-1">
                  Quarry Loading Portal
                </h4>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  Manage Ramapuram stone quarries, record vehicle loading slips, and worker wages.
                </p>
              </div>
            </Link>

            <Link
              to="/buyer"
              className="group flex flex-col justify-between p-4 rounded-xl border border-ink-700 bg-ink-900/70 hover:border-gold hover:bg-ink-850 transition-all shadow-sm"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/15 text-green-400 group-hover:scale-105 transition-transform">
                    <PackageIcon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider group-hover:text-gold transition-colors">
                    Open &rarr;
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-gold transition-colors pt-1">
                  Buyer Unloading Portal
                </h4>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  Inspect Kerala party ordering catalogs, live district rates, and place stone orders.
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* 2. Fleet Breakdown & Revenue Chart */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Fleet Bar Chart */}
          <div className="rounded-lg border border-ink-700 bg-ink-950 p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-2">
              <TruckIcon className="h-4 w-4" /> Fleet Status Breakdown
            </h3>
            {fleet && (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fleetBars} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="name" stroke="#555" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#555" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 8 }}
                      labelStyle={{ color: '#d4af37' }}
                      cursor={{ fill: 'rgba(212,175,55,0.05)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {fleetBars.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="grid grid-cols-5 gap-2 pt-1">
              {fleetBars.map(f => (
                <div key={f.name} className="text-center">
                  <p className="text-sm font-bold text-white">{f.value}</p>
                  <p className="text-[9px] text-neutral-500">{f.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <div className="rounded-lg border border-ink-700 bg-ink-950 p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-2">
              <TrendingUpIcon className="h-4 w-4" /> Revenue Trend
            </h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={computedRevenueTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4af37" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="month" stroke="#555" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#555" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v/1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 8, color: '#e8e8e8' }}
                    labelStyle={{ color: '#d4af37' }}
                    formatter={(v: number) => [formatINR(v), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#d4af37" strokeWidth={2} fill="url(#goldFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* 3. Loading Party Balances */}
        <section className="rounded-lg border border-ink-700 bg-ink-950 p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-2 border-b border-ink-800 pb-2.5">
            <MapPinIcon className="h-4 w-4" /> Loading Party Balances (Ramapuram)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-ink-800 text-neutral-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 font-bold">Party Name</th>
                  <th className="py-2.5 font-bold">Location</th>
                  <th className="py-2.5 font-bold text-right">Total Purchased</th>
                  <th className="py-2.5 font-bold text-right">Paid</th>
                  <th className="py-2.5 font-bold text-right">Pending</th>
                  <th className="py-2.5 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {effectiveDashData.loadingPartyBalances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-neutral-500">
                      No loading parties registered in database.
                    </td>
                  </tr>
                ) : (
                  effectiveDashData.loadingPartyBalances.map(lp => (
                    <tr key={lp.id} className="border-b border-ink-850 hover:bg-ink-900/30 transition-colors">
                      <td className="py-3 font-semibold text-white">{lp.name}</td>
                      <td className="py-3 text-neutral-400">{lp.location}</td>
                      <td className="py-3 text-right font-mono text-neutral-300">{formatINR(lp.totalPurchased)}</td>
                      <td className="py-3 text-right font-bold text-green-400">{formatINR(lp.paid)}</td>
                      <td className="py-3 text-right font-bold text-amber-400">{formatINR(lp.pending)}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                          lp.pending === 0
                            ? 'bg-green-500/10 text-green-300 border border-green-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}>
                          {lp.pending === 0 ? 'Clear' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Unloading Party (Kerala Buyer) Balances */}
        <section className="rounded-lg border border-ink-700 bg-ink-950 p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-2 border-b border-ink-800 pb-2.5">
            <CoinsIcon className="h-4 w-4" /> Unloading Party Balances (Kerala Buyers)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-ink-800 text-neutral-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 font-bold">Buyer Name</th>
                  <th className="py-2.5 font-bold">District</th>
                  <th className="py-2.5 font-bold text-right">Orders</th>
                  <th className="py-2.5 font-bold text-right">Total Ordered</th>
                  <th className="py-2.5 font-bold text-right">Paid</th>
                  <th className="py-2.5 font-bold text-right">Pending</th>
                  <th className="py-2.5 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {effectiveDashData.unloadingPartyBalances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-neutral-500">
                      No unloading parties (buyers) registered in database.
                    </td>
                  </tr>
                ) : (
                  effectiveDashData.unloadingPartyBalances.map(up => (
                    <tr key={up.id} className="border-b border-ink-850 hover:bg-ink-900/30 transition-colors">
                      <td className="py-3 font-semibold text-white">{up.name}</td>
                      <td className="py-3">
                        <span className="inline-block rounded px-2 py-0.5 text-[9px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {up.district}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-neutral-350">{up.ordersCount || 0}</td>
                      <td className="py-3 text-right font-mono text-neutral-300">{formatINR(up.totalOrdered)}</td>
                      <td className="py-3 text-right font-bold text-green-400">{formatINR(up.paid)}</td>
                      <td className="py-3 text-right font-bold text-amber-400">{formatINR(up.pending)}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                          up.pending === 0
                            ? 'bg-green-500/10 text-green-300 border border-green-500/20'
                            : 'bg-red-500/10 text-red-300 border border-red-500/20'
                        }`}>
                          {up.pending === 0 ? 'Settled' : formatINR(up.pending) + ' due'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Recent Trips & Live Activity Feed */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Trips */}
          <div className="rounded-lg border border-ink-700 bg-ink-950 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-ink-800 pb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-2">
                <TruckIcon className="h-4 w-4" /> Recent Trips
              </h3>
              <Link to="/trips" className="text-[10px] font-medium text-gold hover:underline">View All</Link>
            </div>
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto ti-scroll">
              {effectiveDashData.recentTrips.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No trips recorded in database.
                </div>
              ) : (
                effectiveDashData.recentTrips.map(trip => {
                const driver = drivers.find(d => d.id === trip.driverId);
                const lorry = lorries.find(l => l.id === trip.lorryId);
                return (
                  <Link
                    key={trip.id}
                    to={`/trips/${trip.id}`}
                    className="block rounded border border-ink-800 bg-ink-900/60 p-3 hover:border-gold transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{trip.code}</span>
                      <span className="text-xs font-bold text-gold">{formatINR(trip.revenue)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-neutral-500">
                        {lorry?.plate || trip.lorryId} · {driver?.name || trip.driverId}
                      </span>
                      <TripStatusBadge status={trip.status as 'loading' | 'in-transit' | 'delivered' | 'paid'} />
                    </div>
                    <p className="text-[10px] text-neutral-600 mt-1">{trip.date}</p>
                  </Link>
                );
              }))}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="rounded-lg border border-ink-700 bg-ink-950 p-5 space-y-4">
            <div className="border-b border-ink-800 pb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-2">
                <ZapIcon className="h-4 w-4 animate-pulse" /> Live Activity Feed
              </h3>
            </div>
            {liveEvents.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <ActivityIcon className="h-8 w-8 text-neutral-700 mx-auto" />
                <p className="text-xs text-neutral-600">Waiting for live events...</p>
                <p className="text-[10px] text-neutral-700">Orders and dispatches will appear here in real-time</p>
              </div>
            ) : (
              <ul className="space-y-2.5 max-h-[280px] overflow-y-auto ti-scroll">
                <AnimatePresence>
                  {liveEvents.map(ev => (
                    <motion.li
                      key={ev.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2.5 bg-ink-900/60 border border-ink-850 rounded p-2.5"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      <div>
                        <p className="text-xs text-neutral-300">{ev.text}</p>
                        <p className="text-[10px] text-neutral-600">{ev.time}</p>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </section>

        {/* 6. Lorry & Driver Quick Overview */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-ink-700 bg-ink-950 p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-2 border-b border-ink-800 pb-2.5">
              <TruckIcon className="h-4 w-4" /> All Lorries
            </h3>
            <div className="space-y-2 max-h-[220px] overflow-y-auto ti-scroll">
              {lorries.map(lorry => (
                <div key={lorry.id} className="flex items-center justify-between bg-ink-900/60 border border-ink-850 rounded p-3">
                  <div>
                    <p className="text-xs font-semibold text-white">{lorry.plate}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{lorry.location}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                      lorry.status === 'active' ? 'bg-green-500/10 text-green-300 border border-green-500/20'
                      : lorry.status === 'idle' ? 'bg-neutral-500/10 text-neutral-300 border border-neutral-500/20'
                      : lorry.status === 'maintenance' ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}>{lorry.status}</span>
                    <p className="text-[10px] text-neutral-600 mt-0.5">{lorry.capacitySqft} sqft</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-ink-700 bg-ink-950 p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-2 border-b border-ink-800 pb-2.5">
              <UsersIcon className="h-4 w-4" /> All Drivers
            </h3>
            <div className="space-y-2 max-h-[220px] overflow-y-auto ti-scroll">
              {drivers.map(driver => (
                <div key={driver.id} className="flex items-center justify-between bg-ink-900/60 border border-ink-850 rounded p-3">
                  <div>
                    <p className="text-xs font-semibold text-white">{driver.name}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{driver.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                      driver.status === 'active' ? 'bg-green-500/10 text-green-300 border border-green-500/20'
                      : driver.status === 'idle' ? 'bg-neutral-500/10 text-neutral-300 border border-neutral-500/20'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}>{driver.status}</span>
                    <p className="text-[10px] text-neutral-600 mt-0.5">{driver.tripsCompleted} trips</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}