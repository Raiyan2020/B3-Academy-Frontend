'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { createAdminUser } from '../services/admin-users.service';
import { UserRole } from '@/features/auth/types/auth.types';
import type { AccountStatus } from '@/features/auth/types/auth.types';
import { useLanguage } from '../../../../LanguageContext';

const passwordError = (value: string, isAr: boolean) => {
  if (value.length < 8 || !/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9!@#$%^&*]/.test(value)) {
    return isAr
      ? 'يجب أن تتكون كلمة المرور من 8 أحرف وتتضمن حرفاً كبيراً وصغيراً ورقماً أو رمزاً.'
      : 'Password must be 8+ characters with upper/lower case and a number or symbol.';
  }
  return null;
};

export function AdminUserNewPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [status, setStatus] = useState<AccountStatus>('active');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const issue = passwordError(password, isAr);
    if (issue) {
      setError(issue);
      return;
    }
    const result = createAdminUser({ name, email, phone, password, role, status });
    if (result.ok === false) {
      setError(
        result.code === 'duplicate_email'
          ? isAr
            ? 'البريد الإلكتروني مستخدم بالفعل.'
            : 'An account with this email already exists.'
          : isAr
            ? 'تعذر إنشاء الحساب.'
            : 'Could not create account.',
      );
      return;
    }
    router.push(`/admin/users/${result.value.id}`);
  };

  return (
    <>
      <AdminPageHeader
        title={isAr ? 'إضافة مستخدم' : 'Add user'}
        description={isAr ? 'إنشاء حساب جديد على المنصة.' : 'Create a new platform account.'}
        actions={
          <Link href="/admin/users" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
            {isAr ? 'إلغاء' : 'Cancel'}
          </Link>
        }
      />
      <form onSubmit={submit} className="max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            {isAr ? 'الاسم' : 'Name'}
            <input required value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            {isAr ? 'البريد الإلكتروني' : 'Email'}
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 font-normal" dir="ltr" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            {isAr ? 'الهاتف' : 'Phone'}
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 font-normal" dir="ltr" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            {isAr ? 'كلمة المرور' : 'Password'}
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 font-normal" dir="ltr" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            {isAr ? 'الدور' : 'Role'}
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="rounded-md border border-slate-300 px-3 py-2 font-normal">
              <option value={UserRole.STUDENT}>{isAr ? 'طالب' : 'Student'}</option>
              <option value={UserRole.DOCTOR}>{isAr ? 'طبيب' : 'Doctor'}</option>
              <option value={UserRole.ADMIN}>{isAr ? 'مسؤول' : 'Admin'}</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            {isAr ? 'الحالة' : 'Status'}
            <select value={status} onChange={(e) => setStatus(e.target.value as AccountStatus)} className="rounded-md border border-slate-300 px-3 py-2 font-normal">
              <option value="active">{isAr ? 'نشط' : 'Active'}</option>
              <option value="inactive">{isAr ? 'غير نشط' : 'Inactive'}</option>
              <option value="blocked">{isAr ? 'محظور' : 'Blocked'}</option>
            </select>
          </label>
        </div>
        {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
        <button type="submit" className="mt-6 rounded-md bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800">
          {isAr ? 'إنشاء الحساب' : 'Create account'}
        </button>
      </form>
    </>
  );
}
