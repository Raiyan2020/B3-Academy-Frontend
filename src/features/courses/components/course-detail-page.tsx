'use client';

import { Lock, Play, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { AuthActionGate } from '@/features/access/components/auth-action-gate';
import { FavoriteButton } from '@/features/account/components/favorite-button';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import { getCourseById, getCourses } from '@/features/courses/services/courses.service';

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { localize, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const course = getCourseById(courseId);

  if (!course) {
    return <div className="min-h-screen bg-slate-50 p-16 text-center text-slate-700">{language === 'ar' ? 'الدورة غير متاحة.' : 'Course is unavailable.'}</div>;
  }

  const isEnrolled = Boolean(user?.purchasedCourseIds.includes(course.id));
  const similarCourses = getCourses().filter((candidate) => candidate.id !== course.id && candidate.topics.some((topic) => topic.en === course.topics[0]?.en)).slice(0, 3);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-emerald-300">{course.level} - {localize(course.topics[0])}</p>
            <h1 className="mt-3 text-4xl font-bold">{localize(course.title)}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{localize(course.description)}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
              <span>{language === 'ar' ? 'المدة' : 'Duration'}: {localize(course.duration)}</span>
              <span>{language === 'ar' ? 'المدرب' : 'Instructor'}: {localize(course.instructor.name)}</span>
            </div>
          </div>
          <aside className="rounded-lg border border-white/10 bg-white p-4 text-slate-950">
            <img src={course.thumbnail} alt={localize(course.title)} className="h-48 w-full rounded-md object-cover" />
            <p className="mt-5 text-3xl font-bold text-emerald-700">{formatPrice(course.price)}</p>
            <p className="mt-2 text-sm text-slate-600">{language === 'ar' ? 'تتوفر طريقة الدفع الكامل، ويمكن عرض الأقساط إذا كانت مفعّلة للدورة.' : 'Full payment is available; installments can be shown when enabled for this course.'}</p>
            {isEnrolled ? (
              <Link href={`/learn/${course.id}`} className="mt-5 flex w-full justify-center rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white">{language === 'ar' ? 'استكمال الدورة' : 'Continue course'}</Link>
            ) : user ? (
              <Link href={`/checkout/course/${course.id}`} className="mt-5 flex w-full justify-center rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white">{language === 'ar' ? 'التسجيل والدفع' : 'Enroll and pay'}</Link>
            ) : (
              <AuthActionGate
                intent={{
                  type: 'course.checkout',
                  href: `/checkout/course/${course.id}`,
                  label: localize(course.title),
                  itemId: course.id,
                  itemKind: 'course',
                }}
              >
                {({ onClick }) => (
                  <button onClick={onClick} className="mt-5 flex w-full justify-center rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white">
                    {language === 'ar' ? 'التسجيل والدفع' : 'Enroll and pay'}
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
            <h2 className="text-xl font-bold text-slate-950">{language === 'ar' ? 'منهج الدورة' : 'Course curriculum'}</h2>
            <p className="mt-2 text-sm text-slate-600">{language === 'ar' ? 'قبل الاشتراك تظهر العناوين فقط ولا يتم فتح المحتوى الداخلي.' : 'Before enrollment, titles are shown only and internal content is locked.'}</p>
            <div className="mt-5 divide-y divide-slate-100 rounded-md border border-slate-200">
              {course.modules.map((module) => (
                <div key={module.id}>
                  <div className="bg-slate-50 px-4 py-3 font-bold text-slate-900">{localize(module.title)}</div>
                  {module.lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="inline-flex items-center gap-2"><Play className="h-4 w-4 text-slate-400" />{localize(lesson.title)}</span>
                      {!isEnrolled && <Lock className="h-4 w-4 text-slate-400" />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </article>

          {similarCourses.length > 0 && (
            <article className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">{language === 'ar' ? 'دورات مشابهة' : 'Similar courses'}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {similarCourses.map((similar) => (
                  <Link key={similar.id} href={`/courses/${similar.id}`} className="rounded-md border border-slate-100 p-3 hover:border-emerald-200">
                    <p className="line-clamp-2 font-semibold text-slate-950">{localize(similar.title)}</p>
                    <p className="mt-2 text-sm text-emerald-700">{formatPrice(similar.price)}</p>
                  </Link>
                ))}
              </div>
            </article>
          )}
        </div>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-950">{language === 'ar' ? 'بيانات الدورة' : 'Course details'}</h2>
          <dl className="mt-4 space-y-3 text-sm text-slate-700">
            <div><dt className="font-semibold">{language === 'ar' ? 'المستوى' : 'Level'}</dt><dd>{course.level}</dd></div>
            <div><dt className="font-semibold">{language === 'ar' ? 'التصنيف' : 'Category'}</dt><dd>{localize(course.topics[0])}</dd></div>
            <div><dt className="font-semibold">{language === 'ar' ? 'المدرب' : 'Instructor'}</dt><dd>{localize(course.instructor.name)}</dd></div>
          </dl>
          <div className="mt-5 flex items-center gap-3">
            <button className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><Share2 className="h-4 w-4" />{language === 'ar' ? 'مشاركة الدورة' : 'Share course'}</button>
            <FavoriteButton favorite={{ itemId: course.id, kind: 'course', title: localize(course.title), href: `/courses/${course.id}`, isAvailable: true }} className="rounded-md border border-slate-300 p-2 text-slate-700" />
          </div>
        </aside>
      </section>
    </main>
  );
}
