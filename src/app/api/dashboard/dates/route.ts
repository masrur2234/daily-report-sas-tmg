import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const uploads = await db.dashboardUpload.findMany({
      orderBy: { uploadDate: 'desc' },
      select: {
        uploadDate: true,
        fileName: true,
        createdAt: true,
        kreditAO: { select: { id: true } },
        mutasiAO: { select: { id: true } },
        tabunganFO: { select: { id: true } },
        depositoFO: { select: { id: true } },
      }
    });
    
    const dates = uploads.map(u => ({
      uploadDate: u.uploadDate,
      fileName: u.fileName,
      createdAt: u.createdAt,
      stats: {
        kredit: u.kreditAO.length,
        mutasi: u.mutasiAO.length,
        tabungan: u.tabunganFO.length,
        deposito: u.depositoFO.length,
      }
    }));
    
    return NextResponse.json({ dates });
    
  } catch (error) {
    console.error('Dates fetch error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Terjadi kesalahan' 
    }, { status: 500 });
  }
}
