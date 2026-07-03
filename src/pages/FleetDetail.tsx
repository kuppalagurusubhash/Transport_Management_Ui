import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import {
  lorries,
  trips,
  driverById,
  unloadingPartyById,
  formatINR } from
'../data/mockData';
import { tripRevenue, tripExpenseTotal } from '../data/types';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, SectionLabel } from '../components/ui/Card';
import { StatusDot, statusLabel } from '../components/ui/StatusDot';
import { TripStatusBadge } from '../components/ui/Badge';
export function FleetDetail() {
  const { lorryId } = useParams();
  const lorry = lorries.find((l) => l.id === lorryId);
  if (!lorry) {
    return (
      <div className="p-8">
        <p className="text-neutral-400">Lorry not found.</p>
        <Link
          to="/fleet"
          className="mt-2 inline-block text-gold hover:underline">
          
          Back to fleet
        </Link>
      </div>);

  }
  const driver = driverById(lorry.driverId);
  const lorryTrips = trips.filter((t) => t.lorryId === lorry.id);
  const maintenance = lorryTrips.flatMap((t) =>
  t.expenses.
  filter((e) => /repair|tyre|service|maintenance/i.test(e.label)).
  map((e) => ({
    ...e,
    tripCode: t.code,
    date: t.date
  }))
  );
  return (
    <div className="min-h-full">
      <PageHeader
        title={lorry.plate}
        subtitle={lorry.location}
        action={<StatusDot status={lorry.status} withLabel />} />
      
      <div className="p-6 sm:p-8">
        <Link
          to="/fleet"
          className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white">
          
          <ArrowLeftIcon className="h-4 w-4" /> All lorries
        </Link>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <SectionLabel>Driver</SectionLabel>
            <p className="mt-2 text-sm font-semibold text-white">
              {driver?.name ?? '—'}
            </p>
          </Card>
          <Card className="p-4">
            <SectionLabel>Status</SectionLabel>
            <p className="mt-2 text-sm font-semibold text-white">
              {statusLabel(lorry.status)}
            </p>
          </Card>
          <Card className="p-4">
            <SectionLabel>Capacity</SectionLabel>
            <p className="mt-2 text-sm font-semibold text-white">
              {lorry.capacitySqft.toLocaleString('en-IN')} sqft
            </p>
          </Card>
          <Card className="p-4">
            <SectionLabel>Total Trips</SectionLabel>
            <p className="mt-2 text-sm font-semibold text-white">
              {lorryTrips.length}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <SectionLabel>Trip History</SectionLabel>
            <div className="mt-4 space-y-3">
              {lorryTrips.length === 0 &&
              <p className="text-sm text-neutral-600">No trips recorded.</p>
              }
              {lorryTrips.map((t) => {
                const dest = unloadingPartyById(t.unloadingPartyId);
                return (
                  <Link key={t.id} to={`/trips/${t.id}`}>
                    <Card className="p-4 transition-colors hover:border-gold">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">
                          {t.code}
                        </span>
                        <TripStatusBadge status={t.status} />
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {t.origin} → {dest?.district} · {t.date}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-gold">
                        {formatINR(tripRevenue(t))}
                      </p>
                    </Card>
                  </Link>);

              })}
            </div>
          </div>

          <div>
            <SectionLabel>Maintenance Cost History</SectionLabel>
            <Card className="mt-4 overflow-hidden">
              {maintenance.length === 0 ?
              <p className="px-4 py-6 text-sm text-neutral-600">
                  No maintenance costs logged.
                </p> :

              <ul className="divide-y divide-ink-800">
                  {maintenance.map((m) =>
                <li
                  key={m.id}
                  className="flex items-center justify-between px-4 py-3">
                  
                      <div>
                        <p className="text-sm text-white">{m.label}</p>
                        <p className="text-xs text-neutral-600">
                          {m.tripCode} · {m.date}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-neutral-200">
                        {formatINR(m.amount)}
                      </span>
                    </li>
                )}
                </ul>
              }
            </Card>
          </div>
        </div>
      </div>
    </div>);

}