import React, { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { Button } from '../../../../components/UI';
import { useNavigate } from '@/lib/routing/next-router-compat';
import { useLanguage } from '../../../../LanguageContext';
import { consumePendingIntent, readPendingIntent } from '@/features/access/services/pending-intent.service';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { X, Check } from 'lucide-react';
import { findAccountByEmail, MOCK_OTP, resetStoredPassword } from '@/features/auth/auth-storage.service';
import { validatePasswordStrength } from '@/features/auth/password-rules';
import { useOtpResend } from '@/features/auth/hooks/use-otp-resend';
import { UserRole } from '../../../../types';
import type { User } from '../../../../types';

const passwordError = (value: string, rtl: boolean) => validatePasswordStrength(value, rtl);

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmRegisterPassword, setConfirmRegisterPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { t, dir } = useLanguage();

  const navigateAfterAuth = (authenticatedUser?: User) => {
    const intent = readPendingIntent();
    if (intent?.href) {
      navigate(intent.href);
      consumePendingIntent(intent.id);
      return;
    }
    if (authenticatedUser?.role === UserRole.ADMIN) {
      navigate('/admin/users');
      return;
    }
    if (authenticatedUser?.role === UserRole.DOCTOR) {
      navigate('/doctor');
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
      if (findAccountByEmail(email)) { setAuthError(dir === 'rtl' ? 'البريد الإلكتروني مستخدم بالفعل.' : 'An account with this email already exists.'); return; }
    }
    if (!isLogin && password !== confirmRegisterPassword) {
        setAuthError(dir === 'rtl' ? 'كلمة المرور وتأكيدها غير متطابقين.' : 'Password and confirmation do not match.');
        return;
    }
    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
        setLoading(false);
        if (isLogin) {
            const result = login(email, password);
            if (result.ok) {
              navigateAfterAuth(result.value);
            } else {
              const code = 'code' in result ? result.code : 'invalid_credentials';
              setAuthError(code === 'blocked' ? (dir === 'rtl' ? 'هذا الحساب محظور.' : 'This account is blocked.') : code === 'deleted' ? (dir === 'rtl' ? 'تم حذف هذا الحساب.' : 'This account was deleted.') : code === 'inactive' ? (dir === 'rtl' ? 'هذا الحساب غير نشط.' : 'This account is inactive.') : (dir === 'rtl' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Invalid email or password.'));
            }
        } else {
            registerOtpResend.triggerResend();
            setIsVerifyModalOpen(true);
        }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4" dir={dir}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col md:flex-row">
          <div className="p-8 w-full">
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
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent"
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
                      <input 
                          required
                          type="password" 
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
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
                          <input
                            required
                            type="password"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            value={confirmRegisterPassword}
                            onChange={(e) => setConfirmRegisterPassword(e.target.value)}
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
                    onClick={() => navigate('/')}
                    className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors"
                  >
                      {dir === 'rtl' ? 'المتابعة كضيف' : 'Continue as Guest'}
                  </button>
              </div>
          </div>
      </div>

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
                    <input 
                        type="text" 
                        inputMode="numeric"
                        className="w-full text-center tracking-[0.5em] text-lg px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        value={verifyOtp}
                        onChange={(e) => {
                            setOtpError(null);
                            setVerifyOtp(e.target.value);
                        }}
                        dir="ltr"
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
                      if (verifyOtp === MOCK_OTP) {
                        setIsVerifyModalOpen(false);
                        const result = register(name, email, password, phone);
                        if (result.ok) navigateAfterAuth(result.value);
                      } else {
                        setOtpError(dir === 'rtl' ? 'رمز التحقق غير صحيح أو منتهي الصلاحية.' : 'The verification code is invalid or expired.');
                      }
                    }}
                    disabled={verifyOtp.length < 4}
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
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
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
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-left"
                            dir="ltr"
                        />
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => {
                      if (findAccountByEmail(resetEmail)) {
                        resetOtpResend.triggerResend();
                        setResetStep(2);
                      } else setAuthError(dir === 'rtl' ? 'لا يوجد حساب بهذا البريد.' : 'No account exists for this email.');
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
                    <input 
                        type="text" 
                        inputMode="numeric"
                        className="w-full text-center tracking-[0.5em] text-lg px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        dir="ltr"
                    />
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => {
                      if (resetOtp === MOCK_OTP) setResetStep(3);
                      else setAuthError(dir === 'rtl' ? 'رمز التحقق غير صحيح أو منتهي الصلاحية.' : 'The verification code is invalid or expired.');
                    }}
                    disabled={resetOtp.length < 4}
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
                    <input 
                        type="password" 
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{dir === 'rtl' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                    <input 
                        type="password" 
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        dir="ltr"
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
                      if (issue) { setAuthError(issue); return; }
                      if (newPassword === confirmPassword && resetStoredPassword(resetEmail, newPassword)) setResetStep(4);
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
    </div>
  );
};
export { Auth as AuthPage };
