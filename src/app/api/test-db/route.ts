// Comprehensive database diagnostic endpoint
export async function GET() {
  const cwd = process.cwd()
  const dbPathManual = cwd + '/prisma/dev.db'
  
  let fsOk = false
  let fileExists = false
  let dirExists = false
  let mkdirResult = ''
  let touchResult = ''
  let lsResult = ''

  try {
    const fs = await import('fs')
    fsOk = true
    dirExists = fs.existsSync(cwd + '/prisma')
    fileExists = fs.existsSync(dbPathManual)
    
    if (!dirExists) {
      try { fs.mkdirSync(cwd + '/prisma', { recursive: true }); mkdirResult = 'OK - created' } catch (e: any) { mkdirResult = 'FAIL: ' + e.message }
    }
    
    if (!fileExists) {
      try { fs.writeFileSync(dbPathManual, ''); touchResult = 'OK - created' } catch (e: any) { touchResult = 'FAIL: ' + e.message }
    } else {
      touchResult = 'already exists'
    }
    
    try { lsResult = JSON.stringify(fs.readdirSync(cwd + '/prisma')) } catch (e: any) { lsResult = 'FAIL: ' + e.message }
  } catch (e: any) {
    fsOk = false
  }

  let prismaResult: any = null
  let prismaError = ''
  try {
    process.env.DATABASE_URL = 'file:' + dbPathManual
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient({ datasourceUrl: 'file:' + dbPathManual })
    const count = await prisma.dashboardUpload.count()
    prismaResult = { ok: true, count }
    await prisma.$disconnect()
  } catch (e: any) {
    prismaError = e.message
  }

  return Response.json({
    cwd,
    dbPath: dbPathManual,
    dirExists,
    fileExists,
    fsWorks: fsOk,
    mkdirResult,
    touchResult,
    lsFiles: lsResult,
    envDATABASE_URL: process.env.DATABASE_URL,
    prismaResult,
    prismaError,
  })
}
