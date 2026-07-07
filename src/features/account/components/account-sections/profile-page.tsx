'use client';

import { useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuth } from '@/features/auth/auth-provider';
import { findAccountByEmail, MOCK_OTP } from '@/features/auth/auth-storage.service';
import { useOtpResend } from '@/features/auth/hooks/use-otp-resend';
import { isValidEmailFormat } from '@/features/auth/password-rules';
import { AccountShell, InfoRow } from '../account-shell';
import { ImageUpload } from '@/components/ui/image-upload';
import { SubmitButton } from '@/components/ui/submit-button';
import { getErrorMessage, toastError, toastSuccess } from '@/lib/feedback/toast';
import { useBackendEmailChange, useBackendProfile, useUpdateBackendProfile } from '../../hooks/use-account-api';

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [pendingEmail, setPendingEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const otpResend = useOtpResend();
  const backendProfile = useBackendProfile();
  const updateBackendProfile = useUpdateBackendProfile();
  const emailChange = useBackendEmailChange();
  const hasBackendProfile = backendProfile.isFetched && !backendProfile.isError;

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      if (hasBackendProfile) {
        const nextUser = await updateBackendProfile.mutateAsync({ name, phone });
        updateProfile({ name: nextUser.name, phone: nextUser.phone, avatar: nextUser.avatar });
        toastSuccess('Profile saved.');
        return;
      }
      updateProfile({ name, phone, avatar: avatarPreview || undefined });
      toastSuccess('تم حفظ بيانات الحساب.');
    } catch (error) {
      toastError(getErrorMessage(error, 'Unable to save profile.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (next: string) => {
    setAvatarPreview(next);
    if (!next && (avatarPreview || user?.avatar)) {
      updateProfile({ avatar: '' });
      toastSuccess('تمت إزالة صورة الحساب.');
    }
  };

  const sendOtp = async () => {
    if (!pendingEmail) return;
    if (!isValidEmailFormat(pendingEmail)) {
      setOtpError('صيغة البريد الإلكتروني غير صالحة.');
      return;
    }
    const existing = findAccountByEmail(pendingEmail);
    if (existing && existing.user.id !== user?.id) {
      setOtpError('البريد الإلكتروني مستخدم بالفعل في حساب آخر.');
      return;
    }
    setOtp('');
    setOtpError('');
    if (hasBackendProfile) {
      try {
        await emailChange.send.mutateAsync(pendingEmail);
      } catch (error) {
        setOtpError(getErrorMessage(error, 'Unable to send verification code.'));
        return;
      }
    } else {
      otpResend.triggerResend();
    }
    setOtpOpen(true);
    toastSuccess('تم إرسال رمز التحقق إلى البريد الجديد.');
  };

  const resendOtp = async () => {
    if (hasBackendProfile) {
      try {
        await emailChange.resend.mutateAsync(pendingEmail);
      } catch (error) {
        setOtpError(getErrorMessage(error, 'Unable to resend verification code.'));
        return;
      }
    } else if (!otpResend.triggerResend()) return;
    setOtpError('');
    toastSuccess('تم إعادة إرسال رمز التحقق.');
  };

  const confirmEmail = async () => {
    if (!pendingEmail) return;
    if (hasBackendProfile) {
      try {
        const nextUser = await emailChange.verify.mutateAsync({ email: pendingEmail, code: otp });
        updateProfile({ email: nextUser.email });
        setPendingEmail('');
        setOtp('');
        setOtpOpen(false);
        setOtpError('');
        toastSuccess('Email updated.');
      } catch (error) {
        setOtpError(getErrorMessage(error, 'Invalid or expired verification code.'));
      }
      return;
    }
    if (otp !== MOCK_OTP) {
      setOtpError('رمز التحقق غير صحيح أو منتهي الصلاحية.');
      return;
    }
    updateProfile({ email: pendingEmail });
    setPendingEmail('');
    setOtp('');
    setOtpOpen(false);
    setOtpError('');
    toastSuccess('تم تحديث البريد الإلكتروني بعد التحقق.');
  };

  return (
    <AccountShell title="البيانات الشخصية" description="عرض وتعديل بيانات الحساب. تغيير البريد يحتاج إلى OTP قبل اعتماده.">
      <div className="grid gap-4 md:grid-cols-2">
        <InfoRow label="الاسم" value={user?.name} />
        <InfoRow label="البريد الإلكتروني" value={user?.email} />
        <InfoRow label="رقم الهاتف" value={user?.phone || 'غير مضاف'} />
        <InfoRow label="صورة الحساب" value={avatarPreview || user?.avatar ? 'مضافة' : 'غير مضافة'} />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-950">صورة الحساب</h2>
        <ImageUpload
          value={avatarPreview || user?.avatar}
          onChange={handleAvatarChange}
          uploadLabel="رفع صورة"
          removeLabel="إزالة الصورة"
          previewClassName="rounded-full"
        />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-950">تعديل البيانات الأساسية</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="الاسم" className="rounded-md border border-slate-300 px-3 py-2" />
          <PhoneInput
            international
            defaultCountry="SA"
            value={phone}
            onChange={(value) => setPhone(value || '')}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <SubmitButton type="button" onClick={saveProfile} disabled={!name} isPending={isSaving} label="حفظ البيانات" pendingLabel="جاري الحفظ…" className="mt-4" />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-950">تغيير البريد الإلكتروني</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={pendingEmail}
            onChange={(event) => { setPendingEmail(event.target.value); setOtpError(''); }}
            placeholder="new@example.com"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2"
            dir="ltr"
          />
          <button onClick={sendOtp} disabled={!pendingEmail} className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
            إرسال OTP
          </button>
        </div>
        {otpOpen && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-emerald-700">أدخل رمز التحقق المرسل إلى البريد الجديد.</p>
            <input
              value={otp}
              onChange={(event) => { setOtp(event.target.value); setOtpError(''); }}
              placeholder="رمز OTP"
              className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-center tracking-widest"
              dir="ltr"
            />
            {otpError && <p className="text-sm font-semibold text-red-700">{otpError}</p>}
            <div className="flex flex-wrap gap-3">
              <button onClick={confirmEmail} className="rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700">
                تأكيد البريد
              </button>
              <button
                type="button"
                disabled={!otpResend.canResend}
                onClick={resendOtp}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                {otpResend.canResend ? 'إعادة إرسال الرمز' : `إعادة الإرسال خلال ${otpResend.cooldown}ث`}
              </button>
            </div>
          </div>
        )}
      </div>
    </AccountShell>
  );
}
