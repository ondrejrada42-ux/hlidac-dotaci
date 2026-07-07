import { getActiveCalls, getCompanyProfilesByUser } from './supabase.js';
import { matchedCallsForUser } from './matching.js';

async function findUserByApiKey(env, apiKey) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?api_key=eq.${encodeURIComponent(apiKey)}&select=*`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  if (!res.ok) throw new Error(`Supabase selhalo: ${res.status}`);
  const rows = await res.json();
  return rows[0] || null;
}

export async function handleApiCalls(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Chybí API klíč (hlavička Authorization: Bearer <klíč>).' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await findUserByApiKey(env, apiKey);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Neplatný API klíč.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (user.plan !== 'FIRMA') {
    return new Response(JSON.stringify({ error: 'API přístup je dostupný pouze pro plán FIRMA.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const [calls, extraProfiles] = await Promise.all([getActiveCalls(env), getCompanyProfilesByUser(env, user.id)]);
  const matches = matchedCallsForUser(user, calls, extraProfiles).map(({ call, score }) => ({
    id: call.id,
    nazev: call.nazev,
    poskytovatel: call.poskytovatel,
    obory: call.obory,
    kraje: call.kraje,
    velikosti: call.velikosti,
    min_castka: call.min_castka,
    max_castka: call.max_castka,
    deadline: call.deadline,
    popis: call.popis,
    url: call.url,
    skore_shody: score,
  }));

  return new Response(JSON.stringify({ vyzvy: matches }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
