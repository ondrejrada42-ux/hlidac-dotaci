const SOURCE_URL = 'https://www.dotaceeu.cz/cs/jak-ziskat-dotaci/vyzvy';
const ZDROJ = 'dotaceeu.cz';

function parseDeadline(rangeText) {
  const parts = rangeText.split('-').map((s) => s.trim());
  const endPart = parts[parts.length - 1];
  const m = endPart.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function parseCalls(html) {
  const items = [];
  const seen = new Set();
  const blocks = html.match(/<li class='js-ajax-item'>[\s\S]*?<\/li>/g) || [];

  for (const block of blocks) {
    const statusMatch = block.match(/class='tag blue '>([^<]+)<\/span>/);
    if (!statusMatch || !statusMatch[1].includes('Otevřená')) continue;

    const programMatch = block.match(/class='tag yellow'>([^<]+)<\/a>/);
    const linkTitleMatch = block.match(/<a href='(\/[^']+)'><h3>([^<]+)<\/h3><\/a>/);
    const deadlineMatch = block.match(/Termín pro podání žádosti: <\/span>([^<]+)<\/p>/);

    if (!linkTitleMatch) continue;

    const url = 'https://www.dotaceeu.cz' + linkTitleMatch[1];
    if (seen.has(url)) continue;
    seen.add(url);

    const deadline = deadlineMatch ? parseDeadline(deadlineMatch[1]) : null;
    if (!deadline) continue;

    items.push({
      nazev: linkTitleMatch[2].trim(),
      poskytovatel: 'EU',
      obory: ['Všechny obory'],
      kraje: ['Celá ČR'],
      velikosti: ['OSVČ', 'do 10 zaměstnanců', 'do 50 zaměstnanců', '50+ zaměstnanců'],
      min_castka: 0,
      max_castka: 0,
      deadline,
      popis: `Automaticky importováno z portálu DotaceEU.cz${programMatch ? ` (${programMatch[1].trim()})` : ''}. Přesné podmínky a výši dotace zjistíte na odkazu zdroje.`,
      url,
      stav: 'aktivni',
      zdroj: ZDROJ,
    });
  }

  return items;
}

async function sbFetch(env, path, options = {}) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return res;
}

export async function scrapeDotaceEU(env) {
  let html;
  try {
    const res = await fetch(SOURCE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HlidacDotaciBot/1.0)' },
    });
    if (!res.ok) throw new Error(`Zdroj vrátil HTTP ${res.status}`);
    html = await res.text();
  } catch (err) {
    await logRun(env, { parsed: 0, added: 0, expired: 0, error: err.message });
    return { parsed: 0, added: 0, expired: 0, error: err.message };
  }

  const calls = parseCalls(html);
  let added = 0;

  for (const call of calls) {
    const existing = await sbFetch(env, `calls?url=eq.${encodeURIComponent(call.url)}&select=id`);
    const existingRows = existing.ok ? await existing.json() : [];
    if (existingRows.length > 0) continue;

    const insertRes = await sbFetch(env, 'calls', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(call),
    });
    if (insertRes.ok) added += 1;
  }

  const today = new Date().toISOString().slice(0, 10);
  const expireRes = await sbFetch(
    env,
    `calls?zdroj=eq.${ZDROJ}&stav=eq.aktivni&deadline=lt.${today}`,
    { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ stav: 'ukoncena' }) }
  );
  const expiredRows = expireRes.ok ? await expireRes.json() : [];

  const summary = { parsed: calls.length, added, expired: expiredRows.length, error: null };
  await logRun(env, summary);
  return summary;
}

async function logRun(env, { parsed, added, expired, error }) {
  await sbFetch(env, 'scraper_log', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ zdroj: ZDROJ, parsed_count: parsed, added_count: added, expired_count: expired, error }),
  });
}

export async function getRecentRuns(env, limit = 3) {
  const res = await sbFetch(
    env,
    `scraper_log?zdroj=eq.${ZDROJ}&select=*&order=run_at.desc&limit=${limit}`
  );
  return res.ok ? res.json() : [];
}
