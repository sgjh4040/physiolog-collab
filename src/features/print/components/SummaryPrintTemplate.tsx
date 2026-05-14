import { formatDate } from '@/lib/utils/date'
import type { Patient } from '@/features/patients/domain/types'
import type { Treatment } from '@/features/treatments/domain/types'
import type { Evaluation } from '@/features/evaluations/domain/types'
import { BODY_REGIONS } from '@/data/body-parts'

/**
 * A. 환자용 요약지 — 환자에게 직접 전달하는 1페이지 카피.
 * 친근한 톤, 의학 용어 옆 한글 병기, ICF 임상 노트는 제외.
 * 핵심: 받은 치료 / 회복 추이 / 홈 프로그램 / 주의사항.
 */
type Props = {
  patient: Patient
  treatments: Treatment[]
  evaluations: Evaluation[]
  generatedAt: string // ISO date — 인쇄 일시
  authorName?: string // 담당 치료사
}

const METHOD_LABELS: Record<string, string> = {
  manual: '도수치료',
  electric: '전기치료',
  ultrasound: '초음파',
  thermal: '냉온치료',
  task: '과제훈련',
  exercise: '운동치료',
  other: '기타',
}

function calculateAge(birthDate: string): number | null {
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age >= 0 ? age : null
}

function getRegionLabel(regionId: string): string {
  return BODY_REGIONS.find((r) => r.id === regionId)?.label ?? regionId
}

export function SummaryPrintTemplate({
  patient,
  treatments,
  evaluations,
  generatedAt,
  authorName,
}: Props) {
  const age = calculateAge(patient.birthDate)
  const totalSessions = treatments.length

  // 가장 흔히 받은 치료 방법 상위 3개
  const methodCount = new Map<string, number>()
  for (const t of treatments) {
    for (const m of t.methods) {
      methodCount.set(m, (methodCount.get(m) ?? 0) + 1)
    }
  }
  const topMethods = Array.from(methodCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m]) => METHOD_LABELS[m] ?? m)

  // 주요 치료 부위
  const regionSet = new Set<string>()
  for (const t of treatments) {
    for (const p of t.bodyParts) regionSet.add(p.region)
  }
  const regions = Array.from(regionSet).map(getRegionLabel)

  // VAS 추이 — 가장 오래된 vs 가장 최근
  const vasEntries = evaluations
    .filter((e) => typeof e.vas === 'number')
    .sort((a, b) => a.date.localeCompare(b.date))
  const firstVas = vasEntries[0]?.vas
  const lastVas = vasEntries[vasEntries.length - 1]?.vas

  // 최근 치료의 운동·숙제 정보 (홈 프로그램용)
  const latestTreatment = treatments[0]
  const homeProgram: string[] = []
  if (latestTreatment?.exercises) {
    for (const ex of latestTreatment.exercises) {
      if (!ex.name) continue
      const parts: string[] = []
      if (ex.sets) parts.push(`${ex.sets}세트`)
      if (ex.reps) parts.push(`${ex.reps}회`)
      if (ex.weight) parts.push(`${ex.weight}kg`)
      if (ex.duration) parts.push(`${ex.duration}분`)
      homeProgram.push(parts.length > 0 ? `${ex.name} — ${parts.join(', ')}` : ex.name)
    }
  }
  if (latestTreatment?.homework) {
    homeProgram.push(latestTreatment.homework)
  }

  const startDate = patient.treatmentStartDate
  const lastDate = treatments[0]?.date

  return (
    <article className="print-page">
      {/* 헤더 */}
      <header className="avoid-break mb-6 border-b-2 border-slate-800 pb-3">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">physiolog</h1>
            <p className="text-sm text-slate-500">물리치료 진료 요약지</p>
          </div>
          <p className="text-xs text-slate-500">발급일: {formatDate(generatedAt)}</p>
        </div>
      </header>

      {/* 인사말 */}
      <section className="avoid-break mb-5">
        <h2 className="text-lg font-bold text-slate-800">
          {patient.name} 님께
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          그동안의 치료 내용과 회복 경과를 정리해드립니다. 집에서도 꾸준히 관리하실 수 있도록 참고해주세요.
        </p>
      </section>

      {/* 환자 기본 정보 */}
      <section className="avoid-break mb-5 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">환자 정보</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <dt className="font-medium text-slate-600">성명</dt>
          <dd className="text-slate-900">{patient.name}</dd>

          <dt className="font-medium text-slate-600">생년월일</dt>
          <dd className="text-slate-900">
            {formatDate(patient.birthDate)}
            {age !== null && <span className="ml-1 text-slate-500">(만 {age}세)</span>}
          </dd>

          <dt className="font-medium text-slate-600">진단명</dt>
          <dd className="text-slate-900">{patient.diagnosis || '-'}</dd>

          <dt className="font-medium text-slate-600">치료 기간</dt>
          <dd className="text-slate-900">
            {formatDate(startDate)}
            {lastDate && ` ~ ${formatDate(lastDate)}`}
            <span className="ml-1 text-slate-500">(총 {totalSessions}회)</span>
          </dd>
        </dl>
      </section>

      {/* 회복 추이 */}
      {(firstVas !== undefined || vasEntries.length > 0) && (
        <section className="avoid-break mb-5">
          <h3 className="mb-2 text-sm font-bold text-slate-800">📈 회복 추이</h3>
          <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-slate-700">
            {firstVas !== undefined && lastVas !== undefined && firstVas !== lastVas ? (
              <p>
                통증 점수가{' '}
                <strong className="text-emerald-700">{firstVas}점 → {lastVas}점</strong>
                {lastVas < firstVas ? '으로 호전되었습니다.' : '으로 변화하였습니다.'}
              </p>
            ) : firstVas !== undefined ? (
              <p>현재 통증 점수 <strong>{firstVas}/10</strong> 입니다.</p>
            ) : null}
            <p className="mt-1 text-xs text-slate-500">
              총 {vasEntries.length}회 평가 기록 기준
            </p>
          </div>
        </section>
      )}

      {/* 받으신 치료 */}
      <section className="avoid-break mb-5">
        <h3 className="mb-2 text-sm font-bold text-slate-800">💪 받으신 치료</h3>
        <ul className="space-y-1 text-sm text-slate-700">
          {topMethods.length > 0 && (
            <li>
              • 주요 치료 방법:{' '}
              <span className="font-medium">{topMethods.join(', ')}</span>
            </li>
          )}
          {regions.length > 0 && (
            <li>
              • 치료 부위:{' '}
              <span className="font-medium">{regions.join(', ')}</span>
            </li>
          )}
        </ul>
      </section>

      {/* 홈 프로그램 */}
      {homeProgram.length > 0 && (
        <section className="avoid-break mb-5">
          <h3 className="mb-2 text-sm font-bold text-slate-800">🏠 집에서 하실 운동·관리</h3>
          <ol className="ml-5 list-decimal space-y-1 text-sm text-slate-700">
            {homeProgram.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </section>
      )}

      {/* 주의사항 */}
      {patient.notes && (
        <section className="avoid-break mb-5">
          <h3 className="mb-2 text-sm font-bold text-slate-800">⚠️ 주의사항</h3>
          <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3 text-sm text-slate-700">
            {patient.notes}
          </div>
        </section>
      )}

      {/* 담당자 */}
      <section className="avoid-break mt-6 border-t border-slate-200 pt-3 text-sm text-slate-700">
        <p>
          담당 물리치료사:{' '}
          <span className="font-medium">{authorName || patient.therapist || '-'}</span>
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          궁금하신 점이 있으시면 언제든 문의해주세요.
        </p>
      </section>

      {/* 푸터 */}
      <footer className="mt-8 border-t border-slate-100 pt-2 text-center text-[10px] text-slate-400">
        본 양식은 진료 보조 목적이며 의학적 진단을 대체하지 않습니다. · physiolog
      </footer>
    </article>
  )
}
