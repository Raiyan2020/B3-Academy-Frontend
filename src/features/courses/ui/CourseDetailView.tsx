'use client';

import { Lock, Play } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuthActionGate } from '@/features/access/components/auth-action-gate';
import { FavoriteButton } from '@/features/account/components/favorite-button';
import { ShareButton } from '@/components/actions/share-button';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { useCourseApiDetail, useMyCourseApiList } from '../hooks/use-course-api';

export function CourseDetailView() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const courseQuery = useCourseApiDetail(courseId, 'USD');
  const myCoursesQuery = useMyCourseApiList(Boolean(user));
  const course = courseQuery.data;
  const enrolled = Boolean(course?.isEnrolled || myCoursesQuery.data?.some((item) => item.id === course?.id));

  if (courseQuery.isLoading) {
    return <main className="min-h-screen bg-slate-50 p-16 text-center text-slate-600">{isAr ? 'جار تحميل الدورة...' : 'Loading course...'}</main>;
  }

  if (!course) {
    return <main className="min-h-screen bg-slate-50 p-16 text-center text-slate-700">{isAr ? 'الدورة غير متاحة.' : 'Course is unavailable.'}</main>;
  }

  const price = new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: course.rawPrice?.currency || course.currency,
  }).format(course.rawPrice?.amount ?? course.price);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-emerald-300">{[course.level?.name, course.category?.name].filter(Boolean).join(' - ')}</p>
            <h1 className="mt-3 text-4xl font-bold">{course.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{course.description}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
              <span>
                {isAr ? 'المدة' : 'Duration'}: {course.durationHours ? `${course.durationHours}h` : '-'}
              </span>
              {course.instructor?.name && <span>{isAr ? 'المدرب' : 'Instructor'}: {course.instructor.name}</span>}
            </div>
          </div>
          <aside className="rounded-lg border border-white/10 bg-white p-4 text-slate-950">
            {course.trailerUrl ? (
              <div className="aspect-video overflow-hidden rounded-md bg-black">
                <iframe className="h-full w-full" src={course.trailerUrl} title={course.title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
              </div>
            ) : course.imageUrl ? (
              <img src={course.imageUrl} alt={course.title} className="h-48 w-full rounded-md object-cover" />
            ) : null}
            <p className="mt-5 text-3xl font-bold text-emerald-700">{price}</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {course.paymentModeLabel && <p>{course.paymentModeLabel}</p>}
              {course.supportsSectionPayment && <p>{isAr ? 'الدفع الجزئي متاح.' : 'Per-section payment is available.'}</p>}
            </div>
            {enrolled ? (
              <Link href={`/learn/${course.id}`} className="mt-5 flex w-full justify-center rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white">
                {isAr ? 'استكمال الدورة' : 'Continue course'}
              </Link>
            ) : user ? (
              <Link href={`/checkout/course/${course.id}`} className="mt-5 flex w-full justify-center rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white">
                {isAr ? 'التسجيل والدفع' : 'Enroll and pay'}
              </Link>
            ) : (
              <AuthActionGate intent={{ type: 'course.checkout', href: `/checkout/course/${course.id}`, label: course.title, itemId: course.id, itemKind: 'course' }}>
                {({ onClick }) => (
                  <button onClick={onClick} className="mt-5 flex w-full justify-center rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white">
                    {isAr ? 'التسجيل والدفع' : 'Enroll and pay'}
                  </button>
                )}
              </AuthActionGate>
            )}
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <div className="space-y-6">
          <article className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-950">{isAr ? 'منهج الدورة' : 'Course curriculum'}</h2>
            <p className="mt-2 text-sm text-slate-600">{isAr ? 'يظهر المنهج من الـ backend مع حالة الإتاحة لكل قسم ودرس.' : 'The curriculum is loaded from the backend with access state per section and lesson.'}</p>
            <div className="mt-5 divide-y divide-slate-100 rounded-md border border-slate-200">
              {course.sections.map((section) => (
                <div key={section.id}>
                  <div className="bg-slate-50 px-4 py-3 font-bold text-slate-900">
                    {section.title}
                    {section.position !== undefined ? <span className="ms-2 text-xs font-medium text-slate-500">#{section.position}</span> : null}
                  </div>
                  {section.lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="inline-flex items-center gap-2">
                        <Play className="h-4 w-4 text-slate-400" />
                        {lesson.title}
                      </span>
                      {!enrolled || section.isLocked || lesson.isLocked ? <Lock className="h-4 w-4 text-slate-400" /> : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </article>

          {course.relatedCourses.length > 0 && (
            <article className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">{isAr ? 'دورات مشابهة' : 'Similar courses'}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {course.relatedCourses.map((similar) => (
                  <Link key={similar.id} href={`/courses/${similar.id}`} className="rounded-md border border-slate-100 p-3 hover:border-emerald-200">
                    <p className="line-clamp-2 font-semibold text-slate-950">{similar.title}</p>
                  </Link>
                ))}
              </div>
            </article>
          )}
        </div>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-950">{isAr ? 'بيانات الدورة' : 'Course details'}</h2>
          <dl className="mt-4 space-y-3 text-sm text-slate-700">
            <div>
              <dt className="font-semibold">{isAr ? 'المستوى' : 'Level'}</dt>
              <dd>{course.level?.name || '-'}</dd>
            </div>
            <div>
              <dt className="font-semibold">{isAr ? 'التصنيف' : 'Category'}</dt>
              <dd>{course.category?.name || '-'}</dd>
            </div>
            <div>
              <dt className="font-semibold">{isAr ? 'المدرب' : 'Instructor'}</dt>
              <dd>{course.instructor?.name || '-'}</dd>
            </div>
            <div>
              <dt className="font-semibold">{isAr ? 'المدة' : 'Duration'}</dt>
              <dd>{course.durationHours ? `${course.durationHours}h` : '-'}</dd>
            </div>
          </dl>
          <div className="mt-5 flex items-center gap-3">
            <ShareButton title={course.title} />
            <FavoriteButton favorite={{ itemId: course.id, kind: 'course', title: course.title, href: `/courses/${course.id}`, isAvailable: true }} className="rounded-md border border-slate-300 p-2 text-slate-700" />
          </div>
        </aside>
      </section>
    </main>
  );
}
