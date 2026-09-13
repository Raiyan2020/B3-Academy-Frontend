import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

// Unmount rendered trees between tests. Without this the DOM accumulates across
// `it` blocks in a file, so `getBy*` queries hit "found multiple elements" as soon
// as two tests in one file render the same label — which previously forced at least
// one test file (courses/ui/course-flows.test.tsx) to call `cleanup()` by hand.
// Vitest does not enable React Testing Library's auto-cleanup on its own.
afterEach(() => {
  cleanup();
});
