import React, { createContext, useContext, useState, useEffect } from 'react';
import { getLocalStorageItem, setLocalStorageItem, STORAGE_KEYS } from './src/lib/storage/safe-local-storage';
import { convertAmount, formatAmount } from './src/features/business/money';
import type { CurrencyCode } from './src/features/business/business.types';

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

  const formatPrice = (priceInUSD: number) => {
    return formatAmount(convertAmount(priceInUSD, 'USD', currency), currency);
  };

  const convertPrice = (amount: number, baseCurrency: Currency = 'USD') => convertAmount(amount, baseCurrency, currency);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};
