'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { selectAccountCourses } from '../../services/account-selectors.service';
import { getOrCreateCertificate } from '@/features/learning/services/certificate.service';
import { getCourseById } from '@/features/courses/services/courses.service';
import { AccountShell, EmptyAccountState } from '../account-shell';

export function MyCoursesPage() {
  const { user } = useAuth();
  const courses = user ? selectAccountCourses(user.id, user.completedQuizIds || []) : [];

  return (
    <AccountShell title="دوراتي وشهاداتي" description="الدورات المسجلة، التقدم، الأقساط، والشهادات المستحقة.">
      {courses.length === 0 ? (
        <EmptyAccountState title="لا توجد دورات مسجلة" description="بعد نجاح الدفع لأي دورة ستظهر هنا." />
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => {
            if (!user) return null;
            const courseDetails = getCourseById(course.courseId);
            const certificate = course.isCertificateUnlocked
              ? getOrCreateCertificate({
                  userId: user.id,
                  userName: user.name,
                  courseId: course.courseId,
                  courseTitle: course.title.ar,
                  instructorName: courseDetails?.instructor.name.ar || course.title.ar,
                })
              : null;

            return (
              <article key={course.id} className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="font-bold text-slate-950">{course.title.ar}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  الحالة: {course.isCertificateUnlocked ? 'مكتملة' : `قيد الاستكمال (${course.completedLessons}/${course.totalLessons} دروس)`}
                </p>
                {course.paymentMode === 'installments' && (
                  <p className="mt-1 text-sm text-amber-700">
                    الأقساط المدفوعة: {course.paidInstallments} من {course.totalInstallments}
                  </p>
                )}
                <div className="mt-4 flex gap-3">
                  <Link href={course.href} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">استكمال الدورة</Link>
                  {certificate && (
                    <a
                      href={certificate.downloadUrl}
                      download={`${certificate.id}.pdf`}
                      className="rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700"
                    >
                      تحميل الشهادة
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AccountShell>
  );
}
