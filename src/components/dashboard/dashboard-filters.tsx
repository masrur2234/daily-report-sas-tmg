'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Filters {
  search: string
  minOS: number | null
  maxOS: number | null
  minRR: number | null
  maxRR: number | null
  minNPL: number | null
  maxNPL: number | null
}

interface DashboardFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export default function DashboardFilters({ filters, onFiltersChange }: DashboardFiltersProps) {
  const update = (key: keyof Filters, value: number | string | null) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Cari Nama AO / FO</Label>
        <Input
          placeholder="Ketik nama..."
          className="h-8 text-xs"
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Min OS</Label>
        <Input
          type="number"
          placeholder="0"
          className="h-8 text-xs"
          value={filters.minOS ?? ''}
          onChange={(e) => update('minOS', e.target.value ? Number(e.target.value) : null)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Max OS</Label>
        <Input
          type="number"
          placeholder="∞"
          className="h-8 text-xs"
          value={filters.maxOS ?? ''}
          onChange={(e) => update('maxOS', e.target.value ? Number(e.target.value) : null)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Min RR (%)</Label>
        <Input
          type="number"
          placeholder="0"
          className="h-8 text-xs"
          value={filters.minRR ?? ''}
          onChange={(e) => update('minRR', e.target.value ? Number(e.target.value) : null)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Max RR (%)</Label>
        <Input
          type="number"
          placeholder="100"
          className="h-8 text-xs"
          value={filters.maxRR ?? ''}
          onChange={(e) => update('maxRR', e.target.value ? Number(e.target.value) : null)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Max NPL (%)</Label>
        <Input
          type="number"
          placeholder="100"
          className="h-8 text-xs"
          value={filters.maxNPL ?? ''}
          onChange={(e) => update('maxNPL', e.target.value ? Number(e.target.value) : null)}
        />
      </div>
    </div>
  )
}
