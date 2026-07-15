import { apiFetch } from '@/lib/api/base-fetch';
import type {
  HealthAssessmentAnswer,
  HealthAssessmentAnswerInput,
  HealthAssessmentFormCondition,
  HealthAssessmentFormSection,
  HealthAssessmentSubmissionCondition,
  HealthAssessmentSubmissionDetail,
  HealthAssessmentSubmissionListItem,
  HealthAssessmentSubmissionListResult,
  HealthAssessmentSubmissionSection,
  LocalizedName,
} from '../types/health-assessment.types';

interface Paginated<T> {
  items?: T[];
  data?: T[];
  pagination?: {
    current_page?: number | string;
    last_page?: number | string;
    per_page?: number | string;
    total?: number | string;
  };
}

function toNumber(value: unknown): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function getItems<T>(payload: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.data ?? [];
}

/** Keep the raw localized `name` object (or plain string) so the component can `localize()` it. */
function name(value: unknown): LocalizedName {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return value as LocalizedName;
  return '';
}

// --- raw API shapes -------------------------------------------------------

interface FormConditionApi {
  id: number | string;
  name: unknown;
}
interface FormSectionApi {
  id: number | string;
  name: unknown;
  conditions?: FormConditionApi[];
}
interface SubmissionListItemApi {
  id: number | string;
  status: string;
  sections_count?: number | string;
  conditions_count?: number | string;
  created_at: string;
}
interface SubmissionAnswerApi {
  value: string;
  label: string;
}
interface SubmissionConditionApi {
  id: number | string;
  name: unknown;
  answer?: SubmissionAnswerApi | null;
}
interface SubmissionSectionApi {
  id: number | string;
  name: unknown;
  conditions?: SubmissionConditionApi[];
}
interface SubmissionDetailApi {
  id: number | string;
  status: string;
  sections_count?: number | string;
  conditions_count?: number | string;
  created_at: string;
  answers?: SubmissionSectionApi[];
}

// --- mappers --------------------------------------------------------------

function mapFormCondition(item: FormConditionApi): HealthAssessmentFormCondition {
  return { id: toNumber(item.id), name: name(item.name) };
}

function mapFormSection(item: FormSectionApi): HealthAssessmentFormSection {
  return {
    id: toNumber(item.id),
    name: name(item.name),
    conditions: (item.conditions ?? []).map(mapFormCondition),
  };
}

function mapSubmissionListItem(item: SubmissionListItemApi): HealthAssessmentSubmissionListItem {
  return {
    id: toNumber(item.id),
    status: item.status,
    sectionsCount: toNumber(item.sections_count),
    conditionsCount: toNumber(item.conditions_count),
    createdAt: item.created_at,
  };
}

function mapSubmissionCondition(item: SubmissionConditionApi): HealthAssessmentSubmissionCondition {
  const answer = item.answer;
  return {
    id: toNumber(item.id),
    name: name(item.name),
    answer:
      answer && typeof answer === 'object'
        ? { value: answer.value as HealthAssessmentAnswer, label: answer.label }
        : null,
  };
}

function mapSubmissionSection(item: SubmissionSectionApi): HealthAssessmentSubmissionSection {
  return {
    id: toNumber(item.id),
    name: name(item.name),
    conditions: (item.conditions ?? []).map(mapSubmissionCondition),
  };
}

// --- API calls ------------------------------------------------------------

export async function getHealthAssessmentForm(): Promise<HealthAssessmentFormSection[]> {
  const response = await apiFetch<FormSectionApi[] | Paginated<FormSectionApi>>(
    '/api/user/health-assessments/form',
  );
  return getItems(response).map(mapFormSection);
}

export async function submitHealthAssessment(answers: HealthAssessmentAnswerInput[]) {
  return apiFetch<HealthAssessmentSubmissionDetail>('/api/user/health-assessments', {
    method: 'POST',
    body: { answers },
  });
}

export async function getHealthAssessmentSubmissions(query?: {
  perPage?: number;
  page?: number;
}): Promise<HealthAssessmentSubmissionListResult> {
  const response = await apiFetch<SubmissionListItemApi[] | Paginated<SubmissionListItemApi>>(
    '/api/user/health-assessments',
    { query: { per_page: query?.perPage ?? 15, page: query?.page } },
  );
  const items = getItems(response).map(mapSubmissionListItem);
  const pagination = !Array.isArray(response) ? response.pagination : undefined;
  return {
    items,
    pagination: pagination
      ? {
          currentPage: toNumber(pagination.current_page) || 1,
          lastPage: toNumber(pagination.last_page) || 1,
          perPage: toNumber(pagination.per_page) || items.length,
          total: toNumber(pagination.total) || items.length,
        }
      : undefined,
  };
}

export async function getHealthAssessmentSubmission(
  id: number | string,
): Promise<HealthAssessmentSubmissionDetail> {
  const response = await apiFetch<SubmissionDetailApi>(`/api/user/health-assessments/${id}`);
  return {
    id: toNumber(response.id),
    status: response.status,
    sectionsCount: toNumber(response.sections_count),
    conditionsCount: toNumber(response.conditions_count),
    createdAt: response.created_at,
    answers: (response.answers ?? []).map(mapSubmissionSection),
  };
}
