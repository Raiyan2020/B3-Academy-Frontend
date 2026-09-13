'use client';

import Link from 'next/link';
import { AccountShell, EmptyAccountState } from '../account-shell';
import { LoadingState, RetryPanel } from '@/components/feedback/feedback';
import { useDeleteFavorite, useFavorites } from '@/features/favorites/hooks/use-favorites';
import { getFavoriteHref } from '@/features/favorites/services/favorite-routes';
import type { FavoritableType } from '@/features/favorites/types/api.types';

export function FavoritesPage() {
  const favoritesQuery = useFavorites();
  const deleteFavorite = useDeleteFavorite();

  const favorites = favoritesQuery.data?.items ?? [];

  return (
    <AccountShell title="المفضلة" description="العناصر المحفوظة من الأقسام التي تدعم المفضلة، مع توضيح العناصر غير المتاحة أو التي تحتاج اشتراكاً.">
      {favoritesQuery.isPending ? (
        <LoadingState title="جارٍ تحميل المفضلة…" />
      ) : favoritesQuery.isError ? (
        <RetryPanel
          title="تعذّر تحميل المفضلة"
          description="حدث خطأ أثناء جلب العناصر المفضلة. حاول مرة أخرى."
          onRetry={() => void favoritesQuery.refetch()}
        />
      ) : favorites.length === 0 ? (
        <EmptyAccountState title="لا توجد عناصر مفضلة" description="ستظهر هنا العناصر التي تضيفها للمفضلة." />
      ) : (
        <div className="grid gap-4">
          {favorites.map((favorite) => {
            const { item } = favorite;
            const type = favorite.type?.value as FavoritableType | undefined;
            const href = getFavoriteHref(type, item.id);
            // The backend resolves availability and subscription gating for us
            // (FavoriteService::resolveAccessState), so the frontend no longer
            // recomputes it from local catalog data.
            const catalogUnavailable = item.unavailableReason === 'disabled_or_deleted';
            const subscriptionExpired = item.unavailableReason === 'subscription_required';
            const removing = deleteFavorite.isPending && deleteFavorite.variables === favorite.id;

            return (
              <article key={favorite.id} className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="font-bold text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm text-slate-600">النوع: {favorite.type?.label ?? type}</p>
                {catalogUnavailable && (
                  <p className="mt-2 text-sm font-semibold text-red-600">غير متاح</p>
                )}
                {subscriptionExpired && (
                  <p className="mt-2 text-sm font-semibold text-amber-700">
                    يتطلب اشتراكاً فعّالاً —{' '}
                    <Link href="/subscriptions" className="underline">
                      جدّد الاشتراك للفتح
                    </Link>
                  </p>
                )}
                {item.requiresSubscription && item.canOpen && (
                  <p className="mt-2 text-sm text-emerald-700">محتوى مشترك — الاشتراك فعّال</p>
                )}
                <div className="mt-4 flex gap-3">
                  {item.canOpen && href ? (
                    <Link href={href} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
                      فتح العنصر
                    </Link>
                  ) : subscriptionExpired ? (
                    <Link href="/subscriptions" className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white">
                      تجديد الاشتراك
                    </Link>
                  ) : (
                    <span className="rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 cursor-not-allowed">
                      غير متاح
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={removing}
                    onClick={() => deleteFavorite.mutate(favorite.id)}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {removing ? 'جارٍ الإزالة…' : 'إزالة'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AccountShell>
  );
}
