'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-provider';
import { AccountShell, EmptyAccountState } from '../account-shell';
import { useMyCourseApiList } from '@/features/courses/hooks/use-course-api';
import { getMyCourseCertificateUrl, getMyCourseInvoiceUrl } from '@/features/courses/services/courses-api.service';
import { downloadAuthenticatedFile } from '@/lib/api/download';
import { toastError } from '@/lib/feedback/toast';

async function handleDownload(url: string, fallbackName: string) {
  try {
    await downloadAuthenticatedFile(url, fallbackName);
  } catch {
    toastError('تعذر تحميل الملف. قد لا يكون متاحاً بعد.');
  }
}

export function MyCoursesPage() {
  const { user } = useAuth();
  const coursesQuery = useMyCourseApiList(Boolean(user));

  const courses = coursesQuery.data || [];

  return (
    <AccountShell title="دوراتي وشهاداتي" description="الدورات المسجلة، التقدم، الأقسام المدفوعة، والشهادات المستحقة.">
      {coursesQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">جاري تحميل الدورات...</div>
      ) : coursesQuery.isError ? (
        <div className="rounded-lg border border-red-100 bg-white p-8 text-center text-sm font-semibold text-red-700">تعذر تحميل الدورات.</div>
      ) : courses.length === 0 ? (
        <EmptyAccountState title="لا توجد دورات مسجلة" description="بعد نجاح الدفع لأي دورة ستظهر هنا." />
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => {
            const invoicedOrders = (course.orders || []).filter((order) => order.invoiceDownloadUrl || order.invoice);
            return (
              <article key={course.id} className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="font-bold text-slate-950">{course.course.title}</h2>
                <p className="mt-2 text-sm text-slate-600">الحالة: {course.isCompleted ? 'مكتملة' : `قيد الاستكمال (${Math.round(course.progressPercent)}%)`}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href={`/learn/${course.enrollmentId}`} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
                    استكمال الدورة
                  </Link>
                  {course.certificate && user ? (
                    <button
                      type="button"
                      onClick={() => handleDownload(course.certificate?.downloadUrl || getMyCourseCertificateUrl(course.enrollmentId), 'certificate.pdf')}
                      className="rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700"
                    >
                      تحميل الشهادة
                    </button>
                  ) : null}
                  {invoicedOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => handleDownload(order.invoiceDownloadUrl || getMyCourseInvoiceUrl(course.enrollmentId, order.id), 'invoice.pdf')}
                      className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      تحميل الفاتورة
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AccountShell>
  );
}
