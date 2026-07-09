import { apiFetch } from '@/lib/api/base-fetch';
import type { LocalizedString } from '../../../../types';

export type HealthAssessmentAnswer = 'not_present' | 'present' | 'chronic';

export interface BackendHealthCondition {
  id: number;
  name: LocalizedString;
}

export interface BackendHealthSection {
  id: number;
  name: LocalizedString;
  conditions: BackendHealthCondition[];
}

export interface BackendHealthAssessmentSummary {
  id: number;
  status: string;
  sections_count: number;
  conditions_count: number;
  created_at: string;
}

export interface BackendHealthAssessmentDetail extends BackendHealthAssessmentSummary {
  answers: Array<{
    id: number;
    name: LocalizedString;
    conditions: Array<BackendHealthCondition & {
      answer?: { value: HealthAssessmentAnswer; label: string } | HealthAssessmentAnswer | null;
    }>;
  }>;
}

interface PaginatedAssessments {
  items?: BackendHealthAssessmentSummary[];
  data?: BackendHealthAssessmentSummary[];
}

export function getHealthAssessmentForm() {
  return apiFetch<BackendHealthSection[]>('/api/user/health-assessments/form');
}

export async function getHealthAssessments() {
  const response = await apiFetch<PaginatedAssessments | BackendHealthAssessmentSummary[] | null>(
    '/api/user/health-assessments',
  );
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.items ?? response.data ?? [];
}

export function getHealthAssessment(id: string) {
  return apiFetch<BackendHealthAssessmentDetail>(`/api/user/health-assessments/${id}`);
}

export function submitHealthAssessment(
  answers: Array<{ conditionId: number; answer: HealthAssessmentAnswer }>,
) {
  return apiFetch<BackendHealthAssessmentDetail>('/api/user/health-assessments', {
    method: 'POST',
    body: {
      answers: answers.map((item) => ({
        condition_id: item.conditionId,
        answer: item.answer,
      })),
    },
  });
}
