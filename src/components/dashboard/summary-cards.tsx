'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Wallet, Landmark, PiggyBank, AlertTriangle, BarChart3, Shield } from 'lucide-react'

interface SummaryCardsProps {
  summary: {
    totalOsKredit: number
    avgRR: number
    avgNPL: number
    totalOsTabungan: number
    totalOsDeposito: number
    totalMutasiOs: number
  }
}

function formatRupiah(angka: number): string {
  return new Intl.NumberFormat('id-ID').format(angka)
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total OS Kredit',
      value: `Rp ${formatRupiah(summary.totalOsKredit)}`,
      icon: Landmark,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      title: 'Rata-rata RR',
      value: `${summary.avgRR.toFixed(2)}%`,
      icon: Shield,
      color: summary.avgRR > 80 ? 'text-green-600 dark:text-green-400' : summary.avgRR > 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400',
      bgColor: summary.avgRR > 80 ? 'bg-green-50 dark:bg-green-950/30' : summary.avgRR > 50 ? 'bg-yellow-50 dark:bg-yellow-950/30' : 'bg-red-50 dark:bg-red-950/30',
      subtitle: summary.avgRR > 80 ? 'Sangat Baik' : summary.avgRR > 50 ? 'Cukup' : 'Perlu Perhatian',
    },
    {
      title: 'Rata-rata NPL',
      value: `${summary.avgNPL.toFixed(2)}%`,
      icon: AlertTriangle,
      color: summary.avgNPL < 5 ? 'text-green-600 dark:text-green-400' : summary.avgNPL < 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400',
      bgColor: summary.avgNPL < 5 ? 'bg-green-50 dark:bg-green-950/30' : summary.avgNPL < 10 ? 'bg-yellow-50 dark:bg-yellow-950/30' : 'bg-red-50 dark:bg-red-950/30',
      subtitle: summary.avgNPL < 5 ? 'Rendah' : summary.avgNPL < 10 ? 'Sedang' : 'Tinggi',
    },
    {
      title: 'Total OS Tabungan',
      value: `Rp ${formatRupiah(summary.totalOsTabungan)}`,
      icon: PiggyBank,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: 'Total OS Deposito',
      value: `Rp ${formatRupiah(summary.totalOsDeposito)}`,
      icon: Wallet,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      title: 'Total Mutasi OS',
      value: `Rp ${formatRupiah(Math.abs(summary.totalMutasiOs))}`,
      icon: summary.totalMutasiOs >= 0 ? TrendingUp : TrendingDown,
      color: summary.totalMutasiOs >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      bgColor: summary.totalMutasiOs >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30',
      subtitle: summary.totalMutasiOs >= 0 ? 'Naik' : 'Turun',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{card.title}</p>
                <p className="text-sm font-bold truncate">{card.value}</p>
                {card.subtitle && (
                  <p className={`text-xs ${card.color} font-medium`}>{card.subtitle}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export { formatRupiah }
