export function formatCastka(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('cs-CZ').format(value) + ' Kč';
}

export function formatCastkaRozsah(min, max) {
  return `${formatCastka(min)} – ${formatCastka(max)}`;
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
