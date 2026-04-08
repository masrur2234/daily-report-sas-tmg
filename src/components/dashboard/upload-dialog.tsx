'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Upload, FileSpreadsheet, AlertCircle, Loader2, Download, FileText, PiggyBank, CheckCircle2, X, Trash2, CalendarDays } from 'lucide-react'

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadSuccess: (date: string) => void
}

type UploadMode = 'single' | 'separate'
type TableType = 'kredit' | 'tabungan' | 'deposito'

interface UploadedFile {
  type: TableType
  file: File
  name: string
  size: number
}

const TABLE_INFO: Record<TableType, { label: string; color: string; icon: typeof FileText; desc: string }> = {
  kredit: { label: 'Kredit AO', color: 'text-blue-700 bg-blue-50', icon: FileText, desc: 'Data kredit per Account Officer' },
  tabungan: { label: 'Tabungan FO', color: 'text-emerald-700 bg-emerald-50', icon: PiggyBank, desc: 'Data tabungan per Front Office' },
  deposito: { label: 'Deposito FO', color: 'text-purple-700 bg-purple-50', icon: PiggyBank, desc: 'Data deposito per Front Office' },
}

export default function UploadDialog({ open, onOpenChange, onUploadSuccess }: UploadDialogProps) {
  const [uploadDate, setUploadDate] = useState(() => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  })
  const [mode, setMode] = useState<UploadMode>('single')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Single file mode
  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [singleDragging, setSingleDragging] = useState(false)
  const singleInputRef = useRef<HTMLInputElement>(null)
  const singleDropRef = useRef<HTMLDivElement>(null)

  // Separate file mode
  const [separateFiles, setSeparateFiles] = useState<UploadedFile[]>([])
  const [draggingType, setDraggingType] = useState<TableType | null>(null)
  const separateInputRefs = useRef<Record<TableType, HTMLInputElement | null>>({
    kredit: null,
    tabungan: null,
    deposito: null,
  })
  const separateDropRefs = useRef<Record<TableType, HTMLDivElement | null>>({
    kredit: null,
    tabungan: null,
    deposito: null,
  })

  const resetState = () => {
    setSeparateFiles([])
    setError(null)
    setSuccess(null)
    setLoading(false)
    setSingleDragging(false)
    setDraggingType(null)
  }

  // ========== GLOBAL DRAG & DROP (document-level for Portal compatibility) ==========
  useEffect(() => {
    if (!open) return

    let dragCounter = 0

    const getDropTarget = (e: DragEvent): { zone: 'single' | TableType | null } => {
      const target = document.elementFromPoint(e.clientX, e.clientY)
      if (!target) return { zone: null }

      if (singleDropRef.current && singleDropRef.current.contains(target)) {
        return { zone: 'single' }
      }
      for (const type of ['kredit', 'tabungan', 'deposito'] as TableType[]) {
        const el = separateDropRefs.current[type]
        if (el && el.contains(target)) return { zone: type }
      }
      return { zone: null }
    }

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounter++
      const { zone } = getDropTarget(e)
      if (zone === 'single') {
        setSingleDragging(true)
        setDraggingType(null)
      } else if (zone) {
        setDraggingType(zone)
        setSingleDragging(false)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const { zone } = getDropTarget(e)
      if (zone === 'single') {
        if (!singleDragging) { setSingleDragging(true); setDraggingType(null) }
      } else if (zone) {
        if (draggingType !== zone) { setDraggingType(zone); setSingleDragging(false) }
      } else {
        if (singleDragging) setSingleDragging(false)
        if (draggingType) setDraggingType(null)
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounter--
      if (dragCounter <= 0) {
        dragCounter = 0
        setSingleDragging(false)
        setDraggingType(null)
      }
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounter = 0
      setSingleDragging(false)
      const prevType = draggingType
      setDraggingType(null)

      const file = e.dataTransfer?.files?.[0]
      if (!file) return

      if (!(file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
        setError('Hanya file Excel (.xlsx/.xls) yang didukung')
        return
      }

      const { zone } = getDropTarget(e)

      if (zone === 'single' || (mode === 'single' && zone === null)) {
        setSingleFile(file)
        setError(null)
      } else if (zone) {
        const t = zone as TableType
        setSeparateFiles(prev => [...prev.filter(f => f.type !== t), { type: t, file, name: file.name, size: file.size }])
        setError(null)
      } else if (prevType) {
        setSeparateFiles(prev => [...prev.filter(f => f.type !== prevType), { type: prevType, file, name: file.name, size: file.size }])
        setError(null)
      }
    }

    document.addEventListener('dragenter', handleDragEnter, true)
    document.addEventListener('dragover', handleDragOver, true)
    document.addEventListener('dragleave', handleDragLeave, true)
    document.addEventListener('drop', handleDrop, true)

    return () => {
      document.removeEventListener('dragenter', handleDragEnter, true)
      document.removeEventListener('dragover', handleDragOver, true)
      document.removeEventListener('dragleave', handleDragLeave, true)
      document.removeEventListener('drop', handleDrop, true)
    }
  }, [open, mode, singleDragging, draggingType])

  const handleSingleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setSingleFile(file); setError(null) }
  }, [])

  const handleSeparateFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: TableType) => {
    const file = e.target.files?.[0]
    if (file) {
      setSeparateFiles(prev => [...prev.filter(f => f.type !== type), { type, file, name: file.name, size: file.size }])
      setError(null)
    }
  }, [])

  const removeSeparateFile = (type: TableType) => {
    setSeparateFiles(prev => prev.filter(f => f.type !== type))
    const input = separateInputRefs.current[type]
    if (input) input.value = ''
  }

  const handleUpload = async () => {
    if (!uploadDate) {
      setError('Pilih tanggal data')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const dateStr = uploadDate

      if (mode === 'single') {
        if (!singleFile) {
          setError('Pilih file Excel terlebih dahulu')
          setLoading(false)
          return
        }

        const formData = new FormData()
        formData.append('file', singleFile)
        formData.append('uploadDate', dateStr)

        const res = await fetch('/api/dashboard/upload', { method: 'POST', body: formData })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Gagal upload file')
          return
        }

        const stats = data.stats as { kredit: number; mutasi: number; tabungan: number; deposito: number }
        const parts = []
        if (stats.kredit > 0) parts.push(`${stats.kredit} Kredit`)
        if (stats.mutasi > 0) parts.push(`${stats.mutasi} Mutasi`)
        if (stats.tabungan > 0) parts.push(`${stats.tabungan} Tabungan`)
        if (stats.deposito > 0) parts.push(`${stats.deposito} Deposito`)

        setSuccess(`Berhasil! ${parts.join(', ')}`)
        onUploadSuccess(dateStr)

      } else {
        if (separateFiles.length === 0) {
          setError('Upload minimal 1 file')
          setLoading(false)
          return
        }

        const results: string[] = []

        for (const uf of separateFiles) {
          const formData = new FormData()
          formData.append('file', uf.file)
          formData.append('uploadDate', dateStr)
          formData.append('sheetType', uf.type)

          const res = await fetch('/api/dashboard/upload', { method: 'POST', body: formData })
          const data = await res.json()

          if (!res.ok) {
            setError(`${TABLE_INFO[uf.type].label}: ${data.error || 'Gagal'}`)
            return
          }

          const statCount = data.stats?.kredit || data.stats?.tabungan || data.stats?.deposito || 0
          results.push(`${TABLE_INFO[uf.type].label} (${statCount} baris)`)
        }

        setSuccess(`Berhasil! ${results.join(', ')}`)
        onUploadSuccess(dateStr)
      }

      setTimeout(() => {
        setSingleFile(null)
        setSeparateFiles([])
        setError(null)
        setSuccess(null)
        onOpenChange(false)
      }, 1500)

    } catch (err) {
      console.error('Upload catch error:', err)
      const msg = err instanceof TypeError 
        ? 'Gagal koneksi ke server. Coba refresh halaman.' 
        : err instanceof Error 
          ? err.message 
          : 'Terjadi kesalahan saat upload'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/dashboard/template')
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Template_Dashboard_Bank.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Gagal download template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-[580px] max-h-[92vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-5 py-4 rounded-t-lg">
          <DialogTitle className="flex items-center gap-2 text-white text-base">
            <Upload className="h-4.5 w-4.5" />
            Upload Data Excel
          </DialogTitle>
          <DialogDescription className="text-blue-200 text-xs mt-1">
            Upload laporan harian bank (.xlsx / .xls)
          </DialogDescription>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Date Picker - compact */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Tanggal Data
            </Label>
            <Input
              type="date"
              value={uploadDate}
              onChange={(e) => setUploadDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Download Template */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs h-8"
            onClick={downloadTemplate}
            disabled={loading}
          >
            <Download className="h-3.5 w-3.5" />
            Download Template Excel
          </Button>

          {/* Mode Tabs */}
          <Tabs value={mode} onValueChange={(v) => { setMode(v as UploadMode); setError(null); setSuccess(null) }}>
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="single" className="text-xs gap-1.5 h-8">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                1 File Lengkap
              </TabsTrigger>
              <TabsTrigger value="separate" className="text-xs gap-1.5 h-8">
                <Upload className="h-3.5 w-3.5" />
                Upload Per-Tabel
              </TabsTrigger>
            </TabsList>

            {/* ===== MODE 1: Single File ===== */}
            <TabsContent value="single" className="mt-3 space-y-2">
              <p className="text-[11px] text-muted-foreground">
                Upload <strong>1 file Excel</strong> multi-sheet (Kredit, Mutasi, Tabungan, Deposito).
              </p>
              <div
                ref={singleDropRef}
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                  singleDragging
                    ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                    : singleFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
                }`}
                onClick={() => singleInputRef.current?.click()}
              >
                <input
                  ref={singleInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleSingleFileChange}
                />
                {singleFile ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                    <p className="text-sm font-medium text-green-700">{singleFile.name}</p>
                    <p className="text-[11px] text-muted-foreground">{(singleFile.size / 1024).toFixed(1)} KB</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSingleFile(null) }}
                      className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 mt-0.5"
                    >
                      <Trash2 className="h-3 w-3" /> Hapus
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <FileSpreadsheet className={`h-8 w-8 ${singleDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                    <p className="text-xs text-muted-foreground">
                      <span className="text-blue-600 font-medium">Klik untuk pilih</span> atau drag & drop file
                    </p>
                    <p className="text-[10px] text-gray-400">.xlsx / .xls (multi-sheet)</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ===== MODE 2: Separate Files ===== */}
            <TabsContent value="separate" className="mt-3 space-y-2">
              <p className="text-[11px] text-muted-foreground">
                Upload file <strong>terpisah</strong> untuk masing-masing tabel. Minimal 1 file.
              </p>

              <div className="space-y-2">
                {(['kredit', 'tabungan', 'deposito'] as TableType[]).map((type) => {
                  const info = TABLE_INFO[type]
                  const uploaded = separateFiles.find(f => f.type === type)
                  const Icon = info.icon

                  return (
                    <div key={type} className={`border rounded-lg p-2.5 transition-colors ${uploaded ? 'border-green-300 bg-green-50/50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${info.color}`}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <span className="text-xs font-semibold">{info.label}</span>
                          {uploaded && <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 h-5">Ready</Badge>}
                        </div>
                        {uploaded && (
                          <button onClick={() => removeSeparateFile(type)} className="text-muted-foreground hover:text-red-500 p-0.5">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {uploaded ? (
                        <div className="flex items-center gap-2 text-[11px] pl-7">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                          <span className="text-green-700 font-medium truncate">{uploaded.name}</span>
                          <span className="text-muted-foreground ml-auto shrink-0">{(uploaded.size / 1024).toFixed(1)} KB</span>
                        </div>
                      ) : (
                        <div
                          ref={(el) => { separateDropRefs.current[type] = el }}
                          className={`ml-7 border border-dashed rounded-md p-3 text-center cursor-pointer transition-all duration-200 ${
                            draggingType === type ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/20'
                          }`}
                          onClick={() => separateInputRefs.current[type]?.click()}
                        >
                          <input
                            ref={(el) => { separateInputRefs.current[type] = el }}
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={(e) => handleSeparateFileChange(e, type)}
                          />
                          <Upload className={`h-3.5 w-3.5 mx-auto mb-0.5 ${draggingType === type ? 'text-blue-500' : 'text-gray-400'}`} />
                          <p className="text-[10px] text-muted-foreground">
                            {draggingType === type ? 'Lepaskan...' : 'Klik atau drag & drop'}
                          </p>
                        </div>
                      )}

                      <p className="text-[10px] text-muted-foreground mt-1 pl-7">{info.desc}</p>
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 p-2.5 rounded-md">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 text-green-700 text-xs bg-green-50 p-2.5 rounded-md border border-green-200">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1 pb-1">
            <Button variant="outline" size="sm" onClick={() => { resetState(); onOpenChange(false) }} disabled={loading} className="h-8 text-xs">
              Batal
            </Button>
            <Button size="sm" onClick={handleUpload} disabled={loading || !uploadDate || (mode === 'single' ? !singleFile : separateFiles.length === 0)} className="h-8 text-xs">
              {loading ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Mengupload...</>
              ) : (
                <><Upload className="h-3.5 w-3.5 mr-1.5" /> Upload & Parse</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
