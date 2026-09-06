/* Better Auth, configured for a backend that a static site calls cross-origin.
   ---------------------------------------------------------------------------
   The bearer plugin is what makes this work from tservices.cc at all: Better
   Auth's default is a session cookie, but a cookie set by this API's own
   domain (…vercel.app) is a third-party cookie from the static site's point
   of view, and browsers increasingly block those outright — Safari has for
   years, Chrome is heading the same way. The bearer plugin instead returns
   the session token in a response header on sign-in; the page stores it and
   sends it back as `Authorization: Bearer <token>`, same as any API key. */
const { betterAuth } = require('better-auth');
const { bearer } = require('better-auth/plugins');
const { Pool } = require('pg');

const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  }),
  emailAndPassword: {
    enabled: true
  },
  trustedOrigins: [process.env.ALLOWED_ORIGIN || 'https://tservices.cc'],
  plugins: [bearer()]
});

module.exports = { auth };
