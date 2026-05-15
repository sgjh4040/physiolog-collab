'use client'

import { Fragment, useMemo } from 'react'
import { GLOSSARY_MATCHES } from '@/features/icf/data/clinical-glossary'
import { GlossaryTerm } from './GlossaryTerm'

interface Props {
  text: string
  /** 선택적 추가 클래스 */
  className?: string
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 영문 alias는 단어 경계가 의미 있으므로 \b로 감싸고,
 * 한글 alias는 \b가 무력하므로 그대로 매칭한다.
 * (한글은 word character 정의 밖이라 \b 위치가 모든 한글-비한글 경계에서 발생 → 사실상 raw match와 동일.)
 */
function buildPattern(): RegExp {
  const parts = GLOSSARY_MATCHES.map(({ alias }) => {
    const escaped = escapeRegex(alias)
    const isAscii = /^[\x00-\x7f]+$/.test(alias)
    return isAscii ? `\\b${escaped}\\b` : escaped
  })
  return new RegExp(`(${parts.join('|')})`, 'gi')
}

interface Segment {
  kind: 'text' | 'term'
  value: string
  match?: typeof GLOSSARY_MATCHES[number]
}

function splitText(text: string, pattern: RegExp): Segment[] {
  const segments: Segment[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null
  pattern.lastIndex = 0
  while ((m = pattern.exec(text)) !== null) {
    const start = m.index
    const end = start + m[0].length
    if (start > lastIndex) {
      segments.push({ kind: 'text', value: text.slice(lastIndex, start) })
    }
    const matchedAlias = m[0]
    const found = GLOSSARY_MATCHES.find(
      (g) => g.alias.toLowerCase() === matchedAlias.toLowerCase(),
    )
    if (found) {
      segments.push({ kind: 'term', value: matchedAlias, match: found })
    } else {
      // fallback: 대소문자 다른 매칭이 GLOSSARY_MATCHES에 없을 경우 (안전 차원)
      segments.push({ kind: 'text', value: matchedAlias })
    }
    lastIndex = end
  }
  if (lastIndex < text.length) {
    segments.push({ kind: 'text', value: text.slice(lastIndex) })
  }
  return segments
}

export function GlossaryText({ text, className }: Props) {
  const pattern = useMemo(buildPattern, [])
  const segments = useMemo(() => splitText(text, pattern), [text, pattern])

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.kind === 'term' && seg.match ? (
          <GlossaryTerm key={i} alias={seg.value} entry={seg.match.entry} />
        ) : (
          <Fragment key={i}>{seg.value}</Fragment>
        ),
      )}
    </span>
  )
}
