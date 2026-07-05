import { createCheckoutSession, handleStripeWebhook } from './stripe.js';
import { handleOnNewCall } from './notify.js';
import { runDigestJob } from './digest.js';
import { getActiveUsers } from './supabase.js';

function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Secret');
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return withCors(new Response(null, { status: 204 }));
    }

    try {
      if (url.pathname === '/api/create-checkout-session' && request.method === 'POST') {
        return withCors(await createCheckoutSession(request, env));
      }

      if (url.pathname === '/api/stripe-webhook' && request.method === 'POST') {
        return await handleStripeWebhook(request, env);
      }

      if (url.pathname === '/api/on-new-call' && request.method === 'POST') {
        return await handleOnNewCall(request, env, ctx);
      }

      if (url.pathname === '/api/debug-users' && request.method === 'GET') {
        if (request.headers.get('X-Webhook-Secret') !== env.SUPABASE_WEBHOOK_SECRET) {
          return new Response('Unauthorized', { status: 401 });
        }
        const users = await getActiveUsers(env);
        return new Response(
          JSON.stringify(
            users.map((u) => ({
              email: u.email,
              role: u.role,
              plan: u.plan,
              obor: u.obor,
              kraj: u.kraj,
              velikost_firmy: u.velikost_firmy,
              onboarding_complete: u.onboarding_complete,
              notification_prefs: u.notification_prefs,
            }))
          ),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (err) {
      return withCors(new Response(JSON.stringify({ error: err.message }), { status: 500 }));
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDigestJob(event, env));
  },
};
