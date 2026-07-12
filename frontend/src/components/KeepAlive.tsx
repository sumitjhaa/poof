'use client';

import { useEffect, useRef } from 'react';
import { API_URL } from '@/config';

const PING_INTERVAL = 10 * 60 * 1000;
const INITIAL_BACKOFF = 30_000;
const MAX_BACKOFF = 5 * 60 * 1000;

export default function KeepAlive() {
  const backoff = useRef(INITIAL_BACKOFF);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ping = async () => {
      try {
        const res = await fetch(`${API_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          backoff.current = INITIAL_BACKOFF;
        }
      } catch {
        backoff.current = Math.min(backoff.current * 2, MAX_BACKOFF);
      }
      timerRef.current = setTimeout(ping, backoff.current);
    };

    timerRef.current = setTimeout(ping, backoff.current);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
