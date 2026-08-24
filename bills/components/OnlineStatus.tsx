'use client';

import { useState, useEffect } from 'react';

export default function OnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        online
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-800'
      }`}
    >
      {online ? 'Online' : 'Offline — work is still safe'}
    </span>
  );
}