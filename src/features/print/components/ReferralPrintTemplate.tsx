import { formatDate } from '@/lib/utils/date'
import type { Patient, InsuranceType } from '@/features/patients/domain/types'
import type { Treatment } from '@/features/treatments/domain/types'
import type { Evaluation } from '@/features/evaluations/domain/types'
import type { IcfAssessment } from '@/features/icf/domain/types'
import { BODY_REGIONS } from '@/data/body-parts'
import { JOINTS } from '@/data/joints'

/**
 * B. 의뢰서 — 의사·타 의료진에게 전달하는 임상 표준 양식 가까운 형식.
 * 객관 데이터(VAS/ROM/MMT 수치 표) + ICF 5도메인 + clinicalNote + 서명란.
 * 한자어·영어 학명 병기 OK. 환자용보다 격식 있고 정보 밀도 높음.
 */
type Props = {
  patient: Patient
  treatments: Treatment[]
  evaluations: Evaluation[]
  icfAssessments: IcfAssessment[]
  generatedAt: string
  authorName?: string
}

const INSURANCE_LABELS: Record<InsuranceType, string> = {
  health: '건강보험',
  industrial: '산재보험',
  auto: '자동차보험',
  private: '실비보험',
  medical: '의료급여',
  self: '자비',
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

const SIDE_LABELS: Record<string, string> = {
  left: '좌',
  right: '우',
  both: '양측',
}

const DOMAIN_LABELS: Record<string, string> = {
  body: '신체기능',
  activity: '활동',
  participation: '참여',
  environment: '환경',
  personal: '개인',
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

function lookupMovementLabel(jointId: string): string {
  for (const joint of JOINTS) {
    for (const movement of joint.movements) {
      if (movement.id === jointId) return `${joint.label} ${movement.label}`
    }
  }
  return jointId
}

export function ReferralPrintTemplate({
  patient,
  treatments,
  evaluations,
  icfAssessments,
  generatedAt,
  authorName,
}: Props) {
  const age = calculateAge(patient.birthDate)
  const totalSessions = treatments.length
  // "가장 최근의 의미 있는 평가" — 빈 평가 카드(데이터 없음)는 의뢰서에 무의미하므로 skip
  const latestEval = evaluations.find((e) =>
    typeof e.vas === 'number' ||
    (e.rom && e.rom.length > 0) ||
    (e.mmt && e.mmt.length > 0) ||
    (e.bodyMeasurement && e.bodyMeasurement.length > 0) ||
    (e.painMapping && e.painMapping.length > 0),
  )
  const latestIcf = icfAssessments[0]

  // 치료 방법 빈도
  const methodCount = new Map<string, number>()
  for (const t of treatments) {
    for (const m of t.methods) {
      methodCount.set(m, (methodCount.get(m) ?? 0) + 1)
    }
  }
  const methodSummary = Array.from(methodCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([m, n]) => `${METHOD_LABELS[m] ?? m}(${n}회)`)

  // VAS 추이
  const vasEntries = evaluations
    .filter((e) => typeof e.vas === 'number')
    .sort((a, b) => a.date.localeCompare(b.date))
  const firstVas = vasEntries[0]?.vas
  const lastVas = vasEntries[vasEntries.length - 1]?.vas

  // 치료 부위
  const regionSet = new Set<string>()
  for (const t of treatments) {
    for (const p of t.bodyParts) regionSet.add(p.region)
  }
  const regions = Array.from(regionSet).map(getRegionLabel)

  return (
    <article className="print-page font-[ui-sans-serif,system-ui]">
      {/* 헤더 */}
      <header className="avoid-break mb-5 border-b-2 border-slate-800 pb-3">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">물리치료 의뢰서</h1>
            <p className="text-xs text-slate-500">Physical Therapy Referral · physiolog</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>발급일: {formatDate(generatedAt)}</p>
            <p>의뢰인: {authorName || patient.therapist || '-'}</p>
          </div>
        </div>
      </header>

      {/* [1] 환자 정보 */}
      <section className="avoid-break mb-4">
        <h3 className="mb-1.5 text-[11pt] font-bold text-slate-800">[1] 환자 정보</h3>
        <table className="w-full border-collapse text-[10pt]">
          <tbody>
            <tr className="border-y border-slate-300">
              <th className="w-24 bg-slate-50 px-2 py-1 text-left font-medium text-slate-600">성명</th>
              <td className="w-32 px-2 py-1 text-slate-900">{patient.name}</td>
              <th className="w-20 bg-slate-50 px-2 py-1 text-left font-medium text-slate-600">성별/연령</th>
              <td className="px-2 py-1 text-slate-900">
                {patient.gender === 'male' ? '남' : '여'}
                {age !== null && ` / ${age}세`}
              </td>
            </tr>
            <tr className="border-b border-slate-300">
              <th className="bg-slate-50 px-2 py-1 text-left font-medium text-slate-600">생년월일</th>
              <td className="px-2 py-1 text-slate-900">{formatDate(patient.birthDate)}</td>
              <th className="bg-slate-50 px-2 py-1 text-left font-medium text-slate-600">연락처</th>
              <td className="px-2 py-1 text-slate-900">{patient.phone || '-'}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <th className="bg-slate-50 px-2 py-1 text-left font-medium text-slate-600">진단명</th>
              <td className="px-2 py-1 text-slate-900" colSpan={3}>{patient.diagnosis || '-'}</td>
            </tr>
            {patient.surgeryHistory && (
              <tr className="border-b border-slate-300">
                <th className="bg-slate-50 px-2 py-1 text-left font-medium text-slate-600">수술이력</th>
                <td className="px-2 py-1 text-slate-900" colSpan={3}>{patient.surgeryHistory}</td>
              </tr>
            )}
            {patient.medicalHistory?.length > 0 && (
              <tr className="border-b border-slate-300">
                <th className="bg-slate-50 px-2 py-1 text-left font-medium text-slate-600">병력</th>
                <td className="px-2 py-1 text-slate-900" colSpan={3}>
                  {patient.medicalHistory.join(', ')}
                  {patient.otherMedicalHistory && ` / ${patient.otherMedicalHistory}`}
                </td>
              </tr>
            )}
            <tr className="border-b border-slate-300">
              <th className="bg-slate-50 px-2 py-1 text-left font-medium text-slate-600">보험</th>
              <td className="px-2 py-1 text-slate-900">{INSURANCE_LABELS[patient.insurance] ?? patient.insurance}</td>
              <th className="bg-slate-50 px-2 py-1 text-left font-medium text-slate-600">치료 시작</th>
              <td className="px-2 py-1 text-slate-900">{formatDate(patient.treatmentStartDate)}</td>
            </tr>
            {patient.notes && (
              <tr className="border-b border-slate-300">
                <th className="bg-slate-50 px-2 py-1 text-left font-medium text-slate-600">특이사항</th>
                <td className="px-2 py-1 text-slate-900" colSpan={3}>{patient.notes}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* [2] 임상 평가 */}
      {latestEval && (
        <section className="avoid-break mb-4">
          <h3 className="mb-1.5 text-[11pt] font-bold text-slate-800">
            [2] 임상 평가 <span className="text-xs font-normal text-slate-500">(최근 측정: {formatDate(latestEval.date)})</span>
          </h3>
          <table className="w-full border-collapse text-[10pt]">
            <thead>
              <tr className="border-y border-slate-400 bg-slate-100">
                <th className="px-2 py-1 text-left font-semibold text-slate-700">측정 항목</th>
                <th className="px-2 py-1 text-left font-semibold text-slate-700">결과</th>
              </tr>
            </thead>
            <tbody>
              {typeof latestEval.vas === 'number' && (
                <tr className="border-b border-slate-300">
                  <td className="px-2 py-1 font-medium text-slate-700">VAS (시각통증척도)</td>
                  <td className="px-2 py-1 text-slate-900">{latestEval.vas} / 10</td>
                </tr>
              )}
              {latestEval.rom?.map((r, i) => (
                <tr key={`rom-${i}`} className="border-b border-slate-300">
                  <td className="px-2 py-1 font-medium text-slate-700">
                    ROM · {r.side ? `${SIDE_LABELS[r.side]} ` : ''}{lookupMovementLabel(r.jointId)}
                  </td>
                  <td className="px-2 py-1 text-slate-900">
                    {typeof r.active === 'number' && `Active ${r.active}°`}
                    {typeof r.active === 'number' && typeof r.passive === 'number' && ' / '}
                    {typeof r.passive === 'number' && `Passive ${r.passive}°`}
                  </td>
                </tr>
              ))}
              {latestEval.mmt?.map((m, i) => (
                <tr key={`mmt-${i}`} className="border-b border-slate-300">
                  <td className="px-2 py-1 font-medium text-slate-700">
                    MMT · {m.side ? `${SIDE_LABELS[m.side]} ` : ''}{lookupMovementLabel(m.jointId)}
                  </td>
                  <td className="px-2 py-1 text-slate-900">{m.grade} / 5</td>
                </tr>
              ))}
              {latestEval.bodyMeasurement?.map((b, i) => (
                <tr key={`bm-${i}`} className="border-b border-slate-300">
                  <td className="px-2 py-1 font-medium text-slate-700">신체계측 · {b.location}</td>
                  <td className="px-2 py-1 text-slate-900">{b.value}{b.unit}</td>
                </tr>
              ))}
              {latestEval.painMapping && latestEval.painMapping.length > 0 && (
                <tr className="border-b border-slate-300">
                  <td className="px-2 py-1 font-medium text-slate-700">통증 양상</td>
                  <td className="px-2 py-1 text-slate-900">
                    {latestEval.painMapping.map((p) => `${p.label}(${p.pattern}, ${p.intensity}/10)`).join('; ')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* [3] 치료 경과 */}
      <section className="avoid-break mb-4">
        <h3 className="mb-1.5 text-[11pt] font-bold text-slate-800">[3] 치료 경과</h3>
        <ul className="ml-4 list-disc space-y-0.5 text-[10pt] text-slate-700">
          <li>치료 기간: {formatDate(patient.treatmentStartDate)} ~ {treatments[0] ? formatDate(treatments[0].date) : '진행 중'} (총 {totalSessions}회)</li>
          {regions.length > 0 && <li>치료 부위: {regions.join(', ')}</li>}
          {methodSummary.length > 0 && <li>치료 방법: {methodSummary.join(', ')}</li>}
          {firstVas !== undefined && lastVas !== undefined && firstVas !== lastVas && (
            <li>
              주요 진전: VAS {firstVas}점 → {lastVas}점
              {lastVas < firstVas ? ' (호전)' : ''}
            </li>
          )}
        </ul>
      </section>

      {/* [4] ICF 임상 추론 */}
      {latestIcf && (
        <section className="avoid-break mb-4">
          <h3 className="mb-1.5 text-[11pt] font-bold text-slate-800">
            [4] ICF 임상 추론 <span className="text-xs font-normal text-slate-500">(평가일: {formatDate(latestIcf.date)})</span>
          </h3>
          <div className="space-y-1.5 text-[10pt] text-slate-700">
            {(['body', 'activity', 'participation', 'environment', 'personal'] as const).map((key) => {
              const items = latestIcf.finalDomains?.[key] ?? []
              if (items.length === 0) return null
              return (
                <div key={key}>
                  <span className="font-semibold text-slate-800">• {DOMAIN_LABELS[key]}:</span>{' '}
                  <span>{items.join('; ')}</span>
                </div>
              )
            })}
          </div>
          {latestIcf.finalNote && (
            <div className="mt-2 rounded border border-slate-300 bg-slate-50 p-2 text-[10pt] text-slate-700">
              <p className="mb-0.5 text-xs font-semibold text-slate-600">임상 추론 요약</p>
              <p className="leading-relaxed">{latestIcf.finalNote}</p>
            </div>
          )}
        </section>
      )}

      {/* [5] 서명란 */}
      <section className="avoid-break mt-6">
        <div className="flex items-end justify-end gap-6">
          <div className="text-right">
            <p className="text-[10pt] text-slate-700">담당 물리치료사</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-[11pt] font-medium text-slate-900">{authorName || patient.therapist || ''}</span>
              <span className="text-slate-400">(서명)</span>
            </div>
            <div className="mt-1 h-px w-48 bg-slate-400" />
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="mt-6 border-t border-slate-200 pt-2 text-center text-[9pt] text-slate-400">
        본 의뢰서는 physiolog 시스템에서 자동 생성되었습니다. · 발급일 {formatDate(generatedAt)}
      </footer>
    </article>
  )
}
