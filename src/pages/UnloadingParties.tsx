import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatINR } from '../utils/helpers';
import { orderTotal, orderPending } from '../data/types';
import { useOrders } from '../store/OrdersContext';
import { PageHeader } from '../components/layout/PageHeader';
export function UnloadingParties() {
  const { orders, unloadingParties } = useOrders();
  const rows = unloadingParties.map((p) => {
    const partyOrders = orders.filter((o) => o.unloadingPartyId === p.id);
    return {
      ...p,
      orderCount: partyOrders.length,
      ordered: partyOrders.reduce((s, o) => s + orderTotal(o), 0),
      pending: partyOrders.reduce((s, o) => s + orderPending(o), 0)
    };
  });
  const totalPending = rows.reduce((s, p) => s + p.pending, 0);
  return (
    <div className="min-h-full">
      <PageHeader
        title="Unloading Parties"
        subtitle={`Kerala buyers · ${formatINR(totalPending)} receivable`} />
      
      <div className="p-6 sm:p-8">
        <div className="overflow-hidden rounded-lg border border-ink-700">
          <div className="ti-scroll overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-700 bg-ink-950 text-xs uppercase tracking-[0.08em] text-neutral-500">
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">District</th>
                  <th className="px-4 py-3 text-right font-medium">Orders</th>
                  <th className="px-4 py-3 text-right font-medium">Ordered</th>
                  <th className="px-4 py-3 text-right font-medium">Pending</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-neutral-500">
                      No unloading parties (Kerala buyers) registered in database.
                    </td>
                  </tr>
                )}
                {rows.map((p, i) =>
                <motion.tr
                  key={p.id}
                  initial={{
                    opacity: 0
                  }}
                  animate={{
                    opacity: 1
                  }}
                  transition={{
                    delay: i * 0.04
                  }}
                  className="border-b border-ink-800 bg-ink-900 last:border-0 hover:bg-ink-850">
                  
                    <td className="px-4 py-4">
                      <Link
                      to={`/unloading-parties/${p.id}`}
                      className="font-semibold text-white hover:text-gold">
                      
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-neutral-400">{p.district}</td>
                    <td className="px-4 py-4 text-right text-neutral-300">
                      {p.orderCount}
                    </td>
                    <td className="px-4 py-4 text-right text-neutral-200">
                      {formatINR(p.ordered)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-gold">
                      {p.pending > 0 ? formatINR(p.pending) : '—'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                      to={`/unloading-parties/${p.id}`}
                      className="text-xs text-gold hover:underline">
                      
                        View
                      </Link>
                    </td>
                  </motion.tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>);

}