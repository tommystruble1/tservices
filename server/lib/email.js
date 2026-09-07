/* Transactional email — sends the magic sign-in links.
   ---------------------------------------------------------------------------
   Uses Resend (resend.com) over its plain REST API, so no SDK dependency is
   added. Set two env vars in the backend deployment:

     RESEND_API_KEY   re_...           (Resend dashboard → API Keys)
     EMAIL_FROM       "T's Services <login@tservices.cc>"
                      — the domain must be verified in Resend first

   To use a different provider, this is the only file to change: keep the
   signature `sendMagicLinkEmail(email, url)` and point it at that provider's
   API. Node 18+ has a global `fetch`, which is what Vercel's runtime gives us. */

export async function sendMagicLinkEmail(email, url) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!key || !from) {
    throw new Error('Email is not configured (RESEND_API_KEY / EMAIL_FROM missing).');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Your T’s Services sign-in link',
      text:
        `Click this link to sign in to T's Services:\n\n${url}\n\n` +
        `It expires in 15 minutes and can be used once.\n` +
        `If you didn't try to sign in, you can ignore this email.`,
      html:
        `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:440px;margin:auto;padding:24px;color:#111">` +
        `<p style="margin:0 0 18px;font-size:15px">Click below to sign in to <strong>T&rsquo;s Services</strong>:</p>` +
        `<p style="margin:0 0 20px">` +
        `<a href="${url}" style="display:inline-block;background:#ff3d9a;color:#fff;text-decoration:none;` +
        `font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px">Sign in</a></p>` +
        `<p style="margin:0 0 6px;font-size:12px;color:#666">Or paste this link into your browser:</p>` +
        `<p style="margin:0 0 18px;font-size:12px;color:#666;word-break:break-all">${url}</p>` +
        `<p style="margin:0;font-size:12px;color:#666">Expires in 15 minutes, single use. ` +
        `If you didn't request this, ignore this email.</p></div>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend API ${res.status}: ${body}`);
  }
}
