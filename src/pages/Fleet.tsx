import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusIcon } from 'lucide-react';
import type { Lorry } from '../data/types';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusDot, statusLabel } from '../components/ui/StatusDot';
import { useOrders } from '../store/OrdersContext';
import { LorryModal } from '../components/ui/LorryModal';

export function Fleet() {
  const { lorries: fleet, retireLorry: contextRetireLorry, drivers } = useOrders();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLorry, setEditingLorry] = useState<Lorry | undefined>(undefined);

  const retire = (id: string) => {
    contextRetireLorry(id);
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title="Fleet"
        subtitle={`${fleet.filter((l) => l.status !== 'sold').length} lorries in service`}
        action={
          <button
            onClick={() => {
              setEditingLorry(undefined);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-md bg-gold px-3.5 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400"
          >
            <PlusIcon className="h-4 w-4" /> Add Lorry
          </button>
        }
      />

      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {fleet.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-neutral-500">
              No lorries registered in database. Click "Add Lorry" to register your first vehicle.
            </div>
          )}
          {fleet.map((lorry, i) => {
            const driver = drivers.find((d) => d.id === lorry.driverId);
            return (
              <motion.div
                key={lorry.id}
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: i * 0.03
                }}
                className={`rounded-lg border border-ink-700 bg-ink-950 p-5 ${lorry.status === 'sold' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <Link
                    to={`/fleet/${lorry.id}`}
                    className="text-base font-bold text-white hover:text-gold"
                  >
                    {lorry.plate}
                  </Link>
                  <StatusDot status={lorry.status} withLabel />
                </div>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Driver</dt>
                    <dd className="text-neutral-200">{driver?.name ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Location</dt>
                    <dd className="max-w-[60%] truncate text-right text-neutral-200">
                      {lorry.location}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Capacity</dt>
                    <dd className="text-neutral-200">
                      {lorry.capacitySqft.toLocaleString('en-IN')} sqft
                    </dd>
                  </div>
                </dl>

                {lorry.status !== 'sold' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingLorry(lorry);
                        setIsModalOpen(true);
                      }}
                      className="flex-1 rounded-md border border-ink-700 py-1.5 text-xs font-semibold text-neutral-350 transition-colors hover:border-gold hover:text-gold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => retire(lorry.id)}
                      className="rounded-md border border-ink-700 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:border-red-500/40 hover:text-red-300"
                    >
                      Retire
                    </button>
                  </div>
                )}
                {lorry.status === 'sold' && (
                  <p className="mt-4 text-center text-xs uppercase tracking-wide text-neutral-600">
                    {statusLabel('sold')}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <LorryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lorryToEdit={editingLorry}
      />
    </div>
  );
}