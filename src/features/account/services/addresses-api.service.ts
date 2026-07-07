import { apiFetch } from '@/lib/api/base-fetch';
import type { Address } from '../../../../types';

interface BackendAddress {
  id: number | string;
  full_name?: string | null;
  governorate?: string | null;
  area?: string | null;
  block?: string | null;
  street?: string | null;
  building?: string | null;
  phone?: string | null;
  formatted_address?: string | null;
  is_default?: boolean;
}

export interface AddressInput {
  name: string;
  governorate: string;
  area: string;
  block?: string;
  street?: string;
  building?: string;
  phone?: string;
  isDefault?: boolean;
}

function mapAddress(input: BackendAddress): Address {
  return {
    id: String(input.id),
    name: input.full_name || '',
    governorate: input.governorate || '',
    area: input.area || '',
    block: input.block || '',
    street: input.street || '',
    building: input.building || '',
    isDefault: Boolean(input.is_default),
  };
}

function mapAddressBody(input: AddressInput) {
  return {
    full_name: input.name,
    governorate: input.governorate,
    area: input.area,
    block: input.block,
    street: input.street,
    building: input.building,
    phone: input.phone,
    is_default: input.isDefault,
  };
}

export async function getBackendAddresses() {
  const response = await apiFetch<BackendAddress[]>('/api/user/addresses');
  return response.map(mapAddress);
}

export async function createBackendAddress(input: AddressInput) {
  const response = await apiFetch<BackendAddress>('/api/user/addresses', {
    method: 'POST',
    body: mapAddressBody(input),
  });
  return mapAddress(response);
}

export async function updateBackendAddress(id: string, input: AddressInput) {
  const response = await apiFetch<BackendAddress>(`/api/user/addresses/${id}`, {
    method: 'PUT',
    body: mapAddressBody(input),
  });
  return mapAddress(response);
}

export async function setBackendDefaultAddress(id: string) {
  const response = await apiFetch<BackendAddress>(`/api/user/addresses/${id}/set-default`, {
    method: 'PATCH',
  });
  return mapAddress(response);
}

export async function deleteBackendAddress(id: string) {
  return apiFetch(`/api/user/addresses/${id}`, { method: 'DELETE' });
}
