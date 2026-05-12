'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PatientCard } from './PatientCard'
import { treatmentStore, evaluationStore } from '@/lib/storage'
import { getProfile, logout } from '@/lib/supabase/actions'
import { getPatients, deletePatient, updatePatient } from '@/lib/supabase/patients'
import { getLatestTreatment } from '@/lib/supabase/treatments'
import { LogOut, Trash2, CheckCircle, CheckSquare, Square, X, BarChart2, ArrowUpDown, UserCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit3 } from 'lucide-react'
import type { Patient } from '@/features/patients/domain/types'

export function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [query, setQuery] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [userProfile, setUserProfile] = useState<{ name: string; role: string; workplace: string } | null>(null)
  const [activeTab, setActiveTab] = useState('active')
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'recent' | 'created'>('name')
  const [latestDates, setLatestDates] = useState<Record<string, string>>({})

  const router = useRouter()

  useEffect(() => {
    // 서버에서 환자 목록 및 최근 치료 날짜 가져오기
    const fetchPatients = async () => {
      const data = await getPatients()
      setPatients(data)

      const datesMap: Record<string, string> = {}
      for (const p of data) {
        const latest = await getLatestTreatment(p.id)
        if (latest) {
          datesMap[p.id] = latest.date
        }
      }
      setLatestDates(datesMap)
    }
    fetchPatients()
    
    // 서버에서 프로필 정보 가져오기
    const loadUser = async () => {
      const profile = await getProfile()
      if (profile) {
        setUserProfile({
          name: profile.name || profile.email?.split('@')[0] || '사용자',
          role: profile.role || '',
          workplace: profile.workplace || ''
        })
      }
    }
    loadUser()
    
    // 저장된 정렬 기준 불러오기
    const savedSort = localStorage.getItem('physiolog_patient_sort') as any
    if (savedSort && ['name', 'status', 'recent', 'created'].includes(savedSort)) {
      setSortBy(savedSort)
    }
    
    setHydrated(true)
  }, [])

  const handleSortChange = (val: 'name' | 'status' | 'recent' | 'created') => {
    setSortBy(val)
    localStorage.setItem('physiolog_patient_sort', val)
  }

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      try {
        await logout()
        toast.info('로그아웃 되었습니다.')
        router.replace('/login')
      } catch (error) {
        console.error('로그아웃 오류:', error)
        // 리다이렉트 에러 등 무시
      }
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
    if (!confirm(`${selectedIds.length}명의 환자 정보를 완전히 삭제할까요?`)) return
    
    setIsSelectionMode(false) // UI 잠금
    
    for (const id of selectedIds) {
      await deletePatient(id)
    }
    
    toast.success(`${selectedIds.length}명 삭제됨`)
    setPatients(await getPatients())
    setSelectedIds([])
  }

  const handleBatchMoveToClosed = async () => {
    if (!confirm(`${selectedIds.length}명의 환자를 '종결' 상태로 변경할까요?`)) return
    
    setIsSelectionMode(false)
    
    for (const id of selectedIds) {
      await updatePatient(id, { status: 'discharged' })
    }
    
    toast.success(`${selectedIds.length}명 종결 처리됨`)
    setPatients(await getPatients())
    setSelectedIds([])
  }

  const lastTreatmentByPatient = useMemo(() => {
    return latestDates
  }, [latestDates])

  const filtered = useMemo(() => {
    let result = patients

    // 탭 필터링
    if (activeTab === 'active') {
      result = result.filter((p) => p.status !== 'discharged')
    } else if (activeTab === 'discharged') {
      result = result.filter((p) => p.status === 'discharged')
    }

    // 검색어 필터링
    const q = query.trim().toLowerCase()
    if (q) {
      result = result.filter((p) => p.name.toLowerCase().includes(q))
    }

    // 정렬 로직
    return [...result].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'ko')
      }
      if (sortBy === 'status') {
        const order = { new: 0, readmit: 1, hold: 2, discharged: 3 }
        return order[a.status] - order[b.status]
      }
      if (sortBy === 'recent') {
        const dateA = lastTreatmentByPatient[a.id] || '0000-00-00'
        const dateB = lastTreatmentByPatient[b.id] || '0000-00-00'
        return dateB.localeCompare(dateA) // 최신순
      }
      if (sortBy === 'created') {
        return b.createdAt.localeCompare(a.createdAt)
      }
      return 0
    })
  }, [patients, query, activeTab, sortBy, lastTreatmentByPatient])

  const counts = useMemo(() => {
    return {
      all: patients.length,
      active: patients.filter((p) => p.status !== 'discharged').length,
      closed: patients.filter((p) => p.status === 'discharged').length,
    }
  }, [patients])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 pb-24 relative overflow-hidden">
      <header className="flex items-start justify-between relative z-10">
        <div className="flex flex-col gap-4">
          {userProfile && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-foreground">
                  {userProfile.name} <span className="text-xs font-normal text-muted-foreground">{userProfile.role}</span>
                </p>
                {userProfile.workplace && (
                  <span className="text-[10px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                    {userProfile.workplace}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground/60 tracking-wider uppercase font-medium">
                Expert Healthcare Provider
              </p>
            </div>
          )}
          
          <h1 className="text-2xl font-bold tracking-tight">환자 목록</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" asChild title="데이터 생성" className="h-9 w-9">
            <Link href="/seed">
              <Plus className="h-4 w-4 text-blue-600" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild title="프로필 설정" className="h-9 w-9">
            <Link href="/profile">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild title="통계 분석" className="h-9 w-9">
            <Link href="/statistics">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setIsSelectionMode(!isSelectionMode)
              setSelectedIds([])
            }} 
            title={isSelectionMode ? "취소" : "선택 모드"} 
            className={`h-9 w-9 ${isSelectionMode ? 'bg-primary/10 text-primary' : ''}`}
          >
            {isSelectionMode ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="로그아웃" className="h-9 w-9">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3 relative z-10">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름으로 검색"
              className="pl-9 bg-muted/40 border-muted-foreground/20 focus:bg-background transition-all shadow-sm focus:shadow-md"
            />
          </div>
          <Select value={sortBy} onValueChange={handleSortChange}>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

      {!hydrated ? (
        <div className="flex flex-1 items-center justify-center py-20 relative z-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="relative z-10 flex-1">
          <EmptyState hasPatients={patients.length > 0} />
        </div>
      ) : (
        <div className="flex flex-col gap-2 relative z-10 flex-1">
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
          {filtered.map((p) => (
            <PatientCard
              key={p.id}
              patient={p}
              lastTreatmentDate={lastTreatmentByPatient[p.id]}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.includes(p.id)}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* 하단 철학적 문구 푸터 */}
      <footer className="mt-auto py-6 text-center opacity-40 select-none pointer-events-none">
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase mb-1">
          Professional Clinical Standard
        </p>
        <p className="text-xs italic leading-relaxed break-keep px-8">
          "정확한 평가는 치료의 가장 정직한 지도(Map)가 됩니다."
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
