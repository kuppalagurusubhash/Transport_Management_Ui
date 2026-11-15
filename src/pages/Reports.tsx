import React from 'react';
import { useOrders } from '../store/OrdersContext';
import { formatINR } from '../utils/helpers';
import { FileTextIcon, TrendingUpIcon, DownloadIcon, CheckCircle2Icon } from 'lucide-react';

export function Reports() {
  const { trips, lorries } = useOrders();

  const reportItems = [
    { title: 'Monthly Revenue & P&L Statement', desc: 'Detailed profit and loss breakdown per route and quarry', date: 'September 2025', size: '2.4 MB' },
    { title: 'Fleet Fuel Consumption & Mileage Audit', desc: 'Liters per trip, diesel cost per km across all 12 lorries', date: 'September 2025', size: '1.8 MB' },
    { title: 'Quarry Loading & Worker Wages Ledger', desc: 'Hamali payments, loading slip audits from Ramapuram quarries', date: 'September 2025', size: '3.1 MB' },
    { title: 'Kerala District Price Compliance Report', desc: 'Comparison of invoiced rates vs district baseline rates', date: 'September 2025', size: '1.2 MB' }
  ];

  return (
    <div className="min-h-full space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Financial &amp; Fleet Reports
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400">
            Export tax summaries, fuel telemetry audits, and operational analytics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportItems.map((r, i) => (
          <div key={i} className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#13151a] p-5 shadow-xl hover:border-gold/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <FileTextIcon className="h-5 w-5" />
                </span>
                <span className="text-[10px] text-neutral-400">{r.date}</span>
              </div>
              <h3 className="text-base font-bold text-white">{r.title}</h3>
              <p className="text-xs text-neutral-400">{r.desc}</p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-3">
              <span className="text-[10px] text-neutral-500 font-mono">{r.size} &bull; PDF</span>
              <button
                onClick={() => alert(`Downloading ${r.title}...`)}
                className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-ink-950 hover:bg-gold-400 transition-colors cursor-pointer"
              >
                <DownloadIcon className="h-3.5 w-3.5" /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
