import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getLocalStorageItem, setLocalStorageItem, STORAGE_KEYS } from '@/lib/storage/safe-local-storage';
import { convertAmount, formatAmount } from '@/features/business/money';
import type { CurrencyCode } from '@/features/business/business.types';

type Currency = CurrencyCode;

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceInUSD: number) => string;
  convertPrice: (amount: number, baseCurrency?: Currency) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = getLocalStorageItem(STORAGE_KEYS.currency) as Currency;
    const supportedCurrencies: Currency[] = ['USD', 'EUR', 'GBP', 'AED', 'JPY', 'CNH'];
    return supportedCurrencies.includes(saved) ? saved : 'USD';
  });

  useEffect(() => {
    setLocalStorageItem(STORAGE_KEYS.currency, currency);
  }, [currency]);

  // Stabilised for the same reason as LanguageContext: this provider is mounted at the
  // root, so a fresh value object re-renders every consumer in every route tree.
  // (vercel-react-best-practices: rerender-defer-reads)
  const formatPrice = useCallback(
    (priceInUSD: number) => formatAmount(convertAmount(priceInUSD, 'USD', currency), currency),
    [currency],
  );

  const convertPrice = useCallback(
    (amount: number, baseCurrency: Currency = 'USD') => convertAmount(amount, baseCurrency, currency),
    [currency],
  );

  const value = useMemo(
    () => ({ currency, setCurrency, formatPrice, convertPrice }),
    [currency, formatPrice, convertPrice],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};
