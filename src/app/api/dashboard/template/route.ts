import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const workbook = XLSX.utils.book_new();

    // ═══ Sheet 1: Kredit AO (with 01-30 daily columns) ═══
    const kreditHeaders = ['Nama AO', 'NOA', 'OS', 'LANCAR', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', 'DPK', 'TOTNPL'];
    const kreditSample = [
      ['Ahmad Fauzi', 45, 2500000000, 2200000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 250000000, 200000000, 100000000],
      ['Budi Santoso', 38, 1800000000, 1600000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 180000000, 150000000, 50000000],
      ['Citra Dewi', 52, 3200000000, 3000000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 320000000, 180000000, 20000000],
    ];
    const kreditSheet = XLSX.utils.aoa_to_sheet([kreditHeaders, ...kreditSample]);
    kreditSheet['!cols'] = [
      { wch: 18 }, // Nama AO
      { wch: 8 },  // NOA
      { wch: 18 }, // OS
      { wch: 18 }, // LANCAR
      ...Array(30).fill({ wch: 14 }), // 01-30
      { wch: 18 }, // DPK
      { wch: 18 }, // TOTNPL
    ];
    XLSX.utils.book_append_sheet(workbook, kreditSheet, 'Kredit AO');

    // ═══ Sheet 2: Mutasi AO ═══
    const mutasiHeaders = ['Nama AO', 'NOA Bulan Lalu', 'OS Bulan Lalu', 'NOA Sekarang', 'OS Sekarang'];
    const mutasiSample = [
      ['Ahmad Fauzi', 42, 2300000000, 45, 2500000000],
      ['Budi Santoso', 35, 1700000000, 38, 1800000000],
      ['Citra Dewi', 50, 3100000000, 52, 3200000000],
    ];
    const mutasiSheet = XLSX.utils.aoa_to_sheet([mutasiHeaders, ...mutasiSample]);
    mutasiSheet['!cols'] = [
      { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(workbook, mutasiSheet, 'Mutasi AO');

    // ═══ Sheet 3: Tabungan FO ═══
    const tabunganHeaders = ['Nama FO', 'NOA Bulan Lalu', 'OS Bulan Lalu', 'NOA Sekarang', 'OS Sekarang'];
    const tabunganSample = [
      ['Dian Permata', 120, 850000000, 135, 920000000],
      ['Eka Wulandari', 98, 620000000, 105, 680000000],
      ['Fitri Handayani', 145, 1100000000, 152, 1180000000],
    ];
    const tabunganSheet = XLSX.utils.aoa_to_sheet([tabunganHeaders, ...tabunganSample]);
    tabunganSheet['!cols'] = [
      { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(workbook, tabunganSheet, 'Tabungan FO');

    // ═══ Sheet 4: Deposito FO ═══
    const depositoHeaders = ['Nama FO', 'NOA Bulan Lalu', 'OS Bulan Lalu', 'NOA Sekarang', 'OS Sekarang'];
    const depositoSample = [
      ['Dian Permata', 30, 2500000000, 32, 2700000000],
      ['Eka Wulandari', 22, 1800000000, 25, 1950000000],
      ['Fitri Handayani', 40, 3500000000, 38, 3400000000],
    ];
    const depositoSheet = XLSX.utils.aoa_to_sheet([depositoHeaders, ...depositoSample]);
    depositoSheet['!cols'] = [
      { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(workbook, depositoSheet, 'Deposito FO');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Template_Dashboard_Bank.xlsx"',
      },
    });

  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json({ error: 'Gagal generate template' }, { status: 500 });
  }
}
