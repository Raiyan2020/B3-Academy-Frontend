import { apiFetch } from '@/lib/api/base-fetch';
import type { BackendCooperationType, CooperationRequestInput } from '../types';
import { mapCooperationType } from './cooperation.mapper';

export async function getCooperationTypes() {
  const payload = await apiFetch<BackendCooperationType[]>('/api/user/collaboration/types');
  return payload.map(mapCooperationType);
}

export async function submitCooperationRequest(input: CooperationRequestInput) {
  return apiFetch('/api/user/collaboration/requests', {
    method: 'POST',
    body: {
      collaboration_type_id: Number(input.collaborationTypeId),
      title: input.title,
      message: input.message,
    },
  });
}
