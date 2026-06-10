import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

import portfolioRouter from './routes/portfolio.js';
import pricingRouter from './routes/pricing.js';
import commissionsRouter from './routes/commissions.js';
import messagesRouter from './routes/messages.js';
import trackRouter from './routes/track.js';
import usersRouter from './routes/users.js';
import authRouter, { setAdminHash } from './routes/auth.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/portfolio', portfolioRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/commissions', commissionsRouter);
app.use('/api/commissions/:id/messages', messagesRouter);
app.use('/api/track', trackRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;

async function start() {
  if (!process.env.ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  setAdminHash(hash);

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start();
