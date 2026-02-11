import { CorsOptions } from 'cors';
import { env } from './env';

/**
 * Build the CORS allowed-origins list from environment variables.
 *
 * Priority: CORS_ORIGINS (explicit comma-separated list)
 * Fallback: FRONTEND_URL (comma-separated, legacy support)
 */
function getAllowedOrigins(): string[] {
  const raw = env.CORS_ORIGINS ?? env.FRONTEND_URL;
  return raw
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
}

const allowedOrigins = getAllowedOrigins();

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, health checks, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
};
