import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { MenuIcon, ExternalLinkIcon, TruckIcon, UserIcon } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { NotificationBell } from './NotificationBell';
export function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex h-screen w-full overflow-hidden bg-ink-900 text-neutral-200">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-ink-700 bg-ink-950 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="text-neutral-300 hover:text-white lg:hidden"
              aria-label="Open menu">
              
              <MenuIcon className="h-6 w-6" />
            </button>
            <span className="font-extrabold tracking-tight text-white lg:hidden">
              TRANS IA
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/driver"
              className="hidden items-center gap-2 rounded-md border border-ink-700 px-3 py-2 text-xs font-medium text-neutral-300 transition-colors hover:text-white sm:inline-flex">
              <UserIcon className="h-4 w-4" /> Driver Portal
            </Link>
            <Link
              to="/loading"
              className="hidden items-center gap-2 rounded-md border border-ink-700 px-3 py-2 text-xs font-medium text-neutral-300 transition-colors hover:text-white sm:inline-flex">
              <TruckIcon className="h-4 w-4" /> Loading Portal
            </Link>
            <Link
              to="/buyer"
              className="hidden items-center gap-2 rounded-md border border-ink-700 px-3 py-2 text-xs font-medium text-neutral-300 transition-colors hover:text-white sm:inline-flex">
              
              <ExternalLinkIcon className="h-4 w-4" /> Buyer Portal
            </Link>
            <NotificationBell />
          </div>
        </div>

        <div className="ti-scroll flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>);

}