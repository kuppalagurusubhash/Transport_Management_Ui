import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PhoneIcon, PlusIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { useOrders } from '../store/OrdersContext';
import { DriverModal } from '../components/ui/DriverModal';
import type { Driver } from '../data/types';

const statusStyles: Record<string, string> = {
  active: 'text-green-300',
  idle: 'text-amber-300',
  'off-duty': 'text-neutral-500'
};

export function Drivers() {
  const { drivers, lorries } = useOrders();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | undefined>(undefined);

  return (
    <div className="min-h-full">
      <PageHeader
        title="Drivers"
        subtitle={`${drivers.length} drivers on record`}
        action={
          <button
            onClick={() => {
              setEditingDriver(undefined);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-md bg-gold px-3.5 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400"
          >
            <PlusIcon className="h-4 w-4" /> Add Driver
          </button>
        }
      />

      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {drivers.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-neutral-500">
              No drivers registered in database. Click "Add Driver" to register a driver.
            </div>
          )}
          {drivers.map((d, i) => {
            const lorry = lorries.find((l) => l.id === d.lorryId);
            return (
              <motion.div
                key={d.id}
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
                className="rounded-lg border border-ink-700 bg-ink-950 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-700 text-sm font-bold text-gold">
                        {d.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                      <div>
                        <Link
                          to={`/drivers/${d.id}`}
                          className="font-bold text-white hover:text-gold transition-colors"
                        >
                          {d.name}
                        </Link>
                        <p className={`text-xs capitalize ${statusStyles[d.status]}`}>
                          {d.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  <dl className="mt-4 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Lorry</dt>
                      <dd className="text-neutral-200">
                        {lorry ? (
                          <Link to={`/fleet/${lorry.id}`} className="hover:text-gold hover:underline">
                            {lorry.plate}
                          </Link>
                        ) : (
                          'Unassigned'
                        )}
                      </dd>
                    </div>
                    {d.email && (
                      <div className="flex justify-between">
                        <dt className="text-neutral-500">Email</dt>
                        <dd className="text-neutral-200 truncate max-w-[65%]">{d.email}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Trips done</dt>
                      <dd className="text-neutral-200">{d.tripsCompleted}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-neutral-500">Contact</dt>
                      <dd className="flex items-center gap-1.5 text-neutral-200">
                        <PhoneIcon className="h-3.5 w-3.5 text-neutral-500" />
                        {d.phone}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/drivers/${d.id}`}
                    className="flex-1 text-center rounded-md border border-ink-700 py-1.5 text-xs font-semibold text-neutral-350 transition-colors hover:border-gold hover:text-gold"
                  >
                    View Logs
                  </Link>
                  <button
                    onClick={() => {
                      setEditingDriver(d);
                      setIsModalOpen(true);
                    }}
                    className="rounded-md border border-ink-700 px-3.5 py-1.5 text-xs font-semibold text-neutral-350 transition-colors hover:border-gold hover:text-gold"
                  >
                    Edit
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <DriverModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        driverToEdit={editingDriver}
      />
    </div>
  );
}