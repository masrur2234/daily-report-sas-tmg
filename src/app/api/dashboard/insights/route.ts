import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { summary, kreditAO, mutasiAO, tabunganFO, depositoFO } = body;
    
    if (!summary || !kreditAO) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }
    
    const zai = await ZAI.create();
    
    // Find best and worst performers
    const sortedByRR = [...kreditAO].sort((a, b) => a.rr - b.rr);
    const sortedByNPL = [...kreditAO].sort((a, b) => b.npl - a.npl);
    const sortedByOS = [...kreditAO].sort((a, b) => b.os - a.os);
    
    const worstRR = sortedByRR[0];
    const bestRR = sortedByRR[sortedByRR.length - 1];
    const worstNPL = sortedByNPL[0];
    const bestMutasi = mutasiAO && mutasiAO.length > 0 
      ? [...mutasiAO].sort((a, b) => b.mutasiOs - a.mutasiOs)[0] 
      : null;
    const bestTabungan = tabunganFO && tabunganFO.length > 0 
      ? [...tabunganFO].sort((a, b) => b.os - a.os)[0] 
      : null;
    const bestDeposito = depositoFO && depositoFO.length > 0 
      ? [...depositoFO].sort((a, b) => b.os - a.os)[0] 
      : null;
    
    const formatRupiah = (num: number) => 
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    
    const dataContext = `
DATA DASHBOARD BANK:

== RINGKASAN ==
- Total OS Kredit: ${formatRupiah(summary.totalOsKredit)}
- Rata-rata RR: ${summary.avgRR?.toFixed(2)}%
- Rata-rata NPL: ${summary.avgNPL?.toFixed(2)}%
- Total OS Tabungan: ${formatRupiah(summary.totalOsTabungan)}
- Total OS Deposito: ${formatRupiah(summary.totalOsDeposito)}
- Total Mutasi OS: ${formatRupiah(summary.totalMutasiOs)}
- Komposisi Kredit: Lancar ${summary.komposisi?.lancar?.toFixed(1)}%, DPK ${summary.komposisi?.dpk?.toFixed(1)}%, NPL ${summary.komposisi?.npl?.toFixed(1)}%

== AO DENGAN RR TERENDAH ==
- ${worstRR?.nama}: ${worstRR?.rr?.toFixed(2)}%

== AO DENGAN RR TERTINGGI ==
- ${bestRR?.nama}: ${bestRR?.rr?.toFixed(2)}%

== AO DENGAN NPL TERTINGGI ==
- ${worstNPL?.nama}: ${worstNPL?.npl?.toFixed(2)}%

== AO DENGAN OS TERBESAR ==
- ${sortedByOS[0]?.nama}: ${formatRupiah(sortedByOS[0]?.os || 0)}

${bestMutasi ? `== AO DENGAN PERTUMBUHAN OS TERBESAR ==
- ${bestMutasi.nama}: ${formatRupiah(bestMutasi.mutasiOs)}` : ''}

${bestTabungan ? `== FO DENGAN OS TABUNGAN TERBESAR ==
- ${bestTabungan.nama}: ${formatRupiah(bestTabungan.os)}` : ''}

${bestDeposito ? `== FO DENGAN OS DEPOSITO TERBESAR ==
- ${bestDeposito.nama}: ${formatRupiah(bestDeposito.os)}` : ''}

== DETAIL AO (${kreditAO.length} total) ==
${kreditAO.map((k: { nama: string; os: number; rr: number; npl: number }) => 
  `- ${k.nama}: OS=${formatRupiah(k.os)}, RR=${k.rr?.toFixed(2)}%, NPL=${k.npl?.toFixed(2)}%`
).join('\n')}
`.trim();
    
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `Kamu adalah seorang analis perbankan senior yang ahli dalam menganalisis kinerja kredit, tabungan, dan deposito. Kamu diminta untuk memberikan insight dan analisis mendalam dari data dashboard bank.

Format output kamu:
1. Gunakan Bahasa Indonesia
2. Berikan analisis dalam bentuk poin-poin yang jelas dan ringkas
3. Fokus pada insight yang actionable dan penting untuk pengambilan keputusan
4. Soroti area yang memerlukan perhatian khusus (risiko tinggi)
5. Berikan rekomendasi perbaikan
6. Gunakan format bullet point dengan emoji untuk setiap poin
7. Kelompokkan insight menjadi: KREDIT, TABUNGAN & DEPOSITO, RISIKO, dan REKOMENDASI

Jangan gunakan markdown yang berlebihan. Cukup gunakan bold untuk penekanan.`
        },
        {
          role: 'user',
          content: `Berdasarkan data dashboard berikut, berikan analisis dan insight yang mendalam serta rekomendasi strategis:\n\n${dataContext}`
        }
      ],
      thinking: { type: 'disabled' }
    });
    
    const insight = completion.choices[0]?.message?.content || 'Tidak dapat menghasilkan insight.';
    
    return NextResponse.json({ insight });
    
  } catch (error) {
    console.error('Insight generation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat insight' 
    }, { status: 500 });
  }
}
