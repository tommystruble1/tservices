/* GET /api/orders — the signed-in user's own licence keys, and nothing else.
   Scoped by session.user.id from the verified token, never from anything the
   client claims about who it is. */
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth.js';
import { withCors } from '../lib/cors.js';
import { getPool } from '../lib/db.js';

export default withCors(async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    res.status(401).json({ error: 'Not signed in.' });
    return;
  }

  const pool = getPool();
  const result = await pool.query(
    `select product, variant, license_key, price_cents, currency, created_at
       from licenses
      where user_id = $1
      order by created_at desc`,
    [session.user.id]
  );

  res.status(200).json({ orders: result.rows });
});
