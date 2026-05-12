import { useFormContext } from 'react-hook-form'
import { Badge } from '@/components/ui/badge'
import { Check, Plus, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { flagStore } from '@/lib/storage'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/confirm-dialog'
import type { TreatmentFormValues } from '@/features/treatments/domain/schema'

export function FlagSelector() {
  const { watch, setValue } = useFormContext<TreatmentFormValues>()
  const selectedFlags = watch('flags') ?? []
  const [availableFlags, setAvailableFlags] = useState<string[]>([])
  const [newFlagName, setNewFlagName] = useState('')
  const confirm = useConfirm()

  useEffect(() => {
    setAvailableFlags(flagStore.getFlags())
  }, [])

  const toggleFlag = (label: string) => {
    if (selectedFlags.includes(label)) {
      setValue('flags', selectedFlags.filter(f => f !== label), { shouldDirty: true })
    } else {
      setValue('flags', [...selectedFlags, label], { shouldDirty: true })
    }
  }

  const handleAdd = () => {
    const trimmed = newFlagName.trim()
    if (!trimmed) return
    if (availableFlags.includes(trimmed)) return
    
    flagStore.addFlag(trimmed)
    setAvailableFlags(flagStore.getFlags())
    setNewFlagName('')
  }

  const handleDelete = async (e: React.MouseEvent, flag: string) => {
    e.stopPropagation()
    const ok = await confirm({
      title: `'${flag}' 플래그를 삭제할까요?`,
      description: '저장된 플래그 목록에서 제거됩니다. 기존 치료기록에 이미 적용된 값은 그대로 유지됩니다.',
      confirmText: '삭제',
      variant: 'destructive',
    })
    if (!ok) return
    flagStore.deleteFlag(flag)
    setAvailableFlags(flagStore.getFlags())
    // 선택되어 있었다면 선택 해제
    if (selectedFlags.includes(flag)) {
      setValue('flags', selectedFlags.filter(f => f !== flag))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {availableFlags.map((flag) => {
          const isSelected = selectedFlags.includes(flag)
          return (
            <button
              key={flag}
              type="button"
              onClick={() => toggleFlag(flag)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all active:scale-95 ${
                isSelected 
                  ? `bg-primary/10 text-primary border-primary font-semibold` 
                  : 'bg-white text-muted-foreground border-slate-200 hover:border-slate-300'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5" />}
              {flag}
              {!isSelected && (
                <span
                  onClick={(e) => handleDelete(e, flag)}
                  className="ml-0.5 hover:text-destructive p-1 -m-1"
                  aria-label={`${flag} 플래그 삭제`}
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <Input 
          placeholder="새 플래그 추가 (예: 홈워크 완료)" 
          value={newFlagName}
          onChange={(e) => setNewFlagName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          className="h-8 text-xs"
        />
        <Button 
          type="button" 
          variant="secondary" 
          size="sm" 
          onClick={handleAdd}
          className="h-8 shrink-0 text-xs gap-1"
        >
          <Plus className="w-3 h-3" />추가
        </Button>
      </div>
    </div>
  )
}
