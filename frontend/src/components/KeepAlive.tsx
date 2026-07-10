'use client';

import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const PING_INTERVAL = 10 * 60 * 1000;

export default function KeepAlive() {
  useEffect(() => {
    const ping = async () => {
      try {
        await fetch(`${API_URL}/health`, { method: 'GET' });
      } catch {
        // silent
      }
    };

    ping();
    const id = setInterval(ping, PING_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return null;
}
