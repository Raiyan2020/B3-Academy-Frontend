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
