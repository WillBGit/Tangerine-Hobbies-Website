ALTER TABLE commissions
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_url TEXT;
