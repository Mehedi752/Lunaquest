import type { Metadata } from 'next';
import { Configurator } from './configurator';

export const metadata: Metadata = { title: 'Configure Your Outpost' };

export default function ConfigurePage() {
  return <Configurator />;
}
