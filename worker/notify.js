import { getActiveUsers } from './supabase.js';
import { computeScore, isProviderEnabled } from './matching.js';
import { sendEmailsSequentially, digestEmailHtml } from './resend.js';

export async function handleOnNewCall(request, env, ctx) {
  const secretHeader = request.headers.get('X-Webhook-Secret');
  if (!env.SUPABASE_WEBHOOK_SECRET || secretHeader !== env.SUPABASE_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await request.json();
  const call = payload.record;
  if (!call || call.stav !== 'aktivni') {
    return new Response(JSON.stringify({ skipped: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  const users = await getActiveUsers(env);
  const instantUsers = users.filter((u) => u.notification_prefs?.frequency === 'okamzite');

  const dashboardUrl = `${new URL(request.url).origin}/#/dashboard`;

  const toNotify = instantUsers
    .map((user) => ({ user, score: computeScore(user, call) }))
    .filter(({ user, score }) => score >= 30 && isProviderEnabled(user, call));

  const jobs = toNotify.map(({ user, score }) => ({
    to: user.email,
    subject: `Nová výzva pro vás: ${call.nazev}`,
    html: digestEmailHtml({
      heading: 'Nová dotační výzva odpovídá vašemu profilu',
      intro: `Právě jsme přidali výzvu, která se ${score} % shoduje s vaším profilem.`,
      matches: [{ call, score }],
      dashboardUrl,
    }),
  }));

  ctx.waitUntil(sendEmailsSequentially(env, jobs));

  return new Response(JSON.stringify({ notified: toNotify.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
