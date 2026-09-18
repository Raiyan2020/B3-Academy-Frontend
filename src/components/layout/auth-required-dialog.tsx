'use client';

import { useAuth } from '@/features/auth/auth-provider';
import { AuthPage } from '@/features/auth/components/auth-page';
import { clearPendingIntent } from '@/features/access/services/pending-intent.service';

export function AuthRequiredDialog() {
  const { isAuthModalOpen, setAuthModalOpen } = useAuth();

  if (!isAuthModalOpen) return null;

  // Backing out of the sign-in prompt abandons the action that triggered it. The intent used to
  // be left behind for its full 30-minute lifetime, so an unrelated login later in the session
  // silently redirected the user into the flow they had already declined.
  const dismiss = () => {
    clearPendingIntent();
    setAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <AuthPage isDialog={true} onClose={dismiss} />
    </div>
  );
}
