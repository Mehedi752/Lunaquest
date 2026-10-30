'use client';

import { useEffect, useMemo, useRef } from 'react';

/** Animated starfield with Earth, a transfer trajectory and an orbiting satellite (canvas, respects reduced motion). */
export function Sky() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d')!; let raf = 0, w = 0, h = 0;
    let stars: { x: number; y: number; r: number; p: number; s: number }[] = [];
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const size = () => {
      w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      stars = Array.from({ length: Math.round((w * h) / 2400) }, () => ({ x: rnd() * w, y: rnd() * h * .82, r: rnd() * 1.1 + .25, p: rnd() * 6.28, s: .4 + rnd() * 1.4 }));
    };
    size(); const ro = new ResizeObserver(size); ro.observe(c);
    const draw = (ms: number) => {
      const t = ms / 1000; ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#DFE8FF';
      for (const s of stars) { ctx.globalAlpha = .3 + .55 * (reduce ? .5 : Math.sin(t * s.s + s.p) * .5 + .5); ctx.beginPath(); ctx.arc((s.x + (reduce ? 0 : t * 1.5 * s.r)) % w, s.y, s.r, 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = 1;
      const twoCol = w >= 1280, ex = twoCol ? w * .6 : w * .86, ey = twoCol ? h * .2 : h * .1, er = Math.max(26, Math.min(58, w * .035));
      const glow = ctx.createRadialGradient(ex, ey, er * .8, ex, ey, er * 2.4); glow.addColorStop(0, 'rgba(115,156,255,.22)'); glow.addColorStop(1, 'rgba(115,156,255,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(ex, ey, er * 2.4, 0, 6.283); ctx.fill();
      const g = ctx.createRadialGradient(ex - er * .35, ey - er * .35, er * .1, ex, ey, er);
      g.addColorStop(0, '#BFE3FF'); g.addColorStop(.35, '#4C8CE0'); g.addColorStop(.75, '#173E73'); g.addColorStop(1, '#08162B');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ex, ey, er, 0, 6.283); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(ex, ey, er, 0, 6.283); ctx.clip();
      const sh = ctx.createLinearGradient(ex - er, ey - er * .4, ex + er, ey + er * .4); sh.addColorStop(.45, 'rgba(5,8,15,0)'); sh.addColorStop(.78, 'rgba(5,8,15,.94)');
      ctx.fillStyle = sh; ctx.fillRect(ex - er, ey - er, er * 2, er * 2); ctx.restore();
      const lx = w * .5, ly = h * .9, cx = (ex + lx) / 2 - w * .16, cy = Math.min(ey, ly) - h * .02;
      ctx.strokeStyle = 'rgba(93,225,255,.22)'; ctx.lineWidth = 1; ctx.setLineDash([3, 7]);
      ctx.beginPath(); ctx.moveTo(ex - er * .8, ey + er * .6); ctx.quadraticCurveTo(cx, cy, lx, ly); ctx.stroke(); ctx.setLineDash([]);
      const k = reduce ? .62 : (t % 10) / 10, q = (u: number) => { const a = 1 - u; return [a * a * (ex - er * .8) + 2 * a * u * cx + u * u * lx, a * a * (ey + er * .6) + 2 * a * u * cy + u * u * ly]; };
      for (let i = 12; i >= 0; i--) { const [px, py] = q(Math.max(0, k - i * .012)); ctx.globalAlpha = (1 - i / 13) * .8 * Math.sin(Math.min(1, k) * Math.PI); ctx.fillStyle = '#5DE1FF'; ctx.beginPath(); ctx.arc(px, py, i ? 1.6 : 3, 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = 1;
      const ang = reduce ? 2.3 : t * .4, rx = er * 2.3, ry = er * .7;
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(-.35);
      ctx.strokeStyle = 'rgba(93,225,255,.3)'; ctx.setLineDash([2, 6]); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
      const sx = Math.cos(ang) * rx, sy = Math.sin(ang) * ry;
      if (!(Math.sin(ang) < 0 && Math.abs(sx) < er * .95)) { ctx.fillStyle = '#F3F7FC'; ctx.shadowColor = '#5DE1FF'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(sx, sy, 2.6, 0, 6.283); ctx.fill(); }
      ctx.restore();
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 block size-full" />;
}

export interface FlowNode { x: number; y: number; color: string }
/** Animated dependency arrows between system nodes (canvas). */
export function Flow({ nodes, links, active }: { nodes: FlowNode[]; links: [number, number][]; active: number | null }) {
  const ref = useRef<HTMLCanvasElement>(null), pr = useRef({ nodes, links, active });
  pr.current = { nodes, links, active };
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d')!; let raf = 0, w = 0, h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const size = () => { w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); const ro = new ResizeObserver(size); ro.observe(c);
    const draw = (ms: number) => {
      const t = ms / 1000, { nodes, links, active } = pr.current; ctx.clearRect(0, 0, w, h);
      links.forEach(([i, j], k) => {
        const a = nodes[i], b = nodes[j], x1 = a.x * w, y1 = a.y * h, x2 = b.x * w, y2 = b.y * h;
        const on = active == null || i === active || j === active;
        ctx.globalAlpha = on ? .55 : .12; ctx.strokeStyle = a.color; ctx.lineWidth = on ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        const ang = Math.atan2(y2 - y1, x2 - x1), mx = x1 + (x2 - x1) * .55, my = y1 + (y2 - y1) * .55;
        ctx.fillStyle = a.color; ctx.beginPath(); ctx.moveTo(mx + Math.cos(ang) * 6, my + Math.sin(ang) * 6); ctx.lineTo(mx + Math.cos(ang + 2.5) * 6, my + Math.sin(ang + 2.5) * 6); ctx.lineTo(mx + Math.cos(ang - 2.5) * 6, my + Math.sin(ang - 2.5) * 6); ctx.fill();
        if (!on) return;
        for (let m = 0; m < 3; m++) {
          const ph = reduce ? (m + 1) / 4 : ((t * .28) + k * .17 + m / 3) % 1;
          ctx.globalAlpha = Math.sin(ph * Math.PI); ctx.shadowColor = a.color; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(x1 + (x2 - x1) * ph, y1 + (y2 - y1) * ph, 2.6, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
        }
      });
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return useMemo(() => <canvas ref={ref} className="absolute inset-0 block size-full" />, []);
}
