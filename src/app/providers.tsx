'use client';

import dynamic from 'next/dynamic';
import { LanguageProvider } from '@/LanguageContext';
import { CurrencyProvider } from '@/CurrencyContext';
import { AuthProvider } from '@/features/auth/auth-provider';
import { PodcastPlayerProvider } from '@/features/podcasts/components/podcast-player-provider';
import { AuthRequiredDialog } from '@/components/layout/auth-required-dialog';
import { AppQueryProvider } from '@/lib/query/provider';
import { AppToaster } from '@/components/ui/sonner';

// The assistant is a floating, supplementary widget — nothing above the fold depends
// on it — but it was statically mounted here under the single root layout, so its
// chunk (54.3 KB, measured: it pulls in `motion/react`) shipped to all 94 routes and
// sat on the critical path. Deferring it moves that off initial load.
// `ssr: false` because the widget is client-only anyway (it reads localStorage config).
// (vercel-react-best-practices: bundle-dynamic-imports)
const AIChatWidget = dynamic(
  () =>
    import('@/features/ai-assistant/components/ai-chat-widget').then((mod) => ({
      default: mod.AIChatWidget,
    })),
  { ssr: false },
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <AppQueryProvider>
          <AuthProvider>
            <PodcastPlayerProvider>
              {children}
              <AuthRequiredDialog />
              <AIChatWidget />
              <AppToaster />
            </PodcastPlayerProvider>
          </AuthProvider>
        </AppQueryProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}
