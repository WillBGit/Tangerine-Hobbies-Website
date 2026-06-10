import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM pricing_tiers ORDER BY display_order ASC');
  res.json(rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { name, description, price_per_model, features, display_order } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO pricing_tiers (name, description, price_per_model, features, display_order) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [name, description, price_per_model, features, display_order ?? 0]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', requireAuth, async (req, res) => {
  const { name, description, price_per_model, features, display_order } = req.body;
  const { rows } = await pool.query(
    'UPDATE pricing_tiers SET name=$1, description=$2, price_per_model=$3, features=$4, display_order=$5 WHERE id=$6 RETURNING *',
    [name, description, price_per_model, features, display_order, req.params.id]
  );
  res.json(rows[0]);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM pricing_tiers WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

export default router;
