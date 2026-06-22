'use client';

import { getHealthAssessmentRecords } from '@/features/account/services/account-records.service';
import { getStoredConsultations } from '@/features/care/services/care-records-storage.service';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';

const SKIPPED_PROMPT_KEY = 'b3-health-assessment-prompt-skipped';

export function hasCompletedHealthAssessment(userId: string): boolean {
  return getHealthAssessmentRecords(userId).length > 0;
}

export function hasSkippedHealthAssessmentPrompt(userId: string): boolean {
  const skipped = readLocalStorageJson<Record<string, boolean>>(SKIPPED_PROMPT_KEY, {});
  return Boolean(skipped[userId]);
}

export function markHealthAssessmentPromptSkipped(userId: string) {
  const skipped = readLocalStorageJson<Record<string, boolean>>(SKIPPED_PROMPT_KEY, {});
  writeLocalStorageJson(SKIPPED_PROMPT_KEY, { ...skipped, [userId]: true });
}

export function shouldShowHealthAssessmentPrompt(userId: string): boolean {
  if (hasCompletedHealthAssessment(userId) || hasSkippedHealthAssessmentPrompt(userId)) return false;
  const priorInitial = getStoredConsultations(userId).some(
    (record) =>
      record.serviceKind === 'clinic_initial' ||
      record.serviceKind === 'trip_initial' ||
      record.serviceName.en.toLowerCase().includes('initial'),
  );
  return !priorInitial;
}
