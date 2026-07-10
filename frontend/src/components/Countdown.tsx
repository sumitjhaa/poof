'use client';

import { useState, useEffect } from 'react';
import styles from './Countdown.module.css';

interface CountdownProps {
  expiresAt: string;
  onExpire?: () => void;
}

export function Countdown({ expiresAt, onExpire }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        onExpire?.();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const isExpired = timeLeft === 'Expired';
  const isUrgent = timeLeft.includes('s') || timeLeft.includes('m');

  return (
    <div className={`${styles.countdown} ${isExpired ? styles.expired : ''} ${isUrgent ? styles.urgent : ''}`}>
      {isExpired ? '⏰ Expired' : `⏳ ${timeLeft}`}
    </div>
  );
}
