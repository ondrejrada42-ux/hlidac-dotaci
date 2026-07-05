import { db } from './db.js';

export function computeScore(user, call, excluded = []) {
  if (!user || !call || !user.obory?.length || !user.kraj || !user.velikost_firmy) return 0;

  const oborMatch = call.obory.includes('Všechny obory') || user.obory.some((o) => call.obory.includes(o)) ? 1 : 0;
  const krajMatch = call.kraje.includes('Celá ČR') || call.kraje.includes(user.kraj) ? 1 : 0;
  const velikostMatch = call.velikosti.includes(user.velikost_firmy) ? 1 : 0;

  let score = oborMatch * 50 + krajMatch * 30 + velikostMatch * 20;

  if (score > 0) {
    const dismissedSameProvider = excluded.filter((e) => e.poskytovatel === call.poskytovatel).length;
    if (dismissedSameProvider > 0) {
      score -= Math.min(dismissedSameProvider, 3) * 5;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function getMatchedCalls(user, { minScore = 30 } = {}) {
  const [allCalls, excluded] = await Promise.all([db.getCalls(), db.getExcludedByUser(user.id)]);
  const calls = allCalls.filter((c) => c.stav === 'aktivni');
  return calls
    .map((call) => ({ call, score: computeScore(user, call, excluded) }))
    .filter((m) => m.score >= minScore)
    .sort((a, b) => b.score - a.score || new Date(a.call.deadline) - new Date(b.call.deadline));
}

export function isNewCall(call, days = 14) {
  const created = new Date(call.created_at);
  const now = new Date();
  const diffDays = (now - created) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

export function isEndingSoon(call, days = 14) {
  const deadline = new Date(call.deadline);
  const now = new Date();
  const diffDays = (deadline - now) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

export function daysUntil(dateStr) {
  const deadline = new Date(dateStr);
  const now = new Date();
  return Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
}
