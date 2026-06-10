import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = Router();

// Hash is generated from ADMIN_PASSWORD at startup — see index.js
let adminHash = null;
export function setAdminHash(hash) { adminHash = hash; }

router.post('/login', async (req, res) => {
  const { password } = req.body;
  if (!password || !adminHash) return res.status(401).json({ error: 'Unauthorized' });
  const match = await bcrypt.compare(password, adminHash);
  if (!match) return res.status(401).json({ error: 'Invalid password' });
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

export default router;
