/** Stable QA identifiers from the approved business-alignment audit. */
export const BUSINESS_REQUIREMENT_IDS = Array.from(
  { length: 129 },
  (_, index) => `BR-${String(index + 1).padStart(3, '0')}`,
) as readonly string[];

export const BUSINESS_GAP_IDS = Array.from(
  { length: 38 },
  (_, index) => `GAP-${String(index + 1).padStart(3, '0')}`,
) as readonly string[];

export type RequirementRouteEvidence = {
  requirementId: string;
  routes: readonly string[];
  evidence?: readonly string[];
};

export const REQUIREMENT_ROUTE_EVIDENCE: readonly RequirementRouteEvidence[] = [
  { requirementId: 'BR-001', routes: ['/'] },
  { requirementId: 'BR-002', routes: ['/auth'] },
  { requirementId: 'BR-003', routes: ['/search'] },
  { requirementId: 'BR-004', routes: ['/courses', '/courses/[courseId]', '/learn/[courseId]'] },
  { requirementId: 'BR-005', routes: ['/books', '/books/[bookId]', '/read/[bookId]'] },
  { requirementId: 'BR-006', routes: ['/clinic', '/clinic/[clinicId]', '/clinic/[clinicId]/book'] },
  { requirementId: 'BR-007', routes: ['/consultations', '/consultation/[consultationId]'] },
  { requirementId: 'BR-008', routes: ['/trips', '/trips/[tripId]'] },
  { requirementId: 'BR-009', routes: ['/community', '/podcasts', '/monograph'] },
  { requirementId: 'BR-010', routes: ['/dashboard'] },
  { requirementId: 'BR-011', routes: ['/admin', '/admin/users'] },
  { requirementId: 'BR-012', routes: ['/doctor', '/doctor/schedule'] },
];
