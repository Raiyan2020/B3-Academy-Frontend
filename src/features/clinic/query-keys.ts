export const clinicKeys = {
  all: ['clinics'] as const,
  lists: () => [...clinicKeys.all, 'list'] as const,
  list: (filters?: unknown) => [...clinicKeys.all, 'list', filters ?? {}] as const,
  categories: () => [...clinicKeys.all, 'categories'] as const,
  services: () => [...clinicKeys.all, 'services'] as const,
  detail: (id: string) => [...clinicKeys.all, 'detail', id] as const,
  workingHours: (id: string) => [...clinicKeys.all, 'working-hours', id] as const,
  initialConsultationTypes: (id: string) => [...clinicKeys.all, 'initial-consultation-types', id] as const,
  availableSlots: (id: string, date?: string, type?: string) =>
    [...clinicKeys.all, 'available-slots', id, date ?? '', type ?? ''] as const,
};
