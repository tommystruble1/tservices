/* CORS for a static site calling this API from a different origin.
   tservices.cc has no server of its own, so every request here is
   cross-origin by definition — this isn't optional hardening, it's required
   for anything to work at all. */

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://tservices.cc';

function withCors(handler) {
  return async function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    // Better Auth's bearer plugin returns the session token in this response
    // header. Browsers hide custom headers from JS cross-origin unless the
    // server explicitly exposes them — without this line, sign-in silently
    // "succeeds" with no way for the page to read the token back out.
    res.setHeader('Access-Control-Expose-Headers', 'set-auth-token');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    return handler(req, res);
  };
}

module.exports = { withCors, ALLOWED_ORIGIN };
