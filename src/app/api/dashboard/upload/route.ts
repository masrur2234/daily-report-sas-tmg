import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

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

function hitungRR(lancar: number, os: number): number {
  if (!os || os === 0) return 0;
  return (lancar / os) * 100;
}

function hitungNPL(totNpl: number, os: number): number {
  if (!os || os === 0) return 0;
  return (totNpl / os) * 100;
}

function parseNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

function parseKreditFromSheet(sheet: XLSX.WorkSheet): { nama: string; noa: number; os: number; lancar: number; dpk: number; totNpl: number; rr: number; npl: number }[] {
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (!jsonData.length) return [];

  const headers = Object.keys(jsonData[0]);
  const colNama = findColumn(headers, 'Nama AO', 'Nama', 'nama', 'AO', 'ao', 'nama ao');
  const colNoa = findColumn(headers, 'NOA', 'noa', 'Noa', 'Nomer Rekening');
  const colOs = findColumn(headers, 'OS', 'os', 'Total Baki Debet', 'Baki Debet', 'baki debet', 'total baki debet');
  const colLancar = findColumn(headers, 'LANCAR', 'lancar', 'Lancar');
  const colDpk = findColumn(headers, 'DPK', 'dpk', 'Dpk');
  const colTotNpl = findColumn(headers, 'TOTNPL', 'totnpl', 'Total NPL', 'total npl', 'Tot NPL', 'tot npl', 'NPL Total', 'npl total');

  return jsonData.map(row => {
    const vals = Object.values(row);
    const nama = colNama >= 0 ? String(vals[colNama] || '').trim() : '';
    if (!nama) return null;

    const noa = parseNumber(colNoa >= 0 ? vals[colNoa] : 0);
    const os = parseNumber(colOs >= 0 ? vals[colOs] : 0);
    const lancar = parseNumber(colLancar >= 0 ? vals[colLancar] : 0);
    const dpk = parseNumber(colDpk >= 0 ? vals[colDpk] : 0);

    let totNpl = parseNumber(colTotNpl >= 0 ? vals[colTotNpl] : 0);
    if (!totNpl) {
      totNpl = os - lancar;
      if (totNpl < 0) totNpl = 0;
    }

    const rr = hitungRR(lancar, os);
    const npl = hitungNPL(totNpl, os);

    return { nama, noa, os, lancar, dpk, totNpl, rr, npl };
  }).filter(Boolean) as { nama: string; noa: number; os: number; lancar: number; dpk: number; totNpl: number; rr: number; npl: number }[];
}

function parseMutasiFromSheet(sheet: XLSX.WorkSheet): { nama: string; noaBefore: number; osBefore: number; noaNow: number; osNow: number; mutasiNoa: number; mutasiOs: number }[] {
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (!jsonData.length) return [];

  const headers = Object.keys(jsonData[0]);
  const colNama = findColumn(headers, 'Nama AO', 'Nama', 'nama', 'AO', 'ao', 'nama ao');
  const colNoaBefore = findColumn(headers, 'NOA Bulan Lalu', 'NOA (Bulan Lalu)', 'noa bulan lalu', 'NOA Bl', 'NOA BL', 'Noa Bulan Lalu');
  const colOsBefore = findColumn(headers, 'OS Bulan Lalu', 'OS (Bulan Lalu)', 'os bulan lalu', 'OS Bl', 'OS BL', 'Os Bulan Lalu');
  const colNoaNow = findColumn(headers, 'NOA Sekarang', 'NOA (Sekarang)', 'NOA Bulan Ini', 'noa sekarang', 'NOA Now', 'Noa Sekarang');
  const colOsNow = findColumn(headers, 'OS Sekarang', 'OS (Sekarang)', 'OS Bulan Ini', 'os sekarang', 'OS Now', 'Os Sekarang');
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
  }).filter(Boolean) as { nama: string; noaBefore: number; osBefore: number; noaNow: number; osNow: number; mutasiNoa: number; mutasiOs: number }[];
}

function parseFundingFromSheet(sheet: XLSX.WorkSheet): { nama: string; noaBefore: number; osBefore: number; noaNow: number; osNow: number; mutasiNoa: number; mutasiOs: number }[] {
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (!jsonData.length) return [];

  const headers = Object.keys(jsonData[0]);
  const colNama = findColumn(headers, 'Nama FO', 'Nama', 'nama', 'FO', 'fo', 'nama fo', 'Nama AO', 'AO', 'ao', 'nama ao');
  const colNoaBefore = findColumn(headers, 'NOA Bulan Lalu', 'NOA (Bulan Lalu)', 'noa bulan lalu', 'NOA Bl', 'NOA BL', 'Noa Bulan Lalu');
  const colOsBefore = findColumn(headers, 'OS Bulan Lalu', 'OS (Bulan Lalu)', 'os bulan lalu', 'OS Bl', 'OS BL', 'Os Bulan Lalu');
  const colNoaNow = findColumn(headers, 'NOA Sekarang', 'NOA (Sekarang)', 'NOA Bulan Ini', 'noa sekarang', 'NOA Now', 'Noa Sekarang');
  const colOsNow = findColumn(headers, 'OS Sekarang', 'OS (Sekarang)', 'OS Bulan Ini', 'os sekarang', 'OS Now', 'Os Sekarang');
  const colMutasiNoa = findColumn(headers, 'Mutasi NOA', 'mutasi noa', 'MutasiNoa');
  const colMutasiOs = findColumn(headers, 'Mutasi OS', 'mutasi os', 'MutasiOs');

  // Fallback: simple format (NOA, OS, Mutasi)
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
      return {
        nama,
        noaBefore: 0,
        osBefore: osNow - mutasi,
        noaNow,
        osNow,
        mutasiNoa: 0,
        mutasiOs: mutasi,
      };
    }
  }).filter(Boolean) as { nama: string; noaBefore: number; osBefore: number; noaNow: number; osNow: number; mutasiNoa: number; mutasiOs: number }[];
}

// Find the best sheet in a workbook by keywords
function findSheet(workbook: XLSX.WorkBook, keywords: string[]): XLSX.WorkSheet | null {
  // Try matching by sheet name
  for (const keyword of keywords) {
    const found = workbook.SheetNames.find(s => s.toLowerCase().includes(keyword.toLowerCase()));
    if (found) return workbook.Sheets[found];
  }
  // Fallback: first sheet
  return workbook.Sheets[0] || null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadDate = formData.get('uploadDate') as string;
    const sheetType = formData.get('sheetType') as string | null; // 'kredit', 'tabungan', 'deposito', or null (full mode)

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    if (!uploadDate) {
      return NextResponse.json({ error: 'Tanggal upload harus diisi' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // =============================================
    // MODE: Per-Table Upload (sheetType specified)
    // =============================================
    if (sheetType) {
      const sheet = findSheet(workbook, [sheetType === 'kredit' ? 'kredit' : sheetType === 'tabungan' ? 'tabungan' : 'deposito']);
      if (!sheet) {
        return NextResponse.json({ error: `Sheet tidak ditemukan dalam file` }, { status: 400 });
      }

      // Find or create upload record for this date
      let upload = await db.dashboardUpload.findFirst({ where: { uploadDate } });
      if (!upload) {
        upload = await db.dashboardUpload.create({
          data: { fileName: `${sheetType}_${file.name}`, uploadDate }
        });
      }

      if (sheetType === 'kredit') {
        const data = parseKreditFromSheet(sheet);
        if (data.length === 0) {
          return NextResponse.json({ error: 'Tidak ada data kredit yang bisa diparsing' }, { status: 400 });
        }
        // Delete old kredit data for this upload
        await db.kreditAO.deleteMany({ where: { uploadId: upload.id } });
        await db.kreditAO.createMany({
          data: data.map(d => ({
            uploadId: upload!.id,
            nama: d.nama,
            noa: d.noa,
            os: d.os,
            lancar: d.lancar,
            dpk: d.dpk,
            totNpl: d.totNpl,
            rr: d.rr,
            npl: d.npl,
          }))
        });

        // Also try to parse mutasi from the same file (second sheet)
        const mutasiSheet = workbook.Sheets.find(s => {
          const name = s.toLowerCase();
          return name.includes('mutasi');
        });
        if (mutasiSheet) {
          const mutasiData = parseMutasiFromSheet(mutasiSheet);
          if (mutasiData.length > 0) {
            await db.mutasiAO.deleteMany({ where: { uploadId: upload.id } });
            await db.mutasiAO.createMany({
              data: mutasiData.map(d => ({
                uploadId: upload!.id,
                nama: d.nama,
                noaBefore: d.noaBefore,
                osBefore: d.osBefore,
                noaNow: d.noaNow,
                osNow: d.osNow,
                mutasiNoa: d.mutasiNoa,
                mutasiOs: d.mutasiOs,
              }))
            });
          }
        }

        return NextResponse.json({
          success: true,
          message: `Kredit berhasil diupload`,
          stats: { kredit: data.length, mutasi: 0, tabungan: 0, deposito: 0 }
        });

      } else if (sheetType === 'tabungan') {
        const data = parseFundingFromSheet(sheet);
        if (data.length === 0) {
          return NextResponse.json({ error: 'Tidak ada data tabungan yang bisa diparsing' }, { status: 400 });
        }
        await db.tabunganFO.deleteMany({ where: { uploadId: upload.id } });
        await db.tabunganFO.createMany({
          data: data.map(d => ({
            uploadId: upload!.id,
            nama: d.nama,
            noaBefore: d.noaBefore,
            osBefore: d.osBefore,
            noaNow: d.noaNow,
            osNow: d.osNow,
            mutasiNoa: d.mutasiNoa,
            mutasiOs: d.mutasiOs,
          }))
        });
        return NextResponse.json({
          success: true,
          message: `Tabungan berhasil diupload`,
          stats: { kredit: 0, mutasi: 0, tabungan: data.length, deposito: 0 }
        });

      } else if (sheetType === 'deposito') {
        const data = parseFundingFromSheet(sheet);
        if (data.length === 0) {
          return NextResponse.json({ error: 'Tidak ada data deposito yang bisa diparsing' }, { status: 400 });
        }
        await db.depositoFO.deleteMany({ where: { uploadId: upload.id } });
        await db.depositoFO.createMany({
          data: data.map(d => ({
            uploadId: upload!.id,
            nama: d.nama,
            noaBefore: d.noaBefore,
            osBefore: d.osBefore,
            noaNow: d.noaNow,
            osNow: d.osNow,
            mutasiNoa: d.mutasiNoa,
            mutasiOs: d.mutasiOs,
          }))
        });
        return NextResponse.json({
          success: true,
          message: `Deposito berhasil diupload`,
          stats: { kredit: 0, mutasi: 0, tabungan: 0, deposito: data.length }
        });
      }

      return NextResponse.json({ error: 'Tipe sheet tidak valid' }, { status: 400 });
    }

    // =============================================
    // MODE: Full Upload (single multi-sheet file)
    // =============================================
    const kreditData = parseKreditFromSheet(
      findSheet(workbook, ['kredit', 'ao', 'credit'])!
    );
    const mutasiData = parseMutasiFromSheet(
      findSheet(workbook, ['mutasi'])!
    );
    const tabunganData = parseFundingFromSheet(
      findSheet(workbook, ['tabungan', 'saving'])!
    );
    const depositoData = parseFundingFromSheet(
      findSheet(workbook, ['deposito', 'deposit', 'time deposit'])!
    );

    if (kreditData.length === 0 && mutasiData.length === 0 && tabunganData.length === 0 && depositoData.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang dapat diparsing dari file Excel. Pastikan file memiliki sheet yang benar.' }, { status: 400 });
    }

    // Check if data already exists for this date
    const existingUpload = await db.dashboardUpload.findFirst({
      where: { uploadDate }
    });

    if (existingUpload) {
      await db.kreditAO.deleteMany({ where: { uploadId: existingUpload.id } });
      await db.mutasiAO.deleteMany({ where: { uploadId: existingUpload.id } });
      await db.tabunganFO.deleteMany({ where: { uploadId: existingUpload.id } });
      await db.depositoFO.deleteMany({ where: { uploadId: existingUpload.id } });
      await db.dashboardUpload.delete({ where: { id: existingUpload.id } });
    }

    const upload = await db.dashboardUpload.create({
      data: {
        fileName: file.name,
        uploadDate,
        kreditAO: {
          create: kreditData.map(d => ({
            nama: d.nama, noa: d.noa, os: d.os, lancar: d.lancar,
            dpk: d.dpk, totNpl: d.totNpl, rr: d.rr, npl: d.npl,
          }))
        },
        mutasiAO: {
          create: mutasiData.map(d => ({
            nama: d.nama, noaBefore: d.noaBefore, osBefore: d.osBefore,
            noaNow: d.noaNow, osNow: d.osNow, mutasiNoa: d.mutasiNoa, mutasiOs: d.mutasiOs,
          }))
        },
        tabunganFO: {
          create: tabunganData.map(d => ({
            nama: d.nama, noaBefore: d.noaBefore, osBefore: d.osBefore,
            noaNow: d.noaNow, osNow: d.osNow, mutasiNoa: d.mutasiNoa, mutasiOs: d.mutasiOs,
          }))
        },
        depositoFO: {
          create: depositoData.map(d => ({
            nama: d.nama, noaBefore: d.noaBefore, osBefore: d.osBefore,
            noaNow: d.noaNow, osNow: d.osNow, mutasiNoa: d.mutasiNoa, mutasiOs: d.mutasiOs,
          }))
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'File berhasil diupload dan diparsing',
      uploadId: upload.id,
      uploadDate: upload.uploadDate,
      stats: {
        kredit: kreditData.length,
        mutasi: mutasiData.length,
        tabungan: tabunganData.length,
        deposito: depositoData.length,
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Terjadi kesalahan saat upload'
    }, { status: 500 });
  }
}
