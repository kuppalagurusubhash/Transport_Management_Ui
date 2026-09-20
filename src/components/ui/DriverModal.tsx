import React, { useState, useEffect } from 'react';
import { XIcon } from 'lucide-react';
import type { Driver } from '../../data/types';
import { useOrders } from '../../store/OrdersContext';

interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverToEdit?: Driver; // If provided, we are editing; otherwise, adding.
}

export function DriverModal({ isOpen, onClose, driverToEdit }: DriverModalProps) {
  const { addDriver, updateDriver, lorries, drivers } = useOrders();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [lorryId, setLorryId] = useState('');
  const [status, setStatus] = useState<'active' | 'idle' | 'off-duty'>('idle');
  const [joinedOn, setJoinedOn] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (driverToEdit) {
      setName(driverToEdit.name);
      setEmail(driverToEdit.email || '');
      setPassword(''); // Keep blank for editing
      setPhone(driverToEdit.phone);
      setLorryId(driverToEdit.lorryId || '');
      setStatus(driverToEdit.status);
      setJoinedOn(driverToEdit.joinedOn);
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setLorryId('');
      setStatus('idle');
      setJoinedOn(new Date().toISOString().slice(0, 10));
    }
  }, [driverToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || (!driverToEdit && !password)) return;

    const data = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      lorryId: lorryId ? lorryId : null,
      status,
      joinedOn,
      password: password ? password : undefined
    };

    if (driverToEdit) {
      updateDriver(driverToEdit.id, data);
    } else {
      addDriver(data as any);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-ink-700 bg-ink-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-800 px-5 py-4">
          <h3 className="text-base font-extrabold text-white">
            {driverToEdit ? `Edit Driver · ${driverToEdit.name}` : 'Add New Driver'}
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Suresh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. suresh@transia.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Password {driverToEdit && <span className="text-[10px] text-neutral-500 normal-case">(leave empty to keep current)</span>}
            </label>
            <input
              type="password"
              required={!driverToEdit}
              placeholder={driverToEdit ? "••••••••" : "Minimum 6 characters"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Phone Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. +91 98470 11223"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-gold focus:outline-none"
            />
          </div>

          {/* Lorry Selection */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
              Assign Lorry
            </label>
            <select
              value={lorryId}
              onChange={(e) => setLorryId(e.target.value)}
              className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
              aria-label="Assign lorry to driver"
            >
              <option value="">No Lorry Assigned</option>
              {lorries.map((l) => {
                // Find if lorry is already assigned to a driver other than driverToEdit
                const assignedDriver = drivers.find((d) => d.lorryId === l.id && (!driverToEdit || d.id !== driverToEdit.id));
                const label = assignedDriver
                  ? `${l.plate} (Assigned to ${assignedDriver.name})`
                  : `${l.plate} (Available)`;
                return (
                  <option key={l.id} value={l.id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Status & Joined On */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                aria-label="Driver status"
              >
                <option value="idle">Idle</option>
                <option value="active">Active</option>
                <option value="off-duty">Off-Duty</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
                Joined On
              </label>
              <input
                type="date"
                required
                value={joinedOn}
                onChange={(e) => setJoinedOn(e.target.value)}
                className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-ink-700 px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-gold px-4 py-2 text-xs font-semibold text-ink-950 hover:bg-gold-400 transition-colors"
            >
              {driverToEdit ? 'Save Changes' : 'Add Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
