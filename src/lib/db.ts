import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const DB_DIR = path.join(process.cwd(), 'prisma')
const DB_PATH = path.join(DB_DIR, 'dev.db')

if (!fs.existsSync(DB_DIR)) {
  try { fs.mkdirSync(DB_DIR, { recursive: true }) } catch {}
}

if (!fs.existsSync(DB_PATH)) {
  try { fs.writeFileSync(DB_PATH, '') } catch {}
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let _db: PrismaClient | null = null

try {
  _db = globalForPrisma.prisma ?? new PrismaClient({
    datasourceUrl: `file:${DB_PATH}`
  })
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _db
} catch (err) {
  console.error('Failed to initialize PrismaClient:', err)
}

export const db = _db!
