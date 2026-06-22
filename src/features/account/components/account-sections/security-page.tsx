'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { findAccountById } from '@/features/auth/auth-storage.service';
import { AccountShell } from '../account-shell';

export function SecurityPage() {
  const { logout, user, deleteAccount } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [typedEmail, setTypedEmail] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const accountStatus = user ? findAccountById(user.id)?.status : 'active';
  const isBlocked = accountStatus === 'blocked';

  const removeAccount = () => {
    if (confirmText !== 'DELETE') {
      setError('يجب كتابة DELETE للتأكيد النهائي.');
      return;
    }
    if (typedEmail !== user?.email) {
      setError('يجب كتابة البريد الإلكتروني الحالي للتأكيد.');
      return;
    }
    const ok = deleteAccount(password);
    if (!ok) {
      setError('تعذر حذف الحساب. تحقق من كلمة المرور.');
      return;
    }
    router.push('/');
  };

  return (
    <AccountShell title="تسجيل الخروج وحذف الحساب" description="حذف الحساب نهائي ولا يترتب عليه استرداد أي مبالغ مدفوعة.">
      {isBlocked && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          هذا الحساب محظور حالياً. يمكنك تسجيل الخروج فقط ولن تتمكن من تنفيذ عمليات جديدة حتى يعاد تفعيل الحساب.
        </div>
      )}
      <div className="grid gap-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-950">تسجيل الخروج</h2>
          <p className="mt-2 text-sm text-slate-600">ينهي الجلسة الحالية دون حذف بيانات الحساب.</p>
          <button onClick={() => { logout(); router.push('/'); }} className="mt-4 rounded-md bg-slate-900 px-4 py-2 font-semibold text-white">تسجيل الخروج</button>
        </section>
        <section className="rounded-lg border border-red-200 bg-white p-5">
          <h2 className="font-bold text-red-700">حذف الحساب</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            سيتم فقدان الوصول إلى الحساب والمحتويات والسجلات المرتبطة به. وجود اشتراك أو مشتريات أو حجوزات لا يمنع الحذف ولا يترتب عليه استرداد مالي.
          </p>
          <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={confirmDelete} onChange={(e) => setConfirmDelete(e.target.checked)} className="mt-1" />
            قرأت التحذير وأرغب في المتابعة
          </label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور الحالية" className="mt-4 w-full max-w-md rounded-md border border-slate-300 px-3 py-2" />
          <input type="email" value={typedEmail} onChange={(e) => setTypedEmail(e.target.value)} placeholder="اكتب البريد الإلكتروني للتأكيد" className="mt-3 w-full max-w-md rounded-md border border-slate-300 px-3 py-2" dir="ltr" />
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="اكتب DELETE للتأكيد النهائي"
            className="mt-3 w-full max-w-md rounded-md border border-red-300 px-3 py-2 font-bold tracking-widest"
            dir="ltr"
          />
          {error && <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
          <button
            disabled={!confirmDelete || !password || !typedEmail || isBlocked}
            onClick={removeAccount}
            className="mt-4 rounded-md bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            حذف حساب {user?.email}
          </button>
        </section>
      </div>
    </AccountShell>
  );
}
