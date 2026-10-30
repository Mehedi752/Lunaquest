'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Reveals content once it scrolls into view, for one-shot entrance animations.
 * Elements animated this way carry the `lq-rv` class so the <noscript> rule in
 * the root layout can show them when JS never runs; the global reduced-motion
 * rule in globals.css removes the motion itself.
 */
export function useReveal<T extends HTMLElement>(opts?: IntersectionObserverInit) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const io = new IntersectionObserver(e => { if (e[0].isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: .12, rootMargin: '0px 0px -10% 0px', ...opts });
    io.observe(el);
    return () => io.disconnect();
  }, [opts]);
  return [ref, shown] as const;
}

/** Classes for a reveal that fades and rises into place. `d` staggers the start. */
export const rise = (shown: boolean, d = 0) => ({
  className: `lq-rv transition-[opacity,transform] duration-500 ease-out ${shown ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`,
  style: { transitionDelay: `${d}ms` },
});
