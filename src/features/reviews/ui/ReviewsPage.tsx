'use client';

import { useState } from 'react';
import { useLanguage } from '../../../../LanguageContext';
import { useAuth } from '@/features/auth/auth-provider';
import { usePlatformReviews, useSubmitPlatformReview } from '../hooks/use-platform-reviews';
import { ReviewForm } from './ReviewForm';
import { ReviewList } from './ReviewList';

export function ReviewsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === 'ar';
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const reviewsQuery = usePlatformReviews();
  const submitReview = useSubmitPlatformReview();

  const handleSubmit = () => {
    setValidationMessage('');
    if (!user) return;
    if (stars < 1) {
      setValidationMessage(isAr ? 'يرجى اختيار تقييم من 1 إلى 5.' : 'Please select a rating from 1 to 5.');
      return;
    }
    if (review.trim().length < 10) {
      setValidationMessage(isAr ? 'يجب ألا يقل نص التقييم عن 10 أحرف.' : 'Review text must be at least 10 characters.');
      return;
    }
    submitReview.mutate(
      { stars, review: review.trim() },
      {
        onSuccess: () => {
          setStars(0);
          setReview('');
        },
      },
    );
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-emerald-700">{isAr ? 'تقييمات المنصة' : 'Platform ratings'}</p>
          <h1 className="max-w-3xl text-4xl font-bold text-slate-950">
            {isAr ? 'آراء العملاء المعتمدة عن B3 Academy' : 'Approved customer feedback for B3 Academy'}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {isAr
              ? 'يمكن للزوار قراءة التقييمات المعتمدة، ويمكن للعملاء المسجلين إرسال تقييم جديد للمراجعة.'
              : 'Visitors can read approved reviews, and signed-in customers can submit a new review for moderation.'}
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <ReviewForm
          isAr={isAr}
          signedInLabel={user ? `${isAr ? 'مسجل باسم' : 'Signed in as'} ${user.name || user.email}` : undefined}
          isSignedIn={Boolean(user)}
          stars={stars}
          review={review}
          isSubmitting={submitReview.isPending}
          validationMessage={validationMessage}
          onStarsChange={setStars}
          onReviewChange={setReview}
          onSubmit={handleSubmit}
        />
        <ReviewList reviews={reviewsQuery.data || []} isLoading={reviewsQuery.isLoading} isAr={isAr} />
      </section>
    </main>
  );
}

