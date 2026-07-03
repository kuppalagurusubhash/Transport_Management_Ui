import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusIcon, XIcon } from 'lucide-react';
import { lorries as seedLorries, driverById } from '../data/mockData';
import type { Lorry, LorryStatus } from '../data/types';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusDot, statusLabel } from '../components/ui/StatusDot';
export function Fleet() {
  const [fleet, setFleet] = useState<Lorry[]>(seedLorries);
  const [adding, setAdding] = useState(false);
  const [plate, setPlate] = useState('');
  const addLorry = () => {
    if (!plate.trim()) return;
    setFleet((prev) => [
    {
      id: `l${Date.now()}`,
      plate: plate.trim().toUpperCase(),
      driverId: null,
      status: 'idle',
      location: 'Depot — Ramapuram',
      capacitySqft: 1800,
      addedOn: new Date().toISOString().slice(0, 10)
    },
    ...prev]
    );
    setPlate('');
    setAdding(false);
  };
  const retire = (id: string) =>
  setFleet((prev) =>
  prev.map((l) =>
  l.id === id ?
  {
    ...l,
    status: 'sold' as LorryStatus,
    driverId: null
  } :
  l
  )
  );
  return (
    <div className="min-h-full">
      <PageHeader
        title="Fleet"
        subtitle={`${fleet.filter((l) => l.status !== 'sold').length} lorries in service`}
        action={
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-md bg-gold px-3.5 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400">
          
            <PlusIcon className="h-4 w-4" /> Add Lorry
          </button>
        } />
      

      <div className="p-6 sm:p-8">
        {adding &&
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-ink-700 bg-ink-950 p-4">
            <input
            autoFocus
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addLorry()}
            placeholder="e.g. KL-09 XY 1234"
            className="flex-1 rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none" />
          
            <button
            onClick={addLorry}
            className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-gold-400">
            
              Save
            </button>
            <button
            onClick={() => setAdding(false)}
            className="rounded-md border border-ink-700 px-3 py-2 text-neutral-400 hover:text-white">
            
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        }

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {fleet.map((lorry, i) => {
            const driver = driverById(lorry.driverId);
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
                className={`rounded-lg border border-ink-700 bg-ink-950 p-5 ${lorry.status === 'sold' ? 'opacity-60' : ''}`}>
                
                <div className="flex items-start justify-between">
                  <Link
                    to={`/fleet/${lorry.id}`}
                    className="text-base font-bold text-white hover:text-gold">
                    
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
                {lorry.status !== 'sold' &&
                <button
                  onClick={() => retire(lorry.id)}
                  className="mt-4 w-full rounded-md border border-ink-700 py-2 text-xs font-medium text-neutral-400 transition-colors hover:border-red-500/40 hover:text-red-300">
                  
                    Mark as Sold / Retired
                  </button>
                }
                {lorry.status === 'sold' &&
                <p className="mt-4 text-center text-xs uppercase tracking-wide text-neutral-600">
                    {statusLabel('sold')}
                  </p>
                }
              </motion.div>);

          })}
        </div>
      </div>
    </div>);

}