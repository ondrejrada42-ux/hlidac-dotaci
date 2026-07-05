export function formatCastka(value) {
  return new Intl.NumberFormat('cs-CZ').format(value) + ' Kč';
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}
