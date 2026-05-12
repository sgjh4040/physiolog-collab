@AGENTS.md

# physiolog

물리치료사·트레이너용 환자 차팅 앱. 1인당 기록 시간 10~20분 → **5분 이내**로 단축.

## ⚠️ 최우선 규칙
**모든 코드 작성 전 [PRD.md](./PRD.md) 먼저 확인.**
스코프 외 기능 추가 금지. 친구의 원본 PRD(`docs/PRD-original-v1.6.md`)는 22주 풀버전 — 우리는 MVP만.

## 사용자 정보
- 물리치료학과 학생, 시리얼 바이브코더
- 친구(물리치료사)에게 줘서 실사용 받는 게 목표 (1~2개월)
- 기존 프로젝트: rom-detector(ROM 측정), taping-master(AR 테이핑), posture-ai(자세 AI)
- 코드 경험: 보면서 이해 가능, 직접 짜기는 Claude Code 협업

## 기술 스택
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4 (CSS-first + 디자인 토큰)
- shadcn/ui (Nova preset, Radix)
- framer-motion (애니메이션)
- vaul (모바일 바텀시트)
- sonner (토스트)
- react-hook-form + zod (폼 검증)
- lucide-react (아이콘)
- recharts (평가 추이 그래프)
- @serwist/next (PWA)
- localStorage 기반 (서버 없음, Phase 2에서 Supabase 검토)

## 명령어
- `npm run dev` — 개발 서버
- `npm run build` — 빌드
- `npm run lint`

## 라우트 (App Router)
- `/` 환자 리스트 (검색 + FAB ➕)
- `/patients/new` 환자 등록
- `/patients/[id]` 환자 정보 페이지 (탭: 정보/치료기록/평가기록)
- `/patients/[id]/treatments/new` 치료기록 작성
- `/patients/[id]/evaluations/new` 평가기록 입력

## localStorage 키 (직접 접근 금지, `lib/storage/` 래퍼 사용)
- `physiolog_patients` — 환자 목록 (`Patient[]`)
- `physiolog_treatments_{patientId}` — 환자별 치료기록 (`Treatment[]`)
- `physiolog_evaluations_{patientId}` — 환자별 평가기록 (`Evaluation[]`)
- `physiolog_exercises_favorites` — 자주 쓰는 운동 (빈도순)
- `physiolog_graph_settings_{patientId}` — 환자별 그래프 표시 항목

## 결정된 기능 (MVP)

### 화면 1: 환자 리스트 `/`
- 카드 형태 (이름 + 진단명 + 마지막 치료일)
- 이름 검색창
- FAB ➕ (하단 플로팅) → 환자 등록

### 화면 2: 환자 정보 `/patients/[id]`
- 기본정보 11개 필드 (이름·생년월일·성별·연락처·주소·진단명·수술이력·보험·특이사항·치료시작일·담당치료사)
- 우상단 ✏️ 편집 버튼
- 탭: [기본정보] [치료기록] [평가기록]

### 화면 3: 치료기록 탭
- 카드 리스트 (날짜·치료부위·치료방법 / 코멘트 미리보기)
- 우상단 ➕ 작성
- **이전 기록 1클릭 복사** 지원 (PRD 핵심)

#### 치료기록 작성 흐름
1. **치료부위 선택** (다중, 위→아래 순서: 목 → 상지 → 척추/엉덩 → 무릎 → 발목 → 발가락)
   - 부위별 근육 검색·선택 (Combobox)
2. **치료방법 선택** (다중 체크박스)
   - 도수치료 / 전기 / 초음파 / 냉-온치료 / 과제 훈련 / 운동치료
   - 운동치료 선택 시 → 컨셉(근력·심폐·근지구력·리커버리·균형-기능) + 운동 ➕로 여러 개 추가
   - 운동 세트·횟수·중량은 메모로 한 번에 입력
   - 자주 쓰는 운동 즐겨찾기(빈도순)
3. **당일 코멘트** (환자 반응·특이사항)

### 화면 4: 평가기록 탭
- 상단: 추이 그래프 (치료사가 표시 항목 직접 선택, 기본 VAS 자동 표시)
- 하단: 날짜별 평가 결과 리스트
- 우상단 ➕ 평가 입력

#### 평가 입력 흐름
- 측정 항목 토글: VAS / ROM(주요 관절만) / MMT / 신체계측
- 그날 측정한 것만 ON
- "평가 항목 추가" 버튼 (FMS 등 나중에 확장)
- 그래프 항목 설정 가능

## MVP 스코프 외 (Phase 2 이후)
- 로그인/계정 (담당 치료사는 텍스트 필드)
- 인체 그림 SVG 클릭 (드롭다운으로 시작)
- AI 요약 (Claude API)
- 음성 입력 (STT)
- 클라우드 동기화 (Supabase)
- PDF/카카오톡 공유
- 팀 공유·권한 관리

## 폴더 구조 (Feature-Driven)
```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # 환자 리스트
│   ├── patients/
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx         # 환자 정보 (탭)
│   │       ├── treatments/new/page.tsx
│   │       └── evaluations/new/page.tsx
│   └── layout.tsx
├── features/
│   ├── patients/
│   │   ├── components/
│   │   ├── domain/              # 타입·인터페이스
│   │   └── data/                # localStorage 래퍼
│   ├── treatments/
│   │   ├── components/
│   │   ├── domain/
│   │   └── data/
│   └── evaluations/
│       ├── components/
│       ├── domain/
│       └── data/
├── components/ui/               # shadcn
├── lib/
│   ├── storage/                 # localStorage 래퍼 (직접 접근 금지)
│   └── utils.ts
└── data/                         # 정적 데이터 (근육 리스트, 관절 리스트 등)
    ├── muscles.ts               # 부위별 근육 매핑
    ├── joints.ts                # 주요 관절 (ROM 측정용)
    └── exercises.ts             # 운동 카테고리
```

## 디자인 시스템
- shadcn Nova preset (Lucide + Geist 폰트) 기본
- 모바일 우선 (병원에서 한손 조작)
- 치료기록 입력은 vaul 바텀시트로
- 토스트는 sonner ("저장됨", "삭제됨")

## 코드 규칙
- 파일 200줄 이내 권장
- `any` 금지
- 매직 스트링 금지 → `lib/storage/` 키 상수 사용
- 모든 폼은 react-hook-form + zod 검증
- localStorage 직접 접근 금지 → 항상 `lib/storage/` 래퍼 경유

## UI 작업 규칙

### "UI 수정"의 정의
페이지/컴포넌트 렌더 결과가 바뀌는 모든 변경 (CSS, JSX 구조, 레이아웃, 색상, 텍스트 등).
**로직/데이터/API만 변경되고 화면이 안 바뀌면 적용 안 함.**

### 필수 절차 (UI 수정에만 적용)
1. 코드 수정
2. Playwright MCP로 스크린샷 촬영 (규칙 아래)
3. 스크린샷 보여주고 승인 요청
4. 승인 후 다음 작업

**예외:** 사용자가 "쭉 진행" / "일괄" 등을 명시하면 중간 승인 생략하고 최종 결과만 한 번에 보고.

### 스크린샷 규칙
- **형식:** JPG (`type: "jpeg"`)
- **범위:**
  - 반응형 영향 있는 변경 → 데스크톱(1440x900) + 모바일(390x844) 둘 다
  - 한쪽만 영향 → 해당 뷰포트만
- **캡처 방식:** `fullPage: true` 우선. 타임아웃 나면 viewport 단위 여러 장.
- **파일명:** `screenshot_after_{작업명}.jpg` (예: `screenshot_after_login_button_color.jpg`)
- **저장 위치:**
  - 승인용(임시): 프로젝트 루트
  - 승인 후: `~/.claude/projects/-Users-jeonghunsakong-Projects-physiolog-collab/memory/screenshots/YYYY-MM-DD-주제/`
- 필요 시 작업 전에도 한 장 찍어 Before/After 비교

### Playwright MCP 운영 규칙
- 스크린샷 촬영 시 별도 허락 없이 실행 가능
- localhost:3000 접근 허용
- 작업 중간 상태는 묻지 말고 최종만 보고
- **dev 서버는 내가 직접 관리** (사용자 부담 X, rom-detector 스타일):
  1. 캡처 필요 → 서버 꺼져있으면 `npm run dev`를 background로 실행
  2. `curl http://localhost:3000`이 200 응답할 때까지 대기 후 캡처
  3. 캡처 끝나면 `pkill -f "next-server|next dev"`로 정리
- **검증 끝나면 즉시 정리:**
  1. `browser_close`로 탭 종료
  2. dev 서버 kill (위 3번)
  3. 잔존 프로세스 정리: `pkill -f "playwright-mcp|mcp-chrome"`
- **단, 사용자가 자기 터미널에서 이미 dev 서버 켜놨다면 그대로 사용 — 새로 안 켜고 kill도 안 함.** 켜져있나는 매번 `curl`로 확인.
- 사용자가 "유지해달라"고 명시하면 작업 후 dev 서버 그대로 둠

### 인증 필요한 페이지 캡처
- AuthGuard로 보호되는 모든 페이지(`/`, `/patients/*`, `/statistics`, `/profile`)는 로그인 상태 필요
- Playwright로 캡처 시 먼저 `/login`에서 로그인 흐름 자동화 후 진입
- 테스트 계정: 사용자가 dev Supabase에 만든 계정 사용 (별도 보관)

### 적용 예시
- "버튼 색깔 바꿔줘" → UI 수정 ✅ 스크린샷 필수
- "useState 로직 정리해줘" (화면 동일) → UI 수정 X, 스크린샷 생략
- "텍스트만 한 글자 바꿔줘" → UI 수정 ✅ 스크린샷 필수 (작아도 렌더 결과 바뀜)
- "타입 에러 수정" (런타임 동일) → UI 수정 X, 스크린샷 생략

## 작업 순서 (계획)
1. ✅ 프로젝트 셋업 (Next.js + shadcn/ui + 패키지)
2. 폴더 구조 + 타입 정의 (Patient, Treatment, Evaluation)
3. localStorage 래퍼 (`lib/storage/`)
4. 환자 리스트 + 등록 (화면 1)
5. 환자 정보 페이지 (화면 2)
6. 치료기록 (화면 3)
7. 평가기록 + 그래프 (화면 4)
8. PWA 설정 (@serwist/next)
9. 폰에서 테스트
