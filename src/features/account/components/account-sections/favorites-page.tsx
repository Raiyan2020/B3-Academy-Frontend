'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { selectAccountFavorites } from '../../services/account-selectors.service';
import { removeFavorite } from '../../services/account-records.service';
import { AccountShell, EmptyAccountState } from '../account-shell';
import { getCourseById } from '@/features/courses/services/courses.service';
import { getBookById } from '@/features/books/services/books.service';
import { getClinicById, getTripPackageById } from '@/features/care/services/care-data.service';
import { getMonographById } from '@/features/library/services/monograph.service';
import { isSubscriptionActive } from '@/features/subscriptions/services/subscription-access.service';

function isFavoriteCatalogAvailable(kind: string, itemId: string): boolean {
  if (kind === 'course') return !!getCourseById(itemId);
  if (kind === 'book') return !!getBookById(itemId);
  if (kind === 'clinic') {
    const clinic = getClinicById(itemId);
    return !!clinic && clinic.isActive;
  }
  if (kind === 'trip') {
    const trip = getTripPackageById(itemId);
    return !!trip && trip.isActive;
  }
  if (kind === 'encyclopedia') return !!getMonographById(itemId);
  return false;
}

export function FavoritesPage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const subscriptionActive = isSubscriptionActive(user);
  const favorites = user
    ? selectAccountFavorites(user.id, isFavoriteCatalogAvailable, subscriptionActive)
    : [];

  return (
    <AccountShell title="المفضلة" description="العناصر المحفوظة من الأقسام التي تدعم المفضلة، مع توضيح العناصر غير المتاحة أو التي تحتاج اشتراكاً.">
      {favorites.length === 0 ? (
        <EmptyAccountState title="لا توجد عناصر مفضلة" description="ستظهر هنا العناصر التي تضيفها للمفضلة." />
      ) : (
        <div className="grid gap-4">
          {favorites.map((favorite) => (
            <article key={`${favorite.id}-${version}`} className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-950">{favorite.title}</h2>
              <p className="mt-2 text-sm text-slate-600">النوع: {favorite.kind}</p>
              {favorite.catalogUnavailable && (
                <p className="mt-2 text-sm font-semibold text-red-600">غير متاح</p>
              )}
              {favorite.subscriptionExpired && (
                <p className="mt-2 text-sm font-semibold text-amber-700">
                  يتطلب اشتراكاً فعّالاً —{' '}
                  <Link href="/subscriptions" className="underline">
                    جدّد الاشتراك للفتح
                  </Link>
                </p>
              )}
              {favorite.requiresSubscription && subscriptionActive && !favorite.catalogUnavailable && (
                <p className="mt-2 text-sm text-emerald-700">محتوى مشترك — الاشتراك فعّال</p>
              )}
              <div className="mt-4 flex gap-3">
                {favorite.isAvailable ? (
                  <Link href={favorite.href} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
                    فتح العنصر
                  </Link>
                ) : favorite.subscriptionExpired ? (
                  <Link href="/subscriptions" className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white">
                    تجديد الاشتراك
                  </Link>
                ) : (
                  <span className="rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 cursor-not-allowed">
                    غير متاح
                  </span>
                )}
                <button
                  onClick={() => {
                    removeFavorite(favorite.id);
                    setVersion(version + 1);
                  }}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  إزالة
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
