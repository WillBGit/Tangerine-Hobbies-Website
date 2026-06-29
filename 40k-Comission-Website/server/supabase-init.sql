-- Tangerine Hobbies — full schema for fresh database

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_per_model NUMERIC(10,2) NOT NULL,
  features TEXT[],
  display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS portfolio_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  faction VARCHAR(255),
  description TEXT,
  image_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  tier_id INT REFERENCES pricing_tiers(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  faction VARCHAR(255),
  model_description TEXT NOT NULL,
  quantity INT NOT NULL,
  tier_id INT REFERENCES pricing_tiers(id),
  budget VARCHAR(100),
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  admin_notes TEXT,
  access_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  user_id INT REFERENCES users(id),
  payment_status VARCHAR(20) DEFAULT 'none',
  payment_amount NUMERIC(10,2),
  stripe_session_id TEXT,
  stripe_checkout_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  commission_id INT REFERENCES commissions(id) ON DELETE CASCADE,
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('admin', 'client')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed pricing tiers
INSERT INTO pricing_tiers (name, description, price_per_model, features, display_order) VALUES
  ('Tabletop Ready', 'Basecoat, washes, and highlights. Ready for the battlefield.', 8.00, ARRAY['Basecoat', 'Shade wash', 'Single highlight', 'Basing included'], 1),
  ('Parade Ready', 'Full layered paintjob with detailed shading and OSL.', 20.00, ARRAY['Full layering', 'Advanced shading', 'Freehand optional', 'OSL effects', 'Detailed basing'], 2),
  ('Display Quality', 'Competition-level paintwork with NMM, freehand, and diorama basing.', 50.00, ARRAY['NMM/TMM', 'Freehand', 'Freestyled bases', 'Weathering', 'Display base option'], 3)
ON CONFLICT DO NOTHING;
