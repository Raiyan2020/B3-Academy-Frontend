'use client';

import Link from 'next/link';
import { FileHeart, SkipForward } from 'lucide-react';
import { useLanguage } from '../../../../LanguageContext';
import { markHealthAssessmentPromptSkipped } from '../services/health-assessment-prompt.service';

export function HealthAssessmentOptionalPrompt({
  userId,
  returnHref,
  onSkip,
}: {
  userId: string;
  returnHref: string;
  onSkip: () => void;
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const handleSkip = () => {
    markHealthAssessmentPromptSkipped(userId);
    onSkip();
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <FileHeart size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            {isAr ? 'تقييم صحي اختياري قبل الاستشارة الأولية' : 'Optional health assessment before your first consultation'}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {isAr
              ? 'يمكنك إكمال نموذج التقييم الصحي الدستوري قبل حجز أول استشارة أولية، أو تخطيه والمتابعة مباشرة.'
              : 'You may complete the constitutional health assessment before booking your first initial consultation, or skip and continue.'}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/health-assessment?return=${encodeURIComponent(returnHref)}`}
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
        >
          {isAr ? 'إجراء التقييم الصحي' : 'Take health assessment'}
        </Link>
        <button
          type="button"
          onClick={handleSkip}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          <SkipForward size={16} />
          {isAr ? 'تخطي والمتابعة' : 'Skip and continue'}
        </button>
      </div>
    </div>
  );
}
