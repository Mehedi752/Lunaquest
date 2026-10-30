import type { Metadata } from 'next';
import { MissionShell } from '@/components/lq/mission/shell';

export const metadata: Metadata = { title: 'Mission Control' };

export default function MissionLayout({ children }: { children: React.ReactNode }) {
  return <MissionShell>{children}</MissionShell>;
}
