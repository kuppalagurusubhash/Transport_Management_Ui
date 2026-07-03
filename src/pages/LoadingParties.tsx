import React from 'react';
import { motion } from 'framer-motion';
import { loadingParties, formatINR } from '../data/mockData';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionLabel } from '../components/ui/Card';
export function LoadingParties() {
  const totalPending = loadingParties.reduce((s, p) => s + p.pending, 0);
  // Group by location so the owner can see loading parties per location.
  const byLocation = loadingParties.reduce<
    Record<string, typeof loadingParties>>(
    (acc, p) => {
      ;(acc[p.location] ||= []).push(p);
      return acc;
    }, {});
  const locations = Object.keys(byLocation).sort();
  return (
    <div className="min-h-full">
      <PageHeader
        title="Loading Parties"
        subtitle={`Ramapuram-area sellers · grouped by location · ${formatINR(totalPending)} payable`} />
      
      <div className="space-y-8 p-6 sm:p-8">
        {locations.map((loc) => {
          const group = byLocation[loc];
          const locPending = group.reduce((s, p) => s + p.pending, 0);
          return (
            <section key={loc}>
              <div className="mb-3 flex items-center justify-between">
                <SectionLabel>{loc}</SectionLabel>
                <span className="text-xs text-neutral-500">
                  {group.length} parties · {formatINR(locPending)} payable
                </span>
              </div>
              <div className="overflow-hidden rounded-lg border border-ink-700">
                <div className="ti-scroll overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-ink-700 bg-ink-950 text-xs uppercase tracking-[0.08em] text-neutral-500">
                        <th className="px-4 py-3 font-medium">Party</th>
                        <th className="px-4 py-3 text-right font-medium">
                          Purchased
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Paid
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Pending
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((p, i) =>
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
                        
                          <td className="px-4 py-4 font-semibold text-white">
                            {p.name}
                          </td>
                          <td className="px-4 py-4 text-right text-neutral-200">
                            {formatINR(p.totalPurchased)}
                          </td>
                          <td className="px-4 py-4 text-right text-green-300">
                            {formatINR(p.paid)}
                          </td>
                          <td className="px-4 py-4 text-right font-semibold text-gold">
                            {p.pending > 0 ? formatINR(p.pending) : '—'}
                          </td>
                        </motion.tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>);

        })}
      </div>
    </div>);

}