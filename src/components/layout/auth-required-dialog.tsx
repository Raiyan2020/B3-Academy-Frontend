'use client';

import { useAuth } from '@/features/auth/auth-provider';
import { AuthPage } from '@/features/auth/components/auth-page';

export function AuthRequiredDialog() {
  const { isAuthModalOpen, setAuthModalOpen } = useAuth();

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <AuthPage isDialog={true} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
