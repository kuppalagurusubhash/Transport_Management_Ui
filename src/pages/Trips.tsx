import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  trips,
  lorries,
  driverById,
  unloadingPartyById,
  formatINR } from
'../data/mockData';
import { tripRevenue, tripPending, tripSqft } from '../data/types';
import { PageHeader } from '../components/layout/PageHeader';
import { TripStatusBadge } from '../components/ui/Badge';
export function Trips() {
  return (
    <div className="min-h-full">
      <PageHeader
        title="Trips"
        subtitle="Every load from Ramapuram to Kerala buyers" />
      
      <div className="p-6 sm:p-8">
        <div className="overflow-hidden rounded-lg border border-ink-700">
          <div className="ti-scroll overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-700 bg-ink-950 text-xs uppercase tracking-[0.08em] text-neutral-500">
                  <th className="px-4 py-3 font-medium">Trip</th>
                  <th className="px-4 py-3 font-medium">Lorry / Driver</th>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Sqft</th>
                  <th className="px-4 py-3 text-right font-medium">Revenue</th>
                  <th className="px-4 py-3 text-right font-medium">Pending</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip, i) => {
                  const lorry = lorries.find((l) => l.id === trip.lorryId);
                  const driver = driverById(trip.driverId);
                  const dest = unloadingPartyById(trip.unloadingPartyId);
                  return (
                    <motion.tr
                      key={trip.id}
                      initial={{
                        opacity: 0
                      }}
                      animate={{
                        opacity: 1
                      }}
                      transition={{
                        delay: i * 0.04
                      }}
                      className="border-b border-ink-800 bg-ink-900 transition-colors last:border-0 hover:bg-ink-850">
                      
                      <td className="px-4 py-4">
                        <Link
                          to={`/trips/${trip.id}`}
                          className="font-semibold text-white hover:text-gold">
                          
                          {trip.code}
                        </Link>
                        <p className="text-xs text-neutral-600">{trip.date}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-white">{lorry?.plate}</p>
                        <p className="text-xs text-neutral-500">
                          {driver?.name}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-neutral-400">
                        {trip.origin} → {dest?.name}
                        <p className="text-xs text-neutral-600">
                          {dest?.district}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-neutral-300">
                        {tripSqft(trip).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-gold">
                        {formatINR(tripRevenue(trip))}
                      </td>
                      <td className="px-4 py-4 text-right text-neutral-300">
                        {tripPending(trip) > 0 ?
                        formatINR(tripPending(trip)) :
                        '—'}
                      </td>
                      <td className="px-4 py-4">
                        <TripStatusBadge status={trip.status} />
                      </td>
                    </motion.tr>);

                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>);

}