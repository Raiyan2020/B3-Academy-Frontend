'use client';

import type { AccountStatus } from '@/features/auth/types/auth.types';
import { UserRole } from '@/features/auth/types/auth.types';
import { useLanguage } from '../../../../LanguageContext';

const statusStyles: Record<AccountStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-slate-100 text-slate-700',
  blocked: 'bg-red-100 text-red-800',
  deleted: 'bg-orange-100 text-orange-800',
};

const roleStyles: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-800',
  [UserRole.DOCTOR]: 'bg-blue-100 text-blue-800',
  [UserRole.STUDENT]: 'bg-emerald-100 text-emerald-800',
  [UserRole.GUEST]: 'bg-slate-100 text-slate-600',
};

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const labels: Record<AccountStatus, { en: string; ar: string }> = {
    active: { en: 'Active', ar: 'نشط' },
    inactive: { en: 'Inactive', ar: 'غير نشط' },
    blocked: { en: 'Blocked', ar: 'محظور' },
    deleted: { en: 'Deleted', ar: 'محذوف' },
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status]}`}>
      {isAr ? labels[status].ar : labels[status].en}
    </span>
  );
}

export function UserRoleBadge({ role }: { role: UserRole }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const labels: Record<UserRole, { en: string; ar: string }> = {
    [UserRole.ADMIN]: { en: 'Admin', ar: 'مسؤول' },
    [UserRole.DOCTOR]: { en: 'Doctor', ar: 'طبيب' },
    [UserRole.STUDENT]: { en: 'Student', ar: 'طالب' },
    [UserRole.GUEST]: { en: 'Guest', ar: 'زائر' },
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleStyles[role]}`}>
      {isAr ? labels[role].ar : labels[role].en}
    </span>
  );
}
