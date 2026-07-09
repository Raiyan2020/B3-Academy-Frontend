import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '@/lib/api/base-fetch';
import {
  getHealthAssessment,
  getHealthAssessmentForm,
  getHealthAssessments,
  submitHealthAssessment,
} from './health-assessment-api.service';

vi.mock('@/lib/api/base-fetch', () => ({ apiFetch: vi.fn() }));

const apiFetchMock = vi.mocked(apiFetch);

describe('health assessment API contract', () => {
  beforeEach(() => apiFetchMock.mockReset());

  it('uses form, list, and detail endpoints', async () => {
    apiFetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 7 });

    await getHealthAssessmentForm();
    await getHealthAssessments();
    await getHealthAssessment('7');

    expect(apiFetchMock).toHaveBeenNthCalledWith(1, '/api/user/health-assessments/form');
    expect(apiFetchMock).toHaveBeenNthCalledWith(2, '/api/user/health-assessments');
    expect(apiFetchMock).toHaveBeenNthCalledWith(3, '/api/user/health-assessments/7');
  });

  it('submits the documented answer shape', async () => {
    apiFetchMock.mockResolvedValue({ id: 8 });
    await submitHealthAssessment([
      { conditionId: 1, answer: 'present' },
      { conditionId: 3, answer: 'chronic' },
    ]);

    expect(apiFetchMock).toHaveBeenCalledWith('/api/user/health-assessments', {
      method: 'POST',
      body: {
        answers: [
          { condition_id: 1, answer: 'present' },
          { condition_id: 3, answer: 'chronic' },
        ],
      },
    });
  });
});
