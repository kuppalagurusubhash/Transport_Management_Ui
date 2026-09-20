import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusIcon } from 'lucide-react';
import { formatINR } from '../utils/helpers';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionLabel } from '../components/ui/Card';
import { useOrders } from '../store/OrdersContext';
import { LoadingPartyModal } from '../components/ui/LoadingPartyModal';

export function LoadingParties() {
  const { loadingParties } = useOrders();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalPending = loadingParties.reduce((s, p) => s + p.pending, 0);

  // Group by location so the owner can see loading parties per location.
  const byLocation = loadingParties.reduce<Record<string, typeof loadingParties>>(
    (acc, p) => {
      (acc[p.location] ||= []).push(p);
      return acc;
    },
    {}
  );

  const locations = Object.keys(byLocation).sort();

  return (
    <div className="min-h-full">
      <PageHeader
        title="Loading Parties"
        subtitle={`Ramapuram-area sellers · grouped by location · ${formatINR(totalPending)} payable`}
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-gold px-3.5 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400"
          >
            <PlusIcon className="h-4 w-4" /> Add Loading Party
          </button>
        }
      />

      <div className="space-y-8 p-6 sm:p-8">
        {locations.length === 0 && (
          <div className="py-12 text-center text-sm text-neutral-500">
            No loading parties (quarries/crushers) registered in database. Click "Add Loading Party" to add one.
          </div>
        )}
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
                        <th className="px-4 py-3 text-right font-medium">Purchased</th>
                        <th className="px-4 py-3 text-right font-medium">Paid</th>
                        <th className="px-4 py-3 text-right font-medium">Pending</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((p, i) => (
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
                          className="border-b border-ink-800 bg-ink-900 last:border-0 hover:bg-ink-850"
                        >
                          <td className="px-4 py-4 font-semibold text-white">
                            <Link
                              to={`/loading-parties/${p.id}`}
                              className="hover:text-gold hover:underline"
                            >
                              {p.name}
                            </Link>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <LoadingPartyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}