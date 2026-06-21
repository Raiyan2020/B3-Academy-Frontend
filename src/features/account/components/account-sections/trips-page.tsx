'use client';

import { useAuth } from '@/features/auth/auth-provider';
import { getStoredTripPurchases } from '@/features/care/services/care-records-storage.service';
import { AccountShell, EmptyAccountState } from '../account-shell';

export function PurchasedTripsPage() {
  const { user } = useAuth();
  const storedTrips = user ? getStoredTripPurchases(user.id) : [];
  const mockTrips = user?.trips || [];
  const trips = [
    ...storedTrips.map((trip) => ({
      id: trip.id,
      title: trip.title,
      date: new Date(trip.purchasedAt).toLocaleDateString('ar-EG'),
      status: trip.status,
      note: trip.coordinationNote.ar,
    })),
    ...mockTrips.map((trip) => ({
      ...trip,
      status: trip.isCompleted ? 'completed' : 'purchased',
      note: 'تنفيذ الرحلة يتم بالتنسيق مع الإدارة.',
    })),
  ];

  return (
    <AccountShell title="باقات الرحلات المشتراة" description="عمليات شراء باقات الرحلات. تنفيذ الرحلة يتم بالتنسيق مع الإدارة خارج المنصة.">
      {trips.length === 0 ? (
        <EmptyAccountState title="لا توجد باقات رحلات مشتراة" description="بعد شراء باقة رحلة ستظهر هنا مع الفاتورة." />
      ) : (
        <div className="grid gap-4">
          {trips.map((trip) => (
            <article key={trip.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-950">{trip.title.ar}</h2>
              <p className="mt-2 text-sm text-slate-600">تاريخ الشراء/التنفيذ المبدئي: {trip.date}</p>
              <p className="mt-2 text-sm font-semibold">الحالة: {trip.status === 'completed' ? 'مكتملة' : 'تم الشراء'}</p>
              <p className="mt-2 text-sm text-slate-600">{trip.note}</p>
            </article>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
