'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';

export function DoctorShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const pathname = usePathname();
  const isAr = language === 'ar';

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{isAr ? 'بوابة الطبيب' : 'Doctor portal'}</p>
            <h1 className="text-2xl font-bold text-slate-950">{user?.name}</h1>
          </div>
          <nav className="flex gap-2">
            <Link href="/doctor" className={`rounded-md px-3 py-2 text-sm font-semibold ${pathname === '/doctor' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'}`}>
              {isAr ? 'المواعيد' : 'Appointments'}
            </Link>
            <Link href="/" className="rounded-md px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
              {isAr ? 'الموقع' : 'Site'}
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
