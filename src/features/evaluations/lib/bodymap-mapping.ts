/**
 * BodyMap ID ↔ react-muscle-highlighter slug 매핑.
 *
 * 우리 PainArea.id는 string. 두 가지 형태 모두 지원:
 *   1) 옛 형태 (친구 SVG): 'shoulder_l', 'arm_up_r_back', 'glute_l' 등
 *   2) 새 형태 (라이브러리 시대): '{slug}_{l|r}' 또는 '{slug}' (예: 'deltoids_l', 'chest')
 *
 * 이 파일 한 곳에서 양방향 변환 + 한글 label 생성.
 */

// 라이브러리 export 타입과 동일하게 좁힌 slug 유니온
export type LibSlug =
  | 'head' | 'neck' | 'trapezius' | 'upper-back' | 'lower-back'
  | 'chest' | 'abs' | 'obliques'
  | 'deltoids' | 'biceps' | 'triceps' | 'forearm' | 'hands'
  | 'gluteal' | 'quadriceps' | 'hamstring' | 'adductors'
  | 'knees' | 'tibialis' | 'calves' | 'ankles' | 'feet'

export type LibSide = 'left' | 'right'

export type LibPart = { slug: LibSlug; side?: LibSide }

/** '전신' 빠른 선택은 라이브러리 외부 처리 — slug 없음 */
export const GENERAL_ID = 'general'

/**
 * 옛/새 ID → 라이브러리 part로 변환.
 * 매칭 안 되면 null (예: 'general'은 라이브러리에 시각화 안 함).
 */
export function idToLibPart(id: string): LibPart | null {
  if (id === GENERAL_ID) return null

  // 옛 ID (친구 SVG) — 명시 매핑 테이블
  const old = OLD_ID_MAP[id]
  if (old) return old

  // 새 ID 형태: '{slug}' 또는 '{slug}_l' / '{slug}_r'
  const match = id.match(/^([a-z-]+?)(?:_(l|r))?$/)
  if (!match) return null
  const [, slug, sideShort] = match
  if (!LIB_SLUGS.has(slug as LibSlug)) return null
  return {
    slug: slug as LibSlug,
    side: sideShort === 'l' ? 'left' : sideShort === 'r' ? 'right' : undefined,
  }
}

/** 라이브러리 part → 새 ID 형식으로 인코딩 */
export function libPartToId(slug: LibSlug, side?: LibSide): string {
  if (!side) return slug
  return `${slug}_${side === 'left' ? 'l' : 'r'}`
}

/** 한글 라벨 생성 (side + 부위명) */
export function buildLabel(slug: LibSlug, side?: LibSide): string {
  const base = LIB_LABEL_KO[slug]
  if (!side) return base
  return `${side === 'left' ? '왼쪽' : '오른쪽'} ${base}`
}

/** 옛 ID에서도 라벨 생성 가능 (DetailSheet 등 표시 시) */
export function labelFromId(id: string): string {
  if (id === GENERAL_ID) return '전신'
  const lib = idToLibPart(id)
  if (!lib) return id  // 알 수 없으면 id 그대로 fallback
  return buildLabel(lib.slug, lib.side)
}

// ============================================================
// 내부 데이터
// ============================================================

const LIB_SLUGS = new Set<LibSlug>([
  'head', 'neck', 'trapezius', 'upper-back', 'lower-back',
  'chest', 'abs', 'obliques',
  'deltoids', 'biceps', 'triceps', 'forearm', 'hands',
  'gluteal', 'quadriceps', 'hamstring', 'adductors',
  'knees', 'tibialis', 'calves', 'ankles', 'feet',
])

const LIB_LABEL_KO: Record<LibSlug, string> = {
  head: '머리',
  neck: '목',
  trapezius: '상부 등 (승모근)',
  'upper-back': '상부 등',
  'lower-back': '허리',
  chest: '가슴',
  abs: '복부',
  obliques: '옆구리',
  deltoids: '어깨',
  biceps: '앞팔 (이두근)',
  triceps: '뒷팔 (삼두근)',
  forearm: '하완',
  hands: '손',
  gluteal: '엉덩이',
  quadriceps: '허벅지 앞',
  hamstring: '허벅지 뒤',
  adductors: '안쪽 허벅지',
  knees: '무릎',
  tibialis: '정강이',
  calves: '종아리',
  ankles: '발목',
  feet: '발',
}

/** 친구 SVG 시절 옛 ID → 라이브러리 매핑 (호환성 유지용) */
const OLD_ID_MAP: Record<string, LibPart> = {
  // 머리/목
  head: { slug: 'head' },
  neck: { slug: 'neck' },
  head_back: { slug: 'head' },
  neck_back: { slug: 'neck' },
  // 어깨 (앞면만 친구 SVG에 있었음)
  shoulder_l: { slug: 'deltoids', side: 'left' },
  shoulder_r: { slug: 'deltoids', side: 'right' },
  // 가슴/복부
  chest: { slug: 'chest' },
  abdomen: { slug: 'abs' },
  // 등
  back_up: { slug: 'trapezius' },
  back_low: { slug: 'lower-back' },
  // 상완 (앞=이두 / 뒤=삼두)
  arm_up_l: { slug: 'biceps', side: 'left' },
  arm_up_r: { slug: 'biceps', side: 'right' },
  arm_up_l_back: { slug: 'triceps', side: 'left' },
  arm_up_r_back: { slug: 'triceps', side: 'right' },
  // 하완 / 손
  forearm_l: { slug: 'forearm', side: 'left' },
  forearm_r: { slug: 'forearm', side: 'right' },
  forearm_l_back: { slug: 'forearm', side: 'left' },
  forearm_r_back: { slug: 'forearm', side: 'right' },
  hand_l: { slug: 'hands', side: 'left' },
  hand_r: { slug: 'hands', side: 'right' },
  hand_l_back: { slug: 'hands', side: 'left' },
  hand_r_back: { slug: 'hands', side: 'right' },
  // 고관절/엉덩이
  hip_l: { slug: 'gluteal', side: 'left' },
  hip_r: { slug: 'gluteal', side: 'right' },
  glute_l: { slug: 'gluteal', side: 'left' },
  glute_r: { slug: 'gluteal', side: 'right' },
  // 허벅지 (앞=대퇴사두 / 뒤=햄스트링)
  thigh_l: { slug: 'quadriceps', side: 'left' },
  thigh_r: { slug: 'quadriceps', side: 'right' },
  hamstring_l: { slug: 'hamstring', side: 'left' },
  hamstring_r: { slug: 'hamstring', side: 'right' },
  // 무릎
  knee_l: { slug: 'knees', side: 'left' },
  knee_r: { slug: 'knees', side: 'right' },
  // 종아리/정강이
  shin_l: { slug: 'tibialis', side: 'left' },
  shin_r: { slug: 'tibialis', side: 'right' },
  calf_l: { slug: 'calves', side: 'left' },
  calf_r: { slug: 'calves', side: 'right' },
  // 발
  foot_l: { slug: 'feet', side: 'left' },
  foot_r: { slug: 'feet', side: 'right' },
  foot_l_back: { slug: 'feet', side: 'left' },
  foot_r_back: { slug: 'feet', side: 'right' },
}

/** intensity 1~10 → 색상 10단계 그라데이션 (yellow → orange → red).
 * 양상 색상 적용으로 인해 SVG 색칠엔 더 이상 사용 안 함 — fallback / 그래프 등 용도 유지. */
export const INTENSITY_COLORS_10 = [
  '#fef3c7', // 1 light yellow
  '#fde68a', // 2
  '#fcd34d', // 3
  '#fdba74', // 4
  '#fb923c', // 5
  '#f97316', // 6 orange
  '#ef4444', // 7
  '#dc2626', // 8
  '#b91c1c', // 9
  '#7f1d1d', // 10 deep red
]

import type { PainPattern } from '../domain/types'

/** 통증 양상 → 인체 도식 색상 + 태그 텍스트 색상 hex (Tailwind 매핑 그대로). */
export const PATTERN_COLOR_HEX: Record<PainPattern, string> = {
  referred: '#ef4444',     // red-500 (연관통)
  tingling: '#3b82f6',     // blue-500 (저림)
  weakness: '#4f46e5',     // indigo-600 (힘빠짐)
  paresthesia: '#a855f7',  // purple-500 (이상감각)
  radiating: '#f97316',    // orange-500 (방사통)
  sharp: '#eab308',        // yellow-500 (날카로운 통증)
  custom: '#14b8a6',       // teal-500 (기타)
}
