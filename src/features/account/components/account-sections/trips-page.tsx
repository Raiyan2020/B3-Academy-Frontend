'use client';

import { useAuth } from '@/features/auth/auth-provider';
import { useCurrency } from '../../../../../CurrencyContext';
import { selectAccountTrips } from '../../services/account-selectors.service';
import { AccountShell, EmptyAccountState } from '../account-shell';

export function PurchasedTripsPage() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const trips = user ? selectAccountTrips(user.id) : [];

  return (
    <AccountShell title="باقات الرحلات المشتراة" description="عمليات شراء باقات الرحلات. تنفيذ الرحلة يتم بالتنسيق مع الإدارة خارج المنصة.">
      {trips.length === 0 ? (
        <EmptyAccountState title="لا توجد باقات رحلات مشتراة" description="بعد شراء باقة رحلة ستظهر هنا مع الفاتورة." />
      ) : (
        <div className="grid gap-4">
          {trips.map((trip) => (
            <article key={trip.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="grid gap-4 md:grid-cols-[200px_1fr]">
                {trip.image && (
                  <img src={trip.image} alt={trip.title.ar} className="h-40 w-full object-cover md:h-full" />
                )}
                <div className="p-5">
                  <h2 className="font-bold text-slate-950">{trip.title.ar}</h2>
                  <p className="mt-1 text-sm text-slate-600">المكان: {trip.place.ar}</p>
                  {trip.durationDays && (
                    <p className="mt-1 text-sm text-slate-600">المدة: {trip.durationDays} أيام</p>
                  )}
                  {trip.features && trip.features.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {trip.features.map((feature) => (
                        <li key={feature.ar} className="text-xs text-slate-600">• {feature.ar}</li>
                      ))}
                    </ul>
                  )}
                  {trip.price != null && (
                    <p className="mt-2 text-sm font-bold text-emerald-700">
                      السعر: {trip.currency ? `${trip.price} ${trip.currency}` : formatPrice(trip.price)}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-slate-600">تاريخ الشراء: {trip.purchasedAt}</p>
                  <p className="mt-2 text-sm font-semibold">الحالة: {trip.statusLabel}</p>
                  <p className="mt-2 text-sm text-slate-600">{trip.coordinationNote}</p>
                  {!trip.isAvailable && (
                    <p className="mt-2 text-sm text-amber-700">الباقة لم تعد معروضة حالياً، لكن سجل الشراء محفوظ.</p>
                  )}
                  {trip.invoiceHref && (
                    <a
                      href={trip.invoiceHref}
                      download
                      className="mt-4 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
                    >
                      تحميل الفاتورة
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
