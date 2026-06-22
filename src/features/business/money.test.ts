import { describe, expect, it } from 'vitest';
import { convertAmount, formatAmount } from './money';
import type { CurrencyCode } from './business.types';

describe('shared money utilities', () => {
  const currencies: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'AED', 'JPY', 'CNH'];

  it.each(currencies)('converts and formats %s without mutating the base amount', (currency) => {
    const base = 100;
    const converted = convertAmount(base, 'USD', currency);
    expect(Number.isFinite(converted)).toBe(true);
    expect(formatAmount(converted, currency)).toBeTruthy();
    expect(base).toBe(100);
  });

  it('round-trips numeric conversion for filtering', () => {
    expect(convertAmount(convertAmount(42, 'USD', 'AED'), 'AED', 'USD')).toBeCloseTo(42);
  });
});
