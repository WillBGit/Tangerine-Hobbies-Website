ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
UPDATE portfolio_items SET sort_order = sub.rn
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn FROM portfolio_items) sub
WHERE portfolio_items.id = sub.id;
