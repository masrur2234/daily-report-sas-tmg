// TIDAK ADA static import!
// ESM hoisting = import dijalankan SEBELUM kode lain.
// Pakai dynamic import supaya env var bisa di-set/dihapus dulu.

const globalForPrisma = globalThis as unknown as {
  prisma: any
}

let dbPromise: Promise<any> | null = null

export async function getDb() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  if (!dbPromise) {
    dbPromise = (async () => {
      // HAPUS env var DATABASE_URL yang salah dari shell
      // Biar Prisma pakai value dari schema.prisma: "file:./dev.db"
      // yang resolve ke prisma/dev.db (BENAR)
      delete process.env.DATABASE_URL

      const { PrismaClient } = await import('@prisma/client')
      // JANGAN pass datasourceUrl! Biar Prisma pakai schema value.
      // datasourceUrl resolve relatif ke cwd, schema resolve relatif ke prisma/
      const prisma = new PrismaClient()

      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prisma
      }

      return prisma
    })()
  }

  return dbPromise
}
