import type { Metadata } from 'next';
import { Game3D } from '@/components/lq/game3d/game-3d';

export const metadata: Metadata = { title: '3D Mission' };

/** Full-screen 3D mission. Same engine and saved mission as /mission. */
export default function Play3DPage() {
  return <Game3D />;
}
