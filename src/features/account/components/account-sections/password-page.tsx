'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { getPasswordStrengthLabel, getPasswordStrengthScore, validatePasswordStrength } from '@/features/auth/password-rules';
import { AccountShell } from '../account-shell';
import { PasswordInput } from '@/components/ui/password-input';

export function PasswordPage() {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const strengthScore = getPasswordStrengthScore(newPassword);
  const strengthLabel = getPasswordStrengthLabel(strengthScore, true);
  const passwordIssue = newPassword ? validatePasswordStrength(newPassword, true) : null;
  const canSubmit =
    currentPassword &&
    !passwordIssue &&
    newPassword === confirmPassword;

  const submit = () => {
    if (passwordIssue) {
      setMessage(passwordIssue);
      return;
    }
    const ok = changePassword({ currentPassword, newPassword });
    setMessage(ok ? 'تم تغيير كلمة المرور.' : 'تعذر تغيير كلمة المرور. تحقق من البيانات.');
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
          <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="كلمة المرور الحالية" />
          <div>
            <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="كلمة المرور الجديدة" />
            {newPassword && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 flex-1 rounded-full ${strengthScore >= step ? 'bg-emerald-600' : 'bg-slate-200'}`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-600">قوة كلمة المرور: {strengthLabel}</p>
              </div>
            )}
            {passwordIssue && <p className="mt-1 text-sm text-red-600">{passwordIssue}</p>}
          </div>
          <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="تأكيد كلمة المرور الجديدة" />
          {confirmPassword && newPassword !== confirmPassword && <p className="text-sm text-red-600">كلمة المرور الجديدة وتأكيدها غير متطابقين.</p>}
          {message && <p className={`text-sm font-semibold ${message.includes('تعذر') ? 'text-red-700' : 'text-emerald-700'}`}>{message}</p>}
          <button onClick={submit} disabled={!canSubmit} className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
            حفظ كلمة المرور
          </button>
        </div>
      </div>
    </AccountShell>
  );
}
