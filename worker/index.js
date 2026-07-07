import { createCheckoutSession, handleStripeWebhook } from './stripe.js';
import { handleOnNewCall } from './notify.js';
import { runDigestJob } from './digest.js';
import { scrapeDotaceEU } from './scraper.js';
import { sendAdminDailyReport } from './adminReport.js';
import { handleApiCalls } from './apiAccess.js';

function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Secret');
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

      if (url.pathname === '/api/v1/calls' && request.method === 'GET') {
        return withCors(await handleApiCalls(request, env));
      }

      if (url.pathname === '/api/run-daily-job' && request.method === 'POST') {
        if (request.headers.get('X-Webhook-Secret') !== env.SUPABASE_WEBHOOK_SECRET) {
          return new Response('Unauthorized', { status: 401 });
        }
        const result = await runDailyJob({ scheduledTime: Date.now() }, env);
        return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
      }
    } catch (err) {
      return withCors(new Response(JSON.stringify({ error: err.message }), { status: 500 }));
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDailyJob(event, env));
  },
};

async function runDailyJob(event, env) {
  const scrapeResult = await scrapeDotaceEU(env);
  await runDigestJob(event, env);
  await sendAdminDailyReport(env, scrapeResult);
  return scrapeResult;
}
