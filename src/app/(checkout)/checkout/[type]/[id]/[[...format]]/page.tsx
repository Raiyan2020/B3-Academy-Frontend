'use client';

import { SitePage } from '../../../../../client-page';
import { CheckoutPage } from '@/features/checkout/components/checkout-page';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { SubscriptionCheckoutPage } from '@/features/subscriptions/ui/SubscriptionCheckoutPage';
import { CourseCheckoutPage } from '@/features/courses/ui/CourseCheckoutPage';
import { BookCheckoutPage } from '@/features/books/ui/BookCheckoutPage';
import { TripCheckoutPage } from '@/features/trips/ui/TripCheckoutPage';
import type { BookPurchaseFormat } from '@/features/books/types/book-purchase.types';
import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams<{ type: string; id: string; format?: string[] }>();
  const isSubscriptionCheckout = params?.type === 'subscription';
  const isCourseCheckout = params?.type === 'course';
  const isBookCheckout = params?.type === 'book';
  const isTripCheckout = params?.type === 'trip-package';
  const format = (params?.format?.[0] || 'ebook') as BookPurchaseFormat;

  return (
    <SitePage>
      <RequireAuth>
        {isSubscriptionCheckout ? (
          <SubscriptionCheckoutPage planId={params.id} />
        ) : isCourseCheckout ? (
          <CourseCheckoutPage courseId={params.id} />
        ) : isBookCheckout ? (
          <BookCheckoutPage bookId={params.id} format={format} />
        ) : isTripCheckout ? (
          <TripCheckoutPage tripId={params.id} />
        ) : (
          <CheckoutPage />
        )}
      </RequireAuth>
    </SitePage>
  );
}
