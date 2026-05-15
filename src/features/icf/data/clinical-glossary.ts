/**
 * ICF AI 출력에 자주 등장하는 임상 용어 사전.
 * 비전공자 심사위원·환자 본인에게 hover 한 줄로 의미 전달 목적.
 *
 * 매칭 규칙:
 * - 영문 학명(소문자) → 단어 경계(\b) + 대소문자 무시
 * - 한글 표기 → 한글 단어 그대로 match (단어 경계 없음, 한국어 형태소 변경 없는 부분만)
 * - aliases[]는 같은 정의를 가리키는 별칭 (예: "Spurling test" / "Spurling 검사")
 *
 * 긴 alias가 짧은 alias의 prefix이면 긴 것 우선 매칭 (Modified Ashworth > Modified).
 */

export interface GlossaryEntry {
  /** 정의 키 (영문 소문자 표준) */
  key: string
  /** 매칭할 표현들 (영문/한글, 학명/축약형) */
  aliases: string[]
  /** 한 줄 설명 (한국어, 50~90자 권장) */
  definition: string
}

export const CLINICAL_GLOSSARY: GlossaryEntry[] = [
  // 심리·행동
  {
    key: 'kinesiophobia',
    aliases: ['kinesiophobia', 'Kinesiophobia', '운동 공포증', '운동공포증', '재부상 공포'],
    definition: '운동·동작 시 통증 재발에 대한 과도한 두려움. 동작 회피로 이어져 만성 통증·기능 저하의 핵심 인자.',
  },
  {
    key: 'central-sensitization',
    aliases: ['central sensitization', '중추 감작', '중추감작'],
    definition: '중추신경계가 통증 자극에 과민해진 상태. 같은 자극에도 더 큰 통증이 발생.',
  },

  // 감각·신경
  {
    key: 'paresthesia',
    aliases: ['paresthesia', 'Paresthesia', '감각이상', '저림', '저림감', '찌릿함', '찌릿거림'],
    definition: '저림·찌릿함 같은 비정상 감각. 신경 압박·자극을 시사 (예: 디스크·CTS).',
  },
  {
    key: 'allodynia',
    aliases: ['allodynia', 'Allodynia', '이질통'],
    definition: '비통증 자극(가벼운 접촉 등)에도 통증이 발생하는 상태. 신경 감작의 신호.',
  },
  {
    key: 'hyperalgesia',
    aliases: ['hyperalgesia', 'Hyperalgesia', '통각 과민'],
    definition: '통증 자극에 과민하게 반응. 일반적으로 중추 감작과 연관.',
  },
  {
    key: 'radiculopathy',
    aliases: ['radiculopathy', 'Radiculopathy', '신경근병증', '신경근 병증'],
    definition: '척추 신경근이 압박·자극된 상태. 방사통·저림·근력 약화 동반 (디스크·협착증).',
  },
  {
    key: 'myelopathy',
    aliases: ['myelopathy', 'Myelopathy', '척수병증', '척수 병증'],
    definition: '척수 자체가 손상된 상태. 진행성 보행 장애·균형 이상으로 신경외과 협진 필요.',
  },
  {
    key: 'claudication',
    aliases: ['claudication', 'Claudication', '보행성 파행', '신경성 파행'],
    definition: '걸으면 다리 통증·저림이 나타나고 쉬면 호전. 척추관 협착증의 대표 증상.',
  },
  {
    key: 'cauda-equina',
    aliases: ['Cauda Equina', 'cauda equina', '마미증후군', '마미 증후군'],
    definition: '안장 마비·요실금·양측 하지 약화를 동반하는 응급 신경 손상. 즉시 의사 평가 필요.',
  },
  {
    key: 'foot-drop',
    aliases: ['foot drop', 'Foot Drop', 'foot-drop', '족하수', '발 처짐'],
    definition: '발등을 들어올리지 못해 발끝이 처지는 상태. L5 신경근·총비골신경 손상에서 나타남.',
  },

  // 임상 검사
  {
    key: 'spurling',
    aliases: ['Spurling test', 'spurling test', 'Spurling 검사'],
    definition: '경추를 측굴·압박해 신경근 압박을 유도하는 검사. 방사통 재현 시 양성.',
  },
  {
    key: 'ultt',
    aliases: ['ULTT', 'Upper Limb Tension Test'],
    definition: '상지 신경(정중·요골·척골)의 활주성을 평가하는 신경동원술 검사.',
  },
  {
    key: 'slr',
    aliases: ['SLR', 'Straight Leg Raise', '하지직거상검사'],
    definition: '하지직거상검사. 똑바로 누워 한쪽 다리를 들어올려 좌골신경 자극·디스크를 평가.',
  },

  // 치료 기법
  {
    key: 'ndt',
    aliases: ['NDT', 'Bobath', '보바스', 'Neurodevelopmental Treatment'],
    definition: '신경발달치료. 뇌졸중·뇌성마비 환자의 정상 움직임 패턴을 재학습시키는 접근법.',
  },
  {
    key: 'mckenzie',
    aliases: ['McKenzie', 'mckenzie', '맥켄지'],
    definition: '척추 통증의 방향성 선호를 평가해 자가 신전 운동으로 치료하는 기법. 디스크 보존적 치료에 활용.',
  },
  {
    key: 'mulligan',
    aliases: ['Mulligan', 'mulligan'],
    definition: '관절 동원(mobilization)에 능동 운동을 결합한 도수치료 기법. 통증성 가동 제한에 사용.',
  },
  {
    key: 'maitland',
    aliases: ['Maitland', 'maitland'],
    definition: '관절 가동술의 한 종류. 진폭·속도를 등급화(Grade I~IV)해 통증·강직에 맞춰 적용.',
  },
  {
    key: 'met',
    aliases: ['MET', 'Muscle Energy Technique', '근에너지기법'],
    definition: '환자의 등척성 수축 후 이완을 이용해 가동범위를 늘리는 기법.',
  },
  {
    key: 'pnf',
    aliases: ['PNF', 'Proprioceptive Neuromuscular Facilitation', '고유감각 신경근 촉진법'],
    definition: '대각선·나선형 움직임 패턴으로 신경근 협응을 촉진하는 치료법.',
  },
  {
    key: 'pcs',
    aliases: ['PCS', 'Pain Catastrophizing Scale'],
    definition: '통증 파국화 척도. 통증에 대한 반추·확대해석·무력감을 13문항으로 평가. 만성 통증 예후 인자.',
  },

  // 운동 분류
  {
    key: 'okc-ckc',
    aliases: ['OKC/CKC', 'OKC', 'CKC', 'Open Kinetic Chain', 'Closed Kinetic Chain'],
    definition: '운동사슬 분류. OKC=발/손이 자유롭게(레그 익스텐션), CKC=고정된 상태(스쿼트). 안정성·기능에 따라 선택.',
  },
  {
    key: 'eccentric',
    aliases: ['eccentric', 'Eccentric', '신장성 수축', '편심성 수축'],
    definition: '근육이 길어지면서 힘을 발휘하는 수축 (계단 내려갈 때 대퇴사두근). 건병증 재활의 핵심.',
  },
  {
    key: 'concentric',
    aliases: ['concentric', 'Concentric', '단축성 수축'],
    definition: '근육이 짧아지면서 힘을 발휘하는 일반적 수축 (이두근 컬 올릴 때).',
  },
  {
    key: 'isometric',
    aliases: ['isometric', 'Isometric', '등척성 수축'],
    definition: '길이 변화 없이 힘만 발휘하는 수축 (플랭크). 통증 급성기·재활 초기에 안전.',
  },
  {
    key: 'proprioception',
    aliases: ['proprioception', 'Proprioception', '고유감각', '위치 감각'],
    definition: '눈을 감고도 관절·신체의 위치를 인지하는 감각. 발목 염좌·균형 재활 핵심.',
  },

  // 평가 도구
  {
    key: 'mmt',
    aliases: ['MMT', 'Manual Muscle Test', '도수 근력 검사', '도수근력검사'],
    definition: '도수 근력 검사. 0(전혀 수축 안 됨) ~ 5(정상)의 6단계로 근력을 등급화.',
  },
  {
    key: 'vas',
    aliases: ['VAS', 'Visual Analog Scale', '시각 통증 척도'],
    definition: '0~10 점으로 표시하는 통증 강도 척도 (0=무통, 10=최악).',
  },
  {
    key: 'rom',
    aliases: ['ROM', 'Range of Motion', '가동 범위', '가동범위'],
    definition: '관절이 움직일 수 있는 각도 범위. 능동(AROM)·수동(PROM)으로 구분.',
  },
  {
    key: 'modified-ashworth',
    aliases: ['Modified Ashworth', 'modified ashworth', 'Modified Ashworth Scale', 'MAS'],
    definition: '근경직(spasticity) 등급 척도 (0~4). 뇌졸중·뇌성마비 환자의 근긴장도를 정량화.',
  },
  {
    key: 'berg',
    aliases: ['Berg Balance Scale', 'Berg 척도', 'Berg 균형 척도', 'BBS'],
    definition: '14항목 균형 척도 (총 56점). 낙상 위험 평가에 사용 (45점 미만이면 위험).',
  },
  {
    key: 'adl-iadl',
    aliases: ['ADL', 'IADL', '일상생활동작', '도구적 일상생활동작'],
    definition: 'ADL=식사·옷입기 등 기본 동작, IADL=쇼핑·돈관리 등 도구적 동작. 사회 참여 평가 지표.',
  },

  // 해부·병태
  {
    key: 'trigger-point',
    aliases: ['Trigger Point', 'trigger point', '통증 유발점', 'TrP'],
    definition: '근막에 생긴 과민한 결절. 압통과 함께 연관통(referred pain)을 일으킴.',
  },
  {
    key: 'fascia',
    aliases: ['fascia', 'Fascia', '근막'],
    definition: '근육·장기를 감싸는 결합조직 막. 만성 통증·움직임 제한의 흔한 원인.',
  },
  {
    key: 'impingement',
    aliases: ['impingement', 'Impingement', '충돌증후군'],
    definition: '관절 안 구조물(힘줄·점액낭)이 뼈 사이에 끼이며 발생하는 통증 (어깨충돌증후군 대표).',
  },
]

/**
 * 매칭 우선순위: 긴 alias 우선 (예: "Modified Ashworth" > "Modified").
 * 모든 alias를 (entry, alias) pair로 펼치고 길이 desc 정렬.
 */
export interface GlossaryMatch {
  alias: string
  entry: GlossaryEntry
}

export const GLOSSARY_MATCHES: GlossaryMatch[] = CLINICAL_GLOSSARY.flatMap((entry) =>
  entry.aliases.map((alias) => ({ alias, entry })),
).sort((a, b) => b.alias.length - a.alias.length)
