import type { CurrencyCode } from './business.types';

export const USD_EXCHANGE_RATES: Readonly<Record<CurrencyCode, number>> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  JPY: 150,
  CNH: 7.23,
};

export function convertAmount(amount: number, baseCurrency: CurrencyCode, targetCurrency: CurrencyCode) {
  if (!Number.isFinite(amount)) return 0;
  return (amount / USD_EXCHANGE_RATES[baseCurrency]) * USD_EXCHANGE_RATES[targetCurrency];
}

export function formatAmount(amount: number, currency: CurrencyCode, locale = 'en') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency === 'CNH' ? 'CNY' : currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
}
