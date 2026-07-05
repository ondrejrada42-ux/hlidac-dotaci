const STRIPE_API = 'https://api.stripe.com/v1';

function formEncode(obj, prefix = '') {
  const params = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        const indexedKey = `${fullKey}[${i}]`;
        if (item && typeof item === 'object') {
          params.push(formEncode(item, indexedKey));
        } else if (item !== undefined && item !== null) {
          params.push(`${encodeURIComponent(indexedKey)}=${encodeURIComponent(item)}`);
        }
      });
    } else if (value && typeof value === 'object') {
      params.push(formEncode(value, fullKey));
    } else if (value !== undefined && value !== null) {
      params.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(value)}`);
    }
  }
  return params.join('&');
}

async function stripeRequest(env, path, body) {
  const res = await fetch(`${STRIPE_API}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formEncode(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Stripe API error');
  }
  return data;
}

export async function createCheckoutSession(request, env) {
  const { userId, userEmail, plan } = await request.json();

  const priceId = plan === 'PRO' ? env.STRIPE_PRICE_PRO : plan === 'FIRMA' ? env.STRIPE_PRICE_FIRMA : null;
  if (!priceId) {
    return new Response(JSON.stringify({ error: 'Neplatný plán' }), { status: 400 });
  }

  const origin = new URL(request.url).origin;

  const session = await stripeRequest(env, 'checkout/sessions', {
    mode: 'subscription',
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/#/dashboard?upgraded=1`,
    cancel_url: `${origin}/#/cenik`,
    metadata: { user_id: userId, plan },
    subscription_data: { metadata: { user_id: userId, plan } },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function verifyStripeSignature(payload, header, secret) {
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  const signedPayload = `${parts.t}.${payload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = [...new Uint8Array(signatureBuffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

  return expected === parts.v1;
}

async function updateUserPlan(env, userId, plan) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) {
    throw new Error(`Nepodařilo se upravit plán uživatele: ${res.status}`);
  }
}

export async function handleStripeWebhook(request, env) {
  const payload = await request.text();
  const signatureHeader = request.headers.get('Stripe-Signature') || '';

  const valid = await verifyStripeSignature(payload, signatureHeader, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(payload);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan;
    if (userId && plan) {
      await updateUserPlan(env, userId, plan);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const userId = subscription.metadata?.user_id;
    if (userId) {
      await updateUserPlan(env, userId, 'FREE');
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
