import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'

beforeEach(() => {
  // 각 테스트 시작 시 localStorage 클린 — readString/writeString 등 격리
  if (typeof window !== 'undefined') {
    window.localStorage.clear()
  }
})

afterEach(() => {
  if (typeof window !== 'undefined') {
    window.localStorage.clear()
  }
})
