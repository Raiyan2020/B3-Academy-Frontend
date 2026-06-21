'use client';

import { SitePage } from '../../../../../client-page';
import { CheckoutPage } from '@/features/checkout/components/checkout-page';
import { RequireAuth } from '@/features/auth/components/require-auth';

export default function Page() {
  return (
    <SitePage>
      <RequireAuth>
        <CheckoutPage />
      </RequireAuth>
    </SitePage>
  );
}
