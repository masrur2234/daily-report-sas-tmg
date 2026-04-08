'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, BarChart3, Calendar, Database, ChevronRight, Loader2, Landmark, Printer, Sparkles, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import UploadDialog from '@/components/dashboard/upload-dialog'
import SummaryCards from '@/components/dashboard/summary-cards'
import DataTables from '@/components/dashboard/data-tables'
import DashboardCharts from '@/components/dashboard/charts'
import DashboardFilters from '@/components/dashboard/dashboard-filters'
import AutoInsights from '@/components/dashboard/auto-insights'
import { toast } from 'sonner'

interface Filters {
  search: string
  minOS: number | null
  maxOS: number | null
  minRR: number | null
  maxRR: number | null
  minNPL: number | null
  maxNPL: number | null
}

interface Summary {
  totalOsKredit: number
  avgRR: number
  avgNPL: number
  totalOsTabungan: number
  totalOsDeposito: number
  totalMutasiOs: number
  totalLancar: number
  totalDpk: number
  totalTotNpl: number
  komposisi: {
    lancar: number
    dpk: number
    npl: number
  }
}

interface DashboardData {
  uploadDate: string
  fileName: string
  summary: Summary
  kreditAO: Array<{
    id: string
    nama: string
    noa: number
    os: number
    lancar: number
    dpk: number
    totNpl: number
    rr: number
    npl: number
    dailyData: Record<string, number>
  }>
  mutasiAO: Array<{
    id: string
    nama: string
    noaBefore: number
    osBefore: number
    noaNow: number
    osNow: number
    mutasiNoa: number
    mutasiOs: number
  }>
  tabunganFO: Array<{
    id: string
    nama: string
    noaBefore: number
    osBefore: number
    noaNow: number
    osNow: number
    mutasiNoa: number
    mutasiOs: number
  }>
  depositoFO: Array<{
    id: string
    nama: string
    noaBefore: number
    osBefore: number
    noaNow: number
    osNow: number
    mutasiNoa: number
    mutasiOs: number
  }>
  growthData: Array<{
    date: string
    totalOs: number
    totalTabungan: number
    totalDeposito: number
  }>
}

function formatDateIndo(dateStr: string): string {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const [y, m, d] = dateStr.split('-')
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}

export default function Home() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [dates, setDates] = useState<Array<{ uploadDate: string; fileName: string; stats: { kredit: number; mutasi: number; tabungan: number; deposito: number } }>>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingDates, setLoadingDates] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    minOS: null,
    maxOS: null,
    minRR: null,
    maxRR: null,
    minNPL: null,
    maxNPL: null,
  })
  const [showFilters, setShowFilters] = useState(false)
  const [activeSection, setActiveSection] = useState<'report' | 'analytics' | 'insights'>('report')
  const hasActiveFilters = filters.search || filters.minOS || filters.maxOS || filters.minRR || filters.maxRR || filters.minNPL || filters.maxNPL

  const loadDates = useCallback(async () => {
    try {
      setLoadingDates(true)
      const res = await fetch('/api/dashboard/dates')
      const data = await res.json()
      if (data.dates) {
        setDates(data.dates)
        if (data.dates.length > 0 && !selectedDate) {
          setSelectedDate(data.dates[0].uploadDate)
        }
      }
    } catch (err) {
      console.error('Failed to load dates:', err)
    } finally {
      setLoadingDates(false)
    }
  }, [selectedDate])

  const loadDashboardData = useCallback(async (date: string) => {
    if (!date) return
    try {
      setLoading(true)
      const res = await fetch(`/api/dashboard/data?date=${encodeURIComponent(date)}`)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal memuat data')
        return
      }
      setDashboardData(data)
    } catch (err) {
      console.error('Failed to load data:', err)
      toast.error('Gagal memuat data dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDates() }, [])
  useEffect(() => {
    if (selectedDate) loadDashboardData(selectedDate)
  }, [selectedDate, loadDashboardData])

  const handleUploadSuccess = (date: string) => {
    toast.success('File berhasil diupload!', { description: 'Data berhasil diparsing dan disimpan.' })
    setSelectedDate(date)
    loadDates()
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-gray-100">
      {/* Bank Report Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          {/* Top Bar: Bank branding + Controls */}
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-700 to-blue-900 text-white shadow-sm">
                <Landmark className="h-5 w-5" />
              </div>
              <div className="hidden sm:block border-l-2 border-blue-700 pl-3">
                <h1 className="text-sm font-bold text-blue-900 leading-tight">PT. BANK PEREKONOMIAN RAKYAT SAS</h1>
                <p className="text-[10px] text-blue-600 font-medium tracking-wider">CABANG TEMANGGUNG — DAILY REPORT DASHBOARD</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedDate} onValueChange={setSelectedDate} disabled={loadingDates || dates.length === 0}>
                <SelectTrigger className="w-[170px] md:w-[200px] h-9 text-xs">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder={loadingDates ? 'Memuat...' : 'Pilih Tanggal'} />
                </SelectTrigger>
                <SelectContent>
                  {dates.map((d) => (
                    <SelectItem key={d.uploadDate} value={d.uploadDate}>
                      <span className="text-xs">{d.uploadDate}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setUploadDialogOpen(true)} size="sm" className="gap-1.5 h-9 text-xs">
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </div>
          </div>

          {/* Report Title Bar */}
          {dashboardData && !loading && (
            <div className="bg-gradient-to-r from-blue-700 to-blue-800 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-bold text-sm tracking-wide">LAPORAN HARIAN KREDIT & FUNDING</h2>
                  <p className="text-blue-200 text-xs mt-0.5">
                    Tanggal: <span className="font-semibold text-white">{formatDateIndo(dashboardData.uploadDate)}</span>
                    <span className="mx-2 text-blue-300">|</span>
                    File: <span className="text-blue-100">{dashboardData.fileName}</span>
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-1">
                  <div className="bg-white/10 rounded px-3 py-1 text-xs text-blue-100">
                    {dashboardData.kreditAO.length} AO &bull; {dashboardData.tabunganFO.length} FO
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          {dashboardData && !loading && (
            <div className="flex items-center gap-1 border-b pt-0">
              {[
                { key: 'report' as const, label: 'Laporan', icon: BarChart3 },
                { key: 'analytics' as const, label: 'Grafik & Analisis', icon: BarChart3 },
                { key: 'insights' as const, label: 'AI Insights', icon: Sparkles },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                    activeSection === tab.key
                      ? 'border-blue-700 text-blue-700'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-6 py-5 space-y-5">
        {/* No data state */}
        {dates.length === 0 && !loadingDates && (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Database className="h-10 w-10 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-blue-900">Belum Ada Data</h2>
              <p className="text-muted-foreground mb-6 max-w-md text-sm">
                Upload file Excel (.xlsx) untuk memulai analisis dashboard. Data akan tersimpan dan bisa dilihat kembali berdasarkan tanggal.
              </p>
              <Button size="lg" onClick={() => setUploadDialogOpen(true)} className="gap-2">
                <Upload className="h-5 w-5" />
                Upload File Excel Pertama
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-700 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Memuat data laporan...</p>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {dashboardData && !loading && (
          <>
            {/* Section: Report (Laporan) */}
            {activeSection === 'report' && (
              <div className="space-y-5">
                {/* Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total OS Kredit</p>
                      <p className="text-sm font-bold text-blue-800 mt-1">Rp {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(dashboardData.summary.totalOsKredit)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Rata-rata RR</p>
                      <p className={`text-sm font-bold mt-1 ${dashboardData.summary.avgRR > 80 ? 'text-green-700' : dashboardData.summary.avgRR > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {dashboardData.summary.avgRR.toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Rata-rata NPL</p>
                      <p className={`text-sm font-bold mt-1 ${dashboardData.summary.avgNPL < 5 ? 'text-green-700' : dashboardData.summary.avgNPL < 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {dashboardData.summary.avgNPL.toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Tabungan</p>
                      <p className="text-sm font-bold text-emerald-700 mt-1">Rp {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(dashboardData.summary.totalOsTabungan)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Deposito</p>
                      <p className="text-sm font-bold text-purple-700 mt-1">Rp {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(dashboardData.summary.totalOsDeposito)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Mutasi OS</p>
                      <p className={`text-sm font-bold mt-1 ${dashboardData.summary.totalMutasiOs >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {dashboardData.summary.totalMutasiOs >= 0 ? '+' : ''}Rp {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(dashboardData.summary.totalMutasiOs)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      showFilters ? 'bg-blue-100 text-blue-700' : 'bg-white border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filter Data
                  </button>
                  {hasActiveFilters && (
                    <button
                      onClick={() => setFilters({ search: '', minOS: null, maxOS: null, minRR: null, maxRR: null, minNPL: null, maxNPL: null })}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Reset
                    </button>
                  )}
                </div>

                {/* Filters Panel */}
                {showFilters && (
                  <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4">
                      <DashboardFilters filters={filters} onFiltersChange={setFilters} />
                    </CardContent>
                  </Card>
                )}

                {/* Main Report Tables */}
                <DataTables
                  kreditAO={dashboardData.kreditAO}
                  mutasiAO={dashboardData.mutasiAO}
                  tabunganFO={dashboardData.tabunganFO}
                  depositoFO={dashboardData.depositoFO}
                  uploadDate={dashboardData.uploadDate}
                  filters={filters}
                />
              </div>
            )}

            {/* Section: Analytics (Grafik) */}
            {activeSection === 'analytics' && (
              <div className="space-y-5">
                <SummaryCards summary={dashboardData.summary} />
                <DashboardCharts
                  kreditAO={dashboardData.kreditAO}
                  komposisi={dashboardData.summary.komposisi}
                  growthData={dashboardData.growthData}
                />
              </div>
            )}

            {/* Section: AI Insights */}
            {activeSection === 'insights' && (
              <div className="space-y-5">
                <SummaryCards summary={dashboardData.summary} />
                <AutoInsights
                  uploadDate={dashboardData.uploadDate}
                  summary={dashboardData.summary as unknown as Record<string, unknown>}
                  kreditAO={dashboardData.kreditAO as unknown as Record<string, unknown>[]}
                  mutasiAO={dashboardData.mutasiAO as unknown as Record<string, unknown>[]}
                  tabunganFO={dashboardData.tabunganFO as unknown as Record<string, unknown>[]}
                  depositoFO={dashboardData.depositoFO as unknown as Record<string, unknown>[]}
                />
              </div>
            )}
          </>
        )}

        {/* Date selected but no data */}
        {!dashboardData && !loading && selectedDate && dates.length > 0 && (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">Data Tidak Ditemukan</h3>
              <p className="text-muted-foreground text-sm">Tidak ada data untuk tanggal {selectedDate}.</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Dashboard Review Bank — PT. BANK PEREKONOMIAN RAKYAT SAS CAB Temanggung</span>
          <span>Powered by Next.js &bull; Recharts &bull; SheetJS</span>
        </div>
      </footer>

      {/* Upload Dialog */}
      <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onUploadSuccess={handleUploadSuccess} />
    </div>
  )
}
