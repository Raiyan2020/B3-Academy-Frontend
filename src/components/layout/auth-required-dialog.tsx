'use client';

import { Lock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../LanguageContext';
import { Button } from '../../../components/UI';

export function AuthRequiredDialog() {
  const { isAuthModalOpen, setAuthModalOpen } = useAuth();
  const router = useRouter();
  const { dir } = useLanguage();

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl" dir={dir}>
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600 rtl:left-4 rtl:right-auto"
        >
          <X size={20} />
        </button>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Lock size={32} />
          </div>
          <h3 className="mb-2 text-xl font-bold text-slate-800">
            {dir === 'rtl' ? 'تسجيل الدخول مطلوب' : 'Login Required'}
          </h3>
          <p className="mb-6 text-slate-600">
            {dir === 'rtl'
              ? 'يرجى تسجيل الدخول أو إنشاء حساب للمتابعة.'
              : 'Please sign in or create an account to continue.'}
          </p>
          <Button
            onClick={() => {
              setAuthModalOpen(false);
              router.push('/auth');
            }}
            className="w-full justify-center py-3 text-base"
          >
            {dir === 'rtl' ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}
          </Button>
        </div>
      </div>
    </div>
  );
}
