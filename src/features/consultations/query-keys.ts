import type { CarePortalResource } from './types/api.types';

export const carePortalKeys = {
  all: ['care-portal'] as const,
  resource: (resource: CarePortalResource) => [...carePortalKeys.all, resource] as const,
  list: (resource: CarePortalResource, page?: number, perPage?: number) =>
    [...carePortalKeys.resource(resource), 'list', page ?? 1, perPage ?? 15] as const,
  detail: (resource: CarePortalResource, id: string) =>
    [...carePortalKeys.resource(resource), 'detail', id] as const,
  messages: (resource: CarePortalResource, id: string, page?: number) =>
    [...carePortalKeys.resource(resource), 'messages', id, page ?? 1] as const,
};

export const consultationCatalogKeys = {
  all: ['consultations-catalog'] as const,
  doctors: () => [...consultationCatalogKeys.all, 'doctors'] as const,
  doctorList: (search?: string, page?: number) =>
    [...consultationCatalogKeys.doctors(), 'list', search || 'all', page ?? 1] as const,
  consultationTypes: (doctorId: string) => [...consultationCatalogKeys.doctors(), doctorId, 'consultation-types'] as const,
  availableSlots: (doctorId: string, date?: string, type?: string) =>
    [...consultationCatalogKeys.doctors(), doctorId, 'available-slots', date ?? '', type ?? ''] as const,
  packages: (doctorId: string, page?: number) =>
    [...consultationCatalogKeys.doctors(), doctorId, 'packages', page ?? 1] as const,
};

export const accountConsultationKeys = {
  all: ['account-consultations'] as const,
  packages: (page?: number, perPage?: number) =>
    [...accountConsultationKeys.all, 'packages', page ?? 1, perPage ?? 15] as const,
  package: (orderId: string) => [...accountConsultationKeys.all, 'package', orderId] as const,
};
