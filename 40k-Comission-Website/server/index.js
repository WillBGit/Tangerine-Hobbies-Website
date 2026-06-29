import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import portfolioRouter from './routes/portfolio.js';
import pricingRouter from './routes/pricing.js';
import commissionsRouter from './routes/commissions.js';
import messagesRouter from './routes/messages.js';
import trackRouter from './routes/track.js';
import usersRouter from './routes/users.js';
import authRouter, { setAdminHash } from './routes/auth.js';
import stripeRouter from './routes/stripe.js';
import uploadRouter from './routes/upload.js';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// Capture raw body for Stripe webhook signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl === '/api/stripe/webhook') req.rawBody = buf;
  }
}));

app.use('/api/portfolio', portfolioRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/commissions', commissionsRouter);
app.use('/api/commissions/:id/messages', messagesRouter);
app.use('/api/track', trackRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/upload', uploadRouter);

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
