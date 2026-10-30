import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const f0 = (n: number) => String(Math.round(n));
export const f1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
export const signed = (n: number) => `${n >= 0 ? '+' : '−'}${f1(Math.abs(n))}`;
export const pad2 = (n: number) => String(n).padStart(2, '0');
export const pct = (v: number, cap: number) => Math.max(0, Math.min(100, (v / cap) * 100));
