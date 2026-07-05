export async function supabaseGet(env, table, query) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase GET ${table} selhalo: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function getActiveUsers(env) {
  return supabaseGet(env, 'profiles', 'onboarding_complete=eq.true&role=eq.user&select=*');
}

export async function getActiveCalls(env) {
  return supabaseGet(env, 'calls', 'stav=eq.aktivni&select=*');
}
