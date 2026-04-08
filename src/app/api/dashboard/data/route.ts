import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadDate = searchParams.get('date');
    
    if (!uploadDate) {
      return NextResponse.json({ error: 'Parameter date diperlukan' }, { status: 400 });
    }
    
    const upload = await db.dashboardUpload.findFirst({
      where: { uploadDate },
      include: {
        kreditAO: true,
        mutasiAO: true,
        tabunganFO: true,
        depositoFO: true,
      }
    });
    
    if (!upload) {
      return NextResponse.json({ error: 'Data tidak ditemukan untuk tanggal ini' }, { status: 404 });
    }
    
    // Calculate summary stats
    const totalOsKredit = upload.kreditAO.reduce((sum, k) => sum + k.os, 0);
    const avgRR = upload.kreditAO.length > 0
      ? upload.kreditAO.reduce((sum, k) => sum + k.rr, 0) / upload.kreditAO.length 
      : 0;
    const avgNPL = upload.kreditAO.length > 0
      ? upload.kreditAO.reduce((sum, k) => sum + k.npl, 0) / upload.kreditAO.length
      : 0;
    const totalOsTabungan = upload.tabunganFO.reduce((sum, t) => sum + t.osNow, 0);
    const totalOsDeposito = upload.depositoFO.reduce((sum, d) => sum + d.osNow, 0);
    const totalMutasiOs = upload.mutasiAO.reduce((sum, m) => sum + m.mutasiOs, 0);
    const totalMutasiTabungan = upload.tabunganFO.reduce((sum, t) => sum + t.mutasiOs, 0);
    const totalMutasiDeposito = upload.depositoFO.reduce((sum, d) => sum + d.mutasiOs, 0);
    
    // Credit composition
    const totalLancar = upload.kreditAO.reduce((sum, k) => sum + k.lancar, 0);
    const totalDpk = upload.kreditAO.reduce((sum, k) => sum + k.dpk, 0);
    const totalTotNpl = upload.kreditAO.reduce((sum, k) => sum + k.totNpl, 0);
    
    const komposisi = {
      lancar: totalOsKredit > 0 ? (totalLancar / totalOsKredit) * 100 : 0,
      dpk: totalOsKredit > 0 ? (totalDpk / totalOsKredit) * 100 : 0,
      npl: totalOsKredit > 0 ? (totalTotNpl / totalOsKredit) * 100 : 0,
    };
    
    // Historical data for growth chart (last 6 uploads before current date)
    const historicalUploads = await db.dashboardUpload.findMany({
      where: { uploadDate: { lte: uploadDate } },
      orderBy: { uploadDate: 'asc' },
      take: 12,
      include: { kreditAO: true, tabunganFO: true, depositoFO: true, mutasiAO: true },
    });
    
    const growthData = historicalUploads.map(u => ({
      date: u.uploadDate,
      totalOs: u.kreditAO.reduce((sum, k) => sum + k.os, 0),
      totalTabungan: u.tabunganFO.reduce((sum, t) => sum + t.osNow, 0),
      totalDeposito: u.depositoFO.reduce((sum, d) => sum + d.osNow, 0),
    }));
    
    return NextResponse.json({
      uploadDate: upload.uploadDate,
      fileName: upload.fileName,
      summary: {
        totalOsKredit,
        avgRR,
        avgNPL,
        totalOsTabungan,
        totalOsDeposito,
        totalMutasiOs,
        totalMutasiTabungan,
        totalMutasiDeposito,
        totalLancar,
        totalDpk,
        totalTotNpl,
        komposisi,
      },
      kreditAO: upload.kreditAO,
      mutasiAO: upload.mutasiAO,
      tabunganFO: upload.tabunganFO,
      depositoFO: upload.depositoFO,
      growthData,
    });
    
  } catch (error) {
    console.error('Data fetch error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data' 
    }, { status: 500 });
  }
}
