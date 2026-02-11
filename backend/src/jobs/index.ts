import cron from 'node-cron';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { runAutoDisputeCheck } from './auto-dispute.job';

/**
 * Register all scheduled (cron) jobs.
 * Only runs in production/staging to avoid side-effects during development.
 */
export function registerJobs() {
  if (env.NODE_ENV === 'development') {
    logger.info('Cron jobs disabled in development');
    return;
  }

  // Auto-dispute check: daily at midnight UTC
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running auto-dispute check');
    try {
      const count = await runAutoDisputeCheck();
      logger.info('Auto-dispute check completed', { disputesCreated: count });
    } catch (error) {
      logger.error('Auto-dispute check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  logger.info('Cron jobs registered');
}
