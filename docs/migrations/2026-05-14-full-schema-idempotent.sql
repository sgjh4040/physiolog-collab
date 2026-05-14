-- =============================================================================
-- physiolog 통합 멱등 스키마 (2026-05-14)
-- =============================================================================
-- 친구나 새 Supabase 환경에 통째로 붙여넣고 Run 1회면 끝.
-- 이미 있는 테이블/컬럼/정책은 자동으로 skip되니까 여러 번 실행해도 안전.
--
-- 적용 방법:
--   1. Supabase Dashboard → 좌측 SQL Editor → New query
--   2. 이 파일 통째로 복사해 붙여넣기
--   3. 우측 상단 Run (또는 Cmd+Enter)
--   4. 마지막 section의 검증 SELECT 결과 확인
--
-- 핵심:
--   - 모든 CREATE TABLE은 IF NOT EXISTS
--   - 분기 이후 추가된 컬럼들(method_details, status, medical_history 등)은
--     ALTER ADD COLUMN IF NOT EXISTS로 따로 보강
--   - 정책은 DROP IF EXISTS + CREATE 패턴 (PostgreSQL이 CREATE POLICY IF NOT EXISTS 미지원)
--   - 함수는 CREATE OR REPLACE, 트리거는 DROP IF EXISTS + CREATE
-- =============================================================================


-- ============================================================================
-- 1. profiles (사용자 정보) + 회원가입 자동 트리거
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  email text,
  name text,
  role text,
  workplace text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile." ON public.profiles;
CREATE POLICY "Users can view own profile." ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile." ON public.profiles;
CREATE POLICY "Users can insert own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 회원가입 시 자동 profile row 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 트리거 이전에 가입한 기존 계정 backfill (있어도 안전)
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);


-- ============================================================================
-- 2. patients (환자)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  birth_date date,
  gender text,
  phone text,
  address text,
  referral_route text,
  medical_history jsonb,
  other_medical_history text,
  diagnosis text,
  surgery_history text,
  insurance text,
  notes text,
  treatment_start_date date,
  therapist text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 분기 후 추가된 컬럼들 보강 (옛 schema만 적용한 DB 케이스)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS referral_route text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medical_history jsonb;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS other_medical_history text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own patients." ON public.patients;
CREATE POLICY "Users can manage own patients." ON public.patients
  FOR ALL USING (auth.uid() = user_id);


-- ============================================================================
-- 3. treatments (치료 기록) — Sprint 3에서 method_details jsonb 추가
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  patient_id uuid REFERENCES public.patients ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  body_parts jsonb,
  methods jsonb,
  other_treatment_method text,
  method_details jsonb DEFAULT '{}'::jsonb,
  exercise_concept text,
  exercises jsonb,
  homework text,
  comment text,
  flags jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sprint 3 핵심 컬럼: 치료방법별 상세 메모 (도수치료/초음파/기타 메모)
ALTER TABLE public.treatments
  ADD COLUMN IF NOT EXISTS method_details jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own treatments." ON public.treatments;
CREATE POLICY "Users can manage own treatments." ON public.treatments
  FOR ALL USING (auth.uid() = user_id);


-- ============================================================================
-- 4. evaluations (평가 기록)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  patient_id uuid REFERENCES public.patients ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  vas numeric,
  rom jsonb,
  mmt jsonb,
  body_measurement jsonb,
  pain_mapping jsonb,
  custom jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 분기 후 추가된 평가 데이터 컬럼 보강
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS pain_mapping jsonb;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS custom jsonb;

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own evaluations." ON public.evaluations;
CREATE POLICY "Users can manage own evaluations." ON public.evaluations
  FOR ALL USING (auth.uid() = user_id);


-- ============================================================================
-- 5. icf_assessments (ICF 종합 평가)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.icf_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  patient_id uuid REFERENCES public.patients ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  turns jsonb,
  final_domains jsonb,
  final_note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.icf_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own icf assessments." ON public.icf_assessments;
CREATE POLICY "Users can manage own icf assessments." ON public.icf_assessments
  FOR ALL USING (auth.uid() = user_id);


-- ============================================================================
-- 6. 검증 (Run 후 아래 SELECT들 한 줄씩 풀어서 실행해보면 됨)
-- ============================================================================

-- 6-1. 모든 테이블 존재 확인 (정상: 5 rows — profiles/patients/treatments/evaluations/icf_assessments)
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('profiles','patients','treatments','evaluations','icf_assessments')
-- ORDER BY table_name;

-- 6-2. Sprint 3 method_details 컬럼 확인 (정상: 1 row, data_type = jsonb)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'treatments' AND column_name = 'method_details';

-- 6-3. RLS 정책 확인 (정상: 6 rows — profiles 3 + patients 1 + treatments 1 + evaluations 1 + icf_assessments 1)
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- 6-4. 트리거 확인 (정상: on_auth_user_created)
-- SELECT trigger_name, event_object_schema, event_object_table FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';
