'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PatientForm } from '@/features/patients/components/PatientForm'
import { getPatient, updatePatient } from '@/lib/supabase/patients'
import type { PatientFormValues } from '@/features/patients/domain/schema'
import type { Patient } from '@/features/patients/domain/types'
import { LoadingScreen } from '@/components/loading-screen'

type PageProps = { params: Promise<{ id: string }> }

export default function EditPatientPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null | undefined>(undefined)

  useEffect(() => {
    async function load() {
      setPatient(await getPatient(id))
    }
    load()
  }, [id])

  async function handleSubmit(values: PatientFormValues) {
    const result = await updatePatient(id, values)
    if (!result.success) {
      toast.error('수정 실패: ' + result.error)
      return
    }
    toast.success('환자 정보 수정됨')
    router.replace(`/patients/${id}`)
  }

  if (patient === undefined) {
    return <LoadingScreen />
  }

  if (patient === null) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        환자를 찾을 수 없습니다.
      </div>
    )
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
        <Link
          href={`/patients/${id}`}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">환자 정보 수정</h1>
      </header>

      <PatientForm
        defaultValues={defaults}
        submitLabel="수정"
        onSubmit={handleSubmit}
        onCancel={() => router.replace(`/patients/${id}`)}
      />
    </div>
  )
}
