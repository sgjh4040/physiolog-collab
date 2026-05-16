'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PatientForm } from '@/features/patients/components/PatientForm'
import { updatePatient } from '@/lib/supabase/patients'
import type { PatientFormValues } from '@/features/patients/domain/schema'
import type { Patient } from '@/features/patients/domain/types'

type Props = { patient: Patient }

export function EditPatientView({ patient }: Props) {
  const router = useRouter()
  const [isBackPending, startBackTransition] = useTransition()

  async function handleSubmit(values: PatientFormValues) {
    const result = await updatePatient(patient.id, values)
    if (!result.success) {
      toast.error('수정 실패: ' + result.error)
      return
    }
    toast.success('환자 정보 수정됨')
    router.replace(`/patients/${patient.id}`)
    // 페이지 unmount까지 isSubmitting 유지 — 버튼 깜빡임 방지
    await new Promise(() => {})
  }

  const defaults: PatientFormValues = {
    name: patient.name,
    birthDate: patient.birthDate,
    gender: patient.gender,
    phone: patient.phone,
    address: patient.address,
    referralRoute: patient.referralRoute,
    medicalHistory: patient.medicalHistory,
    otherMedicalHistory: patient.otherMedicalHistory ?? '',
    diagnosis: patient.diagnosis,
    surgeryHistory: patient.surgeryHistory ?? '',
    insurance: patient.insurance,
    notes: patient.notes ?? '',
    treatmentStartDate: patient.treatmentStartDate,
    therapist: patient.therapist,
    status: patient.status,
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 pb-8">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            startBackTransition(() => router.push(`/patients/${patient.id}`))
          }
          disabled={isBackPending}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-muted disabled:opacity-60"
        >
          {isBackPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowLeft className="h-5 w-5" />
          )}
        </button>
        <h1 className="text-xl font-semibold">환자 정보 수정</h1>
      </header>

      <PatientForm
        defaultValues={defaults}
        submitLabel="수정"
        onSubmit={handleSubmit}
        onCancel={() => router.replace(`/patients/${patient.id}`)}
      />
    </div>
  )
}
