/* Catch-all for every Better Auth endpoint: /api/auth/sign-up/email,
   /api/auth/sign-in/email, /api/auth/get-session, /api/auth/sign-out,
   /api/auth/forget-password, and so on. Better Auth defines the routes;
   this file just hands Vercel's request/response to its Node adapter. */
const { toNodeHandler } = require('better-auth/node');
const { auth } = require('../../lib/auth');
const { withCors } = require('../../lib/cors');

module.exports = withCors(toNodeHandler(auth));
