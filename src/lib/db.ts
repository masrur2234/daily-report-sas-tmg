// TIDAK ADA static import PrismaClient!
// ESM hoisting menyebabkan import dijalankan SEBELUM env var di-set.

const globalForPrisma = globalThis as unknown as {
  prisma: any
}

let dbPromise: Promise<any> | null = null

export async function getDb() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  if (!dbPromise) {
    dbPromise = (async () => {
      // SET ENV VAR DULU, baru import PrismaClient
      process.env.DATABASE_URL = 'file:./dev.db'

      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()

      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prisma
      }

      return prisma
    })()
  }

  return dbPromise
}
