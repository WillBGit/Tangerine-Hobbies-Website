import { Router } from 'express';
import Stripe from 'stripe';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const stripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

// Admin: create a Stripe Checkout session for a commission
router.post('/create-payment/:id', requireAuth, async (req, res) => {
  const { amount } = req.body;
  const dollars = Number(amount);
  if (!amount || isNaN(dollars) || dollars <= 0) {
    return res.status(400).json({ error: 'Valid amount required' });
  }

  const { rows } = await pool.query('SELECT * FROM commissions WHERE id=$1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Commission not found' });
  const commission = rows[0];

  const session = await stripe().checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Commission — ${commission.name}`,
          description: commission.model_description.slice(0, 200),
        },
        unit_amount: Math.round(dollars * 100), // Stripe works in cents
      },
      quantity: 1,
    }],
    success_url: `${process.env.CLIENT_URL}/my-commissions?paid=true`,
    cancel_url: `${process.env.CLIENT_URL}/my-commissions`,
    metadata: { commission_id: String(commission.id) },
  });

  await pool.query(
    `UPDATE commissions
     SET payment_status='pending', payment_amount=$1, stripe_session_id=$2, stripe_checkout_url=$3
     WHERE id=$4`,
    [dollars, session.id, session.url, commission.id]
  );

  res.json({ url: session.url });
});

// Stripe webhook — Stripe calls this after a payment completes
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe().webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const commissionId = session.metadata?.commission_id;
    if (commissionId) {
      await pool.query(
        `UPDATE commissions SET payment_status='paid' WHERE id=$1`,
        [commissionId]
      );
    }
  }

  res.json({ received: true });
});

export default router;
