/* Transactional email — sends the one-time sign-in codes.
   ---------------------------------------------------------------------------
   Uses Resend (resend.com) over its plain REST API, so no SDK dependency is
   added. Set two env vars in the backend deployment:

     RESEND_API_KEY   re_...           (Resend dashboard → API Keys)
     EMAIL_FROM       "T's Services <login@tservices.cc>"
                      — the domain must be verified in Resend first

   To use a different provider, this is the only file to change: keep the
   signature `sendLoginCode(email, otp)` and point it at that provider's API.
   Node 18+ has a global `fetch`, which is what Vercel's runtime gives us. */

export async function sendLoginCode(email, otp) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!key || !from) {
    // Fail loudly in logs; the frontend shows a generic "try again".
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
      subject: `${otp} is your T's Services sign-in code`,
      text:
        `Your one-time sign-in code is:\n\n  ${otp}\n\n` +
        `It expires in 10 minutes and can be used once.\n` +
        `If you didn't try to sign in, you can ignore this email.`,
      html:
        `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:420px;margin:auto;padding:24px;color:#111">` +
        `<p style="margin:0 0 14px;font-size:15px">Your one-time sign-in code:</p>` +
        `<p style="margin:0 0 18px;font-size:30px;font-weight:700;letter-spacing:.28em">${otp}</p>` +
        `<p style="margin:0;font-size:13px;color:#666">Expires in 10 minutes, single use. ` +
        `If you didn't request this, ignore this email.</p></div>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend API ${res.status}: ${body}`);
  }
}
