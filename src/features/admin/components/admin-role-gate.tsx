'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { UserRole } from '@/features/auth/types/auth.types';
import { useLanguage } from '../../../../LanguageContext';

export function AdminRoleGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">
            {isAr ? 'تسجيل الدخول مطلوب' : 'Sign in required'}
          </h1>
          <p className="mt-3 text-slate-600">
            {isAr ? 'يرجى تسجيل الدخول للوصول إلى لوحة الإدارة.' : 'Please sign in to access the admin panel.'}
          </p>
          <Link href="/auth" className="mt-6 inline-flex rounded-md bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">
            {isAr ? 'تسجيل الدخول' : 'Sign in'}
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== UserRole.ADMIN) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">
            {isAr ? 'الوصول مرفوض' : 'Access denied'}
          </h1>
          <p className="mt-3 text-slate-600">
            {isAr
              ? 'هذه المنطقة مخصصة لمسؤولي المنصة فقط.'
              : 'This area is restricted to platform administrators.'}
          </p>
          <Link href="/" className="mt-6 inline-flex rounded-md border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">
            {isAr ? 'العودة للرئيسية' : 'Back to home'}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
