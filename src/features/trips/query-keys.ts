export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (filters?: unknown) => [...tripKeys.all, 'list', filters ?? {}] as const,
  featured: (limit?: number) => [...tripKeys.all, 'featured', limit ?? 4] as const,
  categories: () => [...tripKeys.all, 'categories'] as const,
  detail: (id: string) => [...tripKeys.all, 'detail', id] as const,
  initialConsultationTypes: () => [...tripKeys.all, 'initial-consultation-types'] as const,
  availableSlots: (date?: string, type?: string) =>
    [...tripKeys.all, 'available-slots', date ?? '', type ?? ''] as const,
  consultations: () => [...tripKeys.all, 'consultations'] as const,
  consultation: (id: string) => [...tripKeys.all, 'consultation', id] as const,
  consultationMessages: (id: string) => [...tripKeys.all, 'consultation', id, 'messages'] as const,
  accountOrders: () => [...tripKeys.all, 'account-orders'] as const,
  accountOrder: (id: string) => [...tripKeys.all, 'account-order', id] as const,
};
