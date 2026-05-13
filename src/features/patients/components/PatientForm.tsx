'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import {
  GENDER_OPTIONS,
  INSURANCE_OPTIONS,
  PATIENT_STATUS_OPTIONS,
  MEDICAL_HISTORY_OPTIONS,
} from '@/data/patient-options'
import { patientFormSchema, type PatientFormValues } from '@/features/patients/domain/schema'
import { toISODate } from '@/lib/utils/date'
import { Loader2 } from 'lucide-react'

type Props = {
  defaultValues?: Partial<PatientFormValues>
  submitLabel?: string
  onSubmit: (values: PatientFormValues) => void | Promise<void>
  onCancel?: () => void
}

const EMPTY_DEFAULTS: PatientFormValues = {
  name: '',
  birthDate: '',
  gender: 'male',
  phone: '',
  address: '',
  referralRoute: '',
  medicalHistory: [],
  otherMedicalHistory: '',
  diagnosis: '',
  surgeryHistory: '',
  insurance: 'health',
  notes: '',
  treatmentStartDate: toISODate(),
  therapist: '',
  status: 'new',
}

export function PatientForm({
  defaultValues,
  submitLabel = '저장',
  onSubmit,
  onCancel,
}: Props) {
  const form = useForm<PatientFormValues, unknown, PatientFormValues>({
    // zod 4.x + react-hook-form 7.x 호환성 이슈 — known issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(patientFormSchema) as any,
    defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <Section title="기본 정보">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이름 *</FormLabel>
                <FormControl>
                  <Input placeholder="홍길동" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>생년월일 *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>성별 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GENDER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>연락처 *</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    inputMode="tel"
                    placeholder="010-0000-0000"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>주소</FormLabel>
                <FormControl>
                  <Input placeholder="선택" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <Separator />

        <Section title="진료 정보">
          <FormField
            control={form.control}
            name="referralRoute"
            render={({ field }) => (
              <FormItem>
                <FormLabel>내원(의뢰)경로</FormLabel>
                <FormControl>
                  <Input placeholder="예: 타 병원 의뢰, 지인 소개 등" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="medicalHistory"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>과거력 / 기저질환</FormLabel>
                <div className="flex flex-col gap-2">
                  {MEDICAL_HISTORY_OPTIONS.map((item) => (
                    <div key={item} className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, item])
                                  : field.onChange(
                                      field.value?.filter((value) => value !== item)
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer leading-tight">
                            {item}
                          </FormLabel>
                        </FormItem>

                        {item === '기타' && field.value?.includes('기타') && (
                          <FormField
                            control={form.control}
                            name="otherMedicalHistory"
                            render={({ field: otherField }) => (
                              <FormItem className="flex-1 mt-0">
                                <FormControl>
                                  <Input
                                    placeholder="직접 입력"
                                    className="h-8 py-1"
                                    {...otherField}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="diagnosis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>진단명 *</FormLabel>
                <FormControl>
                  <Input placeholder="예: 우측 무릎 십자인대 부분 파열" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="surgeryHistory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>수술/시술 이력</FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="예: 2025-03 ACL 재건술"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="treatmentStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>치료 시작일 *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="insurance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>보험 유형 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INSURANCE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="therapist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>담당 치료사 *</FormLabel>
                  <FormControl>
                    <Input placeholder="이름" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상태 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PATIENT_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Section>

        <Separator />

        <Section title="기타">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>특이사항 / 금기사항</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="예: 우측 발목 약함, 고혈압 약 복용 중"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <div className="sticky bottom-0 -mx-4 flex gap-2 border-t bg-background/95 p-4 backdrop-blur">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={form.formState.isSubmitting}
            >
              취소
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}
