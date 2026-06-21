'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { getCourses } from '@/features/courses/services/courses.service';
import { getOrCreateCertificate } from '@/features/learning/services/certificate.service';
import { getCourseEnrollment } from '@/features/learning/services/enrollment.service';
import { isLessonComplete } from '@/features/learning/services/course-progress.service';
import { AccountShell, EmptyAccountState } from '../account-shell';

export function MyCoursesPage() {
  const { user } = useAuth();
  const courses = user ? getCourses().filter((course) => user.purchasedCourseIds.includes(course.id)) : [];

  return (
    <AccountShell title="دوراتي وشهاداتي" description="الدورات المسجلة، التقدم، الأقساط، والشهادات المستحقة.">
      {courses.length === 0 ? (
        <EmptyAccountState title="لا توجد دورات مسجلة" description="بعد نجاح الدفع لأي دورة ستظهر هنا." />
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => {
            if (!user) return null;
            
            const enrollment = getCourseEnrollment(user.id, course.id);
            const allLessons = course.modules.flatMap(m => m.lessons);
            const completedLessonsCount = allLessons.filter(l => isLessonComplete(user.id, course.id, l.id)).length;
            const areAllLessonsCompleted = completedLessonsCount === allLessons.length;
            
            const passedQuizzes = user.completedQuizIds || [];
            const finalExam = course.finalExam;
            const isFinalExamPassed = finalExam ? passedQuizzes.includes(finalExam.id) : true;
            const isFullyPaid = enrollment ? enrollment.paidInstallments === enrollment.totalInstallments : false;
            
            const isCertificateUnlocked = areAllLessonsCompleted && isFinalExamPassed && isFullyPaid;
            const completed = isCertificateUnlocked;

            const certificate = isCertificateUnlocked
              ? getOrCreateCertificate({
                  userId: user.id,
                  userName: user.name,
                  courseId: course.id,
                  courseTitle: course.title.ar,
                  instructorName: course.instructor.name.ar,
                })
              : null;

            return (
              <article key={course.id} className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="font-bold text-slate-950">{course.title.ar}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  الحالة: {completed ? 'مكتملة' : `قيد الاستكمال (${completedLessonsCount}/${allLessons.length} دروس)`}
                </p>
                {enrollment && enrollment.paymentMode === 'installments' && (
                  <p className="mt-1 text-sm text-amber-700">
                    الأقساط المدفوعة: {enrollment.paidInstallments} من {enrollment.totalInstallments}
                  </p>
                )}
                <div className="mt-4 flex gap-3">
                  <Link href={`/learn/${course.id}`} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">استكمال الدورة</Link>
                  {certificate && (
                    <a
                      href={certificate.downloadUrl}
                      download={`${certificate.id}.html`}
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
