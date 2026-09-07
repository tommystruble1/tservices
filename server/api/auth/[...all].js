/* Catch-all for every Better Auth endpoint: /api/auth/sign-in/email-otp,
   /api/auth/email-otp/send-verification-otp, /api/auth/get-session,
   /api/auth/sign-out, and so on. Better Auth defines the routes; this file
   just hands Vercel's request/response to its Node adapter. */
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../../lib/auth.js';
import { withCors } from '../../lib/cors.js';

export default withCors(toNodeHandler(auth));
