import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">404</p>
        <h1 className="mb-3 text-3xl font-bold text-slate-900">Page not found</h1>
        <p className="mb-6 text-slate-600">The page you requested is not available.</p>
        <Link href="/" className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white">
          Back home
        </Link>
      </div>
    </main>
  );
}
