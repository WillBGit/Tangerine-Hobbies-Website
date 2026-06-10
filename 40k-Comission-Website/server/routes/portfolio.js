import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM portfolio_items ORDER BY created_at DESC');
  res.json(rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { title, faction, description, image_url } = req.body;
  if (!title || !image_url) return res.status(400).json({ error: 'title and image_url are required' });
  const { rows } = await pool.query(
    'INSERT INTO portfolio_items (title, faction, description, image_url) VALUES ($1,$2,$3,$4) RETURNING *',
    [title, faction, description, image_url]
  );
  res.status(201).json(rows[0]);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM portfolio_items WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

export default router;
