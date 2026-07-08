import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MyCoursesPage } from '@/features/account/components/account-sections/courses-page';
import { CoursePlayer } from '@/features/learning/components/course-player';
import { CourseDetailView } from './CourseDetailView';
import { CourseCheckoutPage } from './CourseCheckoutPage';
import {
  useCheckoutCourse,
  useCompleteMyCourseLesson,
  useCourseApiDetail,
  useCourseCheckoutPreview,
  useMyCourseApiDetail,
  useMyCourseApiList,
  useMyCourseLesson,
  useMyCourseQuiz,
  useSubmitMyCourseQuiz,
} from '../hooks/use-course-api';
import { usePaymentMethods } from '@/features/subscriptions/hooks/use-subscriptions';
import { downloadAuthenticatedFile } from '@/lib/api/download';

vi.mock('next/navigation', () => ({
  useParams: () => ({ courseId: 'course-1' }),
  usePathname: () => '/dashboard/courses',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('../../../../LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    dir: 'ltr',
    t: (key: string) => key,
    localize: (value: { en: string; ar: string }) => value.en,
  }),
}));

vi.mock('@/features/auth/auth-provider', () => ({
  useAuth: () => ({ user: { id: 'user-1', name: 'Learner', email: 'learner@example.com' } }),
}));

vi.mock('@/features/account/components/favorite-button', () => ({
  FavoriteButton: () => <button type="button">Favorite</button>,
}));

vi.mock('@/components/actions/share-button', () => ({
  ShareButton: () => <button type="button">Share</button>,
}));

vi.mock('@/features/courses/hooks/use-course-api', () => ({
  useCourseApiDetail: vi.fn(),
  useMyCourseApiList: vi.fn(),
  useCourseCheckoutPreview: vi.fn(),
  useCheckoutCourse: vi.fn(),
  useMyCourseApiDetail: vi.fn(),
  useMyCourseLesson: vi.fn(),
  useMyCourseQuiz: vi.fn(),
  useCompleteMyCourseLesson: vi.fn(),
  useSubmitMyCourseQuiz: vi.fn(),
}));

vi.mock('@/features/subscriptions/hooks/use-subscriptions', () => ({
  usePaymentMethods: vi.fn(),
}));

vi.mock('@/lib/api/download', () => ({
  downloadAuthenticatedFile: vi.fn(),
}));

const courseDetail = {
  id: 'course-1',
  title: 'Soil Biology',
  description: 'Living soil basics',
  imageUrl: null,
  category: { id: 'cat-1', name: 'Farming' },
  level: { id: 'level-1', name: 'Advanced' },
  instructor: { name: 'Dr. Green' },
  durationHours: 12,
  price: 25,
  currency: 'KWD',
  rawPrice: { amount: 25, currency: 'KWD' },
  isFeatured: true,
  isEnrolled: false,
  trailerUrl: null,
  paymentModes: ['full', 'section'],
  paymentMode: 'full_and_per_section',
  paymentModeLabel: 'Full or section',
  supportsFullPayment: true,
  supportsSectionPayment: true,
  sections: [
    {
      id: 'section-1',
      title: 'Module 1',
      position: 1,
      isLocked: false,
      lessons: [{ id: 'lesson-1', title: 'Lesson 1', type: 'text', isLocked: false, isAccessible: true }],
    },
  ],
  relatedCourses: [{ id: 'course-2', title: 'Compost', description: '', durationHours: 4, price: 10, currency: 'KWD', isFeatured: false, isEnrolled: false }],
};

const myCourse = {
  id: 'course-1',
  enrollmentId: 'enroll-1',
  enrolledAt: '2026-07-08',
  progressPercent: 25,
  isCompleted: false,
  finalExamStatus: null,
  paymentMode: 'full_only',
  paymentModeLabel: 'Full',
  course: { ...courseDetail, isActive: true },
  isAccessible: true,
  sectionsPayment: null,
  canResume: true,
  lastPosition: null,
  certificate: { id: 'cert-1' },
  orders: [{ id: 'order-1', invoiceDownloadUrl: '/api/user/my-courses/enroll-1/orders/order-1/invoice' }],
};

const enrollmentDetail = {
  ...myCourse,
  sections: [
    {
      id: 'section-1',
      title: 'Module 1',
      isAccessible: true,
      lessons: [
        { id: 'lesson-1', title: 'Text lesson', type: 'text', isAccessible: true, isCompleted: false },
        { id: 'lesson-2', title: 'Section quiz', type: 'quiz', isAccessible: true, isCompleted: false },
      ],
    },
  ],
  finalQuiz: { id: 'quiz-final', title: 'Final quiz', isAccessible: true },
  actions: { continueLearning: { lesson_id: 'lesson-1' }, payNextSection: null, downloadCertificate: { url: '/certificate' } },
};

const hooks = {
  useCourseApiDetail: vi.mocked(useCourseApiDetail),
  useMyCourseApiList: vi.mocked(useMyCourseApiList),
  useCourseCheckoutPreview: vi.mocked(useCourseCheckoutPreview),
  useCheckoutCourse: vi.mocked(useCheckoutCourse),
  useMyCourseApiDetail: vi.mocked(useMyCourseApiDetail),
  useMyCourseLesson: vi.mocked(useMyCourseLesson),
  useMyCourseQuiz: vi.mocked(useMyCourseQuiz),
  useCompleteMyCourseLesson: vi.mocked(useCompleteMyCourseLesson),
  useSubmitMyCourseQuiz: vi.mocked(useSubmitMyCourseQuiz),
  usePaymentMethods: vi.mocked(usePaymentMethods),
};

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('course UI smoke flows', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    hooks.useCourseApiDetail.mockReturnValue({ data: courseDetail, isLoading: false, isError: false } as ReturnType<typeof useCourseApiDetail>);
    hooks.useMyCourseApiList.mockReturnValue({ data: [myCourse], isLoading: false, isError: false } as ReturnType<typeof useMyCourseApiList>);
    hooks.useCourseCheckoutPreview.mockReturnValue({
      data: {
        course: courseDetail,
        fullPrice: { amount: 25, currency: 'KWD' },
        supportsFullPayment: true,
        supportsSectionPayment: true,
        sections: [{ id: 'section-1', title: 'Module 1', amount: 10, currency: 'KWD', isPayable: true, isNextPayable: true, isPaid: false, isAccessible: true }],
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCourseCheckoutPreview>);
    hooks.usePaymentMethods.mockReturnValue({ data: [{ id: '4', name: 'KNET', driver: 'knet' }], isLoading: false, isError: false } as ReturnType<typeof usePaymentMethods>);
    hooks.useCheckoutCourse.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useCheckoutCourse>);
    hooks.useMyCourseApiDetail.mockReturnValue({ data: enrollmentDetail, isLoading: false, isError: false } as ReturnType<typeof useMyCourseApiDetail>);
    hooks.useMyCourseLesson.mockReturnValue({ data: { id: 'lesson-1', title: 'Text lesson', type: 'text', content: 'Lesson body' }, isLoading: false, isError: false } as ReturnType<typeof useMyCourseLesson>);
    hooks.useMyCourseQuiz.mockReturnValue({ data: undefined, isLoading: false, isError: false } as ReturnType<typeof useMyCourseQuiz>);
    hooks.useCompleteMyCourseLesson.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false } as unknown as ReturnType<typeof useCompleteMyCourseLesson>);
    hooks.useSubmitMyCourseQuiz.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ passed: true }), isPending: false } as unknown as ReturnType<typeof useSubmitMyCourseQuiz>);
  });

  it('renders course detail with backend curriculum and similar courses', () => {
    renderWithQuery(<CourseDetailView />);

    expect(screen.getByRole('heading', { name: 'Soil Biology' })).toBeInTheDocument();
    expect(screen.getByText('Module 1')).toBeInTheDocument();
    expect(screen.getByText('Lesson 1')).toBeInTheDocument();
    expect(screen.getByText('Compost')).toBeInTheDocument();
  });

  it('submits backend course checkout with selected payment method', async () => {
    const mutate = vi.fn();
    hooks.useCheckoutCourse.mockReturnValue({ mutate, isPending: false } as unknown as ReturnType<typeof useCheckoutCourse>);

    renderWithQuery(<CourseCheckoutPage courseId="course-1" />);
    await userEvent.selectOptions(screen.getAllByRole('combobox')[2], '4');
    await userEvent.click(screen.getByRole('button', { name: 'Pay now' }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: 'course-1',
        paymentMethodId: '4',
        currency: 'USD',
        orderType: 'full',
      }),
      expect.any(Object),
    );
  });

  it('renders my-courses account actions for learning, certificate, and invoice', async () => {
    renderWithQuery(<MyCoursesPage />);

    expect(screen.getByRole('heading', { name: 'Soil Biology' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /استكمال الدورة/i })).toHaveAttribute('href', '/learn/enroll-1');

    await userEvent.click(screen.getByRole('button', { name: /الشهادة/i }));
    expect(downloadAuthenticatedFile).toHaveBeenCalledWith('/api/user/my-courses/enroll-1/certificate', 'certificate.pdf');

    await userEvent.click(screen.getByRole('button', { name: /الفاتورة/i }));
    expect(downloadAuthenticatedFile).toHaveBeenCalledWith('/api/user/my-courses/enroll-1/orders/order-1/invoice', 'invoice.pdf');
  });

  it('renders lesson content and completes a lesson', async () => {
    const complete = vi.fn().mockResolvedValue({});
    hooks.useCompleteMyCourseLesson.mockReturnValue({ mutateAsync: complete, isPending: false } as unknown as ReturnType<typeof useCompleteMyCourseLesson>);

    renderWithQuery(<CoursePlayer />);

    expect(screen.getByText('Lesson body')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Complete lesson' }));
    expect(complete).toHaveBeenCalledWith({ enrollmentId: 'enroll-1', lessonId: 'lesson-1' });
  });

  it('renders quiz questions and submits selected answers', async () => {
    const submit = vi.fn().mockResolvedValue({ passed: true });
    hooks.useMyCourseLesson.mockReturnValue({ data: { id: 'lesson-2', title: 'Section quiz', type: 'quiz', courseQuizId: 'quiz-1' }, isLoading: false, isError: false } as ReturnType<typeof useMyCourseLesson>);
    hooks.useMyCourseQuiz.mockReturnValue({
      data: { id: 'quiz-1', title: 'Section quiz', questions: [{ id: 'q1', question: 'Pick one', choices: [{ id: '2', choice: 'A' }] }] },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useMyCourseQuiz>);
    hooks.useSubmitMyCourseQuiz.mockReturnValue({ mutateAsync: submit, isPending: false } as unknown as ReturnType<typeof useSubmitMyCourseQuiz>);

    renderWithQuery(<CoursePlayer />);

    await userEvent.click(screen.getByRole('button', { name: /Section quiz/i }));
    await userEvent.click(screen.getByLabelText('A'));
    await userEvent.click(screen.getByRole('button', { name: 'Submit quiz' }));

    expect(submit).toHaveBeenCalledWith({ enrollmentId: 'enroll-1', quizId: 'quiz-1', answers: { q1: 2 } });
  });
});
