import React, { useState, useEffect, useMemo } from 'react';
import { XIcon, PlusIcon, Trash2Icon, ShoppingBagIcon } from 'lucide-react';
import { useOrders } from '../../store/OrdersContext';
import { sizeToSqft, formatINR } from '../../utils/helpers';
import { Finish, OrderLine } from '../../data/types';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DraftLine {
  key: string;
  specIndex: number;
  pieces: number;
}

export function CreateOrderModal({ isOpen, onClose }: CreateOrderModalProps) {
  const { unloadingParties, districtRates, placeOrder } = useOrders();

  const sellableSpecs = useMemo(() => {
    return Array.from(
      new Map(
        districtRates.map((r) => [
          `${r.size}-${r.thickness}-${r.finish}`,
          { size: r.size, thickness: r.thickness, finish: r.finish }
        ])
      ).values()
    );
  }, [districtRates]);

  const [selectedBuyerId, setSelectedBuyerId] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([
    {
      key: 'k1',
      specIndex: 0,
      pieces: 40,
    },
  ]);

  // Set default buyer when open
  useEffect(() => {
    if (isOpen && unloadingParties.length > 0) {
      setSelectedBuyerId(unloadingParties[0].id);
      setLines([
        {
          key: 'k1',
          specIndex: 0,
          pieces: 40,
        },
      ]);
    }
  }, [isOpen, unloadingParties]);

  const selectedBuyer = useMemo(() => {
    return unloadingParties.find((b) => b.id === selectedBuyerId) || unloadingParties[0];
  }, [selectedBuyerId, unloadingParties]);

  const computedLines = useMemo(() => {
    if (!selectedBuyer) return [];
    return lines.map((l) => {
      const spec = sellableSpecs[l.specIndex];
      if (!spec) {
        return {
          ...l,
          spec: { size: '2x2', thickness: '40mm', finish: 'polish' },
          rate: 0,
          sqftPerPiece: 0,
          totalSqft: 0,
          amount: 0,
        };
      }
      const rate =
        districtRates.find(
          (r) =>
            r.district === selectedBuyer.district &&
            r.size === spec.size &&
            r.thickness === spec.thickness &&
            r.finish === spec.finish
        )?.ratePerSqft ?? 0;
      const sqftPerPiece = sizeToSqft[spec.size] ?? 0;
      const totalSqft = sqftPerPiece * l.pieces;
      return {
        ...l,
        spec,
        rate,
        sqftPerPiece,
        totalSqft,
        amount: totalSqft * rate,
      };
    });
  }, [lines, selectedBuyer, districtRates, sellableSpecs]);

  const total = computedLines.reduce((s, l) => s + l.amount, 0);

  if (!isOpen || !selectedBuyer) return null;

  const addLine = () =>
    setLines((prev) => [
      ...prev,
      {
        key: `k${Date.now()}`,
        specIndex: 0,
        pieces: 20,
      },
    ]);

  const removeLine = (key: string) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));

  const updateLine = (key: string, patch: Partial<DraftLine>) =>
    setLines((prev) =>
      prev.map((l) =>
        l.key === key
          ? {
              ...l,
              ...patch,
            }
          : l
      )
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const orderLines: OrderLine[] = computedLines
      .filter((l) => l.pieces > 0 && l.rate > 0)
      .map((l, idx) => ({
        id: `ol${Date.now()}-${idx}`,
        size: l.spec.size,
        thickness: l.spec.thickness,
        finish: l.spec.finish as Finish,
        sqftPerPiece: l.sqftPerPiece,
        pieces: l.pieces,
        ratePerSqft: l.rate,
      }));

    if (orderLines.length === 0) return;

    placeOrder({
      unloadingPartyId: selectedBuyerId,
      district: selectedBuyer.district,
      lines: orderLines,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-ink-700 bg-ink-950 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-800 px-6 py-4 bg-ink-950">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <ShoppingBagIcon className="h-5 w-5 text-gold animate-pulse" />
            Create Buyer Order (Owner Console)
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Select Buyer */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Select Unloading Party (Buyer)
            </label>
            <select
              value={selectedBuyerId}
              onChange={(e) => setSelectedBuyerId(e.target.value)}
              className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
              aria-label="Select buyer"
            >
              {unloadingParties.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.district})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-neutral-500">
              Rates shown are configured for unloading party at{' '}
              <span className="text-neutral-300 font-semibold">{selectedBuyer.district}</span>.
            </p>
          </div>

          {/* Stone Specifications */}
          <div className="space-y-3">
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold">
              Stone Specifications
            </label>

            {computedLines.map((l) => (
              <div
                key={l.key}
                className="rounded-lg border border-ink-800 bg-ink-900/40 p-4 transition-colors hover:border-ink-700"
              >
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <span className="mb-1 block text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                      Stone Specification
                    </span>
                    <select
                      value={l.specIndex}
                      onChange={(e) =>
                        updateLine(l.key, {
                          specIndex: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                      aria-label="Select stone spec"
                    >
                      {sellableSpecs.map((s, idx) => (
                        <option key={idx} value={idx}>
                          {s.size} · {s.thickness} · {s.finish}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <span className="mb-1 block text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                      Pieces
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={l.pieces}
                      onChange={(e) =>
                        updateLine(l.key, {
                          pieces: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(l.key)}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-ink-800 text-neutral-500 transition-colors hover:text-red-300"
                    aria-label="Remove line"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-ink-800/60 pt-3 text-xs">
                  <span className="font-mono text-neutral-400">
                    {l.sqftPerPiece} sqft × {l.pieces} pcs = {l.totalSqft} sqft × ₹{l.rate}
                  </span>
                  <span className="text-sm font-bold text-gold">
                    {formatINR(l.amount)}
                  </span>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-2 rounded-md border border-dashed border-ink-700 px-3 py-2 text-xs font-medium text-neutral-400 transition-colors hover:text-white hover:border-ink-500"
            >
              <PlusIcon className="h-4 w-4" /> Add another stone specification
            </button>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-between border-t border-ink-800 pt-5">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-neutral-500 font-bold">
                Order Total
              </p>
              <p className="text-2xl font-black text-gold">
                {formatINR(total)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-ink-700 px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={total <= 0}
                className="rounded-md bg-gold px-5 py-2.5 text-xs font-bold text-ink-950 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                Place Order
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
