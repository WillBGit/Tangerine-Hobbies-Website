import { Router } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public: submit a commission request
router.post('/', async (req, res) => {
  const { name, email, faction, model_description, quantity, tier_id, budget, message } = req.body;
  if (!name || !email || !model_description || !quantity) {
    return res.status(400).json({ error: 'name, email, model_description, and quantity are required' });
  }
  let user_id = null;
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.role === 'user') user_id = payload.userId;
    }
  } catch { /* unauthenticated is fine */ }

  const { rows } = await pool.query(
    `INSERT INTO commissions (name, email, faction, model_description, quantity, tier_id, budget, message, user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [name, email, faction, model_description, quantity, tier_id || null, budget, message, user_id]
  );
  res.status(201).json(rows[0]);
});

// Admin: list all commissions
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, pt.name AS tier_name
     FROM commissions c
     LEFT JOIN pricing_tiers pt ON c.tier_id = pt.id
     ORDER BY c.created_at DESC`
  );
  res.json(rows);
});

// Admin: update status / notes
router.patch('/:id', requireAuth, async (req, res) => {
  const { status, admin_notes } = req.body;
  const { rows } = await pool.query(
    'UPDATE commissions SET status=$1, admin_notes=$2 WHERE id=$3 RETURNING *',
    [status, admin_notes, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// Admin: delete
router.delete('/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM commissions WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

export default router;
