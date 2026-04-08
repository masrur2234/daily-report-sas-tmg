'use client'

import { useState, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Upload, FileSpreadsheet, AlertCircle, Loader2, Download, FileText, ArrowRightLeft, PiggyBank, CheckCircle2, X, Trash2 } from 'lucide-react'

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
  const [uploadDate, setUploadDate] = useState<Date | undefined>(new Date())
  const [mode, setMode] = useState<UploadMode>('single')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Single file mode
  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [singleDragging, setSingleDragging] = useState(false)
  const singleInputRef = useRef<HTMLInputElement>(null)

  // Separate file mode
  const [separateFiles, setSeparateFiles] = useState<UploadedFile[]>([])
  const [draggingType, setDraggingType] = useState<TableType | null>(null)
  const separateInputRefs = useRef<Record<TableType, HTMLInputElement | null>>({
    kredit: null,
    tabungan: null,
    deposito: null,
  })

  const resetState = () => {
    setSingleFile(null)
    setSeparateFiles([])
    setError(null)
    setSuccess(null)
    setLoading(false)
  }

  const handleSingleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setSingleDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSingleFile(file)
      setError(null)
    } else {
      setError('Hanya file Excel (.xlsx/.xls) yang didukung')
    }
  }, [])

  const handleSingleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setSingleFile(file); setError(null) }
  }, [])

  const handleSeparateDrop = useCallback((e: React.DragEvent, type: TableType) => {
    e.preventDefault()
    setDraggingType(null)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSeparateFiles(prev => {
        const filtered = prev.filter(f => f.type !== type)
        return [...filtered, { type, file, name: file.name, size: file.size }]
      })
      setError(null)
    } else {
      setError('Hanya file Excel (.xlsx/.xls) yang didukung')
    }
  }, [])

  const handleSeparateFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: TableType) => {
    const file = e.target.files?.[0]
    if (file) {
      setSeparateFiles(prev => {
        const filtered = prev.filter(f => f.type !== type)
        return [...filtered, { type, file, name: file.name, size: file.size }]
      })
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
      const dateStr = uploadDate.toISOString().split('T')[0]

      if (mode === 'single') {
        // Upload single multi-sheet file
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

        setSuccess(`Berhasil upload! Data: ${parts.join(', ')}`)
        onUploadSuccess(dateStr)

      } else {
        // Upload separate files one by one
        if (separateFiles.length === 0) {
          setError('Upload minimal 1 file')
          setLoading(false)
          return
        }

        let totalParsed = 0
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
          totalParsed += statCount
          results.push(`${TABLE_INFO[uf.type].label} (${statCount} baris)`)
        }

        setSuccess(`Berhasil upload! ${results.join(', ')}`)
        onUploadSuccess(dateStr)
      }

      // Auto close after short delay
      setTimeout(() => {
        resetState()
        onOpenChange(false)
      }, 1500)

    } catch {
      setError('Terjadi kesalahan saat upload')
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
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Data Excel
          </DialogTitle>
          <DialogDescription>
            Upload data laporan harian bank. Pilih mode upload sesuai kebutuhan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tanggal Data</Label>
            <div className="border rounded-md p-2 bg-muted/30">
              <Calendar
                mode="single"
                selected={uploadDate}
                onSelect={setUploadDate}
                className="mx-auto"
              />
            </div>
          </div>

          {/* Download Template */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={downloadTemplate}
            disabled={loading}
          >
            <Download className="h-3.5 w-3.5" />
            Download Template Excel
          </Button>

          {/* Mode Tabs */}
          <Tabs value={mode} onValueChange={(v) => { setMode(v as UploadMode); setError(null); setSuccess(null) }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" className="text-xs gap-1.5">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                1 File Lengkap
              </TabsTrigger>
              <TabsTrigger value="separate" className="text-xs gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Upload Per-Tabel
              </TabsTrigger>
            </TabsList>

            {/* Mode 1: Single File */}
            <TabsContent value="single" className="space-y-3 mt-3">
              <p className="text-xs text-muted-foreground">
                Upload <span className="font-semibold">1 file Excel</span> yang berisi semua data (multi-sheet: Kredit, Mutasi, Tabungan, Deposito).
              </p>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  singleDragging
                    ? 'border-blue-500 bg-blue-50'
                    : singleFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-muted-foreground/25 hover:border-blue-400'
                }`}
                onDragOver={(e) => { e.preventDefault(); setSingleDragging(true) }}
                onDragLeave={() => setSingleDragging(false)}
                onDrop={handleSingleDrop}
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
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                    <p className="text-sm font-medium text-green-700">{singleFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(singleFile.size / 1024).toFixed(1)} KB</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSingleFile(null) }}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-1"
                    >
                      <Trash2 className="h-3 w-3" /> Hapus
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop atau <span className="text-blue-600 font-medium">klik untuk pilih</span>
                    </p>
                    <p className="text-xs text-muted-foreground">.xlsx / .xls (multi-sheet)</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Mode 2: Separate Files */}
            <TabsContent value="separate" className="space-y-3 mt-3">
              <p className="text-xs text-muted-foreground">
                Upload file <span className="font-semibold">terpisah</span> untuk masing-masing tabel. Minimal upload 1 file.
              </p>

              {(['kredit', 'tabungan', 'deposito'] as TableType[]).map((type) => {
                const info = TABLE_INFO[type]
                const uploaded = separateFiles.find(f => f.type === type)
                const Icon = info.icon

                return (
                  <div key={type} className={`border rounded-lg p-3 ${uploaded ? 'border-green-300 bg-green-50/50' : 'border-border'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${info.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-semibold">{info.label}</span>
                        {uploaded && <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">Ready</Badge>}
                      </div>
                      {uploaded && (
                        <button onClick={() => removeSeparateFile(type)} className="text-muted-foreground hover:text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {uploaded ? (
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        <span className="text-green-700 font-medium truncate">{uploaded.name}</span>
                        <span className="text-muted-foreground ml-auto shrink-0">{(uploaded.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ) : (
                      <div
                        className={`border border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
                          draggingType === type ? 'border-blue-400 bg-blue-50' : 'border-muted-foreground/20 hover:border-blue-300'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setDraggingType(type) }}
                        onDragLeave={() => setDraggingType(null)}
                        onDrop={(e) => handleSeparateDrop(e, type)}
                        onClick={() => separateInputRefs.current[type]?.click()}
                      >
                        <input
                          ref={(el) => { separateInputRefs.current[type] = el }}
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          onChange={(e) => handleSeparateFileChange(e, type)}
                        />
                        <Upload className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        <p className="text-[10px] text-muted-foreground">Drag & drop atau klik</p>
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground mt-1.5">{info.desc}</p>
                  </div>
                )
              })}
            </TabsContent>
          </Tabs>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 p-3 rounded-md border border-green-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => { resetState(); onOpenChange(false) }} disabled={loading}>
              Batal
            </Button>
            <Button onClick={handleUpload} disabled={loading || !uploadDate || (mode === 'single' ? !singleFile : separateFiles.length === 0)}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mengupload...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Parse
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
