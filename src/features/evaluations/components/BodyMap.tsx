'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import './BodyMap.css'
import type { PainPattern, PainArea } from '../domain/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const BODY_PARTS = [
  // 앞면 (Front View)
  { id: 'head', label: '머리', side: 'front', d: 'M50,5 C55,5 60,8 60,15 C60,22 56,28 50,30 C44,28 40,22 40,15 C40,8 45,5 50,5 Z' },
  { id: 'neck', label: '목', side: 'front', d: 'M44,28 C46,31 54,31 56,28 L57,35 C50,38 50,38 43,35 Z' },
  { id: 'shoulder_l', label: '왼쪽 어깨', side: 'front', d: 'M57,32 C65,32 75,35 80,45 L70,52 C65,45 60,38 57,35 Z' },
  { id: 'shoulder_r', label: '오른쪽 어깨', side: 'front', d: 'M43,32 C35,32 25,35 20,45 L30,52 C35,45 40,38 43,35 Z' },
  { id: 'chest', label: '가슴', side: 'front', d: 'M42,35 C45,35 55,35 58,35 L60,60 C50,62 50,62 40,60 Z' },
  { id: 'abdomen', label: '복부', side: 'front', d: 'M40,60 C45,60 55,60 60,60 L62,85 C50,88 50,88 38,85 Z' },
  { id: 'arm_up_l', label: '왼쪽 상완', side: 'front', d: 'M80,45 L88,70 L78,75 L70,52 Z' },
  { id: 'arm_up_r', label: '오른쪽 상완', side: 'front', d: 'M20,45 L12,70 L22,75 L30,52 Z' },
  { id: 'forearm_l', label: '왼쪽 하완', side: 'front', d: 'M88,70 L95,105 L85,110 L78,75 Z' },
  { id: 'forearm_r', label: '오른쪽 하완', side: 'front', d: 'M12,70 L5,105 L15,110 L22,75 Z' },
  { id: 'hand_l', label: '왼쪽 손', side: 'front', d: 'M95,105 C98,110 100,115 98,125 L88,125 C85,115 85,110 85,105 Z' },
  { id: 'hand_r', label: '오른쪽 손', side: 'front', d: 'M5,105 C2,110 0,115 2,125 L12,125 C15,115 15,110 15,105 Z' },
  { id: 'hip_l', label: '왼쪽 고관절', side: 'front', d: 'M50,85 L62,85 C68,95 68,100 65,110 L50,110 Z' },
  { id: 'hip_r', label: '오른쪽 고관절', side: 'front', d: 'M50,85 L38,85 C32,95 32,100 35,110 L50,110 Z' },
  { id: 'thigh_l', label: '왼쪽 허벅지', side: 'front', d: 'M50,110 L65,110 L72,145 L52,145 Z' },
  { id: 'thigh_r', label: '오른쪽 허벅지', side: 'front', d: 'M50,110 L35,110 L28,145 L48,145 Z' },
  { id: 'knee_l', label: '왼쪽 무릎', side: 'front', d: 'M52,145 L72,145 L70,158 L54,158 Z' },
  { id: 'knee_r', label: '오른쪽 무릎', side: 'front', d: 'M48,145 L28,145 L30,158 L46,158 Z' },
  { id: 'shin_l', label: '왼쪽 종아리', side: 'front', d: 'M54,158 L70,158 L75,190 L60,190 Z' },
  { id: 'shin_r', label: '오른쪽 종아리', side: 'front', d: 'M46,158 L30,158 L25,190 L40,190 Z' },
  { id: 'foot_l', label: '왼쪽 발', side: 'front', d: 'M60,190 L75,190 C78,195 80,198 78,205 L60,205 Z' },
  { id: 'foot_r', label: '오른쪽 발', side: 'front', d: 'M40,190 L25,190 C22,195 20,198 22,205 L40,205 Z' },

  // 뒷면 (Back View)
  { id: 'head_back', label: '머리(뒤)', side: 'back', d: 'M50,5 C55,5 60,8 60,15 C60,22 56,28 50,30 C44,28 40,22 40,15 C40,8 45,5 50,5 Z' },
  { id: 'neck_back', label: '목(뒤)', side: 'back', d: 'M44,28 C46,31 54,31 56,28 L57,35 C50,38 50,38 43,35 Z' },
  { id: 'back_up', label: '상부 등', side: 'back', d: 'M42,35 C50,32 50,32 58,35 L62,65 C50,68 50,68 38,65 Z' },
  { id: 'back_low', label: '하부 등/허리', side: 'back', d: 'M38,65 C50,68 50,68 62,65 L63,85 C50,88 50,88 37,85 Z' },
  { id: 'glute_l', label: '왼쪽 엉덩이', side: 'back', d: 'M50,85 L63,85 C70,95 70,105 65,115 L50,115 Z' },
  { id: 'glute_r', label: '오른쪽 엉덩이', side: 'back', d: 'M50,85 L37,85 C30,95 30,105 35,115 L50,115 Z' },
  { id: 'hamstring_l', label: '왼쪽 허벅지(뒤)', side: 'back', d: 'M50,115 L65,115 L72,150 L52,150 Z' },
  { id: 'hamstring_r', label: '오른쪽 허벅지(뒤)', side: 'back', d: 'M50,115 L35,115 L28,150 L48,150 Z' },
  { id: 'calf_l', label: '왼쪽 종아리(뒤)', side: 'back', d: 'M52,160 L70,160 L75,192 L60,192 Z' },
  { id: 'calf_r', label: '오른쪽 종아리(뒤)', side: 'back', d: 'M48,160 L30,160 L25,192 L40,192 Z' },
  // 뒷면 팔 (앞면 좌표 동일 — 의료영상 관행상 환자 좌/우 = 화면 우/좌, 뒤집기 X)
  { id: 'arm_up_l_back', label: '왼쪽 상완(뒤)', side: 'back', d: 'M80,45 L88,70 L78,75 L70,52 Z' },
  { id: 'arm_up_r_back', label: '오른쪽 상완(뒤)', side: 'back', d: 'M20,45 L12,70 L22,75 L30,52 Z' },
  { id: 'forearm_l_back', label: '왼쪽 하완(뒤)', side: 'back', d: 'M88,70 L95,105 L85,110 L78,75 Z' },
  { id: 'forearm_r_back', label: '오른쪽 하완(뒤)', side: 'back', d: 'M12,70 L5,105 L15,110 L22,75 Z' },
  { id: 'hand_l_back', label: '왼쪽 손(뒤)', side: 'back', d: 'M95,105 C98,110 100,115 98,125 L88,125 C85,115 85,110 85,105 Z' },
  { id: 'hand_r_back', label: '오른쪽 손(뒤)', side: 'back', d: 'M5,105 C2,110 0,115 2,125 L12,125 C15,115 15,110 15,105 Z' },
  // 뒷면 발
  { id: 'foot_l_back', label: '왼쪽 발(뒤)', side: 'back', d: 'M60,192 L75,192 C78,197 80,200 78,207 L60,207 Z' },
  { id: 'foot_r_back', label: '오른쪽 발(뒤)', side: 'back', d: 'M40,192 L25,192 C22,197 20,200 22,207 L40,207 Z' },
]

type Props = {
  value: PainArea[]
  onChange: (value: PainArea[]) => void
  readOnly?: boolean
}

export function BodyMap({ value, onChange, readOnly = false }: Props) {
  const [selectedPart, setSelectedPart] = useState<typeof BODY_PARTS[0] | null>(null)
  const [view, setView] = useState<'front' | 'back'>('front')
  const [intensity, setIntensity] = useState(5)
  const [pattern, setPattern] = useState<PainPattern>('referred')
  const [customLabel, setCustomLabel] = useState('')

  const handlePartClick = (part: typeof BODY_PARTS[0]) => {
    if (readOnly) return
    const existing = value.find((p) => p.id === part.id)
    if (existing) {
      setPattern(existing.pattern)
      setIntensity(existing.intensity)
      setCustomLabel(existing.customPatternLabel || '')
    } else {
      setPattern('referred')
      setIntensity(5)
      setCustomLabel('')
    }
    setSelectedPart(part)
  }

  const addOrUpdatePain = () => {
    if (!selectedPart) return
    const existing = value.find((p) => p.id === selectedPart.id)
    const newPain: PainArea = { 
      id: selectedPart.id, 
      label: selectedPart.label, 
      pattern, 
      intensity,
      customPatternLabel: pattern === 'custom' ? customLabel : undefined
    }

    if (existing) {
      onChange(value.map((p) => p.id === selectedPart.id ? newPain : p))
    } else {
      onChange([...value, newPain])
    }
    setSelectedPart(null)
  }

  const removePain = (id: string) => {
    onChange(value.filter((p) => p.id !== id))
    setSelectedPart(null)
  }

  const getPainClass = (partId: string) => {
    const pain = value.find((p) => p.id === partId)
    if (!pain) return ''
    return `pain-${pain.pattern}`
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex gap-2 mb-2">
        <Button 
          type="button" 
          variant={view === 'front' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setView('front')}
        >
          앞면
        </Button>
        <Button 
          type="button" 
          variant={view === 'back' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setView('back')}
        >
          뒷면
        </Button>
      </div>

      <div className="relative w-full max-w-[320px] aspect-[1/2.1] bg-slate-900/5 rounded-2xl overflow-hidden border border-slate-200/60 p-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] backdrop-blur-sm">
        {/* 의료용 아틀라스 배경 효과 */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <svg viewBox="0 0 100 210" className="relative w-full h-full drop-shadow-2xl">
          {/* 인체 실루엣 가이드 */}
          <path 
            d="M50,5 C62,5 65,15 62,25 C75,25 85,35 90,50 L98,120 L85,130 L75,195 C78,205 78,205 60,208 L40,208 C22,205 22,205 25,195 L15,130 L2,120 L10,50 C15,35 25,25 38,25 C35,15 38,5 50,5 Z" 
            fill="rgba(0,0,0,0.02)"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
          
          {BODY_PARTS.filter(p => p.side === view).map((part) => (
            <path
              key={part.id}
              d={part.d}
              className={`body-part ${getPainClass(part.id)} ${selectedPart?.id === part.id ? 'selected' : ''}`}
              onClick={() => handlePartClick(part)}
            />
          ))}
        </svg>
      </div>

      {!readOnly && value.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {value.map(p => (
            <div key={p.id} className="flex items-center gap-1 bg-secondary/50 border px-2 py-1 rounded-full text-[10px] sm:text-xs">
              <span className="font-semibold">{p.label}</span>
              <span className="text-muted-foreground mx-0.5">·</span>
              <span className={getPainColor(p.pattern)}>
                {p.pattern === 'custom' ? (p.customPatternLabel || '기타') : patternLabel(p.pattern)}
              </span>
              <button type="button" onClick={() => removePain(p.id)} className="ml-1 p-0.5 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedPart} onOpenChange={(open) => !open && setSelectedPart(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-primary">{selectedPart?.label}</span>
              <span className="text-sm font-normal text-muted-foreground">통증 설정</span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label className="text-sm font-medium">통증 양상</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['referred', 'tingling', 'weakness', 'paresthesia', 'radiating', 'sharp', 'custom'] as PainPattern[]).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={pattern === p ? 'default' : 'outline'}
                    className={`h-auto py-2.5 flex flex-col gap-1 transition-all ${
                      pattern === p ? '' : 'hover:bg-muted'
                    }`}
                    onClick={() => setPattern(p)}
                  >
                    <span className="text-xs sm:text-sm">{patternLabel(p)}</span>
                  </Button>
                ))}
              </div>
            </div>

            {pattern === 'custom' && (
              <div className="grid gap-2">
                <Label htmlFor="custom-label" className="text-sm font-medium">기타 통증 내용</Label>
                <input
                  id="custom-label"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="예: 뻐근함, 욱신거림"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                variant="ghost" 
                className="flex-1 text-destructive hover:bg-destructive/10" 
                onClick={() => selectedPart && removePain(selectedPart.id)}
              >
                삭제
              </Button>
              <Button className="flex-[2]" onClick={addOrUpdatePain}>
                확인
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function patternLabel(p: PainPattern) {
  switch (p) {
    case 'referred': return '연관통'
    case 'tingling': return '저림'
    case 'weakness': return '힘빠짐'
    case 'paresthesia': return '이상감각'
    case 'radiating': return '방사통'
    case 'sharp': return '날카로운 통증'
    case 'custom': return '기타'
  }
}

function getPainColor(p: PainPattern) {
  switch (p) {
    case 'referred': return 'text-red-500'
    case 'tingling': return 'text-blue-500'
    case 'weakness': return 'text-indigo-600'
    case 'paresthesia': return 'text-purple-500'
    case 'radiating': return 'text-orange-500'
    case 'sharp': return 'text-yellow-500'
    case 'custom': return 'text-teal-500'
  }
}
