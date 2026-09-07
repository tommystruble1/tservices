/* POST /api/checkout — creates a Stripe Checkout Session for the signed-in
   user's cart. Requires a session, because the resulting purchase has to be
   attached to somebody's account for the dashboard to ever show it again. */
import Stripe from 'stripe';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth.js';
import { withCors } from '../lib/cors.js';
import { PRICES } from '../lib/prices.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder');
const SITE_URL = process.env.SITE_URL || 'https://tservices.cc';
const MAX_QTY = 20;

export default withCors(async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    res.status(401).json({ error: 'Sign in first.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (err) { body = {}; }
  }
  const items = Array.isArray(body && body.items) ? body.items : [];

  // Every price and name comes from PRICES, keyed by id. Nothing the client
  // sent for cost or label is used — only which ids it asked for, and how many.
  const line_items = [];
  for (const item of items) {
    const entry = item && PRICES[item.id];
    if (!entry) continue; // unrecognised id: silently skipped, not trusted
    const qty = Math.min(Math.max(parseInt(item.qty, 10) || 1, 1), MAX_QTY);
    line_items.push({
      quantity: qty,
      price_data: {
        currency: 'usd',
        unit_amount: entry.cents,
        product_data: {
          name: entry.name,
          metadata: { variantId: item.id }
        }
      }
    });
  }

  if (!line_items.length) {
    res.status(400).json({ error: 'Nothing valid to check out.' });
    return;
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${SITE_URL}/#account?checkout=success`,
      cancel_url: `${SITE_URL}/#products?checkout=cancelled`,
      client_reference_id: session.user.id,
      metadata: { userId: session.user.id }
    });
    res.status(200).json({ url: checkoutSession.url });
  } catch (err) {
    console.error('[checkout] Stripe error:', err.message);
    res.status(502).json({ error: 'Could not start checkout. Try again shortly.' });
  }
});
