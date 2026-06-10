import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

// Admin: get messages for a commission
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM messages WHERE commission_id=$1 ORDER BY created_at ASC',
    [req.params.id]
  );
  res.json(rows);
});

// Admin: send a message
router.post('/', requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content is required' });
  const { rows } = await pool.query(
    'INSERT INTO messages (commission_id, sender, content) VALUES ($1,$2,$3) RETURNING *',
    [req.params.id, 'admin', content.trim()]
  );
  res.status(201).json(rows[0]);
});

export default router;
