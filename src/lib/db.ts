// ═══════════════════════════════════════════════════════════════
// DATABASE CONNECTION - NUCLEAR FIX
// ═══════════════════════════════════════════════════════════════
// Masalah: ESM hoisting menyebabkan static import dijalankan
// SEBELUM env var di-set. Prisma resolve "file:./dev.db" beda
// di CLI (relatif ke prisma/) vs runtime (relatif ke cwd).
//
// Solusi: Dynamic import + absolute path + create file if missing
// ═══════════════════════════════════════════════════════════════

const globalForPrisma = globalThis as unknown as {
  prisma: any
}

let dbPromise: Promise<any> | null = null

export async function getDb() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  if (!dbPromise) {
    dbPromise = (async () => {
      // 1. Dynamic import - TIDAK di-hoist oleh ESM
      const [pathModule, fsModule] = await Promise.all([
        import('path'),
        import('fs')
      ])

      // 2. Absolute path ke prisma/dev.db
      const DB_PATH = pathModule.join(process.cwd(), 'prisma', 'dev.db')
      const DB_DIR = pathModule.dirname(DB_PATH)

      // 3. Pastikan folder & file ada
      if (!fsModule.existsSync(DB_DIR)) {
        try { fsModule.mkdirSync(DB_DIR, { recursive: true }) } catch (e: any) {
          console.error('[db] Gagal buat folder:', e.message)
        }
      }
      if (!fsModule.existsSync(DB_PATH)) {
        try { fsModule.writeFileSync(DB_PATH, '') } catch (e: any) {
          console.error('[db] Gagal buat file db:', e.message)
        }
      }

      // 4. Override env var dengan absolute path
      process.env.DATABASE_URL = `file:${DB_PATH}`

      // 5. Dynamic import PrismaClient
      const { PrismaClient } = await import('@prisma/client')

      // 6. Buat PrismaClient dengan datasourceUrl ABSOLUTE
      const prisma = new PrismaClient({
        datasourceUrl: `file:${DB_PATH}`
      })

      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prisma
      }

      console.log('[db] ✅ Database terhubung:', DB_PATH)

      return prisma
    })()
  }

  return dbPromise
}
