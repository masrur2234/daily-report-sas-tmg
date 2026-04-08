import { PrismaClient } from '@prisma/client'

const directUrl = 'postgresql://neondb_owner:npg_yQNk4nERbIT8@ep-little-feather-a1xfqf2c.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
const db = new PrismaClient({ datasources: { db: { url: directUrl } } })

const dates = ['2025-05-15', '2025-06-15', '2025-07-15']

const kreditData = [
  { nama: 'Ahmad Fauzi', noa: 45, os: 2500000000, lancar: 2200000000, dpk: 200000000, totNpl: 100000000 },
  { nama: 'Budi Santoso', noa: 38, os: 1800000000, lancar: 1600000000, dpk: 150000000, totNpl: 50000000 },
  { nama: 'Citra Dewi', noa: 52, os: 3200000000, lancar: 3000000000, dpk: 180000000, totNpl: 20000000 },
  { nama: 'Dwi Prasetyo', noa: 41, os: 2100000000, lancar: 1750000000, dpk: 250000000, totNpl: 100000000 },
  { nama: 'Eko Saputra', noa: 35, os: 1500000000, lancar: 1400000000, dpk: 80000000, totNpl: 20000000 },
  { nama: 'Fitriani', noa: 48, os: 2800000000, lancar: 2500000000, dpk: 220000000, totNpl: 80000000 },
  { nama: 'Gunawan Wibowo', noa: 30, os: 1200000000, lancar: 1000000000, dpk: 150000000, totNpl: 50000000 },
  { nama: 'Hendra Kusuma', noa: 55, os: 3500000000, lancar: 3300000000, dpk: 120000000, totNpl: 80000000 },
]

const mutasiData = [
  { nama: 'Ahmad Fauzi', noaBefore: 42, osBefore: 2300000000, noaNow: 45, osNow: 2500000000 },
  { nama: 'Budi Santoso', noaBefore: 35, osBefore: 1700000000, noaNow: 38, osNow: 1800000000 },
  { nama: 'Citra Dewi', noaBefore: 50, osBefore: 3100000000, noaNow: 52, osNow: 3200000000 },
  { nama: 'Dwi Prasetyo', noaBefore: 39, osBefore: 1950000000, noaNow: 41, osNow: 2100000000 },
  { nama: 'Eko Saputra', noaBefore: 33, osBefore: 1400000000, noaNow: 35, osNow: 1500000000 },
  { nama: 'Fitriani', noaBefore: 45, osBefore: 2650000000, noaNow: 48, osNow: 2800000000 },
  { nama: 'Gunawan Wibowo', noaBefore: 28, osBefore: 1100000000, noaNow: 30, osNow: 1200000000 },
  { nama: 'Hendra Kusuma', noaBefore: 52, osBefore: 3350000000, noaNow: 55, osNow: 3500000000 },
]

const tabunganData = [
  { nama: 'Dian Permata', noaBefore: 120, osBefore: 850000000, noaNow: 135, osNow: 920000000 },
  { nama: 'Eka Wulandari', noaBefore: 98, osBefore: 620000000, noaNow: 105, osNow: 680000000 },
  { nama: 'Fitri Handayani', noaBefore: 145, osBefore: 1100000000, noaNow: 152, osNow: 1180000000 },
  { nama: 'Galih Pratama', noaBefore: 78, osBefore: 520000000, noaNow: 82, osNow: 560000000 },
  { nama: 'Hani Safitri', noaBefore: 110, osBefore: 780000000, noaNow: 118, osNow: 840000000 },
  { nama: 'Irfan Maulana', noaBefore: 65, osBefore: 430000000, noaNow: 70, osNow: 475000000 },
  { nama: 'Joko Widodo', noaBefore: 88, osBefore: 590000000, noaNow: 92, osNow: 630000000 },
  { nama: 'Kartini Sari', noaBefore: 132, osBefore: 950000000, noaNow: 140, osNow: 1020000000 },
]

const depositoData = [
  { nama: 'Dian Permata', noaBefore: 30, osBefore: 2500000000, noaNow: 32, osNow: 2700000000 },
  { nama: 'Eka Wulandari', noaBefore: 22, osBefore: 1800000000, noaNow: 25, osNow: 1950000000 },
  { nama: 'Fitri Handayani', noaBefore: 40, osBefore: 3500000000, noaNow: 38, osNow: 3400000000 },
  { nama: 'Galih Pratama', noaBefore: 18, osBefore: 1200000000, noaNow: 20, osNow: 1350000000 },
  { nama: 'Hani Safitri', noaBefore: 35, osBefore: 2800000000, noaNow: 37, osNow: 2950000000 },
  { nama: 'Irfan Maulana', noaBefore: 15, osBefore: 950000000, noaNow: 17, osNow: 1050000000 },
  { nama: 'Joko Widodo', noaBefore: 28, osBefore: 2100000000, noaNow: 30, osNow: 2250000000 },
  { nama: 'Kartini Sari', noaBefore: 42, osBefore: 3800000000, noaNow: 44, osNow: 4000000000 },
]

function calcRR(lancar: number, os: number) { return os > 0 ? (lancar / os) * 100 : 0 }
function calcNPL(totNpl: number, os: number) { return os > 0 ? (totNpl / os) * 100 : 0 }

async function seed() {
  console.log('Seeding Neon database...')

  for (const date of dates) {
    const mf = dates.indexOf(date) * 0.05 + 1

    const kredit = kreditData.map(d => {
      const v = mf - 0.02 + Math.random() * 0.04
      const noa = Math.round(d.noa * v), os = Math.round(d.os * v), lancar = Math.round(d.lancar * v)
      const dpk = Math.round(d.dpk * v), totNpl = Math.round(d.totNpl * v)
      return { nama: d.nama, noa, os, lancar, dpk, totNpl, rr: calcRR(lancar, os), npl: calcNPL(totNpl, os) }
    })

    const mutasi = mutasiData.map(d => {
      const v = mf - 0.02 + Math.random() * 0.04
      const nb = Math.round(d.noaBefore * v), ob = Math.round(d.osBefore * v)
      const nn = Math.round(d.noaNow * v), on = Math.round(d.osNow * v)
      return { nama: d.nama, noaBefore: nb, osBefore: ob, noaNow: nn, osNow: on, mutasiNoa: nn - nb, mutasiOs: on - ob }
    })

    const tabungan = tabunganData.map(d => {
      const v = mf - 0.02 + Math.random() * 0.04
      const nb = Math.round(d.noaBefore * v), ob = Math.round(d.osBefore * v)
      const nn = Math.round(d.noaNow * v), on = Math.round(d.osNow * v)
      return { nama: d.nama, noaBefore: nb, osBefore: ob, noaNow: nn, osNow: on, mutasiNoa: nn - nb, mutasiOs: on - ob }
    })

    const deposito = depositoData.map(d => {
      const v = mf - 0.02 + Math.random() * 0.04
      const nb = Math.round(d.noaBefore * v), ob = Math.round(d.osBefore * v)
      const nn = Math.round(d.noaNow * v), on = Math.round(d.osNow * v)
      return { nama: d.nama, noaBefore: nb, osBefore: ob, noaNow: nn, osNow: on, mutasiNoa: nn - nb, mutasiOs: on - ob }
    })

    await db.dashboardUpload.create({
      data: {
        fileName: `sample_${date}.xlsx`,
        uploadDate: date,
        kreditAO: { create: kredit },
        mutasiAO: { create: mutasi },
        tabunganFO: { create: tabungan },
        depositoFO: { create: deposito },
      }
    })
    console.log(`  OK: ${date}`)
  }
  console.log('Done!')
}

seed().catch(console.error).finally(() => db.$disconnect())
