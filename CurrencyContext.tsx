import React, { createContext, useContext, useState, useEffect } from 'react';
import { getLocalStorageItem, setLocalStorageItem, STORAGE_KEYS } from './src/lib/storage/safe-local-storage';

type Currency = 'USD' | 'EUR' | 'GBP' | 'AED' | 'JPY' | 'CNH';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceInUSD: number) => string;
}

const exchangeRates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  JPY: 150.0,
  CNH: 7.23,
};

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  JPY: '¥',
  CNH: '¥',
};

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
    const converted = priceInUSD * exchangeRates[currency];
    const formatted = converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    if (['USD', 'EUR', 'GBP', 'JPY', 'CNH'].includes(currency)) {
      return `${currencySymbols[currency]}${formatted}`;
    } else {
      return `${formatted}${currencySymbols[currency]}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};
