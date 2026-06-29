import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireUser } from '../middleware/userAuth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email, is_admin',
      [name, email, hash]
    );
    const token = jwt.sign({ role: 'user', userId: rows[0].id, name: rows[0].name, email: rows[0].email, isAdmin: rows[0].is_admin }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'An account with that email already exists' });
    throw err;
  }
});

router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  if (!rows.length) return res.status(401).json({ error: 'Invalid email or password' });
  const match = await bcrypt.compare(password, rows[0].password_hash);
  if (!match) return res.status(401).json({ error: 'Invalid email or password' });
  const token = jwt.sign({ role: 'user', userId: rows[0].id, name: rows[0].name, email: rows[0].email, isAdmin: rows[0].is_admin }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: rows[0].id, name: rows[0].name, email: rows[0].email, isAdmin: rows[0].is_admin } });
});

router.get('/me', requireUser, async (req, res) => {
  res.json({ id: req.user.userId, name: req.user.name, email: req.user.email });
});

router.get('/me/commissions', requireUser, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, pt.name AS tier_name
     FROM commissions c
     LEFT JOIN pricing_tiers pt ON c.tier_id = pt.id
     WHERE c.user_id = $1
     ORDER BY c.created_at DESC`,
    [req.user.userId]
  );
  res.json(rows);
});

router.get('/me/commissions/:id/messages', requireUser, async (req, res) => {
  const { rows: commRows } = await pool.query(
    'SELECT id FROM commissions WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.userId]
  );
  if (!commRows.length) return res.status(404).json({ error: 'Not found' });
  const { rows } = await pool.query(
    'SELECT * FROM messages WHERE commission_id=$1 ORDER BY created_at ASC',
    [req.params.id]
  );
  res.json(rows);
});

router.post('/me/commissions/:id/messages', requireUser, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content is required' });
  const { rows: commRows } = await pool.query(
    'SELECT id FROM commissions WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.userId]
  );
  if (!commRows.length) return res.status(404).json({ error: 'Not found' });
  const { rows } = await pool.query(
    'INSERT INTO messages (commission_id, sender, content) VALUES ($1,$2,$3) RETURNING *',
    [req.params.id, 'client', content.trim()]
  );
  res.status(201).json(rows[0]);
});

// Admin: list all users
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, is_admin, created_at FROM users ORDER BY created_at ASC'
  );
  res.json(rows);
});

// Admin: toggle admin status
router.patch('/:id/admin', requireAuth, async (req, res) => {
  const { isAdmin } = req.body;
  const { rows } = await pool.query(
    'UPDATE users SET is_admin=$1 WHERE id=$2 RETURNING id, name, email, is_admin',
    [isAdmin, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

export default router;
