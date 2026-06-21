'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { getFavorites, removeFavorite } from '../../services/account-records.service';
import { AccountShell, EmptyAccountState } from '../account-shell';
import { getCourseById } from '@/features/courses/services/courses.service';
import { getBookById } from '@/features/books/services/books.service';
import { getClinicById, TRIP_PACKAGES } from '@/features/care/services/care-data.service';
import { MOCK_MONOGRAPHS } from '@/features/library/components/monograph-list';

function isFavoriteAvailable(kind: string, itemId: string): boolean {
  if (kind === 'course') {
    return !!getCourseById(itemId);
  }
  if (kind === 'book') {
    return !!getBookById(itemId);
  }
  if (kind === 'clinic') {
    const clinic = getClinicById(itemId);
    return !!clinic && clinic.isActive;
  }
  if (kind === 'trip') {
    const trip = TRIP_PACKAGES.find(t => t.id === itemId);
    return !!trip && trip.isActive;
  }
  if (kind === 'encyclopedia') {
    return MOCK_MONOGRAPHS.some((m) => m.id === itemId);
  }
  return false;
}

export function FavoritesPage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const favorites = user ? getFavorites(user.id) : [];

  return (
    <AccountShell title="المفضلة" description="العناصر المحفوظة من الأقسام التي تدعم المفضلة، مع توضيح العناصر غير المتاحة أو التي تحتاج اشتراكاً.">
      {favorites.length === 0 ? (
        <EmptyAccountState title="لا توجد عناصر مفضلة" description="ستظهر هنا العناصر التي تضيفها للمفضلة." />
      ) : (
        <div className="grid gap-4">
          {favorites.map((favorite) => {
            const isAvailable = isFavoriteAvailable(favorite.kind, favorite.itemId);
            return (
              <article key={favorite.id} className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="font-bold text-slate-950">{favorite.title}</h2>
                <p className="mt-2 text-sm text-slate-600">النوع: {favorite.kind}</p>
                {!isAvailable && <p className="mt-2 text-sm font-semibold text-red-600">غير متاح</p>}
                {favorite.requiresSubscription && <p className="mt-2 text-sm font-semibold text-amber-700">يتطلب اشتراكاً فعّالاً</p>}
                <div className="mt-4 flex gap-3">
                  {isAvailable ? (
                    <Link href={favorite.href} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">فتح العنصر</Link>
                  ) : (
                    <span className="rounded-md bg-slate-350 px-4 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed">غير متاح</span>
                  )}
                  <button onClick={() => { removeFavorite(favorite.id); setVersion(version + 1); }} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">إزالة</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AccountShell>
  );
}

