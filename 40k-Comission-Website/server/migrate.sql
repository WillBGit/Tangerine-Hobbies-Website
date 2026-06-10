ALTER TABLE commissions ADD COLUMN IF NOT EXISTS access_token UUID DEFAULT gen_random_uuid() UNIQUE;
UPDATE commissions SET access_token = gen_random_uuid() WHERE access_token IS NULL;
ALTER TABLE commissions ALTER COLUMN access_token SET NOT NULL;

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  commission_id INT REFERENCES commissions(id) ON DELETE CASCADE,
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('admin', 'client')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
