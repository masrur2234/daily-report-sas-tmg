// ═══════════════════════════════════════════════════════════════
// DATABASE CONNECTION - Neon PostgreSQL
// ═══════════════════════════════════════════════════════════════

const globalForPrisma = globalThis as unknown as {
  prisma: any
}

export async function getDb() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }

  return prisma
}
