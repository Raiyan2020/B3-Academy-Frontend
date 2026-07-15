'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AccountStatusBadge } from './status-badge';
import { getAdminUser, updateAdminUser, updateAdminUserStatus } from '../services/admin-users.service';
import { UserRole } from '@/features/auth/types/auth.types';
import type { AccountStatus } from '@/features/auth/types/auth.types';
import { useLanguage } from '../../../../LanguageContext';
import { PhoneInput } from '@/components/ui/phone-input';

const editableStatuses: AccountStatus[] = ['active', 'inactive', 'blocked'];

export function AdminUserEditPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const initial = useMemo(() => getAdminUser(params.userId), [params.userId]);
  const [name, setName] = useState(initial?.user.name ?? '');
  const [email, setEmail] = useState(initial?.user.email ?? '');
  const [phone, setPhone] = useState(initial?.user.phone ?? '');
  const [role, setRole] = useState<UserRole>(initial?.user.role ?? UserRole.STUDENT);
  const [status, setStatus] = useState<AccountStatus>(initial?.status ?? 'active');
  const [message, setMessage] = useState<string | null>(null);

  if (!initial) {
    return (
      <>
        <AdminPageHeader title={isAr ? 'المستخدم غير موجود' : 'User not found'} />
        <Link href="/admin/users" className="text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'العودة للقائمة' : 'Back to list'}
        </Link>
      </>
    );
  }

  const saveIdentity = () => {
    updateAdminUser(initial.user.id, { name, email, phone, role });
    setMessage(isAr ? 'تم حفظ البيانات.' : 'Identity saved.');
  };

  const applyStatus = (next: AccountStatus) => {
    updateAdminUserStatus(initial.user.id, next);
    setStatus(next);
    setMessage(isAr ? 'تم تحديث حالة الحساب.' : 'Account status updated.');
  };

  return (
    <>
      <AdminPageHeader
        title={isAr ? 'تعديل المستخدم' : 'Edit user'}
        description={initial.user.email}
        actions={
          <Link href={`/admin/users/${initial.user.id}`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
            {isAr ? 'عرض التفاصيل' : 'View details'}
          </Link>
        }
      />
      {message && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            saveIdentity();
          }}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="font-bold text-slate-950">{isAr ? 'الهوية' : 'Identity'}</h2>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              {isAr ? 'الاسم' : 'Name'}
              <input required value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              {isAr ? 'البريد' : 'Email'}
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 font-normal" dir="ltr" />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              {isAr ? 'الهاتف' : 'Phone'}
              <PhoneInput
                international
                defaultCountry="SA"
                value={phone}
                onChange={(value) => setPhone(value || '')}
                className="font-normal"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              {isAr ? 'الدور' : 'Role'}
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="rounded-md border border-slate-300 px-3 py-2 font-normal">
                <option value={UserRole.STUDENT}>{isAr ? 'طالب' : 'Student'}</option>
                <option value={UserRole.DOCTOR}>{isAr ? 'طبيب' : 'Doctor'}</option>
                <option value={UserRole.ADMIN}>{isAr ? 'مسؤول' : 'Admin'}</option>
              </select>
            </label>
          </div>
          <button type="submit" className="mt-5 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800">
            {isAr ? 'حفظ' : 'Save'}
          </button>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-950">{isAr ? 'حالة الحساب' : 'Account status'}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {isAr ? 'الحالة الحالية:' : 'Current status:'}{' '}
            <AccountStatusBadge status={status} />
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {editableStatuses.map((option) => (
              <button
                key={option}
                type="button"
                disabled={status === option}
                onClick={() => applyStatus(option)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {option === 'active' ? (isAr ? 'تفعيل' : 'Activate') : option === 'inactive' ? (isAr ? 'تعطيل' : 'Deactivate') : isAr ? 'حظر' : 'Block'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              applyStatus('deleted');
              router.push('/admin/users');
            }}
            className="mt-6 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            {isAr ? 'وضع علامة محذوف' : 'Mark as deleted'}
          </button>
        </div>
      </div>
    </>
  );
}
