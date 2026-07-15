'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getPortalDetail,
  getPortalList,
  getPortalMessages,
  sendPortalMessage,
} from '../services/care-portal-api.service';
import type { CarePortalResource } from '../types/api.types';
import { carePortalKeys } from '../query-keys';

export function usePortalList(
  resource: CarePortalResource,
  params: { page?: number; perPage?: number; enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: carePortalKeys.list(resource, params.page, params.perPage),
    queryFn: () => getPortalList(resource, { page: params.page, perPage: params.perPage }),
    enabled: params.enabled ?? true,
  });
}

export function usePortalDetail(
  resource: CarePortalResource,
  id: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: carePortalKeys.detail(resource, id ?? ''),
    queryFn: () => getPortalDetail(resource, id as string),
    enabled: Boolean(id) && enabled,
  });
}

export function usePortalMessages(
  resource: CarePortalResource,
  id: string | undefined,
  options: { enabled?: boolean; refetchInterval?: number } = {},
) {
  return useQuery({
    queryKey: carePortalKeys.messages(resource, id ?? ''),
    queryFn: () => getPortalMessages(resource, id as string),
    enabled: Boolean(id) && (options.enabled ?? true),
    refetchInterval: options.refetchInterval ?? 10000,
  });
}

export function useSendPortalMessage(resource: CarePortalResource, id: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => sendPortalMessage(resource, id as string, body),
    meta: { silentSuccess: true },
    onSuccess: async () => {
      if (!id) return;
      await queryClient.invalidateQueries({ queryKey: carePortalKeys.messages(resource, id) });
    },
  });
}
