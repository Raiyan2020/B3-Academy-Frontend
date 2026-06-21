'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { AccountShell } from '../account-shell';

export function PasswordPage() {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const canSubmit = currentPassword && newPassword.length >= 6 && newPassword === confirmPassword;

  const submit = () => {
    const ok = changePassword({ currentPassword, newPassword });
    setMessage(ok ? 'تم تغيير كلمة المرور محلياً.' : 'تعذر تغيير كلمة المرور. تحقق من البيانات.');
    if (ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <AccountShell title="تغيير كلمة المرور" description="يتطلب تغيير كلمة المرور إدخال كلمة المرور الحالية ثم كلمة مرور جديدة وتأكيدها.">
      <div className="max-w-xl rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid gap-4">
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="كلمة المرور الحالية" className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="كلمة المرور الجديدة" className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="تأكيد كلمة المرور الجديدة" className="rounded-md border border-slate-300 px-3 py-2" />
          {confirmPassword && newPassword !== confirmPassword && <p className="text-sm text-red-600">كلمة المرور الجديدة وتأكيدها غير متطابقين.</p>}
          {message && <p className="text-sm font-semibold text-emerald-700">{message}</p>}
          <button onClick={submit} disabled={!canSubmit} className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
            حفظ كلمة المرور
          </button>
        </div>
      </div>
    </AccountShell>
  );
}
