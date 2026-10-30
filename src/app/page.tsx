import type { Metadata } from 'next';
import { Landing } from '@/components/lq/landing/landing';

export const metadata: Metadata = {
  title: 'LunaQuest — Junior Astronaut Mission Simulator',
  description: 'Command a four-person lunar outpost. Every Decision Shapes the Mission. NASA Space Apps Challenge 2026.',
};

export default function LandingPage() {
  return <Landing />;
}
