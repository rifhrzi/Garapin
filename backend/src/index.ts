import app from './app';
import { env } from './config/env';
import prisma from './config/database';
import { logger } from './utils/logger';
import { registerJobs } from './jobs';

const server = app.listen(env.PORT, () => {
  logger.info('Server started', { port: env.PORT, env: env.NODE_ENV });

  // Register cron jobs
  registerJobs();
});

// ── Graceful shutdown ──────────────────────────────────────────────
async function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down gracefully`);

  server.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    logger.info('Database disconnected');
    process.exit(0);
  });

  // Force exit after 10 seconds if connections haven't closed
  setTimeout(() => {
    logger.error('Forcefully shutting down after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
