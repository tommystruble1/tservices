/* POST /api/webhook — Stripe calls this directly, never the browser.
   Register it in the Stripe dashboard (Developers → Webhooks) pointed at
   <your-backend>/api/webhook, listening for checkout.session.completed.

   This is the only place a licence key is ever created. The page never
   generates one, and checkout.js never returns one — a key only exists once
   Stripe has confirmed the money actually arrived. */
import Stripe from 'stripe';
import crypto from 'node:crypto';
import { getPool } from '../lib/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder');

// Stripe signs the raw request body; Vercel's default JSON parsing would
// re-serialize it first and break that signature. Disable the body parser so
// `req` stays a readable stream we can hash byte-for-byte.
export const config = { api: { bodyParser: false } };

function readRawBody(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) => chunks.push(chunk));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

function makeLicenseKey() {
  // 20 hex chars, grouped for readability: XXXXX-XXXXX-XXXXX-XXXXX
  const hex = crypto.randomBytes(10).toString('hex').toUpperCase();
  return hex.match(/.{1,5}/g).join('-');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const signature = req.headers['stripe-signature'];
  const rawBody = await readRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] signature check failed:', err.message);
    res.status(400).send('Webhook signature verification failed.');
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata && session.metadata.userId;

    if (userId) {
      const pool = getPool();

      const already = await pool.query(
        'select 1 from licenses where stripe_session_id = $1 limit 1',
        [session.id]
      );

      if (already.rowCount === 0) {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product']
        });

        for (const li of lineItems.data) {
          const product = li.price && li.price.product;
          const variantId = (product && product.metadata && product.metadata.variantId) || 'unknown';
          const qty = li.quantity || 1;

          for (let i = 0; i < qty; i++) {
            await pool.query(
              `insert into licenses
                 (id, user_id, product, variant, price_cents, currency, license_key, stripe_session_id, created_at)
               values ($1, $2, $3, $4, $5, $6, $7, $8, now())`,
              [
                crypto.randomUUID(),
                userId,
                'Yari',
                variantId,
                li.price.unit_amount,
                li.price.currency,
                makeLicenseKey(),
                session.id
              ]
            );
          }
        }
      }
    } else {
      console.error('[webhook] checkout.session.completed with no metadata.userId — cannot issue a key');
    }
  }

  res.status(200).json({ received: true });
}
