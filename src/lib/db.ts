import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db')

// Pastikan file database ada
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, '')
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: `file:${DB_PATH}`
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
