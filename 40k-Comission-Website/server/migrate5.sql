ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS tier_id INT REFERENCES pricing_tiers(id) ON DELETE SET NULL;
