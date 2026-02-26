import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '../utils/format';

export function useAnimateCounter(
  target: number,
  shouldAnimate: boolean,
  duration = 2000,
): string {
  const [display, setDisplay] = useState('0');
  const prevTarget = useRef(0);
  const rafId = useRef(0);

  useEffect(() => {
    // Don't animate until visible and we have a real value
    if (!shouldAnimate || target === prevTarget.current) return;

    const from = prevTarget.current;
    prevTarget.current = target;

    // Cancel any running animation
    if (rafId.current) cancelAnimationFrame(rafId.current);

    const isDecimal = String(target).includes('.');
    const startTime = performance.now();

    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = from + (target - from) * eased;

      if (isDecimal) {
        setDisplay(current.toFixed(1));
      } else {
        setDisplay(formatNumber(Math.floor(current)));
      }

      if (progress < 1) {
        rafId.current = requestAnimationFrame(update);
      } else {
        if (isDecimal) {
          setDisplay(target.toFixed(1));
        } else {
          setDisplay(formatNumber(target));
        }
      }
    }

    rafId.current = requestAnimationFrame(update);
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, [shouldAnimate, target, duration]);

  return display;
}
