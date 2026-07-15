export const healthAssessmentKeys = {
  all: ['health-assessments'] as const,
  form: () => [...healthAssessmentKeys.all, 'form'] as const,
  lists: () => [...healthAssessmentKeys.all, 'list'] as const,
  list: (page?: number, perPage?: number) =>
    [...healthAssessmentKeys.lists(), page ?? 1, perPage ?? 15] as const,
  detail: (id: number | string) => [...healthAssessmentKeys.all, 'detail', String(id)] as const,
};
