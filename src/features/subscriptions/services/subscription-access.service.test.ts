import { describe, expect, it } from 'vitest';
import { isSubscriptionRecordActive } from './subscription-access.service';
import type { MySubscriptionResponse } from '../types/api.types';

function buildResponse(active: MySubscriptionResponse['active']): MySubscriptionResponse {
  return { active, history: [] };
}

describe('isSubscriptionRecordActive', () => {
  it('is active when the backend returns an active record with no end date', () => {
    const response = buildResponse({
      id: '1',
      planName: 'Annual',
      statusLabel: 'Active',
      paidAmount: 90,
      baseAmount: 90,
      currency: 'KWD',
    });

    expect(isSubscriptionRecordActive(response)).toBe(true);
  });

  it('is active when the backend end date is in the future', () => {
    const response = buildResponse({
      id: '2',
      planName: 'Monthly',
      statusLabel: 'Active',
      paidAmount: 10,
      baseAmount: 10,
      currency: 'KWD',
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    });

    expect(isSubscriptionRecordActive(response)).toBe(true);
  });

  it('is not active when the backend end date is in the past', () => {
    const response = buildResponse({
      id: '3',
      planName: 'Monthly',
      statusLabel: 'Expired',
      paidAmount: 10,
      baseAmount: 10,
      currency: 'KWD',
      endsAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    });

    expect(isSubscriptionRecordActive(response)).toBe(false);
  });

  it('is not active when the backend reports no active subscription, regardless of stale local fields', () => {
    // Simulates the bug this replaces: a customer whose local `user.isSubscribed`
    // flag was never flipped back to false, but the backend authoritatively
    // reports no active subscription (e.g. it expired or was never activated).
    const response = buildResponse(null);

    expect(isSubscriptionRecordActive(response)).toBe(false);
  });

  it('is active as soon as the backend reports one, without depending on any local user field', () => {
    // Simulates the fix this replaces: right after a successful checkout, the
    // backend already reports an active subscription even though nothing in a
    // local `user` object was ever mutated.
    const response = buildResponse({
      id: '4',
      planName: 'Monthly',
      statusLabel: 'Active',
      paidAmount: 10,
      baseAmount: 10,
      currency: 'KWD',
    });

    expect(isSubscriptionRecordActive(response)).toBe(true);
  });

  it('treats a missing response the same as no subscription', () => {
    expect(isSubscriptionRecordActive(null)).toBe(false);
    expect(isSubscriptionRecordActive(undefined)).toBe(false);
  });
});
