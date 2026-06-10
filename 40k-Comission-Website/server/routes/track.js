import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Client: look up their commission by token
router.get('/:token', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.faction, c.model_description, c.quantity, c.status, c.created_at,
            pt.name AS tier_name
     FROM commissions c
     LEFT JOIN pricing_tiers pt ON c.tier_id = pt.id
     WHERE c.access_token = $1`,
    [req.params.token]
  );
  if (!rows.length) return res.status(404).json({ error: 'Commission not found' });
  res.json(rows[0]);
});

// Client: get messages for their commission
router.get('/:token/messages', async (req, res) => {
  const { rows: commRows } = await pool.query(
    'SELECT id FROM commissions WHERE access_token=$1', [req.params.token]
  );
  if (!commRows.length) return res.status(404).json({ error: 'Not found' });
  const { rows } = await pool.query(
    'SELECT * FROM messages WHERE commission_id=$1 ORDER BY created_at ASC',
    [commRows[0].id]
  );
  res.json(rows);
});

// Client: send a reply
router.post('/:token/messages', async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content is required' });
  const { rows: commRows } = await pool.query(
    'SELECT id FROM commissions WHERE access_token=$1', [req.params.token]
  );
  if (!commRows.length) return res.status(404).json({ error: 'Not found' });
  const { rows } = await pool.query(
    'INSERT INTO messages (commission_id, sender, content) VALUES ($1,$2,$3) RETURNING *',
    [commRows[0].id, 'client', content.trim()]
  );
  res.status(201).json(rows[0]);
});

export default router;
