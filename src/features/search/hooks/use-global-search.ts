import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchGlobal } from '../services/search-api.service';
import { searchKeys } from '../query-keys';

// Must match `GlobalSearchRequest`'s `min:3`. At 2 the client let the request through and the
// API answered 422, so a two-character term surfaced as an error rather than as "keep typing".
const MIN_TERM_LENGTH = 3;
const DEBOUNCE_MS = 350;

export function useDebouncedValue<T>(value: T, delay = DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export interface UseGlobalSearchOptions {
  perGroup?: number;
  debounceMs?: number;
}

/**
 * Debounced global search. Only fires once the trimmed term is >= 2 chars.
 * Pass the raw (undebounced) input value; the hook debounces internally.
 */
export function useGlobalSearch(rawTerm: string, options: UseGlobalSearchOptions = {}) {
  const { perGroup, debounceMs } = options;
  const debouncedTerm = useDebouncedValue(rawTerm, debounceMs);
  const term = debouncedTerm.trim();
  const enabled = term.length >= MIN_TERM_LENGTH;

  const queryResult = useQuery({
    queryKey: searchKeys.query(term, perGroup),
    queryFn: () => searchGlobal({ q: term, perGroup }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  return {
    ...queryResult,
    /** true while the debounced term is settling or below the minimum length. */
    isTermTooShort: term.length > 0 && term.length < MIN_TERM_LENGTH,
    isEnabled: enabled,
    debouncedTerm: term,
  };
}
