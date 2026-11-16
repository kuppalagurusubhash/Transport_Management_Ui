import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, PackageIcon } from 'lucide-react';
import { useOrders } from '../../store/OrdersContext';
export function NotificationBell() {
  const { notifications, unreadCount, markNotificationRead, markAllRead } =
    useOrders();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.06] text-neutral-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150 transition-all hover:border-[#F5B82E]/50 hover:bg-white/[0.1] hover:text-white active:scale-95 cursor-pointer"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}>

        <BellIcon className="h-4 w-4" />
        {unreadCount > 0 &&
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#F5B82E] px-1 text-[10px] font-black text-[#05090D] shadow-md">
            {unreadCount}
          </span>
        }
      </button>

      <AnimatePresence>
        {open &&
        <motion.div
          initial={{
            opacity: 0,
            y: -6
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: -6
          }}
          transition={{
            duration: 0.15
          }}
          className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto z-50 sm:mt-2 sm:w-80 overflow-hidden rounded-2xl border border-white/15 bg-[#0D1218]/95 backdrop-blur-2xl shadow-2xl">
          
            <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
              <span className="text-sm font-semibold text-white">
                Notifications
              </span>
              {unreadCount > 0 &&
            <button
              onClick={markAllRead}
              className="text-xs text-gold hover:underline">
              
                  Mark all read
                </button>
            }
            </div>
            <ul className="ti-scroll max-h-80 overflow-y-auto">
              {notifications.length === 0 &&
            <li className="px-4 py-6 text-center text-sm text-neutral-600">
                  No notifications
                </li>
            }
              {notifications.map((n) =>
            <li key={n.id}>
                  <button
                onClick={() => {
                  markNotificationRead(n.id);
                  setOpen(false);
                  navigate('/orders');
                }}
                className={`flex w-full items-start gap-3 border-b border-ink-800 px-4 py-3 text-left transition-colors last:border-0 hover:bg-ink-800 ${n.read ? 'opacity-60' : ''}`}>
                
                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                      <PackageIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-white">
                          {n.title}
                        </span>
                        {!n.read &&
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold" />
                    }
                      </span>
                      <span className="mt-0.5 block text-xs text-neutral-500">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-[11px] text-neutral-600">
                        {n.time}
                      </span>
                    </span>
                  </button>
                </li>
            )}
            </ul>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}