'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AccountStatusBadge, UserRoleBadge } from './status-badge';
import { getAdminUser } from '../services/admin-users.service';
import { InfoRow } from '@/features/account/components/account-shell';
import {
  selectAccountBooks,
  selectAccountClinicBookings,
  selectAccountConsultations,
  selectAccountCourses,
  selectAccountPayments,
  selectAccountTrips,
} from '@/features/account/services/account-selectors.service';
import { useLanguage } from '../../../../LanguageContext';

type DetailTab = 'profile' | 'courses' | 'books' | 'care' | 'payments';

export function AdminUserDetailPage() {
  const params = useParams<{ userId: string }>();
  const { localize, language } = useLanguage();
  const isAr = language === 'ar';
  const [tab, setTab] = useState<DetailTab>('profile');
  const account = useMemo(() => getAdminUser(params.userId), [params.userId]);

  if (!account) {
    return (
      <>
        <AdminPageHeader title={isAr ? 'المستخدم غير موجود' : 'User not found'} />
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">{isAr ? 'تعذر العثور على هذا الحساب.' : 'This account could not be found.'}</p>
          <Link href="/admin/users" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline">
            {isAr ? 'العودة للقائمة' : 'Back to list'}
          </Link>
        </div>
      </>
    );
  }

  const { user, status, createdAt, updatedAt } = account;
  const courseSummaries = selectAccountCourses(user.id);
  const bookSummaries = selectAccountBooks(user.id);
  const clinicBookings = selectAccountClinicBookings(user.id);
  const consultations = selectAccountConsultations(user.id);
  const trips = selectAccountTrips(user.id);
  const paymentSummaries = selectAccountPayments(user.id);
  const tabs: { id: DetailTab; labelEn: string; labelAr: string }[] = [
    { id: 'profile', labelEn: 'Profile', labelAr: 'الملف' },
    { id: 'courses', labelEn: 'Courses', labelAr: 'الدورات' },
    { id: 'books', labelEn: 'Books', labelAr: 'الكتب' },
    { id: 'care', labelEn: 'Care', labelAr: 'الرعاية' },
    { id: 'payments', labelEn: 'Payments', labelAr: 'المدفوعات' },
  ];

  return (
    <>
      <AdminPageHeader
        title={user.name}
        description={user.email}
        actions={
          <Link href={`/admin/users/${user.id}/edit`} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
            {isAr ? 'تعديل' : 'Edit'}
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${
              tab === item.id ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isAr ? item.labelAr : item.labelEn}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="grid gap-4 md:grid-cols-2">
          <InfoRow label={isAr ? 'الاسم' : 'Name'} value={user.name} />
          <InfoRow label={isAr ? 'البريد' : 'Email'} value={user.email} />
          <InfoRow label={isAr ? 'الهاتف' : 'Phone'} value={user.phone || '—'} />
          <InfoRow label={isAr ? 'الدور' : 'Role'} value={<UserRoleBadge role={user.role} />} />
          <InfoRow label={isAr ? 'الحالة' : 'Status'} value={<AccountStatusBadge status={status} />} />
          <InfoRow label={isAr ? 'تاريخ التسجيل' : 'Registered'} value={new Date(createdAt).toLocaleString(isAr ? 'ar-SA' : 'en-US')} />
          <InfoRow label={isAr ? 'آخر تحديث' : 'Last updated'} value={new Date(updatedAt).toLocaleString(isAr ? 'ar-SA' : 'en-US')} />
          <InfoRow label={isAr ? 'الاشتراك' : 'Subscription'} value={user.isSubscribed ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير مشترك' : 'Not subscribed')} />
        </div>
      )}

      {tab === 'courses' && (
        <ReadOnlyList
          isAr={isAr}
          title={isAr ? 'الدورات والتقدم' : 'Courses & progress'}
          items={courseSummaries.map((item) => `${localize(item.title)} · ${item.completedLessons}/${item.totalLessons}`)}
          empty={isAr ? 'لا توجد دورات مسجلة.' : 'No enrolled courses.'}
        />
      )}

      {tab === 'books' && (
        <ReadOnlyList
          isAr={isAr}
          title={isAr ? 'الكتب' : 'Books'}
          items={bookSummaries.map((item) => `${localize(item.title)} (${item.format})`)}
          empty={isAr ? 'لا توجد كتب مشتراة.' : 'No purchased books.'}
        />
      )}

      {tab === 'care' && (
        <div className="grid gap-4">
          <SectionCard title={isAr ? 'حجوزات العيادات' : 'Clinic bookings'}>
            {clinicBookings.length === 0 ? (
              <p className="text-sm text-slate-500">{isAr ? 'لا توجد حجوزات.' : 'No bookings.'}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {clinicBookings.map((booking) => (
                  <li key={booking.id} className="rounded-md border border-slate-100 p-3">
                    {booking.date} · {booking.time}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
          <SectionCard title={isAr ? 'الاستشارات' : 'Consultations'}>
            {consultations.length === 0 ? (
              <p className="text-sm text-slate-500">{isAr ? 'لا توجد استشارات.' : 'No consultations.'}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {consultations.map((consultation) => (
                  <li key={consultation.id} className="rounded-md border border-slate-100 p-3">
                    {consultation.date} · {consultation.time}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
          <SectionCard title={isAr ? 'الرحلات' : 'Trips'}>
            {trips.length === 0 ? (
              <p className="text-sm text-slate-500">{isAr ? 'لا توجد رحلات.' : 'No trips.'}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {trips.map((trip) => (
                  <li key={trip.id} className="rounded-md border border-slate-100 p-3">
                    {localize(trip.title)}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}

      {tab === 'payments' && (
        <ReadOnlyList
          isAr={isAr}
          title={isAr ? 'المدفوعات' : 'Payments'}
          items={paymentSummaries.map((item) => `${item.itemName} · ${item.amount} ${item.currency} · ${item.statusLabel}`)}
          empty={isAr ? 'لا توجد مدفوعات.' : 'No payments.'}
        />
      )}
    </>
  );
}

function ReadOnlyList({ isAr, title, items, empty }: { isAr: boolean; title: string; items: string[]; empty: string }) {
  return (
    <SectionCard title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((id) => (
            <li key={id} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 font-mono text-slate-700">
              {id}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold text-slate-950">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
