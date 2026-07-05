import { el } from '../utils/dom.js';
import { formatCastkaRozsah, formatDate } from '../utils/format.js';
import { isNewCall, isEndingSoon, daysUntil } from '../matching.js';

const PROVIDER_COLORS = {
  EU: 'bg-blue-50 text-blue-700',
  MPO: 'bg-purple-50 text-purple-700',
  MMR: 'bg-orange-50 text-orange-700',
  Kraj: 'bg-teal-50 text-teal-700',
  SFŽP: 'bg-emerald-50 text-emerald-700',
  MZe: 'bg-lime-50 text-lime-700',
  MPSV: 'bg-pink-50 text-pink-700',
  ČMZRB: 'bg-indigo-50 text-indigo-700',
};

export function CallCard({ call, score, locked = false }) {
  const days = daysUntil(call.deadline);
  const badges = [];
  if (isNewCall(call)) badges.push('<span class="bg-accent-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">NOVÉ</span>');
  if (isEndingSoon(call)) badges.push('<span class="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">KONČÍ BRZY</span>');

  const providerClass = PROVIDER_COLORS[call.poskytovatel] || 'bg-gray-100 text-gray-700';

  const card = el(`
    <div class="relative bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow ${locked ? 'overflow-hidden' : ''}">
      <div class="flex items-start justify-between gap-2">
        <span class="text-xs font-semibold px-2 py-1 rounded-full ${providerClass}">${call.poskytovatel}</span>
        <div class="flex gap-1">${badges.join('')}</div>
      </div>
      <h3 class="font-bold text-primary-800 leading-snug text-base">${call.nazev}</h3>
      <div class="text-accent-600 font-semibold text-sm">${formatCastkaRozsah(call.min_castka, call.max_castka)}</div>
      <div class="text-sm text-primary-400">Uzávěrka: ${formatDate(call.deadline)} <span class="text-primary-300">(${days >= 0 ? `za ${days} dní` : 'po termínu'})</span></div>
      <div class="flex items-center gap-2 mt-1">
        <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-accent-500 rounded-full" style="width:${score}%"></div>
        </div>
        <span class="text-xs font-bold text-primary-500">${score}% shoda</span>
      </div>
      <a href="${locked ? '#/cenik' : `#/vyzva/${call.id}`}" class="mt-2 text-sm font-semibold text-primary-600 hover:text-accent-600">
        ${locked ? 'Odemknout v PRO →' : 'Zobrazit detail →'}
      </a>
      ${locked ? '<div class="absolute inset-0 backdrop-blur-sm bg-white/40"></div>' : ''}
    </div>
  `);
  return card;
}
