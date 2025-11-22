/**
 * useCountdown Hook
 * Provides a countdown timer that updates every second
 */

import { useState, useEffect } from 'react';

interface CountdownResult {
  minutes: number;
  seconds: number;
  isExpired: boolean;
  timeRemaining: number; // in milliseconds
}

export function useCountdown(expiresAt: Date | string | null): CountdownResult {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining(0);
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = expiry - now;
      return Math.max(0, remaining);
    };

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Clear interval if expired
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const isExpired = timeRemaining <= 0;

  return {
    minutes,
    seconds,
    isExpired,
    timeRemaining,
  };
}
