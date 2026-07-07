'use client';

import { ShieldAlert } from 'lucide-react';
import { RatingStars } from './RatingStars';

export function ReviewForm({
  isAr,
  signedInLabel,
  isSignedIn,
  stars,
  review,
  isSubmitting,
  validationMessage,
  onStarsChange,
  onReviewChange,
  onSubmit,
}: {
  isAr: boolean;
  signedInLabel?: string;
  isSignedIn: boolean;
  stars: number;
  review: string;
  isSubmitting: boolean;
  validationMessage?: string;
  onStarsChange: (value: number) => void;
  onReviewChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h2 className="text-xl font-bold text-slate-950">{isAr ? 'أرسل تقييمك' : 'Submit your review'}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {isAr ? 'يتم إرسال التقييم للمراجعة قبل ظهوره في الموقع.' : 'Reviews are submitted for approval before they appear publicly.'}
      </p>

      {isSignedIn ? (
        <div className="mt-5 rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {signedInLabel}
        </div>
      ) : (
        <div className="mt-5 flex gap-3 rounded-md border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {isAr ? 'يجب تسجيل الدخول لتقديم تقييم.' : 'Please sign in to submit a review.'}
        </div>
      )}

      <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'التقييم' : 'Rating'}</label>
      <div className="mt-2">
        <RatingStars value={stars} onChange={onStarsChange} disabled={!isSignedIn || isSubmitting} />
      </div>

      <label className="mt-6 block text-sm font-semibold text-slate-800">{isAr ? 'رأيك في المنصة' : 'Your review'}</label>
      <textarea
        rows={6}
        value={review}
        disabled={!isSignedIn || isSubmitting}
        onChange={(event) => onReviewChange(event.target.value)}
        className="mt-2 w-full resize-none rounded-md border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
        placeholder={isAr ? 'اكتب تجربتك مع المنصة...' : 'Write your experience with the platform...'}
      />

      {validationMessage && (
        <p className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {validationMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={!isSignedIn || isSubmitting}
        className="mt-6 w-full rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-600"
      >
        {isSubmitting ? (isAr ? 'جار الإرسال...' : 'Submitting...') : isAr ? 'إرسال التقييم' : 'Submit review'}
      </button>
    </form>
  );
}

