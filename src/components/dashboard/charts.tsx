'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart,
} from 'recharts'
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

interface GrowthPoint {
  date: string
  totalOs: number
  totalTabungan: number
  totalDeposito: number
}

interface ChartsProps {
  kreditAO: KreditAO[]
  komposisi: {
    lancar: number
    dpk: number
    npl: number
  }
  growthData: GrowthPoint[]
}

const PIE_COLORS = ['#22c55e', '#eab308', '#ef4444']

const formatShortRupiah = (value: number) => {
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)}T`
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}Jt`
  return formatRupiah(value)
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-mono font-medium">Rp {formatRupiah(entry.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const PieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string; label: string } }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
          <span className="font-medium">{payload[0].name}</span>
        </div>
        <p className="font-mono font-bold mt-1">{payload[0].value.toFixed(2)}%</p>
      </div>
    )
  }
  return null
}

export default function DashboardCharts({ kreditAO, komposisi, growthData }: ChartsProps) {
  // Bar chart data - top 15 AO by OS
  const barData = [...kreditAO]
    .sort((a, b) => b.os - a.os)
    .slice(0, 15)
    .map(k => ({
      nama: k.nama.length > 12 ? k.nama.substring(0, 12) + '...' : k.nama,
      OS: k.os,
      Lancar: k.lancar,
      DPK: k.dpk,
    }))

  // Pie chart data
  const pieData = [
    { name: 'Lancar', value: komposisi.lancar, label: 'Lancar' },
    { name: 'DPK', value: komposisi.dpk, label: 'DPK' },
    { name: 'NPL', value: komposisi.npl, label: 'NPL' },
  ]

  // Growth data - format dates
  const growthFormatted = growthData.map(d => ({
    ...d,
    date: d.date.substring(5), // MM-DD format
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Bar Chart - OS per AO */}
      <Card className="border-0 shadow-sm lg:col-span-2">
        <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
          <CardTitle className="text-base font-semibold">Outstanding (OS) per AO - Top 15</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 20, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="nama"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <YAxis
                  tickFormatter={(v) => formatShortRupiah(v)}
                  tick={{ fontSize: 11 }}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="OS" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lancar" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="DPK" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart - Composition */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
          <CardTitle className="text-base font-semibold">Komposisi Kredit</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  labelLine={true}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Area Chart - Growth */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
          <CardTitle className="text-base font-semibold">Tren Pertumbuhan (Growth)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          {growthFormatted.length > 1 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthFormatted} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatShortRupiah(v)} tick={{ fontSize: 11 }} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="totalOs" name="Kredit" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                  <Area type="monotone" dataKey="totalTabungan" name="Tabungan" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} />
                  <Area type="monotone" dataKey="totalDeposito" name="Deposito" stroke="#a855f7" fill="#a855f7" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              Upload minimal 2 data untuk melihat tren pertumbuhan
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
