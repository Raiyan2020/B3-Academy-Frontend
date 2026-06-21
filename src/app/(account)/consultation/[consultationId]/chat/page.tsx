'use client';

import { ChatConsultation } from '@/features/consultations/components/chat-consultation';
import { RequireAuth } from '@/features/auth/components/require-auth';

export default function Page() {
  return (
    <RequireAuth>
      <ChatConsultation />
    </RequireAuth>
  );
}
