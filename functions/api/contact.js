export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const { name, email, subject, message, website, startedAt, token } = body;

  if (website) return new Response('OK'); // honeypot tripped
  if (Date.now() - Number(startedAt) < 2000) return new Response('OK'); // too fast

  if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response('Invalid input', { status: 400 });
  }
  if (subject && subject.length > 100) {
    return new Response('Invalid input', { status: 400 });
  }

  let verify;
  try {
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: token || '',
        remoteip: request.headers.get('CF-Connecting-IP'),
      }),
    });
    verify = await verifyRes.json();
  } catch {
    return new Response('Verification unavailable', { status: 502 });
  }

  if (!verify.success) {
    return new Response('Verification failed', { status: 403 });
  }

  try {
    const sent = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        service_id: env.EMAILJS_SERVICE_ID,
        template_id: env.EMAILJS_TEMPLATE_ID,
        user_id: env.EMAILJS_PUBLIC_KEY,
        accessToken: env.EMAILJS_PRIVATE_KEY,
        template_params: { name, email, subject: subject || '(No subject)', message },
      }),
    });
    return sent.ok ? new Response('OK') : new Response('Send failed', { status: 502 });
  } catch {
    return new Response('Send failed', { status: 502 });
  }
}
