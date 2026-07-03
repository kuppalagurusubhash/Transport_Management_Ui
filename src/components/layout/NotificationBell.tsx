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
        className="relative flex h-10 w-10 items-center justify-center rounded-md border border-ink-700 bg-ink-950 text-neutral-300 transition-colors hover:text-white"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}>
        
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 &&
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink-950">
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
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-ink-700 bg-ink-950 shadow-2xl">
          
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