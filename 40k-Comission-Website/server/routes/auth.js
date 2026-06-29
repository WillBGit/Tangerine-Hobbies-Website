import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Hash is generated from ADMIN_PASSWORD at startup — see index.js
let adminHash = null;
export function setAdminHash(hash) { adminHash = hash; }

router.post('/login', loginLimiter, async (req, res) => {
  const { password } = req.body;
  if (!password || !adminHash) return res.status(401).json({ error: 'Unauthorized' });
  const match = await bcrypt.compare(password, adminHash);
  if (!match) return res.status(401).json({ error: 'Invalid password' });
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

export default router;
