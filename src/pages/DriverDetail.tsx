import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PhoneIcon,
  CalendarIcon,
  AwardIcon,
  HistoryIcon,
  FileSpreadsheetIcon
} from 'lucide-react';
import { useOrders } from '../store/OrdersContext';
import { DriverModal } from '../components/ui/DriverModal';
import { formatINR } from '../utils/helpers';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, SectionLabel } from '../components/ui/Card';

export function DriverDetail() {
  const { driverId } = useParams();
  const { drivers, trips, lorries, unloadingParties } = useOrders();

  const driver = useMemo(() => {
    return drivers.find((d) => d.id === driverId);
  }, [drivers, driverId]);

  const assignedLorry = useMemo(() => {
    if (!driver) return null;
    return lorries.find((l) => l.id === driver.lorryId || l.driverId === driver.id);
  }, [driver, lorries]);

  // Tab State: trips or expenses
  const [activeTab, setActiveTab] = useState<'trips' | 'expenses'>('trips');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Completed trips for this driver
  const driverTrips = useMemo(() => {
    if (!driver) return [];
    return trips.filter((t) => t.driverId === driver.id);
  }, [trips, driver]);

  // Historical expenses logged on trips
  const driverExpenses = useMemo(() => {
    return driverTrips.flatMap((t) =>
      t.expenses.map((e) => ({
        ...e,
        tripCode: t.code,
        tripDate: t.date
      }))
    );
  }, [driverTrips]);

  if (!driver) {
    return (
      <div className="p-6 text-center text-neutral-400">
        <p>Driver not found</p>
        <Link to="/drivers" className="mt-4 inline-block text-gold hover:underline">
          Back to Drivers list
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title={driver.name}
        subtitle={`Driver ID: ${driver.id}`}
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-md border border-ink-700 bg-ink-950 px-3.5 py-1.5 text-xs font-semibold text-neutral-350 transition-colors hover:border-gold hover:text-gold"
          >
            Edit Profile
          </button>
        }
      />

      <div className="p-6 sm:p-8">
        <Link
          to="/drivers"
          className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" /> All drivers
        </Link>

        {/* Overview Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <SectionLabel>Status</SectionLabel>
            <span
              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase border ${
                driver.status === 'active'
                  ? 'bg-green-500/10 text-green-300 border-green-500/20'
                  : driver.status === 'idle'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
              }`}
            >
              {driver.status}
            </span>
          </Card>

          <Card className="p-4">
            <SectionLabel>Assigned Lorry</SectionLabel>
            <p className="mt-2 text-sm font-semibold text-white">
              {assignedLorry ? (
                <Link to={`/fleet/${assignedLorry.id}`} className="text-gold hover:underline">
                  {assignedLorry.plate}
                </Link>
              ) : (
                'Unassigned'
              )}
            </p>
          </Card>

          <Card className="p-4">
            <SectionLabel>Joined Date</SectionLabel>
            <p className="mt-2 text-sm font-semibold text-white flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-neutral-500" />
              {driver.joinedOn}
            </p>
          </Card>

          <Card className="p-4">
            <SectionLabel>Career Stats</SectionLabel>
            <p className="mt-2 text-sm font-semibold text-white flex items-center gap-1.5">
              <AwardIcon className="h-4 w-4 text-neutral-500" />
              {driver.tripsCompleted} completed trips
            </p>
          </Card>
        </div>

        {/* Contact Info Card */}
        <Card className="p-5 mb-6 space-y-3">
          <SectionLabel>Contact Details &amp; Credentials</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-300">
            <div className="flex items-center gap-2">
              <PhoneIcon className="h-4 w-4 text-neutral-500" />
              <span className="text-neutral-500">Phone:</span>
              <span className="font-semibold text-white">{driver.phone}</span>
            </div>
            {driver.email && (
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">Email:</span>
                <span className="font-semibold text-white">{driver.email}</span>
              </div>
            )}
          </div>
        </Card>

        {/* History Tabs */}
        <div className="rounded-lg border border-ink-700 bg-ink-950 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-ink-800 pb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('trips')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                  activeTab === 'trips'
                    ? 'bg-gold text-ink-950'
                    : 'text-neutral-400 hover:bg-ink-800 hover:text-white'
                }`}
              >
                <HistoryIcon className="inline h-3.5 w-3.5 mr-1" /> Trip History ({driverTrips.length})
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                  activeTab === 'expenses'
                    ? 'bg-gold text-ink-950'
                    : 'text-neutral-400 hover:bg-ink-800 hover:text-white'
                }`}
              >
                <FileSpreadsheetIcon className="inline h-3.5 w-3.5 mr-1" /> Logged Expenses ({driverExpenses.length})
              </button>
            </div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold">
              Archived Logs
            </span>
          </div>

          <div className="min-h-[200px]">
            {activeTab === 'trips' ? (
              <div className="space-y-3">
                {driverTrips.length === 0 ? (
                  <p className="text-xs text-neutral-600 italic">No trips recorded for this driver.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-ink-800 text-neutral-500 uppercase tracking-wider">
                          <th className="py-2.5 font-bold">Trip Date</th>
                          <th className="py-2.5 font-bold">Trip Code</th>
                          <th className="py-2.5 font-bold">Destination</th>
                          <th className="py-2.5 font-bold">Specs Load</th>
                          <th className="py-2.5 font-bold text-right">Lorry Expenses</th>
                          <th className="py-2.5 font-bold text-right">Trip Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {driverTrips.map((t) => {
                          const buyer = unloadingParties.find((up) => up.id === t.unloadingPartyId);
                          const totalExpenses = t.expenses.reduce((s, e) => s + e.amount, 0);
                          const piecesLoaded = t.stoneLines.reduce((acc, line) => acc + line.pieces, 0);
                          return (
                            <tr key={t.id} className="border-b border-ink-850 hover:bg-ink-900/30 transition-colors">
                              <td className="py-3 text-neutral-400">{t.date}</td>
                              <td className="py-3 font-semibold text-white">
                                <Link to={`/trips/${t.id}`} className="hover:text-gold hover:underline">
                                  {t.code}
                                </Link>
                              </td>
                              <td className="py-3 text-neutral-300">
                                {buyer ? `${buyer.name} (${buyer.district})` : '—'}
                              </td>
                              <td className="py-3 text-neutral-400">
                                {piecesLoaded} pcs ({t.stoneLines.length} specs)
                              </td>
                              <td className="py-3 text-right font-semibold text-neutral-300">
                                {formatINR(totalExpenses)}
                              </td>
                              <td className="py-3 text-right">
                                <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  t.status === 'delivered' || t.status === 'paid'
                                    ? 'bg-green-500/10 text-green-300 border border-green-500/20'
                                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                }`}>
                                  {t.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {driverExpenses.length === 0 ? (
                  <p className="text-xs text-neutral-600 italic">No expenses logged yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-ink-800 text-neutral-500 uppercase tracking-wider">
                          <th className="py-2.5 font-bold">Trip Date</th>
                          <th className="py-2.5 font-bold">Trip Code</th>
                          <th className="py-2.5 font-bold">Particular Label</th>
                          <th className="py-2.5 font-bold text-right">Amount (₹)</th>
                          <th className="py-2.5 font-bold text-right">Audit Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {driverExpenses.map((exp, idx) => (
                          <tr key={idx} className="border-b border-ink-850 hover:bg-ink-900/30 transition-colors">
                            <td className="py-3 text-neutral-400">{exp.tripDate}</td>
                            <td className="py-3 font-semibold text-white">{exp.tripCode}</td>
                            <td className="py-3 text-neutral-300">{exp.label}</td>
                            <td className="py-3 text-right font-bold text-neutral-300">
                              {formatINR(exp.amount)}
                            </td>
                            <td className="py-3 text-right">
                              <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                exp.review === 'approved'
                                  ? 'bg-green-500/10 text-green-300 border border-green-500/20'
                                  : exp.review === 'flagged'
                                  ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                                  : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                              }`}>
                                {exp.review}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <DriverModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        driverToEdit={driver}
      />
    </div>
  );
}
