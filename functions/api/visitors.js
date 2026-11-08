const MAX_BODY = 20000;
const TTL_SECONDS = 60 * 60 * 24 * 90;

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function providedKey(request) {
  return new URL(request.url).searchParams.get('key') || request.headers.get('x-webhook-key') || '';
}

function labelFor(data) {
  const pick = (o) => o && (o.company || o.company_name || o.email || o.name || o.domain);
  return String(pick(data) || pick(data && data.data) || 'new visitor').slice(0, 80);
}

export async function onRequestPost({ request, env }) {
  if (!env.WEBHOOK_KEY || !safeEqual(providedKey(request), env.WEBHOOK_KEY)) {
    return new Response('forbidden', { status: 403 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) return new Response('payload too large', { status: 413 });

  let data;
  try { data = JSON.parse(raw); } catch { data = { raw: raw.slice(0, 2000) }; }

  const when = new Date().toISOString();
  const jobs = [];

  if (env.VISITORS) {
    const id = 'v:' + Date.now() + ':' + crypto.randomUUID().slice(0, 8);
    jobs.push(env.VISITORS.put(id, JSON.stringify({ when, data }), { expirationTtl: TTL_SECONDS }));
  }

  if (env.BREVO_API_KEY && env.FROM_EMAIL && env.NOTIFY_EMAIL) {
    jobs.push(fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: env.FROM_EMAIL, name: 'Scaleworks site' },
        to: [{ email: env.NOTIFY_EMAIL }],
        subject: 'Site visitor: ' + labelFor(data),
        textContent: when + '\n\n' + JSON.stringify(data, null, 2).slice(0, 5000),
      }),
    }));
  }

  await Promise.allSettled(jobs);
  return new Response('ok', { status: 200 });
}

export async function onRequestGet({ request, env }) {
  if (!env.READ_KEY || !safeEqual(providedKey(request), env.READ_KEY)) {
    return new Response('forbidden', { status: 403 });
  }
  if (!env.VISITORS) return new Response('storage not configured', { status: 503 });

  const listed = await env.VISITORS.list({ prefix: 'v:', limit: 1000 });
  const keys = listed.keys.map((k) => k.name).slice(-50).reverse();
  const items = await Promise.all(keys.map(async (k) => JSON.parse(await env.VISITORS.get(k))));
  return new Response(JSON.stringify(items, null, 2), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
