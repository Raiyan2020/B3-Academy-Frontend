'use client';

import { SitePage } from '../../client-page';
import { PaymentResultPage } from '@/features/payments/components/payment-result-page';

export default function Page() {
  return (
    <SitePage>
      <PaymentResultPage status="success" />
    </SitePage>
  );
}
