 'use client';

import React, { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { Button } from '../../../../components/UI';
import { useNavigate } from '@/lib/routing/next-router-compat';
import { useLanguage } from '../../../../LanguageContext';
import { consumePendingIntent, readPendingIntent } from '@/features/access/services/pending-intent.service';
import { PhoneInput } from '@/components/ui/phone-input';
import { PasswordInput } from '@/components/ui/password-input';
import { VerificationCodeInput } from '@/components/ui/verification-code-input';
import { X, Check } from 'lucide-react';
import { validatePasswordStrength } from '@/features/auth/password-rules';
import { useOtpResend } from '@/features/auth/hooks/use-otp-resend';

const passwordError = (value: string, rtl: boolean) => validatePasswordStrength(value, rtl);

export const Auth: React.FC<{ isDialog?: boolean; onClose?: () => void }> = ({ isDialog = false, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmRegisterPassword, setConfirmRegisterPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const {
    login,
    register,
    verifyRegistration,
    resendVerificationCode,
    forgotPassword,
    verifyForgotPassword,
    resetPassword,
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { t, dir } = useLanguage();

  const navigateAfterAuth = () => {
    const intent = readPendingIntent();
    if (intent?.href) {
      navigate(intent.href);
      consumePendingIntent(intent.id);
      return;
    }
    navigate('/dashboard');
  };

  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const registerOtpResend = useOtpResend();
  const resetOtpResend = useOtpResend();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!isLogin && !acceptedTerms) {
        setAuthError(dir === 'rtl' ? 'يجب الموافقة على الشروط والأحكام قبل إنشاء الحساب.' : 'You must accept the terms and conditions before creating an account.');
        return;
    }
    if (!isLogin && !phone) {
        setAuthError(dir === 'rtl' ? 'رقم الهاتف مطلوب.' : 'Phone number is required.');
        return;
    }
    if (!isLogin) {
      const issue = passwordError(password, dir === 'rtl');
      if (issue) { setAuthError(issue); return; }
    }
    if (!isLogin && password !== confirmRegisterPassword) {
        setAuthError(dir === 'rtl' ? 'كلمة المرور وتأكيدها غير متطابقين.' : 'Password and confirmation do not match.');
        return;
    }
    setLoading(true);
    if (isLogin) {
      const result = await login(email, password);
      setLoading(false);
      if (result.ok) {
        navigateAfterAuth();
        return;
      }
      const failureCode = 'code' in result ? result.code : 'invalid_credentials';

      if (failureCode === 'inactive') {
        registerOtpResend.triggerResend();
        setVerifyOtp('');
        setOtpError(null);
        setIsVerifyModalOpen(true);
        return;
      }

      setAuthError(
        failureCode === 'blocked'
          ? (dir === 'rtl' ? 'هذا الحساب محظور.' : 'This account is blocked.')
          : failureCode === 'deleted'
            ? (dir === 'rtl' ? 'تم حذف هذا الحساب.' : 'This account was deleted.')
            : (dir === 'rtl' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Invalid email or password.'),
      );
      return;
    }

    const result = await register(name, email, password, phone);
    setLoading(false);
    if (result.ok) {
      registerOtpResend.triggerResend();
      setVerifyOtp('');
      setOtpError(null);
      setIsVerifyModalOpen(true);
      return;
    }
    const failureCode = 'code' in result ? result.code : 'invalid_credentials';

    setAuthError(
      failureCode === 'duplicate_email'
        ? (dir === 'rtl' ? 'البريد الإلكتروني مستخدم بالفعل.' : 'An account with this email already exists.')
        : (dir === 'rtl' ? 'فشل إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.' : 'Failed to create account. Check your details and try again.'),
    );
  };

  const formWrapper = (
    <div className="p-8 w-full relative">
      {isDialog && onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600 rtl:left-4 rtl:right-auto"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      )}
      <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">{isLogin ? t('auth.welcome_back') : t('auth.create_account')}</h2>
          <p className="text-slate-500 text-sm">{t('auth.join_community')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
              <>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.name')}</label>
                    <input 
                        required
                        type="text" 
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.phone')}</label>
                    <PhoneInput
                        international
                        defaultCountry="SA"
                        value={phone}
                        onChange={(value) => setPhone(value || '')}
                        className="w-full"
                    />
                </div>
              </>
          )}
          <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.email')}</label>
              <input 
                  required
                  type="email" 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
              />
          </div>
          <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.password')}</label>
              <PasswordInput
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  showPasswordLabel={dir === 'rtl' ? 'إظهار كلمة المرور' : 'Show password'}
                  hidePasswordLabel={dir === 'rtl' ? 'إخفاء كلمة المرور' : 'Hide password'}
              />
              {isLogin && (
                  <div className="flex justify-end mt-2">
                      <button
                          type="button"
                          onClick={() => setIsResetModalOpen(true)}
                          className="text-sm text-emerald-600 hover:underline font-medium"
                      >
                          {dir === 'rtl' ? 'نسيت كلمة المرور؟' : 'Forgot your password?'}
                      </button>
                  </div>
              )}
          </div>
          
          {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {dir === 'rtl' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </label>
                  <PasswordInput
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={confirmRegisterPassword}
                    onChange={(e) => setConfirmRegisterPassword(e.target.value)}
                    showPasswordLabel={dir === 'rtl' ? 'إظهار كلمة المرور' : 'Show password'}
                    hidePasswordLabel={dir === 'rtl' ? 'إخفاء كلمة المرور' : 'Hide password'}
                  />
                  {confirmRegisterPassword && password !== confirmRegisterPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {dir === 'rtl' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'}
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-3 mt-2">
                    <input
                        id="terms-accept"
                        type="checkbox"
                        required
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                    />
                    <label htmlFor="terms-accept" className="text-sm text-slate-600 cursor-pointer">
                        {dir === 'rtl' ? (
                          <>
                            أوافق على{' '}
                            <a href="/terms" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">الشروط والأحكام</a>
                            {' '}و{' '}
                            <a href="/privacy" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">سياسة الخصوصية</a>
                          </>
                        ) : (
                          <>
                            I agree to the{' '}
                            <a href="/terms" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">Terms</a>
                            {' '}and{' '}
                            <a href="/privacy" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                          </>
                        )}
                    </label>
                </div>
              </>
          )}
          
          {authError && (
              <p className="text-sm text-red-600 font-medium py-1">
                  {authError}
              </p>
          )}

          <Button type="submit" className="w-full mt-4" isLoading={loading}>
              {isLogin ? t('auth.signin') : t('auth.register')}
          </Button>
      </form>

      <div className="mt-6 text-center text-sm">
          <span className="text-slate-600">{isLogin ? t('auth.no_account') : t('auth.has_account')}</span>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="mx-2 font-bold text-emerald-600 hover:underline"
          >
              {isLogin ? t('auth.register') : t('auth.signin')}
          </button>
      </div>

      <div className="mt-4 text-center">
          <button 
            onClick={() => {
              if (isDialog && onClose) onClose();
              else navigate('/');
            }}
            className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors"
          >
              {dir === 'rtl' ? 'المتابعة كضيف' : 'Continue as Guest'}
          </button>
      </div>
    </div>
  );

  return (
    <>
      {isDialog ? (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative" dir={dir}>
          {formWrapper}
        </div>
      ) : (
        <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4" dir={dir}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col md:flex-row relative">
            {formWrapper}
          </div>
        </div>
      )}

      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-11/12 max-w-md overflow-hidden" dir={dir}>
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">
                {dir === 'rtl' ? 'التحقق من البريد الإلكتروني' : 'Email Verification'}
              </h3>
              <button 
                onClick={() => {
                  setIsVerifyModalOpen(false);
                  setVerifyOtp('');
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 mb-4">
                    {dir === 'rtl' ? 'أدخل رمز التحقق الذي أرسلناه إلى بريدك الإلكتروني.' : 'Enter the verification code we sent to your email.'}
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{dir === 'rtl' ? 'رمز التحقق (OTP)' : 'Verification Code (OTP)'}</label>
                    <VerificationCodeInput
                        value={verifyOtp}
                        onChange={(value) => {
                            setOtpError(null);
                            setVerifyOtp(value);
                        }}
                        invalid={Boolean(otpError)}
                        ariaLabel={dir === 'rtl' ? 'رمز التحقق' : 'Verification code'}
                    />

                  </div>
                  {otpError && (
                    <p className="text-sm text-red-600 font-semibold">{otpError}</p>
                  )}
                  <button
                    type="button"
                    disabled={!registerOtpResend.canResend}
                    onClick={() => {
                      if (registerOtpResend.triggerResend()) {
                        setOtpError(null);
                        void resendVerificationCode(email, 'register').then((result) => {
                          if (!result.ok) {
                            setOtpError(dir === 'rtl' ? 'تعذر إعادة إرسال الرمز.' : 'Could not resend the code.');
                          }
                        });
                      }
                    }}
                    className="w-full text-sm font-semibold text-emerald-700 disabled:text-slate-400"
                  >
                    {registerOtpResend.canResend
                      ? (dir === 'rtl' ? 'إعادة إرسال الرمز' : 'Resend code')
                      : (dir === 'rtl' ? `إعادة الإرسال خلال ${registerOtpResend.cooldown}ث` : `Resend in ${registerOtpResend.cooldown}s`)}
                  </button>
                  <Button
                    className="w-full mt-4" 
                    onClick={() => {
                      setLoading(true);
                      setOtpError(null);
                      void verifyRegistration(email, verifyOtp).then((result) => {
                        setLoading(false);
                        if (result.ok) {
                          setIsVerifyModalOpen(false);
                          navigateAfterAuth();
                        } else {
                          setOtpError(dir === 'rtl' ? 'رمز التحقق غير صحيح أو منتهي الصلاحية.' : 'The verification code is invalid or expired.');
                        }
                      });
                    }}
                    disabled={verifyOtp.length < 6}
                    isLoading={loading}
                  >
                    {dir === 'rtl' ? 'تحقق من الرمز' : 'Verify Code'}
                  </Button>
                </div>
            </div>
          </div>
        </div>
      )}

      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-11/12 max-w-md overflow-hidden" dir={dir}>
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">
                {dir === 'rtl' ? 'إعادة ضبط كلمة المرور' : 'Reset Password'}
              </h3>
              <button 
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetStep(1);
                  setResetEmail('');
                  setResetOtp('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setResetError(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {resetError && (
                <p className="mb-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {resetError}
                </p>
              )}
              {resetStep === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 mb-4">
                    {dir === 'rtl' ? 'أدخل بريدك الإلكتروني لتلقي رمز التحقق.' : 'Enter your email address to receive a verification code.'}
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('auth.email')}</label>
                    <div dir="ltr">
                        <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => {
                              setResetEmail(e.target.value);
                              setResetError(null);
                            }}
                            placeholder="you@example.com"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-left"
                            dir="ltr"
                        />
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => {
                      setLoading(true);
                      void forgotPassword(resetEmail).then((res) => {
                        setLoading(false);
                        if (res.ok) {
                          resetOtpResend.triggerResend();
                          setResetStep(2);
                          setResetError(null);
                        } else {
                          setResetError(dir === 'rtl' ? 'لا يوجد حساب بهذا البريد أو حدث خطأ.' : 'No account exists for this email or an error occurred.');
                        }
                      });
                    }}
                    disabled={!resetEmail}
                  >
                    {dir === 'rtl' ? 'إرسال الرمز' : 'Send Code'}
                  </Button>
                </div>
              )}

              {resetStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 mb-4">
                    {dir === 'rtl' ? 'أدخل رمز التحقق الذي أرسلناه إلى بريدك الإلكتروني.' : 'Enter the verification code we sent to your email address.'}
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{dir === 'rtl' ? 'رمز التحقق (OTP)' : 'Verification Code (OTP)'}</label>
                    <VerificationCodeInput
                        value={resetOtp}
                        onChange={(value) => {
                          setResetOtp(value);
                          setResetError(null);
                        }}
                        invalid={Boolean(resetError)}
                        ariaLabel={dir === 'rtl' ? 'رمز التحقق' : 'Verification code'}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!resetOtpResend.canResend}
                    onClick={() => {
                      if (!resetOtpResend.triggerResend()) return;
                      setResetError(null);
                      void resendVerificationCode(resetEmail, 'forgot_password').then((result) => {
                        if (!result.ok) {
                          setResetError(dir === 'rtl' ? 'تعذر إعادة إرسال الرمز.' : 'Could not resend the code.');
                        }
                      });
                    }}
                    className="w-full text-sm font-semibold text-emerald-700 disabled:text-slate-400"
                  >
                    {resetOtpResend.canResend
                      ? (dir === 'rtl' ? 'إعادة إرسال الرمز' : 'Resend code')
                      : (dir === 'rtl' ? `إعادة الإرسال خلال ${resetOtpResend.cooldown}ث` : `Resend in ${resetOtpResend.cooldown}s`)}
                  </button>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => {
                      setLoading(true);
                      void verifyForgotPassword(resetEmail, resetOtp).then((res) => {
                        setLoading(false);
                        if (res.ok) {
                          setResetStep(3);
                          setResetError(null);
                        } else {
                          setResetError(dir === 'rtl' ? 'رمز التحقق غير صحيح أو منتهي الصلاحية.' : 'The verification code is invalid or expired.');
                        }
                      });
                    }}
                    disabled={resetOtp.length < 6}
                  >
                    {dir === 'rtl' ? 'تحقق من الرمز' : 'Verify Code'}
                  </Button>
                </div>
              )}

              {resetStep === 3 && (
                <div className="space-y-4">
                   <p className="text-sm text-slate-600 mb-4">
                    {dir === 'rtl' ? 'يرجى إدخال كلمة المرور الجديدة وتأكيدها.' : 'Please enter and confirm your new password.'}
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{dir === 'rtl' ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                    <PasswordInput
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        dir="ltr"
                        showPasswordLabel={dir === 'rtl' ? 'إظهار كلمة المرور' : 'Show password'}
                        hidePasswordLabel={dir === 'rtl' ? 'إخفاء كلمة المرور' : 'Hide password'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{dir === 'rtl' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                    <PasswordInput
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        dir="ltr"
                        showPasswordLabel={dir === 'rtl' ? 'إظهار كلمة المرور' : 'Show password'}
                        hidePasswordLabel={dir === 'rtl' ? 'إخفاء كلمة المرور' : 'Hide password'}
                    />
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-sm text-red-500">
                      {dir === 'rtl' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'}
                    </p>
                  )}
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => {
                      const issue = passwordError(newPassword, dir === 'rtl');
                      if (issue) { setResetError(issue); return; }
                      if (newPassword === confirmPassword) {
                        setLoading(true);
                        void resetPassword(resetEmail, newPassword).then((res) => {
                          setLoading(false);
                          if (res.ok) {
                            setResetStep(4);
                            setResetError(null);
                          } else {
                            setResetError(dir === 'rtl' ? 'فشل إعادة ضبط كلمة المرور.' : 'Failed to reset password.');
                          }
                        });
                      }
                    }}
                    disabled={!newPassword || newPassword !== confirmPassword}
                  >
                    {dir === 'rtl' ? 'إعادة ضبط كلمة المرور' : 'Reset Password'}
                  </Button>
                </div>
              )}

              {resetStep === 4 && (
                <div className="space-y-4 text-center py-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
                    <Check size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800">
                    {dir === 'rtl' ? 'تمت بنجاح' : 'Success!'}
                  </h4>
                  <p className="text-slate-600 mb-6">
                    {dir === 'rtl' ? 'تمت إعادة ضبط كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.' : 'Your password has been reset successfully. You can now log in with your new password.'}
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setIsResetModalOpen(false);
                      setResetStep(1);
                      setResetEmail('');
                      setResetOtp('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setResetError(null);
                    }}
                  >
                    {dir === 'rtl' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export { Auth as AuthPage };
