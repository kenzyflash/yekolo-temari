import { useState, useEffect, useCallback, useRef } from 'react';

const TIMEOUT_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const WARNING_TIME = 60 * 60 * 1000; // Show warning 1 hour before timeout
const STORAGE_KEY = 'lastActivityTime';

interface UseIdleTimeoutReturn {
  showWarning: boolean;
  remainingTime: number;
  resetTimer: () => void;
  logout: () => void;
}

export const useIdleTimeout = (
  isAuthenticated: boolean,
  onTimeout: () => void
): UseIdleTimeoutReturn => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(TIMEOUT_DURATION);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateLastActivity = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, now.toString());
  }, []);

  const getLastActivity = useCallback((): number => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : Date.now();
  }, []);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (!isAuthenticated) return;

    clearTimers();
    setShowWarning(false);
    updateLastActivity();

    // Set timeout for logout
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, TIMEOUT_DURATION);

    // Set warning timer (1 hour before timeout)
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingTime(WARNING_TIME);

      // Start countdown
      countdownRef.current = setInterval(() => {
        setRemainingTime(prev => {
          const newTime = prev - 1000;
          if (newTime <= 0) {
            clearTimers();
            onTimeout();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }, TIMEOUT_DURATION - WARNING_TIME);
  }, [isAuthenticated, onTimeout, clearTimers, updateLastActivity]);

  const logout = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    localStorage.removeItem(STORAGE_KEY);
    onTimeout();
  }, [clearTimers, onTimeout]);

  // Check for existing session on mount
  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      setShowWarning(false);
      return;
    }

    const lastActivity = getLastActivity();
    const elapsed = Date.now() - lastActivity;

    // If timeout already expired
    if (elapsed >= TIMEOUT_DURATION) {
      onTimeout();
      return;
    }

    // If in warning period
    if (elapsed >= TIMEOUT_DURATION - WARNING_TIME) {
      setShowWarning(true);
      const timeLeft = TIMEOUT_DURATION - elapsed;
      setRemainingTime(timeLeft);

      timeoutRef.current = setTimeout(() => {
        onTimeout();
      }, timeLeft);

      countdownRef.current = setInterval(() => {
        setRemainingTime(prev => {
          const newTime = prev - 1000;
          if (newTime <= 0) {
            clearTimers();
            onTimeout();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      // Normal operation - set timers
      const timeToWarning = TIMEOUT_DURATION - WARNING_TIME - elapsed;
      const timeToTimeout = TIMEOUT_DURATION - elapsed;

      timeoutRef.current = setTimeout(() => {
        onTimeout();
      }, timeToTimeout);

      warningRef.current = setTimeout(() => {
        setShowWarning(true);
        setRemainingTime(WARNING_TIME);

        countdownRef.current = setInterval(() => {
          setRemainingTime(prev => {
            const newTime = prev - 1000;
            if (newTime <= 0) {
              clearTimers();
              onTimeout();
              return 0;
            }
            return newTime;
          });
        }, 1000);
      }, timeToWarning);
    }

    return () => clearTimers();
  }, [isAuthenticated, onTimeout, clearTimers, getLastActivity]);

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;

    const handleActivity = () => {
      // Throttle activity updates to prevent excessive localStorage writes
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
      }, 30000); // Update at most every 30 seconds

      // Only reset timer if not in warning state
      if (!showWarning) {
        updateLastActivity();
      }
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isAuthenticated, showWarning, updateLastActivity]);

  return {
    showWarning,
    remainingTime,
    resetTimer,
    logout
  };
};
