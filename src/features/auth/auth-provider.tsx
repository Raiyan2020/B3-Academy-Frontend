'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../../../types';
import { addNotification } from '@/features/account/services/account-records.service';
import { readStoredUser, saveStoredUser } from './auth-storage.service';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass?: string) => void;
  register: (name: string, email: string, pass?: string, phone?: string) => void;
  logout: () => void;
  updateProfile: (input: { name?: string; email?: string; phone?: string; avatar?: string }) => void;
  changePassword: (input: { currentPassword: string; newPassword: string }) => boolean;
  deleteAccount: (currentPassword: string) => boolean;
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

const getMockUser = (email: string): User => {
  const isAdmin = email.toLowerCase() === 'admin@b3.com';
  return {
    id: isAdmin ? 'admin1' : 'u1',
    name: isAdmin ? 'B3 Admin' : 'عمر الدوسري',
    email,
    role: isAdmin ? UserRole.ADMIN : UserRole.STUDENT,
    purchasedCourseIds: [],
    courseInstallments: [],
    completedCourseIds: [],
    completedQuizIds: [],
    purchasedBookIds: [],
    healthAssessmentCompleted: false,
    addresses: [
      {
        id: 'addr-1',
        name: 'المنزل',
        governorate: 'الرياض',
        area: 'العليا',
        block: '1',
        street: 'شارع الملك فهد',
        building: '10',
        isDefault: true,
      }
    ],
    consultations: [],
    trips: [],
    clinicBookings: [],
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(readStoredUser());
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

  const afterAuth = () => {
    setAuthModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const login = (email: string) => {
    setUser(getMockUser(email));
    afterAuth();
  };

  const register = (name: string, email: string) => {
    setUser({
      id: `u-${Date.now()}`,
      name,
      email,
      role: UserRole.STUDENT,
      purchasedCourseIds: [],
      completedCourseIds: [],
      completedQuizIds: [],
      purchasedBookIds: [],
      addresses: [],
      consultations: [],
    });
    afterAuth();
  };

  const logout = () => setUser(null);

  const updateProfile = (input: { name?: string; email?: string; phone?: string; avatar?: string }) => {
    setUser((prev) => (prev ? { ...prev, ...input } : prev));
  };

  const changePassword = (input: { currentPassword: string; newPassword: string }) => {
    if (!user || !input.currentPassword || input.newPassword.length < 6) return false;
    return true;
  };

  const deleteAccount = (currentPassword: string) => {
    if (!user || !currentPassword) return false;
    
    const userId = user.id;

    // 1. Delete health assessment data (personal medical information)
    const HEALTH_ASSESSMENTS_KEY = 'b3-health-assessment-records';
    const allHealth = readLocalStorageJson<any[]>(HEALTH_ASSESSMENTS_KEY, []);
    writeLocalStorageJson(HEALTH_ASSESSMENTS_KEY, allHealth.filter((item) => item.userId !== userId));

    // 2. Anonymize payments/invoices records (replace personal details to preserve financial totals)
    const PAYMENTS_KEY = 'b3-payments-records';
    const allPayments = readLocalStorageJson<any[]>(PAYMENTS_KEY, []);
    const anonymizedPayments = allPayments.map((p) => {
      if (p.userId === userId) {
        return {
          ...p,
          userId: 'ANONYMOUS',
          userName: 'Deleted User',
          invoice: p.invoice ? {
            ...p.invoice,
            issueDetails: {
              ...p.invoice.issueDetails,
              userName: 'Deleted User',
              userEmail: 'anonymous@b3academy.com',
            }
          } : undefined
        };
      }
      return p;
    });
    writeLocalStorageJson(PAYMENTS_KEY, anonymizedPayments);

    // 3. Remove access records, enrollments, purchases, progress, quiz attempts, favorites, notifications, newsletter
    const ENROLLMENTS_KEY = 'b3-course-enrollments';
    const allEnrollments = readLocalStorageJson<any[]>(ENROLLMENTS_KEY, []);
    writeLocalStorageJson(ENROLLMENTS_KEY, allEnrollments.filter((item) => item.userId !== userId));

    const PROGRESS_KEY = 'b3-course-progress';
    const allProgress = readLocalStorageJson<any[]>(PROGRESS_KEY, []);
    writeLocalStorageJson(PROGRESS_KEY, allProgress.filter((item) => item.userId !== userId));

    const QUIZ_ATTEMPTS_KEY = 'b3-quiz-attempts';
    const allQuiz = readLocalStorageJson<any[]>(QUIZ_ATTEMPTS_KEY, []);
    writeLocalStorageJson(QUIZ_ATTEMPTS_KEY, allQuiz.filter((item) => item.userId !== userId));

    const BOOK_PURCHASES_KEY = 'b3-book-purchases';
    const allPurchases = readLocalStorageJson<any[]>(BOOK_PURCHASES_KEY, []);
    writeLocalStorageJson(BOOK_PURCHASES_KEY, allPurchases.filter((item) => item.userId !== userId));

    const CLINIC_BOOKINGS_KEY = 'b3-care-clinic-booking-records';
    const allClinic = readLocalStorageJson<any[]>(CLINIC_BOOKINGS_KEY, []);
    writeLocalStorageJson(CLINIC_BOOKINGS_KEY, allClinic.filter((item) => item.userId !== userId));

    const CONSULTATIONS_KEY = 'b3-care-consultation-records';
    const allConsultations = readLocalStorageJson<any[]>(CONSULTATIONS_KEY, []);
    writeLocalStorageJson(CONSULTATIONS_KEY, allConsultations.filter((item) => item.userId !== userId));

    const TRIPS_KEY = 'b3-care-trip-records';
    const allTrips = readLocalStorageJson<any[]>(TRIPS_KEY, []);
    writeLocalStorageJson(TRIPS_KEY, allTrips.filter((item) => item.userId !== userId));

    const FAVORITES_KEY = 'b3-account-favorites';
    const allFavorites = readLocalStorageJson<any[]>(FAVORITES_KEY, []);
    writeLocalStorageJson(FAVORITES_KEY, allFavorites.filter((item) => item.userId !== userId));

    const NOTIFICATIONS_KEY = 'b3-account-notifications';
    const allNotifications = readLocalStorageJson<any[]>(NOTIFICATIONS_KEY, []);
    writeLocalStorageJson(NOTIFICATIONS_KEY, allNotifications.filter((item) => item.userId !== userId));

    const NEWSLETTER_KEY = 'b3-newsletter-subscriptions';
    const allNewsletter = readLocalStorageJson<any[]>(NEWSLETTER_KEY, []);
    writeLocalStorageJson(NEWSLETTER_KEY, allNewsletter.filter((item) => item.userId !== userId));

    // 4. Revoke active session
    setUser(null);
    return true;
  };

  const subscribe = (planId?: string) => {
    if (!requireAuthAction()) return;
    const expiryDate = new Date();
    if (planId?.includes('monthly')) expiryDate.setMonth(expiryDate.getMonth() + 1);
    else expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    setUser((prev) =>
      prev ? { ...prev, isSubscribed: true, subscriptionExpiryDate: expiryDate.toISOString() } : null,
    );
  };

  const purchaseItem = (type: 'course' | 'book', id: string, options?: { silent?: boolean }) => {
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
  };

  const bookSlot = (slotId: string, type: 'CONSULTATION' | 'FOLLOWUP') => {
    if (!requireAuthAction()) return;
    console.log(`Booked slot ${slotId} for ${type}`);
  };

  const completeCourse = (id: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const completed = prev.completedCourseIds || [];
      if (completed.includes(id)) return prev;
      return { ...prev, completedCourseIds: [...completed, id] };
    });
  };

  const completeQuiz = (quizId: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const completed = prev.completedQuizIds || [];
      if (completed.includes(quizId)) return prev;
      return { ...prev, completedQuizIds: [...completed, quizId] };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
        purchaseItem,
        bookSlot,
        subscribe,
        completeCourse,
        completeQuiz,
        isAuthModalOpen,
        setAuthModalOpen,
        requireAuthAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
