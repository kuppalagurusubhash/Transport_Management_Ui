import React, { useState } from 'react';
import { XIcon } from 'lucide-react';
import { useOrders } from '../../store/OrdersContext';
import { type Finish } from '../../data/types';

interface AddStoneRateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddStoneRateModal({ isOpen, onClose }: AddStoneRateModalProps) {
  const { addStoneRate } = useOrders();

  const [size, setSize] = useState('2x2');
  const [customSize, setCustomSize] = useState('');
  const [thickness, setThickness] = useState('40mm');
  const [customThickness, setCustomThickness] = useState('');
  const [finish, setFinish] = useState('polish');
  const [customFinish, setCustomFinish] = useState('');
  const [ratePerSqft, setRatePerSqft] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalSize = size === 'custom' ? customSize.trim() : size;
    const finalThickness = thickness === 'custom' ? customThickness.trim() : thickness;
    const finalFinish = finish === 'custom' ? customFinish.trim() : finish;

    if (!finalSize) {
      setError('Size is required');
      return;
    }
    if (!finalThickness) {
      setError('Thickness is required');
      return;
    }
    if (!finalFinish) {
      setError('Finish is required');
      return;
    }
    if (ratePerSqft === undefined || ratePerSqft <= 0) {
      setError('Rate per sqft must be a positive number');
      return;
    }

    setLoading(true);
    try {
      await addStoneRate({
        size: finalSize,
        thickness: finalThickness,
        finish: finalFinish as Finish,
        ratePerSqft
      });
      onClose();
      // Reset defaults
      setSize('2x2');
      setCustomSize('');
      setThickness('40mm');
      setCustomThickness('');
      setFinish('polish');
      setCustomFinish('');
      setRatePerSqft(20);
    } catch (err: any) {
      setError(err.message || 'Failed to create stone rate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-ink-700 bg-ink-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-800 px-5 py-4">
          <h3 className="text-base font-extrabold text-white">Add New Stone Spec Rate</h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-5 mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Size */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Size
            </label>
            <div className="flex gap-2">
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none flex-1"
                aria-label="Select stone size"
              >
                <option value="2x2">2x2</option>
                <option value="3x3">3x3</option>
                <option value="custom">Custom...</option>
              </select>
              {size === 'custom' && (
                <input
                  type="text"
                  required
                  placeholder="e.g. 4x4"
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  className="rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none flex-1"
                />
              )}
            </div>
          </div>

          {/* Thickness */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Thickness
            </label>
            <div className="flex gap-2">
              <select
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
                className="rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none flex-1"
                aria-label="Select stone thickness"
              >
                <option value="30mm">30mm</option>
                <option value="40mm">40mm</option>
                <option value="50mm">50mm</option>
                <option value="custom">Custom...</option>
              </select>
              {thickness === 'custom' && (
                <input
                  type="text"
                  required
                  placeholder="e.g. 60mm"
                  value={customThickness}
                  onChange={(e) => setCustomThickness(e.target.value)}
                  className="rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none flex-1"
                />
              )}
            </div>
          </div>

          {/* Finish */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Finish
            </label>
            <div className="flex gap-2">
              <select
                value={finish}
                onChange={(e) => setFinish(e.target.value)}
                className="rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none flex-1"
                aria-label="Select stone finish"
              >
                <option value="polish">Polish</option>
                <option value="rough">Rough</option>
                <option value="honed">Honed</option>
                <option value="custom">Custom...</option>
              </select>
              {finish === 'custom' && (
                <input
                  type="text"
                  required
                  placeholder="e.g. flamed"
                  value={customFinish}
                  onChange={(e) => setCustomFinish(e.target.value)}
                  className="rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none flex-1"
                />
              )}
            </div>
          </div>

          {/* Rate */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Rate per sqft (₹)
            </label>
            <input
              type="number"
              min={1}
              required
              value={ratePerSqft}
              onChange={(e) => setRatePerSqft(Number(e.target.value))}
              className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md border border-ink-700 px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-gold px-4 py-2 text-xs font-semibold text-ink-950 hover:bg-gold-400 transition-colors disabled:opacity-40"
            >
              {loading ? 'Creating...' : 'Add Spec Rate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
