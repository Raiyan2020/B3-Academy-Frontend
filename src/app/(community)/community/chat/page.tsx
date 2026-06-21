'use client';

import { SitePage } from '../../../client-page';
import { CommunityChat } from '@/features/community/components/community-chat';
import { RequireAuth } from '@/features/auth/components/require-auth';

export default function Page() {
  return (
    <SitePage>
      <RequireAuth>
        <CommunityChat />
      </RequireAuth>
    </SitePage>
  );
}
