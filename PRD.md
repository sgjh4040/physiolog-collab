# physiolog — Product Requirements Document

> 최종 갱신: 2026-05-15 / Phase 1 (MVP) 인계 직전 상태 반영.
> 친구 원본 PRD v1.6은 22주 풀버전(`docs/PhysioLog_PRD_v1.6.docx`) — 우리는 압축 MVP.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| **앱 이름** | physiolog |
| **대상 사용자** | 물리치료사·트레이너 (1차: 친구 현직 PT, 2차: 임상 동료 1~2명) |
| **핵심 KPI** | 환자 1인당 차팅 시간 **10~20분 → 5분 이내** |
| **차별점** | WHO **ICF**(International Classification of Functioning) 기반 임상 추론 보조 AI |
| **사전 평가** | AI 심사관 평가 9.18 / 10 (A+) — `docs/evaluations/2026-05-14-ai-judge-evaluation.md` |
| **개발 규모** | 98 commit · 1681줄 풀 임상 시드 · 162줄 ICF 시스템 프롬프트 |
| **배포** | Vercel + PWA (병원 와이파이 불안정 대비) |

### 의사결정 압축 흔적

원본 PRD 22주 풀버전(이중 EHR 연동·다국어·STT·BLE·AI 헬스장 통합 포함) → MVP 14주 → 실제 1~2개월 압축. 압축 원칙:

1. **차팅 시간 단축**이라는 KPI에 직접 기여하는 기능만 Phase 1
2. **AI는 깊이로**: 분량 적게, 임상 추론·red flag·맥락 RAG까지 깊이 있게
3. **임상 정확성 우선**: 도메인 데이터(근육·관절·평가 항목)는 학명 병기 + anatomical position 순서
4. **법적 안전**: 진단·처방·심리진단 가드레일을 시스템 프롬프트 레벨에서 차단

---

## 2. 문제 정의 & 도메인 이해

### 진짜 문제

물리치료 임상 현장에서 환자 1인당 **차팅에 10~20분**이 듦. 60분 진료 중 차팅이 1/3를 잡아먹는 구조. 결과:

- 치료사가 환자 응대 대신 키보드를 봄
- 평가 항목(VAS·ROM·MMT) 누락 잦음
- 이전 기록 참조 어려워 동일 환자 반복 환자 작성 시 비효율
- ICF 같은 전인적 평가 모형이 차트 안에 들어오지 못함

### 임상가가 실제 쓰는 것

- VAS (통증 0~10) — 매일
- ROM (각도) — 어깨·팔꿈치·손목·고관절·무릎·발목·허리·목
- MMT (근력 0~5)
- 신체계측 — 둘레·길이·부종
- 치료방법: 도수치료 · 전기 · 초음파 · 냉온 · 과제 훈련 · 운동치료
- 운동 컨셉: 근력증가 · 심폐지구력 · 근지구력 · 리커버리 · 균형-기능

이 5축이 MVP의 평가·치료 입력 구조 그대로.

---

## 3. AI 활용 깊이 (대회 핵심 가중치)

### 단순 분류가 아닌 임상 추론

Claude Sonnet 4.6을 호출해 환자 인풋을 WHO ICF 5도메인으로 분류 + 가설·근거·다음 단계까지 출력.

**5도메인:**
- **신체 기능** — 통증·근력·관절가동 등 신체 수준 기능
- **활동** — 일상생활 동작(ADL) 수행 능력
- **참여** — 사회·직업·여가 역할 복귀
- **환경** — 가족·직장·도구·접근성 등 외부 요인
- **개인** — 나이·성별·심리·동기·라이프스타일

**출력 형식:**
```ts
interface IcfAnalysisResult {
  domains: { body: string[], activity: string[], participation: string[],
             environment: string[], personal: string[] }
  redFlags?: string[]          // Cauda Equina·악성종양·비기계적 통증 등
  coverage: { hasGaps: boolean, missingOrWeak: string[] }
  followUpQuestion: string     // 다음에 물어볼 질문
  clinicalNote: string         // 가설+근거+다음 단계 요약
}
```

### RAG (Retrieval-Augmented Reasoning)

환자 기본정보 + 최근 평가 + 최근 치료를 markdown 직렬화해 시스템 프롬프트에 자동 첨부 — [src/features/icf/domain/patient-context.ts](./src/features/icf/domain/patient-context.ts).

→ AI가 "이 환자는 만성 요통 우울증 동반자" 같은 맥락을 별도 입력 없이 활용.

### 가드레일 (시스템 프롬프트 레벨)

- 진단 단정 금지 (`L1-XX` 같은 ICD 코드 자동 부여 안 함)
- ICF 코드(b730, d450 등) 자동 부여 금지
- 심리진단 단정 금지 — kinesiophobia 같은 가설 표현으로만
- PHI 마스킹 — 환자 이름·주민번호 노출 차단
- 자살사고 격리 라우트 — 별도 응급 안내로 빠짐

### 견고함 (Sonnet 4.6 호환성 우회)

- Sonnet 4.6은 **assistant message prefill 미지원** → `system prompt + balanced-brace 추출 + zod 검증` 패턴으로 우회
- 1회 자동 재시도
- credit / 401 / parse 실패 사용자 친화적 에러 분기
- 서버 env 키만 사용 (BYOK 미지원, 세션 체크 후 호출)

### 임상 글로서리 hover

AI 출력 안 의료 용어를 모르는 임상가도 정확히 읽도록 — [src/features/icf/components/GlossaryTerm.tsx](./src/features/icf/components/GlossaryTerm.tsx).

- 219줄 임상 용어 사전 — kinesiophobia, paresthesia, radiculopathy, PCS, RM, MET 등
- hover/tap 시 정의 popover
- 모바일 viewport 경계 충돌 자동 회피 (shiftX 계산)

---

## 4. 핵심 기능

### 환자 관리

- **등록**: 13개 필드 — 이름·생년월일·성별·연락처·주소·**내원경로**·**병력**·진단명·수술이력·보험·특이사항·치료시작일·담당치료사
- **리스트**: 카드 (이름 + 진단명 + 마지막 치료일) · 검색 · 상태 탭(치료 중/종결/전체) · 다중 선택
- **상태**: 신규 · 재입원 · 홀드 · 종결

### 치료기록

**입력 흐름:**
1. **부위 선택** (다중, anatomical position 순서: 목 → 상지 → 척추/엉덩 → 무릎 → 발목 → 발가락)
   - 부위별 근육 검색·선택 (Combobox, 한글+영문 학명 병기)
2. **방법 선택** (다중): 도수·전기·초음파·냉온·과제 훈련·운동치료
   - **운동치료 선택 시**: 컨셉 선택 → 운동 ➕ 다중 추가 → 세트·횟수·중량 메모 → 자주 쓰는 운동 즐겨찾기
3. **플래그** (다중 토글): 컨디션·통증·복약·운동순응도 등 임상 신호
4. **당일 코멘트**: 환자 반응·특이사항

**핵심 기능: 이전 기록 1클릭 복사** — `?copyFrom=<id>` 또는 `?copy=1`(최근 자동). 부위·방법·운동·플래그·코멘트 100% prefill. 5분 KPI의 핵심 메커니즘.

### 평가기록

**평가 항목 (다중 토글):**
- VAS (통증 0~10) — 기본 그래프 자동 표시
- ROM (관절 각도) — 주요 관절만
- MMT (근력 0~5)
- 신체계측 (둘레·길이·부종)
- **Custom 평가** (확장) — FMS·Berg·보행거리·Modified Ashworth 등 자유 추가

**그래프:**
- recharts 추이 그래프
- 치료사가 표시 항목 직접 선택, 환자별 저장 (`physiolog_graph_settings_{patientId}`)

### ICF AI 분석

- 자유 텍스트 또는 평가 히스토리 기반 분석 호출
- 5도메인 카드 + red flag 박스 + 임상 추론 요약 + 다음 follow-up 질문
- 결과는 환자별 누적 저장 (turn-based)

### 임상 산출물 PDF

- **환자 요약지** — 홈프로그램 + 이모지 + 이해하기 쉬운 톤
- **의뢰서[1]~[5]** — 환자정보 · 임상평가 · 치료경과 · ICF · 서명
- 브라우저 단독 출력 (외부 PDF 라이브러리 X, @media print CSS + Server Component prefetch)

---

## 5. 화면·라우트

| 라우트 | 목적 |
|---|---|
| `/` | 환자 리스트 |
| `/login` · `/signup` | 인증 |
| `/patients/new` · `/patients/[id]/edit` | 등록·편집 |
| `/patients/[id]` | 환자 정보 (탭: 기본정보 / 치료 / 검사 / 평가) |
| `/patients/[id]/treatments/new` · `/patients/[id]/treatments/[id]/edit` | 치료 작성·편집 (1클릭 복사 지원) |
| `/patients/[id]/evaluations/new` · `/patients/[id]/evaluations/[id]/edit` | 평가 입력·편집 |
| `/patients/[id]/icf/new` | ICF AI 분석 |
| `/patients/[id]/print` | A4 차트 출력 |
| `/profile` | 사용자 프로필 |
| `/statistics` | 통계 (Phase 1 베타) |
| `/migration` | localStorage → Supabase 안전 이사 |
| `/seed` | 시연용 환자 시드 |
| `/api/icf/analyze` | Claude 호출 API |

---

## 6. 데이터 모델

### Patient ([src/features/patients/domain/types.ts](./src/features/patients/domain/types.ts))
```ts
type Patient = {
  id: string                    // uuid
  name: string
  birthDate: string             // ISO yyyy-mm-dd
  gender: 'male' | 'female'
  phone: string
  address: string
  referralRoute: string         // 내원(의뢰)경로
  medicalHistory: string[]      // 병력 카테고리 다중
  otherMedicalHistory?: string  // 기타 과거력 자유 텍스트
  diagnosis: string
  surgeryHistory?: string
  insurance: 'health' | 'industrial' | 'auto' | 'private' | 'medical' | 'self'
  notes?: string
  treatmentStartDate: string
  therapist: string
  status: 'new' | 'readmit' | 'hold' | 'discharged'
  createdAt: string
  updatedAt: string
}
```

### Treatment ([src/features/treatments/domain/types.ts](./src/features/treatments/domain/types.ts))
```ts
type Treatment = {
  id: string
  patientId: string
  date: string
  bodyParts: BodyPart[]         // 다중
  methods: TreatmentMethod[]    // 도수/전기/초음파/냉온/과제훈련/운동치료
  exerciseConcept?: ExerciseConcept
  exercises?: Exercise[]
  flags?: TreatmentFlag[]       // 임상 신호 다중 토글
  comment?: string
  createdAt: string
}
```

### Evaluation ([src/features/evaluations/domain/types.ts](./src/features/evaluations/domain/types.ts))
```ts
type Evaluation = {
  id: string
  patientId: string
  date: string
  vas?: number
  rom?: ROMRecord[]
  mmt?: MMTRecord[]
  bodyMeasurement?: BodyMeasurement[]
  custom?: CustomEval[]         // FMS·Berg 등 확장
  createdAt: string
}
```

### IcfAnalysis ([src/features/icf/domain/types.ts](./src/features/icf/domain/types.ts))
```ts
type IcfAssessment = {
  id: string
  patientId: string
  date: string
  turns: IcfTurn[]              // 누적 turn-based
  finalDomains: IcfDomains      // 5도메인 통합 결과
  finalNote: string
  createdAt: string
}
```

---

## 7. 디자인·UX 결정

### 모바일 우선

- 병원에서 한손 조작 + 환자 옆에서 카트 위에 폰 두고 작성
- 치료기록 입력은 vaul 바텀시트로 단계별
- 토스트는 sonner — "저장됨" / "삭제됨"
- 화면 폭 max-w-2xl 기본, 데스크톱(lg:)에서 환자 리스트 max-w-5xl 2열 그리드

### shadcn Nova preset

- Lucide + Geist 폰트 기본
- 라이트 톤 파스텔 카드 색 (도메인별 빨강·파랑·초록·보라·호박)
- framer-motion 부드러운 인터랙션

### 임상 미세 디테일

- 근육명에 한글 + 영문 학명 (`극상근 (Supraspinatus)`)
- 부위 선택 순서: anatomical position (목→발가락)
- VAS 그래프 default ON
- AI 출력 의료 용어에 dotted underline + glossary popover

---

## 8. 기술 아키텍처

### Stack

- **프레임워크**: Next.js 16.2 (App Router · Server Components · webpack 빌드)
- **언어**: TypeScript 엄격(`any` 금지)
- **스타일링**: Tailwind 4 (CSS-first) · shadcn/ui Nova · framer-motion · vaul · sonner
- **폼·검증**: react-hook-form + zod
- **인증·DB**: Supabase Auth + Postgres (RLS) · @supabase/ssr · @supabase/supabase-js
- **AI**: @anthropic-ai/sdk (Claude Sonnet 4.6)
- **차트·시각화**: recharts · react-muscle-highlighter
- **PWA**: @serwist/next

### 데이터 흐름

```
[Client UI]
   │
   ├── localStorage 래퍼 (lib/storage/, 매직 스트링 금지)
   │       └── Phase 1 초기 캐시 / 오프라인 폴백
   │
   ├── Supabase Client (@supabase/ssr)
   │       ├── Auth (이메일·비번 + 카카오 OAuth via signInWithOAuth)
   │       ├── /auth/callback — exchangeCodeForSession 후 세션 발급
   │       ├── Patient · Treatment · Evaluation · IcfAssessment 테이블
   │       └── RLS — 자기 데이터만 read/write
   │
   └── /api/icf/analyze (Server Component)
           ├── 세션 체크
           ├── env에서 ANTHROPIC_API_KEY 로드 (서버 사이드만)
           ├── patient-context.ts로 RAG 컨텍스트 markdown 직렬화
           ├── icf-system-prompt.ts (162줄) + 환자 컨텍스트 합쳐 system message 구성
           ├── Claude 호출 → balanced-brace 추출 → zod 검증 → 실패 시 1회 재시도
           └── IcfAnalysisResult 반환
```

### 보안

- ANTHROPIC_API_KEY 서버 env만 (BYOK 미지원)
- Supabase RLS — 모든 테이블에 `auth.uid() = user_id` 정책
- 세션 체크 후에만 ICF API 호출 허용
- AuthGuard로 보호되는 페이지: `/`, `/patients/*`, `/statistics`, `/profile`
- OAuth 흐름 — 카카오 Client Secret은 Supabase Dashboard에만 저장(클라이언트 노출 X), `/auth/callback`에서 code↔session 교환 후 httpOnly 쿠키
- OAuth 자동 identity linking 비활성 (Supabase 기본) — 같은 이메일도 별개 user 인식, identity 탈취 방지

---

## 9. 비기능 요구사항

| 항목 | 기준 |
|---|---|
| 환자 1인 차팅 시간 | **5분 이내** (이전 기록 1클릭 복사 활용 시) |
| 환자 리스트 로드 | 1초 이내 (50명 기준) |
| ICF AI 분석 응답 | 평균 3~6초 (Sonnet 4.6 latency 기준) |
| 폼 검증 | zod, 필수 필드 누락 시 저장 불가 |
| 모바일 UX | 한손 조작, 바텀시트 입력, FAB ➕ |
| 오프라인 | PWA + Service Worker (병원 와이파이 대비) |
| 데이터 보존 | Supabase (인증 사용자별 격리) + localStorage 캐시 |

---

## 10. 의사결정 트레이드오프

| 결정 | 대안 | 선택 근거 |
|---|---|---|
| **Supabase 단일 백엔드** | Firebase / 자체 백엔드 | RLS로 인증·인가 일원화, 마이그레이션 SQL 한 파일로 관리 |
| **localStorage → Supabase 마이그레이션 UI** | 직접 SQL 작업 | 친구·다른 임상가가 자기 데이터 손실 없이 이사 가능 |
| **AI는 ICF 한 영역 깊이** | 음성 입력·요약·자동 코딩 등 분산 | "한 영역에서 임상 추론까지" 차별화 / 학부 작품 흔한 기능 과적합 회피 |
| **임상 글로서리 hover** | 별도 사전 페이지 | AI 출력 위에서 즉시 사용. 비전문가 임상가에게 학습 부담 X |
| **PDF는 브라우저 단독** | jsPDF / 외부 PDF SaaS | @media print + Server Component prefetch로 충분. 번들 사이즈·외부 의존성 X |
| **시드 환자 10명 고정 fixture** | random 자동생성 | 평가·시연·재현성 baseline. 진단군 9종 다양화로 ICF 분석 다각 검증 |
| **assistant prefill 우회** | Sonnet 3.5 / Haiku로 다운그레이드 | Sonnet 4.6의 임상 추론 깊이가 필요. balanced-brace 파서로 안정화 |
| **카카오 OAuth + 이메일 병행** | 카카오 단일 / 이메일 단일 | 친구·일반 사용자 양쪽 친근. 한국 사용자 대다수 카카오 친근, 일부는 이메일 선호. 별개 user 분리는 Supabase 기본(자동 linking은 보안 위험) |
| **비즈 앱 전환 (개인 개발자 본인인증)** | 사업자번호 받기 / 카카오 로그인 포기 | 카카오 개인 개발자는 `account_email` "권한 없음"이라 KOE205. 본인인증·약관 동의만으로 비즈 앱 전환 가능 → 사업자번호 없이 이메일 동의 활성화 |
| **시계열 컨텍스트 N=8 단순 cut** | 전체 / N=5 / intelligent 샘플링(first+mid+latest) | 8주분 추세 충분 + 만성 환자도 토큰 무리 없음. intelligent 샘플링은 over-engineering |

---

## 11. Phase 1 완료 / Phase 2 후보

### Phase 1 (완료, 인계 직전)

- 환자 CRUD + 리스트 + 검색 + 상태 분류
- 치료기록 (부위·방법·운동·플래그·코멘트·1클릭 복사)
- 평가기록 (VAS/ROM/MMT/신체계측·Custom·그래프)
- ICF AI 분석 (5도메인 + red flag + RAG + **시계열 추이 cross-reference** + 글로서리)
- PDF 출력 (요약지 + 의뢰서 + **VAS SVG 그래프 임베딩**)
- Supabase Auth (이메일·비번 + **카카오 OAuth** 병행) + DB + RLS
- localStorage → Supabase 마이그레이션 UI
- 환자 **카카오톡 공유** (Web Share API + 클립보드 폴백, 운동 강도·homework 통합)
- 모바일 PDF 가로 스크롤 fix
- PWA (오프라인 대응)
- 풀 시드 10명 + 쇼케이스 환자 2명
- **Vitest 단위 테스트 60+ 건** (도메인 함수·storage·ICF schema·시계열 추출·공유 메시지)

### Phase 2 후보 (실사용 피드백 기반 우선순위)

| 기능 | 예상 가치 | 비고 |
|---|---|---|
| 음성 입력 (STT) | 高 | Web Speech API. 핸즈프리 차팅 — 5분 KPI 직격 |
| Kakao SDK 카드 메시지 | 中 | 썸네일+버튼 카드 카톡. 비즈 앱 전환 완료라 즉시 가능 |
| 카카오 닉네임 자동 fallback | 中 | 카카오 가입자 profile.name 자동 표시 |
| OAuth identity 수동 linking | 中 | 같은 이메일 이중 가입 시 데이터 통합 |
| 공개 share URL + 만료 토큰 | 中 | PDF 직접 첨부 카톡. 보안 검토 필수 |
| E2E Playwright 자동화 | 中 | Vitest 단위만 깔림. UI 컴포넌트 + flow 테스트 |
| 팀 공유·권한 관리 | 中~低 | 다중 사용자 도입 후 |
| PWA Service Worker update 알림 | 低 | 친구가 prod 갱신 인지 |

### 영구 제외 (의료법·범위)

- 처방전·진단서 생성 (의사 면허 영역)
- 보험 청구·EDI (행정 영역)
- 직접 진단·치료 결정 (AI 가드레일)

---

## 12. 개발 프로세스

- **4단 문서**: `docs/specs/` (설계) · `docs/plans/` (sprint) · `docs/migrations/` (DB) · `docs/evaluations/` (평가)
- **Sprint 단위**: sprint1 (인증·마이그) · sprint2 (ICF 완성) · sprint3 (BodyMap·VAS) · MVP 폴리시
- **AI 심사관 사전 평가**: 9.18 / 10 (A+) 받은 후 12 commit 평가 보완 — red flag·zod·PDF·풀 시드·글로서리·데스크톱 max-width
- **친구 인계 sanity check**: 풀 시드 → 평가 흐름 → PDF 다운로드까지 prod 검증

---

## 13. 코드 규칙

- 파일 200줄 이내 권장
- `any` 금지
- 매직 스트링 금지 → `lib/storage/` 상수 사용
- localStorage 직접 접근 금지 → 항상 래퍼 경유
- 모든 폼은 react-hook-form + zod 검증
- UI 변경은 Playwright 캡처 + 사용자 직접 확인 후 진행 (자세한 룰: [CLAUDE.md](./CLAUDE.md))

---

## 참고

- **친구 원본 PRD**: `docs/PhysioLog_PRD_v1.6.docx` (22주 풀버전)
- **AI 평가 보고서**: [docs/evaluations/2026-05-14-ai-judge-evaluation.md](./docs/evaluations/2026-05-14-ai-judge-evaluation.md)
- **DB 마이그레이션**: [docs/migrations/schema.sql](./docs/migrations/schema.sql) — 통합 멱등 스키마(여러 번 실행해도 안전)
- **프로젝트 컨벤션**: [CLAUDE.md](./CLAUDE.md) · [AGENTS.md](./AGENTS.md)
