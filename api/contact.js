// POST /api/contact: the contact form, delivered by Resend (https://resend.com).
// A Vercel serverless function. The rest of the site stays static.
// Env: RESEND_API_KEY (required), CONTACT_TO (where messages land).

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMIT = 5, WINDOW = 10 * 60 * 1000;
const hits = new Map(); // per-instance rate limit: enough to stop a bored script

function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD NOT ALLOWED.' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  // honeypot: people never see this field, bots fill it. Pretend it worked.
  if (body.website) return res.status(200).json({ ok: true });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'TOO MANY MESSAGES. TRY LATER.' });

  const name = String(body.name || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const email = String(body.email || '').trim().slice(0, 200);
  const message = String(body.message || '').trim().slice(0, 5000);
  if (!name || !EMAIL.test(email) || !message) {
    return res.status(422).json({ error: 'MISSING INPUT. TRY AGAIN.' });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[contact] RESEND_API_KEY missing; message not delivered');
    return res.status(503).json({ error: 'MAIL SERVER OFFLINE.' });
  }

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'paraschos.site <contact@paraschos.site>',
      to: [process.env.CONTACT_TO || 'george@paraschos.site'],
      reply_to: email,
      subject: `New message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    }),
  }).catch(err => ({ ok: false, status: 0, text: async () => String(err) }));

  if (!r.ok) {
    console.error('[contact] Resend failed', r.status, await r.text());
    return res.status(502).json({ error: 'MAIL SERVER ERROR.' });
  }
  return res.status(200).json({ ok: true });
}
