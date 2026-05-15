import { describe, it, expect } from 'vitest'
import {
  readJSON,
  writeJSON,
  removeKey,
  readString,
  writeString,
  newId,
} from '@/lib/storage/base'

describe('readJSON / writeJSON', () => {
  it('writeJSON 후 readJSON으로 같은 값 반환', () => {
    writeJSON('test_key', { name: '홍길동', age: 30 })
    expect(readJSON('test_key', null)).toEqual({ name: '홍길동', age: 30 })
  })

  it('없는 키는 fallback 반환', () => {
    expect(readJSON('missing', { default: true })).toEqual({ default: true })
  })

  it('손상된 JSON은 fallback 반환 (parse 실패)', () => {
    window.localStorage.setItem('corrupt', '{not-json')
    expect(readJSON('corrupt', { safe: true })).toEqual({ safe: true })
  })

  it('배열도 직렬화', () => {
    writeJSON('arr', [1, 2, 3])
    expect(readJSON<number[]>('arr', [])).toEqual([1, 2, 3])
  })
})

describe('readString / writeString', () => {
  it('평문 read/write — 따옴표 없이 그대로', () => {
    writeString('s', 'plain value')
    expect(readString('s', 'fallback')).toBe('plain value')
    expect(window.localStorage.getItem('s')).toBe('plain value')
  })

  it('없는 키는 fallback', () => {
    expect(readString('missing', 'default')).toBe('default')
  })

  it('빈 문자열도 정상 저장·읽기', () => {
    writeString('empty', '')
    expect(readString('empty', 'fallback')).toBe('')
  })
})

describe('removeKey', () => {
  it('write 후 remove하면 fallback 반환', () => {
    writeString('temp', 'value')
    removeKey('temp')
    expect(readString('temp', 'gone')).toBe('gone')
  })
})

describe('newId', () => {
  it('비어있지 않은 string 반환', () => {
    const id = newId()
    expect(id).toBeTypeOf('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('연속 호출 시 unique', () => {
    const a = newId()
    const b = newId()
    expect(a).not.toBe(b)
  })
})
