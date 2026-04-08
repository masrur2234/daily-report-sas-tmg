import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function normalizeHeader(header: string): string {
  return header.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function findColumn(headers: string[], ...candidates: string[]): number {
  for (const candidate of candidates) {
    const normalized = normalizeHeader(candidate);
    const idx = headers.findIndex(h => normalizeHeader(h) === normalized);
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

// ═══════════════════════════════════════════════════════════════
// PARSERS
// ═══════════════════════════════════════════════════════════════

function parseKreditFromSheet(sheet: XLSX.WorkSheet) {
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (!jsonData.length) return [];
  const headers = Object.keys(jsonData[0]);

  const colNama = findColumn(headers, 'Nama AO', 'Nama', 'nama', 'AO', 'ao', 'nama ao');
  const colNoa = findColumn(headers, 'NOA', 'noa', 'Noa');
  const colOs = findColumn(headers, 'OS', 'os', 'Total Baki Debet', 'Baki Debet', 'baki debet');
  const colLancar = findColumn(headers, 'LANCAR', 'lancar', 'Lancar');
  const colDpk1to30 = findColumn(headers, '01-30', '01 30', '0130', '1-30', '1 30', '130',
    '01 - 30', '1 - 30', 'HARI 1-30', 'hari130', 'DPK 1-30', 'DPK1-30',
    'DPK 130', 'DPK130', 'DPK(1-30)', 'DPK (1-30)');
  const colDpk = findColumn(headers, 'DPK', 'dpk', 'Dpk');
  const colTotNpl = findColumn(headers, 'TOTNPL', 'totnpl', 'Total NPL', 'total npl', 'Tot NPL', 'tot npl', 'NPL Total', 'npl total');

  return jsonData.map(row => {
    const vals = Object.values(row);
    const nama = colNama >= 0 ? String(vals[colNama] || '').trim() : '';
    if (!nama) return null;

    const noa = parseNumber(colNoa >= 0 ? vals[colNoa] : 0);
    const os = parseNumber(colOs >= 0 ? vals[colOs] : 0);
    const lancar = parseNumber(colLancar >= 0 ? vals[colLancar] : 0);
    const dpk1to30 = parseNumber(colDpk1to30 >= 0 ? vals[colDpk1to30] : 0);
    const dpk = parseNumber(colDpk >= 0 ? vals[colDpk] : 0);
    let totNpl = parseNumber(colTotNpl >= 0 ? vals[colTotNpl] : 0);

    // NPL fallback: TOTNPL = OS - LANCAR - DPK (jika tidak ada kolom TOTNPL)
    // Catatan: 01-30 sudah termasuk dalam LANCAR, jadi TIDAK dikurangi lagi
    if (!totNpl) {
      totNpl = os - lancar - dpk;
      if (totNpl < 0) totNpl = 0;
    }

    // RR = LANCAR / OS × 100 (hanya kolom LANCAR, tanpa 01-30)
    const rr = os > 0 ? (lancar / os) * 100 : 0;
    // NPL = TOTNPL / OS × 100
    const npl = os > 0 ? (totNpl / os) * 100 : 0;

    return { nama, noa, os, lancar, dpk1to30, dpk, totNpl, rr, npl };
  }).filter(Boolean) as any[];
}

function parseMutasiFromSheet(sheet: XLSX.WorkSheet) {
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (!jsonData.length) return [];
  const headers = Object.keys(jsonData[0]);

  const colNama = findColumn(headers, 'Nama AO', 'Nama', 'nama', 'AO', 'ao', 'nama ao');
  const colNoaBefore = findColumn(headers, 'NOA Bulan Lalu', 'NOA (Bulan Lalu)', 'noa bulan lalu', 'NOA Bl', 'NOA BL');
  const colOsBefore = findColumn(headers, 'OS Bulan Lalu', 'OS (Bulan Lalu)', 'os bulan lalu', 'OS Bl', 'OS BL');
  const colNoaNow = findColumn(headers, 'NOA Sekarang', 'NOA (Sekarang)', 'NOA Bulan Ini', 'noa sekarang', 'NOA Now');
  const colOsNow = findColumn(headers, 'OS Sekarang', 'OS (Sekarang)', 'OS Bulan Ini', 'os sekarang', 'OS Now');
  const colMutasiNoa = findColumn(headers, 'Mutasi NOA', 'mutasi noa', 'MutasiNoa');
  const colMutasiOs = findColumn(headers, 'Mutasi OS', 'mutasi os', 'MutasiOs');

  return jsonData.map(row => {
    const vals = Object.values(row);
    const nama = colNama >= 0 ? String(vals[colNama] || '').trim() : '';
    if (!nama) return null;

    const noaBefore = parseNumber(colNoaBefore >= 0 ? vals[colNoaBefore] : 0);
    const osBefore = parseNumber(colOsBefore >= 0 ? vals[colOsBefore] : 0);
    const noaNow = parseNumber(colNoaNow >= 0 ? vals[colNoaNow] : 0);
    const osNow = parseNumber(colOsNow >= 0 ? vals[colOsNow] : 0);
    const mutasiNoa = parseNumber(colMutasiNoa >= 0 ? vals[colMutasiNoa] : (noaNow - noaBefore));
    const mutasiOs = parseNumber(colMutasiOs >= 0 ? vals[colMutasiOs] : (osNow - osBefore));

    return { nama, noaBefore, osBefore, noaNow, osNow, mutasiNoa, mutasiOs };
  }).filter(Boolean) as any[];
}

function parseFundingFromSheet(sheet: XLSX.WorkSheet) {
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (!jsonData.length) return [];
  const headers = Object.keys(jsonData[0]);

  const colNama = findColumn(headers, 'Nama FO', 'Nama', 'nama', 'FO', 'fo', 'nama fo', 'Nama AO', 'AO', 'ao');
  const colNoaBefore = findColumn(headers, 'NOA Bulan Lalu', 'NOA (Bulan Lalu)', 'noa bulan lalu', 'NOA Bl');
  const colOsBefore = findColumn(headers, 'OS Bulan Lalu', 'OS (Bulan Lalu)', 'os bulan lalu', 'OS Bl');
  const colNoaNow = findColumn(headers, 'NOA Sekarang', 'NOA (Sekarang)', 'NOA Bulan Ini', 'noa sekarang', 'NOA Now');
  const colOsNow = findColumn(headers, 'OS Sekarang', 'OS (Sekarang)', 'OS Bulan Ini', 'os sekarang', 'OS Now');
  const colMutasiNoa = findColumn(headers, 'Mutasi NOA', 'mutasi noa', 'MutasiNoa');
  const colMutasiOs = findColumn(headers, 'Mutasi OS', 'mutasi os', 'MutasiOs');
  const colNoa = findColumn(headers, 'NOA', 'noa');
  const colOs = findColumn(headers, 'OS', 'os');
  const colMutasi = findColumn(headers, 'Mutasi', 'mutasi');
  const hasTwoPeriods = colNoaBefore >= 0 || colOsBefore >= 0 || colNoaNow >= 0 || colOsNow >= 0;

  return jsonData.map(row => {
    const vals = Object.values(row);
    const nama = colNama >= 0 ? String(vals[colNama] || '').trim() : '';
    if (!nama) return null;

    if (hasTwoPeriods) {
      const noaBefore = parseNumber(colNoaBefore >= 0 ? vals[colNoaBefore] : 0);
      const osBefore = parseNumber(colOsBefore >= 0 ? vals[colOsBefore] : 0);
      const noaNow = parseNumber(colNoaNow >= 0 ? vals[colNoaNow] : 0);
      const osNow = parseNumber(colOsNow >= 0 ? vals[colOsNow] : 0);
      const mutasiNoa = parseNumber(colMutasiNoa >= 0 ? vals[colMutasiNoa] : (noaNow - noaBefore));
      const mutasiOs = parseNumber(colMutasiOs >= 0 ? vals[colMutasiOs] : (osNow - osBefore));
      return { nama, noaBefore, osBefore, noaNow, osNow, mutasiNoa, mutasiOs };
    } else {
      const noaNow = parseNumber(colNoa >= 0 ? vals[colNoa] : 0);
      const osNow = parseNumber(colOs >= 0 ? vals[colOs] : 0);
      const mutasi = parseNumber(colMutasi >= 0 ? vals[colMutasi] : 0);
      return { nama, noaBefore: 0, osBefore: osNow - mutasi, noaNow, osNow, mutasiNoa: 0, mutasiOs: mutasi };
    }
  }).filter(Boolean) as any[];
}

function findSheet(workbook: XLSX.WorkBook, keywords: string[]): XLSX.WorkSheet | null {
  for (const keyword of keywords) {
    const found = workbook.SheetNames.find(s => s.toLowerCase().includes(keyword.toLowerCase()));
    if (found) return workbook.Sheets[found];
  }
  return workbook.Sheets[0] || null;
}

// ═══════════════════════════════════════════════════════════════
// API ROUTE
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  let db: any;
  try {
    const { getDb } = await import('@/lib/db');
    db = await getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Database init error: ${msg}` }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadDate = formData.get('uploadDate') as string;
    const sheetType = formData.get('sheetType') as string | null;

    if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    if (!uploadDate) return NextResponse.json({ error: 'Tanggal upload harus diisi' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // MODE: Per-Table Upload
    if (sheetType) {
      const sheet = findSheet(workbook, [sheetType === 'kredit' ? 'kredit' : sheetType === 'tabungan' ? 'tabungan' : 'deposito']);
      if (!sheet) {
        return NextResponse.json({ error: `Sheet tidak ditemukan. Sheet: ${workbook.SheetNames.join(', ')}` }, { status: 400 });
      }

      let upload = await db.dashboardUpload.findFirst({ where: { uploadDate } });
      if (!upload) {
        upload = await db.dashboardUpload.create({ data: { fileName: `${sheetType}_${file.name}`, uploadDate } });
      }

      if (sheetType === 'kredit') {
        const data = parseKreditFromSheet(sheet);
        if (data.length === 0) return NextResponse.json({ error: 'Tidak ada data kredit' }, { status: 400 });
        await db.kreditAO.deleteMany({ where: { uploadId: upload.id } });
        await db.kreditAO.createMany({
          data: data.map(d => ({
            uploadId: upload!.id, nama: d.nama, noa: d.noa, os: d.os,
            lancar: d.lancar, dpk1to30: d.dpk1to30, dpk: d.dpk,
            totNpl: d.totNpl, rr: d.rr, npl: d.npl,
          }))
        });

        const mutasiSheet = workbook.SheetNames.find(s => s.toLowerCase().includes('mutasi'));
        if (mutasiSheet) {
          const mutasiData = parseMutasiFromSheet(workbook.Sheets[mutasiSheet]);
          if (mutasiData.length > 0) {
            await db.mutasiAO.deleteMany({ where: { uploadId: upload.id } });
            await db.mutasiAO.createMany({ data: mutasiData.map(d => ({ uploadId: upload!.id, nama: d.nama, noaBefore: d.noaBefore, osBefore: d.osBefore, noaNow: d.noaNow, osNow: d.osNow, mutasiNoa: d.mutasiNoa, mutasiOs: d.mutasiOs })) });
          }
        }
        return NextResponse.json({ success: true, stats: { kredit: data.length, mutasi: 0, tabungan: 0, deposito: 0 } });

      } else if (sheetType === 'tabungan') {
        const data = parseFundingFromSheet(sheet);
        if (data.length === 0) return NextResponse.json({ error: 'Tidak ada data tabungan' }, { status: 400 });
        await db.tabunganFO.deleteMany({ where: { uploadId: upload.id } });
        await db.tabunganFO.createMany({ data: data.map(d => ({ uploadId: upload!.id, nama: d.nama, noaBefore: d.noaBefore, osBefore: d.osBefore, noaNow: d.noaNow, osNow: d.osNow, mutasiNoa: d.mutasiNoa, mutasiOs: d.mutasiOs })) });
        return NextResponse.json({ success: true, stats: { kredit: 0, mutasi: 0, tabungan: data.length, deposito: 0 } });

      } else if (sheetType === 'deposito') {
        const data = parseFundingFromSheet(sheet);
        if (data.length === 0) return NextResponse.json({ error: 'Tidak ada data deposito' }, { status: 400 });
        await db.depositoFO.deleteMany({ where: { uploadId: upload.id } });
        await db.depositoFO.createMany({ data: data.map(d => ({ uploadId: upload!.id, nama: d.nama, noaBefore: d.noaBefore, osBefore: d.osBefore, noaNow: d.noaNow, osNow: d.osNow, mutasiNoa: d.mutasiNoa, mutasiOs: d.mutasiOs })) });
        return NextResponse.json({ success: true, stats: { kredit: 0, mutasi: 0, tabungan: 0, deposito: data.length } });
      }

      return NextResponse.json({ error: 'Tipe sheet tidak valid' }, { status: 400 });
    }

    // MODE: Full Upload
    const kreditSheet = findSheet(workbook, ['kredit', 'ao', 'credit']);
    const mutasiSheet = findSheet(workbook, ['mutasi']);
    const tabunganSheet = findSheet(workbook, ['tabungan', 'saving']);
    const depositoSheet = findSheet(workbook, ['deposito', 'deposit', 'time deposit']);

    if (!kreditSheet && !mutasiSheet && !tabunganSheet && !depositoSheet) {
      return NextResponse.json({ error: `Sheet tidak ditemukan. Sheet: ${workbook.SheetNames.join(', ')}` }, { status: 400 });
    }

    const kreditData = kreditSheet ? parseKreditFromSheet(kreditSheet) : [];
    const mutasiData = mutasiSheet ? parseMutasiFromSheet(mutasiSheet) : [];
    const tabunganData = tabunganSheet ? parseFundingFromSheet(tabunganSheet) : [];
    const depositoData = depositoSheet ? parseFundingFromSheet(depositoSheet) : [];

    if (kreditData.length === 0 && mutasiData.length === 0 && tabunganData.length === 0 && depositoData.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang bisa diparsing.' }, { status: 400 });
    }

    const existingUpload = await db.dashboardUpload.findFirst({ where: { uploadDate } });
    if (existingUpload) {
      await db.kreditAO.deleteMany({ where: { uploadId: existingUpload.id } });
      await db.mutasiAO.deleteMany({ where: { uploadId: existingUpload.id } });
      await db.tabunganFO.deleteMany({ where: { uploadId: existingUpload.id } });
      await db.depositoFO.deleteMany({ where: { uploadId: existingUpload.id } });
      await db.dashboardUpload.delete({ where: { id: existingUpload.id } });
    }

    await db.dashboardUpload.create({
      data: {
        fileName: file.name, uploadDate,
        kreditAO: { create: kreditData.map(d => ({
          nama: d.nama, noa: d.noa, os: d.os,
          lancar: d.lancar, dpk1to30: d.dpk1to30, dpk: d.dpk,
          totNpl: d.totNpl, rr: d.rr, npl: d.npl,
        })) },
        mutasiAO: { create: mutasiData.map(d => ({ nama: d.nama, noaBefore: d.noaBefore, osBefore: d.osBefore, noaNow: d.noaNow, osNow: d.osNow, mutasiNoa: d.mutasiNoa, mutasiOs: d.mutasiOs })) },
        tabunganFO: { create: tabunganData.map(d => ({ nama: d.nama, noaBefore: d.noaBefore, osBefore: d.osBefore, noaNow: d.noaNow, osNow: d.osNow, mutasiNoa: d.mutasiNoa, mutasiOs: d.mutasiOs })) },
        depositoFO: { create: depositoData.map(d => ({ nama: d.nama, noaBefore: d.noaBefore, osBefore: d.osBefore, noaNow: d.noaNow, osNow: d.osNow, mutasiNoa: d.mutasiNoa, mutasiOs: d.mutasiOs })) },
      }
    });

    return NextResponse.json({ success: true, stats: { kredit: kreditData.length, mutasi: mutasiData.length, tabungan: tabunganData.length, deposito: depositoData.length } });

  } catch (error) {
    console.error('Upload error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Upload gagal: ${msg}` }, { status: 500 });
  }
}
