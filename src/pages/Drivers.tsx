import React from 'react';
import { motion } from 'framer-motion';
import { PhoneIcon } from 'lucide-react';
import { drivers, lorryById } from '../data/mockData';
import { PageHeader } from '../components/layout/PageHeader';
const statusStyles: Record<string, string> = {
  active: 'text-green-300',
  idle: 'text-amber-300',
  'off-duty': 'text-neutral-500'
};
export function Drivers() {
  return (
    <div className="min-h-full">
      <PageHeader
        title="Drivers"
        subtitle={`${drivers.length} drivers on record`} />
      
      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {drivers.map((d, i) => {
            const lorry = lorryById(d.lorryId);
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
                className="rounded-lg border border-ink-700 bg-ink-950 p-5">
                
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-700 text-sm font-bold text-gold">
                    {d.name.
                    split(' ').
                    map((n) => n[0]).
                    join('').
                    slice(0, 2)}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{d.name}</p>
                    <p
                      className={`text-xs capitalize ${statusStyles[d.status]}`}>
                      
                      {d.status}
                    </p>
                  </div>
                </div>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Lorry</dt>
                    <dd className="text-neutral-200">
                      {lorry?.plate ?? 'Unassigned'}
                    </dd>
                  </div>
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
              </motion.div>);

          })}
        </div>
      </div>
    </div>);

}