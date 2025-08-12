"use client";

import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

let socketSingleton: any = null;

export function NotificationIcon() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number>(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/notifications/unread', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          setCount(json.count || 0);
        }
      } catch {}
    };
    init();
  }, []);

  // Real-time: connect to socket server and listen for new_notification for this user
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      try {
        if (!socketSingleton) {
          // ts-expect-error dynamic import may lack type declarations in this env
          const mod = await import('socket.io-client');
          const url = (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001').replace(/\/$/, '');
          socketSingleton = mod.io(url, { transports: ['websocket'], query: { userId: user.id } });
        }
        const handler = (_notification: any) => {
          if (!active) return;
          // Increment optimistically
          setCount((c) => c + 1);
        };
        socketSingleton.on('new_notification', handler);
      } catch {}
    })();
    return () => {
      active = false;
      try {
        socketSingleton?.off?.('new_notification');
      } catch {}
    };
  }, [user?.id]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      const t = e.target as HTMLElement;
      if (!t.closest('[data-popover="notif"]') && !t.closest('[data-button="notif"]')) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Listen for SSE/WebSocket could be added here later to update count in real-time

  return (
    <div className="relative" ref={ref}>
      <button
        data-button="notif"
        className="relative rounded p-2 hover:bg-accent"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none text-white">
            {Math.min(99, count)}
          </span>
        )}
      </button>
      {open && (
        <div data-popover="notif" className="absolute right-0 z-[80] mt-2 rounded border bg-popover shadow-md">
          <NotificationDropdown
            onViewAll={() => {
              setOpen(false);
              router.push('/notifications');
            }}
            onMarkedAll={() => setCount(0)}
          />
        </div>
      )}
    </div>
  );
}


