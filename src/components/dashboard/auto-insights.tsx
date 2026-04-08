'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'

interface AutoInsightsProps {
  uploadDate: string
  summary: Record<string, unknown>
  kreditAO: Record<string, unknown>[]
  mutasiAO: Record<string, unknown>[]
  tabunganFO: Record<string, unknown>[]
  depositoFO: Record<string, unknown>[]
}

export default function AutoInsights({ uploadDate, summary, kreditAO, mutasiAO, tabunganFO, depositoFO }: AutoInsightsProps) {
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateInsight = async () => {
    setLoading(true)
    setError(null)
    setInsight(null)

    try {
      const res = await fetch('/api/dashboard/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary,
          kreditAO,
          mutasiAO: mutasiAO.length > 0 ? mutasiAO : undefined,
          tabunganFO: tabunganFO.length > 0 ? tabunganFO : undefined,
          depositoFO: depositoFO.length > 0 ? depositoFO : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal membuat insight')
        return
      }

      setInsight(data.insight)
    } catch {
      setError('Terjadi kesalahan saat membuat insight')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Auto Insight AI
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateInsight}
            disabled={loading}
            className="gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Menganalisis...
              </>
            ) : insight ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generate Insight
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
        {error && (
          <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {loading && !insight && (
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">AI sedang menganalisis data dashboard...</span>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${90 - i * 15}%` }} />
              ))}
            </div>
          </div>
        )}

        {insight && (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{insight}</div>
          </div>
        )}

        {!insight && !loading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Klik &quot;Generate Insight&quot; untuk mendapatkan analisis otomatis dari AI</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
