// frontend/src/hooks/useIdleTimer.ts
"use client";
import { useState, useEffect } from 'react';

/**
 * Global Idle Timer Hook
 * Monitors user interaction and triggers an idle state after X minutes.
 */
export function useIdleTimer(timeoutMins: number) {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const timeoutMs = timeoutMins * 60 * 1000;

    const resetTimer = () => {
      setIsIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsIdle(true);
      }, timeoutMs);
    };

    // Track user interaction events (Life Signs)
    const events = [
      'mousemove', 'mousedown', 'keypress', 
      'scroll', 'touchstart', 'click'
    ];

    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Start initial timer
    resetTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      clearTimeout(timer);
    };
  }, [timeoutMins]);

  return isIdle;
}