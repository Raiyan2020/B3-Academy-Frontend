import { MessageSquare } from 'lucide-react';
import type { PlatformReview } from '../types';
import { RatingStars } from './RatingStars';

export function ReviewList({
  reviews,
  isLoading,
  isAr,
}: {
  reviews: PlatformReview[];
  isLoading: boolean;
  isAr: boolean;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-emerald-700" />
        <h2 className="text-xl font-bold text-slate-950">{isAr ? 'تقييمات المنصة' : 'Platform reviews'}</h2>
      </div>
      {isLoading ? (
        <p className="text-sm text-slate-500">{isAr ? 'جار تحميل التقييمات...' : 'Loading reviews...'}</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-slate-500">{isAr ? 'لا توجد تقييمات معتمدة حتى الآن.' : 'No approved reviews yet.'}</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((item) => (
            <article key={item.id} className="rounded-md border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.userName}</p>
                  {item.createdAt && <p className="mt-1 text-xs text-slate-500">{item.createdAt}</p>}
                </div>
                <RatingStars value={item.stars} disabled size={16} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{item.review}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

