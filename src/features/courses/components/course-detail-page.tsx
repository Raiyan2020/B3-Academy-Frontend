'use client';

import { Lock, Play } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { AuthActionGate } from '@/features/access/components/auth-action-gate';
import { FavoriteButton } from '@/features/account/components/favorite-button';
import { useLanguage } from '../../../../LanguageContext';
import { useCurrency } from '../../../../CurrencyContext';
import {
  COURSE_CATEGORIES,
  COURSE_LEVELS,
  formatDurationMinutes,
  getCourseMetadata,
  getCourseRecord,
  getRelatedCourses,
  supportsPaymentMode,
} from '@/features/courses/services/courses.service';
import { getCourseEnrollment } from '@/features/learning/services/enrollment.service';
import { ShareButton } from '@/components/actions/share-button';

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { localize, language } = useLanguage();
  const { formatPrice, convertPrice } = useCurrency();
  const course = getCourseRecord(courseId);
  const metadata = course ? getCourseMetadata(course.id) : undefined;

  if (!course || !metadata?.isActive) {
    return <div className="min-h-screen bg-slate-50 p-16 text-center text-slate-700">{language === 'ar' ? 'الدورة غير متاحة.' : 'Course is unavailable.'}</div>;
  }

  const enrollment = user ? getCourseEnrollment(user.id, course.id) : null;
  const isEnrolled = Boolean(enrollment);
  const hasOutstandingInstallment =
    enrollment?.paymentMode === 'installments' && enrollment.paidInstallments < enrollment.totalInstallments;
  const relatedCourses = getRelatedCourses(course.id);
  const baseCurrency = metadata.baseCurrency;
  const displayPrice = convertPrice(course.price, baseCurrency);
  const installmentConfig = metadata.installmentConfig;
  const installmentAmount = installmentConfig ? displayPrice / installmentConfig.count : displayPrice;
  const mediaUrl = metadata.trailerUrl || course.thumbnail;
  const categoryLabel = COURSE_CATEGORIES[metadata.categoryId];
  const levelLabel = COURSE_LEVELS[metadata.levelId];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-emerald-300">{localize(levelLabel)} - {localize(categoryLabel)}</p>
            <h1 className="mt-3 text-4xl font-bold">{localize(course.title)}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{localize(course.description)}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
              <span>{language === 'ar' ? 'المدة' : 'Duration'}: {formatDurationMinutes(metadata.durationMinutes, language)}</span>
              <span>{language === 'ar' ? 'المدرب' : 'Instructor'}: {localize(course.instructor.name)}</span>
            </div>
          </div>
          <aside className="rounded-lg border border-white/10 bg-white p-4 text-slate-950">
            {metadata.trailerUrl ? (
              <div className="aspect-video overflow-hidden rounded-md bg-black">
                <iframe
                  className="h-full w-full"
                  src={`${metadata.trailerUrl}?title=0&byline=0&portrait=0`}
                  title={localize(course.title)}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <img src={mediaUrl} alt={localize(course.title)} className="h-48 w-full rounded-md object-cover" />
            )}
            <p className="mt-5 text-3xl font-bold text-emerald-700">{formatPrice(displayPrice)}</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {supportsPaymentMode(course.id, 'full') && (
                <p>{language === 'ar' ? 'الدفع الكامل متاح.' : 'Full payment is available.'}</p>
              )}
              {supportsPaymentMode(course.id, 'installments') && installmentConfig && (
                <p>
                  {language === 'ar'
                    ? `الأقساط: ${installmentConfig.count} دفعات × ${formatPrice(installmentAmount)} — يفتح كل قسط أقساماً محددة مسبقاً.`
                    : `Installments: ${installmentConfig.count} payments × ${formatPrice(installmentAmount)} — each unlocks configured sections.`}
                </p>
              )}
            </div>
            {isEnrolled && !hasOutstandingInstallment ? (
              <Link href={`/learn/${course.id}`} className="mt-5 flex w-full justify-center rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white">
                {language === 'ar' ? 'استكمال الدورة' : 'Continue course'}
              </Link>
            ) : isEnrolled && hasOutstandingInstallment ? (
              <div className="mt-5 space-y-3">
                <Link href={`/learn/${course.id}`} className="flex w-full justify-center rounded-md border border-emerald-700 px-4 py-3 font-semibold text-emerald-700">
                  {language === 'ar' ? 'استكمال الدورة' : 'Continue course'}
                </Link>
                <Link
                  href={`/checkout/course/${course.id}?installment=${enrollment!.paidInstallments + 1}`}
                  className="flex w-full justify-center rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white"
                >
                  {language === 'ar'
                    ? `دفع القسط ${enrollment!.paidInstallments + 1} من ${enrollment!.totalInstallments}`
                    : `Pay installment ${enrollment!.paidInstallments + 1} of ${enrollment!.totalInstallments}`}
                </Link>
              </div>
            ) : user ? (
              <Link href={`/checkout/course/${course.id}`} className="mt-5 flex w-full justify-center rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white">
                {language === 'ar' ? 'التسجيل والدفع' : 'Enroll and pay'}
              </Link>
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

          {relatedCourses.length > 0 && (
            <article className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">{language === 'ar' ? 'دورات مشابهة' : 'Similar courses'}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {relatedCourses.map((similar) => (
                  <Link key={similar.id} href={`/courses/${similar.id}`} className="rounded-md border border-slate-100 p-3 hover:border-emerald-200">
                    <p className="line-clamp-2 font-semibold text-slate-950">{localize(similar.title)}</p>
                    <p className="mt-2 text-sm text-emerald-700">{formatPrice(convertPrice(similar.price, getCourseMetadata(similar.id)?.baseCurrency ?? 'USD'))}</p>
                  </Link>
                ))}
              </div>
            </article>
          )}
        </div>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-950">{language === 'ar' ? 'بيانات الدورة' : 'Course details'}</h2>
          <dl className="mt-4 space-y-3 text-sm text-slate-700">
            <div><dt className="font-semibold">{language === 'ar' ? 'المستوى' : 'Level'}</dt><dd>{localize(levelLabel)}</dd></div>
            <div><dt className="font-semibold">{language === 'ar' ? 'التصنيف' : 'Category'}</dt><dd>{localize(categoryLabel)}</dd></div>
            <div><dt className="font-semibold">{language === 'ar' ? 'المدرب' : 'Instructor'}</dt><dd>{localize(course.instructor.name)}</dd></div>
            <div><dt className="font-semibold">{language === 'ar' ? 'المدة' : 'Duration'}</dt><dd>{formatDurationMinutes(metadata.durationMinutes, language)}</dd></div>
          </dl>
          <div className="mt-5 flex items-center gap-3">
            <ShareButton title={localize(course.title)} />
            <FavoriteButton favorite={{ itemId: course.id, kind: 'course', title: localize(course.title), href: `/courses/${course.id}`, isAvailable: true }} className="rounded-md border border-slate-300 p-2 text-slate-700" />
          </div>
        </aside>
      </section>
    </main>
  );
}
