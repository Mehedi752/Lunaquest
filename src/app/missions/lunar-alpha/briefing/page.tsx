import type { Metadata } from 'next';
import { Briefing } from './briefing';

export const metadata: Metadata = { title: 'Mission Briefing — Lunar Outpost Alpha' };

export default function BriefingPage() {
  return <Briefing />;
}
