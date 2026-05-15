'use client'

import { motion } from 'framer-motion'
import { DOMAIN_META, type IcfDomainKey } from '@/features/icf/domain/types'
import { GlossaryText } from './GlossaryText'

interface Props {
  domainKey: IcfDomainKey
  items: string[]
  index: number
}

export function IcfDomainCard({ domainKey, items, index }: Props) {
  const meta = DOMAIN_META[domainKey]
  const isEmpty = items.length === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className={`rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${meta.bg} ${meta.border}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>
          {meta.label}
        </p>
        <span className={`h-1.5 w-1.5 rounded-full ${meta.color.replace('text-', 'bg-')}`} />
      </div>

      {isEmpty ? (
        <p className="text-[11px] text-muted-foreground/60 italic">정보 미확인</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-foreground/90 leading-tight">
              <span className="mt-1 text-[10px] opacity-40">•</span>
              <GlossaryText text={item} />
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
