'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import {
  confirmNewsletterSubscription,
  requestNewsletterSubscription,
  unsubscribeNewsletter,
} from '@/features/newsletter/services/newsletter-storage.service';
import { selectAccountNewsletter } from '../../services/account-selectors.service';
import { AccountShell } from '../account-shell';
import { useLanguage } from '../../../../../LanguageContext';
import { Mail, CheckCircle2, AlertCircle, X, RotateCcw } from 'lucide-react';
import { useBackendNewsletter, useBackendNewsletterActions } from '../../hooks/use-account-api';
import { getErrorMessage } from '@/lib/feedback/toast';

export function NewsletterManagementPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const backendNewsletter = useBackendNewsletter();
  const backendNewsletterActions = useBackendNewsletterActions();
  const backendStatus = backendNewsletter.data;
  const hasBackendNewsletter = backendNewsletter.isFetched && !backendNewsletter.isError;

  const getLatestStatus = () => {
    if (!user) return 'unsubscribed';
    return selectAccountNewsletter(user.id).status;
  };

  const [email, setEmail] = useState(user?.email || '');
  const [status, setStatus] = useState<string>(getLatestStatus);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);

  // OTP Resend Timer State
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (backendStatus) {
      setEmail(backendStatus.email || user?.email || '');
      setStatus(backendStatus.isConfirmed ? 'confirmed' : backendStatus.status || 'pending');
    }
  }, [backendStatus, user?.email]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'pending' && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [status, countdown]);

  const handleRequest = () => {
    if (!user || !email) return;
    setOtpError(null);
    setSuccessMessage(null);
    if (hasBackendNewsletter) {
      void backendNewsletterActions.subscribe.mutateAsync(email).then((record) => {
        setStatus(record.isConfirmed ? 'confirmed' : record.status);
        setCountdown(30);
        setCanResend(false);
        setOtp('');
      }).catch((error) => setOtpError(getErrorMessage(error, t('تعذر طلب الاشتراك.', 'Unable to request subscription.'))));
      return;
    }
    const result = requestNewsletterSubscription(user.id, email);
    if ('message' in result) {
      setOtpError(isAr ? result.message.ar : result.message.en);
      return;
    }
    setStatus(result.record.status);
    setCountdown(30);
    setCanResend(false);
    setOtp('');
  };

  const handleVerify = () => {
    if (!user) return;
    setOtpError(null);
    if (hasBackendNewsletter) {
      void backendNewsletterActions.verify.mutateAsync({ email, code: otp }).then((record) => {
        setStatus(record.isConfirmed ? 'confirmed' : record.status);
        setSuccessMessage(t('تم تأكيد اشتراكك في النشرة البريدية بنجاح!', 'Your newsletter subscription has been confirmed successfully!'));
      }).catch((error) => setOtpError(getErrorMessage(error, t('رمز التحقق غير صحيح أو منتهي الصلاحية.', 'The verification code is invalid or expired.'))));
      return;
    }
    if (otp === '1234') {
      const record = confirmNewsletterSubscription(user.id);
      if (record) {
        setStatus(record.status);
        setSuccessMessage(
          isAr
            ? 'تم تأكيد اشتراكك في النشرة البريدية بنجاح!'
            : 'Your newsletter subscription has been confirmed successfully!'
        );
      }
    } else {
      setOtpError(isAr ? 'رمز التحقق غير صحيح. استخدم الرمز 1234.' : 'Invalid code. Use test code 1234.');
    }
  };

  const handleResend = () => {
    if (!user || !email) return;
    setOtpError(null);
    setCountdown(30);
    setCanResend(false);
    setOtp('');
    if (hasBackendNewsletter) {
      void backendNewsletterActions.resend.mutateAsync().then(() => {
        setSuccessMessage(t('تم إعادة إرسال رمز التأكيد.', 'Confirmation code has been resent.'));
      }).catch((error) => setOtpError(getErrorMessage(error, t('تعذر إعادة إرسال الرمز.', 'Unable to resend the code.'))));
      return;
    }
    const result = requestNewsletterSubscription(user.id, email);
    if ('message' in result) {
      setOtpError(isAr ? result.message.ar : result.message.en);
      return;
    }
    setSuccessMessage(isAr ? 'تم إعادة إرسال رمز التأكيد.' : 'Confirmation code has been resent.');
  };

  const handleUnsubscribe = () => {
    if (!user) return;
    if (hasBackendNewsletter) {
      void backendNewsletterActions.unsubscribe.mutateAsync().then(() => {
        setStatus('unsubscribed');
        setShowUnsubscribeConfirm(false);
        setSuccessMessage(t('تم إلغاء الاشتراك بنجاح.', 'Successfully unsubscribed.'));
      }).catch((error) => setOtpError(getErrorMessage(error, t('تعذر إلغاء الاشتراك.', 'Unable to unsubscribe.'))));
      return;
    }
    const record = unsubscribeNewsletter(user.id);
    setStatus(record?.status || 'unsubscribed');
    setShowUnsubscribeConfirm(false);
    setSuccessMessage(isAr ? 'تم إلغاء الاشتراك بنجاح.' : 'Successfully unsubscribed.');
  };

  const t = (ar: string, en: string) => (isAr ? ar : en);

  return (
    <AccountShell 
      title={t('إدارة النشرة الإلكترونية', 'Newsletter Management')} 
      description={t('إدارة اشتراكك في نشرة B3 البريدية لتلقي آخر الأبحاث والمقالات الطبية الطبيعية.', 'Manage your B3 newsletter subscription to receive the latest research and natural health articles.')}
    >
      <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-150 text-emerald-800 flex items-center gap-2.5 text-sm font-semibold">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Unsubscribed State */}
        {status === 'unsubscribed' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t('أنت غير مشترك حالياً', 'You are not subscribed')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t('اشترك لتلقي أحدث التحديثات والأبحاث.', 'Subscribe to receive the latest updates and research.')}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('البريد الإلكتروني للاشتراك', 'Email Address')}</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-600 text-sm transition-all" 
                dir="ltr" 
                placeholder="name@example.com"
              />
            </div>

            <button 
              onClick={handleRequest} 
              disabled={!email}
              className="w-full rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3 text-sm transition-all shadow-md disabled:opacity-50"
            >
              {t('طلب الاشتراك في النشرة', 'Request Subscription')}
            </button>
          </div>
        )}

        {/* Pending Confirmation State */}
        {status === 'pending' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 shrink-0 animate-pulse">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t('تأكيد البريد الإلكتروني مطلوب', 'Email Confirmation Required')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t(`تم إرسال رمز التحقق إلى ${email}.`, `Verification code sent to ${email}.`)}
                </p>
              </div>
            </div>

            {otpError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-150 text-rose-800 flex items-center gap-2 text-xs font-bold">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{otpError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  {t('رمز التأكيد (رمز الاختبار: 1234)', 'Verification Code (Test Code: 1234)')}
                </label>
                <input 
                  type="text" 
                  value={otp} 
                  onChange={(e) => { setOtp(e.target.value); setOtpError(null); }} 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-600 text-center font-bold tracking-[0.5em] text-lg transition-all" 
                  placeholder="----"
                  maxLength={6}
                />
              </div>

              <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-500">
                {canResend ? (
                  <button onClick={handleResend} className="text-emerald-700 hover:underline flex items-center gap-1">
                    <RotateCcw size={12} />
                    {t('إعادة إرسال الرمز', 'Resend Code')}
                  </button>
                ) : (
                  <span>{t(`إعادة إرسال خلال ${countdown} ثانية`, `Resend in ${countdown}s`)}</span>
                )}
                <span>{t('(رمز الاختبار: 1234)', '(Test code: 1234)')}</span>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleVerify} 
                  disabled={otp.length < 4}
                  className="flex-grow rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3 text-sm transition-all shadow-md disabled:opacity-50"
                >
                  {t('تأكيد الاشتراك', 'Confirm Subscription')}
                </button>
                <button 
                  onClick={() => {
                    const record = unsubscribeNewsletter(user!.id);
                    setStatus(record?.status || 'unsubscribed');
                  }} 
                  className="px-5 rounded-xl border border-slate-350 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all"
                >
                  {t('إلغاء الطلب', 'Cancel Request')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmed State */}
        {status === 'confirmed' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t('اشتراكك مؤكد ونشط', 'Your subscription is active')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t(`تصلك النشرات البريدية حالياً على البريد: ${email}`, `Currently receiving emails at: ${email}`)}
                </p>
              </div>
            </div>

            {showUnsubscribeConfirm ? (
              <div className="p-5 border border-red-200 bg-red-50 rounded-2xl animate-in fade-in duration-200">
                <h4 className="font-bold text-red-900 text-sm mb-2">{t('تأكيد إلغاء الاشتراك', 'Confirm Unsubscribe')}</h4>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  {t('هل أنت متأكد من رغبتك في إلغاء الاشتراك بالنشرة الإخبارية؟ لن تتلقى بعد ذلك أية رسائل تتعلق بالأبحاث الطبية.', 'Are you sure you want to unsubscribe from the newsletter? You will no longer receive updates regarding medicinal research.')}
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={handleUnsubscribe} 
                    className="flex-grow py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    {t('نعم، إلغاء الاشتراك', 'Yes, Unsubscribe')}
                  </button>
                  <button 
                    onClick={() => setShowUnsubscribeConfirm(false)} 
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    {t('تراجع', 'Cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => { setSuccessMessage(null); setShowUnsubscribeConfirm(true); }} 
                className="w-full rounded-xl border border-red-200 hover:bg-red-50 text-red-650 font-bold py-3 text-sm transition-all"
              >
                {t('إلغاء الاشتراك بالنشرة', 'Unsubscribe')}
              </button>
            )}
          </div>
        )}

      </div>
    </AccountShell>
  );
}
