'use client';

import { SitePage } from '../../../../../client-page';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { SubscriptionCheckoutPage } from '@/features/subscriptions/ui/SubscriptionCheckoutPage';
import { CourseCheckoutPage } from '@/features/courses/ui/CourseCheckoutPage';
import { BookCheckoutPage } from '@/features/books/ui/BookCheckoutPage';
import { TripCheckoutPage } from '@/features/trips/ui/TripCheckoutPage';
import { ApiPackageCheckout } from '@/features/consultations/components/api-package-checkout';
import type { BookPurchaseFormat } from '@/features/books/types/book-purchase.types';
import { notFound, redirect, useParams, useSearchParams } from 'next/navigation';

export default function Page() {
  const params = useParams<{ type: string; id: string; format?: string[] }>();
  const searchParams = useSearchParams();
  const type = params?.type;
  const id = params?.id;
  const format = (params?.format?.[0] || 'ebook') as BookPurchaseFormat;

  // Care bookings are paid for inside their own booking flows, which own the
  // slot hold. There is no standalone checkout route for them.
  if (type === 'clinic-appointment') {
    redirect(`/clinic/${id}/book`);
  }

  if (type === 'consultation-session') {
    redirect(`/consultations/${id}/book`);
  }

  if (type === 'consultation-package' && !searchParams.get('doctorId')) {
    // The package endpoints are all keyed on doctorId; without it there is
    // nothing to render.
    notFound();
  }

  const checkout =
    type === 'subscription' ? <SubscriptionCheckoutPage planId={id} />
    : type === 'course' ? <CourseCheckoutPage courseId={id} />
    : type === 'book' ? <BookCheckoutPage bookId={id} format={format} />
    : type === 'trip-package' ? <TripCheckoutPage tripId={id} />
    : type === 'consultation-package' ? <ApiPackageCheckout />
    : null;

  if (checkout === null) {
    notFound();
  }

  return (
    <SitePage>
      <RequireAuth>{checkout}</RequireAuth>
    </SitePage>
  );
}
