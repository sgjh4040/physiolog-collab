'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { GlossaryEntry } from '@/features/icf/data/clinical-glossary'

interface Props {
  alias: string
  entry: GlossaryEntry
}

export function GlossaryTerm({ alias, entry }: Props) {
  const [open, setOpen] = useState(false)
  const [shiftX, setShiftX] = useState(0)
  const containerRef = useRef<HTMLSpanElement>(null)
  const popoverRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  // viewport 경계 충돌 회피: popover가 화면 밖으로 나가면 안쪽으로 shift.
  useEffect(() => {
    if (!open) {
      setShiftX(0)
      return
    }
    const el = popoverRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const margin = 8
    let shift = 0
    if (rect.left < margin) shift = margin - rect.left
    else if (rect.right > window.innerWidth - margin) shift = window.innerWidth - margin - rect.right
    if (shift !== 0) setShiftX(shift)
  }, [open])

  return (
    <span ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        aria-label={`${alias} 설명 보기`}
        className="cursor-help font-medium text-foreground underline decoration-dotted decoration-primary/60 decoration-1 underline-offset-2 transition-colors hover:text-primary focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {alias}
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            ref={popoverRef}
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            role="tooltip"
            style={{ transform: `translateX(calc(-50% + ${shiftX}px))` }}
            className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 w-60 sm:w-64 max-w-[calc(100vw-1rem)] rounded-md border bg-popover px-3 py-2 text-left text-xs leading-relaxed text-popover-foreground shadow-lg"
          >
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-primary">
              {entry.key.replace(/-/g, ' ')}
            </span>
            <span className="block text-foreground/90">{entry.definition}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
