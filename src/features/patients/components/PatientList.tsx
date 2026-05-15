'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PatientCard } from './PatientCard'
import { UserProfileHeader, type UserProfile } from './UserProfileHeader'
import { PatientFilters } from './PatientFilters'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import {
  filterAndSortPatients,
  countByStatus,
  type SortMode,
  type ActiveTab,
} from '../domain/patient-filters'
import { readString, writeString, STORAGE_KEYS } from '@/lib/storage'
import { logout } from '@/lib/supabase/actions'
import { deletePatient, updatePatient, getPatients } from '@/lib/supabase/patients'
import { LogOut, Trash2, CheckCircle, CheckSquare, Square, X, BarChart2, UserCircle, MoreVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useConfirm } from '@/components/confirm-dialog'
import { Edit3 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Patient } from '@/features/patients/domain/types'
import type { LatestTreatmentInfo } from '@/lib/supabase/treatments'

/** 첫 화면 + 무한 스크롤 시 한 번에 추가로 렌더링할 환자 수. */
const PAGE_SIZE = 9

type PatientListProps = {
  /** Server component(page.tsx)에서 prefetch한 환자 목록 — useEffect fetch 대체 */
  initialPatients: Patient[]
  /** Server에서 같은 round-trip으로 prefetch한 마지막 치료일 + timestamp map */
  initialLatestDates: Record<string, LatestTreatmentInfo>
  /** Server에서 prefetch한 사용자 프로필 (헤더 좌상단 표시용, layout shift 방지) */
  initialUserProfile: UserProfile | null
}

export function PatientList({
  initialPatients,
  initialLatestDates,
  initialUserProfile,
}: PatientListProps) {
  // 데이터/프로필 fetch는 server component에서 끝냈음. props로 받은 값으로 즉시 시작.
  // (이전: client useEffect에서 fetch → 응답 도착 전까지 navigation 등 다른 RSC
  //  요청이 같은 pipeline에서 큐잉되어 카드 클릭이 무반응으로 보이는 UX 버그
  //  + userProfile null → 도착 시 layout shift 발생)
  const [patients, setPatients] = useState<Patient[]>(initialPatients)
  const [latestDates] = useState<Record<string, LatestTreatmentInfo>>(initialLatestDates)
  const [userProfile] = useState<UserProfile | null>(initialUserProfile)
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<ActiveTab>('active')
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  // 기본값 'recent': 임상 워크플로우상 "오늘 본 환자가 위로" 가 가장 자연스러움.
  // 사용자가 다른 옵션 선택 시 STORAGE_KEYS.patientSort에 저장되어 그 후 그게 우선.
  const [sortBy, setSortBy] = useState<SortMode>('recent')

  const router = useRouter()
  const confirm = useConfirm()

  useEffect(() => {
    // 저장된 정렬 기준 불러오기 — localStorage 동기화 (client only)
    const savedSort = readString(STORAGE_KEYS.patientSort, '')
    if (savedSort && ['name', 'status', 'recent', 'created'].includes(savedSort)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSortBy(savedSort as SortMode)
    }
  }, [])

  const handleSortChange = (val: SortMode) => {
    setSortBy(val)
    writeString(STORAGE_KEYS.patientSort, val)
  }

  const handleLogout = async () => {
    const ok = await confirm({
      title: '로그아웃 하시겠습니까?',
      confirmText: '로그아웃',
    })
    if (!ok) return
    try {
      await logout()
      toast.info('로그아웃 되었습니다.')
      router.replace('/login')
    } catch (error) {
      console.error('로그아웃 오류:', error)
      // 리다이렉트 에러 등 무시
    }
  }

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => 
      selected ? [...prev, id] : prev.filter(i => i !== id)
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map(p => p.id))
    }
  }

  const handleBatchDelete = async () => {
    const ok = await confirm({
      title: `${selectedIds.length}명의 환자 정보를 완전히 삭제할까요?`,
      description: '환자별 치료 기록·평가 기록도 함께 사라집니다. 되돌릴 수 없습니다.',
      confirmText: '삭제',
      variant: 'destructive',
    })
    if (!ok) return
    
    setIsSelectionMode(false) // UI 잠금
    
    for (const id of selectedIds) {
      await deletePatient(id)
    }
    
    toast.success(`${selectedIds.length}명 삭제됨`)
    setPatients(await getPatients())
    setSelectedIds([])
  }

  const handleBatchMoveToClosed = async () => {
    const ok = await confirm({
      title: `${selectedIds.length}명의 환자를 '종결' 상태로 변경할까요?`,
      description: '"치료 중" 탭에서는 더 이상 보이지 않습니다. 나중에 다시 활성화할 수 있습니다.',
      confirmText: '종결',
    })
    if (!ok) return
    
    setIsSelectionMode(false)
    
    for (const id of selectedIds) {
      await updatePatient(id, { status: 'discharged' })
    }
    
    toast.success(`${selectedIds.length}명 종결 처리됨`)
    setPatients(await getPatients())
    setSelectedIds([])
  }

  const lastTreatmentByPatient = latestDates

  // React Compiler가 자동 메모이즈하지만 명시적 useMemo 유지 (호환 의도, 향후 컴파일러 정착 시 제거 검토)
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const filtered = useMemo(
    () =>
      filterAndSortPatients(patients, {
        query,
        activeTab,
        sortBy,
        latestByPatient: lastTreatmentByPatient,
      }),
    [patients, query, activeTab, sortBy, lastTreatmentByPatient],
  )

  const counts = useMemo(() => countByStatus(patients), [patients])

  // 무한 스크롤 — sentinel 진입 시 PAGE_SIZE씩 추가. 검색·탭·정렬 변경 시 첫 페이지로 리셋.
  const { visibleCount, sentinelRef } = useInfiniteScroll({
    totalCount: filtered.length,
    resetDeps: [query, activeTab, sortBy],
    pageSize: PAGE_SIZE,
  })

  // 카드가 1개일 때 lg에서 2열 grid는 우측이 비어 보임 → 단일 컬럼 + 좁은 max-width로 fallback
  const isSingleCard = filtered.length === 1

  return (
    <div
      className={`mx-auto flex w-full max-w-2xl ${isSingleCard ? '' : 'lg:max-w-5xl'} flex-1 flex-col gap-4 p-4 pb-24 relative overflow-hidden`}
    >
      <header className="flex items-start justify-between gap-3 relative z-10">
        <UserProfileHeader profile={userProfile} />
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode)
              setSelectedIds([])
            }}
            title={isSelectionMode ? '취소' : '선택 모드'}
            className={`h-9 w-9 ${isSelectionMode ? 'bg-primary/10 text-primary' : ''}`}
          >
            {isSelectionMode ? (
              <X className="h-4 w-4" />
            ) : (
              <Edit3 className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="메뉴"
                className="h-9 w-9"
                aria-label="메뉴"
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {process.env.NODE_ENV !== 'production' && (
                <DropdownMenuItem asChild>
                  <Link href="/seed" className="cursor-pointer">
                    <Plus className="mr-2 h-4 w-4 text-blue-600" />
                    데이터 생성 (dev)
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <UserCircle className="mr-2 h-4 w-4" />
                  프로필 설정
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/statistics" className="cursor-pointer">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  통계 분석
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <PatientFilters
        query={query}
        onQueryChange={setQuery}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        counts={counts}
      />

      {filtered.length === 0 ? (
        <div className="relative z-10 flex-1">
          <EmptyState hasPatients={patients.length > 0} />
        </div>
      ) : (
        <div
          className={`flex flex-col gap-2 ${isSingleCard ? '' : 'lg:grid lg:grid-cols-2 lg:gap-3'} relative z-10 flex-1 content-start`}
        >
          {isSelectionMode && filtered.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="self-start text-xs text-muted-foreground h-7 px-2"
            >
              {selectedIds.length === filtered.length ? <CheckSquare className="w-3.5 h-3.5 mr-1.5" /> : <Square className="w-3.5 h-3.5 mr-1.5" />}
              {selectedIds.length === filtered.length ? '전체 해제' : '전체 선택'}
            </Button>
          )}
          {filtered.slice(0, visibleCount).map((p) => (
            <PatientCard
              key={p.id}
              patient={p}
              lastTreatmentDate={lastTreatmentByPatient[p.id]?.date}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.includes(p.id)}
              onSelect={handleSelect}
            />
          ))}
          {visibleCount < filtered.length && (
            <>
              {/* sentinel — viewport 진입 시 +PAGE_SIZE */}
              <div ref={sentinelRef} aria-hidden className="h-1" />
              <p className="py-3 text-center text-xs text-muted-foreground">
                불러오는 중… ({visibleCount} / {filtered.length})
              </p>
            </>
          )}
        </div>
      )}

      {/* 하단 철학적 문구 푸터 */}
      <footer className="mt-auto py-6 text-center opacity-40 select-none pointer-events-none">
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase mb-1">
          Professional Clinical Standard
        </p>
        <p className="text-xs italic leading-relaxed break-keep px-8">
          {'"정확한 평가는 치료의 가장 정직한 지도(Map)가 됩니다."'}
        </p>
      </footer>

      {/* 일괄 작업 바 */}
      {isSelectionMode && selectedIds.length > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium ml-2">{selectedIds.length}명 선택됨</span>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleBatchMoveToClosed}
                className="text-white hover:bg-white/10 h-9 px-3 gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                종결 이동
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleBatchDelete}
                className="text-red-400 hover:bg-red-400/10 hover:text-red-400 h-9 px-3 gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      {!isSelectionMode && (
        <Link
          href="/patients/new"
          aria-label="환자 등록"
          className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 hover:shadow-xl"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </Link>
      )}
    </div>
  )
}

function EmptyState({ hasPatients }: { hasPatients: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      <Users className="h-12 w-12 text-muted-foreground/40" strokeWidth={1.5} />
      {hasPatients ? (
        <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            등록된 환자가 아직 없습니다.
          </p>
          <Button asChild>
            <Link href="/patients/new">
              <Plus className="mr-1 h-4 w-4" />첫 환자 등록
            </Link>
          </Button>
        </>
      )}
    </div>
  )
}
