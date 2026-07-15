import type { LocalizedString } from '../../../../types';

/** Backend answer enum for a single condition. */
export type HealthAssessmentAnswer = 'not_present' | 'present' | 'chronic';

/**
 * Localized name as returned by the backend. The API sends a `{ ar, en, ... }`
 * translations object, but we stay tolerant of a plain string too and resolve
 * it at the component layer via `localize()`.
 */
export type LocalizedName = LocalizedString | string;

// ---------------------------------------------------------------------------
// GET health-assessments/form — dynamic form schema (REAL condition ids)
// ---------------------------------------------------------------------------

export interface HealthAssessmentFormCondition {
  id: number;
  name: LocalizedName;
}

export interface HealthAssessmentFormSection {
  id: number;
  name: LocalizedName;
  conditions: HealthAssessmentFormCondition[];
}

// ---------------------------------------------------------------------------
// POST health-assessments — submission body
// ---------------------------------------------------------------------------

export interface HealthAssessmentAnswerInput {
  condition_id: number;
  answer: HealthAssessmentAnswer;
}

// ---------------------------------------------------------------------------
// GET health-assessments — paginated list (answers null)
// ---------------------------------------------------------------------------

export interface HealthAssessmentSubmissionListItem {
  id: number;
  status: string;
  sectionsCount: number;
  conditionsCount: number;
  createdAt: string;
}

export interface HealthAssessmentSubmissionListResult {
  items: HealthAssessmentSubmissionListItem[];
  pagination?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

// ---------------------------------------------------------------------------
// GET health-assessments/{id} — full submission with nested answers
// ---------------------------------------------------------------------------

export interface HealthAssessmentSubmissionAnswerValue {
  value: HealthAssessmentAnswer;
  label: string;
}

export interface HealthAssessmentSubmissionCondition {
  id: number;
  name: LocalizedName;
  answer?: HealthAssessmentSubmissionAnswerValue | null;
}

export interface HealthAssessmentSubmissionSection {
  id: number;
  name: LocalizedName;
  conditions: HealthAssessmentSubmissionCondition[];
}

export interface HealthAssessmentSubmissionDetail {
  id: number;
  status: string;
  sectionsCount: number;
  conditionsCount: number;
  createdAt: string;
  answers: HealthAssessmentSubmissionSection[];
}
