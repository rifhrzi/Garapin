import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Connection pool is configured via DATABASE_URL params:
  // ?connection_limit=10&pool_timeout=30
  // See: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections
});

// Graceful shutdown: disconnect Prisma on process termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
