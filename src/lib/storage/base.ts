// SSR-safe localStorage helpers.
// 직접 localStorage.getItem/setItem 호출 금지 — 항상 이 모듈 경유.

const isBrowser = () => typeof window !== 'undefined'

export function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON<T>(key: string, value: T): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    // QuotaExceededError 등
    console.error('[storage] write failed:', key, err)
  }
}

export function removeKey(key: string): void {
  if (!isBrowser()) return
  window.localStorage.removeItem(key)
}

/**
 * 평문 문자열 read/write — JSON 직렬화 없이 짧은 설정값(정렬 모드,
 * 저장된 이메일 등) 보관용. readJSON/writeJSON과 달리 quotes·escape
 * 처리 없음.
 */
export function readString(key: string, fallback: string): string {
  if (!isBrowser()) return fallback
  try {
    return window.localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export function writeString(key: string, value: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(key, value)
  } catch (err) {
    console.error('[storage] writeString failed:', key, err)
  }
}

export function newId(): string {
  if (isBrowser() && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // SSR fallback
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function nowISO(): string {
  return new Date().toISOString()
}
