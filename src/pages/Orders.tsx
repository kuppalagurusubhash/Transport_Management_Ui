import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { unloadingPartyById, formatINR } from '../data/mockData';
import {
  orderTotal,
  orderSqft,
  orderLineAmount,
  orderLineTotalSqft,
  type OrderStatus } from
'../data/types';
import { useOrders } from '../store/OrdersContext';
import { PageHeader } from '../components/layout/PageHeader';
import { OrderStatusBadge } from '../components/ui/Badge';
const statusFlow: OrderStatus[] = [
'placed',
'confirmed',
'dispatched',
'delivered',
'paid'];

const filters: Array<{
  key: 'all' | OrderStatus;
  label: string;
}> = [
{
  key: 'all',
  label: 'All'
},
{
  key: 'placed',
  label: 'New'
},
{
  key: 'confirmed',
  label: 'Confirmed'
},
{
  key: 'dispatched',
  label: 'Dispatched'
},
{
  key: 'delivered',
  label: 'Delivered'
},
{
  key: 'paid',
  label: 'Paid'
}];

export function Orders() {
  const { orders, setOrderStatus } = useOrders();
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const visible =
  filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const nextStatus = (s: OrderStatus): OrderStatus | null => {
    const i = statusFlow.indexOf(s);
    return i < statusFlow.length - 1 ? statusFlow[i + 1] : null;
  };
  const totalValue = orders.reduce((sum, o) => sum + orderTotal(o), 0);
  return (
    <div className="min-h-full">
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} orders from Kerala buyers · ${formatINR(totalValue)} value`} />
      
      <div className="p-6 sm:p-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((f) =>
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${filter === f.key ? 'border-gold bg-gold/10 text-gold' : 'border-ink-700 text-neutral-400 hover:text-white'}`}>
            
              {f.label}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {visible.length === 0 &&
          <p className="text-sm text-neutral-600">No orders in this view.</p>
          }
          {visible.map((order, i) => {
            const buyer = unloadingPartyById(order.unloadingPartyId);
            const next = nextStatus(order.status);
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
                  delay: i * 0.04
                }}
                className="overflow-hidden rounded-lg border border-ink-700 bg-ink-950">
                
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700 bg-ink-900/50 px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {order.code}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {buyer?.name} · {order.district} ·{' '}
                      {formatDistanceToNow(new Date(order.placedAt), {
                        addSuffix: true
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Order value
                      </p>
                      <p className="text-sm font-bold text-gold">
                        {formatINR(orderTotal(order))}
                      </p>
                    </div>
                    {next &&
                    <button
                      onClick={() => setOrderStatus(order.id, next)}
                      className="rounded-md bg-gold px-3 py-2 text-xs font-semibold text-ink-950 transition-colors hover:bg-gold-400">
                      
                        Mark {next}
                      </button>
                    }
                  </div>
                </div>

                <div className="ti-scroll overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-neutral-600">
                        <th className="px-4 py-2 font-medium">Stone</th>
                        <th className="px-4 py-2 font-medium">Calculation</th>
                        <th className="px-4 py-2 text-right font-medium">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.lines.map((line) =>
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
                            {orderLineTotalSqft(line)} sqft × ₹
                            {line.ratePerSqft}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gold">
                            {formatINR(orderLineAmount(line))}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t border-ink-700 px-4 py-2 text-xs text-neutral-500">
                  <span>
                    {orderSqft(order).toLocaleString('en-IN')} sqft total
                  </span>
                  <Link
                    to={`/unloading-parties/${order.unloadingPartyId}`}
                    className="text-gold hover:underline">
                    
                    View buyer
                  </Link>
                </div>
              </motion.div>);

          })}
        </div>
      </div>
    </div>);

}