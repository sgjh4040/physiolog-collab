'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { TreatmentForm } from '@/features/treatments/components/TreatmentForm'
import { getPatient } from '@/lib/supabase/patients'
import { getTreatment, updateTreatment } from '@/lib/supabase/treatments'
import type { TreatmentFormValues } from '@/features/treatments/domain/schema'
import type { Patient } from '@/features/patients/domain/types'
import type { Treatment } from '@/features/treatments/domain/types'
import { LoadingScreen } from '@/components/loading-screen'

type PageProps = { params: Promise<{ id: string; treatmentId: string }> }

export default function EditTreatmentPage({ params }: PageProps) {
  const { id: patientId, treatmentId } = use(params)
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null | undefined>(undefined)
  const [treatment, setTreatment] = useState<Treatment | null | undefined>(undefined)

  useEffect(() => {
    async function load() {
      setPatient(await getPatient(patientId))
      setTreatment(await getTreatment(treatmentId))
    }
    load()
  }, [patientId, treatmentId])

  async function handleSubmit(values: TreatmentFormValues) {
    const result = await updateTreatment(treatmentId, patientId, {
      date: values.date,
      bodyParts: values.bodyParts,
      methods: values.methods,
      otherTreatmentMethod: values.otherTreatmentMethod,
      exerciseConcept: values.exerciseConcept,
      exercises: values.exercises,
      homework: values.homework,
      comment: values.comment,
      flags: values.flags,
    })
    if (result.success) {
      toast.success('치료 수정됨')
      router.replace(`/patients/${patientId}?tab=treatments`)
    } else {
      toast.error('수정 실패', { description: result.error })
    }
  }

  if (patient === undefined || treatment === undefined) {
    return <LoadingScreen />
  }

  if (patient === null || treatment === null) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        치료 정보를 찾을 수 없습니다.
      </div>
    )
  }

  const defaultValues: Partial<TreatmentFormValues> = {
    date: treatment.date,
    bodyParts: treatment.bodyParts as TreatmentFormValues['bodyParts'],
    methods: treatment.methods,
    otherTreatmentMethod: treatment.otherTreatmentMethod ?? undefined,
    exerciseConcept: treatment.exerciseConcept ?? undefined,
    exercises: (treatment.exercises ?? []) as TreatmentFormValues['exercises'],
    homework: treatment.homework ?? '',
    comment: treatment.comment ?? '',
    flags: treatment.flags ?? [],
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
      <header className="flex items-center gap-2">
        <Link
          href={`/patients/${patientId}?tab=treatments`}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">치료 수정</h1>
          <p className="truncate text-sm text-muted-foreground">{patient.name}</p>
        </div>
      </header>

      <TreatmentForm
        defaultValues={defaultValues}
        submitLabel="수정 완료"
        onSubmit={handleSubmit}
        onCancel={() => router.replace(`/patients/${patientId}?tab=treatments`)}
      />
    </div>
  )
}
