export const STORAGE_KEYS = {
  patients: 'physiolog_patients',
  treatments: (patientId: string) => `physiolog_treatments_${patientId}`,
  evaluations: (patientId: string) => `physiolog_evaluations_${patientId}`,
  exerciseFavorites: 'physiolog_exercises_favorites',
  evaluationFavorites: 'physiolog_evaluations_favorites',
  graphSettings: (patientId: string) => `physiolog_graph_settings_${patientId}`,
  icf: (patientId: string) => `physiolog_icf_${patientId}`,
  customFlags: 'physiolog_custom_flags',
  patientSort: 'physiolog_patient_sort',
  rememberedEmail: 'physiolog_remembered_email',
} as const
