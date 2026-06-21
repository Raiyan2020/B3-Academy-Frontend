'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { AccountShell, InfoRow } from '../account-shell';

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpOpen, setOtpOpen] = useState(false);
  const [message, setMessage] = useState('');

  const saveProfile = () => {
    updateProfile({ name, phone });
    setMessage('تم حفظ بيانات الحساب.');
  };

  const confirmEmail = () => {
    if (!pendingEmail) return;
    updateProfile({ email: pendingEmail });
    setPendingEmail('');
    setOtpOpen(false);
    setMessage('تم تحديث البريد الإلكتروني بعد التحقق المحلي.');
  };

  return (
    <AccountShell title="البيانات الشخصية" description="عرض وتعديل بيانات الحساب. تغيير البريد يحتاج إلى OTP قبل اعتماده.">
      {message && <p className="mb-5 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <InfoRow label="الاسم" value={user?.name} />
        <InfoRow label="البريد الإلكتروني" value={user?.email} />
        <InfoRow label="رقم الهاتف" value={user?.phone || 'غير مضاف'} />
        <InfoRow label="صورة الحساب" value={user?.avatar ? 'مضافة' : 'غير مضافة'} />
      </div>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-950">تعديل البيانات الأساسية</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="الاسم" className="rounded-md border border-slate-300 px-3 py-2" />
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="رقم الهاتف" className="rounded-md border border-slate-300 px-3 py-2" dir="ltr" />
        </div>
        <button onClick={saveProfile} disabled={!name} className="mt-4 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
          حفظ البيانات
        </button>
      </div>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-950">تغيير البريد الإلكتروني</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={pendingEmail}
            onChange={(event) => setPendingEmail(event.target.value)}
            placeholder="new@example.com"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2"
            dir="ltr"
          />
          <button onClick={() => setOtpOpen(Boolean(pendingEmail))} className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white">
            إرسال OTP
          </button>
        </div>
        {otpOpen && <p className="mt-3 text-sm text-emerald-700">تم إنشاء خطوة تحقق للبريد الجديد. اربطها بخدمة OTP الخلفية عند توفرها.</p>}
        {otpOpen && (
          <button onClick={confirmEmail} className="mt-3 rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700">
            تأكيد البريد محلياً
          </button>
        )}
      </div>
    </AccountShell>
  );
}
