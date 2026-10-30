import type { EquipmentId } from './types';

/** Per-equipment colors for budget bars (also used in the Science Lab). */
export const SEGMENT_COLORS: Record<EquipmentId, string> = {
  solar: '#5DE1FF', battery: '#4FB8F5', shielding: '#739CFF', recycler: '#8FB4FF', greenhouse: '#57D9A3', oxygen: '#A9E8F5', reserves: '#91A0B7',
};
