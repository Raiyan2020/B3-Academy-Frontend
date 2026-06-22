'use client';

import {
  buildSlotId,
  generateSlotCandidates,
  getScheduleConfig,
  DEFAULT_SCHEDULES,
} from './care-schedule-config.service';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type { AvailabilitySlot, SlotStatus } from '../types/care.types';
import type { ConsultationKind } from '@/features/business/status.types';

const STORAGE_KEY = 'b3-care-availability-slots';
const DEFAULT_TIMEZONE = 'Asia/Riyadh';

export interface AvailabilitySlotFilters {
  doctorId?: string;
  serviceKind?: ConsultationKind;
  clinicId?: string;
  tripId?: string;
}

function readBookedSlotKeys(): Set<string> {
  return new Set(readLocalStorageJson<string[]>(`${STORAGE_KEY}-booked`, []));
}

function writeBookedSlotKeys(keys: Set<string>) {
  writeLocalStorageJson(`${STORAGE_KEY}-booked`, Array.from(keys));
}

function matchesFilters(slot: AvailabilitySlot, filters: AvailabilitySlotFilters = {}) {
  if (filters.doctorId && slot.doctorId !== filters.doctorId) return false;
  if (filters.serviceKind && slot.serviceKind !== filters.serviceKind) return false;
  if (filters.clinicId && slot.clinicId !== filters.clinicId) return false;
  if (filters.tripId && slot.tripId !== filters.tripId) return false;
  return true;
}

function buildSlotsForFilters(filters: AvailabilitySlotFilters, now: Date = new Date()): AvailabilitySlot[] {
  if (!filters.doctorId || !filters.serviceKind) return [];

  const config = getScheduleConfig(filters.doctorId, filters.serviceKind, filters.clinicId);
  if (!config) return [];

  const bookedKeys = readBookedSlotKeys();
  return generateSlotCandidates(config, now).map((candidate) => {
    const id = buildSlotId(filters.doctorId!, filters.serviceKind!, candidate.date, candidate.time, filters.clinicId);
    return {
      id,
      doctorId: filters.doctorId!,
      serviceKind: filters.serviceKind!,
      clinicId: filters.clinicId,
      tripId: filters.tripId,
      date: candidate.date,
      time: candidate.time,
      duration: candidate.duration,
      timezone: DEFAULT_TIMEZONE,
      status: bookedKeys.has(id) ? 'booked' : 'available',
    } satisfies AvailabilitySlot;
  });
}

export function getAvailableSlots(filters: AvailabilitySlotFilters = {}) {
  return buildSlotsForFilters(filters).filter((slot) => slot.status === 'available');
}

export function getSlotById(id: string, filters?: AvailabilitySlotFilters) {
  if (filters?.doctorId && filters.serviceKind) {
    return buildSlotsForFilters(filters).find((slot) => slot.id === id) ?? null;
  }

  for (const config of DEFAULT_SCHEDULES) {
    const candidates = generateSlotCandidates(config).map((candidate) => ({
      id: buildSlotId(config.doctorId, config.serviceKind, candidate.date, candidate.time, config.clinicId),
      doctorId: config.doctorId,
      serviceKind: config.serviceKind,
      clinicId: config.clinicId,
      date: candidate.date,
      time: candidate.time,
      duration: candidate.duration,
      timezone: DEFAULT_TIMEZONE,
      status: readBookedSlotKeys().has(id) ? 'booked' as SlotStatus : 'available' as SlotStatus,
    }));
    const match = candidates.find((slot) => slot.id === id);
    if (match) {
      return { ...match, status: readBookedSlotKeys().has(id) ? 'booked' : match.status };
    }
  }

  if (readBookedSlotKeys().has(id)) {
    return {
      id,
      doctorId: 'unknown',
      serviceKind: 'individual_video' as ConsultationKind,
      date: '',
      time: '',
      duration: 45,
      timezone: DEFAULT_TIMEZONE,
      status: 'booked' as SlotStatus,
    };
  }

  return null;
}

export function isSlotAvailable(id: string, filters?: AvailabilitySlotFilters) {
  const slot = getSlotById(id, filters);
  return Boolean(slot && slot.status === 'available');
}

export function reserveSlot(id: string) {
  const bookedKeys = readBookedSlotKeys();
  if (bookedKeys.has(id)) return false;
  bookedKeys.add(id);
  writeBookedSlotKeys(bookedKeys);
  return true;
}

export function releaseSlot(id: string) {
  const bookedKeys = readBookedSlotKeys();
  if (!bookedKeys.has(id)) return false;
  bookedKeys.delete(id);
  writeBookedSlotKeys(bookedKeys);
  return true;
}

export function resetSlotRepositoryForTests() {
  writeBookedSlotKeys(new Set());
}

export function listAllSlots(filters: AvailabilitySlotFilters = {}) {
  return buildSlotsForFilters(filters);
}

export function getAvailableDays(filters: AvailabilitySlotFilters) {
  const days = new Set(getAvailableSlots(filters).map((slot) => slot.date));
  return Array.from(days).sort();
}

export function getAvailableTimesForDay(filters: AvailabilitySlotFilters, date: string) {
  return getAvailableSlots(filters).filter((slot) => slot.date === date);
}

export function updateSlotStatus(id: string, status: SlotStatus) {
  if (status === 'booked') return reserveSlot(id);
  if (status === 'available') return releaseSlot(id);
  return false;
}
