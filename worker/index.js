import { createCheckoutSession, handleStripeWebhook } from './stripe.js';
import { handleOnNewCall } from './notify.js';
import { runDigestJob } from './digest.js';

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
    } catch (err) {
      return withCors(new Response(JSON.stringify({ error: err.message }), { status: 500 }));
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDigestJob(event, env));
  },
};
