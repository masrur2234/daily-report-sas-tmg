import { PrismaClient } from '@prisma/client'
import path from 'path'

// Force absolute path - bypass whatever DATABASE_URL is in env
const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db')

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: `file:${DB_PATH}`
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
