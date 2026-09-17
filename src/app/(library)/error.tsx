'use client';

import { useEffect } from 'react';
import { RetryPanel } from '@/components/feedback/feedback';
import { useLanguage } from '@/LanguageContext';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { language } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center p-6">
      <RetryPanel
        title={language === 'ar' ? 'حدث خطأ ما' : 'Something went wrong'}
        description={
          language === 'ar'
            ? 'حدث خطأ غير متوقع أثناء تحميل هذه الصفحة. حاول مرة أخرى.'
            : 'An unexpected error occurred while loading this page. Please try again.'
        }
        onRetry={reset}
      />
    </main>
  );
}
