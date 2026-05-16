# physiolog

> 물리치료사·트레이너용 환자 차팅 앱. **ICF 임상 추론 보조 AI**와 한국어 의료 도메인 깊이를 결합한 MVP.

| | |
|---|---|
| **라이브 데모** | https://physiolog-collab.vercel.app |
| **핵심 KPI** | 1인당 환자 차팅 시간 10~20분 → **5분 이내** |
| **개발 규모** | 98 commit / 1681줄 풀 임상 시드 / 162줄 ICF 시스템 프롬프트 |
| **사전 평가** | AI 심사관 종합 **9.18 / 10 (A+)** — [상세](./docs/evaluations/2026-05-14-ai-judge-evaluation.md) |
| **상태** | 친구(실사용 물리치료사) 인계 직전 / Vercel prod READY |

---

## 무엇을 다르게 푸는가

WHO **ICF**(International Classification of Functioning) 통합이 단순 분류 라벨이 아니라 **제품 정체성**으로 자리잡은 차팅 앱.

- **ICF 5도메인 임상 추론** — Claude Sonnet 4.6이 신체기능·활동·참여·환경·개인 5도메인으로 환자를 분석. 단순 분류가 아닌 **가설+근거+다음 단계**까지 출력
- **임상 RAG** — 환자 기본정보 + 최근 평가 + 최근 치료를 markdown으로 직렬화해 시스템 프롬프트에 자동 첨부 (Retrieval-Augmented Reasoning)
- **Red Flag 자동 감지** — Cauda Equina·악성종양·비기계적 통증·체중감소·발열·안장감각 등 응급 신호를 별도 박스로 분리 출력
- **임상 글로서리 hover** — AI 출력 안 의료 용어(kinesiophobia·paresthesia·radiculopathy 등)에 hover/tap 시 정의 즉시 팝업. 모바일에서 viewport 경계 충돌 자동 회피
- **임상 산출물 PDF** — 환자 요약지(홈프로그램) + 의뢰서[1]~[5](정보·평가·경과·ICF·서명). 브라우저 단독 출력, 외부 PDF 라이브러리 없음
- **이전 기록 1클릭 복사** — 같은 환자 반복 치료 시 부위·방법·운동·플래그·코멘트 모두 prefill. 5분 KPI의 핵심 메커니즘
- **카카오 OAuth 로그인** — 이메일·비번 가입 + 카카오 OAuth 병행. Supabase `signInWithOAuth` + `/auth/callback` 흐름. 한국 사용자에게 가장 친근한 인증 경로 — 친구·임상 동료 인계가 카카오 한 번 누르기로 끝
- **환자 카톡 공유** — 환자 요약지 핵심(운동 강도 + homework + 주의사항)을 친근체 메시지로 자동 빌드. Web Share API + 클립보드 폴백. 폰에서 카톡으로 즉시 전송

---

## AI 활용 깊이

대회 핵심 가중치 영역. 평가자가 가장 먼저 살펴볼 곳.

| 구성 요소 | 위치 | 비고 |
|---|---|---|
| ICF 시스템 프롬프트 | [src/data/icf-system-prompt.ts](./src/data/icf-system-prompt.ts) | 162줄 |
| 환자 컨텍스트 직렬화 (RAG) | [src/features/icf/domain/patient-context.ts](./src/features/icf/domain/patient-context.ts) | 자동 첨부 |
| API 라우트 + 인증 게이트 | [src/app/api/icf/analyze/route.ts](./src/app/api/icf/analyze/route.ts) | 서버 사이드 키만 |
| zod + balanced-brace 파서 | [src/features/icf/domain/schema.ts](./src/features/icf/domain/schema.ts) | 1회 자동 재시도 |
| 임상 용어 사전 | [src/features/icf/data/clinical-glossary.ts](./src/features/icf/data/clinical-glossary.ts) | 219줄 |

**시스템 프롬프트 핵심:**
- ICF 도메인 정확 기준 (Health Condition vs Body Functions, 활동 vs 참여 등)
- 임상 사전 — ROM/MMT/VAS/PNF/ADL · NDT·Bobath·McKenzie·Mulligan·MET·Maitland · OKC/CKC · paresthesia/radiculopathy
- 한국식 환자 표현 매핑 11종 (예: "땡긴다" → tightness/spasm 후보)
- 가드레일 — 진단 단정 금지, ICF 코드 자동부여 금지, 심리진단 금지, PHI 마스킹, 자살사고 격리 라우트

**견고함:**
- Claude Sonnet 4.6의 assistant prefill 미지원을 system prompt + balanced-brace 추출 + zod 검증 패턴으로 우회
- 서버 env 키만 사용, BYOK 미지원, 세션 체크 후 호출 허용
- credit / 401 / parse 실패 등 사용자 친화적 에러 분기

---

## 핵심 화면

| 라우트 | 화면 | 비고 |
|---|---|---|
| `/login` · `/signup` | 인증 | 이메일·비번 + **카카오 OAuth** 병행. `/auth/callback` 공통 핸들러 |
| `/` | 환자 리스트 | 이름·진단명 검색, 상태 탭(치료 중/종결/전체), 다중 선택, FAB 등록 |
| `/patients/[id]` | 환자 정보 | 탭: 기본정보 / 치료 / 검사 / 평가 |
| `/patients/[id]/treatments/new` | 치료 작성 | 부위→방법→운동→코멘트. `?copyFrom=` 또는 `?copy=1`로 1클릭 복사 |
| `/patients/[id]/evaluations/new` | 평가 입력 | VAS/ROM/MMT/신체계측 토글, 그래프 항목 환자별 저장 |
| `/patients/[id]/icf/new` | ICF AI 분석 | Claude 호출, 5도메인 카드 + 임상 추론 요약 + red flag |
| `/patients/[id]/print` | 차트 출력 | A4 환자 요약지·의뢰서 + 카톡 공유 |
| `/seed` | 시연 시드 | [청소] [풀 시드 10명] [쇼케이스 환자 2명] 3카드 |
| `/migration` | 데이터 이사 | localStorage → Supabase 안전 마이그레이션 |

---

## 기술 스택

- **프레임워크**: Next.js 16.2 (App Router · Server Components) + React 19.2 + TypeScript
- **스타일링**: Tailwind CSS 4 (CSS-first) · shadcn/ui Nova preset · framer-motion · vaul(모바일 바텀시트) · sonner
- **폼·검증**: react-hook-form + zod
- **인증·DB**: Supabase Auth (이메일·비번 + **카카오 OAuth**) + Postgres (RLS) · @supabase/ssr · @supabase/supabase-js
- **AI**: @anthropic-ai/sdk (Claude Sonnet 4.6)
- **차트·시각화**: recharts · react-muscle-highlighter
- **PWA**: @serwist/next (오프라인 대응 — 병원 와이파이 불안정 대비)

---

## 개발 프로세스

- **PRD 압축 의사결정** — 친구(현직 물리치료사) 22주 풀버전 PRD를 MVP로 압축. 의사결정 흔적: [PRD.md](./PRD.md) + `docs/PhysioLog_PRD_v1.6.docx` 동시 비치
- **4단 문서 구조** — `docs/specs/` (설계) · `docs/plans/` (sprint 계획) · `docs/migrations/` (DB 스키마) · `docs/evaluations/` (평가)
- **평가 기반 보완 사이클** — 9.18 / 10 받은 후 보완 12 commit (red flag · zod 검증 · PDF · 풀 시드 · 글로서리 · 데스크톱 max-width)
- **임상 fixture 1681줄** — 진단군 9종 다양화(요통·HIVD·CTS·오십견 등), 4명은 ICF 풀 도메인까지 채움. 시연·평가 baseline

---

## 빠른 시작 (개발자·평가자)

```bash
git clone https://github.com/sgjh4040/physiolog-collab.git
cd physiolog-collab
npm install
# .env.local 생성:
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#   SUPABASE_SERVICE_ROLE_KEY=...      # 시드 액션용
#   ANTHROPIC_API_KEY=...              # ICF 분석용 (없어도 그 외 기능은 작동)
npm run dev
```

http://localhost:3000 접속.

**시연 흐름 (1분 안에 임상 깊이 체험):**
1. `/signup` → 이메일·비밀번호로 가입 (dev Supabase 자동)
2. `/seed` → **풀 시드 10명** 카드 클릭 → 환자 자동 생성 후 리스트로 이동
3. 송미라(만성 요통) 카드 클릭 → **평가** 탭 → 2026-05-13 항목 펼침 → ICF 5도메인 카드 + 글로서리 underline 확인
4. **치료** 탭 → "이전 기록 복사" → 5/13 선택 → 폼 100% prefill 확인
5. 우상단 ⋮ → "차트 출력" → 의뢰서/요약지 PDF

---

## 친구(물리치료사) 인계용 안내

비개발자(현직 물리치료사)가 실사용을 시작할 때 필요한 모든 절차는 별도 문서로 분리:
**[HANDOFF.md](./HANDOFF.md)** — 가입 · 첫 환자 등록 · 5분 차팅 흐름 · PWA 설치 · 자주 막히는 곳.

---

## 폴더 구조

```
src/
├── app/                    # Next.js App Router (라우트·페이지·API)
│   ├── api/icf/analyze/    # Claude 호출 + 인증 게이트
│   ├── patients/[id]/      # 정보·치료·평가·ICF·인쇄
│   ├── seed/               # 시연용 환자 시드
│   └── migration/          # localStorage → Supabase 이사
├── features/               # Feature-first 도메인 구조
│   ├── patients/           # 환자 CRUD + 리스트 + 상세
│   ├── treatments/         # 치료 기록 + 1클릭 복사
│   ├── evaluations/        # VAS/ROM/MMT/신체계측 + 그래프
│   ├── icf/                # AI 분석 + 5도메인 카드 + 글로서리
│   └── print/              # PDF 요약지·의뢰서
├── data/                   # 정적 데이터 (근육 라이브러리·시드·시스템 프롬프트)
├── lib/                    # storage 래퍼·supabase 클라이언트·utils
└── components/ui/          # shadcn primitives
```

---

## 문서·참고

- **현재 PRD**: [PRD.md](./PRD.md)
- **AI 평가 보고서**: [docs/evaluations/2026-05-14-ai-judge-evaluation.md](./docs/evaluations/2026-05-14-ai-judge-evaluation.md)
- **DB 마이그레이션**: [docs/migrations/schema.sql](./docs/migrations/schema.sql) — 통합 멱등 스키마(여러 번 실행해도 안전)
- **Sprint 설계·계획**: `docs/specs/` · `docs/plans/`
- **친구 원본 PRD**: `docs/PhysioLog_PRD_v1.6.docx` (22주 풀버전)
- **프로젝트 컨벤션·UI 작업 규칙**: [CLAUDE.md](./CLAUDE.md) · [AGENTS.md](./AGENTS.md)

피드백·버그·"이런 기능 있으면 좋겠다" 환영.
