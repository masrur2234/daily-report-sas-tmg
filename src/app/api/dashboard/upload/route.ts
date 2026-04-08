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

function hitungRR(lancar: number, dpk1to30: number, os: number): number {
  if (!os || os === 0) return 0;
  return ((lancar + dpk1to30) / os) * 100;
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

// ═══════════════════════════════════════════════════════════════
// RAW SHEET READER — Uses array-of-arrays for maximum reliability
// Handles: multi-row headers, merged cells, numeric headers (01-30)
// ═══════════════════════════════════════════════════════════════

interface SheetParseResult {
  headers: string[];       // Cleaned header strings from the found header row
  headerRowIdx: number;    // Which row in the raw data is the header
  rows: unknown[][];       // Data rows (after header row), already trimmed
  dayColMap: Map<number, string>; // colIndex -> "01", "02", ... for daily columns
}

/**
 * Parse a sheet into headers + rows using raw array-of-arrays.
 * Automatically finds the header row by looking for known keywords.
 */
function parseSheetRaw(sheet: XLSX.WorkSheet, knownKeywords: string[]): SheetParseResult {
  const rawAll: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
    defval: '',
  });

  if (rawAll.length === 0) {
    return { headers: [], headerRowIdx: 0, rows: [], dayColMap: new Map() };
  }

  // Step 1: Find the header row (contains at least one known keyword)
  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(rawAll.length, 10); r++) {
    const rowStr = rawAll[r].map(v => String(v ?? '').toLowerCase().trim());
    const found = rowStr.some(cell => knownKeywords.some(kw => cell.includes(kw.toLowerCase())));
    if (found) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = rawAll[headerRowIdx] || [];
  const headers = headerRow.map(h => String(h ?? '').trim());

  // Step 2: Identify day columns (headers that are just numbers 1-31)
  const dayColMap = new Map<number, string>();
  for (let c = 0; c < headers.length; c++) {
    const h = headers[c];
    if (!h) continue;
    const match = h.match(/^(\d{1,2})$/);
    if (match) {
      const dayNum = parseInt(match[1], 10);
      if (dayNum >= 1 && dayNum <= 31) {
        dayColMap.set(c, String(dayNum).padStart(2, '0'));
      }
    }
  }

  // Step 3: Collect data rows (everything after header, skip if first col is empty)
  const rows: unknown[][] = [];
  for (let r = headerRowIdx + 1; r < rawAll.length; r++) {
    const row = rawAll[r];
    if (!row || row.length === 0) continue;
    // Skip rows where ALL cells are empty
    const allEmpty = row.every(v => v === '' || v === null || v === undefined);
    if (allEmpty) continue;
    rows.push(row);
  }

  return { headers, headerRowIdx, rows, dayColMap };
}

/**
 * Extract daily data (01-30) from a raw data row using dayColMap.
 */
function extractDailyFromRow(row: unknown[], dayColMap: Map<number, string>): Record<string, number> {
  const dailyData: Record<string, number> = {};
  for (const [colIdx, dayKey] of dayColMap) {
    if (colIdx < row.length) {
      const val = parseNumber(row[colIdx]);
      if (val !== 0) dailyData[dayKey] = val;
    }
  }
  return dailyData;
}

/**
 * Safely get a value from a row by header name.
 * Tries both exact text match and normalized match.
 */
function getColVal(row: unknown[], headers: string[], ...headerNames: string[]): number {
  for (const headerName of headerNames) {
    // Try direct text match (case-insensitive, trimmed)
    const idx1 = headers.findIndex(h => h.toLowerCase().trim() === headerName.toLowerCase().trim());
    if (idx1 >= 0 && idx1 < row.length) {
      return parseNumber(row[idx1]);
    }
    // Try normalized match
    const idx2 = findColumn(headers, headerName);
    if (idx2 >= 0 && idx2 < row.length) {
      return parseNumber(row[idx2]);
    }
  }
  return 0;
}

function getColStr(row: unknown[], headers: string[], headerName: string): string {
  const idx = findColumn(headers, headerName);
  if (idx < 0 || idx >= row.length) return '';
  return String(row[idx] ?? '').trim();
}

// ═══════════════════════════════════════════════════════════════
// PARSERS
// ═══════════════════════════════════════════════════════════════

function parseKreditFromSheet(sheet: XLSX.WorkSheet): { nama: string; noa: number; os: number; lancar: number; dpk1to30: number; dpk: number; totNpl: number; rr: number; npl: number; dailyData: Record<string, number> }[] {
  const parsed = parseSheetRaw(sheet, ['Nama AO', 'Nama', 'NOA', 'OS', 'LANCAR']);
  if (parsed.headers.length === 0) return [];

  const { headers, rows, dayColMap } = parsed;

  return rows.map(row => {
    const nama = getColStr(row, headers, 'Nama AO') || getColStr(row, headers, 'Nama') || getColStr(row, headers, 'AO');
    if (!nama) return null;

    const noa = getColVal(row, headers, 'NOA');
    const os = getColVal(row, headers, 'OS') || getColVal(row, headers, 'Total Baki Debet') || getColVal(row, headers, 'Baki Debet');
    const lancar = getColVal(row, headers, 'LANCAR');
    const dpk1to30 = getColVal(row, headers, '01-30', '1-30');
    const dpk = getColVal(row, headers, 'DPK');
    let totNpl = getColVal(row, headers, 'TOTNPL') || getColVal(row, headers, 'Total NPL') || getColVal(row, headers, 'Tot NPL');

    // NPL fallback: if not provided, calculate as os - lancar - dpk1to30 - dpk
    if (!totNpl) {
      totNpl = os - lancar - dpk1to30 - dpk;
      if (totNpl < 0) totNpl = 0;
    }

    const rr = hitungRR(lancar, dpk1to30, os);
    const npl = hitungNPL(totNpl, os);
    const dailyData = extractDailyFromRow(row, dayColMap);

    return { nama, noa, os, lancar, dpk1to30, dpk, totNpl, rr, npl, dailyData };
  }).filter(Boolean) as any[];
}

function parseMutasiFromSheet(sheet: XLSX.WorkSheet): { nama: string; noaBefore: number; osBefore: number; noaNow: number; osNow: number; mutasiNoa: number; mutasiOs: number }[] {
  const parsed = parseSheetRaw(sheet, ['Nama AO', 'Nama', 'NOA Bulan Lalu', 'OS Bulan Lalu', 'NOA Sekarang']);
  if (parsed.headers.length === 0) return [];

  const { headers, rows } = parsed;

  return rows.map(row => {
    const nama = getColStr(row, headers, 'Nama AO') || getColStr(row, headers, 'Nama') || getColStr(row, headers, 'AO');
    if (!nama) return null;

    const noaBefore = getColVal(row, headers, 'NOA Bulan Lalu');
    const osBefore = getColVal(row, headers, 'OS Bulan Lalu');
    const noaNow = getColVal(row, headers, 'NOA Sekarang') || getColVal(row, headers, 'NOA Bulan Ini');
    const osNow = getColVal(row, headers, 'OS Sekarang') || getColVal(row, headers, 'OS Bulan Ini');
    const mutasiNoa = getColVal(row, headers, 'Mutasi NOA') || (noaNow - noaBefore);
    const mutasiOs = getColVal(row, headers, 'Mutasi OS') || (osNow - osBefore);

    return { nama, noaBefore, osBefore, noaNow, osNow, mutasiNoa, mutasiOs };
  }).filter(Boolean) as any[];
}

function parseFundingFromSheet(sheet: XLSX.WorkSheet): { nama: string; noaBefore: number; osBefore: number; noaNow: number; osNow: number; mutasiNoa: number; mutasiOs: number }[] {
  const parsed = parseSheetRaw(sheet, ['Nama FO', 'Nama', 'NOA Bulan Lalu', 'OS Bulan Lalu', 'NOA', 'OS']);
  if (parsed.headers.length === 0) return [];

  const { headers, rows } = parsed;

  // Check if data looks transposed: if "Nama" column doesn't exist but
  // there are many columns with names (potential AO names as columns)
  const colNama = findColumn(headers, 'Nama FO', 'Nama', 'nama', 'FO', 'fo', 'nama fo');
  const hasMultiPeriod = findColumn(headers, 'NOA Bulan Lalu', 'OS Bulan Lalu', 'NOA Sekarang', 'OS Sekarang') >= 0;
  const hasSinglePeriod = findColumn(headers, 'NOA', 'noa') >= 0;

  // If no "Nama" column found, data might be transposed — try transposing
  if (colNama < 0 && parsed.rows.length > 0) {
    return parseFundingTransposed(headers, rows);
  }

  // Standard row-based parsing
  return rows.map(row => {
    const nama = getColStr(row, headers, 'Nama FO') || getColStr(row, headers, 'Nama') || getColStr(row, headers, 'FO') || getColStr(row, headers, 'AO');
    if (!nama) return null;

    if (hasMultiPeriod) {
      const noaBefore = getColVal(row, headers, 'NOA Bulan Lalu');
      const osBefore = getColVal(row, headers, 'OS Bulan Lalu');
      const noaNow = getColVal(row, headers, 'NOA Sekarang') || getColVal(row, headers, 'NOA Bulan Ini');
      const osNow = getColVal(row, headers, 'OS Sekarang') || getColVal(row, headers, 'OS Bulan Ini');
      const mutasiNoa = getColVal(row, headers, 'Mutasi NOA') || (noaNow - noaBefore);
      const mutasiOs = getColVal(row, headers, 'Mutasi OS') || (osNow - osBefore);
      return { nama, noaBefore, osBefore, noaNow, osNow, mutasiNoa, mutasiOs };
    } else if (hasSinglePeriod) {
      const noaNow = getColVal(row, headers, 'NOA');
      const osNow = getColVal(row, headers, 'OS');
      const mutasi = getColVal(row, headers, 'Mutasi');
      return { nama, noaBefore: 0, osBefore: osNow - mutasi, noaNow, osNow, mutasiNoa: 0, mutasiOs: mutasi };
    }
    return null;
  }).filter(Boolean) as any[];
}

/**
 * Parse transposed funding data where AO names are COLUMNS and
 * metrics (NOA, OS, etc.) are ROWS.
 * Example structure:
 * Row 0: [empty, "Dian Permata", "Eka Wulandari", ...]
 * Row 1: ["NOA Bulan Lalu", 30, 22, ...]
 * Row 2: ["OS Bulan Lalu", 2500000000, 1800000000, ...]
 * Row 3: ["NOA Sekarang", 32, 25, ...]
 * Row 4: ["OS Sekarang", 2700000000, 1950000000, ...]
 */
function parseFundingTransposed(headers: string[], rows: unknown[][]): { nama: string; noaBefore: number; osBefore: number; noaNow: number; osNow: number; mutasiNoa: number; mutasiOs: number }[] {
  // First column of each row is the metric name, rest are values per FO
  const metrics: Map<string, number[]> = new Map();

  for (const row of rows) {
    const metricName = normalizeHeader(String(row[0] ?? ''));
    const values: number[] = [];
    for (let c = 1; c < row.length; c++) {
      values.push(parseNumber(row[c]));
    }
    metrics.set(metricName, values);
  }

  // FO names are in the headers (first row) starting from column 1
  const foNames: string[] = [];
  for (let c = 1; c < headers.length; c++) {
    const name = String(headers[c] ?? '').trim();
    if (name) foNames.push(name);
  }

  if (foNames.length === 0) return [];

  // Determine which metrics we have
  const hasMultiPeriod = metrics.has('noabulanlalu') || metrics.has('osbulanlalu') || metrics.has('noasekarang') || metrics.has('ossekarang');

  const result: any[] = [];

  for (let i = 0; i < foNames.length; i++) {
    const nama = foNames[i];

    if (hasMultiPeriod) {
      const noaBefore = metrics.get('noabulanlalu')?.[i] ?? 0;
      const osBefore = metrics.get('osbulanlalu')?.[i] ?? 0;
      const noaNow = metrics.get('noasekarang')?.[i] ?? metrics.get('noabulanini')?.[i] ?? 0;
      const osNow = metrics.get('ossekarang')?.[i] ?? metrics.get('osbulanini')?.[i] ?? 0;
      const mutasiNoa = metrics.get('mutasinoa')?.[i] ?? (noaNow - noaBefore);
      const mutasiOs = metrics.get('mutasios')?.[i] ?? (osNow - osBefore);
      result.push({ nama, noaBefore, osBefore, noaNow, osNow, mutasiNoa, mutasiOs });
    } else {
      const noaNow = metrics.get('noa')?.[i] ?? 0;
      const osNow = metrics.get('os')?.[i] ?? 0;
      const mutasi = metrics.get('mutasi')?.[i] ?? 0;
      result.push({ nama, noaBefore: 0, osBefore: osNow - mutasi, noaNow, osNow, mutasiNoa: 0, mutasiOs: mutasi });
    }
  }

  return result;
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
      return NextResponse.json({ error: 'Database tidak tersedia. Jalankan: npx prisma db push' }, { status: 500 });
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
          data: data.map(d => ({ uploadId: upload!.id, nama: d.nama, noa: d.noa, os: d.os, lancar: d.lancar, dpk: d.dpk, totNpl: d.totNpl, rr: d.rr, npl: d.npl, dailyData: JSON.stringify(d.dailyData) }))
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
        kreditAO: { create: kreditData.map(d => ({ nama: d.nama, noa: d.noa, os: d.os, lancar: d.lancar, dpk: d.dpk, totNpl: d.totNpl, rr: d.rr, npl: d.npl, dailyData: JSON.stringify(d.dailyData) })) },
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
