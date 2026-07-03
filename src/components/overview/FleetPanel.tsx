import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { lorries, driverById } from '../../data/mockData';
import { StatusDot, statusLabel } from '../ui/StatusDot';
import { SectionLabel } from '../ui/Card';
export function FleetPanel() {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-700 bg-ink-950 px-6 py-5">
        <SectionLabel>Fleet Status</SectionLabel>
        <p className="mt-1 text-xs text-neutral-500">
          {lorries.filter((l) => l.status === 'active').length} active ·{' '}
          {lorries.length} total
        </p>
      </div>

      <ul className="ti-scroll flex-1 overflow-y-auto py-2">
        {lorries.map((lorry, i) => {
          const driver = driverById(lorry.driverId);
          return (
            <motion.li
              key={lorry.id}
              initial={{
                opacity: 0,
                x: -8
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              transition={{
                duration: 0.25,
                delay: i * 0.03
              }}>
              
              <button
                onClick={() => navigate(`/fleet/${lorry.id}`)}
                className="flex w-full items-center gap-4 border-b border-ink-800 px-6 py-4 text-left transition-colors hover:bg-ink-800 focus:bg-ink-800 focus:outline-none">
                
                <StatusDot status={lorry.status} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">
                    {lorry.plate}
                  </span>
                  <span className="block truncate text-xs text-neutral-500">
                    {driver ? driver.name : statusLabel(lorry.status)} ·{' '}
                    {lorry.location}
                  </span>
                </span>
              </button>
            </motion.li>);

        })}
      </ul>
    </div>);

}