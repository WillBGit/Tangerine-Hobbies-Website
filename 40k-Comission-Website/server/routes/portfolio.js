import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT pi.*, pt.name AS tier_name
     FROM portfolio_items pi
     LEFT JOIN pricing_tiers pt ON pi.tier_id = pt.id
     ORDER BY pi.sort_order ASC, pi.created_at ASC`
  );
  res.json(rows);
});

router.post('/reorder', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids required' });
  await Promise.all(ids.map((id, i) =>
    pool.query('UPDATE portfolio_items SET sort_order=$1 WHERE id=$2', [i, id])
  ));
  res.json({ ok: true });
});

router.post('/', requireAuth, async (req, res) => {
  const { title, faction, description, image_urls, tier_id } = req.body;
  const urls = Array.isArray(image_urls) ? image_urls : [];
  if (!title || urls.length === 0) return res.status(400).json({ error: 'title and at least one image are required' });
  const { rows } = await pool.query(
    `INSERT INTO portfolio_items (title, faction, description, image_url, image_urls, tier_id)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [title, faction, description, urls[0], urls, tier_id || null]
  );
  res.status(201).json(rows[0]);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { title, description, image_urls, tier_id } = req.body;
  const urls = Array.isArray(image_urls) ? image_urls : [];
  if (!title || urls.length === 0) return res.status(400).json({ error: 'title and at least one image are required' });
  const { rows } = await pool.query(
    `UPDATE portfolio_items
     SET title=$1, description=$2, image_url=$3, image_urls=$4, tier_id=$5
     WHERE id=$6 RETURNING *`,
    [title, description, urls[0], urls, tier_id || null, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM portfolio_items WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

export default router;
