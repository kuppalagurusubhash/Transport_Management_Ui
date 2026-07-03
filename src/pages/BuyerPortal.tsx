import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  PlusIcon,
  Trash2Icon,
  ArrowLeftIcon,
  CheckCircle2Icon } from
'lucide-react';
import {
  unloadingParties,
  sellableSpecs,
  sizeToSqft,
  findDistrictRate,
  formatINR } from
'../data/mockData';
import {
  orderTotal,
  orderLineAmount,
  orderLineTotalSqft,
  type Finish,
  type OrderLine } from
'../data/types';
import { useOrders } from '../store/OrdersContext';
import { OrderStatusBadge } from '../components/ui/Badge';
interface DraftLine {
  key: string;
  specIndex: number;
  pieces: number;
}
export function BuyerPortal() {
  const { orders, placeOrder } = useOrders();
  // Simulate a logged-in buyer (auth deferred to a later pass).
  const [buyerId, setBuyerId] = useState(unloadingParties[0].id);
  const buyer = unloadingParties.find((b) => b.id === buyerId)!;
  const [lines, setLines] = useState<DraftLine[]>([
  {
    key: 'k1',
    specIndex: 0,
    pieces: 40
  }]
  );
  const [placed, setPlaced] = useState<string | null>(null);
  const myOrders = orders.
  filter((o) => o.unloadingPartyId === buyerId).
  sort((a, b) => +new Date(b.placedAt) - +new Date(a.placedAt));
  const computedLines = useMemo(
    () =>
    lines.map((l) => {
      const spec = sellableSpecs[l.specIndex];
      const rate =
      findDistrictRate(
        buyer.district,
        spec.size,
        spec.thickness,
        spec.finish as Finish
      ) ?? 0;
      const sqftPerPiece = sizeToSqft[spec.size] ?? 0;
      const totalSqft = sqftPerPiece * l.pieces;
      return {
        ...l,
        spec,
        rate,
        sqftPerPiece,
        totalSqft,
        amount: totalSqft * rate
      };
    }),
    [lines, buyer.district]
  );
  const total = computedLines.reduce((s, l) => s + l.amount, 0);
  const addLine = () =>
  setLines((prev) => [
  ...prev,
  {
    key: `k${Date.now()}`,
    specIndex: 0,
    pieces: 20
  }]
  );
  const removeLine = (key: string) =>
  setLines((prev) =>
  prev.length > 1 ? prev.filter((l) => l.key !== key) : prev
  );
  const updateLine = (key: string, patch: Partial<DraftLine>) =>
  setLines((prev) =>
  prev.map((l) =>
  l.key === key ?
  {
    ...l,
    ...patch
  } :
  l
  )
  );
  const submit = () => {
    const orderLines: OrderLine[] = computedLines.
    filter((l) => l.pieces > 0 && l.rate > 0).
    map((l, idx) => ({
      id: `ol${Date.now()}-${idx}`,
      size: l.spec.size,
      thickness: l.spec.thickness,
      finish: l.spec.finish as Finish,
      sqftPerPiece: l.sqftPerPiece,
      pieces: l.pieces,
      ratePerSqft: l.rate
    }));
    if (orderLines.length === 0) return;
    const order = placeOrder({
      unloadingPartyId: buyerId,
      district: buyer.district,
      lines: orderLines
    });
    setPlaced(order.code);
    setLines([
    {
      key: `k${Date.now()}`,
      specIndex: 0,
      pieces: 40
    }]
    );
    setTimeout(() => setPlaced(null), 4000);
  };
  return (
    <div className="min-h-screen w-full bg-ink-900 text-neutral-200">
      {/* Buyer header */}
      <header className="border-b border-ink-700 bg-ink-950 px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gold font-extrabold text-ink-950">
              TA
            </span>
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-tight text-white">
                TRANS IA — Buyer Portal
              </p>
              <p className="text-[11px] text-neutral-500">
                Place orders &amp; track your history
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Buyer switcher stands in for buyer login (deferred) */}
            <select
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              className="rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
              aria-label="Select buyer account">
              
              {unloadingParties.map((b) =>
              <option key={b.id} value={b.id}>
                  {b.name} ({b.district})
                </option>
              )}
            </select>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md border border-ink-700 px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white">
              
              <ArrowLeftIcon className="h-4 w-4" /> Owner view
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-5">
        {/* Order form */}
        <section className="lg:col-span-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">
            Place an Order
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Rates shown are for{' '}
            <span className="text-neutral-300">{buyer.district}</span> district.
          </p>

          <div className="mt-4 space-y-3">
            {computedLines.map((l) =>
            <div
              key={l.key}
              className="rounded-lg border border-ink-700 bg-ink-950 p-4">
              
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex-1">
                    <span className="mb-1 block text-[11px] uppercase tracking-wide text-neutral-500">
                      Stone
                    </span>
                    <select
                    value={l.specIndex}
                    onChange={(e) =>
                    updateLine(l.key, {
                      specIndex: Number(e.target.value)
                    })
                    }
                    className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none">
                    
                      {sellableSpecs.map((s, idx) =>
                    <option key={idx} value={idx}>
                          {s.size} · {s.thickness} · {s.finish}
                        </option>
                    )}
                    </select>
                  </label>
                  <label className="w-24">
                    <span className="mb-1 block text-[11px] uppercase tracking-wide text-neutral-500">
                      Pieces
                    </span>
                    <input
                    type="number"
                    min={0}
                    value={l.pieces}
                    onChange={(e) =>
                    updateLine(l.key, {
                      pieces: Number(e.target.value)
                    })
                    }
                    className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none" />
                  
                  </label>
                  <button
                  onClick={() => removeLine(l.key)}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-ink-700 text-neutral-500 transition-colors hover:text-red-300"
                  aria-label="Remove line">
                  
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-ink-800 pt-3 text-xs">
                  <span className="font-mono text-neutral-400">
                    {l.sqftPerPiece} sqft × {l.pieces} pcs = {l.totalSqft} sqft
                    × ₹{l.rate}
                  </span>
                  <span className="text-sm font-bold text-gold">
                    {formatINR(l.amount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={addLine}
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-dashed border-ink-600 px-3 py-2 text-xs font-medium text-neutral-400 transition-colors hover:text-white">
            
            <PlusIcon className="h-4 w-4" /> Add another stone
          </button>

          <div className="mt-6 flex items-center justify-between rounded-lg border border-ink-700 bg-ink-950 px-5 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                Order total
              </p>
              <p className="text-2xl font-extrabold text-gold">
                {formatINR(total)}
              </p>
            </div>
            <button
              onClick={submit}
              disabled={total <= 0}
              className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40">
              
              Place Order
            </button>
          </div>

          <AnimatePresence>
            {placed &&
            <motion.div
              initial={{
                opacity: 0,
                y: 8
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              exit={{
                opacity: 0
              }}
              className="mt-4 flex items-center gap-2 rounded-md border border-green-400/30 bg-green-400/10 px-4 py-3 text-sm text-green-300">
              
                <CheckCircle2Icon className="h-5 w-5" />
                Order {placed} placed — TRANS IA has been notified.
              </motion.div>
            }
          </AnimatePresence>
        </section>

        {/* Order history */}
        <section className="lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">
            Your Orders
          </h2>
          <div className="mt-4 space-y-3">
            {myOrders.length === 0 &&
            <p className="text-sm text-neutral-600">No orders yet.</p>
            }
            {myOrders.map((order) =>
            <div
              key={order.id}
              className="rounded-lg border border-ink-700 bg-ink-950 p-4">
              
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    {order.code}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="mt-1 text-[11px] text-neutral-600">
                  {formatDistanceToNow(new Date(order.placedAt), {
                  addSuffix: true
                })}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {order.lines.map((line) =>
                <li key={line.id} className="flex justify-between text-xs">
                      <span className="text-neutral-400">
                        {line.size} · {line.thickness} ·{' '}
                        {orderLineTotalSqft(line)} sqft
                      </span>
                      <span className="font-medium text-neutral-200">
                        {formatINR(orderLineAmount(line))}
                      </span>
                    </li>
                )}
                </ul>
                <div className="mt-3 flex justify-between border-t border-ink-800 pt-2">
                  <span className="text-xs text-neutral-500">Total</span>
                  <span className="text-sm font-bold text-gold">
                    {formatINR(orderTotal(order))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>);

}