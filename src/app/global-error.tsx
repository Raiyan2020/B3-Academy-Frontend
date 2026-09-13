'use client';

import { useEffect } from 'react';
import './globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">Error</p>
            <h1 className="mb-3 text-3xl font-bold text-slate-900">Something went wrong</h1>
            <p className="mb-6 text-slate-600">An unexpected error occurred. Please try again.</p>
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
