export function computeScore(user, call) {
  if (!user?.obory?.length || !user?.kraj || !user?.velikost_firmy) return 0;

  const oborMatch = call.obory.includes('Všechny obory') || user.obory.some((o) => call.obory.includes(o)) ? 1 : 0;
  const krajMatch = call.kraje.includes('Celá ČR') || call.kraje.includes(user.kraj) ? 1 : 0;
  const velikostMatch = call.velikosti.includes(user.velikost_firmy) ? 1 : 0;

  const score = oborMatch * 50 + krajMatch * 30 + velikostMatch * 20;
  return Math.round(score);
}

export function isProviderEnabled(user, call) {
  const prefs = user.notification_prefs?.poskytovatele;
  if (!prefs) return true;
  if (prefs[call.poskytovatel] === undefined) return true;
  return !!prefs[call.poskytovatel];
}

export function matchedCallsForUser(user, calls, { minScore = 30 } = {}) {
  return calls
    .map((call) => ({ call, score: computeScore(user, call) }))
    .filter((m) => m.score >= minScore && isProviderEnabled(user, m.call))
    .sort((a, b) => b.score - a.score);
}
