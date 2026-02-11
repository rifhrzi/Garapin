import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { corsOptions } from './config/cors';
import prisma from './config/database';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { sanitizeBody } from './middleware/sanitize';
import routes from './routes';

const app = express();

// Trust proxy when behind a reverse proxy (Railway, Heroku, etc.)
if (env.NODE_ENV !== 'development') {
  app.set('trust proxy', 1);
}

// Security & parsing
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeBody);

// Rate limiting
app.use('/api', generalLimiter);

// Health check (with DB connectivity verification)
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

export default app;
