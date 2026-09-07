/* Better Auth, configured for a backend that a static site calls cross-origin.
   ---------------------------------------------------------------------------
   Sign-in is a magic link — no passwords, no codes. `POST /api/auth/sign-in/
   magic-link` with { email } stores a token and calls `sendMagicLink`;
   `server/lib/email.js` emails a link back to the site:
     https://tservices.cc/#account?magic=<token>
   Opening that link runs auth.js, which calls
     GET /api/auth/magic-link/verify?token=<token>
   and gets the session token back in the `set-auth-token` header (bearer
   plugin). First successful link for an address creates the account.

   The `bearer` plugin is what makes this work from tservices.cc at all: Better
   Auth's default is a session cookie, but a cookie set by this API's own
   domain (…vercel.app) is a third-party cookie from the static site's point
   of view, and browsers block those. The bearer plugin returns the session
   token in a response header instead; the page stores it and sends it back as
   `Authorization: Bearer <token>`, same as any API key. */
import { betterAuth } from 'better-auth';
import { bearer, magicLink } from 'better-auth/plugins';
import pg from 'pg';
import { sendMagicLinkEmail } from './email.js';

const { Pool } = pg;

const SITE_URL = process.env.SITE_URL || 'https://tservices.cc';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  }),
  emailAndPassword: { enabled: false },
  trustedOrigins: [process.env.ALLOWED_ORIGIN || 'https://tservices.cc'],
  plugins: [
    bearer(),
    magicLink({
      expiresIn: 60 * 15, // 15 minutes
      // Build our own link to the site (not Better Auth's default verify URL),
      // so the token is verified by the page via fetch and comes back as a
      // bearer token rather than a cross-origin cookie.
      async sendMagicLink({ email, token }) {
        const url = `${SITE_URL}/#account?magic=${encodeURIComponent(token)}`;
        await sendMagicLinkEmail(email, url);
      }
    })
  ]
});
