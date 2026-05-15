'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SortMode, ActiveTab } from '../domain/patient-filters'

interface Props {
  query: string
  onQueryChange: (q: string) => void
  sortBy: SortMode
  onSortChange: (s: SortMode) => void
  activeTab: ActiveTab
  onActiveTabChange: (t: ActiveTab) => void
  counts: { all: number; active: number; closed: number }
}

/**
 * 환자 리스트 상단 필터 — 이름 검색창 + 정렬 select + 상태 탭.
 * 입력 상태는 부모(PatientList)가 보관하고 콜백으로 받음.
 */
export function PatientFilters({
  query,
  onQueryChange,
  sortBy,
  onSortChange,
  activeTab,
  onActiveTabChange,
  counts,
}: Props) {
  return (
    <div className="flex flex-col gap-3 relative z-10">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="이름으로 검색"
            className="pl-9 bg-muted/40 border-muted-foreground/20 focus:bg-background transition-all shadow-sm focus:shadow-md"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortMode)}>
          <SelectTrigger className="h-10 w-[120px] text-xs bg-muted/40 border-muted-foreground/20 shadow-sm">
            <div className="flex items-center gap-1.5">
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">가나다순</SelectItem>
            <SelectItem value="status">상태</SelectItem>
            <SelectItem value="recent">최근 치료순</SelectItem>
            <SelectItem value="created">최근 등록순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => onActiveTabChange(v as ActiveTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1">
          <TabsTrigger value="active" className="text-xs sm:text-sm">
            치료 중 <span className="ml-1 opacity-60 font-mono">{counts.active}</span>
          </TabsTrigger>
          <TabsTrigger value="discharged" className="text-xs sm:text-sm">
            종결 <span className="ml-1 opacity-60 font-mono">{counts.closed}</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            전체 <span className="ml-1 opacity-60 font-mono">{counts.all}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
