import { Participant } from '../types';

export const PARTICIPANT_COLORS = [
  { bgClass: 'bg-violet-500', textClass: 'text-violet-700', borderClass: 'border-violet-200', lightBg: 'bg-violet-50', hex: '#7C3AED' },
  { bgClass: 'bg-emerald-500', textClass: 'text-emerald-700', borderClass: 'border-emerald-200', lightBg: 'bg-emerald-50', hex: '#059669' },
  { bgClass: 'bg-orange-500', textClass: 'text-orange-700', borderClass: 'border-orange-200', lightBg: 'bg-orange-50', hex: '#EA580C' },
  { bgClass: 'bg-blue-500', textClass: 'text-blue-700', borderClass: 'border-blue-200', lightBg: 'bg-blue-50', hex: '#2563EB' },
  { bgClass: 'bg-pink-500', textClass: 'text-pink-700', borderClass: 'border-pink-200', lightBg: 'bg-pink-50', hex: '#EC4899' },
  { bgClass: 'bg-teal-500', textClass: 'text-teal-700', borderClass: 'border-teal-200', lightBg: 'bg-teal-50', hex: '#0D9488' },
];

const PARTICIPANT_EMOJIS = ['👤', '🏠', '✈️', '🎓', '💼', '🌍'];

export function createParticipant(name: string, paidAmount: number, index: number): Participant {
  const colors = PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
  const emoji = PARTICIPANT_EMOJIS[index % PARTICIPANT_EMOJIS.length];
  const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return {
    id,
    name,
    hex: colors.hex,
    bgClass: colors.bgClass,
    textClass: colors.textClass,
    borderClass: colors.borderClass,
    lightBg: colors.lightBg,
    role: paidAmount > 0 ? `Paid EUR ${paidAmount}` : 'Not yet paid',
    hasPaid: paidAmount > 0,
    paidAmount,
    emoji,
  };
}
