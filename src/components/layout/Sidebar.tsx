import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  TruckIcon,
  RouteIcon,
  UsersIcon,
  PackageOpenIcon,
  MapPinnedIcon,
  Gem,
  ClipboardListIcon,
  MapIcon,
  XIcon } from
'lucide-react';
interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{
    className?: string;
  }>;
}
const navItems: NavItem[] = [
{
  to: '/',
  label: 'Overview',
  icon: LayoutDashboardIcon
},
{
  to: '/orders',
  label: 'Orders',
  icon: ClipboardListIcon
},
{
  to: '/trips',
  label: 'Trips',
  icon: RouteIcon
},
{
  to: '/fleet',
  label: 'Fleet',
  icon: TruckIcon
},
{
  to: '/drivers',
  label: 'Drivers',
  icon: UsersIcon
},
{
  to: '/loading-parties',
  label: 'Loading Parties',
  icon: PackageOpenIcon
},
{
  to: '/unloading-parties',
  label: 'Unloading Parties',
  icon: MapPinnedIcon
},
{
  to: '/district-rates',
  label: 'District Rates',
  icon: MapIcon
},
{
  to: '/rates',
  label: 'Stone Rates',
  icon: Gem
}];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}
export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open &&
      <div
        className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        onClick={onClose}
        aria-hidden="true" />

      }
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-700 bg-ink-950 transition-transform duration-300 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="flex items-center justify-between border-b border-ink-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gold font-extrabold text-ink-950">
              TA
            </span>
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-tight text-white">
                TRANS IA
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Transport &amp; Logistics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white lg:hidden"
            aria-label="Close menu">
            
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-gold/10 text-gold' : 'text-neutral-400 hover:bg-ink-800 hover:text-white'}`
                }>
                
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </NavLink>);

          })}
        </nav>

        <div className="border-t border-ink-700 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-gold">
              OW
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">Owner</p>
              <p className="text-[11px] text-neutral-500">Full access</p>
            </div>
          </div>
        </div>
      </aside>
    </>);

}