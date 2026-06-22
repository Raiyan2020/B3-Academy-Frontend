'use client';

import { LanguageProvider } from '../../LanguageContext';
import { CurrencyProvider } from '../../CurrencyContext';
import { BlogProvider } from '../../BlogContext';
import { ResearchProvider } from '../../ResearchContext';
import { TheoryProvider } from '../../TheoryContext';
import { CourseCommentProvider } from '../../CourseCommentContext';
import { AIChatWidget } from '@/features/ai-assistant/components/ai-chat-widget';
import { AuthProvider } from '@/features/auth/auth-provider';
import { PodcastPlayerProvider } from '@/features/podcasts/components/podcast-player-provider';
import { AuthRequiredDialog } from '@/components/layout/auth-required-dialog';
import { AppQueryProvider } from '@/lib/query/provider';
import { AppToaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <AppQueryProvider>
          <AuthProvider>
            <BlogProvider>
              <ResearchProvider>
                <TheoryProvider>
                  <CourseCommentProvider>
                    <PodcastPlayerProvider>
                      {children}
                      <AuthRequiredDialog />
                      <AIChatWidget />
                      <AppToaster />
                    </PodcastPlayerProvider>
                  </CourseCommentProvider>
                </TheoryProvider>
              </ResearchProvider>
            </BlogProvider>
          </AuthProvider>
        </AppQueryProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}
