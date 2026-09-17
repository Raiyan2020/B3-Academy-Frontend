'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User, UserRole } from '@/types';
import { addNotification } from '@/features/account/services/account-records.service';
import { readStoredUser, saveStoredUser, updateAuthAccount } from './auth-storage.service';
import type { AuthFailureCode, AuthResult } from './types/auth.types';
import { readPendingIntent } from '@/features/access/services/pending-intent.service';
import { requestNewsletterSubscription } from '@/features/newsletter/services/newsletter-storage.service';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import { isSubscriptionActive } from '@/features/subscriptions/services/subscription-access.service';
import type { HealthAssessmentRecord } from '@/features/account/types/account.types';
import type { PaymentRecord } from '@/features/payments/types/payment.types';
import {
  clearStoredApiToken,
  deleteBackendAccount,
  loginWithBackend,
  logoutFromBackend,
  registerWithBackend,
  requestBackendPasswordReset,
  resendBackendCode,
  resetBackendPassword,
  verifyBackendCode,
  verifyBackendPasswordResetCode,
  getStoredApiToken,
} from './services/auth-api.service';
import { useLanguage } from '@/LanguageContext';
import { ApiError } from '@/lib/api/api-error';

interface AuthContextType {
  user: User | null;
  isAuthReady: boolean;
  login: (email: string, pass?: string) => Promise<AuthResult>;
  register: (name: string, email: string, pass?: string, phone?: string) => Promise<AuthResult>;
  verifyRegistration: (email: string, code: string) => Promise<AuthResult>;
  resendVerificationCode: (email: string, type: 'register' | 'forgot_password') => Promise<{ ok: boolean }>;
  forgotPassword: (email: string) => Promise<{ ok: boolean }>;
  verifyForgotPassword: (email: string, code: string) => Promise<{ ok: boolean }>;
  resetPassword: (email: string, pass: string) => Promise<{ ok: boolean }>;
  logout: () => void;
  updateProfile: (input: { name?: string; email?: string; phone?: string; avatar?: string }) => void;
  updateAddresses: (addresses: User['addresses']) => void;
  deleteAccount: (currentPassword: string) => Promise<boolean>;
  purchaseItem: (type: 'course' | 'book', id: string, options?: { silent?: boolean }) => void;
  bookSlot: (slotId: string, type: 'CONSULTATION' | 'FOLLOWUP') => void;
  subscribe: (planId?: string) => void;
  completeCourse: (id: string) => void;
  completeQuiz: (quizId: string) => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
  requireAuthAction: (action?: () => void) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function authFailureCode(error: unknown): AuthFailureCode {
  if (!(error instanceof ApiError)) return 'invalid_credentials';

  const messages = Object.values(error.errors || {}).flat().join(' ').toLowerCase();
  if (messages.includes('blocked') || messages.includes('محظور')) return 'blocked';
  if (messages.includes('deleted') || messages.includes('محذوف')) return 'deleted';
  if (
    Object.hasOwn(error.errors || {}, 'email')
    && (messages.includes('taken') || messages.includes('مستخدم') || messages.includes('مستعمل'))
  ) {
    return 'duplicate_email';
  }
  if (error.status === 404) return 'not_found';

  return 'invalid_credentials';
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!getStoredApiToken()) {
      setUser(null);
      setIsAuthReady(true);
      return;
    }
    const stored = readStoredUser();
    if (stored) stored.role = UserRole.STUDENT;
    if (stored && stored.isSubscribed && !isSubscriptionActive(stored)) {
      const expired = { ...stored, isSubscribed: false };
      saveStoredUser(expired);
      setUser(expired);
      setIsAuthReady(true);
      return;
    }
    setUser(stored);
    setIsAuthReady(true);
  }, []);

  useEffect(() => {
    saveStoredUser(user);
  }, [user]);

  const requireAuthAction = useCallback(
    (action?: () => void) => {
      if (user) {
        action?.();
        return true;
      }
      if (action) setPendingAction(() => action);
      setAuthModalOpen(true);
      return false;
    },
    [user],
  );

  const afterAuth = useCallback((authenticatedUser?: User) => {
    setAuthModalOpen(false);
    const intent = readPendingIntent();
    if (authenticatedUser && intent?.type === 'newsletter.subscribe' && intent.email) {
      const result = requestNewsletterSubscription(authenticatedUser.id, intent.email);
      if ('message' in result) {
        addNotification({
          userId: authenticatedUser.id,
          title: 'تعذر إتمام اشتراك النشرة',
          body: result.message.ar,
        });
      }
    }
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const login = useCallback((email: string, password = ''): Promise<AuthResult> => {
    return loginWithBackend({ email, password, language })
      .then((backendResult): AuthResult => {
        if ('inactiveEmail' in backendResult) {
          return { ok: false, code: 'inactive' } as AuthResult;
        }
        setUser(backendResult.user);
        afterAuth(backendResult.user);
        return { ok: true, value: backendResult.user } as AuthResult;
      })
      .catch((error) => {
        clearStoredApiToken();
        return { ok: false, code: authFailureCode(error) } as AuthResult;
      });
  }, [language, afterAuth]);

  const register = useCallback((name: string, email: string, password = '', phone = ''): Promise<AuthResult> => {
    return registerWithBackend({ name, email, password, phone, language })
      .then((): AuthResult & { requiresVerification?: boolean } => {
        return {
          ok: true,
          value: {
            id: '',
            name,
            email,
            role: UserRole.STUDENT,
            isSubscribed: false,
            purchasedCourseIds: [],
            purchasedBookIds: [],
            addresses: [],
            consultations: [],
          },
          requiresVerification: true,
        };
      })
      .catch((error) => {
        clearStoredApiToken();
        return { ok: false, code: authFailureCode(error) } as AuthResult;
      });
  }, [language]);

  const verifyRegistration = useCallback((email: string, code: string): Promise<AuthResult> => {
    return verifyBackendCode({ email, code, type: 'register', language })
      .then((backendResult): AuthResult => {
        setUser(backendResult.user);
        afterAuth(backendResult.user);
        return { ok: true, value: backendResult.user };
      })
      .catch(() => {
        return { ok: false, code: 'invalid_credentials' };
      });
  }, [language, afterAuth]);

  const resendVerificationCode = useCallback((email: string, type: 'register' | 'forgot_password'): Promise<{ ok: boolean }> => {
    return resendBackendCode({ email, type, language })
      .then(() => ({ ok: true }))
      .catch(() => ({ ok: false }));
  }, [language]);

  const forgotPassword = useCallback((email: string): Promise<{ ok: boolean }> => {
    return requestBackendPasswordReset({ email, language })
      .then(() => ({ ok: true }))
      .catch(() => ({ ok: false }));
  }, [language]);

  const verifyForgotPassword = useCallback((email: string, code: string): Promise<{ ok: boolean }> => {
    return verifyBackendPasswordResetCode({ email, code, language })
      .then(() => ({ ok: true }))
      .catch(() => ({ ok: false }));
  }, [language]);

  const resetPassword = useCallback((email: string, pass: string): Promise<{ ok: boolean }> => {
    return resetBackendPassword({ email, password: pass, language })
      .then(() => ({ ok: true }))
      .catch(() => ({ ok: false }));
  }, [language]);

  const logout = useCallback(() => {
    void logoutFromBackend().catch(() => clearStoredApiToken());
    setUser(null);
  }, []);

  const updateProfile = useCallback((input: { name?: string; email?: string; phone?: string; avatar?: string }) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...input };
      updateAuthAccount(prev.id, input);
      return updated;
    });
  }, []);

  const updateAddresses = useCallback((addresses: User['addresses']) => {
    setUser((prev) => (prev ? { ...prev, addresses } : prev));
  }, []);

  const deleteAccount = useCallback(async (currentPassword: string) => {
    if (!user || !currentPassword) return false;

    try {
      await deleteBackendAccount({ password: currentPassword });
    } catch {
      return false;
    }

    const userId = user.id;

    // 1. Delete health assessment data (personal medical information)
    const HEALTH_ASSESSMENTS_KEY = 'b3-health-assessment-records';
    const allHealth = readLocalStorageJson<HealthAssessmentRecord[]>(HEALTH_ASSESSMENTS_KEY, []);
    writeLocalStorageJson(HEALTH_ASSESSMENTS_KEY, allHealth.filter((item) => item.userId !== userId));

    // 2. Anonymize payments/invoices records (replace personal details to preserve financial totals)
    // NOTE: this key must stay in sync with PAYMENT_RECORDS_KEY in
    // features/payments/services/payments-storage.service.ts. It previously read
    // 'b3-payments-records' (plural "payments"), a key nothing ever wrote, so this
    // entire anonymization step silently no-opped and payment PII survived account
    // deletion. See docs/modernization/audit-vercel-server-client.md
    // (client-localstorage-schema) — the root cause is that every key here is a local
    // string literal rather than a shared registry constant.
    const PAYMENTS_KEY = 'b3-payment-records';
    const allPayments = readLocalStorageJson<PaymentRecord[]>(PAYMENTS_KEY, []);
    const anonymizedPayments = allPayments.map((p) => {
      if (p.userId === userId) {
        return {
          ...p,
          userId: 'ANONYMOUS',
          userName: 'Deleted User',
          // The invoice is left as-is, deliberately. InvoiceRecord is
          // { id, paymentId, issuedAt, downloadUrl, status } — it carries no user-identifying
          // field, and `downloadUrl` is a data: URL built by createInvoiceDataUrl() from
          // invoiceId/paymentId/itemName/amount/currency/method/issuedAt only, with no name
          // or email in the rendered HTML. Verified, not assumed.
          //
          // This previously wrote an `issueDetails: { userName, userEmail }` object. No code
          // anywhere reads or writes that field and it is not on InvoiceRecord, so that was
          // *adding* a fabricated property rather than erasing a real one — anonymization
          // theatre that made this step look more thorough than it was. The PII that actually
          // exists on a payment record is userId and userName above, and those are erased.
        };
      }
      return p;
    });
    writeLocalStorageJson(PAYMENTS_KEY, anonymizedPayments);

    // 3. Drop every per-user record the app has ever written locally. Each of these
    //    arrays is filtered by `userId` alone, so one shape covers all of them; several
    //    keys are now only written by older versions of the app, and clearing them is
    //    still correct for a device that has them.
    const PER_USER_KEYS = [
      'b3-course-enrollments',
      'b3-course-progress',
      'b3-quiz-attempts',
      'b3-book-purchases',
      'b3-care-clinic-booking-records',
      'b3-care-consultation-records',
      'b3-care-trip-records',
      'b3-account-favorites',
      'b3-account-notifications',
      'b3-newsletter-subscriptions',
    ];

    for (const key of PER_USER_KEYS) {
      const records = readLocalStorageJson<{ userId: string }[]>(key, []);
      writeLocalStorageJson(key, records.filter((item) => item.userId !== userId));
    }

    // 4. Backend deletion already succeeded above; clear the local session.
    setUser(null);
    return true;
  }, [user]);

  const subscribe = useCallback((planId?: string) => {
    if (!requireAuthAction()) return;
    const startedAt = new Date();
    const expiryDate = new Date(startedAt);
    if (planId?.includes('monthly')) expiryDate.setMonth(expiryDate.getMonth() + 1);
    else expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    setUser((prev) =>
      prev
        ? {
            ...prev,
            isSubscribed: true,
            subscriptionStartDate: startedAt.toISOString(),
            subscriptionExpiryDate: expiryDate.toISOString(),
          }
        : null,
    );
  }, [requireAuthAction]);

  const purchaseItem = useCallback((type: 'course' | 'book', id: string, options?: { silent?: boolean }) => {
    if (!requireAuthAction()) return;
    setUser((prev) => {
      if (!prev) return null;
      if (type === 'course') {
        if (prev.purchasedCourseIds.includes(id)) return prev;
        return { ...prev, purchasedCourseIds: [...prev.purchasedCourseIds, id] };
      }
      if (prev.purchasedBookIds.includes(id)) return prev;
      return { ...prev, purchasedBookIds: [...prev.purchasedBookIds, id] };
    });
    if (!options?.silent && user) {
      addNotification({
        userId: user.id,
        title: type === 'course' ? 'تمت إضافة الدورة إلى حسابك' : 'تمت إضافة الكتاب إلى حسابك',
        body: 'يمكنك متابعة المحتوى من الحساب الشخصي.',
        href: type === 'course' ? '/dashboard/courses' : '/dashboard/books',
      });
    }
  }, [requireAuthAction, user]);

  const bookSlot = useCallback((slotId: string, type: 'CONSULTATION' | 'FOLLOWUP') => {
    if (!requireAuthAction()) return;
    console.log(`Booked slot ${slotId} for ${type}`);
  }, [requireAuthAction]);

  const completeCourse = useCallback((id: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const completed = prev.completedCourseIds || [];
      if (completed.includes(id)) return prev;
      return { ...prev, completedCourseIds: [...completed, id] };
    });
  }, []);

  const completeQuiz = useCallback((quizId: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const completed = prev.completedQuizIds || [];
      if (completed.includes(quizId)) return prev;
      return { ...prev, completedQuizIds: [...completed, quizId] };
    });
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthReady,
    login,
    register,
    verifyRegistration,
    resendVerificationCode,
    forgotPassword,
    verifyForgotPassword,
    resetPassword,
    logout,
    updateProfile,
    updateAddresses,
    deleteAccount,
    purchaseItem,
    bookSlot,
    subscribe,
    completeCourse,
    completeQuiz,
    isAuthModalOpen,
    setAuthModalOpen,
    requireAuthAction,
  }), [
    user,
    isAuthReady,
    login,
    register,
    verifyRegistration,
    resendVerificationCode,
    forgotPassword,
    verifyForgotPassword,
    resetPassword,
    logout,
    updateProfile,
    updateAddresses,
    deleteAccount,
    purchaseItem,
    bookSlot,
    subscribe,
    completeCourse,
    completeQuiz,
    isAuthModalOpen,
    requireAuthAction,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
