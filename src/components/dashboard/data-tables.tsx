'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, FileText, ArrowRightLeft, PiggyBank } from 'lucide-react'
import { formatRupiah } from './summary-cards'

interface KreditAO {
  id: string
  nama: string
  noa: number
  os: number
  lancar: number
  dpk: number
  totNpl: number
  rr: number
  npl: number
}

interface MutasiAO {
  id: string
  nama: string
  noaBefore: number
  osBefore: number
  noaNow: number
  osNow: number
  mutasiNoa: number
  mutasiOs: number
}

interface TabunganFO {
  id: string
  nama: string
  noaBefore: number
  osBefore: number
  noaNow: number
  osNow: number
  mutasiNoa: number
  mutasiOs: number
}

interface DepositoFO {
  id: string
  nama: string
  noaBefore: number
  osBefore: number
  noaNow: number
  osNow: number
  mutasiNoa: number
  mutasiOs: number
}

interface DataTablesProps {
  kreditAO: KreditAO[]
  mutasiAO: MutasiAO[]
  tabunganFO: TabunganFO[]
  depositoFO: DepositoFO[]
  uploadDate: string
  filters: {
    search: string
    minOS: number | null
    maxOS: number | null
    minRR: number | null
    maxRR: number | null
    minNPL: number | null
    maxNPL: number | null
  }
}

// ---------- Kredit Table (Bank Report Style) ----------
function KreditTable({ data, filters }: { data: KreditAO[]; filters: DataTablesProps['filters'] }) {
  const [sortKey, setSortKey] = useState<string>('noa')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filtered = useMemo(() => {
    let d = [...data]
    if (filters.search) d = d.filter(r => r.nama.toLowerCase().includes(filters.search.toLowerCase()))
    if (filters.minOS !== null) d = d.filter(r => r.os >= filters.minOS!)
    if (filters.maxOS !== null) d = d.filter(r => r.os <= filters.maxOS!)
    if (filters.minRR !== null) d = d.filter(r => r.rr >= filters.minRR!)
    if (filters.maxRR !== null) d = d.filter(r => r.rr <= filters.maxRR!)
    if (filters.minNPL !== null) d = d.filter(r => r.npl >= filters.minNPL!)
    if (filters.maxNPL !== null) d = d.filter(r => r.npl <= filters.maxNPL!)
    d.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortKey] as number
      const bv = (b as unknown as Record<string, unknown>)[sortKey] as number
      return sortDir === 'asc' ? av - bv : bv - av
    })
    return d
  }, [data, filters, sortKey, sortDir])

  const totals = useMemo(() => ({
    noa: data.reduce((s, r) => s + r.noa, 0),
    os: data.reduce((s, r) => s + r.os, 0),
    lancar: data.reduce((s, r) => s + r.lancar, 0),
    dpk: data.reduce((s, r) => s + r.dpk, 0),
    totNpl: data.reduce((s, r) => s + r.totNpl, 0),
    rr: data.length > 0 ? data.reduce((s, r) => s + r.rr, 0) / data.length : 0,
    npl: data.length > 0 ? data.reduce((s, r) => s + r.npl, 0) / data.length : 0,
  }), [data])

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const thClass = "py-2.5 px-3 text-xs font-semibold text-white text-center select-none"
  const tdClass = "py-2 px-3 text-xs text-right font-mono tabular-nums"
  const thRightClass = `${thClass} text-right`

  return (
    <div className="border rounded-lg overflow-hidden">
      <ScrollArea className="max-h-[520px]">
        <div className="min-w-[920px]">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-blue-700">
                <th className={`${thClass} w-10`}>No</th>
                <th className={`${thClass} text-left`}>Nama AO</th>
                <th className={thRightClass} style={{ cursor: 'pointer' }} onClick={() => toggleSort('noa')}>
                  NOA {sortKey === 'noa' ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 inline" /> : <ArrowDown className="h-3 w-3 ml-1 inline" />) : <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-40" />}
                </th>
                <th className={thRightClass} style={{ cursor: 'pointer' }} onClick={() => toggleSort('os')}>
                  OS (Baki Debet) {sortKey === 'os' ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 inline" /> : <ArrowDown className="h-3 w-3 ml-1 inline" />) : <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-40" />}
                </th>
                <th className={thRightClass} style={{ cursor: 'pointer' }} onClick={() => toggleSort('lancar')}>
                  LANCAR {sortKey === 'lancar' ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 inline" /> : <ArrowDown className="h-3 w-3 ml-1 inline" />) : <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-40" />}
                </th>
                <th className={thRightClass}>01 - 30 HARI</th>
                <th className={thRightClass}>DPK</th>
                <th className={thRightClass}>TOT NPL</th>
                <th className={thRightClass} style={{ cursor: 'pointer' }} onClick={() => toggleSort('rr')}>
                  RR (%) {sortKey === 'rr' ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 inline" /> : <ArrowDown className="h-3 w-3 ml-1 inline" />) : <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-40" />}
                </th>
                <th className={thRightClass} style={{ cursor: 'pointer' }} onClick={() => toggleSort('npl')}>
                  NPL (%) {sortKey === 'npl' ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 inline" /> : <ArrowDown className="h-3 w-3 ml-1 inline" />) : <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-40" />}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-muted-foreground">Tidak ada data yang cocok</td>
                </tr>
              ) : (
                <>
                  {filtered.map((item, idx) => (
                    <tr key={item.id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'} hover:bg-blue-50/80 transition-colors`}>
                      <td className={`${tdClass} text-center text-muted-foreground font-sans`}>{idx + 1}</td>
                      <td className="py-2 px-3 text-xs font-medium text-left">{item.nama}</td>
                      <td className={tdClass}>{item.noa.toLocaleString('id-ID')}</td>
                      <td className={tdClass}>{formatRupiah(item.os)}</td>
                      <td className={`${tdClass} text-green-700 font-semibold`}>{formatRupiah(item.lancar)}</td>
                      <td className={tdClass}>{formatRupiah(item.dpk + item.totNpl > 0 ? Math.abs(item.os - item.lancar - item.dpk) : 0)}</td>
                      <td className={`${tdClass} text-yellow-700`}>{formatRupiah(item.dpk)}</td>
                      <td className={`${tdClass} text-red-600 font-semibold`}>{formatRupiah(item.totNpl)}</td>
                      <td className={`${tdClass} text-center font-semibold ${item.rr > 80 ? 'text-green-700' : item.rr >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {item.rr.toFixed(2)}
                      </td>
                      <td className={`${tdClass} text-center font-semibold ${item.npl > 20 ? 'text-red-600' : item.npl > 5 ? 'text-yellow-600' : 'text-green-700'}`}>
                        {item.npl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-green-600 text-white font-bold">
                    <td className={`${tdClass} text-center`} colSpan={2}>TOTAL</td>
                    <td className={tdClass}>{totals.noa.toLocaleString('id-ID')}</td>
                    <td className={tdClass}>{formatRupiah(totals.os)}</td>
                    <td className={tdClass}>{formatRupiah(totals.lancar)}</td>
                    <td className={tdClass}>{formatRupiah(totals.os - totals.lancar - totals.dpk > 0 ? totals.os - totals.lancar - totals.dpk : 0)}</td>
                    <td className={tdClass}>{formatRupiah(totals.dpk)}</td>
                    <td className={tdClass}>{formatRupiah(totals.totNpl)}</td>
                    <td className={`${tdClass} text-center`}>{totals.rr.toFixed(2)}</td>
                    <td className={`${tdClass} text-center`}>{totals.npl.toFixed(2)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  )
}

// ---------- Mutasi Table (Bank Report Style) ----------
function MutasiTable({ data }: { data: MutasiAO[] }) {
  const sorted = useMemo(() => [...data], [data])

  const totals = useMemo(() => ({
    noaBefore: data.reduce((s, r) => s + r.noaBefore, 0),
    osBefore: data.reduce((s, r) => s + r.osBefore, 0),
    noaNow: data.reduce((s, r) => s + r.noaNow, 0),
    osNow: data.reduce((s, r) => s + r.osNow, 0),
    mutasiNoa: data.reduce((s, r) => s + r.mutasiNoa, 0),
    mutasiOs: data.reduce((s, r) => s + r.mutasiOs, 0),
  }), [data])

  const thClass = "py-2.5 px-3 text-xs font-semibold text-white text-center select-none"
  const tdClass = "py-2 px-3 text-xs text-right font-mono tabular-nums"

  return (
    <div className="border rounded-lg overflow-hidden">
      <ScrollArea className="max-h-[520px]">
        <div className="min-w-[820px]">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-blue-700">
                <th className={`${thClass} w-10`}>No</th>
                <th className={`${thClass} text-left`}>Nama AO</th>
                <th className={`${thClass} text-right`}>NOA</th>
                <th className={`${thClass} text-right`}>OS (Baki Debet)</th>
                <th className={`${thClass} text-right`}>NOA</th>
                <th className={`${thClass} text-right`}>OS (Baki Debet)</th>
                <th className={`${thClass} text-right`}>MUTASI NOA</th>
                <th className={`${thClass} text-right`}>MUTASI OS</th>
              </tr>
              {/* Sub-header with dates */}
              <tr className="bg-blue-500">
                <th className="py-1.5 px-3 text-[10px] text-white/70 text-center" colSpan={2}></th>
                <th className="py-1.5 px-3 text-[10px] text-white/70 text-right" colSpan={2}>PERIODE SEBELUMNYA</th>
                <th className="py-1.5 px-3 text-[10px] text-white/70 text-right" colSpan={2}>PERIODE SEKARANG</th>
                <th className="py-1.5 px-3 text-[10px] text-white/70 text-right" colSpan={2}>PERTUMBUHAN</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-muted-foreground">Tidak ada data mutasi</td>
                </tr>
              ) : (
                <>
                  {sorted.map((item, idx) => (
                    <tr key={item.id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'} hover:bg-blue-50/80 transition-colors`}>
                      <td className={`${tdClass} text-center text-muted-foreground font-sans`}>{idx + 1}</td>
                      <td className="py-2 px-3 text-xs font-medium text-left">{item.nama}</td>
                      <td className={tdClass}>{item.noaBefore.toLocaleString('id-ID')}</td>
                      <td className={tdClass}>{formatRupiah(item.osBefore)}</td>
                      <td className={`${tdClass} font-semibold`}>{item.noaNow.toLocaleString('id-ID')}</td>
                      <td className={`${tdClass} font-semibold`}>{formatRupiah(item.osNow)}</td>
                      <td className={`${tdClass} font-semibold ${item.mutasiNoa >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {item.mutasiNoa >= 0 ? '+' : ''}{item.mutasiNoa.toLocaleString('id-ID')}
                      </td>
                      <td className={`${tdClass} font-semibold ${item.mutasiOs >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {item.mutasiOs >= 0 ? '+' : ''}{formatRupiah(item.mutasiOs)}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-green-600 text-white font-bold">
                    <td className={`${tdClass} text-center`} colSpan={2}>TOTAL</td>
                    <td className={tdClass}>{totals.noaBefore.toLocaleString('id-ID')}</td>
                    <td className={tdClass}>{formatRupiah(totals.osBefore)}</td>
                    <td className={tdClass}>{totals.noaNow.toLocaleString('id-ID')}</td>
                    <td className={tdClass}>{formatRupiah(totals.osNow)}</td>
                    <td className={`${tdClass} ${totals.mutasiNoa >= 0 ? '' : ''}`}>
                      {totals.mutasiNoa >= 0 ? '+' : ''}{totals.mutasiNoa.toLocaleString('id-ID')}
                    </td>
                    <td className={tdClass}>
                      {totals.mutasiOs >= 0 ? '+' : ''}{formatRupiah(totals.mutasiOs)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  )
}

// ---------- Tabungan & Deposito Combined Table (Bank Report Style) ----------
function FundingTable({ tabungan, deposito }: { tabungan: TabunganFO[]; deposito: DepositoFO[] }) {
  const thClass = "py-2.5 px-3 text-xs font-semibold text-white text-center select-none"
  const tdClass = "py-2 px-3 text-xs text-right font-mono tabular-nums"

  const tabunganTotals = useMemo(() => ({
    noaBefore: tabungan.reduce((s, r) => s + r.noaBefore, 0),
    osBefore: tabungan.reduce((s, r) => s + r.osBefore, 0),
    noaNow: tabungan.reduce((s, r) => s + r.noaNow, 0),
    osNow: tabungan.reduce((s, r) => s + r.osNow, 0),
    mutasiNoa: tabungan.reduce((s, r) => s + r.mutasiNoa, 0),
    mutasiOs: tabungan.reduce((s, r) => s + r.mutasiOs, 0),
  }), [tabungan])

  const depositoTotals = useMemo(() => ({
    noaBefore: deposito.reduce((s, r) => s + r.noaBefore, 0),
    osBefore: deposito.reduce((s, r) => s + r.osBefore, 0),
    noaNow: deposito.reduce((s, r) => s + r.noaNow, 0),
    osNow: deposito.reduce((s, r) => s + r.osNow, 0),
    mutasiNoa: deposito.reduce((s, r) => s + r.mutasiNoa, 0),
    mutasiOs: deposito.reduce((s, r) => s + r.mutasiOs, 0),
  }), [deposito])

  const renderRows = (data: (TabunganFO | DepositoFO)[]) => {
    if (data.length === 0) return null
    return data.map((item, idx) => (
      <tr key={item.id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'} hover:bg-blue-50/80 transition-colors`}>
        <td className={`${tdClass} text-center text-muted-foreground font-sans`}>{idx + 1}</td>
        <td className="py-2 px-3 text-xs font-medium text-left">{item.nama}</td>
        <td className={tdClass}>{item.noaBefore.toLocaleString('id-ID')}</td>
        <td className={tdClass}>{formatRupiah(item.osBefore)}</td>
        <td className={`${tdClass} font-semibold`}>{item.noaNow.toLocaleString('id-ID')}</td>
        <td className={`${tdClass} font-semibold`}>{formatRupiah(item.osNow)}</td>
        <td className={`${tdClass} font-semibold ${item.mutasiNoa >= 0 ? 'text-green-700' : 'text-red-600'}`}>
          {item.mutasiNoa >= 0 ? '+' : ''}{item.mutasiNoa.toLocaleString('id-ID')}
        </td>
        <td className={`${tdClass} font-semibold ${item.mutasiOs >= 0 ? 'text-green-700' : 'text-red-600'}`}>
          {item.mutasiOs >= 0 ? '+' : ''}{formatRupiah(item.mutasiOs)}
        </td>
      </tr>
    ))
  }

  const renderTotalRow = (totals: { noaBefore: number; osBefore: number; noaNow: number; osNow: number; mutasiNoa: number; mutasiOs: number }, label: string) => (
    <tr className="bg-green-600 text-white font-bold">
      <td className={`${tdClass} text-center`} colSpan={2}>{label}</td>
      <td className={tdClass}>{totals.noaBefore.toLocaleString('id-ID')}</td>
      <td className={tdClass}>{formatRupiah(totals.osBefore)}</td>
      <td className={tdClass}>{totals.noaNow.toLocaleString('id-ID')}</td>
      <td className={tdClass}>{formatRupiah(totals.osNow)}</td>
      <td className={tdClass}>
        {totals.mutasiNoa >= 0 ? '+' : ''}{totals.mutasiNoa.toLocaleString('id-ID')}
      </td>
      <td className={tdClass}>
        {totals.mutasiOs >= 0 ? '+' : ''}{formatRupiah(totals.mutasiOs)}
      </td>
    </tr>
  )

  const hasAnyData = tabungan.length > 0 || deposito.length > 0

  return (
    <div className="border rounded-lg overflow-hidden">
      <ScrollArea className="max-h-[600px]">
        <div className="min-w-[820px]">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-blue-700">
                <th className={`${thClass} w-10`}>No</th>
                <th className={`${thClass} text-left`}>Nama FO</th>
                <th className={`${thClass} text-right`}>NOA</th>
                <th className={`${thClass} text-right`}>OS</th>
                <th className={`${thClass} text-right`}>NOA</th>
                <th className={`${thClass} text-right`}>OS</th>
                <th className={`${thClass} text-right`}>MUTASI</th>
                <th className={`${thClass} text-right`}>MUTASI</th>
              </tr>
              {/* Sub-header with period labels */}
              <tr className="bg-blue-500">
                <th className="py-1.5 px-3 text-[10px] text-white/70 text-center" colSpan={2}></th>
                <th className="py-1.5 px-3 text-[10px] text-white/70 text-right" colSpan={2}>PERIODE SEBELUMNYA</th>
                <th className="py-1.5 px-3 text-[10px] text-white/70 text-right" colSpan={2}>PERIODE SEKARANG</th>
                <th className="py-1.5 px-3 text-[10px] text-white/70 text-right" colSpan={2}>PERTUMBUHAN</th>
              </tr>
            </thead>
            <tbody>
              {!hasAnyData ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-muted-foreground">Tidak ada data tabungan atau deposito</td>
                </tr>
              ) : (
                <>
                  {/* TABUNGAN Section Header */}
                  {tabungan.length > 0 && (
                    <tr className="bg-blue-100">
                      <td className="py-2 px-3 text-xs font-bold text-blue-800 uppercase tracking-wider" colSpan={8}>
                        TABUNGAN
                      </td>
                    </tr>
                  )}
                  {renderRows(tabungan)}
                  {tabungan.length > 0 && renderTotalRow(tabunganTotals, 'JUMLAH TABUNGAN')}

                  {/* DEPOSITO Section Header */}
                  {deposito.length > 0 && (
                    <tr className="bg-blue-100">
                      <td className="py-2 px-3 text-xs font-bold text-blue-800 uppercase tracking-wider" colSpan={8}>
                        DEPOSITO
                      </td>
                    </tr>
                  )}
                  {renderRows(deposito)}
                  {deposito.length > 0 && renderTotalRow(depositoTotals, 'JUMLAH DEPOSITO')}
                </>
              )}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  )
}

// ---------- Main Component ----------
export default function DataTables({ kreditAO, mutasiAO, tabunganFO, depositoFO, uploadDate, filters }: DataTablesProps) {
  return (
    <div className="space-y-6">
      {/* Section 1: Kredit (AO) Table - Always Visible */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-blue-700" />
          <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Kredit (Account Officer)</h3>
          <Badge variant="secondary" className="text-[10px]">{kreditAO.length} AO</Badge>
        </div>
        <KreditTable data={kreditAO} filters={filters} />
      </div>

      {/* Section 2: Mutasi AO Table - Always Visible */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft className="h-4 w-4 text-blue-700" />
          <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Mutasi Account Officer</h3>
          <Badge variant="secondary" className="text-[10px]">{mutasiAO.length} AO</Badge>
        </div>
        <MutasiTable data={mutasiAO} />
      </div>

      {/* Section 3: Tabungan & Deposito Combined */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <PiggyBank className="h-4 w-4 text-blue-700" />
          <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Tabungan & Deposito (Front Office)</h3>
          <Badge variant="secondary" className="text-[10px]">{tabunganFO.length} Tabungan &bull; {depositoFO.length} Deposito</Badge>
        </div>
        <FundingTable tabungan={tabunganFO} deposito={depositoFO} />
      </div>
    </div>
  )
}
