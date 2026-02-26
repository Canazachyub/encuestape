import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '../utils/format';

export function useAnimateCounter(
  target: number,
  shouldAnimate: boolean,
  duration = 2000,
): string {
  const [display, setDisplay] = useState('0');
  const animating = useRef(false);

  useEffect(() => {
    if (!shouldAnimate || animating.current) return;
    animating.current = true;

    const isDecimal = String(target).includes('.');
    const startTime = performance.now();

    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = target * eased;

      if (isDecimal) {
        setDisplay(current.toFixed(1));
      } else {
        setDisplay(formatNumber(Math.floor(current)));
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        if (isDecimal) {
          setDisplay(target.toFixed(1));
        } else {
          setDisplay(formatNumber(target));
        }
      }
    }

    requestAnimationFrame(update);
  }, [shouldAnimate, target, duration]);

  return display;
}
