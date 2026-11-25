import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.clientOrigins }));
  app.use(express.json({ limit: '6mb' })); // listings carry up to 4 small resized photos

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // slows down password guessing
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
  });
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/listings', listingRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

  // one place that turns errors into JSON the frontend can show
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'That request is too large. Try fewer or smaller photos.' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Bad request.' });
    if (err.name === 'ValidationError') return res.status(400).json({ error: Object.values(err.errors)[0].message });
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });

  return app;
}
