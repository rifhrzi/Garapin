import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import { env } from './config/env';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { sanitizeBody } from './middleware/sanitize';
import { logger } from './utils/logger';
import routes from './routes';
import { disputeService } from './services/dispute.service';

const app = express();

// Trust proxy when behind a reverse proxy (Railway, Heroku, etc.)
if (env.NODE_ENV !== 'development') {
  app.set('trust proxy', 1);
}

// Security & parsing
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = env.FRONTEND_URL.split(',').map((u) => u.trim());
    if (!origin || allowed.includes(origin) || allowed.some((a) => origin.endsWith('.vercel.app') && a.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeBody);

// Rate limiting
app.use('/api', generalLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info('Server started', { port: env.PORT, env: env.NODE_ENV });

  // Only run cron jobs in production
  if (env.NODE_ENV === 'production') {
    // Schedule auto-dispute check daily at midnight
    cron.schedule('0 0 * * *', async () => {
      logger.info('Running auto-dispute check');
      try {
        const disputes = await disputeService.checkAutoDisputes();
        if (disputes.length > 0) {
          logger.info('Auto-disputes created', { count: disputes.length });
        } else {
          logger.info('No auto-disputes needed');
        }
      } catch (error) {
        logger.error('Auto-dispute check failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  } else {
    logger.info('Cron jobs disabled', { env: env.NODE_ENV });
  }
});

export default app;
