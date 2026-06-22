'use client';

import { useCallback, useEffect, useState } from 'react';

const DEFAULT_COOLDOWN_SECONDS = 60;

export function useOtpResend(cooldownSeconds = DEFAULT_COOLDOWN_SECONDS) {
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const triggerResend = useCallback(() => {
    if (cooldown > 0) return false;
    setCooldown(cooldownSeconds);
    return true;
  }, [cooldown, cooldownSeconds]);

  return { cooldown, canResend: cooldown === 0, triggerResend };
}
