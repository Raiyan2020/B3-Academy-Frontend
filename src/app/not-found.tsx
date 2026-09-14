'use client';

import Link from 'next/link';
import { SitePage } from './client-page';
import { useLanguage } from '../../LanguageContext';

export default function NotFound() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <SitePage>
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">404</p>
          <h1 className="mb-3 text-3xl font-bold text-slate-900">
            {isAr ? 'الصفحة غير موجودة' : 'Page not found'}
          </h1>
          <p className="mb-6 text-slate-600">
            {isAr ? 'الصفحة التي طلبتها غير متاحة.' : 'The page you requested is not available.'}
          </p>
          <Link href="/" className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white">
            {isAr ? 'العودة للرئيسية' : 'Back home'}
          </Link>
        </div>
      </main>
    </SitePage>
  );
}
