import { PrismaClient } from '@prisma/client'

// FORCE override DATABASE_URL before anything else
process.env.DATABASE_URL = 'file:/home/z/my-project/prisma/dev.db'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
