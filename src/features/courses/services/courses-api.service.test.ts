import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '@/lib/api/base-fetch';
import { checkoutCourse, getCourseDetail, getCourses, getMyCourseEnrollment, getMyCourseLesson, startMyCourseQuiz } from './courses-api.service';

vi.mock('@/lib/api/base-fetch', () => ({
  apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

describe('courses-api.service', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('maps backend course list fields and sends backend filter names', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [
        {
          id: 7,
          name: 'Soil Biology',
          short_description: 'Living soil basics',
          image: 'cover.jpg',
          hours: 12,
          category: { id: 2, name: 'Farming' },
          level: { id: 3, name: 'Advanced' },
          price: { amount: 25, currency: 'KWD', base_amount: 80, rate: 0.31 },
          is_featured: true,
          enrollment_status: 'enrolled',
        },
      ],
    });

    const result = await getCourses({
      search: 'soil',
      categoryId: '2',
      levelId: '3',
      currency: 'KWD',
      minDurationHours: '5',
      maxDurationHours: '20',
      minPrice: '10',
      maxPrice: '40',
      sort: 'oldest',
    });

    expect(apiFetchMock).toHaveBeenCalledWith('/api/user/courses', {
      query: {
        search: 'soil',
        course_category_id: '2',
        course_level_id: '3',
        currency: 'KWD',
        hours_min: '5',
        hours_max: '20',
        price_min: '10',
        price_max: '40',
        order: 'asc',
      },
    });
    expect(result[0]).toMatchObject({
      id: 'c7',
      title: 'Soil Biology',
      description: 'Living soil basics',
      imageUrl: 'cover.jpg',
      durationHours: 12,
      price: 25,
      currency: 'KWD',
      isFeatured: true,
      isEnrolled: true,
      category: { id: '2', name: 'Farming' },
      level: { id: '3', name: 'Advanced' },
    });
  });

  it('sends backend course checkout payload without legacy payment fields', async () => {
    apiFetchMock.mockResolvedValueOnce({ id: 10, status: 'pending', amount: 25, currency: 'KWD' });

    await checkoutCourse({
      courseId: '7',
      paymentMethodId: '4',
      currency: 'KWD',
      orderType: 'section',
      courseSectionId: '9',
      idempotencyKey: 'idem-1',
    });

    expect(apiFetchMock).toHaveBeenCalledWith('/api/user/courses/7/checkout', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': 'idem-1' },
      body: {
        payment_method_id: 4,
        currency: 'KWD',
        order_type: 'section',
        course_section_id: 9,
        idempotency_key: 'idem-1',
      },
    });
    expect(JSON.stringify(apiFetchMock.mock.calls[0][1])).not.toContain('payment_mode');
    expect(JSON.stringify(apiFetchMock.mock.calls[0][1])).not.toContain('installment_number');
  });

  it('maps course detail curriculum and similar courses from backend fields', async () => {
    apiFetchMock.mockResolvedValueOnce({
      id: 7,
      name: 'Soil Biology',
      description: 'Long description',
      intro_video: 'https://video.example/intro',
      instructor_name: 'Dr. Green',
      payment_mode: 'full_and_per_section',
      payment_mode_label: 'Full or section',
      supports_section_payment: true,
      price: { amount: 25, currency: 'KWD' },
      curriculum_outline: [
        {
          id: 1,
          name: 'Module 1',
          position: 1,
          is_locked: false,
          lessons: [{ id: 2, title: 'Lesson 1', type: 'video', type_label: 'Video', is_locked: false }],
        },
      ],
      similar_courses: [{ id: 8, name: 'Compost', short_description: 'Compost basics', hours: 4, price: { amount: 10, currency: 'KWD' } }],
    });

    const result = await getCourseDetail('7', 'KWD');

    expect(apiFetchMock).toHaveBeenCalledWith('/api/user/courses/7', { query: { currency: 'KWD' } });
    expect(result).toMatchObject({
      title: 'Soil Biology',
      description: 'Long description',
      trailerUrl: 'https://video.example/intro',
      instructor: { name: 'Dr. Green' },
      paymentMode: 'full_and_per_section',
      paymentModes: ['full', 'section'],
      supportsSectionPayment: true,
      sections: [{ id: '1', title: 'Module 1', position: 1, isLocked: false, lessons: [{ id: '2', title: 'Lesson 1', type: 'video', typeLabel: 'Video' }] }],
      relatedCourses: [{ id: 'c8', title: 'Compost' }],
    });
  });

  it('maps my-course detail response shape without reusing catalog DTOs directly', async () => {
    apiFetchMock.mockResolvedValueOnce({
      enrollment_id: 11,
      enrolled_at: '2026-07-08',
      progress_percent: 40,
      is_completed: false,
      final_exam_status: { value: 'pending' },
      payment_mode: 'full_only',
      payment_mode_label: 'Full',
      course: { id: 7, name: 'Soil Biology', short_description: 'Living soil', price: { amount: 25, currency: 'KWD' } },
      is_accessible: true,
      sections_payment: { paid: [] },
      can_resume: true,
      last_position: { lesson_id: 2 },
      certificate: null,
      orders: [{ id: 5, order_type: 'full', amount: 25, currency: 'KWD', status: 'paid', invoice_download_url: '/invoice' }],
      sections: [{ id: 1, name: 'Module 1', is_accessible: true, lessons: [{ id: 2, title: 'Lesson 1', is_accessible: true }] }],
      final_quiz: { id: 9, title: 'Final', type: 'final', passing_score: 70, is_accessible: false },
      actions: { continue_learning: { lesson_id: 2 }, pay_next_section: { section_id: 3 }, download_certificate: null },
    });

    const result = await getMyCourseEnrollment('11');

    expect(apiFetchMock).toHaveBeenCalledWith('/api/user/my-courses/11');
    expect(result).toMatchObject({
      enrollmentId: '11',
      progressPercent: 40,
      course: { id: 'c7', title: 'Soil Biology' },
      isAccessible: true,
      orders: [{ id: '5', invoiceDownloadUrl: '/invoice' }],
      sections: [{ id: '1', title: 'Module 1', isAccessible: true }],
      finalQuiz: { id: '9', title: 'Final', passingScore: 70, isAccessible: false },
      actions: { payNextSection: { sectionId: '3' } },
    });
  });

  it('maps quiz start response shape without correct answers', async () => {
    apiFetchMock.mockResolvedValueOnce({
      id: 9,
      title: 'Final quiz',
      type: 'final',
      type_label: 'Final',
      passing_score: 70,
      questions: [{ id: 1, question: 'Pick one', choices: [{ id: 2, choice: 'A' }] }],
    });

    const result = await startMyCourseQuiz('11', '9');

    expect(apiFetchMock).toHaveBeenCalledWith('/api/user/my-courses/11/quizzes/9');
    expect(result).toEqual({
      id: '9',
      title: 'Final quiz',
      type: 'final',
      typeLabel: 'Final',
      passingScore: 70,
      questions: [{ id: '1', question: 'Pick one', choices: [{ id: '2', choice: 'A' }] }],
    });
  });

  it('maps lesson detail quiz IDs into camelCase fields', async () => {
    apiFetchMock.mockResolvedValueOnce({
      id: 3,
      title: 'Section quiz',
      type: 'quiz',
      type_label: 'Quiz',
      course_quiz_id: 15,
      is_accessible: true,
    });

    const result = await getMyCourseLesson('11', '3');

    expect(apiFetchMock).toHaveBeenCalledWith('/api/user/my-courses/11/lessons/3');
    expect(result).toMatchObject({
      id: '3',
      title: 'Section quiz',
      type: 'quiz',
      typeLabel: 'Quiz',
      courseQuizId: '15',
      isAccessible: true,
    });
  });
});
