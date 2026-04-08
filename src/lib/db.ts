// ═══════════════════════════════════════════════════════════════
// DATABASE CONNECTION - VERCEL / SERVERLESS FIX
// ═══════════════════════════════════════════════════════════════

const globalForPrisma = globalThis as unknown as {
  prisma: any
}

let dbPromise: Promise<any> | null = null

export async function getDb() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  if (!dbPromise) {
    dbPromise = (async () => {
      const { PrismaClient } = await import('@prisma/client')

      // Cek apakah ada DATABASE_URL PostgreSQL (untuk Vercel)
      const envUrl = process.env.DATABASE_URL
      const isPostgres = envUrl && (envUrl.startsWith('postgres://') || envUrl.startsWith('postgresql://'))

      if (isPostgres) {
        const prisma = new PrismaClient()
        if (process.env.NODE_ENV !== 'production') {
          globalForPrisma.prisma = prisma
        }
        console.log('[db] ✅ PostgreSQL mode')
        return prisma
      }

      // LOCAL DEV: SQLite di prisma/dev.db
      const path = await import('path')
      const fs = await import('fs')
      const isServerless = process.cwd() === '/var/task' || process.env.VERCEL
      let DB_PATH: string

      if (isServerless) {
        DB_PATH = '/tmp/dev.db'
        console.log('[db] ⚠️ Serverless - SQLite di /tmp (tidak persistent)')
      } else {
        DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db')
        const DB_DIR = path.dirname(DB_PATH)
        if (!fs.existsSync(DB_DIR)) {
          try { fs.mkdirSync(DB_DIR, { recursive: true }) } catch {}
        }
      }

      if (!fs.existsSync(DB_PATH)) {
        try { fs.writeFileSync(DB_PATH, '') } catch {}
      }

      const prisma = new PrismaClient({
        datasourceUrl: `file:${DB_PATH}`
      })

      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prisma
      }

      console.log('[db] ✅ SQLite mode:', DB_PATH)
      return prisma
    })()
  }

  return dbPromise
}
