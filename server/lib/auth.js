/* Better Auth, configured for a backend that a static site calls cross-origin.
   ---------------------------------------------------------------------------
   Sign-in is email one-time code only — no passwords. The `emailOTP` plugin
   generates a 6-digit code, stores its hash, and calls `sendVerificationOTP`;
   `server/lib/email.js` delivers it. `POST /api/auth/sign-in/email-otp` with
   { email, otp } verifies it and, on first use for that address, creates the
   account (disableSignUp is left false).

   The `bearer` plugin is what makes this work from tservices.cc at all: Better
   Auth's default is a session cookie, but a cookie set by this API's own
   domain (…vercel.app) is a third-party cookie from the static site's point
   of view, and browsers block those. The bearer plugin instead returns the
   session token in a response header on sign-in; the page stores it and sends
   it back as `Authorization: Bearer <token>`, same as any API key. */
const { betterAuth } = require('better-auth');
const { bearer, emailOTP } = require('better-auth/plugins');
const { Pool } = require('pg');
const { sendLoginCode } = require('./email');

const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  }),
  // No password auth — codes only.
  emailAndPassword: { enabled: false },
  trustedOrigins: [process.env.ALLOWED_ORIGIN || 'https://tservices.cc'],
  plugins: [
    bearer(),
    emailOTP({
      otpLength: 6,
      expiresIn: 60 * 10,          // 10 minutes
      allowedAttempts: 5,
      // sendVerificationOTP fires for type 'sign-in' | 'email-verification' | 'forget-password'.
      // Only sign-in is used here; the copy is generic enough to cover it.
      async sendVerificationOTP({ email, otp }) {
        await sendLoginCode(email, otp);
      }
    })
  ]
});

module.exports = { auth };
