import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid } from
'recharts';
import {
  trips,
  lorries,
  loadingParties,
  unloadingParties,
  recentActivity,
  revenueTrend,
  driverById,
  unloadingPartyById,
  formatINR } from
'../data/mockData';
import { tripRevenue, tripPending, tripSqft, orderTotal } from '../data/types';
import { useOrders } from '../store/OrdersContext';
import { KpiCard } from '../components/overview/KpiCard';
import { FleetPanel } from '../components/overview/FleetPanel';
import { SectionLabel } from '../components/ui/Card';
import { TripStatusBadge, OrderStatusBadge } from '../components/ui/Badge';
export function Overview() {
  const { orders } = useOrders();
  const totalRevenue =
  trips.reduce((s, t) => s + tripRevenue(t), 0) +
  // include historical baseline for a realistic monthly figure
  234500;
  const pending =
  trips.reduce((s, t) => s + tripPending(t), 0) +
  loadingParties.reduce((s, p) => s + p.pending, 0) +
  unloadingParties.reduce((s, p) => s + p.pending, 0);
  const activeTrips = trips.filter(
    (t) => t.status === 'in-transit' || t.status === 'loading'
  ).length;
  const sqftMoved = trips.reduce((s, t) => s + tripSqft(t), 0);
  const newOrders = orders.filter(
    (o) => o.status === 'placed' || o.status === 'confirmed'
  );
  const kpis = [
  {
    label: 'Total Revenue',
    value: formatINR(totalRevenue),
    subtext: 'This month'
  },
  {
    label: 'Pending Amount',
    value: formatINR(pending),
    subtext: 'Awaiting payment'
  },
  {
    label: 'Open Orders',
    value: String(newOrders.length),
    subtext: 'Awaiting dispatch'
  },
  {
    label: 'Active Trips',
    value: String(activeTrips),
    subtext: 'In progress'
  }];

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="border-b border-ink-700 bg-ink-950 px-6 py-6 sm:px-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">
          TRANS IA
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Owner Dashboard — Fleet &amp; Analytics
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left column: fleet */}
        <div className="border-b border-ink-700 lg:w-[360px] lg:flex-shrink-0 lg:border-b-0 lg:border-r">
          <FleetPanel />
        </div>

        {/* Right column: analytics + trips */}
        <div className="ti-scroll min-w-0 flex-1 overflow-y-auto">
          <section className="border-b border-ink-700 px-6 py-6 sm:px-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((k, i) =>
              <KpiCard key={k.label} index={i} {...k} />
              )}
            </div>
          </section>

          <section className="border-b border-ink-700 px-6 py-6 sm:px-8">
            <div className="mb-4 flex items-center justify-between">
              <SectionLabel>Revenue Trend</SectionLabel>
              <span className="text-xs text-neutral-500">
                {sqftMoved.toLocaleString('en-IN')} sqft in active loads
              </span>
            </div>
            <div className="h-56 w-full rounded-lg border border-ink-700 bg-ink-950 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueTrend}
                  margin={{
                    top: 8,
                    right: 8,
                    left: -12,
                    bottom: 0
                  }}>
                  
                  <defs>
                    <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#d4af37"
                        stopOpacity={0.35} />
                      
                      <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2a2a2a" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#666"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false} />
                  
                  <YAxis
                    stroke="#666"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v / 1000}k`} />
                  
                  <Tooltip
                    contentStyle={{
                      background: '#0f0f0f',
                      border: '1px solid #2a2a2a',
                      borderRadius: 8,
                      color: '#e8e8e8'
                    }}
                    labelStyle={{
                      color: '#d4af37'
                    }}
                    formatter={(v: number) => [formatINR(v), 'Revenue']} />
                  
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#d4af37"
                    strokeWidth={2}
                    fill="url(#goldFill)" />
                  
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="border-b border-ink-700 px-6 py-6 sm:px-8">
            <div className="mb-4 flex items-center justify-between">
              <SectionLabel>Incoming Orders</SectionLabel>
              <Link
                to="/orders"
                className="text-xs font-medium text-gold hover:underline">
                
                Manage orders
              </Link>
            </div>
            {orders.slice(0, 4).length === 0 ?
            <p className="text-sm text-neutral-600">No orders yet.</p> :

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {orders.slice(0, 4).map((order, i) => {
                const buyer = unloadingPartyById(order.unloadingPartyId);
                return (
                  <motion.div
                    key={order.id}
                    initial={{
                      opacity: 0,
                      y: 10
                    }}
                    animate={{
                      opacity: 1,
                      y: 0
                    }}
                    transition={{
                      duration: 0.3,
                      delay: i * 0.05
                    }}>
                    
                      <Link
                      to="/orders"
                      className="block rounded-lg border border-ink-700 bg-ink-950 p-4 transition-colors hover:border-gold">
                      
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <span className="text-sm font-semibold text-white">
                            {order.code}
                          </span>
                          <span className="text-sm font-bold text-gold">
                            {formatINR(orderTotal(order))}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500">
                          {buyer?.name} · {order.district}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-neutral-600">
                            {order.lines.length} stone
                            {order.lines.length > 1 ? ' types' : ' type'}
                          </span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                      </Link>
                    </motion.div>);

              })}
              </div>
            }
          </section>

          <section className="px-6 py-6 sm:px-8">
            <div className="mb-4 flex items-center justify-between">
              <SectionLabel>Recent Trips</SectionLabel>
              <Link
                to="/trips"
                className="text-xs font-medium text-gold hover:underline">
                
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {trips.map((trip, i) => {
                const driver = driverById(trip.driverId);
                const dest = unloadingPartyById(trip.unloadingPartyId);
                const first = trip.stoneLines[0];
                const lorry = lorries.find((l) => l.id === trip.lorryId);
                return (
                  <motion.div
                    key={trip.id}
                    initial={{
                      opacity: 0,
                      y: 10
                    }}
                    animate={{
                      opacity: 1,
                      y: 0
                    }}
                    transition={{
                      duration: 0.3,
                      delay: i * 0.05
                    }}>
                    
                    <Link
                      to={`/trips/${trip.id}`}
                      className="block rounded-lg border border-ink-700 bg-ink-950 p-4 transition-colors hover:border-gold">
                      
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <span className="text-sm font-semibold text-white">
                          {lorry?.plate}
                        </span>
                        <span className="text-sm font-bold text-gold">
                          {formatINR(tripRevenue(trip))}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        Driver: {driver?.name}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {trip.origin} → {dest?.district}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-neutral-600">
                          {first ?
                          `${first.size} ${first.thickness} ${first.finish}` :
                          '—'}
                          {trip.stoneLines.length > 1 &&
                          ` +${trip.stoneLines.length - 1}`}
                        </span>
                        <TripStatusBadge status={trip.status} />
                      </div>
                    </Link>
                  </motion.div>);

              })}
            </div>

            {/* Activity feed */}
            <div className="mt-8">
              <SectionLabel>Recent Activity</SectionLabel>
              <ul className="mt-4 space-y-3">
                {recentActivity.map((a) =>
                <li key={a.id} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold" />
                    <div className="flex-1">
                      <p className="text-sm text-neutral-300">{a.message}</p>
                      <p className="text-xs text-neutral-600">{a.time}</p>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>);

}