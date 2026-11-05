import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import api from './routes/api.js';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 250, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use('/api', api);
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, _req, res, _next) => {
  if (err?.name === 'ZodError') return res.status(400).json({ message: 'Invalid input', issues: err.issues });
  if (err?.name === 'ValidationError') return res.status(400).json({ message: 'Validation failed', details: err.message });
  if (err?.name === 'CastError') return res.status(400).json({ message: 'Invalid identifier' });
  if (Number.isInteger(err?.status) && err.status >= 400 && err.status <= 599) {
    if (err.status >= 500) console.error(err?.message || 'Request failed');
    return res.status(err.status).json({ message: err.message || 'Request failed' });
  }
  console.error(err?.message || 'Unhandled error');
  res.status(500).json({ message: 'Internal server error' });
});

const port = Number(process.env.PORT || 5000);
connectDB().then(() => app.listen(port, () => console.log(`API listening on http://localhost:${port}`)))
  .catch(err => { console.error('Startup failed:', err.message); process.exit(1); });

export default app;
